import { useRef } from 'react';
import Eclipse from '../components/Eclipse';
import { Note, Tag } from '../components/Bits';
import { FACTS, share } from '../lib/data';
import { gsap, useGSAP, MQ, prepDraw } from '../lib/motion';

export default function Hero({ ready }) {
  const root = useRef(null);
  const ecl = useRef(null);
  const coal = share(FACTS.last, 'coal');

  useGSAP(
    () => {
      if (!ready) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root);
        prepDraw(q('.note .draw'));
        const moon = { c: 1 };
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from(q('.hero__title .line > span'), { yPercent: 115, rotate: 3, stagger: 0.1, duration: 1.3 })
          .from(q('.hero__eclipse'), { scale: 0.86, autoAlpha: 0, duration: 1.4 }, 0)
          .to(moon, { c: coal, duration: 2, ease: 'power3.inOut', onUpdate: () => ecl.current?.set(moon.c) }, 0.2)
          .from(q('.eclipse__rays line'), { scale: 0, svgOrigin: '0 0', stagger: { each: 0.012, from: 'random' }, duration: 0.8 }, 0.5)
          .from(q('.hero__top > *'), { autoAlpha: 0, y: -10, stagger: 0.08, duration: 0.8 }, 0.3)
          .from(q('.hero__tag'), { scale: 0.4, rotate: -20, autoAlpha: 0, ease: 'back.out(2.2)', duration: 0.7 }, 1.3)
          .from(q('.hero__intro'), { y: 24, autoAlpha: 0, duration: 1 }, 1.1)
          .from(q('.note__text'), { clipPath: 'inset(0 100% 0 0)', duration: 1, ease: 'power2.inOut' }, 1.7)
          .to(q('.note .draw'), { strokeDashoffset: 0, duration: 0.7, ease: 'power2.out' }, 2.3)
          .from(q('.hero__cue'), { autoAlpha: 0, y: 10, duration: 0.6 }, 2.2);

        gsap.to(q('.eclipse__rays'), { rotate: 360, svgOrigin: '0 0', duration: 90, repeat: -1, ease: 'none' });

        // Restrained parallax as the hero leaves.
        const st = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true };
        gsap.to(q('.hero__title'), { yPercent: -18, ease: 'none', scrollTrigger: st });
        gsap.to(q('.hero__eclipse'), { yPercent: 22, rotate: -8, ease: 'none', scrollTrigger: st });
        gsap.to(q('.hero__intro, .hero__note'), { y: -60, ease: 'none', scrollTrigger: st });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [ready] }
  );

  return (
    <section id="prologue" className="hero" data-theme="dark" ref={root}>
      <div className="hero__top">
        <p className="mono">A data story · India · {FACTS.first.y}–{FACTS.last.y}</p>
        <p className="mono hero__src">Data: Ember · Energy Institute · Our World in Data</p>
      </div>

      <h1 className="hero__title" aria-label="In the shadow of coal">
        <span className="line" aria-hidden="true"><span>In the</span></span>
        <span className="line line--indent" aria-hidden="true"><span>shadow</span></span>
        <span className="line" aria-hidden="true"><span>of coal</span></span>
      </h1>

      <div className="hero__eclipse">
        <Eclipse ref={ecl} coverage={coal} title={`India's electricity in ${FACTS.last.y}: coal's shadow covers ${(coal * 100).toFixed(1)}% of the sun`} />
        <Tag tone="sun" className="hero__tag">{(coal * 100).toFixed(1)}% coal · {FACTS.last.y}</Tag>
      </div>

      <Note arrow="down-right" className="hero__note">
        drawn to scale: the shadow hides {(coal * 100).toFixed(1)}% of the sun, coal&apos;s share of India&apos;s power
      </Note>

      <p className="hero__intro">
        For forty years, about <strong>seven of every ten units</strong> of electricity India generates have come from
        burning coal. In {FACTS.last.y}, coal power fell by {Math.abs(FACTS.change.coal).toFixed(0)} TWh while total
        generation still grew. Nothing like it appears in the four decades before.
      </p>

      <div className="hero__cue" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
}
