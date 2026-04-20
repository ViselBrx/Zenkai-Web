const fs = require('fs');
const path = 'c:/Users/enzot/Desktop/Videos-redecanais/perfil.html';
let html = fs.readFileSync(path, 'utf8');

// ==== Limpar aura se não tem level ====
const OLD_BLOCK = /const savedAuraCheck = localStorage\.getItem\('animehouse_customAura'\) \|\| 'none';\s*if \(\!isVipUser\) \{[\s\S]*?if \(auraSel2\) auraSel2\.value = 'none';\s*\}\s*\}/g;

const NEW_BLOCK = `const savedAuraCheck = localStorage.getItem('animehouse_customAura') || 'none';
        if (!isVipUser) {
            if ((savedAuraCheck === 'avatar-aura-bronze' && level < 1) ||
                (savedAuraCheck === 'avatar-aura-prata' && level < 5) ||
                (savedAuraCheck === 'avatar-aura-ouro' && level < 10) ||
                (savedAuraCheck === 'avatar-aura-mestre' && level < 20) ||
                (savedAuraCheck === 'avatar-aura-lenda' && level < 30) ||
                (savedAuraCheck === 'avatar-aura-fire' && level < 50) ||
                (savedAuraCheck === 'avatar-aura-guardian' && level < 75) ||
                (savedAuraCheck === 'avatar-aura-immortal' && level < 100)) {
                
                if (typeof applyAura === 'function') {
                    applyAura('none');
                } else {
                    localStorage.setItem('animehouse_customAura', 'none');
                    document.getElementById('auraSelector').value = 'none';
                }
            }
        }`;

html = html.replace(OLD_BLOCK, NEW_BLOCK);
fs.writeFileSync(path, html, 'utf8');
console.log('✅ Fallback fix applied');
