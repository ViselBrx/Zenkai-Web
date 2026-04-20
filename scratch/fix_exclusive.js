const fs = require('fs');
const path = 'c:/Users/enzot/Desktop/Videos-redecanais/perfil.html';
let html = fs.readFileSync(path, 'utf8');

// ==== 1. Ajustar o Listener do auraSelector (Benefícios Honoríficos) ====
const OLD_AURA_LISTENER = /auraSel\?\.addEventListener\('change', \(e\) => \{[\s\S]*?\}\);/g;
const NEW_AURA_LISTENER = `      auraSel?.addEventListener('change', (e) => {
         const val = e.target.value;
         
         // 1. Aplicar a aura mística
         applyAura(val);
         
         // 2. Desequipar qualquer aura da loja do animehouse_store para manter a exclusividade
         let storeStr = localStorage.getItem('animehouse_store');
         if (storeStr) {
             try {
                 let storeObj = JSON.parse(storeStr);
                 if (storeObj.equipped && storeObj.equipped.aura && storeObj.equipped.aura !== val) {
                     storeObj.equipped.aura = 'none';
                     localStorage.setItem('animehouse_store', JSON.stringify(storeObj));
                     if (window.DB && window.DB.saveStoreData) window.DB.saveStoreData(storeObj).catch(()=>{});
                 }
             } catch(e){}
         }
         
         // 3. Atualizar a navbar visualmente
         if (typeof updateNavbarCosmetics === 'function') updateNavbarCosmetics();
         
         // 4. Re-renderizar o painel Meus Especiais para remover o "Equipado" da aura da loja que foi desequipada
         if (typeof renderMeusEspeciais === 'function') renderMeusEspeciais();
      });`;
html = html.replace(OLD_AURA_LISTENER, NEW_AURA_LISTENER);

// ==== 2. Ajustar o Listener da Cartola (Benefícios Honoríficos) ====
const OLD_CRWN_LISTENER = /crwnToggle\?\.addEventListener\('change', \(e\) => \{[\s\S]*?\}\);/g;
const NEW_CRWN_LISTENER = `      crwnToggle?.addEventListener('change', (e) => {
          const isChecked = e.target.checked;
          localStorage.setItem('animehouse_showCrown', isChecked ? 'true' : 'false');
          if (isChecked) {
            localStorage.setItem('animehouse_equippedCrownId', 'cartola_supreme');
            localStorage.setItem('animehouse_equippedCrownIcon', '🎩');
            if (sbCrown) {
                sbCrown.textContent = '🎩';
                sbCrown.style.display = 'block';
            }
            
            // Exclusividade: Se ativar a cartola supreme, DESEQUIPA qualquer item "Cabeça" da loja
            let storeStr = localStorage.getItem('animehouse_store');
            if (storeStr) {
                try {
                    let storeObj = JSON.parse(storeStr);
                    if (storeObj.equipped && storeObj.equipped.crown) {
                        storeObj.equipped.crown = false;
                        storeObj.equipped.crownId = '';
                        storeObj.equipped.crownIcon = '';
                        localStorage.setItem('animehouse_store', JSON.stringify(storeObj));
                        if (window.DB && window.DB.saveStoreData) window.DB.saveStoreData(storeObj).catch(()=>{});
                        if (typeof renderMeusEspeciais === 'function') renderMeusEspeciais();
                    }
                } catch(e){}
            }
          } else {
             if (localStorage.getItem('animehouse_equippedCrownId') === 'cartola_supreme') {
                localStorage.removeItem('animehouse_equippedCrownId');
                localStorage.removeItem('animehouse_equippedCrownIcon');
                if (sbCrown) sbCrown.style.display = 'none';
             }
          }
          if (typeof updateNavbarCosmetics === 'function') updateNavbarCosmetics();
      });`;
html = html.replace(OLD_CRWN_LISTENER, NEW_CRWN_LISTENER);

// ==== 3. Modificar o check para verificar o estado 'isEquipped' corretamente no renderMeusEspeciais ====
// Precisamos garantir que ele pegue corretamente o store também
const OLD_CHECK_EQUIP = /function checkEquipped\(item\) \{[\s\S]*?return false;\s*\n\s*\}/g;
const NEW_CHECK_EQUIP = `        function checkEquipped(item) {
          if (item.category === 'aura') return localStorage.getItem('animehouse_customAura') === item.id;
          if (item.category === 'titulo') return localStorage.getItem('animehouse_customTitle') === item.name.replace('Título: ', '');
          if (item.category === 'banner') return localStorage.getItem('animehouse_customBanner') === item.id;
          if (item.category === 'exclusivo' && item.id.includes('coroa')) {
            return localStorage.getItem('animehouse_showCrown') === 'true' && localStorage.getItem('animehouse_equippedCrownId') === item.id;
          }
          if ((item.category === 'exclusivo' || item.category === 'acessorio') && item.id.includes('caveira')) {
            return localStorage.getItem('animehouse_showCrown') === 'true' && localStorage.getItem('animehouse_equippedCrownId') === item.id;
          }
          if (item.category === 'tema') return localStorage.getItem('animehouse_tema_cromatico') === 'true';
          return false;
        }`;
html = html.replace(OLD_CHECK_EQUIP, NEW_CHECK_EQUIP);

// ==== 4. Função toggleEquipItem (Loja) ajuste de exclusividade ====
html = html.replace(
  `        if (type === 'coroa' || id === 'caveira_mestre' || id.includes('coroa')) {`,
  `        if (type === 'coroa' || type === 'exclusivo' || type === 'acessorio' || id === 'caveira_mestre' || id.includes('coroa') || id.includes('caveira')) {`
);

// Garantir que toggleEquipItem atualize a Navbar *depois* do check/apply
html = html.replace(
  `} else if (type === 'exclusivo' && id.includes('coroa')) {`,
  `} else if ((type === 'exclusivo' || type === 'acessorio' || type === 'coroa') && (id.includes('coroa') || id.includes('caveira'))) {`
);

fs.writeFileSync(path, html, 'utf8');
console.log('✅ Scripts of exclusivity patched.');
