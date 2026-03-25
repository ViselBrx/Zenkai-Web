document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();

  const tabs = document.querySelectorAll('.ai-tab-v');
  const panels = document.querySelectorAll('.tool-panel');
  function activateToolTab(tabName) {
    const targetTab = String(tabName || 'chat');
    const selectedTab = document.querySelector(`.ai-tab-v[data-tab="${targetTab}"]`);
    const selectedPanel = document.getElementById(`tab-${targetTab}`);
    if (!selectedTab || !selectedPanel) return;

    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    selectedTab.classList.add('active');
    selectedPanel.classList.add('active');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateToolTab(tab.dataset.tab));
  });

  const chatInput = document.getElementById('chatInput');
  const char1Inp = document.getElementById('char1');
  const char2Inp = document.getElementById('char2');
  const chatWindow = document.getElementById('chatWindow');
  const sendBtn = document.getElementById('sendChat');
  const toggleInfoCardBtn = document.getElementById('toggleInfoCard');
  const infoCard = document.getElementById('infoCard');
  const themeName = document.getElementById('themeName');
  const themeColorPreview = document.getElementById('themeColorPreview');
  const chatScrollFill = document.getElementById('chatScrollFill');
  const chatScrollStatus = document.getElementById('chatScrollStatus');
  const compareBtn = document.getElementById('compareBtn');
  const compareResult = document.getElementById('compareResult');

  const SYSTEM_PROMPT = 'Você é o Open AnIme, o assistente virtual do site Anime House. Você é amigável, prestativo e sabe tudo sobre animes e desenhos. Use emojis nas respostas. Mantenha o contexto da conversa.';
  const GREETING_MESSAGE = 'Olá! Eu sou o **Open AnIme**. Como posso ajudar você hoje? Posso recomendar animes, explicar episódios ou desenvolver ideias para o seu site!';
  const AI_HISTORY_TABLE = 'ai_chat_messages';
  const AI_HISTORY_LIMIT = 120;

  let chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
  let cachedAIUser = null;
  let currentChatThreadId = '';

  let resumeData = null;
  if (typeof HistoryTracker !== 'undefined') {
    resumeData = HistoryTracker.consumeResumeFromUrl('open-anime.html');
  }

  function buildUniqueId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function getResumeChatThreadId() {
    if (!resumeData) return '';
    const candidate = String(resumeData.threadId || resumeData.contentId || '').trim();
    if (!candidate || candidate === 'open_anime_chat') return '';
    return candidate;
  }

  function getResumeCompareHistoryId() {
    if (!resumeData) return '';
    return String(resumeData.historyContentId || resumeData.compareId || resumeData.contentId || '').trim();
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendBtn.click();
      }
    });
  }

  if (char1Inp) {
    char1Inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        char2Inp.focus();
      }
    });
  }

  if (char2Inp) {
    char2Inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        compareBtn.click();
      }
    });
  }

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
    if (themeName) {
      const currentTheme = document.documentElement.className || sessionStorage.getItem('theme') || 'theme-default';
      themeName.textContent = themeLabels[currentTheme] || 'Tema personalizado';
    }
    if (themeColorPreview) {
      const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#7c3aed';
      themeColorPreview.style.background = primary;
    }
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

  function formatAIResponse(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function buildComparisonHistoryContentId(metadata = {}) {
    const normalize = (value, fallback) => String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32) || fallback;

    const char1 = normalize(metadata.char1, 'personagem_1');
    const char2 = normalize(metadata.char2, 'personagem_2');
    return `open_anime_compare_${char1}_${char2}_${Date.now()}`;
  }

  function appendMsg(text, type) {
    if (!chatWindow) return;

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
    }, 80);
  }

  function renderChatFromMessages(messages = []) {
    if (!chatWindow) return;
    chatWindow.innerHTML = '';

    messages.forEach((msg) => {
      if (!msg || msg.role === 'system' || typeof msg.content !== 'string') return;
      const type = msg.role === 'assistant' ? 'bot' : 'user';
      appendMsg(msg.content, type);
    });
  }

  async function waitForSupabaseClient(timeoutMs = 6000) {
    const start = Date.now();
    while (!window.supabaseClient && (Date.now() - start) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    return window.supabaseClient || null;
  }

  async function getAIHistoryUser() {
    if (cachedAIUser) return cachedAIUser;

    const supa = await waitForSupabaseClient();
    if (!supa) return null;

    try {
      const { data: { user } } = await supa.auth.getUser();
      cachedAIUser = user || null;
      return cachedAIUser;
    } catch {
      return null;
    }
  }

  async function saveAIHistoryMessage({ role, content, context = 'chat', metadata = {} }) {
    const supa = await waitForSupabaseClient();
    if (!supa || !content) return false;

    const user = await getAIHistoryUser();
    if (!user) return false;

    try {
      const { error } = await supa
        .from(AI_HISTORY_TABLE)
        .insert([{ user_id: user.id, role, content, context, metadata }]);
      return !error;
    } catch (err) {
      console.error('Erro ao salvar histórico da IA:', err);
      return false;
    }
  }

  async function loadAIHistoryMessages(options = {}) {
    const context = options.context || 'chat';
    const metadataContains = options.metadataContains && typeof options.metadataContains === 'object'
      ? options.metadataContains
      : null;
    const limit = Number.isFinite(options.limit)
      ? options.limit
      : (metadataContains ? 1000 : AI_HISTORY_LIMIT);
    const supa = await waitForSupabaseClient();
    if (!supa) return [];

    const user = await getAIHistoryUser();
    if (!user) return [];

    try {
      const { data, error } = await supa
        .from(AI_HISTORY_TABLE)
        .select('role, content, context, metadata, created_at')
        .eq('user_id', user.id)
        .eq('context', context)
        .order('created_at', { ascending: true })
        .limit(limit);
      if (error) throw error;

      const messages = data || [];
      if (!metadataContains || Object.keys(metadataContains).length === 0) {
        return messages;
      }

      return messages.filter((message) => (
        Object.entries(metadataContains).every(([key, value]) => (
          String(message?.metadata?.[key] || '') === String(value || '')
        ))
      ));
    } catch (err) {
      console.error('Erro ao carregar histórico da IA:', err);
      return [];
    }
  }

  async function initializeChatView(options = {}) {
    const restoreSaved = options.restoreSaved === true;
    const resumedThreadId = getResumeChatThreadId();
    currentChatThreadId = resumedThreadId || buildUniqueId('open_anime_chat_thread');
    chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];

    if (restoreSaved && resumedThreadId) {
      const persisted = await loadAIHistoryMessages({
        context: 'chat',
        metadataContains: { threadId: resumedThreadId }
      });
      if (persisted.length > 0) {
        chatHistory = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...persisted.map(msg => ({ role: msg.role, content: msg.content }))
        ];
        renderChatFromMessages(chatHistory);
        return;
      }
    }

    appendMsg(GREETING_MESSAGE, 'bot');
    chatHistory.push({ role: 'assistant', content: GREETING_MESSAGE });
  }

  async function initializeComparisonView(options = {}) {
    const restoreSaved = options.restoreSaved === true;
    if (compareResult) {
      compareResult.style.display = 'none';
      compareResult.innerHTML = '';
    }

    const selectedCompareHistoryId = getResumeCompareHistoryId();
    if (!restoreSaved || !compareResult || !selectedCompareHistoryId) {
      return;
    }

    const persisted = await loadAIHistoryMessages({
      context: 'compare',
      metadataContains: { historyContentId: selectedCompareHistoryId },
      limit: 20
    });
    const selectedComparison = persisted.find(msg => msg.role === 'assistant');
    if (!selectedComparison) return;

    if (char1Inp) char1Inp.value = selectedComparison.metadata?.char1 || resumeData?.char1 || '';
    if (char2Inp) char2Inp.value = selectedComparison.metadata?.char2 || resumeData?.char2 || '';
    compareResult.style.display = 'block';
    compareResult.innerHTML = `<strong>Análise de Combate:</strong><br><br>${formatAIResponse(selectedComparison.content || '')}`;
  }

  async function callAI(prompt, options = {}) {
    const target = 'groq';
    const model = 'llama-3.3-70b-versatile';
    const useChatContext = options.useChatContext !== false;
    const persistToAIHistory = options.persistToAIHistory !== false;
    const context = options.context || 'chat';
    const metadata = { ...(options.metadata || {}) };

    if (context === 'chat') {
      currentChatThreadId = metadata.threadId || currentChatThreadId || buildUniqueId('open_anime_chat_thread');
      metadata.threadId = currentChatThreadId;
    }

    if (context === 'compare') {
      metadata.historyContentId = metadata.historyContentId || buildComparisonHistoryContentId(metadata);
    }

    try {
      if (useChatContext) {
        chatHistory.push({ role: 'user', content: prompt });
      }

      if (persistToAIHistory) {
        await saveAIHistoryMessage({ role: 'user', content: prompt, context, metadata });
      }

      const GROQ_API_KEY = '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';
      const requestMessages = useChatContext
        ? chatHistory
        : [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }];

      const res = await fetch('/api/ai/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          apiKey: GROQ_API_KEY,
          body: {
            model,
            messages: requestMessages,
            stream: false
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const erroMsg = typeof errData.error === 'object' ? errData.error.message : errData.error;
        throw new Error(erroMsg || ('Erro HTTP ' + res.status));
      }

      const data = await res.json();
      const aiResponse = data.choices[0].message.content;

      if (useChatContext) {
        chatHistory.push({ role: 'assistant', content: aiResponse });
      }

      if (persistToAIHistory) {
        await saveAIHistoryMessage({ role: 'assistant', content: aiResponse, context, metadata });

        if (typeof HistoryTracker !== 'undefined') {
          const isCompare = context === 'compare';
          HistoryTracker.track({
            contentId: isCompare ? metadata.historyContentId : currentChatThreadId,
            contentType: isCompare ? 'ai_compare' : 'ai_chat',
            title: isCompare
              ? `Comparação IA - ${metadata.char1 || ''} vs ${metadata.char2 || ''}`
              : ('Open AnIme - ' + prompt.slice(0, 60)),
            subtitle: aiResponse.slice(0, 120),
            route: 'open-anime.html',
            payload: {
              mediaType: isCompare ? 'ai_compare' : 'ai_chat',
              tab: isCompare ? 'compare' : 'chat',
              threadId: isCompare ? '' : currentChatThreadId,
              historyContentId: isCompare ? metadata.historyContentId : '',
              char1: metadata.char1 || '',
              char2: metadata.char2 || ''
            }
          });
        }
      }

      return aiResponse;
    } catch (e) {
      console.error(e);
      if (useChatContext && chatHistory.length > 1) {
        chatHistory.pop();
      }
      return 'Falha: ' + e.message + '. Verifique o terminal do servidor para mais detalhes.';
    }
  }

  const shouldRestoreSavedChat = resumeData?.mediaType === 'ai_chat'
    || resumeData?.contentType === 'ai_chat';
  const shouldRestoreSavedCompare = resumeData?.mediaType === 'ai_compare'
    || resumeData?.contentType === 'ai_compare';

  await initializeChatView({ restoreSaved: shouldRestoreSavedChat });
  await initializeComparisonView({ restoreSaved: shouldRestoreSavedCompare });
  updateThemeInfo();
  updateChatScrollInfo();

  const shouldOpenCompareTab = shouldRestoreSavedCompare || resumeData?.tab === 'compare';
  activateToolTab(shouldOpenCompareTab ? 'compare' : 'chat');

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

    const response = await callAI(val, { useChatContext: true, persistToAIHistory: true, context: 'chat' });
    loadingMsg.remove();
    appendMsg(response, 'bot');
  });

  compareBtn.addEventListener('click', async () => {
    const c1 = char1Inp.value.trim();
    const c2 = char2Inp.value.trim();
    if (!c1 || !c2) return showToast('Digite dois nomes para comparar', 'error');
    const compareHistoryId = buildComparisonHistoryContentId({ char1: c1, char2: c2 });

    compareResult.style.display = 'block';
    compareResult.innerHTML = '⚖️ Analisando poderes, história e habilidades...';

    const prompt = `Faça uma comparação detalhada entre os personagens de anime/desenho ${c1} e ${c2}. Analise Força, Inteligência, Habilidades Especiais e diga quem venceria em um duelo épico e por quê.`;
    const analysis = await callAI(prompt, {
      useChatContext: false,
      persistToAIHistory: true,
      context: 'compare',
      metadata: { char1: c1, char2: c2, historyContentId: compareHistoryId }
    });

    compareResult.innerHTML = `<strong>Análise de Combate:</strong><br><br>${formatAIResponse(analysis)}`;

    setTimeout(() => {
      compareResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  });

  if (!shouldRestoreSavedCompare) {
    char1Inp.value = '';
    char2Inp.value = '';
  }
});
