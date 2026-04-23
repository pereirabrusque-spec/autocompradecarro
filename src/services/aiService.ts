import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { supabase } from "../lib/supabase";
import { logToStorage } from "../lib/logger";

export type AIProvider = string;

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
}

export class AIService {
  public static lastSuccessfulKeyId: string | null = typeof window !== 'undefined' ? localStorage.getItem('ai_last_successful_key_id') : null;
  private static failedKeysInSession = new Set<string>();

  static {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => {
        this.lastSuccessfulKeyId = localStorage.getItem('ai_last_successful_key_id');
      });
    }
  }
  private static lastHealthCheck: number = typeof window !== 'undefined' ? parseInt(localStorage.getItem('ai_last_health_check') || '0') : 0;
  private static cachedKeys: any[] = [];
  private static lastFetchTime: number = 0;
  private static lastTestTime: number = 0;
  private static isTesting: boolean = false;

  public static async getActiveKeys(forceRefresh: boolean = false): Promise<any[]> {
    const now = Date.now();
    
    // Cache keys for 5 seconds unless forced
    if (!forceRefresh && this.cachedKeys.length > 0 && (now - this.lastFetchTime < 5000)) {
      return this.cachedKeys;
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('*');

    if (error) {
      console.error('Error fetching API keys:', error);
      return this.cachedKeys;
    }

    // Filter out known invalid providers and keys that failed recently in this session
    const filteredData = (data || []).filter(k => {
      const provider = k.provider?.trim().toLowerCase();
      if (provider === 'grod') return false;
      if (this.failedKeysInSession.has(k.id)) return false; // Pula chaves que já sabemos que falharam nesta sessão
      return true;
    });

    // If all keys are bad, we don't force a test here anymore to save credits.
    // The background interval in ApiManagement.tsx will handle re-testing failed keys.
    const hasAnyOk = filteredData.some(k => k.status === 'ok');
    if (!hasAnyOk && filteredData.length > 0) {
      console.warn('[AIService] 🚨 Nenhuma chave OK encontrada no momento.');
    }

    // Prioritize 'ok' status (green). 
    const sorted = (filteredData || []).sort((a, b) => {
      const statusOrder = { 'ok': 0, 'rate_limited': 1, 'no_credit': 2, 'disconnected': 3 };
      const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
      const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
      
      if (orderA !== orderB) return orderA - orderB;
      
      // If both have the same status, prioritize the last successful one
      if (a.status === 'ok' && b.status === 'ok') {
        if (a.id === this.lastSuccessfulKeyId) return -1;
        if (b.id === this.lastSuccessfulKeyId) return 1;
      }
      
      return 0;
    });

    // Validação da chave "Em Uso": Só limpamos se a chave realmente foi excluída.
    // Se ela estiver sem crédito ou desconectada, mantemos o ID para o selo "Em Uso" visual,
    // mas a lógica de generateContent lidará com o pulo se o status não for 'ok'.
    if (this.lastSuccessfulKeyId && this.lastSuccessfulKeyId !== 'env-key') {
      const currentKeyExists = filteredData.some(k => k.id === this.lastSuccessfulKeyId);
      if (!currentKeyExists) {
        console.warn(`[AIService] ⚠️ Chave "Em Uso" (${this.lastSuccessfulKeyId}) foi removida. Tentando selecionar uma nova...`);
        
        // Tenta pegar a primeira chave 'ok' disponível
        const firstOkKey = filteredData.find(k => k.status === 'ok');
        if (firstOkKey) {
          console.log(`[AIService] 🎯 Selecionando automaticamente nova chave "Em Uso": ${firstOkKey.id}`);
          this.lastSuccessfulKeyId = firstOkKey.id;
          if (typeof window !== 'undefined') {
            localStorage.setItem('ai_last_successful_key_id', firstOkKey.id);
            window.dispatchEvent(new Event('storage'));
          }
        } else {
          this.lastSuccessfulKeyId = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('ai_last_successful_key_id');
            window.dispatchEvent(new Event('storage'));
          }
        }
      }
    } else if (!this.lastSuccessfulKeyId) {
      // Se não tem nenhuma chave em uso, mas temos chaves OK, seleciona a primeira
      const firstOkKey = filteredData.find(k => k.status === 'ok');
      if (firstOkKey) {
        console.log(`[AIService] 🎯 Nenhuma chave em uso detectada. Selecionando primeira disponível: ${firstOkKey.id}`);
        this.lastSuccessfulKeyId = firstOkKey.id;
        if (typeof window !== 'undefined') {
          localStorage.setItem('ai_last_successful_key_id', firstOkKey.id);
          window.dispatchEvent(new Event('storage'));
        }
      }
    }

    console.log('[AIService] Chaves ordenadas por status:', sorted.map(k => `${k.id}(${k.status})`).join(', '));
    this.cachedKeys = sorted;
    this.lastFetchTime = now;
    return sorted;
  }

  public static async updateKeyStatus(id: string, status: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited', errorCount: number = 0, lastError?: string) {
    if (id === 'env-key') return;
    
    const now = new Date().toISOString();
    
    if (status === 'ok') {
      // REGRA: Se não houver chave em uso, OU a chave em uso atual NÃO estiver OK, 
      // e esta chave está OK, ela assume a liderança.
      const currentId = typeof window !== 'undefined' ? localStorage.getItem('ai_last_successful_key_id') : this.lastSuccessfulKeyId;
      
      let currentKeyIsOk = false;
      if (currentId) {
        // Busca o status da chave atual em uso no cache (parcialmente confiável)
        const currentKey = this.cachedKeys.find(k => k.id === currentId);
        currentKeyIsOk = currentKey?.status === 'ok';
      }
      
      const shouldUpdate = !currentId || !currentKeyIsOk;
      
      if (shouldUpdate || currentId === id) {
        if (this.lastSuccessfulKeyId !== id) {
          console.log(`[AIService] 🎯 Nova API principal selecionada e persistida: ${id} (Status: OK, Anterior: ${currentId || 'Nenhuma'})`);
          logToStorage(`Nova API principal selecionada: ${id}`, 'info');
          this.lastSuccessfulKeyId = id;
          if (typeof window !== 'undefined') {
            localStorage.setItem('ai_last_successful_key_id', id);
            window.dispatchEvent(new Event('storage'));
          }
        }
      }
    } else if (status === 'disconnected' && (id === this.lastSuccessfulKeyId || (typeof window !== 'undefined' && id === localStorage.getItem('ai_last_successful_key_id')))) {
      // Só remove o selo "Em Uso" se a chave estiver realmente desconectada (Vermelho)
      // Se for apenas quota (Amarelo), mantemos o selo para indicar que era a preferida, 
      // mas o generateContent irá pular ela automaticamente se o status não for 'ok'.
      console.warn(`[AIService] ⚠️ API principal (${id}) foi desconectada. Removendo selo "Em Uso"...`);
      logToStorage(`API principal (${id}) desconectada`, 'error');
      this.lastSuccessfulKeyId = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ai_last_successful_key_id');
        window.dispatchEvent(new Event('storage'));
      }
    }
    
    try {
      if (status !== 'ok') {
        this.failedKeysInSession.add(id); // Marca localmente como falha
      } else {
        this.failedKeysInSession.delete(id); // Reset se ficou OK
      }

      const now = new Date().toISOString();
      const isDefinitiveError = lastError?.toLowerCase().includes('invalid') || lastError?.toLowerCase().includes('key not found') || lastError?.toLowerCase().includes('access_denied');
      
      let finalStatus = status;
      // Se não for um erro definitivo, damos uma chance (error_count < 3) antes de marcar como desconectada de vez
      if (status === 'disconnected' && !isDefinitiveError && (errorCount || 0) < 3) {
        console.log(`[AIService] 🧪 Erro temporário em ${id}. Dando uma chance extra (tentativa ${errorCount}). Mantendo status anterior se possível.`);
        // Note: We update the error count anyway, but maybe keep it 'no_credit' or 'rate_limited' if it was that
      }

      const updateData: any = { status: finalStatus, error_count: errorCount };
      if (finalStatus === 'ok') {
        updateData.last_used = now;
        updateData.error_count = 0; // Reseta erros se ficou OK
      }
      
      // Tentativa de atualizar o status no banco
      // Executamos em background para não travar a geração
      (async () => {
        try {
          // Nota: Removemos 'last_test_at' pois a coluna não existe no schema atual e causava erros 400
          const { error } = await supabase.from('api_keys').update(updateData).eq('id', id);
          if (error) {
            console.warn('[AIService] Erro ao atualizar status no banco:', error.message);
          }
        } catch (err) {
          console.error('[AIService] Erro crítico ao atualizar status no banco:', err);
        }
      })();
      
      if (lastError) {
        logToStorage(`Chave ${id} falhou: ${lastError}`, 'error');
      }
      
      // Limpa o cache para forçar recarregamento na próxima chamada
      this.cachedKeys = [];
      this.lastFetchTime = 0;
    } catch (e) {
      console.error('Error updating key status:', e);
    }
  }

  static async generateContent(prompt: string, systemInstruction: string, image?: string): Promise<AIResponse> {
    console.log('[AIService] generateContent chamado. Prompt length:', prompt.length, 'System length:', systemInstruction.length);
    let keys = await this.getActiveKeys();
    console.log('[AIService] Chaves ativas encontradas:', keys.length, 'IDs:', keys.map(k => k.id).join(', '));
    
    // Filtra apenas chaves que estão marcadas como 'ok' (Verde)
    // Ou chaves que estão 'no_credit' mas não foram testadas há mais de 15 minutos
    const now = Date.now();
    let candidateKeys = keys.filter(k => {
      console.log(`[AIService] Gerando candidato para chave ${k.id}, status: ${k.status}, failedInSession: ${this.failedKeysInSession.has(k.id)}`);
      
      // Se a chave falhou nesta sessão específica, removemos imediatamente da lista para não tentar de novo
      if (this.failedKeysInSession.has(k.id)) return false;

      // Se a chave está 'ok', permitimos
      if (k.status === 'ok' || k.id === 'env-key') return true;
      
      // Se a chave não está OK mas não está 'disconnected', permite tentar se passou tempo suficiente
      if (k.status !== 'disconnected') {
        const lastUsed = k.last_used ? new Date(k.last_used).getTime() : 0;
        const minutesSinceLastUse = (now - lastUsed) / (1000 * 60);
        
        // Fallback após 5 minutos para chaves com quota/limite (retry automático)
        return minutesSinceLastUse > 5;
      }
      return false;
    });
    
    // Ordenação final para garantir que as 'ok' venham primeiro
    candidateKeys.sort((a, b) => {
      const statusOrder = { 'ok': 0, 'rate_limited': 1, 'no_credit': 2, 'disconnected': 3 };
      const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
      const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
      
      if (orderA !== orderB) return orderA - orderB;
      
      // Se ambos tiverem o mesmo status, prioriza a última chave de sucesso
      if (a.id === this.lastSuccessfulKeyId) return -1;
      if (b.id === this.lastSuccessfulKeyId) return 1;
      
      return 0;
    });
    console.log('[AIService] Chaves candidatas após filtro rigoroso:', candidateKeys.length, candidateKeys.map(k => `${k.id}(${k.status})`).join(', '));
    
    if (candidateKeys.length === 0) {
      console.warn('[AIService] Nenhuma chave de API disponível para processar a requisição.');
      // Tenta forçar um refresh do banco para ver se algo mudou
      keys = await this.getActiveKeys(true);
      
      // RE-CALCULA candidateKeys após o refresh
      const refreshedCandidateKeys = keys.filter(k => {
        if (k.status === 'ok' || k.id === 'env-key') return true;
        if (k.status !== 'disconnected') {
          const lastUsed = k.last_used ? new Date(k.last_used).getTime() : 0;
          const minutesSinceLastUse = (Date.now() - lastUsed) / (1000 * 60);
          return minutesSinceLastUse > 1;
        }
        return false;
      });
      refreshedCandidateKeys.sort((a, b) => {
        const statusOrder = { 'ok': 0, 'rate_limited': 1, 'no_credit': 2, 'disconnected': 3 };
        return (statusOrder[a.status as keyof typeof statusOrder] ?? 4) - (statusOrder[b.status as keyof typeof statusOrder] ?? 4);
      });
      
      if (refreshedCandidateKeys.length === 0) {
        throw new Error('Todas as chaves de IA falharam ou estão offline. Adicione novas chaves no painel.');
      }
      candidateKeys = refreshedCandidateKeys;
    }

    let attempts = 0;
    const maxAttempts = Math.min(candidateKeys.length, 5); // Tenta até 5 chaves se necessário

    while (attempts < maxAttempts) {
      const apiKey = candidateKeys[attempts];
      if (!apiKey) break;
      
      console.log(`[AIService] 🚀 Tentativa ${attempts + 1}/${maxAttempts} usando chave: ${apiKey.id} (${apiKey.provider} - ${apiKey.status}) Serviço: ${apiKey.service}`);

      try {
        const result = await AIClientManager.execute(apiKey, prompt, systemInstruction, image);
        
        // Se funcionou e não estava 'ok', atualiza para 'ok'
        if (apiKey.status !== 'ok') {
          console.log(`[AIService] ✅ Chave ${apiKey.id} voltou a funcionar! Atualizando status para OK.`);
          await this.updateKeyStatus(apiKey.id, 'ok', 0);
        } else {
          // Apenas atualiza o last_used se já estava ok
          this.updateKeyStatus(apiKey.id, 'ok', 0).catch(() => {});
        }
        return result;
      } catch (error: any) {
        const errMsg = error.message?.toLowerCase() || '';
        console.error(`[AIService] ❌ Falha na API ${apiKey.provider} (${apiKey.id}). Motivo: ${errMsg}.`);
        
        let newStatus: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited' = 'disconnected';
        
        if (errMsg.includes('failed to fetch') || errMsg.includes('err_name_not_resolved')) {
          newStatus = 'disconnected';
        } else if (errMsg.includes('429') || errMsg.includes('too many requests') || errMsg.includes('rate_limit')) {
          newStatus = 'rate_limited';
        } else if (errMsg.includes('quota') || errMsg.includes('credit') || errMsg.includes('balance') || errMsg.includes('insufficient') || errMsg.includes('billing')) {
          newStatus = 'no_credit';
        } else if (errMsg.includes('unknown name "system_instruction"') || errMsg.includes('system_instruction')) {
          // Erro comum em modelos v1 que não suportam campo de instrução de sistema no payload
          console.warn(`[AIService] ⚠️ Modelo não suporta system_instruction. Tentando marcar como disconnected para rotacionar.`);
          newStatus = 'disconnected';
        } else if (errMsg.includes('model') || errMsg.includes('not found') || errMsg.includes('exist')) {
          newStatus = 'disconnected';
        } else if (errMsg.includes('key') || errMsg.includes('invalid') || errMsg.includes('unauthorized') || errMsg.includes('permission') || errMsg.includes('denied access') || errMsg.includes('suspended')) {
          newStatus = 'disconnected';
        }

        console.warn(`[AIService] ⚠️ Marcando chave ${apiKey.id} como ${newStatus} e pulando para a próxima...`);
        try {
          await this.updateKeyStatus(apiKey.id, newStatus, (apiKey.error_count || 0) + 1, errMsg);
        } catch (statusError) {
          console.warn('[AIService] Falha ao persistir status da chave, mas continuando loop...', statusError);
        }
        
        // Se a falha foi por quota ou crédito, vamos forçar uma atualização no banco
        // Mas não re-filtramos a lista local para não quebrar o índice do loop
        if (newStatus === 'no_credit' || newStatus === 'rate_limited') {
          console.log('[AIService] Quota excedida detectada. Marcando no banco e seguindo para a próxima chave da lista atual.');
        }
        
        attempts++;
      }
    }

    // Fallback final para chave de ambiente se tudo falhar. 
    // Nota: Em ambiente frontend Vite, process.env pode não estar disponível.
    const envKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY;

    if (envKey) {
      console.log('[AIService] Tentando fallback final com chave de ambiente...');
      try {
        return await AIClientManager.execute({
          id: 'env-key',
          provider: 'gemini',
          key: envKey,
          service: 'gemini-1.5-flash-latest' 
        }, prompt, systemInstruction, image);
      } catch (fallbackError: any) {
        console.error('[AIService] Fallback final também falhou:', fallbackError.message);
      }
    }

    throw new Error('Todas as APIs disponíveis falharam ou estão com quota excedida. Por favor, adicione uma nova chave API no painel administrativo.');
  }

  // O teste de conexões agora é automático e manual
  static async testConnections(fullTest: boolean = false, autoOnlyNonOk: boolean = false): Promise<void> {
    if (this.isTesting) return;
    this.isTesting = true;
    
    console.log(`[AIService] Iniciando teste de conexões das APIs (Full: ${fullTest}, AutoOnlyNonOk: ${autoOnlyNonOk})...`);
    let { data: allKeys } = await supabase.from('api_keys').select('*');
    
    if (!allKeys || allKeys.length === 0) {
      this.isTesting = false;
      return;
    }

    // Executa sequencialmente para evitar limites de taxa simultâneos e garantir estabilidade
    for (const apiKey of allKeys) {
      // REGRA: Se a chave está verde (ok) e não foi solicitado um teste forçado ou manual (fullTest), PULA.
      // No re-teste automático (autoOnlyNonOk), nunca testamos as 'ok' para economizar crédito.
      if (apiKey.status === 'ok' && (autoOnlyNonOk || !fullTest)) {
        continue;
      }

      // Se a chave não está OK, vamos verificar se vale a pena testar agora
      // No re-teste automático (autoOnlyNonOk), testamos com frequência reduzida (15 min)
      if (autoOnlyNonOk && apiKey.status !== 'ok') {
        // Fallback para last_used se last_test_at não existir
        const lastTest = apiKey.last_used;
        const lastTestedTime = lastTest ? new Date(lastTest).getTime() : 0;
        const minutesSinceLastTest = (Date.now() - lastTestedTime) / (1000 * 60);
        
        if (minutesSinceLastTest < 15) {
          console.log(`[AIService] 🟡 Chave ${apiKey.id} (${apiKey.status}) verificada há ${Math.round(minutesSinceLastTest)}min. Pulando re-teste automático.`);
          continue;
        }
      }

      const provider = apiKey.provider?.toLowerCase().trim();
      if (provider === 'groq' && !apiKey.key) continue; 
      
      console.log(`[AIService] 🧪 Testando chave: ${apiKey.id} (${apiKey.provider}) - Status atual: ${apiKey.status}`);

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 25000);
        });

        const apiCallPromise = async () => {
          // No teste automático (fullTest=false), se a chave estava sem crédito (no_credit), 
          // vamos pedir um teste um pouco mais profundo para ver se a quota voltou.
          const needsSlightlyDeeperTest = !fullTest && (apiKey.status === 'no_credit' || apiKey.status === 'rate_limited');
          
          const response = await fetch('/api/test-api-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              provider: apiKey.provider, 
              key: apiKey.key, 
              fullTest: fullTest || needsSlightlyDeeperTest 
            })
          });
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || `API Error: ${response.status}`);
          }
          return true;
        };

        await Promise.race([apiCallPromise(), timeoutPromise]);
        console.log(`[AIService] ✅ Chave ${apiKey.id} validada com sucesso.`);
        await this.updateKeyStatus(apiKey.id, 'ok', 0);
      } catch (error: any) {
        const errMsg = error.message?.toLowerCase() || '';
        console.warn(`[AIService] ❌ Falha no teste da chave ${apiKey.id}: ${errMsg}`);

        let newStatus: 'ok' | 'no_credit' | 'disconnected' | 'rate_limited' = 'disconnected';
        
        // Detecção mais robusta baseada nas mensagens de erro do servidor
        if (errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('429') || errMsg.includes('too many requests') || errMsg.includes('insufficient') || errMsg.includes('credit') || errMsg.includes('balance')) {
          newStatus = 'no_credit'; // Marcamos como Amarelo (sem crédito/quota)
        } else if (errMsg.includes('access_denied') || errMsg.includes('invalid') || errMsg.includes('key') || errMsg.includes('unauthorized') || errMsg.includes('permission') || errMsg.includes('suspended') || errMsg.includes('disabled')) {
          newStatus = 'disconnected'; // Marcamos como Vermelho (corrompida/sem acesso)
        } else {
          newStatus = 'disconnected';
        }
        
        await this.updateKeyStatus(apiKey.id, newStatus, (apiKey.error_count || 0) + 1);
      }
      
      // Pequeno delay entre testes para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isTesting = false;
    this.lastTestTime = Date.now();
    this.lastHealthCheck = Date.now();
    console.log('[AIService] Teste de conexões concluído.');
  }
}

