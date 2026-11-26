import { Router } from 'express';
import Project from '../models/Project.js';
import { requireRole } from '../middleware/auth.js';
import { ah } from '../middleware/async.js';
import { projectFilter } from '../scope.js';

const r = Router();
const FIELDS = ['name', 'code', 'client', 'description', 'status', 'lead', 'members', 'startDate', 'endDate'];
const pick = (body) => Object.fromEntries(FIELDS.filter((k) => body?.[k] !== undefined).map((k) => [k, body[k]]));

r.get('/', ah(async (req, res) => {
  const filter = projectFilter(req.user);
  if (req.query.status) filter.status = req.query.status;
  res.json(await Project.find(filter).populate('lead', 'name').populate('members', 'name').sort({ status: 1, name: 1 }));
}));

r.post('/', requireRole('admin'), ah(async (req, res) => {
  const data = pick(req.body);
  if (!data.name || !data.code) return res.status(400).json({ error: 'Name and code are required' });
  if (await Project.exists({ code: String(data.code).toUpperCase() })) return res.status(409).json({ error: 'Project code already exists' });
  res.status(201).json(await Project.create(data));
}));

// Admin can edit any project; a lead can edit the projects they lead (but not reassign the lead).
r.put('/:id', requireRole('lead', 'admin'), ah(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const data = pick(req.body);
  if (req.user.role === 'lead') {
    if (String(project.lead) !== String(req.user._id)) return res.status(403).json({ error: 'You do not lead this project' });
    delete data.lead;
    delete data.code;
  }
  Object.assign(project, data);
  await project.save();
  res.json(project);
}));

export default r;
