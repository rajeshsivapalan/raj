import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User, { ROLES } from '../models/User.js';
import { requireRole } from '../middleware/auth.js';
import { ah } from '../middleware/async.js';

const r = Router();

// Leads need the user list to pick project members.
r.get('/', requireRole('lead', 'admin'), ah(async (req, res) => {
  res.json(await User.find().sort({ name: 1 }));
}));

r.post('/', requireRole('admin'), ah(async (req, res) => {
  const { name, email, password, role = 'employee', designation } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Unknown role' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email already in use' });
  const user = await User.create({ name, email, role, designation, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json(user);
}));

r.put('/:id', requireRole('admin'), ah(async (req, res) => {
  const { name, role, designation, active, password } = req.body || {};
  const update = {};
  if (name !== undefined) update.name = name;
  if (designation !== undefined) update.designation = designation;
  if (active !== undefined) update.active = !!active;
  if (role !== undefined) {
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Unknown role' });
    update.role = role;
  }
  if (password) update.passwordHash = await bcrypt.hash(password, 10);
  if (String(req.params.id) === String(req.user._id) && (update.active === false || (update.role && update.role !== 'admin'))) {
    return res.status(400).json({ error: 'You cannot deactivate or demote yourself' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}));

export default r;
