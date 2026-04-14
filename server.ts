import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Admin Client (if service role key is available)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
}

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Secure File Upload Endpoint (Bypasses RLS)
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      console.log('[API Upload] Recebendo arquivo:', req.file?.originalname, 'Tamanho:', req.file?.size);
      
      if (!supabaseAdmin) {
        console.error('[API Upload] Erro: supabaseAdmin não inicializado (falta service role key)');
        return res.status(500).json({ error: 'Configuração de servidor incompleta.' });
      }

      const file = req.file;
      const folder = req.body.folder || 'misc';
      
      if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      }

      const fileExt = file.originalname ? file.originalname.split('.').pop() : 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      console.log('[API Upload] Fazendo upload para bucket banners, path:', filePath);
      const { data, error } = await supabaseAdmin.storage
        .from('banners')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) {
        console.error('[API Upload] Erro do Supabase Storage:', JSON.stringify(error, null, 2));
        return res.status(500).json({ 
          error: error.message || 'Erro no upload do storage',
          details: error
        });
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('banners')
        .getPublicUrl(filePath);

      console.log('[API Upload] Sucesso! URL pública:', publicUrl);
      res.json({ success: true, publicUrl, filePath });
    } catch (error: any) {
      console.error('[API Upload] Erro interno:', error);
      res.status(500).json({ error: error.message || 'Erro interno ao fazer upload.' });
    }
  });

  // Secure Lead Submission Endpoint (Bypasses RLS)
  app.post('/api/leads', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ 
          error: 'Configuração de servidor incompleta. A chave SUPABASE_SERVICE_ROLE_KEY não foi configurada no ambiente.' 
        });
      }

      const leadData = req.body;
      
      // Basic validation
      if (!leadData.cliente_nome || !leadData.telefone) {
        return res.status(400).json({ error: 'Dados obrigatórios faltando.' });
      }

      const { data, error } = await supabaseAdmin
        .from('leads_veiculos')
        .insert([leadData])
        .select();

      if (error) throw error;

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Erro ao inserir lead via API:', error);
      res.status(500).json({ error: error.message || 'Erro interno ao salvar lead.' });
    }
  });

  // FIPE Proxy Routes (using public API)
  const fetchWithTimeout = async (url: string, options: any = {}, timeout = 30000, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        console.log(`[FIPE] Tentativa ${i + 1} para: ${url}`);
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        if (i === retries) throw e;
        console.warn(`[FIPE] Tentativa ${i + 1} falhou, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1s antes de tentar de novo
      }
    }
    throw new Error('Falha após várias tentativas');
  };

  app.get('/api/fipe/brands', async (req, res) => {
    try {
      const type = (req.query.type as string) || 'carros';
      console.log(`[FIPE] Buscando marcas para tipo: ${type}`);
      
      let response;
      try {
        response = await fetchWithTimeout(`https://parallelum.com.br/fipe/api/v1/${type}/marcas`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
      } catch (e) {
        console.error(`[FIPE] Timeout ou Erro de conexão ao buscar marcas:`, e);
        return res.status(504).json({ error: 'Tempo de resposta excedido na API FIPE' });
      }
      
      if (!response.ok) {
        console.error(`[FIPE] Erro na API Parallelum (Marcas): ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ error: 'Erro na API FIPE' });
      }

      const data = await response.json();
      console.log(`[FIPE] Marcas encontradas: ${Array.isArray(data) ? data.length : 0}`);
      res.json(data);
    } catch (error) {
      console.error('[FIPE] Erro ao buscar marcas:', error);
      res.status(500).json({ error: 'Erro ao buscar marcas' });
    }
  });

  app.get('/api/fipe/models/:brandId', async (req, res) => {
    try {
      const type = (req.query.type as string) || 'carros';
      console.log(`[FIPE] Buscando modelos para tipo: ${type}, marca: ${req.params.brandId}`);
      
      let response;
      try {
        response = await fetchWithTimeout(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${req.params.brandId}/modelos`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
      } catch (e) {
        console.error(`[FIPE] Timeout ao buscar modelos:`, e);
        return res.status(504).json({ error: 'Tempo de resposta excedido na API FIPE' });
      }
      
      if (!response.ok) {
        console.error(`[FIPE] Erro na API Parallelum (Modelos): ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ error: 'Erro na API FIPE' });
      }

      const data = await response.json();
      console.log(`[FIPE] Modelos encontrados: ${data.modelos?.length || 0}`);
      res.json(data);
    } catch (error) {
      console.error('[FIPE] Erro ao buscar modelos:', error);
      res.status(500).json({ error: 'Erro ao buscar modelos' });
    }
  });

  app.get('/api/fipe/years/:brandId/:modelId', async (req, res) => {
    try {
      const type = (req.query.type as string) || 'carros';
      console.log(`[FIPE] Buscando anos para tipo: ${type}, marca: ${req.params.brandId}, modelo: ${req.params.modelId}`);
      
      let response;
      try {
        response = await fetchWithTimeout(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${req.params.brandId}/modelos/${req.params.modelId}/anos`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
      } catch (e) {
        console.error(`[FIPE] Timeout ao buscar anos:`, e);
        return res.status(504).json({ error: 'Tempo de resposta excedido na API FIPE' });
      }
      
      if (!response.ok) {
        console.error(`[FIPE] Erro na API Parallelum (Anos): ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ error: 'Erro na API FIPE' });
      }

      const data = await response.json();
      console.log(`[FIPE] Anos encontrados: ${Array.isArray(data) ? data.length : 0}`);
      res.json(data);
    } catch (error) {
      console.error('[FIPE] Erro ao buscar anos:', error);
      res.status(500).json({ error: 'Erro ao buscar anos' });
    }
  });

  app.get('/api/fipe/price/:brandId/:modelId/:yearId', async (req, res) => {
    try {
      const type = (req.query.type as string) || 'carros';
      
      let response;
      try {
        response = await fetchWithTimeout(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${req.params.brandId}/modelos/${req.params.modelId}/anos/${req.params.yearId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
      } catch (e) {
        console.error(`[FIPE] Timeout ao buscar preço:`, e);
        return res.status(504).json({ error: 'Tempo de resposta excedido na API FIPE' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar preço' });
    }
  });

  async function testApiKey(provider: string, key: string, fullTest: boolean = false) {
    const trimmedKey = key?.trim();
    const p = provider?.toLowerCase();
    
    if (p === 'gemini') {
      // 1. Fetch models first (Cheaper/Free check)
      // Try v1 first as it's more stable for standard models
      let apiVersion = 'v1';
      let modelsResponse = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models?key=${trimmedKey}`);
      let modelsData = await modelsResponse.json();
      
      if (!modelsResponse.ok) {
        // Fallback to v1beta if v1 fails
        apiVersion = 'v1beta';
        modelsResponse = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models?key=${trimmedKey}`);
        modelsData = await modelsResponse.json();
      }
      
      if (!modelsResponse.ok) {
        const errMsg = modelsData.error?.message || 'Chave Gemini inválida';
        const lowerMsg = errMsg.toLowerCase();
        if (lowerMsg.includes('quota') || lowerMsg.includes('insufficient') || lowerMsg.includes('billing') || modelsResponse.status === 429) {
          throw new Error('QUOTA_EXCEEDED: ' + errMsg);
        }
        throw new Error(errMsg);
      }

      const availableModels = modelsData.models
        ?.filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
        .map((m: any) => m.name.replace('models/', '')) || [];

      if (availableModels.length === 0) {
        throw new Error('Nenhum modelo compatível encontrado.');
      }

      // 2. Only test generation if explicitly requested (Saves credits)
      if (fullTest) {
        const testModel = availableModels.find(m => m.includes('flash')) || availableModels[0];
        const testResponse = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models/${testModel}:generateContent?key=${trimmedKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'hi' }] }],
            generationConfig: { maxOutputTokens: 1 }
          })
        });

        if (!testResponse.ok) {
          const testData = await testResponse.json();
          const errMsg = testData.error?.message || `Erro ao testar geração`;
          if (testResponse.status === 429 || errMsg.toLowerCase().includes('quota')) {
            throw new Error('QUOTA_EXCEEDED: ' + errMsg);
          }
          throw new Error(errMsg);
        }
      }
      
      return availableModels;
    } else if (p === 'openai') {
      // 1. Fetch models first (Cheaper check)
      const modelsResponse = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${trimmedKey}` }
      });
      const modelsData = await modelsResponse.json();
      
      if (!modelsResponse.ok) {
        const errMsg = modelsData.error?.message || 'Chave OpenAI inválida';
        if (errMsg.toLowerCase().includes('quota') || modelsResponse.status === 429) {
          throw new Error('QUOTA_EXCEEDED: ' + errMsg);
        }
        throw new Error(errMsg);
      }

      const availableModels = modelsData.data
        ?.filter((m: any) => (m.id.includes('gpt') || m.id.includes('o1')) && !m.id.includes('vision'))
        .map((m: any) => m.id) || [];

      // 2. Only test generation if explicitly requested
      if (fullTest && availableModels.length > 0) {
        const testModel = availableModels.includes('gpt-4o-mini') ? 'gpt-4o-mini' : availableModels[0];
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${trimmedKey}` 
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1
          })
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Erro ao testar geração');
        }
      }
      
      return availableModels;
    } else if (p === 'groq') {
      // 1. Fetch models first
      const modelsResponse = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${trimmedKey}` }
      });
      const modelsData = await modelsResponse.json();
      
      if (!modelsResponse.ok) {
        const errMsg = modelsData.error?.message || 'Chave Groq inválida';
        if (errMsg.toLowerCase().includes('quota') || modelsResponse.status === 429) {
          throw new Error('QUOTA_EXCEEDED: ' + errMsg);
        }
        throw new Error(errMsg);
      }

      const availableModels = modelsData.data?.map((m: any) => m.id) || [];

      // 2. Only test generation if explicitly requested
      if (fullTest && availableModels.length > 0) {
        const testModel = availableModels.find(m => m.includes('llama')) || availableModels[0];
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${trimmedKey}` 
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1
          })
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Erro ao testar geração');
        }
      }
      
      return availableModels;
    } else {
      // Generic OpenAI-compatible
      const baseUrl = `https://api.${p}.com/v1`;
      const modelsResponse = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${trimmedKey}` }
      });
      const modelsData = await modelsResponse.json().catch(() => ({}));
      
      if (!modelsResponse.ok) throw new Error(modelsData.error?.message || `Chave ${p} inválida`);
      return modelsData.data?.map((m: any) => m.id) || [];
    }
  }

  app.post('/api/test-api-key', async (req, res) => {
    const { provider, key, fullTest } = req.body;
    try {
      const models = await testApiKey(provider, key, fullTest);
      res.json({ success: true, models });
    } catch (error: any) {
      const errMsg = error.message || '';
      if (errMsg.includes('QUOTA_EXCEEDED') || errMsg.includes('ACCESS_DENIED')) {
        // Log as info/warn instead of error to avoid cluttering logs with known external status
        console.info(`[API Status] ${provider}: ${errMsg}`);
      } else {
        console.error(`[API Test Error] ${provider}:`, error.message || error);
      }
      res.status(400).json({ error: errMsg || 'Erro de conexão com o provedor' });
    }
  });

  // AI Generation Proxy (Bypasses CORS)
  app.post('/api/ai/generate', async (req, res) => {
    const { apiKey, prompt, systemInstruction, image } = req.body;
    
    if (!apiKey || !apiKey.key || !apiKey.provider) {
      return res.status(400).json({ error: 'Dados da API Key incompletos.' });
    }

    try {
      const provider = apiKey.provider.toLowerCase();
      const trimmedKey = apiKey.key.trim();
      let modelName = apiKey.service || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');

      // Clean model name
      if (modelName.includes(' - ')) {
        modelName = modelName.split(' - ').pop().trim();
      } else if (modelName.includes(':')) {
        modelName = modelName.split(':').pop().trim();
      }

      console.log(`[AI Proxy] Gerando conteúdo com ${provider} (${modelName})...`);

      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${trimmedKey}`;
        const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
        
        if (image) {
          contents[0].parts.push({
            inlineData: {
              data: image.split(',')[1],
              mimeType: 'image/jpeg'
            }
          });
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents,
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { temperature: 0.4 }
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Erro Gemini API');

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Resposta vazia do Gemini');

        res.json({ text, provider: 'gemini', model: modelName });
      } else {
        // OpenAI, Groq, xAI, etc.
        let baseUrl = '';
        if (provider === 'openai') baseUrl = 'https://api.openai.com/v1';
        else if (provider === 'grok' || provider === 'xai') baseUrl = 'https://api.x.ai/v1';
        else if (provider === 'groq') baseUrl = 'https://api.groq.com/openai/v1';
        else baseUrl = `https://api.${provider}.com/v1`;

        const messages = [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: image ? [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image } }
          ] : prompt }
        ];

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${trimmedKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages,
            temperature: 0.4
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || `Erro ${provider} API`);

        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error(`Resposta vazia de ${provider}`);

        res.json({ text, provider, model: modelName });
      }
    } catch (error: any) {
      console.error('[AI Proxy Error]:', error.message);
      res.status(500).json({ error: error.message || 'Erro interno na geração de IA' });
    }
  });

  // Health check
  async function runHealthCheck() {
    console.log('Running API health check...');
    if (!supabaseAdmin) return;

    const { data: keys, error } = await supabaseAdmin.from('api_keys').select('*');
    if (error) return;

    let hasFailed = false;
    for (const apiKey of keys) {
      try {
        await testApiKey(apiKey.provider, apiKey.key);
        await supabaseAdmin.from('api_keys').update({ status: 'ok' }).eq('id', apiKey.id);
      } catch (e) {
        console.error(`Health check failed for ${apiKey.provider}:`, e);
        hasFailed = true;
        await supabaseAdmin.from('api_keys').update({ status: 'disconnected' }).eq('id', apiKey.id);
      }
    }

    if (hasFailed) {
      // Force re-test all (already done in the loop)
    }
  }

  // setInterval(runHealthCheck, 4 * 60 * 60 * 1000);
  // runHealthCheck(); // Run on startup

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
