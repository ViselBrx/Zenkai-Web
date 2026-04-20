const fs = require('fs');
const path = 'c:/Users/enzot/Desktop/Videos-redecanais/perfil.html';
let html = fs.readFileSync(path, 'utf8');

// ============================
// LISTA GLOBAL DE TODAS AS AURAS (usada em múltiplos lugares)
// ============================
const ALL_AURA_CLASSES_DECL = `
      // ===== LISTA CENTRAL DE TODAS AS CLASSES DE AURA =====
      const ALL_AURA_CLASSES = [
        // Patentes
        'avatar-aura-bronze','avatar-aura-prata','avatar-aura-ouro','avatar-aura-mestre','avatar-aura-lenda',
        // VIP
        'avatar-aura-fire','avatar-aura-guardian','avatar-aura-immortal',
        // Loja
        'aura_chama','aura_chama_naruto','aura_ceifador','aura_thunder','aura_sakura',
        'aura_gelo','aura_susanoo','aura_stands','aura_dragon','aura_void_saitama',
        // aliases antigos
        'avatar-aura-stands','aura-common-chama','aura-common-naruto','aura-rare-ceifador',
        'aura-rare-thunder','aura-rare-susanoo','aura-rare-sakura','aura-epic-gelo',
        'aura-epic-stands','aura-epic-void','aura-legendary-dragon'
      ];

      // ===== FUNÇÃO CENTRAL: aplicar aura em todos os alvos =====
      function applyAura(auraId) {
        const targets = [
          document.getElementById('displayAvatarBox'),
          document.querySelector('.user-nav-avatar-box')
        ].filter(Boolean);

        targets.forEach(el => {
          ALL_AURA_CLASSES.forEach(c => el.classList.remove(c));
          if (auraId && auraId !== 'none') {
            el.classList.add(auraId);
            if (auraId === 'aura_stands') el.classList.add('avatar-aura-stands');
          }
        });

        // Salvar no localStorage
        localStorage.setItem('animehouse_customAura', auraId || 'none');

        // Resetar o auraSelector para 'none' se a aura é da loja (exclusividade)
        const auraSel = document.getElementById('auraSelector');
        if (auraSel) {
          const isPatentAura = auraSel.querySelector('option[value="' + auraId + '"]');
          if (!isPatentAura || auraId === 'none') {
            // aura de loja: resetar dropdown de patentes
            if (auraId !== 'none' && !auraId.startsWith('avatar-aura-')) {
              auraSel.value = 'none';
            } else {
              auraSel.value = auraId || 'none';
            }
          }
        }
      }
`;

// Injetar a declaração logo APÓS "// Setup VIP Perks logic"
html = html.replace(
  '// Setup VIP Perks logic',
  '// Setup VIP Perks logic\n' + ALL_AURA_CLASSES_DECL
);

// ============================
// Reescrever o listener do auraSelector
// ============================
const OLD_AURA_LISTENER = /auraSel\?\.addEventListener\('change', \(e\) => \{[\s\S]*?\}\);\s*\r?\n/;
const NEW_AURA_LISTENER = `      auraSel?.addEventListener('change', (e) => {
         const val = e.target.value;
         applyAura(val);
         if (typeof renderMeusEspeciais === 'function') renderMeusEspeciais();
      });
`;
html = html.replace(OLD_AURA_LISTENER, NEW_AURA_LISTENER);

// ============================
// Reescrever o bloco de aplicação de aura no toggleEquipItem (loja)
// ============================
const OLD_EQUIP_AURA_BLOCK = /\/\/ Atualizar aura no avatar com transição suave\s*\r?\n\s*const auraTarget = document\.getElementById\('displayAvatarBox'\);\r?\n\s*if \(auraTarget && type === 'aura'\) \{[\s\S]*?\}\s*\r?\n/;
const NEW_EQUIP_AURA_BLOCK = `        // Atualizar aura no avatar (usando função central)
        if (type === 'aura') {
          const savedAura = localStorage.getItem('animehouse_customAura') || 'none';
          if (typeof applyAura === 'function') applyAura(savedAura);
        }
`;
html = html.replace(OLD_EQUIP_AURA_BLOCK, NEW_EQUIP_AURA_BLOCK);

// ============================
// Reescrever o bloco de inicialização de aura (no carregamento)
// ============================
const OLD_INIT_AURA = /const auraTarget = document\.getElementById\('displayAvatarBox'\) \|\| displayAvatar;\s*\n\s*if \(auraTarget\) \{[\s\S]*?if \(savedAura !== 'none'\) \{\s*\n\s*auraTarget\.classList\.add\(savedAura\);\s*\n\s*\}\s*\n\s*\}\s*\n/;
const NEW_INIT_AURA = `      // Aplicar aura salva (usando função central)
      if (savedAura !== 'none') {
        // Aplicar após DOM estar pronto
        requestAnimationFrame(() => {
          if (typeof applyAura === 'function') applyAura(savedAura);
          else {
            const el = document.getElementById('displayAvatarBox');
            if (el) el.classList.add(savedAura);
            const nav = document.querySelector('.user-nav-avatar-box');
            if (nav) nav.classList.add(savedAura);
          }
        });
      }
`;
html = html.replace(OLD_INIT_AURA, NEW_INIT_AURA);

fs.writeFileSync(path, html, 'utf8');
console.log('✅ Central aura system applied');
