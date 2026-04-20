document.addEventListener('DOMContentLoaded', async () => {
    await DB.init();
    if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
    
    // Globals para o HTML string funcionar (onclick="...")
    window.openWatchModal = (id) => {
        const v = _findVideo(id);
        if (!v) return;

        const watchModal = document.getElementById('watchModal');
        const watchTitle = document.getElementById('watchTitle');
        const watchFrame = document.getElementById('watchFrame');
        
        watchTitle.textContent = v.title;
        watchFrame.innerHTML = v.iframe || '<div style="color:#fff;padding:20px;">Iframe não disponível</div>';
        
        window.currentlyWatchingId = id;
        _updateWatchModalBadge(id);

        if (typeof HistoryTracker !== 'undefined' && typeof window.supabaseClient !== 'undefined') {
            try {
                const playlist = DB.getYoutubePlaylistById(activePlaylistId);
                HistoryTracker.logActivity(
                    "youtube_video",
                    v.id,
                    playlist?.id,
                    v.title || `Vídeo`,
                    playlist?.nome || "Playlist",
                    v.iframe,
                    playlist?.capa
                );
            } catch (e) {}
        }
        
        watchModal.classList.add('open');
    };

    window.editVideo = (vId) => {
        const v = _findVideo(vId);
        if (!v) return;

        editingVideoId = v.id;
        document.getElementById('videoTitle').value = v.title;
        document.getElementById('videoIframe').value = v.iframe;

        document.getElementById('addVideoBtn').textContent = 'Salvar Alterações';
        document.getElementById('formActionTitle').textContent = '✏️ Editar Vídeo';
        document.getElementById('cancelVideoBtn').style.display = 'inline-flex';
        
        document.querySelector('.page-header').scrollIntoView({ behavior: 'smooth' });
    };

    function _findVideo(id) {
        let v = null;
        const playlists = DB.getYoutubePlaylists();
        for (const pl of playlists) {
            v = DB.getYoutubeVideosFor(pl.id).find(x => x.id === id);
            if (v) {
                activePlaylistId = pl.id;
                return v;
            }
        }
        return null;
    }

    const playlistPills = document.getElementById('playlistPills');
    const noPlaylistMsg = document.getElementById('noPlaylistMsg');
    const noPlaylistRegistered = document.getElementById('noPlaylistRegistered');
    const videosPanel = document.getElementById('videosPanel');
    const videosContainer = document.getElementById('videosContainer');
    const videoForm = document.getElementById('videoForm');
    const cancelVideoBtn = document.getElementById('cancelVideoBtn');
    
    let activePlaylistId = null;
    let editingVideoId = null;
    window.currentlyWatchingId = null;

    const playlists = DB.getYoutubePlaylists();
    if (playlists.length === 0) {
        noPlaylistRegistered.style.display = 'block';
    } else {
        playlists.forEach(pl => {
            const pill = document.createElement('div');
            pill.className = 'cartoon-pill';
            pill.dataset.id = pl.id;
            const thumb = pl.capa 
                ? `<img src="${pl.capa}" alt="capa" onerror="this.src='assets/tryhard.png'">`
                : `<div style="width:26px;height:26px;border-radius:50%;background:var(--accent2);display:flex;align-items:center;justify-content:center;font-size:12px;color:white">▶️</div>`;
            pill.innerHTML = `${thumb} ${pl.nome}`;
            pill.onclick = () => selectPlaylist(pl.id, pill);
            playlistPills.appendChild(pill);
        });

        const urlParams = new URLSearchParams(window.location.search);
        const startId = localStorage.getItem('selectedYoutubePlaylist') || urlParams.get('id');
        if (startId && playlists.some(c => c.id === startId)) {
            const btn = [...playlistPills.querySelectorAll('.cartoon-pill')].find(b => b.dataset.id === startId);
            selectPlaylist(startId, btn);
            localStorage.removeItem('selectedYoutubePlaylist');
        } else {
            noPlaylistMsg.style.display = 'block';
        }
    }

    function selectPlaylist(id, btnElement) {
        activePlaylistId = id;
        document.querySelectorAll('.cartoon-pill').forEach(p => p.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');
        noPlaylistMsg.style.display = 'none';
        videosPanel.style.display = 'block';
        resetForm();
        renderVideos();
    }

    function renderVideos() {
        videosContainer.innerHTML = '';
        if (!activePlaylistId) return;

        videosContainer.classList.remove('content-animate');
        void videosContainer.offsetWidth; 
        videosContainer.classList.add('content-animate');

        const videos = DB.getYoutubeVideosFor(activePlaylistId);
        if (videos.length === 0) {
            videosContainer.innerHTML = '<p style="color:var(--text-muted);width:100%;text-align:center;padding:2rem;">Nenhum vídeo adicionado.</p>';
            return;
        }

        videos.forEach((v, index) => {
            if (window.pendingDeletions && window.pendingDeletions.has(v.id)) return;
            const isW = Watched.isWatched(v.id);
            const card = document.createElement('div');
            card.className = 'episode-card' + (isW ? ' is-watched' : '');
            
            card.innerHTML = `
                <div style="position:relative;background:#000;cursor:pointer;" onclick="openWatchModal('${v.id}')">
                    <div class="episode-thumb-inner" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:var(--bg-surface);">
                        <span style="font-size:3rem;text-shadow:0 0 10px rgba(0,0,0,0.5);">▶️</span>
                    </div>
                    <div class="watched-overlay"><div class="watched-badge-icon">✓</div></div>
                    <div style="position:absolute;bottom:0;left:0;right:0;padding:10px;background:linear-gradient(transparent, rgba(0,0,0,0.9));color:#fff;font-weight:700;">
                        VÍDEO ${index + 1}
                    </div>
                </div>
                <div class="episode-label" style="justify-content:space-between">
                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;" title="${v.title}" onclick="openWatchModal('${v.id}')">${v.title}</span>
                    <div class="card-btns" style="display:flex;gap:5px;align-items:center;">
                        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); editVideo('${v.id}')" style="padding:2px 5px;font-size:0.8rem">✏️</button>
                    </div>
                </div>
            `;
            
            if (typeof createWatchedBtn !== 'undefined') {
                const btnsDiv = card.querySelector('.card-btns');
                const wBtn = createWatchedBtn(v.id, (id, now) => {
                    card.classList.toggle('is-watched', now);
                    if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
                }, 'youtube_video');
                btnsDiv.prepend(wBtn);
            }
            videosContainer.appendChild(card);
        });
    }

    videoForm.onsubmit = async (e) => {
        e.preventDefault();
        const vTitle = document.getElementById('videoTitle');
        const vIframe = document.getElementById('videoIframe');
        const titleText = vTitle.value.trim();
        const iframeText = vIframe.value.trim();

        try {
            if (editingVideoId) {
                await DB.updateYoutubeVideo(activePlaylistId, editingVideoId, { title: titleText, iframe: iframeText });
                showDarkToast('Vídeo atualizado!');
                resetForm();
            } else {
                const newItem = await DB.addYoutubeVideo(activePlaylistId, { title: titleText, iframe: iframeText });
                showUndoToast('Vídeo adicionado!', () => {}, async () => {
                    await DB.deleteYoutubeVideo(activePlaylistId, newItem.id);
                    renderVideos();
                    if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
                });
                vTitle.value = ''; vIframe.value = '';
            }
            renderVideos();
            if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    cancelVideoBtn.onclick = resetForm;

    function resetForm() {
        editingVideoId = null;
        document.getElementById('videoTitle').value = '';
        document.getElementById('videoIframe').value = '';
        document.getElementById('formActionTitle').textContent = '➕ Adicionar Vídeo';
        document.getElementById('addVideoBtn').textContent = 'Adicionar';
        cancelVideoBtn.style.display = 'none';
    }

    function _updateWatchModalBadge(id) {
        const badge = document.getElementById('watchedModalBadge');
        if (!badge) return;
        const isW = Watched.isWatched(id);
        badge.className = 'watched-modal-badge ' + (isW ? 'is-watched' : 'not-watched');
        badge.innerHTML = isW ? '✓ Assistido' : '○ Marcar como Assistido';
        badge.onclick = async () => {
            const now = await Watched.toggle(id, 'youtube_video');
            _updateWatchModalBadge(id);
            renderVideos();
            if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
        };
    }

    document.getElementById('watchDeleteBtn').onclick = async () => {
        const id = window.currentlyWatchingId;
        if (!id || !activePlaylistId) return;
        
        document.getElementById('watchModal').classList.remove('open');
        if (!window.pendingDeletions) window.pendingDeletions = new Set();
        window.pendingDeletions.add(id);
        renderVideos();

        showUndoToast('Excluindo vídeo...', () => {
            if (window.pendingDeletions.has(id)) {
                DB.deleteYoutubeVideo(activePlaylistId, id);
                window.pendingDeletions.delete(id);
                renderVideos();
                if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
            }
        }, () => {
            window.pendingDeletions.delete(id);
            renderVideos();
        });
    };

    document.getElementById('watchClose').onclick = () => {
        const m = document.getElementById('watchModal');
        m.classList.remove('open');
        document.getElementById('watchFrame').innerHTML = '';
        window.currentlyWatchingId = null;
    };
});
