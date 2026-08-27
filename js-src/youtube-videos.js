document.addEventListener('DOMContentLoaded', async () => {
    await DB.init(['youtubePlaylists', 'youtubeVideos']);
    if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');

    // ── Estado ────────────────────────────────────────────────────────────────
    let activePlaylistId = null;
    let editingVideoId = null;
    window.currentlyWatchingId = null;
    let userFavs = { playlists: new Set(), videos: new Set() };

    // ── Refs DOM ──────────────────────────────────────────────────────────────
    const playlistPills      = document.getElementById('playlistPills');
    const noPlaylistMsg      = document.getElementById('noPlaylistMsg');
    const noPlaylistRegistered = document.getElementById('noPlaylistRegistered');
    const videosPanel        = document.getElementById('videosPanel');
    const videosContainer    = document.getElementById('videosContainer');
    const videoForm          = document.getElementById('videoForm');
    const cancelVideoBtn     = document.getElementById('cancelVideoBtn');

    // ── YouTube API State ─────────────────────────────────────────────────────
    let ytPlayer = null;
    let timeTrackInterval = null;

    // Carregar API do YouTube
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // ── Funções ───────────────────────────────────────────────────────────────
    async function loadFavorites() {
        try {
            const [plFavs, vidFavs] = await Promise.all([
                DB.getFavorites('youtube'),
                DB.getFavorites('youtube_video')
            ]);
            userFavs.playlists = new Set(plFavs.map(f => f.content_id));
            userFavs.videos = new Set(vidFavs.map(f => f.content_id));
        } catch (e) {
            console.warn("Erro ao carregar favoritos:", e);
        }
    }
    function resetForm() {
        editingVideoId = null;
        document.getElementById('videoTitle').value = '';
        document.getElementById('videoIframe').value = '';
        document.getElementById('formActionTitle').textContent = '➕ Adicionar Vídeo';
        document.getElementById('addVideoBtn').textContent = 'Adicionar';
        cancelVideoBtn.style.display = 'none';
    }

    function _getYoutubeId(str) {
        if (!str) return null;
        // Regex para extrair ID de iframe ou URL comum
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = str.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function _formatTime(seconds) {
        seconds = parseFloat(seconds || 0);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    function _parseTime(str) {
        if (!str) return 0;
        const clean = str.replace(/[^\d:]/g, '');
        const parts = clean.split(':').map(Number);
        if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
        if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
        if (parts.length === 1) return (parts[0] || 0);
        return 0;
    }

    function renderVideos() {
        videosContainer.innerHTML = '';
        if (!activePlaylistId) return;

        videosContainer.classList.remove('content-animate');
        void videosContainer.offsetWidth;
        videosContainer.classList.add('content-animate');

        const videos = DB.getYoutubeVideosFor(activePlaylistId).map((v, index) => ({ ...v, _originIndex: index }));
        if (videos.length === 0) {
            videosContainer.innerHTML = '<p style="color:var(--text-muted);width:100%;text-align:center;padding:2rem;">Nenhum vídeo adicionado.</p>';
            return;
        }

        const frag = document.createDocumentFragment();

        // Ordenar vídeos: favoritos no topo
        videos.sort((a, b) => {
            const aFav = userFavs.videos.has(a.id) ? 1 : 0;
            const bFav = userFavs.videos.has(b.id) ? 1 : 0;
            if (aFav !== bFav) return bFav - aFav;
            return a._originIndex - b._originIndex;
        });

        videos.forEach((v) => {
            const isW = Watched.isWatched(v.id);
            const isFav = userFavs.videos.has(v.id);
            const ytId = _getYoutubeId(v.iframe);
            const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
            
            const card = document.createElement('div');
            card.className = 'episode-card' + (isW ? ' is-watched' : '');
            card.dataset.originIndex = String(v._originIndex);

            // Carregar tempo saved para mostrar no card
            const uid = window.DB?._store?.profile?.id || 'guest';
            const savedTime = localStorage.getItem(`animehouse_yt_time_${uid}_${v.id}`);
            const timeDisplay = savedTime ? `<div style="position:absolute; top:10px; right:10px; background:rgba(var(--primary-rgb), 0.9); color:#fff; padding:3px 10px; border-radius:20px; font-size:0.7rem; font-weight:700; z-index:2; box-shadow:0 2px 8px rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.2);">${!isNaN(savedTime) && savedTime !== '' ? _formatTime(parseFloat(savedTime)) : savedTime}</div>` : '';

            card.innerHTML = `
                <div style="position:relative;background:#000;cursor:pointer;" onclick="openWatchModal('${v.id}')">
                    <div class="episode-thumb-inner" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;background:${thumbUrl ? `url(${thumbUrl}) center/cover` : 'var(--bg-surface)'};">
                        ${!thumbUrl ? '<span style="font-size:3rem;text-shadow:0 0 10px rgba(0,0,0,0.5);">▶️</span>' : ''}
                    </div>
                    ${timeDisplay}
                    <div class="watched-overlay"><div class="watched-badge-icon">✓</div></div>
                    <div style="position:absolute;bottom:0;left:0;right:0;padding:10px;background:linear-gradient(transparent, rgba(0,0,0,0.9));color:#fff;font-weight:700;">
                        VÍDEO
                    </div>
                </div>
                <div class="episode-label" style="justify-content:space-between">
                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;" title="${v.title}" onclick="openWatchModal('${v.id}')">${v.title}</span>
                    <div class="card-btns" style="display:flex;gap:5px;align-items:center;">
                        <button class="fav-star ${isFav ? 'active' : ''} fav-star-sm" data-id="${v.id}" title="${isFav ? 'Desmarcar' : 'Marcar'}">
                            ${isFav ? '★' : '☆'}
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); editVideo('${v.id}')" style="padding:2px 5px;font-size:0.8rem">✏️</button>
                    </div>
                </div>
            `;

            const favBtn = card.querySelector('.fav-star');
            if (favBtn) {
                favBtn.onclick = async (e) => {
                    e.stopPropagation();
                    try {
                        const playlist = DB.getYoutubePlaylistById(activePlaylistId);
                        const res = await DB.toggleFavorite(v.id, 'youtube_video', { 
                            title: v.title, 
                            playlistTitle: playlist?.nome,
                            cover: playlist?.capa 
                        });
                        const isAdded = res.action === 'added';
                        if (isAdded) userFavs.videos.add(v.id); else userFavs.videos.delete(v.id);
                        
                        favBtn.classList.toggle('active', isAdded);
                        favBtn.innerHTML = isAdded ? '★' : '☆';
                        favBtn.title = isAdded ? 'Desmarcar' : 'Marcar';
                        
                        showToast(isAdded ? `"${v.title}" adicionado aos favoritos!` : `"${v.title}" removido dos favoritos.`);
                        
                        // Reordenar cards se necessário
                        setTimeout(() => {
                            const cards = [...videosContainer.children];
                            cards.sort((a, b) => {
                                const aF = a.querySelector('.fav-star')?.classList.contains('active') ? 1 : 0;
                                const bF = b.querySelector('.fav-star')?.classList.contains('active') ? 1 : 0;
                                if (aF !== bF) return bF - aF;
                                return parseInt(a.dataset.originIndex) - parseInt(b.dataset.originIndex);
                            });
                            cards.forEach(c => videosContainer.appendChild(c));
                        }, 500);
                    } catch (err) {
                        showToast(err.message || 'Erro ao favoritar.', 'error');
                    }
                };
            }

            if (typeof createWatchedBtn !== 'undefined') {
                const btnsDiv = card.querySelector('.card-btns');
                const wBtn = createWatchedBtn(v.id, (id, now) => {
                    card.classList.toggle('is-watched', now);
                    if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
                }, 'youtube_video');
                btnsDiv.prepend(wBtn);
            }
            frag.appendChild(card);
        });

        videosContainer.appendChild(frag);
    }

    function _findVideo(id) {
        const playlists = DB.getYoutubePlaylists();
        for (const pl of playlists) {
            const v = DB.getYoutubeVideosFor(pl.id).find(x => x.id === id);
            if (v) {
                activePlaylistId = pl.id;
                return v;
            }
        }
        return null;
    }

    function _updateWatchModalBadge(id) {
        const badge = document.getElementById('watchedModalBadge');
        if (!badge) return;
        const isW = Watched.isWatched(id);
        badge.className = 'watched-modal-badge ' + (isW ? 'is-watched' : 'not-watched');
        badge.innerHTML = isW ? '✓ Assistido' : '○ Marcar como Assistido';
        badge.onclick = async () => {
            await Watched.toggle(id, 'youtube_video');
            _updateWatchModalBadge(id);
            renderVideos();
            if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
        };
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

    // ── Globals para onclick inline no HTML ───────────────────────────────────
    window.openWatchModal = (id) => {
        if (typeof window.requireContentAccess === 'function' && !window.requireContentAccess()) return;
        const v = _findVideo(id);
        if (!v) return;

        const watchFrame = document.getElementById('watchFrame');
        document.getElementById('watchTitle').textContent = v.title;
        
        // Limpar e preparar player
        watchFrame.innerHTML = '<div id="ytPlayerNode"></div>';

        window.currentlyWatchingId = id;
        _updateWatchModalBadge(id);

        const ytId = _getYoutubeId(v.iframe);
        if (ytId) {
            // Inicializar Player da API
            if (window.YT && YT.Player) {
                const uid = window.DB?._store?.profile?.id || 'guest';
                const savedTime = parseFloat(localStorage.getItem(`animehouse_yt_time_${uid}_${id}`) || 0);

                ytPlayer = new YT.Player('ytPlayerNode', {
                    height: '100%',
                    width: '100%',
                    videoId: ytId,
                    playerVars: {
                        'autoplay': 1,
                        'modestbranding': 1,
                        'rel': 0,
                        'start': Math.floor(savedTime)
                    },
                    events: {
                        'onReady': (event) => {
                            // Carregado
                        }
                    }
                });

                // O usuário prefere salvamento manual via botão
                if (timeTrackInterval) clearInterval(timeTrackInterval);
            } else {
                watchFrame.innerHTML = v.iframe; // Fallback se a API falhar
            }
        } else {
            watchFrame.innerHTML = v.iframe || '<div style="color:#fff;padding:20px;">Iframe não disponível</div>';
        }

        // Lógica do input manual de tempo
        const noteInput = document.getElementById('watchTimeNote');
        const saveNoteBtn = document.getElementById('saveTimeNoteBtn');
        if (noteInput && saveNoteBtn) {
            const uid = window.DB?._store?.profile?.id || 'guest';
            const rawVal = (localStorage.getItem(`animehouse_yt_time_${uid}_${id}`) || '').slice(0, 20);
            
            // Se for número puro (automático), formata. Se for texto/manual, mostra como está.
            if (!isNaN(rawVal) && rawVal !== '') {
                noteInput.value = _formatTime(parseFloat(rawVal));
            } else {
                noteInput.value = rawVal;
            }

            saveNoteBtn.onclick = () => {
                const val = noteInput.value.trim().slice(0, 20);
                localStorage.setItem(`animehouse_yt_time_${uid}_${id}`, val);
                
                // Tenta dar seek apenas se parecer um tempo (contém : ou é número)
                if (ytPlayer && ytPlayer.seekTo && (val.includes(':') || !isNaN(val))) {
                    const seconds = _parseTime(val);
                    if (seconds > 0) {
                        ytPlayer.seekTo(seconds, true);
                        ytPlayer.playVideo();
                    }
                }
                showToast('Nota salva!');
                renderVideos(); // Atualiza o card
            };
        }

        if (typeof HistoryTracker !== 'undefined' && typeof window.supabaseClient !== 'undefined') {
            try {
                const playlist = DB.getYoutubePlaylistById(activePlaylistId);
                HistoryTracker.track({
                    contentType: 'youtube_video',
                    contentId: v.id,
                    title: v.title || 'Vídeo',
                    subtitle: playlist?.nome || 'Playlist',
                    coverUrl: playlist?.capa,
                    route: 'youtube-videos.html',
                    payload: { playlistId: playlist?.id, iframe: v.iframe }
                });
            } catch (e) {}
        }

        document.getElementById('watchModal').classList.add('open');
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

    // ── Listeners ─────────────────────────────────────────────────────────────
    ['videoTitle', 'videoIframe'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => { el.style.borderColor = ''; });
    });

    videoForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!activePlaylistId) {
            showToast('Selecione uma playlist primeiro', 'error');
            return;
        }

        const vTitle = document.getElementById('videoTitle');
        const vIframe = document.getElementById('videoIframe');
        const titleText = vTitle.value.trim();
        const iframeText = vIframe.value.trim();

        if (!titleText || !iframeText) {
            showToast('Preencha os campos obrigatórios (*)', 'error');
            return;
        }

        const btn = document.getElementById('addVideoBtn');
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = '⏳ Salvando...';

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
                vTitle.value = '';
                vIframe.value = '';
            }
            renderVideos();
            if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
        } catch (err) {
            showToast(err.message || 'Erro ao salvar vídeo', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });

    cancelVideoBtn.onclick = resetForm;

    document.getElementById('watchDeleteBtn').onclick = async () => {
        const id = window.currentlyWatchingId;
        if (!id || !activePlaylistId) return;

        document.getElementById('watchModal').classList.remove('open');
        showUndoToast('Excluindo vídeo...', () => {
            DB.deleteYoutubeVideo(activePlaylistId, id);
            window.clearPendingDeletion?.(id);
            renderVideos();
            if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
        }, () => {
            window.clearPendingDeletion?.(id);
            renderVideos();
            if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
        }, () => {
            window.markPendingDeletion?.(id);
            renderVideos();
            if (typeof StatsManager !== 'undefined') StatsManager.render('youtube');
        });
    };

    document.getElementById('watchClose').onclick = () => {
        if (timeTrackInterval) clearInterval(timeTrackInterval);
        if (ytPlayer) {
            ytPlayer.destroy();
            ytPlayer = null;
        }
        document.getElementById('watchModal').classList.remove('open');
        document.getElementById('watchFrame').innerHTML = '';
        window.currentlyWatchingId = null;
        renderVideos(); // Atualiza o tempo no card ao fechar
    };

    // ── Inicializa playlists ───────────────────────────────────────────────────
    async function init() {
        await loadFavorites();
        const playlists = DB.getYoutubePlaylists().map((pl, idx) => ({ ...pl, _originIndex: idx }));
        
        if (playlists.length === 0) {
            noPlaylistRegistered.style.display = 'block';
        } else {
            // Ordenar playlists: favoritos no topo
            playlists.sort((a, b) => {
                const aFav = userFavs.playlists.has(a.id) ? 1 : 0;
                const bFav = userFavs.playlists.has(b.id) ? 1 : 0;
                if (aFav !== bFav) return bFav - aFav;
                return a._originIndex - b._originIndex;
            });

            const fragPills = document.createDocumentFragment();

            playlists.forEach(pl => {
                const isFav = userFavs.playlists.has(pl.id);
                const container = document.createElement('div');
                container.style.position = 'relative';
                container.style.display = 'inline-block';
                container.dataset.originIndex = String(pl._originIndex);

                const pill = document.createElement('div');
                pill.className = 'cartoon-pill';
                pill.dataset.id = pl.id;
                if (pl.id === activePlaylistId) pill.classList.add('active');

                const thumb = pl.capa
                    ? `<img src="${pl.capa}" alt="capa" onerror="this.src='assets/tryhard.png'">`
                    : `<div style="width:26px;height:26px;border-radius:50%;background:var(--accent2);display:flex;align-items:center;justify-content:center;font-size:12px;color:white">▶️</div>`;
                
                pill.innerHTML = `${thumb} ${pl.nome}`;
                pill.onclick = () => selectPlaylist(pl.id, pill);
                container.appendChild(pill);

                // Botão de favorito na pílula
                const favBtn = document.createElement('button');
                favBtn.className = `fav-star ${isFav ? 'active' : ''} fav-star-sm`;
                favBtn.dataset.id = pl.id;
                favBtn.title = isFav ? 'Desmarcar' : 'Marcar';
                favBtn.innerHTML = isFav ? '★' : '☆';
                favBtn.onclick = async (e) => {
                    e.stopPropagation();
                    try {
                        const res = await DB.toggleFavorite(pl.id, 'youtube', { title: pl.nome, cover: pl.capa });
                        const isAdded = res.action === 'added';
                        if (isAdded) userFavs.playlists.add(pl.id); else userFavs.playlists.delete(pl.id);
                        
                        favBtn.classList.toggle('active', isAdded);
                        favBtn.innerHTML = isAdded ? '★' : '☆';
                        favBtn.title = isAdded ? 'Desmarcar' : 'Marcar';
                        
                        showToast(isAdded ? `"${pl.nome}" adicionado aos favoritos!` : `"${pl.nome}" removido dos favoritos.`);
                        DB.reorderFavoritePillWrappers(playlistPills);
                    } catch (err) {
                        showToast(err.message || 'Erro ao favoritar.', 'error');
                    }
                };
                container.appendChild(favBtn);
                fragPills.appendChild(container);
            });

            playlistPills.appendChild(fragPills);

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
    }

    await init();
});
