import { useRef, useState } from 'react';
import { linear, ticks } from '../lib/scale';
import { useSize } from '../hooks/useSize';
import { gsap, useGSAP, MQ } from '../lib/motion';

/**
 * Waterfall of year-on-year change by source. Bars hang from the running total, so the
 * last bar ("Net") is exactly the sum of the ones before it.
 */
export default function Waterfall({ items, unit = 'TWh', title, desc }) {
  const root = useRef(null);
  const [box, size] = useSize({ width: 720, height: 380 });
  const [focus, setFocus] = useState(null);

  let run = 0;
  const bars = items.map((it) => {
    const start = run;
    run += it.delta;
    return { ...it, start, end: run };
  });
  const net = { key: 'net', label: 'Net', delta: run, start: 0, end: run, color: 'var(--ink)' };
  const all = [...bars, net];
  const lo = Math.min(0, ...all.map((b) => Math.min(b.start, b.end)));
  const hi = Math.max(0, ...all.map((b) => Math.max(b.start, b.end)));
  const tk = ticks(lo, hi, 4);
  const d0 = Math.min(lo, tk[0]);
  const d1 = Math.max(hi, tk[tk.length - 1]);

  const compact = size.width < 520;
  const m = { t: 30, r: 8, b: 40, l: compact ? 40 : 52 };
  const w = Math.max(10, size.width - m.l - m.r);
  const h = Math.max(10, size.height - m.t - m.b);
  const y = linear([d0, d1], [h, 0]);
  const band = w / all.length;
  const bw = Math.min(64, band * 0.62);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root);
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 75%', once: true } });
        tl.from(q('.wf__bar rect'), { scaleY: 0, transformOrigin: (i, el) => el.dataset.origin, stagger: 0.16, duration: 0.7, ease: 'power3.out' })
          .from(q('.wf__val'), { autoAlpha: 0, y: 6, stagger: 0.16, duration: 0.4 }, 0.3)
          .from(q('.wf__link'), { autoAlpha: 0, stagger: 0.16, duration: 0.3 }, 0.4);
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [size.width > 0] }
  );

  return (
    <div className="wf" ref={root}>
      <div className="chart-box chart-box--wf" ref={box}>
        <svg width={size.width} height={size.height} role="img" aria-label={title} className="chart">
          <desc>{desc}</desc>
          <g transform={`translate(${m.l},${m.t})`}>
            <g className="axis axis--y">
              {tk.map((v) => (
                <g key={v} transform={`translate(0,${y(v)})`}>
                  <line x2={w} className={v === 0 ? 'axis__base' : 'axis__grid'} />
                  <text x={-8} dy="0.32em" textAnchor="end">{v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : 0}</text>
                </g>
              ))}
              <text className="axis__label" x={-m.l + 2} y={-12}>{unit} change</text>
            </g>
            {all.map((b, i) => {
              const cx = band * i + band / 2;
              const top = y(Math.max(b.start, b.end));
              const bot = y(Math.min(b.start, b.end));
              const up = b.delta >= 0;
              const next = all[i + 1];
              return (
                <g
                  key={b.key}
                  className={`wf__bar ${focus === b.key ? 'is-focus' : ''} ${b.key === 'net' ? 'wf__bar--net' : ''}`}
                  tabIndex={0}
                  onFocus={() => setFocus(b.key)}
                  onBlur={() => setFocus(null)}
                  onPointerEnter={() => setFocus(b.key)}
                  onPointerLeave={() => setFocus(null)}
                  aria-label={`${b.label}: ${b.delta >= 0 ? '+' : '−'}${Math.abs(b.delta).toFixed(1)} ${unit}`}
                >
                  <rect
                    x={cx - bw / 2}
                    y={top}
                    width={bw}
                    height={Math.max(1.5, bot - top)}
                    fill={b.color}
                    data-origin={b.key === 'net' ? '50% 100%' : up ? '50% 100%' : '50% 0%'}
                  />
                  <text className="wf__val" x={cx} y={up ? top - 8 : bot + 16} textAnchor="middle">
                    {b.delta >= 0 ? '+' : '−'}{Math.abs(b.delta).toFixed(1)}
                  </text>
                  <text className="wf__lab" x={cx} y={h + 22} textAnchor="middle">{band < 96 ? b.short || b.label : b.label}</text>
                  {next && next.key !== 'net' && (
                    <line className="wf__link" x1={cx + bw / 2} x2={cx + band - bw / 2} y1={y(b.end)} y2={y(b.end)} />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
