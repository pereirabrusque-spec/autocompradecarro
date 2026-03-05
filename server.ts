import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // FIPE Proxy Routes (using public API)
  app.get('/api/fipe/brands', async (req, res) => {
    try {
      const response = await fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar marcas' });
    }
  });

  app.get('/api/fipe/models/:brandId', async (req, res) => {
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${req.params.brandId}/modelos`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar modelos' });
    }
  });

  app.get('/api/fipe/years/:brandId/:modelId', async (req, res) => {
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${req.params.brandId}/modelos/${req.params.modelId}/anos`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar anos' });
    }
  });

  app.get('/api/fipe/price/:brandId/:modelId/:yearId', async (req, res) => {
    try {
      const response = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${req.params.brandId}/modelos/${req.params.modelId}/anos/${req.params.yearId}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar preço' });
    }
  });

  app.post('/api/test-api-key', async (req, res) => {
    const { provider, key } = req.body;
    const trimmedKey = key?.trim();
    
    try {
      if (provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${trimmedKey}`);
        const data = await response.json();
        if (response.ok) {
          res.json({ success: true });
        } else {
          res.status(400).json({ error: data.error?.message || 'Chave Gemini inválida' });
        }
      } else if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${trimmedKey}` }
        });
        const data = await response.json();
        if (response.ok) {
          res.json({ success: true });
        } else {
          res.status(400).json({ error: data.error?.message || 'Chave OpenAI inválida' });
        }
      } else {
        res.status(400).json({ error: 'Provedor não suportado para teste automático' });
      }
    } catch (error: any) {
      console.error('Erro no teste de API:', error);
      res.status(500).json({ error: 'Erro de conexão com o provedor' });
    }
  });

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
