import { initials } from '../../utils/format';
import { IMAGES } from '../../store/images';

const COLORS = ['#ff6b1a', '#3987e5', '#199e70', '#c98500', '#d55181', '#9085e9'];

export default function Avatar({ name = '', photo, size = 36, className = '' }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (photo && IMAGES[photo]) {
    return <img className={`avatar ${className}`} style={style} src={IMAGES[photo]} alt={name} />;
  }
  const c = COLORS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORS.length];
  return (
    <span className={`avatar avatar-initials ${className}`} style={{ ...style, background: `${c}22`, color: c, borderColor: `${c}55` }} aria-label={name}>
      {initials(name)}
    </span>
  );
}
