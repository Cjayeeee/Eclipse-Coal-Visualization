import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StackedArea from '../charts/StackedArea';
import Eclipse from '../components/Eclipse';
import Tooltip from '../components/Tooltip';
import { ChapterHead, Marks, Note, Torn } from '../components/Bits';
import { EXPLORER_COUNTRIES, FIRST_YEAR, LAST_YEAR, SOURCE_BY_KEY, SOURCE_KEYS, SOURCES, series, share, total } from '../lib/data';
import { lerp, lerpLayers, niceMax, stack } from '../lib/scale';
import { fmt0, fmt1, pct, twh } from '../lib/format';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { useSize } from '../hooks/useSize';
import { useReveals } from '../hooks/useReveals';

const YEARS = [FIRST_YEAR, LAST_YEAR];
const MODES = {
  twh: { label: 'TWh', long: 'Terawatt-hours', value: (r, k) => r[k], fmt: (v) => fmt0(v), fmtTip: (v) => `${twh(v)} TWh` },
  share: { label: 'Share', long: '% of generation', value: (r, k) => (r[k] / total(r)) * 100, fmt: (v) => `${fmt0(v)}%`, fmtTip: (v) => `${fmt1(v)}%` },
  pc: { label: 'Per person', long: 'kWh per person', value: (r, k) => (r[k] * 1e9) / r.pop, fmt: (v) => fmt0(v), fmtTip: (v) => `${fmt0(v)} kWh` },
};

function build(country, mode, hidden) {
  const rows = series(country);
  const val = MODES[mode].value;
  const layers = stack(rows, SOURCE_KEYS, (r, k) => (hidden.has(k) ? 0 : val(r, k)));
  const top = Math.max(...layers[layers.length - 1].pts.map((p) => p.y1), 1e-6);
  const yMax = mode === 'share' && hidden.size === 0 ? 100 : niceMax(top, 5);
  return { layers, yMax };
}

