import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/** One motion vocabulary for the whole piece. */
gsap.defaults({ ease: 'power3.out', duration: 0.9 });
export const EASE = {
  out: 'power3.out',
  inOut: 'power2.inOut',
  snap: 'expo.out',
  sheet: 'power4.inOut',
};

export const MQ = {
  desktop: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 899px) and (prefers-reduced-motion: no-preference)',
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia(MQ.reduce).matches;

/** Masked line reveal for a heading. Returns the SplitText instance (revert on cleanup via context). */
export function splitLines(el, opts = {}) {
  return SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true, ...opts });
}

/** Count a number inside an element from → to. */
export function countTo(el, to, { from = 0, format = (v) => Math.round(v).toLocaleString('en-US'), ...tw } = {}) {
  const o = { v: from };
  el.textContent = format(from);
  return gsap.to(o, { v: to, duration: 1.6, ease: 'power2.out', ...tw, onUpdate: () => { el.textContent = format(o.v); } });
}

/** Prepare SVG strokes to be drawn (stroke-dash technique). */
export function prepDraw(paths) {
  gsap.utils.toArray(paths).forEach((p) => {
    const len = p.getTotalLength ? p.getTotalLength() : 1000;
    p.style.strokeDasharray = `${len} ${len}`;
    p.style.strokeDashoffset = `${len}`;
  });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
