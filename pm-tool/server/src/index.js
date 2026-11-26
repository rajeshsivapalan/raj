import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { ensureFirstAdmin } from './bootstrap.js';

const { MONGO_URI, JWT_SECRET, PORT = 4000 } = process.env;
if (!MONGO_URI || !JWT_SECRET) {
  console.error('MONGO_URI and JWT_SECRET must be set (copy .env.example to .env)');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
await ensureFirstAdmin();
createApp().listen(PORT, () => console.log(`BTPL PM API on http://localhost:${PORT}`));
