const fs = require('fs');
const path = 'c:/Users/enzot/Desktop/Videos-redecanais/perfil.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Add updateNavbarCosmetics to auraSel change
content = content.replace(
    /if \(typeof renderMeusEspeciais === 'function'\) renderMeusEspeciais\(\);(\s+)\}\);(\s+)\/\/ auraSel/, 
    "if (typeof renderMeusEspeciais === 'function') renderMeusEspeciais();\n         if (typeof updateNavbarCosmetics === 'function') updateNavbarCosmetics();\n      });\n      // auraSel"
);

// Actually, I'll use a more direct replacement for the listeners
const auraListenerRegex = /auraSel\?\.addEventListener\('change', \(e\) => \{([\s\S]*?)renderMeusEspeciais\(\);(\s+)\}\);/;
const auraListenerReplacement = `auraSel?.addEventListener('change', (e) => {
         $1renderMeusEspeciais();
         if (typeof updateNavbarCosmetics === 'function') updateNavbarCosmetics();
      });`;
content = content.replace(auraListenerRegex, auraListenerReplacement);

const crownListenerRegex = /crwnToggle\?\.addEventListener\('change', \(e\) => \{([\s\S]*?)renderMeusEspeciais\(\);(\s+)\}\);/;
const crownListenerReplacement = `crwnToggle?.addEventListener('change', (e) => {
         $1renderMeusEspeciais();
         if (typeof updateNavbarCosmetics === 'function') updateNavbarCosmetics();
      });`;
content = content.replace(crownListenerRegex, crownListenerReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('✅ Synchronized Navbar Cosmetics triggers');
