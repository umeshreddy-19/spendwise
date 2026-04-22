import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import TransactionModal from '../components/TransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Transactions() {
  const { user } = useAuth();
  const currency = user?.currency || '₹';
  const now = new Date();

  const [txns, setTxns]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [cats, setCats]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTxn, setEditTxn]   = useState(null);
  const [delId, setDelId]       = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const [month, setMonth]   = useState(now.getMonth() + 1);
  const [year, setYear]     = useState(now.getFullYear());
  const [type, setType]     = useState('');
  const [catFilter, setCat] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(0);
  const PER_PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month, year, limit: PER_PAGE, offset: page * PER_PAGE });
      if (type) params.set('type', type);
      if (catFilter) params.set('category_id', catFilter);
      if (search.trim()) params.set('search', search.trim());
      const { data } = await api.get(`/transactions?${params}`);
      setTxns(data.transactions);
      setTotal(data.total);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [month, year, type, catFilter, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/categories').then(r => setCats(r.data)).catch(() => {}); }, []);

  const changeMonth = delta => {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    setMonth(m); setYear(y); setPage(0);
  };

  const handleSave = (txn, editing) => {
    if (editing) setTxns(t => t.map(x => x.id === txn.id ? txn : x));
    else { setTxns(t => [txn, ...t]); setTotal(n => n + 1); }
  };

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/transactions/${delId}`);
      setTxns(t => t.filter(x => x.id !== delId));
      setTotal(n => n - 1);
      toast.success('Deleted');
      setDelId(null);
    } catch { toast.error('Delete failed'); }
    finally { setDelLoading(false); }
  };

  const fmt = n => `${currency}${Math.abs(Number(n)||0).toLocaleString('en-IN', { maximumFractionDigits:0 })}`;
  const totalIncome  = txns.filter(t => t.type==='income').reduce((s,t) => s+parseFloat(t.amount),0);
  const totalExpense = txns.filter(t => t.type==='expense').reduce((s,t) => s+parseFloat(t.amount),0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:600, marginBottom:4 }}>Transactions</h1>
          <p style={{ color:'var(--text2)', fontSize:14 }}>{total} records found</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTxn(null); setModalOpen(true); }}>
          <Plus size={16} /> Add transaction
        </button>
      </div>

      {/* Month navigator + summary */}
      <div className="card" style={{ padding:'1rem 1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="btn btn-icon btn-ghost btn-sm" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></button>
            <span style={{ fontWeight:600, fontSize:15, minWidth:150, textAlign:'center' }}>
              {MONTHS[month-1]} {year}
            </span>
            <button className="btn btn-icon btn-ghost btn-sm" onClick={() => changeMonth(1)}><ChevronRight size={16} /></button>
          </div>
          <div style={{ display:'flex', gap:20 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>Income</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--green)' }}>+{fmt(totalIncome)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>Expenses</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--red)' }}>−{fmt(totalExpense)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>Balance</div>
              <div style={{ fontSize:15, fontWeight:600, color: totalIncome-totalExpense>=0 ? 'var(--green)' : 'var(--red)' }}>
                {totalIncome-totalExpense>=0?'+':'−'}{fmt(totalIncome-totalExpense)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1', minWidth:180 }}>
          <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text3)' }} />
          <input className="form-input" placeholder="Search transactions..." style={{ paddingLeft:34 }}
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <select className="form-input" style={{ width:'auto', minWidth:130 }} value={type} onChange={e => { setType(e.target.value); setPage(0); }}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className="form-input" style={{ width:'auto', minWidth:150 }} value={catFilter} onChange={e => { setCat(e.target.value); setPage(0); }}>
          <option value="">All categories</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem' }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : txns.length === 0 ? (
          <div className="empty">
            <p>No transactions found</p>
            <button className="btn btn-ghost btn-sm" onClick={() => { setEditTxn(null); setModalOpen(true); }}>
              <Plus size={14} /> Add first transaction
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th style={{ textAlign:'right' }}>Amount</th>
                    <th style={{ textAlign:'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight:500, color:'var(--text)' }}>{t.description}</div>
                        {t.notes && <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{t.notes}</div>}
                      </td>
                      <td>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                          <span style={{ width:26, height:26, borderRadius:7, background:(t.category_color||'#888')+'22', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
                            {t.category_icon||'💰'}
                          </span>
                          <span style={{ fontSize:13, color:'var(--text2)' }}>{t.category_name||'—'}</span>
                        </span>
                      </td>
                      <td style={{ color:'var(--text2)', fontSize:13 }}>{format(new Date(t.date),'d MMM yyyy')}</td>
                      <td>
                        <span className="badge" style={{ background: t.type==='income' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: t.type==='income' ? 'var(--green)' : 'var(--red)', fontSize:12 }}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ textAlign:'right', fontWeight:600, fontSize:15, color: t.type==='income' ? 'var(--green)' : 'var(--red)' }}>
                        {t.type==='income' ? '+' : '−'}{fmt(t.amount)}
                      </td>
                      <td style={{ textAlign:'right' }}>
                        <div style={{ display:'inline-flex', gap:6 }}>
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => { setEditTxn(t); setModalOpen(true); }} title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-icon btn-danger btn-sm" onClick={() => setDelId(t.id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {total > PER_PAGE && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', borderTop:'1px solid var(--border)' }}>
                <span style={{ fontSize:13, color:'var(--text3)' }}>
                  Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} of {total}
                </span>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PER_PAGE >= total}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTxn(null); }} onSave={handleSave} transaction={editTxn} />
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete} loading={delLoading} />
    </div>
  );
}
