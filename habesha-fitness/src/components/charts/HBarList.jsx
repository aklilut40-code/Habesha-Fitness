import { ACCENT } from './theme';

/** Horizontal ranked bars with direct value labels. data: [{ label, value }] */
export default function HBarList({ data, format = (v) => v, color = ACCENT }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="hbars">
      {data.map((d) => (
        <li key={d.label}>
          <div className="hbar-top"><span>{d.label}</span><b>{format(d.value)}</b></div>
          <div className="hbar-track"><div className="hbar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} /></div>
        </li>
      ))}
    </ul>
  );
}
