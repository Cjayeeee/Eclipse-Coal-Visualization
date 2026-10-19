import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/motion';

/**
 * Chart tooltip anchored to a point inside a positioned container.
 * Flips to the left of the pointer near the right edge; eases in/out with GSAP.
 */
export default function Tooltip({ x = 0, y = 0, visible, bounds = 600, children, id }) {
  const ref = useRef(null);
  const wasVisible = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const flip = x + w + 24 > bounds;
    const left = flip ? Math.max(4, x - w - 16) : x + 16;
    gsap.set(el, { x: left, y: Math.max(0, y - 20) });
    if (visible && !wasVisible.current) {
      gsap.fromTo(el, { autoAlpha: 0, scale: 0.92, rotate: flip ? 2 : -2 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.25, ease: 'back.out(2)', overwrite: 'auto' });
    } else if (!visible && wasVisible.current) {
      gsap.to(el, { autoAlpha: 0, scale: 0.96, duration: 0.15, ease: 'power1.in', overwrite: 'auto' });
    }
    wasVisible.current = visible;
  });

  return (
    <div ref={ref} id={id} className="tooltip" role="tooltip" style={{ visibility: 'hidden', opacity: 0 }}>
      {children}
    </div>
  );
}
