document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  const grid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterProd = document.getElementById('filterProdutora');
  const filterTemp = document.getElementById('filterTemporadas');

  let cartoons = DB.getCartoons();

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

    const filtered = cartoons.filter(c => {
      const matchName = c.nome.toLowerCase().includes(term);
      const matchProd = prod === '' || c.produtora === prod;
      let matchTemp = true;
      if (temp) {
        if (temp === '4') matchTemp = parseInt(c.temporadas) >= 4;
        else matchTemp = c.temporadas.toString() === temp;
      }
      return matchName && matchProd && matchTemp;
    });

    // 1. Checar se o perk de favoritos está ativo
    const isPerkActive = window.DB && typeof window.DB.isPerkEquipped === 'function' 
                         ? window.DB.isPerkEquipped('lista_destaque') 
                         : false;

    // 2. Buscar favoritos do usuário
    let userFavs = new Set();
    try {
        const favData = await DB.getFavorites('desenho');
        userFavs = new Set(favData.map(f => f.content_id));
    } catch (e) {
        console.warn("Usuário deslogado ou sem favoritos.");
    }

    // 3. Ordenação condicional
    if (isPerkActive) {
      filtered.sort((a, b) => {
        const aFav = userFavs.has(a.id) ? 1 : 0;
        const bFav = userFavs.has(b.id) ? 1 : 0;
        return bFav - aFav; 
      });
    }

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
      let imgHtml = c.capa ? `<img src="${c.capa}" class="card-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />` : '';
      let placeholder = `<div class="card-cover-placeholder" style="${c.capa ? 'display:none;' : ''}">🎬</div>`;
      
      const starClass = isPerkActive ? '' : 'is-hidden';
      const favStarHtml = `
        <button class="fav-star ${isFav ? 'active' : ''} ${starClass}" data-id="${c.id}" title="${isFav ? 'Desmarcar' : 'Marcar'}">
          ${isFav ? '★' : '☆'}
        </button>
      `;

      card.innerHTML = `
        <div style="position:relative; cursor:pointer;" class="card-click-area">
           ${imgHtml}${placeholder}
           ${isFav && isPerkActive ? '<div class="equipped-ribbon">FAVORITO</div>' : ''}
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
            star.classList.toggle('active', isAdded);
            star.innerHTML = isAdded ? '★' : '☆';
            star.title = isAdded ? 'Desmarcar' : 'Marcar';
            if (window.showToast) showToast(isAdded ? `"${c.nome}" adicionado aos favoritos!` : `"${c.nome}" removido dos favoritos.`);
            render(); // Re-render para aplicar ordenação
          } catch (err) {
            if (window.showToast) showToast('Faça login para favoritar!', 'error');
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
    const isPerkActive = window.DB && typeof window.DB.isPerkEquipped === 'function' ? window.DB.isPerkEquipped('lista_destaque') : false;
    const isFav = await DB.isFavorite(c.id, 'desenho');

    if (detailFavBtn) {
      if (isPerkActive) {
        detailFavBtn.style.display = 'flex';
        detailFavBtn.classList.toggle('active', isFav);
        detailFavBtn.innerHTML = isFav ? '★ Desmarcar' : '☆ Marcar';
        detailFavBtn.onclick = async (e) => {
          e.stopPropagation();
          const res = await DB.toggleFavorite(c.id, 'desenho', { title: c.nome, cover: c.capa });
          const isAdded = res.action === 'added';
          detailFavBtn.classList.toggle('active', isAdded);
          detailFavBtn.innerHTML = isAdded ? '★ Desmarcar' : '☆ Marcar';
          if (window.showToast) showToast(isAdded ? `"${c.nome}" adicionado aos favoritos!` : `"${c.nome}" removido dos favoritos.`);
          render();
        };
      } else {
        detailFavBtn.style.display = 'none';
      }
    }

    detailWatchBtn.onclick = () => {
      localStorage.setItem('selectedCartoon', c.id);
    };

    detailModal.classList.add('open');
  }

  document.getElementById('detailClose').addEventListener('click', () => {
    detailModal.classList.remove('open');
    detailCover.src = '';
  });

  searchInput.addEventListener('input', render);
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
});
