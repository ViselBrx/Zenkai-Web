const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const dataFile = path.join(ROOT_DIR, 'data', 'data.json');
if (fs.existsSync(dataFile)) {
    let content = fs.readFileSync(dataFile, 'utf8');
    
    const newContent = content.replace(/redecanais\.[a-z]{2,10}/gi, 'redecanais.cafe');

    if (content !== newContent) {
        fs.writeFileSync(dataFile, newContent);
        console.log('✅ data.json fixed!');
    } else {
        console.log('ℹ️ data.json already clean.');
    }
} else {
    console.log('❌ data.json not found.');
}
