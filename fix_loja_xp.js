const fs = require('fs');

let content = fs.readFileSync('loja.html', 'utf8');

const replacement = `                function formatLargeNumber(num) {
                    let n = Number(num);
                    if (isNaN(n)) return num;
                    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
                    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
                    return n.toLocaleString("pt-BR");
                }

                if (xpEl) xpEl.textContent = formatLargeNumber(store.xp);
                if (rankEl) rankEl.innerHTML = \`<i class='fa-solid fa-khanda'></i> \${cachedRank}\`;
                if (levelEl) levelEl.textContent = \`LVL \${formatLargeNumber(cachedLevel)}\`;
                if (ouroEl) ouroEl.textContent = formatLargeNumber(store.ouro);
                if (diaEl) diaEl.textContent = formatLargeNumber(store.diamante);
                if (esEl) esEl.textContent = formatLargeNumber(store.esmeralda);`;

// We use regex to replace the existing assignments block in updateHeroUI
const regex = /if \(xpEl\)\s+xpEl\.textContent\s*=\s*store\.xp\.toLocaleString\("pt-BR"\);\s*if \(rankEl\)\s*rankEl\.innerHTML\s*=\s*`<i class='fa-solid fa-khanda'><\/i>[^`]+`;\s*if \(levelEl\)\s*levelEl\.textContent\s*=\s*`LVL \$\{cachedLevel\}`;\s*if \(ouroEl\)\s*ouroEl\.textContent\s*=\s*store\.ouro;\s*if \(diaEl\)\s*diaEl\.textContent\s*=\s*store\.diamante;\s*if \(esEl\)\s*esEl\.textContent\s*=\s*store\.esmeralda;/;

content = content.replace(regex, replacement);

fs.writeFileSync('loja.html', content, 'utf8');
console.log('Fixed XP rendering in loja.html');
