import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Database setup
  const db = new Database('autodrive.db');
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status_lead TEXT DEFAULT 'Novo', -- Novo, Analisando, Proposta Enviada
      score_veiculo INTEGER,
      valor_quitacao_estimado REAL,
      owner_name TEXT,
      owner_phone TEXT,
      brand TEXT,
      model TEXT,
      year INTEGER,
      plate TEXT,
      renavam TEXT,
      mileage INTEGER,
      bank TEXT,
      installment_value REAL,
      installments_paid INTEGER,
      installments_remaining INTEGER,
      desired_price REAL,
      fipe_price REAL,
      situation TEXT,
      has_ac INTEGER,
      has_leather INTEGER,
      has_sunroof INTEGER,
      is_crashed INTEGER,
      media_urls TEXT, -- JSON array
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      reset_token TEXT,
      reset_token_expires DATETIME
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_name TEXT,
      owner_phone TEXT,
      owner_email TEXT,
      owner_location TEXT,
      vehicle_type TEXT,
      brand TEXT,
      model TEXT,
      year TEXT,
      color TEXT,
      mileage INTEGER,
      plate TEXT,
      renavam TEXT,
      
      -- History
      has_sinistro INTEGER,
      has_leilao INTEGER,
      is_recuperado INTEGER,
      has_furto_roubo INTEGER,
      damage_type TEXT,
      
      -- Financial
      is_financed INTEGER,
      bank TEXT,
      installment_value TEXT,
      installments_paid INTEGER,
      installments_remaining INTEGER,
      
      -- Problems
      has_delayed_financing INTEGER,
      has_busca_apreensao INTEGER,
      has_delayed_ipva INTEGER,
      has_renajud INTEGER,
      has_blown_engine INTEGER,
      has_gearbox_issue INTEGER,
      has_crash_damage INTEGER,
      has_sinistrado_leilao INTEGER,
      
      -- Accessories (JSON)
      accessories TEXT,
      
      -- Additional Info
      has_manual_key INTEGER,
      full_maintenance_history INTEGER,
      tire_condition TEXT,
      
      fipe_price TEXT,
      desired_price TEXT,
      media_urls TEXT, -- JSON array of URLs
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assets_site (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identificador_secao TEXT UNIQUE,
      url_foto TEXT,
      legenda TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Initial assets if empty
  const assetsCount = db.prepare('SELECT COUNT(*) as count FROM assets_site').get() as any;
  if (assetsCount.count === 0) {
    const initialAssets = [
      { id: 'hero_bg', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1920', label: 'Imagem de Fundo Hero' },
      // CARROS
      { id: 'card_carro_1', url: 'https://images.unsplash.com/photo-1597328290883-50c5787b7c7e?auto=format&fit=crop&q=80&w=800', label: 'Sedã de luxo batido' },
      { id: 'card_carro_2', url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800', label: 'SUV motor estourado' },
      { id: 'card_carro_3', url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800', label: 'Carro Vende-se pátio' },
      { id: 'card_carro_4', url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=800', label: 'Esportivo Renajud' },
      { id: 'card_carro_5', url: 'https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?auto=format&fit=crop&q=80&w=800', label: 'Hatch abandonado' },
      // MOTOS
      { id: 'card_moto_1', url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800', label: 'Moto esportiva batida' },
      { id: 'card_moto_2', url: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&q=80&w=800', label: 'Moto motor fundido' },
      { id: 'card_moto_3', url: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=800', label: 'Moto trilha oficina' },
      { id: 'card_moto_4', url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800', label: 'Scooter sinistrada' },
      { id: 'card_moto_5', url: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=800', label: 'Moto busca apreensão' },
      // CAMINHÕES
      { id: 'card_truck_1', url: 'https://images.unsplash.com/photo-1586191582151-f73872dfd183?auto=format&fit=crop&q=80&w=800', label: 'Caminhão cabine tombada' },
      { id: 'card_truck_2', url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800', label: 'Caminhão baú estrada' },
      { id: 'card_truck_3', url: 'https://images.unsplash.com/photo-1591768793355-74d74b262bb4?auto=format&fit=crop&q=80&w=800', label: 'Bitrem cooperativa' },
      { id: 'card_truck_4', url: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800', label: 'Guincho veículo batido' },
      { id: 'card_truck_5', url: 'https://images.unsplash.com/photo-1501700493717-9ae98220b74b?auto=format&fit=crop&q=80&w=800', label: 'Frota leilão' },
      // MIX
      { id: 'card_mix_1', url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800', label: 'Pátio frotas' },
      { id: 'card_mix_2', url: 'https://images.unsplash.com/photo-1530046339160-ce3e5b0c7a2f?auto=format&fit=crop&q=80&w=800', label: 'Oficina scanners' },
      { id: 'card_mix_3', url: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=800', label: 'Celular App Fipe' },
      { id: 'card_mix_4', url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800', label: 'Documento CRLV' },
      { id: 'card_mix_5', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=800', label: 'Chaves carros' },
    ];

    const insert = db.prepare('INSERT INTO assets_site (identificador_secao, url_foto, legenda) VALUES (?, ?, ?)');
    initialAssets.forEach(a => insert.run(a.id, a.url, a.label));
  }

  app.use(express.json());

  // Default Admin User
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (userCount.count === 0) {
    db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run('admin@autocompra.com', 'admin123');
  }

  // Auth Routes
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password) as any;
    if (user) {
      res.json({ success: true, user: { email: user.email } });
    } else {
      res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (user) {
      const token = Math.random().toString(36).substring(2, 15);
      const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour
      db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?').run(token, expires, email);
      console.log(`[MOCK EMAIL] Link de redefinição para ${email}: http://localhost:3000/reset-password?token=${token}`);
      res.json({ success: true, message: 'E-mail de redefinição enviado (simulado no console)' });
    } else {
      res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { token, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?').get(token, new Date().toISOString()) as any;
    if (user) {
      db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?').run(newPassword, user.id);
      res.json({ success: true, message: 'Senha alterada com sucesso' });
    } else {
      res.status(400).json({ success: false, message: 'Token inválido ou expirado' });
    }
  });

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

  // Vehicle Submission
  app.post('/api/vehicles', (req, res) => {
    const v = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO vehicles (
          owner_name, owner_phone, owner_email, owner_location, vehicle_type, brand, model, year, color, mileage, plate, renavam,
          has_sinistro, has_leilao, is_recuperado, has_furto_roubo, damage_type,
          is_financed, bank, installment_value, installments_paid, installments_remaining,
          has_delayed_financing, has_busca_apreensao, has_delayed_ipva, has_renajud, 
          has_blown_engine, has_gearbox_issue, has_crash_damage, has_sinistrado_leilao,
          accessories, has_manual_key, full_maintenance_history, tire_condition,
          fipe_price, desired_price, media_urls
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        v.ownerName, v.ownerPhone, v.ownerEmail, v.ownerLocation, v.vehicleType, v.brandId, v.modelId, v.yearId, v.color, v.mileage, v.plate, v.renavam,
        v.hasSinistro ? 1 : 0, v.hasLeilao ? 1 : 0, v.isRecuperado ? 1 : 0, v.hasFurtoRoubo ? 1 : 0, v.damageType,
        v.isFinanced ? 1 : 0, v.bank, v.installmentValue, v.installmentsPaid, v.installmentsRemaining,
        v.hasDelayedFinancing ? 1 : 0, v.hasBuscaApreensao ? 1 : 0, v.hasDelayedIpva ? 1 : 0, v.hasRenajud ? 1 : 0,
        v.hasBlownEngine ? 1 : 0, v.hasGearboxIssue ? 1 : 0, v.hasCrashDamage ? 1 : 0, v.hasSinistradoLeilao ? 1 : 0,
        JSON.stringify(v.accessories), v.hasManualKey ? 1 : 0, v.fullMaintenanceHistory ? 1 : 0, v.tireCondition,
        v.fipePrice || '', v.desiredPrice, JSON.stringify(v.mediaUrls || [])
      );
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao cadastrar veículo' });
    }
  });

  // Admin Routes
  app.get('/api/admin/vehicles', (req, res) => {
    const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
    res.json(vehicles.map(v => ({ ...v, media_urls: JSON.parse(v.media_urls) })));
  });

  app.get('/api/admin/leads', (req, res) => {
    const leads = db.prepare('SELECT *, "Lead Rápido" as type FROM leads ORDER BY created_at DESC').all();
    const vehicles = db.prepare('SELECT *, "Avaliação Completa" as type FROM vehicles ORDER BY created_at DESC').all();
    
    // Merge and sort
    const allLeads = [...leads, ...vehicles].sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(b.created_at).getTime()
    );

    res.json(allLeads.map((l: any) => ({ 
      ...l, 
      media_urls: JSON.parse(l.media_urls || '[]'),
      accessories: l.accessories ? JSON.parse(l.accessories) : []
    })));
  });

  app.get('/api/assets', (req, res) => {
    const assets = db.prepare('SELECT * FROM assets_site').all();
    res.json(assets);
  });

  app.post('/api/admin/assets/update', (req, res) => {
    const { identificador_secao, url_foto, legenda } = req.body;
    try {
      const stmt = db.prepare(`
        UPDATE assets_site 
        SET url_foto = ?, legenda = ? 
        WHERE identificador_secao = ?
      `);
      stmt.run(url_foto, legenda, identificador_secao);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar asset' });
    }
  });

  app.post('/api/leads', (req, res) => {
    const v = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO leads (
          status_lead, score_veiculo, valor_quitacao_estimado, owner_name, 
          owner_phone, brand, model, year, plate, renavam, mileage, bank, 
          installment_value, installments_paid, installments_remaining, 
          desired_price, fipe_price, situation, has_ac, has_leather, 
          has_sunroof, is_crashed, media_urls
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        v.status_lead || 'Novo',
        v.score_veiculo || 0,
        v.valor_quitacao_estimado || 0,
        v.owner_name,
        v.owner_phone,
        v.brand,
        v.model,
        v.year,
        v.plate,
        v.renavam,
        v.mileage,
        v.bank,
        v.installment_value,
        v.installments_paid,
        v.installments_remaining,
        v.desired_price,
        v.fipe_price,
        v.situation,
        v.has_ac ? 1 : 0,
        v.has_leather ? 1 : 0,
        v.has_sunroof ? 1 : 0,
        v.is_crashed ? 1 : 0,
        JSON.stringify(v.media_urls || [])
      );
      
      // Simulate n8n Webhook call
      console.log('Sending lead to n8n Webhook:', v);
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao salvar lead' });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
