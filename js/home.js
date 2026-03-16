document.addEventListener('DOMContentLoaded', () => {
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

  function render() {
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

    grid.innerHTML = '';
    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    filtered.forEach(c => {
      const card = document.createElement('div');
      card.className = 'card';
      let imgHtml = c.capa ? `<img src="${c.capa}" class="card-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />` : '';
      let placeholder = `<div class="card-cover-placeholder" style="${c.capa ? 'display:none;' : ''}">🎬</div>`;
      card.innerHTML = `
        ${imgHtml}${placeholder}
        <div class="card-body">
          <div class="card-title">${c.nome}</div>
          <div class="card-meta">
            <span>${c.produtora || ''}</span>
          </div>
          <span class="card-badge">${c.temporadas} Temporada(s)</span>
        </div>
      `;
      card.addEventListener('click', () => openDetailModal(c));
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

  function openDetailModal(c) {
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
