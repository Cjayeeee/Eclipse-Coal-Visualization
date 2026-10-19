import { useMemo, useRef } from 'react';
import Waterfall from '../charts/Waterfall';
import { Note, Tag, Torn } from '../components/Bits';
import { at, FACTS, INDIA, SOURCES, total } from '../lib/data';
import { fmt0, fmt1, twh } from '../lib/format';
import { gsap, useGSAP, MQ, prefersReducedMotion } from '../lib/motion';
import { useReveals } from '../hooks/useReveals';

const START = 2010;
const SOLAR = INDIA.filter((r) => r.y >= START).map((r) => ({ y: r.y, v: r.solar }));
const SOLAR_MAX = SOLAR[SOLAR.length - 1].v;
const solarAt = (fy) => {
  const i = Math.min(SOLAR.length - 2, Math.max(0, Math.floor(fy - START)));
  const a = SOLAR[i];
  const b = SOLAR[i + 1];
  const t = Math.min(1, Math.max(0, fy - a.y));
  return a.v + (b.v - a.v) * t;
};

const SHORT = { coal: 'Coal', gasoil: 'Gas', nuclear: 'Nucl.', hydro: 'Hydro', other: 'Other', wind: 'Wind', solar: 'Solar' };

export default function TurningPoint() {
  const root = useRef(null);
  const after = useRef(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  useReveals(after);

  const { last, prev, change, genGrowth, coalDrops } = FACTS;
  const coalPct = last.coal / prev.coal - 1;
  const ringScale = Math.sqrt(last.coal / SOLAR_MAX);
  const g23 = total(at('India', 2023)) / total(at('India', 2022)) - 1;
  const g24 = total(at('India', 2024)) / total(at('India', 2023)) - 1;
  const hydroPct = last.hydro / prev.hydro - 1;
  const solarPct = last.solar / prev.solar - 1;
  const firstSolar = at('India', START).solar;
  const pandemic = coalDrops.find((d) => d.y === 2020);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root);
        const sun = q('.turn__sun')[0];
        const yearEl = q('.turn__sy')[0];
        const valEl = q('.turn__sv')[0];
        const p = { y: START };
        const renderSun = () => {
          const v = solarAt(p.y);
          gsap.set(sun, { scale: Math.max(0.012, Math.sqrt(v / SOLAR_MAX)) });
          yearEl.textContent = Math.floor(p.y + 1e-6);
          valEl.textContent = twh(v);
        };
        renderSun();
        // The sun's base diameter is ≤ 72vmin (max 640px); ×6.5 covers any viewport shape, including after a resize.
        const cover = 6.5;
        const theme = (t) => () => window.dispatchEvent(new CustomEvent('eclipse:theme', { detail: t }));

        const tl = gsap.timeline({
          defaults: { ease: 'power2.out', duration: 1 },
          scrollTrigger: {
            trigger: q('.turn__pin')[0],
            start: 'top top',
            end: () => `+=${window.innerHeight * (window.innerWidth < 900 ? 3.2 : 4)}`,
            pin: true,
            scrub: 0.5,
            refreshPriority: 2,
            anticipatePin: 1,
            onRefresh: () => renderSun(),
          },
        });
        // Explicit fromTo values so scrubbing backwards always restores a known state.
        const show = { autoAlpha: 1, y: 0, yPercent: 0, scale: 1 };
        tl.fromTo(q('.turn__year'), { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.2, ease: 'power3.out' })
          .fromTo(q('.turn__line--1'), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1 })
          .fromTo(q('.turn__line--2'), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1 }, '+=0.3')
          .fromTo(q('.turn__chip'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.25, duration: 0.7 })
          .to({}, { duration: 1 })
          .fromTo(q('.turn__intro'), { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -50, duration: 0.8, ease: 'power2.in' })
          .fromTo(q('.turn__solar'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 })
          .fromTo(p, { y: START }, { y: SOLAR[SOLAR.length - 1].y, duration: 4.5, ease: 'none', onUpdate: renderSun })
          .fromTo(q('.turn__ring'), { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.8 })
          .to({}, { duration: 1 })
          .fromTo(q('.turn__ring, .turn__solar-label'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false })
          .fromTo(sun, { scale: 1 }, { scale: cover, duration: 1.8, ease: 'power2.in', immediateRender: false })
          .fromTo(q('.turn__sun-dots'), { opacity: 1 }, { opacity: 0, duration: 0.5, immediateRender: false }, '-=0.6')
          .add(theme('light'))
          .fromTo(q('.turn__final'), { autoAlpha: 0, y: 40 }, { ...show, duration: 0.9 })
          .to({}, { duration: 0.8 });
        // Masthead colour flips back if the reader scrolls up through the cover.
        tl.add(theme('dark'), tl.duration() * 0.84 - 0.01);
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  const items = SOURCES.map((s) => ({ key: s.key, label: s.label, short: SHORT[s.key], delta: change[s.key], color: s.color }));
  items.sort((a, b) => a.delta - b.delta);

  return (
    <>
      <section id="turn" className={`turn ${reduced ? 'turn--static' : ''}`} data-theme="dark" ref={root}>
        <div className="turn__pin">
          <div className="turn__intro">
            <p className="turn__kicker mono">04 · The turning point</p>
            <h2 className="turn__year" aria-label={String(last.y)}>{last.y}</h2>
            <div className="turn__lines">
              <p className="turn__line turn__line--1">Demand rose.</p>
              <p className="turn__line turn__line--2">Coal fell anyway.</p>
            </div>
            <div className="turn__chips">
              <Tag tone="paper" className="turn__chip">Total generation +{(genGrowth * 100).toFixed(1)}%</Tag>
              <Tag tone="ember" className="turn__chip">Coal {(coalPct * 100).toFixed(1)}% · −{fmt0(Math.abs(change.coal))} TWh</Tag>
            </div>
            <p className="turn__ctx">
              In four decades of data, coal generation fell meaningfully only one other time: in 2020
              {pandemic ? ` (−${fmt0(Math.abs(pandemic.d))} TWh)` : ''}, when the pandemic shrank demand itself.
            </p>
          </div>

          <div className="turn__solar" aria-hidden={!reduced}>
            <div className="turn__ring" style={{ '--ring': ringScale }}>
              <span className="mono">Coal, {last.y}, same scale: {fmt0(last.coal)} TWh</span>
            </div>
            <div className="turn__sun">
              <div className="turn__sun-dots" />
            </div>
            <div className="turn__solar-label">
              <p className="mono">India · solar generation</p>
              <p className="turn__sy">{reduced ? last.y : START}</p>
              <p><span className="turn__sv">{twh(reduced ? last.solar : firstSolar)}</span> <small>TWh</small></p>
              <p className="mono turn__area">disc area ∝ TWh</p>
            </div>
          </div>

          <div className="turn__final">
            <p className="turn__final-big">
              {twh(firstSolar)} → {fmt0(last.solar)}
              <small> TWh</small>
            </p>
            <p className="turn__final-p">
              Solar power in {START} vs {last.y}. In {last.y} alone it grew {(solarPct * 100).toFixed(0)}%, adding{' '}
              {fmt1(change.solar)} TWh, more than all of coal&apos;s decline.
            </p>
          </div>
        </div>
      </section>

      <section className="turn-after" data-theme="light" ref={after}>
        <div className="wrap">
          <div className="turn-after__grid">
            <div className="turn-after__copy">
              <Tag tone="ink" data-reveal="pop">What changed, {prev.y} → {last.y}</Tag>
              <h3 className="h3" data-split>Where the new electricity came from</h3>
              <p data-reveal="up">
                Clean sources grew by more than total generation did, so coal shrank. Solar did most of the work. Wind
                added {fmt1(change.wind)} TWh.
              </p>
              <p data-reveal="up">
                <strong>The honest caveat:</strong> part of the drop was circumstance. Hydro output jumped{' '}
                {(hydroPct * 100).toFixed(0)}% (it swings with rainfall), and demand grew only{' '}
                {(genGrowth * 100).toFixed(1)}% after rising {(g23 * 100).toFixed(1)}% and {(g24 * 100).toFixed(1)}% in the two
                years before. One year is a signal, not yet a trend.
              </p>
            </div>
            <figure className="clip clip--sun turn-after__chart" data-reveal="up">
              <div className="clip__head">
                <p className="mono">India · change in generation by source, {prev.y}→{last.y} (TWh)</p>
              </div>
              <Waterfall
                items={items}
                title={`Change in India's electricity generation by source from ${prev.y} to ${last.y}`}
                desc={items.map((i) => `${i.label} ${i.delta.toFixed(1)} TWh`).join(', ')}
              />
              <figcaption className="caption">Bars start where the previous one ended; “Net” is the total change. Source: Ember via OWID.</figcaption>
            </figure>
          </div>
          <Note arrow="down-right" className="turn-after__note">a strong year for hydro helped. That luck won&apos;t repeat every year</Note>
        </div>
        <Torn color="var(--paper)" seed={23} flip />
      </section>
    </>
  );
}
