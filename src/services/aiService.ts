import { GoogleGenAI } from "@google/genai";
import { supabase } from "../lib/supabase";

export type AIProvider = 'gemini' | 'openai' | 'grok';

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
}

export class AIService {
  private static async getActiveKeys(): Promise<any[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('status', 'ok')
      .order('last_used', { ascending: true }); // Use least recently used for load balancing

    if (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }
    return data || [];
  }

  private static async updateKeyStatus(id: string, status: 'ok' | 'no_credit' | 'disconnected', errorCount: number = 0) {
    await supabase
      .from('api_keys')
      .update({ 
        status, 
        error_count: errorCount,
        last_used: new Date().toISOString()
      })
      .eq('id', id);
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for vision tasks

        const modelName = apiKey.service?.split(':')[0] || (apiKey.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');

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

          clearTimeout(timeoutId);
          
          if (response.text) {
            await this.updateKeyStatus(apiKey.id, 'ok', 0);
            return {
              text: response.text,
              provider: 'gemini',
              model: modelName
            };
          }
        } else if (apiKey.provider === 'openai') {
          const content: any[] = [
            { type: 'text', text: prompt || 'Analise esta imagem.' }
          ];
          if (image) {
            content.push({ type: 'image_url', image_url: { url: image } });
          }

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'OpenAI API Error');
          }

          const data = await response.json();
          await this.updateKeyStatus(apiKey.id, 'ok', 0);
          return {
            text: data.choices[0].message.content,
            provider: 'openai',
            model: modelName
          };
        } else if (apiKey.provider === 'grok') {
          const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey.key}`
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
              ],
              temperature: 0.4
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Grok API Error');
          }

          const data = await response.json();
          await this.updateKeyStatus(apiKey.id, 'ok', 0);
          return {
            text: data.choices[0].message.content,
            provider: 'grok',
            model: modelName
          };
        }

      } catch (error: any) {
        console.error(`Error with ${apiKey.provider} key ${apiKey.id}:`, error);
        
        if (error.name === 'AbortError') {
          console.warn('Request timed out');
        }

        let newStatus: 'ok' | 'no_credit' | 'disconnected' = 'disconnected';
        const errMsg = error.message?.toLowerCase() || '';
        if (errMsg.includes('credit') || errMsg.includes('quota') || errMsg.includes('limit')) {
          newStatus = 'no_credit';
        }
        
        await this.updateKeyStatus(apiKey.id, newStatus, (apiKey.error_count || 0) + 1);
        continue;
      }
    }

    throw new Error('Todas as chaves de API falharam ou estão sem crédito.');
  }
}
