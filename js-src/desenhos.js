document.addEventListener('DOMContentLoaded', async () => {
  await DB.init(['cartoons', 'episodes', 'movies']);
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
  let collapsedSeasons = new Set();
  let activeEpisodeId = null;
  let activeSeasonForWatch = null;
  let activeTypeForWatch = 'episode'; // 'episode' ou 'movie'
  let pendingHistoryResume = null;

  function loadPendingHistoryResume() {
    if (typeof HistoryTracker === 'undefined') {
      pendingHistoryResume = null;
      return;
    }
    pendingHistoryResume = HistoryTracker.consumeResumeFromUrl('episodios-desenhos.html');
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
      route: 'episodios-desenhos.html',
      payload: {
        cartoonId: activeCartoonId,
        season,
        mediaType: isMovie ? 'movie' : 'episode'
      }
    });
  }

  function tryResumeWatchFromHistory() {
    if (!pendingHistoryResume || !activeCartoonId) return;
    if (pendingHistoryResume.route !== 'episodios-desenhos.html') return;
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
    const list = DB.getCartoons().map((c, index) => ({ ...c, _originIndex: index }));
    pillsContainer.innerHTML = '';
    const frag = document.createDocumentFragment();
    
    if (list.length === 0) {
      noRegisteredMsg.style.display = 'block';
      noCartoonMsg.style.display = 'none';
      panel.style.display = 'none';
      return;
    }

    // Buscar favoritos
    let userFavs = new Set();
    try {
        const favs = await DB.getFavorites('desenho');
        userFavs = new Set(favs.map(f => f.content_id));
    } catch (e) {
        console.warn("Erro ao carregar favoritos de desenhos.");
    }

    // Favoritos no topo, demais itens na ordem original
    list.sort((a, b) => {
      const aFav = userFavs.has(a.id) ? 1 : 0;
      const bFav = userFavs.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return a._originIndex - b._originIndex;
    });
    
    list.forEach(c => {
      const isFav = userFavs.has(c.id);
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      container.dataset.originIndex = String(c._originIndex);
      container.dataset.cartoonId = c.id;
      
      const btn = document.createElement('button');
      btn.className = 'cartoon-pill';
      if (c.id === activeCartoonId) btn.classList.add('active');
      
      const thumb = c.capa 
        ? `<img src="${c.capa}" loading="lazy" decoding="async" onerror="this.src='';this.style.background='var(--primary)'">`
        : `<div style="width:26px;height:26px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:12px;">🎬</div>`;
      
      btn.innerHTML = `${thumb} ${c.nome}`;
      
      btn.onclick = () => selectCartoon(c.id, btn);
      container.appendChild(btn);
      
      // Adicionar estrela de favoritos
      const starClass = '';
      const favBtn = document.createElement('button');
      favBtn.className = `fav-star ${isFav ? 'active' : ''} ${starClass}`;
      favBtn.dataset.id = c.id;
      favBtn.title = isFav ? 'Desmarcar' : 'Marcar';
      favBtn.innerHTML = isFav ? '★' : '☆';
      favBtn.classList.add('fav-star-sm');
      
      favBtn.onclick = async (e) => {
        e.stopPropagation();
        try {
          const res = await DB.toggleFavorite(c.id, 'desenho', { title: c.nome, cover: c.capa });
          const isAdded = res.action === 'added';
          favBtn.classList.toggle('active', isAdded);
          favBtn.innerHTML = isAdded ? '★' : '☆';
          favBtn.title = isAdded ? 'Desmarcar' : 'Marcar';
          showToast(isAdded ? `"${c.nome}" adicionado aos favoritos!` : `"${c.nome}" removido dos favoritos.`);
          DB.reorderFavoritePillWrappers(pillsContainer);
        } catch (err) {
          showToast(err.message || 'Erro ao favoritar.', 'error');
        }
      };
      
      container.appendChild(favBtn);
      frag.appendChild(container);
    });
    
    pillsContainer.appendChild(frag);

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
    collapsedSeasons.clear();
    noCartoonMsg.style.display = 'none';
    noRegisteredMsg.style.display = 'none';
    panel.style.display = 'block';
    
    epSeason.value = 1; epNumber.value = 1; epTitle.value = ''; epIframe.value = '';
    renderContent();
    tryResumeWatchFromHistory();
  }

  function renderContent() {
    const scrollY = window.scrollY;
    
    // Evita encolhimento para não dar pulo de scroll
    const moviesHeight = moviesContainer ? moviesContainer.offsetHeight : 0;
    if (moviesHeight && moviesContainer) moviesContainer.style.minHeight = `${moviesHeight}px`;

    const seasonsHeight = seasonsContainer ? seasonsContainer.offsetHeight : 0;
    if (seasonsHeight && seasonsContainer) seasonsContainer.style.minHeight = `${seasonsHeight}px`;

    renderMovies();
    renderSeasons();
    
    if (moviesContainer) moviesContainer.style.minHeight = '';
    if (seasonsContainer) seasonsContainer.style.minHeight = '';
    
    // Restaura o scroll na mesma posição
    window.scrollTo(0, scrollY);
  }

  function restartSectionAnimation(container) {
    if (!container) return;
    container.classList.remove('content-animate');
    requestAnimationFrame(() => {
      container.classList.add('content-animate');
    });
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
    
    const uid = window.DB?._store?.profile?.id || 'guest';
    let gridHtml = '';

    movies.forEach(m => {
      if (window.pendingDeletions && window.pendingDeletions.has(m.id)) return;
      const isWatched = typeof Watched !== 'undefined' && Watched.isWatched(m.id);
      const saved = localStorage.getItem(`animehouse_time_${uid}_${m.id}`);
      const savedBadge = saved ? `<div style="position:absolute; top:8px; right:8px; background:rgba(var(--primary-rgb), 0.9); color:#fff; padding:2px 8px; border-radius:15px; font-size:0.65rem; font-weight:700; z-index:2; border:1px solid rgba(255,255,255,0.2);">${saved}</div>` : '';

      gridHtml += `
        <div class="episode-card${isWatched ? ' is-watched' : ''}" data-itemid="${m.id}">
          <div style="position:relative;background:#000;cursor:pointer;" onclick="openWatchModal('${m.id}', 'movie')">
            <div class="episode-thumb-inner" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:var(--bg-surface);">
              <span style="font-size:3rem;text-shadow:0 0 10px rgba(0,0,0,0.5);">🎬</span>
            </div>
            ${savedBadge}
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
        </div>
      `;
    });

    grid.innerHTML = gridHtml;

    if (typeof createWatchedBtn !== 'undefined') {
      grid.querySelectorAll('.episode-card').forEach(card => {
        const mId = card.dataset.itemid;
        const labelDiv = card.querySelector('.episode-label');
        if (!labelDiv || !mId) return;
        const wBtn = createWatchedBtn(mId, (id, nowWatched) => {
          card.classList.toggle('is-watched', nowWatched);
        }, 'desenho_movie');
        labelDiv.prepend(wBtn);
      });
    }

    sec.appendChild(grid);
    moviesContainer.appendChild(sec);
  }

  function renderSeasons() {
    seasonsContainer.innerHTML = '';
    if (!activeCartoonId) return;

    // Animação de entrada mais leve
    restartSectionAnimation(seasonsContainer);

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

      const isCollapsed = collapsedSeasons.has(seasonNum);
      const grid = document.createElement('div');
      grid.className = 'episodes-grid' + (isCollapsed ? '' : ' open');
      if (!isCollapsed) head.classList.add('open');
      
      head.onclick = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        const willBeOpen = grid.classList.toggle('open');
        head.classList.toggle('open', willBeOpen);
        if (willBeOpen) {
          collapsedSeasons.delete(seasonNum);
        } else {
          collapsedSeasons.add(seasonNum);
        }
      };

      const epIds = eps.map(ep => ep.id);

      // Barra de progresso da temporada
      if (typeof createSeasonProgress !== 'undefined') {
        const progressEl = createSeasonProgress(epIds);
        const headInnerLeft = head.querySelector('div');
        if (headInnerLeft) headInnerLeft.appendChild(progressEl);
      }

      const uid = window.DB?._store?.profile?.id || 'guest';
      let gridHtml = '';

      eps.forEach(ep => {
        if (window.pendingDeletions && window.pendingDeletions.has(ep.id)) return;
        const isWatched = typeof Watched !== 'undefined' && Watched.isWatched(ep.id);
        const saved = localStorage.getItem(`animehouse_time_${uid}_${ep.id}`);
        const savedBadge = saved ? `<div style="position:absolute; top:8px; right:8px; background:rgba(var(--primary-rgb), 0.9); color:#fff; padding:2px 8px; border-radius:15px; font-size:0.65rem; font-weight:700; z-index:2; border:1px solid rgba(255,255,255,0.2);">${saved}</div>` : '';

        gridHtml += `
          <div class="episode-card${isWatched ? ' is-watched' : ''}" data-itemid="${ep.id}">
            <div style="position:relative;background:#000;cursor:pointer;" onclick="openWatchModal('${ep.id}', ${seasonNum})">
              <div class="episode-thumb-inner" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:var(--bg-surface);">
                <span style="font-size:3rem;text-shadow:0 0 10px rgba(0,0,0,0.5);">▶️</span>
              </div>
              ${savedBadge}
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
          </div>
        `;
      });

      grid.innerHTML = gridHtml;

      if (typeof createWatchedBtn !== 'undefined') {
        grid.querySelectorAll('.episode-card').forEach(card => {
          const epId = card.dataset.itemid;
          const labelDiv = card.querySelector('.episode-label');
          if (!labelDiv || !epId) return;
          const wBtn = createWatchedBtn(epId, (id, nowWatched) => {
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
        });
      }

      sec.appendChild(head);
      sec.appendChild(grid);
      seasonsContainer.appendChild(sec);
    });
  }

  let editingEpId = null;
  let editingSeason = null;
  let editingMovieId = null;

  function getActiveMovieById(movieId) {
    return DB.getMoviesFor(activeCartoonId).find((movie) => movie.id === movieId) || null;
  }

  function getActiveEpisodeById(epId, seasonNum = null) {
    const seasons = DB.getEpisodesFor(activeCartoonId);
    if (seasonNum !== null && seasonNum !== undefined) {
      const seasonEpisodes = seasons[seasonNum] || [];
      return seasonEpisodes.find((ep) => ep.id === epId) || null;
    }

    for (const seasonEpisodes of Object.values(seasons)) {
      const found = (seasonEpisodes || []).find((ep) => ep.id === epId);
      if (found) return found;
    }

    return null;
  }

  function showCancelBtn() {
    if (document.getElementById('cancelEditBtn')) return;

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancelEditBtn';
    cancelBtn.className = 'btn btn-ghost';
    cancelBtn.style.marginLeft = '10px';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = resetEpForm;
    addEpBtn.parentNode.appendChild(cancelBtn);
  }

  window.editEpisode = (e, epId, seasonNum) => {
    e.stopPropagation();
    const ep = getActiveEpisodeById(epId, seasonNum);
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

    addEpBtn.textContent = 'Salvar Alteracoes';
    addEpBtn.style.background = 'var(--primary)';
    if (formActionTitle) formActionTitle.textContent = 'Editar Episodio';

    if (epForm) epForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showCancelBtn();
  };

  window.editMovie = (e, movieId) => {
    e.stopPropagation();
    const movie = getActiveMovieById(movieId);
    if (!movie) return;

    resetEpForm();
    entryType.value = 'movie';
    entryType.dispatchEvent(new Event('change'));

    editingMovieId = movieId;
    epTitle.value = movie.title || '';
    epIframe.value = movie.iframe || '';

    addEpBtn.textContent = 'Salvar Filme';
    addEpBtn.style.background = 'var(--primary)';
    if (formActionTitle) formActionTitle.textContent = 'Editar Filme';

    if (epForm) epForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showCancelBtn();
  };

  window.deleteSeason = (e, seasonNum) => {
    e.stopPropagation();
    const seasonKey = `s_${activeCartoonId}_${seasonNum}`;
    showUndoToast(`Excluindo Temporada ${seasonNum} e episódios...`, 
      async () => {
        try {
          await DB.deleteSeason(activeCartoonId, seasonNum);
          window.clearPendingDeletion?.(seasonKey);
          if (editingSeason === seasonNum) resetEpForm();
          renderContent();
        } catch (err) {
          showToast(err.message || 'Erro ao excluir temporada!', 'error');
        }
      },
      () => {
        window.clearPendingDeletion?.(seasonKey);
        renderContent();
      },
      () => {
        window.markPendingDeletion?.(seasonKey);
        renderContent();
      }
    );
  };

  if (epForm) {
    epForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeCartoonId) return showToast('Selecione um desenho primeiro', 'error');

      const type = entryType.value;
      const title = epTitle.value.trim();
      let iframe = epIframe.value.trim();

      if (!iframe || (type === 'movie' && !title)) {
        return showToast('Preencha os campos obrigatorios (*)', 'error');
      }

      if (iframe.startsWith('http') && !iframe.includes('<iframe')) {
        iframe = `<iframe src="${iframe}" frameborder="0" height="400" scrolling="no" width="640" allow="encrypted-media" allowFullScreen></iframe>`;
      }

      addEpBtn.disabled = true;
      addEpBtn.textContent = 'Salvando...';

      try {
        if (type === 'movie') {
          const movieData = { title, iframe };
          if (editingMovieId) {
            await DB.updateMovie(activeCartoonId, editingMovieId, movieData);
            showToast('Filme atualizado!');
            resetEpForm();
          } else {
            await DB.addMovie(activeCartoonId, movieData);
            epTitle.value = '';
            epIframe.value = '';
            showToast('Filme adicionado!');
          }
        } else {
          const season = parseInt(epSeason.value, 10);
          const number = parseInt(epNumber.value, 10);
          if (!season || !number) {
            return showToast('Preencha temporada e numero', 'error');
          }

          const epData = { epNumber: number, title, iframe };
          if (editingEpId) {
            await DB.updateEpisode(activeCartoonId, editingSeason, season, editingEpId, epData);
            showToast('Episodio atualizado!');
            resetEpForm();
          } else {
            await DB.addEpisode(activeCartoonId, season, epData);
            epNumber.value = number + 1;
            epTitle.value = '';
            epIframe.value = '';
            showToast('Episodio adicionado!');
          }
        }

        renderContent();
      } catch (err) {
        showToast(err.message || 'Erro ao salvar!', 'error');
      } finally {
        addEpBtn.disabled = false;
        if (!editingEpId && !editingMovieId) {
          addEpBtn.textContent = 'Adicionar';
        }
      }
    });
  }

  function resetEpForm() {
    editingEpId = null;
    editingSeason = null;
    editingMovieId = null;
    epTitle.value = '';
    epIframe.value = '';
    addEpBtn.textContent = 'Adicionar';
    addEpBtn.style.background = 'var(--accent2)';
    if (formActionTitle) formActionTitle.textContent = entryType.value === 'movie' ? 'Adicionar Filme' : 'Adicionar Episodio';
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.remove();
  }

  window.openWatchModal = (id, seasonOrMovie) => {
    if (typeof window.requireContentAccess === 'function' && !window.requireContentAccess()) return;
    let item;

    if (seasonOrMovie === 'movie') {
      item = getActiveMovieById(id);
      activeTypeForWatch = 'movie';
      activeSeasonForWatch = null;
    } else {
      item = getActiveEpisodeById(id, seasonOrMovie);
      activeTypeForWatch = 'episode';
      activeSeasonForWatch = seasonOrMovie;
    }

    if (!item) return;
    activeEpisodeId = id;

    trackHistoryView(item, seasonOrMovie);

    watchTitle.textContent = activeTypeForWatch === 'movie'
      ? `Filme: ${item.title || 'Assistir'}`
      : `T${seasonOrMovie}:E${item.epNumber} - ${item.title || 'Assistir'}`;

    watchFrame.innerHTML = '<div style="color:var(--primary); font-family:Bangers; font-size:1.5rem; display:flex; flex-direction:column; align-items:center; gap:1rem;"><span class="spinner"></span> Carregando...</div>';

    setTimeout(() => {
      watchFrame.innerHTML = item.iframe || '<p style="color:var(--danger)">Erro: video indisponivel.</p>';

      const iframeEl = watchFrame.querySelector('iframe');
      if (!item.iframe) return;

      if (iframeEl) {
        iframeEl.setAttribute('style', 'width:100%;height:100%;border:none;border-radius:0;');
        iframeEl.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
        iframeEl.setAttribute('allowfullscreen', '');
        iframeEl.setAttribute('loading', 'lazy');
        iframeEl.removeAttribute('referrerpolicy');
        iframeEl.removeAttribute('sandbox');
        iframeEl.removeAttribute('height');
        iframeEl.removeAttribute('width');
        iframeEl.removeAttribute('scrolling');
      }
    }, 100);

    updateWatchedBadge(id);

    // Lógica do input de tempo (onde parou)
    const noteInput = document.getElementById('watchTimeNote');
    const saveNoteBtn = document.getElementById('saveTimeNoteBtn');
    if (noteInput && saveNoteBtn) {
        const userId = window.DB?._store?.profile?.id || 'guest';
        const key = `animehouse_time_${userId}_${id}`;
        noteInput.value = (localStorage.getItem(key) || '').slice(0, 20);
        
        saveNoteBtn.onclick = () => {
            const val = noteInput.value.trim().slice(0, 20);
            localStorage.setItem(key, val);
            noteInput.value = val;
            showToast('Nota salva!');
            renderContent();
        };
    }

    watchModal.classList.add('open');
  };

  const closeWatch = () => {
    watchModal.classList.remove('open');
    const iframes = watchFrame.querySelectorAll('iframe');
    iframes.forEach((iframeEl) => {
      iframeEl.src = '';
    });
    watchFrame.innerHTML = '';
  };
  document.getElementById('watchClose').onclick = closeWatch;

  watchDeleteBtn.onclick = () => {
    if (!activeEpisodeId) return;
    const id = activeEpisodeId;
    closeWatch();

    let itemName = activeTypeForWatch === 'movie' ? 'Filme' : 'Episódio';
    if (activeTypeForWatch === 'movie') {
      const m = DB.getMoviesFor(activeCartoonId).find(x => x.id === id);
      if (m) itemName = `Filme: ${m.title}`;
    } else {
      const eps = DB.getEpisodesFor(activeCartoonId)[activeSeasonForWatch] || [];
      const ep = eps.find(x => x.id === id);
      if (ep) itemName = `Ep ${ep.epNumber} - ${ep.title || 'Sem título'}`;
    }

    showUndoToast(`Excluindo "${itemName}"...`, 
      async () => {
        try {
          if (activeTypeForWatch === 'movie') {
            await DB.deleteMovie(activeCartoonId, id);
          } else {
            await DB.deleteEpisode(activeCartoonId, activeSeasonForWatch, id);
          }
          window.clearPendingDeletion?.(id);
          renderContent();
        } catch (err) {
          showToast(err.message || 'Erro ao excluir!', 'error');
        }
      },
      () => {
        window.clearPendingDeletion?.(id);
        renderContent();
      },
      () => {
        window.markPendingDeletion?.(id);
        renderContent();
      }
    );
  };

  const watchedBadge = document.getElementById('watchedModalBadge');
  function updateWatchedBadge(id) {
    const isWatched = typeof Watched !== 'undefined' && Watched.isWatched(id);
    watchedBadge.className = 'watched-modal-badge ' + (isWatched ? 'is-watched' : 'not-watched');
    watchedBadge.textContent = isWatched ? 'Assistido' : 'Marcar como Assistido';

    const contentType = activeTypeForWatch === 'movie' ? 'desenho_movie' : 'desenho_episode';
    watchedBadge.onclick = async () => {
      if (typeof Watched === 'undefined') return;
      try {
        const isNowWatched = await Watched.toggle(id, contentType);
        watchedBadge.className = 'watched-modal-badge ' + (isNowWatched ? 'is-watched' : 'not-watched');
        watchedBadge.textContent = isNowWatched ? 'Assistido' : 'Marcar como Assistido';
        renderContent();
        if (typeof StatsManager !== 'undefined') StatsManager.render('desenhos');
      } catch (err) {
        showToast(err.message || 'Nao foi possivel atualizar o checklist.', 'error');
      }
    };
  }
  loadCartoons();
  window.addEventListener('profileUpdated', () => { loadCartoons(); });
  window.addEventListener('storage', (e) => {
    if (e.key === 'animehouse_store' || (e.key && e.key.startsWith('equipped_'))) loadCartoons();
  });
});
