const fs = require('fs');

const path = 'data.json';
if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    
    const newContent = content.replace(/redecanais\.ooo/g, 'redecanais.in')
                              .replace(/redecanais\.cafe/g, 'redecanais.in')
                              .replace(/redecanais\.la/g, 'redecanais.in')
                              .replace(/redecanais\.dev/g, 'redecanais.in')
                              .replace(/%72%65%64%65%63%61%6E%61%69%73%2E%6F%6F%6F/g, '%72%65%64%65%63%61%6E%61%69%73%2E%69%6E')
                              .replace(/%72%65%64%65%63%61%6E%61%69%73%2E%63%61%66%65/g, '%72%65%64%65%63%61%6E%61%69%73%2E%69%6E')
                              .replace(/%72%65%64%65%63%61%6E%61%69%73%2E%6C%61/g, '%72%65%64%65%63%61%6E%61%69%73%2E%69%6E');

    if (content !== newContent) {
        fs.writeFileSync(path, newContent);
        console.log('✅ data.json fixed!');
    } else {
        console.log('ℹ️ data.json already clean.');
    }
} else {
    console.log('❌ data.json not found.');
}
