import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg)', padding:'1rem', position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:'-15%', right:'-15%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(108,99,255,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-15%', left:'-15%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="fade-up" style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,var(--accent),#a78bfa)', marginBottom:'1rem', boxShadow:'0 8px 32px rgba(108,99,255,0.35)' }}>
            <TrendingUp size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:600, marginBottom:6 }}>Create account</h1>
          <p style={{ color:'var(--text2)', fontSize:14 }}>Start tracking your finances today</p>
        </div>

        <div className="card" style={{ boxShadow:'var(--shadow)' }}>
          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <div style={{ position:'relative' }}>
                <User size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
                <input className="form-input" type="text" placeholder="John Doe" style={{ paddingLeft:38 }}
                  value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div style={{ position:'relative' }}>
                <Mail size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
                <input className="form-input" type="email" placeholder="you@example.com" style={{ paddingLeft:38 }}
                  value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
                <input className="form-input" type={show ? 'text' : 'password'} placeholder="Min. 6 characters"
                  style={{ paddingLeft:38, paddingRight:38 }}
                  value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:4 }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop:4, padding:'12px', fontSize:15 }}>
              {loading ? <div className="spinner" /> : 'Create account'}
            </button>
          </form>
          <div style={{ textAlign:'center', marginTop:'1.5rem', fontSize:14, color:'var(--text2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--accent2)', fontWeight:500 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
