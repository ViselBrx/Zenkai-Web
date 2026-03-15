/**
 * server.js — Servidor local AnimeHouse
 * =======================================
 * Suporta upload real de arquivos de capa (salvos em /uploads) e JSON brutos.
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT      = 3000;
const ROOT      = __dirname;
const DATA_FILE = path.join(ROOT, 'data.json');
const UPLOADS_DIR = path.join(ROOT, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif' : 'image/gif',
  '.webp': 'image/webp',
};

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { cartoons: [], episodes: {}, animes: [], animeEpisodes: {}, mangas: [] }; }
}
function writeData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }

// Parse body JSON simples
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end',  () => { try { resolve(JSON.parse(body)); } catch { reject(new Error('JSON inválido')); } });
    req.on('error', reject);
  });
}

// Upload simples nativo (não precisamos npm form-data, salvaremos uma string base64 via JSON direto no banco local e gravaremos em disco)
// Para facilitar a vida em Node sem Npm, o cliente manda JSON { imageBase64, ...resto }
// O servidor grava base64 no /uploads e devolve { url: '/uploads/nome.jpg' }

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname  = decodeURIComponent(parsedUrl.pathname);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 
      'Access-Control-Allow-Origin': '*', 
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ── ROTAS DA API ──
  if (req.method === 'GET' && pathname === '/api/data') {
    return sendJSON(res, 200, readData());
  }

  // upload e save unificado
  if (req.method === 'POST' && pathname === '/api/save') {
    try {
      const state = await getBody(req);
      writeData(state);
      return sendJSON(res, 200, { ok: true });
    } catch (e) { return sendJSON(res, 400, { error: e.message }); }
  }

  if (req.method === 'POST' && pathname === '/api/upload') {
    try {
      const data = await getBody(req); // { base64: "data:image/jpeg;base64,..." }
      if (!data.base64 || !data.base64.startsWith('data:image')) {
        return sendJSON(res, 400, { error: 'Formato inválido' });
      }
      const matches = data.base64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) return sendJSON(res, 400, { error: 'Regex fail' });
      
      const ext = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `capa_${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
      
      return sendJSON(res, 200, { url: `http://localhost:${PORT}/uploads/${filename}` });
    } catch(e) { return sendJSON(res, 500, { error: e.message }); }
  }

  // ── ARQUIVOS ESTÁTICOS ──
  let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Proibido'); }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404); return res.end('404');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\x1b[35m%s\x1b[0m', '======================================================');
  console.log('\x1b[36m%s\x1b[0m', '      🈯  A N I M E   H O U S E   O N L I N E  🎬');
  console.log('\x1b[35m%s\x1b[0m', '======================================================');
  console.log('');
  console.log('\x1b[32m%s\x1b[0m', '  ✅ Banco de Dados Local Conectado (data.json)!');
  console.log('\x1b[32m%s\x1b[0m', '  ✅ Sistema de Uploads Ativo (/uploads)');
  console.log('');
  console.log('\x1b[33m%s\x1b[0m', `  🚀 Acesse agora: http://localhost:${PORT}`);
  console.log('');
  console.log('\x1b[90m%s\x1b[0m', '  [Aviso: Mantenha esta janela preta aberta para');
  console.log('\x1b[90m%s\x1b[0m', '   garantir que seus animes e capas sejam salvos!]');
  console.log('\x1b[35m%s\x1b[0m', '======================================================');
});
