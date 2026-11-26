import { Router } from 'express';
import WorkLog from '../models/WorkLog.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { requireRole } from '../middleware/auth.js';
import { ah } from '../middleware/async.js';
import { managedProjectIds, today } from '../scope.js';

const r = Router();

const shift = (date, days) => new Date(Date.parse(date) + days * 86400000).toISOString().slice(0, 10);

// GET /api/dashboard?date=YYYY-MM-DD  (lead: projects they lead; admin: everything)
r.get('/', requireRole('lead', 'admin'), ah(async (req, res) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : today();
  const weekStart = shift(date, -6);
  const managed = await managedProjectIds(req.user);
  const projectScope = managed ? { _id: { $in: managed } } : {};
  const logScope = managed ? { project: { $in: managed } } : {};

  const projects = await Project.find({ ...projectScope, status: 'active' }).select('name code lead members');

  // People expected to log: members of in-scope active projects (admin: all active non-admins).
  let team;
  if (managed) {
    const ids = [...new Set(projects.flatMap((p) => p.members.map(String)))];
    team = await User.find({ _id: { $in: ids }, active: true }).select('name designation');
  } else {
    team = await User.find({ active: true, role: { $ne: 'admin' } }).select('name designation');
  }

  const weekLogs = await WorkLog.find({ ...logScope, date: { $gte: weekStart, $lte: date } })
    .populate('user', 'name')
    .populate('project', 'name code');
  const dayLogs = weekLogs.filter((l) => l.date === date);

  const sum = (arr) => Math.round(arr.reduce((s, l) => s + l.hours, 0) * 100) / 100;
  const loggedToday = new Set(dayLogs.map((l) => String(l.user?._id)));

  const byPerson = team
    .map((u) => {
      const mine = dayLogs.filter((l) => String(l.user?._id) === String(u._id));
      return { id: u._id, name: u.name, designation: u.designation, hours: sum(mine), entries: mine.length };
    })
    .sort((a, b) => b.hours - a.hours);

  const byProject = projects
    .map((p) => {
      const pl = weekLogs.filter((l) => String(l.project?._id) === String(p._id));
      return {
        id: p._id,
        name: p.name,
        code: p.code,
        hoursToday: sum(pl.filter((l) => l.date === date)),
        hoursWeek: sum(pl),
        blocked: pl.filter((l) => l.status === 'blocked').length,
      };
    })
    .sort((a, b) => b.hoursWeek - a.hoursWeek);

  const trend = Array.from({ length: 7 }, (_, i) => {
    const d = shift(weekStart, i);
    return { date: d, hours: sum(weekLogs.filter((l) => l.date === d)) };
  });

  const blockers = weekLogs
    .filter((l) => l.status === 'blocked')
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((l) => ({ id: l._id, date: l.date, user: l.user?.name, project: l.project?.code, task: l.task, blocker: l.blocker }));

  res.json({
    date,
    summary: {
      teamSize: team.length,
      loggedCount: team.filter((u) => loggedToday.has(String(u._id))).length,
      hoursToday: sum(dayLogs),
      hoursWeek: sum(weekLogs),
      openBlockers: blockers.length,
    },
    notLogged: team.filter((u) => !loggedToday.has(String(u._id))).map((u) => ({ id: u._id, name: u.name })),
    byPerson,
    byProject,
    trend,
    blockers,
  });
}));

export default r;
