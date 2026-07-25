# Деплой YYSite на VPS

Стек: **Astro SSR** (Node standalone) + **SQLite** + админка `/redactingpages`.

Рекомендуемый путь: **Docker Compose + Caddy** (HTTPS). Ниже также вариант без Docker.

> **Пока без VPS:** публичная статика на GitHub Pages — https://medflygg.github.io/YYSite/  
> Полный SSR/CMS-код лежит в ветке **`vps`** (бэкап). Локально: `npm run build:pages`.

---

## Что нужно сохранить (критично)

| Путь | Содержимое |
|------|------------|
| `data/` | SQLite: проекты, тексты, сессии, порядок витрин |
| `public/uploads/` | Все картинки из админки |

Код в Git. Эти две папки — **нет**. Без бэкапа вне VPS контент из админки потеряется при смерти сервера.

Сидовые оригиналы картинок лежат в `public/projects/` (в репозитории). При первом старте контейнер копирует их в `uploads/`.

---

## 1. Подготовка сервера

- VPS с Docker + Docker Compose plugin  
  или Node.js **≥ 22.12**
- Домен, DNS A-запись на IP сервера
- Открыты порты **80** и **443** (для Caddy)

```bash
# пример: Ubuntu
sudo apt update
sudo apt install -y docker.io docker-compose-v2 caddy sqlite3
sudo usermod -aG docker "$USER"
# перелогинься
```

---

## 2. Переменные окружения

На сервере в корне проекта:

```bash
cp .env.example .env
nano .env
```

Обязательно задай:

```env
ADMIN_PASSWORD=...длинный_случайный...
SITE_URL=https://your.domain
HOST=0.0.0.0
PORT=4321
NODE_ENV=production
DATABASE_URL=file:./data/yysite.db
```

Сгенерировать пароль:

```bash
openssl rand -base64 24
```

`ADMIN_PASSWORD` можно задать и bcrypt-хешем (`$2a$...`) — тогда в форме входа всё равно вводится обычный пароль, с которым хеш сравнивается.

---

## 3. Деплой через Docker (рекомендуется)

```bash
git clone https://github.com/medflygg/YYSite.git
cd YYSite
cp .env.example .env
# отредактируй .env

docker compose up -d --build
```

Проверка:

```bash
curl -I http://127.0.0.1:4321/
docker compose logs -f web
```

Сайт слушает только `127.0.0.1:4321` — снаружи доступ через reverse proxy.

### Обновление

```bash
git pull
docker compose up -d --build
```

Тома `yysite-data` и `yysite-uploads` **не пересоздаются** — контент админки сохраняется.

### Полезные команды

```bash
docker compose ps
docker compose logs -f web
docker compose restart web
docker compose down          # стоп (тома остаются)
docker volume ls             # yysite_yysite-data, yysite_yysite-uploads
```

---

## 4. HTTPS (Caddy)

Пример: `deploy/Caddyfile.example`

```caddy
your.domain {
	encode gzip
	reverse_proxy 127.0.0.1:4321
}
```

```bash
sudo cp deploy/Caddyfile.example /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile   # подставь домен
sudo systemctl reload caddy
```

Caddy сам выпустит Let’s Encrypt сертификат.

---

## 5. Деплой без Docker (systemd)

```bash
git clone https://github.com/medflygg/YYSite.git /var/www/yysite
cd /var/www/yysite
cp .env.example .env
nano .env

npm ci
npm run db:seed    # только первый раз
npm run build
```

Юнит: `deploy/yysite.service`

```bash
sudo cp deploy/yysite.service /etc/systemd/system/yysite.service
sudo systemctl daemon-reload
sudo systemctl enable --now yysite
sudo systemctl status yysite
```

Обновление:

```bash
cd /var/www/yysite
git pull
npm ci
npm run build
sudo systemctl restart yysite
```

**Не** запускай повторно `npm run db:seed` на проде — он перезапишет проекты/страницы из markdown.

Перед reverse proxy — тот же Caddy на `127.0.0.1:4321`.

---

## 6. Админка

- URL: `https://your.domain/redactingpages`
- Пароль: из `ADMIN_PASSWORD`
- Разделы: проекты, витрины, контент (файлы), страницы

Старый путь `/admin` отключён специально.

---

## 7. Бэкапы

Скрипт: `scripts/backup.sh`  
Архивирует `data/` + `public/uploads/` → `backups/yysite-YYYYMMDD-HHMMSS.tar.gz`

### На сервере без Docker

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
# или
npm run backup
```

Cron (каждый день в 3:15):

```cron
15 3 * * * cd /var/www/yysite && ./scripts/backup.sh >> /var/log/yysite-backup.log 2>&1
```

### С Docker

```bash
# snapshot volumes в tar на хосте
mkdir -p ~/yysite-backups
DATE=$(date +%Y%m%d-%H%M%S)
docker run --rm \
  -v yysite_yysite-data:/data:ro \
  -v yysite_yysite-uploads:/uploads:ro \
  -v "$HOME/yysite-backups:/out" \
  alpine sh -c "mkdir -p /tmp/b/data /tmp/b/uploads && cp -a /data/. /tmp/b/data/ && cp -a /uploads/. /tmp/b/uploads/ && tar -czf /out/yysite-$DATE.tar.gz -C /tmp/b data uploads && echo ok"
```

Имена томов проверь через `docker volume ls` (префикс может быть `yysite_`).

### Обязательно

Копируй архивы **за пределы VPS** (другой сервер, S3, Backblaze, rclone → Google Drive):

```bash
rclone copy ~/yysite-backups remote:yysite-backups
```

Храни хотя бы 7–30 дней копий. Раз в месяц проверяй восстановление.

### Восстановление

1. Останови приложение (`docker compose down` или `systemctl stop yysite`)
2. Распакуй архив в `data/` и `public/uploads/` (или в соответствующие тома)
3. Запусти снова
4. **Не** делай `db:seed`

---

## 8. Структура на проде

```
код (git)          → деплоится заново
data/              → volume / bind mount  ← бэкапить
public/uploads/    → volume / bind mount  ← бэкапить
.env               → только на сервере
```

---

## 9. Частые проблемы

| Симптом | Что проверить |
|---------|----------------|
| `changeme` всё ещё пускает | В контейнере/systemd реально передан `ADMIN_PASSWORD`; перезапуск после правки `.env` |
| Пустые картинки после деплоя | Том `uploads` пустой; entrypoint копирует из `public/projects` при первом старте |
| После `docker compose down -v` всё пропало | Флаг `-v` удаляет volumes — не использовать на проде |
| 502 от Caddy | `docker compose ps`, `curl 127.0.0.1:4321` |
| Повторный seed «откатил» сайт | Больше не запускать `db:seed` на живой базе |

---

## 10. Чеклист перед продом

- [ ] Сильный `ADMIN_PASSWORD` в `.env`
- [ ] `SITE_URL` = боевой HTTPS-домен
- [ ] Caddy/прокси настроен, сертификат ок
- [ ] Volumes для `data` и `uploads`
- [ ] Cron/скрипт бэкапа + выгрузка offsite
- [ ] Вход на `https://your.domain/redactingpages` работает
- [ ] Главная и портфолио показывают картинки
