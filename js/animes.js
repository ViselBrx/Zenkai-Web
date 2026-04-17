document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  const grid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterEstudio = document.getElementById('filterEstudio');
  const filterTemp = document.getElementById('filterTemporadas');

  let animes = DB.getAnimes();
  let activeAnimeId = null;

  function initFilters() {
    const estudios = [...new Set(animes.map(a => a.estudio).filter(Boolean))].sort();
    filterEstudio.innerHTML = '<option value="">Todos os estúdios</option>';
    estudios.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e; opt.textContent = e;
      filterEstudio.appendChild(opt);
    });
  }

  async function render() {
    const term = searchInput.value.toLowerCase();
    const est = filterEstudio.value;
    const temp = filterTemp.value;

    const filtered = animes.map((a, index) => ({ ...a, _originIndex: index })).filter(a => {
      const matchName = a.nome.toLowerCase().includes(term);
      const matchEst = est === '' || a.estudio === est;
      let matchTemp = true;
      if (temp) {
        if (temp === '4') matchTemp = parseInt(a.temporadas) >= 4;
        else matchTemp = a.temporadas.toString() === temp;
      }
      return matchName && matchEst && matchTemp;
    });

    grid.innerHTML = '';
    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    // Buscar favoritos
    let userFavs = new Set();
    try {
        const favs = await DB.getFavorites('anime');
        userFavs = new Set(favs.map(f => f.content_id));
    } catch (e) {
        console.warn("Usuário deslogado ou erro ao carregar favoritos.");
    }

    // Favoritos no topo, demais itens na ordem original
    filtered.sort((a, b) => {
      const aFav = userFavs.has(a.id) ? 1 : 0;
      const bFav = userFavs.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return a._originIndex - b._originIndex;
    });

    filtered.forEach(a => {
      const isFav = userFavs.has(a.id);
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.originIndex = String(a._originIndex);
      card.dataset.contentId = a.id;
      
      let imgHtml = a.capa ? `<img src="${a.capa}" class="card-cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />` : '';
      let placeholder = `<div class="card-cover-placeholder" style="${a.capa ? 'display:none;' : ''}">⛩️</div>`;
      
      const starClass = '';
      const favBtnHtml = `
        <button class="fav-star ${isFav ? 'active' : ''} ${starClass}" data-id="${a.id}" title="${isFav ? 'Desmarcar' : 'Marcar'}">
          ${isFav ? '★' : '☆'}
        </button>
      `;

      card.innerHTML = `
        <div style="position:relative; cursor:pointer;" class="card-click-area">
          ${imgHtml}${placeholder}
          ${isFav ? '<div class="fav-ribbon">Favorito</div>' : ''}
        </div>
        ${favBtnHtml}
        <div class="card-body card-click-area" style="cursor:pointer;">
          <div class="card-title">${a.nome}</div>
          <div class="card-meta">
            <span>${a.estudio || ''}</span>
          </div>
          <span class="card-badge" style="background:rgba(124,58,237,0.15);color:#a78bfa;">${a.temporadas} Temporada(s)</span>
        </div>
      `;
      
      // Clique no card (abre detalhes)
      card.onclick = (e) => {
        // Se clicar em qualquer área que não seja o botão de favoritar
        if (!e.target.closest('.fav-star')) {
          activeAnimeId = a.id;
          openDetailModal(a);
        }
      };

      // Clique na estrela (Favoritar)
      const favBtn = card.querySelector('.fav-star');
      if (favBtn) {
        favBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
             await toggleFavorite(a, favBtn);
          } catch(err) {
             console.error(err);
          }
        };
      }
      
      grid.appendChild(card);
    });
  }

  async function toggleFavorite(item, btn) {
    try {
      const res = await DB.toggleFavorite(item.id, 'anime', { title: item.nome, cover: item.capa });
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

      const modalFavBtn = document.getElementById('detailFavBtn');
      if (modalFavBtn && activeAnimeId === item.id) {
        // detailFavBtn removido do HTML, esta parte pode ser limpa ou mantida como safe-check
      }
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar favoritos.', 'error');
    }
  }

  /* MODAL */
  const detailModal = document.getElementById('detailModal');
  const detailTitle = document.getElementById('detailTitle');
  const detailCover = document.getElementById('detailCover');
  const detailPlaceholder = document.getElementById('detailCoverPlaceholder');
  const detailEstudio = document.getElementById('detailEstudio');
  const detailTemporadas = document.getElementById('detailTemporadas');
  const detailWatchBtn = document.getElementById('detailWatchBtn');
  async function openDetailModal(a) {
    detailTitle.textContent = a.nome;
    detailEstudio.textContent = a.estudio || 'N/A';
    detailTemporadas.textContent = a.temporadas || 1;
    
    if (a.capa) {
      detailCover.src = a.capa;
      detailCover.style.display = 'block';
      detailPlaceholder.style.display = 'none';
      detailCover.onerror = () => { detailCover.style.display = 'none'; detailPlaceholder.style.display = 'flex'; };
    } else {
      detailCover.style.display = 'none';
      detailPlaceholder.style.display = 'flex';
    }

<<<<<<< HEAD:public/js/animes.js
    // Favoritos no Modal removido conforme solicitado

=======
>>>>>>> 860ffb0778f2aa16dce83349cf780ec736fecdd1:js/animes.js
    detailWatchBtn.onclick = () => {
      localStorage.setItem('selectedAnime', a.id);
    };

    detailModal.classList.add('open');
  }

  document.getElementById('detailClose').addEventListener('click', () => {
    detailModal.classList.remove('open');
    detailCover.src = '';
  });

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(render, 300);
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchInput.blur();
    }
  });
  filterEstudio.addEventListener('change', render);
  filterTemp.addEventListener('change', render);

  initFilters();
  render();

  window.addEventListener('profileUpdated', () => { render(); });
  window.addEventListener('storage', (e) => {
    if (e.key === 'animehouse_store' || (e.key && e.key.startsWith('equipped_'))) render();
  });
});
