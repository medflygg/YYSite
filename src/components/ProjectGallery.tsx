import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { withBase } from '../lib/paths';

type Props = {
  images: string[];
  alt: string;
};

type Side = 'left' | 'right';

export default function ProjectGallery({ images, alt }: Props) {
  const slides = (images.length > 0 ? images : ['/images/hero-books.png']).map(
    withBase,
  );
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [side, setSide] = useState<Side>('right');
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [finePointer, setFinePointer] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + slides.length) % slides.length),
    [slides.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const sync = () => setFinePointer(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!hovering || !finePointer) return;
    const onMove = (e: MouseEvent) => {
      const el = areaRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({ x: e.clientX, y: e.clientY });
      setSide(e.clientX < rect.left + rect.width / 2 ? 'left' : 'right');
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [hovering, finePointer]);

  const canFlip = slides.length > 1;

  return (
    <div className="relative w-full">
      <div
        ref={areaRef}
        className={`relative aspect-[916/667] w-full overflow-hidden bg-black/5 ${
          canFlip && finePointer ? 'cursor-none' : 'cursor-default'
        }`}
        onMouseEnter={() => canFlip && finePointer && setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => {
          if (!canFlip || !finePointer) return;
          if (side === 'left') prev();
          else next();
        }}
        role={canFlip && finePointer ? 'button' : undefined}
        tabIndex={canFlip && finePointer ? 0 : undefined}
        aria-label={canFlip ? 'Листать изображения проекта' : undefined}
        onKeyDown={(e) => {
          if (!canFlip) return;
          if (e.key === 'ArrowLeft') prev();
          if (e.key === 'ArrowRight') next();
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={slides[index]}
            src={slides[index]}
            alt={`${alt} — ${index + 1}`}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        </AnimatePresence>
      </div>

      {canFlip && finePointer && hovering && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[9999] max-md:hidden"
          style={{ left: pos.x, top: pos.y }}
        >
          <div
            style={{
              transform: side === 'left' ? 'rotate(90deg)' : 'rotate(-90deg)',
              transformOrigin: '0 0',
            }}
          >
            <img
              src={withBase('/icons/arrow-gallery.svg')}
              alt=""
              className="block h-11 w-6"
              style={{ transform: 'translate(-50%, -100%)' }}
            />
          </div>
        </div>
      )}

      {canFlip && (
        <div className="mt-4 flex items-center justify-between px-1 md:hidden">
          <button
            type="button"
            onClick={prev}
            className="cursor-pointer p-2"
            aria-label="Предыдущее изображение"
          >
            <img
              src={withBase('/icons/arrow-gallery.svg')}
              alt=""
              className="h-11 w-6 rotate-90"
            />
          </button>
          <span className="text-[13px] text-black/50">
            {index + 1} / {slides.length}
          </span>
          <button
            type="button"
            onClick={next}
            className="cursor-pointer p-2"
            aria-label="Следующее изображение"
          >
            <img
              src={withBase('/icons/arrow-gallery.svg')}
              alt=""
              className="h-11 w-6 -rotate-90"
            />
          </button>
        </div>
      )}
    </div>
  );
}
