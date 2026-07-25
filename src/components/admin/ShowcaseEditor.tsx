import { useEffect, useMemo, useState, type DragEvent } from 'react';
import AdminShell from './AdminShell';

type Award = { place?: string; text: string };

type Item = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  cover: string;
  cardImage: string | null;
  caption: string | null;
  client: string | null;
  category: 'books' | 'magazines' | 'other';
  featured: boolean;
  featuredLayout: 'left' | 'right';
  awards: Award[];
};

type Showcase = {
  featured: Item[];
  books: Item[];
  magazines: Item[];
  other: Item[];
};

const PORTFOLIO = [
  {
    key: 'books' as const,
    label: 'книги',
    hero: '/portfolio/books-hero.jpg',
  },
  {
    key: 'magazines' as const,
    label: 'журналы',
    hero: '/portfolio/magazines-hero.jpg',
  },
  {
    key: 'other' as const,
    label: 'другое',
    hero: '/portfolio/other-hero.jpg',
  },
];

function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

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
    const from =
      dragIndex ?? Number(e.dataTransfer.getData('text/plain'));
    if (Number.isFinite(from)) onReorder(from, index);
    setDragIndex(null);
    setOverIndex(null);
  }

  function onDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  return {
    dragIndex,
    overIndex,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
  };
}

export default function ShowcaseEditor() {
  const [data, setData] = useState<Showcase | null>(null);
  const [all, setAll] = useState<Item[]>([]);
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState<'home' | 'portfolio'>('home');
  const [picker, setPicker] = useState<null | {
    mode: 'featured' | 'books' | 'magazines' | 'other';
  }>(null);

  async function load() {
    const [showcaseRes, projectsRes] = await Promise.all([
      fetch('/api/redactingpages/showcase'),
      fetch('/api/redactingpages/projects'),
    ]);
    setData(await showcaseRes.json());
    setAll(await projectsRes.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveFeatured(list: Item[]) {
    setData((d) => (d ? { ...d, featured: list } : d));
    setStatus('сохраняю...');
    await fetch('/api/redactingpages/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'featured', ids: list.map((i) => i.id) }),
    });
    setStatus('сохранено');
    await load();
  }

  async function savePortfolio(key: 'books' | 'magazines' | 'other', list: Item[]) {
    setData((d) => (d ? { ...d, [key]: list } : d));
    setStatus('сохраняю...');
    await fetch('/api/redactingpages/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'portfolio',
        category: key,
        ids: list.map((i) => i.id),
      }),
    });
    setStatus('сохранено');
    await load();
  }

  async function setLayout(id: number, layout: 'left' | 'right') {
    if (!data) return;
    const next = data.featured.map((p) =>
      p.id === id ? { ...p, featuredLayout: layout } : p,
    );
    setData({ ...data, featured: next });
    setStatus('сохраняю...');
    await fetch(`/api/redactingpages/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featuredLayout: layout }),
    });
    setStatus('сохранено');
  }

  async function removeFeatured(id: number) {
    if (!data) return;
    await saveFeatured(data.featured.filter((p) => p.id !== id));
  }

  async function addProject(project: Item) {
    if (!data || !picker) return;
    if (picker.mode === 'featured') {
      await saveFeatured([...data.featured, project]);
    } else {
      await savePortfolio(picker.mode, [...data[picker.mode], project]);
    }
    setPicker(null);
  }

  const pickerCandidates = useMemo(() => {
    if (!data || !picker) return [];
    if (picker.mode === 'featured') {
      const ids = new Set(data.featured.map((p) => p.id));
      return all.filter((p) => !ids.has(p.id));
    }
    const ids = new Set(data[picker.mode].map((p) => p.id));
    return all.filter((p) => !ids.has(p.id));
  }, [all, data, picker]);

  if (!data) {
    return (
      <AdminShell title="витрины" wide>
        <p className="px-5 opacity-50 md:px-10">загрузка...</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="витрины" wide>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 md:px-10">
        <p className="text-[14px] opacity-50">
          перетаскивай · плюс — добавить · убрать — снять с витрины
        </p>
        {status ? <p className="text-[13px] opacity-40">{status}</p> : null}
      </div>

      <div className="sticky top-[62px] z-10 mb-6 flex gap-2 border-b border-black/10 bg-yy-cream/95 px-5 py-3 backdrop-blur md:px-10">
        <button
          type="button"
          className={`px-3 py-1.5 text-[14px] lowercase ${
            tab === 'home' ? 'bg-yy-yellow' : 'opacity-50 hover:opacity-100'
          }`}
          onClick={() => setTab('home')}
        >
          главная
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-[14px] lowercase ${
            tab === 'portfolio' ? 'bg-yy-yellow' : 'opacity-50 hover:opacity-100'
          }`}
          onClick={() => setTab('portfolio')}
        >
          портфолио
        </button>
      </div>

      {tab === 'home' ? (
        <HomeShowcase
          items={data.featured}
          onReorder={(from, to) =>
            void saveFeatured(reorder(data.featured, from, to))
          }
          onLayout={setLayout}
          onRemove={(id) => void removeFeatured(id)}
          onAdd={() => setPicker({ mode: 'featured' })}
        />
      ) : (
        <div>
          {PORTFOLIO.map((section) => (
            <PortfolioShowcase
              key={section.key}
              label={section.label}
              hero={section.hero}
              items={data[section.key]}
              onReorder={(from, to) =>
                void savePortfolio(
                  section.key,
                  reorder(data[section.key], from, to),
                )
              }
              onAdd={() => setPicker({ mode: section.key })}
            />
          ))}
        </div>
      )}

      {picker ? (
        <ProjectPicker
          title={
            picker.mode === 'featured'
              ? 'добавить на главную'
              : `добавить в «${PORTFOLIO.find((s) => s.key === picker.mode)?.label}»`
          }
          candidates={pickerCandidates}
          onClose={() => setPicker(null)}
          onPick={(p) => void addProject(p)}
        />
      ) : null}
    </AdminShell>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <img
      src="/icons/plus.svg"
      alt=""
      className={className ?? 'h-12 w-12 opacity-40'}
    />
  );
}

