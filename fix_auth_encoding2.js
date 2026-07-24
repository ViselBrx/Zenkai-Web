/**
 * fix_auth_encoding2.js
 * Segunda passagem — corrige os remanescentes
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'js-src', 'auth.js');
let content = fs.readFileSync(srcPath, 'utf8');
console.log('Arquivo lido. Tamanho:', content.length);
let fixCount = 0;

function replace(bad, good) {
  if (content.includes(bad)) {
    const count = content.split(bad).length - 1;
    content = content.split(bad).join(good);
    console.log('  Fix [' + count + 'x]: ' + JSON.stringify(bad.substring(0, 50)));
    fixCount += count;
  }
}

// Ainda há double-encoding restante em console.log (não afeta UI mas vamos limpar)
replace('ðŸ"', '🔔');
replace('âš ï¸', '⚠️');
replace('âŒ', '❌');
replace('Ã£', 'ão');  // "sessÃ£" -> "sessão" etc
replace('Ã§', 'ç');
replace('Ã¢', 'â');
replace('Ã©', 'é');
replace('Ã³', 'ó');
replace('Ã­', 'í');
replace('Ã', 'Â');

// Corrigir a mensagem do ❌ email inválido (textContent - não renderiza HTML)
replace(
  'errorDiv.textContent = "❌ E-mail inválido ou mal formatad";',
  'errorDiv.textContent = "E-mail inválido ou mal formatado.";'
);
replace(
  'errorDiv.textContent = "E-mail inválido ou mal formatad";',
  'errorDiv.textContent = "E-mail inválido ou mal formatado.";'
);

// Corrigir "Limite de e-mails atingido Por favor" (faltou ponto)
replace(
  'msg = "Limite de e-mails atingido Por favor, aguarde alguns minutos.";',
  'msg = "Limite de e-mails atingido. Por favor, aguarde alguns minutos.";'
);
replace(
  'msg = "Limite de tentativas atingido Aguarde um pouco e tente novamente.";',
  'msg = "Limite de tentativas atingido. Aguarde um pouco e tente novamente.";'
);

// Corrigir mensagem de login bem sucedido no console (só log, não crítico)
replace(
  'console.log("Login realizado com sucesso Verificando sessÃ£..");',
  'console.log("Login realizado com sucesso. Verificando sessão..");'
);
replace(
  'console.log("Login realizado com sucesso Verificando sess..");',
  'console.log("Login realizado com sucesso. Verificando sessão..");'
);

// Corrigir ⚠️ no innerHTML que ficou como âš ï¸ (line 353 e outros)
replace("âš ï¸ <strong>", '<i class="fa-solid fa-triangle-exclamation"></i> <strong>');
replace("âš ï¸", '<i class="fa-solid fa-triangle-exclamation"></i>');

// Qualquer ❌ restante em contexto textContent -> remover
replace('textContent = "❌ ', 'textContent = "');
replace("textContent = '❌ ", "textContent = '");
replace('textContent = `❌ ', 'textContent = `');

// Qualquer ❌ restante em innerHTML -> converter para ícone
replace(
  'innerHTML = "❌ ',
  'innerHTML = "<i class=\'fa-solid fa-circle-xmark\' style=\'color:var(--danger);margin-right:5px;\'></i> '
);

// ⚠️ restante em strings de usuário -> remover emoji, mantém texto
replace('⚠️ ', '');
replace('⚠️', '');
replace('❌ ', '');
replace('❌', '');

// Corrigir palavra "formatad" isolada que sobrou
replace('ou mal formatad"', 'ou mal formatado."');
replace('ou mal formatad.', 'ou mal formatado.');

// Corrigir "perfeição" que pode ter ficado corrompido
replace('perfeição.', 'perfeição.');  // garantir
replace('perfeição,', 'perfeição,');

// Linha 233 do arquivo original - mensagem de sucesso da redefinição de senha
// "Sua senha foi redefinida com perfeição Por segurança..."
replace(
  'Sua senha foi redefinida com perfeição Por segurança, você foi desconectado Faça o login com sua nova senha.',
  'Sua senha foi redefinida com perfeição! Por segurança, você foi desconectado. Faça o login com sua nova senha.'
);

// Corrigir o comentário do arquivo que estava corrompido na linha 2
replace(
  ' * js/auth.js â€" Configuração',
  ' * js/auth.js — Configuração'
);

// Salvar
fs.writeFileSync(srcPath, content, 'utf8');
console.log('\n=============================================');
console.log('Total de correções segunda passagem: ' + fixCount);
console.log('Arquivo salvo: js-src/auth.js');
console.log('=============================================');
