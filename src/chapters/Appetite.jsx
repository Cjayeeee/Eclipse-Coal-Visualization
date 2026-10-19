import { useRef } from 'react';
import Eclipse from '../components/Eclipse';
import { ChapterHead, Note, Torn } from '../components/Bits';
import { at, FACTS, share, total } from '../lib/data';
import { fmt0, people } from '../lib/format';
import { useReveals } from '../hooks/useReveals';
import { gsap, useGSAP, MQ } from '../lib/motion';

const STAMP_YEARS = [1985, 1995, 2005, 2015, 2025];

export default function Appetite() {
  const root = useRef(null);
  useReveals(root);

  const first = FACTS.first;
  const last = FACTS.last;
  const growth = total(last) / total(first);
  const stamps = STAMP_YEARS.map((y) => at('India', y)).filter(Boolean);
  const maxGen = Math.max(...stamps.map(total));

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root);
        gsap.from(q('.stamp'), {
          scale: 0,
          transformOrigin: '50% 100%',
          stagger: 0.14,
          duration: 1.1,
          ease: 'back.out(1.6)',
          scrollTrigger: { trigger: q('.stamps')[0], start: 'top 80%', once: true },
        });
        gsap.from(q('.stamps__base'), {
          scaleX: 0,
          transformOrigin: '0 50%',
          duration: 1.2,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: q('.stamps')[0], start: 'top 85%', once: true },
        });
        gsap.from(q('.fact'), {
          y: 50,
          autoAlpha: 0,
          stagger: 0.15,
          scrollTrigger: { trigger: q('.facts')[0], start: 'top 85%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="appetite" className="appetite" data-theme="dark" ref={root}>
      <div className="wrap">
        <ChapterHead num="01" kicker="The appetite" title="A country that keeps switching on" />

        <p className="appetite__lede">
          India now generates{' '}
          <strong className="hl-sun">
            <span data-count={growth.toFixed(1)} data-decimals="1" data-from="1">{growth.toFixed(1)}</span>×
          </strong>{' '}
          the electricity it did in {first.y}: from {fmt0(total(first))} to {fmt0(total(last))} terawatt-hours a year.
        </p>

        <figure className="stamps" aria-label={`Electricity generation in India by decade, with coal share shown as an eclipse`}>
          <div className="stamps__row">
            {stamps.map((r) => {
              const size = Math.sqrt(total(r) / maxGen);
              return (
                <div className="stamp" key={r.y} style={{ '--s': size }}>
                  <div className="stamp__disc">
                    <Eclipse coverage={share(r, 'coal')} rays={false} title={`${r.y}: ${fmt0(total(r))} TWh, ${(share(r, 'coal') * 100).toFixed(0)}% coal`} />
                  </div>
                  <p className="stamp__year">{r.y}</p>
                  <p className="stamp__val mono">{fmt0(total(r))} TWh</p>
                  <p className="stamp__coal mono">{(share(r, 'coal') * 100).toFixed(0)}% coal</p>
                </div>
              );
            })}
          </div>
          <span className="stamps__base" aria-hidden="true" />
          <figcaption className="caption">
            Disc area = total generation that year. The shadow = coal&apos;s share. Source: Ember, Energy Institute via OWID.
          </figcaption>
        </figure>

        <div className="facts">
          <div className="fact">
            <p className="fact__k mono">People</p>
            <p className="fact__v">
              {people(first.pop)} <span className="arrow">→</span> {people(last.pop)}
            </p>
            <p className="fact__d">×{(last.pop / first.pop).toFixed(1)} since {first.y}</p>
          </div>
          <div className="fact">
            <p className="fact__k mono">Electricity per person</p>
            <p className="fact__v">
              {fmt0(first.pc)} <span className="arrow">→</span> <span data-count={Math.round(last.pc)} data-from={Math.round(first.pc)}>{fmt0(last.pc)}</span>
              <small> kWh</small>
            </p>
            <p className="fact__d">×{(last.pc / first.pc).toFixed(1)} since {first.y}</p>
          </div>
          <div className="fact">
            <p className="fact__k mono">Coal&apos;s share</p>
            <p className="fact__v">
              {(share(first, 'coal') * 100).toFixed(0)}% <span className="arrow">→</span> {(share(last, 'coal') * 100).toFixed(0)}%
            </p>
            <p className="fact__d">It barely moved, even as the grid grew {growth.toFixed(0)}×</p>
          </div>
        </div>

        <Note arrow="down-left" className="appetite__note">
          almost twice the people, each using ~{Math.round(last.pc / first.pc)}× more power
        </Note>

        <p className="appetite__q" data-split>
          So where did all that new power come from?
        </p>
      </div>
      <Torn color="var(--paper)" seed={11} flip />
    </section>
  );
}
