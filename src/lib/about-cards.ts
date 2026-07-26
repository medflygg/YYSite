export type AboutCardDTO = {
  id: number;
  num: string;
  title: string;
  body: string;
  bg: string;
  text: string;
  className: string;
  z: number;
  rotate: string | null;
  hasCta: boolean;
  sortOrder: number;
};

export type AboutCardInput = {
  id?: number;
  title: string;
  body: string;
  bg?: string;
  text?: string;
  className?: string;
  z?: number;
  rotate?: string | null;
  hasCta?: boolean;
};

export const ABOUT_CARD_PALETTE = [
  { bg: 'bg-[#f29009]', text: 'text-black', hex: '#f29009', label: 'оранжевый' },
  { bg: 'bg-[#f7bdb2]', text: 'text-black', hex: '#f7bdb2', label: 'персиковый' },
  { bg: 'bg-yy-yellow', text: 'text-black', hex: '#ffd900', label: 'жёлтый' },
  { bg: 'bg-[#4a6e7a]', text: 'text-white', hex: '#4a6e7a', label: 'сине-серый' },
  { bg: 'bg-[#aebf9f]', text: 'text-black', hex: '#aebf9f', label: 'оливковый' },
] as const;

/** Normalize `#rgb` / `#rrggbb` / `rgb` → `#rrggbb`, or null. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw
      .split('')
      .map((c) => c + c)
      .join('')
      .toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toLowerCase()}`;
  }
  return null;
}

export function contrastTextClass(hex: string): 'text-black' | 'text-white' {
  const h = normalizeHex(hex);
  if (!h) return 'text-black';
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  // relative luminance threshold
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.55 ? 'text-black' : 'text-white';
}

/** Resolve stored bg (palette class or `#hex`) for rendering. */
export function resolveCardColor(bg: string, text?: string) {
  const preset = ABOUT_CARD_PALETTE.find((p) => p.bg === bg);
  if (preset) {
    return {
      bgClass: preset.bg,
      textClass: (text || preset.text) as string,
      style: undefined as { backgroundColor: string } | undefined,
      hex: preset.hex,
      light: (text || preset.text) === 'text-white',
    };
  }

  const fromClass = bg.match(/^bg-\[#([0-9a-fA-F]{3,8})\]$/);
  const hex = normalizeHex(fromClass ? `#${fromClass[1]}` : bg);
  if (hex) {
    const textClass = text || contrastTextClass(hex);
    return {
      bgClass: '',
      textClass,
      style: { backgroundColor: hex },
      hex,
      light: textClass === 'text-white',
    };
  }

  return {
    bgClass: bg || 'bg-yy-yellow',
    textClass: text || 'text-black',
    style: undefined as { backgroundColor: string } | undefined,
    hex: null as string | null,
    light: text === 'text-white',
  };
}

export const DEFAULT_ABOUT_CARD_LAYOUTS = [
  { className: 'left-[31%] top-[32%]', z: 7, rotate: null },
  { className: 'left-[38%] top-[10%]', z: 4, rotate: 'rotate-[2deg]' },
  { className: 'left-[6%] top-[22%]', z: 5, rotate: '-rotate-[3deg]' },
  { className: 'left-[18%] top-[5%]', z: 3, rotate: null },
  { className: 'left-[50%] top-[48%]', z: 6, rotate: '-rotate-[4deg]' },
  { className: 'left-[46%] top-[9%]', z: 2, rotate: null },
  { className: 'left-[2%] top-[40%]', z: 1, rotate: 'rotate-[2deg]' },
] as const;

/** Seed content — markdown (inline HTML allowed). */
export const DEFAULT_ABOUT_CARDS: Omit<AboutCardDTO, 'id'>[] = [
  {
    num: '01',
    title: 'предисловие',
    bg: 'bg-[#f29009]',
    text: 'text-black',
    className: 'left-[31%] top-[32%]',
    z: 7,
    rotate: null,
    hasCta: false,
    sortOrder: 0,
    body: 'Я — книжный и графический дизайнер. Работаю с книгами, журналами и айдентикой. Беру на себя весь процесс: от исследования и поиска идеи до дизайна, верстки, допечатной подготовки и взаимодействия с типографиями. Работаю с издательствами, медиа, культурными проектами и частными заказчиками.',
  },
  {
    num: '02',
    title: 'послужной список',
    bg: 'bg-[#f7bdb2]',
    text: 'text-black',
    className: 'left-[38%] top-[10%]',
    z: 4,
    rotate: 'rotate-[2deg]',
    hasCta: false,
    sortOrder: 1,
    body: 'Полтора года работала в журнале <span class="underline underline-offset-2">«Алло, мам»</span>, пройдя путь от ведущего дизайнера до руководителя дизайн-отдела, а параллельно была ведущим дизайнером калининградского журнала <span class="underline underline-offset-2">«9×12»</span>.\n\nМое имя можно встретить на страницах книг издательств *Kongress W Press, АСТ, Бомбора, Nouveaux Angles, Рипол Классик, Калининградская книга*',
  },
  {
    num: '03',
    title: 'образование',
    bg: 'bg-yy-yellow',
    text: 'text-black',
    className: 'left-[6%] top-[22%]',
    z: 5,
    rotate: '-rotate-[3deg]',
    hasCta: false,
    sortOrder: 2,
    body: 'Окончила бакалавриат Школы дизайна НИУ ВШЭ по профилю «Типографика». Сейчас учусь в магистратуре НИУ ВШЭ на направлении «Искусство книги», где продолжаю исследовать книжный дизайн и работу с печатными изданиями.',
  },
  {
    num: '04',
    title: 'за кадром',
    bg: 'bg-[#4a6e7a]',
    text: 'text-white',
    className: 'left-[18%] top-[5%]',
    z: 3,
    rotate: null,
    hasCta: false,
    sortOrder: 3,
    body: 'Мне важно видеть проект целиком: от первой идеи и содержания до выбора бумаги, особенностей печати и готового экземпляра.\n\nРаботаю не только с визуальной частью проекта, но и с его технической стороной. Понимаю, как собирается книга, какие решения влияют на производство, и сопровождаю проект до момента, когда он становится физическим объектом.',
  },
  {
    num: '05',
    title: 'заметки на полях',
    bg: 'bg-[#4a6e7a]',
    text: 'text-white',
    className: 'left-[50%] top-[48%]',
    z: 6,
    rotate: '-rotate-[4deg]',
    hasCta: true,
    sortOrder: 4,
    body: 'Веду блог о книжном дизайне, где делюсь своими проектами, интересными изданиями, находками, деталями верстки и полиграфии. Собираю коллекцию решений, которые вдохновляют и помогают смотреть на книги внимательнее.',
  },
  {
    num: '06',
    title: 'за пределами страниц',
    bg: 'bg-[#aebf9f]',
    text: 'text-black',
    className: 'left-[46%] top-[9%]',
    z: 2,
    rotate: null,
    hasCta: false,
    sortOrder: 5,
    body: 'Если я не за компьютером, то, скорее всего, с фотоаппаратом или микрофоном в руках. Люблю фотографировать, поэтому сама снимаю все книжные проекты. А еще уже больше года занимаюсь вокалом (обожаю). Иногда делюсь опытом на лекциях и паблик-токах, однажды даже оказалась ведущей концерта. Неожиданно, но мне понравилось.',
  },
  {
    num: '07',
    title: 'эпилог',
    bg: 'bg-[#aebf9f]',
    text: 'text-black',
    className: 'left-[2%] top-[40%]',
    z: 1,
    rotate: 'rotate-[2deg]',
    hasCta: false,
    sortOrder: 6,
    body: 'Каждая книга для меня — это диалог между автором, дизайнером и читателем. Мне интересно создавать издания, которые хочется не только прочитать, но и прожить.\n\nСейчас в работе несколько новых проектов, но всегда есть место для следующего. Возможно, им станет именно ваш.',
  },
];

export function formatCardNum(index: number) {
  return String(index + 1).padStart(2, '0');
}
