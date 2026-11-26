import { Router } from 'express';
import WorkLog from '../models/WorkLog.js';
import Project from '../models/Project.js';
import { ah } from '../middleware/async.js';
import { managedProjectIds, today, daysBetween } from '../scope.js';

const r = Router();
const editWindow = () => Number(process.env.LOG_EDIT_WINDOW_DAYS || 7);
const isOwner = (log, user) => String(log.user) === String(user._id);

async function canLogOn(user, projectId) {
  if (user.role === 'admin') return Project.exists({ _id: projectId });
  return Project.exists({ _id: projectId, status: { $ne: 'completed' }, $or: [{ members: user._id }, { lead: user._id }] });
}

function checkDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return 'Date must be YYYY-MM-DD';
  const age = daysBetween(date, today());
  if (age < 0) return 'You cannot log work for a future date';
  if (age > editWindow()) return `Entries older than ${editWindow()} days are locked`;
  return null;
}

// GET /api/logs?from=&to=&user=&project=
r.get('/', ah(async (req, res) => {
  const { from, to, user, project } = req.query;
  const filter = {};
  if (from || to) filter.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  if (project) filter.project = project;

  const managed = await managedProjectIds(req.user);
  if (req.user.role === 'employee') {
    filter.user = req.user._id;
  } else {
    if (user) filter.user = user;
    if (managed) {
      // Lead: own logs, plus anyone's logs on projects they lead.
      filter.$or = [{ user: req.user._id }, { project: { $in: managed } }];
    }
  }
  const logs = await WorkLog.find(filter)
    .populate('user', 'name')
    .populate('project', 'name code')
    .sort({ date: -1, createdAt: -1 })
    .limit(500);
  res.json(logs);
}));

r.post('/', ah(async (req, res) => {
  const { project, date = today(), hours, task, status, blocker } = req.body || {};
  const dateErr = req.user.role === 'admin' ? null : checkDate(date);
  if (dateErr) return res.status(400).json({ error: dateErr });
  if (!project || !(await canLogOn(req.user, project))) return res.status(400).json({ error: 'Pick a project you are assigned to' });
  if (status === 'blocked' && !blocker) return res.status(400).json({ error: 'Please describe what is blocking you' });
  const log = await WorkLog.create({ user: req.user._id, project, date, hours, task, status, blocker });
  res.status(201).json(await log.populate([{ path: 'project', select: 'name code' }, { path: 'user', select: 'name' }]));
}));

async function loadEditable(req, res) {
  const log = await WorkLog.findById(req.params.id);
  if (!log) return void res.status(404).json({ error: 'Entry not found' });
  if (req.user.role !== 'admin') {
    if (!isOwner(log, req.user)) return void res.status(403).json({ error: 'You can only change your own entries' });
    const err = checkDate(log.date);
    if (err) return void res.status(400).json({ error: err });
  }
  return log;
}

r.put('/:id', ah(async (req, res) => {
  const log = await loadEditable(req, res);
  if (!log) return;
  const { project, date, hours, task, status, blocker } = req.body || {};
  if (date !== undefined && req.user.role !== 'admin') {
    const err = checkDate(date);
    if (err) return res.status(400).json({ error: err });
  }
  if (project !== undefined && !(await canLogOn(req.user, project))) return res.status(400).json({ error: 'Pick a project you are assigned to' });
  Object.assign(log, Object.fromEntries(Object.entries({ project, date, hours, task, status, blocker }).filter(([, v]) => v !== undefined)));
  if (log.status === 'blocked' && !log.blocker) return res.status(400).json({ error: 'Please describe what is blocking you' });
  await log.save();
  res.json(await log.populate([{ path: 'project', select: 'name code' }, { path: 'user', select: 'name' }]));
}));

r.delete('/:id', ah(async (req, res) => {
  const log = await loadEditable(req, res);
  if (!log) return;
  await log.deleteOne();
  res.json({ ok: true });
}));

export default r;
