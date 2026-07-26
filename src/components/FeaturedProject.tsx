import { useState } from 'react';
import { withBase } from '../lib/paths';
import { typograf } from '../lib/typograf';

export type FeaturedAward = { place?: string; text: string };

type Props = {
  title: string;
  summary: string;
  href: string;
  cover: string;
  cardImage?: string;
  layout?: 'left' | 'right';
  awards?: FeaturedAward[];
};

export default function FeaturedProject({
  title,
  summary,
  href,
  cover,
  cardImage,
  layout = 'left',
  awards = [],
}: Props) {
  const yellowFirst = layout === 'left';
  const panelImage = withBase(cardImage || cover);
  const coverSrc = withBase(cover);
  const link = withBase(href);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Mobile (Figma iPhone): обложка ↔ жёлтое описание по иконкам */}
      <div className="relative mx-auto w-full max-w-[342px] md:hidden">
        <div className="relative aspect-[342/483] w-full overflow-hidden bg-yy-yellow">
          {/* Обложка всегда в DOM — без чёрного мига при переключении */}
          <a
            href={link}
            className={`absolute inset-0 block transition-opacity duration-200 ${
              infoOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            tabIndex={infoOpen ? -1 : undefined}
            aria-hidden={infoOpen}
          >
            <img
              src={coverSrc}
              alt={title}
              className="h-full w-full object-cover object-center"
            />
          </a>

          <div
            className={`absolute inset-0 flex flex-col bg-yy-yellow px-5 pb-6 pt-4 transition-opacity duration-200 ${
              infoOpen
                ? 'opacity-100'
                : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={!infoOpen}
          >
            <h2 className="mb-4 max-w-[310px] pr-10 text-[clamp(28px,8vw,40px)] lowercase leading-[1.1]">
              {typograf(title)}
            </h2>
            <p className="mb-6 max-w-[300px] text-[15px] leading-[20px]">
              {typograf(summary)}
            </p>
            {awards.length > 0 && (
              <ul className="mb-8 space-y-3">
                {awards.map((award) => (
                  <li
                    key={award.text}
                    className="flex gap-3 text-[15px] leading-[20px]"
                  >
                    {award.place && (
                      <span className="mt-1 shrink-0 text-[7px] uppercase tracking-wide">
                        {award.place}
                      </span>
                    )}
                    <span>{typograf(award.text)}</span>
                  </li>
                ))}
              </ul>
            )}
            <a
              href={link}
              className="mt-auto flex items-center justify-center gap-2 text-black opacity-40 transition-opacity hover:opacity-100"
              tabIndex={infoOpen ? undefined : -1}
            >
              <span className="lowercase text-[15px]">смотрим</span>
              <span className="inline-flex h-4 w-8 items-center justify-center">
                <img
                  src={withBase('/icons/arrow-right-sm-black.svg')}
                  alt=""
                  className="h-8 w-4 -rotate-90"
                />
              </span>
            </a>
          </div>

          <button
            type="button"
            className="absolute right-3 top-3 z-10 flex h-[29px] w-[29px] items-center justify-center"
            aria-label={infoOpen ? 'Показать обложку' : 'Показать описание'}
            aria-pressed={infoOpen}
            onClick={() => setInfoOpen((v) => !v)}
          >
            <img
              src={withBase(
                infoOpen
                  ? '/icons/featured-photo.svg'
                  : '/icons/featured-info.svg',
              )}
              alt=""
              className="h-[29px] w-[29px]"
            />
          </button>
        </div>
      </div>

      {/* Desktop: узкая жёлтая карточка + широкая обложка */}
      <a
        href={link}
        className={`relative mx-auto hidden w-full max-w-[1280px] overflow-hidden md:grid ${
          yellowFirst
            ? 'md:grid-cols-[413fr_857fr]'
            : 'md:grid-cols-[857fr_413fr]'
        }`}
      >
        <div
          className={`featured-panel relative min-h-[560px] overflow-hidden ${
            yellowFirst ? 'md:order-1' : 'md:order-2'
          }`}
        >
          <img
            src={panelImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="featured-panel-overlay absolute inset-0 flex flex-col bg-yy-yellow p-7 opacity-0 transition-opacity duration-300 md:p-8">
            <h2 className="mb-6 max-w-[373px] text-[clamp(32px,4.5vw,55px)] lowercase leading-[1.1]">
              {typograf(title)}
            </h2>
            <p className="mb-8 max-w-[361px] text-[15px] leading-[20px]">
              {typograf(summary)}
            </p>
            {awards.length > 0 && (
              <ul className="mb-16 space-y-3">
                {awards.map((award) => (
                  <li
                    key={award.text}
                    className="flex gap-3 text-[15px] leading-[20px]"
                  >
                    {award.place && (
                      <span className="mt-1 shrink-0 text-[7px] uppercase tracking-wide">
                        {award.place}
                      </span>
                    )}
                    <span>{typograf(award.text)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 text-black opacity-40 transition-opacity duration-200 hover:opacity-100">
              <span className="lowercase text-[15px]">смотрим</span>
              <span className="inline-flex h-4 w-8 items-center justify-center">
                <img
                  src={withBase('/icons/arrow-right-sm-black.svg')}
                  alt=""
                  className="h-8 w-4 -rotate-90"
                />
              </span>
            </div>
          </div>
        </div>

        <div
          className={`relative min-h-[560px] overflow-hidden ${
            yellowFirst ? 'md:order-2' : 'md:order-1'
          }`}
        >
          <img
            src={coverSrc}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </a>
    </div>
  );
}
