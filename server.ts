import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

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

  // Google Merchant Center XML Feed
  app.get('/api/google-merchant-feed', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).send('Supabase Admin not initialized');
      }

      console.log('[Merchant Feed] Gerando feed de produtos...');

      const { data: vehicles, error } = await supabaseAdmin
        .from('leads_veiculos')
        .select('*')
        .not('marca', 'is', null)
        .not('status', 'in', '("vendido", "perdido")');

      if (error) throw error;

      const escapeXml = (unsafe: string) => {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&'"]/g, (c) => {
          switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
          }
        });
      };

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>AutoCompra.online - Estoque</title>
    <link>https://autocompra.online</link>
    <description>Estoques de veículos da AutoCompra.online atualizados automaticamente.</description>
`;

      vehicles?.forEach((v: any) => {
        const title = escapeXml(`${v.marca} ${v.modelo} ${v.ano_modelo || ''} ${v.versao || ''}`.trim());
        const description = escapeXml(v.descricao || `Confira este ${title} disponível na AutoCompra.online.`);
        const link = `https://autocompra.online/?veiculo=${v.id}`;
        
        let imageLink = '';
        if (Array.isArray(v.fotos) && v.fotos.length > 0) {
          imageLink = v.fotos[0];
        } else if (typeof v.fotos === 'string' && v.fotos.startsWith('[')) {
          try {
            const parsed = JSON.parse(v.fotos);
            if (Array.isArray(parsed) && parsed.length > 0) imageLink = parsed[0];
          } catch (e) {}
        }

        const price = v.preco_cliente || v.preco_fipe || 0;
        const availability = v.status === 'reservado' ? 'out of stock' : 'in stock';

        xml += `    <item>
      <g:id>${v.id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:condition>used</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} BRL</g:price>
      <g:brand>${escapeXml(v.marca)}</g:brand>
      <g:google_product_category>Vehicles &amp; Parts &gt; Vehicles &gt; Motor Vehicles &gt; Cars, Trucks &amp; Vans</g:google_product_category>
    </item>\n`;
      });

      xml += `  </channel>
</rss>`;

      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch (error: any) {
      console.error('[Merchant Feed] Erro:', error);
      res.status(500).send('Erro ao gerar o feed');
    }
  });

  async function testApiKey(provider: string, key: string, service?: string, fullTest: boolean = false) {
    const trimmedKey = key?.trim();
    const p = provider?.toLowerCase();
    
    // Helper to map model names (same as AIService)
    const getMappedModel = (p: string, model: string) => {
      const lowerModel = model.toLowerCase().trim();
      if (p === 'groq') {
        if (lowerModel.includes('llama 3.3') || lowerModel.includes('llama-3.3')) return 'llama-3.3-70b-versatile';
        if (lowerModel.includes('llama 3.1') || lowerModel.includes('llama-3.1')) return 'llama-3.1-8b-instant';
        if (lowerModel.includes('llama 3') || lowerModel.includes('llama3')) return 'llama-3.1-8b-instant';
        if (lowerModel.includes('mixtral')) return 'mixtral-8x7b-32768';
        if (lowerModel.includes('gemma')) return 'gemma2-9b-it';
      } else if (p === 'openai') {
        if (lowerModel.includes('gpt-4o-mini')) return 'gpt-4o-mini';
        if (lowerModel.includes('gpt-4o')) return 'gpt-4o';
        if (lowerModel.includes('gpt-4')) return 'gpt-4';
      } else if (p === 'gemini') {
        if (lowerModel.includes('flash-thinking')) return 'gemini-2.0-flash-thinking-exp';
        if (lowerModel.includes('2.0-flash')) return 'gemini-2.0-flash-exp';
        if (lowerModel.includes('flash')) return 'gemini-1.5-flash-latest';
        if (lowerModel.includes('pro')) return 'gemini-1.5-pro-latest';
        return 'gemini-1.5-flash-latest';
      }
      return model;
    };

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
      if (fullTest || service) {
        const mappedModel = service ? getMappedModel('gemini', service) : (availableModels.find(m => m.includes('flash')) || availableModels[0]);
        
        const tryGenerate = async (version: string) => {
          const testResponse = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${mappedModel}:generateContent?key=${trimmedKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'hi' }] }],
              generationConfig: { maxOutputTokens: 1 }
            })
          });
          return testResponse;
        };

        let testResponse = await tryGenerate(apiVersion);
        
        // Se falhou no v1 com erro de "not found" ou similar, tenta v1beta
        if (!testResponse.ok && apiVersion === 'v1') {
          const testData = await testResponse.json().catch(() => ({}));
          const errMsg = testData.error?.message || '';
          if (errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('not supported')) {
            console.log(`[API Test] Gemini v1 falhou para ${mappedModel}, tentando v1beta...`);
            testResponse = await tryGenerate('v1beta');
          }
        }

        if (!testResponse.ok) {
          const testData = await testResponse.json().catch(() => ({}));
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
      if ((fullTest || service) && availableModels.length > 0) {
        const mappedModel = service ? getMappedModel('openai', service) : (availableModels.includes('gpt-4o-mini') ? 'gpt-4o-mini' : availableModels[0]);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${trimmedKey}` 
          },
          body: JSON.stringify({
            model: mappedModel,
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
      if ((fullTest || service) && availableModels.length > 0) {
        const mappedModel = service ? getMappedModel('groq', service) : (availableModels.find(m => m.includes('llama')) || availableModels[0]);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${trimmedKey}` 
          },
          body: JSON.stringify({
            model: mappedModel,
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
    const { provider, key, service, fullTest } = req.body;
    try {
      const models = await testApiKey(provider, key, service, fullTest);
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
      let rawModel = apiKey.service || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
      let modelName = rawModel;

      // Clean model name
      if (rawModel.includes(' - ')) {
        modelName = rawModel.split(' - ').pop().trim();
      } else if (rawModel.includes(':')) {
        modelName = rawModel.split(':').pop().trim();
      }

      // Mapeamento de nomes amigáveis para IDs reais (Sincronizado com AIService)
      const lowerModel = modelName.toLowerCase().trim();
      if (provider === 'groq') {
        if (lowerModel.includes('llama 3.3') || lowerModel.includes('llama-3.3')) modelName = 'llama-3.3-70b-versatile';
        else if (lowerModel.includes('llama 3.1') || lowerModel.includes('llama-3.1')) modelName = 'llama-3.1-8b-instant';
        else if (lowerModel.includes('llama 3') || lowerModel.includes('llama3')) modelName = 'llama-3.1-8b-instant';
        else if (lowerModel.includes('mixtral')) modelName = 'mixtral-8x7b-32768';
        else if (lowerModel.includes('gemma')) modelName = 'gemma2-9b-it';
      } else if (provider === 'openai') {
        if (lowerModel.includes('gpt-4o-mini')) modelName = 'gpt-4o-mini';
        else if (lowerModel.includes('gpt-4o')) modelName = 'gpt-4o';
        else if (lowerModel.includes('gpt-4')) modelName = 'gpt-4';
      } else if (provider === 'gemini') {
        if (lowerModel.includes('flash-thinking')) modelName = 'gemini-2.0-flash-thinking-exp';
        else if (lowerModel.includes('2.0-flash')) modelName = 'gemini-2.0-flash-exp';
        else if (lowerModel.includes('flash')) modelName = 'gemini-1.5-flash-latest';
        else if (lowerModel.includes('pro')) modelName = 'gemini-1.5-pro-latest';
        else modelName = 'gemini-1.5-flash-latest';
      }

      console.log(`[AI Proxy] Gerando conteúdo com ${provider} (${modelName})...`);

      if (provider === 'gemini') {
        const tryGenerate = async (version: string) => {
          const url = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${trimmedKey}`;
          const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
          
          if (image) {
            contents[0].parts.push({
              inlineData: {
                data: image.split(',')[1],
                mimeType: 'image/jpeg'
              }
            });
          }

          return await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              contents,
              system_instruction: { parts: [{ text: systemInstruction }] },
              generationConfig: { temperature: 0.4 }
            })
          });
        };

        let response = await tryGenerate('v1');
        let data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errMsg = data.error?.message || '';
          if (errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('not supported')) {
            console.log(`[AI Proxy] Gemini v1 falhou para ${modelName}, tentando v1beta...`);
            response = await tryGenerate('v1beta');
            data = await response.json().catch(() => ({}));
          }
        }

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

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const errMsg = data.error?.message || data.error || `Erro ${provider} API (${response.status})`;
          throw new Error(errMsg);
        }

        const text = data.choices?.[0]?.message?.content;
        if (!text) {
          console.error(`[AI Proxy] Resposta inválida de ${provider}:`, JSON.stringify(data));
          throw new Error(`Resposta vazia ou inválida de ${provider}`);
        }

        res.json({ text, provider, model: modelName });
      }
    } catch (error: any) {
      console.error('[AI Proxy Error]:', error.message);
      res.status(500).json({ error: error.message || 'Erro interno na geração de IA' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Catch-all route to serve index.html with Vite transformation
    app.get('*', async (req, res, next) => {
      // Ignore API routes
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }

      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        console.error('[Server Error] Error serving index.html:', e);
        res.status(500).end(e.stack);
      }
    });
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
