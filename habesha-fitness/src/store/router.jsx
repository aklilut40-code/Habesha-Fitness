import { useEffect, useState } from 'react';

function parse() {
  const raw = window.location.hash.slice(1) || '/';
  const [path, q] = raw.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(q || '')) };
}

export function navigate(to, replace = false) {
  if (replace) window.location.replace(`#${to}`);
  else window.location.hash = to;
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function Link({ to, children, className = '', onClick, ...rest }) {
  return (
    <a href={`#${to}`} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}

/** Opens a modal when the URL carries ?new=1 (used by quick actions), then clears it. */
export function useQueryAction(key, handler) {
  const { path, query } = useRoute();
  useEffect(() => {
    if (query[key]) {
      handler(query[key]);
      navigate(path, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query[key], path]);
}
