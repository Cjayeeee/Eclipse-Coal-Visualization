import { useMemo, useRef, useState } from 'react';
import StackedArea from '../charts/StackedArea';
import { ChapterHead, Marks, Tag, Torn } from '../components/Bits';
import { at, FACTS, INDIA, SOURCE_KEYS, SOURCES, share, total } from '../lib/data';
import { lerpLayers, niceMax, stack, ticks } from '../lib/scale';
import { fmt0 } from '../lib/format';
import { gsap, useGSAP, MQ, prefersReducedMotion } from '../lib/motion';
import { useSize } from '../hooks/useSize';
import { useReveals } from '../hooks/useReveals';

const YEARS = [INDIA[0].y, INDIA[INDIA.length - 1].y];
const ABS_MAX = niceMax(Math.max(...INDIA.map(total)), 5);
const ABS_LAYERS = stack(INDIA, SOURCE_KEYS, (r, k) => r[k] / ABS_MAX);
const SHARE_LAYERS = stack(INDIA, SOURCE_KEYS, (r, k) => r[k] / total(r));
const ABS_TICKS = ticks(0, ABS_MAX, 5).map((v) => ({ v: v / ABS_MAX, label: fmt0(v) }));
const SHARE_TICKS = [0, 0.25, 0.5, 0.75, 1].map((v) => ({ v, label: `${v * 100}%` }));

