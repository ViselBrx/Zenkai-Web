document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  const tbody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterGenero = document.getElementById('filterGenero');

  const formModal = document.getElementById('formModal');
  const filmeForm = document.getElementById('filmeForm');
  const formTitle = document.getElementById('formTitle');
  const capaUrlInput = document.getElementById('capaUrl');
  const capaFile = document.getElementById('capaFile');
  const capaPreview = document.getElementById('capaPreview');
  const capaImg = document.getElementById('capaImg');

  const deleteModal = document.getElementById('deleteModal');
  let currentFilter = { term: '', gen: '' };
  let editingId = null;
  let deletingId = null;
  let storedBase64 = null;

  function initFilters() {
    const list = DB.getFilmes();
    const generos = [...new Set(list.map(f => f.genero).filter(Boolean))].sort();
    filterGenero.innerHTML = '<option value="">Todos os gêneros</option>';
    generos.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g; opt.textContent = g;
      filterGenero.appendChild(opt);
    });
  }

  function renderTable() {
    const list = DB.getFilmes();
    const filtered = list.filter(f => {
      if (window.pendingDeletions && window.pendingDeletions.has(f.id)) return false;
      const matchName = f.nome.toLowerCase().includes(currentFilter.term);
      const matchGen = currentFilter.gen === '' || f.genero === currentFilter.gen;
      return matchName && matchGen;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      filtered.forEach(f => {
        const tr = document.createElement('tr');
        const img = f.capa ? `<img src="${f.capa}" class="td-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
        const placeholder = `<div class="td-cover" style="display:${f.capa ? 'none' : 'flex'};align-items:center;justify-content:center;font-size:1.5rem">🎬</div>`;

        tr.innerHTML = `
          <td>${img}${placeholder}</td>
          <td><strong>${f.nome}</strong></td>
          <td>${f.diretor || '--'}</td>
          <td>${f.genero || '--'}</td>
          <td>${f.ano || '--'}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="editFilme('${f.id}')" style="margin-right:6px">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="askDelete('${f.id}', '${f.nome.replace(/'/g, "\\'")}')">🗑️</button>
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

  capaUrlInput.addEventListener('input', () => updatePreview(capaUrlInput.value));
  capaFile.addEventListener('change', async e => {
    if (e.target.files[0]) {
      storedBase64 = await fileToBase64(e.target.files[0]);
      updatePreview(storedBase64);
      capaUrlInput.value = "";
    } else {
      storedBase64 = null;
      updatePreview(capaUrlInput.value);
    }
  });

  document.getElementById('addBtn').addEventListener('click', () => {
    editingId = null;
    formTitle.textContent = 'Novo Filme';
    filmeForm.reset();
    document.getElementById('filmeId').value = '';
    storedBase64 = null; updatePreview('');
    formModal.classList.add('open');
  });

  const closeForm = () => formModal.classList.remove('open');
  document.getElementById('modalClose').addEventListener('click', closeForm);
  document.getElementById('cancelBtn').addEventListener('click', closeForm);

  window.editFilme = (id) => {
    const f = DB.getFilmeById(id);
    if (!f) return;
    editingId = id;
    formTitle.textContent = 'Editar Filme';
    document.getElementById('filmeId').value = f.id;
    document.getElementById('nome').value = f.nome;
    document.getElementById('diretor').value = f.diretor || '';
    document.getElementById('genero').value = f.genero || '';
    document.getElementById('ano').value = f.ano || '';
    document.getElementById('iframe').value = f.iframe || '';
    capaUrlInput.value = f.capa?.startsWith('http') ? f.capa : '';
    storedBase64 = null;
    capaFile.value = "";
    updatePreview(f.capa);
    formModal.classList.add('open');
  };

  window.askDelete = (id, n) => {
    deletingId = id;
    document.getElementById('deleteFilmeName').textContent = n;
    deleteModal.classList.add('open');
  };

  const closeDelete = () => deleteModal.classList.remove('open');
  document.getElementById('deleteClose').addEventListener('click', closeDelete);
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDelete);

  document.getElementById('deleteConfirmBtn').addEventListener('click', () => {
    if (deletingId) {
      const name = document.getElementById('deleteFilmeName').textContent;
      closeDelete();

      const idToHide = deletingId;
      showUndoToast(`Excluindo "${name}"...`,
        () => {
          DB.deleteFilme(idToHide);
          initFilters();
          renderTable();
        },
        () => {
          // Não faz nada
        }
      );
    }
  });

  filmeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSalvar = document.getElementById('saveBtn');
    
    // Se já estiver salvando, não faz nada
    if (btnSalvar.disabled) return;

    const nome = document.getElementById('nome').value.trim();
    const iframeVal = document.getElementById('iframe').value.trim();

    if (!nome) {
        showToast('Nome é obrigatório', 'error');
        return;
    }
    if (!iframeVal) {
        showToast('O link/iframe é obrigatório', 'error');
        return;
    }

    btnSalvar.disabled = true;
    const originalText = btnSalvar.innerHTML;
    btnSalvar.innerHTML = '⏳ Salvando...';

    const data = {
      nome,
      diretor: document.getElementById('diretor').value.trim(),
      genero: document.getElementById('genero').value.trim(),
      ano: parseInt(document.getElementById('ano').value) || null,
      iframe: iframeVal,
    };

    if (storedBase64) data.capaBase64 = storedBase64;
    else if (capaUrlInput.value.trim()) data.capa = capaUrlInput.value.trim();
    else data.capa = "";

    try {
      if (editingId) {
        await DB.updateFilme(editingId, data);
        initFilters(); renderTable(); closeForm();
        showDarkToast('Filme atualizado!');
      } else {
        const newItem = await DB.addFilme(data);
        initFilters(); renderTable(); closeForm();
        showUndoToast('Filme cadastrado com sucesso!',
          () => { /* Timer expirou, item permanece */ },
          async () => {
            await DB.deleteFilme(newItem.id);
            initFilters();
            renderTable();
          }
        );
      }
    } catch(err) {
      showToast('Erro ao salvar: ' + err.message, 'error');
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.innerHTML = originalText;
    }
  });

  searchInput.addEventListener('input', e => { currentFilter.term = e.target.value.toLowerCase(); renderTable(); });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); searchInput.blur(); }
  });
  filterGenero.addEventListener('change', e => { currentFilter.gen = e.target.value; renderTable(); });

  initFilters(); renderTable();
});
