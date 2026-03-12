import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

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
  app.get('/api/fipe/brands', async (req, res) => {
    try {
      const type = (req.query.type as string) || 'carros';
      console.log(`[FIPE] Buscando marcas para tipo: ${type}`);
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
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
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${req.params.brandId}/modelos`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
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
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${req.params.brandId}/modelos/${req.params.modelId}/anos`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
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
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${req.params.brandId}/modelos/${req.params.modelId}/anos/${req.params.yearId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar preço' });
    }
  });

  async function testApiKey(provider: string, key: string) {
    const trimmedKey = key?.trim();
    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Chave Gemini inválida');
      return data.models
        ?.filter((m: any) => 
          m.supportedGenerationMethods.includes('generateContent') && 
          !m.name.includes('embedding') && 
          !m.name.includes('text-to-speech') &&
          !m.name.includes('speech-to-text')
        )
        .map((m: any) => m.name.replace('models/', '')) || [];
    } else if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${trimmedKey}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Chave OpenAI inválida');
      return data.data
        ?.filter((m: any) => 
          (m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3')) && 
          !m.id.includes('instruct') && 
          !m.id.includes('vision')
        )
        .map((m: any) => m.id) || [];
    } else if (provider === 'grok') {
      const response = await fetch('https://api.x.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${trimmedKey}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Chave Grok inválida');
      return data.data
        ?.filter((m: any) => m.id.includes('grok'))
        .map((m: any) => m.id) || [];
    }
    throw new Error('Provedor não suportado');
  }

  app.post('/api/test-api-key', async (req, res) => {
    const { provider, key } = req.body;
    try {
      const models = await testApiKey(provider, key);
      res.json({ success: true, models });
    } catch (error: any) {
      console.error('Erro no teste de API:', error);
      res.status(400).json({ error: error.message || 'Erro de conexão com o provedor' });
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

  setInterval(runHealthCheck, 4 * 60 * 60 * 1000);
  runHealthCheck(); // Run on startup

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
