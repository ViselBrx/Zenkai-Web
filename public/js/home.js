document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  const grid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterProd = document.getElementById('filterProdutora');
  const filterTemp = document.getElementById('filterTemporadas');

  let cartoons = DB.getCartoons();
  let openCartoonDetailId = null;

  function initFilters() {
    const produtoras = [...new Set(cartoons.map(c => c.produtora).filter(Boolean))].sort();
    produtoras.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p; opt.textContent = p;
      filterProd.appendChild(opt);
    });
  }

  async function render() {
    const term = searchInput.value.toLowerCase();
    const prod = filterProd.value;
    const temp = filterTemp.value;

    const filtered = cartoons.map((c, index) => ({ ...c, _originIndex: index })).filter(c => {
      const matchName = c.nome.toLowerCase().includes(term);
      const matchProd = prod === '' || c.produtora === prod;
      let matchTemp = true;
      if (temp) {
        if (temp === '4') matchTemp = parseInt(c.temporadas) >= 4;
        else matchTemp = c.temporadas.toString() === temp;
      }
      return matchName && matchProd && matchTemp;
    });

    // Buscar favoritos do usuário
    let userFavs = new Set();
    try {
        const favData = await DB.getFavorites('desenho');
        userFavs = new Set(favData.map(f => f.content_id));
    } catch (e) {
        console.warn("Usuário deslogado ou sem favoritos.");
    }

    // Favoritos no topo, demais itens na ordem original
    filtered.sort((a, b) => {
      const aFav = userFavs.has(a.id) ? 1 : 0;
      const bFav = userFavs.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return a._originIndex - b._originIndex;
    });

    grid.innerHTML = '';
    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    filtered.forEach(c => {
      const isFav = userFavs.has(c.id);
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.originIndex = String(c._originIndex);
      card.dataset.contentId = c.id;
      let imgHtml = c.capa ? `<img src="${c.capa}" class="card-cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />` : '';
      let placeholder = `<div class="card-cover-placeholder" style="${c.capa ? 'display:none;' : ''}">🎬</div>`;
      
      const starClass = '';
      const favStarHtml = `
        <button class="fav-star ${isFav ? 'active' : ''} ${starClass}" data-id="${c.id}" title="${isFav ? 'Desmarcar' : 'Marcar'}">
          ${isFav ? '★' : '☆'}
        </button>
      `;

      card.innerHTML = `
        <div style="position:relative; cursor:pointer;" class="card-click-area">
           ${imgHtml}${placeholder}
           ${isFav ? '<div class="fav-ribbon">Favorito</div>' : ''}
        </div>
        ${favStarHtml}
        <div class="card-body card-click-area" style="cursor:pointer;">
          <div class="card-title">${c.nome}</div>
          <div class="card-meta">
            <span>${c.produtora || ''}</span>
          </div>
          <span class="card-badge">${c.temporadas} Temporada(s)</span>
        </div>
      `;

      card.onclick = () => openDetailModal(c);
      
      const star = card.querySelector('.fav-star');
      if (star) {
        star.onclick = async (e) => {
          e.stopPropagation();
          try {
            const res = await DB.toggleFavorite(c.id, 'desenho', { title: c.nome, cover: c.capa });
            const isAdded = res.action === 'added';
            DB.applyFavoriteCardChrome(card, isAdded);
            DB.reorderFavoriteCards(grid);
            if (window.showToast) showToast(isAdded ? `"${c.nome}" adicionado aos favoritos!` : `"${c.nome}" removido dos favoritos.`);
            if (openCartoonDetailId === c.id && detailFavBtn) {
              detailFavBtn.classList.toggle('active', isAdded);
              detailFavBtn.innerHTML = isAdded ? '★ Desmarcar' : '☆ Marcar';
            }
          } catch (err) {
            if (window.showToast) showToast(err.message || 'Erro ao favoritar.', 'error');
          }
        };
      }

      grid.appendChild(card);
    });
  }

  /* MODAL */
  const detailModal = document.getElementById('detailModal');
  const detailTitle = document.getElementById('detailTitle');
  const detailCover = document.getElementById('detailCover');
  const detailPlaceholder = document.getElementById('detailCoverPlaceholder');
  const detailProdutora = document.getElementById('detailProdutora');
  const detailTemporadas = document.getElementById('detailTemporadas');
  const detailWatchBtn = document.getElementById('detailWatchBtn');
  const detailFavBtn = document.getElementById('detailFavBtn');

  async function openDetailModal(c) {
    openCartoonDetailId = c.id;
    detailTitle.textContent = c.nome;
    detailProdutora.textContent = c.produtora || 'N/A';
    detailTemporadas.textContent = c.temporadas || 1;
    
    if (c.capa) {
      detailCover.src = c.capa;
      detailCover.style.display = 'block';
      detailPlaceholder.style.display = 'none';
      detailCover.onerror = () => { detailCover.style.display = 'none'; detailPlaceholder.style.display = 'flex'; };
    } else {
      detailCover.style.display = 'none';
      detailPlaceholder.style.display = 'flex';
    }

    // Favoritos no Modal
    const isFav = await DB.isFavorite(c.id, 'desenho');

    if (detailFavBtn) {
      detailFavBtn.style.display = 'flex';
      detailFavBtn.classList.toggle('active', isFav);
      detailFavBtn.innerHTML = isFav ? '★ Desmarcar' : '☆ Marcar';
      detailFavBtn.onclick = async (e) => {
        e.stopPropagation();
        try {
          const res = await DB.toggleFavorite(c.id, 'desenho', { title: c.nome, cover: c.capa });
          const isAdded = res.action === 'added';
          detailFavBtn.classList.toggle('active', isAdded);
          detailFavBtn.innerHTML = isAdded ? '★ Desmarcar' : '☆ Marcar';
          if (window.showToast) showToast(isAdded ? `"${c.nome}" adicionado aos favoritos!` : `"${c.nome}" removido dos favoritos.`);
          const gridCard = DB.findFavoriteCardByContentId(grid, c.id);
          if (gridCard) DB.applyFavoriteCardChrome(gridCard, isAdded);
          DB.reorderFavoriteCards(grid);
        } catch (err) {
          if (window.showToast) showToast(err.message || 'Erro ao favoritar.', 'error');
        }
      };
    }

    detailWatchBtn.onclick = () => {
      localStorage.setItem('selectedCartoon', c.id);
    };

    detailModal.classList.add('open');
  }

  document.getElementById('detailClose').addEventListener('click', () => {
    openCartoonDetailId = null;
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
  filterProd.addEventListener('change', render);
  filterTemp.addEventListener('change', render);

  initFilters();
  render();

  window.addEventListener('profileUpdated', () => { render(); });
  window.addEventListener('storage', (e) => {
    if (e.key === 'animehouse_store' || (e.key && e.key.startsWith('equipped_'))) render();
  });
});
