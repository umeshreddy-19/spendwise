import { useState, useEffect } from 'react';
import { User, Tag, Plus, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CURRENCIES = ['₹', '$', '€', '£', '¥', '₩', '₺', 'A$', 'C$', 'CHF'];
const COLORS = ['#10b981','#ef4444','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#64748b','#6c63ff','#14b8a6'];
const EMOJIS = ['🍔','🚌','🏠','💊','🛍️','🎬','📚','💡','📦','✈️','🎮','☕','🍺','💰','📈','💼','💻','🎁','➕','🏋️','🎵','🐾','👶','💅'];

function CategoryModal({ open, onClose, onSave, type }) {
  const [form, setForm] = useState({ name:'', icon:'📦', color:'#10b981', type: type||'expense' });
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (!open) setForm({ name:'', icon:'📦', color:'#10b981', type: type||'expense' }); }, [open, type]);

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/categories', form);
      toast.success('Category created');
      onSave(data); onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div className="modal fade-up" style={{ maxWidth:400 }}>
        <div className="modal-header">
          <h3 style={{ fontSize:17, fontWeight:600 }}>New category</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handle}>
          <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div className="type-toggle">
              <button type="button" className={`type-btn ${form.type==='income'?'active income':''}`} onClick={()=>setForm(f=>({...f,type:'income'}))}>Income</button>
              <button type="button" className={`type-btn ${form.type==='expense'?'active expense':''}`} onClick={()=>setForm(f=>({...f,type:'expense'}))}>Expense</button>
            </div>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" placeholder="Category name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Icon</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {EMOJIS.map(em => (
                  <button type="button" key={em} onClick={()=>setForm(f=>({...f,icon:em}))}
                    style={{ width:36, height:36, fontSize:18, borderRadius:8, border: form.icon===em?'2px solid var(--accent)':'1px solid var(--border2)', background: form.icon===em?'var(--bg4)':'var(--bg3)', cursor:'pointer' }}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {COLORS.map(c => (
                  <button type="button" key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                    style={{ width:28, height:28, borderRadius:'50%', background:c, border: form.color===c?'3px solid #fff':'2px solid transparent', cursor:'pointer', outline: form.color===c?'2px solid var(--accent)':'none' }} />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name||'', currency: user?.currency||'₹' });
  const [cats, setCats] = useState([]);
  const [saving, setSaving] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [tab, setTab] = useState('profile');

  useEffect(() => { api.get('/categories').then(r => setCats(r.data)).catch(()=>{}); }, []);

  const saveProfile = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await api.patch('/auth/me', profile);
      updateUser(data); toast.success('Profile updated');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const deleteCategory = async id => {
    if (!confirm('Delete this category? Existing transactions will lose category info.')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCats(c => c.filter(x => x.id !== id)); toast.success('Deleted');
    } catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  const incCats = cats.filter(c => c.type==='income');
  const expCats = cats.filter(c => c.type==='expense');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem', maxWidth:720 }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:600, marginBottom:4 }}>Settings</h1>
        <p style={{ color:'var(--text2)', fontSize:14 }}>Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:4, width:'fit-content', border:'1px solid var(--border)' }}>
        {[['profile','Profile'],['categories','Categories']].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} className="btn btn-sm" style={{
            background: tab===k ? 'var(--bg4)' : 'transparent',
            border: 'none', color: tab===k ? 'var(--text)' : 'var(--text3)', fontWeight: tab===k?500:400,
          }}>{l}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ maxWidth:480 }}>
          <h2 style={{ fontSize:16, fontWeight:600, marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:8 }}>
            <User size={17} color="var(--accent2)" /> Profile settings
          </h2>
          <form onSubmit={saveProfile} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Display name</label>
              <input className="form-input" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email||''} disabled style={{ opacity:0.5, cursor:'not-allowed' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Currency symbol</label>
              <select className="form-input" value={profile.currency} onChange={e=>setProfile(p=>({...p,currency:e.target.value}))}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Shown throughout the app</span>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf:'flex-start' }}>
              {saving ? <div className="spinner" /> : 'Save changes'}
            </button>
          </form>
        </div>
      )}

      {tab === 'categories' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setCatModal(true)}>
              <Plus size={14} /> New category
            </button>
          </div>
          {[['expense','Expense categories',expCats],['income','Income categories',incCats]].map(([type,label,list]) => (
            <div key={type} className="card">
              <h2 style={{ fontSize:15, fontWeight:600, marginBottom:'1rem', display:'flex', alignItems:'center', gap:8 }}>
                <Tag size={16} color="var(--accent2)" /> {label}
              </h2>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {list.map(c => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 8px', borderRadius:'var(--radius-sm)', transition:'background var(--transition)' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{ width:34, height:34, borderRadius:9, background:c.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>{c.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:500 }}>{c.name}</div>
                      {c.is_default && <div style={{ fontSize:11, color:'var(--text3)' }}>Default</div>}
                    </div>
                    <div style={{ width:14, height:14, borderRadius:'50%', background:c.color, flexShrink:0 }} />
                    {!c.is_default && (
                      <button className="btn btn-icon btn-danger btn-sm" style={{ width:28, height:28 }} onClick={() => deleteCategory(c.id)}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
                {list.length === 0 && <p style={{ color:'var(--text3)', fontSize:13, padding:'0.5rem 0' }}>No {type} categories yet</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryModal open={catModal} onClose={() => setCatModal(false)} onSave={c => setCats(prev => [...prev, c])} type="expense" />
    </div>
  );
}