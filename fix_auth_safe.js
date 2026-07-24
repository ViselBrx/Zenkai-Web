/**
 * fix_auth_safe.js
 * Correção segura: processa linha a linha, sem regex multi-linha
 */
const fs = require('fs');
const srcPath = 'js-src/auth.js';

const raw = fs.readFileSync(srcPath);
// Detectar terminador de linha
const hasCRLF = raw.includes(Buffer.from('\r\n'));
const lineEnd = hasCRLF ? '\r\n' : '\n';

let lines = raw.toString('utf8').split(lineEnd);
console.log('Total de linhas:', lines.length);
let fixCount = 0;

function fixLine(lineNum, bad, good) {
  const idx = lineNum - 1; // 0-based
  if (lines[idx] !== undefined && lines[idx].includes(bad)) {
    lines[idx] = lines[idx].split(bad).join(good);
    console.log('  Linha ' + lineNum + ': corrigido "' + bad.substring(0, 50) + '"');
    fixCount++;
    return true;
  }
  // Se não encontrou na linha exata, busca nas linhas próximas (+/- 5)
  const start = Math.max(0, idx - 5);
  const end = Math.min(lines.length - 1, idx + 5);
  for (let i = start; i <= end; i++) {
    if (lines[i] !== undefined && lines[i].includes(bad)) {
      lines[i] = lines[i].split(bad).join(good);
      console.log('  Linha ~' + (i+1) + ': corrigido "' + bad.substring(0, 50) + '"');
      fixCount++;
      return true;
    }
  }
  // Busca em todo o arquivo como fallback
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(bad)) {
      lines[i] = lines[i].split(bad).join(good);
      console.log('  Linha ' + (i+1) + ' (global): corrigido "' + bad.substring(0, 50) + '"');
      fixCount++;
      return true;
    }
  }
  console.log('  NAO encontrado: "' + bad.substring(0, 50) + '"');
  return false;
}

// Função para buscar e corrigir em TODAS as linhas que contenham o padrão
function fixAll(bad, good) {
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(bad)) {
      lines[i] = lines[i].split(bad).join(good);
      count++;
    }
  }
  if (count > 0) {
    console.log('  [' + count + ' linhas] "' + bad.substring(0, 50) + '" -> "' + good.substring(0, 50) + '"');
    fixCount += count;
  }
  return count;
}

console.log('\n=== PASSO 1: Corrigir palavras truncadas pelo emoji ✅ ===');
// ✅ foi usado no lugar de 'o' ou 'o.' em muitas palavras
fixAll('registr\u2705html', 'registro.html');
fixAll('registr\u2705', 'registro');
fixAll('sucess\u2705', 'sucesso');
fixAll('Entrand\u2705..', 'Entrando..');
fixAll('Entrand\u2705', 'Entrando');
fixAll('Registrand\u2705..', 'Registrando..');
fixAll('Registrand\u2705', 'Registrando');
fixAll('Verificand\u2705..', 'Verificando..');
fixAll('Verificand\u2705', 'Verificando');
fixAll('Atualizand\u2705..', 'Atualizando..');
fixAll('Atualizand\u2705', 'Atualizando');
fixAll('Enviand\u2705..', 'Enviando..');
fixAll('Enviand\u2705', 'Enviando');
fixAll('inicializad\u2705', 'inicializado');
fixAll('autenticad\u2705', 'autenticado');
fixAll('desconectad\u2705', 'desconectado');
fixAll('calculad\u2705', 'calculado');
fixAll('inesperad\u2705', 'inesperado');
fixAll('identificad\u2705', 'identificado');
fixAll('encontrad\u2705', 'encontrado');
fixAll('atingid\u2705', 'atingido. ');
fixAll('atingid\u2705', 'atingido');
fixAll('inv\u00e1lid\u2705', 'inv\u00e1lido');
fixAll('verifica\u00e7\u00e3\u2705', 'verifica\u00e7\u00e3o');
fixAll('c\u00f3dig\u2705', 'c\u00f3digo');
fixAll('c\u00f3digo\u2705', 'c\u00f3digo');
fixAll('alterad\u2705', 'alterado');
fixAll('usu\u00e1ri\u2705', 'usu\u00e1rio');
fixAll('notifica\u00e7\u00f5\u2705', 'notifica\u00e7\u00f5es');
fixAll('perfei\u00c3\u00a7\u00c3\u00a3\u2705', 'perfei\u00e7\u00e3o');
fixAll('Recarregand\u2705', 'Recarregando');
fixAll('Redirecionand\u2705', 'Redirecionando');
fixAll('antig\u2705', 'antigo.');
fixAll('antig.', 'antigo.');

