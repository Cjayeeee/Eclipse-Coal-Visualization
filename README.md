# ECLIPSE: India's electricity in coal's shadow

An interactive, scroll-driven data story about forty years of India's electricity (1985–2025) and the year
coal power fell while total generation still grew.

**Concept.** The whole piece is built around one area-true graphic: a sun partly covered by a moon. The share
of the sun hidden by the moon is exactly coal's share of electricity (70.8% for India in 2025). As you
scroll, the moon slides and the page moves from soot-black night through paper to sunlight.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build
```

Requires Node 18+.

## Chapters

| # | Chapter | What happens |
|---|---------|--------------|
|  | Preloader | The moon crosses the sun as fonts and textures load. At totality the shadow fills the screen and becomes the hero's night. |
| 00 | In the shadow | Hero. The eclipse is drawn at the real 2025 coal share. |
| 01 | The appetite | Generation grew 11× since 1985. "Stamps" (disc area = TWh, shadow = coal share) for each decade, with count-up figures. |
| 02 | The 70% line | Pinned and scrubbed. A stacked area chart draws 1985→2025, then morphs from TWh to % share, showing coal stayed between 62% and 77%. |
| 03 | Pick a grid | Interactive explorer: 12 countries, TWh / share / per-person, source toggles, year slider with play, hover/tap tooltips, arrow-key navigation, live eclipse readout. |
| 04 | 2025 | Pinned turning point: "Demand rose. Coal fell anyway." Then a solar disc grows (area ∝ TWh) from 2010 to 2025 next to coal at the same scale, and floods the screen with sunlight. Followed by a waterfall chart of the 2024→2025 change by source, with the hydro and demand caveats. |
| 05 | The long road | Coal-share lines for seven countries (the UK went from 65% to 0.1%), per-person generation bars, carbon intensity. |
| 06 | Epilogue | Pinned. The eclipse replays every year 1985→2025 as you scroll. Takeaway, sources, method and limitations. |

## Data

* **Source:** [Our World in Data energy dataset](https://github.com/owid/energy-data), compiled from
  [Ember Yearly Electricity Data](https://ember-energy.org/data/yearly-electricity-data/) (2000 onward) and the
  [Energy Institute Statistical Review of World Energy](https://www.energyinst.org/statistical-review/) (before 2000).
* **Units:** generation in TWh; per-person generation in kWh; carbon intensity in lifecycle gCO₂e/kWh.
* **Snapshot:** `src/data/electricity.json` (~90 KB). It's a static file so the site doesn't depend on a
  rate-limited API at runtime.
* **Refresh:**
  ```bash
  curl -L -o owid-energy-data.csv https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv
  npm run data -- owid-energy-data.csv
  ```
  All narrative numbers are computed from the JSON (`src/lib/data.js` → `FACTS`), so the copy updates with the data.
* **Limitations:** some small categories are missing before 2000 and are counted as zero. 2025 values are the
  latest Ember release and may be revised. The figures are generation, not consumption. Causes mentioned in the copy
  (rainfall/hydro, slower demand growth) are context, not attribution.

## Structure

```
src/
  lib/          smooth (Lenis), data selectors & derived facts, scales/stacking, eclipse geometry, GSAP setup, formatting
  hooks/        useReveals (declarative scroll reveals), useSize (ResizeObserver)
  components/   Eclipse, Preloader, Nav (masthead + chapter rail), Tooltip, Bits (tags, notes, torn edges, marks)
  charts/       StackedArea, Waterfall, ShareLines, PerCapitaBars (hand-built SVG/HTML, no chart library)
  chapters/     Hero, Appetite, Pattern, Explore, TurningPoint, BiggerPicture, Conclusion
  styles/       base (tokens), components, chapters (incl. tablet & mobile)
scripts/prepare-data.mjs   CSV → JSON
public/tex/                generated paper-crinkle and grain textures
```

## Motion & accessibility notes

* GSAP 3.13 + ScrollTrigger + SplitText (all free since 3.13). Every animation is created inside
  `useGSAP` + `gsap.matchMedia`, so it is reverted on unmount and rebuilt per breakpoint.
* Smooth scrolling: [Lenis](https://github.com/darkroomengineering/lenis) (`src/lib/smooth.js`), driven by
  `gsap.ticker` with `lenis.on('scroll', ScrollTrigger.update)`, so Lenis, pins and scrubs advance on the same frame.
  It starts once the preloader releases the page. Chapter-rail and back-to-top links scroll through Lenis.
  Touch devices keep native momentum (`syncTouch: false`), and reduced-motion users get plain native scrolling.
* Three pinned scenes only (02, 04, 06). Scrubbed values drive React state or direct SVG attributes.
  `invalidateOnRefresh` handles resize. `ignoreMobileResize` avoids URL-bar jumps.
* `prefers-reduced-motion`: no pins or scrubs. Final states are shown, chapter 02 gets a Totals/Shares toggle,
  and the epilogue gets a year slider.
* Charts have titles/descriptions. The explorer chart is focusable (←/→, Shift for 5 years, Home/End).
  Controls use radio/pressed semantics. Tooltips work with mouse, touch and keyboard.
* Fonts (Anton, Archivo, Caveat, JetBrains Mono) are self-hosted via Fontsource, so there are no third-party requests.
