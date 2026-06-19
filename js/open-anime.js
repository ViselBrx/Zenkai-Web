document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('ai-typing-styles')) {
    const style = document.createElement('style');
    style.id = 'ai-typing-styles';
    style.textContent = `
      .typing-dots::after {
        content: '';
        animation: ai-typing-dots 1.5s infinite steps(4, end);
      }
      @keyframes ai-typing-dots {
        0% { content: ''; }
        25% { content: '.'; }
        50% { content: '..'; }
        75% { content: '...'; }
        100% { content: ''; }
      }
    `;
    document.head.appendChild(style);
  }
  await DB.init([]);

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
  const cancelChatEditBtn = document.getElementById('cancelChatEdit');
  const toggleInfoCardBtn = document.getElementById('toggleInfoCard');
  const infoCard = document.getElementById('infoCard');
  const themeName = document.getElementById('themeName');
  const themeColorPreview = document.getElementById('themeColorPreview');
  const chatScrollFill = document.getElementById('chatScrollFill');
  const chatScrollStatus = document.getElementById('chatScrollStatus');
  const compareBtn = document.getElementById('compareBtn');
  const compareResult = document.getElementById('compareResult');
  const visionUpload = document.getElementById('visionUpload');
  const visionAnalyzeBtn = document.getElementById('visionAnalyzeBtn');
  const visionOutput = document.getElementById('visionOutput');
  const visionDropZone = document.getElementById('visionDropZone');
  const visionPreview = document.getElementById('visionPreview');
  const visionPreviewImg = document.getElementById('visionPreviewImg');
  const visionFileName = document.getElementById('visionFileName');
  const visionFileInfo = document.getElementById('visionFileInfo');
  const visionPreviewActions = document.getElementById('visionPreviewActions');
  const visionChooseAnotherBtn = document.getElementById('visionChooseAnotherBtn');
  const visionClearBtn = document.getElementById('visionClearBtn');

  const BROKEN_ENCODING_REGEX = /(?:Ã[\u0080-\u00BF]|Â[\u0080-\u00BF]|â[\u0080-\u00BF]{2}|ðŸ[\u0080-\u00BF]{2}|ï¸[\u0080-\u00BF])/

  function normalizeBrokenEncoding(value) {
    const text = String(value ?? '');
    if (!text || !BROKEN_ENCODING_REGEX.test(text)) return text;

    try {
      // Safe fallback for UTF-8 decoding
      return decodeURIComponent(escape(text));
    } catch {
      return text;
    }
  }

  const SYSTEM_PROMPT = 'Você é o Open AnIme, o assistente virtual super inteligente do Anime House (que significa "Casa da Animação", lar de todos os estilos: cartoon, 3D, ocidental e oriental, além de mangás e HQs). REGRA DE OURO: Suas respostas devem ser EXTREMAMENTE coerentes, lógicas e baseadas em FATOS VERÍDICOS de todo o escopo de animações, desenhos, filmes, mangás e HQs mundiais. Você é um especialista dedicado a análises profundas sobre esses temas e tudo relacionado a eles. Nunca alucine ou invente cânones. Ao responder, traga informações extras genuínas, focando em curiosidades, lore, detalhes técnicos de animação/quadrinhos e desenvolvimento de personagens, mas seja UM POUCO MAIS CONCISO E DIRETO, reduzindo um pouco o volume de texto sem perder a qualidade. Seja extremamente amigável, entusiasmado e coloque alguns (poucos e bem escolhidos) emojis ao longo do texto para dar vida à conversa ✨. Use listas, tópicos de Markdown em negrito/itálico e estruture tudo para ficar gostoso de ler, sem blocos de texto gigantescos.';
  const GREETING_MESSAGE = 'Olá! Eu sou o **Open AnIme** 🎬 — seu assistente especialista do Anime House! Eu conheço tudo sobre entretenimento global: de animes e mangás japoneses a cartoons, HQs e filmes de todo o mundo. Posso recomendar títulos com explicações detalhadas, discutir lore e desenvolvimento de personagens, comparar poderes incríveis ou analisar cenas e quadros. Qual universo vamos explorar hoje?';
  const AI_HISTORY_TABLE = 'ai_chat_messages';
  const AI_HISTORY_LIMIT = 120;
  const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';
  const DEFAULT_VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';
  const DEFAULT_GEMINI_VISION_MODEL = 'gemini-1.5-flash';
  const GEMINI_VISION_MODEL_FALLBACKS = ['gemini-1.5-flash', 'gemini-2.0-flash'];
  const COMPARE_GEMINI_MODEL = 'gemini-2.0-flash';
  const COMPARE_FALLBACK_GEMINI_MODEL = 'gemini-2.0-flash';
  const DEFAULT_GROQ_MODEL = 'google/gemma-4-31b-it:free';
  const COMPARE_FALLBACK_GROQ_MODEL = 'google/gemma-4-31b-it:free';
  const COMPARE_MAX_TOKENS = 1400;
  const COMPARE_TEMPERATURE = 0.35;
  const VISION_MAX_TOKENS = 2500;
  const VISION_MIN_COMPLETION_CHARS = 1000;
  const VISION_PROMPT = [
    'Atue como um detetive visual implacável e enciclopédia suprema de animes, desenhos, filmes, mangás e HQs. Sua ÚNICA missão é DESCOBRIR exatamente qual é a obra e o personagem da imagem.',
    'PROIBIDO dar respostas genéricas! Você tem a OBRIGAÇÃO de dar o seu palpite mais forte e certeiro sobre o nome da obra, cruzando detalhes como estilo do estúdio, época, roupas e cores.',
    '',
    '### 🆔 Identificação Certeira (Obrigatório)',
    '- **Obra/Franquia Exata:** DIGA O NOME da série, anime ou filme. (Ex: "Esta imagem é de Naruto Shippuden"). Se for impossível cravar 100%, dê o palpite com a maior probabilidade e justifique.',
    '- **Personagem(ns):** Quem é? Se não souber o nome, compare com personagens parecidos da cultura pop.',
    '',
    '### 🔎 Evidências do Detetive',
    '- **Traço e Estúdio:** Analise o formato dos olhos, contornos, iluminação e sombreamento. É estilo Ufotable, Toei, Cartoon Network, Pixar? Que década parece ser?',
    '- **Detalhes Chave:** Quebras de quarta parede, símbolos em roupas, armas, tipo de magia/aura.',
    '',
    '### 🎯 Veredito',
    '- Crave a sua resposta final em português do Brasil, usando Markdown. Se for fanart, diga de qual obra original é inspirada.'
  ].join('\n');
  const COPY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2"></rect><rect x="5" y="5" width="10" height="10" rx="2"></rect></svg>';
  const COPIED_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"></path></svg>';
  const EDIT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"></path></svg>';
  const RESEND_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"></path><path d="M21 3v6h-6"></path></svg>';
  const COPY_BUTTON_LABEL = 'Copiar';
  const COPIED_BUTTON_LABEL = 'Copiado';
  const AI_CHAT_SESSION_KEYS = {
    threadId: 'animehouse_ai_chat_thread',
    history: 'animehouse_ai_chat_history',
    draft: 'animehouse_ai_chat_draft',
    editState: 'animehouse_ai_chat_edit_state'
  };
  const VISION_FALLBACK_PREVIEW = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="16" fill="%23111827"/><path d="M34 80l18-22 12 14 8-10 14 18H34z" fill="%236b7280"/><circle cx="46" cy="42" r="8" fill="%239ca3af"/></svg>';
  let chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
  let cachedAIUser = null;
  let currentChatThreadId = '';
  let selectedVisionFile = null;
  let isComparing = false;
  let isSendingChat = false;
  let activeChatEditState = null;

  let resumeData = null;
  if (typeof HistoryTracker !== 'undefined') {
    resumeData = HistoryTracker.consumeResumeFromUrl('open-anime.html');
  }

  function buildUniqueId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function getActiveToolTab() {
    return document.querySelector('.ai-tab-v.active')?.dataset?.tab || 'chat';
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function isTemporaryModelOverload(statusCode, message) {
    const status = Number(statusCode || 0);
    const text = String(message || '').toLowerCase();
    if (status === 404 || status === 429 || status === 503) return true;
    return (
      text.includes('high demand')
      || text.includes('resource_exhausted')
      || text.includes('temporarily unavailable')
      || text.includes('try again later')
      || text.includes('overloaded')
    );
  }

  function getResumeChatThreadId(resume = resumeData) {
    if (!resume) return '';
    const candidate = String(resume.threadId || resume.contentId || '').trim();
    if (!candidate || candidate === 'open_anime_chat') return '';
    return candidate;
  }

  function getResumeCompareHistoryId(resume = resumeData) {
    if (!resume) return '';
    return String(resume.historyContentId || resume.compareId || resume.contentId || '').trim();
  }

  function getResumeVisionHistoryId(resume = resumeData) {
    if (!resume) return '';
    return String(resume.historyContentId || resume.visionId || resume.contentId || '').trim();
  }

  function getResumeType(resume = resumeData) {
    if (!resume) return '';
    return String(resume.mediaType || resume.contentType || '').trim();
  }

  function normalizeSessionChatMessage(message) {
    if (!message || typeof message !== 'object') return null;
    if (!['user', 'assistant'].includes(String(message.role || ''))) return null;
    const content = normalizeBrokenEncoding(String(message.content || ''));
    if (!content.trim()) return null;

    return {
      id: message.id ? String(message.id) : '',
      role: String(message.role),
      content,
      context: String(message.context || 'chat'),
      metadata: message.metadata && typeof message.metadata === 'object'
        ? { ...message.metadata }
        : {},
      created_at: message.created_at || null
    };
  }

  function getSerializableChatHistory() {
    return chatHistory
      .filter((message) => message && message.role !== 'system' && typeof message.content === 'string')
      .map((message) => ({
        id: message.id ? String(message.id) : '',
        role: message.role,
        content: normalizeBrokenEncoding(message.content),
        context: message.context || 'chat',
        metadata: message.metadata && typeof message.metadata === 'object'
          ? { ...message.metadata }
          : {},
        created_at: message.created_at || null
      }));
  }

  function readAIChatSessionState() {
    try {
      const rawHistory = sessionStorage.getItem(AI_CHAT_SESSION_KEYS.history);
      const parsedHistory = rawHistory ? JSON.parse(rawHistory) : [];
      const history = Array.isArray(parsedHistory)
        ? parsedHistory.map(normalizeSessionChatMessage).filter(Boolean)
        : [];

      const rawEditState = sessionStorage.getItem(AI_CHAT_SESSION_KEYS.editState);
      const parsedEditState = rawEditState ? JSON.parse(rawEditState) : null;

      return {
        threadId: String(sessionStorage.getItem(AI_CHAT_SESSION_KEYS.threadId) || '').trim(),
        draft: String(sessionStorage.getItem(AI_CHAT_SESSION_KEYS.draft) || ''),
        history,
        editState: parsedEditState && typeof parsedEditState === 'object'
          ? {
              userMessageId: String(parsedEditState.userMessageId || ''),
              previousDraft: String(parsedEditState.previousDraft || '')
            }
          : null
      };
    } catch {
      return { threadId: '', draft: '', history: [], editState: null };
    }
  }

  function persistAIChatSessionState(options = {}) {
    try {
      const draft = typeof options.draft === 'string'
        ? options.draft
        : String(chatInput?.value || '');
      const history = options.history || getSerializableChatHistory();

      if (currentChatThreadId) {
        sessionStorage.setItem(AI_CHAT_SESSION_KEYS.threadId, currentChatThreadId);
      } else {
        sessionStorage.removeItem(AI_CHAT_SESSION_KEYS.threadId);
      }

      sessionStorage.setItem(AI_CHAT_SESSION_KEYS.history, JSON.stringify(history));

      if (draft) {
        sessionStorage.setItem(AI_CHAT_SESSION_KEYS.draft, draft);
      } else {
        sessionStorage.removeItem(AI_CHAT_SESSION_KEYS.draft);
      }

      if (activeChatEditState?.userMessageId) {
        sessionStorage.setItem(AI_CHAT_SESSION_KEYS.editState, JSON.stringify(activeChatEditState));
      } else {
        sessionStorage.removeItem(AI_CHAT_SESSION_KEYS.editState);
      }
    } catch {
      // ignore session persistence errors
    }
  }

  function clearAIChatSessionState() {
    try {
      Object.values(AI_CHAT_SESSION_KEYS).forEach((key) => {
        sessionStorage.removeItem(key);
      });
    } catch {
      // ignore session cleanup errors
    }
  }

  function mergeSessionHistoryWithPersisted(sessionHistory = [], persistedHistory = []) {
    const persistedById = new Map();
    const persistedByLocalEchoId = new Map();
    persistedHistory.forEach((message) => {
      if (message?.id) persistedById.set(String(message.id), message);
      const localEchoId = String(message?.metadata?.localEchoId || '').trim();
      if (localEchoId) persistedByLocalEchoId.set(localEchoId, message);
    });

    const merged = sessionHistory.map((message) => {
      if (message?.id) {
        const byId = persistedById.get(String(message.id));
        if (byId) return byId;
      }

      const localEchoId = String(message?.metadata?.localEchoId || message?.id || '').trim();
      if (localEchoId && persistedByLocalEchoId.has(localEchoId)) {
        return persistedByLocalEchoId.get(localEchoId);
      }

      return message;
    });

    persistedHistory.forEach((message) => {
      const localEchoId = String(message?.metadata?.localEchoId || '').trim();
      const exists = merged.some((item) => (
        String(item?.id || '') === String(message?.id || '')
        || (localEchoId && String(item?.metadata?.localEchoId || item?.id || '').trim() === localEchoId)
      ));
      if (!exists) merged.push(message);
    });

    return merged;
  }

  if (chatInput) {
    const autoResize = () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = chatInput.scrollHeight + 'px';
    };

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          // Shift + Enter: Apenas permite a quebra de linha (padrão do textarea)
          e.stopPropagation();
          setTimeout(autoResize, 0);
          return;
        }
        
        if (getActiveToolTab() === 'chat') {
          e.preventDefault();
          e.stopImmediatePropagation();
          handleChatSend();
        }
      }
    });

    chatInput.addEventListener('input', () => {
      autoResize();
      persistAIChatSessionState();
    });

    // Inicializar tamanho
    setTimeout(autoResize, 100);
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
      if (e.key === 'Enter' && getActiveToolTab() === 'compare') {
        e.preventDefault();
        compareBtn.click();
      }
    });
  }

  const themeLabels = {
    'theme-ciano': 'Ciano',
    'theme-default': 'Ciano',
    '': 'Ciano',
    'theme-verde': 'Verde',
    'theme-ben10': 'Verde',
    'theme-dourado': 'Dourado',
    'theme-vinland': 'Dourado',
    'theme-vermelho': 'Vermelho',
    'theme-aot': 'Vermelho',
    'theme-roxo': 'Roxo',
    'theme-tt-classic': 'Roxo',
    'theme-laranja': 'Laranja',
    'theme-mutant-rex': 'Laranja',
    'theme-azul': 'Azul',
    'theme-regular-show': 'Azul',
    'theme-verde-escuro': 'Verde escuro',
    'theme-demon-slayer': 'Verde escuro',
    'theme-branco': 'Branco',
    'theme-vagabond': 'Branco',
    'theme-aqua-verde': 'Aqua verde'
  };

  function updateThemeInfo() {
    // Atualizar nome do tema
    if (themeName) {
      const rawTheme = document.documentElement.className || sessionStorage.getItem('theme') || 'theme-ciano';
      const currentTheme = typeof window.normalizeTheme === 'function'
        ? window.normalizeTheme(rawTheme)
        : rawTheme;
      const newThemeName = themeLabels[currentTheme] || 'Cor personalizada';
      if (themeName.textContent !== newThemeName) {
        themeName.textContent = newThemeName;
      }
    }
    
    // Atualizar cor do preview
    if (themeColorPreview) {
      const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#7c3aed';
      if (themeColorPreview.style.background !== primary) {
        themeColorPreview.style.background = primary;
      }
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

  function updateCopyButton(button, copied = false) {
    if (!button) return;

    const label = copied ? COPIED_BUTTON_LABEL : COPY_BUTTON_LABEL;
    button.classList.toggle('copied', copied);
    button.innerHTML = `${copied ? COPIED_ICON : COPY_ICON}<span>${label}</span>`;
    button.title = copied ? 'Mensagem copiada' : 'Copiar mensagem';
    button.setAttribute('aria-label', copied ? 'Mensagem copiada' : 'Copiar mensagem');
  }

  function isAIChatEditing() {
    return !!activeChatEditState;
  }

  function syncAIChatEditStateWithHistory() {
    if (!activeChatEditState?.userMessageId) return;
    const exists = chatHistory.some((message) => String(message?.id || '') === String(activeChatEditState.userMessageId));
    if (!exists) {
      activeChatEditState = null;
    }
  }

  function updateAIChatComposerState() {
    syncAIChatEditStateWithHistory();
    const editing = isAIChatEditing();

    if (chatInput) {
      chatInput.placeholder = editing
        ? 'Edite sua pergunta e pressione Enter para salvar'
        : 'Sua pergunta... (Pressione Enter para enviar, Shift+Enter para nova linha)';
    }

    if (cancelChatEditBtn) {
      cancelChatEditBtn.hidden = !editing;
      cancelChatEditBtn.disabled = isSendingChat;
    }

    if (sendBtn) {
      sendBtn.title = editing ? 'Salvar edição' : 'Enviar mensagem';
      sendBtn.setAttribute('aria-label', editing ? 'Salvar edição' : 'Enviar mensagem');
    }

  }

  function clearAIChatEditState(options = {}) {
    if (!activeChatEditState) {
      updateAIChatComposerState();
      persistAIChatSessionState();
      return;
    }

    const { restoreDraft = false } = options;
    const previousDraft = activeChatEditState.previousDraft || '';
    activeChatEditState = null;

    if (restoreDraft && chatInput) {
      chatInput.value = previousDraft;
      chatInput.style.height = 'auto';
      chatInput.style.height = chatInput.scrollHeight + 'px';
    } else if (chatInput && !isSendingChat) {
      chatInput.value = '';
      chatInput.style.height = 'auto';
    }

    updateAIChatComposerState();
    persistAIChatSessionState();
  }

  function writeTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      // Make it invisible but accessible
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!copied) {
          reject(new Error('Comando de cópia indisponível.'));
          return;
        }
        resolve();
      } catch (error) {
        document.body.removeChild(textarea);
        reject(error);
      }
    });
  }

  async function copyText(text, button) {
    try {
      await writeTextToClipboard(text);
      if (button) {
        clearTimeout(button.copyResetTimeout);
        updateCopyButton(button, true);
        button.copyResetTimeout = setTimeout(() => {
          updateCopyButton(button, false);
        }, 1600);
      }
      showFeedback(button?.dataset.feedbackMessage || 'Mensagem copiada');
    } catch (error) {
      console.error('Erro ao copiar mensagem:', error);
      showFeedback('Não foi possível copiar a mensagem');
    }
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatInlineMarkdown(text) {
    let content = escapeHtml(text);

    content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    content = content.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    content = content.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    content = content.replace(/___([^_\n]+)___/g, '<strong><em>$1</em></strong>');
    content = content.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
    content = content.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    content = content.replace(/_([^_\n]+)_/g, '<em>$1</em>');
    content = content.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');

    return content;
  }

  function formatAIResponse(text) {
    if (!text) return '';

    const lines = String(text).replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let inUl = false;
    let inOl = false;

    const closeLists = () => {
      if (inUl) {
        html.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        html.push('</ol>');
        inOl = false;
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        closeLists();
        html.push('<br>');
        return;
      }

      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        closeLists();
        const level = Math.min(6, headingMatch[1].length + 2);
        html.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
        return;
      }

      const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        if (inOl) {
          html.push('</ol>');
          inOl = false;
        }
        if (!inUl) {
          html.push('<ul>');
          inUl = true;
        }
        html.push(`<li>${formatInlineMarkdown(ulMatch[1])}</li>`);
        return;
      }

      const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (olMatch) {
        if (inUl) {
          html.push('</ul>');
          inUl = false;
        }
        if (!inOl) {
          html.push('<ol>');
          inOl = true;
        }
        html.push(`<li>${formatInlineMarkdown(olMatch[1])}</li>`);
        return;
      }

      closeLists();
      html.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
    });

    closeLists();
    return html.join('');
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

  function buildVisionHistoryContentId(metadata = {}) {
    const fileBase = String(metadata.fileName || 'imagem')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'imagem';

    return `open_anime_vision_${fileBase}_${Date.now()}`;
  }

  function formatFileSize(size) {
    const bytes = Number(size || 0);
    if (!Number.isFinite(bytes) || bytes <= 0) return 'Tamanho desconhecido';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Falha ao ler a imagem.'));
      reader.readAsDataURL(file);
    });
  }

  function extractVisionText(result) {
    if (typeof result?.choices?.[0]?.message?.content === 'string') {
      return result.choices[0].message.content.trim();
    }
    if (typeof result?.candidates?.[0]?.content?.parts?.[0]?.text === 'string') {
      return result.candidates[0].content.parts[0].text.trim();
    }
    if (typeof result?.result?.description === 'string' && result.result.description.trim()) {
      return result.result.description.trim();
    }
    if (typeof result?.description === 'string' && result.description.trim()) {
      return result.description.trim();
    }
    if (typeof result?.result?.response === 'string' && result.result.response.trim()) {
      return result.result.response.trim();
    }
    if (Array.isArray(result?.result) && result.result.length > 0) {
      return JSON.stringify(result.result, null, 2);
    }
    return '';
  }

  function renderVisionResult(text) {
    if (!visionOutput) return;
    const normalizedText = normalizeBrokenEncoding(text || 'Nenhum resultado retornado.');
    
    // Como a div output tem position relative, o botao de copy funcionara bem.
    visionOutput.innerHTML = `<div class="msg-content">${formatAIResponse(normalizedText)}</div>`;

    const existingCopyBtn = visionOutput.querySelector('.msg-copy-btn');
    if (existingCopyBtn) existingCopyBtn.remove();
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'msg-copy-btn';
    copyBtn.type = 'button';
    copyBtn.title = 'Copiar análise';
    copyBtn.setAttribute('aria-label', 'Copiar análise');
    copyBtn.dataset.feedbackMessage = 'Análise copiada';
    copyBtn.dataset.rawText = normalizedText;
    updateCopyButton(copyBtn, false);
    copyBtn.addEventListener('click', () => copyText(copyBtn.dataset.rawText, copyBtn));
    visionOutput.appendChild(copyBtn);
  }

  function renderComparisonResult(text) {
    if (!compareResult) return;
    const normalizedText = normalizeBrokenEncoding(text || '');
    if (!normalizedText) {
      compareResult.style.display = 'none';
      return;
    }
    compareResult.style.display = 'block';
    compareResult.innerHTML = `<div class="msg-content"><strong>Análise de Combate:</strong><br><br>${formatAIResponse(normalizedText)}</div>`;

    const existingCopyBtn = compareResult.querySelector('.msg-copy-btn');
    if (existingCopyBtn) existingCopyBtn.remove();
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'msg-copy-btn';
    copyBtn.type = 'button';
    copyBtn.title = 'Copiar análise';
    copyBtn.setAttribute('aria-label', 'Copiar análise');
    copyBtn.dataset.feedbackMessage = 'Análise copiada';
    copyBtn.dataset.rawText = normalizedText;
    updateCopyButton(copyBtn, false);
    copyBtn.addEventListener('click', () => copyText(copyBtn.dataset.rawText, copyBtn));
    compareResult.appendChild(copyBtn);

  }

  function clearVisionSelection(options = {}) {
    setVisionFile(null);
    if (visionUpload) {
      visionUpload.value = '';
    }
    const visionPromptInput = document.getElementById('visionPromptInput');
    if (visionPromptInput) visionPromptInput.value = '';
    
    const visionOutputContainer = document.getElementById('visionOutputContainer');
    if (visionOutputContainer) visionOutputContainer.hidden = true;

    if (options.keepOutput) return;
    renderVisionResult(options.outputText || 'Aguardando imagem...');
  }

  function setVisionFile(file, options = {}) {
    selectedVisionFile = file || null;
    const canAnalyze = !!(selectedVisionFile && typeof selectedVisionFile.arrayBuffer === 'function');

    if (visionAnalyzeBtn) {
      visionAnalyzeBtn.disabled = !canAnalyze;
    }

    if (!visionDropZone) return;

    const visionActiveArea = document.getElementById('visionActiveArea');

    if (!selectedVisionFile) {
      visionDropZone.classList.remove('is-ready');
      if (visionActiveArea) visionActiveArea.hidden = true;
      if (visionPreviewImg) visionPreviewImg.removeAttribute('src');
      if (visionFileName) visionFileName.textContent = 'Nenhuma imagem selecionada';
      if (visionFileInfo) visionFileInfo.textContent = 'Aguardando envio';
      return;
    }

    visionDropZone.classList.add('is-ready');

    if (visionActiveArea) visionActiveArea.hidden = false;
    
    if (visionFileName) visionFileName.textContent = selectedVisionFile.name || 'Imagem selecionada';
    if (visionFileInfo) {
      visionFileInfo.textContent = options.fileInfo || `${selectedVisionFile.type || 'image/*'} - ${formatFileSize(selectedVisionFile.size)}`;
    }

    if (visionPreviewImg) {
      const previewSrc = typeof options.previewUrl === 'string'
        ? options.previewUrl.trim()
        : '';
      visionPreviewImg.src = previewSrc || VISION_FALLBACK_PREVIEW;
    }
  }

  function appendMsg(text, type, options = {}) {
    if (!chatWindow) return;
    const normalizedText = normalizeBrokenEncoding(text);

    const div = document.createElement('div');
    div.className = `msg ${type}`;
    if (options.isEditing) {
      div.classList.add('is-editing');
    }

    const content = document.createElement('div');
    content.className = 'msg-content';
    content.innerHTML = formatAIResponse(normalizedText);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'msg-copy-btn';
    copyBtn.type = 'button';
    copyBtn.title = 'Copiar mensagem';
    copyBtn.setAttribute('aria-label', 'Copiar mensagem');
    copyBtn.dataset.feedbackMessage = type === 'bot' ? 'Resposta copiada' : 'Mensagem copiada';
    copyBtn.dataset.rawText = normalizedText;
    updateCopyButton(copyBtn, false);
    copyBtn.addEventListener('click', () => copyText(copyBtn.dataset.rawText, copyBtn));

    if (options.canEdit) {
      const editBtn = document.createElement('button');
      editBtn.className = 'msg-edit-btn';
      editBtn.type = 'button';
      editBtn.title = options.isEditing ? 'Mensagem em edição' : 'Editar mensagem';
      editBtn.setAttribute('aria-label', options.isEditing ? 'Mensagem em edição' : 'Editar mensagem');
      editBtn.innerHTML = `${EDIT_ICON}<span>Editar</span>`;
      editBtn.disabled = !!options.isEditing;
      editBtn.addEventListener('click', () => {
        if (typeof options.onEdit === 'function') {
          options.onEdit();
        }
      });
      div.appendChild(editBtn);
    }

    if (options.canResend) {
      const resendBtn = document.createElement('button');
      resendBtn.className = 'msg-resend-btn';
      resendBtn.type = 'button';
      resendBtn.title = 'Reenviar pergunta';
      resendBtn.setAttribute('aria-label', 'Reenviar pergunta');
      resendBtn.innerHTML = `${RESEND_ICON}<span>Reenviar</span>`;
      resendBtn.addEventListener('click', () => {
        if (typeof options.onResend === 'function') {
          options.onResend();
        }
      });
      div.appendChild(resendBtn);
    }

    div.appendChild(content);
    div.appendChild(copyBtn);
    chatWindow.appendChild(div);

    setTimeout(() => {
      chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
      updateChatScrollInfo();
    }, 80);
  }

  function updateLastUserMessageButtons() {
    if (!chatWindow) return;
    const editableTurn = getLastUndoableChatTurn();
    if (!editableTurn || isSendingChat || activeChatEditState) return;

    const userMessages = chatWindow.querySelectorAll('.msg.user');
    if (userMessages.length === 0) return;
    const lastUserMsgDOM = userMessages[userMessages.length - 1];

    const oldEdit = lastUserMsgDOM.querySelector('.msg-edit-btn');
    if (oldEdit) oldEdit.remove();
    const oldResend = lastUserMsgDOM.querySelector('.msg-resend-btn');
    if (oldResend) oldResend.remove();

    const editBtn = document.createElement('button');
    editBtn.className = 'msg-edit-btn';
    editBtn.type = 'button';
    editBtn.title = 'Editar mensagem';
    editBtn.setAttribute('aria-label', 'Editar mensagem');
    editBtn.innerHTML = `${EDIT_ICON}<span>Editar</span>`;
    editBtn.addEventListener('click', () => beginAIChatEdit(editableTurn.userIndex));
    lastUserMsgDOM.insertBefore(editBtn, lastUserMsgDOM.querySelector('.msg-copy-btn') || lastUserMsgDOM.lastElementChild);

    const resendBtn = document.createElement('button');
    resendBtn.className = 'msg-resend-btn';
    resendBtn.type = 'button';
    resendBtn.title = 'Reenviar pergunta';
    resendBtn.setAttribute('aria-label', 'Reenviar pergunta');
    resendBtn.innerHTML = `${RESEND_ICON}<span>Reenviar</span>`;
    resendBtn.addEventListener('click', () => resendLastAIChatTurn());
    lastUserMsgDOM.insertBefore(resendBtn, lastUserMsgDOM.querySelector('.msg-copy-btn') || lastUserMsgDOM.lastElementChild);
  }

  function renderChatFromMessages(messages = []) {
    if (!chatWindow) return;
    chatWindow.innerHTML = '';

    const editableTurn = getLastUndoableChatTurn();

    messages.forEach((msg, index) => {
      if (!msg || msg.role === 'system' || typeof msg.content !== 'string') return;
      const type = msg.role === 'assistant' ? 'bot' : 'user';
      const isEditing = !!(
        activeChatEditState
        && String(activeChatEditState.userMessageId || '') === String(msg.id || '')
      );
      const canEdit = !!(
        msg.role === 'user'
        && editableTurn
        && editableTurn.userIndex === index
        && !isSendingChat
      );
      const canResend = !!(
        msg.role === 'user'
        && editableTurn
        && editableTurn.userIndex === index
        && !isSendingChat
        && !activeChatEditState
      );

      appendMsg(msg.content, type, {
        canEdit,
        canResend,
        isEditing,
        onEdit: () => beginAIChatEdit(index),
        onResend: () => resendLastAIChatTurn()
      });
    });
  }

  function getLastUndoableChatTurn() {
    if (!Array.isArray(chatHistory) || chatHistory.length <= 1) return null;

    const lastIndex = chatHistory.length - 1;
    const lastMessage = chatHistory[lastIndex];
    if (!lastMessage || lastMessage.role === 'system') return null;

    if (lastMessage.role === 'user') {
      return { userIndex: lastIndex, assistantIndex: -1 };
    }

    const previousMessage = chatHistory[lastIndex - 1];
    if (lastMessage.role === 'assistant' && previousMessage?.role === 'user') {
      return { userIndex: lastIndex - 1, assistantIndex: lastIndex };
    }

    return null;
  }

  function beginAIChatEdit(messageIndex) {
    if (isSendingChat) return;

    const turn = getLastUndoableChatTurn();
    if (!turn || turn.userIndex !== messageIndex) {
      showFeedback('Só a última pergunta pode ser editada agora');
      return;
    }

    const userMessage = chatHistory[turn.userIndex];
    if (!userMessage || userMessage.role !== 'user') return;

    activeChatEditState = {
      userMessageId: userMessage.id || '',
      previousDraft: String(chatInput?.value || '')
    };

    if (chatInput) {
      chatInput.value = userMessage.content || '';
      chatInput.style.height = 'auto';
      chatInput.style.height = chatInput.scrollHeight + 'px';
      chatInput.focus();
      const length = chatInput.value.length;
      if (typeof chatInput.setSelectionRange === 'function') {
        chatInput.setSelectionRange(length, length);
      }
    }

    renderChatFromMessages(chatHistory);
    updateChatScrollInfo();
    updateAIChatComposerState();
    persistAIChatSessionState();
  }

  async function deleteAIHistoryMessagesByIds(ids = []) {
    const validIds = ids
      .map(id => String(id || '').trim())
      .filter(Boolean);
    if (validIds.length === 0) return true;

    const supa = await waitForSupabaseClient();
    if (!supa) return false;

    try {
      const { error } = await supa
        .from(AI_HISTORY_TABLE)
        .delete()
        .in('id', validIds);
      return !error;
    } catch (error) {
      console.error('Erro ao remover mensagens da IA:', error);
      return false;
    }
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
    if (!supa || !content) return null;

    const user = await getAIHistoryUser();
    if (!user) return null;

    const normalizedContext = context === 'vision' ? 'vision' : context;
    const payloadMetadata = normalizedContext === 'vision'
      ? { ...metadata, aiContext: 'vision' }
      : metadata;

    try {
      let { error } = await supa
        .from(AI_HISTORY_TABLE)
        .insert([{ user_id: user.id, role, content, context: normalizedContext, metadata: payloadMetadata }]);

      if (error && normalizedContext === 'vision') {
        const fallback = await supa
          .from(AI_HISTORY_TABLE)
          .insert([{ user_id: user.id, role, content, context: 'compare', metadata: payloadMetadata }]);
        error = fallback.error;
      }
      return !error;
    } catch (err) {
      console.error('Erro ao salvar histórico da IA:', err);
      return false;
    }
  }

  async function saveAIHistoryMessageRecord({ role, content, context = 'chat', metadata = {} }) {
    const supa = await waitForSupabaseClient();
    if (!supa || !content) return null;

    const user = await getAIHistoryUser();
    if (!user) return null;

    const normalizedContext = context === 'vision' ? 'vision' : context;
    const payloadMetadata = normalizedContext === 'vision'
      ? { ...metadata, aiContext: 'vision' }
      : metadata;

    try {
      let { data, error } = await supa
        .from(AI_HISTORY_TABLE)
        .insert([{ user_id: user.id, role, content, context: normalizedContext, metadata: payloadMetadata }])
        .select('id, role, content, context, metadata, created_at')
        .single();

      if (error && normalizedContext === 'vision') {
        const fallback = await supa
          .from(AI_HISTORY_TABLE)
          .insert([{ user_id: user.id, role, content, context: 'compare', metadata: payloadMetadata }])
          .select('id, role, content, context, metadata, created_at')
          .single();
        error = fallback.error;
        data = fallback.data || null;
      }

      return error ? null : (data || null);
    } catch (err) {
      console.error('Erro ao salvar histÃ³rico detalhado da IA:', err);
      return null;
    }
  }

  async function updateAIHistoryMessageRecord(messageId, patch = {}) {
    const id = String(messageId || '').trim();
    if (!id) return null;

    const supa = await waitForSupabaseClient();
    if (!supa) return null;

    const user = await getAIHistoryUser();
    if (!user) return null;

    try {
      const { data, error } = await supa
        .from(AI_HISTORY_TABLE)
        .update(patch)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, role, content, context, metadata, created_at')
        .single();

      return error ? null : (data || null);
    } catch (err) {
      console.error('Erro ao atualizar mensagem da IA:', err);
      return null;
    }
  }

  function buildAIThreadHistoryTitle(prompt) {
    return 'Open AnIme - ' + String(prompt || '').slice(0, 60);
  }

  async function syncAIThreadHistoryCard(prompt, assistantText) {
    if (!currentChatThreadId || typeof HistoryTracker === 'undefined') return;

    await HistoryTracker.track({
      contentId: currentChatThreadId,
      contentType: 'ai_chat',
      title: buildAIThreadHistoryTitle(prompt),
      subtitle: String(assistantText || '').slice(0, 120),
      route: 'open-anime.html',
      payload: {
        mediaType: 'ai_chat',
        tab: 'chat',
        threadId: currentChatThreadId,
        historyContentId: ''
      }
    });
  }

  async function requestAIText(requestMessages, options = {}) {
    const target = options.target || 'openrouter';
    const context = options.context || 'chat';
    const model = options.model || DEFAULT_GROQ_MODEL;
    const modelQueue = context === 'compare'
      ? Array.from(new Set([model, COMPARE_FALLBACK_GROQ_MODEL, DEFAULT_GROQ_MODEL].filter(Boolean)))
      : [model];
    const maxRetriesPerModel = 2;

    let aiResponse = '';
    let lastError = null;

    for (let modelIndex = 0; modelIndex < modelQueue.length; modelIndex += 1) {
      const selectedModel = modelQueue[modelIndex];
      for (let attempt = 0; attempt < maxRetriesPerModel; attempt += 1) {
        const streamRequest = options.stream === true;
        const res = await fetch('/api/ai/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target,
            body: {
              model: selectedModel,
              messages: requestMessages,
              temperature: Number.isFinite(options.temperature) ? options.temperature : undefined,
              max_tokens: Number.isFinite(options.max_tokens) ? options.max_tokens : undefined,
              stream: streamRequest
            }
          })
        });

        if (res.ok) {
          if (streamRequest && typeof options.onChunk === 'function') {
            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            let fullText = '';
            let buffer = '';
            
            while (!done) {
              const { value, done: doneReading } = await reader.read();
              done = doneReading;
              if (value) {
                buffer += decoder.decode(value, { stream: true });
                let eolIndex;
                while ((eolIndex = buffer.indexOf('\n')) >= 0) {
                  const line = buffer.slice(0, eolIndex).trim();
                  buffer = buffer.slice(eolIndex + 1);
                  
                  if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                      const data = JSON.parse(line.slice(6));
                      const textChunk = data.choices?.[0]?.delta?.content || '';
                      if (textChunk) {
                        fullText += textChunk;
                        options.onChunk(textChunk, fullText);
                      }
                    } catch (e) {
                      // Ignora erros de parse e continua
                    }
                  }
                }
              }
            }
            aiResponse = fullText || 'Sem resposta da IA.';
            break;
          } else {
            const data = await res.json();
            aiResponse = normalizeBrokenEncoding(
              data.candidates?.[0]?.content?.parts?.[0]?.text
              || data.choices?.[0]?.message?.content
              || 'Sem resposta da IA.'
            );
            break;
          }
        }

        const errData = await res.json().catch(() => ({}));
        const erroMsg = normalizeBrokenEncoding(
          typeof errData.error === 'object'
            ? (errData.error.message || JSON.stringify(errData.error))
            : (errData.error || '')
        );
        const composedError = erroMsg || ('Erro HTTP ' + res.status);
        lastError = new Error(composedError);

        if (!isTemporaryModelOverload(res.status, composedError)) {
          throw lastError;
        }

        const hasRetryInCurrentModel = attempt < (maxRetriesPerModel - 1);
        if (hasRetryInCurrentModel) {
          await sleep(800 * (attempt + 1));
          continue;
        }

        const hasFallbackModel = modelIndex < (modelQueue.length - 1);
        if (hasFallbackModel) {
          await sleep(500);
          break;
        }

        throw lastError;
      }

      if (aiResponse) {
        break;
      }
    }

    if (!aiResponse) {
      throw (lastError || new Error('Sem resposta da IA.'));
    }

    return aiResponse;
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
      let query = supa
        .from(AI_HISTORY_TABLE)
        .select('id, role, content, context, metadata, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (context === 'vision') {
        query = query.in('context', ['vision', 'compare']);
      } else {
        query = query.eq('context', context);
      }

      const { data, error } = await query;
      if (error) throw error;

      const messages = (data || []).filter((message) => {
        if (context !== 'vision') return true;
        return message.context === 'vision' || message?.metadata?.aiContext === 'vision';
      });
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
    const resume = options.resume || resumeData;
    const sessionState = restoreSaved ? readAIChatSessionState() : { threadId: '', draft: '', history: [], editState: null };
    const resumedThreadId = getResumeChatThreadId(resume);
    currentChatThreadId = resumedThreadId || buildUniqueId('open_anime_chat_thread');
    activeChatEditState = restoreSaved ? sessionState.editState : null;
    chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (chatInput) {
      chatInput.value = restoreSaved ? (sessionState.draft || '') : '';
    }

    if (restoreSaved && sessionState.history.length > 0) {
      chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }, ...sessionState.history];
    }

    renderChatFromMessages(chatHistory);
    updateAIChatComposerState();

    if (restoreSaved && resumedThreadId) {
      const persisted = await loadAIHistoryMessages({
        context: 'chat',
        metadataContains: { threadId: resumedThreadId }
      });
      if (persisted.length > 0) {
        const normalizedPersisted = persisted.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: normalizeBrokenEncoding(msg.content),
          context: msg.context,
          metadata: msg.metadata,
          created_at: msg.created_at
        }));
        const restoredMessages = sessionState.history.length > 0
          ? mergeSessionHistoryWithPersisted(sessionState.history, normalizedPersisted)
          : normalizedPersisted;

        chatHistory = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...restoredMessages
        ];
        renderChatFromMessages(chatHistory);
        updateAIChatComposerState();
        persistAIChatSessionState();
        return;
      }
    }

    if (chatHistory.length <= 1) {
      appendMsg(GREETING_MESSAGE, 'bot');
      chatHistory.push({ role: 'assistant', content: GREETING_MESSAGE });
    }
    updateAIChatComposerState();
    persistAIChatSessionState();
  }

  async function initializeComparisonView(options = {}) {
    const restoreSaved = options.restoreSaved === true;
    const resume = options.resume || resumeData;
    if (compareResult) {
      compareResult.style.display = 'none';
      compareResult.innerHTML = '';
    }

    const selectedCompareHistoryId = getResumeCompareHistoryId(resume);
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

    if (char1Inp) char1Inp.value = selectedComparison.metadata?.char1 || resume?.char1 || '';
    if (char2Inp) char2Inp.value = selectedComparison.metadata?.char2 || resume?.char2 || '';
    compareResult.style.display = 'block';
    compareResult.innerHTML = `<strong>Análise de Combate:</strong><br><br>${formatAIResponse(normalizeBrokenEncoding(selectedComparison.content || ''))}`;
  }

  async function initializeVisionView(options = {}) {
    const restoreSaved = options.restoreSaved === true;
    const resume = options.resume || resumeData;

    if (visionOutput) {
      visionOutput.textContent = 'Aguardando imagem...';
    }

    if (!restoreSaved) {
      setVisionFile(null);
      return;
    }

    const selectedVisionHistoryId = getResumeVisionHistoryId(resume);
    if (!selectedVisionHistoryId || !visionOutput) {
      setVisionFile(null);
      return;
    }

    const persisted = await loadAIHistoryMessages({
      context: 'vision',
      metadataContains: { historyContentId: selectedVisionHistoryId },
      limit: 20
    });
    const selectedAnalysis = persisted.find(msg => msg.role === 'assistant');
    const selectedUpload = persisted.find((msg) => (
      msg.role === 'user'
      && typeof msg?.metadata?.imageDataUrl === 'string'
      && msg.metadata.imageDataUrl.startsWith('data:image')
    ));
    if (!selectedAnalysis) {
      setVisionFile(null);
      return;
    }

    setVisionFile(
      {
        name: selectedAnalysis.metadata?.fileName || 'imagem-restaurada',
        type: selectedAnalysis.metadata?.fileType || 'image/*',
        size: Number(selectedAnalysis.metadata?.fileSize || 0)
      },
      {
        fileInfo: 'Resultado restaurado do histórico',
        previewUrl: selectedAnalysis?.metadata?.imageDataUrl || selectedUpload?.metadata?.imageDataUrl || ''
      }
    );
    renderVisionResult(selectedAnalysis.content || '');
  }

  async function openConversationFromHistory(nextResume) {
    const resumeType = getResumeType(nextResume);
    if (!resumeType) return false;

    resumeData = nextResume || null;

    if (resumeType === 'ai_chat') {
      await initializeChatView({ restoreSaved: true, resume: nextResume });
      activateToolTab('chat');
      updateChatScrollInfo();
      return true;
    }

    if (resumeType === 'ai_compare') {
      await initializeComparisonView({ restoreSaved: true, resume: nextResume });
      activateToolTab('compare');
      return true;
    }

    if (resumeType === 'ai_vision') {
      await initializeVisionView({ restoreSaved: true, resume: nextResume });
      activateToolTab('vision');
      return true;
    }

    return false;
  }

  async function initializeComparisonView(options = {}) {
    const restoreSaved = options.restoreSaved === true;
    const resume = options.resume || resumeData;
    if (compareResult) {
      compareResult.style.display = 'none';
      compareResult.innerHTML = '';
    }

    const selectedCompareHistoryId = getResumeCompareHistoryId(resume);
    if (!restoreSaved || !compareResult || !selectedCompareHistoryId) {
      return;
    }

    const persisted = await loadAIHistoryMessages({
      context: 'compare',
      metadataContains: { historyContentId: selectedCompareHistoryId },
      limit: 20
    });
    const selectedComparison = persisted.find(msg => msg.role === 'assistant');
    const fallbackAnalysis = normalizeBrokenEncoding(
      resume?.analysis
      || resume?.resumeSubtitle
      || ''
    );

    if (char1Inp) char1Inp.value = selectedComparison?.metadata?.char1 || resume?.char1 || '';
    if (char2Inp) char2Inp.value = selectedComparison?.metadata?.char2 || resume?.char2 || '';
    if (!selectedComparison && !fallbackAnalysis) {
      return;
    }

    renderComparisonResult(selectedComparison?.content || fallbackAnalysis);
  }

  async function initializeVisionView(options = {}) {
    const restoreSaved = options.restoreSaved === true;
    const resume = options.resume || resumeData;

    if (visionOutput) {
      visionOutput.textContent = 'Aguardando imagem...';
    }

    if (!restoreSaved) {
      setVisionFile(null);
      return;
    }

    const selectedVisionHistoryId = getResumeVisionHistoryId(resume);
    if (!selectedVisionHistoryId || !visionOutput) {
      setVisionFile(null);
      return;
    }

    const persisted = await loadAIHistoryMessages({
      context: 'vision',
      metadataContains: { historyContentId: selectedVisionHistoryId },
      limit: 20
    });
    const selectedAnalysis = persisted.find(msg => msg.role === 'assistant');
    const selectedUpload = persisted.find((msg) => (
      msg.role === 'user'
      && typeof msg?.metadata?.imageDataUrl === 'string'
      && msg.metadata.imageDataUrl.startsWith('data:image')
    ));
    const fallbackVisionText = normalizeBrokenEncoding(
      resume?.description
      || resume?.resumeSubtitle
      || ''
    );
    const fallbackPreviewUrl = (typeof resume?.imageDataUrl === 'string' && resume.imageDataUrl.startsWith('data:image'))
      ? resume.imageDataUrl
      : '';

    if (!selectedAnalysis && !fallbackVisionText) {
      setVisionFile(null);
      return;
    }

    setVisionFile(
      {
        name: selectedAnalysis?.metadata?.fileName || resume?.fileName || 'imagem-restaurada',
        type: selectedAnalysis?.metadata?.fileType || resume?.fileType || 'image/*',
        size: Number(selectedAnalysis?.metadata?.fileSize || resume?.fileSize || 0)
      },
      {
        fileInfo: 'Resultado restaurado do historico',
        previewUrl: selectedAnalysis?.metadata?.imageDataUrl
          || selectedUpload?.metadata?.imageDataUrl
          || fallbackPreviewUrl
      }
    );
    renderVisionResult(selectedAnalysis?.content || fallbackVisionText);
  }

  async function callAI(prompt, options = {}) {
    const target = 'openrouter';
    const model = options.model || DEFAULT_GROQ_MODEL;
    const useChatContext = options.useChatContext !== false;
    const persistToAIHistory = options.persistToAIHistory !== false;
    const context = options.context || 'chat';
    const metadata = { ...(options.metadata || {}) };
    const systemPrompt = options.systemPrompt || SYSTEM_PROMPT;
    let chatUserEntry = options.existingUserEntry || null;
    let chatAssistantEntry = null;
    let lastMsgElement = null;

    if (context === 'chat') {
      currentChatThreadId = metadata.threadId || currentChatThreadId || buildUniqueId('open_anime_chat_thread');
      metadata.threadId = currentChatThreadId;
    }

    if (context === 'compare') {
      metadata.historyContentId = metadata.historyContentId || buildComparisonHistoryContentId(metadata);
    }

    try {
      if (useChatContext) {
        if (chatUserEntry) {
          chatUserEntry.content = prompt;
          chatUserEntry.context = context;
          chatUserEntry.metadata = { ...metadata };
          if (!chatHistory.includes(chatUserEntry)) {
            chatHistory.push(chatUserEntry);
          }
        } else {
          chatUserEntry = { role: 'user', content: prompt, context, metadata: { ...metadata } };
          chatHistory.push(chatUserEntry);
        }
        persistAIChatSessionState();
      }

      if (persistToAIHistory) {
        const persistedUserEntry = await saveAIHistoryMessageRecord({ role: 'user', content: prompt, context, metadata });
        if (chatUserEntry && persistedUserEntry) {
          Object.assign(chatUserEntry, persistedUserEntry);
          persistAIChatSessionState();
        }
      }

      const requestMessages = useChatContext
        ? chatHistory.map(({ role, content }) => ({ role, content }))
        : [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }];

      chatAssistantEntry = null;
      lastMsgElement = null;

      if (useChatContext) {
        chatAssistantEntry = { role: 'assistant', content: '...', context, metadata: { ...metadata } };
        chatHistory.push(chatAssistantEntry);
        renderChatFromMessages(chatHistory);
        lastMsgElement = chatWindow ? chatWindow.lastElementChild : null;
        if (lastMsgElement) {
           const contentDiv = lastMsgElement.querySelector('.msg-content');
           if (contentDiv) contentDiv.innerHTML = '<i><span style="opacity: 0.7;">Gerando resposta</span><span class="typing-dots"></span></i>';
        }
      }

      const aiResponse = await requestAIText(requestMessages, {
        target,
        model,
        context,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        stream: useChatContext,
        onChunk: (chunk, fullText) => {
          if (chatAssistantEntry && lastMsgElement && lastMsgElement.classList.contains('bot')) {
            chatAssistantEntry.content = fullText;
            const contentDiv = lastMsgElement.querySelector('.msg-content');
            if (contentDiv) {
              contentDiv.innerHTML = formatAIResponse(normalizeBrokenEncoding(fullText));
              const copyBtn = lastMsgElement.querySelector('.msg-copy-btn');
              if (copyBtn) copyBtn.dataset.rawText = fullText;
              if (chatWindow) {
                const isNearBottom = chatWindow.scrollHeight - chatWindow.scrollTop - chatWindow.clientHeight < 150;
                if (isNearBottom) chatWindow.scrollTo({ top: chatWindow.scrollHeight });
              }
            }
          }
        }
      });

      if (useChatContext && chatAssistantEntry) {
        chatAssistantEntry.content = aiResponse;
        persistAIChatSessionState();
        if (lastMsgElement) {
          const contentDiv = lastMsgElement.querySelector('.msg-content');
          if (contentDiv) contentDiv.innerHTML = formatAIResponse(normalizeBrokenEncoding(aiResponse));
          let copyBtn = lastMsgElement.querySelector('.msg-copy-btn');
          if (!copyBtn) {
            copyBtn = document.createElement('button');
            copyBtn.className = 'msg-copy-btn';
            copyBtn.type = 'button';
            copyBtn.title = 'Copiar mensagem';
            copyBtn.setAttribute('aria-label', 'Copiar mensagem');
            copyBtn.dataset.feedbackMessage = 'Resposta copiada';
            updateCopyButton(copyBtn, false);
            copyBtn.addEventListener('click', () => copyText(copyBtn.dataset.rawText, copyBtn));
            lastMsgElement.appendChild(copyBtn);
          }
          copyBtn.dataset.rawText = aiResponse;
        }
      }

      if (persistToAIHistory) {
        const persistedAssistantEntry = await saveAIHistoryMessageRecord({ role: 'assistant', content: aiResponse, context, metadata });
        if (chatAssistantEntry && persistedAssistantEntry) {
          Object.assign(chatAssistantEntry, persistedAssistantEntry);
          persistAIChatSessionState();
        }

        if (typeof HistoryTracker !== 'undefined') {
          const isCompare = context === 'compare';
          HistoryTracker.track({
            contentId: isCompare ? metadata.historyContentId : currentChatThreadId,
            contentType: isCompare ? 'ai_compare' : 'ai_chat',
            title: isCompare
              ? `Comparação IA - ${metadata.char1 || ''} vs ${metadata.char2 || ''}`
              : buildAIThreadHistoryTitle(prompt),
            subtitle: aiResponse.slice(0, 120),
            route: 'open-anime.html',
            payload: {
              mediaType: isCompare ? 'ai_compare' : 'ai_chat',
              tab: isCompare ? 'compare' : 'chat',
              threadId: isCompare ? '' : currentChatThreadId,
              historyContentId: isCompare ? metadata.historyContentId : '',
              analysis: isCompare ? aiResponse : '',
              char1: metadata.char1 || '',
              char2: metadata.char2 || ''
            }
          });
        }
      }

      return aiResponse;
    } catch (e) {
      console.error(e);
      const errorMsg = 'Falha: ' + e.message + '. Tente novamente.';
      if (useChatContext && chatAssistantEntry) {
        chatAssistantEntry.content = errorMsg;
        if (lastMsgElement) {
           const contentDiv = lastMsgElement.querySelector('.msg-content');
           if (contentDiv) contentDiv.innerHTML = formatAIResponse(errorMsg);
        }
      } else if (useChatContext && chatUserEntry && chatHistory[chatHistory.length - 1] === chatUserEntry) {
        chatHistory.pop();
      }
      persistAIChatSessionState();
      updateLastUserMessageButtons();
      return errorMsg;
    }
  }

  async function saveEditedAIChatTurn(nextPrompt) {
    if (!activeChatEditState || isSendingChat) return;

    const turn = getLastUndoableChatTurn();
    if (!turn) {
      clearAIChatEditState({ restoreDraft: true });
      showFeedback('Nao foi possivel localizar a ultima pergunta para editar');
      return;
    }

    const userMessage = chatHistory[turn.userIndex];
    const assistantMessage = turn.assistantIndex >= 0 ? chatHistory[turn.assistantIndex] : null;
    if (!userMessage || userMessage.role !== 'user') return;

    if (
      activeChatEditState.userMessageId
      && String(activeChatEditState.userMessageId) !== String(userMessage.id || '')
    ) {
      clearAIChatEditState({ restoreDraft: true });
      showFeedback('A ultima pergunta mudou. Abra a edicao novamente');
      return;
    }

    const updatedPrompt = normalizeBrokenEncoding(nextPrompt).trim();
    if (!updatedPrompt) return;

    const previousHistory = chatHistory.map((message) => ({
      ...message,
      metadata: message?.metadata && typeof message.metadata === 'object'
        ? { ...message.metadata }
        : message?.metadata
    }));
    const previousDraft = activeChatEditState.previousDraft || '';

    isSendingChat = true;
    sendBtn.disabled = true;
    updateAIChatComposerState();

    let nextAssistantEntry = { role: 'assistant', content: '...', context: 'chat', metadata: { ...(userMessage.metadata || {}), threadId: currentChatThreadId } };
    let lastMsgElement = null;

    try {
      userMessage.content = updatedPrompt;
      chatHistory = chatHistory.filter((_, index) => index !== turn.assistantIndex);
      chatHistory.push(nextAssistantEntry);
      
      renderChatFromMessages(chatHistory);
      updateChatScrollInfo();
      persistAIChatSessionState({ draft: updatedPrompt });

      lastMsgElement = chatWindow ? chatWindow.lastElementChild : null;
      if (lastMsgElement) {
         const contentDiv = lastMsgElement.querySelector('.msg-content');
         if (contentDiv) contentDiv.innerHTML = '<i><span style="opacity: 0.7;">Atualizando resposta</span><span class="typing-dots"></span></i>';
      }

      if (userMessage.id) {
        const updatedUserRecord = await updateAIHistoryMessageRecord(userMessage.id, { content: updatedPrompt });
        if (updatedUserRecord) {
          Object.assign(userMessage, updatedUserRecord);
        }
      }

      const requestMessages = chatHistory.filter(m => m !== nextAssistantEntry).map(({ role, content }) => ({ role, content }));
      const aiResponse = await requestAIText(requestMessages, {
        target: 'openrouter',
        model: DEFAULT_GROQ_MODEL,
        context: 'chat',
        stream: true,
        onChunk: (chunk, fullText) => {
           if (nextAssistantEntry && lastMsgElement && lastMsgElement.classList.contains('bot')) {
             nextAssistantEntry.content = fullText;
             const contentDiv = lastMsgElement.querySelector('.msg-content');
             if (contentDiv) {
                contentDiv.innerHTML = formatAIResponse(normalizeBrokenEncoding(fullText));
                const copyBtn = lastMsgElement.querySelector('.msg-copy-btn');
                if (copyBtn) copyBtn.dataset.rawText = fullText;
                chatWindow.scrollTo({ top: chatWindow.scrollHeight });
             }
           }
        }
      });

      nextAssistantEntry.content = aiResponse;

      if (assistantMessage?.id) {
        const nextAssistantEntryDb = await updateAIHistoryMessageRecord(assistantMessage.id, { content: aiResponse });
        if (nextAssistantEntryDb) Object.assign(nextAssistantEntry, nextAssistantEntryDb);
      } else {
        const nextAssistantEntryDb = await saveAIHistoryMessageRecord({
          role: 'assistant',
          content: aiResponse,
          context: 'chat',
          metadata: nextAssistantEntry.metadata
        });
        if (nextAssistantEntryDb) Object.assign(nextAssistantEntry, nextAssistantEntryDb);
      }

      if (lastMsgElement) {
        const contentDiv = lastMsgElement.querySelector('.msg-content');
        if (contentDiv) contentDiv.innerHTML = formatAIResponse(normalizeBrokenEncoding(aiResponse));
        let copyBtn = lastMsgElement.querySelector('.msg-copy-btn');
        if (!copyBtn) {
          copyBtn = document.createElement('button');
          copyBtn.className = 'msg-copy-btn';
          copyBtn.type = 'button';
          copyBtn.title = 'Copiar mensagem';
          copyBtn.setAttribute('aria-label', 'Copiar mensagem');
          copyBtn.dataset.feedbackMessage = 'Resposta copiada';
          updateCopyButton(copyBtn, false);
          copyBtn.addEventListener('click', () => copyText(copyBtn.dataset.rawText, copyBtn));
          lastMsgElement.appendChild(copyBtn);
        }
        copyBtn.dataset.rawText = aiResponse;
      }

      clearAIChatEditState();
      persistAIChatSessionState();
      await syncAIThreadHistoryCard(updatedPrompt, aiResponse);
      showFeedback('Pergunta atualizada');
    } catch (error) {
      console.error('Erro ao editar mensagem da IA:', error);
      chatHistory = previousHistory;
      renderChatFromMessages(chatHistory);
      updateChatScrollInfo();
      if (chatInput) {
        chatInput.value = updatedPrompt;
      }
      if (activeChatEditState) {
        activeChatEditState.previousDraft = previousDraft;
      }
      updateAIChatComposerState();
      persistAIChatSessionState({ draft: updatedPrompt });
      showFeedback('Falha: ' + error.message);
    } finally {
      isSendingChat = false;
      sendBtn.disabled = false;
      updateChatScrollInfo();
      updateAIChatComposerState();
      updateLastUserMessageButtons();
    }
  }

  async function resendLastAIChatTurn() {
    if (isSendingChat) return;

    if (isAIChatEditing()) {
      showFeedback('Salve ou cancele a edicao antes de reenviar');
      return;
    }

    const turn = getLastUndoableChatTurn();
    if (!turn) {
      showFeedback('Nao ha pergunta recente para reenviar');
      return;
    }

    const userMessage = chatHistory[turn.userIndex];
    const assistantMessage = turn.assistantIndex >= 0 ? chatHistory[turn.assistantIndex] : null;
    const prompt = normalizeBrokenEncoding(userMessage?.content || '').trim();
    if (!userMessage || userMessage.role !== 'user' || !prompt) return;

    const previousHistory = chatHistory.map((message) => ({
      ...message,
      metadata: message?.metadata && typeof message.metadata === 'object'
        ? { ...message.metadata }
        : message?.metadata
    }));
    const preservedDraft = String(chatInput?.value || '');

    isSendingChat = true;
    sendBtn.disabled = true;
    updateAIChatComposerState();

    let nextAssistantEntry = { role: 'assistant', content: '...', context: 'chat', metadata: { ...(userMessage.metadata || {}), threadId: currentChatThreadId } };
    let lastMsgElement = null;

    try {
      chatHistory = chatHistory.filter((_, index) => index !== turn.assistantIndex);
      chatHistory.push(nextAssistantEntry);
      
      renderChatFromMessages(chatHistory);
      updateChatScrollInfo();
      persistAIChatSessionState({ draft: preservedDraft });

      lastMsgElement = chatWindow ? chatWindow.lastElementChild : null;
      if (lastMsgElement) {
         const contentDiv = lastMsgElement.querySelector('.msg-content');
         if (contentDiv) contentDiv.innerHTML = '<i><span style="opacity: 0.7;">Reenviando resposta</span><span class="typing-dots"></span></i>';
      }

      const requestMessages = chatHistory.filter(m => m !== nextAssistantEntry).map(({ role, content }) => ({ role, content }));
      const aiResponse = await requestAIText(requestMessages, {
        target: 'openrouter',
        model: DEFAULT_GROQ_MODEL,
        context: 'chat',
        stream: true,
        onChunk: (chunk, fullText) => {
           if (nextAssistantEntry && lastMsgElement && lastMsgElement.classList.contains('bot')) {
             nextAssistantEntry.content = fullText;
             const contentDiv = lastMsgElement.querySelector('.msg-content');
             if (contentDiv) {
                contentDiv.innerHTML = formatAIResponse(normalizeBrokenEncoding(fullText));
                const copyBtn = lastMsgElement.querySelector('.msg-copy-btn');
                if (copyBtn) copyBtn.dataset.rawText = fullText;
                chatWindow.scrollTo({ top: chatWindow.scrollHeight });
             }
           }
        }
      });

      nextAssistantEntry.content = aiResponse;

      if (assistantMessage?.id) {
        const nextAssistantEntryDb = await updateAIHistoryMessageRecord(assistantMessage.id, { content: aiResponse });
        if (nextAssistantEntryDb) Object.assign(nextAssistantEntry, nextAssistantEntryDb);
      } else {
        const nextAssistantEntryDb = await saveAIHistoryMessageRecord({
          role: 'assistant',
          content: aiResponse,
          context: 'chat',
          metadata: nextAssistantEntry.metadata
        });
        if (nextAssistantEntryDb) Object.assign(nextAssistantEntry, nextAssistantEntryDb);
      }

      if (lastMsgElement) {
        const contentDiv = lastMsgElement.querySelector('.msg-content');
        if (contentDiv) contentDiv.innerHTML = formatAIResponse(normalizeBrokenEncoding(aiResponse));
        let copyBtn = lastMsgElement.querySelector('.msg-copy-btn');
        if (!copyBtn) {
          copyBtn = document.createElement('button');
          copyBtn.className = 'msg-copy-btn';
          copyBtn.type = 'button';
          copyBtn.title = 'Copiar mensagem';
          copyBtn.setAttribute('aria-label', 'Copiar mensagem');
          copyBtn.dataset.feedbackMessage = 'Resposta copiada';
          updateCopyButton(copyBtn, false);
          copyBtn.addEventListener('click', () => copyText(copyBtn.dataset.rawText, copyBtn));
          lastMsgElement.appendChild(copyBtn);
        }
        copyBtn.dataset.rawText = aiResponse;
      }

      persistAIChatSessionState({ draft: preservedDraft });
      await syncAIThreadHistoryCard(prompt, aiResponse);
      showFeedback('Resposta reenviada');
    } catch (error) {
      console.error('Erro ao reenviar resposta da IA:', error);
      chatHistory = previousHistory;
      renderChatFromMessages(chatHistory);
      updateChatScrollInfo();
      if (chatInput) {
        chatInput.value = preservedDraft;
      }
      persistAIChatSessionState({ draft: preservedDraft });
      showFeedback('Falha: ' + error.message);
    } finally {
      isSendingChat = false;
      sendBtn.disabled = false;
      updateChatScrollInfo();
      updateAIChatComposerState();
      updateLastUserMessageButtons();
    }
  }

  async function callVisionAI(file, options = {}) {
    const persistToAIHistory = options.persistToAIHistory !== false;
    const context = 'vision';
    const metadata = {
      ...(options.metadata || {}),
      fileName: file?.name || 'imagem',
      fileType: file?.type || 'image/*',
      fileSize: Number(file?.size || 0)
    };
    metadata.historyContentId = metadata.historyContentId || buildVisionHistoryContentId(metadata);

    const base64Image = await readFileAsDataUrl(file);
    const metadataWithPreview = { ...metadata, imageDataUrl: base64Image };
    const requestedModel = options.model || DEFAULT_VISION_MODEL;
    const maxRetriesPerModel = 2;
    const visionRequestPlan = [
      {
        target: 'openrouter',
        models: ['google/gemini-2.0-flash-exp:free', 'openrouter/auto', 'meta-llama/llama-3.2-11b-vision-instruct:free']
      },
      {
        target: 'cloudflare-vision',
        models: Array.from(new Set([requestedModel, DEFAULT_VISION_MODEL].filter(Boolean)))
      },
      {
        target: 'gemini',
        models: Array.from(new Set([
          ...GEMINI_VISION_MODEL_FALLBACKS,
          DEFAULT_GEMINI_VISION_MODEL,
          DEFAULT_GEMINI_MODEL
        ].filter(Boolean)))
      }
    ];

    async function requestVisionText(promptText) {
      let lastError = null;

      for (let providerIndex = 0; providerIndex < visionRequestPlan.length; providerIndex += 1) {
        const providerPlan = visionRequestPlan[providerIndex];
        const { target, models } = providerPlan;

        for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
          const selectedModel = models[modelIndex];

          for (let attempt = 0; attempt < maxRetriesPerModel; attempt += 1) {
            let requestBody;
            if (target === 'gemini') {
              requestBody = {
                model: selectedModel,
                messages: [{ role: 'user', content: promptText }],
                image: base64Image,
                max_tokens: Number(options.max_tokens) || VISION_MAX_TOKENS
              };
            } else if (target === 'openrouter') {
              requestBody = {
                model: selectedModel,
                messages: [
                  {
                    role: 'user',
                    content: [
                      { type: 'text', text: promptText },
                      { type: 'image_url', image_url: { url: base64Image } }
                    ]
                  }
                ],
                max_tokens: Number(options.max_tokens) || VISION_MAX_TOKENS
              };
            } else {
              requestBody = {
                model: selectedModel,
                prompt: promptText,
                image: base64Image,
                max_tokens: Number(options.max_tokens) || VISION_MAX_TOKENS
              };
            }

            const res = await fetch('/api/ai/proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                target,
                body: requestBody
              })
            });

            const result = await res.json().catch(() => ({}));
            if (res.ok) {
              const text = normalizeBrokenEncoding(extractVisionText(result));
              if (!text) {
                lastError = new Error('A IA não retornou uma descrição utilizável para esta imagem.');
              } else {
                return text;
              }
            } else {
              const erroMsg = normalizeBrokenEncoding(
                typeof result.error === 'object'
                  ? (result.error.message || JSON.stringify(result.error))
                  : (result.error || '')
              );
              lastError = new Error(erroMsg || ('Erro HTTP ' + res.status));
            }

            if (!isTemporaryModelOverload(res.status, lastError?.message || '')) {
              console.error(`[Vision AI] O provedor '${target}' retornou um erro e não pôde concluir:`, lastError);
              break;
            }

            const hasRetryInCurrentModel = attempt < (maxRetriesPerModel - 1);
            if (hasRetryInCurrentModel) {
              await sleep(700 * (attempt + 1));
              continue;
            }

            const hasFallbackModel = modelIndex < (models.length - 1);
            if (hasFallbackModel) {
              await sleep(450);
              break;
            }
          }
        }
      }

      throw (lastError || new Error('Falha ao analisar a imagem.'));
    }

    try {
      if (persistToAIHistory) {
        await saveAIHistoryMessage({
          role: 'user',
          content: `Imagem enviada: ${metadata.fileName}`,
          context,
          metadata: metadataWithPreview
        });
      }

      let finalPrompt = VISION_PROMPT;
      if (options.customPrompt && options.customPrompt.trim()) {
        finalPrompt = `[PERGUNTA DO USUÁRIO SOBRE A IMAGEM]:\n"${options.customPrompt.trim()}"\n\n[DIRETRIZES DO SISTEMA E DETETIVE VISUAL]:\n${VISION_PROMPT}`;
      }

      let aiResponse = await requestVisionText(finalPrompt);

      if (false) { // aiResponse.length < VISION_MIN_COMPLETION_CHARS
        try {
          const refinementPrompt = [
            finalPrompt,
            '',
            'A resposta anterior ficou curta.',
            'Refaça com mais profundidade, cobrindo todos os tópicos com mais detalhes e sem resumir demais.'
          ].join('\n');
          const refined = await requestVisionText(refinementPrompt);
          if (refined && refined.length > aiResponse.length) {
            aiResponse = refined;
          }
        } catch (refinementError) {
          console.warn('Refinamento de visão não aplicado:', refinementError?.message || refinementError);
        }
      }

      if (persistToAIHistory) {
        await saveAIHistoryMessage({ role: 'assistant', content: aiResponse, context, metadata });

        if (typeof HistoryTracker !== 'undefined') {
          HistoryTracker.track({
            contentId: metadata.historyContentId,
            contentType: 'ai_vision',
            title: `IA - Imagem ${metadata.fileName}`,
            subtitle: aiResponse.slice(0, 220),
            route: 'open-anime.html',
            payload: {
              mediaType: 'ai_vision',
              tab: 'vision',
              historyContentId: metadata.historyContentId,
              fileName: metadata.fileName,
              fileType: metadata.fileType || '',
              fileSize: metadata.fileSize || 0,
              description: aiResponse
            }
          });
        }
      }

      return { aiResponse, base64Image, metadata };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  const shouldRestoreSavedChat = resumeData?.mediaType === 'ai_chat'
    || resumeData?.contentType === 'ai_chat';
  const shouldRestoreSavedCompare = resumeData?.mediaType === 'ai_compare'
    || resumeData?.contentType === 'ai_compare';
  const shouldRestoreSavedVision = resumeData?.mediaType === 'ai_vision'
    || resumeData?.contentType === 'ai_vision';

  if (!shouldRestoreSavedChat) {
    clearAIChatSessionState();
  }

  await initializeChatView({ restoreSaved: shouldRestoreSavedChat });
  await initializeComparisonView({ restoreSaved: shouldRestoreSavedCompare });
  await initializeVisionView({ restoreSaved: shouldRestoreSavedVision });
  updateThemeInfo();
  updateChatScrollInfo();

  const initialTab = shouldRestoreSavedVision || resumeData?.tab === 'vision'
    ? 'vision'
    : ((shouldRestoreSavedCompare || resumeData?.tab === 'compare') ? 'compare' : 'chat');
  activateToolTab(initialTab);

  if (toggleInfoCardBtn && infoCard) {
    toggleInfoCardBtn.addEventListener('click', () => {
      // Usar getComputedStyle para detectar o estado real, independente de como foi definido
      const currentDisplay = window.getComputedStyle(infoCard).display;
      if (currentDisplay === 'none') {
        infoCard.style.display = 'block';
        // Scroll suave para mostrar o conteúdo expandido se necessário
        infoCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        infoCard.style.display = 'none';
      }
    });
  }

  if (chatWindow) {
    chatWindow.addEventListener('scroll', updateChatScrollInfo);
  }

  window.addEventListener('storage', updateThemeInfo);
  
  // Listener direto para clique em opções de tema
  document.addEventListener('click', (event) => {
    if (event.target.closest('.theme-opt-btn')) {
      updateThemeInfo();
    }
  });

  // Listener para mudança de tema via data attribute ou outras formas
  document.addEventListener('change', (event) => {
    if (event.target.closest('[data-theme]') || event.target.classList.contains('theme-opt-btn')) {
      updateThemeInfo();
    }
  });

  // Monitorar mudanças de classe no document para capturar mudanças de tema em tempo real
  if (typeof MutationObserver !== 'undefined') {
    const themeObserver = new MutationObserver(() => {
      updateThemeInfo();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  window.addEventListener('historytracker:resume', async (event) => {
    const handled = await openConversationFromHistory(event?.detail || null);
    if (handled) {
      showFeedback('Conversa aberta do historico');
    }
  });

  window.addEventListener('popstate', async (event) => {
    const handled = await openConversationFromHistory(event?.state?.historyTrackerResume || null);
    if (handled) {
      showFeedback('Conversa restaurada');
    }
  });

  async function handleChatSend() {
    if (getActiveToolTab() !== 'chat' || isSendingChat) return;

    if (window.supabaseClient) {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (!session) {
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
    }

    const val = chatInput.value.trim();
    if (!val) return;

    if (isAIChatEditing()) {
      await saveEditedAIChatTurn(val);
      return;
    }

    currentChatThreadId = currentChatThreadId || buildUniqueId('open_anime_chat_thread');
    const localEchoId = buildUniqueId('pending_user');
    const optimisticUserEntry = {
      id: localEchoId,
      role: 'user',
      content: val,
      context: 'chat',
      metadata: { threadId: currentChatThreadId, localEchoId }
    };
    chatHistory.push(optimisticUserEntry);
    renderChatFromMessages(chatHistory);
    persistAIChatSessionState({ draft: '' });
    chatInput.value = '';
    chatInput.style.height = 'auto';
    isSendingChat = true;
    sendBtn.disabled = true;
    updateAIChatComposerState();

    try {
      await callAI(val, {
        useChatContext: true,
        persistToAIHistory: true,
        context: 'chat',
        existingUserEntry: optimisticUserEntry
      });
    } finally {
      isSendingChat = false;
      sendBtn.disabled = false;
      updateChatScrollInfo();
      updateAIChatComposerState();
      updateLastUserMessageButtons();
      persistAIChatSessionState();
    }
  }

  sendBtn.addEventListener('click', handleChatSend);

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatSend();
      }
    });

    chatInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
  }

  if (cancelChatEditBtn) {
    cancelChatEditBtn.addEventListener('click', () => {
      clearAIChatEditState({ restoreDraft: true });
      renderChatFromMessages(chatHistory);
      updateChatScrollInfo();
    });
  }

  async function handleVisionSelection(file) {
    if (!file) return;

    const previewUrl = await readFileAsDataUrl(file);
    setVisionFile(file, {
      previewUrl,
      fileInfo: `${file.type || 'image/*'} - ${formatFileSize(file.size)}`
    });
    renderVisionResult('Imagem pronta para análise. Clique em "Analisar imagem".');
  }

  if (visionUpload) {
    visionUpload.addEventListener('change', async (event) => {
      if (window.supabaseClient) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
          window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          visionUpload.value = '';
          return;
        }
      }
      
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        await handleVisionSelection(file);
      } catch (error) {
        console.error(error);
        clearVisionSelection({ keepOutput: true });
        renderVisionResult('Falha ao carregar a imagem selecionada.');
      }
    });
  }

  if (visionChooseAnotherBtn && visionUpload) {
    visionChooseAnotherBtn.addEventListener('click', () => {
      visionUpload.value = '';
      visionUpload.click();
    });
  }

  if (visionClearBtn) {
    visionClearBtn.addEventListener('click', () => {
      clearVisionSelection({ outputText: 'Imagem removida. Escolha outra imagem para analisar.' });
      showFeedback('Imagem removida');
    });
  }

  if (visionDropZone) {
    ['dragenter', 'dragover'].forEach((eventName) => {
      visionDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        visionDropZone.classList.add('is-ready');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      visionDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (!selectedVisionFile || eventName === 'drop') {
          visionDropZone.classList.remove('is-ready');
        }
      });
    });

    visionDropZone.addEventListener('drop', async (event) => {
      if (window.supabaseClient) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
          window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }
      }

      const file = event.dataTransfer?.files?.[0];
      if (!file || !String(file.type || '').startsWith('image/')) {
        showFeedback('Solte apenas arquivos de imagem');
        return;
      }

      try {
        await handleVisionSelection(file);
      } catch (error) {
        console.error(error);
        clearVisionSelection({ keepOutput: true });
        renderVisionResult('Falha ao carregar a imagem arrastada.');
      }
    });
  }

  if (visionAnalyzeBtn) {
    visionAnalyzeBtn.addEventListener('click', async () => {
      if (!selectedVisionFile) {
        showFeedback('Escolha uma imagem antes de analisar');
        return;
      }

      const visionPromptInput = document.getElementById('visionPromptInput');
      const customPrompt = visionPromptInput ? visionPromptInput.value.trim() : '';

      visionAnalyzeBtn.disabled = true;
      const visionOutputContainer = document.getElementById('visionOutputContainer');
      if (visionOutputContainer) visionOutputContainer.hidden = false;
      renderVisionResult('Analisando a imagem e a sua pergunta...');

      try {
        const { aiResponse } = await callVisionAI(selectedVisionFile, {
          persistToAIHistory: true,
          customPrompt: customPrompt,
          metadata: {
            fileName: selectedVisionFile.name,
            fileType: selectedVisionFile.type,
            fileSize: selectedVisionFile.size,
            customPrompt: customPrompt
          }
        });

        renderVisionResult(aiResponse);
      } catch (error) {
        renderVisionResult(`Falha: ${error.message}. Verifique o terminal do servidor para mais detalhes.`);
      } finally {
        visionAnalyzeBtn.disabled = false;
      }
    });
  }

  compareBtn.addEventListener('click', async () => {
    if (getActiveToolTab() !== 'compare') return;

    if (window.supabaseClient) {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (!session) {
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
    }

    const c1 = char1Inp.value.trim();
    const c2 = char2Inp.value.trim();
    if (!c1 || !c2) return showToast('Digite dois nomes para comparar', 'error');
    if (isComparing) return;
    const compareHistoryId = buildComparisonHistoryContentId({ char1: c1, char2: c2 });

    compareResult.style.display = 'block';
    compareResult.innerHTML = 'Analisando poderes, história e habilidades...';
    isComparing = true;
    compareBtn.disabled = true;

    const compareSystemPrompt = 'Você é um analista especialista em batalhas entre todos os personagens do mundo do entretenimento (Animes, Desenhos, Filmes, Mangás e HQs em geral). Sua missão é fazer análises precisas, detalhadas e justas, respeitando as lógicas, níveis de poder, lore e cânones dos universos ocidentais e orientais, incluindo páginas de mangás e HQs. Faça comparações profundas de habilidades, intelecto e feitos. Seja um pouco mais direto e conciso na escrita para DIMINUIR A QUANTIDADE DE CONTEÚDO, mas MANTENHA EXATAMENTE TODA A ESTRUTURA MARKDOWN OBRIGATÓRIA solicitada. Seja vibrante, técnico e enxuto nas explicações.';
    const prompt = [
      `Faça uma análise de batalha completa e aprofundada: ${c1} vs ${c2}.`,
      'Formato obrigatório da resposta (Markdown):',
      '## Panorama geral',
      '- Apresente brevemente os dois personagens (origem, universo, nível de poder geral).',
      '- Explique em 3-4 linhas quem tem vantagem inicial e por quê.',
      '## Atributos detalhados (nota de 0 a 10 com justificativa)',
      '- **Força física**: cite exemplos canônicos de feitos de força.',
      '- **Velocidade e reflexos**: cite exemplos de movimentos ou reações notáveis.',
      '- **Inteligência tática**: como cada um age sob pressão e em batalha.',
      '- **Resistência e durabilidade**: capacidade de absorver dano e continuar lutando.',
      '- **Habilidades especiais e técnicas únicas**: liste as principais com breve descrição.',
      '- **Controle emocional**: como as emoções afetam o desempenho em combate.',
      '## Cenários de batalha',
      '1. **Duelo direto sem preparo** — quem leva vantagem no impulso inicial?',
      '2. **Duelo com 24h de preparo** — como cada um se prepararia e o que mudaria?',
      '3. **Campo neutro com civis ao redor** — como as limitações morais/táticas afetam o resultado?',
      '## Pontos fracos e vulnerabilidades',
      '- Liste os principais pontos fracos de cada personagem com exemplos.',
      '## Veredito final',
      '- **Vencedor mais provável** e argumentação sólida.',
      '- **Condições em que o azarão pode virar o jogo.**',
      '- **Nível de confiança no veredito (%)** e grau de incerteza.',
      '- **Curiosidade bônus**: algo interessante sobre a rivalidade ou universo dos dois.',
      'Regra: se faltar dado canônico, diga "informação insuficiente" e continue a análise. Nunca deixe uma seção em branco.'
    ].join('\n');

    try {
      const analysis = await callAI(prompt, {
        useChatContext: false,
        persistToAIHistory: true,
        context: 'compare',
        model: DEFAULT_GROQ_MODEL,
        temperature: COMPARE_TEMPERATURE,
        max_tokens: 2500,
        systemPrompt: compareSystemPrompt,
        metadata: { char1: c1, char2: c2, historyContentId: compareHistoryId }
      });

      renderComparisonResult(analysis);
    } finally {
      isComparing = false;
      compareBtn.disabled = false;
    }

    setTimeout(() => {
      compareResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  });

  if (!shouldRestoreSavedCompare) {
    char1Inp.value = '';
    char2Inp.value = '';
  }
});
