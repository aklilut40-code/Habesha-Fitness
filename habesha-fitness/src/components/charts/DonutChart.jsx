import { useState } from 'react';
import { SERIES } from './theme';

/** Donut with legend (always shown) and hover highlight. data: [{ label, value }] */
export default function DonutChart({ data, size = 170, centerLabel = 'Total', format = (v) => v }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = 62;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const gap = data.filter((d) => d.value > 0).length > 1 ? 3 : 0;
  const active = hover != null ? data[hover] : null;

  return (
    <div className="donut">
      <div className="donut-svg" style={{ width: size, height: size }}>
        <svg viewBox="0 0 160 160" role="img" aria-label="Distribution chart">
          <circle cx="80" cy="80" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="16" />
          {total > 0 &&
            data.map((d, i) => {
              const len = (d.value / total) * c;
              const seg = (
                <circle
                  key={d.label}
                  cx="80" cy="80" r={r} fill="none"
                  stroke={SERIES[i % SERIES.length]}
                  strokeWidth={hover === i ? 20 : 16}
                  strokeDasharray={`${Math.max(len - gap, 0)} ${c - Math.max(len - gap, 0)}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 80 80)"
                  opacity={hover != null && hover !== i ? 0.4 : 1}
                  style={{ transition: 'all .15s' }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              );
              offset += len;
              return seg;
            })}
        </svg>
        <div className="donut-center">
          <strong>{active ? format(active.value) : format(total)}</strong>
          <span>{active ? active.label : centerLabel}</span>
        </div>
      </div>
      <ul className="legend">
        {data.map((d, i) => (
          <li key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={hover === i ? 'is-on' : ''}>
            <i style={{ background: SERIES[i % SERIES.length] }} />
            <span>{d.label}</span>
            <b>{format(d.value)}</b>
            <em>{total ? Math.round((d.value / total) * 100) : 0}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
