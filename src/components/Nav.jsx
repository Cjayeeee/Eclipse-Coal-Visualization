import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../lib/motion';
import { scrollToTarget } from '../lib/smooth';
import Eclipse from './Eclipse';
import { FACTS, share } from '../lib/data';

export const CHAPTERS = [
  { id: 'prologue', num: '00', label: 'In the shadow' },
  { id: 'appetite', num: '01', label: 'The appetite' },
  { id: 'line', num: '02', label: 'The 70% line' },
  { id: 'explore', num: '03', label: 'Pick a grid' },
  { id: 'turn', num: '04', label: '2025' },
  { id: 'road', num: '05', label: 'The long road' },
  { id: 'epilogue', num: '06', label: 'Epilogue' },
];

/** Fixed masthead + chapter rail. Colour flips with each chapter's theme. */
export default function Nav({ loaded }) {
  const root = useRef(null);
  const bar = useRef(null);
  const [active, setActive] = useState(0);
  const [theme, setTheme] = useState('dark');

  // Pinned scenes that change colour mid-pin (chapter 04) announce it with an event.
  useEffect(() => {
    const on = (e) => setTheme(e.detail);
    window.addEventListener('eclipse:theme', on);
    return () => window.removeEventListener('eclipse:theme', on);
  }, []);

  useGSAP(
    () => {
      if (!loaded) return;
      gsap.from(root.current.children, { autoAlpha: 0, y: -16, stagger: 0.1, duration: 0.8, delay: 0.4 });
      CHAPTERS.forEach((c, i) => {
        const el = document.getElementById(c.id);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top 45%',
          end: 'bottom 45%',
          onToggle: (self) => {
            if (self.isActive) setActive(i);
          },
        });
      });
      // Masthead theme follows whatever is under the top edge of the screen.
      document.querySelectorAll('[data-theme]').forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 40px',
          end: 'bottom 40px',
          onToggle: (self) => self.isActive && setTheme(el.dataset.theme),
        });
      });
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => gsap.set(bar.current, { scaleY: self.progress }),
      });
    },
    { dependencies: [loaded], scope: root }
  );

  const go = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    scrollToTarget(el, { offset: 2 });
  };

  return (
    <div className={`nav nav--${theme}`} ref={root}>
      <a className="nav__brand" href="#prologue" onClick={(e) => { e.preventDefault(); go('prologue'); }} aria-label="Eclipse: back to the top">
        <Eclipse coverage={share(FACTS.last, 'coal')} rays={false} theme={theme} title="Eclipse logo" />
        <span>ECLIPSE</span>
      </a>
      <p className="nav__now" aria-live="polite">
        <span className="nav__num">{CHAPTERS[active].num}</span>
        <span className="nav__label">{CHAPTERS[active].label}</span>
      </p>
      <nav className="nav__rail" aria-label="Chapters">
        <span className="nav__track" aria-hidden="true"><span ref={bar} className="nav__bar" /></span>
        <ol>
          {CHAPTERS.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={i === active ? 'is-active' : ''}
                aria-current={i === active ? 'step' : undefined}
                onClick={() => go(c.id)}
              >
                <span className="nav__dot" aria-hidden="true" />
                <span className="nav__tip">{c.num} · {c.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
