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
  const chatWindow = document.getElementById('chatWindow');
  const sendBtn = document.getElementById('sendChat');
  const toggleInfoCardBtn = document.getElementById('toggleInfoCard');
  const infoCard = document.getElementById('infoCard');
  const themeName = document.getElementById('themeName');
  const chatScrollFill = document.getElementById('chatScrollFill');
  const chatScrollStatus = document.getElementById('chatScrollStatus');

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




  // Histórico do Chat
  let chatHistory = [
    { role: "system", content: "Você é o Open AnIme, o assistente virtual do site Anime House. Você é amigável, prestativo e sabe tudo sobre animes e desenhos. Use emojis nas respostas. Mantenha o contexto da conversa." }
  ];

  const themeLabels = {
    'theme-default': 'Tema padrão',
    '': 'Tema padrão',
    'theme-ben10': 'Ben 10',
    'theme-vinland': 'Vinland Saga',
    'theme-aot': 'Attack on Titan',
    'theme-tt-classic': 'Jovens Titãs',
    'theme-mutant-rex': 'Mutante Rex',
    'theme-regular-show': 'Regular Show',
    'theme-vagabond': 'Vagabond'
  };

  function updateThemeInfo() {
    if (!themeName) return;
    const currentTheme = document.documentElement.className || sessionStorage.getItem('theme') || 'theme-default';
    themeName.textContent = themeLabels[currentTheme] || 'Tema personalizado';
  }

  function updateChatScrollInfo() {
    if (!chatWindow || !chatScrollFill || !chatScrollStatus) return;

    const maxScroll = Math.max(chatWindow.scrollHeight - chatWindow.clientHeight, 0);
    const current = chatWindow.scrollTop;
    const progress = maxScroll <= 0 ? 100 : Math.min(100, Math.round((current / maxScroll) * 100));

    chatScrollFill.style.width = `${progress}%`;

    if (maxScroll <= 0) {
      chatScrollStatus.textContent = 'Ainda não há histórico suficiente para rolar';
      return;
    }

    if (progress <= 5) {
      chatScrollStatus.textContent = 'No topo do histórico';
    } else if (progress >= 95) {
      chatScrollStatus.textContent = 'No fim do histórico';
    } else {
      chatScrollStatus.textContent = `Histórico percorrido: ${progress}%`;
    }
  }

  function showFeedback(message) {
    if (typeof showToast === 'function') {
      showToast(message, 'success');
      return;
    }

    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:rgba(15,23,42,0.95);color:#fff;padding:12px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);z-index:9999;';
    clearTimeout(showFeedback.timeoutId);
    showFeedback.timeoutId = setTimeout(() => {
      toast.textContent = '';
      toast.removeAttribute('style');
    }, 1800);
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      if (button) {
        const original = button.innerHTML;
        button.innerHTML = '✓';
        button.classList.add('copied');
        setTimeout(() => {
          button.innerHTML = original;
          button.classList.remove('copied');
        }, 1400);
      }
      showFeedback('Mensagem copiada');
    } catch (error) {
      console.error('Erro ao copiar mensagem:', error);
      showFeedback('Não foi possível copiar a mensagem');
    }
  }

  function appendMsg(text, type) {
    const div = document.createElement('div');
    div.className = `msg ${type}`;

    const content = document.createElement('div');
    content.className = 'msg-content';
    content.innerHTML = formatAIResponse(text);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'msg-copy-btn';
    copyBtn.type = 'button';
    copyBtn.title = 'Copiar mensagem';
    copyBtn.setAttribute('aria-label', 'Copiar mensagem');
    copyBtn.innerHTML = '⧉';
    copyBtn.addEventListener('click', () => copyText(text, copyBtn));

    div.appendChild(content);
    div.appendChild(copyBtn);
    chatWindow.appendChild(div);
    
    setTimeout(() => {
      chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
      updateChatScrollInfo();
    }, 100);
  }

  appendMsg('Olá! Eu sou o **Open AnIme**. Como posso ajudar você hoje? Posso recomendar animes, explicar episódios ou desenvolver ideias para o seu site!', 'bot');
  updateThemeInfo();
  updateChatScrollInfo();

  if (toggleInfoCardBtn && infoCard) {
    toggleInfoCardBtn.addEventListener('click', () => {
      const isVisible = infoCard.style.display !== 'none';
      infoCard.style.display = isVisible ? 'none' : 'block';
    });
  }

  if (chatWindow) {
    chatWindow.addEventListener('scroll', updateChatScrollInfo);
  }

  window.addEventListener('storage', updateThemeInfo);
  document.addEventListener('click', (event) => {
    if (event.target.closest('.theme-opt-btn')) {
      setTimeout(updateThemeInfo, 20);
    }
  });

  // Proxy Calls
  async function callAI(prompt) {
    const target = 'groq'; 
    const model = "llama-3.3-70b-versatile";

    try {
      chatHistory.push({ role: "user", content: prompt });
      
      const GROQ_API_KEY = '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';
      const res = await fetch('/api/ai/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          apiKey: GROQ_API_KEY,
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
    updateChatScrollInfo();
    
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
