import { useState, useEffect, useCallback } from 'react';
import { Plus, Target, Pencil, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function BudgetModal({ open, onClose, onSave, categories }) {
  const { user } = useAuth();
  const currency = user?.currency || '₹';
  const now = new Date();
  const [form, setForm] = useState({ category_id:'', amount:'', month: now.getMonth()+1, year: now.getFullYear() });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!open) setForm({ category_id:'', amount:'', month: now.getMonth()+1, year: now.getFullYear() }); }, [open]);

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/budgets', { ...form, amount: parseFloat(form.amount) });
      toast.success('Budget saved');
      onSave(data);
      onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  const expCats = categories.filter(c => c.type === 'expense');

  return (
    <div className="modal-overlay" onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div className="modal fade-up" style={{ maxWidth:400 }}>
        <div className="modal-header">
          <h3 style={{ fontSize:17, fontWeight:600 }}>Set budget</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handle}>
          <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-input" value={form.category_id} onChange={e => setForm(f=>({...f, category_id:e.target.value}))} required>
                <option value="">Select category</option>
                {expCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Monthly budget ({currency}) *</label>
              <input className="form-input" type="number" min="1" step="1" placeholder="0"
                value={form.amount} onChange={e => setForm(f=>({...f, amount:e.target.value}))} required />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Month</label>
                <select className="form-input" value={form.month} onChange={e => setForm(f=>({...f, month:parseInt(e.target.value)}))}>
                  {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-input" type="number" value={form.year} onChange={e => setForm(f=>({...f, year:parseInt(e.target.value)}))} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Save budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Budget() {
  const { user } = useAuth();
  const currency = user?.currency || '₹';
  const now = new Date();

  const [budgets, setBudgets]   = useState([]);
  const [cats, setCats]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [month, setMonth]       = useState(now.getMonth()+1);
  const [year, setYear]         = useState(now.getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/budgets?month=${month}&year=${year}`);
      setBudgets(data);
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/categories').then(r => setCats(r.data)).catch(()=>{}); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      setBudgets(b => b.filter(x => x.id !== id));
      toast.success('Budget removed');
    } catch { toast.error('Delete failed'); }
  };

  const fmt = n => `${currency}${Math.abs(Number(n)||0).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
  const totalBudget = budgets.reduce((s,b) => s+parseFloat(b.amount),0);
  const totalSpent  = budgets.reduce((s,b) => s+parseFloat(b.spent||0),0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:600, marginBottom:4 }}>Budget</h1>
          <p style={{ color:'var(--text2)', fontSize:14 }}>Set monthly spending limits per category</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Set budget
        </button>
      </div>

      {/* Month selector */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <select className="form-input" style={{ width:'auto' }} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
          {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="form-input" style={{ width:'auto' }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="card" style={{ background:'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(139,133,255,0.08))', border:'1px solid rgba(108,99,255,0.25)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:4 }}>Total budget utilization</div>
              <div style={{ fontSize:22, fontWeight:600 }}>{fmt(totalSpent)} <span style={{ fontSize:15, color:'var(--text2)', fontWeight:400 }}>/ {fmt(totalBudget)}</span></div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:26, fontWeight:700, color: totalSpent/totalBudget > 0.9 ? 'var(--red)' : totalSpent/totalBudget > 0.7 ? 'var(--amber)' : 'var(--green)' }}>
                {totalBudget > 0 ? ((totalSpent/totalBudget)*100).toFixed(0) : 0}%
              </div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>used</div>
            </div>
          </div>
          <div className="progress-wrap" style={{ height:8 }}>
            <div className="progress-bar" style={{
              width:`${Math.min(100, totalBudget>0?(totalSpent/totalBudget*100):0).toFixed(0)}%`,
              background: totalSpent/totalBudget > 0.9 ? 'var(--red)' : totalSpent/totalBudget > 0.7 ? 'var(--amber)' : 'var(--green)',
            }} />
          </div>
        </div>
      )}

      {/* Budget list */}
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <div className="empty">
            <Target size={40} />
            <p>No budgets set for {MONTHS[month-1]} {year}</p>
            <button className="btn btn-ghost btn-sm" onClick={() => setModalOpen(true)}>
              <Plus size={14} /> Set your first budget
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
          {budgets.map(b => {
            const pct = Math.min(100, parseFloat(b.amount) > 0 ? (parseFloat(b.spent)/parseFloat(b.amount)*100) : 0);
            const overBudget = parseFloat(b.spent) > parseFloat(b.amount);
            const barColor = pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--amber)' : b.color || 'var(--green)';
            return (
              <div key={b.id} className="card" style={{ position:'relative' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:(b.color||'#6c63ff')+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                      {b.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:15 }}>{b.name}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>
                        {overBudget ? <span style={{ color:'var(--red)' }}>Over budget!</span> : `${(100-pct).toFixed(0)}% remaining`}
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-icon btn-ghost btn-sm" style={{ width:28, height:28 }} onClick={() => handleDelete(b.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                  <span style={{ color:'var(--text2)' }}>Spent: <strong style={{ color: overBudget ? 'var(--red)' : 'var(--text)' }}>{fmt(b.spent)}</strong></span>
                  <span style={{ color:'var(--text3)' }}>of {fmt(b.amount)}</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-bar" style={{ width:`${pct.toFixed(0)}%`, background:barColor }} />
                </div>
                <div style={{ textAlign:'right', fontSize:12, color: barColor, marginTop:4, fontWeight:500 }}>
                  {pct.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BudgetModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={b => setBudgets(prev => { const idx=prev.findIndex(x=>x.id===b.id); if(idx>=0){const n=[...prev];n[idx]={...n[idx],...b};return n;}return [...prev,b]; })} categories={cats} />
    </div>
  );
}
