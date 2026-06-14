const fs = require('fs');

let fileStr = fs.readFileSync('js/auth.js', 'utf8');

const replacements = {
  'cÃ³digo': 'código',
  'cdigo': 'código',
  'seguranÃ§a': 'segurança',
  'segurana': 'segurança',
  'dÃ­gitos': 'dígitos',
  'dgitos': 'dígitos',
  'AtenÃ§Ã£o': 'Atenção',
  'Atenǜo': 'Atenção',
  'nÃ£o': 'não',
  'nǜo': 'não',
  'EletrÃ´nico': 'Eletrônico',
  'Eletrnico': 'Eletrônico',
  'Quase lǭ': 'Quase lá',
  'Quase lÃ¡': 'Quase lá',
  's?': '⚠️',
  '?O': '❌',
  'Y"': '🔄',
  'o.': '✅',
  'jǭ': 'já',
  'estǭ': 'está',
  'alguǸm': 'alguém',
  'PrǸ-preencher': 'Pré-preencher',
  'seǜo': 'seção',
  'aǜo': 'ação',
  'verificaǜo': 'verificação',
  'verificao': 'verificação',
  'atualizao': 'atualização',
  'vocǦ': 'você',
  'hǭ': 'há',
  'ttulo': 'título',
  'cr?tico': 'crítico',
  'notificaes': 'notificações',
  'usuǭrio': 'usuário',
  'usurio': 'usuário'
};

for (const [bad, good] of Object.entries(replacements)) {
  fileStr = fileStr.split(bad).join(good);
}

fs.writeFileSync('js/auth.js', fileStr, 'utf8');
console.log("Fixed encodings in js/auth.js");
