/**
 * The eclipse encoding.
 * Two equal discs (sun and moon) of radius r. The moon's offset d is solved so
 * that the overlapping area equals `coverage` × sun area. So the visible shadow
 * is an honest, area-true picture of the coal share.
 */

/** Overlap fraction of two equal circles (radius r) whose centres are d apart. */
export function overlapFraction(d, r) {
  if (d >= 2 * r) return 0;
  if (d <= 0) return 1;
  const a = 2 * r * r * Math.acos(d / (2 * r)) - (d / 2) * Math.sqrt(4 * r * r - d * d);
  return a / (Math.PI * r * r);
}

/** Inverse: offset d (0…2r) that yields a given coverage (0…1). Bisection; monotonic. */
export function offsetFor(coverage, r) {
  const c = Math.min(1, Math.max(0, coverage));
  if (c >= 1) return 0;
  if (c <= 0) return 2 * r;
  let lo = 0;
  let hi = 2 * r;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (overlapFraction(mid, r) > c) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Imperatively position a moon <g>/<circle> for a coverage value (used by GSAP scrubs). */
export function setMoon(el, coverage, r = 60) {
  if (!el) return;
  el.setAttribute("transform", `translate(${(-offsetFor(coverage, r)).toFixed(2)} 0)`);
}
