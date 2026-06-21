const fs = require('fs');

let content = fs.readFileSync('js-src/auth.js', 'utf8');

const startIdx = content.indexOf('// ==========================================\n// 7. HUB DE NOTIFICA');
const endIdx = content.indexOf('// Notification hub overrides');

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + content.substring(endIdx);
    fs.writeFileSync('js-src/auth.js', content, 'utf8');
    console.log('Removed duplicate functions in auth.js');
} else {
    console.log('Could not find start or end index.');
}
