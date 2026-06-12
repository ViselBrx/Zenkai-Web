document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  const grid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterFavoritos = document.getElementById('filterFavoritos');

  let playlists = DB.getYoutubePlaylists();
  let activePlaylistId = null;

  async function render() {
    const term = searchInput.value.toLowerCase();

    const filtered = playlists.map((a, index) => ({ ...a, _originIndex: index })).filter(a => {
      const matchName = a.nome.toLowerCase().includes(term);
      return matchName;
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
        const favs = await DB.getFavorites('youtube');
        userFavs = new Set(favs.map(f => f.content_id));
    } catch (e) {
        console.warn("Usuário deslogado ou erro ao carregar favoritos.");
    }

    // Favoritos no topo, demais itens na ordem original
    const favFilter = filterFavoritos ? filterFavoritos.value : '';
    const finalFiltered = (typeof favFilter !== 'undefined' && favFilter === 'favoritos') ? filtered.filter(a => userFavs.has(a.id)) : filtered;
    finalFiltered.sort((a, b) => {
      const aFav = userFavs.has(a.id) ? 1 : 0;
      const bFav = userFavs.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return a._originIndex - b._originIndex;
    });

    finalFiltered.forEach(a => {
      const isFav = userFavs.has(a.id);
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.originIndex = String(a._originIndex);
      card.dataset.contentId = a.id;
      
      let imgHtml = a.capa ? `<img src="${a.capa}" class="card-cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />` : '';
      let placeholder = `<div class="card-cover-placeholder" style="${a.capa ? 'display:none;' : ''}">▶️</div>`;
      
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
            <span>Playlist</span>
          </div>
        </div>
      `;
      
      card.onclick = (e) => {
        if (!e.target.closest('.fav-star')) {
          activePlaylistId = a.id;
          openDetailModal(a);
        }
      };

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
      const res = await DB.toggleFavorite(item.id, 'youtube', { title: item.nome, cover: item.capa });
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

  const detailModal = document.getElementById('detailModal');
  const detailTitle = document.getElementById('detailTitle');
  const detailCover = document.getElementById('detailCover');
  const detailPlaceholder = document.getElementById('detailCoverPlaceholder');
  const detailWatchBtn = document.getElementById('detailWatchBtn');
  
  async function openDetailModal(a) {
    detailTitle.textContent = a.nome;
    
    if (a.capa) {
      detailCover.src = a.capa;
      detailCover.style.display = 'block';
      detailPlaceholder.style.display = 'none';
      detailCover.onerror = () => { detailCover.style.display = 'none'; detailPlaceholder.style.display = 'flex'; };
    } else {
      detailCover.style.display = 'none';
      detailPlaceholder.style.display = 'flex';
    }

    detailWatchBtn.onclick = () => {
      localStorage.setItem('selectedYoutubePlaylist', a.id);
    };

    detailModal.classList.add('open');
  }

  document.getElementById('detailClose').addEventListener('click', () => {
    detailModal.classList.remove('open');
    detailCover.src = '';
  });

  let debounceTimer;
  if (filterFavoritos) filterFavoritos.addEventListener('change', render);
  searchInput.addEventListener('input', () => {
    render();
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchInput.blur();
    }
  });

  render();

  window.addEventListener('click', (e) => {
    if (e.target === detailModal) {
      detailModal.classList.remove('open');
      detailCover.src = '';
    }
  });

});
