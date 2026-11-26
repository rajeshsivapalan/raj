import { useEffect, useState } from 'react';
import { api } from '../api';

const blank = { name: '', email: '', password: '', role: 'employee', designation: '' };

export default function Team() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  const load = () => api('/users').then(setUsers);
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try { await api('/users', { method: 'POST', body: form }); setForm(blank); load(); } catch (err) { setError(err.message); }
  };
  const update = async (u, patch) => {
    try { await api(`/users/${u._id}`, { method: 'PUT', body: patch }); load(); } catch (err) { setError(err.message); }
  };
  const resetPassword = (u) => {
    const pw = window.prompt(`New password for ${u.name} (min 8 characters)`);
    if (pw && pw.length >= 8) update(u, { password: pw });
  };

  return (
    <div className="stack">
      <h2>People</h2>
      <form className="card row wrap" onSubmit={add}>
        <label>Name<input value={form.name} onChange={set('name')} required /></label>
        <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
        <label>Temp password<input value={form.password} onChange={set('password')} minLength={8} required /></label>
        <label>Designation<input value={form.designation} onChange={set('designation')} /></label>
        <label>Role<select value={form.role} onChange={set('role')}><option value="employee">Employee</option><option value="lead">Lead</option><option value="admin">Admin</option></select></label>
        <button>Add person</button>
      </form>
      {error && <div className="error">{error}</div>}
      <section className="card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u._id} className={u.active ? '' : 'inactive'}>
              <td>{u.name}<div className="muted small">{u.designation}</div></td>
              <td>{u.email}</td>
              <td><select value={u.role} onChange={(e) => update(u, { role: e.target.value })}><option value="employee">Employee</option><option value="lead">Lead</option><option value="admin">Admin</option></select></td>
              <td>{u.active ? 'Active' : 'Inactive'}</td>
              <td className="nowrap">
                <button className="link" onClick={() => update(u, { active: !u.active })}>{u.active ? 'Deactivate' : 'Reactivate'}</button>
                <button className="link" onClick={() => resetPassword(u)}>Reset password</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </section>
    </div>
  );
}
