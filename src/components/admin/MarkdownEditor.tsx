import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type TextareaHTMLAttributes,
} from 'react';
import { typograf } from '../../lib/typograf';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  minHeightClass?: string;
} & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'className'
>;

type WrapOpts = {
  before: string;
  after: string;
  placeholder?: string;
  toggle?: boolean;
};

type Selection = { start: number; end: number };

type LinkDraft = {
  text: string;
  url: string;
  start: number;
  end: number;
  /** true when editing an existing [text](url) */
  replaceExisting: boolean;
};

type ContextMenu = { x: number; y: number };

const LINK_RE = /^\[([^\]]*)\]\(([^)]*)\)$/;

function isWrapped(selected: string, before: string, after: string) {
  return (
    selected.startsWith(before) &&
    selected.endsWith(after) &&
    selected.length >= before.length + after.length
  );
}

function parseLinkSelection(selected: string): { text: string; url: string } | null {
  const m = selected.match(LINK_RE);
  if (!m) return null;
  return { text: m[1], url: m[2] };
}

export default function MarkdownEditor({
  value,
  onChange,
  label,
  className = '',
  minHeightClass = 'min-h-[160px]',
  ...textareaProps
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const dialogTitleId = useId();
  const [linkDraft, setLinkDraft] = useState<LinkDraft | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const savedSelection = useRef<Selection>({ start: 0, end: 0 });

  useEffect(() => {
    if (!linkDraft) return;
    const t = window.setTimeout(() => urlInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [linkDraft]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  function rememberSelection() {
    const el = ref.current;
    if (!el) return;
    savedSelection.current = {
      start: el.selectionStart,
      end: el.selectionEnd,
    };
  }

  function applyWrap({
    before,
    after,
    placeholder = 'текст',
    toggle = true,
  }: WrapOpts) {
    const el = ref.current;
    if (!el) return;

    let start = el.selectionStart;
    let end = el.selectionEnd;
    let selected = value.slice(start, end);

    // Пробелы/переносы оставляем снаружи маркеров — иначе **слово ** не парсится
    // и «пропадает» пробел между жирным словом и следующим.
    const leadWs = selected.match(/^\s*/)?.[0] ?? '';
    const trailWs = selected.match(/\s*$/)?.[0] ?? '';
    if (leadWs || trailWs) {
      start += leadWs.length;
      end -= trailWs.length;
      selected = value.slice(start, end);
    }

    let next: string;
    let selStart: number;
    let selEnd: number;

    if (toggle && selected && isWrapped(selected, before, after)) {
      const inner = selected.slice(before.length, selected.length - after.length);
      next = value.slice(0, start) + inner + value.slice(end);
      selStart = start;
      selEnd = start + inner.length;
    } else if (selected) {
      const wrapped = `${before}${selected}${after}`;
      next = value.slice(0, start) + wrapped + value.slice(end);
      selStart = start + before.length;
      selEnd = start + before.length + selected.length;
    } else {
      const wrapped = `${before}${placeholder}${after}`;
      next = value.slice(0, start) + wrapped + value.slice(end);
      selStart = start + before.length;
      selEnd = start + before.length + placeholder.length;
    }

    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  }

  function openLinkDialog(fromSelection?: Selection) {
    const el = ref.current;
    if (!el) return;

    const start = fromSelection?.start ?? el.selectionStart;
    const end = fromSelection?.end ?? el.selectionEnd;
    const selected = value.slice(start, end);
    const existing = parseLinkSelection(selected);

    setContextMenu(null);
    setLinkDraft({
      text: existing?.text ?? (selected || ''),
      url: existing?.url ?? 'https://',
      start,
      end,
      replaceExisting: Boolean(existing),
    });
  }

  function submitLink(e: FormEvent) {
    e.preventDefault();
    if (!linkDraft) return;

    const text = linkDraft.text.trim() || 'ссылка';
    const url = linkDraft.url.trim();
    if (!url) {
      urlInputRef.current?.focus();
      return;
    }

    const wrapped = `[${text}](${url})`;
    const next =
      value.slice(0, linkDraft.start) + wrapped + value.slice(linkDraft.end);
    onChange(next);
    setLinkDraft(null);

    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      const caret = linkDraft.start + wrapped.length;
      el.setSelectionRange(caret, caret);
    });
  }

  function applyTypograf() {
    const el = ref.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const hasSelection = start !== end;

    if (hasSelection) {
      const selected = value.slice(start, end);
      const fixed = typograf(selected);
      const next = value.slice(0, start) + fixed + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + fixed.length);
      });
      return;
    }

    const fixed = typograf(value);
    onChange(fixed);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(0, fixed.length);
    });
  }

  function onContextMenu(e: MouseEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    rememberSelection();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      rememberSelection();
      openLinkDialog(savedSelection.current);
    }
  }

  const btn =
    'min-w-[28px] border border-black/20 bg-white px-2 py-1 text-[13px] lowercase leading-none hover:bg-black/5';

  return (
    <div className="relative block">
      {label ? (
        <span className="mb-1 block text-[13px] lowercase opacity-50">
          {label}
        </span>
      ) : null}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={`${btn} font-bold`}
          title="Жирный"
          onClick={() =>
            applyWrap({ before: '**', after: '**', placeholder: 'жирный' })
          }
        >
          B
        </button>
        <button
          type="button"
          className={`${btn} italic`}
          title="Курсив"
          onClick={() =>
            applyWrap({ before: '*', after: '*', placeholder: 'курсив' })
          }
        >
          I
        </button>
        <button
          type="button"
          className={`${btn} underline`}
          title="Подчёркивание"
          onClick={() =>
            applyWrap({
              before: '<u>',
              after: '</u>',
              placeholder: 'подчёркнутый',
            })
          }
        >
          U
        </button>
        <button
          type="button"
          className={btn}
          title="Ссылка (Ctrl+K)"
          onClick={() => {
            rememberSelection();
            openLinkDialog(savedSelection.current);
          }}
        >
          ссылка
        </button>
        <button
          type="button"
          className={btn}
          title="Типограф: неразрывные пробелы, кавычки, тире. Выделите фрагмент или примените ко всему полю."
          onClick={applyTypograf}
        >
          типограф
        </button>
      </div>
      <textarea
        ref={ref}
        className={`w-full border border-black/20 bg-transparent p-3 outline-none ${minHeightClass} ${className}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={rememberSelection}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        {...textareaProps}
      />

      {contextMenu ? (
        <div
          className="fixed z-[80] min-w-[160px] border border-black/15 bg-white py-1 shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-[13px] lowercase hover:bg-black/5"
            onClick={() => openLinkDialog(savedSelection.current)}
          >
            вставить ссылку
          </button>
        </div>
      ) : null}

      {linkDraft ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/25 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLinkDraft(null);
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="w-full max-w-[420px] border border-black/15 bg-yy-cream p-5 shadow-lg"
            onSubmit={submitLink}
          >
            <h3
              id={dialogTitleId}
              className="mb-4 text-[18px] lowercase leading-none"
            >
              {linkDraft.replaceExisting ? 'изменить ссылку' : 'вставить ссылку'}
            </h3>
            <label className="mb-3 block">
              <span className="mb-1 block text-[13px] lowercase opacity-50">
                текст
              </span>
              <input
                className="w-full border-0 border-b border-black/35 bg-transparent py-2 outline-none"
                value={linkDraft.text}
                onChange={(e) =>
                  setLinkDraft((d) => (d ? { ...d, text: e.target.value } : d))
                }
                placeholder="текст ссылки"
              />
            </label>
            <label className="mb-5 block">
              <span className="mb-1 block text-[13px] lowercase opacity-50">
                адрес
              </span>
              <input
                ref={urlInputRef}
                className="w-full border-0 border-b border-black/35 bg-transparent py-2 outline-none"
                value={linkDraft.url}
                onChange={(e) =>
                  setLinkDraft((d) => (d ? { ...d, url: e.target.value } : d))
                }
                placeholder="https://"
                inputMode="url"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="bg-yy-yellow px-5 py-2 text-[15px] lowercase"
              >
                вставить
              </button>
              <button
                type="button"
                className="border border-black/20 px-5 py-2 text-[15px] lowercase hover:bg-black/5"
                onClick={() => setLinkDraft(null)}
              >
                отмена
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
