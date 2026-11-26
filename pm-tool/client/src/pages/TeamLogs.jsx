import { useEffect, useState } from 'react';
import { api, today } from '../api';

const weekAgo = () => new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

export default function TeamLogs() {
  const [filters, setFilters] = useState({ from: weekAgo(), to: today(), user: '', project: '' });
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api('/users').then(setUsers).catch(() => {});
    api('/projects').then(setProjects).catch(() => {});
  }, []);
  useEffect(() => {
    const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    api(`/logs?${q}`).then(setLogs).catch(() => setLogs([]));
  }, [filters]);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const total = logs.reduce((s, l) => s + l.hours, 0);

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Date', 'Employee', 'Project', 'Hours', 'Status', 'Task', 'Blocker'],
      ...logs.map((l) => [l.date, l.user?.name, l.project?.code, l.hours, l.status, l.task, l.blocker])];
    const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `work-logs_${filters.from}_${filters.to}.csv` });
    a.click();
  };

  return (
    <section className="card">
      <div className="row between"><h2>Team logs</h2><button className="secondary" onClick={exportCsv} disabled={!logs.length}>Export CSV</button></div>
      <div className="row filters">
        <label>From<input type="date" value={filters.from} onChange={set('from')} /></label>
        <label>To<input type="date" value={filters.to} onChange={set('to')} /></label>
        <label>Person<select value={filters.user} onChange={set('user')}><option value="">Everyone</option>{users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}</select></label>
        <label>Project<select value={filters.project} onChange={set('project')}><option value="">All</option>{projects.map((p) => <option key={p._id} value={p._id}>{p.code}</option>)}</select></label>
      </div>
      <p className="muted">{logs.length} entries · {total} h</p>
      <table>
        <thead><tr><th>Date</th><th>Who</th><th>Project</th><th>Hours</th><th>Status</th><th>Task</th></tr></thead>
        <tbody>{logs.map((l) => (
          <tr key={l._id}><td>{l.date}</td><td>{l.user?.name}</td><td><span className="tag">{l.project?.code}</span></td><td>{l.hours}</td>
            <td><span className={`pill ${l.status}`}>{l.status}</span></td><td>{l.task}{l.blocker && <div className="blocker small">{l.blocker}</div>}</td></tr>
        ))}</tbody>
      </table>
    </section>
  );
}
