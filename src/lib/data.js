import raw from '../data/electricity.json';

/** Dataset metadata (source, units, build date). */
export const META = raw.meta;

/**
 * Electricity sources, in stacking order (bottom → top).
 * Coal sits at the bottom like bedrock; the sun sits on top.
 */
export const SOURCES = [
  { key: 'coal', label: 'Coal', color: '#1d1915', ink: '#f2ead9' },
  { key: 'gasoil', label: 'Gas & oil', color: '#a3927c', ink: '#1d1915' },
  { key: 'nuclear', label: 'Nuclear', color: '#7656d8', ink: '#f2ead9' },
  { key: 'hydro', label: 'Hydro', color: '#2d6bd9', ink: '#f2ead9' },
  { key: 'other', label: 'Bioenergy & other', color: '#7c9636', ink: '#f2ead9' },
  { key: 'wind', label: 'Wind', color: '#14a096', ink: '#1d1915' },
  { key: 'solar', label: 'Solar', color: '#ffb400', ink: '#1d1915' },
];
export const SOURCE_KEYS = SOURCES.map((s) => s.key);
export const SOURCE_BY_KEY = Object.fromEntries(SOURCES.map((s) => [s.key, s]));

/** Countries offered in the explorer (all have a complete 1985–2025 series). */
export const EXPLORER_COUNTRIES = [
  { name: 'India', label: 'India' },
  { name: 'China', label: 'China' },
  { name: 'United States', label: 'USA' },
  { name: 'European Union (27)', label: 'EU-27' },
  { name: 'Germany', label: 'Germany' },
  { name: 'United Kingdom', label: 'UK' },
  { name: 'Japan', label: 'Japan' },
  { name: 'Brazil', label: 'Brazil' },
  { name: 'South Africa', label: 'South Africa' },
  { name: 'Australia', label: 'Australia' },
  { name: 'Vietnam', label: 'Vietnam' },
  { name: 'World', label: 'World' },
];

export const series = (name) => raw.countries[name] || [];
export const at = (name, year) => series(name).find((r) => r.y === year) || null;

/** Sum of the seven source categories (matches OWID total within rounding). */
export const total = (rec) => SOURCE_KEYS.reduce((s, k) => s + (rec[k] || 0), 0);
export const share = (rec, key) => (rec ? (rec[key] || 0) / total(rec) : 0);

export const INDIA = series('India');
export const FIRST_YEAR = INDIA[0].y;
export const LAST_YEAR = INDIA[INDIA.length - 1].y;

/** Derived, data-driven facts used in the narrative copy. */
function buildFacts() {
  const first = INDIA[0];
  const last = INDIA[INDIA.length - 1];
  const prev = INDIA[INDIA.length - 2];
  const shares = INDIA.map((r) => ({ y: r.y, v: share(r, 'coal') }));
  const peak = shares.reduce((a, b) => (b.v > a.v ? b : a));
  const low = shares.reduce((a, b) => (b.v < a.v ? b : a));
  // Last earlier year with a share at or below the latest value.
  const lowestSince = [...shares].reverse().slice(1).find((s) => s.v <= shares[shares.length - 1].v);
  const solar2010 = at('India', 2010);
  const world = at('World', last.y);
  const change = Object.fromEntries(SOURCE_KEYS.map((k) => [k, last[k] - prev[k]]));
  return {
    first, last, prev, peak, low, lowestSince, solar2010, world,
    change,
    genChange: total(last) - total(prev),
    genGrowth: total(last) / total(prev) - 1,
    coalDrops: INDIA.slice(1).map((r, i) => ({ y: r.y, d: r.coal - INDIA[i].coal })).filter((d) => d.d < -1),
  };
}
export const FACTS = buildFacts();
