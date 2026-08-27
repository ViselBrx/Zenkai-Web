const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const srcDir = path.join(__dirname, 'js-src');
const outDir = path.join(__dirname, 'js-ofuscado');

// Create the output directory if it doesn't exist
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

// Obfuscation configuration options
const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false, // Don't use debugProtection to avoid infinite debugger loops freezing browsers for users who happen to open devtools
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false, // Do not rename globals, Zenkai uses window.var globally
    rotateStringArray: true,
    selfDefending: true,
    shuffleStringArray: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayEncoding: [],
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: true
};

const files = fs.readdirSync(srcDir);

files.forEach(file => {
    if (path.extname(file) === '.js') {
        const srcPath = path.join(srcDir, file);
        const outPath = path.join(outDir, file);
        
        try {
            const fileContent = fs.readFileSync(srcPath, 'utf8');
            console.log(`Ofuscando: ${file}...`);
            
            const obfuscationResult = JavaScriptObfuscator.obfuscate(fileContent, obfuscationOptions);
            
            fs.writeFileSync(outPath, obfuscationResult.getObfuscatedCode(), 'utf8');
            console.log(`âœ… Sucesso: ${file}`);
        } catch (error) {
            console.error(`âŒ Erro ao ofuscar ${file}:`, error);
        }
    }
});

console.log('ðŸŽ‰ Todos os arquivos foram ofuscados com sucesso!');
