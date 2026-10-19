import { useLayoutEffect, useRef, useState } from 'react';

/** Observe an element's content box. Returns [ref, { width, height }]. */
export function useSize(initial = { width: 800, height: 480 }) {
  const ref = useRef(null);
  const [size, setSize] = useState(initial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (Math.abs(s.width - r.width) < 1 && Math.abs(s.height - r.height) < 1 ? s : { width: r.width, height: r.height }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}
