const fs = require('fs');
const path = 'c:/Users/enzot/Desktop/Videos-redecanais/perfil.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix missing optFire/Guardian/Immortal declarations in updateDashboard
const optDeclsTarget = "const optLenda = document.querySelector\\('option\\[value=\"avatar-aura-lenda\"\\]'\\);";
const optDeclsReplacement = `const optLenda = document.querySelector('option[value="avatar-aura-lenda"]');
        const optFire = document.querySelector('option[value="avatar-aura-fire"]');
        const optGuardian = document.querySelector('option[value="avatar-aura-guardian"]');
        const optImmortal = document.querySelector('option[value="avatar-aura-immortal"]');`;
content = content.replace(new RegExp(optDeclsTarget), optDeclsReplacement);

// 2. Fix variable equippedCrown in renderMeusEspeciais and add sync
const syncTarget = /const showCrown = localStorage\.getItem\('animehouse_showCrown'\) === 'true';/;
const syncReplacement = `const showCrown = localStorage.getItem('animehouse_showCrown') === 'true';
        const equippedCrown = showCrown && equippedCrownId; // Flag de existência`;
content = content.replace(syncTarget, syncReplacement);

// 3. Update toggleEquipItem for mutual exclusion (Aura, Cartola, Caveira, Coroa)
const toggleEquipTarget = /window\.toggleEquipItem = async function\(id, type, rawName\) \{/;
const toggleEquipReplacement = `window.toggleEquipItem = async function(id, type, rawName) {
        // Exclusão Mútua: Benefícios vs Loja
        if (type === 'aura') {
           const auraSelRef = document.getElementById('auraSelector');
           if (auraSelRef) auraSelRef.value = 'none';
        }
        if (type === 'coroa' || id === 'caveira_mestre' || id.includes('coroa')) {
           const crwnTogRef = document.getElementById('crownToggle');
           if (crwnTogRef) crwnTogRef.checked = false;
        }
`;
content = content.replace(toggleEquipTarget, toggleEquipReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('✅ JS Fixes applied');
