const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export const fmt0 = (v) => (v === null || v === undefined ? 'n/a' : nf0.format(v));
export const fmt1 = (v) => (v === null || v === undefined ? 'n/a' : nf1.format(v));
export const fmt2 = (v) => (v === null || v === undefined ? 'n/a' : nf2.format(v));
export const pct = (v, d = 1) => (v === null || v === undefined ? 'n/a' : `${(v * 100).toFixed(d)}%`);
export const signed = (v, d = 1) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(d)}`;

/** TWh with sensible precision for tiny values (solar in 2010 = 0.11 TWh). */
export const twh = (v) => (v === null || v === undefined ? 'n/a' : v < 1 ? fmt2(v) : v < 100 ? fmt1(v) : fmt0(v));

export const people = (v) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : `${Math.round(v / 1e6)}M`);
