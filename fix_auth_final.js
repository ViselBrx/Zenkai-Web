const fs = require('fs');

// 1. Copy auth_backup.js to auth.js
let content = fs.readFileSync('js-src/auth_backup.js', 'utf8');

// 2. Fix the "protected" reserved keyword
content = content.replace(/const protected = \[/g, 'const protectedRoutes = [');
content = content.replace(/if \(protected\.includes\(currentPage\)/g, 'if (protectedRoutes.includes(currentPage))');

// 3. Fix getNotifIcon
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

// 4. Fix Trash icon which was corrupted to "Y-'?" or "ðŸ—‘ï¸ "
content = content.replace(/<button class="notification-item__delete" title="Excluir" onclick="event\.stopPropagation\(\); deleteNotifications\(\['\$\{n\.id\}'\]\)">[\s\S]*?<\/button>/g, '<button class="notification-item__delete" title="Excluir" onclick="event.stopPropagation(); deleteNotifications([\\\'${n.id}\\\'])"><i class="fa-solid fa-trash"></i></button>');
content = content.replace(/<button class="notification-item__delete" title="Excluir" onclick="event\.stopPropagation\(\); deleteNotifications\(\['\$\{notification\.id\}'\]\)">[\s\S]*?<\/button>/g, '<button class="notification-item__delete" title="Excluir" onclick="event.stopPropagation(); deleteNotifications([\\\'${notification.id}\\\'])"><i class="fa-solid fa-trash"></i></button>');

// 5. Fix Alert text
content = content.replace(/alert\("Selecione pelo menos uma notifica.*a\?"\);/g, 'alert("Selecione pelo menos uma notificação para realizar esta ação.");');

// 6. Fix the '✕' close button
content = content.replace(/<button class="notification-center__close" id="closeNotifCenter">.*?<\/button>/g, '<button class="notification-center__close" id="closeNotifCenter"><i class="fa-solid fa-xmark"></i></button>');

fs.writeFileSync('js-src/auth.js', content, 'utf8');
console.log('Fixed auth.js from backup');
