import { useRef } from 'react';
import ShareLines from '../charts/ShareLines';
import PerCapitaBars from '../charts/PerCapitaBars';
import { ChapterHead, Marks, Note, Torn } from '../components/Bits';
import { at, FACTS, series, share } from '../lib/data';
import { fmt0 } from '../lib/format';
import { useReveals } from '../hooks/useReveals';

const LINES = [
  { name: 'India', label: 'India' },
  { name: 'South Africa', label: 'S. Africa' },
  { name: 'China', label: 'China' },
  { name: 'World', label: 'World' },
  { name: 'Germany', label: 'Germany' },
  { name: 'United States', label: 'USA' },
  { name: 'United Kingdom', label: 'UK' },
];

const PC = [
  { name: 'United States', label: 'USA' },
  { name: 'China', label: 'China' },
  { name: 'Germany', label: 'Germany' },
  { name: 'World', label: 'World average' },
  { name: 'Brazil', label: 'Brazil' },
  { name: 'Vietnam', label: 'Vietnam' },
  { name: 'India', label: 'India' },
  { name: 'Pakistan', label: 'Pakistan' },
  { name: 'Bangladesh', label: 'Bangladesh' },
];

export default function BiggerPicture() {
  const root = useRef(null);
  useReveals(root);
  const Y = FACTS.last.y;
  const uk90 = at('United Kingdom', 1990);
  const ukNow = at('United Kingdom', Y);
  const india = FACTS.last;
  const world = FACTS.world;
  const ratio = india.pc / world.pc;
  const ciRatio = india.ci / world.ci;
  const chinaPeak = series('China')
    .map((r) => ({ y: r.y, v: share(r, 'coal') }))
    .reduce((a, b) => (b.v > a.v ? b : a));

  return (
    <section id="road" className="road" data-theme="light" ref={root}>
      <div className="wrap">
        <ChapterHead num="05" kicker="The bigger picture" title="The long road out of the shadow" tone="ink" />

        <div className="road__block">
          <div className="road__copy">
            <h3 className="h3" data-split>Shadows can lift, and fast</h3>
            <p data-reveal="up">
              In 1990 the United Kingdom got {(share(uk90, 'coal') * 100).toFixed(0)}% of its electricity from coal, close to
              India&apos;s {(share(at('India', 1990), 'coal') * 100).toFixed(0)}% that year. By {Y} it was{' '}
              {(share(ukNow, 'coal') * 100).toFixed(1)}%. Germany and the United States have more than halved their coal
              shares since 1990. China&apos;s peaked at {(chinaPeak.v * 100).toFixed(0)}% in {chinaPeak.y} and is now{' '}
              {(share(at('China', Y), 'coal') * 100).toFixed(0)}%.
            </p>
            <p data-reveal="up" className="muted">
              Hover or tap a name to follow one country. Lines show coal&apos;s share of each country&apos;s electricity
              generation.
            </p>
          </div>
          <figure className="clip road__chart" data-reveal="up">
            <Marks />
            <div className="clip__head"><p className="mono">Coal&apos;s share of electricity generation, 1985–{Y}</p></div>
            <ShareLines countries={LINES} years={[1985, Y]} />
            <figcaption className="caption">Source: Ember; Energy Institute (pre-2000) via OWID.</figcaption>
          </figure>
        </div>

        <div className="road__block road__block--flip">
          <div className="road__copy">
            <h3 className="h3" data-split>But India&apos;s appetite has barely begun</h3>
            <p data-reveal="up">
              The average person in India accounts for {fmt0(india.pc)} kWh of generation a year, about{' '}
              <strong>{ratio < 0.4 ? 'a third' : `${(ratio * 100).toFixed(0)}%`}</strong> of the world average ({fmt0(world.pc)} kWh). As
              incomes rise, that gap is likely to narrow, and every unit of new demand will be met either by coal or by
              something cleaner.
            </p>
            <div className="ci" data-reveal="up">
              <p className="mono">Carbon intensity of electricity, {Y}</p>
              <div className="ci__row">
                <span className="ci__l">India</span>
                <span className="ci__bar"><i style={{ width: `${(india.ci / 800) * 100}%` }} className="is-india" /></span>
                <span className="ci__v">{fmt0(india.ci)} g</span>
              </div>
              <div className="ci__row">
                <span className="ci__l">World</span>
                <span className="ci__bar"><i style={{ width: `${(world.ci / 800) * 100}%` }} /></span>
                <span className="ci__v">{fmt0(world.ci)} g</span>
              </div>
              <p className="caption">
                gCO₂e per kWh (lifecycle). Each unit of Indian electricity carries ~{((ciRatio - 1) * 100).toFixed(0)}% more emissions than the
                world average. Bar scale: 0–800 g.
              </p>
            </div>
          </div>
          <figure className="clip road__chart" data-reveal="up">
            <Marks />
            <div className="clip__head"><p className="mono">Electricity generation per person, {Y} (kWh)</p></div>
            <PerCapitaBars countries={PC} year={Y} />
            <figcaption className="caption">Generation ÷ population. Source: Ember via OWID.</figcaption>
          </figure>
        </div>
        <Note arrow="up-right" className="road__note">a third of the world average, and climbing every year</Note>
      </div>
      <Torn color="var(--soot)" seed={37} flip />
    </section>
  );
}
