import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg)', padding:'1rem', position:'relative', overflow:'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position:'absolute', top:'-20%', left:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,133,255,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="fade-up" style={{ width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,var(--accent),#a78bfa)', marginBottom:'1rem', boxShadow:'0 8px 32px rgba(108,99,255,0.35)' }}>
            <TrendingUp size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:600, marginBottom:6 }}>Welcome back</h1>
          <p style={{ color:'var(--text2)', fontSize:14 }}>Sign in to your SpendWise account</p>
        </div>

        <div className="card" style={{ boxShadow:'var(--shadow)' }}>
          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position:'relative' }}>
                <Mail size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
                <input className="form-input" type="email" placeholder="you@example.com"
                  style={{ paddingLeft:38 }}
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
                <input className="form-input" type={show ? 'text' : 'password'} placeholder="••••••••"
                  style={{ paddingLeft:38, paddingRight:38 }}
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:4 }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop:4, padding:'12px', fontSize:15 }}>
              {loading ? <div className="spinner" /> : 'Sign in'}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:'1.5rem', fontSize:14, color:'var(--text2)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--accent2)', fontWeight:500 }}>Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