function ProjectPicker({
  title,
  candidates,
  onClose,
  onPick,
}: {
  title: string;
  candidates: Item[];
  onClose: () => void;
  onPick: (project: Item) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col bg-yy-cream"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
          <h3 className="text-[16px] lowercase">{title}</h3>
          <button
            type="button"
            className="text-[13px] opacity-50 hover:opacity-100"
            onClick={onClose}
          >
            закрыть
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {candidates.length === 0 ? (
            <p className="text-[14px] opacity-40">
              нет проектов для добавления
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {candidates.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="group block w-full text-left"
                    onClick={() => onPick(p)}
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-black/10">
                      {p.cover ? (
                        <img
                          src={p.cover}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : null}
                    </div>
                    <div className="mt-2 text-[14px] lowercase">{p.title}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function HomeShowcase({
  items,
  onReorder,
  onLayout,
  onRemove,
  onAdd,
}: {
  items: Item[];
  onReorder: (from: number, to: number) => void;
  onLayout: (id: number, layout: 'left' | 'right') => void;
  onRemove: (id: number) => void;
  onAdd: () => void;
}) {
  const drag = useDragReorder(onReorder);

  return (
    <section className="space-y-8 px-5 py-6 md:px-20 md:py-10">
      <div className="mb-2 text-[15px] lowercase opacity-40">#избранное</div>
      {items.map((project, index) => {
        const active = drag.dragIndex === index;
        const over = drag.overIndex === index && drag.dragIndex !== index;
        return (
          <div
            key={project.id}
            draggable
            onDragStart={(e) => drag.onDragStart(index, e)}
            onDragOver={(e) => drag.onDragOver(index, e)}
            onDrop={(e) => drag.onDrop(index, e)}
            onDragEnd={drag.onDragEnd}
            className={`relative cursor-grab active:cursor-grabbing ${
              active ? 'opacity-40' : ''
            } ${over ? 'ring-2 ring-yy-yellow ring-offset-4 ring-offset-yy-cream' : ''}`}
          >
            <div className="pointer-events-none">
              <FeaturedPreview project={project} />
            </div>
            <div className="pointer-events-auto absolute left-3 top-3 z-10 flex flex-wrap gap-2">
              <span className="bg-black/70 px-2 py-1 text-[12px] text-white lowercase">
                {index + 1} · тяни
              </span>
              <button
                type="button"
                className="bg-yy-yellow px-2 py-1 text-[12px] lowercase"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() =>
                  onLayout(
                    project.id,
                    project.featuredLayout === 'left' ? 'right' : 'left',
                  )
                }
              >
                layout: {project.featuredLayout}
              </button>
              <button
                type="button"
                className="bg-white px-2 py-1 text-[12px] lowercase ring-1 ring-black/20"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onRemove(project.id)}
              >
                убрать
              </button>
              <a
                href={`/redactingpages/projects/${project.id}`}
                className="bg-white px-2 py-1 text-[12px] lowercase ring-1 ring-black/20"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                draggable={false}
              >
                редактировать
              </a>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className="relative mx-auto flex w-full max-w-[1280px] min-h-[280px] flex-col items-center justify-center gap-3 border border-dashed border-black/25 bg-black/[0.03] transition-colors hover:bg-black/[0.06] md:min-h-[420px] md:grid-cols-[413fr_857fr]"
      >
        <PlusIcon className="h-14 w-14 opacity-35" />
        <span className="text-[15px] lowercase opacity-40">добавить проект</span>
      </button>
    </section>
  );
}

function FeaturedPreview({ project }: { project: Item }) {
  const yellowFirst = project.featuredLayout === 'left';
  const panelImage = project.cardImage || project.cover;
  const awards = Array.isArray(project.awards) ? project.awards : [];

  return (
    <div
      className={`relative mx-auto grid w-full max-w-[1280px] grid-cols-1 overflow-hidden ${
        yellowFirst
          ? 'md:grid-cols-[413fr_857fr]'
          : 'md:grid-cols-[857fr_413fr]'
      }`}
    >
      <div
        className={`featured-panel relative min-h-[320px] overflow-hidden md:min-h-[480px] ${
          yellowFirst ? 'md:order-1' : 'md:order-2'
        }`}
      >
        <img
          src={panelImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className="featured-panel-overlay absolute inset-0 flex flex-col bg-yy-yellow p-7 opacity-0 transition-opacity duration-300 md:p-8">
          <h2 className="mb-6 max-w-[373px] text-[clamp(28px,4vw,48px)] lowercase leading-[1.1]">
            {project.title}
          </h2>
          <p className="mb-8 max-w-[361px] text-[15px] leading-[20px]">
            {project.summary}
          </p>
          {awards.length > 0 ? (
            <ul className="mb-16 space-y-3">
              {awards.map((award) => (
                <li
                  key={award.text}
                  className="flex gap-3 text-[15px] leading-[20px]"
                >
                  {award.place ? (
                    <span className="mt-1 shrink-0 text-[7px] uppercase tracking-wide">
                      {award.place}
                    </span>
                  ) : null}
                  <span>{award.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div
        className={`relative min-h-[240px] overflow-hidden md:min-h-[480px] ${
          yellowFirst ? 'md:order-2' : 'md:order-1'
        }`}
      >
        <img
          src={project.cover}
          alt={project.title}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      </div>
    </div>
  );
}

function PortfolioShowcase({
  label,
  hero,
  items,
  onReorder,
  onAdd,
}: {
  label: string;
  hero: string;
  items: Item[];
  onReorder: (from: number, to: number) => void;
  onAdd: () => void;
}) {
  const drag = useDragReorder(onReorder);

  return (
    <section className="mb-10">
      <div className="relative h-[min(420px,55svh)] w-full overflow-hidden bg-black">
        <img
          src={hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-bottom"
          draggable={false}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h2 className="text-[clamp(48px,8vw,84px)] lowercase leading-none text-white">
            {label}
          </h2>
          <p className="mt-3 text-[14px] text-white/70 lowercase">
            перетаскивай карточки · плюс — добавить
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-x-6 gap-y-10 px-5 py-14 md:grid-cols-3 md:px-20">
        {items.map((project, index) => {
          const active = drag.dragIndex === index;
          const over = drag.overIndex === index && drag.dragIndex !== index;
          const caption =
            project.caption ?? `${project.title}\n${project.client ?? ''}`;
          return (
            <div
              key={project.id}
              draggable
              onDragStart={(e) => drag.onDragStart(index, e)}
              onDragOver={(e) => drag.onDragOver(index, e)}
              onDrop={(e) => drag.onDrop(index, e)}
              onDragEnd={drag.onDragEnd}
              className={`group relative cursor-grab active:cursor-grabbing ${
                active ? 'opacity-40' : ''
              } ${over ? 'ring-2 ring-yy-yellow' : ''}`}
            >
              <div className="pointer-events-none">
                <div className="aspect-[411/581] overflow-hidden bg-black">
                  {project.cover ? (
                    <img
                      src={project.cover}
                      alt={project.title}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : null}
                </div>
                <p className="mt-4 max-w-[293px] whitespace-pre-line text-[15px] leading-[21px]">
                  {caption}
                </p>
              </div>
              <div className="pointer-events-auto absolute left-2 top-2 z-10 flex flex-wrap gap-1">
                <span className="bg-black/70 px-2 py-1 text-[12px] text-white lowercase">
                  {index + 1}
                </span>
                <a
                  href={`/redactingpages/projects/${project.id}`}
                  className="bg-yy-yellow px-2 py-1 text-[12px] lowercase"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  draggable={false}
                >
                  редактировать
                </a>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAdd}
          className="flex flex-col items-center justify-center gap-3 border border-dashed border-black/25 bg-black/[0.03] transition-colors hover:bg-black/[0.06]"
        >
          <div className="flex aspect-[411/581] w-full flex-col items-center justify-center gap-3">
            <PlusIcon className="h-12 w-12 opacity-35" />
            <span className="text-[14px] lowercase opacity-40">добавить</span>
          </div>
        </button>
      </div>
    </section>
  );
}
