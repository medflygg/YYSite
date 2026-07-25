#!/usr/bin/env node
import http from 'node:http';

const PORT = Number(process.env.MOBILE_PORT || 4322);
const SITE = process.env.SITE_URL || 'http://127.0.0.1:4321';
// Самый частый «сторис»/портретный формат для тестов макета — ровно 9:16
const WIDTH = Number(process.env.MOBILE_WIDTH || 390);
const HEIGHT = Math.round((WIDTH * 16) / 9);

const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>YY — mobile ${WIDTH}×${HEIGHT} (9:16)</title>
  <style>
    :root {
      --w: ${WIDTH}px;
      --h: ${HEIGHT}px;
      --bezel: 12px;
      --radius: 28px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #1a1a1a;
      color: #f5f5f5;
      font: 14px/1.4 system-ui, sans-serif;
      padding: 24px;
    }
    .wrap { display: grid; gap: 16px; justify-items: center; }
    .meta { opacity: 0.7; text-align: center; }
    .phone {
      width: calc(var(--w) + var(--bezel) * 2);
      height: calc(var(--h) + var(--bezel) * 2);
      padding: var(--bezel);
      border-radius: calc(var(--radius) + 4px);
      background: #111;
      box-shadow:
        0 0 0 1px #333,
        0 24px 60px rgba(0,0,0,.55);
      position: relative;
    }
    .phone::before {
      content: "";
      position: absolute;
      top: 8px;
      left: 50%;
      translate: -50% 0;
      width: 96px;
      height: 8px;
      border-radius: 999px;
      background: #222;
      z-index: 2;
    }
    iframe {
      width: var(--w);
      height: var(--h);
      border: 0;
      border-radius: var(--radius);
      background: #f8f6f1;
      display: block;
    }
    a { color: #ffd900; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="meta">
      Mobile preview · ${WIDTH}×${HEIGHT} · 9:16<br />
      Source: <a href="${SITE}" target="_blank" rel="noreferrer">${SITE}</a>
    </div>
    <div class="phone">
      <iframe
        src="${SITE}"
        title="YY mobile"
        loading="eager"
      ></iframe>
    </div>
  </div>
</body>
</html>`;

const server = http.createServer((_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(html);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mobile preview (9:16 ${WIDTH}×${HEIGHT}): http://127.0.0.1:${PORT}/`);
  console.log(`Iframes site from: ${SITE}`);
});
