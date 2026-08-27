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
  if (!document.getElementById('ai-response-styles')) {
    const style = document.createElement('style');
    style.id = 'ai-response-styles';
    style.textContent = `
      .msg-content {
        line-height: 1.65;
      }
      .msg-content > :first-child {
        margin-top: 0;
      }
      .msg-content > :last-child {
        margin-bottom: 0;
      }
      .msg-content p {
        margin: 0 0 0.85rem;
      }
      .msg-content h2,
      .msg-content h3,
      .msg-content h4,
      .msg-content h5,
      .msg-content h6 {
        margin: 1rem 0 0.55rem;
        line-height: 1.2;
      }
      .msg-content h2 {
        font-size: 1.15rem;
      }
      .msg-content h3 {
        font-size: 1.05rem;
      }
      .msg-content ul,
      .msg-content ol {
        margin: 0.35rem 0 0.9rem 1.25rem;
        padding-left: 1rem;
      }
      .msg-content li {
        margin: 0.2rem 0;
      }
      .msg-content blockquote {
        margin: 0.75rem 0;
        padding: 0.7rem 0.9rem;
        border-left: 3px solid rgba(255, 255, 255, 0.14);
        background: rgba(255, 255, 255, 0.03);
        border-radius: 0 0.6rem 0.6rem 0;
      }
      .msg-content hr {
        border: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.14);
        margin: 1rem 0;
      }
      .msg-content code {
        padding: 0.15rem 0.35rem;
        border-radius: 0.35rem;
        background: rgba(255, 255, 255, 0.08);
        font-size: 0.95em;
      }
      .msg-content pre {
        margin: 0.9rem 0;
        padding: 0.9rem 1rem;
        border-radius: 0.85rem;
        overflow-x: auto;
        background: rgba(7, 14, 24, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .msg-content pre code {
        display: block;
        padding: 0;
        background: transparent;
        white-space: pre;
      }
      .msg-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 0.9rem 0;
        overflow: hidden;
        border-radius: 0.7rem;
      }
      .msg-content th,
      .msg-content td {
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0.55rem 0.7rem;
        vertical-align: top;
      }
      .msg-content th {
        background: rgba(255, 255, 255, 0.05);
      }
      .msg-content a {
        text-decoration: underline;
        text-underline-offset: 0.15em;
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

  const BROKEN_ENCODING_REGEX = /(?:Ãƒ[\u0080-\u00BF]|Ã‚[\u0080-\u00BF]|Ã¢[\u0080-\u00BF]{2}|Ã°Å¸[\u0080-\u00BF]{2}|Ã¯Â¸[\u0080-\u00BF])/

  function normalizeBrokenEncoding(value) {
    const text = String(value ?? '');
    if (!text || !BROKEN_ENCODING_REGEX.test(text)) return text;

    try {
      let decoded = text;
      for (let i = 0; i < 2; i += 1) {
        if (!BROKEN_ENCODING_REGEX.test(decoded) && !decoded.includes('\uFFFD')) break;
        decoded = decodeURIComponent(escape(decoded));
      }
      return decoded.replace(/\uFFFD/g, '');
    } catch {
      return text;
    }
  }

  function sanitizeAIResponseText(value) {
    const text = normalizeBrokenEncoding(String(value ?? ''));
    if (!text) return '';

    return text
      .split(/\r?\n/)
      .filter((line) => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        return !/^(?:user\s+safety|safety(?:\s+rating(?:s)?)?)\s*:\s*.+$/i.test(trimmed);
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function sanitizeVisionResponseText(value) {
    return sanitizeAIResponseText(value)
      .split(/\r?\n/)
      .map((line) => line.replace(/^(#{1,6}\s*)[\p{Extended_Pictographic}\uFE0F\u200D\s]+/gu, '$1'))
      .join('\n')
      .trim();
  }

  const AI_RESPONSE_GUIDE = [
    'IDIOMA OBRIGATÓRIO: responda sempre em português brasileiro (pt-BR), inclusive na primeira mensagem e em todas as ferramentas. Ignore o idioma do modelo, do histórico ou de nomes próprios. Só use outro idioma se o usuário pedir explicitamente.',
    'Use UTF limpo e acentuação correta.',
    'Use Markdown bonito, com títulos curtos, listas objetivas, negrito só quando ajudar e blocos de código apenas quando houver código.',
    'Quando a análise for de comparação, cena, personagem ou imagem, aprofunde mais do que o normal e organize por tópicos claros.',
    'Evite respostas genéricas, repetições e blocos enormes sem estrutura.',
    'Se houver incerteza, diga isso de forma clara e continue a análise com o melhor raciocínio possível.',
    'Não inclua metacomandos nem rótulos técnicos desnecessários na saída final.'
  ].join('\n');
  const SYSTEM_PROMPT = 'Você é o ZenkAI, o assistente virtual super inteligente da Zenkai (que significa "Casa da Animação", lar de todos os estilos: cartoon, 3D, ocidental e oriental, além de mangás e HQs). REGRA DE OURO: Suas respostas devem ser extremamente coerentes, lógicas e baseadas em fatos verídicos de todo o escopo de animações, desenhos, filmes, mangás e HQs mundiais. Você é um especialista dedicado a análises profundas sobre esses temas e tudo relacionado a eles. Nunca alucine ou invente cânones. Ao responder, traga informações extras genuínas, focando em curiosidades, lore, detalhes técnicos de animação/quadrinhos e desenvolvimento de personagens. Seja extremamente amigável, entusiasmado e use alguns emojis pontuais para dar vida à conversa ✨. Use listas, tópicos de Markdown em negrito/itálico e estruture tudo para ficar gostoso de ler, sem blocos de texto gigantescos.';
  const GREETING_MESSAGE = 'Olá! Eu sou o **ZenkAI** 🎬 — seu assistente especialista da Zenkai! Eu conheço tudo sobre entretenimento global: de animes e mangás japoneses a cartoons, HQs e filmes de todo o mundo. Posso recomendar títulos com explicações detalhadas, discutir lore e desenvolvimento de personagens, comparar poderes incríveis ou analisar cenas e quadros. Qual universo vamos explorar hoje?';
  const AI_HISTORY_TABLE = 'ai_chat_messages';
  const AI_HISTORY_LIMIT = 120;
  const DEFAULT_GROQ_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';
  const COMPARE_GROQ_MODEL = 'openrouter/free';
  const COMPARE_FALLBACK_GROQ_MODEL = DEFAULT_GROQ_MODEL;
  const CHAT_MAX_TOKENS = 2400;
  const COMPARE_MAX_TOKENS = 3600;
  const COMPARE_CONTINUATION_MAX_TOKENS = 1600;
  const COMPARE_TEMPERATURE = 0.35;
  const VISION_MAX_TOKENS = 2500;
  const AI_EMPTY_RESPONSE_MESSAGE = 'A IA não retornou uma resposta utilizável.';
  const VISION_PROMPT = [
    'Atue como um detetive visual implacável e enciclopédia suprema de animes, desenhos, filmes, mangás e HQs. Sua única missão é descobrir exatamente qual é a obra e o personagem da imagem.',
    'É proibido dar respostas genéricas. Você deve dar o palpite mais forte e certeiro sobre o nome da obra, cruzando detalhes como estilo do estúdio, época, roupas e cores.',
    '',
    '### Identificação Certeira (Obrigatório)',
    '- **Obra/Franquia Exata:** diga o nome da série, anime ou filme. Se for impossível cravar 100%, dê o palpite com a maior probabilidade e justifique.',
    '- **Personagem(ns):** quem é? Se não souber o nome, compare com personagens parecidos da cultura pop.',
    '',
    '### Evidências do Detetive',
    '- **Traço e Estúdio:** analise o formato dos olhos, contornos, iluminação e sombreamento. É estilo Ufotable, Toei, Cartoon Network, Pixar? Que década parece ser?',
    '- **Detalhes Chave:** quebras de quarta parede, símbolos em roupas, armas, tipo de magia ou aura.',
    '',
    '### Veredito',
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
    resumeData = HistoryTracker.consumeResumeFromUrl('zenkai.html');
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
    'theme-aqua-verde': 'Aqua verde',
    'theme-abismo': 'Abismo Estelar'
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
    let inCode = false;
    let codeLines = [];
    let inUl = false;
    let inOl = false;
    let inBlockquote = false;
    let tableRows = [];

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

    const closeBlockquote = () => {
      if (inBlockquote) {
        html.push('</blockquote>');
        inBlockquote = false;
      }
    };

    const closeTable = () => {
      if (!tableRows.length) return;

      const rows = tableRows
        .map((row) => row.split('|').map((cell) => cell.trim()).filter((cell) => cell.length > 0));

      if (!rows.length) {
        tableRows = [];
        return;
      }

      const header = rows.shift();
      if (!header || !header.length) {
        tableRows = [];
        return;
      }

      html.push('<table>');
      html.push('<thead><tr>');
      header.forEach((cell) => {
        html.push(`<th>${formatInlineMarkdown(cell)}</th>`);
      });
      html.push('</tr></thead>');

      if (rows.length) {
        html.push('<tbody>');
        rows.forEach((row) => {
          if (!row.length) return;
          html.push('<tr>');
          row.forEach((cell) => {
            html.push(`<td>${formatInlineMarkdown(cell)}</td>`);
          });
          html.push('</tr>');
        });
        html.push('</tbody>');
      }

      html.push('</table>');
      tableRows = [];
    };

    const closeOpenBlocks = () => {
      closeLists();
      closeBlockquote();
      closeTable();
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (inCode) {
          html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
          codeLines = [];
          inCode = false;
        } else {
          closeOpenBlocks();
          inCode = true;
        }
        return;
      }

      if (inCode) {
        codeLines.push(line);
        return;
      }

      if (!trimmed) {
        closeOpenBlocks();
        html.push('<br>');
        return;
      }

      if (/^>\s?/.test(trimmed)) {
        closeLists();
        closeTable();
        if (!inBlockquote) {
          html.push('<blockquote>');
          inBlockquote = true;
        }
        html.push(`<p>${formatInlineMarkdown(trimmed.replace(/^>\s?/, ''))}</p>`);
        return;
      }

      if (/^([-*_])\1{2,}$/.test(trimmed)) {
        closeOpenBlocks();
        html.push('<hr>');
        return;
      }

      if (trimmed.includes('|') && !/^[:\-\s|]+$/.test(trimmed)) {
        closeLists();
        closeBlockquote();
        tableRows.push(trimmed);
        return;
      }

      if (tableRows.length) {
        closeTable();
      }

      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        closeOpenBlocks();
        const level = Math.min(6, headingMatch[1].length + 2);
        html.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
        return;
      }

      const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        closeBlockquote();
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
        closeBlockquote();
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

      closeBlockquote();
      html.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
    });

    if (inCode) {
      html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    }
    closeOpenBlocks();
    return html.join('');
  }

  function trimAIRequestMessages(messages, maxNonSystemMessages = 12) {
    const list = Array.isArray(messages) ? messages : [];
    const systemMessages = [];
    const otherMessages = [];

    for (const message of list) {
      if (!message || typeof message !== 'object') continue;
      const role = String(message.role || '');
      if (!['system', 'user', 'assistant'].includes(role)) continue;
      const content = normalizeBrokenEncoding(String(message.content || ''));
      if (!content.trim()) continue;

      const normalized = { role, content };
      if (role === 'system') {
        systemMessages.push(normalized);
      } else {
        otherMessages.push(normalized);
      }
    }

    return [
      ...systemMessages.slice(0, 1),
      ...otherMessages.slice(Math.max(0, otherMessages.length - maxNonSystemMessages))
    ];
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

  function historySummary(value, maxLength = 160) {
    const text = normalizeBrokenEncoding(String(value ?? ''))
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/(^|\s)#{1,6}\s*/g, '$1')
      .replace(/(\*\*|__|\*|_|~~)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
  }

  async function optimizeVisionImage(file) {
    const originalDataUrl = await readFileAsDataUrl(file);
    if (!String(file?.type || '').startsWith('image/') || Number(file?.size || 0) <= 900 * 1024) {
      return originalDataUrl;
    }

    try {
      const image = new Image();
      image.src = originalDataUrl;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const maxDimension = 1280;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d', { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);

      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      return optimizedDataUrl.length < originalDataUrl.length ? optimizedDataUrl : originalDataUrl;
    } catch {
      return originalDataUrl;
    }
  }

  function extractVisionText(result) {
    return extractAIText(result);
  }

  function extractAIText(result) {
    const readText = (value) => {
      if (typeof value === 'string') return value;
      if (Array.isArray(value)) {
        return value.map((item) => readText(item)).filter(Boolean).join('');
      }
      if (value && typeof value === 'object') {
        return readText(value.text || value.content || value.value || '');
      }
      return '';
    };

    const candidates = [
      result?.choices?.[0]?.message?.content,
      result?.choices?.[0]?.text,
      result?.candidates?.[0]?.content?.parts,
      result?.output_text,
      result?.response,
      result?.result?.response,
      result?.result?.description,
      result?.description,
      Array.isArray(result?.result) ? JSON.stringify(result.result, null, 2) : ''
    ];

    for (const candidate of candidates) {
      const text = readText(candidate).trim();
      if (text) return text;
    }

    return '';
  }

  function responseNeedsPortugueseRetry(value) {
    const text = normalizeBrokenEncoding(String(value || ''))
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, ' ');
    if (text.length < 18) return false;

    const englishWords = text.match(/\b(?:the|and|you|your|this|that|with|from|what|why|how|is|are|can|will|here|about|answer|sure|based|versus|winner|fight|battle)\b/g) || [];
    const portugueseWords = text.match(/\b(?:o|a|os|as|um|uma|e|de|do|da|dos|das|que|com|para|por|em|no|na|nos|nas|sobre|como|quem|vence|vencedor|luta|batalha|resposta|porque|será)\b/g) || [];

    return englishWords.length >= 3 && englishWords.length > portugueseWords.length + 1;
  }

  function buildPortugueseCorrectionMessage() {
    return [
      'A resposta anterior não atende ao idioma solicitado.',
      'Reescreva a resposta completa agora, exclusivamente em português brasileiro (pt-BR).',
      'Não explique a correção, não use inglês e preserve o conteúdo útil da pergunta.'
    ].join('\n');
  }

  function renderVisionResult(text) {
    if (!visionOutput) return;
    const normalizedText = sanitizeVisionResponseText(text || 'Nenhum resultado retornado.');
    
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
    copyBtn.rawText = normalizedText;
    updateCopyButton(copyBtn, false);
    copyBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      copyText(copyBtn.rawText || copyBtn.dataset.rawText || normalizedText, copyBtn);
    });
    visionOutput.appendChild(copyBtn);
  }

  function renderComparisonResult(text) {
    if (!compareResult) return;
    const normalizedText = sanitizeAIResponseText(text || '');
    if (!normalizedText) {
      compareResult.style.display = 'none';
      return;
    }
    compareResult.style.display = 'block';
    compareResult.innerHTML = `<div class="msg-content"><strong>Análise Comparativa:</strong><br><br>${formatAIResponse(normalizedText)}</div>`;

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
      console.error('Erro ao salvar histórico detalhado da IA:', err);
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
    return historySummary(prompt, 220) || 'Conversa com a ZenkAI';
  }

  async function syncAIThreadHistoryCard(prompt, assistantText) {
    if (!currentChatThreadId || typeof HistoryTracker === 'undefined') return;

    await HistoryTracker.track({
      contentId: currentChatThreadId,
      contentType: 'ai_chat',
      title: buildAIThreadHistoryTitle(prompt),
      subtitle: historySummary(assistantText, 160),
      route: 'zenkai.html',
      payload: {
        mediaType: 'ai_chat',
        tab: 'chat',
        threadId: currentChatThreadId,
        historyContentId: ''
      }
    });
  }

  async function requestAIText(requestMessages, options = {}) {
    const target = 'openrouter';
    const context = options.context || 'chat';
    const model = options.model || DEFAULT_GROQ_MODEL;
    // As respostas da ZenkAI são entregues completas. O streaming fica
    // bloqueado neste fluxo para não exibir Markdown/tabelas pela metade.

    const modelQueue = context === 'compare'
      ? Array.from(new Set([model, COMPARE_FALLBACK_GROQ_MODEL, DEFAULT_GROQ_MODEL].filter(Boolean)))
      : [model];
    const maxRetriesPerModel = 1;

    let aiResponse = '';
    let lastError = null;

    for (let modelIndex = 0; modelIndex < modelQueue.length; modelIndex += 1) {
      const selectedModel = modelQueue[modelIndex];
      for (let attempt = 0; attempt < maxRetriesPerModel; attempt += 1) {
        const selectedProviderModel = selectedModel;
        const res = await fetch('/api/ai/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target,
            body: {
              model: selectedProviderModel,
              messages: requestMessages,
              temperature: Number.isFinite(options.temperature) ? options.temperature : undefined,
              max_tokens: Number.isFinite(options.max_tokens) ? options.max_tokens : undefined,
              stream: false
            }
          })
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          aiResponse = sanitizeAIResponseText(extractAIText(data));
          if (!aiResponse) {
            lastError = new Error(AI_EMPTY_RESPONSE_MESSAGE);
            continue;
          }
          break;
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

    if (options.enforcePortuguese !== false && responseNeedsPortugueseRetry(aiResponse)) {
      return requestAIText([
        ...requestMessages,
        { role: 'assistant', content: aiResponse },
        { role: 'user', content: buildPortugueseCorrectionMessage() }
      ], {
        ...options,
        stream: false,
        allowStreaming: false,
        enforcePortuguese: false
      });
    }

    return aiResponse;
  }

  function isComparisonAnalysisIncomplete(text) {
    const content = normalizeBrokenEncoding(String(text || '')).trim();
    if (!content) return true;
    return !/##\s*Veredito final/i.test(content) || !/Fim da an(?:a|Ã¡|á)lise\./i.test(content);
  }

  async function completeComparisonAnalysisIfNeeded(partialText, requestMessages, options = {}) {
    let completedText = normalizeBrokenEncoding(String(partialText || '')).trim();
    if (!isComparisonAnalysisIncomplete(completedText)) return completedText;

    for (let continuationAttempt = 0; continuationAttempt < 3; continuationAttempt += 1) {
      const continuationMessages = [
        ...requestMessages,
        { role: 'assistant', content: completedText },
        {
          role: 'user',
          content: [
            'Sua resposta anterior ficou incompleta ou sem encerramento.',
            'Continue exatamente de onde parou, sem repetir o que ja foi escrito.',
            'Se a secao "## Veredito final" ainda nao foi concluida, priorize ela agora.',
            'Finalize obrigatoriamente com a frase: Fim da analise.'
          ].join('\n')
        }
      ];

      try {
        const continuation = await requestAIText(continuationMessages, {
          ...options,
          stream: false,
          max_tokens: COMPARE_CONTINUATION_MAX_TOKENS
        });
        const normalizedContinuation = normalizeBrokenEncoding(String(continuation || '')).trim();
        if (!normalizedContinuation) break;
        completedText = `${completedText}\n\n${normalizedContinuation}`.trim();
        if (!isComparisonAnalysisIncomplete(completedText)) return completedText;
      } catch (error) {
        console.warn('Falha ao completar analise de comparacao:', error);
        break;
      }
    }

    return completedText;
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
    renderComparisonResult(selectedComparison.content || '');
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
    const enrichedSystemPrompt = `${systemPrompt}\n\n${AI_RESPONSE_GUIDE}`;
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

      let requestMessages = useChatContext
        ? chatHistory
          // A saudação é renderizada localmente e não deve virar uma fala do
          // modelo no primeiro turno, pois isso desloca a pergunta do usuário.
          .filter((message) => !(
            message?.role === 'assistant'
            && !message?.id
            && String(message.content || '') === GREETING_MESSAGE
          ))
          .map(({ role, content }) => ({ role, content }))
        : [{ role: 'system', content: enrichedSystemPrompt }, { role: 'user', content: prompt }];

      if (useChatContext && context === 'chat' && currentChatThreadId) {
        try {
          const persisted = await loadAIHistoryMessages({
            context: 'chat',
            metadataContains: { threadId: currentChatThreadId },
            limit: 18
          });

          if (Array.isArray(persisted) && persisted.length > 0) {
            const persistedMessages = persisted.map((msg) => ({
              role: msg.role,
              content: normalizeBrokenEncoding(msg.content)
            }));

            const localKeys = new Set(requestMessages.map((message) => (
              `${message.role}:${String(message.content || '')}`
            )));
            const persistedOnly = persistedMessages.filter((message) => {
              const key = `${message.role}:${String(message.content || '')}`;
              if (localKeys.has(key)) return false;
              localKeys.add(key);
              return true;
            });

            // O histórico remoto entra apenas com mensagens ausentes, antes
            // do contexto local. Assim a pergunta atual permanece por último.
            requestMessages = [...persistedOnly, ...requestMessages];
          }
        } catch (historyError) {
          console.warn('Falha ao carregar histórico completo do chat:', historyError);
        }
      }

      // O histórico salvo não inclui mensagens de sistema. Recoloque as
      // instruções em toda requisição para que a primeira resposta não perca
      // idioma, personalidade ou regras da ZenkAI.
      if (!requestMessages.some((message) => message.role === 'system')) {
        requestMessages.unshift({ role: 'system', content: enrichedSystemPrompt });
      }

      if (requestMessages.length) {
        requestMessages = requestMessages.map((message) => {
          if (message.role === 'system') {
            return { role: 'system', content: enrichedSystemPrompt };
          }
          return {
            role: message.role,
            content: normalizeBrokenEncoding(message.content)
          };
        });
      }

      requestMessages = trimAIRequestMessages(requestMessages, useChatContext ? 12 : 6);

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

      let aiResponse = await requestAIText(requestMessages, {
        target,
        model,
        context,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        stream: false,
        allowStreaming: false,
        enforcePortuguese: true
      });

      if (context === 'compare' && options.ensureComplete === true) {
        aiResponse = await completeComparisonAnalysisIfNeeded(aiResponse, requestMessages, {
          target,
          model,
          context,
          temperature: options.temperature,
          max_tokens: options.max_tokens
        });
      }

      if (useChatContext && chatAssistantEntry) {
        chatAssistantEntry.content = sanitizeAIResponseText(aiResponse);
        persistAIChatSessionState();
        if (lastMsgElement) {
          const contentDiv = lastMsgElement.querySelector('.msg-content');
          if (contentDiv) contentDiv.innerHTML = formatAIResponse(chatAssistantEntry.content);
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
          copyBtn.dataset.rawText = chatAssistantEntry.content;
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
              ? [metadata.char1, metadata.char2].filter(Boolean).join(' vs ') || 'Comparação sem título'
              : buildAIThreadHistoryTitle(prompt),
            subtitle: historySummary(aiResponse, 160),
            route: 'zenkai.html',
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
        stream: false
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
        if (contentDiv) contentDiv.innerHTML = formatAIResponse(sanitizeAIResponseText(aiResponse));
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
        copyBtn.dataset.rawText = sanitizeAIResponseText(aiResponse);
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
        stream: false
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
        if (contentDiv) contentDiv.innerHTML = formatAIResponse(sanitizeAIResponseText(aiResponse));
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
        copyBtn.dataset.rawText = sanitizeAIResponseText(aiResponse);
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

    const base64Image = await optimizeVisionImage(file);
    const metadataWithPreview = { ...metadata, imageDataUrl: base64Image };
    const maxRetriesPerModel = 1;
    const visionRequestPlan = [
      {
        target: 'openrouter',
        models: ['openrouter/free']
      }
    ];

    async function requestVisionText(promptText, requestOptions = {}) {
      let lastError = null;

      for (let providerIndex = 0; providerIndex < visionRequestPlan.length; providerIndex += 1) {
        const providerPlan = visionRequestPlan[providerIndex];
        const { target, models } = providerPlan;

        for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
          const selectedModel = models[modelIndex];

          for (let attempt = 0; attempt < maxRetriesPerModel; attempt += 1) {
            const requestBody = {
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
              const text = sanitizeAIResponseText(extractVisionText(result));
              if (!text) {
                lastError = new Error('A IA não retornou uma descrição utilizável para esta imagem.');
              } else {
                if (!requestOptions.languageRetry && responseNeedsPortugueseRetry(text)) {
                  return requestVisionText(
                    `${promptText}\n\n${buildPortugueseCorrectionMessage()}`,
                    { languageRetry: true }
                  );
                }
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

      let finalPrompt = `${VISION_PROMPT}\n\n${AI_RESPONSE_GUIDE}`;
      if (options.customPrompt && options.customPrompt.trim()) {
        finalPrompt = `[PERGUNTA DO USUÁRIO SOBRE A IMAGEM]:\n"${options.customPrompt.trim()}"\n\n[DIRETRIZES DO SISTEMA E DETETIVE VISUAL]:\n${VISION_PROMPT}\n\n${AI_RESPONSE_GUIDE}`;
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
            title: metadata.fileName || 'Imagem analisada pela ZenkAI',
            subtitle: historySummary(aiResponse, 180),
            route: 'zenkai.html',
            payload: {
              mediaType: 'ai_vision',
              tab: 'vision',
              historyContentId: metadata.historyContentId,
              fileName: metadata.fileName,
              fileType: metadata.fileType || '',
              fileSize: metadata.fileSize || 0,
              description: historySummary(aiResponse, 180)
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
        existingUserEntry: optimisticUserEntry,
        // Entrega somente a resposta final, sem efeito de digitação ou
        // Markdown sendo renderizado enquanto ainda está incompleto.
        stream: false,
        max_tokens: CHAT_MAX_TOKENS
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

    const compareSystemPrompt = 'Você é um analista de batalhas fictícias. Responda exclusivamente em português brasileiro, com fatos canônicos quando disponíveis, Markdown objetivo e um veredito claro. Seja detalhado sem repetir ideias e não omita nenhuma seção pedida.';
    const compareCompletionRules = [
      'A resposta deve terminar com a seção "## Veredito final", uma conclusão objetiva e, na última linha, exatamente: Fim da análise.'
    ].join('\n');
    const prompt = [
      compareCompletionRules,
      `Faça uma análise de batalha completa e aprofundada: ${c1} vs ${c2}.`,
      'Formato em Markdown:',
      '## Resumo rápido',
      '- Apresente os dois personagens e a vantagem inicial em até 4 linhas.',
      '## Tabela comparativa',
      '- Use uma tabela Markdown com as colunas: `Atributo`, `Personagem 1`, `Personagem 2`, `Vantagem`.',
      '- Compare força, velocidade, resistência, tática e habilidades especiais.',
      '## Análise detalhada',
      '- Explique os dois ou três fatores que decidem a luta.',
      '## Cenários de batalha',
      '1. **Duelo direto** - quem leva vantagem?',
      '2. **Com preparo** - o que muda?',
      '## Pontos fracos e vulnerabilidades',
      '- Cite as vulnerabilidades mais relevantes.',
      '## Veredito final',
      '- **Vencedor mais provável** com argumentação sólida.',
      '- **Condições em que o azarão pode virar o jogo** e confiança estimada.',
      'Se faltar dado canônico, diga "informação insuficiente".'
    ].join('\n');

    try {
      const analysis = await callAI(prompt, {
        useChatContext: false,
        persistToAIHistory: true,
        context: 'compare',
        model: COMPARE_GROQ_MODEL,
        temperature: COMPARE_TEMPERATURE,
        max_tokens: COMPARE_MAX_TOKENS,
        systemPrompt: compareSystemPrompt,
        // A análise só é exibida depois de completa e já formatada. Assim não
        // há Markdown bruto nem tabela quebrada aparecendo durante a geração.
        stream: false,
        ensureComplete: true,
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
