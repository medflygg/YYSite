import { useEffect, useState } from 'react';
import AdminShell from './AdminShell';

type Project = {
  id: number;
  slug: string;
  title: string;
  category: string;
  featured: boolean;
  archived: boolean;
};

const labels: Record<string, string> = {
  books: 'книги',
  magazines: 'журналы',
  other: 'другое',
};

export default function ProjectsList() {
  const [items, setItems] = useState<Project[]>([]);
  const [filter, setFilter] = useState('all');
  const [scope, setScope] = useState<'live' | 'archive'>('live');

  useEffect(() => {
    fetch('/api/redactingpages/projects')
      .then((r) => r.json())
      .then(setItems);
  }, []);

  async function setArchived(id: number, archived: boolean) {
    const res = await fetch(`/api/redactingpages/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Не удалось обновить');
      return;
    }
    const updated = await res.json();
    setItems((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              archived: Boolean(updated.archived),
              featured: Boolean(updated.featured),
            }
          : p,
      ),
    );
  }

  async function remove(id: number, title: string) {
    if (
      !confirm(
        `Полностью удалить «${title}»?\nБудут удалены запись в базе и папка uploads/${items.find((p) => p.id === id)?.slug || ''}.`,
      )
    ) {
      return;
    }
    if (!confirm('Точно удалить? Это нельзя отменить.')) return;
    const res = await fetch(`/api/redactingpages/projects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      alert('Не удалось удалить');
      return;
    }
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  const byScope = items.filter((p) =>
    scope === 'archive' ? p.archived : !p.archived,
  );
  const visible =
    filter === 'all'
      ? byScope
      : byScope.filter((p) => p.category === filter);

  return (
    <AdminShell title="проекты">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setScope('live')}
          className={`text-[15px] lowercase ${
            scope === 'live' ? 'underline' : 'opacity-50'
          }`}
        >
          портфолио
        </button>
        <button
          type="button"
          onClick={() => setScope('archive')}
          className={`text-[15px] lowercase ${
            scope === 'archive' ? 'underline' : 'opacity-50'
          }`}
        >
          архив
        </button>
        <a
          href="/redactingpages/projects/new"
          className="ml-auto bg-yy-yellow px-4 py-2 text-[15px] lowercase"
        >
          новый проект
        </a>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {['all', 'books', 'magazines', 'other'].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`text-[15px] lowercase ${
              filter === key ? 'underline' : 'opacity-50'
            }`}
          >
            {key === 'all' ? 'все' : labels[key]}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-black/15">
        {visible.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-3 py-4 text-[15px]"
          >
            <div className="min-w-0 flex-1">
              <a
                href={`/redactingpages/projects/${p.id}`}
                className="lowercase hover:underline"
              >
                {p.title}
              </a>
              <div className="mt-1 text-[13px] opacity-50">
                {labels[p.category] || p.category}
                {p.featured ? ' · избранное' : ''}
                {p.archived ? ' · архив' : ''}
              </div>
            </div>
            {!p.archived ? (
              <a
                href={`/projects/${p.slug}`}
                className="opacity-50 hover:opacity-100"
              >
                открыть
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => void setArchived(p.id, !p.archived)}
              className="opacity-50 hover:opacity-100"
            >
              {p.archived ? 'вернуть' : 'в архив'}
            </button>
            <button
              type="button"
              onClick={() => void remove(p.id, p.title)}
              className="text-red-800/80 hover:text-red-900"
            >
              удалить
            </button>
          </li>
        ))}
      </ul>

      {visible.length === 0 ? (
        <p className="mt-6 text-[15px] opacity-50">
          {scope === 'archive' ? 'архив пуст' : 'проектов пока нет'}
        </p>
      ) : null}
    </AdminShell>
  );
}
