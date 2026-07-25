import { useCallback, useEffect, useRef, useState } from 'react';
import AdminShell from './AdminShell';

type Folder = { name: string; path: string };
type FileItem = { name: string; path: string; size: number; mtime: number };

function parentFolder(folder: string) {
  if (!folder || folder === '/uploads') return '/uploads';
  const parts = folder.replace(/\/+$/, '').split('/');
  parts.pop();
  const parent = parts.join('/');
  return parent && parent.startsWith('/uploads') ? parent : '/uploads';
}

function formatSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ContentBrowser() {
  const [folder, setFolder] = useState('/uploads');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (path: string) => {
    setError('');
    const res = await fetch(`/api/redactingpages/media?folder=${encodeURIComponent(path)}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Не удалось открыть папку');
      return;
    }
    setFolder(data.folder);
    setFolders(data.folders || []);
    setFiles(data.files || []);
  }, []);

  useEffect(() => {
    void load(folder);
  }, []);

  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/redactingpages/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mkdir',
          parent: folder,
          name: newFolder,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setNewFolder('');
      setStatus(`папка ${data.path}`);
      await load(folder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  async function upload(filesList: FileList | null) {
    if (!filesList?.length) return;
    setBusy(true);
    setError('');
    try {
      const folderName =
        folder === '/uploads' ? 'misc' : folder.replace(/^\/uploads\/?/, '');
      const fd = new FormData();
      fd.set('folder', folderName || 'misc');
      for (const file of Array.from(filesList)) fd.append('file', file);
      const res = await fetch('/api/redactingpages/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setStatus('файлы загружены');
      await load(folder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove(path: string, isFolder: boolean) {
    const msg = isFolder
      ? 'Удалить пустую папку?'
      : 'Удалить файл с сервера?';
    if (!confirm(msg)) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/redactingpages/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setStatus('удалено');
      await load(folder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setBusy(false);
    }
  }

  const crumbs = (() => {
    const parts = folder.replace(/^\/uploads\/?/, '').split('/').filter(Boolean);
    const list = [{ label: 'uploads', path: '/uploads' }];
    let acc = '/uploads';
    for (const part of parts) {
      acc += `/${part}`;
      list.push({ label: part, path: acc });
    }
    return list;
  })();

  return (
    <AdminShell title="контент">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-[14px] lowercase">
        {crumbs.map((c, i) => (
          <span key={c.path} className="flex items-center gap-2">
            {i > 0 ? <span className="opacity-30">/</span> : null}
            <button
              type="button"
              className={c.path === folder ? 'underline' : 'opacity-50 hover:opacity-100'}
              onClick={() => void load(c.path)}
            >
              {c.label}
            </button>
          </span>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap items-end gap-3">
        <form onSubmit={createFolder} className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-[13px] opacity-50">новая папка</span>
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              className="border-0 border-b border-black/35 bg-transparent py-1 outline-none"
              placeholder="имя"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !newFolder.trim()}
            className="bg-yy-yellow px-3 py-2 text-[13px] lowercase disabled:opacity-40"
          >
            создать
          </button>
        </form>

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="bg-yy-yellow px-3 py-2 text-[13px] lowercase disabled:opacity-40"
        >
          {busy ? '...' : 'загрузить файлы'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void upload(e.target.files)}
        />

        {folder !== '/uploads' ? (
          <button
            type="button"
            className="text-[13px] opacity-50 hover:opacity-100"
            onClick={() => void load(parentFolder(folder))}
          >
            ← назад
          </button>
        ) : null}
      </div>

      {status ? <p className="mb-4 text-[13px] opacity-40">{status}</p> : null}
      {error ? <p className="mb-4 text-[13px] text-red-700">{error}</p> : null}

      {folders.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-[15px] lowercase opacity-50">папки</h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {folders.map((f) => (
              <li key={f.path} className="border border-black/10 p-3">
                <button
                  type="button"
                  className="mb-2 block w-full text-left text-[15px] lowercase hover:underline"
                  onClick={() => void load(f.path)}
                >
                  {f.name}/
                </button>
                <button
                  type="button"
                  className="text-[12px] opacity-40 hover:opacity-100"
                  onClick={() => void remove(f.path, true)}
                >
                  удалить
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-[15px] lowercase opacity-50">файлы</h2>
        {files.length === 0 ? (
          <p className="text-[14px] opacity-40">пусто</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {files.map((file) => (
              <li key={file.path} className="overflow-hidden bg-black/5">
                <a href={file.path} target="_blank" rel="noreferrer" className="block">
                  <div className="relative aspect-square bg-black/10">
                    <img
                      src={file.path}
                      alt={file.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                </a>
                <div className="space-y-1 p-2 text-[12px]">
                  <div className="truncate lowercase">{file.name}</div>
                  <div className="opacity-40">{formatSize(file.size)}</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="opacity-50 hover:opacity-100"
                      onClick={() => {
                        void navigator.clipboard.writeText(file.path);
                        setStatus(`скопировано: ${file.path}`);
                      }}
                    >
                      путь
                    </button>
                    <button
                      type="button"
                      className="opacity-50 hover:opacity-100"
                      onClick={() => void remove(file.path, false)}
                    >
                      удалить
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