console.log('\n=== PASSO 2: Corrigir double-encoding de emojis (visível ao usuário) ===');
// Esses emojis double-encoded aparecem em textContent e são exibidos como lixo

// \u00e2\u009a \u00ef\u00b8\u008f = ⚠️ (U+26A0 U+FE0F) double-encoded em Latin-1
// Remover das mensagens de usuário
fixAll('\u00e2\u009a\u00a0\u00ef\u00b8\u008f ', ''); // ⚠️ + espaço
fixAll('\u00e2\u009a\u00a0\u00ef\u00b8\u008f', '');  // ⚠️ sem espaço

// \u00c3\u00a2\u0152\u008c = ❌ (U+274C) double-encoded
fixAll('\u00c3\u00a2\u0152\u008c ', ''); // ❌ + espaço
fixAll('\u00c3\u00a2\u0152\u008c', '');  // ❌ sem espaço

// \u00c3\u00b0\u009f... = emojis 🚀📨📧 etc double-encoded (F0 9F ...)
// Esses são sequências: C3 B0 9F XX YY
// Padrão geral: bytes \xc3\xb0 seguido de bytes de emoji F09F
// Não é possível fazer regex pois o arquivo pode ter variações

// Abordagem alternativa: vamos substituir cada emoji corrompido específico que encontramos
// 🚀 = F09F9A80 -> double-enc: C3B0 9F 9A 80 -> em Latin-1 lido como UTF-8: ðŸš€
fixAll('\u00c3\u00b0\u009f\u009a\u0080', ''); // 🚀 corrompido
fixAll('\u00c3\u00b0\u009f\u0093\u00a8', ''); // 📨 corrompido  
fixAll('\u00c3\u00b0\u009f\u0093\u00a7', ''); // 📧 corrompido
fixAll('\u00c3\u00b0\u009f\u0094\u008c', ''); // 📌 corrompido
fixAll('\u00c3\u00b0\u009f\u0094\u008d', ''); // 🔍 corrompido
fixAll('\u00c3\u00b0\u009f\u0094\u0084', ''); // 🔄 corrompido
fixAll('\u00c3\u00b0\u009f\u009b\u00a1\u00ef\u00b8\u008f', ''); // 🛡️
fixAll('\u00c3\u00b0\u009f\u0094\u00a6', ''); // 📦
fixAll('\u00c3\u00b0\u009f\u0094\u0094', ''); // 🔔
fixAll('\u00c3\u00b0\u009f\u0096\u00bc\u00ef\u00b8\u008f', ''); // 🖼️
fixAll('\u00c3\u00b0\u009f\u008e\u00ae', ''); // 🎮
fixAll('\u00c3\u00b0\u009f\u00a7\u00a9', ''); // 🧩
fixAll('\u00c3\u00b0\u009f\u008f\u0086', ''); // 🏆
fixAll('\u00c3\u00b0\u009f\u00a5\u0087', ''); // 🥇
fixAll('\u00c3\u00b0\u009f\u00a5\u0088', ''); // 🥈
fixAll('\u00c3\u00b0\u009f\u00a5\u0089', ''); // 🥉
fixAll('\u00c3\u00b0\u009f\u0092\u008e', ''); // 💎
fixAll('\u00c3\u00b0\u009f\u0092\u00b0', ''); // 💰
fixAll('\u00c3\u00b0\u009f\u0097\u009f\u00ef\u00b8\u008f', ''); // 🗟️
fixAll('\u00c3\u00b0\u009f\u008c\u009f', ''); // 🌟
fixAll('\u00c3\u00b0\u009f\u0094\u0088', ''); // 📈

