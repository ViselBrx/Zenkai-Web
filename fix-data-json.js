const fs = require('fs');

const path = 'data.json';
if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    
    const newContent = content.replace(/redecanais\.[a-z]{2,10}/gi, 'redecanais.cafe');

    if (content !== newContent) {
        fs.writeFileSync(path, newContent);
        console.log('✅ data.json fixed!');
    } else {
        console.log('ℹ️ data.json already clean.');
    }
} else {
    console.log('❌ data.json not found.');
}
