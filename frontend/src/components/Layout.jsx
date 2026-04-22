import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ArrowLeftRight, Target, Settings, LogOut, TrendingUp, Menu, X } from 'lucide-react';
import { useState } from 'react';

const nav = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions',icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/budget',      icon: Target,          label: 'Budget' },
  { to: '/settings',    icon: Settings,        label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'U';

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {/* Mobile overlay */}
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:49, backdropFilter:'blur(2px)' }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: open ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease',
      }} className="sidebar">
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 0.5rem', marginBottom:'2.5rem' }}>
          <div style={{
            width:36, height:36, borderRadius:10, background:'var(--accent)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <TrendingUp size={18} color="#fff" />
          </div>
          <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:600, color:'var(--text)' }}>
            SpendWise
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to==='/'} onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
                borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:500,
                color: isActive ? 'var(--text)' : 'var(--text3)',
                background: isActive ? 'var(--bg4)' : 'transparent',
                transition: 'var(--transition)', textDecoration:'none',
              })}>
              {({ isActive }) => (
                <>
                  <Icon size={17} color={isActive ? 'var(--accent2)' : 'currentColor'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),#a78bfa)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, color:'#fff', flexShrink:0,
          }}>{initials}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize:11, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-icon btn-ghost" title="Logout" style={{ flexShrink:0 }}>
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, marginLeft:240, display:'flex', flexDirection:'column', minWidth:0 }} className="main-wrap">
        {/* Mobile topbar */}
        <div style={{
          display:'none', alignItems:'center', justifyContent:'space-between',
          padding:'1rem 1.25rem', background:'var(--bg2)', borderBottom:'1px solid var(--border)',
          position:'sticky', top:0, zIndex:40,
        }} className="mobile-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <TrendingUp size={18} color="var(--accent)" />
            <span style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:600 }}>SpendWise</span>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={() => setOpen(o => !o)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <main style={{ flex:1, padding:'2rem', maxWidth:1200, width:'100%', margin:'0 auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0) !important; }
          .main-wrap { margin-left: 0 !important; }
          .mobile-topbar { display: flex !important; }
          main { padding: 1.25rem !important; }
        }
      `}</style>
    </div>
  );
}