class AIClientManager {
  private static clients: Map<string, any> = new Map();

  static async execute(apiKey: any, prompt: string, systemInstruction: string, image?: string): Promise<AIResponse> {
    // Clean model name: remove provider prefix if present (e.g., "openai - gpt-4o-mini" -> "gpt-4o-mini")
    let rawModel = apiKey.service || (apiKey.provider === 'gemini' ? 'gemini-1.5-flash-latest' : 'gpt-4o-mini');
    let modelName = rawModel;
    
    if (rawModel.includes(' - ')) {
      const parts = rawModel.split(' - ');
      modelName = parts[parts.length - 1].trim();
    } else if (rawModel.includes(':')) {
      const parts = rawModel.split(':');
      modelName = parts[parts.length - 1].trim();
    }

    // Mapeamento de nomes amigáveis para IDs reais
    const lowerModel = modelName.toLowerCase().trim();
    console.log(`[AIService] Modelo original: "${rawModel}" -> Limpo: "${modelName}"`);

    if (apiKey.provider === 'groq') {
      if (lowerModel.includes('llama 3.3') || lowerModel.includes('llama-3.3')) modelName = 'llama-3.3-70b-versatile';
      else if (lowerModel.includes('llama 3.1') || lowerModel.includes('llama-3.1')) modelName = 'llama-3.1-8b-instant';
      else if (lowerModel.includes('llama 3') || lowerModel.includes('llama3')) modelName = 'llama-3.1-8b-instant'; // Update from deprecated llama3-8b-8192
      else if (lowerModel.includes('mixtral')) modelName = 'mixtral-8x7b-32768';
      else if (lowerModel.includes('gemma')) modelName = 'gemma2-9b-it';
    } else if (apiKey.provider === 'openai') {
      if (lowerModel.includes('gpt-4o-mini') || lowerModel.includes('gpt-4o mini')) modelName = 'gpt-4o-mini';
      else if (lowerModel.includes('gpt-4o') || lowerModel.includes('gpt4o')) modelName = 'gpt-4o';
      else if (lowerModel.includes('gpt-4') || lowerModel.includes('gpt4')) modelName = 'gpt-4';
      else if (lowerModel.includes('gpt-3.5') || lowerModel.includes('gpt3.5')) modelName = 'gpt-3.5-turbo';
    } else if (apiKey.provider === 'gemini') {
      if (lowerModel.includes('flash-thinking')) modelName = 'gemini-2.0-flash-thinking-exp';
      else if (lowerModel.includes('2.0-flash')) modelName = 'gemini-2.0-flash-exp';
      else if (lowerModel.includes('flash')) modelName = 'gemini-1.5-flash-latest';
      else if (lowerModel.includes('pro')) modelName = 'gemini-1.5-pro-latest';
      else modelName = 'gemini-1.5-flash-latest';
    }

    console.log(`[AIService] Modelo mapeado final: "${modelName}" para provedor: ${apiKey.provider}`);

    if (modelName === 'gemini-pro' || modelName === 'gemini-1.0-pro' || modelName.includes('gemini-1.0')) {
      // Use gemini-1.5-flash as default for better reliability as v1 often fails with system_instruction
      modelName = 'gemini-1.5-flash';
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 30000); // 30s timeout
    });

    const apiCallPromise = async () => {
      try {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey, prompt, systemInstruction, image })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errMsg = data.error || `${apiKey.provider} Proxy Error`;
          throw new Error(errMsg);
        }

        return data;
      } catch (error: any) {
        console.error('[AIService] Erro na chamada do Proxy:', error.message);
        throw error;
      }
    };

    return await Promise.race([apiCallPromise(), timeoutPromise]);
  }
}
