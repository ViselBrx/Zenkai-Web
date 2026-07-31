document.addEventListener('DOMContentLoaded', async () => {
  await DB.init(['mangas', 'mangaVolumes', 'mangaNotes']);
  if (typeof StatsManager !== 'undefined') StatsManager.render('mangas');

  const mangaPills = document.getElementById('mangaPills');
  const addMangaBtn = document.getElementById('addMangaBtn');
  const searchManga = document.getElementById('searchManga');
  const noMangaMsg = document.getElementById('noMangaMsg');
  
  const volumesPanel = document.getElementById('volumesPanel');
  const volumesGrid = document.getElementById('volumesGrid');
  const mangaPanelTitle = document.getElementById('mangaPanelTitle');
  
  const mangaModal = document.getElementById('mangaModal');
  const mangaForm = document.getElementById('mangaForm');
  const deleteModal = document.getElementById('deleteModal');
  
  const volumeModal = document.getElementById('volumeModal');
  const volumeForm = document.getElementById('volumeForm');
  const addVolumeBtn = document.getElementById('addVolumeBtn');
  
  const readerModal = document.getElementById('readerModal');
  const readerFrame = document.getElementById('readerFrame');
  const readerTitle = document.getElementById('readerTitle');

  let activeMangaId = null;
  let editingMangaId = null;
  let editingVolId = null;
  let deletingMangaId = null;

  // Guard contra renders concorrentes (pesquisa em tempo real)
  let _mangaRenderToken = 0;

  // Elementos de capa do modal
  const mCapaInput = document.getElementById('mCapa');
  const mCapaFile = document.getElementById('mCapaFile');
  const mCapaPreview = document.getElementById('mCapaPreview');
  const mCapaImg = document.getElementById('mCapaImg');

  function askDeleteManga(id, nome) {
    deletingMangaId = id;
    document.getElementById('deleteMangaName').textContent = nome;
    deleteModal.classList.add('open');
  }

  function queueMangaDeletion(idToHide, mangaName) {
    if (activeMangaId === idToHide) {
      activeMangaId = null;
    }

    renderMangaPills();
    renderVolumes();

    showUndoToast(`Excluindo coleção "${mangaName}"...`,
      async () => {`r`n        await DB.deleteManga(idToHide);
        window.clearPendingDeletion?.(idToHide);
        renderMangaPills();
        renderVolumes();
      },
      () => {
        window.clearPendingDeletion?.(idToHide);
        renderMangaPills();
        renderVolumes();
      },
      () => {
        window.markPendingDeletion?.(idToHide);
        renderMangaPills();
        renderVolumes();
      }
    );
  }

  // Renderizar a lista de mangás em formato de pílulas (seletor)
  async function renderMangaPills() {
    const myToken = ++_mangaRenderToken;
    const term = searchManga.value.toLowerCase();
    let mangas = DB.getMangas().map((m, index) => ({ ...m, _originIndex: index })).filter(m => {
      if (window.pendingDeletions && typeof window.pendingDeletions.has === 'function' && window.pendingDeletions.has(m.id)) return false;
      return m.nome && m.nome.toLowerCase().includes(term);
    });

    // Buscar favoritos
    let userFavs = new Set();
    try {
        const favs = await DB.getFavorites('manga');
        userFavs = new Set(favs.map(f => f.content_id));
    } catch (e) {
        console.warn("Erro ao carregar favoritos de mangás.");
    }

    // Se um render mais recente foi disparado enquanto aguardávamos, abortamos
    if (myToken !== _mangaRenderToken) return;
    const filterStatus = document.getElementById('filterMangaStatus') ? document.getElementById('filterMangaStatus').value : '';
    if (filterStatus === 'favoritos') {
       mangas = mangas.filter(m => userFavs.has(m.id));
    }

    mangaPills.innerHTML = '';
    const frag = document.createDocumentFragment();

    // Favoritos no topo, demais itens na ordem original
    mangas.sort((a, b) => {
      const aFav = userFavs.has(a.id) ? 1 : 0;
      const bFav = userFavs.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return a._originIndex - b._originIndex;
    });

    // Ajusta o mangá ativo baseado nos resultados visíveis
    const isActivedMangaVisible = mangas.some(m => m.id === activeMangaId);
    if (!isActivedMangaVisible || !activeMangaId) {
        activeMangaId = mangas.length > 0 ? mangas[0].id : null;
        renderVolumes();
    }
    
    mangas.forEach(m => {
      const card = document.createElement('div');
      card.className = 'card' + (m.id === activeMangaId ? ' active-card' : '');
      if (m.id === activeMangaId) card.style.borderColor = 'var(--primary)';
      card.dataset.originIndex = String(m._originIndex);
      card.dataset.contentId = m.id;
      
      const isFav = userFavs.has(m.id);
      const initial = (m.nome || '?').charAt(0).toUpperCase();
      const coverHtml = m.capa
        ? `<img src="${m.capa}" class="card-cover" alt="capa" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;var d=document.createElement('div');d.className='card-cover-placeholder';d.textContent='${initial}';this.parentNode.replaceChild(d,this);" />`
        : `<div class="card-cover-placeholder">${initial}</div>`;

      const starClass = '';
      const favBtnHtml = `
        <button class="fav-star ${isFav ? 'active' : ''} ${starClass}" data-id="${m.id}" title="${isFav ? 'Desmarcar' : 'Marcar'}">
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
          <div class="card-title">${m.nome}</div>
          <div style="display:flex; gap: 8px; align-items: center; justify-content: space-between; margin-top: auto;">
             <span class="card-badge" style="margin-top:0;">📚 Ver Estante</span>
             <div style="display:flex; gap:8px; align-items:center;">
               <span class="pill-edit-btn" title="Editar" style="opacity:0.7; font-size:1.1rem; cursor:pointer;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.7'">✏️</span>
               <span class="pill-delete-btn" title="Excluir" style="opacity:0.7; font-size:1.1rem; cursor:pointer; color:var(--danger);" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.7'">🗑️</span>
             </div>
          </div>
        </div>
      `;

      // Clique no card (seleciona e rola)
      card.onclick = (e) => {
        // Ignora se clicar nos botões de editar/deletar/favoritar
        if (e.target.closest('.pill-edit-btn') || e.target.closest('.pill-delete-btn') || e.target.closest('.fav-star')) {
          return;
        }
        
        // Se já é o manga ativo, apenas rola para os volumes
        if (activeMangaId === m.id) {
          const target = document.getElementById('volumesPanel') || document.getElementById('mangaDetailContent');
          if (target) target.scrollIntoView({behavior: 'smooth', block: 'start'});
          return;
        }
        
        // Se é um novo manga, ativa e renderiza
        activeMangaId = m.id;
        renderVolumes();
        
        // Apenas atualiza o visual do card ativo sem re-renderizar toda a lista
        document.querySelectorAll('#mangaPills .card').forEach(c => {
          c.classList.remove('active-card');
          c.style.borderColor = '';
        });
        card.classList.add('active-card');
        card.style.borderColor = 'var(--primary)';
        
        const target = document.getElementById('volumesPanel') || document.getElementById('mangaDetailContent');
        if (target) target.scrollIntoView({behavior: 'smooth', block: 'start'});
      };
      
      const favBtn = card.querySelector('.fav-star');
      if (favBtn) {
        favBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
            const res = await DB.toggleFavorite(m.id, 'manga', { title: m.nome, cover: m.capa });
            const isAdded = res.action === 'added';
            DB.applyFavoriteCardChrome(card, isAdded);
            DB.reorderFavoriteCards(mangaPills);
            if (window.showToast) showToast(isAdded ? `"${m.nome}" adicionado aos favoritos!` : `"${m.nome}" removido dos favoritos.`);
          } catch (err) {
            if (window.showToast) showToast(err.message || 'Erro ao favoritar.', 'error');
          }
        };
      }

      // Clique no lápis: abrir modal no modo edição
      card.querySelector('.pill-edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        editingMangaId = m.id;
        document.getElementById('mNome').value = m.nome;
        mCapaInput.value = m.capa || '';
        mCapaImg.src = m.capa || '';
        mCapaPreview.style.display = m.capa ? 'block' : 'none';
        mCapaFile.value = '';
        document.querySelector('#mangaModal .modal-header h2').textContent = 'Editar Mangá';
        mangaModal.classList.add('open');
      });

      card.querySelector('.pill-delete-btn').addEventListener('click', (e) => {
         e.stopPropagation();
         askDeleteManga(m.id, m.nome);
      });

      frag.appendChild(card);
    });
    
    mangaPills.appendChild(frag);
  }

  // Renderizar a estante de volumes (PDFs do mangá selecionado)
  function renderVolumes() {
    if (!activeMangaId) {
      noMangaMsg.style.display = 'block';
      volumesPanel.style.display = 'none';
      return;
    }
    const mgr = DB.getMangaById(activeMangaId) || DB.getMangas().find(x => x.id === activeMangaId);
    const volumes = DB.getMangaVolumesFor(activeMangaId).filter(v => {
      if (window.pendingDeletions && typeof window.pendingDeletions.has === 'function' && window.pendingDeletions.has(v.id)) return false;
      return true;
    });
    const watchedCount = typeof Watched !== 'undefined'
      ? Watched.countWatched(volumes.map(v => v.id))
      : 0;
    const bannerEl = document.getElementById('mangaCapaBanner');

    if (mgr) {
       const progressHtml = volumes.length
         ? `<span class="manga-progress-inline">${watchedCount}/${volumes.length} lidos</span>`
         : '';
       mangaPanelTitle.innerHTML = `<span style="color:var(--text)">Leitura:</span> ${mgr.nome} ${progressHtml}`;
       if (mgr.capa) {
           bannerEl.src = mgr.capa;
           bannerEl.style.display = 'block';
       } else {
           bannerEl.style.display = 'none';
           bannerEl.src = '';
       }
    }

    noMangaMsg.style.display = 'none';
    volumesPanel.style.display = 'block';

    volumesGrid.innerHTML = '';
    
    if(volumes.length === 0) {
        volumesGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">Nenhum volume nesta visualização.</p>`;
    }

    volumes.forEach(v => {
      const card = document.createElement('div');
      const isWatched = typeof Watched !== 'undefined' && Watched.isWatched(v.id);
      
      const titleStr = v.title ? v.title : `Volume ${v.volume_number}`;
      
      const noteData = DB.getMangaNote(v.id) || {};
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
        <span class="vol-icon">📖</span>
        <div class="vol-title">Volume ${v.volume_number}</div>
        <div class="vol-sub">${v.title || ''}</div>
        ${watchedMeta}
        
        <button class="vol-actions-ui btn-note-vol" title="Anotações e Marcações">📝</button>
        <button class="vol-actions-ui btn-check-vol${isWatched ? ' watched' : ''}" title="${isWatched ? 'Marcar como nao lido' : 'Marcar como lido'}">&#10003;</button>
        <button class="vol-actions-ui btn-edit-vol" title="Editar Volume">✏️</button>
        <button class="vol-actions-ui btn-del-vol" title="Apagar Volume">✖</button>
        
      `;

      // Clicar para abrir leitor PDF
      card.addEventListener('click', (e) => {
        if(e.target.closest('.vol-actions-ui')) return; // ignora se clicou num dos botões
        openReader(v.pdf_url, `${mgr.nome} - ${titleStr}`);
      });
      
      // Botão Editar
      const editBtn = card.querySelector('.btn-edit-vol');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editingVolId = v.id;
        volumeModal.classList.add('open');
        document.querySelector('#volumeModal .modal-header h2').textContent = 'Editar Volume';
        document.getElementById('vNumber').value = v.volume_number;
        document.getElementById('vTitle').value = v.title || '';
        document.getElementById('vFile').value = '';
        document.getElementById('vUrl').value = v.pdf_url || '';
        vMode.value = v.pdf_url && v.pdf_url.startsWith('http') ? 'url' : 'url';
        vMode.dispatchEvent(new Event('change'));
      });

      // Clicar botão excluir (Com UndoToast - 7s)
      const delBtn = card.querySelector('.btn-del-vol');
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); 
        
        const idToHide = v.id;
        
        showUndoToast(`Excluindo Volume ${v.volume_number}...`, 
            () => {
              DB.deleteMangaVolume(activeMangaId, idToHide);
              window.clearPendingDeletion?.(idToHide);
              renderVolumes();
            },
            () => {
              window.clearPendingDeletion?.(idToHide);
              renderVolumes();
            },
            () => {
              window.markPendingDeletion?.(idToHide);
              renderVolumes();
            }
        );
      });

      // --- ANOTAÇÕES E BOOKMARKS ---
      const noteBtn = card.querySelector('.btn-note-vol');
      noteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openNoteModal(v);
      });

      const checkBtn = card.querySelector('.btn-check-vol');
      checkBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (typeof Watched === 'undefined') return;
          try {
              await Watched.toggle(v.id, 'manga_volume');
              renderVolumes();
          } catch (err) {
              showToast(err.message || 'Nao foi possivel atualizar o checklist.', 'error');
          }
      });

      volumesGrid.appendChild(card);
    });
  }

  /* PESQUISA (tempo real, sem duplicatas) */
  const filterMangaStatus = document.getElementById('filterMangaStatus');
  if (filterMangaStatus) filterMangaStatus.addEventListener('change', renderMangaPills);
  searchManga.addEventListener('input', renderMangaPills);

  /* MANGA MODAL (CRIAR PASTA DO MANGÁ) */

  // Preview ao selecionar imagem
  mCapaFile.addEventListener('change', () => {
    const file = mCapaFile.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        mCapaImg.src = e.target.result;
        mCapaPreview.style.display = 'block';
        mCapaInput.value = ''; // Limpa URL se selecionou arquivo
      };
      reader.readAsDataURL(file);
    }
  });

  mCapaInput.addEventListener('input', () => {
    const url = mCapaInput.value.trim();
    if (url) {
      mCapaImg.src = url;
      mCapaPreview.style.display = 'block';
      mCapaFile.value = ''; // Limpa arquivo se digitou URL
    } else {
      mCapaPreview.style.display = 'none';
    }
  });

  addMangaBtn.addEventListener('click', () => {
    editingMangaId = null;
    mangaModal.classList.add('open');
    mangaForm.reset();
    mCapaImg.src = '';
    mCapaPreview.style.display = 'none';
    document.querySelector('#mangaModal .modal-header h2').textContent = 'Novo Mangá';
  });
  const closeMangaModal = () => mangaModal.classList.remove('open');
  document.getElementById('mangaClose').addEventListener('click', closeMangaModal);

  const closeDeleteModal = () => {
    deleteModal.classList.remove('open');
    deletingMangaId = null;
  };
  document.getElementById('deleteClose').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteConfirmBtn').addEventListener('click', () => {
    if (!deletingMangaId) return;

    const mangaName = document.getElementById('deleteMangaName').textContent;
    const idToDelete = deletingMangaId;
    closeDeleteModal();
    queueMangaDeletion(idToDelete, mangaName);
  });
  
  mangaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarManga');
    const nome = document.getElementById('mNome').value.trim();
    if (!nome) return showToast('Preencha o nome do mangá', 'error');

    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        // Converter capa para base64 se selecionou arquivo
        let capaBase64 = null;
        if (mCapaFile.files.length) {
            capaBase64 = await fileToBase64(mCapaFile.files[0]);
        }
        
        const payload = { nome };
        if (capaBase64) {
            payload.capaBase64 = capaBase64;
        } else {
            payload.capa = mCapaInput.value.trim();
        }

        if (editingMangaId) {
            await DB.updateManga(editingMangaId, payload);
            closeMangaModal();
            renderMangaPills();
            renderVolumes();
            showDarkToast('Mangá atualizado!');
        } else {
            const novo = await DB.addManga(payload);
            closeMangaModal();
            activeMangaId = novo.id;
            renderMangaPills();
            renderVolumes();
            
            showUndoToast('Estante de mangá criada com sucesso!',
                () => {},
                async () => {
                  if (activeMangaId === novo.id) activeMangaId = null;
                  await DB.deleteManga(novo.id);
                  renderMangaPills();
                  renderVolumes();
                }
            );
        }
    } catch(err) {
        showToast('Erro ao salvar! ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '💾 Salvar Mangá';
    }
  });


  /* UPLOAD OU LINK DE VOLUME NO MANGÁ ATIVO */
  const vMode = document.getElementById('vMode');
  const grpUrl = document.getElementById('grpUrl');
  const grpFile = document.getElementById('grpFile');
  
  vMode.addEventListener('change', () => {
     if (vMode.value === 'url') {
         grpUrl.style.display = 'block';
         grpFile.style.display = 'none';
     } else {
         grpUrl.style.display = 'none';
         grpFile.style.display = 'block';
     }
  });

  addVolumeBtn.addEventListener('click', () => {
      editingVolId = null;
      document.querySelector('#volumeModal .modal-header h2').textContent = 'Fazer Upload / Adicionar Link de Volume';
      volumeModal.classList.add('open');
      document.getElementById('vNumber').value = DB.getMangaVolumesFor(activeMangaId).length + 1;
      document.getElementById('vTitle').value = '';
      document.getElementById('vFile').value = '';
      document.getElementById('vUrl').value = '';
  });
  const closeVolumeModal = () => volumeModal.classList.remove('open');
  document.getElementById('volumeClose').addEventListener('click', closeVolumeModal);
  
  volumeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSalvarVolume');
      const vNum = parseInt(document.getElementById('vNumber').value);
      const vTit = document.getElementById('vTitle').value.trim();
      const vModeVal = vMode.value;
      const vUrlInput = document.getElementById('vUrl').value.trim();
      const vFileInput = document.getElementById('vFile');
      
      if (!vNum) return showToast('Preencha o número do volume', 'error');

      let fileToSend = null;
      let urlToSend = null;

      if (vModeVal === 'file') {
          if (!vFileInput.files.length && !editingVolId) return showToast('Escolha o arquivo PDF', 'error');
          if (vFileInput.files.length) {
              fileToSend = vFileInput.files[0];
              if(fileToSend.type !== 'application/pdf') return showToast('O arquivo precisa ser um documento PDF', 'error');
          }
      } else {
          if (!vUrlInput && !editingVolId) return showToast('Digite o link do Google Drive / PDF', 'error');
          let fUrl = vUrlInput;
          if (fUrl.includes('drive.google.com') && fUrl.includes('/view')) {
             fUrl = fUrl.replace('/view', '/preview');
             fUrl = fUrl.split('?')[0]; 
          }
          urlToSend = fUrl;
      }
      
      btn.disabled = true;
      btn.textContent = vModeVal === 'file' ? 'Enviando... (Isso pode demorar)' : 'Salvando...';
      
      try {
          if (editingVolId) {
             await DB.updateMangaVolume(activeMangaId, editingVolId, fileToSend, urlToSend, { volume: vNum, title: vTit });
             closeVolumeModal();
             renderVolumes();
             showDarkToast('Volume atualizado!');
          } else {
             const newVol = await DB.addMangaVolume(activeMangaId, fileToSend, urlToSend, { volume: vNum, title: vTit });
             closeVolumeModal();
             renderVolumes();
             
             showUndoToast(`Volume ${vNum} adicionado à coleção`,
               () => {},
               async () => {
                   await DB.deleteMangaVolume(activeMangaId, newVol.id);
                   renderVolumes();
               }
             );
          }
      } catch(err) {
          console.error(err);
          showToast('Erro ao processar arquivo/link ('+err.message+')', 'error');
      } finally {
          btn.disabled = false;
          btn.innerHTML = '📤 Iniciar Upload / Salvar Link';
      }
  });

  /* ANOTAÇÕES (MODAL GLOBAL) */
  const noteModal = document.getElementById('noteModal');
  const noteClose = document.getElementById('noteClose');
  const nPage = document.getElementById('nPage');
  const nText = document.getElementById('nText');
  const btnSalvarNote = document.getElementById('btnSalvarNote');
  const btnExcluirNote = document.getElementById('btnExcluirNote');
  let currentNoteVolId = null;

  function openNoteModal(v) {
      currentNoteVolId = v.id;
      const noteData = DB.getMangaNote(v.id) || {};
      nPage.value = noteData.page_bookmark || '';
      nText.value = noteData.note_text || '';
      document.querySelector('#noteModal .modal-header h2').textContent = `Anotações: Vol. ${v.volume_number}`;
      noteModal.classList.add('open');
  }

  noteClose.addEventListener('click', () => {
      noteModal.classList.remove('open');
      currentNoteVolId = null;
  });

  btnExcluirNote.addEventListener('click', async () => {
      if (!currentNoteVolId || !activeMangaId) return;
      btnExcluirNote.disabled = true;
      btnExcluirNote.textContent = 'Limpando...';
      try {
          await DB.saveMangaNote(activeMangaId, currentNoteVolId, '', '');
          noteModal.classList.remove('open');
          showDarkToast('Anotações excluídas!');
          renderVolumes();
      } catch (err) {
          showToast('Erro ao limpar: ' + err.message, 'error');
      } finally {
          btnExcluirNote.disabled = false;
          btnExcluirNote.innerHTML = '🗑️ Limpar';
      }
  });

  btnSalvarNote.addEventListener('click', async () => {
      if (!currentNoteVolId || !activeMangaId) return;
      btnSalvarNote.disabled = true;
      btnSalvarNote.textContent = 'Salvando...';
      try {
          await DB.saveMangaNote(activeMangaId, currentNoteVolId, nText.value, nPage.value);
          noteModal.classList.remove('open');
          showDarkToast('Anotações salvas com sucesso!');
          renderVolumes(); // Recarrega os volumes para mostrar as badges
      } catch (err) {
          showToast('Erro ao salvar: ' + err.message, 'error');
      } finally {
          btnSalvarNote.disabled = false;
          btnSalvarNote.innerHTML = '💾 Salvar Anotações';
      }
  });

  /* READER MODAL (TELA CHEIA PARA LER PDF) */
  async function openReader(url, titulo) {
    if (window.supabaseClient) {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (!session) {
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
    }
      // url é o link do pdf no Supabase Storage
      readerTitle.textContent = titulo;
      
      // Um iframe aponta direto pro PDF nativo do navegador
      // view=FitH tenta fazer o PDF ocupar toda a largura disponível
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
              // Tenta ativar o modo tela cheia do navegador
              if (modalContent.requestFullscreen) {
                  modalContent.requestFullscreen().catch(err => console.warn(err));
              } else if (modalContent.webkitRequestFullscreen) {
                  modalContent.webkitRequestFullscreen().catch(err => console.warn(err));
              }
          } else {
              btnFullscreen.innerHTML = '🔲 Ativar Tela Cheia';
              // Sai do modo tela cheia do navegador se estiver nele
              if (document.fullscreenElement) {
                  document.exitFullscreen().catch(err => console.warn(err));
              }
          }
      });
      // Escutar mudança de tela cheia do sistema (ex: tecla Esc ou botão nativo do navegador)
      document.addEventListener('fullscreenchange', () => {
          const modalContent = document.getElementById('readerModalContent');
          if (!document.fullscreenElement && modalContent.classList.contains('site-fullscreen')) {
             modalContent.classList.remove('site-fullscreen');
             document.body.classList.remove('reading-fullscreen');
             btnFullscreen.innerHTML = '🔲 Ativar Tela Cheia';
          }
      });
  }

  // Init
  renderMangaPills();
  renderVolumes();

  window.addEventListener('profileUpdated', () => { renderMangaPills(); });
  window.addEventListener('storage', (e) => {
    if (e.key === 'animehouse_store' || (e.key && e.key.startsWith('equipped_'))) renderMangaPills();
  });
});
