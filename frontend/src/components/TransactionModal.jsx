import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function TransactionModal({ open, onClose, onSave, transaction }) {
  const { user } = useAuth();
  const currency = user?.currency || '₹';
  const editing = !!transaction;

  const blank = { type:'expense', amount:'', description:'', notes:'', date: new Date().toISOString().split('T')[0], category_id:'' };
  const [form, setForm] = useState(blank);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        notes: transaction.notes || '',
        date: transaction.date?.split('T')[0] || transaction.date,
        category_id: transaction.category_id || '',
      });
    } else {
      setForm(blank);
    }
  }, [open, transaction]);

  const filteredCats = categories.filter(c => c.type === form.type);

  const setField = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === 'type') next.category_id = '';
    return next;
  });

  const handle = async e => {
    e.preventDefault();
    if (!form.category_id) { toast.error('Please select a category'); return; }
    setLoading(true);
    try {
      let result;
      if (editing) {
        const { data } = await api.put(`/transactions/${transaction.id}`, { ...form, amount: parseFloat(form.amount) });
        result = data;
        toast.success('Transaction updated');
      } else {
        const { data } = await api.post('/transactions', { ...form, amount: parseFloat(form.amount) });
        result = data;
        toast.success('Transaction added');
      }
      onSave(result, editing);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to save');
    } finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal fade-up">
        <div className="modal-header">
          <h3 style={{ fontSize:17, fontWeight:600 }}>{editing ? 'Edit transaction' : 'Add transaction'}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handle}>
          <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {/* Type toggle */}
            <div className="type-toggle">
              <button type="button" className={`type-btn ${form.type==='income' ? 'active income' : ''}`} onClick={() => setField('type','income')}>+ Income</button>
              <button type="button" className={`type-btn ${form.type==='expense' ? 'active expense' : ''}`} onClick={() => setField('type','expense')}>− Expense</button>
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <input className="form-input" placeholder="e.g. Salary, Coffee, Rent..." value={form.description}
                onChange={e => setField('description', e.target.value)} required />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Amount ({currency}) *</label>
                <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount}
                  onChange={e => setField('amount', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date}
                  onChange={e => setField('date', e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-input" value={form.category_id} onChange={e => setField('category_id', e.target.value)} required>
                <option value="">Select category</option>
                {filteredCats.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-input" rows={2} placeholder="Any additional notes..."
                style={{ resize:'none' }} value={form.notes}
                onChange={e => setField('notes', e.target.value)} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" /> : editing ? 'Save changes' : 'Add transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
