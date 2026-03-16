/**
 * server.js — Servidor local AnimeHouse
 * =======================================
 * Suporta upload real de arquivos de capa (salvos em /uploads) e JSON brutos.
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');
const https = require('https');

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

  // AI Proxy Route
  if (req.method === 'POST' && pathname === '/api/ai/proxy') {
    try {
      const data = await getBody(req);
      const { target, method, headers, body } = data;
      const config = readData().aiConfig || {};
      
      console.log(`[AI Proxy] Alvo: ${target} | Método: ${method || 'POST'}`);
      
      let apiUrl = '';
      let apiKey = '';

      if (target === 'groq') {
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        apiKey = config.groqKey;
      } else if (target === 'zimage') {
        apiUrl = 'https://api.z-image.com/v1/generate';
        apiKey = config.zimageKey;
      } else if (target === 'magichour') {
        apiUrl = 'https://api.magichour.ai/v1/video';
        apiKey = config.magichourKey;
      }

      console.log(`[AI Proxy] Chave encontrada? ${!!apiKey} | URL: ${apiUrl}`);

      if (!apiUrl || !apiKey) {
        console.error(`[AI Proxy] Erro Crítico: Alvo '${target}' não configurado corretamente.`);
        return sendJSON(res, 400, { error: 'Configuração de IA ausente no data.json' });
      }

      console.log(`[AI Proxy] Chamando API externa: ${apiUrl}`);

      const options = {
        method: method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(headers || {})
        }
      };

      const requestBody = body ? JSON.stringify(body) : null;
      if (requestBody) {
        options.headers['Content-Length'] = Buffer.byteLength(requestBody);
      }

      const proxyReq = https.request(apiUrl, options, (proxyRes) => {
        let resBody = '';
        console.log(`[AI Proxy] Resposta recebida: ${proxyRes.statusCode}`);
        proxyRes.on('data', (d) => { resBody += d; });
        proxyRes.on('end', () => {
          console.log(`[AI Proxy] Resposta Final (Primeiros 100 caracteres): ${resBody.substring(0, 100)}...`);
          res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(resBody);
        });
      });

      proxyReq.on('error', (e) => {
        sendJSON(res, 500, { error: 'Falha no Proxy da IA: ' + e.message });
      });

      if (requestBody) proxyReq.write(requestBody);
      proxyReq.end();
      return;
    } catch (e) { return sendJSON(res, 500, { error: e.message }); }
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

  console.log('\n\x1b[36m%s\x1b[0m', '🎌 ANIME HOUSE - SISTEMA ONLINE\n');

  console.log('\x1b[32m%s\x1b[0m', '✔ Sistema iniciado');
  console.log('\x1b[32m%s\x1b[0m', '✔ Banco carregado (data.json)');
  console.log('\x1b[32m%s\x1b[0m', '✔ Capas ativas (/uploads)');

  console.log('\n\x1b[33m%s\x1b[0m', `🌐 http://localhost:${PORT}\n`);

  console.log('\x1b[90m%s\x1b[0m', '⚠ Não feche este terminal\n');

});