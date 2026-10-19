import { gsap, ScrollTrigger, SplitText, useGSAP, MQ, prepDraw } from '../lib/motion';

/**
 * Declarative scroll reveals for a chapter, driven by data attributes:
 *  [data-split]           masked line-by-line heading reveal
 *  [data-reveal=up|fade|pop|clip]  element entrance
 *  .note                  handwritten note: text wipes in, arrow draws
 *  [data-count]           number counts up to data-count (data-decimals, data-prefix, data-suffix)
 * All created inside one gsap.matchMedia so reduced-motion users get final states and
 * everything is reverted when the chapter unmounts.
 */
export function useReveals(scope, deps = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const root = scope.current;
        const q = gsap.utils.selector(root);

        q('[data-split]').forEach((el) => {
          SplitText.create(el, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110,
                rotate: 2,
                stagger: 0.09,
                duration: 1,
                ease: 'expo.out',
                scrollTrigger: { trigger: el, start: 'top 85%', once: true },
              }),
          });
        });

        q('[data-reveal]').forEach((el) => {
          const kind = el.dataset.reveal;
          const from =
            kind === 'pop' ? { scale: 0.6, rotate: -8, autoAlpha: 0, ease: 'back.out(2)' }
            : kind === 'fade' ? { autoAlpha: 0 }
            : kind === 'clip' ? { clipPath: 'inset(0 100% 0 0)', ease: 'power4.inOut', duration: 1.2 }
            : { y: 40, autoAlpha: 0 };
          gsap.from(el, {
            ...from,
            delay: +(el.dataset.delay || 0),
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        });

        q('.note').forEach((note) => {
          const text = note.querySelector('.note__text');
          const paths = note.querySelectorAll('.draw');
          prepDraw(paths);
          const tl = gsap.timeline({ scrollTrigger: { trigger: note, start: 'top 85%', once: true } });
          tl.from(text, { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power2.inOut' })
            .to(paths, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4');
        });

        q('[data-count]').forEach((el) => {
          const to = +el.dataset.count;
          const dec = +(el.dataset.decimals || 0);
          const pre = el.dataset.prefix || '';
          const suf = el.dataset.suffix || '';
          const fmt = (v) => pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
          const o = { v: +(el.dataset.from || 0) };
          el.textContent = fmt(o.v);
          gsap.to(o, {
            v: to,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: () => { el.textContent = fmt(o.v); },
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope, dependencies: deps }
  );
}

export { ScrollTrigger };
