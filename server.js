/**
 * server.js — Servidor local AnimeHouse
 * =======================================
 * Suporta upload real de arquivos de capa (salvos em /uploads) e JSON brutos.
 * Proxy para API Consumet (elimina necessidade de servidor separado)
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');
const https = require('https');

function loadEnvFallback(envFilePath) {
  try {
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    envContent.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;

      const separatorIndex = trimmedLine.indexOf('=');
      if (separatorIndex <= 0) return;

      const key = trimmedLine.slice(0, separatorIndex).trim();
      let value = trimmedLine.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    // Ignora se o .env nao existir ou nao puder ser lido.
  }
}

// Carrega as variáveis do .env (se existir e o pacote estiver instalado)
try { require('dotenv').config(); } catch (e) { loadEnvFallback(path.join(__dirname, '.env')); }

const PORT       = process.env.PORT || 3000;
const ROOT       = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const PAGES_DIR  = path.join(ROOT, 'pages');
const DATA_FILE  = path.join(ROOT, 'data', 'data.json');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css; charset=utf-8',
  '.js'  : 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif' : 'image/gif',
  '.webp': 'image/webp',
};

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
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

function dataUrlToByteArray(dataUrl) {
  const matches = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!matches) return null;
  return Array.from(Buffer.from(matches[1], 'base64'));
}

function safeResolve(baseDir, requestPath) {
  const resolved = path.normalize(path.join(baseDir, requestPath));
  if (resolved !== baseDir && !resolved.startsWith(baseDir + path.sep)) return null;
  return resolved;
}

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
      const data = await getBody(req);
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
      const { target, method, headers, body, apiKey: frontendApiKey } = data;
      const config = readData().aiConfig || {};
      
      console.log(`[AI Proxy] Alvo: ${target} | Método: ${method || 'POST'}`);
      
      let apiUrl = '';
      let apiKey = '';
      let requestPayload = body || null;

      if (target === 'groq') {
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        apiKey = GROQ_API_KEY || frontendApiKey || config.groqKey || '';
      } else if (target === 'gemini') {
        const geminiModel = String(
          body?.model
          || process.env.GEMINI_MODEL
          || config.geminiModel
          || 'gemini-2.5-flash'
        ).replace(/^models\//i, '').trim();
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || frontendApiKey || config.geminiKey || '';
        apiUrl = GEMINI_API_KEY
          ? `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`
          : '';
        apiKey = GEMINI_API_KEY;
        console.log(`[AI Proxy] Gemini model: ${geminiModel}`);
        
        const contents = (body?.messages || []).filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        if (contents.length === 0 && (body?.prompt || body?.content)) {
          contents.push({ role: 'user', parts: [{ text: body.prompt || body.content }] });
        }

        const systemMessage = (body?.messages || []).find(m => m.role === 'system');

        requestPayload = {
          contents,
          generationConfig: {
            temperature: body?.temperature || 0.7,
            maxOutputTokens: body?.max_tokens || 2048
          }
        };

        if (systemMessage) {
          requestPayload.system_instruction = { parts: [{ text: systemMessage.content }] };
        }

        if (body?.image && typeof body.image === 'string' && body.image.startsWith('data:image')) {
          const lastTurn = contents[contents.length - 1];
          if (lastTurn && lastTurn.role === 'user') {
            lastTurn.parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: body.image.split(',')[1]
              }
            });
          }
        }
      } else if (target === 'cloudflare-vision') {
        const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || config.cloudflareAccountId || '';
        apiUrl = cloudflareAccountId
          ? `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`
          : '';
        apiKey = process.env.CLOUDFLARE_API_TOKEN || frontendApiKey || config.cloudflareApiToken || '';

        if (body?.image && typeof body.image === 'string' && body.image.startsWith('data:image')) {
          const imageBytes = dataUrlToByteArray(body.image);
          if (!imageBytes) {
            return sendJSON(res, 400, { error: 'Imagem inválida para Cloudflare Vision.' });
          }

          requestPayload = {
            ...body,
            image: imageBytes
          };
        }
      } else if (target === 'zimage') {
        apiUrl = 'https://api.z-image.com/v1/generate';
        apiKey = config.zimageKey || frontendApiKey;
      } else if (target === 'magichour') {
        apiUrl = 'https://api.magichour.ai/v1/video';
        apiKey = config.magichourKey || frontendApiKey;
      }
      console.log(`[AI Proxy] URL: ${apiUrl}`);
      console.log(`[AI Proxy] Chave do Frontend chegou? ${!!frontendApiKey} (Valor: ${frontendApiKey ? frontendApiKey.substring(0,6) + '...' : 'Vazio'})`);
      const configKeyPreview = target === 'gemini'
        ? config.geminiKey
        : target === 'groq'
          ? config.groqKey
          : target === 'cloudflare-vision'
            ? config.cloudflareApiToken
            : '';
      console.log(`[AI Proxy] Chave em data.json para ${target}: ${configKeyPreview ? configKeyPreview.substring(0,6) + '...' : 'Vazio'}`);
      if (!apiUrl || !apiKey) {
        console.error(`[AI Proxy] Erro Crítico: Alvo '${target}' não configurado corretamente.`);
        return sendJSON(res, 400, { error: `Configuração da IA '${target}' ausente. Defina no .env, envie pelo frontend ou salve no data.json.` });
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

      if (target === 'gemini') {
        delete options.headers['Authorization']; // Gemini usa key na URL
      }

      const requestBody = requestPayload ? JSON.stringify(requestPayload) : null;
      if (requestBody) {
        options.headers['Content-Length'] = Buffer.byteLength(requestBody);
      }

      const proxyReq = https.request(apiUrl, options, (proxyRes) => {
        let resBody = '';
        console.log(`[AI Proxy] Resposta recebida: ${proxyRes.statusCode}`);
        proxyRes.on('data', (d) => { resBody += d; });
        proxyRes.on('end', () => {
          console.log(`[AI Proxy] Resposta Final (Primeiros 100 caracteres): ${resBody.substring(0, 100)}...`);
          if (proxyRes.statusCode >= 400) {
            console.error(`[AI Proxy] Erro da API Externa (${proxyRes.statusCode}):`, resBody);
          }
          res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
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

  if (req.method === 'GET' && pathname === '/opne-anime.html') {
    res.writeHead(301, { Location: '/open-anime.html' });
    return res.end();
  }

  // ── ARQUIVOS ESTÁTICOS ──
  const requestPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const isHtmlRequest = pathname === '/' || path.extname(requestPath).toLowerCase() === '.html';
  const baseDir = isHtmlRequest ? PAGES_DIR : PUBLIC_DIR;
  const filePath = safeResolve(baseDir, requestPath);
  if (!filePath) { res.writeHead(403); return res.end('Proibido'); }

  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.html') {
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) { res.writeHead(404); return res.end('404'); }
      
      // Injeta variáveis de ambiente no <head> para que o auth.js consiga ler as configurações do Supabase escondidas do código fonte
      let responseContent = content.replace(/<head>/i, `<head>\n  <script>window.ENV = ${JSON.stringify({
        SUPABASE_URL: process.env.SUPABASE_URL || 'https://bxifddhrbxbmimjkgwzr.supabase.co',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'sb_publishable_P2YveYtfG8469tWxpcR0ig_hZxLXIol'
      })};</script>`);

      res.writeHead(200, { 'Content-Type': MIME[ext], 'Access-Control-Allow-Origin': '*' });
      res.end(responseContent);
    });
  } else {
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
      fs.createReadStream(filePath).pipe(res);
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  const cyan = '\x1b[36m';
  const blue = '\x1b[34m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const magenta = '\x1b[35m';
  const red = '\x1b[31m';
  const white = '\x1b[97m';
  const gray = '\x1b[90m';

  const divider = `${gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`;
  const title = `${bold}${cyan}Anime House Local Server${reset}`;
  const subtitle = `${blue}Media Platform • AI Tools • Local Runtime${reset}`;
  const statusOk = `${bold}${green}ONLINE${reset}`;
  const info = `${bold}${cyan}INFO${reset}`;
  const storage = `${bold}${magenta}STORAGE${reset}`;
  const proxy = `${bold}${blue}PROXY${reset}`;
  const access = `${bold}${green}ACCESS${reset}`;
  const warn = `${bold}${yellow}NOTICE${reset}`;
  const secure = `${bold}${red}KEEP OPEN${reset}`;
  const supabaseUrl = process.env.SUPABASE_URL || 'https://bxifddhrbxbmimjkgwzr.supabase.co';
  const supabaseHost = supabaseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  console.log(`\n${divider}`);
  console.log(` ${title}`);
  console.log(` ${subtitle}`);
  console.log(`${divider}`);
  console.log(` ${statusOk}   Serviço principal inicializado com sucesso`);
  console.log(` ${info}     Ambiente........... ${white}desenvolvimento local${reset}`);
  console.log(` ${info}     Porta.............. ${yellow}${PORT}${reset}`);
  console.log(` ${access}   URL base........... ${green}http://localhost:${PORT}${reset}`);
  console.log(` ${storage}  Database........... ${magenta}Supabase${reset}`);
  console.log(` ${storage}  Endpoint........... ${magenta}${supabaseHost}${reset}`);
  console.log(` ${storage}  Uploads............ ${magenta}${path.basename(UPLOADS_DIR)}/${reset}`);
  console.log(` ${proxy}    AI Proxy........... ${blue}habilitado${reset}`);
  console.log(` ${proxy}    CORS............... ${blue}habilitado para acesso local${reset}`);
  console.log(`${divider}`);
  console.log(` ${warn}   Use esta instância para navegar, cadastrar conteúdo e testar integrações.`);
  console.log(` ${secure}  Mantenha este terminal aberto enquanto o sistema estiver em uso.`);
  console.log(`${divider}\n`);
});