export default function Pattern() {
  const root = useRef(null);
  const [chartRef, size] = useSize({ width: 800, height: 460 });
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [s, setS] = useState(() => (reduced ? { reveal: 1, morph: 0, line: 0, notes: 0, step: 0 } : { reveal: 0, morph: 0, line: 0, notes: 0, step: 0 }));
  useReveals(root);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const build = (end) => {
        const p = { reveal: 0, morph: 0, line: 0, notes: 0 };
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          onUpdate() {
            const t = this.progress();
            setS({ ...p, step: t < 0.38 ? 0 : t < 0.74 ? 1 : 2 });
          },
          scrollTrigger: {
            trigger: root.current.querySelector('.pattern__pin'),
            start: 'top top',
            end,
            pin: true,
            scrub: 0.4,
            anticipatePin: 1,
            refreshPriority: 3, // pins refresh top-to-bottom even after a matchMedia rebuild
          },
        });
        tl.to(p, { reveal: 1, duration: 3.2 })
          .to({}, { duration: 0.6 })
          .to(p, { morph: 1, duration: 2.4, ease: 'power1.inOut' })
          .to(p, { line: 1, duration: 1 })
          .to(p, { notes: 1, duration: 1 })
          .to({}, { duration: 1.2 });
      };
      mm.add(MQ.desktop, () => build('+=260%'));
      mm.add(MQ.mobile, () => build('+=200%'));
      return () => mm.revert();
    },
    { scope: root }
  );

  const layers = useMemo(() => lerpLayers(ABS_LAYERS, SHARE_LAYERS, s.morph), [s.morph]);
  const year = Math.round(YEARS[0] + s.reveal * (YEARS[1] - YEARS[0]));
  const shown = at('India', year) || FACTS.last;
  const compact = size.width < 560;

  const notes = [FACTS.first.y, FACTS.peak.y, FACTS.last.y].map((y) => {
    const r = at('India', y);
    return { y, v: share(r, 'coal') };
  });

  const STEPS = [
    {
      k: 'Totals',
      h: 'Forty years of growth',
      p: `Each layer is a source of electricity. The stack climbs from ${fmt0(total(FACTS.first))} TWh to ${fmt0(total(FACTS.last))} TWh, and the black base, coal, grows along with everything else.`,
    },
    {
      k: 'Shares',
      h: 'Now stretch every year to 100%',
      p: `Look at shares instead of totals and the dark layer hardly moves. Coal has made between ${(FACTS.low.v * 100).toFixed(0)}% and ${(FACTS.peak.v * 100).toFixed(0)}% of India's electricity every year since ${FACTS.first.y}.`,
    },
    {
      k: 'The line held',
      h: 'Growth was added, not swapped',
      p: `Solar and wind took off after 2010, but they mostly added to coal instead of replacing it. Coal's share in 2024 was ${(share(at('India', 2024), 'coal') * 100).toFixed(1)}%, higher than in 2010 (${(share(at('India', 2010), 'coal') * 100).toFixed(1)}%).`,
    },
  ];

  return (
    <section id="line" className="pattern" data-theme="light" ref={root}>
      <div className="pattern__pin">
        <div className="pattern__copy">
          <ChapterHead num="02" kicker="Reveal the pattern" title="The 70% line" tone="ink" />
          <div className="pattern__steps" aria-live="polite">
            {STEPS.map((st, i) => (
              <div key={st.k} className={`pstep ${s.step === i ? 'is-on' : ''}`} aria-hidden={s.step !== i}>
                <p className="pstep__k mono">{String(i + 1).padStart(2, '0')} / {st.k}</p>
                <h3 className="pstep__h">{st.h}</h3>
                <p className="pstep__p">{st.p}</p>
              </div>
            ))}
          </div>
          {reduced && (
            <div className="seg" role="group" aria-label="Chart view">
              <button type="button" aria-pressed={s.morph === 0} onClick={() => setS({ reveal: 1, morph: 0, line: 0, notes: 0, step: 0 })}>Totals (TWh)</button>
              <button type="button" aria-pressed={s.morph === 1} onClick={() => setS({ reveal: 1, morph: 1, line: 1, notes: 1, step: 2 })}>Shares (%)</button>
            </div>
          )}
        </div>

        <figure className="clip pattern__chart">
          <Marks />
          <div className="clip__head">
            <p className="mono">India · electricity generation by source</p>
            <p className="pattern__year" aria-hidden="true">{year}</p>
          </div>
          <div className="pattern__legend">
            {[...SOURCES].reverse().map((src) => (
              <span key={src.key} className="legend-item">
                <i style={{ background: src.color }} /> {src.label}
              </span>
            ))}
          </div>
          <div className="chart-box" ref={chartRef}>
            <StackedArea
              width={size.width}
              height={size.height}
              layers={layers}
              years={YEARS}
              yMax={1}
              compact={compact}
              reveal={s.reveal}
              yAxes={[
                { ticks: ABS_TICKS, opacity: 1 - s.morph, label: 'TWh' },
                { ticks: SHARE_TICKS, opacity: s.morph, label: '% of total' },
              ]}
              refLine={s.line > 0 ? { value: 0.7, label: '70%', draw: s.line, opacity: 1 } : null}
              title="India's electricity generation by source, 1985 to 2025"
              desc={`Stacked area chart. Coal's share ranged from ${(FACTS.low.v * 100).toFixed(1)}% to ${(FACTS.peak.v * 100).toFixed(1)}%. In ${FACTS.last.y} it was ${(share(FACTS.last, 'coal') * 100).toFixed(1)}%.`}
              role="img"
              overlay={({ x, y }) => (
                <g className="pnotes" style={{ opacity: s.notes }}>
                  {notes.map((n, i) => (
                    <g key={n.y} transform={`translate(${x(n.y)},${y(n.v)})`}>
                      <circle r="5" />
                      <text
                        y={i === 1 ? -14 : 22}
                        x={i === 0 ? 4 : i === 2 ? -4 : 0}
                        textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
                      >
                        {n.y}: {(n.v * 100).toFixed(1)}%{i === 1 ? ' (peak)' : ''}
                      </text>
                    </g>
                  ))}
                </g>
              )}
            />
          </div>
          <figcaption className="caption">
            {s.morph < 0.5 ? (
              <>In {shown.y}: {fmt0(total(shown))} TWh in total, {fmt0(shown.coal)} TWh from coal.</>
            ) : (
              <>Coal&apos;s share, {FACTS.first.y}–{FACTS.last.y}: never below {(FACTS.low.v * 100).toFixed(0)}%, never above {(FACTS.peak.v * 100).toFixed(0)}%.</>
            )}{' '}
            Source: Ember; Energy Institute (pre-2000) via OWID.
          </figcaption>
        </figure>
        {!reduced && <Tag tone="ink" className="pattern__hint">Keep scrolling: the chart is driven by your scroll</Tag>}
      </div>
      <Torn color="var(--paper-2)" seed={17} flip />
    </section>
  );
}
