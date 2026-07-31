const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js-src', 'db.js');
let code = fs.readFileSync(filePath, 'utf8');

const regex = /\.filter\(\s*(\w+)\s*=>\s*\1\.id\s*!==\s*(\w+)\)/g;

code = code.replace(regex, (match, p1, p2) => {
    return `.filter(${p1} => String(${p1}.id) !== String(${p2}))`;
});

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed db.js filters!');
