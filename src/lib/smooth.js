import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion';

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so Lenis, ScrollTrigger and every
 * timeline advance on the same frame (no double-RAF jitter, pins stay locked).
 * Skipped entirely for reduced-motion users: they get native scrolling.
 */
let lenis = null;

export function startSmoothScroll() {
  if (lenis || prefersReducedMotion()) return lenis;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)), // expo-out
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
    syncTouch: false, // keep native momentum on touch devices
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

function raf(time) {
  lenis?.raf(time * 1000);
}

export function stopSmoothScroll() {
  if (!lenis) return;
  gsap.ticker.remove(raf);
  lenis.destroy();
  lenis = null;
}

export const getLenis = () => lenis;

/** Scroll to a y position or element, smoothly when Lenis is running. */
export function scrollToTarget(target, { offset = 0, immediate = false } = {}) {
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate, duration: 1.6 });
    return;
  }
  const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: y + offset, behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' });
}
