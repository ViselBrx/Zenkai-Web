document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  const pillsContainer = document.getElementById('animePills');
  const seasonsContainer = document.getElementById('seasonsContainer');
  const panel = document.getElementById('episodePanel');
  const noAnimeMsg = document.getElementById('noAnimeMsg');
  const noRegisteredMsg = document.getElementById('noAnimeRegistered');

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

  const watchModal = document.getElementById('watchModal');
  const watchTitle = document.getElementById('watchTitle');
  const watchFrame = document.getElementById('watchFrame');
  const watchDeleteBtn = document.getElementById('watchDeleteBtn');

  const activeAudioForm = document.getElementById('activeAudioForm');
  const audioTabs = document.querySelectorAll('.audio-tab');
  let activeAudio = 'dublado';

  let activeAnimeId = null;
  const epForm = document.getElementById('epForm');
  let activeEpisodeId = null;
  let activeSeasonForWatch = null;
  let activeTypeForWatch = 'episode'; // 'episode' ou 'movie'
  let pendingHistoryResume = null;

  function loadPendingHistoryResume() {
    if (typeof HistoryTracker === 'undefined') {
      pendingHistoryResume = null;
      return;
    }
    pendingHistoryResume = HistoryTracker.consumeResumeFromUrl('anime-episodios.html');
  }

  function clearPendingHistoryResume() {
    pendingHistoryResume = null;
  }

  function trackHistoryView(item, typeOrSeason) {
    if (typeof HistoryTracker === 'undefined' || !activeAnimeId || !item) return;

    const anime = DB.getAnimeById(activeAnimeId);
    const isMovie = typeOrSeason === 'movie';
    const season = isMovie ? null : Number(typeOrSeason);
    const epNumber = Number(item.epNumber || 0) || null;
    const title = isMovie
      ? `${anime?.nome || 'Anime'} - Filme`
      : `${anime?.nome || 'Anime'} - ${activeAudio} - T${season || 1}E${epNumber || 1}`;

    HistoryTracker.track({
      contentId: item.id,
      contentType: isMovie ? 'anime_movie' : 'anime_episode',
      title,
      subtitle: isMovie
        ? (item.title || 'Filme sem titulo')
        : (item.title || `Episodio ${epNumber || 1}`),
      coverUrl: anime?.capa || '',
      route: 'anime-episodios.html',
      payload: {
        animeId: activeAnimeId,
        season,
        audio: activeAudio,
        mediaType: isMovie ? 'movie' : 'episode'
      }
    });
  }

  function syncAudioTabFromState() {
    audioTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.audio === activeAudio);
    });
    activeAudioForm.value = activeAudio;
  }

  function tryResumeWatchFromHistory() {
    if (!pendingHistoryResume || !activeAnimeId) return;
    if (pendingHistoryResume.route !== 'anime-episodios.html') return;
    if (pendingHistoryResume.animeId !== activeAnimeId) return;

    const targetId = pendingHistoryResume.contentId;
    if (!targetId) {
      clearPendingHistoryResume();
      return;
    }

    const resumeAudio = pendingHistoryResume.audio || activeAudio;
    if (resumeAudio !== activeAudio) {
      activeAudio = resumeAudio;
      syncAudioTabFromState();
      renderSeasons();
    }

    const isMovie = pendingHistoryResume.contentType === 'anime_movie';
    if (isMovie) {
      const movieExists = DB.getAnimeMoviesFor(activeAnimeId).some(m => m.id === targetId);
      if (!movieExists) {
        clearPendingHistoryResume();
        return;
      }
      clearPendingHistoryResume();
      setTimeout(() => window.openWatchModal(targetId, 'movie'), 60);
      return;
    }

    const season = Number(pendingHistoryResume.season || 1);
    const seasonEps = DB.getAnimeEpisodesFor(activeAnimeId, activeAudio)[season] || [];
    const epExists = seasonEps.some(ep => ep.id === targetId);
    if (!epExists) {
      clearPendingHistoryResume();
      return;
    }

    clearPendingHistoryResume();
    setTimeout(() => window.openWatchModal(targetId, season), 60);
  }

  function loadAnimes() {
    const list = DB.getAnimes();
    pillsContainer.innerHTML = '';
    
    if (list.length === 0) {
      noRegisteredMsg.style.display = 'block';
      noAnimeMsg.style.display = 'none';
      panel.style.display = 'none';
      return;
    }
    
    list.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'cartoon-pill';
      btn.innerHTML = a.capa 
        ? `<img src="${a.capa}" onerror="this.src='';this.style.background='var(--accent2)'"> ${a.nome}`
        : `<div style="width:26px;height:26px;border-radius:50%;background:var(--accent2);display:flex;align-items:center;justify-content:center;font-size:12px;color:white">⛩️</div> ${a.nome}`;
      
      btn.onclick = () => selectAnime(a.id, btn);
      pillsContainer.appendChild(btn);
    });

    loadPendingHistoryResume();
    const pendingFromHistory = pendingHistoryResume?.animeId || null;
    const pending = pendingFromHistory || localStorage.getItem('selectedAnime');
    if (pending) {
      const btn = [...pillsContainer.children].find(b => b.textContent.includes(DB.getAnimeById(pending)?.nome));
      if (btn) selectAnime(pending, btn);
      if (!pendingFromHistory) localStorage.removeItem('selectedAnime');
    } else {
      noAnimeMsg.style.display = 'block';
    }
  }

  // Reforço para Enter
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

  audioTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      audioTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeAudio = tab.dataset.audio;
      activeAudioForm.value = activeAudio;
      renderSeasons();
    });
  });

  activeAudioForm.addEventListener('change', () => {
    // Ao mudar no form, opcionalmente muda a aba para facilitar a visão
    const targetTab = [...audioTabs].find(t => t.dataset.audio === activeAudioForm.value);
    if (targetTab) targetTab.click();
  });

  function selectAnime(id, btnElement) {
    document.querySelectorAll('.cartoon-pill').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    
    activeAnimeId = id;
    noAnimeMsg.style.display = 'none';
    noRegisteredMsg.style.display = 'none';
    panel.style.display = 'block';
    
    epSeason.value = 1; epNumber.value = 1; epTitle.value = ''; epIframe.value = '';
    if (pendingHistoryResume && pendingHistoryResume.animeId === id && pendingHistoryResume.audio) {
      activeAudio = pendingHistoryResume.audio;
      syncAudioTabFromState();
    }
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
    if (!activeAnimeId) return;

    const movies = DB.getAnimeMoviesFor(activeAnimeId);
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
        });
        labelDiv.prepend(wBtn);
      }
      grid.appendChild(card);
    });

    sec.appendChild(grid);
    moviesContainer.appendChild(sec);
  }

  function renderSeasons() {
    seasonsContainer.innerHTML = '';
    if (!activeAnimeId) return;

    // Animação de entrada
    seasonsContainer.classList.remove('content-animate');
    void seasonsContainer.offsetWidth; // Trigger reflow
    seasonsContainer.classList.add('content-animate');

    const allEps = DB.getAnimeEpisodesFor(activeAnimeId, activeAudio);
    const seasons = Object.keys(allEps).map(Number).sort((a,b) => a-b);

    if (seasons.length === 0 && DB.getAnimeMoviesFor(activeAnimeId).length === 0) {
      seasonsContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">Nenhum conteúdo cadastrado.</p>';
      return;
    }

    seasons.forEach(seasonNum => {
      const seasonKey = `s_${activeAnimeId}_${seasonNum}`;
      if (window.pendingDeletions && window.pendingDeletions.has(seasonKey)) return;
      const eps = allEps[seasonNum].sort((a,b) => Number(a.epNumber) - Number(b.epNumber));
      
      const sec = document.createElement('div');
      sec.className = 'season-section';
      
      const head = document.createElement('div');
      head.className = 'season-header';
      head.innerHTML = `
        <div style="display:flex;align-items:center;gap:15px;">
          <h3 style="color:#a78bfa">Temporada ${seasonNum} (${activeAudio.charAt(0).toUpperCase() + activeAudio.slice(1)})</h3>
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
          });
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
    const sEps = DB.getAnimeEpisodesFor(activeAnimeId, activeAudio)[seasonNum];
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
    activeAudioForm.value = activeAudio;

    addEpBtn.textContent = 'Salvar Alterações';
    addEpBtn.style.background = 'var(--primary)';
    if (formActionTitle) formActionTitle.textContent = '✏️ Editar Episódio';
    
    document.querySelector('.page-header').scrollIntoView({ behavior: 'smooth' });
    showCancelBtn();
  };

  window.editMovie = (e, mId) => {
    e.stopPropagation();
    const movie = DB.getAnimeMoviesFor(activeAnimeId).find(x => x.id === mId);
    if (!movie) return;

    resetEpForm();
    entryType.value = 'movie';
    entryType.dispatchEvent(new Event('change'));

    editingMovieId = mId;
    epTitle.value = movie.title;
    epIframe.value = movie.iframe;

    addEpBtn.textContent = 'Salvar Filme';
    addEpBtn.style.background = 'var(--primary)';
    if (formActionTitle) formActionTitle.textContent = '✏️ Editar Filme';

    document.querySelector('.page-header').scrollIntoView({ behavior: 'smooth' });
    showCancelBtn();
  };

  function showCancelBtn() {
    if(!document.getElementById('cancelEditBtn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.className = 'btn btn-ghost';
        cancelBtn.style.marginLeft = '10px';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.onclick = resetEpForm;
        addEpBtn.parentNode.appendChild(cancelBtn);
    }
  }

  function resetEpForm() {
    editingEpId = null;
    editingSeason = null;
    editingMovieId = null;
    epTitle.value = '';
    epIframe.value = '';
    addEpBtn.textContent = 'Adicionar';
    addEpBtn.style.background = 'var(--accent2)';
    if (formActionTitle) formActionTitle.textContent = entryType.value === 'movie' ? '➕ Adicionar Filme' : '➕ Adicionar Episódio';
    const cancelBtn = document.getElementById('cancelEditBtn');
    if(cancelBtn) cancelBtn.remove();
  }

  if (epForm) {
    epForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeAnimeId) return showToast('Selecione um anime primeiro', 'error');
      
      const type = entryType.value;
      const title = epTitle.value.trim();
      let iframe = epIframe.value.trim();

      if (!iframe || (type === 'movie' && !title)) {
        return showToast('Preencha os campos obrigatórios (*)', 'error');
      }

      if (iframe.startsWith('http') && !iframe.includes('<iframe')) {
        iframe = `<iframe src="${iframe}" frameborder="0" height="400" scrolling="no" width="640" allow="encrypted-media" allowFullScreen></iframe>`;
      }

      if (type === 'episode') {
        const s = parseInt(epSeason.value);
        const num = parseInt(epNumber.value);
        if (!s || !num) return showToast('Preencha temporada e número', 'error');
        
        const epData = { epNumber: num, title, iframe };

        if (editingEpId) {
          await DB.updateAnimeEpisode(activeAnimeId, activeAudioForm.value, editingSeason, s, editingEpId, epData);
          showDarkToast('Episódio atualizado!');
          resetEpForm();
        } else {
          const newEp = await DB.addAnimeEpisode(activeAnimeId, activeAudioForm.value, s, epData);
          epNumber.value = num + 1;
          epTitle.value = '';
          epIframe.value = '';
          showUndoToast(`Adicionado: ${activeAudioForm.value.toUpperCase()} - Temp ${s} - Ep ${num}`,
            () => {},
            async () => {
              await DB.deleteAnimeEpisode(activeAnimeId, activeAudioForm.value, s, newEp.id);
              renderContent();
            }
          );
        }
      } else {
        const movieData = { title, iframe };
        if (editingMovieId) {
          await DB.updateAnimeMovie(activeAnimeId, editingMovieId, movieData);
          showDarkToast('Filme atualizado!');
          resetEpForm();
        } else {
          const newMovie = await DB.addAnimeMovie(activeAnimeId, movieData);
          epTitle.value = '';
          epIframe.value = '';
          showUndoToast('Filme adicionado!',
            () => {},
            async () => {
              await DB.deleteAnimeMovie(activeAnimeId, newMovie.id);
              renderContent();
            }
          );
        }
      }

      renderContent();
    });
  }

  window.deleteSeason = (e, seasonNum) => {
    e.stopPropagation();
    const seasonKey = `s_${activeAnimeId}_${seasonNum}`;
    if (!window.pendingDeletions) window.pendingDeletions = new Set();
    window.pendingDeletions.add(seasonKey);
    renderContent();

    showUndoToast(`Excluindo Temporada ${seasonNum} e episódios...`, 
      () => {
        if (window.pendingDeletions.has(seasonKey)) {
          DB.deleteAnimeSeason(activeAnimeId, activeAudio, seasonNum);
          window.pendingDeletions.delete(seasonKey);
          if(editingSeason === seasonNum) resetEpForm();
          renderContent();
        }
      },
      () => {
        window.pendingDeletions.delete(seasonKey);
        renderContent();
      }
    );
  };

  window.openWatchModal = (id, typeOrSeason) => {
    let item;
    if (typeOrSeason === 'movie') {
      item = DB.getAnimeMoviesFor(activeAnimeId).find(x => x.id === id);
      activeTypeForWatch = 'movie';
    } else {
      const sEps = DB.getAnimeEpisodesFor(activeAnimeId, activeAudio)[typeOrSeason];
      item = sEps ? sEps.find(x => x.id === id) : null;
      activeTypeForWatch = 'episode';
      activeSeasonForWatch = typeOrSeason;
    }
    
    if (!item) return;
    activeEpisodeId = id;

    trackHistoryView(item, typeOrSeason);
    
    watchTitle.textContent = activeTypeForWatch === 'movie' ? `Filme: ${item.title}` : `T${typeOrSeason}:E${item.epNumber} - ${item.title || 'Assistir'}`;
    
    // Feedback visual de carregamento
    watchFrame.innerHTML = '<div style="color:var(--primary); font-family:Bangers; font-size:1.5rem; display:flex; flex-direction:column; align-items:center; gap:1rem;"><span class="spinner"></span> Carregando Anime...</div>';
    
    setTimeout(() => {
        watchFrame.innerHTML = item.iframe || '<p style="color:var(--danger)">Erro: Vídeo indisponível.</p>';

        const iframeSeguro = watchFrame.querySelector('iframe');
        if (!item.iframe) {
            return;
        }

        if (iframeSeguro) {
            iframeSeguro.setAttribute('style', 'width:100%;height:100%;border:none;border-radius:0;');
            iframeSeguro.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
            iframeSeguro.setAttribute('allowfullscreen', '');
            iframeSeguro.setAttribute('loading', 'lazy');
            iframeSeguro.removeAttribute('sandbox');
            iframeSeguro.removeAttribute('height');
            iframeSeguro.removeAttribute('width');
            iframeSeguro.removeAttribute('scrolling');
            return;
        }

        watchFrame.innerHTML = ''; // Limpar
        if (item.iframe) {
            // Usar método seguro para inserir iframe
            const temp = document.createElement('div');
            temp.innerHTML = item.iframe;
            const iframe = temp.querySelector('iframe');
            if (iframe) {
                // Garantir atributos críticos
                iframe.setAttribute('style', 'width:100%;height:100%;border:none;border-radius:0;');
                iframe.setAttribute('allow', 'fullscreen');
                iframe.setAttribute('loading', 'lazy');
                iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms');
                iframe.removeAttribute('height');
                iframe.removeAttribute('width');
                iframe.removeAttribute('scrolling');
                watchFrame.appendChild(iframe);
            } else {
                watchFrame.innerHTML = '<p style="color:var(--danger)">Erro: Formato de iframe inválido.</p>';
            }
        } else {
            watchFrame.innerHTML = '<p style="color:var(--danger)">Erro: Vídeo indisponível.</p>';
        }
    }, 100);

    // Botão de marcar como assistido no modal
    _updateWatchModalBadge(id);

    watchModal.classList.add('open');
  };

  function _updateWatchModalBadge(id) {
    let badge = document.getElementById('watchedModalBadge');
    if (!badge) return;
    const w = typeof Watched !== 'undefined' && Watched.isWatched(id);
    badge.className = 'watched-modal-badge ' + (w ? 'is-watched' : 'not-watched');
    badge.innerHTML = w ? '✓ Assistido' : '○ Marcar como Assistido';
    badge.onclick = () => {
      if (typeof Watched === 'undefined') return;
      const nowWatched = Watched.toggle(id);
      badge.className = 'watched-modal-badge ' + (nowWatched ? 'is-watched' : 'not-watched');
      badge.innerHTML = nowWatched ? '✓ Assistido' : '○ Marcar como Assistido';
      // Atualiza card na lista
      renderContent();
    };
  }

  const closeWatch = () => {
    watchModal.classList.remove('open');
    // Remover iframe para evitar que continue carregando
    const iframes = watchFrame.querySelectorAll('iframe');
    iframes.forEach(iframe => iframe.src = ''); // Parar carregamento
    watchFrame.innerHTML = '';
  };
  document.getElementById('watchClose').addEventListener('click', closeWatch);

  watchDeleteBtn.addEventListener('click', () => {
    const id = activeEpisodeId;
    closeWatch();

    if (!window.pendingDeletions) window.pendingDeletions = new Set();
    window.pendingDeletions.add(id);
    renderContent();

    let itemName = activeTypeForWatch === 'movie' ? 'Filme' : 'Episódio';
    if (activeTypeForWatch === 'movie') {
      const m = DB.getAnimeMoviesFor(activeAnimeId).find(x => x.id === id);
      if (m) itemName = `Filme: ${m.title}`;
    } else {
      const eps = DB.getAnimeEpisodesFor(activeAnimeId, activeAudio)[activeSeasonForWatch] || [];
      const ep = eps.find(x => x.id === id);
      if (ep) itemName = `Ep ${ep.epNumber} - ${ep.title || 'Sem título'}`;
    }

    showUndoToast(`Excluindo "${itemName}"...`, 
      () => {
        if (window.pendingDeletions.has(id)) {
          if (activeTypeForWatch === 'movie') {
            DB.deleteAnimeMovie(activeAnimeId, id);
          } else {
            DB.deleteAnimeEpisode(activeAnimeId, activeAudio, activeSeasonForWatch, id);
          }
          window.pendingDeletions.delete(id);
          renderContent();
        }
      },
      () => {
        window.pendingDeletions.delete(id);
        renderContent();
      }
    );
  });

  loadAnimes();
});
