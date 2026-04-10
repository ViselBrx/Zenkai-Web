document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  if (typeof StatsManager !== 'undefined') StatsManager.render('filmes');
  const grid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterGenero = document.getElementById('filterGenero');
  const filterAno = document.getElementById('filterAno');

  let filmes = DB.getFilmes();
  let pendingHistoryResume = null;

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

    const filtered = filmes.filter(f => {
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

    // OTIMIZAÇÃO: Busca todos os favoritos uma única vez
    let userFavs = new Set();
    try {
        const favs = await DB.getFavorites('filme');
        userFavs = new Set(favs.map(f => f.content_id));
    } catch (e) {
        console.warn("Erro ao carregar favoritos de filmes.");
    }

    filtered.forEach(f => {
      const card = document.createElement('div');
      card.className = 'card';
      const isWatched = typeof Watched !== 'undefined' && Watched.isWatched(f.id);
      const isFav = userFavs.has(f.id);
      
      let imgHtml = f.capa ? `<img src="${f.capa}" class="card-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />` : '';
      let placeholder = `<div class="card-cover-placeholder" style="${f.capa ? 'display:none;' : ''}">🎬</div>`;
      const watchedBadge = isWatched 
        ? `<span style="position:absolute;top:8px;right:8px;background:var(--success);color:#fff;border-radius:50px;padding:3px 10px;font-size:0.72rem;font-weight:700;box-shadow:0 4px 8px rgba(16,185,129,0.3);z-index:4;">✓ Assistido</span>`
        : '';
      
      card.innerHTML = `
        <div style="position:relative;">
          ${imgHtml}${placeholder}${watchedBadge}
          <button class="card-fav-btn ${isFav ? 'active' : ''}" data-id="${f.id}">
             ${isFav ? '⭐' : '☆'}
          </button>
        </div>
        <div class="card-body">
          <div class="card-title">${f.nome}</div>
          <div class="card-meta">
            <span>${f.diretor || ''}</span>
          </div>
          <span class="card-badge" style="background:rgba(239,68,68,0.15);color:#f87171;">${f.ano ? f.ano : ''}${f.genero ? (f.ano ? ' · ' : '') + f.genero : ''}</span>
        </div>
      `;

      const favBtn = card.querySelector('.card-fav-btn');
      favBtn.onclick = async (e) => {
        e.stopPropagation();
        try {
          const res = await DB.toggleFavorite(f.id, 'filme', { title: f.nome, cover: f.capa });
          if (res.action === 'added') {
            favBtn.classList.add('active');
            favBtn.textContent = '⭐';
            showToast(`"${f.nome}" adicionado aos favoritos!`);
          } else {
            favBtn.classList.remove('active');
            favBtn.textContent = '☆';
            showToast(`"${f.nome}" removido dos favoritos.`);
          }
        } catch (err) {
          showToast('Faça login para favoritar!', 'error');
        }
      };

      card.addEventListener('click', () => openDetailModal(f));
      grid.appendChild(card);
    });
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

  function openDetailModal(f) {
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
      detailModal.classList.remove('open');
      openWatchModal(f);
    };

    detailModal.classList.add('open');
  }

  document.getElementById('detailClose').addEventListener('click', () => {
    detailModal.classList.remove('open');
    detailCover.src = '';
  });

  /* MODAL PLAYER */
  const watchModal = document.getElementById('watchModal');
  const watchTitle = document.getElementById('watchTitle');
  const watchFrame = document.getElementById('watchFrame');

  function openWatchModal(f) {
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

  loadPendingHistoryResume();
  initFilters();
  render();
  tryResumeFilmPlayback();
});
