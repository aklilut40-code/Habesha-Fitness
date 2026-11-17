import { useState } from 'react';
import { ACCENT } from './theme';

const niceMax = (v) => {
  if (v <= 0) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

/** Single-series vertical bar chart with per-bar hover. data: [{ label, value }] */
export default function BarChart({ data, height = 220, color = ACCENT, name = 'Value', format = (v) => v, highlightLast = false }) {
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = height;
  const m = { t: 12, r: 12, b: 28, l: 40 };
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const slot = iw / data.length;
  const bw = Math.min(34, slot * 0.58);
  const step = data.length > 10 ? Math.ceil(data.length / 10) : 1;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name} bar chart`} preserveAspectRatio="none" style={{ height }}>
        {[0, 0.5, 1].map((f) => {
          const y = m.t + ih - f * ih;
          return (
            <g key={f}>
              <line x1={m.l} x2={W - m.r} y1={y} y2={y} className="chart-grid" />
              <text x={m.l - 8} y={y + 4} textAnchor="end" className="chart-axis">{format(Math.round(max * f), true)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / max) * ih;
          const x = m.l + slot * i + (slot - bw) / 2;
          const y = m.t + ih - h;
          const dim = hover != null && hover !== i;
          return (
            <g key={d.label + i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onTouchStart={() => setHover(i)}>
              <rect x={m.l + slot * i} y={m.t} width={slot} height={ih} fill="transparent" />
              {h > 0 && <path d={`M${x},${m.t + ih} V${y + 4} Q${x},${y} ${x + 4},${y} H${x + bw - 4} Q${x + bw},${y} ${x + bw},${y + 4} V${m.t + ih} Z`} fill={color} opacity={dim ? 0.35 : highlightLast && i !== data.length - 1 && hover == null ? 0.55 : 1} />}
              {i % step === 0 && <text x={x + bw / 2} y={H - 8} textAnchor="middle" className="chart-axis">{d.label}</text>}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="chart-tip" style={{ left: `${((m.l + slot * hover + slot / 2) / W) * 100}%`, top: 0 }}>
          <span>{data[hover].label}</span>
          <strong>{format(data[hover].value)}</strong>
        </div>
      )}
    </div>
  );
}
