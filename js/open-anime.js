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
      const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xFF);
      const decoded = new TextDecoder('utf-8').decode(bytes);
      return decoded && decoded.trim() ? decoded : text;
    } catch {
      return text;
    }
  }

  const SYSTEM_PROMPT = 'Você é o Open AnIme, o assistente virtual super inteligente do Anime House. REGRA DE OURO: Suas respostas devem ser EXTREMAMENTE coerentes, lógicas e baseadas em FATOS VERÍDICOS. Nunca alucine ou invente cânones. Raciocine passo-a-passo antes de escrever. Ao responder, não dê apenas o básico: traga informações extras genuínas, curiosidades fantásticas e aprofundamento real. Seja extremamente amigável, entusiasmado e coloque alguns (poucos e bem escolhidos) emojis ao longo do texto para dar vida à conversa ✨. Use listas, tópicos de Markdown em negrito/itálico e estruture tudo para ficar gostoso de ler.';
  const GREETING_MESSAGE = 'Olá! Eu sou o **Open AnIme** 🎌 — seu assistente de animes e desenhos no Anime House! Posso recomendar títulos com explicações detalhadas, discutir personagens, analisar arcos de história, comparar poderes ou ajudar a desenvolver ideias para o site. O que você quer explorar hoje?';
  const AI_HISTORY_TABLE = 'ai_chat_messages';
  const AI_HISTORY_LIMIT = 120;
  const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
  const DEFAULT_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
  const COMPARE_GEMINI_MODEL = 'gemini-2.0-flash';
  const COMPARE_FALLBACK_GEMINI_MODEL = 'gemini-2.0-flash';
  const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
  const COMPARE_FALLBACK_GROQ_MODEL = 'llama3-8b-8192';
  const COMPARE_MAX_TOKENS = 1400;
  const COMPARE_TEMPERATURE = 0.35;
  const VISION_MAX_TOKENS = 2500;
  const VISION_MIN_COMPLETION_CHARS = 1000;
  const VISION_PROMPT = [
    'Atue como um analista visual de elite e enciclopédia geek global. Sua missão é realizar uma perícia técnica na imagem.',
    'Se você NÃO conseguir identificar a origem exata (anime/estúdio/obra), NÃO invente. Em vez disso, forneça uma análise visual e temática PROFUNDA como resposta alternativa.',
    '',
    '### 🆔 Identificação e Origem Real',
    '- **Veredito de Origem:** Identifique a obra se tiver certeza absoluta. Caso contrário, declare como "Origem Indeterminada" e descreva qual o arquétipo ou estilo que a imagem evoca (ex: "Estilo Shonen Moderno", "Cyberpunk", "Vibe Retrô anos 90").',
    '- **Personagens/Foco:** Nomeie se souber, ou descreva as características marcantes do sujeito (ex: "Um jovem espadachim com olhos carmesim e vestes de samurai futurista").',
    '',
    '### 🔎 Perícia Técnica e Estilo',
    '- **DNA Visual:** Analise o traço. É detalhado? Minimalista? Quais técnicas de pintura ou animação você percebe? (ex: "Uso intenso de luz volumétrica e partículas que lembram o estilo do Makoto Shinkai").',
    '- **Análise de Cores e Luz:** Como a paleta de cores influencia a emoção da cena.',
    '',
    '### 📝 Pistas, Textos e Marcas',
    '- **Rastros:** Transcreva qualquer texto visível. Identifique logos ou assinaturas que possam dar pistas sobre o artista ou estúdio.',
    '- **Vibe e Contexto:** O que a imagem transmite? É uma cena de ação? Um momento de paz? Uma arte promocional?',
    '',
    '### 🎯 Veredito e Curiosidade',
    '- Resumo final: "Mesmo sem a origem exata, esta imagem destaca-se por..." e entregue uma curiosidade sobre o estilo artístico ou o gênero identificado.',
    'IMPORTANTE: Responda obrigatoriamente em português, mantendo um tom profissional, investigativo e empolgado. ✨'
  ].join('\n');
  const COPY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2"></rect><rect x="5" y="5" width="10" height="10" rx="2"></rect></svg>';
  const COPIED_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"></path></svg>';
  const COPY_BUTTON_LABEL = 'Copiar';
  const COPIED_BUTTON_LABEL = 'Copiado';
  const VISION_FALLBACK_PREVIEW = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="16" fill="%23111827"/><path d="M34 80l18-22 12 14 8-10 14 18H34z" fill="%236b7280"/><circle cx="46" cy="42" r="8" fill="%239ca3af"/></svg>';
  let chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
  let cachedAIUser = null;
  let currentChatThreadId = '';
  let selectedVisionFile = null;
  let isComparing = false;

  let resumeData = null;
  if (typeof HistoryTracker !== 'undefined') {
    resumeData = HistoryTracker.consumeResumeFromUrl('open-anime.html');
  }

  function buildUniqueId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function isTemporaryModelOverload(statusCode, message) {
    const status = Number(statusCode || 0);
    const text = String(message || '').toLowerCase();
    if (status === 429 || status === 503) return true;
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
    if (themeName) {
      const rawTheme = document.documentElement.className || sessionStorage.getItem('theme') || 'theme-ciano';
      const currentTheme = typeof window.normalizeTheme === 'function'
        ? window.normalizeTheme(rawTheme)
        : rawTheme;
      themeName.textContent = themeLabels[currentTheme] || 'Cor personalizada';
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

  function updateCopyButton(button, copied = false) {
    if (!button) return;

    const label = copied ? COPIED_BUTTON_LABEL : COPY_BUTTON_LABEL;
    button.classList.toggle('copied', copied);
    button.innerHTML = `${copied ? COPIED_ICON : COPY_ICON}<span>${label}</span>`;
    button.title = copied ? 'Mensagem copiada' : 'Copiar mensagem';
    button.setAttribute('aria-label', copied ? 'Mensagem copiada' : 'Copiar mensagem');
  }

  function writeTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
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
    visionOutput.innerHTML = `<div class="msg-content"><strong>Análise da imagem:</strong><br><br>${formatAIResponse(normalizedText)}</div>`;

    const existingCopyBtn = visionOutput.querySelector('.msg-copy-btn');
    if (existingCopyBtn) existingCopyBtn.remove();
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'msg-copy-btn';
    copyBtn.type = 'button';
    copyBtn.title = 'Copiar análise';
    copyBtn.setAttribute('aria-label', 'Copiar análise');
    copyBtn.dataset.feedbackMessage = 'Análise copiada';
    updateCopyButton(copyBtn, false);
    copyBtn.addEventListener('click', () => copyText(normalizedText, copyBtn));
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
    updateCopyButton(copyBtn, false);
    copyBtn.addEventListener('click', () => copyText(normalizedText, copyBtn));
    compareResult.appendChild(copyBtn);

  }

  function clearVisionSelection(options = {}) {
    setVisionFile(null);
    if (visionUpload) {
      visionUpload.value = '';
    }
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

    if (!selectedVisionFile) {
      visionDropZone.classList.remove('is-ready');
      if (visionPreview) visionPreview.hidden = true;
      if (visionPreviewActions) visionPreviewActions.hidden = true;
      if (visionPreviewImg) visionPreviewImg.removeAttribute('src');
      if (visionFileName) visionFileName.textContent = 'Nenhuma imagem selecionada';
      if (visionFileInfo) visionFileInfo.textContent = 'Aguardando envio';
      return;
    }

    visionDropZone.classList.add('is-ready');

    if (visionPreview) visionPreview.hidden = false;
    if (visionPreviewActions) visionPreviewActions.hidden = false;
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

  function appendMsg(text, type) {
    if (!chatWindow) return;
    const normalizedText = normalizeBrokenEncoding(text);

    const div = document.createElement('div');
    div.className = `msg ${type}`;

    const content = document.createElement('div');
    content.className = 'msg-content';
    content.innerHTML = formatAIResponse(normalizedText);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'msg-copy-btn';
    copyBtn.type = 'button';
    copyBtn.title = 'Copiar mensagem';
    copyBtn.setAttribute('aria-label', 'Copiar mensagem');
    copyBtn.dataset.feedbackMessage = type === 'bot' ? 'Resposta copiada' : 'Mensagem copiada';
    updateCopyButton(copyBtn, false);
    copyBtn.addEventListener('click', () => copyText(normalizedText, copyBtn));

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
        .select('role, content, context, metadata, created_at')
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
    const resumedThreadId = getResumeChatThreadId(resume);
    currentChatThreadId = resumedThreadId || buildUniqueId('open_anime_chat_thread');
    chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
    renderChatFromMessages(chatHistory);

    if (restoreSaved && resumedThreadId) {
      const persisted = await loadAIHistoryMessages({
        context: 'chat',
        metadataContains: { threadId: resumedThreadId }
      });
      if (persisted.length > 0) {
        chatHistory = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...persisted.map(msg => ({ role: msg.role, content: normalizeBrokenEncoding(msg.content) }))
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
    const target = 'groq';
    const model = options.model || DEFAULT_GROQ_MODEL;
    const useChatContext = options.useChatContext !== false;
    const persistToAIHistory = options.persistToAIHistory !== false;
    const context = options.context || 'chat';
    const metadata = { ...(options.metadata || {}) };
    const systemPrompt = options.systemPrompt || SYSTEM_PROMPT;

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

      const requestMessages = useChatContext
        ? chatHistory
        : [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }];

      const modelQueue = context === 'compare'
        ? Array.from(new Set([model, COMPARE_FALLBACK_GROQ_MODEL, DEFAULT_GROQ_MODEL].filter(Boolean)))
        : [model];

      const maxRetriesPerModel = 2;
      let aiResponse = '';
      let lastError = null;

      for (let modelIndex = 0; modelIndex < modelQueue.length; modelIndex += 1) {
        const selectedModel = modelQueue[modelIndex];
        for (let attempt = 0; attempt < maxRetriesPerModel; attempt += 1) {
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
                stream: false
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            aiResponse = normalizeBrokenEncoding(
              data.candidates?.[0]?.content?.parts?.[0]?.text
              || data.choices?.[0]?.message?.content
              || 'Sem resposta da IA.'
            );
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
      if (useChatContext && chatHistory.length > 1) {
        chatHistory.pop();
      }
      return 'Falha: ' + e.message + '. Verifique o terminal do servidor para mais detalhes.';
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
    const visionModelQueue = Array.from(new Set([requestedModel, DEFAULT_VISION_MODEL].filter(Boolean)));
    const maxRetriesPerModel = 2;

    async function requestVisionText(promptText) {
      let lastError = null;

      for (let modelIndex = 0; modelIndex < visionModelQueue.length; modelIndex += 1) {
        const selectedModel = visionModelQueue[modelIndex];

        for (let attempt = 0; attempt < maxRetriesPerModel; attempt += 1) {
          const res = await fetch('/api/ai/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target: 'groq',
              body: {
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
              }
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
            break;
          }

          const hasRetryInCurrentModel = attempt < (maxRetriesPerModel - 1);
          if (hasRetryInCurrentModel) {
            await sleep(700 * (attempt + 1));
            continue;
          }

          const hasFallbackModel = modelIndex < (visionModelQueue.length - 1);
          if (hasFallbackModel) {
            await sleep(450);
            break;
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

      let aiResponse = await requestVisionText(VISION_PROMPT);

      if (false) { // aiResponse.length < VISION_MIN_COMPLETION_CHARS
        try {
          const refinementPrompt = [
            VISION_PROMPT,
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
  document.addEventListener('click', (event) => {
    if (event.target.closest('.theme-opt-btn')) {
      setTimeout(updateThemeInfo, 20);
    }
  });

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

  sendBtn.addEventListener('click', async () => {
    const val = chatInput.value.trim();
    if (!val) return;

    appendMsg(val, 'user');
    chatInput.value = '';

    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'msg bot loading-msg';
    loadingMsg.innerHTML = '<span class="pulse">Pensando...</span>';
    chatWindow.appendChild(loadingMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    updateChatScrollInfo();

    const response = await callAI(val, { useChatContext: true, persistToAIHistory: true, context: 'chat' });
    loadingMsg.remove();
    appendMsg(response, 'bot');
  });

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

      visionAnalyzeBtn.disabled = true;
      renderVisionResult('Analisando imagem com Groq Vision (Llama 4 Scout)...');

      try {
        const { aiResponse } = await callVisionAI(selectedVisionFile, {
          persistToAIHistory: true,
          metadata: {
            fileName: selectedVisionFile.name,
            fileType: selectedVisionFile.type,
            fileSize: selectedVisionFile.size
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
    const c1 = char1Inp.value.trim();
    const c2 = char2Inp.value.trim();
    if (!c1 || !c2) return showToast('Digite dois nomes para comparar', 'error');
    if (isComparing) return;
    const compareHistoryId = buildComparisonHistoryContentId({ char1: c1, char2: c2 });

    compareResult.style.display = 'block';
    compareResult.innerHTML = 'Analisando poderes, história e habilidades...';
    isComparing = true;
    compareBtn.disabled = true;

    const compareSystemPrompt = 'Você é um analista especialista em batalhas entre personagens de anime e desenho animado. Sua missão é fazer análises profundas, detalhadas e bem argumentadas, sempre em português. Nunca encurte a análise — explore cada atributo com exemplos reais do universo do personagem, cite poderes específicos e momentos canônicos que justifiquem as notas. Seja apaixonado e técnico ao mesmo tempo.';
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
