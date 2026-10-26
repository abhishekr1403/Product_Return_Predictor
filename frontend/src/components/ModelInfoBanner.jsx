import { useEffect, useState } from 'react';
import { fetchModelInfo } from '../api';

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '10px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      flex: '1 1 80px',
    }}>
      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17, color: color || 'var(--text-primary)' }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  );
}

export default function ModelInfoBanner() {
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelInfo()
      .then(setInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !info) return null;

  const fmt = (n) => `${(n * 100).toFixed(1)}%`;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 36,
      overflow: 'hidden',
    }}>
      <button
        id="btn-model-info-toggle"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <span>Model: <strong style={{ color: 'var(--text-primary)' }}>{info.model_name}</strong></span>
          <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
          <span>Accuracy <strong style={{ color: 'var(--text-accent)' }}>{fmt(info.accuracy)}</strong></span>
          <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
          <span>F1 <strong style={{ color: 'var(--text-accent)' }}>{fmt(info.f1)}</strong></span>
        </span>
        <span style={{ transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
      </button>

      {open && (
        <div style={{
          padding: '0 20px 20px',
          borderTop: '1px solid var(--border-subtle)',
          animation: 'fade-in 0.25s ease',
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            <StatPill label="Accuracy" value={fmt(info.accuracy)} color="var(--accent-primary)" />
            <StatPill label="Precision" value={fmt(info.precision)} color="#22d3ee" />
            <StatPill label="Recall" value={fmt(info.recall)} color="#a78bfa" />
            <StatPill label="F1 Score" value={fmt(info.f1)} color="#34d399" />
            <StatPill label="Threshold" value={`${(info.threshold * 100).toFixed(0)}%`} color="var(--text-accent)" />
          </div>

          {info.top_features?.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Top Features by Importance
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {info.top_features.slice(0, 8).map((f, i) => {
                  const maxImp = info.top_features[0].importance;
                  const pct = Math.abs(f.importance / maxImp) * 100;
                  return (
                    <div key={f.feature} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 16, textAlign: 'right', flexShrink: 0 }}>{i+1}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: '0 0 180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.feature.replace(/_/g, ' ')}
                      </span>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                          borderRadius: 3,
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 44, textAlign: 'right', flexShrink: 0 }}>
                        {f.importance.toFixed(3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
