import { useCallback, useEffect, useRef, useState } from 'react';

type Folder = { name: string; path: string };
type FileItem = { name: string; path: string; size: number; mtime: number };

async function uploadFiles(files: FileList | File[], folder: string) {
  const fd = new FormData();
  fd.set('folder', folder);
  for (const file of Array.from(files)) {
    fd.append('file', file);
  }
  const res = await fetch('/api/redactingpages/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  if (Array.isArray(data.paths)) return data.paths as string[];
  if (data.path) return [data.path as string];
  return [];
}

async function deleteUpload(path: string) {
  if (!path.startsWith('/uploads/')) return { ok: true as const };
  const res = await fetch('/api/redactingpages/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Delete failed');
  return { ok: true as const };
}

function parentFolder(folder: string) {
  if (!folder || folder === '/uploads') return '/uploads';
  const parts = folder.replace(/\/+$/, '').split('/');
  parts.pop();
  const parent = parts.join('/');
  return parent && parent.startsWith('/uploads') ? parent : '/uploads';
}

/** Modal: browse /uploads and pick one or many images */
function MediaPicker({
  open,
  multiple,
  initialFolder,
  onClose,
  onPick,
}: {
  open: boolean;
  multiple: boolean;
  initialFolder: string;
  onClose: () => void;
  onPick: (paths: string[]) => void;
}) {
  const [folder, setFolder] = useState('/uploads');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (path: string) => {
    setLoading(true);
    setError('');
    try {
      let res = await fetch(`/api/redactingpages/media?folder=${encodeURIComponent(path)}`);
      let data = await res.json();
      if (!res.ok && path !== '/uploads') {
        res = await fetch('/api/redactingpages/media?folder=/uploads');
        data = await res.json();
      }
      if (!res.ok) {
        setError(data.error || 'Не удалось открыть папку');
        return;
      }
      setFolder(data.folder);
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    const start =
      initialFolder && initialFolder !== 'misc'
        ? `/uploads/${initialFolder.replace(/^\/uploads\/?/, '')}`
        : '/uploads';
    void load(start);
  }, [open, initialFolder, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

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

  function toggle(path: string) {
    if (!multiple) {
      onPick([path]);
      onClose();
      return;
    }
    setSelected((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  }

  function confirm() {
    if (selected.length === 0) return;
    onPick(selected);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col bg-yy-cream shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="выбрать из контента"
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
          <h3 className="text-[16px] lowercase">выбрать из контента</h3>
          <button
            type="button"
            className="text-[13px] opacity-50 hover:opacity-100"
            onClick={onClose}
          >
            закрыть
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-black/10 px-4 py-2 text-[13px]">
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
          {folder !== '/uploads' ? (
            <button
              type="button"
              className="ml-auto opacity-50 hover:opacity-100"
              onClick={() => void load(parentFolder(folder))}
            >
              ← назад
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-[14px] opacity-40">загрузка...</p>
          ) : error ? (
            <p className="text-[14px] text-red-700">{error}</p>
          ) : (
            <>
              {folders.length > 0 ? (
                <ul className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {folders.map((f) => (
                    <li key={f.path}>
                      <button
                        type="button"
                        className="w-full border border-black/10 px-3 py-2 text-left text-[14px] lowercase hover:bg-black/5"
                        onClick={() => void load(f.path)}
                      >
                        {f.name}/
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {files.length === 0 ? (
                <p className="text-[14px] opacity-40">в этой папке нет файлов</p>
              ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {files.map((file) => {
                    const isOn = selected.includes(file.path);
                    return (
                      <li key={file.path}>
                        <button
                          type="button"
                          className={`group relative block w-full overflow-hidden bg-black/5 text-left ${
                            isOn ? 'ring-2 ring-black' : ''
                          }`}
                          onClick={() => toggle(file.path)}
                        >
                          <div className="relative aspect-square">
                            <img
                              src={file.path}
                              alt={file.name}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </div>
                          <div className="truncate px-2 py-1 text-[11px] opacity-50">
                            {file.name}
                          </div>
                          {multiple && isOn ? (
                            <span className="absolute left-1 top-1 bg-yy-yellow px-1.5 py-0.5 text-[11px]">
                              ✓
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

        {multiple ? (
          <div className="flex items-center justify-between gap-3 border-t border-black/10 px-4 py-3">
            <span className="text-[13px] opacity-50">
              выбрано: {selected.length}
            </span>
            <button
              type="button"
              disabled={selected.length === 0}
              className="bg-yy-yellow px-4 py-2 text-[13px] lowercase disabled:opacity-40"
              onClick={confirm}
            >
              добавить
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Single image with preview, upload, pick from library, clear, delete-from-disk */
export function ImageField({
  label,
  value,
  folder,
  onChange,
}: {
  label: string;
  value: string;
  folder: string;
  onChange: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  async function onFile(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError('');
    try {
      const paths = await uploadFiles(files, folder);
      if (paths[0]) onChange(paths[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove(deleteFile: boolean) {
    setError('');
    const prev = value;
    onChange('');
    if (deleteFile && prev) {
      try {
        await deleteUpload(prev);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось удалить файл');
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] lowercase opacity-50">{label}</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setPickerOpen(true)}
            className="border border-black/25 px-3 py-1.5 text-[13px] lowercase disabled:opacity-50"
          >
            из контента
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="bg-yy-yellow px-3 py-1.5 text-[13px] lowercase disabled:opacity-50"
          >
            {busy ? 'загрузка...' : value ? 'заменить' : 'загрузить'}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files)}
        />
      </div>

      {value ? (
        <div className="relative overflow-hidden bg-black/5">
          <img
            src={value}
            alt=""
            className="max-h-56 w-full object-contain"
          />
          <div className="flex flex-wrap gap-2 border-t border-black/10 p-2 text-[13px]">
            <span className="min-w-0 flex-1 truncate opacity-40">{value}</span>
            <button
              type="button"
              className="opacity-60 hover:opacity-100"
              onClick={() => remove(false)}
            >
              убрать
            </button>
            {value.startsWith('/uploads/') ? (
              <button
                type="button"
                className="opacity-60 hover:opacity-100"
                onClick={() => {
                  if (confirm('Удалить файл с сервера?')) void remove(true);
                }}
              >
                удалить файл
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex h-40 w-full flex-col items-center justify-center gap-2 border border-dashed border-black/25 text-[14px] lowercase opacity-50">
          <button
            type="button"
            disabled={busy}
            onClick={() => setPickerOpen(true)}
            className="hover:opacity-100"
          >
            выбрать из контента
          </button>
          <span className="opacity-40">или</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="hover:opacity-100"
          >
            загрузить файл
          </button>
        </div>
      )}
      {error ? <p className="text-[13px] text-red-700">{error}</p> : null}

      <MediaPicker
        open={pickerOpen}
        multiple={false}
        initialFolder={folder}
        onClose={() => setPickerOpen(false)}
        onPick={(paths) => {
          if (paths[0]) onChange(paths[0]);
        }}
      />
    </div>
  );
}

/** Gallery with previews, multi-upload, library pick, reorder, remove/delete */
export function GalleryField({
  label,
  value,
  folder,
  onChange,
}: {
  label: string;
  value: string[];
  folder: string;
  onChange: (paths: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  async function onFile(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError('');
    try {
      const paths = await uploadFiles(files, folder);
      onChange([...value, ...paths]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= value.length) return;
    const copy = [...value];
    const tmp = copy[index];
    copy[index] = copy[next];
    copy[next] = tmp;
    onChange(copy);
  }

  async function removeAt(index: number, deleteFile: boolean) {
    setError('');
    const path = value[index];
    onChange(value.filter((_, i) => i !== index));
    if (deleteFile && path) {
      try {
        await deleteUpload(path);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось удалить файл');
      }
    }
  }

  function addFromLibrary(paths: string[]) {
    const existing = new Set(value);
    const next = paths.filter((p) => !existing.has(p));
    if (next.length) onChange([...value, ...next]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] lowercase opacity-50">{label}</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setPickerOpen(true)}
            className="border border-black/25 px-3 py-1.5 text-[13px] lowercase disabled:opacity-50"
          >
            из контента
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="bg-yy-yellow px-3 py-1.5 text-[13px] lowercase disabled:opacity-50"
          >
            {busy ? 'загрузка...' : 'загрузить'}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFile(e.target.files)}
        />
      </div>

      {value.length === 0 ? (
        <div className="flex h-32 w-full flex-col items-center justify-center gap-2 border border-dashed border-black/25 text-[14px] lowercase opacity-50">
          <button
            type="button"
            disabled={busy}
            onClick={() => setPickerOpen(true)}
            className="hover:opacity-100"
          >
            выбрать из контента
          </button>
          <span className="opacity-40">или</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="hover:opacity-100"
          >
            загрузить файлы
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {value.map((path, index) => (
            <li key={`${path}-${index}`} className="overflow-hidden bg-black/5">
              <div className="relative aspect-[3/4] bg-black/10">
                <img
                  src={path}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1 p-2 text-[12px]">
                <span className="mr-auto opacity-40">{index + 1}</span>
                <button type="button" onClick={() => move(index, -1)} title="выше">
                  ↑
                </button>
                <button type="button" onClick={() => move(index, 1)} title="ниже">
                  ↓
                </button>
                <button
                  type="button"
                  className="opacity-60 hover:opacity-100"
                  onClick={() => void removeAt(index, false)}
                >
                  убрать
                </button>
                {path.startsWith('/uploads/') ? (
                  <button
                    type="button"
                    className="opacity-60 hover:opacity-100"
                    onClick={() => {
                      if (confirm('Удалить файл с сервера?')) {
                        void removeAt(index, true);
                      }
                    }}
                  >
                    удалить
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="text-[13px] text-red-700">{error}</p> : null}

      <MediaPicker
        open={pickerOpen}
        multiple
        initialFolder={folder}
        onClose={() => setPickerOpen(false)}
        onPick={addFromLibrary}
      />
    </div>
  );
}
