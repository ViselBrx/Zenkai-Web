document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  if (typeof StatsManager !== 'undefined') StatsManager.render('desenhos');
  const pillsContainer = document.getElementById('cartoonPills');
  const seasonsContainer = document.getElementById('seasonsContainer');
  const panel = document.getElementById('episodePanel');
  const noCartoonMsg = document.getElementById('noCartoonMsg');
  const noRegisteredMsg = document.getElementById('noCartoonRegistered');

  const addEpBtn = document.getElementById('addEpBtn');
  const epSeason = document.getElementById('epSeason');
  const epNumber = document.getElementById('epNumber');
  const epTitle = document.getElementById('epTitle');
  const epIframe = document.getElementById('epIframe');
  const entryType = document.getElementById('entryType');
  const groupSeason = document.getElementById('groupSeason');
  const groupNumber = document.getElementById('groupNumber');
  const labelTitle = document.getElementById('labelTitle');
  const formActionTitle = document.getElementById('formActionTitle');
  const moviesContainer = document.getElementById('moviesContainer');
  const epForm = document.getElementById('epForm');

  const watchModal = document.getElementById('watchModal');
  const watchTitle = document.getElementById('watchTitle');
  const watchFrame = document.getElementById('watchFrame');
  const watchDeleteBtn = document.getElementById('watchDeleteBtn');

  let activeCartoonId = null;
  let activeEpisodeId = null;
  let activeSeasonForWatch = null;
  let activeTypeForWatch = 'episode'; // 'episode' ou 'movie'
  let pendingHistoryResume = null;

  function loadPendingHistoryResume() {
    if (typeof HistoryTracker === 'undefined') {
      pendingHistoryResume = null;
      return;
    }
    pendingHistoryResume = HistoryTracker.consumeResumeFromUrl('desenhos.html');
  }

  function clearPendingHistoryResume() {
    pendingHistoryResume = null;
  }

  function trackHistoryView(item, typeOrSeason) {
    if (typeof HistoryTracker === 'undefined' || !activeCartoonId || !item) return;

    const cartoon = DB.getCartoonById(activeCartoonId);
    const isMovie = typeOrSeason === 'movie';
    const season = isMovie ? null : Number(typeOrSeason);
    const epNumber = Number(item.epNumber || 0) || null;
    const title = isMovie
      ? `${cartoon?.nome || 'Desenho'} - Filme`
      : `${cartoon?.nome || 'Desenho'} - T${season || 1}E${epNumber || 1}`;

    HistoryTracker.track({
      contentId: item.id,
      contentType: isMovie ? 'desenho_movie' : 'desenho_episode',
      title,
      subtitle: isMovie
        ? (item.title || 'Filme sem titulo')
        : (item.title || `Episodio ${epNumber || 1}`),
      coverUrl: cartoon?.capa || '',
      route: 'desenhos.html',
      payload: {
        cartoonId: activeCartoonId,
        season,
        mediaType: isMovie ? 'movie' : 'episode'
      }
    });
  }

  function tryResumeWatchFromHistory() {
    if (!pendingHistoryResume || !activeCartoonId) return;
    if (pendingHistoryResume.route !== 'desenhos.html') return;
    if (pendingHistoryResume.cartoonId !== activeCartoonId) return;

    const targetId = pendingHistoryResume.contentId;
    if (!targetId) {
      clearPendingHistoryResume();
      return;
    }

    const isMovie = pendingHistoryResume.contentType === 'desenho_movie';
    if (isMovie) {
      const movieExists = DB.getMoviesFor(activeCartoonId).some(m => m.id === targetId);
      if (!movieExists) {
        clearPendingHistoryResume();
        return;
      }
      clearPendingHistoryResume();
      setTimeout(() => window.openWatchModal(targetId, 'movie'), 60);
      return;
    }

    const season = Number(pendingHistoryResume.season || 1);
    const seasonEps = DB.getEpisodesFor(activeCartoonId)[season] || [];
    const epExists = seasonEps.some(ep => ep.id === targetId);
    if (!epExists) {
      clearPendingHistoryResume();
      return;
    }

    clearPendingHistoryResume();
    setTimeout(() => window.openWatchModal(targetId, season), 60);
  }

  async function loadCartoons() {
    const list = DB.getCartoons();
    pillsContainer.innerHTML = '';
    
    if (list.length === 0) {
      noRegisteredMsg.style.display = 'block';
      noCartoonMsg.style.display = 'none';
      panel.style.display = 'none';
      return;
    }

    // 1. Checar se o perk de favoritos está ativo (VIA BANCO)
    const isPerkActive = window.DB && typeof window.DB.isPerkEquipped === 'function' 
                         ? window.DB.isPerkEquipped('lista_destaque') 
                         : false;

    // 2. Buscar favoritos
    let userFavs = new Set();
    try {
        const favs = await DB.getFavorites('desenho');
        userFavs = new Set(favs.map(f => f.content_id));
    } catch (e) {
        console.warn("Erro ao carregar favoritos de desenhos.");
    }

    // 3. Ordenação condicional
    if (isPerkActive) {
      list.sort((a, b) => {
        const aFav = userFavs.has(a.id) ? 1 : 0;
        const bFav = userFavs.has(b.id) ? 1 : 0;
        return bFav - aFav; // Favoritos primeiro
      });
    }
    
    list.forEach(c => {
      const isFav = userFavs.has(c.id);
      const btn = document.createElement('button');
      btn.className = 'cartoon-pill';
      if (c.id === activeCartoonId) btn.classList.add('active');
      
      const thumb = c.capa 
        ? `<img src="${c.capa}" onerror="this.src='';this.style.background='var(--primary)'">`
        : `<div style="width:26px;height:26px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:12px;">🎬</div>`;
      
      btn.innerHTML = `${thumb} ${c.nome}`;
      
      btn.onclick = () => selectCartoon(c.id, btn);
      pillsContainer.appendChild(btn);
    });

    loadPendingHistoryResume();
    const pendingFromHistory = pendingHistoryResume?.cartoonId || null;
    const pending = pendingFromHistory || localStorage.getItem('selectedCartoon');
    if (pending) {
      const btn = [...pillsContainer.children].find(b => b.textContent.includes(DB.getCartoonById(pending)?.nome));
      if (btn) selectCartoon(pending, btn);
      if (!pendingFromHistory) localStorage.removeItem('selectedCartoon');
    } else {
      noCartoonMsg.style.display = 'block';
    }
  }

  // Reforço para Enter nos inputs do formulário de episódios
  [epSeason, epNumber, epTitle, epIframe].forEach(input => {
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          epForm.requestSubmit(); 
        }
      });
    }
  });

  if (entryType) {
    entryType.addEventListener('change', () => {
      const isMovie = entryType.value === 'movie';
      if (groupSeason) groupSeason.style.display = isMovie ? 'none' : 'block';
      if (groupNumber) groupNumber.style.display = isMovie ? 'none' : 'block';
      if (labelTitle) labelTitle.textContent = isMovie ? 'Título do Filme *' : 'Título (opcional)';
      if (formActionTitle) formActionTitle.textContent = isMovie ? '➕ Adicionar Filme' : '➕ Adicionar Episódio';
      if (editingEpId || editingMovieId) resetEpForm();
    });
  }

  function selectCartoon(id, btnElement) {
    document.querySelectorAll('.cartoon-pill').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    
    activeCartoonId = id;
    noCartoonMsg.style.display = 'none';
    noRegisteredMsg.style.display = 'none';
    panel.style.display = 'block';
    
    epSeason.value = 1; epNumber.value = 1; epTitle.value = ''; epIframe.value = '';
    renderContent();
    tryResumeWatchFromHistory();
  }

  function renderContent() {
    renderMovies();
    renderSeasons();
  }

  function renderMovies() {
    if (!moviesContainer) return;
    moviesContainer.innerHTML = '';
    if (!activeCartoonId) return;

    const movies = DB.getMoviesFor(activeCartoonId);
    if (movies.length === 0) return;

    const sec = document.createElement('div');
    sec.className = 'season-section';
    sec.innerHTML = `
      <div class="season-header open" style="cursor:default;">
        <div style="display:flex;align-items:center;gap:15px;">
          <h3>🎬 Filmes</h3>
          <span class="badge-pill badge-accent">${movies.length} Filme${movies.length > 1 ? 's' : ''}</span>
        </div>
      </div>
    `;

    const grid = document.createElement('div');
    grid.className = 'episodes-grid open';
    
    movies.forEach(m => {
      if (window.pendingDeletions && window.pendingDeletions.has(m.id)) return;
      const card = document.createElement('div');
      const isWatched = typeof Watched !== 'undefined' && Watched.isWatched(m.id);
      card.className = 'episode-card' + (isWatched ? ' is-watched' : '');
      card.innerHTML = `
        <div style="position:relative;background:#000;cursor:pointer;" onclick="openWatchModal('${m.id}', 'movie')">
          <div class="episode-thumb-inner" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:var(--bg-surface);">
            <span style="font-size:3rem;text-shadow:0 0 10px rgba(0,0,0,0.5);">🎬</span>
          </div>
          <div class="watched-overlay"><div class="watched-badge-icon">✓</div></div>
          <div style="position:absolute;bottom:0;left:0;right:0;padding:10px;background:linear-gradient(transparent, rgba(233,69,96,0.7));color:#fff;font-weight:700;">
            FILME
          </div>
        </div>
        <div class="episode-label" style="justify-content:space-between">
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${m.title}">${m.title}</span>
          <div style="display:flex;gap:5px;align-items:center;">
            <button class="btn btn-ghost btn-sm" onclick="editMovie(event, '${m.id}')" style="padding:2px 5px;font-size:0.8rem">✏️</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    sec.appendChild(grid);
    moviesContainer.appendChild(sec);
  }

  function renderSeasons() {
    seasonsContainer.innerHTML = '';
    if (!activeCartoonId) return;

    const seasons = DB.getEpisodesFor(activeCartoonId);
    const seasonNumbers = Object.keys(seasons).sort((a, b) => Number(a) - Number(b));

    if (seasonNumbers.length === 0) {
      seasonsContainer.innerHTML = `<div class="empty-state" style="padding:2rem;">📭 Nenhuma temporada cadastrada ainda.</div>`;
      return;
    }

    seasonNumbers.forEach(s => {
      const eps = seasons[s].sort((a, b) => Number(a.epNumber) - Number(b.epNumber));
      const watchedCount = typeof Watched !== 'undefined' ? Watched.countWatched(eps.map(e => e.id)) : 0;
      const progress = eps.length > 0 ? Math.round((watchedCount / eps.length) * 100) : 0;

      const sec = document.createElement('div');
      sec.className = 'season-section content-animate';
      sec.innerHTML = `
        <div class="season-header open" onclick="toggleSeason(this)">
          <div style="display:flex;align-items:center;gap:15px;">
            <div class="season-toggle-icon">▼</div>
            <h3>Temporada ${s}</h3>
            <span class="badge-pill">${eps.length} Episódio${eps.length > 1 ? 's' : ''}</span>
          </div>
          <div class="season-progress">
            <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
            <span style="font-size:0.8rem;font-weight:700;color:var(--success);min-width:35px;">${progress}%</span>
          </div>
        </div>
      `;

      const grid = document.createElement('div');
      grid.className = 'episodes-grid open';
      
      eps.forEach(ep => {
        if (window.pendingDeletions && window.pendingDeletions.has(ep.id)) return;
        const card = document.createElement('div');
        const isWatched = typeof Watched !== 'undefined' && Watched.isWatched(ep.id);
        card.className = 'episode-card' + (isWatched ? ' is-watched' : '');
        card.innerHTML = `
          <div style="position:relative;background:#000;cursor:pointer;" onclick="openWatchModal('${ep.id}', ${s})">
            <div class="episode-thumb-inner" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:var(--bg-surface);">
              <span style="font-size:2.5rem;opacity:0.3;">📺</span>
            </div>
            <div class="watched-overlay"><div class="watched-badge-icon">✓</div></div>
            <div style="position:absolute;bottom:0;left:0;right:0;padding:8px 12px;background:linear-gradient(transparent, rgba(0,0,0,0.8));color:#fff;font-size:0.8rem;font-weight:700;">
              EPISÓDIO ${ep.epNumber}
            </div>
          </div>
          <div class="episode-label" style="justify-content:space-between">
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${ep.title || `Episódio ${ep.epNumber}`}">${ep.title || `Episódio ${ep.epNumber}`}</span>
            <div style="display:flex;gap:5px;align-items:center;">
              <button class="btn btn-ghost btn-sm" onclick="editEpisode(event, '${ep.id}')" style="padding:2px 5px;font-size:0.8rem">✏️</button>
              <button class="btn btn-ghost btn-sm" onclick="deleteEpisode(event, '${ep.id}')" style="padding:2px 5px;font-size:0.8rem;color:var(--danger)">🗑️</button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });

      sec.appendChild(grid);
      seasonsContainer.appendChild(sec);
    });
  }

  window.toggleSeason = (header) => {
    const grid = header.nextElementSibling;
    const icon = header.querySelector('.season-toggle-icon');
    const isOpen = grid.classList.toggle('open');
    header.classList.toggle('open', isOpen);
    icon.textContent = isOpen ? '▼' : '▶';
  };

  // --- CRUD EPISÓDIOS ---
  let editingEpId = null;
  let editingMovieId = null;

  epForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!activeCartoonId) return;

    const type = entryType.value;
    const season = epSeason.value;
    const number = epNumber.value;
    const title = epTitle.value.trim();
    const iframe = epIframe.value.trim();

    if (!iframe) return showToast('O iframe ou URL é obrigatório!', 'error');

    addEpBtn.disabled = true;
    addEpBtn.textContent = 'Salvando...';

    try {
      if (type === 'movie') {
        const payload = { cartoon_id: activeCartoonId, title, iframe };
        if (editingMovieId) {
          await DB.updateMovie(editingMovieId, payload);
          showToast('Filme atualizado!');
        } else {
          await DB.addMovie(payload);
          showToast('Filme adicionado!');
        }
      } else {
        const payload = { cartoon_id: activeCartoonId, temporada: season, ep_number: number, title, iframe };
        if (editingEpId) {
          await DB.updateEpisode(editingEpId, payload);
          showToast('Episódio atualizado!');
        } else {
          await DB.addEpisode(payload);
          showToast('Episódio adicionado!');
        }
      }
      resetEpForm();
      renderContent();
    } catch (err) {
      showToast('Erro ao salvar!', 'error');
    } finally {
      addEpBtn.disabled = false;
      addEpBtn.textContent = 'Adicionar';
    }
  };

  function resetEpForm() {
    editingEpId = null;
    editingMovieId = null;
    epTitle.value = '';
    epIframe.value = '';
    formActionTitle.textContent = entryType.value === 'movie' ? '➕ Adicionar Filme' : '➕ Adicionar Episódio';
    addEpBtn.textContent = 'Adicionar';
  }

  window.editEpisode = (e, id) => {
    e.stopPropagation();
    const ep = DB.getEpisodeById(id);
    if (!ep) return;
    editingEpId = id;
    editingMovieId = null;
    entryType.value = 'episode';
    groupSeason.style.display = 'block';
    groupNumber.style.display = 'block';
    epSeason.value = ep.temporada;
    epNumber.value = ep.ep_number;
    epTitle.value = ep.title || '';
    epIframe.value = ep.iframe;
    formActionTitle.textContent = '✏️ Editar Episódio';
    addEpBtn.textContent = 'Salvar';
    epForm.scrollIntoView({ behavior: 'smooth' });
  };

  window.editMovie = (e, id) => {
    e.stopPropagation();
    const m = DB.getMovieById(id);
    if (!m) return;
    editingMovieId = id;
    editingEpId = null;
    entryType.value = 'movie';
    groupSeason.style.display = 'none';
    groupNumber.style.display = 'none';
    epTitle.value = m.title || '';
    epIframe.value = m.iframe;
    formActionTitle.textContent = '✏️ Editar Filme';
    addEpBtn.textContent = 'Salvar';
    epForm.scrollIntoView({ behavior: 'smooth' });
  };

  window.deleteEpisode = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este episódio?')) return;
    try {
      await DB.deleteEpisode(id);
      showToast('Episódio excluído!');
      renderContent();
    } catch (err) {
      showToast('Erro ao excluir!', 'error');
    }
  };

  // --- WATCH MODAL ---
  window.openWatchModal = (id, seasonOrMovie) => {
    activeEpisodeId = id;
    activeSeasonForWatch = seasonOrMovie;
    activeTypeForWatch = seasonOrMovie === 'movie' ? 'movie' : 'episode';

    const item = activeTypeForWatch === 'movie' ? DB.getMovieById(id) : DB.getEpisodeById(id);
    if (!item) return;

    watchTitle.textContent = activeTypeForWatch === 'movie' ? item.title : `Temporada ${seasonOrMovie} - Ep ${item.ep_number}`;
    watchFrame.innerHTML = DB.cleanIframe(item.iframe);
    
    updateWatchedBadge(id);
    trackHistoryView(item, seasonOrMovie);
    watchModal.classList.add('open');
  };

  document.getElementById('watchClose').onclick = () => {
    watchModal.classList.remove('open');
    watchFrame.innerHTML = '';
  };

  watchDeleteBtn.onclick = async () => {
    if (!activeEpisodeId) return;
    if (!confirm('Excluir este item permanentemente?')) return;
    try {
      if (activeTypeForWatch === 'movie') await DB.deleteMovie(activeEpisodeId);
      else await DB.deleteEpisode(activeEpisodeId);
      watchModal.classList.remove('open');
      renderContent();
      showToast('Excluído com sucesso!');
    } catch (err) {
      showToast('Erro ao excluir!', 'error');
    }
  };

  // --- WATCHED SYSTEM ---
  const watchedBadge = document.getElementById('watchedModalBadge');
  function updateWatchedBadge(id) {
    const isWatched = typeof Watched !== 'undefined' && Watched.isWatched(id);
    watchedBadge.className = 'watched-modal-badge ' + (isWatched ? 'is-watched' : 'not-watched');
    watchedBadge.textContent = isWatched ? '✓ Assistido' : '○ Marcar como Assistido';
  }

  watchedBadge.onclick = async () => {
    if (!activeEpisodeId || typeof Watched === 'undefined') return;
    const isNowWatched = await Watched.toggle(activeEpisodeId);
    updateWatchedBadge(activeEpisodeId);
    renderContent();
    if (typeof StatsManager !== 'undefined') StatsManager.render('desenhos');
  };

  loadCartoons();
});
