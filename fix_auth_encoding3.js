/**
 * fix_auth_encoding3.js - Terceira passagem usando regex e Buffer
 */
const fs = require('fs');
const srcPath = 'js-src/auth.js';

// Lê como buffer raw e converte para string
const buf = fs.readFileSync(srcPath);
let content = buf.toString('utf8');
let fixCount = 0;

function replace(bad, good) {
  if (content.includes(bad)) {
    const count = content.split(bad).length - 1;
    content = content.split(bad).join(good);
    console.log('  [' + count + 'x] fixed');
    fixCount += count;
  }
}

// Corrigir strings de mensagem ao usuário nas linhas 475-481
// As mensagens de erro no registro com emoji corrompido no início
const oldMsg1 = 'msg = "\u00e2\u009a \u00ef\u00b8\u008f Limite de tentativas atingido Por favor, aguarde alguns minutos.";';
const newMsg1 = 'msg = "Limite de tentativas atingido. Por favor, aguarde alguns minutos.";';
replace(oldMsg1, newMsg1);

const oldMsg2 = 'msg = "\u00e2\u009a \u00ef\u00b8\u008f Você já solicitou um código para este e-mail. Aguarde 1 minuto para tentar novamente.";';
const newMsg2 = 'msg = "Você já solicitou um código para este e-mail. Aguarde 1 minuto para tentar novamente.";';
replace(oldMsg2, newMsg2);

const oldMsg3 = 'msg = "\u00e2\u009a \u00ef\u00b8\u008f Erro no servidor de e-mail (SMTP). Por favor, verifique as configurações de SMTP no painel do Supabase.";';
const newMsg3 = 'msg = "Erro no servidor de e-mail (SMTP). Por favor, verifique as configurações de SMTP no painel do Supabase.";';
replace(oldMsg3, newMsg3);

const oldMsg4 = 'msg = "\u00c3\u00a2\u0152\u008c Alguém já está usando essa conta. Tente fazer login ou use outro e-mail.";';
const newMsg4 = 'msg = "Alguém já está usando essa conta. Tente fazer login ou use outro e-mail.";';
replace(oldMsg4, newMsg4);

// Textos de botão
replace('resendBtn.textContent = "\u00c3\u00b0\u009f\u0094\u00a8 Enviando..";', 'resendBtn.textContent = "Enviando..";');
replace('resendBtn.textContent = "\u00c3\u00a2\u0152\u008c Erro ao reenviar. Tente novamente.";', 'resendBtn.textContent = "Erro ao reenviar. Tente novamente.";');
replace('resendBtn.textContent = "\u00c3\u00a2\u0152\u008c " + msg;', 'resendBtn.textContent = msg;');
replace('verifyOtpBtn.textContent = "\u00c3\u00b0\u009f\u0094\u008c Verificando..";', 'verifyOtpBtn.textContent = "Verificando..";');
replace('"O código expirou ou é antig"', '"O código expirou ou é antigo."');
replace("'O código expirou ou é antig'", "'O código expirou ou é antigo.'");
replace('otpSection N\u00c2O encontrado no DOM!', 'otpSection NÃO encontrado no DOM!');

// Usar regex para remover todos os bytes corrompidos que parecem emojis mal-codificados
// Padrão: sequências de bytes tipo \xc3\xb0\x9f... que são emoji em UTF-8 mal relido
// Vamos usar regex para capturar esses padrões em strings JavaScript

// Remove sequências de "garbled" UTF-8 que começam com ð (0xC3 0xB0) seguido de bytes de emoji
// Esses aparecem em console.log() que não são visíveis ao usuário final

// Regex para encontrar o padrão dos emojis duplo-codificados:
// Eles são: ðŸXX (emoji original era F0 9F XX YY em UTF-8, depois re-codificado)
// Em JS string, aparecem como: \u00f0\u009f...
// Vamos usar um regex para limpar dentro de strings (entre aspas)

// Usar regex para limpar emojis garbled dentro de strings de código
// O padrão: caracteres >= 0x80 fora de contexto de texto normal
content = content.replace(/"[^"]*?(?:ðŸ|ð|âœ|â |âš|Ã)[^"]*?"/g, function (match) {
  // Limpar o emoji corrompido do interior da string
  return match
    .replace(/ðŸ[^\s"'`,;)]+/g, '')
    .replace(/ð[^\s"'`,;)]+/g, '')
    .replace(/âœ[^\s"'`,;)]+/g, '')
    .replace(/â [^\s"'`,;)]+/g, '')
    .replace(/âš[^\s"'`,;)]+/g, '')
    .replace(/Ã[³§©¢]/g, function (m) {
      const map = { 'Ã³': 'ó', 'Ã§': 'ç', 'Ã©': 'é', 'Ã¢': 'â' };
      return map[m] || m;
    })
    .replace(/\s+/g, ' ')
    .trim();
});

// Mesma coisa com aspas simples
content = content.replace(/'[^']*?(?:ðŸ|ð|âœ|â |âš)[^']*?'/g, function (match) {
  return match
    .replace(/ðŸ[^\s"'`,;)]+/g, '')
    .replace(/ð[^\s"'`,;)]+/g, '')
    .replace(/â [^\s"'`,;)]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
});

// Mesma coisa com template literals
content = content.replace(/`[^`]*?(?:ðŸ|ð|âœ|â |âš)[^`]*?`/g, function (match) {
  return match
    .replace(/ðŸ[^\s`]+/g, '')
    .replace(/ð[^\s`]+/g, '')
    .replace(/â [^\s`]+/g, '')
    .replace(/\s+/g, ' ');
});

fs.writeFileSync(srcPath, content, 'utf8');
console.log('Total de correções: ' + fixCount);
console.log('Arquivo salvo: js-src/auth.js');
