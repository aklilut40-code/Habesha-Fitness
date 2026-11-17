import { useMemo, useRef, useState } from 'react';
import { ACCENT } from './theme';

const niceMax = (v) => {
  if (v <= 0) return 10;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};

/** Single-series area/line chart with crosshair tooltip. data: [{ label, value }] */
export default function LineChart({ data, height = 260, format = (v) => v, color = ACCENT, name = 'Value' }) {
  const wrap = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 720;
  const H = height;
  const m = { t: 14, r: 14, b: 28, l: 46 };

  const geo = useMemo(() => {
    const max = niceMax(Math.max(...data.map((d) => d.value), 1));
    const iw = W - m.l - m.r;
    const ih = H - m.t - m.b;
    const x = (i) => m.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const y = (v) => m.t + ih - (v / max) * ih;
    const pts = data.map((d, i) => [x(i), y(d.value)]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1][0]},${m.t + ih} L${pts[0][0]},${m.t + ih} Z`;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: max * f, y: y(max * f) }));
    return { pts, line, area, ticks, max, ih };
  }, [data, H]);

  const onMove = (e) => {
    const rect = wrap.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    geo.pts.forEach((p, i) => {
      if (Math.abs(p[0] - px) < Math.abs(geo.pts[best][0] - px)) best = i;
    });
    setHover(best);
  };

  const gid = `g${color.replace('#', '')}`;
  const step = data.length > 8 ? Math.ceil(data.length / 8) : 1;
  const h = hover != null ? data[hover] : null;
  const hp = hover != null ? geo.pts[hover] : null;

  return (
    <div className="chart" ref={wrap} onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchMove={(e) => onMove(e.touches[0])}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name} chart`} preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {geo.ticks.map((t) => (
          <g key={t.v}>
            <line x1={m.l} x2={W - m.r} y1={t.y} y2={t.y} className="chart-grid" />
            <text x={m.l - 8} y={t.y + 4} textAnchor="end" className="chart-axis">{format(t.v, true)}</text>
          </g>
        ))}
        {data.map((d, i) =>
          i % step === 0 ? (
            <text key={d.label + i} x={geo.pts[i][0]} y={H - 8} textAnchor="middle" className="chart-axis">{d.label}</text>
          ) : null
        )}
        <path d={geo.area} fill={`url(#${gid})`} />
        <path d={geo.line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hp && (
          <>
            <line x1={hp[0]} x2={hp[0]} y1={m.t} y2={m.t + geo.ih} className="chart-cross" />
            <circle cx={hp[0]} cy={hp[1]} r="5" fill={color} stroke="var(--surface)" strokeWidth="2" />
          </>
        )}
      </svg>
      {h && (
        <div className="chart-tip" style={{ left: `${(hp[0] / W) * 100}%`, top: 0 }}>
          <span>{h.label}</span>
          <strong>{format(h.value)}</strong>
        </div>
      )}
    </div>
  );
}
