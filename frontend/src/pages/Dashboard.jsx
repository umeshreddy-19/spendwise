import { useState, useEffect, useCallback } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import TransactionModal from '../components/TransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const { user } = useAuth();
  const currency = user?.currency || '₹';
  const now = new Date();

  const [monthly, setMonthly]       = useState([]);
  const [catData, setCatData]       = useState([]);
  const [recent, setRecent]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTxn, setEditTxn]       = useState(null);
  const [delId, setDelId]           = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, c, r] = await Promise.all([
        api.get(`/transactions/summary/monthly?year=${curYear}`),
        api.get(`/transactions/summary/categories?month=${curMonth}&year=${curYear}&type=expense`),
        api.get(`/transactions?month=${curMonth}&year=${curYear}&limit=7`),
      ]);
      setMonthly(m.data);
      setCatData(c.data);
      setRecent(r.data.transactions);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, [curMonth, curYear]);

  useEffect(() => { load(); }, [load]);

  const thisMonth = monthly.find(m => m.month === curMonth) || { income: 0, expense: 0 };
  const prevMonth = monthly.find(m => m.month === curMonth - 1) || { income: 0, expense: 0 };
  const balance   = thisMonth.income - thisMonth.expense;
  const savingsRate = thisMonth.income > 0 ? ((balance / thisMonth.income) * 100) : 0;

  const incomeTrend  = prevMonth.income  > 0 ? ((thisMonth.income  - prevMonth.income)  / prevMonth.income  * 100) : null;
  const expenseTrend = prevMonth.expense > 0 ? ((thisMonth.expense - prevMonth.expense) / prevMonth.expense * 100) : null;

  const fmt = n => `${currency}${Math.abs(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  // Bar chart data
  const barData = {
    labels: MONTH_NAMES,
    datasets: [
      { label:'Income',  data: monthly.map(m => m.income),  backgroundColor:'rgba(16,185,129,0.8)',  borderRadius:4, borderSkipped:false },
      { label:'Expense', data: monthly.map(m => m.expense), backgroundColor:'rgba(239,68,68,0.8)',   borderRadius:4, borderSkipped:false },
    ],
  };
  const barOpts = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: c => ` ${currency}${Number(c.raw).toLocaleString('en-IN')}` } } },
    scales:{
      x:{ grid:{ color:'rgba(255,255,255,0.04)' }, ticks:{ color:'#5a6080', font:{ size:11 } } },
      y:{ grid:{ color:'rgba(255,255,255,0.04)' }, ticks:{ color:'#5a6080', font:{ size:11 }, callback: v => currency+(v>=1000?(v/1000).toFixed(0)+'k':v) } },
    },
  };

  // Doughnut data
  const donutData = {
    labels: catData.slice(0,6).map(c => c.name),
    datasets:[{ data: catData.slice(0,6).map(c => parseFloat(c.total)), backgroundColor: catData.slice(0,6).map(c => c.color), borderWidth:0, hoverOffset:8 }],
  };
  const donutOpts = {
    responsive:true, maintainAspectRatio:false, cutout:'70%',
    plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: c => ` ${currency}${Number(c.raw).toLocaleString('en-IN')}` } } },
  };

  const handleSave = (txn, editing) => {
    if (editing) setRecent(r => r.map(t => t.id === txn.id ? txn : t));
    else setRecent(r => [txn, ...r].slice(0,7));
    load();
  };

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/transactions/${delId}`);
      setRecent(r => r.filter(t => t.id !== delId));
      toast.success('Deleted');
      setDelId(null);
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDelLoading(false); }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.75rem' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:600, marginBottom:4 }}>
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color:'var(--text2)', fontSize:14 }}>{format(now, 'EEEE, d MMMM yyyy')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTxn(null); setModalOpen(true); }}>
          <Plus size={16} /> Add transaction
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1rem' }}>
        <StatCard label="This month's income" value={fmt(thisMonth.income)}
          icon={<TrendingUp size={17} color="var(--green)" />} color="var(--green)"
          trend={incomeTrend} sub={`vs ${fmt(prevMonth.income)} last month`} />
        <StatCard label="This month's expenses" value={fmt(thisMonth.expense)}
          icon={<TrendingDown size={17} color="var(--red)" />} color="var(--red)"
          trend={expenseTrend !== null ? -expenseTrend : null} sub={`vs ${fmt(prevMonth.expense)} last month`} />
        <StatCard label="Net balance" value={(balance >= 0 ? '' : '-') + fmt(balance)}
          icon={<Wallet size={17} color="var(--accent2)" />} color="var(--accent)"
          sub={`Savings rate: ${savingsRate.toFixed(1)}%`} />
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr minmax(0,320px)', gap:'1.25rem', alignItems:'start' }}>
        {/* Bar chart */}
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
            <h2 style={{ fontSize:15, fontWeight:600 }}>{curYear} overview</h2>
            <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--text2)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:'rgba(16,185,129,0.8)', display:'inline-block' }} />Income</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:'rgba(239,68,68,0.8)', display:'inline-block' }} />Expense</span>
            </div>
          </div>
          <div style={{ height:240 }}>
            <Bar data={barData} options={barOpts} aria-label="Monthly income vs expense bar chart" />
          </div>
        </div>

        {/* Doughnut */}
        <div className="card">
          <h2 style={{ fontSize:15, fontWeight:600, marginBottom:'1.25rem' }}>Spending by category</h2>
          {catData.length > 0 ? (
            <>
              <div style={{ height:180, position:'relative' }}>
                <Doughnut data={donutData} options={donutOpts} aria-label="Expense breakdown by category donut chart" />
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Total</div>
                  <div style={{ fontSize:16, fontWeight:600 }}>{fmt(catData.reduce((s,c) => s+parseFloat(c.total),0))}</div>
                </div>
              </div>
              <div style={{ marginTop:'1rem', display:'flex', flexDirection:'column', gap:8 }}>
                {catData.slice(0,5).map(c => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:14 }}>{c.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                        <span style={{ color:'var(--text2)' }}>{c.name}</span>
                        <span style={{ fontWeight:500 }}>{fmt(c.total)}</span>
                      </div>
                      <div className="progress-wrap">
                        <div className="progress-bar" style={{ width:`${(parseFloat(c.total)/catData[0].total*100).toFixed(0)}%`, background:c.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty"><p>No expenses this month</p></div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h2 style={{ fontSize:15, fontWeight:600 }}>Recent transactions</h2>
          <a href="/transactions" style={{ fontSize:13, color:'var(--accent2)', display:'flex', alignItems:'center', gap:4 }}>
            View all <ArrowUpRight size={13} />
          </a>
        </div>
        {recent.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {recent.map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 8px', borderRadius:'var(--radius-sm)', cursor:'pointer', transition:'background var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ width:38, height:38, borderRadius:10, background:(t.category_color||'#6c63ff')+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>
                  {t.category_icon || '💰'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.description}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>{t.category_name} · {format(new Date(t.date), 'd MMM yyyy')}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <span style={{ fontSize:15, fontWeight:600, color: t.type==='income' ? 'var(--green)' : 'var(--red)' }}>
                    {t.type==='income' ? '+' : '−'}{fmt(t.amount)}
                  </span>
                  <button className="btn btn-icon btn-ghost btn-sm" style={{ width:28, height:28 }}
                    onClick={() => { setEditTxn(t); setModalOpen(true); }}
                    title="Edit">✏️</button>
                  <button className="btn btn-icon btn-sm" style={{ width:28, height:28, background:'rgba(239,68,68,0.08)', border:'none', borderRadius:6, cursor:'pointer' }}
                    onClick={() => setDelId(t.id)} title="Delete">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty"><p>No transactions this month</p>
            <button className="btn btn-ghost btn-sm" onClick={() => setModalOpen(true)}><Plus size={14} />Add first transaction</button>
          </div>
        )}
      </div>

      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTxn(null); }} onSave={handleSave} transaction={editTxn} />
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete} loading={delLoading} />
    </div>
  );
}
