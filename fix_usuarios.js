const fs = require('fs');

let content = fs.readFileSync('js-src/usuarios.js', 'utf8');

// Fix 1: modal banner
content = content.replace(
    /if \(banner !== 'none'\) \{\s*bannerEl\.style\.backgroundImage = `url\('\$\{banner\}'\)`;/g,
    `if (banner !== 'none') {
      const bannerUrl = (window.BANNER_MAP && window.BANNER_MAP[banner]) ? window.BANNER_MAP[banner] : banner;
      bannerEl.style.backgroundImage = \`url('\${bannerUrl}')\`;`
);

// Fix 2: adding cursor to variables
content = content.replace(
    /const banner = equipped\.banner \|\| 'none';/g,
    `const banner = equipped.banner || 'none';
      const cursor = equipped.cursor || 'none';`
);

// Fix 3: pushing cursor to equippedIcons
content = content.replace(
    /if \(banner !== 'none'\) \{\s*const item = ALL_ITEMS\.find\(i => i\.id === banner\);\s*if \(item\) equippedIcons\.push\(\{ icon: item\.icon, name: item\.name \}\);\s*\}/g,
    `if (banner !== 'none') {
        const item = ALL_ITEMS.find(i => i.id === banner);
        if (item) equippedIcons.push({ icon: item.icon, name: item.name });
      }
      if (cursor !== 'none') {
        const item = ALL_ITEMS.find(i => i.id === cursor);
        if (item) equippedIcons.push({ icon: item.icon, name: item.name });
      }`
);

// Fix 4: user card banner
content = content.replace(
    /const bannerStyle = banner !== 'none'\s*\?\s*`background-image: url\('\$\{banner\}'\); background-size: cover;`/g,
    `const bannerUrl = (window.BANNER_MAP && window.BANNER_MAP[banner]) ? window.BANNER_MAP[banner] : banner;
      const bannerStyle = banner !== 'none'
        ? \`background-image: url('\${bannerUrl}'); background-size: cover;\``
);

fs.writeFileSync('js-src/usuarios.js', content, 'utf8');
console.log('Fixed usuarios.js');
