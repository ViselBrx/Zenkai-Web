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

    function getFilteredHistoryItems() {
      const term = (historySearch?.value || '').trim().toLowerCase();
      if (!term) return historyItems;

      return historyItems.filter(item => {
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
      const usernameValue = profile?.username || fallbackName;
      const avatarValue = profile?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

      document.getElementById('username').value = usernameValue;
      document.getElementById('avatarUrl').value = profile?.avatar_url || '';
      if (displayNameTextEl) displayNameTextEl.textContent = usernameValue;
      else if (displayUsernameEl) displayUsernameEl.textContent = usernameValue;
      if (displayAvatarEl) displayAvatarEl.src = avatarValue;
      if (displayEmailEl) displayEmailEl.textContent = user.email || '';
      if (displayCustomTitleEl) displayCustomTitleEl.textContent = savedCustomTitle;
      if (sidebarCrownEl) sidebarCrownEl.style.display = savedCrown ? 'block' : 'none';

      bindHistoryEvents();
      await refreshHistory();

      document.getElementById('avatarFile').onchange = async (e) => {
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

        document.getElementById('avatarUrl').value = publicUrl;
        if (displayAvatarEl) displayAvatarEl.src = publicUrl;
        showToast('Imagem cadastrada com sucesso.', 'success', 7000);
      };

      document.getElementById('profileForm').onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const avatar_url = document.getElementById('avatarUrl').value;

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
          if (displayNameTextEl) displayNameTextEl.textContent = username || fallbackName;
          else if (displayUsernameEl) displayUsernameEl.textContent = username || fallbackName;
          if (displayAvatarEl) displayAvatarEl.src = avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
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
          favs.forEach(fav => {
            const card = document.createElement('div');
            card.className = 'fav-card';
            const title = fav.metadata?.title || 'Conteúdo';
            const cover = fav.metadata?.cover || 'assets/tryhard.png';
            card.innerHTML = `
              <img src="${cover}" alt="${title}">
              <div class="fav-card-info">
                <div class="fav-card-title">${title}</div>
              </div>
              <button class="fav-card-remove" data-id="${fav.content_id}" title="Remover dos favoritos">✕</button>
            `;
            card.querySelector('.fav-card-remove').onclick = async (e) => {
              e.stopPropagation();
              if (confirm(`Remover "${title}" dos favoritos?`)) {
                await DB.toggleFavorite(fav.content_id, fav.content_type);
                loadFavorites();
                showToast('Removido dos favoritos.');
              }
            };
            grid.appendChild(card);
          });
        } catch (err) { console.error(err); }
      }

      // Hook dashboard update into history refresh
      const originalRefreshFn = refreshHistory;
      refreshHistory = async () => {
        await originalRefreshFn();
        await updateDashboard();
        await loadFavorites();
      };

      const favTabs = document.querySelectorAll('.fav-tab');
      if (favTabs.length > 0) {
        favTabs.forEach(tab => {
          tab.addEventListener('click', () => {
            document.querySelectorAll('.fav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFavType = tab.getAttribute('data-type');
            loadFavorites();
          });
        });
      }

      await loadFavorites();
      await updateDashboard();

      // ====== LEVEL-UP TOAST LOGIC ======
      function showLevelUpToast(newLevel, newRank) {
        let toast = document.getElementById('levelUpToast');
        if (!toast) {
          toast = document.createElement('div');
          toast.id = 'levelUpToast';
          toast.innerHTML = `
            <div id="levelUpCard">
              <div class="particles" id="toastParticles"></div>
              <div class="lvl-label">⚡ LEVEL UP ⚡</div>
              <div class="lvl-badge" id="toastLevelNum">LVL ${newLevel}</div>
              <div style="font-size:0.9rem; color: var(--text-muted); margin-top:10px;">Você subiu de nível!</div>
              ${newRank ? `<div class="rank-badge">🏅 Nova Patente: ${newRank}</div>` : ''}
              <button onclick="closeLevelUpToast()" style="margin-top:24px; padding:8px 28px; border-radius:50px; border:1px solid rgba(var(--primary-rgb),0.5); background: rgba(var(--primary-rgb),0.15); color:var(--primary); font-family:'Bangers'; font-size:1rem; letter-spacing:1px; cursor:pointer;">CONTINUAR</button>
            </div>
          `;
          document.body.appendChild(toast);
        } else {
          const card = document.getElementById('levelUpCard');
          if (card) card.classList.remove('lvlup-exit');
          document.getElementById('toastLevelNum').textContent = `LVL ${newLevel}`;
          const rankBadge = card?.querySelector('.rank-badge');
          if (newRank) {
            if (rankBadge) { rankBadge.textContent = `🏅 Nova Patente: ${newRank}`; rankBadge.style.display = 'inline-block'; }
            else {
              const rb = document.createElement('div');
              rb.className = 'rank-badge';
              rb.textContent = `🏅 Nova Patente: ${newRank}`;
              card.querySelector('button').before(rb);
            }
          } else if (rankBadge) {
            rankBadge.style.display = 'none';
          }
          toast.classList.remove('hidden');
        }
        // Partículas
        const container = document.getElementById('toastParticles');
        if (container) {
          container.innerHTML = '';
          const dirs = ['translate(-80px,-120px)','translate(80px,-120px)','translate(-120px,0px)','translate(120px,0px)','translate(-60px,120px)','translate(60px,120px)','translate(0px,-140px)','translate(0px,140px)'];
          dirs.forEach((tx) => {
            const s = document.createElement('span');
            s.style.cssText = `left:50%;top:50%;--tx:${tx};`;
            container.appendChild(s);
          });
        }
        toast.style.display = 'flex';
      }

      window.closeLevelUpToast = () => {
        const card = document.getElementById('levelUpCard');
        if (card) card.classList.add('lvlup-exit');
        setTimeout(() => {
          const toast = document.getElementById('levelUpToast');
          if (toast) toast.classList.add('hidden');
        }, 500);
      };

      // --- LÓGICA DE CUSTOMIZAÇÃO ESPECÍFICA ---
      function updateInventoryUI() {
        const rawStore = localStorage.getItem('animehouse_store');
        let purchased = [];
        
        try {
            const parsed = JSON.parse(rawStore);
            purchased = Array.isArray(parsed) ? parsed : (parsed?.purchased || []);
        } catch(e) { purchased = []; }

        const invGrid = document.getElementById('profileInventory');
        const emptyNote = document.getElementById('noItemsNote');

        if (!invGrid) return;
        invGrid.innerHTML = '';

        if (purchased.length === 0) {
            if (emptyNote) emptyNote.style.display = 'block';
            return;
        }
        if (emptyNote) emptyNote.style.display = 'none';

        const itemData = {
          // Banners
          'banner_claro': { name: 'Aurora Simples', icon: '🌅', type: 'banner' },
          'banner_cosmica': { name: 'Noite Cósmica', icon: '🌌', type: 'banner' },
          'banner_berserk': { name: 'Eclipse Guts', icon: '⚔️', type: 'banner' },
          'banner_oni': { name: 'Oni Samurai', icon: '🎭', type: 'banner' },
          'banner_shinobi': { name: 'Shinobi Dark', icon: '🥷', type: 'banner' },
          'banner_alucard': { name: 'Alucard', icon: '🧛', type: 'banner' },
          'banner_cosmos': { name: 'Cosmos', icon: '🌀', type: 'banner' },
          'banner_tengen_gurren': { name: 'Gurren Lagann', icon: '🦾', type: 'banner' },
          'banner_aot': { name: 'Attack on Titan', icon: '🧱', type: 'banner' },
          'banner_vinland': { name: 'Vinland Saga', icon: '🛡️', type: 'banner' },
          'banner_ragnarok': { name: 'Arena Ragnarok', icon: '🏛️', type: 'banner' },
          
          // Títulos
          'titulo_explorador': { name: 'Explorador', icon: '🗺️', type: 'titulo' },
          'titulo_caçador': { name: 'Caçador', icon: '🎯', type: 'titulo' },
          'titulo_espadachim': { name: 'Espadachim', icon: '🗡️', type: 'titulo' },
          'titulo_mestre_das_listas': { name: 'Mestre Listas', icon: '📋', type: 'titulo' },
          'titulo_sensei_mod': { name: 'SenseiMod', icon: '🎓', type: 'titulo' },
          'titulo_guardiao': { name: 'Guardião Lenda', icon: '🛡️', type: 'titulo' },
          'titulo_espadachim_solitario': { name: 'Espadachim Solitário', icon: '🗡️', type: 'titulo' },
          
          // Auras
          'aura_chama': { name: 'Chama', icon: '🔥', type: 'aura' },
          'aura_modo_sabio': { name: 'Modo Sábio', icon: '🔥', type: 'aura' },
          'aura_ceifador': { name: 'Ceifador', icon: '📓', type: 'aura' },
          'aura_thunder': { name: 'Relâmpago', icon: '⚡', type: 'aura' },
          'aura_susanoo': { name: 'Susanoo', icon: '⚡', type: 'aura' },
          'aura_sakura': { name: 'Sakura', icon: '🌸', type: 'aura' },
          'aura_infinity': { name: 'Infinity', icon: '🔵', type: 'aura' },
          'aura_stands': { name: 'Stand', icon: '🟣', type: 'aura' },
          'aura_dragon': { name: 'Dragão', icon: '🐉', type: 'aura' },
          'aura_dragon_haoshoku': { name: 'Haoshoku', icon: '🐲', type: 'aura' },
          'aura_void_saitama': { name: 'One Punch', icon: '👊', type: 'aura' },
          'aura_gelo': { name: 'Gelo', icon: '❄️', type: 'aura' },
          'coroa_lendaria': { name: 'Coroa Rei', icon: '👑', type: 'exclusivo' }
        };

        purchased.forEach(itemId => {
          const data = itemData[itemId];
          if (!data) return;
          
          let isEquipped = false;
          const currentAura = localStorage.getItem('animehouse_customAura');
          const currentTitle = localStorage.getItem('animehouse_customTitle');
          const currentBanner = localStorage.getItem('animehouse_customBanner');
          const showCrown = localStorage.getItem('animehouse_showCrown') === 'true';

          if (data.type === 'aura') isEquipped = currentAura === itemId;
          if (data.type === 'titulo') isEquipped = currentTitle === data.name;
          if (data.type === 'banner') isEquipped = currentBanner === itemId;
          if (data.type === 'exclusivo') isEquipped = showCrown && itemId.includes('coroa');

          const card = document.createElement('div');
          card.className = 'inventory-item' + (isEquipped ? ' equipped' : '');
          card.innerHTML = `
            <div class="inv-icon">${data.icon}</div>
            <div class="inv-name">${data.name}</div>
            <div class="inv-type">${data.type.toUpperCase()}</div>
          `;
          card.onclick = () => equipItem(itemId, data);
          invGrid.appendChild(card);
        });
      }

      function applyAuraToAvatar() {
        const navAvatarBox = document.querySelector('.user-nav-avatar-box');
        const profileAvatar = document.getElementById('displayAvatar');
        
        const activeAura = localStorage.getItem('animehouse_customAura') || 'none';
        
        [navAvatarBox, profileAvatar].forEach(el => {
            if (!el) return;
            // Mantém a classe base e limpa as de aura
            el.classList.remove('aura_chama','aura_thunder','aura_sakura','aura_susanoo','aura_infinity','aura_ceifador','aura_dragon','aura_gelo');
            if (activeAura !== 'none') el.classList.add(activeAura);
        });
      }

      function equipItem(id, data) {
        if (data.type === 'aura') {
            const current = localStorage.getItem('animehouse_customAura');
            if (current === id) {
                localStorage.setItem('animehouse_customAura', 'none');
                showToast('Aura removida.');
            } else {
                localStorage.setItem('animehouse_customAura', id);
                showToast(`Equipou: ${data.name}`);
            }
        } else if (data.type === 'titulo') {
            const current = localStorage.getItem('animehouse_customTitle');
            if (current === data.name) {
                localStorage.removeItem('animehouse_customTitle');
                showToast('Título removido.');
            } else {
                localStorage.setItem('animehouse_customTitle', data.name);
                showToast(`Título definido como: ${data.name}`);
            }
        } else if (data.type === 'banner') {
            const current = localStorage.getItem('animehouse_customBanner');
            if (current === id) {
                localStorage.removeItem('animehouse_customBanner');
                showToast('Banner removido.');
            } else {
                localStorage.setItem('animehouse_customBanner', id);
                showToast(`Banner alterado: ${data.name}`);
            }
        } else if (data.type === 'exclusivo') {
            const current = localStorage.getItem('animehouse_showCrown') === 'true';
            localStorage.setItem('animehouse_showCrown', (!current).toString());
            showToast(current ? 'Coroa ocultada.' : 'Coroa equipada com sucesso!');
        }
        
        updateInventoryUI();
        applyAuraToAvatar();
        // Disparar evento para outros componentes (navbar/sidebar)
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('profileUpdated'));
      }

      // Inicializa inventario
      updateInventoryUI();
      applyAuraToAvatar();

      // Listen para compras na loja sem precisar de f5
      window.addEventListener('storage', (e) => {
          if (e.key === 'animehouse_store') updateInventoryUI();
      });
      } catch (error) {
        console.error('Falha ao inicializar o perfil:', error);
        showProfileLoadError(error?.message || 'Falha ao carregar os dados do perfil.');
      }

    }

    });
    