// ✅ em strings que DEVERIAM ter o emoji (substituir por ícone FA)
// Ex: `✅ Código reenviado! Aguarde ${seconds}s`
fixAll('\u2705 C\u00f3digo reenviado! Aguarde ', 'C\u00f3digo reenviado! Aguarde ');
fixAll('\u2705 Verificar e Entrar', 'Verificar e Entrar');
fixAll('\u2705 ', '');
fixAll('\u2705', '');

// ❌ (U+274C) em textContent (não renderiza HTML) - remover
fixAll('\u274c ', '');
fixAll('\u274c', '');

// ⚠️ (U+26A0 U+FE0F) em textContent - remover  
fixAll('\u26a0\ufe0f ', '');
fixAll('\u26a0\ufe0f', '');

// 🔑 (U+1F511) -> ícone FA (em innerHTML)
fixAll('\U0001f511 ', '<i class="fa-solid fa-key"></i> ');
fixAll('\U0001f511', '<i class="fa-solid fa-key"></i>');

// ⏳ (U+23F3) -> ícone FA
fixAll('\u23f3 ', '<i class="fa-solid fa-hourglass-half"></i> ');
fixAll('\u23f3', '<i class="fa-solid fa-hourglass-half"></i>');

// 📨 (U+1F4E8) -> ícone FA
fixAll('\U0001f4e8 ', '<i class="fa-solid fa-paper-plane"></i> ');
fixAll('\U0001f4e8', '<i class="fa-solid fa-paper-plane"></i>');

// 📧 (U+1F4E7) -> ícone FA
fixAll('\U0001f4e7 ', '<i class="fa-solid fa-envelope"></i> ');
fixAll('\U0001f4e7', '<i class="fa-solid fa-envelope"></i>');

console.log('\n=== PASSO 3: Corrigir double-encoding de Latin-1 ===');
// â€" = – (en dash)
fixAll('\u00e2\u0080\u0093', '\u2013');
// â€™ = '
fixAll('\u00e2\u0080\u0099', '\u2019');
// Ã£ -> ão / ã  
// Ã§ -> ç
// Ã© -> é
// etc. (esses aparecem em console.log, não em UI)

console.log('\n=== PASSO 4: Ajustes finais de pontuação ===');
// Frases que perderam pontuação quando ✅ era o ponto
fixAll('Limite de e-mails atingido Por favor', 'Limite de e-mails atingido. Por favor');
fixAll('Limite de tentativas atingido Aguarde', 'Limite de tentativas atingido. Aguarde');
fixAll('senha foi redefinida com perfei\u00e7\u00e3o Por', 'senha foi redefinida com perfei\u00e7\u00e3o! Por');
fixAll('foi desconectado Fa\u00e7a', 'foi desconectado. Fa\u00e7a');
fixAll('Login realizado com sucesso Verificando', 'Login realizado com sucesso. Verificando');

// Corrigir NÃO com encoding corrompido
fixAll('N\u00c2O encontrado', 'N\u00c3\u0083O encontrado');

// Salvar
const output = lines.join(lineEnd);
fs.writeFileSync(srcPath, output, 'utf8');
console.log('\n=============================================');
console.log('Total de linhas corrigidas: ' + fixCount);
console.log('Tamanho final: ' + output.length + ' bytes');
console.log('Arquivo salvo: js-src/auth.js');
console.log('=============================================');
