document.addEventListener('DOMContentLoaded', async () => {
  await DB.init(['filmes']);
  if (typeof StatsManager !== 'undefined') StatsManager.render('filmes');
  const grid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterGenero = document.getElementById('filterGenero');
  const filterAno = document.getElementById('filterAno');
  const filterFavoritos = document.getElementById('filterFavoritos');

  let filmes = DB.getFilmes();
  let pendingHistoryResume = null;
  let openFilmDetailId = null;

  function loadPendingHistoryResume() {
    if (typeof HistoryTracker === 'undefined') {
      pendingHistoryResume = null;
      return;
    }
    pendingHistoryResume = HistoryTracker.consumeResumeFromUrl('filmes.html');
  }

  function clearPendingHistoryResume() {
    pendingHistoryResume = null;
  }

  function trackHistoryView(f) {
    if (typeof HistoryTracker === 'undefined' || !f) return;
    HistoryTracker.track({
      contentId: f.id,
      contentType: 'filme',
      title: f.nome || 'Filme',
      subtitle: [f.ano, f.genero].filter(Boolean).join(' - ') || 'Filme',
      coverUrl: f.capa || '',
      route: 'filmes.html',
      payload: {
        filmId: f.id,
        mediaType: 'movie'
      }
    });
  }

  function tryResumeFilmPlayback() {
    if (!pendingHistoryResume) return;
    const filmId = pendingHistoryResume.filmId || pendingHistoryResume.contentId;
    if (!filmId) {
      clearPendingHistoryResume();
      return;
    }

    const film = filmes.find(f => f.id === filmId) || DB.getFilmeById(filmId);
    clearPendingHistoryResume();
    if (!film) return;

    setTimeout(() => openWatchModal(film), 60);
  }

  function initFilters() {
    const generos = [...new Set(filmes.map(f => f.genero).filter(Boolean))].sort();
    filterGenero.innerHTML = '<option value="">Todos os gêneros</option>';
    generos.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g; opt.textContent = g;
      filterGenero.appendChild(opt);
    });

    const anos = [...new Set(filmes.map(f => f.ano).filter(Boolean))].sort((a, b) => b - a);
    filterAno.innerHTML = '<option value="">Todos os anos</option>';
    anos.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a; opt.textContent = a;
      filterAno.appendChild(opt);
    });
  }

  async function render() {
    const term = searchInput.value.toLowerCase();
    const gen = filterGenero.value;
    const ano = filterAno.value;

    const filtered = filmes.map((f, index) => ({ ...f, _originIndex: index })).filter(f => {
      const matchName = f.nome.toLowerCase().includes(term);
      const matchGenero = gen === '' || f.genero === gen;
      const matchAno = ano === '' || String(f.ano) === ano;
      return matchName && matchGenero && matchAno;
    });

    grid.innerHTML = '';
    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    const frag = document.createDocumentFragment();

    // Buscar favoritos
    let userFavs = new Set();
    try {
      const favs = await DB.getFavorites('filme');
      userFavs = new Set(favs.map(f => f.content_id));
    } catch (e) {
      console.warn("Erro ao carregar favoritos de filmes.");
    }

    // Favoritos no topo, demais itens na ordem original
    const favFilter = filterFavoritos ? filterFavoritos.value : '';
    const finalFiltered = (typeof favFilter !== 'undefined' && favFilter === 'favoritos') ? filtered.filter(f => userFavs.has(f.id)) : filtered;
    finalFiltered.sort((a, b) => {
      const aFav = userFavs.has(a.id) ? 1 : 0;
      const bFav = userFavs.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return a._originIndex - b._originIndex;
    });

    finalFiltered.forEach(f => {
      const isFav = userFavs.has(f.id);
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.originIndex = String(f._originIndex);
      card.dataset.contentId = f.id;
      const isWatched = typeof Watched !== 'undefined' && Watched.isWatched(f.id);

      let imgHtml = f.capa ? `<img src="${f.capa}" class="card-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />` : '';
      let placeholder = `<div class="card-cover-placeholder" style="${f.capa ? 'display:none;' : ''}">🎬</div>`;
      const watchedBadge = isWatched
        ? `<span style="position:absolute;top:8px;right:8px;background:var(--success);color:#fff;border-radius:50px;padding:3px 10px;font-size:0.72rem;font-weight:700;box-shadow:0 4px 8px rgba(16,185,129,0.3);z-index:4;">✓ Assistido</span>`
        : '';

      const starClass = '';
      const favBtnHtml = `
        <button class="fav-star ${isFav ? 'active' : ''} ${starClass}" data-id="${f.id}" title="${isFav ? 'Desmarcar' : 'Marcar'}">
          ${isFav ? '★' : '☆'}
        </button>
      `;

      card.innerHTML = `
        <div style="position:relative; cursor:pointer;" class="card-click-area">
          ${imgHtml}${placeholder}${watchedBadge}
          ${(() => {
            const uid = window.DB?._store?.profile?.id || 'guest';
            const saved = localStorage.getItem(`animehouse_time_${uid}_${f.id}`);
            return saved ? `<div style="position:absolute; top:45px; left:8px; background:rgba(var(--primary-rgb), 0.9); color:#fff; padding:3px 10px; border-radius:20px; font-size:0.7rem; font-weight:700; z-index:5; box-shadow:0 2px 8px rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.2);">${saved}</div>` : '';
          })()}
          ${isFav ? '<div class="fav-ribbon">Favorito</div>' : ''}
        </div>
        ${favBtnHtml}
        <div class="card-body card-click-area" style="cursor:pointer;">
          <div class="card-title">${f.nome}</div>
          <div class="card-meta">
            <span>${f.diretor || ''}</span>
          </div>
          <span class="card-badge" style="background:rgba(239,68,68,0.15);color:#f87171;">${f.ano ? f.ano : ''}${f.genero ? (f.ano ? ' · ' : '') + f.genero : ''}</span>
        </div>
      `;

      // Clique no card (abre detalhes)
      card.onclick = () => openDetailModal(f);

      // Clique na estrela (Favoritar)
      const favBtn = card.querySelector('.fav-star');
      if (favBtn) {
        favBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
             await toggleFavorite(f, favBtn);
          } catch(err) {
             console.error(err);
          }
        };
      }

      frag.appendChild(card);
    });

    grid.appendChild(frag);
  }

  async function toggleFavorite(item, btn) {
    try {
      const res = await DB.toggleFavorite(item.id, 'filme', { title: item.nome, cover: item.capa });
      const isAdded = res.action === 'added';

      const card = btn.closest('.card') || DB.findFavoriteCardByContentId(grid, item.id);
      if (card) DB.applyFavoriteCardChrome(card, isAdded);
      else {
        btn.classList.toggle('active', isAdded);
        btn.innerHTML = isAdded ? '★' : '☆';
        btn.title = isAdded ? 'Desmarcar' : 'Marcar';
      }

      DB.reorderFavoriteCards(grid);

      showToast(isAdded
        ? `"${item.nome}" adicionado aos favoritos!`
        : `"${item.nome}" removido dos favoritos.`);
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar favoritos.', 'error');
    }
  }

  /* MODAL DETALHES */
  const detailModal = document.getElementById('detailModal');
  const detailTitle = document.getElementById('detailTitle');
  const detailCover = document.getElementById('detailCover');
  const detailPlaceholder = document.getElementById('detailCoverPlaceholder');
  const detailDiretor = document.getElementById('detailDiretor');
  const detailAno = document.getElementById('detailAno');
  const detailGenero = document.getElementById('detailGenero');
  const detailWatchBtn = document.getElementById('detailWatchBtn');
  async function openDetailModal(f) {
    openFilmDetailId = f.id;
    detailTitle.textContent = f.nome;
    detailDiretor.textContent = f.diretor || 'N/A';
    detailAno.textContent = f.ano || 'N/A';
    detailGenero.textContent = f.genero || 'Não especificado';

    if (f.capa) {
      detailCover.src = f.capa;
      detailCover.style.display = 'block';
      detailPlaceholder.style.display = 'none';
      detailCover.onerror = () => { detailCover.style.display = 'none'; detailPlaceholder.style.display = 'flex'; };
    } else {
      detailCover.style.display = 'none';
      detailPlaceholder.style.display = 'flex';
    }

    // Botão de marcar como assistido no modal de detalhes
    let watchedDetailBtn = document.getElementById('watchedDetailBtn');
    if (watchedDetailBtn && typeof Watched !== 'undefined') {
      const w = Watched.isWatched(f.id);
      watchedDetailBtn.className = 'watched-modal-badge ' + (w ? 'is-watched' : 'not-watched');
      watchedDetailBtn.innerHTML = w ? '✓ Assistido' : '○ Marcar como Assistido';
      watchedDetailBtn.onclick = async (e) => {
        e.stopPropagation();
        let nowWatched;
        try {
          nowWatched = await Watched.toggle(f.id, 'filme');
        } catch (err) {
          showToast(err.message || 'Nao foi possivel atualizar o checklist.', 'error');
          return;
        }
        watchedDetailBtn.className = 'watched-modal-badge ' + (nowWatched ? 'is-watched' : 'not-watched');
        watchedDetailBtn.innerHTML = nowWatched ? '✓ Assistido' : '○ Marcar como Assistido';
        render(); // Atualiza badge no card do catálogo
      };
    }

    detailWatchBtn.onclick = () => {
      openFilmDetailId = null;
      detailModal.classList.remove('open');
      openWatchModal(f);
    };

    detailModal.classList.add('open');
  }

  document.getElementById('detailClose').addEventListener('click', () => {
    openFilmDetailId = null;
    detailModal.classList.remove('open');
    detailCover.src = '';
  });

  /* MODAL PLAYER */
  const watchModal = document.getElementById('watchModal');
  const watchTitle = document.getElementById('watchTitle');
  const watchFrame = document.getElementById('watchFrame');

  async function openWatchModal(f) {
    if (window.supabaseClient) {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (!session) {
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
    }
    watchTitle.textContent = f.nome;
    watchFrame.innerHTML = f.iframe || '';
    watchModal.classList.add('open');
    trackHistoryView(f);
    // Botão de marcar como assistido no modal de player
    const wBadge = document.getElementById('watchedModalBadge');
    if (wBadge && typeof Watched !== 'undefined') {
      const w = Watched.isWatched(f.id);
      wBadge.className = 'watched-modal-badge ' + (w ? 'is-watched' : 'not-watched');
      wBadge.innerHTML = w ? '✓ Assistido' : '○ Marcar como Assistido';
      wBadge.onclick = async () => {
        let nowWatched;
        try {
          nowWatched = await Watched.toggle(f.id, 'filme');
        } catch (err) {
          showToast(err.message || 'Nao foi possivel atualizar o checklist.', 'error');
          return;
        }
        wBadge.className = 'watched-modal-badge ' + (nowWatched ? 'is-watched' : 'not-watched');
        wBadge.innerHTML = nowWatched ? '✓ Assistido' : '○ Marcar como Assistido';
        render();
      };
    }

    // Lógica do input de tempo (onde parou)
    const noteInput = document.getElementById('watchTimeNote');
    const saveNoteBtn = document.getElementById('saveTimeNoteBtn');
    if (noteInput && saveNoteBtn) {
        const userId = window.DB?._store?.profile?.id || 'guest';
        const key = `animehouse_time_${userId}_${f.id}`;
        noteInput.value = (localStorage.getItem(key) || '').slice(0, 20);
        
        saveNoteBtn.onclick = () => {
            const val = noteInput.value.trim().slice(0, 20);
            localStorage.setItem(key, val);
            noteInput.value = val;
            showToast('Nota salva!');
            render(); // Atualiza o card
        };
    }
  }

  document.getElementById('watchClose').addEventListener('click', () => {
    watchModal.classList.remove('open');
    watchFrame.innerHTML = '';
    watchTitle.textContent = '—';
  });

  searchInput.addEventListener('input', render);
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); searchInput.blur(); }
  });
  filterGenero.addEventListener('change', render);
  filterAno.addEventListener('change', render);
  if (filterFavoritos) filterFavoritos.addEventListener('change', render);

  loadPendingHistoryResume();
  initFilters();
  if (window.initCustomSelects) window.initCustomSelects();
  render();
  tryResumeFilmPlayback();

  window.addEventListener('profileUpdated', () => { render(); });
  window.addEventListener('storage', (e) => {
    if (e.key === 'animehouse_store' || (e.key && e.key.startsWith('equipped_'))) render();
  });
});
