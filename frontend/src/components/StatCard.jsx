export default function StatCard({ label, value, sub, icon, color = 'var(--accent)', trend, style = {} }) {
  return (
    <div className="card fade-up" style={{ position:'relative', overflow:'hidden', ...style }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:color, opacity:0.08 }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1rem' }}>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--text2)' }}>{label}</div>
        {icon && (
          <div style={{ width:36, height:36, borderRadius:10, background:color+'22', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ fontSize:26, fontWeight:600, color:'var(--text)', fontFamily:'var(--font-display)', marginBottom:4 }}>
        {value}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {sub && <span style={{ fontSize:13, color:'var(--text3)' }}>{sub}</span>}
        {trend !== undefined && (
          <span style={{ fontSize:12, fontWeight:500, color: trend >= 0 ? 'var(--green)' : 'var(--red)', background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding:'2px 8px', borderRadius:20 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