export default function Explore() {
  const root = useRef(null);
  const [boxRef, size] = useSize({ width: 760, height: 440 });
  const [country, setCountry] = useState('India');
  const [mode, setMode] = useState('twh');
  const [hidden, setHidden] = useState(() => new Set());
  const [year, setYear] = useState(LAST_YEAR);
  const [hover, setHover] = useState(null); // { year, x, y }
  const [playing, setPlaying] = useState(false);
  useReveals(root);

  // Animated transition between data states: tween from what's on screen to the new target.
  const target = useMemo(() => build(country, mode, hidden), [country, mode, hidden]);
  const [view, setView] = useState(target);
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    const from = viewRef.current;
    if (from === target) return;
    if (prefersReducedMotion()) { setView(target); return; }
    const o = { t: 0 };
    const tw = gsap.to(o, {
      t: 1,
      duration: 0.85,
      ease: 'power3.inOut',
      onUpdate: () => setView({ layers: lerpLayers(from.layers, target.layers, o.t), yMax: lerp(from.yMax, target.yMax, o.t) }),
      onComplete: () => setView(target),
    });
    return () => tw.kill();
  }, [target]);

  // Play: sweep the year from the start (or current) to the end.
  const playTween = useRef(null);
  useEffect(() => {
    if (!playing) { playTween.current?.kill(); return; }
    const o = { y: year >= LAST_YEAR ? FIRST_YEAR : year };
    playTween.current = gsap.to(o, {
      y: LAST_YEAR,
      duration: ((LAST_YEAR - o.y) / (LAST_YEAR - FIRST_YEAR)) * 7 + 0.2,
      ease: 'none',
      onUpdate: () => setYear(Math.round(o.y)),
      onComplete: () => setPlaying(false),
    });
    return () => playTween.current?.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const rows = series(country);
  const rec = rows.find((r) => r.y === year) || rows[rows.length - 1];
  const hoverRec = hover ? rows.find((r) => r.y === hover.year) : null;
  const M = MODES[mode];
  const label = EXPLORER_COUNTRIES.find((c) => c.name === country)?.label;
  const compact = size.width < 560;

  const toggle = (k) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(k)) n.delete(k);
      else if (n.size < SOURCE_KEYS.length - 1) n.add(k);
      return n;
    });

  const onPointer = useCallback((y, x, py) => setHover({ year: y, x, y: py }), []);
  const onLeave = useCallback(() => setHover(null), []);
  const onSelect = useCallback((y) => { setPlaying(false); setYear(y); }, []);

  const onKey = (e) => {
    const step = e.shiftKey ? 5 : 1;
    let y = null;
    if (e.key === 'ArrowLeft') y = Math.max(FIRST_YEAR, year - step);
    if (e.key === 'ArrowRight') y = Math.min(LAST_YEAR, year + step);
    if (e.key === 'Home') y = FIRST_YEAR;
    if (e.key === 'End') y = LAST_YEAR;
    if (y !== null) {
      e.preventDefault();
      setPlaying(false);
      setYear(y);
      const m = compact ? 40 : 52;
      const w = size.width - m - (compact ? 8 : 18);
      setHover({ year: y, x: m + ((y - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR)) * w, y: 40, kb: true });
    }
    if (e.key === 'Escape') setHover(null);
  };

  const coal = share(rec, 'coal');
  const mix = [...SOURCES].reverse();

  return (
    <section id="explore" className="explore" data-theme="light" ref={root}>
      <div className="wrap">
        <ChapterHead num="03" kicker="Explore the data" title="Pick a grid, any grid" tone="ink" />
        <p className="explore__lede" data-reveal="up">
          India isn&apos;t the only country in a coal shadow, or the only one coming out of it. Compare twelve
          electricity systems, switch between totals, shares and per-person use, and hide sources to see what&apos;s
          underneath.
        </p>

        <div className="controls" data-reveal="up">
          <div className="control">
            <p className="control__k mono" id="lbl-country">Country</p>
            <div className="chips" role="radiogroup" aria-labelledby="lbl-country">
              {EXPLORER_COUNTRIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  role="radio"
                  aria-checked={country === c.name}
                  className={`chip ${country === c.name ? 'is-on' : ''}`}
                  onClick={() => setCountry(c.name)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="control control--row">
            <div>
              <p className="control__k mono" id="lbl-mode">Measure</p>
              <div className="seg" role="radiogroup" aria-labelledby="lbl-mode">
                {Object.entries(MODES).map(([k, m]) => (
                  <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => setMode(k)}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="control__sources">
              <p className="control__k mono" id="lbl-src">Sources <span className="muted">(tap to hide)</span></p>
              <div className="srcs" role="group" aria-labelledby="lbl-src">
                {mix.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={!hidden.has(s.key)}
                    className={`src ${hidden.has(s.key) ? 'is-off' : ''}`}
                    onClick={() => toggle(s.key)}
                  >
                    <i style={{ background: s.color }} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="explorer">
          <figure className="clip explorer__chart" data-reveal="up">
            <Marks />
            <div className="clip__head">
              <p className="mono">{label} · {M.long}</p>
              <p className="mono muted">Hover or tap a year · ←/→ keys when focused</p>
            </div>
            <div className="chart-box chart-box--explore" ref={boxRef}>
              <StackedArea
                width={size.width}
                height={size.height}
                layers={view.layers}
                years={YEARS}
                yMax={view.yMax}
                yFormat={M.fmt}
                yLabel={mode === 'share' ? '%' : mode === 'pc' ? 'kWh / person' : 'TWh'}
                compact={compact}
                marker={hover ? hover.year : year}
                onPointer={onPointer}
                onLeave={onLeave}
                onSelect={onSelect}
                tabIndex={0}
                onKeyDown={onKey}
                onBlur={() => hover?.kb && setHover(null)}
                aria-describedby="explore-tip"
                title={`${label}: electricity by source, ${M.long}, ${FIRST_YEAR}–${LAST_YEAR}`}
                desc={`Interactive stacked area chart. Selected year ${year}. Use left and right arrow keys to change the year.`}
              />
              <Tooltip id="explore-tip" visible={!!hoverRec} x={hover?.x || 0} y={hover?.y || 0} bounds={size.width}>
                {hoverRec && (
                  <>
                    <p className="tooltip__y">{label} · {hoverRec.y}</p>
                    <ul>
                      {mix.filter((s) => !hidden.has(s.key)).map((s) => (
                        <li key={s.key}>
                          <i style={{ background: s.color }} />
                          <span>{s.label}</span>
                          <b>{M.fmtTip(M.value(hoverRec, s.key))}</b>
                        </li>
                      ))}
                    </ul>
                    <p className="tooltip__total">
                      <span>{hidden.size ? 'Total shown' : 'Total'}</span>
                      <b>{M.fmtTip(SOURCE_KEYS.filter((k) => !hidden.has(k)).reduce((a, k) => a + M.value(hoverRec, k), 0))}</b>
                    </p>
                  </>
                )}
              </Tooltip>
            </div>
            <div className="timeline">
              <button type="button" className="play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : `Play ${FIRST_YEAR} to ${LAST_YEAR}`}>
                {playing ? (
                  <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="4" width="3.5" height="12" /><rect x="11.5" y="4" width="3.5" height="12" /></svg>
                ) : (
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" /></svg>
                )}
              </button>
              <input
                type="range"
                min={FIRST_YEAR}
                max={LAST_YEAR}
                step={1}
                value={year}
                onChange={(e) => { setPlaying(false); setYear(+e.target.value); }}
                aria-label="Selected year"
                aria-valuetext={String(year)}
                style={{ '--p': (year - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR) }}
              />
              <output className="timeline__y">{year}</output>
            </div>
          </figure>

          <aside className="readout" aria-live="polite" data-reveal="up" data-delay="0.15">
            <div className="readout__ecl">
              <Eclipse coverage={coal} rays={false} theme="light" title={`${label} ${rec.y}: coal ${pct(coal)} of generation`} />
            </div>
            <p className="readout__big"><span>{pct(coal)}</span> coal</p>
            <p className="readout__sub mono">{label} · {rec.y}</p>
            <dl className="readout__stats">
              <div><dt>Generation</dt><dd>{twh(total(rec))} <small>TWh</small></dd></div>
              <div><dt>Per person</dt><dd>{fmt0(rec.pc)} <small>kWh</small></dd></div>
              <div><dt>Carbon intensity</dt><dd>{rec.ci === null ? 'n/a' : fmt0(rec.ci)} <small>gCO₂e/kWh</small></dd></div>
            </dl>
            <ul className="mixbars">
              {mix.map((s) => {
                const sh = share(rec, s.key);
                return (
                  <li key={s.key} className={hidden.has(s.key) ? 'is-off' : ''}>
                    <span className="mixbars__l">{s.label}</span>
                    <span className="mixbars__bar"><i style={{ width: `${Math.max(sh * 100, sh > 0 ? 0.6 : 0)}%`, background: SOURCE_BY_KEY[s.key].color }} /></span>
                    <span className="mixbars__v">{pct(sh)}</span>
                  </li>
                );
              })}
            </ul>
            {rec.ci === null && <p className="caption">Carbon-intensity figures start in 2000 for most countries in this dataset.</p>}
          </aside>
        </div>
        <Note arrow="up-left" className="explore__note">try the UK, then press play</Note>
      </div>
      <Torn color="var(--soot)" seed={29} flip />
    </section>
  );
}
