document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  const grid = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterGenero = document.getElementById('filterGenero');
  const filterAno = document.getElementById('filterAno');

  let filmes = DB.getFilmes();

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

  function render() {
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

    filtered.forEach(f => {
      const card = document.createElement('div');
      card.className = 'card';
      let imgHtml = f.capa ? `<img src="${f.capa}" class="card-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />` : '';
      let placeholder = `<div class="card-cover-placeholder" style="${f.capa ? 'display:none;' : ''}">🎬</div>`;
      card.innerHTML = `
        ${imgHtml}${placeholder}
        <div class="card-body">
          <div class="card-title">${f.nome}</div>
          <div class="card-meta">
            <span>${f.diretor || ''}</span>
          </div>
          <span class="card-badge" style="background:rgba(239,68,68,0.15);color:#f87171;">${f.ano ? f.ano : ''}${f.genero ? (f.ano ? ' · ' : '') + f.genero : ''}</span>
        </div>
      `;
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

  initFilters();
  render();
});
