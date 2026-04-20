const fs = require('fs');

let c = fs.readFileSync('c:/Users/enzot/Desktop/Videos-redecanais/css/style.css', 'utf8');

c = c.replace(/\/\* \=\=\=\=\=\= AURAS DE CONQUISTA GLOBAIS \=\=\=\=\=\=\= \*\//, `/* ====== AURAS DE CONQUISTA GLOBAIS ======= */

/* === HOKAGE (Aura de Fogo Nível 50) === */
.avatar-aura-wrap.avatar-aura-fire::before,
.user-nav-avatar-box.avatar-aura-fire::before {
    background: radial-gradient(circle, transparent 40%, rgba(255, 69, 0, 0.7) 65%, rgba(255, 140, 0, 0.4) 90%, transparent 100%);
    animation: aura-fire-pulse 1s ease-in-out infinite alternate;
    opacity: 1;
    inset: -5px;
}
.avatar-aura-wrap.avatar-aura-fire::after,
.user-nav-avatar-box.avatar-aura-fire::after {
    background: conic-gradient(
        from 0deg,
        rgba(255, 69, 0, 0.9) 0deg 10deg, transparent 10deg 30deg,
        rgba(255, 140, 0, 0.8) 30deg 40deg, transparent 40deg 60deg,
        rgba(255, 0, 0, 0.9) 60deg 70deg, transparent 70deg 90deg,
        rgba(255, 69, 0, 0.9) 90deg 100deg, transparent 100deg 120deg,
        rgba(255, 140, 0, 0.8) 120deg 130deg, transparent 130deg 150deg,
        rgba(255, 0, 0, 0.9) 150deg 160deg, transparent 160deg 180deg,
        rgba(255, 69, 0, 0.9) 180deg 190deg, transparent 190deg 210deg,
        rgba(255, 140, 0, 0.8) 210deg 220deg, transparent 220deg 240deg,
        rgba(255, 0, 0, 0.9) 240deg 250deg, transparent 250deg 270deg,
        rgba(255, 69, 0, 0.9) 270deg 280deg, transparent 280deg 300deg,
        rgba(255, 140, 0, 0.8) 300deg 310deg, transparent 310deg 330deg,
        rgba(255, 0, 0, 0.9) 330deg 340deg, transparent 340deg 360deg
    );
    animation: aura-fire-spin 3s linear infinite;
    opacity: 0.8;
    inset: -15px;
    filter: blur(2px);
}
@keyframes aura-fire-pulse {
    from { filter: brightness(1) saturate(1.2); transform: scale(0.98); }
    to { filter: brightness(1.5) saturate(1.8); transform: scale(1.05); }
}
@keyframes aura-fire-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* === GUARDIÃO (Aura Nível 75) === */
.avatar-aura-wrap.avatar-aura-guardian::before,
.user-nav-avatar-box.avatar-aura-guardian::before {
    background: radial-gradient(circle, transparent 40%, rgba(0, 191, 255, 0.7) 65%, rgba(0, 0, 255, 0.4) 90%, transparent 100%);
    animation: aura-guardian-pulse 1.2s ease-in-out infinite alternate;
    opacity: 1;
    inset: -5px;
}
.avatar-aura-wrap.avatar-aura-guardian::after,
.user-nav-avatar-box.avatar-aura-guardian::after {
    background: conic-gradient(
        from 0deg,
        rgba(0, 191, 255, 0.9) 0deg 20deg, transparent 20deg 40deg,
        rgba(0, 255, 255, 0.8) 40deg 60deg, transparent 60deg 80deg,
        rgba(0, 191, 255, 0.9) 80deg 100deg, transparent 100deg 120deg,
        rgba(0, 255, 255, 0.8) 120deg 140deg, transparent 140deg 160deg,
        rgba(0, 191, 255, 0.9) 160deg 180deg, transparent 180deg 200deg,
        rgba(0, 255, 255, 0.8) 200deg 220deg, transparent 220deg 240deg,
        rgba(0, 191, 255, 0.9) 240deg 260deg, transparent 260deg 280deg,
        rgba(0, 255, 255, 0.8) 280deg 300deg, transparent 300deg 320deg,
        rgba(0, 191, 255, 0.9) 320deg 340deg, transparent 340deg 360deg
    );
    animation: aura-guardian-spin 4s linear infinite forwards;
    opacity: 0.85;
    inset: -12px;
    filter: blur(1px);
}
@keyframes aura-guardian-pulse {
    from { filter: brightness(1); transform: scale(1); }
    to { filter: brightness(1.6) blur(1px); transform: scale(1.08); }
}
@keyframes aura-guardian-spin {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
}

/* === IMORTAL (Nível 100) === */
.avatar-aura-wrap.avatar-aura-immortal::before,
.user-nav-avatar-box.avatar-aura-immortal::before {
    background: radial-gradient(circle, transparent 35%, rgba(138, 43, 226, 0.8) 60%, rgba(218, 112, 214, 0.5) 85%, transparent 100%);
    animation: aura-immortal-pulse 0.9s ease-in-out infinite alternate;
    opacity: 1;
    inset: -6px;
}
.avatar-aura-wrap.avatar-aura-immortal::after,
.user-nav-avatar-box.avatar-aura-immortal::after {
    background: conic-gradient(
        from 0deg,
        rgba(138, 43, 226, 0.9) 0deg 5deg, transparent 5deg 15deg,
        rgba(218, 112, 214, 0.7) 15deg 20deg, transparent 20deg 30deg,
        rgba(75, 0, 130, 0.9) 30deg 35deg, transparent 35deg 45deg,
        rgba(138, 43, 226, 0.9) 45deg 50deg, transparent 50deg 60deg,
        rgba(218, 112, 214, 0.7) 60deg 65deg, transparent 65deg 75deg,
        rgba(75, 0, 130, 0.9) 75deg 80deg, transparent 80deg 90deg,
        rgba(138, 43, 226, 0.9) 90deg 95deg, transparent 95deg 105deg,
        rgba(218, 112, 214, 0.7) 105deg 110deg, transparent 110deg 120deg,
        rgba(75, 0, 130, 0.9) 120deg 125deg, transparent 125deg 135deg,
        rgba(138, 43, 226, 0.9) 135deg 140deg, transparent 140deg 150deg,
        rgba(218, 112, 214, 0.7) 150deg 155deg, transparent 155deg 165deg,
        rgba(75, 0, 130, 0.9) 165deg 170deg, transparent 170deg 180deg,
        rgba(138, 43, 226, 0.9) 180deg 185deg, transparent 185deg 195deg,
        rgba(218, 112, 214, 0.7) 195deg 200deg, transparent 200deg 210deg,
        rgba(75, 0, 130, 0.9) 210deg 215deg, transparent 215deg 225deg,
        rgba(138, 43, 226, 0.9) 225deg 230deg, transparent 230deg 240deg,
        rgba(218, 112, 214, 0.7) 240deg 245deg, transparent 245deg 255deg,
        rgba(75, 0, 130, 0.9) 255deg 260deg, transparent 260deg 270deg,
        rgba(138, 43, 226, 0.9) 270deg 275deg, transparent 275deg 285deg,
        rgba(218, 112, 214, 0.7) 285deg 290deg, transparent 290deg 300deg,
        rgba(75, 0, 130, 0.9) 300deg 305deg, transparent 305deg 315deg,
        rgba(138, 43, 226, 0.9) 315deg 320deg, transparent 320deg 330deg,
        rgba(218, 112, 214, 0.7) 330deg 335deg, transparent 335deg 345deg,
        rgba(75, 0, 130, 0.9) 345deg 350deg, transparent 350deg 360deg
    );
    animation: aura-immortal-spin 2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
    opacity: 0.9;
    inset: -20px;
    filter: blur(1.5px);
}
@keyframes aura-immortal-pulse {
    from { filter: brightness(1) hue-rotate(0deg); transform: scale(0.95); }
    to { filter: brightness(1.8) hue-rotate(20deg); transform: scale(1.1); }
}
@keyframes aura-immortal-spin {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.05); }
    100% { transform: rotate(360deg) scale(1); }
}

/* Remover os styles antigos bugados global */`);

c = c.replace(/\.avatar-aura-fire\s*\{[\s\S]*?box-shadow:[\s\S]*?\}\s*@keyframes pulse-fire\s*\{[\s\S]*?\}\s*\.avatar-aura-guardian\s*\{[\s\S]*?box-shadow:[\s\S]*?\}\s*@keyframes pulse-guardian\s*\{[\s\S]*?\}\s*\.avatar-aura-immortal\s*\{[\s\S]*?box-shadow:[\s\S]*?\}\s*@keyframes pulse-immortal\s*\{[\s\S]*?\}/g, '');

c = c.replace(/box-shadow:\s*0 -10px 15px -2px #00bfff,[^}]*}/g, '');

fs.writeFileSync('c:/Users/enzot/Desktop/Videos-redecanais/css/style.css', c, 'utf8');
console.log('✅ Auras aplicadas com sucesso!');
