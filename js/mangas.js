document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();

  const mangaPills = document.getElementById('mangaPills');
  const addMangaBtn = document.getElementById('addMangaBtn');
  const searchManga = document.getElementById('searchManga');
  const noMangaMsg = document.getElementById('noMangaMsg');
  
  const volumesPanel = document.getElementById('volumesPanel');
  const volumesGrid = document.getElementById('volumesGrid');
  const mangaPanelTitle = document.getElementById('mangaPanelTitle');
  
  const mangaModal = document.getElementById('mangaModal');
  const mangaForm = document.getElementById('mangaForm');
  
  const volumeModal = document.getElementById('volumeModal');
  const volumeForm = document.getElementById('volumeForm');
  const addVolumeBtn = document.getElementById('addVolumeBtn');
  
  const readerModal = document.getElementById('readerModal');
  const readerFrame = document.getElementById('readerFrame');
  const readerTitle = document.getElementById('readerTitle');

  let activeMangaId = null;
  let editingMangaId = null;
  let editingVolId = null;

  // Renderizar a lista de mangás em formato de pílulas (seletor)
  function renderMangaPills() {
    const term = searchManga.value.toLowerCase();
    const mangas = DB.getMangas().filter(m => {
        if (window.pendingDeletions && window.pendingDeletions.has(m.id)) return false;
        return m.nome.toLowerCase().includes(term);
    });

    mangaPills.innerHTML = '';
    
    mangas.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'manga-pill' + (m.id === activeMangaId ? ' active' : '');
      const initial = m.nome.charAt(0).toUpperCase();
      btn.innerHTML = `<span style="background:var(--primary);color:var(--text);width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.8rem">${initial}</span> ${m.nome}`;
      
      // Clique rápido para selecionar
      btn.addEventListener('click', () => {
        activeMangaId = m.id;
        renderMangaPills(); // Atualiza pill ativa
        renderVolumes();
      });

      // Duplo clique para excluir mangá inteiro
      btn.addEventListener('dblclick', () => {
         const idToHide = m.id;
         if (!window.pendingDeletions) window.pendingDeletions = new Set();
         window.pendingDeletions.add(idToHide);
         
         if (activeMangaId === idToHide) {
             activeMangaId = null;
             renderVolumes();
         }
         renderMangaPills();
         
         showUndoToast(`Excluindo coleção "${m.nome}"...`, 
            () => {
              if (window.pendingDeletions.has(idToHide)) {
                DB.deleteManga(idToHide);
                window.pendingDeletions.delete(idToHide);
                renderMangaPills();
              }
            },
            () => {
              window.pendingDeletions.delete(idToHide);
              renderMangaPills();
            }
         );
      });

      mangaPills.appendChild(btn);
    });
  }

  // Renderizar a estante de volumes (PDFs do mangá selecionado)
  function renderVolumes() {
    if (!activeMangaId) {
      noMangaMsg.style.display = 'block';
      volumesPanel.style.display = 'none';
      return;
    }
    const mgr = DB.getCartoonById(activeMangaId) || DB.getMangas().find(x=>x.id===activeMangaId);
    if(mgr) {
       mangaPanelTitle.innerHTML = `<span style="color:var(--text)">Leitura:</span> ${mgr.nome}`;
    }

    noMangaMsg.style.display = 'none';
    volumesPanel.style.display = 'block';

    const volumes = DB.getMangaVolumesFor(activeMangaId).filter(v => {
        if (window.pendingDeletions && window.pendingDeletions.has(v.id)) return false;
        return true;
    });

    volumesGrid.innerHTML = '';
    
    if(volumes.length === 0) {
        volumesGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">Nenhum volume nesta visualização.</p>`;
    }

    volumes.forEach(v => {
      const card = document.createElement('div');
      card.className = 'volume-card';
      
      const titleStr = v.title ? v.title : `Volume ${v.volume_number}`;
      
      card.innerHTML = `
        <span class="vol-icon">📖</span>
        <div class="vol-title">Volume ${v.volume_number}</div>
        <div class="vol-sub">${v.title || ''}</div>
        <button class="vol-actions-ui btn-edit-vol" title="Editar Volume" style="position:absolute; top:10px; left:10px; opacity:0; transition:0.2s; background:var(--bg-card); border:1px solid var(--primary); color:var(--primary); cursor:pointer; font-size:1.1rem; border-radius:50%; width:35px; height:35px; display:flex; align-items:center; justify-content:center;">✏️</button>
        <button class="vol-actions-ui btn-del-vol" title="Apagar Volume" style="position:absolute; top:10px; right:10px; opacity:0; transition:0.2s; background:rgba(255,0,0,0.1); border:1px solid rgba(255,0,0,0.3); color:var(--danger); cursor:pointer; font-size:1.1rem; border-radius:50%; width:35px; height:35px; display:flex; align-items:center; justify-content:center;">✖</button>
      `;

      // Clicar para abrir leitor PDF
      card.addEventListener('click', (e) => {
        if(e.target.closest('.vol-actions-ui')) return; // ignora se clicou num dos botões
        openReader(v.pdf_url, `${mgr.nome} - ${titleStr}`);
      });
      
      // Mostrar botões no Hover
      card.addEventListener('mouseenter', () => {
         card.querySelectorAll('.vol-actions-ui').forEach(b => b.style.opacity = '1');
      });
      card.addEventListener('mouseleave', () => {
         card.querySelectorAll('.vol-actions-ui').forEach(b => b.style.opacity = '0');
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
        if (!window.pendingDeletions) window.pendingDeletions = new Set();
        window.pendingDeletions.add(idToHide);
        renderVolumes();
        
        showUndoToast(`Excluindo Volume ${v.volume_number}...`, 
            () => {
              if (window.pendingDeletions.has(idToHide)) {
                DB.deleteMangaVolume(activeMangaId, idToHide);
                window.pendingDeletions.delete(idToHide);
                renderVolumes();
              }
            },
            () => {
              window.pendingDeletions.delete(idToHide);
              renderVolumes();
            }
        );
      });

      volumesGrid.appendChild(card);
    });
  }

  /* PESQUISA */
  searchManga.addEventListener('input', renderMangaPills);

  /* MANGA MODAL (CRIAR PASTA DO MANGÁ) */
  addMangaBtn.addEventListener('click', () => {
    editingMangaId = null;
    mangaModal.classList.add('open');
    mangaForm.reset();
  });
  const closeMangaModal = () => mangaModal.classList.remove('open');
  document.getElementById('mangaClose').addEventListener('click', closeMangaModal);
  
  mangaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarManga');
    const nome = document.getElementById('mNome').value.trim();
    if (!nome) return showToast('Preencha o nome do mangá', 'error');

    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const novo = await DB.addManga({ nome });
        closeMangaModal();
        activeMangaId = novo.id; // foca no novo mangá
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
    } catch(err) {
        showToast('Erro ao salvar!', 'error');
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

  /* READER MODAL (TELA CHEIA PARA LER PDF) */
  function openReader(url, titulo) {
      // url é o link do pdf no Supabase Storage
      readerTitle.textContent = titulo;
      
      // Um iframe aponta direto pro PDF nativo do navegador
      readerFrame.src = url + '#toolbar=0'; 
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
         try {
           if (readerFrame.requestFullscreen) {
              readerFrame.requestFullscreen();
           } else if (readerFrame.webkitRequestFullscreen) {
              readerFrame.webkitRequestFullscreen();
           } else if (readerFrame.msRequestFullscreen) {
              readerFrame.msRequestFullscreen();
           }
         } catch(e) {
             showToast('O navegador bloqueou a tela cheia. Tente F11.', 'error');
         }
      });
  }

  // Init
  renderMangaPills();
  renderVolumes();
});
