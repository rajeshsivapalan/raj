import { useEffect, useState } from 'react';
import { api, today } from '../api';
import { useAuth } from '../auth';

const empty = () => ({ project: '', date: today(), hours: '', task: '', status: 'done', blocker: '' });

export default function MyDay() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(empty());
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const from = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
    const [p, l] = await Promise.all([api('/projects?status=active'), api(`/logs?from=${from}&user=${user.id}`)]);
    setProjects(p);
    setLogs(l.filter((x) => x.user?._id === user.id));
  };
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = { ...form, hours: Number(form.hours) };
      if (editing) await api(`/logs/${editing}`, { method: 'PUT', body });
      else await api('/logs', { method: 'POST', body });
      setForm({ ...empty(), project: form.project, date: form.date });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (l) => {
    setEditing(l._id);
    setForm({ project: l.project?._id, date: l.date, hours: l.hours, task: l.task, status: l.status, blocker: l.blocker || '' });
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try { await api(`/logs/${id}`, { method: 'DELETE' }); await load(); } catch (err) { setError(err.message); }
  };

  const byDate = logs.reduce((acc, l) => ((acc[l.date] ||= []).push(l), acc), {});
  const todayHours = (byDate[today()] || []).reduce((s, l) => s + l.hours, 0);

  return (
    <div className="grid-2">
      <section className="card">
        <h2>{editing ? 'Edit entry' : 'Log work'}</h2>
        <p className="muted">Today so far: <strong>{todayHours} h</strong></p>
        {projects.length === 0 ? (
          <p className="muted">You are not on any active project yet. Ask your lead to add you.</p>
        ) : (
          <form onSubmit={submit} className="stack">
            <label>Project
              <select value={form.project} onChange={set('project')} required>
                <option value="">Select…</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.code} · {p.name}</option>)}
              </select>
            </label>
            <div className="row">
              <label>Date<input type="date" value={form.date} max={today()} onChange={set('date')} required /></label>
              <label>Hours<input type="number" step="0.25" min="0.25" max="24" value={form.hours} onChange={set('hours')} required /></label>
              <label>Status
                <select value={form.status} onChange={set('status')}>
                  <option value="done">Done</option>
                  <option value="in-progress">In progress</option>
                  <option value="blocked">Blocked</option>
                </select>
              </label>
            </div>
            <label>What did you work on?<textarea rows="3" value={form.task} onChange={set('task')} required /></label>
            {form.status === 'blocked' && (
              <label>What is blocking you?<input value={form.blocker} onChange={set('blocker')} required /></label>
            )}
            {error && <div className="error">{error}</div>}
            <div className="row">
              <button>{editing ? 'Save changes' : 'Add entry'}</button>
              {editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(empty()); }}>Cancel</button>}
            </div>
          </form>
        )}
      </section>

      <section className="card">
        <h2>My last 14 days</h2>
        {Object.keys(byDate).length === 0 && <p className="muted">No entries yet.</p>}
        {Object.entries(byDate).map(([date, items]) => (
          <div key={date} className="day">
            <div className="day-head"><strong>{date}</strong><span>{items.reduce((s, l) => s + l.hours, 0)} h</span></div>
            {items.map((l) => (
              <div key={l._id} className="entry">
                <span className={`pill ${l.status}`}>{l.status}</span>
                <span className="tag">{l.project?.code}</span>
                <span className="grow">{l.task}{l.blocker && <em className="blocker"> · {l.blocker}</em>}</span>
                <span>{l.hours} h</span>
                <button className="link" onClick={() => edit(l)}>Edit</button>
                <button className="link danger" onClick={() => remove(l._id)}>Delete</button>
              </div>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
