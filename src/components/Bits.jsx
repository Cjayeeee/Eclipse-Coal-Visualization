/** Small shared editorial pieces: tags, handwritten notes, torn edges, print marks, chapter heads. */

export function Tag({ children, tone = 'sun', className = '', as: As = 'span', ...rest }) {
  return (
    <As className={`tag tag--${tone} ${className}`} {...rest}>
      <span className="tag__grip" aria-hidden="true">
        <i /><i /><i />
      </span>
      {children}
    </As>
  );
}

/** A handwritten margin note with an optional hand-drawn arrow. */
export function Note({ children, arrow = 'down-left', className = '', style }) {
  return (
    <div className={`note note--${arrow} ${className}`} style={style}>
      <p className="note__text">{children}</p>
      {arrow !== 'none' && (
        <svg className="note__arrow" viewBox="0 0 120 80" aria-hidden="true">
          {arrow === 'down-left' && <path className="draw" d="M110 6 C 90 40, 60 58, 14 66 M14 66 L 30 54 M14 66 L 30 74" />}
          {arrow === 'down-right' && <path className="draw" d="M10 6 C 30 40, 60 58, 106 66 M106 66 L 90 54 M106 66 L 90 75" />}
          {arrow === 'up-left' && <path className="draw" d="M110 74 C 88 40, 60 22, 14 14 M14 14 L 30 8 M14 14 L 26 28" />}
          {arrow === 'up-right' && <path className="draw" d="M10 74 C 32 40, 60 22, 106 14 M106 14 L 90 8 M106 14 L 94 28" />}
        </svg>
      )}
    </div>
  );
}

/** Deterministic torn-paper edge, drawn in the colour of the section it belongs to. */
function tornPath(seed, w = 1440, h = 40, steps = 64) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let d = `M0 ${h}`;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const y = 6 + rnd() * (h - 14) + (i % 2 ? 4 : -2);
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L${w} ${h} Z`;
}

export function Torn({ color = 'var(--paper)', seed = 3, flip = false, className = '' }) {
  return (
    <svg
      className={`torn ${flip ? 'torn--bottom' : 'torn--top'} ${className}`}
      viewBox="0 0 1440 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={tornPath(seed)} fill={color} />
    </svg>
  );
}

/** Riso registration marks pinned to the corners of a printed "clipping". */
export function Marks() {
  const m = (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M10 0V20M0 10H20" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
  return (
    <>
      <span className="mark mark--tl">{m}</span>
      <span className="mark mark--tr">{m}</span>
      <span className="mark mark--bl">{m}</span>
      <span className="mark mark--br">{m}</span>
    </>
  );
}

export function ChapterHead({ num, kicker, title, tone = 'sun' }) {
  return (
    <header className="chapter-head">
      <div className="chapter-head__row">
        <span className="chapter-head__num" data-reveal="fade">{num}</span>
        <Tag tone={tone} data-reveal="pop">{kicker}</Tag>
      </div>
      <h2 className="chapter-head__title" data-split>{title}</h2>
    </header>
  );
}
