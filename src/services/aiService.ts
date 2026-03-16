import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { supabase } from "../lib/supabase";

export type AIProvider = string;

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
}

export class AIService {
  private static async getActiveKeys(): Promise<any[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*');

    if (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }

    // Filter out known invalid providers like 'grod'
    const filteredData = (data || []).filter(k => {
      const provider = k.provider?.trim().toLowerCase();
      if (provider === 'grod') {
        console.warn(`[AIService] Filtrando provedor inválido: ${k.provider}`);
        return false;
      }
      return true;
    });

    // Prioritize 'ok' status (green). 
    // Among 'ok' keys, sort by last_used DESCENDING to "stick" to the one currently being used.
    // For other statuses, sort by last_used ASCENDING to eventually retry older ones.
    return filteredData.sort((a, b) => {
      const statusOrder = { 'ok': 0, 'rate_limited': 1, 'no_credit': 2, 'disconnected': 3 };
      const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
      const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
      
      if (orderA !== orderB) return orderA - orderB;
      
      const lastUsedA = a.last_used ? new Date(a.last_used).getTime() : 0;
      const lastUsedB = b.last_used ? new Date(b.last_used).getTime() : 0;
      
      // If both are 'ok', newest first (stick to active)
      if (a.status === 'ok') {
        return lastUsedB - lastUsedA;
      }
      
      // Otherwise oldest first (retry queue)
      return lastUsedA - lastUsedB;
    });
  }

  private static async updateKeyStatus(id: string, status: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited', errorCount: number = 0) {
    if (id === 'env-key') return;
    try {
      await supabase
        .from('api_keys')
        .update({ 
          status, 
          error_count: errorCount,
          last_used: new Date().toISOString()
        })
        .eq('id', id);
    } catch (e) {
      console.error('Error updating key status:', e);
    }
  }

  static async generateContent(prompt: string, systemInstruction: string, image?: string): Promise<AIResponse> {
    const keys = await this.getActiveKeys();
    console.log('[AIService] Keys fetched:', keys.length);
    
    const availableKeys = keys.filter(k => k.status === 'ok');
    console.log('[AIService] Available keys:', availableKeys.length);
    
    if (availableKeys.length === 0) {
      console.warn('[AIService] Nenhuma API "OK" encontrada. Forçando teste de todas as conexões...');
      await this.testConnections();
      const reloadedKeys = await this.getActiveKeys();
      const stillAvailable = reloadedKeys.filter(k => k.status === 'ok');
      
      if (stillAvailable.length === 0) {
        // Fallback to env key if exists
        if (process.env.GEMINI_API_KEY) {
          return await AIClientManager.execute({
            id: 'env-key',
            provider: 'gemini',
            key: process.env.GEMINI_API_KEY,
            service: 'gemini-3-flash-preview'
          }, prompt, systemInstruction, image);
        }
        throw new Error('Nenhuma API disponível e funcional no momento.');
      }
      return await this.generateContent(prompt, systemInstruction, image);
    }

    // Tenta a primeira chave "OK"
    const apiKey = availableKeys[0];
    console.log(`[AIService] Usando API Ativa: ${apiKey.provider} (${apiKey.id})`);
    
    try {
      const result = await AIClientManager.execute(apiKey, prompt, systemInstruction, image);
      // Atualiza last_used sem mudar o status 'ok'
      await this.updateKeyStatus(apiKey.id, 'ok', 0);
      return result;

    } catch (error: any) {
      const errMsg = error.message?.toLowerCase() || '';
      console.error(`[AIService] Falha na API ${apiKey.provider} (${apiKey.id}). Erro completo:`, error);
      
      let newStatus: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited' = 'disconnected';
      
      // Se for erro de rede/DNS (Failed to fetch), marca como disconnected imediatamente
      if (errMsg.includes('failed to fetch') || errMsg.includes('err_name_not_resolved')) {
        newStatus = 'disconnected';
      } else if (errMsg.includes('429') || errMsg.includes('too many requests')) {
        newStatus = 'rate_limited';
      } else if (errMsg.includes('credit') || errMsg.includes('quota') || errMsg.includes('limit')) {
        newStatus = 'no_credit';
      }

      await this.updateKeyStatus(apiKey.id, newStatus, (apiKey.error_count || 0) + 1);
      
      // Tenta novamente (vai pegar a próxima 'ok' disponível)
      return await this.generateContent(prompt, systemInstruction, image);
    }
  }

  static async testConnections(): Promise<void> {
    console.log('[AIService] Iniciando teste de conexões das APIs...');
    let { data: allKeys } = await supabase.from('api_keys').select('*');
    
    if (!allKeys || allKeys.length === 0) {
      if (process.env.GEMINI_API_KEY) {
        allKeys = [{
          id: 'env-key',
          provider: 'gemini',
          key: process.env.GEMINI_API_KEY,
          service: 'gemini-3-flash-preview',
          status: 'ok'
        }];
      } else {
        return;
      }
    }

    const testPromises = allKeys.filter(k => k.provider !== 'grod').map(async (apiKey) => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 15000); // 15s timeout for testing
        });

        const apiCallPromise = async () => {
          console.log(`[AIService] Testando API via backend: ${apiKey.provider} (${apiKey.id})`);
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
        console.log(`[AIService] API ${apiKey.provider} (${apiKey.id}) está OK.`);
      } catch (error: any) {
        const errMsg = error.message?.toLowerCase() || '';
        let newStatus: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited' = 'disconnected';
        
        if (errMsg.includes('429') || errMsg.includes('too many requests')) {
          newStatus = 'rate_limited';
        } else if (errMsg.includes('credit') || errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('balance')) {
          newStatus = 'no_credit';
        }
        
        await this.updateKeyStatus(apiKey.id, newStatus, (apiKey.error_count || 0) + 1);
        console.warn(`[AIService] API ${apiKey.provider} (${apiKey.id}) falhou. Status: ${newStatus} - Erro: ${errMsg}`);
      }
    });

    await Promise.allSettled(testPromises);
    console.log('[AIService] Teste de conexões concluído.');
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
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
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
