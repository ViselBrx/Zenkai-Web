document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  const tbody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterEstudio = document.getElementById('filterEstudio');

  const formModal = document.getElementById('formModal');
  const animeForm = document.getElementById('animeForm');
  const formTitle = document.getElementById('formTitle');
  const capaUrl = document.getElementById('capa');
  const capaFile = document.getElementById('capaFile');
  const capaPreview = document.getElementById('capaPreview');
  const capaImg = document.getElementById('capaImg');

  const deleteModal = document.getElementById('deleteModal');
  let currentFilter = { term: '', est: '' };
  let editingId = null;
  let deletingId = null;
  let storedBase64 = null;

  function initFilters() {
    const list = DB.getAnimes();
    const estudios = [...new Set(list.map(a => a.estudio).filter(Boolean))].sort();
    filterEstudio.innerHTML = '<option value="">Todos os estúdios</option>';
    estudios.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e; opt.textContent = e;
      filterEstudio.appendChild(opt);
    });
  }

  function renderTable() {
    const list = DB.getAnimes();
    const filtered = list.filter(a => {
      if (window.pendingDeletions && window.pendingDeletions.has(a.id)) return false;
      const matchName = a.nome.toLowerCase().includes(currentFilter.term);
      const matchEst = currentFilter.est === '' || a.estudio === currentFilter.est;
      return matchName && matchEst;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      filtered.forEach(a => {
        const tr = document.createElement('tr');
        const img = a.capa ? `<img src="${a.capa}" class="td-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
        const placeholder = `<div class="td-cover" style="display:${a.capa?'none':'flex'};align-items:center;justify-content:center;font-size:1.5rem">🌸</div>`;
        
        tr.innerHTML = `
          <td>${img}${placeholder}</td>
          <td><strong>${a.nome}</strong></td>
          <td>${a.estudio || '--'}</td>
          <td>${a.genero || '--'}</td>
          <td>${a.temporadas || 1}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="editAnime('${a.id}')" style="margin-right:6px">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="askDelete('${a.id}', '${a.nome.replace(/'/g, "\\'")}')">🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  function updatePreview(val) {
    if (val) {
      capaImg.src = val;
      capaPreview.style.display = 'block';
      capaImg.onerror = () => capaPreview.style.display = 'none';
    } else {
      capaPreview.style.display = 'none';
    }
  }

  capaUrl.addEventListener('input', () => updatePreview(capaUrl.value));
  capaFile.addEventListener('change', async e => {
    if (e.target.files[0]) {
      storedBase64 = await fileToBase64(e.target.files[0]);
      updatePreview(storedBase64);
      capaUrl.value = "";
    } else {
      storedBase64 = null;
      updatePreview(capaUrl.value);
    }
  });

  document.getElementById('addBtn').addEventListener('click', () => {
    editingId = null;
    formTitle.textContent = 'Novo Anime';
    animeForm.reset();
    document.getElementById('animeId').value = '';
    storedBase64 = null; updatePreview('');
    formModal.classList.add('open');
  });

  const closeForm = () => formModal.classList.remove('open');
  document.getElementById('modalClose').addEventListener('click', closeForm);
  document.getElementById('cancelBtn').addEventListener('click', closeForm);

  window.editAnime = (id) => {
    const a = DB.getAnimeById(id);
    if (!a) return;
    editingId = id;
    formTitle.textContent = 'Editar Anime';
    document.getElementById('animeId').value = a.id;
    document.getElementById('nome').value = a.nome;
    document.getElementById('estudio').value = a.estudio || '';
    document.getElementById('genero').value = a.genero || '';
    document.getElementById('temporadas').value = a.temporadas || 1;
    capaUrl.value = a.capa?.startsWith('/uploads') || a.capa?.startsWith('http') ? a.capa : '';
    storedBase64 = null;
    capaFile.value = "";
    updatePreview(a.capa);
    formModal.classList.add('open');
  };

  window.askDelete = (id, n) => {
    deletingId = id;
    document.getElementById('deleteAnimeName').textContent = n;
    deleteModal.classList.add('open');
  };

  const closeDelete = () => deleteModal.classList.remove('open');
  document.getElementById('deleteClose').addEventListener('click', closeDelete);
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDelete);

  document.getElementById('deleteConfirmBtn').addEventListener('click', () => {
    if (deletingId) {
      const animeName = document.getElementById('deleteAnimeName').textContent;
      closeDelete();
      
      const idToHide = deletingId;
      if (!window.pendingDeletions) window.pendingDeletions = new Set();
      window.pendingDeletions.add(idToHide);
      renderTable();

      showUndoToast(`Excluindo "${animeName}"...`, 
        () => {
          if (window.pendingDeletions.has(idToHide)) {
            DB.deleteAnime(idToHide);
            window.pendingDeletions.delete(idToHide);
            initFilters();
            renderTable();
            // Auto-refresh após 7 segundos
            setTimeout(() => window.location.reload(), 7000);
          }
        },
        () => {
          window.pendingDeletions.delete(idToHide);
          renderTable();
        }
      );
    }
  });

  animeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSalvar = document.getElementById('saveBtn');
    
    // Se já estiver salvando, não faz nada
    if (btnSalvar.disabled) return;

    const nome = document.getElementById('nome').value.trim();
    if (!nome) {
        showToast('Nome é obrigatório', 'error');
        return;
    }

    btnSalvar.disabled = true;
    const originalText = btnSalvar.innerHTML;
    btnSalvar.innerHTML = '⏳ Salvando...';

    const data = {
      nome,
      estudio: document.getElementById('estudio').value.trim(),
      genero: document.getElementById('genero').value.trim(),
      temporadas: parseInt(document.getElementById('temporadas').value) || 1
    };

    if (storedBase64) data.capaBase64 = storedBase64;
    else if (capaUrl.value.trim()) data.capa = capaUrl.value.trim();
    else data.capa = "";

    try {
      if (editingId) {
        await DB.updateAnime(editingId, data);
        initFilters(); renderTable(); closeForm();
        showDarkToast('Anime atualizado!');
      } else {
        const newItem = await DB.addAnime(data);
        initFilters(); renderTable(); closeForm();
        showUndoToast('Anime cadastrado com sucesso!',
          () => { /* Timer expirou, item permanece */ },
          async () => {
            await DB.deleteAnime(newItem.id);
            initFilters();
            renderTable();
          }
        );
      }
    } catch(err) {
      showToast('Erro ao salvar!', 'error');
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.innerHTML = originalText;
    }
  });

  searchInput.addEventListener('input', e => { currentFilter.term = e.target.value.toLowerCase(); renderTable(); });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchInput.blur();
    }
  });
  filterEstudio.addEventListener('change', e => { currentFilter.est = e.target.value; renderTable(); });

  initFilters(); renderTable();
});
