import { withBase } from '../lib/paths';

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

  return (
    <a
      href={withBase(href)}
      className={`relative mx-auto grid w-full max-w-[1280px] grid-cols-1 overflow-hidden ${
        yellowFirst
          ? 'md:grid-cols-[413fr_857fr]'
          : 'md:grid-cols-[857fr_413fr]'
      }`}
    >
      {/* Узкий фрейм жёлтой карточки: слева при left, справа при right */}
      <div
        className={`featured-panel relative min-h-[420px] overflow-hidden md:min-h-[560px] ${
          yellowFirst ? 'md:order-1' : 'md:order-2'
        }`}
      >
        <img
          src={panelImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div
          className="featured-panel-overlay absolute inset-0 flex flex-col bg-yy-yellow p-7 opacity-0 transition-opacity duration-300 md:p-8"
        >
          <h2 className="mb-6 max-w-[373px] text-[clamp(32px,4.5vw,55px)] lowercase leading-[1.1]">
            {title}
          </h2>
          <p className="mb-8 max-w-[361px] text-[15px] leading-[20px]">{summary}</p>
          {awards.length > 0 && (
            <ul className="mb-16 space-y-3">
              {awards.map((award) => (
                <li key={award.text} className="flex gap-3 text-[15px] leading-[20px]">
                  {award.place && (
                    <span className="mt-1 shrink-0 text-[7px] uppercase tracking-wide">
                      {award.place}
                    </span>
                  )}
                  <span>{award.text}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 text-black">
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

      {/* Вторая (большая) картинка — без появления жёлтого блока */}
      <div
        className={`relative min-h-[320px] overflow-hidden md:min-h-[560px] ${
          yellowFirst ? 'md:order-2' : 'md:order-1'
        }`}
      >
        <img
          src={withBase(cover)}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </a>
  );
}
