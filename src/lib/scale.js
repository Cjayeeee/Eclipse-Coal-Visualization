/** Tiny, dependency-free scale & path helpers for the SVG charts. */

export function linear([d0, d1], [r0, r1]) {
  const k = (r1 - r0) / (d1 - d0 || 1);
  const f = (v) => r0 + (v - d0) * k;
  f.invert = (px) => d0 + (px - r0) / k;
  f.domain = [d0, d1];
  f.range = [r0, r1];
  return f;
}

/** "Nice" tick values between min and max. */
export function ticks(min, max, count = 5) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(+v.toFixed(10));
  return out;
}

export const niceMax = (max, count = 5) => {
  const t = ticks(0, max, count);
  const step = t[1] - t[0] || 1;
  return Math.ceil(max / step) * step;
};

/**
 * Stack rows into layers.
 * rows: [{ y: year, [key]: value }]; returns [{ key, pts: [{ x, y0, y1 }] }]
 */
export function stack(rows, keys, valueOf) {
  const base = rows.map(() => 0);
  return keys.map((key) => ({
    key,
    pts: rows.map((r, i) => {
      const v = valueOf(r, key);
      const y0 = base[i];
      base[i] += v;
      return { x: r.y, y0, y1: base[i] };
    }),
  }));
}

/** Closed area path from stacked points (straight segments: honest, no smoothing). */
export function areaPath(pts, x, y) {
  if (!pts.length) return '';
  let d = `M${x(pts[0].x).toFixed(1)},${y(pts[0].y1).toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) d += `L${x(pts[i].x).toFixed(1)},${y(pts[i].y1).toFixed(1)}`;
  for (let i = pts.length - 1; i >= 0; i--) d += `L${x(pts[i].x).toFixed(1)},${y(pts[i].y0).toFixed(1)}`;
  return d + 'Z';
}

export function linePath(points, x, y) {
  let d = '';
  let pen = false;
  for (const p of points) {
    if (p.v === null || p.v === undefined || Number.isNaN(p.v)) { pen = false; continue; }
    d += `${pen ? 'L' : 'M'}${x(p.x).toFixed(1)},${y(p.v).toFixed(1)}`;
    pen = true;
  }
  return d;
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Interpolate two layer sets with identical shape. */
export function lerpLayers(a, b, t) {
  return b.map((layer, li) => ({
    key: layer.key,
    pts: layer.pts.map((p, i) => {
      const q = a?.[li]?.pts?.[i] || p;
      return { x: p.x, y0: lerp(q.y0, p.y0, t), y1: lerp(q.y1, p.y1, t) };
    }),
  }));
}
