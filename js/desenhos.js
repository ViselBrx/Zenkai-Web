document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
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

  function loadCartoons() {
    const list = DB.getCartoons();
    pillsContainer.innerHTML = '';
    
    if (list.length === 0) {
      noRegisteredMsg.style.display = 'block';
      noCartoonMsg.style.display = 'none';
      panel.style.display = 'none';
      return;
    }
    
    list.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'cartoon-pill';
      btn.innerHTML = c.capa 
        ? `<img src="${c.capa}" onerror="this.src='';this.style.background='var(--primary)'"> ${c.nome}`
        : `<div style="width:26px;height:26px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:12px;">🎬</div> ${c.nome}`;
      
      btn.onclick = () => selectCartoon(c.id, btn);
      pillsContainer.appendChild(btn);
    });

    const pending = localStorage.getItem('selectedCartoon');
    if (pending) {
      const btn = [...pillsContainer.children].find(b => b.textContent.includes(DB.getCartoonById(pending)?.nome));
      if (btn) selectCartoon(pending, btn);
      localStorage.removeItem('selectedCartoon');
    } else {
      noCartoonMsg.style.display = 'block';
    }
  }

  // Reforço para Enter nos inputs do formulário de episódios
  [epSeason, epNumber, epTitle, epIframe].forEach(input => {
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          // Permite que o bug de submissão dupla seja evitado pelo e.preventDefault() no submit do form
          // mas garante o gatilho.
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
      card.className = 'episode-card';
      card.innerHTML = `
        <div style="position:relative;background:#000;cursor:pointer;" onclick="openWatchModal('${m.id}', 'movie')">
          <div style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:var(--bg-surface);">
            <span style="font-size:3rem;text-shadow:0 0 10px rgba(0,0,0,0.5);">🎬</span>
          </div>
          <div style="position:absolute;bottom:0;left:0;right:0;padding:10px;background:linear-gradient(transparent, rgba(0,0,0,0.9));color:#fff;font-weight:700;">
            FILME
          </div>
        </div>
        <div class="episode-label" style="justify-content:space-between">
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${m.title}">${m.title}</span>
          <button class="btn btn-ghost btn-sm" onclick="editMovie(event, '${m.id}')" style="padding:2px 5px;font-size:0.8rem">✏️</button>
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
          <h3>Temporada ${seasonNum}</h3>
          <span class="badge-pill badge-accent">${eps.length} Eps</span>
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

      eps.forEach(ep => {
        if (window.pendingDeletions && window.pendingDeletions.has(ep.id)) return;
        const card = document.createElement('div');
        card.className = 'episode-card';
        card.innerHTML = `
          <div style="position:relative;background:#000;cursor:pointer;" onclick="openWatchModal('${ep.id}', ${seasonNum})">
            <div style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:var(--bg-surface);">
              <span style="font-size:3rem;text-shadow:0 0 10px rgba(0,0,0,0.5);">▶️</span>
            </div>
            <div style="position:absolute;bottom:0;left:0;right:0;padding:10px;background:linear-gradient(transparent, rgba(0,0,0,0.9));color:#fff;font-weight:700;">
              Episódio ${ep.epNumber}
            </div>
          </div>
          <div class="episode-label" style="justify-content:space-between">
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${ep.title || ''}">${ep.title || 'Sem título'}</span>
            <button class="btn btn-ghost btn-sm" onclick="editEpisode(event, '${ep.id}', ${seasonNum})" style="padding:2px 5px;font-size:0.8rem">✏️</button>
          </div>
        `;
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
    const ep = sEps.find(x => x.id === epId);
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
    addEpBtn.classList.replace('btn-primary', 'btn-accent');
    if (formActionTitle) formActionTitle.textContent = '✏️ Editar Episódio';
    
    document.querySelector('.page-header').scrollIntoView({ behavior: 'smooth' });
    showCancelBtn();
  };

  window.editMovie = (e, mId) => {
    e.stopPropagation();
    const movie = DB.getMoviesFor(activeCartoonId).find(x => x.id === mId);
    if (!movie) return;

    resetEpForm();
    entryType.value = 'movie';
    entryType.dispatchEvent(new Event('change'));

    editingMovieId = mId;
    epTitle.value = movie.title;
    epIframe.value = movie.iframe;

    addEpBtn.textContent = 'Salvar Filme';
    addEpBtn.classList.replace('btn-primary', 'btn-accent');
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
    addEpBtn.classList.replace('btn-accent', 'btn-primary');
    if (formActionTitle) formActionTitle.textContent = entryType.value === 'movie' ? '➕ Adicionar Filme' : '➕ Adicionar Episódio';
    const cancelBtn = document.getElementById('cancelEditBtn');
    if(cancelBtn) cancelBtn.remove();
  }

  if (epForm) {
    epForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeCartoonId) return showToast('Selecione um desenho primeiro', 'error');
      
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
          DB.updateEpisode(activeCartoonId, editingSeason, s, editingEpId, epData);
          showToast('Episódio atualizado!');
          resetEpForm();
        } else {
          DB.addEpisode(activeCartoonId, s, epData);
          showToast(`Adicionado: Temp ${s} - Ep ${num}`);
          epNumber.value = num + 1;
          epTitle.value = '';
          epIframe.value = '';
        }
      } else {
        const movieData = { title, iframe };
        if (editingMovieId) {
          DB.updateMovie(activeCartoonId, editingMovieId, movieData);
          showToast('Filme atualizado!');
          resetEpForm();
        } else {
          DB.addMovie(activeCartoonId, movieData);
          showToast('Filme adicionado!');
          epTitle.value = '';
          epIframe.value = '';
        }
      }

      renderContent();
    });
  }

  window.deleteSeason = (e, seasonNum) => {
    e.stopPropagation();
    const seasonKey = `s_${activeCartoonId}_${seasonNum}`;
    if (!window.pendingDeletions) window.pendingDeletions = new Set();
    window.pendingDeletions.add(seasonKey);
    renderContent();

    showUndoToast(`Excluindo Temporada ${seasonNum} e episódios...`, 
      () => {
        if (window.pendingDeletions.has(seasonKey)) {
          DB.deleteSeason(activeCartoonId, seasonNum);
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
      item = DB.getMoviesFor(activeCartoonId).find(x => x.id === id);
      activeTypeForWatch = 'movie';
    } else {
      const sEps = DB.getEpisodesFor(activeCartoonId)[typeOrSeason];
      item = sEps.find(x => x.id === id);
      activeTypeForWatch = 'episode';
      activeSeasonForWatch = typeOrSeason;
    }
    
    if (!item) return;
    activeEpisodeId = id;
    
    watchTitle.textContent = activeTypeForWatch === 'movie' ? `Filme: ${item.title}` : `T${typeOrSeason}:E${item.epNumber} - ${item.title || 'Assistir'}`;
    watchFrame.innerHTML = item.iframe;
    watchModal.classList.add('open');
  };

  const closeWatch = () => {
    watchModal.classList.remove('open');
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
      const m = DB.getMoviesFor(activeCartoonId).find(x => x.id === id);
      if (m) itemName = `Filme: ${m.title}`;
    } else {
      const eps = DB.getEpisodesFor(activeCartoonId)[activeSeasonForWatch] || [];
      const ep = eps.find(x => x.id === id);
      if (ep) itemName = `Ep ${ep.epNumber} - ${ep.title || 'Sem título'}`;
    }

    showUndoToast(`Excluindo "${itemName}"...`, 
      () => {
        if (window.pendingDeletions.has(id)) {
          if (activeTypeForWatch === 'movie') {
            DB.deleteMovie(activeCartoonId, id);
          } else {
            DB.deleteEpisode(activeCartoonId, activeSeasonForWatch, id);
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

  loadCartoons();
});
