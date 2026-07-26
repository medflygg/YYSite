import { useState } from 'react';
import { withBase } from '../lib/paths';
import { typograf, typografHtml } from '../lib/typograf';

type Card = {
  id: string;
  num: string;
  title: string;
  bodyHtml: string;
  bg: string;
  text: string;
  /** Desktop placement inside 1280×820 stage (approx Figma) */
  className: string;
  /** Default stacking order; hovered card jumps above all */
  z: number;
  rotate?: string;
  hasCta?: boolean;
};

const cards: Card[] = [
  {
    id: '01',
    num: '01',
    title: 'предисловие',
    bg: 'bg-[#f29009]',
    text: 'text-black',
    className: 'left-[31%] top-[32%]',
    z: 7,
    bodyHtml:
      'Я — книжный и графический дизайнер. Работаю с книгами, журналами и айдентикой. Беру на себя весь процесс: от исследования и поиска идеи до дизайна, верстки, допечатной подготовки и взаимодействия с типографиями. Работаю с издательствами, медиа, культурными проектами и частными заказчиками.',
  },
  {
    id: '02',
    num: '02',
    title: 'послужной список',
    bg: 'bg-[#f7bdb2]',
    text: 'text-black',
    className: 'left-[38%] top-[10%]',
    z: 4,
    rotate: 'rotate-[2deg]',
    bodyHtml:
      'Полтора года работала в журнале <span class="underline underline-offset-2">«Алло, мам»</span>, пройдя путь от ведущего дизайнера до руководителя дизайн-отдела, а параллельно была ведущим дизайнером калининградского журнала <span class="underline underline-offset-2">«9×12»</span>.<br /><br />Мое имя можно встретить на страницах книг издательств <em>Kongress W Press, АСТ, Бомбора, Nouveaux Angles, Рипол Классик, Калининградская книга</em>',
  },
  {
    id: '03',
    num: '03',
    title: 'образование',
    bg: 'bg-yy-yellow',
    text: 'text-black',
    className: 'left-[6%] top-[22%]',
    z: 5,
    rotate: '-rotate-[3deg]',
    bodyHtml:
      'Окончила бакалавриат Школы дизайна НИУ ВШЭ по профилю «Типографика». Сейчас учусь в магистратуре НИУ ВШЭ на направлении «Искусство книги», где продолжаю исследовать книжный дизайн и работу с печатными изданиями.',
  },
  {
    id: '04',
    num: '04',
    title: 'за кадром',
    bg: 'bg-[#4a6e7a]',
    text: 'text-white',
    className: 'left-[18%] top-[5%]',
    z: 3,
    bodyHtml:
      'Мне важно видеть проект целиком: от первой идеи и содержания до выбора бумаги, особенностей печати и готового экземпляра.<br /><br />Работаю не только с визуальной частью проекта, но и с его технической стороной. Понимаю, как собирается книга, какие решения влияют на производство, и сопровождаю проект до момента, когда он становится физическим объектом.',
  },
  {
    id: '05',
    num: '05',
    title: 'заметки на полях',
    bg: 'bg-[#4a6e7a]',
    text: 'text-white',
    className: 'left-[50%] top-[48%]',
    z: 6,
    rotate: '-rotate-[4deg]',
    hasCta: true,
    bodyHtml:
      'Веду блог о книжном дизайне, где делюсь своими проектами, интересными изданиями, находками, деталями верстки и полиграфии. Собираю коллекцию решений, которые вдохновляют и помогают смотреть на книги внимательнее.',
  },
  {
    id: '06',
    num: '06',
    title: 'за пределами страниц',
    bg: 'bg-[#aebf9f]',
    text: 'text-black',
    className: 'left-[46%] top-[9%]',
    z: 2,
    bodyHtml:
      'Если я не за компьютером, то, скорее всего, с фотоаппаратом или микрофоном в руках. Люблю фотографировать, поэтому сама снимаю все книжные проекты. А еще уже больше года занимаюсь вокалом (обожаю). Иногда делюсь опытом на лекциях и паблик-токах, однажды даже оказалась ведущей концерта. Неожиданно, но мне понравилось.',
  },
  {
    id: '07',
    num: '07',
    title: 'эпилог',
    bg: 'bg-[#aebf9f]',
    text: 'text-black',
    className: 'left-[2%] top-[40%]',
    z: 1,
    rotate: 'rotate-[2deg]',
    bodyHtml:
      'Каждая книга для меня — это диалог между автором, дизайнером и читателем. Мне интересно создавать издания, которые хочется не только прочитать, но и прожить.<br /><br />Сейчас в работе несколько новых проектов, но всегда есть место для следующего. Возможно, им станет именно ваш.',
  },
];

export default function AboutCards() {
  const [active, setActive] = useState<string | null>('01');

  return (
    <section className="relative mx-auto w-full max-w-[1440px] px-5 pb-16 pt-6 md:px-20 md:pb-10 md:pt-8">
      <p className="mb-6 max-w-[212px] text-[15px] leading-[20px] text-black/30 md:absolute md:left-20 md:top-8 md:mb-0">
        {typograf('*наведите на карточку, чтобы вывести ее на первый план')}
      </p>

      {/* Mobile: stack */}
      <div className="flex flex-col gap-4 md:hidden">
        {cards.map((card) => (
          <article key={card.id} className={`${card.bg} ${card.text} p-6`}>
            <CardHeader
              num={card.num}
              title={card.title}
              light={card.text === 'text-white'}
            />
            <p
              className="mt-4 text-[18px] leading-[26px]"
              dangerouslySetInnerHTML={{ __html: typografHtml(card.bodyHtml) }}
            />
            {card.hasCta ? <PortraitCta /> : null}
          </article>
        ))}
      </div>

      {/* Desktop: overlapping stage */}
      <div className="relative hidden min-h-[820px] w-full md:block">
        {cards.map((card) => {
          const isFront = active === card.id;
          return (
            <article
              key={card.id}
              onMouseEnter={() => setActive(card.id)}
              onFocus={() => setActive(card.id)}
              tabIndex={0}
              style={{ zIndex: isFront ? 50 : card.z }}
              className={`absolute w-[min(617px,48%)] cursor-pointer p-7 transition-[transform,box-shadow] duration-300 outline-none ${card.bg} ${card.text} ${card.className} ${card.rotate ?? ''} ${
                isFront
                  ? 'scale-[1.02] shadow-[0_18px_40px_rgba(0,0,0,0.18)]'
                  : ''
              }`}
            >
              <CardHeader
                num={card.num}
                title={card.title}
                light={card.text === 'text-white'}
              />
              <p
                className="mt-3 text-[22px] leading-[31px]"
                dangerouslySetInnerHTML={{ __html: typografHtml(card.bodyHtml) }}
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
      href="https://t.me/yanayurasovaa"
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
        {/* Ротация не меняет box — резервируем место под горизонтальную стрелку */}
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
