// Mid-Century Ride: serves the static site and records "ride it again?" votes.
// No dependencies. Votes live in a JSON file on the Railway volume
// (RAILWAY_VOLUME_MOUNT_PATH), or DATA_DIR, or ./data when run locally.
//
//   GET  /api/votes   -> { yes, maybe, no, total, mine? }   (?voter=<id> adds "mine")
//   POST /api/vote    { voter, choice: "yes" | "maybe" | "no" }   one vote per browser, changeable

import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdir, stat } from 'node:fs/promises';
import { join, normalize, extname, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || join(ROOT, 'data-local');
const VOTES = join(DATA_DIR, 'votes.json');
const CHOICES = ['yes', 'maybe', 'no'];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8',
};
// Never serve repo internals, tooling or server code.
const BLOCKED = /(^|\/)(\.|node_modules|scripts|data-local|promo\/export)|^\/(server\.js|package(-lock)?\.json)$/;

// ---------- vote store ----------
let store = { votes: {} }; // voter id -> { choice, at }
let writing = Promise.resolve();

async function load() {
  await mkdir(DATA_DIR, { recursive: true });
  try { store = JSON.parse(await readFile(VOTES, 'utf8')); } catch { store = { votes: {} }; }
  console.log(`votes: ${Object.keys(store.votes).length} loaded from ${VOTES}`);
}
function save() {
  // Serialize writes; write to a temp file and rename so a crash never leaves half a file.
  writing = writing.then(async () => {
    const tmp = VOTES + '.tmp';
    await writeFile(tmp, JSON.stringify(store));
    await rename(tmp, VOTES);
  }).catch((e) => console.error('save failed', e));
  return writing;
}
function tally(voter) {
  const t = { yes: 0, maybe: 0, no: 0 };
  for (const v of Object.values(store.votes)) t[v.choice]++;
  const out = { ...t, total: t.yes + t.maybe + t.no };
  if (voter && store.votes[voter]) out.mine = store.votes[voter].choice;
  return out;
}

// ---------- tiny rate limit: 30 vote posts per IP per hour ----------
const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  list.push(now); hits.set(ip, list);
  return list.length > 30;
}

const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

async function readBody(req, max = 2048) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > max) throw new Error('too large'); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function api(req, res, url) {
  // Reports whether votes persist on the Railway volume (no paths exposed).
  if (url.pathname === '/api/health' && req.method === 'GET') {
    return json(res, 200, { ok: true, storage: process.env.RAILWAY_VOLUME_MOUNT_PATH ? 'volume' : 'ephemeral' });
  }
  if (url.pathname === '/api/votes' && req.method === 'GET') {
    return json(res, 200, tally(url.searchParams.get('voter')));
  }
  if (url.pathname === '/api/vote' && req.method === 'POST') {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (limited(ip)) return json(res, 429, { error: 'Too many votes from this connection. Try again later.' });
    let body;
    try { body = await readBody(req); } catch { return json(res, 400, { error: 'Bad request' }); }
    const voter = String(body.voter || '');
    if (!/^[a-z0-9-]{12,64}$/i.test(voter) || !CHOICES.includes(body.choice)) return json(res, 400, { error: 'Bad vote' });
    store.votes[voter] = { choice: body.choice, at: new Date().toISOString() };
    await save();
    return json(res, 200, tally(voter));
  }
  return json(res, 404, { error: 'Not found' });
}

async function files(req, res, url) {
  let path = decodeURIComponent(url.pathname);
  if (BLOCKED.test(path)) { res.writeHead(404); return res.end('Not found'); }
  let file = normalize(join(ROOT, path));
  if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(404); return res.end('Not found'); }
  try {
    if ((await stat(file)).isDirectory()) {
      if (!path.endsWith('/')) { res.writeHead(301, { location: path + '/' + url.search }); return res.end(); }
      file = join(file, 'index.html');
    }
    const type = TYPES[extname(file).toLowerCase()];
    if (!type) throw new Error('type');
    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': type,
      'cache-control': type.startsWith('text/html') ? 'no-cache' : 'public, max-age=600',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
  }
}

await load();
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    return await files(req, res, url);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: 'Server error' });
  }
}).listen(PORT, () => console.log(`mid-century ride on :${PORT}, data in ${DATA_DIR}`));
