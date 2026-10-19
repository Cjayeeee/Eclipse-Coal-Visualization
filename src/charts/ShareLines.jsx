import { useRef, useState } from 'react';
import { linear, linePath } from '../lib/scale';
import { series, share } from '../lib/data';
import { useSize } from '../hooks/useSize';
import { gsap, useGSAP, MQ } from '../lib/motion';

/**
 * Coal's share of electricity over time for a handful of countries.
 * India is drawn in ember; the rest in ink. Focus any line via the legend or by hovering.
 */
export default function ShareLines({ countries, years, focusDefault = 'India' }) {
  const root = useRef(null);
  const [box, size] = useSize({ width: 760, height: 420 });
  const [focus, setFocus] = useState(null);
  const active = focus || focusDefault;

  const compact = size.width < 560;
  const m = { t: 16, r: compact ? 86 : 120, b: 30, l: compact ? 34 : 44 };
  const w = Math.max(10, size.width - m.l - m.r);
  const h = Math.max(10, size.height - m.t - m.b);
  const x = linear(years, [0, w]);
  const y = linear([0, 100], [h, 0]);

  const lines = countries.map((c) => {
    const pts = series(c.name).filter((r) => r.y >= years[0]).map((r) => ({ x: r.y, v: share(r, 'coal') * 100 }));
    return { ...c, pts, last: pts[pts.length - 1] };
  });

  // End labels with simple collision avoidance.
  const labels = lines.map((l) => ({ key: l.name, ty: y(l.last.v), l })).sort((a, b) => a.ty - b.ty);
  const gap = compact ? 12 : 14;
  for (let i = 1; i < labels.length; i++) if (labels[i].ty - labels[i - 1].ty < gap) labels[i].ty = labels[i - 1].ty + gap;
  for (let i = labels.length - 1; i >= 0; i--) {
    if (labels[i].ty > h) labels[i].ty = h;
    if (i < labels.length - 1 && labels[i + 1].ty - labels[i].ty < gap) labels[i].ty = labels[i + 1].ty - gap;
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root);
        const paths = q('.sl__line');
        gsap.set(paths, { strokeDasharray: '1 1', strokeDashoffset: 1 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 70%', once: true } });
        tl.to(paths, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', stagger: 0.12 })
          .from(q('.sl__end'), { autoAlpha: 0, x: -8, stagger: 0.06, duration: 0.5 }, '-=0.8')
          .add(() => paths.forEach((p) => { p.style.strokeDasharray = 'none'; }));
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div className="sl" ref={root}>
      <div className="sl__legend" role="group" aria-label="Highlight a country">
        {lines.map((l) => (
          <button
            key={l.name}
            type="button"
            aria-pressed={active === l.name}
            className={active === l.name ? 'is-on' : ''}
            onClick={() => setFocus(focus === l.name ? null : l.name)}
            onPointerEnter={() => setFocus(l.name)}
            onPointerLeave={() => setFocus(null)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="chart-box chart-box--sl" ref={box}>
        <svg width={size.width} height={size.height} className="chart" role="img" aria-label={`Coal's share of electricity, ${years[0]}–${years[1]}: ${lines.map((l) => `${l.label} ${l.last.v.toFixed(1)}%`).join(', ')} in ${years[1]}`}>
          <g transform={`translate(${m.l},${m.t})`}>
            <g className="axis axis--y">
              {[0, 25, 50, 75, 100].map((v) => (
                <g key={v} transform={`translate(0,${y(v)})`}>
                  <line x2={w} className={v === 0 ? 'axis__base' : 'axis__grid'} />
                  <text x={-8} dy="0.32em" textAnchor="end">{v}%</text>
                </g>
              ))}
            </g>
            <g className="axis axis--x" transform={`translate(0,${h})`}>
              {[years[0], 1995, 2005, 2015, years[1]].map((v) => (
                <text key={v} x={x(v)} y={20} textAnchor={v === years[0] ? 'start' : v === years[1] ? 'end' : 'middle'}>{v}</text>
              ))}
            </g>
            {lines.map((l) => (
              <path
                key={l.name}
                className={`sl__line ${l.name === 'India' ? 'sl__line--india' : ''} ${active === l.name ? 'is-on' : 'is-dim'}`}
                d={linePath(l.pts, x, y)}
                pathLength={1}
                onPointerEnter={() => setFocus(l.name)}
                onPointerLeave={() => setFocus(null)}
              />
            ))}
            {labels.map(({ key, ty, l }) => (
              <g key={key} className={`sl__end ${active === l.name ? 'is-on' : ''} ${l.name === 'India' ? 'is-india' : ''}`}>
                <circle cx={x(l.last.x)} cy={y(l.last.v)} r={3} />
                <text x={w + 8} y={ty} dy="0.32em">
                  {l.label} <tspan className="sl__v">{l.last.v.toFixed(l.last.v < 1 ? 1 : 0)}%</tspan>
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
