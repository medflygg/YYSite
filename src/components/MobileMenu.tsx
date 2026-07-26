import { useEffect, useId, useState, type ReactNode } from 'react';
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
    if (open) {
      setPortfolioOpen(
        pathname === '/portfolio' || pathname.startsWith('/projects'),
      );
    }
  }, [open, pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="relative z-[60] -mr-1 flex h-11 w-11 shrink-0 items-center justify-center"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sr-only">{open ? 'Закрыть' : 'Меню'}</span>
        <img
          src={withBase(open ? '/icons/menu-close.svg' : '/icons/menu-burger.svg')}
          alt=""
          width={21}
          height={19}
          className="pointer-events-none block h-[19px] w-[21px]"
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        className={`fixed inset-0 z-[55] flex flex-col bg-yy-yellow transition-[opacity,visibility] duration-200 ${
          open
            ? 'visible opacity-100'
            : 'invisible pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-[var(--header-height)] shrink-0 items-center px-5">
          <a
            href={withBase('/')}
            className="uppercase text-[15px] tracking-[0.04em] text-black"
            aria-label="YY — на главную"
            onClick={() => setOpen(false)}
          >
            YY
          </a>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/*
            Фиксированная зона под зайца: низ зоны = полоска над «главная».
            При раскрытии портфолио растёт только nav ниже — заяц не двигается.
          */}
          <div className="relative mx-auto h-[min(48svh,420px)] w-full max-w-[402px] shrink-0">
            <img
              src={withBase('/images/menu-creature.png')}
              alt=""
              className="pointer-events-none absolute bottom-0 right-0 h-[min(42svh,360px)] w-auto max-w-[82%] object-contain object-bottom mix-blend-multiply"
            />
          </div>

          <nav className="relative z-10 px-8 pb-8">
            <ul className="flex flex-col">
              <MenuRow>
                <a
                  href={withBase('/')}
                  className="block py-3 text-[32px] lowercase leading-[1.2] text-black"
                  onClick={() => setOpen(false)}
                >
                  главная
                </a>
              </MenuRow>
              <MenuRow>
                <a
                  href={withBase('/about')}
                  className="block py-3 text-[32px] lowercase leading-[1.2] text-black"
                  onClick={() => setOpen(false)}
                >
                  обо мне
                </a>
              </MenuRow>
              <MenuRow>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-3 text-left text-[32px] lowercase leading-[1.2] text-black"
                  aria-expanded={portfolioOpen}
                  onClick={() => setPortfolioOpen((v) => !v)}
                >
                  портфолио
                  <img
                    src={withBase('/icons/arrow-down.svg')}
                    alt=""
                    className={`h-3 w-6 transition-transform duration-200 ${
                      portfolioOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    portfolioOpen
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <ul className="flex flex-col gap-1 pb-3">
                      {portfolioLinks.map((link) => (
                        <li key={link.href}>
                          <a
                            href={withBase(link.href)}
                            className="block py-1 text-[19px] lowercase leading-[25px] text-black"
                            onClick={() => setOpen(false)}
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </MenuRow>
              <MenuRow last>
                <a
                  href={withBase('/contacts')}
                  className="block py-3 text-[32px] lowercase leading-[1.2] text-black"
                  onClick={() => setOpen(false)}
                >
                  контакты
                </a>
              </MenuRow>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}

function MenuRow({
  children,
  last = false,
}: {
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <li
      className={`border-t border-black ${last ? 'border-b border-black' : ''}`}
    >
      {children}
    </li>
  );
}
