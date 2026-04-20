const fs = require('fs');
const path = 'c:/Users/enzot/Desktop/Videos-redecanais/perfil.html';
let content = fs.readFileSync(path, 'utf8');

const targetRegex = /crwnToggle\?\.addEventListener\('change', \(e\) => \{[\s\S]*?\}\);/;
const replacement = `crwnToggle?.addEventListener('change', (e) => {
          const isChecked = e.target.checked;
          localStorage.setItem('animehouse_showCrown', isChecked ? 'true' : 'false');
          if (isChecked) {
            localStorage.setItem('animehouse_equippedCrownId', 'cartola_supreme');
            localStorage.setItem('animehouse_equippedCrownIcon', '🎩');
            if (sbCrown) {
                sbCrown.textContent = '🎩';
                sbCrown.style.display = 'block';
            }
          } else {
             if (localStorage.getItem('animehouse_equippedCrownId') === 'cartola_supreme') {
                localStorage.removeItem('animehouse_equippedCrownId');
                localStorage.removeItem('animehouse_equippedCrownIcon');
                if (sbCrown) sbCrown.style.display = 'none';
             }
          }
          if (typeof renderMeusEspeciais === 'function') renderMeusEspeciais();
       });`;

content = content.replace(targetRegex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('✅ Replacement done');
