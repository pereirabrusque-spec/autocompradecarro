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

    // Ordena: 'ok' primeiro, depois tenta as outras
    return (data || []).sort((a, b) => {
      if (a.status === 'ok' && b.status !== 'ok') return -1;
      if (a.status !== 'ok' && b.status === 'ok') return 1;
      
      const lastUsedA = a.last_used ? new Date(a.last_used).getTime() : 0;
      const lastUsedB = b.last_used ? new Date(b.last_used).getTime() : 0;
      return lastUsedA - lastUsedB;
    });
  }

  private static async updateKeyStatus(id: string, status: 'ok' | 'no_credit' | 'disconnected', errorCount: number = 0) {
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
    
    if (keys.length === 0) {
      // If no 'ok' keys, try any key
      const { data: allKeys } = await supabase.from('api_keys').select('*');
      if (!allKeys || allKeys.length === 0) {
        throw new Error('Nenhuma chave de API configurada.');
      }
      keys.push(...allKeys);
    }

    // Try each key until one works
    for (const apiKey of keys) {
      try {
        const modelName = apiKey.service || (apiKey.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 30000); // 30s timeout
        });

        const apiCallPromise = async () => {
          if (apiKey.provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: apiKey.key });
            
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

        const result = await Promise.race([apiCallPromise(), timeoutPromise]);
        
        await this.updateKeyStatus(apiKey.id, 'ok', 0);
        return result as AIResponse;

      } catch (error: any) {
        console.error(`Error with ${apiKey.provider} key ${apiKey.id}:`, error);
        
        let newStatus: 'ok' | 'no_credit' | 'disconnected' = 'disconnected';
        const errMsg = error.message?.toLowerCase() || '';
        
        if (errMsg.includes('credit') || errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('429')) {
          newStatus = 'no_credit';
        } else if (errMsg === 'timeout') {
          console.warn(`API ${apiKey.provider} timed out after 10s. Switching to next...`);
          // We can keep it disconnected or just count as error
          newStatus = 'disconnected';
        }
        
        await this.updateKeyStatus(apiKey.id, newStatus, (apiKey.error_count || 0) + 1);
        continue;
      }
    }

    throw new Error('Todas as chaves de API falharam ou estão sem crédito.');
  }
}
