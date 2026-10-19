import { memo, useId } from 'react';
import { SOURCE_BY_KEY } from '../lib/data';
import { areaPath, linear, ticks } from '../lib/scale';

/**
 * Stacked area chart (pure, presentational). Receives already-stacked (and possibly
 * interpolated) layers, so the same component serves the scroll-morph in chapter 02 and
 * the interactive explorer in chapter 03.
 */
function StackedArea({
  width,
  height,
  layers,
  years,
  yMax,
  yFormat = (v) => v,
  yLabel,
  yAxes = null,
  reveal = 1,
  marker = null,
  refLine = null,
  overlay = null,
  onPointer,
  onLeave,
  onSelect,
  compact = false,
  title,
  desc,
  ...svgProps
}) {
  const uid = useId().replace(/:/g, '');
  const m = { t: 18, r: compact ? 8 : 18, b: 30, l: compact ? 40 : 52 };
  const w = Math.max(10, width - m.l - m.r);
  const h = Math.max(10, height - m.t - m.b);
  const x = linear(years, [0, w]);
  const y = linear([0, yMax], [h, 0]);
  const yt = ticks(0, yMax, compact ? 4 : 5).filter((v) => v <= yMax + 1e-9);
  const span = years[1] - years[0];
  const step = w < 420 ? 10 : 5;
  const xt = [];
  for (let v = Math.ceil(years[0] / step) * step; v <= years[1]; v += step) xt.push(v);
  // Always label the first and last year; drop a neighbouring tick if it would collide.
  if (xt[0] !== years[0]) { if (xt[0] - years[0] < step * 0.6) xt[0] = years[0]; else xt.unshift(years[0]); }
  const lastT = xt[xt.length - 1];
  if (lastT !== years[1]) { if (years[1] - lastT < step * 0.6) xt[xt.length - 1] = years[1]; else xt.push(years[1]); }

  const yearAt = (px) => Math.round(Math.min(years[1], Math.max(years[0], x.invert(px - m.l))));

  const handle = (e) => {
    if (!onPointer) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const yr = yearAt(px);
    onPointer(yr, m.l + x(yr), e.clientY - r.top);
  };

  return (
    <svg
      className="chart chart--area"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-labelledby={`${uid}-t ${uid}-d`}
      {...svgProps}
    >
      <title id={`${uid}-t`}>{title}</title>
      <desc id={`${uid}-d`}>{desc}</desc>
      <defs>
        <clipPath id={`${uid}-clip`}>
          <rect x="0" y="-4" width={Math.max(0, w * reveal)} height={h + 8} />
        </clipPath>
      </defs>
      <g transform={`translate(${m.l},${m.t})`}>
        {/* grid + y axis */}
        {yAxes ? (
          yAxes.map((ax, ai) => (
            <g key={ai} className="axis axis--y" style={{ opacity: ax.opacity }}>
              {ax.ticks.map((t) => (
                <g key={t.v} transform={`translate(0,${y(t.v).toFixed(1)})`}>
                  <line x2={w} className={t.v === 0 ? 'axis__base' : 'axis__grid'} />
                  <text x={-8} dy="0.32em" textAnchor="end">{t.label}</text>
                </g>
              ))}
              {ax.label && <text className="axis__label" x={-m.l + 2} y={-6}>{ax.label}</text>}
            </g>
          ))
        ) : (
        <g className="axis axis--y">
          {yt.map((v) => (
            <g key={v} transform={`translate(0,${y(v).toFixed(1)})`}>
              <line x2={w} className={v === 0 ? 'axis__base' : 'axis__grid'} />
              <text x={-8} dy="0.32em" textAnchor="end">{yFormat(v)}</text>
            </g>
          ))}
          {yLabel && <text className="axis__label" x={-m.l + 2} y={-6}>{yLabel}</text>}
        </g>
        )}

        <g clipPath={`url(#${uid}-clip)`}>
          {layers.map((l) => (
            <path key={l.key} className={`area area--${l.key}`} d={areaPath(l.pts, x, y)} fill={SOURCE_BY_KEY[l.key].color} />
          ))}
        </g>

        {refLine && (
          <g className="refline" style={{ opacity: refLine.opacity ?? 1 }}>
            <line x1="0" x2={w * (refLine.draw ?? 1)} y1={y(refLine.value)} y2={y(refLine.value)} />
            <text x={6} y={y(refLine.value) - 8}>{refLine.label}</text>
          </g>
        )}

        <g className="axis axis--x" transform={`translate(0,${h})`}>
          {xt.map((v) => (
            <text key={v} x={x(v)} y={20} textAnchor={v === years[0] ? 'start' : v === years[1] ? 'end' : 'middle'}>{v}</text>
          ))}
        </g>

        {marker !== null && marker >= years[0] && marker <= years[1] && (
          <g className="marker" transform={`translate(${x(marker).toFixed(1)},0)`}>
            <line y1={-6} y2={h} />
            <circle cy={-6} r={3.5} />
          </g>
        )}

        {overlay && overlay({ x, y, w, h, span })}

        {onPointer && (
          <rect
            className="chart__hit"
            x={-m.l}
            y={-m.t}
            width={width}
            height={height}
            fill="transparent"
            onPointerMove={handle}
            onPointerDown={handle}
            onPointerLeave={onLeave}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onSelect?.(yearAt(e.clientX - r.left));
            }}
          />
        )}
      </g>
    </svg>
  );
}

export default memo(StackedArea);
