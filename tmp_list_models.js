const https = require('https');
const fs = require('fs');
const path = require('path');

function getEnv(key) {
  try {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    const match = env.match(new RegExp(`^${key}=["']?([^"'\r\n]+)["']?`, 'm'));
    return match ? match[1] : null;
  } catch (e) { return null; }
}

const apiKey = getEnv('GEMINI_API_KEY');
if (!apiKey) {
  console.log('ERRO: GEMINI_API_KEY nao encontrada no .env');
  process.exit(1);
}

const versions = ['v1', 'v1beta'];

function checkVersion(v) {
  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/${v}/models?key=${apiKey}`;
    console.log(`\n--- Testando ${v} ---`);
    https.get(url, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.error) {
            console.log(`Erro na versao ${v}: ${data.error.message}`);
          } else if (data.models) {
            console.log(`Modelos disponiveis em ${v}:`);
            data.models.forEach(m => {
              if (m.name.includes('flash') || m.name.includes('gemini')) {
                console.log(` - ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
              }
            });
          } else {
            console.log(`Resposta inesperada em ${v}: ${body}`);
          }
        } catch (e) {
          console.log(`Falha ao processar ${v}: ${body.substring(0, 100)}`);
        }
        resolve();
      });
    }).on('error', (e) => {
      console.log(`Erro de rede em ${v}: ${e.message}`);
      resolve();
    });
  });
}

(async () => {
  for (const v of versions) {
    await checkVersion(v);
  }
})();
