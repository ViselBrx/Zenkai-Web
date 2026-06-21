const fs = require('fs');

let content = fs.readFileSync('js-src/auth.js', 'utf8');

// Replace getNotifIcon
const replacementIconFn = `function getNotifIcon(type) {
  const icons = {
    'system': '<i class="fa-solid fa-gear"></i>',
    'social': '<i class="fa-solid fa-user-group"></i>',
    'loja': '<i class="fa-solid fa-store"></i>',
    'xp': '<i class="fa-solid fa-star"></i>',
    'medalha': '<i class="fa-solid fa-medal"></i>',
    'chat': '<i class="fa-solid fa-comment-dots"></i>'
  };
  return icons[type] || '<i class="fa-solid fa-bell"></i>';
}`;

content = content.replace(/function getNotifIcon\(type\) \{[\s\S]*?return icons\[type\] \|\| '\?\?';\s*\}/, replacementIconFn);

// Replace trash icon
content = content.replace(/>\s*Y-'\?\s*<\/button>/g, '><i class="fa-solid fa-trash"></i></button>');
content = content.replace(/>\s*ðŸ—‘ï¸ \s*<\/button>/g, '><i class="fa-solid fa-trash"></i></button>');
content = content.replace(/>\s*🗑️\s*<\/button>/g, '><i class="fa-solid fa-trash"></i></button>');

// Fix "Selecione pelo menos uma notificao para realizar esta a?"
content = content.replace(/alert\("Selecione pelo menos uma notificao para realizar esta a\?"\);/g, 'alert("Selecione pelo menos uma notificação para realizar esta ação.");');

fs.writeFileSync('js-src/auth.js', content, 'utf8');
console.log('Fixed auth.js icons and encoding.');
