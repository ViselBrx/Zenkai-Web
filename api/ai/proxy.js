const fs = require('fs');
const path = require('path');

function tryParseJSON(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readDataFile() {
  const candidatePaths = [
    path.join(process.cwd(), 'data', 'data.json'),
    path.join(process.cwd(), '..', 'data', 'data.json'),
    path.join(process.cwd(), '..', '..', 'data', 'data.json')
  ];

  for (const dataPath of candidatePaths) {
    try {
      if (fs.existsSync(dataPath)) {
        return JSON.parse(fs.readFileSync(dataPath, 'utf8')) || {};
      }
    } catch {
      // Tenta o prÃ³ximo caminho
    }
  }

  return {};
}

function dataUrlToByteArray(dataUrl) {
  const matches = dataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!matches) return null;
  return Array.from(Buffer.from(matches[1], 'base64'));
}

function buildCredentialCandidates(entries) {
  const seen = new Set();
  return (entries || [])
    .map((entry) => ({
      source: entry?.source || 'desconhecida',
      value: String(entry?.value || '').trim()
    }))
    .filter((entry) => entry.value)
    .filter((entry) => {
      if (seen.has(entry.value)) return false;
      seen.add(entry.value);
      return true;
    });
}

function shouldRetryWithNextCredential(statusCode, responseBody) {
  if (![401, 403].includes(Number(statusCode || 0))) return false;

  const parsed = tryParseJSON(responseBody);
  const rawText = typeof responseBody === 'string'
    ? responseBody
    : JSON.stringify(parsed || responseBody || {});
  const text = rawText.toLowerCase();

  return (
    text.includes('api key')
    || text.includes('permission_denied')
    || text.includes('unauthorized')
    || text.includes('authentication')
    || text.includes('invalid')
    || text.includes('leaked')
    || text.includes('expired')
  );
}

function buildProxyErrorBody(target, statusCode, responseBody) {
  const parsed = tryParseJSON(responseBody);
  const providerMessage = parsed?.error?.message || parsed?.message || String(responseBody || '').trim();

  if (target === 'gemini' && /reported as leaked/i.test(providerMessage)) {
    return JSON.stringify({
      error: {
        code: Number(statusCode || 403),
        status: 'PERMISSION_DENIED',
        message: 'A chave da Gemini configurada foi marcada como vazada pelo Google. Gere uma nova chave.',
        providerMessage
      }
    });
  }

  if (parsed) {
    return JSON.stringify(parsed);
  }

  return JSON.stringify({
    error: {
      code: Number(statusCode || 500),
      message: providerMessage || `Erro HTTP ${statusCode || 500}`
    }
  });
}

