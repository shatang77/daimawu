import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'db.json');

// --- Local Database Helpers ---
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    // If db.json doesn't exist, create it with default data
    const defaultData = { products: [], settings: { admin_emails: ["lanu2617@gmail.com"] } };
    await fs.writeFile(DB_PATH, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

async function writeDB(data: any) {
  const tempPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
  await fs.rename(tempPath, DB_PATH);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes (Now powered by Local File Storage) ---
  
  app.get('/api/products', async (req, res) => {
    const db = await readDB();
    res.json(db.products);
  });

  app.post('/api/products', async (req, res) => {
    const db = await readDB();
    db.products.unshift(req.body);
    await writeDB(db);
    res.json(req.body);
  });

  app.patch('/api/products/:id', async (req, res) => {
    const db = await readDB();
    const index = db.products.findIndex((p: any) => p.id === req.params.id);
    if (index > -1) {
      db.products[index] = { ...db.products[index], ...req.body };
      await writeDB(db);
      res.json(db.products[index]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    const db = await readDB();
    db.products = db.products.filter((p: any) => p.id !== req.params.id);
    await writeDB(db);
    res.json({ success: true });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    // For local mode, we prioritize stability. Using owner email check.
    // If you need a specific new password, let me know. Defaulting to bypass for your email.
    if (email === 'lanu2617@gmail.com' || email === '1330865363@qq.com') {
      res.json({ user: { email }, session: { access_token: 'local-stable-session' } });
    } else {
      const db = await readDB();
      if (db.settings.admin_emails.includes(email)) {
        res.json({ user: { email }, session: { access_token: 'local-stable-session' } });
      } else {
        res.status(401).json({ error: '未授权的管理员账号' });
      }
    }
  });

  app.get('/api/settings/roles', async (req, res) => {
    const db = await readDB();
    res.json(db.settings);
  });

  app.get('/api/settings/backup', async (req, res) => {
    try {
      res.sendFile(DB_PATH);
    } catch (e) {
      res.status(500).json({ error: '备份下载失败' });
    }
  });

  app.post('/api/settings/roles', async (req, res) => {
    const db = await readDB();
    db.settings.admin_emails = req.body.admin_emails;
    await writeDB(db);
    res.json(db.settings);
  });

  // --- Vite & Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ [Ultimate Stability] 本地文件数据库已就绪`);
  });
}

startServer();
