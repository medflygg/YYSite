import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { withBase } from '../lib/paths';

function stripBase(pathname: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  let path = pathname.replace(/\/+$/, '') || '/';
  if (base && path.startsWith(base)) {
    path = path.slice(base.length) || '/';
  }
  return path;
}

/** Показывать intro только при прямом заходе/обновлении главной, не при переходе с других разделов. */
function shouldPlayIntro() {
  try {
    const ref = document.referrer;
    if (!ref) return true;

    const refUrl = new URL(ref);
    if (refUrl.origin !== window.location.origin) return true;

    const path = stripBase(refUrl.pathname);
    if (path !== '/') return false;

    return true;
  } catch {
    return true;
  }
}

export default function IntroLoader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!shouldPlayIntro()) return;

    setShow(true);
    const t = window.setTimeout(() => setShow(false), 2400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[10000] overflow-hidden bg-yy-cream"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          onClick={() => setShow(false)}
        >
          <img
            src={withBase('/images/loader-vector-1.svg')}
            alt=""
            className="pointer-events-none absolute -left-10 top-0 h-[140%] w-auto max-w-none opacity-90"
          />
          <img
            src={withBase('/images/loader-vector-2.svg')}
            alt=""
            className="pointer-events-none absolute -right-4 -top-10 h-[130%] w-auto max-w-none opacity-90"
          />

          {/* Та же сетка, что у hero на главной: под шапкой + pt-16 pb-28 + justify-center */}
          <div className="relative z-10 flex h-full flex-col pt-[var(--header-height)]">
            <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 pt-16 pb-28 text-center">
              <motion.h1
                className="max-w-[520px] text-[clamp(36px,5vw,51px)] lowercase leading-[1.08] text-black"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.7 }}
              >
                Сначала форма,
                <br />
                Потом полка.
              </motion.h1>
              {/* Невидимый спейсер = подзаголовок на главной, чтобы центр совпал */}
              <p
                className="invisible mt-6 max-w-[405px] text-[15px] leading-[20px] lowercase"
                aria-hidden
              >
                Проектирую книги, журналы
                <br />
                и визуальные системы
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
