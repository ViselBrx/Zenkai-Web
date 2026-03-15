document.addEventListener('DOMContentLoaded', () => {
  const pillsContainer = document.getElementById('cartoonPills');
  const seasonsContainer = document.getElementById('seasonsContainer');
  const panel = document.getElementById('episodePanel');
  const noCartoonMsg = document.getElementById('noCartoonMsg');
  const noRegisteredMsg = document.getElementById('noCartoonRegistered');

  const addEpBtn = document.getElementById('addEpBtn');
  const epSeason = document.getElementById('epSeason');
  const epNumber = document.getElementById('epNumber');
  const epTitle = document.getElementById('epTitle');
  const epIframe = document.getElementById('epIframe');

  const watchModal = document.getElementById('watchModal');
  const watchTitle = document.getElementById('watchTitle');
  const watchFrame = document.getElementById('watchFrame');
  const watchDeleteBtn = document.getElementById('watchDeleteBtn');

  let activeCartoonId = null;
  let activeEpisodeId = null;
  let activeSeasonForWatch = null;

  function loadCartoons() {
    const list = DB.getCartoons();
    pillsContainer.innerHTML = '';
    
    if (list.length === 0) {
      noRegisteredMsg.style.display = 'block';
      noCartoonMsg.style.display = 'none';
      panel.style.display = 'none';
      return;
    }
    
    list.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'cartoon-pill';
      btn.innerHTML = c.capa 
        ? `<img src="${c.capa}" onerror="this.src='';this.style.background='var(--primary)'"> ${c.nome}`
        : `<div style="width:26px;height:26px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:12px;">🎬</div> ${c.nome}`;
      
      btn.onclick = () => selectCartoon(c.id, btn);
      pillsContainer.appendChild(btn);
    });

    const pending = localStorage.getItem('selectedCartoon');
    if (pending) {
      const btn = [...pillsContainer.children].find(b => b.textContent.includes(DB.getCartoonById(pending)?.nome));
      if (btn) selectCartoon(pending, btn);
      localStorage.removeItem('selectedCartoon');
    } else {
      noCartoonMsg.style.display = 'block';
    }
  }

  function selectCartoon(id, btnElement) {
    document.querySelectorAll('.cartoon-pill').forEach(b => b.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    
    activeCartoonId = id;
    noCartoonMsg.style.display = 'none';
    noRegisteredMsg.style.display = 'none';
    panel.style.display = 'block';
    
    epSeason.value = 1; epNumber.value = 1; epTitle.value = ''; epIframe.value = '';
    renderSeasons();
  }

  function renderSeasons() {
    seasonsContainer.innerHTML = '';
    if (!activeCartoonId) return;

    const allEps = DB.getEpisodesFor(activeCartoonId);
    const seasons = Object.keys(allEps).map(Number).sort((a,b) => a-b);

    if (seasons.length === 0) {
      seasonsContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">Nenhum episódio cadastrado.</p>';
      return;
    }

    seasons.forEach(seasonNum => {
      const eps = allEps[seasonNum].sort((a,b) => Number(a.epNumber) - Number(b.epNumber));
      
      const sec = document.createElement('div');
      sec.className = 'season-section';
      
      const head = document.createElement('div');
      head.className = 'season-header';
      head.innerHTML = `
        <div style="display:flex;align-items:center;gap:15px;">
          <h3>Temporada ${seasonNum}</h3>
          <span class="badge-pill badge-accent">${eps.length} Eps</span>
        </div>
        <div style="display:flex;align-items:center;gap:15px;">
          <button class="btn btn-danger btn-sm" onclick="deleteSeason(event, ${seasonNum})">Excluir Temp.</button>
          <span class="season-chevron">▼</span>
        </div>
      `;

      const grid = document.createElement('div');
      grid.className = 'episodes-grid open';
      head.classList.add('open');
      
      head.onclick = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        grid.classList.toggle('open');
        head.classList.toggle('open');
      };

      eps.forEach(ep => {
        const card = document.createElement('div');
        card.className = 'episode-card';
        card.innerHTML = `
          <div style="position:relative;background:#000;cursor:pointer;" onclick="openWatchModal('${ep.id}', ${seasonNum})">
            <div style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:var(--bg-surface);">
              <span style="font-size:3rem;text-shadow:0 0 10px rgba(0,0,0,0.5);">▶️</span>
            </div>
            <div style="position:absolute;bottom:0;left:0;right:0;padding:10px;background:linear-gradient(transparent, rgba(0,0,0,0.9));color:#fff;font-weight:700;">
              Episódio ${ep.epNumber}
            </div>
          </div>
          <div class="episode-label" style="justify-content:space-between">
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${ep.title || ''}">${ep.title || 'Sem título'}</span>
            <button class="btn btn-ghost btn-sm" onclick="editEpisode(event, '${ep.id}', ${seasonNum})" style="padding:2px 5px;font-size:0.8rem">✏️</button>
          </div>
        `;
        grid.appendChild(card);
      });

      sec.appendChild(head);
      sec.appendChild(grid);
      seasonsContainer.appendChild(sec);
    });
  }

  let editingEpId = null;
  let editingSeason = null;

  window.editEpisode = (e, epId, seasonNum) => {
    e.stopPropagation();
    const sEps = DB.getEpisodesFor(activeCartoonId)[seasonNum];
    const ep = sEps.find(x => x.id === epId);
    if (!ep) return;

    editingEpId = epId;
    editingSeason = seasonNum;

    epSeason.value = seasonNum;
    epNumber.value = ep.epNumber;
    epTitle.value = ep.title || '';
    epIframe.value = ep.iframe;

    addEpBtn.textContent = 'Salvar Alterações';
    addEpBtn.classList.replace('btn-primary', 'btn-accent');
    
    // Rolar para cima para o formulário
    document.querySelector('.page-header').scrollIntoView({ behavior: 'smooth' });
    
    // Adicionar botão cancelar se não existir
    if(!document.getElementById('cancelEditBtn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.className = 'btn btn-ghost';
        cancelBtn.style.marginLeft = '10px';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.onclick = resetEpForm;
        addEpBtn.parentNode.appendChild(cancelBtn);
    }
  };

  function resetEpForm() {
    editingEpId = null;
    editingSeason = null;
    epTitle.value = '';
    epIframe.value = '';
    addEpBtn.textContent = 'Adicionar';
    addEpBtn.classList.replace('btn-accent', 'btn-primary');
    const cancelBtn = document.getElementById('cancelEditBtn');
    if(cancelBtn) cancelBtn.remove();
  }

  addEpBtn.addEventListener('click', () => {
    if (!activeCartoonId) return showToast('Selecione um desenho primeiro', 'error');
    
    const s = parseInt(epSeason.value);
    const e = parseInt(epNumber.value);
    let i = epIframe.value.trim();

    if (!s || !e || !i) return showToast('Preencha temporada, número e iframe/URL', 'error');

    if (i.startsWith('http') && !i.includes('<iframe')) {
      i = `<iframe src="${i}" frameborder="0" height="400" scrolling="no" width="640" allow="encrypted-media" allowFullScreen></iframe>`;
    }

    const epData = {
      epNumber: e,
      title: epTitle.value.trim(),
      iframe: i
    };

    if (editingEpId) {
        DB.updateEpisode(activeCartoonId, editingSeason, editingEpId, epData);
        showToast('Episódio atualizado!');
        resetEpForm();
    } else {
        DB.addEpisode(activeCartoonId, s, epData);
        showToast(`Adicionado: Temp ${s} - Ep ${e}`);
        epNumber.value = e + 1; 
        epTitle.value = '';
        epIframe.value = '';
    }

    renderSeasons();
  });

  window.deleteSeason = (e, seasonNum) => {
    e.stopPropagation();
    if (confirm(`Excluir toda a Temporada ${seasonNum}?`)) {
      DB.deleteSeason(activeCartoonId, seasonNum);
      showToast('Temporada excluída');
      if(editingSeason === seasonNum) resetEpForm();
      renderSeasons();
    }
  };

  window.openWatchModal = (epId, seasonNum) => {
    const sEps = DB.getEpisodesFor(activeCartoonId)[seasonNum];
    const ep = sEps.find(x => x.id === epId);
    if (!ep) return;

    activeEpisodeId = epId;
    activeSeasonForWatch = seasonNum;
    
    watchTitle.textContent = `T${seasonNum}:E${ep.epNumber} - ${ep.title || 'Assistir'}`;
    watchFrame.innerHTML = ep.iframe;
    watchModal.classList.add('open');
  };

  const closeWatch = () => {
    watchModal.classList.remove('open');
    watchFrame.innerHTML = '';
  };
  document.getElementById('watchClose').addEventListener('click', closeWatch);

  watchDeleteBtn.addEventListener('click', () => {
    if (confirm('Remover este episódio?')) {
      DB.deleteEpisode(activeCartoonId, activeSeasonForWatch, activeEpisodeId);
      showToast('Episódio removido');
      closeWatch();
      renderSeasons();
    }
  });

  loadCartoons();
});
