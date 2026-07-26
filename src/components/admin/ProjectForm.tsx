import { useEffect, useState } from 'react';
import AdminShell from './AdminShell';
import { GalleryField, ImageField } from './ImagePicker';
import MarkdownEditor from './MarkdownEditor';

type Award = { place?: string; text: string };

type Project = {
  id?: number;
  slug: string;
  title: string;
  category: 'books' | 'magazines' | 'other';
  featured: boolean;
  featuredOrder: number | null;
  featuredLayout: 'left' | 'right';
  portfolioOrder: number;
  year: number | null;
  client: string;
  specs: string;
  summary: string;
  caption: string;
  body: string;
  cover: string;
  cardImage: string;
  awards: Award[];
  behindTheScenes: string[];
  whatHappenedNext: string[];
  gallery: string[];
};

const empty: Project = {
  slug: '',
  title: '',
  category: 'books',
  featured: false,
  featuredOrder: null,
  featuredLayout: 'left',
  portfolioOrder: 0,
  year: null,
  client: '',
  specs: '',
  summary: '',
  caption: '',
  body: '',
  cover: '',
  cardImage: '',
  awards: [],
  behindTheScenes: [],
  whatHappenedNext: [],
  gallery: [],
};

export default function ProjectForm({ projectId }: { projectId?: number }) {
  const [form, setForm] = useState<Project>(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const isNew = !projectId;
  const folder = form.slug || (projectId ? `project-${projectId}` : 'project');

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/redactingpages/projects/${projectId}`)
      .then((r) => r.json())
      .then((p) =>
        setForm({
          ...empty,
          ...p,
          client: p.client || '',
          specs: p.specs || '',
          caption: p.caption || '',
          cardImage: p.cardImage || '',
          awards: p.awards || [],
          behindTheScenes: p.behindTheScenes || [],
          whatHappenedNext: p.whatHappenedNext || [],
          gallery: p.gallery || [],
        }),
      );
  }, [projectId]);

  function set<K extends keyof Project>(key: K, value: Project[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(
        isNew ? '/api/redactingpages/projects' : `/api/redactingpages/projects/${projectId}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      window.location.href = `/redactingpages/projects/${data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title={isNew ? 'новый проект' : 'редактирование'}>
      <form onSubmit={onSave} className="space-y-5 text-[15px]">
        <Field label="название">
          <input
            className="field"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />
        </Field>
        <Field label="slug">
          <input
            className="field"
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="авто из названия, если пусто"
          />
        </Field>
        <Field label="категория">
          <select
            className="field"
            value={form.category}
            onChange={(e) =>
              set('category', e.target.value as Project['category'])
            }
          >
            <option value="books">книги</option>
            <option value="magazines">журналы</option>
            <option value="other">другое</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 lowercase">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
          />
          на главной (избранное)
        </label>
        {form.featured ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="порядок на главной">
              <input
                type="number"
                className="field"
                value={form.featuredOrder ?? ''}
                onChange={(e) =>
                  set(
                    'featuredOrder',
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </Field>
            <Field label="layout">
              <select
                className="field"
                value={form.featuredLayout}
                onChange={(e) =>
                  set('featuredLayout', e.target.value as 'left' | 'right')
                }
              >
                <option value="left">карточка слева · обложка справа</option>
                <option value="right">обложка слева · карточка справа</option>
              </select>
            </Field>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="год">
            <input
              type="number"
              className="field"
              value={form.year ?? ''}
              onChange={(e) =>
                set('year', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </Field>
          <Field label="клиент">
            <input
              className="field"
              value={form.client}
              onChange={(e) => set('client', e.target.value)}
            />
          </Field>
          <Field label="формат">
            <input
              className="field"
              value={form.specs}
              onChange={(e) => set('specs', e.target.value)}
            />
          </Field>
        </div>
        <Field label="краткое описание">
          <textarea
            className="field min-h-[80px]"
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
          />
        </Field>
        <Field label="подпись в сетке">
          <textarea
            className="field min-h-[60px]"
            value={form.caption}
            onChange={(e) => set('caption', e.target.value)}
          />
        </Field>
        <MarkdownEditor
          label="текст страницы (markdown)"
          value={form.body}
          onChange={(v) => set('body', v)}
          minHeightClass="min-h-[160px]"
        />

        <ImageField
          label="обложка"
          value={form.cover}
          folder={folder}
          onChange={(path) => set('cover', path)}
        />
        <ImageField
          label="картинка карточки (главная)"
          value={form.cardImage}
          folder={folder}
          onChange={(path) => set('cardImage', path)}
        />
        <GalleryField
          label="галерея"
          value={form.gallery}
          folder={folder}
          onChange={(paths) => set('gallery', paths)}
        />

        <Field label="награды (строка = место | текст)">
          <textarea
            className="field min-h-[80px]"
            value={form.awards
              .map((a) => (a.place ? `${a.place} | ${a.text}` : a.text))
              .join('\n')}
            onChange={(e) =>
              set(
                'awards',
                e.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => {
                    const [place, ...rest] = line.split('|');
                    if (rest.length === 0) return { text: place.trim() };
                    return { place: place.trim(), text: rest.join('|').trim() };
                  }),
              )
            }
          />
        </Field>
        <Field label="за кадром (по строке)">
          <textarea
            className="field min-h-[80px]"
            value={form.behindTheScenes.join('\n')}
            onChange={(e) =>
              set(
                'behindTheScenes',
                e.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </Field>
        <Field label="что было дальше (по строке)">
          <textarea
            className="field min-h-[80px]"
            value={form.whatHappenedNext.join('\n')}
            onChange={(e) =>
              set(
                'whatHappenedNext',
                e.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </Field>

        {error ? <p className="text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="bg-yy-yellow px-6 py-3 lowercase disabled:opacity-50"
        >
          {saving ? 'сохраняю...' : 'сохранить'}
        </button>
      </form>
      <style>{`
        .field {
          width: 100%;
          border: 0;
          border-bottom: 1px solid rgba(0,0,0,0.35);
          background: transparent;
          padding: 0.4rem 0;
          outline: none;
        }
      `}</style>
    </AdminShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] lowercase opacity-50">{label}</span>
      {children}
    </label>
  );
}
