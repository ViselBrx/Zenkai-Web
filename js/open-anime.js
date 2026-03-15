document.addEventListener('DOMContentLoaded', () => {
  // Tabs Verticais
  const tabs = document.querySelectorAll('.ai-tab-v');
  const panels = document.querySelectorAll('.tool-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Enter to send
  const chatInput = document.getElementById('chatInput');
  const char1Inp = document.getElementById('char1');
  const char2Inp = document.getElementById('char2');

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('sendChat').click();
  });

  char1Inp.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') char2Inp.focus();
  });

  char2Inp.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('compareBtn').click();
  });

  // Config & API Keys
  const groqInp = document.getElementById('groqKey');
  const saveBtn = document.getElementById('saveApiKeys');

  function loadConfigs() {
    const config = DB.getAIConfig();
    if (config.groqKey) groqInp.value = config.groqKey;
  }
  loadConfigs();

  saveBtn.addEventListener('click', () => {
    DB.saveAIConfig({
      groqKey: groqInp.value.trim(),
      provider: 'groq'
    });
    showToast('Chave Groq salva com sucesso!');
  });

  // Chat UI Elements
  const chatWindow = document.getElementById('chatWindow');
  const sendBtn = document.getElementById('sendChat');

  // Proxy Calls
  async function callAI(prompt) {
    const config = DB.getAIConfig();
    const target = 'groq'; 
    const model = "llama-3.3-70b-versatile";

    try {
      const res = await fetch('/api/ai/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          body: {
            model: model,
            messages: [{ role: "user", content: prompt }],
            stream: false
          }
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.choices[0].message.content;
    } catch (e) {
      console.error(e);
      return `⚠️ Falha: ${e.message}. Verifique o terminal do servidor para mais detalhes.`;
    }
  }

  function formatAIRonse(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function appendMsg(text, type) {
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerHTML = formatAIRonse(text);
    chatWindow.appendChild(div);
    
    // Forçar scroll para baixo com atraso para renderização
    setTimeout(() => {
      chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  sendBtn.addEventListener('click', async () => {
    const val = chatInput.value.trim();
    if (!val) return;
    
    appendMsg(val, 'user');
    chatInput.value = '';
    
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'msg bot loading-msg';
    loadingMsg.innerHTML = '<span class="pulse">🧠 Pensando...</span>';
    chatWindow.appendChild(loadingMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    
    const response = await callAI(val);
    loadingMsg.remove();
    appendMsg(response, 'bot');
  });

  // Compare Characters
  const compareBtn = document.getElementById('compareBtn');
  const compareResult = document.getElementById('compareResult');

  compareBtn.addEventListener('click', async () => {
    const c1 = char1Inp.value.trim();
    const c2 = char2Inp.value.trim();
    if (!c1 || !c2) return showToast('Digite dois nomes para comparar', 'error');

    compareResult.style.display = 'block';
    compareResult.innerHTML = '⚖️ Analisando poderes, história e habilidades...';
    
    const prompt = `Faça uma comparação detalhada entre os personagens de anime/desenho ${c1} e ${c2}. Analise Força, Inteligência, Habilidades Especiais e diga quem venceria em um duelo épico e por quê.`;
    const analysis = await callAI(prompt);
    compareResult.innerHTML = `<strong>Análise de Combate:</strong><br><br>${formatAIRonse(analysis)}`;
    
    // Scroll suave para o resultado
    setTimeout(() => {
      compareResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  });

});
