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
      if (!supabaseAdmin) {
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

      const { data, error } = await supabaseAdmin.storage
        .from('banners')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) {
        console.error('Erro detalhado do Supabase Storage:', JSON.stringify(error, null, 2));
        return res.status(500).json({ 
          error: error.message || 'Erro no upload do storage',
          details: error
        });
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('banners')
        .getPublicUrl(filePath);

      res.json({ success: true, publicUrl, filePath });
    } catch (error: any) {
      console.error('Erro no upload via API:', error);
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

  async function testApiKey(provider: string, key: string) {
    const trimmedKey = key?.trim();
    const p = provider?.toLowerCase();
    
    if (p === 'gemini') {
      // 1. Fetch models first to see what's available and if the key is valid
      // Try v1beta as it's the most common for testing
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`);
      const modelsData = await modelsResponse.json();
      
      if (!modelsResponse.ok) {
        const errMsg = modelsData.error?.message || 'Chave Gemini inválida';
        const lowerMsg = errMsg.toLowerCase();
        // Only mark as quota exceeded if it's explicitly about quota, billing, or 429
        if (lowerMsg.includes('quota') || lowerMsg.includes('insufficient') || lowerMsg.includes('billing') || modelsResponse.status === 429) {
          throw new Error('QUOTA_EXCEEDED: ' + errMsg);
        }
        if (lowerMsg.includes('denied access') || lowerMsg.includes('suspended') || lowerMsg.includes('disabled')) {
          throw new Error('ACCESS_DENIED: ' + errMsg);
        }
        throw new Error(errMsg);
      }

      const availableModels = modelsData.models
        ?.filter((m: any) => 
          m.supportedGenerationMethods.includes('generateContent') && 
          !m.name.includes('embedding') && 
          !m.name.includes('text-to-speech') &&
          !m.name.includes('speech-to-text')
        )
        .map((m: any) => m.name.replace('models/', '')) || [];

      if (availableModels.length === 0) {
        throw new Error('Nenhum modelo compatível encontrado para esta chave.');
      }

      // 2. Test the first available model (prefer flash)
      const testModel = availableModels.find(m => m.includes('flash')) || availableModels[0];

      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${trimmedKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'hi' }] }],
          generationConfig: { maxOutputTokens: 1 }
        })
      });

      if (!testResponse.ok) {
        const testData = await testResponse.json();
        const errMsg = testData.error?.message || `Erro ao testar modelo ${testModel}`;
        const lowerMsg = errMsg.toLowerCase();
        if (lowerMsg.includes('quota') || lowerMsg.includes('insufficient') || lowerMsg.includes('billing') || testResponse.status === 429) {
          throw new Error('QUOTA_EXCEEDED: ' + errMsg);
        }
        if (lowerMsg.includes('denied access') || lowerMsg.includes('suspended') || lowerMsg.includes('disabled')) {
          throw new Error('ACCESS_DENIED: ' + errMsg);
        }
        throw new Error(errMsg);
      }
      
      return availableModels;
    } else if (p === 'openai') {
      // Test with a minimal chat completion call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${trimmedKey}` 
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        const errMsg = data.error?.message || 'Chave OpenAI inválida';
        const lowerMsg = errMsg.toLowerCase();
        if (lowerMsg.includes('quota') || lowerMsg.includes('insufficient') || lowerMsg.includes('billing') || response.status === 429) {
          throw new Error('QUOTA_EXCEEDED: ' + errMsg);
        }
        throw new Error(errMsg);
      }
      
      // If generation works, fetch models
      const modelsResponse = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${trimmedKey}` }
      });
      const modelsData = await modelsResponse.json();
      
      return modelsData.data
        ?.filter((m: any) => 
          (m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3')) && 
          !m.id.includes('instruct') && 
          !m.id.includes('vision')
        )
        .map((m: any) => m.id) || [];
    } else if (p === 'grok' || p === 'xai') {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${trimmedKey}` 
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        const errMsg = data.error?.message || 'Chave Grok inválida';
        if (errMsg.toLowerCase().includes('quota') || response.status === 429) {
          throw new Error('QUOTA_EXCEEDED: ' + errMsg);
        }
        throw new Error(errMsg);
      }

      const modelsResponse = await fetch('https://api.x.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${trimmedKey}` }
      });
      const modelsData = await modelsResponse.json();
      return modelsData.data
        ?.filter((m: any) => m.id.includes('grok'))
        .map((m: any) => m.id) || [];
    } else if (p === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${trimmedKey}` 
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        const errMsg = data.error?.message || 'Chave Groq inválida';
        if (errMsg.toLowerCase().includes('quota') || response.status === 429) {
          throw new Error('QUOTA_EXCEEDED: ' + errMsg);
        }
        throw new Error(errMsg);
      }

      const modelsResponse = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${trimmedKey}` }
      });
      const modelsData = await modelsResponse.json();
      return modelsData.data
        ?.filter((m: any) => m.id.includes('llama') || m.id.includes('mixtral') || m.id.includes('gemma'))
        .map((m: any) => m.id) || [];
    } else {
      // Fallback for other OpenAI-compatible providers
      const baseUrl = `https://api.${p}.com/v1`;
      
      // Minimal test call
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${trimmedKey}` 
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo', // Generic guess
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1
          })
        });
        
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const errMsg = data.error?.message || `Erro na API ${p}`;
          if (errMsg.toLowerCase().includes('quota') || response.status === 429) {
            throw new Error('QUOTA_EXCEEDED: ' + errMsg);
          }
        }
      } catch (err: any) {
        if (err.message?.includes('QUOTA_EXCEEDED')) throw err;
        // Ignore other errors for generic providers as they might not support this specific model
      }

      let modelsResponse;
      try {
        modelsResponse = await fetch(`${baseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${trimmedKey}` }
        });
      } catch (err) {
        return [];
      }
      
      if (modelsResponse.status === 404) return [];
      
      const data = await modelsResponse.json().catch(() => ({}));
      if (!modelsResponse.ok) throw new Error(data.error?.message || `Chave ${p} inválida`);
      return data.data?.map((m: any) => m.id) || [];
    }
  }

  app.post('/api/test-api-key', async (req, res) => {
    const { provider, key } = req.body;
    try {
      const models = await testApiKey(provider, key);
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
