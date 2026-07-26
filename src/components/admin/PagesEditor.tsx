import { useEffect, useState } from 'react';
import AboutCardsEditor from './AboutCardsEditor';
import AdminShell from './AdminShell';
import MarkdownEditor from './MarkdownEditor';

type Page = { key: string; title: string; body: string };

export default function PagesEditor() {
  const [about, setAbout] = useState<Page>({
    key: 'about',
    title: 'обо мне',
    body: '',
  });
  const [contacts, setContacts] = useState<Page>({
    key: 'contacts',
    title: 'контакты',
    body: '',
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/redactingpages/pages')
      .then((r) => r.json())
      .then((data) => {
        if (data.about) setAbout(data.about);
        if (data.contacts) setContacts(data.contacts);
      });
  }, []);

  async function save(page: Page) {
    setStatus('сохраняю...');
    const res = await fetch('/api/redactingpages/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || 'ошибка');
      return;
    }
    setStatus('сохранено');
  }

  return (
    <AdminShell title="страницы">
      {status ? <p className="mb-6 text-[13px] opacity-50">{status}</p> : null}
      <AboutCardsEditor />
      <PageBlock page={about} onChange={setAbout} onSave={() => save(about)} />
      <PageBlock
        page={contacts}
        onChange={setContacts}
        onSave={() => save(contacts)}
      />
    </AdminShell>
  );
}

function PageBlock({
  page,
  onChange,
  onSave,
}: {
  page: Page;
  onChange: (p: Page) => void;
  onSave: () => void;
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-[18px] lowercase">{page.key}</h2>
      <label className="mb-4 block">
        <span className="mb-1 block text-[13px] opacity-50">заголовок</span>
        <input
          className="w-full border-0 border-b border-black/35 bg-transparent py-2 outline-none"
          value={page.title}
          onChange={(e) => onChange({ ...page, title: e.target.value })}
        />
      </label>
      <div className="mb-4">
        <MarkdownEditor
          label="текст (markdown)"
          value={page.body}
          onChange={(body) => onChange({ ...page, body })}
          minHeightClass="min-h-[180px]"
        />
      </div>
      <button
        type="button"
        onClick={onSave}
        className="bg-yy-yellow px-5 py-2 text-[15px] lowercase"
      >
        сохранить
      </button>
    </section>
  );
}
