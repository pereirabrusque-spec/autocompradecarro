import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { supabase } from "../lib/supabase";

export type AIProvider = string;

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
}

export class AIService {
  private static lastSuccessfulKeyId: string | null = typeof window !== 'undefined' ? localStorage.getItem('ai_last_successful_key_id') : null;
  private static cachedKeys: any[] = [];
  private static lastFetchTime: number = 0;
  private static isTesting: boolean = false;

  private static async getActiveKeys(forceRefresh: boolean = false): Promise<any[]> {
    const now = Date.now();
    // Cache keys for 30 seconds unless forced
    if (!forceRefresh && this.cachedKeys.length > 0 && (now - this.lastFetchTime < 30000)) {
      return this.cachedKeys;
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('*');

    if (error) {
      console.error('Error fetching API keys:', error);
      return this.cachedKeys;
    }

    // Filter out known invalid providers like 'grod'
    const filteredData = (data || []).filter(k => {
      const provider = k.provider?.trim().toLowerCase();
      if (provider === 'grod') {
        return false;
      }
      return true;
    });

    // Prioritize 'ok' status (green). 
    // Among 'ok' keys, we want to stick to the last successful one.
    const sorted = filteredData.sort((a, b) => {
      const statusOrder = { 'ok': 0, 'rate_limited': 1, 'no_credit': 2, 'disconnected': 3 };
      const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
      const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
      
      if (orderA !== orderB) return orderA - orderB;
      
      // If both are 'ok', prioritize the last successful one
      if (a.status === 'ok') {
        if (a.id === this.lastSuccessfulKeyId) return -1;
        if (b.id === this.lastSuccessfulKeyId) return 1;
        
        // Otherwise newest first
        const lastUsedA = a.last_used ? new Date(a.last_used).getTime() : 0;
        const lastUsedB = b.last_used ? new Date(b.last_used).getTime() : 0;
        return lastUsedB - lastUsedA;
      }
      
      // Otherwise oldest first (retry queue)
      const lastUsedA = a.last_used ? new Date(a.last_used).getTime() : 0;
      const lastUsedB = b.last_used ? new Date(b.last_used).getTime() : 0;
      return lastUsedA - lastUsedB;
    });

    this.cachedKeys = sorted;
    this.lastFetchTime = now;
    return sorted;
  }

  private static async updateKeyStatus(id: string, status: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited', errorCount: number = 0) {
    if (id === 'env-key') return;
    
    if (status === 'ok') {
      if (this.lastSuccessfulKeyId !== id) {
        console.log(`[AIService] Nova API principal selecionada: ${id}`);
      }
      this.lastSuccessfulKeyId = id;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_last_successful_key_id', id);
      }
    } else if (id === this.lastSuccessfulKeyId) {
      console.warn(`[AIService] API principal (${id}) falhou. Trocando para a próxima disponível...`);
      this.lastSuccessfulKeyId = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ai_last_successful_key_id');
      }
    }
    
