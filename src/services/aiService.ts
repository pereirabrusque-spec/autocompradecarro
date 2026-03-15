import { GoogleGenAI } from "@google/genai";
import { supabase } from "../lib/supabase";

export type AIProvider = string;

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
}

export class AIService {
  private static async getActiveKeys(): Promise<any[]> {
    // Tenta buscar todas as chaves, independentemente do status
    const { data, error } = await supabase
      .from('api_keys')
      .select('*');

    if (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }

    // Ordena: 'ok' primeiro, depois 'rate_limited', depois outros
    return (data || []).sort((a, b) => {
      const statusOrder = { 'ok': 0, 'rate_limited': 1, 'no_credit': 2, 'disconnected': 3 };
      const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
      const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
      
      if (orderA !== orderB) return orderA - orderB;
      
      const lastUsedA = a.last_used ? new Date(a.last_used).getTime() : 0;
      const lastUsedB = b.last_used ? new Date(b.last_used).getTime() : 0;
      return lastUsedA - lastUsedB;
    });
  }

  private static async updateKeyStatus(id: string, status: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited', errorCount: number = 0) {
    if (id === 'env-key') return;
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ 
          status, 
          error_count: errorCount,
          last_used: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error && error.message.includes('status')) {
        // Fallback: don't update status if column missing
        await supabase
          .from('api_keys')
          .update({ 
            last_used: new Date().toISOString()
          })
          .eq('id', id);
      }
    } catch (e) {
      console.error('Error updating key status:', e);
    }
  }

  static async generateContent(prompt: string, systemInstruction: string, image?: string): Promise<AIResponse> {
    const keys = await this.getActiveKeys();
    
    if (process.env.GEMINI_API_KEY) {
      keys.push({
        id: 'env-key',
        provider: 'gemini',
        key: process.env.GEMINI_API_KEY,
        service: 'gemini-3-flash-preview',
        status: 'ok'
      });
    }

    // Filtra chaves que não estão desconectadas
    const availableKeys = keys.filter(k => k.status !== 'disconnected');
    
    if (availableKeys.length === 0) {
      // Se todas desconectadas, tenta re-testar todas
      await this.testConnections();
      return await this.generateContent(prompt, systemInstruction, image);
    }

    // Tenta a primeira chave disponível
    const apiKey = availableKeys[0];
    
    try {
      const result = await AIClientManager.execute(apiKey, prompt, systemInstruction, image);
      
      await this.updateKeyStatus(apiKey.id, 'ok', 0);
      return result;

    } catch (error: any) {
      console.error(`Error with ${apiKey.provider} key ${apiKey.id}:`, error);
      
      await this.updateKeyStatus(apiKey.id, 'disconnected', (apiKey.error_count || 0) + 1);
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

    for (const apiKey of allKeys) {
      try {
        let modelName = apiKey.service || (apiKey.provider === 'gemini' ? 'gemini-3-flash-preview' : 'gpt-4o-mini');
        if (modelName === 'gemini-1.5-flash' || modelName === 'gemini-pro' || modelName === 'gemini-1.5-pro') {
          modelName = 'gemini-3-flash-preview';
        }
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 15000); // 15s timeout for testing
        });

        const apiCallPromise = async () => {
          if (apiKey.provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: apiKey.key });
            const response = await ai.models.generateContent({
              model: modelName,
              contents: [{ role: 'user', parts: [{ text: 'Ping' }] }]
            });
            if (!response.text) throw new Error('Empty response');
            return true;
          } else {
            const baseUrl = apiKey.provider === 'openai' ? 'https://api.openai.com/v1' :
                            apiKey.provider === 'grok' ? 'https://api.x.ai/v1' :
                            `https://api.${apiKey.provider}.com/v1`;
            console.log(`[AIService] Testando API: ${apiKey.provider} (${apiKey.id}), URL: ${baseUrl}/chat/completions, Modelo: ${modelName}`);
            const response = await fetch(`${baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.key}`
              },
              body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: 'Ping' }],
                max_tokens: 5
              })
            });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error(`[AIService] Erro na API ${apiKey.provider} (${apiKey.id}):`, response.status, errorData);
              throw new Error(`API Error: ${response.status}`);
            }
            return true;
          }
        };

        await Promise.race([apiCallPromise(), timeoutPromise]);
        await this.updateKeyStatus(apiKey.id, 'ok', 0);
        console.log(`[AIService] API ${apiKey.provider} (${apiKey.id}) está OK.`);
      } catch (error: any) {
        const errMsg = error.message?.toLowerCase() || '';
        let newStatus: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited' = 'disconnected';
        
        if (errMsg.includes('429') || errMsg.includes('too many requests')) {
          newStatus = 'rate_limited';
        } else if (errMsg.includes('credit') || errMsg.includes('quota') || errMsg.includes('limit')) {
          newStatus = 'no_credit';
        }
        
        await this.updateKeyStatus(apiKey.id, newStatus, (apiKey.error_count || 0) + 1);
        console.warn(`[AIService] API ${apiKey.provider} (${apiKey.id}) falhou. Status: ${newStatus}`);
      }
    }
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
          config: { systemInstruction }
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
        const baseUrl = apiKey.provider === 'openai' ? 'https://api.openai.com/v1' :
                        apiKey.provider === 'grok' ? 'https://api.x.ai/v1' :
                        `https://api.${apiKey.provider}.com/v1`;

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
