import { useMemo, useRef, useState } from 'react';
import Eclipse from '../components/Eclipse';
import { Tag, Torn } from '../components/Bits';
import { FACTS, INDIA, META, share, total } from '../lib/data';
import { fmt0 } from '../lib/format';
import { gsap, useGSAP, MQ, prefersReducedMotion } from '../lib/motion';
import { useReveals } from '../hooks/useReveals';
import { scrollToTarget } from '../lib/smooth';

const SHARES = INDIA.map((r) => ({ y: r.y, v: share(r, 'coal') }));
const coverageAt = (fy) => {
  const i = Math.min(SHARES.length - 2, Math.max(0, Math.floor(fy - SHARES[0].y)));
  const t = Math.min(1, Math.max(0, fy - SHARES[i].y));
  return SHARES[i].v + (SHARES[i + 1].v - SHARES[i].v) * t;
};

export default function Conclusion() {
  const root = useRef(null);
  const src = useRef(null);
  const ecl = useRef(null);
  const yearEl = useRef(null);
  const valEl = useRef(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [manualYear, setManualYear] = useState(FACTS.last.y);
  useReveals(src);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root);
        const p = { y: SHARES[0].y };
        const render = () => {
          const c = coverageAt(p.y);
          ecl.current?.set(c);
          yearEl.current.textContent = Math.floor(p.y + 1e-6);
          valEl.current.textContent = `${(c * 100).toFixed(1)}%`;
        };
        render();
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: q('.end__pin')[0],
            start: 'top top',
            end: () => `+=${window.innerHeight * 2}`,
            pin: true,
            scrub: 0.4,
            refreshPriority: 1,
          },
        });
        tl.from(q('.end__eclipse'), { scale: 0.8, autoAlpha: 0, duration: 0.6, ease: 'power2.out' })
          .to(p, { y: SHARES[SHARES.length - 1].y, duration: 4, onUpdate: render }, 0)
          .from(q('.end__h .line--1 > span'), { yPercent: 110, duration: 0.8, ease: 'power3.out' }, 0.6)
          .from(q('.end__h .line--2 > span'), { yPercent: 110, duration: 0.8, ease: 'power3.out' }, 2.4)
          .from(q('.end__p'), { autoAlpha: 0, y: 30, duration: 0.8, ease: 'power2.out' }, 3.2)
          .to({}, { duration: 0.8 });
        gsap.to(q('.eclipse__rays'), { rotate: 360, svgOrigin: '0 0', duration: 120, repeat: -1, ease: 'none' });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  const last = FACTS.last;
  const manual = SHARES.find((s) => s.y === manualYear);

  return (
    <>
      <section id="epilogue" className="end" data-theme="dark" ref={root}>
        <div className="end__pin">
          <div className="end__copy">
            <p className="mono end__k">06 · Epilogue</p>
            <h2 className="end__h">
              <span className="line line--1"><span>The shadow has moved.</span></span>
              <span className="line line--2"><span>It hasn&apos;t lifted.</span></span>
            </h2>
            <p className="end__p">
              In {last.y} India&apos;s grid grew while coal power shrank, with nothing comparable in forty years of data.
              But coal still made <strong>{(share(last, 'coal') * 100).toFixed(1)}%</strong> of the country&apos;s electricity,
              generation per person is a third of the world average, and one hot, dry year could undo the dip. The next few years will
              show whether {last.y} was weather or a real turn.
            </p>
          </div>
          <div className="end__eclipse">
            <Eclipse ref={ecl} coverage={reduced ? manual.v : SHARES[0].v} title="India's coal share each year as an eclipse, 1985 to 2025" />
            <div className="end__read">
              <span ref={yearEl} className="end__year">{reduced ? manualYear : SHARES[0].y}</span>
              <span className="end__val"><span ref={valEl}>{((reduced ? manual.v : SHARES[0].v) * 100).toFixed(1)}%</span> coal</span>
            </div>
            {reduced && (
              <input
                type="range"
                className="end__slider"
                min={SHARES[0].y}
                max={last.y}
                value={manualYear}
                onChange={(e) => setManualYear(+e.target.value)}
                aria-label="Year"
              />
            )}
          </div>
        </div>
        <Torn color="var(--paper)" seed={41} flip />
      </section>

      <section className="sources" data-theme="light" ref={src} aria-labelledby="src-h">
        <div className="wrap">
          <div className="sources__head">
            <Tag tone="ink" data-reveal="pop">Sources & method</Tag>
            <h2 id="src-h" className="h2" data-split>How this story was made</h2>
          </div>
          <div className="sources__grid">
            <div data-reveal="up">
              <h3 className="mono">Data</h3>
              <p>
                {META.source}. Annual figures, {INDIA[0].y}–{last.y}. Generation in terawatt-hours (TWh); per-person values in
                kWh; carbon intensity in lifecycle grams of CO₂-equivalent per kWh.
              </p>
              <p>
                <a href={META.url} target="_blank" rel="noreferrer">github.com/owid/energy-data ↗</a><br />
                <a href="https://ember-energy.org/data/yearly-electricity-data/" target="_blank" rel="noreferrer">Ember: Yearly Electricity Data ↗</a><br />
                <a href="https://www.energyinst.org/statistical-review/" target="_blank" rel="noreferrer">Energy Institute: Statistical Review ↗</a>
              </p>
            </div>
            <div data-reveal="up" data-delay="0.1">
              <h3 className="mono">Method</h3>
              <p>
                Sources are grouped into seven categories: coal; gas &amp; oil; nuclear; hydro; wind; solar; bioenergy &amp;
                other renewables. Shares are each category&apos;s generation divided by the sum of all seven. That sum matches the
                reported total ({fmt0(total(last))} TWh for India in {last.y}) within rounding.
              </p>
              <p>
                The eclipse is area-true: the shadow&apos;s area equals coal&apos;s share of the disc. The solar disc in chapter 04
                and the stamps in chapter 01 scale by area, not radius.
              </p>
            </div>
            <div data-reveal="up" data-delay="0.2">
              <h3 className="mono">Limitations</h3>
              <p>
                Figures before 2000 come from the Energy Institute and some small categories are missing there (counted as zero).
                {' '}{last.y} values are the latest Ember release and may be revised. This is generation, not consumption, so net
                imports are excluded. Causes mentioned (weather, demand) are context, not attribution; this data can&apos;t separate them.
              </p>
              <p className="muted">Data snapshot built {META.built}. Re-run <code>npm run data</code> to refresh.</p>
            </div>
          </div>
        </div>
        <footer className="footer">
          <div className="wrap footer__row">
            <p className="footer__brand">
              <Eclipse coverage={share(last, 'coal')} rays={false} theme="light" title="Eclipse logo" />
              ECLIPSE
            </p>
            <p className="mono">A data story about India&apos;s electricity · React · GSAP · hand-built SVG</p>
            <button type="button" className="footer__top" onClick={() => scrollToTarget(0)}>
              Back to the dark ↑
            </button>
          </div>
        </footer>
      </section>
    </>
  );
}
