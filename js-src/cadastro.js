document.addEventListener('DOMContentLoaded', async () => {
  await DB.init(['cartoons']);
  const tbody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const filterProd = document.getElementById('filterProdutora');

  const formModal = document.getElementById('formModal');
  const cartoonForm = document.getElementById('cartoonForm');
  const formTitle = document.getElementById('formTitle');
  const capaUrl = document.getElementById('capa');
  const capaFile = document.getElementById('capaFile');
  const capaPreview = document.getElementById('capaPreview');
  const capaImg = document.getElementById('capaImg');

  const deleteModal = document.getElementById('deleteModal');
  let currentFilter = { term: '', prod: '' };
  let editingId = null;
  let deletingId = null;
  let storedBase64 = null;

  function initFilters() {
    const list = DB.getCartoons();
    const produtoras = [...new Set(list.map(c => c.produtora).filter(Boolean))].sort();
    filterProd.innerHTML = '<option value="">Todas as produtoras</option>';
    produtoras.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p; opt.textContent = p;
      filterProd.appendChild(opt);
    });
  }

  function renderTable() {
    const list = DB.getCartoons();
    const filtered = list.filter(c => {
      if (window.pendingDeletions && window.pendingDeletions.has(c.id)) return false;
      const matchName = c.nome.toLowerCase().includes(currentFilter.term);
      const matchProd = currentFilter.prod === '' || c.produtora === currentFilter.prod;
      return matchName && matchProd;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      filtered.forEach(c => {
        const tr = document.createElement('tr');
        const img = c.capa ? `<img src="${c.capa}" class="td-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
        const placeholder = `<div class="td-cover" style="display:${c.capa?'none':'flex'};align-items:center;justify-content:center;font-size:1.5rem">🎬</div>`;
        
        tr.innerHTML = `
          <td>${img}${placeholder}</td>
          <td><strong>${c.nome}</strong></td>
          <td>${c.produtora || '--'}</td>
          <td>${c.temporadas || 1}</td>
          <td>
            <button class="btn btn-ghost btn-sm" onclick="editCartoon('${c.id}')" style="margin-right:6px">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="askDelete('${c.id}', '${c.nome.replace(/'/g, "\\'")}')">🗑️</button>
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
      capaUrl.value = ""; // clear URL
    } else {
      storedBase64 = null;
      updatePreview(capaUrl.value);
    }
  });

  document.getElementById('addBtn').addEventListener('click', () => {
    editingId = null;
    formTitle.textContent = 'Novo Desenho';
    cartoonForm.reset();
    document.getElementById('cartoonId').value = '';
    storedBase64 = null; updatePreview('');
    formModal.classList.add('open');
  });

  const closeForm = () => formModal.classList.remove('open');
  document.getElementById('modalClose').addEventListener('click', closeForm);
  document.getElementById('cancelBtn').addEventListener('click', closeForm);

  window.editCartoon = (id) => {
    const c = DB.getCartoonById(id);
    if (!c) return;
    editingId = id;
    formTitle.textContent = 'Editar Desenho';
    document.getElementById('cartoonId').value = c.id;
    document.getElementById('nome').value = c.nome;
    document.getElementById('produtora').value = c.produtora || '';
    document.getElementById('temporadas').value = c.temporadas || 1;
    capaUrl.value = c.capa?.startsWith('/uploads') || c.capa?.startsWith('http') ? c.capa : '';
    storedBase64 = null;
    capaFile.value = "";
    updatePreview(c.capa);
    formModal.classList.add('open');
  };

  window.askDelete = (id, n) => {
    deletingId = id;
    document.getElementById('deleteCartoonName').textContent = n;
    deleteModal.classList.add('open');
  };

  const closeDelete = () => deleteModal.classList.remove('open');
  document.getElementById('deleteClose').addEventListener('click', closeDelete);
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDelete);

  document.getElementById('deleteConfirmBtn').addEventListener('click', () => {
    if (deletingId) {
      const cartoonName = document.getElementById('deleteCartoonName').textContent;
      closeDelete();
      
      const idToHide = deletingId;
      
      showUndoToast(`Excluindo "${cartoonName}"...`, 
        // onComplete: Excluir de verdade
        async () => {
          await DB.deleteCartoon(idToHide);
          window.clearPendingDeletion?.(idToHide);
          initFilters();
          renderTable();
        },
        // onUndo: Restaurar
        () => {
          window.clearPendingDeletion?.(idToHide);
          initFilters();
          renderTable();
        },
        () => {
          window.markPendingDeletion?.(idToHide);
          renderTable();
        }
      );
    }
  });

  cartoonForm.addEventListener('submit', async (e) => {
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
    const originalText = btnSalvar.textContent;
    btnSalvar.textContent = '⏳ Salvando...';

    const data = {
      nome,
      produtora: document.getElementById('produtora').value.trim(),
      temporadas: parseInt(document.getElementById('temporadas').value) || 1
    };

    if (storedBase64) data.capaBase64 = storedBase64;
    else if (capaUrl.value.trim()) data.capa = capaUrl.value.trim();
    else data.capa = "";

    try {
      if (editingId) {
        await DB.updateCartoon(editingId, data);
        initFilters(); renderTable(); closeForm();
        showDarkToast('Desenho atualizado!');
      } else {
        const newItem = await DB.addCartoon(data);
        initFilters(); renderTable(); closeForm();
        showUndoToast('Desenho cadastrado com sucesso!',
          () => { /* Timer expirou, item permanece */ },
          async () => {
            await DB.deleteCartoon(newItem.id);
            initFilters();
            renderTable();
          }
        );
      }
    } catch(err) {
      showToast('Erro ao salvar!', 'error');
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = originalText;
    }
  });

  searchInput.addEventListener('input', e => { currentFilter.term = e.target.value.toLowerCase(); renderTable(); });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchInput.blur();
    }
  });
  filterProd.addEventListener('change', e => { currentFilter.prod = e.target.value; renderTable(); });

  initFilters(); renderTable();
});
