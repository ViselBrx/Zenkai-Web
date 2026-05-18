document.addEventListener('DOMContentLoaded', async () => {
  await DB.init(['hqs', 'hqEditions', 'hqNotes']);
  if (typeof StatsManager !== 'undefined') StatsManager.render('hqs');

  const hqPills     = document.getElementById('hqPills');
  const addHQBtn    = document.getElementById('addHQBtn');
  const searchHQ    = document.getElementById('searchHQ');
  const noHQMsg     = document.getElementById('noHQMsg');

  const editionsPanel  = document.getElementById('editionsPanel');
  const editionsGrid   = document.getElementById('editionsGrid');
  const hqPanelTitle   = document.getElementById('hqPanelTitle');

  const hqModal   = document.getElementById('hqModal');
  const hqForm    = document.getElementById('hqForm');
  const deleteModal = document.getElementById('deleteModal');

  const editionModal = document.getElementById('editionModal');
  const editionForm  = document.getElementById('editionForm');
  const addEditionBtn = document.getElementById('addEditionBtn');

  const readerModal = document.getElementById('readerModal');
  const readerFrame = document.getElementById('readerFrame');
  const readerTitle = document.getElementById('readerTitle');

  let activeHQId     = null;
  let editingHQId    = null;
  let editingEdId    = null;
  let deletingHQId   = null;

  // Guard contra renders concorrentes (pesquisa em tempo real)
  let _hqRenderToken = 0;

  const hqCapaInput   = document.getElementById('hqCapa');
  const hqCapaFile    = document.getElementById('hqCapaFile');
  const hqCapaPreview = document.getElementById('hqCapaPreview');
  const hqCapaImg     = document.getElementById('hqCapaImg');

  // ── Helpers ──────────────────────────────────────────────
  function askDeleteHQ(id, nome) {
    deletingHQId = id;
    document.getElementById('deleteHQName').textContent = nome;
    deleteModal.classList.add('open');
  }

  function queueHQDeletion(idToHide, hqName) {
    if (activeHQId === idToHide) activeHQId = null;
    renderHQPills();
    renderEditions();

    showUndoToast(`Excluindo coleção "${hqName}"...`,
      () => {
        DB.deleteHQ(idToHide);
        renderHQPills();
        renderEditions();
      },
      () => {}
    );
  }

  async function renderHQPills() {
    const myToken = ++_hqRenderToken;
    const term = searchHQ.value.toLowerCase();
    const hqs = DB.getHQs().map((h, index) => ({ ...h, _originIndex: index })).filter(h => {
      if (window.pendingDeletions && typeof window.pendingDeletions.has === 'function' && window.pendingDeletions.has(h.id)) return false;
      return h.nome && h.nome.toLowerCase().includes(term);
    });

    let userFavs = new Set();
    try {
      const favs = await DB.getFavorites('hq');
      userFavs = new Set(favs.map(f => f.content_id));
    } catch (e) {
      console.warn('Erro ao carregar favoritos de HQs.');
    }

    // Se um render mais recente foi disparado enquanto aguardávamos, abortamos
    if (myToken !== _hqRenderToken) return;

    hqPills.innerHTML = '';
    const frag = document.createDocumentFragment();

    hqs.sort((a, b) => {
      const aFav = userFavs.has(a.id) ? 1 : 0;
      const bFav = userFavs.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return a._originIndex - b._originIndex;
    });

    // Ajusta a HQ ativa baseada nos resultados
    const isActivedHQVisible = hqs.some(h => h.id === activeHQId);
    if (!isActivedHQVisible || !activeHQId) {
        activeHQId = hqs.length > 0 ? hqs[0].id : null;
        renderEditions();
    }

    hqs.forEach(h => {
      const card = document.createElement('div');
      card.className = 'card' + (h.id === activeHQId ? ' active-card' : '');
      if (h.id === activeHQId) card.style.borderColor = 'var(--primary)';
      card.dataset.originIndex = String(h._originIndex);
      card.dataset.contentId = h.id;

      const isFav = userFavs.has(h.id);
      const initial = (h.nome || '?').charAt(0).toUpperCase();
      const coverHtml = h.capa
        ? `<img src="${h.capa}" class="card-cover" alt="capa" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;var d=document.createElement('div');d.className='card-cover-placeholder';d.textContent='${initial}';this.parentNode.replaceChild(d,this);" />`
        : `<div class="card-cover-placeholder">${initial}</div>`;

      const favBtnHtml = `
        <button class="fav-star ${isFav ? 'active' : ''}" data-id="${h.id}" title="${isFav ? 'Desmarcar' : 'Marcar'}">
          ${isFav ? '★' : '☆'}
        </button>
      `;

      card.innerHTML = `
        <div style="position:relative; cursor:pointer;" class="card-click-area">
          ${coverHtml}
          ${isFav ? '<div class="fav-ribbon">Favorito</div>' : ''}
          ${favBtnHtml}
        </div>
        <div class="card-body card-click-area" style="cursor:pointer;">
          <div class="card-title">${h.nome}</div>
          <div style="display:flex; gap: 8px; align-items: center; justify-content: space-between; margin-top: auto;">
             <span class="card-badge" style="margin-top:0;">🦸 Ver Estante</span>
             <div style="display:flex; gap:8px; align-items:center;">
               <span class="pill-edit-btn" title="Editar" style="opacity:0.7; font-size:1.1rem; cursor:pointer;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.7'">✏️</span>
               <span class="pill-delete-btn" title="Excluir" style="opacity:0.7; font-size:1.1rem; cursor:pointer; color:var(--danger);" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.7'">🗑️</span>
             </div>
          </div>
        </div>
      `;

      card.onclick = (e) => {
        if (e.target.closest('.pill-edit-btn') || e.target.closest('.pill-delete-btn') || e.target.closest('.fav-star')) return;

        if (activeHQId === h.id) {
          const target = document.getElementById('editionsPanel');
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        activeHQId = h.id;
        renderEditions();

        document.querySelectorAll('#hqPills .card').forEach(c => {
          c.classList.remove('active-card');
          c.style.borderColor = '';
        });
        card.classList.add('active-card');
        card.style.borderColor = 'var(--primary)';

        const target = document.getElementById('editionsPanel');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };

      const favBtn = card.querySelector('.fav-star');
      if (favBtn) {
        favBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
            const res = await DB.toggleFavorite(h.id, 'hq', { title: h.nome, cover: h.capa });
            const isAdded = res.action === 'added';
            DB.applyFavoriteCardChrome(card, isAdded);
            DB.reorderFavoriteCards(hqPills);
            if (window.showToast) showToast(isAdded ? `"${h.nome}" adicionado aos favoritos!` : `"${h.nome}" removido dos favoritos.`);
          } catch (err) {
            if (window.showToast) showToast(err.message || 'Erro ao favoritar.', 'error');
          }
        };
      }

      card.querySelector('.pill-edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        editingHQId = h.id;
        document.getElementById('hqNome').value = h.nome;
        hqCapaInput.value = h.capa || '';
        hqCapaImg.src = h.capa || '';
        hqCapaPreview.style.display = h.capa ? 'block' : 'none';
        hqCapaFile.value = '';
        document.querySelector('#hqModal .modal-header h2').textContent = 'Editar HQ';
        hqModal.classList.add('open');
      });

      card.querySelector('.pill-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        askDeleteHQ(h.id, h.nome);
      });

      frag.appendChild(card);
    });

    hqPills.appendChild(frag);
  }

  // ── Renderizar estante de edições ───────────────────────
  function renderEditions() {
    if (!activeHQId) {
      noHQMsg.style.display = 'block';
      editionsPanel.style.display = 'none';
      return;
    }
    const hqr = DB.getHQById(activeHQId);
    const editions = DB.getHQEditionsFor(activeHQId).filter(v => {
      if (window.pendingDeletions && typeof window.pendingDeletions.has === 'function' && window.pendingDeletions.has(v.id)) return false;
      return true;
    });
    const watchedCount = typeof Watched !== 'undefined'
      ? Watched.countWatched(editions.map(v => v.id))
      : 0;
    const bannerEl = document.getElementById('hqCapaBanner');

    if (hqr) {
      const progressHtml = editions.length
        ? `<span class="hq-progress-inline">${watchedCount}/${editions.length} lidas</span>`
        : '';
      hqPanelTitle.innerHTML = `<span style="color:var(--text)">Leitura:</span> ${hqr.nome} ${progressHtml}`;
      if (hqr.capa) {
        bannerEl.src = hqr.capa;
        bannerEl.style.display = 'block';
      } else {
        bannerEl.style.display = 'none';
        bannerEl.src = '';
      }
    }

    noHQMsg.style.display = 'none';
    editionsPanel.style.display = 'block';
    editionsGrid.innerHTML = '';

    if (editions.length === 0) {
      editionsGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">Nenhuma edição nesta HQ.</p>`;
    }

    editions.forEach(v => {
      const card = document.createElement('div');
      const isWatched = typeof Watched !== 'undefined' && Watched.isWatched(v.id);

      const titleStr = v.title ? v.title : `Edição ${v.edition_number}`;

      const noteData = DB.getHQNote(v.id) || {};
      const bookmarkVal = noteData.page_bookmark || '';
      const textVal = noteData.note_text || '';
      card.className = 'volume-card'
        + (isWatched ? ' is-watched' : '')
        + ((bookmarkVal || textVal) ? ' has-note' : '');

      const bookmarkBadge = bookmarkVal ? `<div class="vol-bookmark-badge">🔖 Pág. ${bookmarkVal}</div>` : '';
      const watchedMeta = isWatched
        ? '<div class="vol-read-state">Lido</div>'
        : '<div class="vol-read-state is-empty">Lido</div>';

      card.innerHTML = `
        ${bookmarkBadge}
        <span class="vol-icon">🦸</span>
        <div class="vol-title">Edição ${v.edition_number}</div>
        <div class="vol-sub">${v.title || ''}</div>
        ${watchedMeta}

        <button class="vol-actions-ui btn-note-vol" title="Anotações e Marcações">📝</button>
        <button class="vol-actions-ui btn-check-vol${isWatched ? ' watched' : ''}" title="${isWatched ? 'Marcar como não lido' : 'Marcar como lido'}">&#10003;</button>
        <button class="vol-actions-ui btn-edit-vol" title="Editar Edição">✏️</button>
        <button class="vol-actions-ui btn-del-vol" title="Apagar Edição">✖</button>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.vol-actions-ui')) return;
        openReader(v.pdf_url, `${hqr.nome} - ${titleStr}`);
      });

      card.querySelector('.btn-edit-vol').addEventListener('click', (e) => {
        e.stopPropagation();
        editingEdId = v.id;
        editionModal.classList.add('open');
        document.querySelector('#editionModal .modal-header h2').textContent = 'Editar Edição';
        document.getElementById('eNumber').value = v.edition_number;
        document.getElementById('eTitle').value = v.title || '';
        document.getElementById('eFile').value = '';
        document.getElementById('eUrl').value = v.pdf_url || '';
        eMode.value = 'url';
        eMode.dispatchEvent(new Event('change'));
      });

      card.querySelector('.btn-del-vol').addEventListener('click', async (e) => {
        e.stopPropagation();
        const idToHide = v.id;
        showUndoToast(`Excluindo Edição ${v.edition_number}...`,
          () => {
            DB.deleteHQEdition(activeHQId, idToHide);
            renderEditions();
          },
          () => {}
        );
      });

      card.querySelector('.btn-note-vol').addEventListener('click', (e) => {
        e.stopPropagation();
        openNoteModal(v);
      });

      card.querySelector('.btn-check-vol').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (typeof Watched === 'undefined') return;
        try {
          await Watched.toggle(v.id, 'hq_edition');
          renderEditions();
        } catch (err) {
          showToast(err.message || 'Não foi possível atualizar o checklist.', 'error');
        }
      });

      editionsGrid.appendChild(card);
    });
  }

  // ── Pesquisa (tempo real, sem duplicatas) ───────────────
  let _hqSearchDebounce = null;
  searchHQ.addEventListener('input', () => {
    clearTimeout(_hqSearchDebounce);
    _hqSearchDebounce = setTimeout(renderHQPills, 120);
  });

  // ── Modal HQ (criar/editar) ────────────────────────────
  hqCapaFile.addEventListener('change', () => {
    const file = hqCapaFile.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        hqCapaImg.src = e.target.result;
        hqCapaPreview.style.display = 'block';
        hqCapaInput.value = ''; // Limpa URL se selecionou arquivo
      };
      reader.readAsDataURL(file);
    }
  });

  hqCapaInput.addEventListener('input', () => {
    const url = hqCapaInput.value.trim();
    if (url) {
      hqCapaImg.src = url;
      hqCapaPreview.style.display = 'block';
      hqCapaFile.value = ''; // Limpa arquivo se digitou URL
    } else {
      hqCapaPreview.style.display = 'none';
    }
  });

  addHQBtn.addEventListener('click', () => {
    editingHQId = null;
    hqModal.classList.add('open');
    hqForm.reset();
    hqCapaImg.src = '';
    hqCapaPreview.style.display = 'none';
    document.querySelector('#hqModal .modal-header h2').textContent = 'Nova HQ';
  });
  const closeHQModal = () => hqModal.classList.remove('open');
  document.getElementById('hqClose').addEventListener('click', closeHQModal);

  const closeDeleteModal = () => {
    deleteModal.classList.remove('open');
    deletingHQId = null;
  };
  document.getElementById('deleteClose').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteConfirmBtn').addEventListener('click', () => {
    if (!deletingHQId) return;
    const hqName = document.getElementById('deleteHQName').textContent;
    const idToDelete = deletingHQId;
    closeDeleteModal();
    queueHQDeletion(idToDelete, hqName);
  });

  hqForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarHQ');
    const nome = document.getElementById('hqNome').value.trim();
    if (!nome) return showToast('Preencha o nome da HQ', 'error');

    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      let capaBase64 = null;
      if (hqCapaFile.files.length) {
        capaBase64 = await fileToBase64(hqCapaFile.files[0]);
      }

      const payload = { nome };
      if (capaBase64) {
        payload.capaBase64 = capaBase64;
      } else {
        payload.capa = hqCapaInput.value.trim();
      }

      if (editingHQId) {
        await DB.updateHQ(editingHQId, payload);
        closeHQModal();
        renderHQPills();
        renderEditions();
        showDarkToast('HQ atualizada!');
      } else {
        const novo = await DB.addHQ(payload);
        closeHQModal();
        activeHQId = novo.id;
        renderHQPills();
        renderEditions();

        showUndoToast('Estante de HQ criada com sucesso!',
          () => {},
          async () => {
            if (activeHQId === novo.id) activeHQId = null;
            await DB.deleteHQ(novo.id);
            renderHQPills();
            renderEditions();
          }
        );
      }
    } catch (err) {
      showToast('Erro ao salvar! ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '💾 Salvar HQ';
    }
  });

  // ── Upload / Link de Edição ─────────────────────────────
  const eMode  = document.getElementById('eMode');
  const grpUrl = document.getElementById('grpUrl');
  const grpFile = document.getElementById('grpFile');

  eMode.addEventListener('change', () => {
    if (eMode.value === 'url') {
      grpUrl.style.display = 'block';
      grpFile.style.display = 'none';
    } else {
      grpUrl.style.display = 'none';
      grpFile.style.display = 'block';
    }
  });

  addEditionBtn.addEventListener('click', () => {
    editingEdId = null;
    document.querySelector('#editionModal .modal-header h2').textContent = 'Fazer Upload / Adicionar Link de Edição';
    editionModal.classList.add('open');
    document.getElementById('eNumber').value = DB.getHQEditionsFor(activeHQId).length + 1;
    document.getElementById('eTitle').value = '';
    document.getElementById('eFile').value = '';
    document.getElementById('eUrl').value = '';
  });
  const closeEditionModal = () => editionModal.classList.remove('open');
  document.getElementById('editionClose').addEventListener('click', closeEditionModal);

  editionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarEdition');
    const eNum = parseInt(document.getElementById('eNumber').value);
    const eTit = document.getElementById('eTitle').value.trim();
    const eModeVal = eMode.value;
    const eUrlInput = document.getElementById('eUrl').value.trim();
    const eFileInput = document.getElementById('eFile');

    if (!eNum) return showToast('Preencha o número da edição', 'error');

    let fileToSend = null;
    let urlToSend = null;

    if (eModeVal === 'file') {
      if (!eFileInput.files.length && !editingEdId) return showToast('Escolha o arquivo PDF', 'error');
      if (eFileInput.files.length) {
        fileToSend = eFileInput.files[0];
        if (fileToSend.type !== 'application/pdf') return showToast('O arquivo precisa ser um documento PDF', 'error');
      }
    } else {
      if (!eUrlInput && !editingEdId) return showToast('Digite o link do Google Drive / PDF', 'error');
      let fUrl = eUrlInput;
      if (fUrl.includes('drive.google.com') && fUrl.includes('/view')) {
        fUrl = fUrl.replace('/view', '/preview');
        fUrl = fUrl.split('?')[0];
      }
      urlToSend = fUrl;
    }

    btn.disabled = true;
    btn.textContent = eModeVal === 'file' ? 'Enviando... (Isso pode demorar)' : 'Salvando...';

    try {
      if (editingEdId) {
        await DB.updateHQEdition(activeHQId, editingEdId, fileToSend, urlToSend, { edition: eNum, title: eTit });
        closeEditionModal();
        renderEditions();
        showDarkToast('Edição atualizada!');
      } else {
        const newEd = await DB.addHQEdition(activeHQId, fileToSend, urlToSend, { edition: eNum, title: eTit });
        closeEditionModal();
        renderEditions();

        showUndoToast(`Edição ${eNum} adicionada à coleção`,
          () => {},
          async () => {
            await DB.deleteHQEdition(activeHQId, newEd.id);
            renderEditions();
          }
        );
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao processar arquivo/link (' + err.message + ')', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '📤 Iniciar Upload / Salvar Link';
    }
  });

  // ── Anotações ───────────────────────────────────────────
  const noteModal = document.getElementById('noteModal');
  const noteClose = document.getElementById('noteClose');
  const nPage = document.getElementById('nPage');
  const nText = document.getElementById('nText');
  const btnSalvarNote = document.getElementById('btnSalvarNote');
  const btnExcluirNote = document.getElementById('btnExcluirNote');
  let currentNoteEdId = null;

  function openNoteModal(v) {
    currentNoteEdId = v.id;
    const noteData = DB.getHQNote(v.id) || {};
    nPage.value = noteData.page_bookmark || '';
    nText.value = noteData.note_text || '';
    document.querySelector('#noteModal .modal-header h2').textContent = `Anotações: Ed. ${v.edition_number}`;
    noteModal.classList.add('open');
  }

  noteClose.addEventListener('click', () => {
    noteModal.classList.remove('open');
    currentNoteEdId = null;
  });

  btnExcluirNote.addEventListener('click', async () => {
    if (!currentNoteEdId || !activeHQId) return;
    btnExcluirNote.disabled = true;
    btnExcluirNote.textContent = 'Limpando...';
    try {
      await DB.saveHQNote(activeHQId, currentNoteEdId, '', '');
      noteModal.classList.remove('open');
      showDarkToast('Anotações excluídas!');
      renderEditions();
    } catch (err) {
      showToast('Erro ao limpar: ' + err.message, 'error');
    } finally {
      btnExcluirNote.disabled = false;
      btnExcluirNote.innerHTML = '🗑️ Limpar';
    }
  });

  btnSalvarNote.addEventListener('click', async () => {
    if (!currentNoteEdId || !activeHQId) return;
    btnSalvarNote.disabled = true;
    btnSalvarNote.textContent = 'Salvando...';
    try {
      await DB.saveHQNote(activeHQId, currentNoteEdId, nText.value, nPage.value);
      noteModal.classList.remove('open');
      showDarkToast('Anotações salvas com sucesso!');
      renderEditions();
    } catch (err) {
      showToast('Erro ao salvar: ' + err.message, 'error');
    } finally {
      btnSalvarNote.disabled = false;
      btnSalvarNote.innerHTML = '💾 Salvar Anotações';
    }
  });

  // ── Leitor PDF ──────────────────────────────────────────
  function openReader(url, titulo) {
    readerTitle.textContent = titulo;
    readerFrame.src = url + '#toolbar=0&view=FitH';
    readerModal.classList.add('open');
  }

  document.getElementById('readerClose').addEventListener('click', () => {
    readerModal.classList.remove('open');
    readerFrame.src = '';
    readerTitle.textContent = '';
  });

  const btnFullscreen = document.getElementById('btnFullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      const modalContent = document.getElementById('readerModalContent');
      const isFull = modalContent.classList.contains('site-fullscreen');

      modalContent.classList.toggle('site-fullscreen');
      document.body.classList.toggle('reading-fullscreen');

      if (!isFull) {
        btnFullscreen.innerHTML = '🔲 Sair da Tela Cheia';
        if (modalContent.requestFullscreen) {
          modalContent.requestFullscreen().catch(err => console.warn(err));
        } else if (modalContent.webkitRequestFullscreen) {
          modalContent.webkitRequestFullscreen().catch(err => console.warn(err));
        }
      } else {
        btnFullscreen.innerHTML = '🔲 Ativar Tela Cheia';
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.warn(err));
        }
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const modalContent = document.getElementById('readerModalContent');
      if (!document.fullscreenElement && modalContent.classList.contains('site-fullscreen')) {
        modalContent.classList.remove('site-fullscreen');
        document.body.classList.remove('reading-fullscreen');
        btnFullscreen.innerHTML = '🔲 Ativar Tela Cheia';
      }
    });
  }

  // ── Init ────────────────────────────────────────────────
  renderHQPills();
  renderEditions();

  window.addEventListener('profileUpdated', () => { 
    renderHQPills(); 
  });
  
  window.addEventListener('storage', (e) => {
    if (e.key === 'animehouse_store' || (e.key && e.key.startsWith('equipped_'))) {
      renderHQPills();
    }
  });
});