async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    let { target, method, headers, body, apiKey: frontendApiKey } = data;
    const config = readDataFile().aiConfig || {};
    
    let apiUrl = '';
    let requestPayload = body || null;
    let credentialCandidates = [];

    if (target === 'openrouter') {
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      credentialCandidates = buildCredentialCandidates([
        { source: 'frontend', value: frontendApiKey },
        { source: 'process.env.OPENROUTER_API_KEY', value: process.env.OPENROUTER_API_KEY },
        { source: 'data.json -> aiConfig.openrouterKey', value: config.openrouterKey }
      ]);
      headers = headers || {};
      if (!headers.Referer && !headers['referer']) headers.Referer = 'https://animehouse-zeta.vercel.app';
      if (!headers['X-Title']) headers['X-Title'] = 'Zenkai';
    } else if (target === 'groq') {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      credentialCandidates = buildCredentialCandidates([
        { source: 'frontend', value: frontendApiKey },
        { source: 'process.env.GROQ_API_KEY', value: process.env.GROQ_API_KEY },
        { source: 'data.json -> aiConfig.groqKey', value: config.groqKey }
      ]);
    } else if (target === 'gemini') {
      const geminiModel = String(
        body?.model
        || process.env.GEMINI_MODEL
        || 'gemini-1.5-flash'
      ).replace(/^models\//i, '').trim();
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
      credentialCandidates = buildCredentialCandidates([
        { source: 'frontend', value: frontendApiKey },
        { source: 'process.env.GEMINI_API_KEY', value: process.env.GEMINI_API_KEY },
        { source: 'process.env.GOOGLE_API_KEY', value: process.env.GOOGLE_API_KEY },
        { source: 'data.json -> aiConfig.geminiKey', value: config.geminiKey }
      ]);
      
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
          const mimeTypeMatch = body.image.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/);
          const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
          lastTurn.parts.push({
            inlineData: {
              mimeType,
              data: body.image.split(',')[1]
            }
          });
        }
      }
    } else if (target === 'cloudflare-vision') {
      const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || config.cloudflareAccountId || '';
      apiUrl = cloudflareAccountId
        ? `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`
        : '';
      credentialCandidates = buildCredentialCandidates([
        { source: 'frontend', value: frontendApiKey },
        { source: 'process.env.CLOUDFLARE_API_TOKEN', value: process.env.CLOUDFLARE_API_TOKEN },
        { source: 'data.json -> aiConfig.cloudflareApiToken', value: config.cloudflareApiToken }
      ]);

      if (body?.image && typeof body.image === 'string' && body.image.startsWith('data:image')) {
        const imageBytes = dataUrlToByteArray(body.image);
        if (!imageBytes) {
          return res.status(400).json({ error: 'Imagem invÃ¡lida para Cloudflare Vision.' });
        }

        requestPayload = {
          ...body,
          image: imageBytes
        };
      }
    }

    // A ZenkAI entrega respostas completas para manter a formatação estável.
    // Impede que clientes antigos ou cacheados reativem streaming por engano.
    if (requestPayload && typeof requestPayload === 'object') {
      requestPayload = { ...requestPayload };
      if (target === 'gemini') {
        delete requestPayload.stream;
      } else {
        requestPayload.stream = false;
      }
    }

    if (!apiUrl || credentialCandidates.length === 0) {
      return res.status(400).json({ error: `ConfiguraÃ§Ã£o da IA '${target}' ausente no Vercel. Defina nas Environment Variables do projeto.` });
    }

    const requestBody = requestPayload ? JSON.stringify(requestPayload) : null;
    let lastAttempt = null;

    for (let index = 0; index < credentialCandidates.length; index += 1) {
      const credential = credentialCandidates[index];
      const attemptUrl = target === 'gemini'
        ? `${apiUrl}?key=${encodeURIComponent(credential.value)}`
        : apiUrl;
      
      const fetchHeaders = {
        'Content-Type': 'application/json',
        ...(headers || {})
      };

      if (target !== 'gemini') {
        fetchHeaders['Authorization'] = `Bearer ${credential.value}`;
      }

      const isStream = requestPayload && requestPayload.stream === true;

      try {
        const attempt = await fetch(attemptUrl, {
          method: method || 'POST',
          headers: fetchHeaders,
          body: requestBody
        });
        
        if (isStream && attempt.ok && attempt.body) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders();
          
          const reader = attempt.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
          return;
        }

        const responseText = await attempt.text();
        lastAttempt = { statusCode: attempt.status, body: responseText };

        if (
          attempt.status >= 400
          && shouldRetryWithNextCredential(attempt.status, responseText)
          && index < (credentialCandidates.length - 1)
        ) {
          continue; // TentarÃ¡ a prÃ³xima
        }

        if (attempt.status >= 400) {
          return res.status(attempt.status).send(buildProxyErrorBody(target, attempt.status, responseText));
        }

        return res.status(200).send(responseText);
      } catch (proxyError) {
        if (index === (credentialCandidates.length - 1)) {
          return res.status(500).json({ error: 'Falha no Proxy da IA: ' + proxyError.message });
        }
      }
    }

    if (lastAttempt && lastAttempt.statusCode >= 400) {
      return res.status(lastAttempt.statusCode).send(buildProxyErrorBody(target, lastAttempt.statusCode, lastAttempt.body));
    }

    return res.status(500).json({ error: 'Falha no Proxy da IA: nenhuma credencial conseguiu concluir a requisicao.' });
  } catch (e) { 
    return res.status(500).json({ error: e.message || 'Erro interno no proxy' });
  }
}

module.exports = handler;
