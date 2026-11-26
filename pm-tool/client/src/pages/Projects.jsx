import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';

const blank = { name: '', code: '', client: '', description: '', status: 'active', lead: '', members: [] };

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null); // null = closed, {} = editing
  const [error, setError] = useState('');
  const canManage = user.role !== 'employee';

  const load = () => api('/projects').then(setProjects);
  useEffect(() => {
    load();
    if (canManage) api('/users').then((u) => setUsers(u.filter((x) => x.active)));
  }, []);

  const canEdit = (p) => user.role === 'admin' || (user.role === 'lead' && p.lead?._id === user.id);
  const open = (p) => {
    setError('');
    setForm(p ? { ...p, lead: p.lead?._id || '', members: p.members.map((m) => m._id) } : { ...blank });
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleMember = (id) =>
    setForm({ ...form, members: form.members.includes(id) ? form.members.filter((m) => m !== id) : [...form.members, id] });

  const save = async (e) => {
    e.preventDefault();
    try {
      const body = { name: form.name, code: form.code, client: form.client, description: form.description, status: form.status, members: form.members, lead: form.lead || undefined };
      if (form._id) await api(`/projects/${form._id}`, { method: 'PUT', body });
      else await api('/projects', { method: 'POST', body });
      setForm(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <div className="row between">
        <h2>Projects</h2>
        {user.role === 'admin' && <button onClick={() => open(null)}>New project</button>}
      </div>

      {form && (
        <form className="card stack" onSubmit={save}>
          <h3>{form._id ? `Edit ${form.code}` : 'New project'}</h3>
          <div className="row">
            <label className="grow">Name<input value={form.name} onChange={set('name')} required /></label>
            <label>Code<input value={form.code} onChange={set('code')} required disabled={!!form._id && user.role !== 'admin'} /></label>
            <label>Status<select value={form.status} onChange={set('status')}><option value="active">Active</option><option value="on-hold">On hold</option><option value="completed">Completed</option></select></label>
          </div>
          <div className="row">
            <label className="grow">Client<input value={form.client || ''} onChange={set('client')} /></label>
            {user.role === 'admin' && (
              <label className="grow">Lead<select value={form.lead} onChange={set('lead')}><option value="">None</option>
                {users.filter((u) => u.role !== 'employee').map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}</select></label>
            )}
          </div>
          <label>Description<textarea rows="2" value={form.description || ''} onChange={set('description')} /></label>
          <div>
            <div className="label">Members</div>
            <div className="chips">
              {users.map((u) => (
                <label key={u._id} className={`chip selectable ${form.members.includes(u._id) ? 'on' : ''}`}>
                  <input type="checkbox" checked={form.members.includes(u._id)} onChange={() => toggleMember(u._id)} /> {u.name}
                </label>
              ))}
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <div className="row"><button>Save</button><button type="button" className="secondary" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}

      <div className="cards">
        {projects.length === 0 && <p className="muted">No projects yet.</p>}
        {projects.map((p) => (
          <div key={p._id} className="card project">
            <div className="row between">
              <span className="tag">{p.code}</span>
              <span className={`pill ${p.status}`}>{p.status}</span>
            </div>
            <h3>{p.name}</h3>
            {p.client && <div className="muted small">Client: {p.client}</div>}
            {p.description && <p>{p.description}</p>}
            <div className="small">Lead: {p.lead?.name || '–'}</div>
            <div className="small muted">{p.members.length} member(s): {p.members.map((m) => m.name).join(', ')}</div>
            {canEdit(p) && <button className="link" onClick={() => open(p)}>Edit</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
