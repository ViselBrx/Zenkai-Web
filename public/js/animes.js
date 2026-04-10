document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  const grid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterEstudio = document.getElementById('filterEstudio');
  const filterTemp = document.getElementById('filterTemporadas');

  let animes = DB.getAnimes();

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

    const filtered = animes.filter(a => {
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

    // 1. Checar se o perk de favoritos está ativo (VIA BANCO)
    const isPerkActive = window.DB && typeof window.DB.isPerkEquipped === 'function' 
                         ? window.DB.isPerkEquipped('lista_destaque') 
                         : false;

    // 2. Buscar favoritos
    let userFavs = new Set();
    try {
        const favs = await DB.getFavorites('anime');
        userFavs = new Set(favs.map(f => f.content_id));
    } catch (e) {
        console.warn("Usuário deslogado ou erro ao carregar favoritos.");
    }

    // 3. Ordenação condicional: Apenas se o perk estiver ativo
    if (isPerkActive) {
      filtered.sort((a, b) => {
        const aFav = userFavs.has(a.id) ? 1 : 0;
        const bFav = userFavs.has(b.id) ? 1 : 0;
        return bFav - aFav; // Favoritos primeiro
      });
    }

    filtered.forEach(a => {
      const isFav = userFavs.has(a.id);
      const card = document.createElement('div');
      card.className = 'card';
      
      let imgHtml = a.capa ? `<img src="${a.capa}" class="card-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />` : '';
      let placeholder = `<div class="card-cover-placeholder" style="${a.capa ? 'display:none;' : ''}">⛩️</div>`;
      
      const starClass = isPerkActive ? '' : 'is-hidden';
      const favBtnHtml = `
        <button class="fav-star ${isFav ? 'active' : ''} ${starClass}" data-id="${a.id}" title="${isFav ? 'Desmarcar' : 'Marcar'}">
          ${isFav ? '★' : '☆'}
        </button>
      `;

      card.innerHTML = `
        <div style="position:relative; cursor:pointer;" class="card-click-area">
          ${imgHtml}${placeholder}
          ${isFav && isPerkActive ? '<div class="equipped-ribbon">FAVORITO</div>' : ''}
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
      card.onclick = () => {
        activeAnimeId = a.id;
        loadEpisodes(a.id);
        render();
        openDetailModal(a);
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
      
      btn.classList.toggle('active', isAdded);
      btn.innerHTML = isAdded ? '★' : '☆';
      btn.title = isAdded ? 'Desmarcar' : 'Marcar';
      
      showToast(isAdded 
        ? `"${item.nome}" adicionado aos favoritos!` 
        : `"${item.nome}" removido dos favoritos.`);
      
      // Re-renderizar a grid para aplicar a ordenação (favoritos no topo)
      await render();
      
      // Se houver um botão de favorito no modal aberto, atualiza ele também
      const modalFavBtn = document.getElementById('detailFavBtn');
      if (modalFavBtn) {
        modalFavBtn.classList.toggle('active', isAdded);
        modalFavBtn.textContent = isAdded ? '★' : '☆';
      }
    } catch (err) {
      showToast('Erro ao atualizar favoritos. Faça login!', 'error');
    }
  }

  /* MODAL */
  const detailModal = document.getElementById('detailModal');
  const detailTitle = document.getElementById('detailTitle');
  const detailCover = document.getElementById('detailCover');
  const detailPlaceholder = document.getElementById('detailCoverPlaceholder');
  const detailEstudio = document.getElementById('detailEstudio');
  const detailTemporadas = document.getElementById('detailTemporadas');
  const detailGenero = document.getElementById('detailGenero');
  const detailWatchBtn = document.getElementById('detailWatchBtn');
  const detailFavBtn = document.getElementById('detailFavBtn');

  async function openDetailModal(a) {
    detailTitle.textContent = a.nome;
    detailEstudio.textContent = a.estudio || 'N/A';
    detailTemporadas.textContent = a.temporadas || 1;
    detailGenero.textContent = a.genero || 'Não especificado';
    
    if (a.capa) {
      detailCover.src = a.capa;
      detailCover.style.display = 'block';
      detailPlaceholder.style.display = 'none';
      detailCover.onerror = () => { detailCover.style.display = 'none'; detailPlaceholder.style.display = 'flex'; };
    } else {
      detailCover.style.display = 'none';
      detailPlaceholder.style.display = 'flex';
    }

    // Check favorite status for modal button
    const isPerkActive = window.DB && typeof window.DB.isPerkEquipped === 'function' ? window.DB.isPerkEquipped('lista_destaque') : false;
    const isFav = await DB.isFavorite(a.id, 'anime');
    
    if (isPerkActive) {
      detailFavBtn.style.display = 'flex';
      detailFavBtn.classList.toggle('active', isFav);
      detailFavBtn.innerHTML = isFav ? '★ Desmarcar' : '☆ Marcar';
      detailFavBtn.onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(a, detailFavBtn);
      };
    } else {
      detailFavBtn.style.display = 'none';
    }

    detailWatchBtn.onclick = () => {
      localStorage.setItem('selectedAnime', a.id);
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
  filterEstudio.addEventListener('change', render);
  filterTemp.addEventListener('change', render);

  initFilters();
  render();
});
