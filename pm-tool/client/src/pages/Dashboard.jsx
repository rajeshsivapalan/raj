import { useEffect, useState } from 'react';
import { api, today } from '../api';

function Stat({ label, value, tone }) {
  return <div className={`stat ${tone || ''}`}><div className="stat-val">{value}</div><div className="muted">{label}</div></div>;
}

export default function Dashboard() {
  const [date, setDate] = useState(today());
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api(`/dashboard?date=${date}`).then(setD).catch((e) => setError(e.message)); }, [date]);

  if (error) return <div className="error">{error}</div>;
  if (!d) return <div className="center">Loading…</div>;
  const s = d.summary;
  const maxTrend = Math.max(1, ...d.trend.map((t) => t.hours));

  return (
    <div className="stack">
      <div className="row between">
        <h2>Team dashboard</h2>
        <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="stats">
        <Stat label="logged today" value={`${s.loggedCount}/${s.teamSize}`} tone={s.loggedCount < s.teamSize ? 'warn' : 'ok'} />
        <Stat label="hours today" value={s.hoursToday} />
        <Stat label="hours, last 7 days" value={s.hoursWeek} />
        <Stat label="blockers, last 7 days" value={s.openBlockers} tone={s.openBlockers ? 'bad' : 'ok'} />
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>Not logged yet ({d.notLogged.length})</h3>
          {d.notLogged.length === 0 ? <p className="muted">Everyone has logged for {d.date}.</p> : (
            <div className="chips">{d.notLogged.map((u) => <span key={u.id} className="chip warn">{u.name}</span>)}</div>
          )}
          <h3>Hours by person</h3>
          <table>
            <thead><tr><th>Name</th><th>Entries</th><th>Hours</th></tr></thead>
            <tbody>{d.byPerson.map((p) => (
              <tr key={p.id}><td>{p.name}<div className="muted small">{p.designation}</div></td><td>{p.entries}</td><td>{p.hours}</td></tr>
            ))}</tbody>
          </table>
        </section>

        <section className="card">
          <h3>Hours, last 7 days</h3>
          <div className="bars">
            {d.trend.map((t) => (
              <div key={t.date} className="bar-col" title={`${t.date}: ${t.hours} h`}>
                <div className="bar-val">{t.hours || ''}</div>
                <div className="bar" style={{ height: `${(t.hours / maxTrend) * 100}%` }} />
                <div className="bar-label">{t.date.slice(5)}</div>
              </div>
            ))}
          </div>
          <h3>Projects</h3>
          <table>
            <thead><tr><th>Project</th><th>Today</th><th>7 days</th><th>Blocked</th></tr></thead>
            <tbody>{d.byProject.map((p) => (
              <tr key={p.id}><td><span className="tag">{p.code}</span> {p.name}</td><td>{p.hoursToday}</td><td>{p.hoursWeek}</td><td>{p.blocked || '–'}</td></tr>
            ))}</tbody>
          </table>
        </section>
      </div>

      <section className="card">
        <h3>Blockers, last 7 days</h3>
        {d.blockers.length === 0 ? <p className="muted">No blockers reported.</p> : (
          <table>
            <thead><tr><th>Date</th><th>Who</th><th>Project</th><th>Task</th><th>Blocker</th></tr></thead>
            <tbody>{d.blockers.map((b) => (
              <tr key={b.id}><td>{b.date}</td><td>{b.user}</td><td><span className="tag">{b.project}</span></td><td>{b.task}</td><td className="blocker">{b.blocker}</td></tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </div>
  );
}
