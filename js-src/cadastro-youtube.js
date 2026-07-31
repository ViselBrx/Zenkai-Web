document.addEventListener('DOMContentLoaded', async () => {
    await DB.init(['youtubePlaylists', 'youtubeVideos']);

    // ── Refs DOM ──────────────────────────────────────────────────────────────
    const tbody            = document.getElementById('tableBody');
    const emptyState       = document.getElementById('emptyState');
    const searchInput      = document.getElementById('searchInput');
    const formModal        = document.getElementById('formModal');
    const cadastroForm     = document.getElementById('cadastroForm');
    const formActionTitle  = document.getElementById('formActionTitle');
    const addBtn           = document.getElementById('addBtn');
    const cancelBtn        = document.getElementById('cancelBtn');
    const modalClose       = document.getElementById('modalClose');
    const deleteModal      = document.getElementById('deleteModal');
    const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
    const deleteCancelBtn  = document.getElementById('deleteCancelBtn');
    const deleteClose      = document.getElementById('deleteClose');

    // Inputs do formulário
    const iEditId    = document.getElementById('editId');
    const iNome      = document.getElementById('nome');
    const iCapaFile  = document.getElementById('capaFile');
    const iCapaUrl   = document.getElementById('capaUrl');
    const coverPreview = document.getElementById('coverPreview');

    // ── Estado ────────────────────────────────────────────────────────────────
    let currentFilter   = { term: '' };
    let base64CapaCache = null;
    let deletingId      = null;

    // ── Funções ───────────────────────────────────────────────────────────────
    function getCoverValue() {
      if (base64CapaCache) return base64CapaCache;
      return iCapaUrl.value.trim() || '';
    }

    function updatePreview() {
      const src = getCoverValue();
      if (src) {
        coverPreview.src = src;
        coverPreview.style.display = 'inline-block';
      } else {
        coverPreview.src = '';
        coverPreview.style.display = 'none';
      }
    }

    function resetForm() {
      iEditId.value = '';
      iNome.value = '';
      iCapaUrl.value = '';
      iCapaFile.value = '';
      base64CapaCache = null;
      updatePreview();
      formModal.classList.remove('open');
      formActionTitle.textContent = 'Nova Playlist';
    }

    function renderTable() {
      const playlists = DB.getYoutubePlaylists();

      const filtered = playlists.filter(pl => {
        if (window.pendingDeletions && window.pendingDeletions.has(pl.id)) return false;
        return pl.nome.toLowerCase().includes(currentFilter.term);
      });

      tbody.innerHTML = '';
      if (filtered.length === 0) {
        emptyState.style.display = 'block';
      } else {
        emptyState.style.display = 'none';
        filtered.forEach(pl => {
          const videoCount = DB.getYoutubeVideosFor(pl.id).length;
          const tr = document.createElement('tr');

          const img = pl.capa ? `<img src="${pl.capa}" class="td-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : '';
          const placeholder = `<div class="td-cover" style="display:${pl.capa ? 'none' : 'flex'};align-items:center;justify-content:center;font-size:1.5rem">▶️</div>`;

          tr.innerHTML = `
            <td>${img}${placeholder}</td>
            <td><strong>${pl.nome}</strong></td>
            <td>${videoCount} vídeos</td>
            <td>
              <button class="btn btn-ghost btn-sm" onclick="editItem('${pl.id}')" style="margin-right:6px">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="askDelete('${pl.id}', '${pl.nome.replace(/'/g, "\\'")}')">🗑️</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
    }

    // ── Globals para onclick inline no HTML ───────────────────────────────────
    window.editItem = (id) => {
      const pl = DB.getYoutubePlaylistById(id);
      if (!pl) return;

      iEditId.value = pl.id;
      iNome.value = pl.nome;

      if (pl.capa && pl.capa.length > 500) {
        base64CapaCache = pl.capa;
        iCapaUrl.value = '';
      } else {
        base64CapaCache = null;
        iCapaUrl.value = pl.capa || '';
      }
      iCapaFile.value = '';
      updatePreview();

      formModal.classList.add('open');
      formActionTitle.textContent = 'Editar Playlist';
    };

    window.askDelete = (id, n) => {
      deletingId = id;
      document.getElementById('deleteItemName').textContent = n;
      deleteModal.classList.add('open');
    };

    // ── Listeners ─────────────────────────────────────────────────────────────
    iCapaFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) { base64CapaCache = null; updatePreview(); return; }
      try {
        base64CapaCache = await fileToBase64(file);
        iCapaUrl.value = '';
        updatePreview();
      } catch (err) {
        showToast('Erro ao ler imagem', 'error');
      }
    });

    iCapaUrl.addEventListener('input', () => {
      if (iCapaUrl.value.trim()) { base64CapaCache = null; iCapaFile.value = ''; }
      updatePreview();
    });

    cadastroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSalvar = document.getElementById('saveBtn');
      if (btnSalvar.disabled) return;

      const nome = iNome.value.trim();
      if (!nome) {
        showToast('Nome é obrigatório', 'error');
        return;
      }

      btnSalvar.disabled = true;
      const originalText = btnSalvar.innerHTML;
      btnSalvar.innerHTML = '⏳ Salvando...';

      const payload = { nome };
      if (base64CapaCache) payload.capaBase64 = base64CapaCache;
      else if (iCapaUrl.value.trim()) payload.capa = iCapaUrl.value.trim();
      else payload.capa = '';

      try {
        if (iEditId.value) {
          await DB.updateYoutubePlaylist(iEditId.value, payload);
          showToast('Playlist atualizada!');
          resetForm();
          renderTable();
        } else {
          const newItem = await DB.addYoutubePlaylist(payload);
          resetForm();
          renderTable();
          showUndoToast('Playlist cadastrada!',
            () => {},
            async () => {
              await DB.deleteYoutubePlaylist(newItem.id);
              renderTable();
            }
          );
        }
      } catch (err) {
        showToast(err.message || 'Erro ao salvar', 'error');
      } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = originalText;
      }
    });

    const closeDelete = () => deleteModal.classList.remove('open');
    if (deleteClose) deleteClose.addEventListener('click', closeDelete);
    if (deleteCancelBtn) deleteCancelBtn.addEventListener('click', closeDelete);

    deleteConfirmBtn.addEventListener('click', () => {
      if (deletingId) {
        const name = document.getElementById('deleteItemName').textContent;
        closeDelete();
        const idToHide = deletingId;
        showUndoToast(`Excluindo "${name}"...`,
          async () => { await DB.deleteYoutubePlaylist(idToHide); window.clearPendingDeletion?.(idToHide); renderTable(); },
          () => { window.clearPendingDeletion?.(idToHide); renderTable(); },
          () => { window.markPendingDeletion?.(idToHide); renderTable(); }
        );
      }
    });

    addBtn.addEventListener('click', () => { resetForm(); formModal.classList.add('open'); });
    cancelBtn.addEventListener('click', resetForm);
    if (modalClose) modalClose.addEventListener('click', resetForm);

    searchInput.addEventListener('input', e => {
      currentFilter.term = e.target.value.toLowerCase();
      renderTable();
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); searchInput.blur(); }
    });

    renderTable();
});
