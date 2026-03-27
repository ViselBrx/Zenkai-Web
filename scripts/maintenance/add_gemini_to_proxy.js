/**
 * add_gemini_to_proxy.js
 * Guia rapido para configurar Gemini no proxy do server.js
 *
 * Execute:
 *   node scripts/maintenance/add_gemini_to_proxy.js
 */

console.log('1) Configure as variaveis no .env:');
console.log('   GEMINI_API_KEY=AIza...');
console.log('   GEMINI_MODEL=gemini-2.5-flash');
console.log('');

console.log('2) O proxy deve usar esta ordem para a chave:');
console.log('   process.env.GEMINI_API_KEY -> apiKey enviada do frontend -> config.geminiKey');
console.log('');

console.log('3) O endpoint deve montar o modelo dinamicamente:');
console.log("   https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}");
console.log('');

console.log('4) Exemplo de payload no frontend:');
console.log(`fetch('/api/ai/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    target: 'gemini',
    body: {
      model: 'gemini-2.5-flash',
      messages: [{ role: 'user', content: 'Me recomende um anime curto.' }],
      stream: false
    }
  })
});`);
console.log('');
console.log('5) Se aparecer quota exceeded, o codigo esta correto mas a chave/projeto precisa de ajuste de quota/billing no Google AI Studio.');
