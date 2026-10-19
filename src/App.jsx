import { useEffect, useState } from 'react';
import Preloader from './components/Preloader';
import Nav from './components/Nav';
import Hero from './chapters/Hero';
import Appetite from './chapters/Appetite';
import Pattern from './chapters/Pattern';
import Explore from './chapters/Explore';
import TurningPoint from './chapters/TurningPoint';
import BiggerPicture from './chapters/BiggerPicture';
import Conclusion from './chapters/Conclusion';
import { ScrollTrigger } from './lib/motion';
import { startSmoothScroll, stopSmoothScroll } from './lib/smooth';

export default function App() {
  const [ready, setReady] = useState(false); // hero entrance may start
  const [loaded, setLoaded] = useState(false); // preloader gone, scrolling unlocked

  useEffect(() => {
    if (!loaded) return;
    // Smooth scrolling starts only once the preloader has released the page.
    startSmoothScroll();
    // Layout is final once fonts are in and the preloader is gone.
    ScrollTrigger.refresh();
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    // Mobile browsers resize the viewport when the URL bar hides; don't re-layout pins for that.
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Late layout changes (text re-splitting after a resize, chart re-measure) shift
    // everything below them; re-measure triggers when the document height settles.
    let last = document.documentElement.scrollHeight;
    let timer;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const h = document.documentElement.scrollHeight;
        if (Math.abs(h - last) > 2) {
          ScrollTrigger.refresh();
          last = document.documentElement.scrollHeight;
        }
      }, 250);
    });
    ro.observe(document.querySelector('main'));
    const onRefresh = () => { last = document.documentElement.scrollHeight; };
    ScrollTrigger.addEventListener('refresh', onRefresh);
    return () => {
      window.removeEventListener('load', onLoad);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      ro.disconnect();
      clearTimeout(timer);
      stopSmoothScroll();
    };
  }, [loaded]);

  return (
    <>
      <a className="skip" href="#explore">Skip to the interactive explorer</a>
      <Preloader
        onDone={(phase) => {
          setReady(true);
          if (phase !== 'reveal') setLoaded(true);
        }}
      />
      <Nav loaded={loaded} />
      <main>
        <Hero ready={ready} />
        <Appetite />
        <Pattern />
        <Explore />
        <TurningPoint />
        <BiggerPicture />
        <Conclusion />
      </main>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
