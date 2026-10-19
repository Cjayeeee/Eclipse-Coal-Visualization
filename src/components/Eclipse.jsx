import { forwardRef, useId, useImperativeHandle, useRef } from 'react';
import { offsetFor, setMoon } from '../lib/eclipse';

const R = 60;
// Deterministic corona rays (varied lengths) so the motif feels hand-printed, not generated.
const RAYS = Array.from({ length: 56 }, (_, i) => {
  const a = (i / 56) * Math.PI * 2;
  const len = 8 + ((i * 37) % 11) * 2.2 + (i % 4 === 0 ? 10 : 0);
  return { a, r0: R + 7, r1: R + 7 + len };
});

/**
 * The signature motif: a sun disc and a moon disc of equal size.
 * The overlap area equals `coverage` × sun area, so the shadow *is* the coal share.
 *
 * Imperative handle: ref.current.set(coverage) for scroll-scrubbed updates without re-rendering.
 */
const Eclipse = forwardRef(function Eclipse(
  { coverage = 0.7, rays = true, theme = 'dark', title, className = '', moonLabel },
  ref
) {
  const id = useId().replace(/:/g, '');
  const moonRef = useRef(null);
  const rootRef = useRef(null);

  useImperativeHandle(ref, () => ({
    set: (c) => setMoon(moonRef.current, c, R),
    root: rootRef.current,
    moon: moonRef.current,
  }));

  const d = offsetFor(coverage, R);
  const moonFill = theme === 'dark' ? '#1f1a15' : '#1d1915';
  const rim = theme === 'dark' ? '#f2ead9' : '#1d1915';

  return (
    <svg
      ref={rootRef}
      className={`eclipse ${className}`}
      viewBox={rays ? '-110 -110 220 220' : '-62 -62 124 124'}
      role="img"
      aria-label={title || `Eclipse graphic: the shadow covers ${(coverage * 100).toFixed(1)}% of the sun`}
    >
      <defs>
        <pattern id={`dots-${id}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="2.5" cy="2.5" r="1.05" fill="#ff7a1a" opacity="0.55" />
        </pattern>
        <pattern id={`moondots-${id}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
          <circle cx="2" cy="2" r="0.7" fill={rim} opacity="0.12" />
        </pattern>
        <clipPath id={`sunclip-${id}`}>
          <circle r={R} />
        </clipPath>
      </defs>

      {rays && (
        <g className="eclipse__rays" stroke={theme === 'dark' ? '#ffc21f' : '#1d1915'} strokeWidth="1.4" strokeLinecap="round">
          {RAYS.map((ray, i) => (
            <line
              key={i}
              x1={(Math.cos(ray.a) * ray.r0).toFixed(2)}
              y1={(Math.sin(ray.a) * ray.r0).toFixed(2)}
              x2={(Math.cos(ray.a) * ray.r1).toFixed(2)}
              y2={(Math.sin(ray.a) * ray.r1).toFixed(2)}
              opacity={i % 3 === 0 ? 0.9 : 0.45}
            />
          ))}
        </g>
      )}

      <g className="eclipse__sun">
        <circle r={R} fill="#ffc21f" />
        <circle r={R} fill={`url(#dots-${id})`} />
      </g>

      {/* Moon is clipped to the sun so that only the shadow on the disc is drawn. */}
      <g clipPath={`url(#sunclip-${id})`}>
        <g ref={moonRef} className="eclipse__moon" transform={`translate(${(-d).toFixed(2)} 0)`}>
          <circle r={R} fill={moonFill} />
          <circle r={R} fill={`url(#moondots-${id})`} />
        </g>
      </g>
      <circle r={R} fill="none" stroke={rim} strokeOpacity="0.25" strokeWidth="0.8" />
      {moonLabel}
    </svg>
  );
});

export default Eclipse;
