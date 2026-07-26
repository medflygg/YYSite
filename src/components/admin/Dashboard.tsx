import AdminShell from './AdminShell';

const cards = [
  {
    href: '/redactingpages/projects',
    title: 'проекты',
    text: 'создавать, править, удалять, загружать картинки',
  },
  {
    href: '/redactingpages/showcase',
    title: 'витрины',
    text: 'порядок на главной и в разделах портфолио',
  },
  {
    href: '/redactingpages/content',
    title: 'контент',
    text: 'папки, загрузка и удаление файлов',
  },
  {
    href: '/redactingpages/pages',
    title: 'страницы',
    text: 'карточки «обо мне», тексты страниц и контакты',
  },
];

export default function Dashboard() {
  return (
    <AdminShell title="админка">
      <ul className="space-y-6">
        {cards.map((card) => (
          <li key={card.href}>
            <a href={card.href} className="group block">
              <h2 className="text-[28px] lowercase group-hover:underline">
                {card.title}
              </h2>
              <p className="mt-1 text-[15px] opacity-50">{card.text}</p>
            </a>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
