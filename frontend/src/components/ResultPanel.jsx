import { useEffect, useState } from 'react';
import { RISK_CONFIG } from '../constants';

/**
 * Derive risk level from probability using the spec thresholds:
 *   proba < 0.3  → Low
 *   proba < 0.6  → Medium
 *   proba >= 0.6 → High
 */
function getRiskLevel(proba) {
  if (proba < 0.3) return 'Low';
  if (proba < 0.6) return 'Medium';
  return 'High';
}

function ProbabilityMeter({ probability }) {
  const pct = Math.round(probability * 100);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayed(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  const zone = pct < 30 ? 'low' : pct < 60 ? 'medium' : 'high';

  return (
    <div className="prob-meter">
      <div className="prob-meter-header">
        <span className="prob-meter-label">Return Probability</span>
        <span className="prob-meter-value">{pct}%</span>
      </div>
      <div className="prob-track">
        <div
          className="prob-fill"
          style={{ width: `${displayed}%` }}
        />
      </div>
      {/* 3-zone legend bar */}
      <div className="risk-zones">
        <div className={`risk-zone zone-low${zone === 'low' ? ' active' : ''}`} style={{ flex: 30 }} />
        <div className={`risk-zone zone-medium${zone === 'medium' ? ' active' : ''}`} style={{ flex: 30 }} />
        <div className={`risk-zone zone-high${zone === 'high' ? ' active' : ''}`} style={{ flex: 40 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--risk-low)', opacity: zone === 'low' ? 1 : 0.4 }}>Low (&lt;30%)</span>
        <span style={{ fontSize: 10, color: 'var(--risk-medium)', opacity: zone === 'medium' ? 1 : 0.4 }}>Medium (30–59%)</span>
        <span style={{ fontSize: 10, color: 'var(--risk-high)', opacity: zone === 'high' ? 1 : 0.4 }}>High (≥60%)</span>
      </div>
    </div>
  );
}

export default function ResultPanel({ result, onReset }) {
  const {
    return_probability,
    confidence,
    threshold_used,
    model_name,
  } = result;

  // ── Derive everything from return_probability using YOUR thresholds ──
  const riskLevel = getRiskLevel(return_probability);
  const cfg = RISK_CONFIG[riskLevel];
  const pct = Math.round(return_probability * 100);
  // "will return" by your spec: High risk = return predicted
  const willReturn = riskLevel === 'High';

  return (
    <div className="result-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Prediction Result</div>
        <button
          id="btn-new-prediction"
          onClick={onReset}
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 8,
            color: 'var(--text-accent)',
            fontSize: 12,
            fontWeight: 600,
            padding: '7px 14px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
        >
          ↩ New Prediction
        </button>
      </div>

      {/* ── Main risk card ── */}
      <div className={`risk-card ${cfg.colorClass}`}>
        <div className="risk-card-glow" />

        <div className="risk-icon-wrap">
          <span style={{ fontSize: 38 }}>{cfg.icon}</span>
        </div>

        <div className="risk-label">Return Risk Level</div>
        <div className="risk-heading">{cfg.headline}</div>
        <div className="risk-subtext">{cfg.description}</div>

        <ProbabilityMeter probability={return_probability} />
      </div>

      {/* ── Verdict banner — derived from YOUR risk thresholds ── */}
      <div className={`verdict-banner ${willReturn ? 'returned' : 'not-returned'}`}>
        <span style={{ fontSize: 18 }}>{willReturn ? '📦' : '✅'}</span>
        <span>
          {willReturn
            ? `High return risk (${pct}%) — this order is likely to be returned`
            : `Return risk is ${riskLevel.toLowerCase()} (${pct}%) — this order is unlikely to be returned`}
        </span>
      </div>

      {/* ── Metric chips ── */}
      <div className="metrics-row">
        <div className="metric-chip">
          <div className="metric-chip-value">{pct}%</div>
          <div className="metric-chip-label">Return Prob.</div>
        </div>
        <div className="metric-chip">
          <div className="metric-chip-value" style={{
            color: riskLevel === 'Low' ? 'var(--risk-low)' : riskLevel === 'Medium' ? 'var(--risk-medium)' : 'var(--risk-high)'
          }}>{riskLevel}</div>
          <div className="metric-chip-label">Risk Level</div>
        </div>
        {/* <div className="metric-chip">
          <div className="metric-chip-value">{confidence}</div>
          <div className="metric-chip-label">Model Confidence</div>
        </div> */}
        {/* <div className="metric-chip">
          <div className="metric-chip-value">{(threshold_used * 100).toFixed(0)}%</div>
          <div className="metric-chip-label">Model Threshold</div>
        </div> */}

      </div>

      {/* ── Risk scale reference ── */}
      <div className="card" style={{ marginTop: 16, padding: '18px 22px' }}>
        <div className="section-title" style={{ marginBottom: 14, fontSize: 11 }}>Risk Scale Reference</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { level: 'Low', range: '0 – 29%', color: 'var(--risk-low)', bg: 'var(--risk-low-bg)', border: 'var(--risk-low-border)' },
            { level: 'Medium', range: '30 – 59%', color: 'var(--risk-medium)', bg: 'var(--risk-medium-bg)', border: 'var(--risk-medium-border)' },
            { level: 'High', range: '60 – 100%', color: 'var(--risk-high)', bg: 'var(--risk-high-bg)', border: 'var(--risk-high-border)' },
          ].map(({ level, range, color, bg, border }) => {
            const isActive = riskLevel === level;
            return (
              <div
                key={level}
                style={{
                  flex: '1 1 120px',
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  textAlign: 'center',
                  opacity: isActive ? 1 : 0.4,
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? `0 0 16px ${border}` : 'none',
                }}
              >
                <div style={{ color, fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{level}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{range}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tip ── */}
      <div style={{
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        marginTop: 14,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{cfg.tip}</span>
      </div>

      {/* ── Model strip ── */}
      <div className="model-strip" style={{ marginBottom: "10px" }}>
        <span>Powered by</span>
        <strong>{model_name}</strong>
        <span>·</span>
        <span>Model threshold {(threshold_used * 100).toFixed(0)}%</span>
        <span>·</span>
        <span>Risk thresholds: &lt;30% Low · 30–59% Medium · ≥60% High</span>
      </div>
    </div>
  );
}
