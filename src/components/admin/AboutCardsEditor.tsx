import { useEffect, useState, type DragEvent } from 'react';
import {
  ABOUT_CARD_PALETTE,
  DEFAULT_ABOUT_CARD_LAYOUTS,
  contrastTextClass,
  normalizeHex,
  resolveCardColor,
  type AboutCardDTO,
  type AboutCardInput,
} from '../../lib/about-cards';
import MarkdownEditor from './MarkdownEditor';

function reorder<T>(list: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length
  ) {
    return list;
  }
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function toInput(card: AboutCardDTO): AboutCardInput {
  return {
    id: card.id,
    title: card.title,
    body: card.body,
    bg: card.bg,
    text: card.text,
    className: card.className,
    z: card.z,
    rotate: card.rotate,
    hasCta: card.hasCta,
  };
}

export default function AboutCardsEditor() {
  const [cards, setCards] = useState<AboutCardInput[]>([]);
  const [status, setStatus] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  /** Mid-edit hex strings keyed by card index */
  const [hexDrafts, setHexDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch('/api/redactingpages/about-cards')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.cards) ? data.cards : [];
        setCards(list.map((c: AboutCardDTO) => toInput(c)));
      });
  }, []);

  async function save(next: AboutCardInput[] = cards) {
    setStatus('сохраняю...');
    const res = await fetch('/api/redactingpages/about-cards', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards: next }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || 'ошибка');
      return;
    }
    const data = await res.json();
    setCards((data.cards || []).map((c: AboutCardDTO) => toInput(c)));
    setStatus('сохранено');
  }

  function update(index: number, patch: Partial<AboutCardInput>) {
    setCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, ...patch } : card)),
    );
  }

  function addCard() {
    const i = cards.length;
    const palette = ABOUT_CARD_PALETTE[i % ABOUT_CARD_PALETTE.length];
    const layout =
      DEFAULT_ABOUT_CARD_LAYOUTS[i % DEFAULT_ABOUT_CARD_LAYOUTS.length];
    setCards((prev) => [
      ...prev,
      {
        title: 'новая карточка',
        body: '',
        bg: palette.bg,
        text: palette.text,
        className: layout.className,
        z: layout.z,
        rotate: layout.rotate,
        hasCta: false,
      },
    ]);
  }

  function removeCard(index: number) {
    setCards((prev) => prev.filter((_, i) => i !== index));
  }

  function onDragStart(index: number, e: DragEvent) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }

  function onDragOver(index: number, e: DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overIndex !== index) setOverIndex(index);
  }

  function onDrop(index: number, e: DragEvent) {
    e.preventDefault();
    const from = dragIndex ?? Number(e.dataTransfer.getData('text/plain'));
    if (Number.isFinite(from)) {
      setCards((prev) => reorder(prev, from, index));
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <section className="mb-16">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] lowercase">карточки «обо мне»</h2>
          <p className="mt-1 text-[13px] opacity-50">
            перетаскивай · плюс — добавить · сохранить внизу
          </p>
        </div>
        <button
          type="button"
          onClick={addCard}
          className="border border-black/25 px-4 py-2 text-[15px] lowercase hover:bg-black/5"
        >
          + карточка
        </button>
      </div>

      {status ? <p className="mb-4 text-[13px] opacity-50">{status}</p> : null}

      <ul className="space-y-4">
        {cards.map((card, index) => (
          <li
            key={card.id ?? `new-${index}`}
            draggable
            onDragStart={(e) => onDragStart(index, e)}
            onDragOver={(e) => onDragOver(index, e)}
            onDrop={(e) => onDrop(index, e)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={`border border-black/15 bg-white/40 p-4 ${
              overIndex === index ? 'ring-2 ring-yy-yellow' : ''
            } ${dragIndex === index ? 'opacity-60' : ''}`}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="cursor-grab text-[13px] opacity-50 active:cursor-grabbing">
                ⠿ {String(index + 1).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => removeCard(index)}
                className="text-[13px] lowercase opacity-50 hover:opacity-100"
              >
                удалить
              </button>
            </div>

            <label className="mb-3 block">
              <span className="mb-1 block text-[13px] opacity-50">заголовок</span>
              <input
                className="w-full border-0 border-b border-black/35 bg-transparent py-2 outline-none"
                value={card.title}
                onChange={(e) => update(index, { title: e.target.value })}
              />
            </label>

            <div
              className="mb-3"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <span className="mb-2 block text-[13px] opacity-50">цвет</span>
              <div className="flex flex-wrap items-center gap-2">
                {ABOUT_CARD_PALETTE.map((swatch) => {
                  const selected = card.bg === swatch.bg;
                  return (
                    <button
                      key={swatch.bg}
                      type="button"
                      title={swatch.label}
                      aria-label={swatch.label}
                      aria-pressed={selected}
                      onClick={() => {
                        setHexDrafts((prev) => {
                          const next = { ...prev };
                          delete next[index];
                          return next;
                        });
                        update(index, { bg: swatch.bg, text: swatch.text });
                      }}
                      className={`h-8 w-8 border border-black/20 ${
                        selected ? 'ring-2 ring-black ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  );
                })}
              </div>
              {(() => {
                const color = resolveCardColor(card.bg || '', card.text);
                const draft =
                  hexDrafts[index] ?? color.hex ?? '';
                return (
                  <label className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[13px] opacity-50">свой код</span>
                    <input
                      type="color"
                      className="h-8 w-10 cursor-pointer border border-black/20 bg-transparent p-0"
                      value={color.hex || '#ffd900'}
                      onChange={(e) => {
                        const hex = normalizeHex(e.target.value);
                        if (!hex) return;
                        setHexDrafts((prev) => ({ ...prev, [index]: hex }));
                        update(index, {
                          bg: `bg-[${hex}]`,
                          text: contrastTextClass(hex),
                        });
                      }}
                    />
                    <input
                      className="w-[7.5rem] border-0 border-b border-black/35 bg-transparent py-1 font-mono text-[14px] outline-none"
                      placeholder="#ffd900"
                      value={draft}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setHexDrafts((prev) => ({ ...prev, [index]: raw }));
                        const hex = normalizeHex(raw);
                        if (!hex) return;
                        update(index, {
                          bg: `bg-[${hex}]`,
                          text: contrastTextClass(hex),
                        });
                      }}
                      onBlur={() => {
                        const hex = normalizeHex(hexDrafts[index] ?? '');
                        if (hex) {
                          setHexDrafts((prev) => ({ ...prev, [index]: hex }));
                        } else {
                          setHexDrafts((prev) => {
                            const next = { ...prev };
                            delete next[index];
                            return next;
                          });
                        }
                      }}
                    />
                    <span
                      className={`ml-1 px-3 py-1.5 text-[13px] lowercase ${color.bgClass} ${color.textClass}`}
                      style={color.style}
                    >
                      превью
                    </span>
                  </label>
                );
              })()}
            </div>

            <div className="mb-3">
              <MarkdownEditor
                label="текст"
                value={card.body}
                onChange={(body) => update(index, { body })}
                minHeightClass="min-h-[120px]"
              />
            </div>

            <label className="flex items-center gap-2 text-[13px] lowercase">
              <input
                type="checkbox"
                checked={Boolean(card.hasCta)}
                onChange={(e) => update(index, { hasCta: e.target.checked })}
              />
              блок «смотрим» (портрет + telegram)
            </label>
          </li>
        ))}
      </ul>

      {cards.length === 0 ? (
        <p className="mb-4 text-[15px] opacity-50">карточек пока нет</p>
      ) : null}

      <button
        type="button"
        onClick={() => void save()}
        className="mt-6 bg-yy-yellow px-5 py-2 text-[15px] lowercase"
      >
        сохранить карточки
      </button>
    </section>
  );
}
