import { useRef } from 'react';
import { at } from '../lib/data';
import { fmt0 } from '../lib/format';
import { gsap, useGSAP, MQ } from '../lib/motion';

/** Horizontal bars of electricity generation per person (HTML bars: crisp text at any width). */
export default function PerCapitaBars({ countries, year, highlight = ['India', 'World'] }) {
  const root = useRef(null);
  const rows = countries
    .map((c) => ({ ...c, v: at(c.name, year)?.pc }))
    .filter((r) => r.v !== null && r.v !== undefined)
    .sort((a, b) => b.v - a.v);
  const max = Math.max(...rows.map((r) => r.v));

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root);
        gsap.from(q('.pcb__fill'), {
          scaleX: 0,
          transformOrigin: '0 50%',
          stagger: 0.07,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <ol className="pcb" ref={root} aria-label={`Electricity generation per person, ${year}, kWh`}>
      {rows.map((r) => (
        <li key={r.name} className={highlight.includes(r.name) ? `is-hl ${r.name === 'India' ? 'is-india' : ''}` : ''}>
          <span className="pcb__l">{r.label}</span>
          <span className="pcb__bar">
            <span className="pcb__fill" style={{ width: `${(r.v / max) * 100}%` }} />
          </span>
          <span className="pcb__v">{fmt0(r.v)}</span>
        </li>
      ))}
    </ol>
  );
}
