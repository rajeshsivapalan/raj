// Creates a demo admin, lead, two employees, two projects and a few log entries.
// Usage: npm run seed   (safe to re-run: skips if the admin already exists)
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Project from './models/Project.js';
import WorkLog from './models/WorkLog.js';
import { today } from './scope.js';

export async function seed() {
  if (await User.exists({ email: 'admin@btpl.local' })) return console.log('Seed data already present');
  const hash = await bcrypt.hash('Welcome@123', 10);
  const [admin, lead, emp1, emp2] = await User.create([
    { name: 'BTPL Admin', email: 'admin@btpl.local', role: 'admin', designation: 'Director', passwordHash: hash },
    { name: 'Priya Lead', email: 'lead@btpl.local', role: 'lead', designation: 'Project Lead', passwordHash: hash },
    { name: 'Arun Dev', email: 'arun@btpl.local', role: 'employee', designation: 'MERN Developer', passwordHash: hash },
    { name: 'Meena QA', email: 'meena@btpl.local', role: 'employee', designation: 'QA Engineer', passwordHash: hash },
  ]);
  const [p1, p2] = await Project.create([
    { name: 'Client Portal Revamp', code: 'CPR', client: 'Demo Client', lead: lead._id, members: [emp1._id, emp2._id] },
    { name: 'Internal HR App', code: 'HRA', client: 'BTPL', lead: lead._id, members: [emp1._id] },
  ]);
  const d = today();
  await WorkLog.create([
    { user: emp1._id, project: p1._id, date: d, hours: 5, task: 'Built login API and JWT middleware', status: 'done' },
    { user: emp1._id, project: p2._id, date: d, hours: 2, task: 'Leave request form UI', status: 'in-progress' },
    { user: emp2._id, project: p1._id, date: d, hours: 3, task: 'Regression on checkout flow', status: 'blocked', blocker: 'Staging server down' },
  ]);
  console.log('Seeded. Sign in as admin@btpl.local / Welcome@123 (also lead@, arun@, meena@)');
  return { admin, lead, emp1, emp2, p1, p2 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await mongoose.connect(process.env.MONGO_URI);
  await seed();
  await mongoose.disconnect();
}
