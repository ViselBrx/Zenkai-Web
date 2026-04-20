const fs = require('fs');
const path = 'c:/Users/enzot/Desktop/Videos-redecanais/perfil.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix initialization logic for Auras and Top Items
const initTarget = /const auraTarget = document\.getElementById\('displayAvatarBox'\) \|\| displayAvatar;[\s\S]*?if \(auraTarget && savedAura !== 'none'\) \{[\s\S]*?auraTarget\.classList\.add\(savedAura\);[\s\S]*?\}/;
const initReplacement = `const auraTarget = document.getElementById('displayAvatarBox') || displayAvatar;
      if (auraTarget) {
          // Limpar auras residuais antes de aplicar a salva
          const auraClasses = [
             'avatar-aura-fire','avatar-aura-guardian','avatar-aura-immortal',
             'avatar-aura-bronze','avatar-aura-prata','avatar-aura-ouro','avatar-aura-mestre','avatar-aura-lenda'
          ];
          const storeAuraClasses = ["aura_chama","aura_chama_naruto","aura_ceifador","aura_thunder","aura_sakura","aura_gelo","aura_susanoo","aura_stands","aura_dragon","aura_void_saitama"];
          
          auraClasses.forEach(c => auraTarget.classList.remove(c));
          storeAuraClasses.forEach(c => auraTarget.classList.remove(c));
          
          if (savedAura !== 'none') {
             auraTarget.classList.add(savedAura);
          }
      }

      if (sbCrown) {
         sbCrown.style.display = savedCrown ? 'block' : 'none';
         sbCrown.textContent = localStorage.getItem('animehouse_equippedCrownIcon') || '🎩';
      }`;
content = content.replace(initTarget, initReplacement);

// 2. Fix the "Items not appearing" or "appearing without selection" in updateDashboard
const updateDashAuraClear = /auraTargetEl\?\.classList\.remove\('avatar-aura-fire','avatar-aura-guardian','avatar-aura-immortal','avatar-aura-bronze','avatar-aura-prata','avatar-aura-ouro','avatar-aura-mestre','avatar-aura-lenda'\);/;
const updateDashAuraClearReplacement = `auraTargetEl?.classList.remove('avatar-aura-fire','avatar-aura-guardian','avatar-aura-immortal','avatar-aura-bronze','avatar-aura-prata','avatar-aura-ouro','avatar-aura-mestre','avatar-aura-lenda');
                const storeAuraClassesUpdate = ["aura_chama","aura_chama_naruto","aura_ceifador","aura_thunder","aura_sakura","aura_gelo","aura_susanoo","aura_stands","aura_dragon","aura_void_saitama"];
                storeAuraClassesUpdate.forEach(c => auraTargetEl?.classList.remove(c));`;

content = content.replace(updateDashAuraClear, updateDashAuraClearReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('✅ Initialization and Cleanup Fixes applied');
