import type { ReactNode } from 'react';

const links = [
  { href: '/redactingpages', label: 'обзор' },
  { href: '/redactingpages/projects', label: 'проекты' },
  { href: '/redactingpages/showcase', label: 'витрины' },
  { href: '/redactingpages/content', label: 'контент' },
  { href: '/redactingpages/pages', label: 'страницы' },
];

export default function AdminShell({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  async function logout() {
    await fetch('/api/redactingpages/logout', { method: 'POST' });
    window.location.href = '/redactingpages/login';
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between bg-yy-yellow px-5 md:px-10">
        <nav className="flex flex-wrap items-center gap-4 text-[15px] lowercase">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-[15px]">
          <a href="/" className="opacity-60 hover:opacity-100">
            на сайт
          </a>
          <button type="button" onClick={logout} className="hover:underline">
            выйти
          </button>
        </div>
      </header>
      <main
        className={
          wide
            ? 'w-full pb-16'
            : 'mx-auto max-w-[960px] px-5 py-10 md:px-10'
        }
      >
        <h1
          className={
            wide
              ? 'px-5 pt-6 text-[clamp(28px,4vw,42px)] lowercase leading-none md:px-10'
              : 'mb-8 text-[clamp(28px,4vw,42px)] lowercase leading-none'
          }
        >
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