    try {
      await supabase
        .from('api_keys')
        .update({ 
          status, 
          error_count: errorCount,
          last_used: new Date().toISOString()
        })
        .eq('id', id);
      
      // Update cache
      this.cachedKeys = this.cachedKeys.map(k => k.id === id ? { ...k, status, error_count: errorCount, last_used: new Date().toISOString() } : k);
    } catch (e) {
      console.error('Error updating key status:', e);
    }
  }

  static async generateContent(prompt: string, systemInstruction: string, image?: string): Promise<AIResponse> {
    let keys = await this.getActiveKeys();
    let attempts = 0;
    const maxAttempts = Math.max(keys.length * 2, 5);

    while (attempts < maxAttempts) {
      const availableKeys = keys.filter(k => k.status === 'ok');
      
      if (availableKeys.length === 0) {
        console.warn('[AIService] Nenhuma API "OK" encontrada. Forçando teste de todas as conexões...');
        await this.testConnections();
        keys = await this.getActiveKeys(true);
        if (keys.filter(k => k.status === 'ok').length === 0) {
          // Fallback to env key if exists
          if (process.env.GEMINI_API_KEY) {
            console.log('[AIService] Usando chave de ambiente como fallback final.');
            return await AIClientManager.execute({
              id: 'env-key',
              provider: 'gemini',
              key: process.env.GEMINI_API_KEY,
              service: 'gemini-3-flash-preview'
            }, prompt, systemInstruction, image);
          }
          throw new Error('Nenhuma API disponível e funcional no momento.');
        }
        continue;
      }

      // Se temos uma chave que funcionou por último e ela está OK, ela será a primeira da lista devido ao sort
      const apiKey = availableKeys[0];
      
      try {
        const result = await AIClientManager.execute(apiKey, prompt, systemInstruction, image);
        // Se funcionou, garante que o status está OK e mantém como a última de sucesso
        if (apiKey.status !== 'ok') {
          await this.updateKeyStatus(apiKey.id, 'ok', 0);
        }
        return result;
      } catch (error: any) {
        const errMsg = error.message?.toLowerCase() || '';
        console.error(`[AIService] Falha na API ${apiKey.provider} (${apiKey.id}). Motivo: ${errMsg}. Trocando...`);
        
        let newStatus: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited' = 'disconnected';
        
        if (errMsg.includes('failed to fetch') || errMsg.includes('err_name_not_resolved')) {
          newStatus = 'disconnected';
        } else if (errMsg.includes('429') || errMsg.includes('too many requests') || errMsg.includes('quota')) {
          newStatus = 'rate_limited';
        } else if (errMsg.includes('credit') || errMsg.includes('balance') || errMsg.includes('limit')) {
          newStatus = 'no_credit';
        }

        await this.updateKeyStatus(apiKey.id, newStatus, (apiKey.error_count || 0) + 1);
        
        // Força refresh das chaves para pegar a próxima melhor
        keys = await this.getActiveKeys(true);
        attempts++;
      }
    }
    throw new Error('Excedido número máximo de tentativas de API.');
  }

  static async testConnections(): Promise<void> {
    if (this.isTesting) return;
    this.isTesting = true;
    
    console.log('[AIService] Iniciando teste de conexões das APIs para manter todas prontas...');
    let { data: allKeys } = await supabase.from('api_keys').select('*');
    
    if (!allKeys || allKeys.length === 0) {
      this.isTesting = false;
      return;
    }

    const testPromises = allKeys.filter(k => k.provider !== 'grod').map(async (apiKey) => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 15000);
        });

        const apiCallPromise = async () => {
          const response = await fetch('/api/test-api-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: apiKey.provider, key: apiKey.key })
          });
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || `API Error: ${response.status}`);
          }
          return true;
        };

        await Promise.race([apiCallPromise(), timeoutPromise]);
        await this.updateKeyStatus(apiKey.id, 'ok', 0);
      } catch (error: any) {
        const errMsg = error.message?.toLowerCase() || '';
        let newStatus: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited' = 'disconnected';
        
        if (errMsg.includes('429') || errMsg.includes('too many requests')) {
          newStatus = 'rate_limited';
        } else if (errMsg.includes('credit') || errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('balance')) {
          newStatus = 'no_credit';
        }
        
        await this.updateKeyStatus(apiKey.id, newStatus, (apiKey.error_count || 0) + 1);
      }
    });

    await Promise.allSettled(testPromises);
    this.isTesting = false;
    console.log('[AIService] Teste de conexões concluído. APIs verdes estão prontas.');
  }

  // Inicia um loop de teste periódico para manter as APIs prontas
  static startPeriodicTesting(intervalMs: number = 300000) { // 5 minutos por padrão
    this.testConnections();
    const interval = setInterval(() => {
      this.testConnections();
    }, intervalMs);
    return () => clearInterval(interval);
  }
}

class AIClientManager {
  private static clients: Map<string, any> = new Map();

  static async execute(apiKey: any, prompt: string, systemInstruction: string, image?: string): Promise<AIResponse> {
    let modelName = apiKey.service || (apiKey.provider === 'gemini' ? 'gemini-3-flash-preview' : 'gpt-4o-mini');
    if (modelName === 'gemini-1.5-flash' || modelName === 'gemini-pro' || modelName === 'gemini-1.5-pro') {
      modelName = 'gemini-3-flash-preview';
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 30000); // 30s timeout
    });

    const apiCallPromise = async () => {
      if (apiKey.provider === 'gemini') {
        if (!this.clients.has(apiKey.id)) {
          this.clients.set(apiKey.id, new GoogleGenAI({ apiKey: apiKey.key }));
        }
        const ai = this.clients.get(apiKey.id);
        
        const parts: any[] = [];
        if (prompt) parts.push({ text: prompt });
        if (image) {
          parts.push({
            inlineData: {
              data: image.split(',')[1],
              mimeType: 'image/jpeg'
            }
          });
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts }],
          config: { 
            systemInstruction
          }
        });
        
        if (response.text) {
          return {
            text: response.text,
            provider: 'gemini',
            model: modelName
          };
        }
        throw new Error('Empty response from Gemini');
      } else {
        // OpenAI-compatible providers (OpenAI, Grok, etc.)
        let baseUrl = '';
        if (apiKey.provider === 'openai') {
          baseUrl = 'https://api.openai.com/v1';
        } else if (apiKey.provider === 'grok') {
          baseUrl = 'https://api.x.ai/v1';
        } else if (apiKey.provider === 'grod') {
          // Fix: Assuming grod is a typo for grok or a custom provider that needs a valid URL
          // If it's a custom provider, the user should have provided a base URL.
          // For now, let's assume it's a typo for grok or just block it if it's invalid.
          throw new Error('Provedor "grod" inválido. Verifique o cadastro da API.');
        } else {
          baseUrl = `https://api.${apiKey.provider}.com/v1`;
        }

        const content: any[] = [
          { type: 'text', text: prompt || 'Analise esta imagem.' }
        ];
        if (image) {
          content.push({ type: 'image_url', image_url: { url: image } });
        }

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.key}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content }
            ],
            temperature: 0.4
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `${apiKey.provider} API Error`);
        }

        const data = await response.json();
        return {
          text: data.choices[0].message.content,
          provider: apiKey.provider,
          model: modelName
        };
      }
    };

    return await Promise.race([apiCallPromise(), timeoutPromise]);
  }
}
