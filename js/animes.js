document.addEventListener('DOMContentLoaded', () => {
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

  function render() {
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

    filtered.forEach(a => {
      const card = document.createElement('div');
      card.className = 'card';
      let imgHtml = a.capa ? `<img src="${a.capa}" class="card-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />` : '';
      let placeholder = `<div class="card-cover-placeholder" style="${a.capa ? 'display:none;' : ''}">🌸</div>`;
      card.innerHTML = `
        ${imgHtml}${placeholder}
        <div class="card-body">
          <div class="card-title">${a.nome}</div>
          <div class="card-meta">
            <span>${a.estudio || ''}</span>
          </div>
          <span class="card-badge" style="background:rgba(124,58,237,0.15);color:#a78bfa;">${a.temporadas} Temporada(s)</span>
        </div>
      `;
      card.addEventListener('click', () => openDetailModal(a));
      grid.appendChild(card);
    });
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

  function openDetailModal(a) {
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
