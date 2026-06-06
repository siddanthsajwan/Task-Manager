const metrics = [
  { label: 'STATUS',     value: 'ONLINE',    accent: '#10b981' },
  { label: 'ENGINE',     value: 'REACT 18',  accent: '#06b6d4' },
  { label: 'STORAGE',    value: 'JSON FILE', accent: '#a78bfa' },
  { label: 'API',        value: 'EXPRESS',   accent: '#06b6d4' },
  { label: 'TASKS',      value: 'PERSISTED', accent: '#10b981' },
  { label: 'STYLE',      value: 'TAILWIND',  accent: '#a78bfa' },
  { label: 'BUILD',      value: 'VITE 5',    accent: '#06b6d4' },
  { label: 'VERSION',    value: 'v1.0.0',    accent: '#10b981' },
];

function TickerItem({ label, value, accent }) {
  return (
    <span className="inline-flex items-center gap-3 px-8">
      <span style={{
        fontFamily: 'monospace',
        fontSize: '0.6rem',
        letterSpacing: '0.2em',
        color: '#52525b',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        letterSpacing: '0.1em',
        color: accent,
        fontWeight: 600,
      }}>
        {value}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.06)', fontSize: '0.7rem' }}>◆</span>
    </span>
  );
}

export default function MetricsTicker() {
  return (
    <div className="w-full overflow-hidden mb-6"
      style={{
        height: '44px',
        background: 'rgba(0,0,0,0.4)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
      }}>
      {/* Double the items so the loop is seamless */}
      <div className="ticker-track flex items-center whitespace-nowrap">
        {[...metrics, ...metrics].map((m, i) => (
          <TickerItem key={i} {...m} />
        ))}
      </div>
    </div>
  );
}
