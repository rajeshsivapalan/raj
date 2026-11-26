import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { requireAuth } from './middleware/auth.js';
import auth from './routes/auth.js';
import users from './routes/users.js';
import projects from './routes/projects.js';
import logs from './routes/logs.js';
import dashboard from './routes/dashboard.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', auth);
  app.use('/api/users', requireAuth, users);
  app.use('/api/projects', requireAuth, projects);
  app.use('/api/logs', requireAuth, logs);
  app.use('/api/dashboard', requireAuth, dashboard);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // In production, serve the built React app from the same server.
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });
  return app;
}
