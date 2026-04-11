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
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      
      const btn = document.createElement('button');
      btn.className = 'cartoon-pill';
      if (c.id === activeCartoonId) btn.classList.add('active');
      
      const thumb = c.capa 
        ? `<img src="${c.capa}" onerror="this.src='';this.style.background='var(--primary)'">`
        : `<div style="width:26px;height:26px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:12px;">🎬</div>`;
      
      btn.innerHTML = `${thumb} ${c.nome}`;
      
      btn.onclick = () => selectCartoon(c.id, btn);
      container.appendChild(btn);
      
      // Adicionar estrela de favoritos
      const starClass = isPerkActive ? '' : 'is-hidden';
      const favBtn = document.createElement('button');
      favBtn.className = `fav-star ${isFav ? 'active' : ''} ${starClass}`;
      favBtn.dataset.id = c.id;
      favBtn.title = isFav ? 'Desmarcar' : 'Marcar';
      favBtn.innerHTML = isFav ? '★' : '☆';
      favBtn.style.position = 'absolute';
      favBtn.style.top = '5px';
      favBtn.style.left = '5px';
      favBtn.style.width = '28px';
      favBtn.style.height = '28px';
      favBtn.style.fontSize = '0.9rem';
      
      favBtn.onclick = async (e) => {
        e.stopPropagation();
        try {
          const res = await DB.toggleFavorite(c.id, 'desenho', { title: c.nome, cover: c.capa });
          const isAdded = res.action === 'added';
          favBtn.classList.toggle('active', isAdded);
          favBtn.innerHTML = isAdded ? '★' : '☆';
          favBtn.title = isAdded ? 'Desmarcar' : 'Marcar';
          showToast(isAdded ? `"${c.nome}" adicionado aos favoritos!` : `"${c.nome}" removido dos favoritos.`);
          await loadCartoons();
        } catch (err) {
          showToast('Faça login para favoritar!', 'error');
        }
      };
      
      container.appendChild(favBtn);
      pillsContainer.appendChild(container);
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
          <div style="position:absolute;bottom:0;left:0;right:0;padding:10px;background:linear-gradient(transparent, rgba(124,58,237,0.7));color:#fff;font-weight:700;">
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
      // Botão de marcação
      if (typeof createWatchedBtn !== 'undefined') {
        const labelDiv = card.querySelector('.episode-label > div');
        const wBtn = createWatchedBtn(m.id, (id, nowWatched) => {
          card.classList.toggle('is-watched', nowWatched);
        }, 'desenho_movie');
        labelDiv.prepend(wBtn);
      }
      grid.appendChild(card);
    });

    sec.appendChild(grid);
    moviesContainer.appendChild(sec);
  }

  function renderSeasons() {
    seasonsContainer.innerHTML = '';
    if (!activeCartoonId) return;

    // Animação de entrada
    seasonsContainer.classList.remove('content-animate');
    void seasonsContainer.offsetWidth; // Trigger reflow
    seasonsContainer.classList.add('content-animate');

    const allEps = DB.getEpisodesFor(activeCartoonId);
    const seasons = Object.keys(allEps).map(Number).sort((a,b) => a-b);

    if (seasons.length === 0 && DB.getMoviesFor(activeCartoonId).length === 0) {
      seasonsContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">Nenhum conteúdo cadastrado.</p>';
      return;
    }

    seasons.forEach(seasonNum => {
      const seasonKey = `s_${activeCartoonId}_${seasonNum}`;
      if (window.pendingDeletions && window.pendingDeletions.has(seasonKey)) return;
      const eps = allEps[seasonNum].sort((a,b) => Number(a.epNumber) - Number(b.epNumber));
      
      const sec = document.createElement('div');
      sec.className = 'season-section';
      
      const head = document.createElement('div');
      head.className = 'season-header';
      head.innerHTML = `
        <div style="display:flex;align-items:center;gap:15px;">
          <h3 style="color:#a78bfa">Temporada ${seasonNum}</h3>
          <span class="badge-pill badge-purple">${eps.length} Eps</span>
        </div>
        <div style="display:flex;align-items:center;gap:15px;">
          <button class="btn btn-danger btn-sm" onclick="deleteSeason(event, ${seasonNum})">Excluir Temp.</button>
          <span class="season-chevron">▼</span>
        </div>
      `;

      const grid = document.createElement('div');
      grid.className = 'episodes-grid open';
      head.classList.add('open');
      
      head.onclick = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        grid.classList.toggle('open');
        head.classList.toggle('open');
      };

      const epIds = eps.map(ep => ep.id);

      // Barra de progresso da temporada
      if (typeof createSeasonProgress !== 'undefined') {
        const progressEl = createSeasonProgress(epIds);
        const headInnerLeft = head.querySelector('div');
        if (headInnerLeft) headInnerLeft.appendChild(progressEl);
      }

      eps.forEach(ep => {
        if (window.pendingDeletions && window.pendingDeletions.has(ep.id)) return;
        const card = document.createElement('div');
        const isWatched = typeof Watched !== 'undefined' && Watched.isWatched(ep.id);
        card.className = 'episode-card' + (isWatched ? ' is-watched' : '');
        card.innerHTML = `
          <div style="position:relative;background:#000;cursor:pointer;" onclick="openWatchModal('${ep.id}', ${seasonNum})">
            <div class="episode-thumb-inner" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:var(--bg-surface);">
              <span style="font-size:3rem;text-shadow:0 0 10px rgba(0,0,0,0.5);">▶️</span>
            </div>
            <div class="watched-overlay"><div class="watched-badge-icon">✓</div></div>
            <div style="position:absolute;bottom:0;left:0;right:0;padding:10px;background:linear-gradient(transparent, rgba(0,0,0,0.9));color:#fff;font-weight:700;">
              Episódio ${ep.epNumber}
            </div>
          </div>
          <div class="episode-label" style="justify-content:space-between">
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${ep.title || ''}">${ep.title || 'Sem título'}</span>
            <div style="display:flex;gap:5px;align-items:center;">
              <button class="btn btn-ghost btn-sm" onclick="editEpisode(event, '${ep.id}', ${seasonNum})" style="padding:2px 5px;font-size:0.8rem">✏️</button>
            </div>
          </div>
        `;
        // Botão de marcação
        if (typeof createWatchedBtn !== 'undefined') {
          const labelDiv = card.querySelector('.episode-label > div');
          const wBtn = createWatchedBtn(ep.id, (id, nowWatched) => {
            card.classList.toggle('is-watched', nowWatched);
            // Atualiza barra de progresso
            const progressEl = head.querySelector('.season-progress');
            if (progressEl && typeof Watched !== 'undefined') {
              const total = epIds.length;
              const watched = Watched.countWatched(epIds);
              const pct = total === 0 ? 0 : Math.round((watched / total) * 100);
              const fill = progressEl.querySelector('.season-progress-fill');
              const label = progressEl.querySelector('.season-progress-label');
              if (fill) fill.style.width = pct + '%';
              if (label) {
                label.textContent = `${watched}/${total} assistidos`;
                label.classList.toggle('complete', watched === total);
              }
            }
          }, 'desenho_episode');
          labelDiv.prepend(wBtn);
        }
        grid.appendChild(card);
      });

      sec.appendChild(head);
      sec.appendChild(grid);
      seasonsContainer.appendChild(sec);
    });
  }

  let editingEpId = null;
  let editingSeason = null;
  let editingMovieId = null;

  window.editEpisode = (e, epId, seasonNum) => {
    e.stopPropagation();
    const sEps = DB.getEpisodesFor(activeCartoonId)[seasonNum];
    const ep = sEps ? sEps.find(x => x.id === epId) : null;
    if (!ep) return;

    resetEpForm();
    entryType.value = 'episode';
    entryType.dispatchEvent(new Event('change'));

    editingEpId = epId;
    editingSeason = seasonNum;

    epSeason.value = seasonNum;
    epNumber.value = ep.epNumber;
    epTitle.value = ep.title || '';
    epIframe.value = ep.iframe;

    addEpBtn.textContent = 'Salvar Alterações';
    addEpBtn.style.background = 'var(--primary)';
    if (formActionTitle) formActionTitle.textContent = '✏️ Editar Episódio';
    
    document.querySelector('.page-header').scrollIntoView({ behavior: 'smooth' });
  };

  window.editMovie = (e, movieId) => {
    e.stopPropagation();
    const m = DB.getMovieById(movieId);
    if (!m) return;

    resetEpForm();
    entryType.value = 'movie';
    entryType.dispatchEvent(new Event('change'));

    editingMovieId = movieId;

    epTitle.value = m.title || '';
    epIframe.value = m.iframe;

    addEpBtn.textContent = 'Salvar Alterações';
    addEpBtn.style.background = 'var(--primary)';
    if (formActionTitle) formActionTitle.textContent = '✏️ Editar Filme';
    
    document.querySelector('.page-header').scrollIntoView({ behavior: 'smooth' });
  };

  window.deleteSeason = async (e, seasonNum) => {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja excluir toda a Temporada ${seasonNum}?`)) return;
    try {
      const eps = DB.getEpisodesFor(activeCartoonId)[seasonNum] || [];
      for (const ep of eps) {
        await DB.deleteEpisode(ep.id);
      }
      showToast('Temporada excluída!');
      renderContent();
    } catch (err) {
      showToast('Erro ao excluir temporada!', 'error');
    }
  };

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
    editingSeason = null;
    editingMovieId = null;
    epTitle.value = '';
    epIframe.value = '';
    addEpBtn.textContent = 'Adicionar';
    addEpBtn.style.background = '';
    formActionTitle.textContent = entryType.value === 'movie' ? '➕ Adicionar Filme' : '➕ Adicionar Episódio';
  }

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
