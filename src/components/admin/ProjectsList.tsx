import { useEffect, useState } from 'react';
import AdminShell from './AdminShell';

type Project = {
  id: number;
  slug: string;
  title: string;
  category: string;
  featured: boolean;
};

const labels: Record<string, string> = {
  books: 'книги',
  magazines: 'журналы',
  other: 'другое',
};

export default function ProjectsList() {
  const [items, setItems] = useState<Project[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/redactingpages/projects')
      .then((r) => r.json())
      .then(setItems);
  }, []);

  async function remove(id: number) {
    if (!confirm('Удалить проект?')) return;
    await fetch(`/api/redactingpages/projects/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  const visible =
    filter === 'all' ? items : items.filter((p) => p.category === filter);

  return (
    <AdminShell title="проекты">
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
        <a
          href="/redactingpages/projects/new"
          className="ml-auto bg-yy-yellow px-4 py-2 text-[15px] lowercase"
        >
          новый проект
        </a>
      </div>

      <ul className="divide-y divide-black/15">
        {visible.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-3 py-4 text-[15px]"
          >
            <div className="min-w-0 flex-1">
              <a href={`/redactingpages/projects/${p.id}`} className="lowercase hover:underline">
                {p.title}
              </a>
              <div className="mt-1 text-[13px] opacity-50">
                {labels[p.category] || p.category}
                {p.featured ? ' · избранное' : ''}
              </div>
            </div>
            <a href={`/projects/${p.slug}`} className="opacity-50 hover:opacity-100">
              открыть
            </a>
            <button
              type="button"
              onClick={() => remove(p.id)}
              className="opacity-50 hover:opacity-100"
            >
              удалить
            </button>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
