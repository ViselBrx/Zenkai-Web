const fs = require('fs');

let content = fs.readFileSync('perfil.html', 'utf8');

// The replacement logic: we want to format numbers over 999K nicely, or just abbreviate to ...
const helper = `function formatLevelForModal(lvl) {
              if (lvl >= 1000000) return (lvl / 1000000).toFixed(1) + "M";
              if (lvl >= 1000) return (lvl / 1000).toFixed(1) + "K";
              return lvl;
            }`;

content = content.replace('function showLevelUpToast(newLevel, newRank) {', 'function showLevelUpToast(newLevel, newRank) {\n            ' + helper);

// Replace innerHTML template
content = content.replace(
  '<div class="lvl-badge" id="toastLevelNum">LVL ${newLevel}</div>',
  '<div class="lvl-badge" id="toastLevelNum">LVL ${formatLevelForModal(newLevel)}</div>'
);

// Replace textContent update
content = content.replace(
  '`LVL ${newLevel}`',
  '`LVL ${formatLevelForModal(newLevel)}`'
);

fs.writeFileSync('perfil.html', content, 'utf8');
console.log('Fixed modal level rendering in perfil.html');
