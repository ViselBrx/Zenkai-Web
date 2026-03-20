const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const watermarkHTML = '<div class="watermark">© ViselBrx & DaviMoraes07™</div>';

htmlFiles.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove old watermarks using regex matching `<div class="watermark">...</div>`
    content = content.replace(/<div class="watermark">.*?<\/div>/gi, '');

    // Add watermark before </body> if it exists
    if (content.includes('</body>')) {
        content = content.replace('</body>', `${watermarkHTML}\n</body>`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated ${file}`);
    } else {
        console.log(`⚠️ Skpped ${file} (no </body> tag)`);
    }
});
