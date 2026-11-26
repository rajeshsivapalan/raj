import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Login from './pages/Login';
import MyDay from './pages/MyDay';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Team from './pages/Team';
import TeamLogs from './pages/TeamLogs';

function Shell({ children }) {
  const { user, logout } = useAuth();
  const isManager = user.role !== 'employee';
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">BTPL <span>Work Tracker</span></div>
        <nav>
          {isManager && <NavLink to="/dashboard">Dashboard</NavLink>}
          <NavLink to="/my-day">My Day</NavLink>
          {isManager && <NavLink to="/logs">Team Logs</NavLink>}
          <NavLink to="/projects">Projects</NavLink>
          {user.role === 'admin' && <NavLink to="/team">People</NavLink>}
        </nav>
        <div className="me">
          <span>{user.name} · <em>{user.role}</em></span>
          <button className="link" onClick={logout}>Sign out</button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function Guard({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/my-day" replace />;
  return <Shell>{children}</Shell>;
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="center">Loading…</div>;
  const home = user ? (user.role === 'employee' ? '/my-day' : '/dashboard') : '/login';
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={home} replace /> : <Login />} />
      <Route path="/my-day" element={<Guard><MyDay /></Guard>} />
      <Route path="/projects" element={<Guard><Projects /></Guard>} />
      <Route path="/dashboard" element={<Guard roles={['lead', 'admin']}><Dashboard /></Guard>} />
      <Route path="/logs" element={<Guard roles={['lead', 'admin']}><TeamLogs /></Guard>} />
      <Route path="/team" element={<Guard roles={['admin']}><Team /></Guard>} />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}
