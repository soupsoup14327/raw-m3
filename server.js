import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { dirname, join } from 'node:path';
import {
  tonalRampFromHex,
  themeRampsFromHex,
  hexAtToneFromHex,
  argbFromHex,
} from './src/palette.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, 'public');

const PORT = Number(process.env.PORT) || 3847;

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(data);
}

function parseHex(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s.startsWith('#')) s = `#${s}`;
  if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?$/.test(s)) return null;
  try {
    argbFromHex(s);
    if (/^#[0-9a-fA-F]{3}$/.test(s)) {
      const r = s[1];
      const g = s[2];
      const b = s[3];
      s = `#${r}${r}${g}${g}${b}${b}`;
    }
    return s;
  } catch {
    return null;
  }
}

async function handleApi(req, res, url) {
  const path = url.pathname.replace(/\/$/, '') || '/';

  if (path === '/api' || path === '/api/') {
    json(res, 200, {
      ok: true,
      ui: '/',
      endpoints: [
        'GET /tonal?hex=RRGGBB или %23RRGGBB&min=0&max=100 — TonalPalette.fromInt(seed)',
        'GET /theme?hex=…&min=0&max=100 — primary + neutral + neutralVariant',
        'GET /tone?hex=…&tone=40&mode=tonal|theme-primary',
      ],
    });
    return true;
  }

  if (path !== '/tonal' && path !== '/theme' && path !== '/tone') {
    return false;
  }

  const hex = parseHex(url.searchParams.get('hex'));
  if (!hex) {
    json(res, 400, { error: 'Missing or invalid hex (hex=6750A4 или hex=%236750A4)' });
    return true;
  }

  const min = url.searchParams.get('min');
  const max = url.searchParams.get('max');
  const minN = min !== null && min !== '' ? Number(min) : 0;
  const maxN = max !== null && max !== '' ? Number(max) : 100;

  try {
    if (path === '/tonal') {
      const ramp = tonalRampFromHex(hex, minN, maxN);
      json(res, 200, {
        hex,
        space: 'HCT (Material Color Utilities)',
        kind: 'single_tonal_palette_from_seed',
        minTone: minN,
        maxTone: maxN,
        tones: ramp,
      });
      return true;
    }

    if (path === '/theme') {
      const ramps = themeRampsFromHex(hex, minN, maxN);
      json(res, 200, {
        hex,
        space: 'HCT (Material Color Utilities)',
        kind: 'theme_palettes_from_source',
        minTone: minN,
        maxTone: maxN,
        palettes: ramps,
      });
      return true;
    }

    if (path === '/tone') {
      const tone = url.searchParams.get('tone');
      const mode = url.searchParams.get('mode') || 'tonal';
      if (tone === null || tone === '') {
        json(res, 400, { error: 'Set tone=0..100' });
        return true;
      }
      const out = hexAtToneFromHex(hex, Number(tone), mode);
      json(res, 200, { hex, tone: Number(tone), mode, result: out });
      return true;
    }
  } catch (e) {
    json(res, 500, { error: String(e?.message || e) });
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  let url;
  try {
    url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  } catch {
    json(res, 400, { error: 'Bad URL' });
    return;
  }

  const path = url.pathname.replace(/\/$/, '') || '/';

  if (path === '/health') {
    json(res, 200, { ok: true });
    return;
  }

  const apiHandled = await handleApi(req, res, url);
  if (apiHandled) return;

  if (path === '/' || path === '/index.html') {
    try {
      const html = await readFile(join(PUBLIC, 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (e) {
      json(res, 500, { error: 'UI missing: public/index.html' });
    }
    return;
  }

  json(res, 404, { error: 'Not found', hint: 'GET / or /api' });
});

server.listen(PORT, () => {
  console.error(`Material tonal UI http://127.0.0.1:${PORT}/`);
});
