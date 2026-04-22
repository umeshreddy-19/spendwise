import { X, Trash2 } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, loading, title = 'Delete transaction', message = 'This action cannot be undone.' }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal fade-up" style={{ maxWidth:380 }}>
        <div className="modal-header">
          <h3 style={{ fontSize:16, fontWeight:600 }}>{title}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="modal-body">
          <p style={{ color:'var(--text2)', fontSize:14, lineHeight:1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <div className="spinner" /> : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}