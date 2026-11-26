import bcrypt from 'bcryptjs';
import User from './models/User.js';

// On a fresh database, create the first admin from ADMIN_EMAIL / ADMIN_PASSWORD.
// Does nothing once any user exists, so changing these later has no effect.
export async function ensureFirstAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Administrator' } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  if (await User.exists({})) return;
  if (ADMIN_PASSWORD.length < 8) {
    console.warn('ADMIN_PASSWORD must be at least 8 characters; first admin not created');
    return;
  }
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    role: 'admin',
    designation: 'Administrator',
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
  });
  console.log(`Created first admin ${ADMIN_EMAIL}`);
}
