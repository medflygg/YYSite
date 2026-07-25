import { useEffect, useId, useState } from 'react';
import { withBase } from '../lib/paths';

type Props = {
  pathname: string;
};

const portfolioLinks = [
  { href: '/portfolio#книги', label: 'книги' },
  { href: '/portfolio#журналы', label: 'журналы' },
  { href: '/portfolio#другое', label: 'другое' },
];

export default function MobileMenu({ pathname }: Props) {
  const [open, setOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const panelId = useId();

  const homeActive = pathname === '/';
  const aboutActive = pathname === '/about';
  const contactsActive = pathname === '/contacts';
  const portfolioActive =
    pathname === '/portfolio' || pathname.startsWith('/projects');

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) setPortfolioOpen(portfolioActive);
  }, [open, portfolioActive]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="relative z-[60] flex h-10 w-10 items-center justify-center"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sr-only">{open ? 'Закрыть' : 'Меню'}</span>
        <span className="relative block h-3 w-5">
          <span
            className={`absolute left-0 block h-[2px] w-full bg-black transition-transform duration-200 ${
              open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'
            }`}
          />
          <span
            className={`absolute left-0 block h-[2px] w-full bg-black transition-transform duration-200 ${
              open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0'
            }`}
          />
        </span>
      </button>

      <div
        id={panelId}
        className={`fixed inset-0 z-[45] flex flex-col bg-yy-cream pt-[var(--header-height)] transition-[opacity,visibility] duration-200 ${
          open ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
        }`}
        aria-hidden={!open}
      >
        <nav className="flex flex-1 flex-col overflow-y-auto px-5 pt-10 pb-8">
          <ul className="flex flex-col items-center gap-5 text-center text-[28px] lowercase leading-none">
            <li>
              <a
                href={withBase('/')}
                className={homeActive ? 'text-yy-muted' : 'text-black'}
                onClick={() => setOpen(false)}
              >
                главная
              </a>
            </li>
            <li>
              <a
                href={withBase('/about')}
                className={aboutActive ? 'text-yy-muted' : 'text-black'}
                onClick={() => setOpen(false)}
              >
                обо мне
              </a>
            </li>
            <li>
              <a
                href={withBase('/contacts')}
                className={contactsActive ? 'text-yy-muted' : 'text-black'}
                onClick={() => setOpen(false)}
              >
                контакты
              </a>
            </li>
            <li>
              <button
                type="button"
                className={`lowercase ${
                  portfolioOpen || portfolioActive ? 'text-yy-muted' : 'text-black'
                }`}
                aria-expanded={portfolioOpen}
                onClick={() => {
                  if (!portfolioOpen) {
                    setPortfolioOpen(true);
                    return;
                  }
                  setOpen(false);
                  window.location.href = withBase('/portfolio');
                }}
              >
                портфолио
              </button>
            </li>
          </ul>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
              portfolioOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="my-8 border-t border-black/15" />
              <ul className="flex flex-col items-start gap-4 text-[20px] lowercase leading-none">
                {portfolioLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={withBase(link.href)}
                      className="text-black"
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-auto border-t border-black/15 pt-6">
            <div className="flex flex-col gap-2 text-[15px] leading-[20px]">
              <a href="mailto:YY@gmail.com" className="text-black">
                YY@gmail.com
              </a>
              <a
                href="https://t.me/yanayurasovaa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black"
              >
                TG: @yanayurasovaa
              </a>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
