import { useState } from 'react';
import {
  resolveCardColor,
  type AboutCardDTO,
} from '../lib/about-cards';
import { withBase } from '../lib/paths';
import { typograf } from '../lib/typograf';

type Props = {
  cards: AboutCardDTO[];
  /** Pre-rendered markdown → HTML for each card id */
  bodiesHtml: Record<number, string>;
};

export default function AboutCards({ cards, bodiesHtml }: Props) {
  const [active, setActive] = useState<string | null>(
    cards[0] ? String(cards[0].id) : null,
  );

  return (
    <section className="relative mx-auto w-full max-w-[1440px] px-5 pb-16 pt-6 md:px-20 md:pb-10 md:pt-8">
      <p className="mb-6 hidden max-w-[212px] text-[15px] leading-[20px] text-black/30 md:absolute md:left-20 md:top-8 md:mb-0 md:block">
        {typograf('*наведите на карточку, чтобы вывести ее на первый план')}
      </p>

      {/* Mobile: stack */}
      <div className="flex flex-col gap-4 md:hidden">
        {cards.map((card) => {
          const color = resolveCardColor(card.bg, card.text);
          return (
            <article
              key={card.id}
              className={`${color.bgClass} ${color.textClass} p-6`}
              style={color.style}
            >
              <CardHeader
                num={card.num}
                title={card.title}
                light={color.light}
              />
              <div
                className="prose-yy mt-4 text-[18px] leading-[26px]"
                dangerouslySetInnerHTML={{
                  __html: bodiesHtml[card.id] || '',
                }}
              />
              {card.hasCta ? <PortraitCta /> : null}
            </article>
          );
        })}
      </div>

      {/* Desktop: overlapping stage */}
      <div className="relative hidden min-h-[820px] w-full md:block">
        {cards.map((card) => {
          const key = String(card.id);
          const isFront = active === key;
          const color = resolveCardColor(card.bg, card.text);
          return (
            <article
              key={card.id}
              onMouseEnter={() => setActive(key)}
              onFocus={() => setActive(key)}
              tabIndex={0}
              style={{
                zIndex: isFront ? 50 : card.z,
                ...color.style,
              }}
              className={`absolute w-[min(617px,48%)] cursor-pointer p-7 transition-[transform,box-shadow] duration-300 outline-none ${color.bgClass} ${color.textClass} ${card.className} ${card.rotate ?? ''} ${
                isFront
                  ? 'scale-[1.02] shadow-[0_18px_40px_rgba(0,0,0,0.18)]'
                  : ''
              }`}
            >
              <CardHeader
                num={card.num}
                title={card.title}
                light={color.light}
              />
              <div
                className="prose-yy mt-3 text-[22px] leading-[31px]"
                dangerouslySetInnerHTML={{
                  __html: bodiesHtml[card.id] || '',
                }}
              />
              {card.hasCta ? <PortraitCta /> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CardHeader({
  num,
  title,
  light,
}: {
  num: string;
  title: string;
  light?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-[15px] leading-[20px]">
      <span>{num}</span>
      <span
        className={`inline-block h-px w-11 ${light ? 'bg-white' : 'bg-black'}`}
        aria-hidden
      />
      <span>{typograf(title)}</span>
    </div>
  );
}

function PortraitCta() {
  return (
    <a
      href="https://t.me/boookdirecting"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-8 flex items-center gap-4 lowercase text-[15px] leading-[20px] text-inherit opacity-90 hover:opacity-100"
    >
      <img
        src={withBase('/images/about/portrait.png')}
        alt=""
        className="h-[78px] w-[78px] shrink-0 rounded-full object-cover"
      />
      <span className="flex items-center gap-3">
        <span className="relative inline-flex h-[21px] w-[47px] shrink-0 items-center justify-center overflow-visible">
          <img
            src={withBase('/icons/about-arrow.svg')}
            alt=""
            className="absolute h-[46px] w-[18px] rotate-90"
          />
        </span>
        смотрим
      </span>
    </a>
  );
}
