const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const pagesDir = path.join(ROOT_DIR, 'pages');
const htmlFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

const watermarkHTML = '<div class="watermark">© ViselBrx & DaviMoraes07™</div>';

htmlFiles.forEach(file => {
    const filePath = path.join(pagesDir, file);
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
