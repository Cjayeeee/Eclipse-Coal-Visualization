import { useEffect, useRef, useState } from 'react';
import Eclipse from './Eclipse';
import { gsap, prefersReducedMotion } from '../lib/motion';

const BASE = import.meta.env.BASE_URL;
const FONTS = ['400 1em Anton', '400 1em "Archivo Variable"', '600 1em "Archivo Variable"', '400 1em Caveat', '400 1em "JetBrains Mono"'];
const IMAGES = [`${BASE}tex/crinkle.jpg`, `${BASE}tex/grain.png`];

function loadImage(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = img.onerror = () => res();
    img.src = src;
  });
}

/**
 * Opening scene: the moon slides across the sun as essential assets load.
 * At 100% it is a total eclipse, then the shadow swells to fill the screen and
 * becomes the night sky of the hero. No artificial waiting once assets are ready.
 */
export default function Preloader({ onDone }) {
  const root = useRef(null);
  const ecl = useRef(null);
  const countRef = useRef(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduce = prefersReducedMotion();
    const shown = { p: 0 };
    let loaded = 0;
    const tasks = [...FONTS.map((f) => document.fonts.load(f).catch(() => {})), ...IMAGES.map(loadImage)];
    const total = tasks.length;

    const render = () => {
      ecl.current?.set(shown.p);
      if (countRef.current) countRef.current.textContent = String(Math.round(shown.p * 100)).padStart(3, '0');
    };

    const ctx = gsap.context(() => {
      if (!reduce) {
        gsap.from('.preloader__word span', { yPercent: 120, stagger: 0.05, duration: 0.8, ease: 'expo.out' });
        gsap.from('.preloader .eclipse', { scale: 0.7, autoAlpha: 0, duration: 0.9, ease: 'expo.out' });
        gsap.to('.preloader .eclipse__rays', { rotate: 360, duration: 40, repeat: -1, ease: 'none', svgOrigin: '0 0' });
      }
    }, root);

    let progressTween;
    const bump = () => {
      loaded += 1;
      progressTween?.kill();
      progressTween = gsap.to(shown, { p: loaded / total, duration: reduce ? 0 : 0.5, ease: 'power2.out', onUpdate: render });
    };
    tasks.forEach((t) => t.then(bump));

    Promise.all(tasks).then(async () => {
      await document.fonts.ready;
      ctx.add(() => {
        const svg = root.current.querySelector('.eclipse');
        const box = svg.getBoundingClientRect();
        const sunPx = (box.width * 60) / 220;
        const cover = (Math.hypot(window.innerWidth, window.innerHeight) / 2 / sunPx) * 1.15;
        const finish = () => {
          document.documentElement.classList.remove('is-loading');
          setGone(true);
          onDone?.();
        };
        if (reduce) {
          gsap.to(root.current, { autoAlpha: 0, duration: 0.3, onComplete: finish });
          return;
        }
        const tl = gsap.timeline({ onComplete: finish });
        tl.to(shown, { p: 1, duration: 0.35, onUpdate: render })
          .to('.preloader__meta, .preloader__word', { autoAlpha: 0, y: -12, duration: 0.4, ease: 'power2.in' }, '<')
          .to('.preloader .eclipse__rays', { autoAlpha: 0, scale: 1.4, svgOrigin: '0 0', duration: 0.5 }, '<')
          .to(svg, { scale: cover, duration: 1.05, ease: 'expo.in' }, '-=0.1')
          // Hand over to the hero: let the page underneath begin its entrance as we cut.
          .add(() => onDone?.('reveal'), '-=0.25')
          .to(root.current, { autoAlpha: 0, duration: 0.35, ease: 'none' });
      });
    });

    return () => { progressTween?.kill(); ctx.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;
  return (
    <div className="preloader" ref={root} role="status" aria-live="polite" aria-label="Loading the story">
      <div className="preloader__paper" aria-hidden="true" />
      <div className="preloader__stage">
        <Eclipse ref={ecl} coverage={0} theme="light" title="Loading" />
      </div>
      <p className="preloader__word" aria-hidden="true">
        {'ECLIPSE'.split('').map((c, i) => <span key={i}>{c}</span>)}
      </p>
      <div className="preloader__meta">
        <span>India · Electricity · 1985–2025</span>
        <span>
          <span ref={countRef}>000</span>%
        </span>
      </div>
    </div>
  );
}
