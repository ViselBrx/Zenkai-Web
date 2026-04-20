const fs = require('fs');
const path = 'c:/Users/enzot/Desktop/Videos-redecanais/perfil.html';
let content = fs.readFileSync(path, 'utf8');

const targetRegex = /auraSel\?\.addEventListener\('change', \(e\) => \{([\s\S]*?)\}\);/;
const replacement = `auraSel?.addEventListener('change', (e) => {
         const val = e.target.value;
         localStorage.setItem('animehouse_customAura', val);
         const auraTarget = document.getElementById('displayAvatarBox') || displayAvatar;
         if (auraTarget) {
            auraTarget.classList.remove(
               'avatar-aura-fire','avatar-aura-guardian','avatar-aura-immortal',
               'avatar-aura-bronze','avatar-aura-prata','avatar-aura-ouro','avatar-aura-mestre','avatar-aura-lenda'
            );
            // Também remove auras da loja (opcional, mas bom pra garantir conflito zero)
            const allAuraClasses = ["aura_chama","aura_chama_naruto","aura_ceifador","aura_thunder","aura_sakura","aura_gelo","aura_susanoo","aura_stands","aura_dragon","aura_void_saitama"];
            allAuraClasses.forEach(c => auraTarget.classList.remove(c));

            if (val !== 'none') {
               auraTarget.classList.add(val);
            }
         }
         if (typeof renderMeusEspeciais === 'function') renderMeusEspeciais();
      });`;

content = content.replace(targetRegex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('✅ Aura listener updated');
