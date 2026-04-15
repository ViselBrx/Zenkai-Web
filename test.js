
  function showToast(msg, type = 'success', ms = 7000) {
    const container = document.getElementById('toast');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'undo-toast';
    const isError = type === 'error';
    if (isError) {
      el.style.border = '2px solid var(--danger)';
      el.style.boxShadow = '0 0 35px rgba(239, 68, 68, 0.5)';
    }

    const progressStyle = isError
      ? `animation-duration:${ms}ms; background: var(--danger); box-shadow: 0 0 20px var(--danger);`
      : `animation-duration:${ms}ms;`;

    el.innerHTML = `
      <div class="undo-content" style="justify-content: center;">
        <span style="${isError ? 'color: var(--danger); font-weight: bold;' : ''}">${msg}</span>
      </div>
      <div class="undo-progress" style="${progressStyle}"></div>
    `;
    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 300);
    }, ms);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const historySearch = document.getElementById('historySearch');
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    const historyCount = document.getElementById('historyCount');
    const historySourceNote = document.getElementById('historySourceNote');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const renameModal = document.getElementById('renameModal');
    const renameModalClose = document.getElementById('renameModalClose');
    const renameCancelBtn = document.getElementById('renameCancelBtn');
    const renameConfirmBtn = document.getElementById('renameConfirmBtn');
    const renameConversationInput = document.getElementById('renameConversationInput');

    let historyItems = [];
    let historyEventsBound = false;
    let renameTargetItemId = null;
    let profileInitAttempts = 0;
    let profileInitStarted = false;
    let liveProfileFallbackName = 'Usuario';
    const defaultProfileAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

    function showProfileLoadError(message) {
      const msg = String(message || 'Nao foi possivel carregar seu perfil agora.');
      if (historySourceNote) {
        historySourceNote.textContent = msg;
        historySourceNote.style.display = 'block';
      }
      if (historyEmpty) {
        historyEmpty.style.display = 'block';
      }
      const globalText = document.getElementById('globalStatsText');
      if (globalText) {
        globalText.textContent = msg;
      }
    }

    function syncLiveProfileUI(overrides = {}) {
      const usernameInput = document.getElementById('username');
      const avatarUrlInput = document.getElementById('avatarUrl');
      const displayUsernameEl = document.getElementById('displayUsername');
      const displayNameTextEl = displayUsernameEl?.querySelector('span');
      const displayAvatarEl = document.getElementById('displayAvatar');
      const displayCustomTitleEl = document.getElementById('displayCustomTitle');
      const sidebarCrownEl = document.getElementById('sidebarCrown');

      // 💡 Dados do Banco (Preferencial)
      let sData = {};
      if (window.DB && window.DB._store && window.DB._store.profile && window.DB._store.profile.store_data) {
        sData = window.DB._store.profile.store_data.equipped || {};
      }

      const nextName = String(overrides.username ?? usernameInput?.value ?? '').trim() || liveProfileFallbackName;
      const nextAvatar = String(overrides.avatarUrl ?? avatarUrlInput?.value ?? '').trim() || defaultProfileAvatar;
      
      const nextTitle = sData.titulo || '';

      const showCrown = sData.crown === true;
      const crownIcon = sData.crownIcon || '👑';

      if (displayNameTextEl) displayNameTextEl.textContent = nextName;
      else if (displayUsernameEl) displayUsernameEl.textContent = nextName;
      if (displayAvatarEl) displayAvatarEl.src = nextAvatar;
      if (displayCustomTitleEl) {
        displayCustomTitleEl.textContent = nextTitle;
        displayCustomTitleEl.style.display = nextTitle ? 'block' : 'none';
      }
      
      if (sidebarCrownEl) {
        sidebarCrownEl.style.display = showCrown ? 'block' : 'none';
        sidebarCrownEl.textContent = crownIcon;
      }
      
      const crownIconDisplay = document.getElementById('crownIconDisplay');
      if (crownIconDisplay) crownIconDisplay.textContent = crownIcon;

      const navAvatar = document.getElementById('navAvatar');
      if (navAvatar) navAvatar.src = nextAvatar;

      // Banner Sync
      const equippedBanner = sData.banner || 'none';
      if (equippedBanner !== 'none' && window.BANNER_MAP) {
          const bannerUrl = window.BANNER_MAP[equippedBanner];
          const sidebar = document.querySelector('.history-sidebar');
          if (sidebar && bannerUrl) {
              sidebar.style.position = 'relative';
              sidebar.style.overflow = 'hidden';
              sidebar.style.zIndex = '1';
              
              let bgOverlay = sidebar.querySelector('.sidebar-banner-overlay');
              if (!bgOverlay) {
                  bgOverlay = document.createElement('div');
                  bgOverlay.className = 'sidebar-banner-overlay';
                  bgOverlay.style.cssText = 'position:absolute; inset:0; z-index:-1; transition:0.5s; pointer-events:none;';
                  sidebar.prepend(bgOverlay);
              }
              bgOverlay.style.backgroundImage = `linear-gradient(rgba(10, 25, 47, 0.6), rgba(10, 25, 47, 0.9)), url('${bannerUrl}')`;
              bgOverlay.style.backgroundSize = 'cover';
              bgOverlay.style.backgroundPosition = 'center';
              bgOverlay.style.opacity = '0.65';
          }
      } else {
          // Remove banner if none or unequipped
          const overlay = document.querySelector('.sidebar-banner-overlay');
          if (overlay) overlay.remove();
      }

      if (typeof window.updateNavbarCosmetics === 'function') {
        window.updateNavbarCosmetics();
      }
    }

    function emitProfileUpdated(detail = {}) {
      const usernameInput = document.getElementById('username');
      const avatarUrlInput = document.getElementById('avatarUrl');
      window.dispatchEvent(new CustomEvent('profileUpdated', {
        detail: {
          username: String(detail.username ?? usernameInput?.value ?? '').trim() || liveProfileFallbackName,
          avatarUrl: String(detail.avatarUrl ?? avatarUrlInput?.value ?? '').trim() || defaultProfileAvatar,
          customTitle: String(detail.customTitle ?? localStorage.getItem('animehouse_customTitle') ?? '').trim(),
          showCrown: typeof detail.showCrown === 'boolean'
            ? detail.showCrown
            : localStorage.getItem('animehouse_showCrown') === 'true'
        }
      }));
    }

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function formatTypeLabel(type) {
      const map = {
        desenho_movie: 'Desenho - Filme',
        desenho_episode: 'Desenho - Episódio',
        anime_movie: 'Anime - Filme',
        anime_episode: 'Anime - Episódio',
        filme: 'Filme',
        ai_chat: 'IA - Chat',
        ai_vision: 'IA - Imagem',
        ai_compare: 'IA - Comparação'
      };
      return map[type] || type || 'Conteúdo';
    }

    function toDate(value) {
      const date = new Date(value || Date.now());
      if (Number.isNaN(date.getTime())) return new Date();
      return date;
    }

    function formatGroupLabel(value) {
      const date = toDate(value);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffDays = Math.round((today - itemDay) / 86400000);

      if (diffDays <= 0) return 'Hoje';
      if (diffDays === 1) return 'Ontem';
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    function formatHour(value) {
      return toDate(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function shortenText(value, maxLen = 100) {
      const normalized = String(value || '').replace(/\s+/g, ' ').trim();
      if (!normalized) return '';
      if (normalized.length <= maxLen) return normalized;
      return normalized.slice(0, Math.max(0, maxLen - 1)).trimEnd() + '…';
    }

    function getHistoryDescription(item) {
      if (!item || typeof item !== 'object') return '';

      const payload = item.payload && typeof item.payload === 'object' ? item.payload : {};
      const directSubtitle = String(item.subtitle || '').trim();
      const payloadDescription = String(payload.description || '').trim();

      if (item.content_type === 'ai_vision') {
        return payloadDescription || directSubtitle;
      }

      return directSubtitle;
    }

    function getHistoryMeta(item, stamp) {
      const baseType = formatTypeLabel(item?.content_type);
      const payload = item?.payload && typeof item.payload === 'object' ? item.payload : {};

      if (item?.content_type === 'ai_vision' && payload.fileName) {
        return `${baseType} - ${payload.fileName} - ${formatHour(stamp)}`;
      }

      return `${baseType} - ${formatHour(stamp)}`;
    }

    function getHistoryPreview(item) {
      const description = getHistoryDescription(item) || formatTypeLabel(item?.content_type);
      if (item?.content_type === 'ai_vision') {
        return shortenText(`Descrição: ${description}`, 150);
      }
      return shortenText(description, 95);
    }

    let currentHistoryFilter = 'all';

    function getFilteredHistoryItems() {
      const term = (historySearch?.value || '').trim().toLowerCase();
      
      return historyItems.filter(item => {
        // Filter by category
        if (currentHistoryFilter !== 'all') {
          const type = String(item.content_type || '');
          if (currentHistoryFilter === 'movie') {
            // Filmes (Individuais ou Anime/Desenho Movie)
            if (type !== 'filme' && !type.endsWith('_movie')) return false;
          } else if (currentHistoryFilter === 'cartoon') {
            // Desenhos
            if (!type.startsWith('desenho')) return false;
          } else {
            // Animes, Mangás, etc.
            if (!type.startsWith(currentHistoryFilter)) return false;
          }
        }

        // Filter by search term
        if (!term) return true;
        
        const payload = item.payload && typeof item.payload === 'object' ? item.payload : {};
        const base = [
          item.title || '',
          item.subtitle || '',
          getHistoryDescription(item),
          payload.fileName || '',
          item.content_type || ''
        ].join(' ').toLowerCase();
        return base.includes(term);
      });
    }

    function renderHistory() {
      if (!historyList || !historyEmpty || !historyCount) return;

      const filtered = getFilteredHistoryItems();
      historyCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'item' : 'itens'}`;

      if (filtered.length === 0) {
        historyList.innerHTML = '';
        historyEmpty.style.display = 'block';
        return;
      }

      historyEmpty.style.display = 'none';
      const groups = new Map();

      filtered.forEach(item => {
        const stamp = item.last_watched_at || item.created_at || item.updated_at || new Date().toISOString();
        const label = formatGroupLabel(stamp);
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(item);
      });

      let html = '';
      groups.forEach((items, label) => {
        html += `<section class="history-group"><h4 class="history-group-label">${escapeHtml(label)}</h4>`;

        items.forEach(item => {
          const itemId = escapeHtml(item.id || '');
          const title = escapeHtml(item.title || 'Conteúdo sem título');
          const subtitle = escapeHtml(getHistoryPreview(item));
          const stamp = item.last_watched_at || item.created_at || item.updated_at;
          const meta = getHistoryMeta(item, stamp);

          html += `
            <div class="history-item">
              <button type="button" class="history-open" data-open-id="${itemId}">
                <strong>${title}</strong>
                <span class="history-preview">${subtitle}</span>
                <div class="history-meta">${escapeHtml(meta)}</div>
              </button>
              <div class="history-item-actions">
                <button type="button" class="btn btn-ghost btn-sm" data-open-id="${itemId}">Abrir</button>
                <button type="button" class="btn btn-ghost btn-sm" data-rename-id="${itemId}">Renomear</button>
                <button type="button" class="btn btn-danger btn-sm" data-delete-id="${itemId}">Excluir</button>
              </div>
            </div>
          `;
        });

        html += '</section>';
      });

      historyList.innerHTML = html;
    }

    function findHistoryItem(itemId) {
      return historyItems.find(item => String(item.id) === String(itemId)) || null;
    }

    let refreshHistory = async () => {
      if (typeof HistoryTracker === 'undefined') {
        historyItems = [];
        renderHistory();
        return;
      }

      const { items, source } = await HistoryTracker.list(240);
      historyItems = Array.isArray(items) ? [...items] : [];
      historyItems.sort((a, b) => {
        const aTime = new Date(a.last_watched_at || a.created_at || 0).getTime();
        const bTime = new Date(b.last_watched_at || b.created_at || 0).getTime();
        return bTime - aTime;
      });

      if (historySourceNote) {
        if (source === 'error' || source === 'no-client') {
          historySourceNote.textContent = 'Não foi possível carregar do Supabase agora. Verifique auth.js e a tabela user_watch_history.';
          historySourceNote.style.display = 'block';
        } else {
          historySourceNote.textContent = '';
          historySourceNote.style.display = 'none';
        }
      }

      renderHistory();
    }

    async function deleteHistoryItem(itemId) {
      if (typeof HistoryTracker === 'undefined') return;
      const ok = await HistoryTracker.remove(itemId);
      if (!ok) {
        showToast('Falha ao remover item do histórico.', 'error');
        return;
      }
      historyItems = historyItems.filter(item => String(item.id) !== String(itemId));
      renderHistory();
      showToast('Item removido do histórico.');
    }

    async function renameHistoryItem(itemId) {
      const item = findHistoryItem(itemId);
      if (!item || typeof HistoryTracker === 'undefined') return;

      const currentTitle = String(item.title || '').trim() || 'Conversa sem título';
      renameTargetItemId = itemId;
      if (renameConversationInput) {
        renameConversationInput.value = currentTitle;
        renameConversationInput.focus();
        renameConversationInput.select();
      }
      if (renameModal) renameModal.classList.add('open');
    }

    function closeRenameModal() {
      renameTargetItemId = null;
      if (renameConversationInput) renameConversationInput.value = '';
      if (renameModal) renameModal.classList.remove('open');
    }

    async function confirmRenameFromModal() {
      if (!renameTargetItemId || typeof HistoryTracker === 'undefined') return;
      const item = findHistoryItem(renameTargetItemId);
      if (!item) {
        closeRenameModal();
        return;
      }

      const currentTitle = String(item.title || '').trim() || 'Conversa sem título';
      const nextTitle = String(renameConversationInput?.value || '').replace(/\s+/g, ' ').trim();
      if (!nextTitle) {
        showToast('Digite um nome válido.', 'error', 7000);
        return;
      }
      if (nextTitle === currentTitle) {
        closeRenameModal();
        return;
      }

      const ok = await HistoryTracker.rename(renameTargetItemId, nextTitle);
      if (!ok) {
        showToast('Não foi possível renomear essa conversa.', 'error', 7000);
        return;
      }

      historyItems = historyItems.map(entry =>
        String(entry.id) === String(renameTargetItemId)
          ? { ...entry, title: nextTitle }
          : entry
      );
      renderHistory();
      closeRenameModal();
      showToast('Conversa atualizada com sucesso.', 'success', 7000);
    }

    function openHistoryItem(itemId) {
      const item = findHistoryItem(itemId);
      if (!item) return;

      if (typeof HistoryTracker !== 'undefined') {
        HistoryTracker.queueResumeAndOpen(item);
        return;
      }

      window.location.href = item.route || 'index.html';
    }

    function bindHistoryEvents() {
      if (historyEventsBound) return;
      historyEventsBound = true;

      if (historySearch) {
        historySearch.addEventListener('input', renderHistory);
      }

      const filterBtns = document.querySelectorAll('.history-filter-btn');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          currentHistoryFilter = btn.getAttribute('data-filter');
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderHistory();
        });
      });

      if (historyList) {
        historyList.addEventListener('click', async (event) => {
          const openBtn = event.target.closest('[data-open-id]');
          if (openBtn) {
            openHistoryItem(openBtn.getAttribute('data-open-id'));
            return;
          }

          const renameBtn = event.target.closest('[data-rename-id]');
          if (renameBtn) {
            await renameHistoryItem(renameBtn.getAttribute('data-rename-id'));
            return;
          }

          const deleteBtn = event.target.closest('[data-delete-id]');
          if (deleteBtn) {
            await deleteHistoryItem(deleteBtn.getAttribute('data-delete-id'));
          }
        });
      }

      if (renameModalClose) {
        renameModalClose.addEventListener('click', closeRenameModal);
      }
      if (renameCancelBtn) {
        renameCancelBtn.addEventListener('click', closeRenameModal);
      }
      if (renameConfirmBtn) {
        renameConfirmBtn.addEventListener('click', confirmRenameFromModal);
      }
      if (renameConversationInput) {
        renameConversationInput.addEventListener('keydown', async (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            await confirmRenameFromModal();
          }
          if (event.key === 'Escape') {
            closeRenameModal();
          }
        });
      }
      if (renameModal) {
        renameModal.addEventListener('click', (event) => {
          if (event.target === renameModal) closeRenameModal();
        });
      }

      if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', async () => {
          if (!confirm('Deseja apagar todo o histórico da sua conta?')) return;
          if (typeof HistoryTracker === 'undefined') return;

          const ok = await HistoryTracker.clearAll();
          if (!ok) {
            showToast('Falha ao limpar histórico.', 'error', 7000);
            return;
          }
          historyItems = [];
          renderHistory();
          showToast('Histórico excluído com sucesso.', 'success', 7000);
        });
      }
    }

    const checkClient = setInterval(async () => {
      profileInitAttempts += 1;

      if (window.supabaseClient && !profileInitStarted) {
        clearInterval(checkClient);
        profileInitStarted = true;
        await initProfile();
        return;
      }

      if (profileInitAttempts >= 100) {
        clearInterval(checkClient);
        showProfileLoadError('Nao foi possivel iniciar o cliente do perfil. Recarregue a pagina e confirme se o Supabase foi carregado.');
      }
    }, 100);

    async function initProfile() {
      try {
      const supabase = window.supabaseClient;
      const usernameInputEl = document.getElementById('username');
      const avatarUrlInputEl = document.getElementById('avatarUrl');
      const avatarFileInputEl = document.getElementById('avatarFile');
      const displayUsernameEl = document.getElementById('displayUsername');
      const displayNameTextEl = displayUsernameEl?.querySelector('span');
      const displayAvatarEl = document.getElementById('displayAvatar');
      const displayEmailEl = document.getElementById('displayEmail');
      const displayCustomTitleEl = document.getElementById('displayCustomTitle');
      const sidebarCrownEl = document.getElementById('sidebarCrown');
      const savedCustomTitle = localStorage.getItem('animehouse_customTitle') || '';
      const savedCrown = localStorage.getItem('animehouse_showCrown') === 'true';
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = 'login.html';
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const fallbackName = user.email ? user.email.split('@')[0] : 'Usuário';
      liveProfileFallbackName = fallbackName;
      const usernameValue = profile?.username || fallbackName;
      const avatarValue = profile?.avatar_url || defaultProfileAvatar;

      usernameInputEl.value = usernameValue;
      avatarUrlInputEl.value = profile?.avatar_url || '';
      syncLiveProfileUI({ username: usernameValue, avatarUrl: avatarValue });
      if (displayEmailEl) displayEmailEl.textContent = user.email || '';
      bindHistoryEvents();
      await refreshHistory();

      usernameInputEl.addEventListener('input', () => {
        syncLiveProfileUI({ username: usernameInputEl.value });
        emitProfileUpdated({ username: usernameInputEl.value });
      });

      avatarUrlInputEl.addEventListener('change', () => {
        syncLiveProfileUI({ avatarUrl: avatarUrlInputEl.value });
        emitProfileUpdated({ avatarUrl: avatarUrlInputEl.value });
      });

      avatarFileInputEl.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showToast('Enviando imagem...');
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.floor(Date.now() / 1000)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);

        if (uploadError) {
          console.error(uploadError);
          showToast('Erro no upload: ' + uploadError.message, 'error', 7000);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrlInputEl.value = publicUrl;
        syncLiveProfileUI({ avatarUrl: publicUrl });
        emitProfileUpdated({ avatarUrl: publicUrl });
        showToast('Imagem cadastrada com sucesso.', 'success', 7000);
      };

      document.getElementById('profileForm').onsubmit = async (e) => {
        e.preventDefault();
        const username = usernameInputEl.value;
        const avatar_url = avatarUrlInputEl.value;

        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            username,
            avatar_url,
            updated_at: new Date()
          });

        if (updateError) {
          showToast('Erro ao salvar: ' + updateError.message, 'error', 7000);
        } else {
          showToast('Perfil atualizado com sucesso.', 'success', 7000);
          syncLiveProfileUI({
            username: username || fallbackName,
            avatarUrl: avatar_url || defaultProfileAvatar
          });
          emitProfileUpdated({
            username: username || fallbackName,
            avatarUrl: avatar_url || defaultProfileAvatar
          });
        }
      };

      document.getElementById('logoutBtn').onclick = async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
      };

      // Avatar View Logic
      const avatarViewOverlay = document.getElementById('avatarViewOverlay');
      const avatarViewImg = document.getElementById('avatarViewImg');
      const avatarViewClose = document.getElementById('avatarViewClose');

      if (displayAvatarEl && avatarViewOverlay && avatarViewImg) {
        displayAvatarEl.addEventListener('click', () => {
          avatarViewImg.src = displayAvatarEl.src;
          avatarViewOverlay.classList.add('active');
        });

        const closeAvatarView = () => {
          avatarViewOverlay.classList.remove('active');
        };

        avatarViewClose?.addEventListener('click', closeAvatarView);
        avatarViewOverlay.addEventListener('click', (e) => {
          if (e.target === avatarViewOverlay) closeAvatarView();
        });
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closeAvatarView();
        });
      }

      // --- CHART JS SETUP ---
      let balanceChartInstance = null;
      function updateBalanceChart(dataValues) {
         const ctx = document.getElementById('balanceChart');
         if (!ctx) return;
         
         const rootStyles = getComputedStyle(document.body);
         const colorPrimary = rootStyles.getPropertyValue('--primary').trim() || '#72FFFF';
         const colorAccent = rootStyles.getPropertyValue('--accent').trim() || '#7fffd4';
         const colorAccent2 = rootStyles.getPropertyValue('--accent2').trim() || '#00ced1';
         const colorDanger = rootStyles.getPropertyValue('--danger').trim() || '#ef4444';
         
         const bgColors = [colorPrimary, colorAccent2, colorAccent, colorDanger];

         const chartData = {
            labels: ['Animes', 'Desenhos', 'Mangás', 'Filmes'],
            datasets: [{
               data: dataValues,
               backgroundColor: bgColors,
               borderWidth: 0,
               hoverOffset: 15
            }]
         };

         if (balanceChartInstance) {
            balanceChartInstance.data.datasets[0].data = dataValues;
            balanceChartInstance.data.datasets[0].backgroundColor = bgColors;
            balanceChartInstance.update();
         } else {
            balanceChartInstance = new Chart(ctx, {
               type: 'doughnut',
               data: chartData,
               options: {
                  cutout: '70%',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                     legend: {
                        position: 'right',
                        labels: {
                           family: 'Righteous',
                           color: '#e2e8f0',
                           usePointStyle: true,
                           padding: 15
                        }
                     }
                  },
                  animation: {
                     animateRotate: true,
                     animateScale: true
                  }
               }
            });
         }
      }

      // Escutar mudança de tema para atualizar as cores do gráfico renderizado sem precisar de f5
      window.addEventListener('themeChanged', () => {
         if (balanceChartInstance) {
             // O setTimeout garante que o navegador aplicou as novas variáveis do body do CSS antes de recalcularmos
             setTimeout(() => {
                 updateBalanceChart(balanceChartInstance.data.datasets[0].data);
             }, 50);
         }
      });

      // --- LOGICA DO DASHBOARD ---
      async function updateDashboard() {
        if (typeof DB === 'undefined' || typeof Watched === 'undefined') return;
        
        await DB.init();
        const countHist = historyItems.length; // Mantido apenas caso precise para outra coisa, mas o XP agora usa totalWatched embaixo.

        // --- CÁLCULO DE PORCENTAGEM POR CHECKMARK ---
        let animeTotal = 0, animeWatched = 0;
        let movieTotal = 0, movieWatched = 0;
        let cartoonTotal = 0, cartoonWatched = 0;
        let mangaTotal = 0, mangaWatched = 0;

        // A. ANIMES
        const allAnimes = DB.getAnimes();
        const allAnimeEps = DB.getAnimeEpisodes ? DB.getAnimeEpisodes() : {};
        
        allAnimes.forEach(a => {
           // Episódios
           const audios = allAnimeEps[a.id] || {};
           ['dublado', 'legendado'].forEach(lang => {
              const seasons = audios[lang] || {};
              Object.values(seasons).forEach(eps => {
                 eps.forEach(ep => {
                    animeTotal++;
                    if (Watched.isWatched(ep.id)) animeWatched++;
                 });
              });
           });
           // Filmes
           const movies = DB.getAnimeMoviesFor(a.id);
           movies.forEach(m => {
              animeTotal++;
              if (Watched.isWatched(m.id)) animeWatched++;
           });
        });

        // B. FILMES
        const siteFilmes = (typeof DB.getFilmes === 'function') ? DB.getFilmes() : [];
        siteFilmes.forEach(f => {
           movieTotal++;
           if (Watched.isWatched(f.id)) movieWatched++;
        });

        // C. DESENHOS
        const siteCartoons = DB.getCartoons();
        siteCartoons.forEach(c => {
           const seasons = DB.getEpisodesFor(c.id);
           Object.values(seasons).forEach(eps => {
              eps.forEach(ep => {
                 cartoonTotal++;
                 if (Watched.isWatched(ep.id)) cartoonWatched++;
              });
           });
           const movies = DB.getMoviesFor(c.id);
           movies.forEach(m => {
              cartoonTotal++;
              if (Watched.isWatched(m.id)) cartoonWatched++;
           });
        });

        // D. MANGÁS
        const siteMangas = DB.getMangas();
        siteMangas.forEach(m => {
           const volumes = DB.getMangaVolumesFor(m.id);
           if (volumes.length > 0) {
              volumes.forEach(v => {
                 mangaTotal++;
                 if (Watched.isWatched(v.id)) mangaWatched++;
              });
           } else {
              mangaTotal++;
              if (Watched.isWatched(m.id)) mangaWatched++;
           }
        });

        // 4. Update Charts & Bars
        const animePercent = animeTotal > 0 ? (animeWatched / animeTotal) * 100 : 0;
        const cartoonPercent = cartoonTotal > 0 ? (cartoonWatched / cartoonTotal) * 100 : 0;
        const mangaPercent = mangaTotal > 0 ? (mangaWatched / mangaTotal) * 100 : 0;
        
        // Regra especial para Filmes: metade cadastrada conta como visto para a análise
        const moviePolicyWatched = movieTotal * 0.5;
        const moviePolicyPercent = movieTotal > 0 ? 50 : 0;

        // Atualizar Barras de Análise
        const updateAnalysisBar = (id, labelId, watched, total, percent) => {
           const bar = document.getElementById(id);
           const lbl = document.getElementById(labelId);
           if (bar) bar.style.width = `${percent}%`;
           // Se for filme, podemos mostrar o valor da política para bater com os 50%
           if (id === 'movieBar') {
              if (lbl) lbl.textContent = `${moviePolicyWatched} / ${total} (Política 50%)`;
           } else {
              if (lbl) lbl.textContent = `${watched} / ${total} (${Math.round(percent)}%)`;
           }
        };
        
        updateAnalysisBar('animeBar', 'animeLabel', animeWatched, animeTotal, animePercent);
        updateAnalysisBar('cartoonBar', 'cartoonLabel', cartoonWatched, cartoonTotal, cartoonPercent);
        updateAnalysisBar('mangaBar', 'mangaLabel', mangaWatched, mangaTotal, mangaPercent);
        // Política 50% nos filmes para a barra visual
        updateAnalysisBar('movieBar', 'movieLabel', movieWatched, movieTotal, moviePolicyPercent);

        // Atualizar Gráfico Chart.js
        if (typeof Chart !== 'undefined') {
            updateBalanceChart([animeWatched, cartoonWatched, mangaWatched, moviePolicyWatched]);
        }

        const totalRegistered = animeTotal + movieTotal + cartoonTotal + mangaTotal;
        const totalWatched = animeWatched + movieWatched + cartoonWatched + mangaWatched;
        const globalText = document.getElementById('globalStatsText');
        if (globalText) {
           globalText.textContent = `${totalWatched} de ${totalRegistered} itens totais assistidos/lidos no projeto.`;
        }

        // --- 1. Level & XP (Lógica Melhorada / Gamificada) ---
        const count = totalWatched; // Mantido para o loop de patentes

        // Pesos de XP: Anime/Desenho = 10xp, Mangá = 15xp, Filme = 50xp
        const totalXP = (animeWatched * 10) + (cartoonWatched * 10) + (mangaWatched * 15) + (movieWatched * 50);
        
        let level = 1;
        let xpRequiredForNext = 100;
        let currentLevelXP = totalXP;

        // Progressão não confusa: O valor de XP escalar
        while (currentLevelXP >= xpRequiredForNext) {
          currentLevelXP -= xpRequiredForNext;
          level++;
          xpRequiredForNext = level * 100;
        }

        const xpProgress = (currentLevelXP / xpRequiredForNext) * 100;

        // Ranks escalam com Level alcançado
        let rank = "Bronze";
        if (level >= 100) rank = "Imortal";
        else if (level >= 75) rank = "Guardião";
        else if (level >= 50) rank = "Hokage";
        else if (level >= 30) rank = "Lenda";
        else if (level >= 20) rank = "Mestre";
        else if (level >= 10) rank = "Ouro";
        else if (level >= 5) rank = "Prata";
        
        document.getElementById('levelNumber').textContent = `LVL ${level}`;
        document.getElementById('rankTitle').textContent = rank;
        document.getElementById('levelProgress').style.width = `${xpProgress}%`;
        
        // Cache for auth.js and global UI
        localStorage.setItem('animehouse_userLevel', level);
        localStorage.setItem('animehouse_userRank', rank);
        
        const xpCurrEl = document.getElementById('xpCurrent');
        const xpTargetEl = document.getElementById('xpTarget');
        const xpTotalEl = document.getElementById('totalXpCount');
        if (xpCurrEl) xpCurrEl.textContent = currentLevelXP;
        if (xpTargetEl) xpTargetEl.textContent = xpRequiredForNext;
        if (xpTotalEl) xpTotalEl.textContent = totalXP;

        // 1.5 Liberação da Coroa e VIP
        const vipLockOverlay = document.getElementById('vipLockedOverlay');
        const vipContent = document.getElementById('vipPerksContent');
        if (level >= 50) {
            if (vipLockOverlay) vipLockOverlay.style.display = 'none';
            if (vipContent) { vipContent.style.opacity = '1'; vipContent.style.pointerEvents = 'auto'; }
        } else {
            if (vipLockOverlay) vipLockOverlay.style.display = 'flex';
            if (vipContent) { vipContent.style.opacity = '0.5'; vipContent.style.pointerEvents = 'none'; }
        }

        const optFire = document.querySelector('option[value="avatar-aura-fire"]');
        const optGuardian = document.querySelector('option[value="avatar-aura-guardian"]');
        const optImmortal = document.querySelector('option[value="avatar-aura-immortal"]');
        
        if (optFire) {
            optFire.disabled = level < 50;
            optFire.textContent = level < 50 ? "🔥 Chamas do Hokage (Exige LVL 50)" : "🔥 Chamas do Hokage";
        }
        if (optGuardian) {
            optGuardian.disabled = level < 75;
            optGuardian.textContent = level < 75 ? "🛡️ Escudo de Guardião (Exige LVL 75)" : "🛡️ Escudo de Guardião (Azul)";
        }
        if (optImmortal) {
            optImmortal.disabled = level < 100;
            optImmortal.textContent = level < 100 ? "⚡ Poder Imortal (Exige LVL 100)" : "⚡ Poder Imortal (Roxo)";
        }

        const toggleCrown = document.getElementById('crownToggle');
        const lockText = document.getElementById('crownLockText');
        const isCrownUnlocked = level >= 50;

        if (toggleCrown && lockText) {
            if (!isCrownUnlocked) {
                toggleCrown.disabled = true;
                toggleCrown.checked = false;
                toggleCrown.style.opacity = '0.5';
                localStorage.setItem('animehouse_showCrown', 'false');
                lockText.style.display = 'none'; // overlay já cobre
            } else {
                toggleCrown.disabled = false;
                toggleCrown.style.opacity = '1';
                lockText.style.display = 'none';
            }
        }

        // Limpar aura se não tem o level para usá-la
        const savedAuraCheck = localStorage.getItem('animehouse_customAura') || 'none';
        if ((savedAuraCheck === 'avatar-aura-fire' && level < 50) ||
            (savedAuraCheck === 'avatar-aura-guardian' && level < 75) ||
            (savedAuraCheck === 'avatar-aura-immortal' && level < 100)) {
            localStorage.setItem('animehouse_customAura', 'none');
            displayAvatarEl?.classList.remove('avatar-aura-fire','avatar-aura-guardian','avatar-aura-immortal');
            const auraSel2 = document.getElementById('auraSelector');
            if (auraSel2) auraSel2.value = 'none';
        }

        // === LEVEL-UP DETECTION ===
        const prevLevel = parseInt(localStorage.getItem('animehouse_prevLevel') || '0');
        const prevRank  = localStorage.getItem('animehouse_prevRank')  || '';
        if (prevLevel > 0 && level > prevLevel) {
            const rankChanged = rank !== prevRank;
            showLevelUpToast(level, rankChanged ? rank : null);
        }
        localStorage.setItem('animehouse_prevLevel', level);
        localStorage.setItem('animehouse_prevRank',  rank);

        // 2. Patentes
        const patents = document.querySelectorAll('.patent-badge');
        patents.forEach(badge => {
          const label = badge.getAttribute('data-label');
          let unlocked = false;
          if (label === "Bronze" && level >= 1) unlocked = true;
          else if (label === "Prata" && level >= 5) unlocked = true;
          else if (label === "Ouro" && level >= 10) unlocked = true;
          else if (label === "Mestre" && level >= 20) unlocked = true;
          else if (label === "Lenda" && level >= 30) unlocked = true;
          else if (label === "Hokage" && level >= 50) unlocked = true;
          else if (label === "Guardião" && level >= 75) unlocked = true;
          else if (label === "Imortal" && level >= 100) unlocked = true;

          if (unlocked) badge.classList.add('unlocked');
          else badge.classList.remove('unlocked');

          if (!badge.dataset.listener) {
            badge.addEventListener('click', () => {
              const modal = document.getElementById('patentModal');
              document.getElementById('patentTitle').textContent = `Patente: ${label}`;
              document.getElementById('patentIcon').textContent = badge.textContent;
              document.getElementById('patentDesc').textContent = badge.getAttribute('data-desc');
              const status = document.getElementById('patentStatus');
              status.textContent = unlocked ? "✅ CONQUISTADO" : "🔒 BLOQUEADO";
              status.style.color = unlocked ? "var(--success)" : "var(--danger)";
              modal.classList.add('open');
            });
            badge.dataset.listener = "true";
          }
        });

        // Modal Close logic
        document.getElementById('patentModalClose')?.addEventListener('click', () => document.getElementById('patentModal').classList.remove('open'));
        document.getElementById('patentModal')?.addEventListener('click', (e) => { if(e.target.id === 'patentModal') e.target.classList.remove('open'); });

        if (historyItems.length > 0) {
          // Última atividade
          const last = historyItems[0];
          document.getElementById('lastActivityTitle').textContent = last.title || 'Conteúdo';
          const date = new Date(last.last_watched_at);
          document.getElementById('lastActivityDate').textContent = date.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

          // Consultas IA
          const iaHistCount = historyItems.filter(item => item.content_type && item.content_type.startsWith('ai_')).length;
          const iaCountEl = document.getElementById('iaCount');
          if (iaCountEl) iaCountEl.textContent = iaHistCount.toString();
        }

        // Top Categoria
        const categories = [
          { name: 'Animes', count: animeWatched },
          { name: 'Desenhos', count: cartoonWatched },
          { name: 'Mangás', count: mangaWatched },
          { name: 'Filmes', count: movieWatched }
        ];
        categories.sort((a,b) => b.count - a.count);
        const topCat = categories[0].count > 0 ? categories[0].name : "Nenhuma";
        const favCatEl = document.getElementById('favCategory');
        if(favCatEl) favCatEl.textContent = topCat;

        // Tempo Estimado de Tela (base 24m)
        const totalMinutes = totalWatched * 24;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const estimatedTimeEl = document.getElementById('estimatedTime');
        if(estimatedTimeEl) estimatedTimeEl.textContent = `${hours}h ${mins}m`;
      }

      // --- FAVORITOS SYSTEM ---
      let currentFavType = 'anime';

      async function loadFavorites() {
        const grid = document.getElementById('favoritesGrid');
        if (!grid) return;
        grid.innerHTML = '<div class="history-empty" style="grid-column: 1/-1;"><p>Buscando sua coleção mística...</p></div>';
        try {
          const allFavs = await DB.getFavorites(currentFavType);
          const favs = allFavs.slice(0, 10);
          grid.innerHTML = '';
          if (!favs || favs.length === 0) {
            grid.innerHTML = `<div class="history-empty" style="grid-column: 1/-1;"><p>Nenhum ${currentFavType} favoritado ainda. ⭐</p></div>`;
            return;
          }
          const hasHighlights = localStorage.getItem('equipped_lista_destaque') === 'true';

          favs.forEach(fav => {
            const title = fav.title || 'Sem título';
            const cover = fav.cover_url || fav.metadata?.cover || 'assets/placeholder.jpg';
            const card = document.createElement('div');
            card.className = 'fav-card';
            
            const pinHtml = hasHighlights ? `<div class="fav-pin" title="Destaque Premium">📌</div>` : '';
            
            card.innerHTML = `
              <img src="${cover}" alt="${title}">
              ${pinHtml}
              <div class="fav-card-info">
                <div class="fav-card-title">${title}</div>
              </div>
              <button class="fav-card-remove" data-id="${fav.id}">✕</button>
            `;
            card.addEventListener('click', (e) => {
              if (e.target.classList.contains('fav-card-remove')) return;
              if (fav.metadata?.url) window.location.href = fav.metadata.url;
            });
            card.querySelector('.fav-card-remove').addEventListener('click', async (e) => {
              e.stopPropagation();
              if (await DB.removeFavorite(fav.id)) {
                loadFavorites();
                showToast('Removido dos favoritos.');
              }
            });
            grid.appendChild(card);
          });
        } catch (error) {
          console.error('Erro ao carregar favoritos:', error);
          grid.innerHTML = '<div class="history-empty" style="grid-column: 1/-1;"><p>Erro ao carregar sua coleção.</p></div>';
        }
      }
      const favTabs = document.querySelectorAll('.fav-tab');
      favTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          favTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          currentFavType = tab.dataset.type;
          loadFavorites();
        });
      });

      loadFavorites();

      // --- CONFIGURAÇÃO GLOBAL DE ITENS ---
      const ITEM_CONFIG = {
        'coroa_lendaria': { name: 'Coroa Rei dos Animes', icon: '👑', type: 'exclusivo', crownId: 'hokage', crownIcon: '👑', rarity: 'legendary' },
        'coroa_tryhard': { name: 'Coroa Tryhard', icon: '💀', type: 'exclusivo', crownId: 'tryhard', crownIcon: '💀', rarity: 'legendary' },
        'placa_colecionador': { name: 'Placa Colecionador Mestre', icon: '🏆', type: 'exclusivo', rarity: 'legendary' },
        'aura_chama': { name: 'Aura Chama Simples', icon: '🔥', type: 'aura', class: 'aura-common-chama', rarity: 'common' },
        'aura_chama_naruto': { name: 'Aura Modo Sábio', icon: '🔥', type: 'aura', class: 'aura-common-naruto', rarity: 'common' },
        'aura_ceifador': { name: 'Aura do Ceifador', icon: '📓', type: 'aura', class: 'aura-rare-ceifador', rarity: 'rare' },
        'aura_thunder': { name: 'Aura Relâmpago', icon: '⚡', type: 'aura', class: 'aura-rare-thunder', rarity: 'rare' },
        'aura_susanoo': { name: 'Aura Susanoo', icon: '⚡', type: 'aura', class: 'aura-rare-susanoo', rarity: 'rare' },
        'aura_sakura': { name: 'Aura Sakura', icon: '🌸', type: 'aura', class: 'aura-rare-sakura', rarity: 'rare' },
        'aura_gelo': { name: 'Aura Gelo', icon: '❄️', type: 'aura', class: 'aura-epic-gelo', rarity: 'epic' },
        'aura_stands': { name: 'Aura Star Platinum', icon: '🟣', type: 'aura', class: 'aura-epic-stands', rarity: 'epic' },
        'aura_void_saitama': { name: 'Aura ONE PUNCH', icon: '👊', type: 'aura', class: 'aura-epic-void', rarity: 'epic' },
        'aura_dragon': { name: 'Aura Dragão Arcano', icon: '🐉', type: 'aura', class: 'aura-legendary-dragon', rarity: 'legendary' },
        'titulo_explorador': { name: 'Título: Explorador', icon: '🗺️', type: 'titulo', title: '🗺️ Explorador', rarity: 'common' },
        'titulo_caçador': { name: 'Título: Caçador', icon: '🎯', type: 'titulo', title: '🎯 Caçador de Episódios', rarity: 'common' },
        'titulo_espadachim': { name: 'Título: Espadachim Solitário', icon: '🗡️', type: 'titulo', title: '🗡️ Espadachim Solitário', rarity: 'common' },
        'titulo_mestre_das_listas': { name: 'Título: Mestre das Listas', icon: '📋', type: 'titulo', title: '📋 Mestre das Listas', rarity: 'rare' },
        'titulo_guardiao': { name: 'Título: Guardião Lenda', icon: '🛡️', type: 'titulo', title: '🛡️ Guardião Lenda', rarity: 'epic' },
        'titulo_sensei_mod': { name: 'Título: SenseiMod', icon: '🎓', type: 'titulo', title: '🎓 SenseiMod', rarity: 'legendary' },
        'banner_claro': { name: 'Banner Aurora', icon: '🌅', type: 'banner', rarity: 'common' },
        'banner_berserk': { name: 'Banner Berserk', icon: '⚔️', type: 'banner', rarity: 'rare' },
        'banner_cosmica': { name: 'Banner Cósmica', icon: '🌌', type: 'banner', rarity: 'epic' },
        'banner_oni': { name: 'Banner Oni Samurai', icon: '🎭', type: 'banner', rarity: 'epic' },
        'banner_shinobi': { name: 'Banner Shinobi Dark', icon: '🥷', type: 'banner', rarity: 'epic' },
        'banner_aot': { name: 'Banner AOT Muralha', icon: '🧱', type: 'banner', rarity: 'epic' },
        'banner_ragnarok': { name: 'Banner Ragnarok', icon: '🏛️', type: 'banner', rarity: 'epic' },
        'banner_cosmos': { name: 'Banner Cosmos', icon: '🌀', type: 'banner', rarity: 'legendary' },
        'banner_vinland': { name: 'Banner Vinland Saga', icon: '🛡️', type: 'banner', rarity: 'legendary' },
        'lista_destaque': { name: 'Favoritos Destacados', icon: '📌', type: 'experiencia', rarity: 'common' },
        'modo_cinema': { name: 'Modo Cinema', icon: '🎬', type: 'experiencia', rarity: 'rare' },
        'frame_dourado': { name: 'Moldura Elite', icon: '🪙', type: 'experiencia', rarity: 'epic' },
        'dashboard_premium': { name: 'Painel Premium', icon: '📊', type: 'experiencia', rarity: 'legendary' }
      };

      async function updateInventoryUI() {
        const grid = document.getElementById('profileInventory');
        const noItemsNote = document.getElementById('noItemsNote');
        if (!grid) return;

        let storeData;
        if (window.DB && window.DB._store && window.DB._store.profile && window.DB._store.profile.store_data) {
          storeData = window.DB._store.profile.store_data;
        } else {
          storeData = JSON.parse(localStorage.getItem('animehouse_store') || '{}');
        }
        
        const purchasedIds = storeData.purchased || [];
        const equipped = storeData.equipped || {};
        grid.innerHTML = '';

        const itemsToRender = purchasedIds.map(itemId => {
          const data = ITEM_CONFIG[itemId];
          if (!data) return null;

          let isEquipped = false;
          if (data.type === 'aura') {
              isEquipped = equipped.aura === data.class;
          } else if (data.type === 'titulo') {
              isEquipped = equipped.titulo === data.title;
          } else if (data.type === 'banner') {
              isEquipped = equipped.banner === itemId;
          } else if (data.type === 'exclusivo' && data.crownId) {
              isEquipped = equipped.crown === true && equipped.crownId === data.crownId;
          } else {
              isEquipped = equipped[itemId] === true;
          }
          return { itemId, data, isEquipped };
        }).filter(Boolean);

        // Agrupar/Odenar: Equipados no topo, depois organizados por tipo
        itemsToRender.sort((a, b) => {
           if (a.isEquipped && !b.isEquipped) return -1;
           if (!a.isEquipped && b.isEquipped) return 1;
           if (a.data.type < b.data.type) return -1;
           if (a.data.type > b.data.type) return 1;
           return 0;
        });

        itemsToRender.forEach(({ itemId, data, isEquipped }) => {
          const card = document.createElement('div');
          card.className = `inventory-item ${isEquipped ? 'equipped' : ''} rarity-${data.rarity || 'none'}`;
          card.innerHTML = `
            <div class="rarity-badge">${data.rarity || 'Normal'}</div>
            <div class="inv-icon">${data.icon}</div>
            <div class="inv-name">${data.name}</div>
            <div class="inv-type">${data.type}</div>
            <button class="equip-btn ${isEquipped ? 'btn-unequip' : 'btn-equip'}" onclick="equipItem('${itemId}')">
              ${isEquipped ? 'Usando (Remover)' : 'Equipar'}
            </button>
          `;
          grid.appendChild(card);
        });

        if (noItemsNote) noItemsNote.style.display = itemsToRender.length === 0 ? 'block' : 'none';
      }

      window.equipItem = async function(itemId) {
          // Carregar storeData atualizado (Banco preferencial)
          let storeData;
          if (window.DB && window.DB._store && window.DB._store.profile && window.DB._store.profile.store_data) {
            storeData = window.DB._store.profile.store_data;
          } else {
            storeData = JSON.parse(localStorage.getItem('animehouse_store') || '{}');
          }

          const data = ITEM_CONFIG[itemId];
          if (!data) return;

          if (!storeData.equipped) storeData.equipped = {};

          if (data.type === 'aura') {
              const current = storeData.equipped.aura;
              storeData.equipped.aura = (current === data.class) ? 'none' : data.class;
          } else if (data.type === 'titulo') {
              const current = storeData.equipped.titulo;
              storeData.equipped.titulo = (current === data.title) ? '' : data.title;
          } else if (data.type === 'banner') {
              const current = storeData.equipped.banner;
              storeData.equipped.banner = (current === itemId) ? 'none' : itemId;
          } else if (data.type === 'exclusivo' && data.crownId) {
              const showing = storeData.equipped.crown === true;
              const sameId = storeData.equipped.crownId === data.crownId;

              if (showing && sameId) {
                  storeData.equipped.crown = false;
              } else {
                  storeData.equipped.crown = true;
                  storeData.equipped.crownId = data.crownId;
                  storeData.equipped.crownIcon = data.crownIcon;
              }
          } else {
              const current = storeData.equipped[itemId] === true;
              storeData.equipped[itemId] = !current;
          }

          // Salvar no Banco
          if (window.DB && window.DB.saveStoreData) {
            await window.DB.saveStoreData(storeData);
          }

          // 🔄 Atualizar TODAS as visualizações imediatamente
          updateInventoryUI();
          syncLiveProfileUI();
          applyAuraToAvatar();
          applySpecialPerks();
          
          if (typeof updateNavbarCosmetics === 'function') updateNavbarCosmetics();
          
          emitProfileUpdated();
      };

      window.applySpecialPerks = function() {
        let equipped = {};
        if (window.DB && window.DB._store && window.DB._store.profile && window.DB._store.profile.store_data) {
           equipped = window.DB._store.profile.store_data.equipped || {};
        }

        const hasFrame = equipped['frame_dourado'] === true;
        const hasCinema = equipped['modo_cinema'] === true;
        const hasPremium = equipped['dashboard_premium'] === true;
        const hasPlaque = equipped['placa_colecionador'] === true;
        const hasHighlights = equipped['lista_destaque'] === true;

        // 1. Moldura
        const avatar = document.getElementById('displayAvatar');
        const navAvatar = document.getElementById('navAvatar');
        if (avatar) {
          if (hasFrame) avatar.classList.add('frame-dourado');
          else avatar.classList.remove('frame-dourado');
        }
        if (navAvatar) {
          if (hasFrame) navAvatar.classList.add('frame-dourado');
          else navAvatar.classList.remove('frame-dourado');
        }

        // 2. Cinema
        if (hasCinema) document.body.classList.add('modo-cinema');
        else document.body.classList.remove('modo-cinema');

        // 3. Premium Stats
        const premiumSection = document.getElementById('premiumStatsSection');
        if (premiumSection) {
          premiumSection.style.display = hasPremium ? 'block' : 'none';
          if (hasPremium) updatePremiumMetrics();
        }

        // 4. Placa
        const plaque = document.getElementById('collectorPlaque');
        if (plaque) {
          const isVisible = hasPlaque ? 'block' : 'none';
          plaque.style.display = isVisible;
          if (hasPlaque) {
            const user = localStorage.getItem('animehouse_user') ? JSON.parse(localStorage.getItem('animehouse_user')) : null;
            const name = user?.user_metadata?.username || user?.user_metadata?.full_name || 'Mestre';
            plaque.querySelector('.plaque-text').textContent = name;
          }
        }

        // 5. Lista Destaque
        const favGrid = document.getElementById('favoritesGrid');
        if (favGrid) {
          if (hasHighlights) favGrid.classList.add('destaque-favoritos');
          else favGrid.classList.remove('destaque-favoritos');
        }
      };

      function updatePremiumMetrics() {
        // Cálculo básico para as estatísticas premium
        const totalItems = (typeof historyItems !== 'undefined') ? historyItems.length : 0;
        const totalHours = Math.round((totalItems * 24) / 60);
        const efficiency = totalItems > 0 ? 100 : 0;
        
        const hEl = document.getElementById('premiumTotalHours');
        const eEl = document.getElementById('premiumEfficiency');
        const wEl = document.getElementById('premiumWeeklyAvg');

        if (hEl) hEl.textContent = totalHours + 'h';
        if (eEl) eEl.textContent = efficiency + '%';
        if (wEl) wEl.textContent = totalItems + ' itens';
      }

      function applyAuraToAvatar() {
          const displayAvatarEl = document.getElementById('displayAvatar');
          if (!displayAvatarEl) return;
          
          // Remove all possible aura classes
          const auraClasses = [
            'aura-common-chama', 'aura-common-naruto',
            'aura-rare-ceifador', 'aura-rare-thunder', 'aura-rare-susanoo', 'aura-rare-sakura',
            'aura-epic-gelo', 'aura-epic-stands', 'aura-epic-void',
            'aura-legendary-dragon',
            'avatar-aura-fire', 'avatar-aura-guardian', 'avatar-aura-immortal'
          ];
          displayAvatarEl.classList.remove(...auraClasses);
          
          let aura = 'none';
          if (window.DB && window.DB._store && window.DB._store.profile && window.DB._store.profile.store_data) {
             const sData = window.DB._store.profile.store_data;
             aura = (sData.equipped && sData.equipped.aura) || 'none';
          }

          if (aura !== 'none') displayAvatarEl.classList.add(aura);
      }

      function showLevelUpToast(level, newRank) {
          const toast = document.getElementById('levelUpToast');
          if (!toast) return;
          const card = document.getElementById('levelUpCard');
          const lvlText = toast.querySelector('.lvl-badge');
          const rankBadge = toast.querySelector('.rank-badge');
          
          if (lvlText) lvlText.textContent = level;
          if (rankBadge) {
              rankBadge.textContent = newRank || localStorage.getItem('animehouse_userRank') || 'Hokage';
          }
          
          toast.classList.remove('hidden');
          setTimeout(() => {
              card.classList.add('lvlup-exit');
              setTimeout(() => {
                toast.classList.add('hidden');
                card.classList.remove('lvlup-exit');
              }, 500);
          }, 4500);
      }

      // ⏳ Sincronizar carregamento: Esperar DB.init() terminar antes de desenhar a interface
      updateDashboard().then(() => {
          updateInventoryUI();
          syncLiveProfileUI();
          applyAuraToAvatar();
          applySpecialPerks();
          bindHistoryEvents();
      });

      window.addEventListener('storage', (e) => {
          const keys = ['animehouse_store', 'animehouse_customAura', 'animehouse_customTitle', 'animehouse_customBanner', 'animehouse_showCrown','animehouse_customCrownId','animehouse_customCrownIcon'];
          if (keys.includes(e.key) || (e.key && e.key.startsWith('equipped_'))) {
              updateInventoryUI();
              syncLiveProfileUI();
              applyAuraToAvatar();
              applySpecialPerks();
          }
      });

      window.addEventListener('profileUpdated', () => {
          syncLiveProfileUI();
          updateInventoryUI();
          applyAuraToAvatar();
          updateDashboard();
          applySpecialPerks();
      });

      } catch (error) {
        console.error('Falha ao inicializar o perfil:', error);
        showProfileLoadError(error?.message || 'Falha ao carregar os dados do perfil.');
      }
    }
  });
    