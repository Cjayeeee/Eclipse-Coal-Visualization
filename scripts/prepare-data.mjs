// Builds src/data/electricity.json from Our World in Data's energy dataset.
// Source CSV: https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv
// Usage: node scripts/prepare-data.mjs path/to/owid-energy-data.csv
import fs from 'node:fs';
import path from 'node:path';

const src = process.argv[2];
if (!src) { console.error('Pass the path to owid-energy-data.csv'); process.exit(1); }

const COUNTRIES = [
  'India', 'World', 'China', 'United States', 'European Union (27)', 'Germany',
  'United Kingdom', 'Japan', 'Brazil', 'South Africa', 'Australia', 'Vietnam',
  'Indonesia', 'Pakistan', 'Bangladesh',
];
const FROM = 1985;

// Minimal CSV parser (OWID file has quoted fields only in a few text columns).
function parseCSV(text) {
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const [head, ...body] = parseCSV(fs.readFileSync(src, 'utf8'));
const col = Object.fromEntries(head.map((h, i) => [h, i]));
const num = (r, k) => { const v = r[col[k]]; return v === '' || v === undefined ? null : +v; };
const r2 = (v) => (v === null ? null : Math.round(v * 100) / 100);

const out = { meta: {
  source: 'Our World in Data energy dataset (owid/energy-data), compiled from Ember Yearly Electricity Data (2026) and Energy Institute Statistical Review of World Energy (2025)',
  url: 'https://github.com/owid/energy-data',
  units: { generation: 'TWh', perCapita: 'kWh per person', carbonIntensity: 'gCO2e per kWh' },
  built: new Date().toISOString().slice(0, 10),
}, countries: {} };

for (const r of body) {
  const name = r[col.country];
  if (!COUNTRIES.includes(name)) continue;
  const year = +r[col.year];
  if (year < FROM) continue;
  const gen = num(r, 'electricity_generation');
  const coal = num(r, 'coal_electricity');
  if (gen === null || coal === null) continue;
  const z = (v) => v ?? 0;
  const rec = {
    y: year,
    coal: r2(coal),
    gasoil: r2(z(num(r, 'gas_electricity')) + z(num(r, 'oil_electricity'))),
    nuclear: r2(z(num(r, 'nuclear_electricity'))),
    hydro: r2(z(num(r, 'hydro_electricity'))),
    wind: r2(z(num(r, 'wind_electricity'))),
    solar: r2(z(num(r, 'solar_electricity'))),
    other: r2(z(num(r, 'biofuel_electricity')) + z(num(r, 'other_renewable_exc_biofuel_electricity'))),
    gen: r2(gen),
    pc: r2(num(r, 'per_capita_electricity')),
    ci: r2(num(r, 'carbon_intensity_elec')),
    pop: num(r, 'population'),
  };
  (out.countries[name] ||= []).push(rec);
}
for (const k of Object.keys(out.countries)) out.countries[k].sort((a, b) => a.y - b.y);

const dest = path.resolve('src/data/electricity.json');
fs.writeFileSync(dest, JSON.stringify(out));
console.log('wrote', dest, (fs.statSync(dest).size / 1024).toFixed(1) + ' KB');
for (const k of COUNTRIES) { const s = out.countries[k] || []; console.log(k.padEnd(22), s.length, s[0]?.y, s.at(-1)?.y); }
