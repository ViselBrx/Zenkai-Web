document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  const mangaListEl = document.getElementById('mangaList');
  const emptyState = document.getElementById('emptyMangaState');
  const searchManga = document.getElementById('searchManga');

  const modal = document.getElementById('mangaModal');
  const form = document.getElementById('mangaForm');
  const modalTitle = document.getElementById('mangaTitle');

  let editingId = null;

  function renderList() {
    const term = searchManga.value.toLowerCase();
    const mangas = DB.getMangas();
    const filtered = mangas.filter(m => {
      if (window.pendingDeletions && window.pendingDeletions.has(m.id)) return false;
      return m.nome.toLowerCase().includes(term);
    });

    mangaListEl.innerHTML = '';
    if (filtered.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      filtered.forEach(m => {
        const item = document.createElement('div');
        item.className = 'manga-item';
        item.innerHTML = `
          <div class="manga-info">
            <h3>${m.nome}</h3>
            ${m.volume ? `<p>Volume/Caps: ${m.volume}</p>` : ''}
          </div>
          <div class="manga-actions">
            <a href="${m.url}" target="_blank" rel="noopener" class="btn btn-success btn-sm">Ler/Baixar</a>
            <button class="btn btn-ghost btn-sm" onclick="editManga('${m.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteManga('${m.id}')">🗑️</button>
          </div>
        `;
        mangaListEl.appendChild(item);
      });
    }
  }

  document.getElementById('addMangaBtn').addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Novo Link de Mangá';
    form.reset();
    document.getElementById('mangaId').value = '';
    modal.classList.add('open');
  });

  const closeModal = () => modal.classList.remove('open');
  document.getElementById('mangaClose').addEventListener('click', closeModal);
  document.getElementById('mangaCancel').addEventListener('click', closeModal);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const nome = document.getElementById('mNome').value.trim();
    const url = document.getElementById('mUrl').value.trim();
    const volume = document.getElementById('mVol').value.trim();

    if (!nome || !url) return showToast('Nome e URL são obrigatórios', 'error');

    if (editingId) {
      DB.updateManga(editingId, { nome, url, volume });
      showToast('Mangá atualizado!');
    } else {
      DB.addManga({ nome, url, volume });
      showToast('Mangá adicionado com sucesso!');
    }
    closeModal();
    renderList();
  });

  window.editManga = (id) => {
    const list = DB.getMangas();
    const m = list.find(x => x.id === id);
    if (!m) return;
    
    editingId = id;
    modalTitle.textContent = 'Editar Mangá';
    document.getElementById('mNome').value = m.nome;
    document.getElementById('mUrl').value = m.url;
    document.getElementById('mVol').value = m.volume || '';
    modal.classList.add('open');
  };

  window.deleteManga = (id) => {
    const list = DB.getMangas();
    const m = list.find(x => x.id === id);
    if (!m) return;

    const idToHide = id;
    if (!window.pendingDeletions) window.pendingDeletions = new Set();
    window.pendingDeletions.add(idToHide);
    renderList();

    showUndoToast(`Excluindo mangá "${m.nome}"...`, 
      () => {
        if (window.pendingDeletions.has(idToHide)) {
          DB.deleteManga(idToHide);
          window.pendingDeletions.delete(idToHide);
          renderList();
        }
      },
      () => {
        window.pendingDeletions.delete(idToHide);
        renderList();
      }
    );
  };

  searchManga.addEventListener('input', renderList);
  searchManga.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchManga.blur();
  });
  renderList();
});
