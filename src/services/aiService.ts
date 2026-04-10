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
  private static lastHealthCheck: number = typeof window !== 'undefined' ? parseInt(localStorage.getItem('ai_last_health_check') || '0') : 0;
  private static cachedKeys: any[] = [];
  private static lastFetchTime: number = 0;
  private static lastTestTime: number = 0;
  private static isTesting: boolean = false;

  public static async getActiveKeys(forceRefresh: boolean = false): Promise<any[]> {
    const now = Date.now();
    
    // Check if we need a scheduled health check (every 6 hours)
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    if (now - this.lastHealthCheck > SIX_HOURS && !this.isTesting) {
      console.log('[AIService] Iniciando health check agendado (6h)...');
      this.testConnections().catch(console.error);
      this.lastHealthCheck = now;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_last_health_check', now.toString());
      }
    }

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
      if (provider === 'grod') return false;
      return true;
    });

    // Prioritize 'ok' status (green). 
    // Among 'ok' keys, we want to stick to the last successful one.
    const sorted = filteredData.sort((a, b) => {
      const statusOrder = { 'ok': 0, 'rate_limited': 1, 'no_credit': 2, 'disconnected': 3 };
      const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
      const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
      
      if (orderA !== orderB) return orderA - orderB;
      
      // If both have the same status, prioritize the last successful one
      if (a.id === this.lastSuccessfulKeyId) return -1;
      if (b.id === this.lastSuccessfulKeyId) return 1;
      
      // Otherwise newest first
      const lastUsedA = a.last_used ? new Date(a.last_used).getTime() : 0;
      const lastUsedB = b.last_used ? new Date(b.last_used).getTime() : 0;
      return lastUsedB - lastUsedA;
    });

    this.cachedKeys = sorted;
    this.lastFetchTime = now;
    return sorted;
  }

  private static async updateKeyStatus(id: string, status: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited', errorCount: number = 0) {
    if (id === 'env-key') return;
    
    const now = new Date().toISOString();
    
    if (status === 'ok') {
      if (this.lastSuccessfulKeyId !== id) {
        console.log(`[AIService] Nova API principal selecionada: ${id}`);
      }
      this.lastSuccessfulKeyId = id;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_last_successful_key_id', id);
      }
    } else if (id === this.lastSuccessfulKeyId) {
      console.warn(`[AIService] API principal (${id}) falhou com status: ${status}. Trocando para a próxima disponível...`);
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
          last_used: now
        })
        .eq('id', id);
      
      // Update cache
      this.cachedKeys = this.cachedKeys.map(k => k.id === id ? { ...k, status, error_count: errorCount, last_used: now } : k);
    } catch (e) {
      console.error('Error updating key status:', e);
    }
  }

  static async generateContent(prompt: string, systemInstruction: string, image?: string): Promise<AIResponse> {
    let keys = await this.getActiveKeys();
    
    // Filtra apenas chaves que estão marcadas como 'ok' (Verde)
    // Isso evita tentar chaves que já sabemos que estão sem crédito ou limitadas
    const candidateKeys = keys.filter(k => k.status === 'ok');
    
    let attempts = 0;
    const maxAttempts = Math.min(candidateKeys.length, 3); // Tenta no máximo 3 chaves diferentes por requisição

    while (attempts < maxAttempts) {
      const apiKey = candidateKeys[attempts];
      if (!apiKey) break;
      
      // Se a chave não estiver 'ok', só tentamos se for a única opção ou se as 'ok' falharam
      if (apiKey.status !== 'ok' && attempts === 0 && candidateKeys.some(k => k.status === 'ok')) {
        // Pula para a primeira 'ok'
        attempts++;
        continue;
      }

      try {
        const result = await AIClientManager.execute(apiKey, prompt, systemInstruction, image);
        
        // Se funcionou e não estava 'ok', atualiza para 'ok'
        if (apiKey.status !== 'ok' || apiKey.id !== this.lastSuccessfulKeyId) {
          await this.updateKeyStatus(apiKey.id, 'ok', 0);
        }
        return result;
      } catch (error: any) {
        const errMsg = error.message?.toLowerCase() || '';
        console.error(`[AIService] Falha na API ${apiKey.provider} (${apiKey.id}). Motivo: ${errMsg}.`);
        
        let newStatus: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited' = 'disconnected';
        
        if (errMsg.includes('failed to fetch') || errMsg.includes('err_name_not_resolved')) {
          newStatus = 'disconnected';
        } else if (errMsg.includes('429') || errMsg.includes('too many requests') || errMsg.includes('quota_exceeded')) {
          newStatus = 'rate_limited';
        } else if (errMsg.includes('credit') || errMsg.includes('balance') || errMsg.includes('insufficient') || errMsg.includes('billing') || errMsg.includes('quota')) {
          newStatus = 'no_credit';
        } else if (errMsg.includes('key') || errMsg.includes('invalid') || errMsg.includes('unauthorized') || errMsg.includes('permission') || errMsg.includes('denied access') || errMsg.includes('suspended')) {
          newStatus = 'disconnected';
        }

        await this.updateKeyStatus(apiKey.id, newStatus, (apiKey.error_count || 0) + 1);
        attempts++;
        
        // Se a falha foi por quota ou crédito, vamos forçar uma atualização da lista para a próxima tentativa
        if (newStatus === 'no_credit' || newStatus === 'rate_limited') {
          keys = await this.getActiveKeys(true);
        }
      }
    }

    // Fallback final para chave de ambiente se tudo falhar
    if (process.env.GEMINI_API_KEY) {
      console.log('[AIService] Usando chave de ambiente como fallback final.');
      return await AIClientManager.execute({
        id: 'env-key',
        provider: 'gemini',
        key: process.env.GEMINI_API_KEY,
        service: 'gemini-3-flash-preview'
      }, prompt, systemInstruction, image);
    }

    throw new Error('Todas as APIs disponíveis falharam ou estão fora de serviço.');
  }

  // O teste de conexões agora é apenas manual via painel administrativo
  static async testConnections(): Promise<void> {
    if (this.isTesting) return;
    this.isTesting = true;
    
    console.log('[AIService] Iniciando teste manual de conexões das APIs...');
    let { data: allKeys } = await supabase.from('api_keys').select('*');
    
    if (!allKeys || allKeys.length === 0) {
      this.isTesting = false;
      return;
    }

    // Executa sequencialmente para evitar limites de taxa simultâneos e garantir estabilidade
    for (const apiKey of allKeys) {
      if (apiKey.provider === 'grod') continue;
      
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
        
        // Detecção mais robusta baseada nas mensagens de erro do servidor
        if (errMsg.includes('quota_exceeded') || errMsg.includes('rate_limit') || errMsg.includes('429') || errMsg.includes('too many requests')) {
          newStatus = 'no_credit'; // Marcamos como Amarelo (sem crédito/quota)
        } else if (errMsg.includes('access_denied') || errMsg.includes('invalid') || errMsg.includes('key') || errMsg.includes('unauthorized') || errMsg.includes('permission') || errMsg.includes('suspended')) {
          newStatus = 'disconnected'; // Marcamos como Vermelho (corrompida/sem acesso)
        } else if (errMsg.includes('timeout') || errMsg.includes('fetch') || errMsg.includes('network')) {
          // Se for erro de rede/timeout, mantemos o status anterior ou marcamos como instável
          // Para simplificar, vamos manter como desconectada se falhar o teste
          newStatus = 'disconnected';
        }
        
        await this.updateKeyStatus(apiKey.id, newStatus, (apiKey.error_count || 0) + 1);
      }
    }

    this.isTesting = false;
    console.log('[AIService] Teste manual concluído.');
  }
}

class AIClientManager {
  private static clients: Map<string, any> = new Map();

  static async execute(apiKey: any, prompt: string, systemInstruction: string, image?: string): Promise<AIResponse> {
    let modelName = apiKey.service || (apiKey.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
    if (modelName === 'gemini-3-flash-preview' || modelName === 'gemini-pro' || modelName === 'gemini-1.5-pro') {
      // Use gemini-1.5-flash as default for better reliability unless specifically overridden
      if (!apiKey.service) modelName = 'gemini-1.5-flash';
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
        const p = apiKey.provider?.toLowerCase();
        
        if (p === 'openai') {
          baseUrl = 'https://api.openai.com/v1';
        } else if (p === 'grok' || p === 'xai') {
          baseUrl = 'https://api.x.ai/v1';
        } else {
          baseUrl = `https://api.${p}.com/v1`;
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
