/**
 * fix_auth_encoding.js
 * Corrige problemas de encoding UTF-8 e substitui emojis por icones FA
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'js-src', 'auth.js');
let content = fs.readFileSync(srcPath, 'utf8');
console.log('Arquivo lido. Tamanho:', content.length, 'bytes');
let fixCount = 0;

function replace(bad, good) {
  if (content.includes(bad)) {
    const count = content.split(bad).length - 1;
    content = content.split(bad).join(good);
    console.log('  Fix [' + count + 'x]: ' + bad.substring(0, 40).replace(/\n/g, '\\n'));
    fixCount += count;
  }
}

// =============================================
// 1. CORRIGIR DOUBLE-ENCODING (Latin-1 lido como UTF-8)
//    Esses aparecem no código mas NAO são visíveis ao usuário
// =============================================
replace('ðŸš€', '🚀');
replace('âœ…', '✅');
replace('â Œ', '❌');
replace('âš ï¸', '⚠️');
replace('ðŸ"¨', '📨');
replace('ðŸ"§', '📧');
replace('ðŸ"Œ', '📌');
replace('ðŸ"', '🔍');
replace('ðŸ"„', '🔄');
replace('ðŸ›¡ï¸', '🛡️');
replace('ðŸ"¦', '📦');
replace('ðŸ"', '🔔');
replace('ðŸ–¼ï¸', '🖼️');
replace('â€"', '–');
replace('â€™', "'");
replace('â€œ', '"');
replace('â€', '"');

// =============================================
// 2. CORRIGIR PALAVRAS CORTADAS POR ✅ (o caractere virou substituto do 'o' ou 'o.')
// =============================================
replace('registr✅html', 'registro.html');
replace('registr✅', 'registro');
replace('sucess✅', 'sucesso');
replace('Entrand✅..', 'Entrando..');
replace('Entrand✅', 'Entrando');
replace('Registrand✅..', 'Registrando..');
replace('Registrand✅', 'Registrando');
replace('Verificand✅..', 'Verificando..');
replace('Verificand✅', 'Verificando');
replace('Atualizand✅..', 'Atualizando..');
replace('Atualizand✅', 'Atualizando');
replace('Enviand✅..', 'Enviando..');
replace('Enviand✅', 'Enviando');
replace('inicializad✅', 'inicializado');
replace('autenticad✅', 'autenticado');
replace('desconectad✅', 'desconectado');
replace('calculad✅', 'calculado');
replace('inesperad✅', 'inesperado');
replace('identificad✅', 'identificado');
replace('encontrad✅', 'encontrado');
replace('atingid✅', 'atingido');
replace('inválid✅', 'inválido');
replace('verificaçã✅', 'verificação');
replace('verificaçã✅', 'verificação');
replace('códig✅', 'código');
replace('código✅', 'código');
replace('alterad✅', 'alterado');
replace('usuári✅', 'usuário');
replace('SessÃ£✅', 'Sessão');
replace('sessiÃ£✅', 'sessão');
replace('notificaçõ✅', 'notificações');
replace('perfeiÃ§Ã£✅', 'perfeição');
replace('Recarregand✅', 'Recarregando');

// frases específicas encontradas
replace('Verificar e Entrar✅', 'Verificar e Entrar');
replace('Entrar✅', 'Entrar');

// =============================================
// 3. SUBSTITUIR EMOJIS VISÍVEIS AO USUÁRIO POR ÍCONES FONT AWESOME
//    (em textContent, innerHTML, strings de botões)
// =============================================

// -- 3a. Ícone de chave (🔑) -> fa-key
replace('🔑 ', '<i class="fa-solid fa-key"></i> ');
replace('🔑', '<i class="fa-solid fa-key"></i>');

// -- 3b. Relógio/ampulheta (⏳) -> fa-hourglass-half
replace('⏳ ', '<i class="fa-solid fa-hourglass-half"></i> ');
replace('⏳', '<i class="fa-solid fa-hourglass-half"></i>');

// -- 3c. Caixa de correio (📨 📧) -> fa-envelope
replace('📨 ', '<i class="fa-solid fa-paper-plane"></i> ');
replace('📨', '<i class="fa-solid fa-paper-plane"></i>');
replace('📧 ', '<i class="fa-solid fa-envelope"></i> ');
replace('📧', '<i class="fa-solid fa-envelope"></i>');

// -- 3d. ❌ em mensagens visíveis ao usuário -> fa-circle-xmark
// (em textContent não HTML, apenas remove o emoji pois textContent não renderiza HTML)
// Nos lugares com textContent, remover o emoji
// Nos lugares com innerHTML, colocar o ícone FA

// Para textContent (não renderiza HTML), simplesmente remover o emoji + espaço
replace(".textContent = `❌ ${userMsg} (${error.message})`", ".textContent = `Erro: ${userMsg} (${error.message})`");
replace('.textContent = "❌ ', '.textContent = "');
replace(".textContent = '❌ ", ".textContent = '");
replace('otpError.textContent = `❌ ${userMsg}', 'otpError.textContent = `Erro: ${userMsg}');

// Para innerHTML, usar ícone FA
replace('innerHTML = "✅ <strong>', 'innerHTML = "<i class=\'fa-solid fa-circle-check\' style=\'color:var(--success);margin-right:6px;\'></i><strong>');

// Aviso ⚠️ em innerHTML - substituir pela tag span + icon
replace("msg = \"⚠️ Limite", 'msg = "Limite');
replace("msg = \"⚠️ Você", 'msg = "Você');
replace("msg = \"⚠️ Erro", 'msg = "Erro');
replace("msg = \"⚠️ Alguém", 'msg = "Alguém');
replace("msg = '⚠️ ", "msg = '");

// Remover ⚠️ restantes de strings que usam textContent
replace('⚠️ ', '');
replace('⚠️', '');

// Substituir ❌ em contexto de innerHTML (resendBtn.textContent era ❌ - fica sem ícone)
replace('"❌ Erro ao reenviar. Tente novamente."', '"Erro ao reenviar. Tente novamente."');
replace('"❌ " + msg', '"" + msg');

// Verificar e Entrar (com ✅ que deveria ser ícone FA)
// "✅ Verificar e Entrar" em verifyOtpBtn.textContent
replace('verifyOtpBtn.textContent = "✅ Verificar e Entrar"', 'verifyOtpBtn.textContent = "Verificar e Entrar"');
replace("verifyOtpBtn.textContent = '✅ Verificar e Entrar'", "verifyOtpBtn.textContent = 'Verificar e Entrar'");

// Resend btn - texto com emojis
replace('"✅ Código reenviado! Aguarde ${seconds}s"', '"Código reenviado! Aguarde ${seconds}s"');
replace('`✅ Código reenviado! Aguarde ${seconds}s`', '`Código reenviado! Aguarde ${seconds}s`');
replace('`<i class="fa-solid fa-hourglass-half"></i> Aguarde ${seconds}s para reenviar`', '`Aguarde ${seconds}s para reenviar`');

// ✅ em innerHTML - span de sucesso no forgotPassword
replace(
  'successDiv.innerHTML = "✅ <strong>',
  'successDiv.innerHTML = "<i class=\'fa-solid fa-circle-check\' style=\'color:var(--success);margin-right:6px;\'></i><strong>'
);

// Tratar o caso especial do successDiv no forgotPassword que tem ✅ e ⚠️
// (linha 353 do arquivo original)
replace(
  '\"âœ… <strong>E-mail de redefinição enviado!</strong>',
  '"<i class=\'fa-solid fa-circle-check\' style=\'color:var(--success);margin-right:6px;\'></i><strong>E-mail de redefinição enviado!</strong>'
);

// Remover ✅ restantes de textContent (não renderiza HTML)
replace('.textContent = "✅ ', '.textContent = "');
replace(".textContent = '✅ ", ".textContent = '");

// Remover restantes de ✅ solitários em strings de texto simples
replace('✅ ', '');
replace('✅', '');
replace('❌ ', '');
replace('❌', '');

// =============================================
// 4. CORRIGIR TEXTO DO BOTÃO resendBtn QUE FICOU BAGUNÇADO
// =============================================
replace('"<i class=\\"fa-solid fa-envelope\\"></i> Reenviar Código"', '"Reenviar Código"');
replace('"<i class=\\"fa-solid fa-paper-plane\\"></i> Enviando.."', '"Enviando.."');

// =============================================
// 5. SALVAR
// =============================================
fs.writeFileSync(srcPath, content, 'utf8');
console.log('\n=============================================');
console.log('Total de correções: ' + fixCount);
console.log('Arquivo salvo: js-src/auth.js');
console.log('=============================================');
