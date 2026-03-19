document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
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

  // Elementos do Chat e Ferramentas
  const chatInput = document.getElementById('chatInput');
  const char1Inp = document.getElementById('char1');
  const char2Inp = document.getElementById('char2');

  // Atalhos Enter
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('sendChat').click();
    }
  });

  char1Inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      char2Inp.focus();
    }
  });

  char2Inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('compareBtn').click();
    }
  });

  // Enter na chave API
  document.getElementById('groqKey').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('saveApiKeys').click();
    }
  });

  // Config & API Keys
  const groqInp = document.getElementById('groqKey');
  const saveBtn = document.getElementById('saveApiKeys');

  function loadConfigs() {
    const config = DB.getAIConfig();
    if (config.groqKey) groqInp.value = config.groqKey;
  }
  loadConfigs();

  saveBtn.addEventListener('click', async () => {
    try {
      await DB.saveAIConfig({
        groqKey: groqInp.value.trim(),
        provider: 'groq'
      });
      showToast('Chave Groq salva com sucesso!');
    } catch(e) {
      showToast('Erro ao salvar chave: ' + e.message, 'error');
    }
  });

  
  // Histórico do Chat
  let chatHistory = [
    { role: "system", content: "Você é o Open AnIme, o assistente virtual do site Anime House. Você é amigável, prestativo e sabe tudo sobre animes e desenhos. Use emojis nas respostas. Mantenha o contexto da conversa." }
  ];

  // Chat UI Elements
  const chatWindow = document.getElementById('chatWindow');
  const sendBtn = document.getElementById('sendChat');

  // Proxy Calls
  async function callAI(prompt) {
    const config = DB.getAIConfig();
    const target = 'groq'; 
    const model = "llama-3.3-70b-versatile";

    try {
      chatHistory.push({ role: "user", content: prompt });
      
      const res = await fetch('/api/ai/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          apiKey: config.groqKey,
          body: {
            model: model,
            messages: chatHistory,
            stream: false
          }
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const erroMsg = typeof errData.error === 'object' ? errData.error.message : errData.error;
        throw new Error(erroMsg || `Erro HTTP ${res.status}`);
      }
      const data = await res.json();
      const aiResponse = data.choices[0].message.content;
      chatHistory.push({ role: "assistant", content: aiResponse });
      return aiResponse;
    } catch (e) {
      console.error(e);
      // Remove o último prompt do usuário se falhar para não poluir o histórico com erros
      chatHistory.pop();
      return `⚠️ Falha: ${e.message}. Verifique o terminal do servidor para mais detalhes.`;
    }
  }

  function formatAIResponse(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function appendMsg(text, type) {
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerHTML = formatAIResponse(text);
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
    compareResult.innerHTML = `<strong>Análise de Combate:</strong><br><br>${formatAIResponse(analysis)}`;
    
    // Scroll suave para o resultado
    setTimeout(() => {
      compareResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  });

  // Clear comparison entries on load
  char1Inp.value = '';
  char2Inp.value = '';
  if (compareResult) {
    compareResult.innerHTML = '';
    compareResult.style.display = 'none';
  }

});
