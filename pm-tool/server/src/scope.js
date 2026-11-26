import Project from './models/Project.js';

// Which projects a user may see: admin = all, lead = led or member, employee = member.
export function projectFilter(user) {
  if (user.role === 'admin') return {};
  if (user.role === 'lead') return { $or: [{ lead: user._id }, { members: user._id }] };
  return { members: user._id };
}

export async function visibleProjectIds(user) {
  const projects = await Project.find(projectFilter(user)).select('_id');
  return projects.map((p) => p._id);
}

// Which projects a user manages (can see everyone's logs on): admin = all, lead = led.
export async function managedProjectIds(user) {
  if (user.role === 'admin') return null; // null = no restriction
  if (user.role === 'lead') return (await Project.find({ lead: user._id }).select('_id')).map((p) => p._id);
  return [];
}

// "Today" in the company's time zone (default India), so late-evening entries land on the right day.
export const today = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: process.env.APP_TZ || 'Asia/Kolkata' }).format(new Date());

export function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}
