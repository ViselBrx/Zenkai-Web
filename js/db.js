/**
 * db.js — Cliente Supabase AnimeHouse
 * =====================================
 * Modificado para usar Supabase no lugar de armazenamento local!
 */

const _DEFAULT = { cartoons: [], episodes: {}, movies: {}, animes: [], animeEpisodes: {}, animeMovies: {}, mangas: [], mangaVolumes: {}, mangaNotes: {}, filmes: [], aiConfig: {}, siteConfig: {} };
let _store = JSON.parse(JSON.stringify(_DEFAULT));

// Checa se o supabase está disponível (injetado via auth.js)
function getSupa() {
    if (!window.supabaseClient) throw new Error("Supabase Client não encontrado!");
    return window.supabaseClient;
}

// Obter o ID do usuário logado
async function getCurrentUserId() {
    const supa = getSupa();
    const { data: { user } } = await supa.auth.getUser();
    return user?.id || null;
}

// Verificar se o usuário pode editar/deletar um item
async function checkItemOwnership(itemId, table) {
    try {
        const supa = getSupa();
        const userId = await getCurrentUserId();
        const ADMIN_EMAIL = 'davizeravisel@gmail.com';
        
        // Conta principal pode fazer tudo
        const { data: { user } } = await supa.auth.getUser();
        if (user?.email === ADMIN_EMAIL) return true;
        
        // Outros usuários só podem editar seus próprios dados
        const { data, error } = await supa.from(table).select('user_id').eq('id', itemId).single();
        
        if (error || !data) {
            throw new Error('Item não encontrado.');
        }
        
        if (data.user_id !== userId) {
            throw new Error('Você não tem permissão para modificar este item.');
        }
        
        return true;
    } catch (err) {
        console.error("Erro ao verificar propriedade:", err);
        throw err;
    }
}

// Utilitário para limpar os iframes (Redecanais mudam muito de domínio)
// PROBLEMA RAIZ: os iframes usam hostname percent-encoded (ex: %72%65%64%65%63%61%6E%61%69%73%2E%6F%6F%6F
// que é 'redecanais.ooo'). Browsers NÃO conseguem resolver hostnames codificados assim,
// por isso o player fica preto. A correção é decodificar o src e substituir o domínio.
function cleanIframe(iframe) {
    if (!iframe) return '';
    const iframeTrim = iframe.trim();

    // --- Caso 1: tag <iframe> completa ---
    if (iframeTrim.toLowerCase().startsWith('<iframe')) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(iframeTrim, 'text/html');
            const el = doc.querySelector('iframe');
            if (el) {
                let src = el.getAttribute('src') || '';

                // DECODE: converte %72%65%64... → redecanais.ooo (etc.)
                try { src = decodeURIComponent(src); } catch(e) { /* ignora erros de decode */ }

                // Protocolo absoluto
                if (src.startsWith('//')) src = 'https:' + src;
                if (src.startsWith('http://')) src = 'https://' + src.slice(7);

                // Substituição de domínio (cobre todos os domínios conhecidos do Redecanais)
                src = src.replace(/redecanais\.[a-z]{2,10}/gi, 'redecanais.cafe');

                el.setAttribute('src', src);
                el.setAttribute('allow', 'fullscreen');
                el.setAttribute('allowfullscreen', '');
                el.setAttribute('frameborder', '0');
                el.setAttribute('width', '100%');
                el.removeAttribute('loading');

                return el.outerHTML;
            }
        } catch(e) {
            console.warn('cleanIframe DOMParser error, usando fallback regex:', e);
        }

        // Fallback regex se DOMParser falhar
        return iframeTrim
            .replace(/src="([^"]+)"/gi, (_, rawSrc) => {
                let s = rawSrc;
                try { s = decodeURIComponent(s); } catch(e) {}
                if (s.startsWith('//')) s = 'https:' + s;
                s = s.replace(/redecanais\.[a-z]{2,10}/gi, 'redecanais.cafe');
                return `src="${s}"`;
            })
            .replace(/allow="[^"]*"/gi, 'allow="fullscreen"');
    }

    // --- Caso 2: só a URL ---
    let url = iframeTrim;
    try { url = decodeURIComponent(url); } catch(e) {}
    if (url.startsWith('//')) url = 'https:' + url;
    if (url.startsWith('http://')) url = 'https://' + url.slice(7);
    url = url.replace(/redecanais\.[a-z]{2,10}/gi, 'redecanais.cafe');

    if (url.startsWith('https://')) {
        return `<iframe src="${url}" frameborder="0" width="100%" style="aspect-ratio:16/9" allow="fullscreen" allowfullscreen></iframe>`;
    }

    return iframe; // devolve original se não reconheceu
}


const DB = {
  // Inicializa o banco (Baixa tudo do Supabase para a memória local)
  async init() {
    try {
        _store = JSON.parse(JSON.stringify(_DEFAULT));
        const supa = getSupa();
        const userId = await getCurrentUserId();
        
        // Verificar se é a conta principal
        const { data: { user } } = await supa.auth.getUser();
        const ADMIN_EMAIL = 'davizeravisel@gmail.com';
        const isMainAccount = user?.email === ADMIN_EMAIL;
        
        // Se for conta principal, vê tudo. Se não, vê apenas seus dados
        const cartoonQuery = isMainAccount 
          ? supa.from('cartoons').select('*').order('created_at', { ascending: true })
          : supa.from('cartoons').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        
        const episodesQuery = isMainAccount 
          ? supa.from('episodes').select('*')
          : supa.from('episodes').select('*').eq('user_id', userId);
        
        const moviesQuery = isMainAccount 
          ? supa.from('movies').select('*')
          : supa.from('movies').select('*').eq('user_id', userId);
        
        const animeQuery = isMainAccount 
          ? supa.from('animes').select('*').order('created_at', { ascending: true })
          : supa.from('animes').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        
        const animeEpsQuery = isMainAccount 
          ? supa.from('anime_episodes').select('*')
          : supa.from('anime_episodes').select('*').eq('user_id', userId);
        
        const mangaQuery = isMainAccount 
          ? supa.from('mangas').select('*').order('created_at', { ascending: true })
          : supa.from('mangas').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        
        const mangaVolsQuery = isMainAccount 
          ? supa.from('manga_volumes').select('*').order('volume_number', { ascending: true })
          : supa.from('manga_volumes').select('*').eq('user_id', userId).order('volume_number', { ascending: true });
        
        const mangaNotesQuery = isMainAccount 
          ? supa.from('manga_notes').select('*')
          : supa.from('manga_notes').select('*').eq('user_id', userId);
        
        const filmesQuery = isMainAccount 
          ? supa.from('filmes').select('*').order('created_at', { ascending: true })
          : supa.from('filmes').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        
        const [
            { data: cartoons }, { data: episodes }, { data: movies },
            { data: animes }, { data: animeEps }, { data: mangas }, { data: mangaVols },
            { data: mangaNotes },
            { data: filmesData }, { data: settings }
        ] = await Promise.all([
            cartoonQuery,
            episodesQuery,
            moviesQuery,
            animeQuery,
            animeEpsQuery,
            mangaQuery,
            mangaVolsQuery,
            mangaNotesQuery,
            filmesQuery,
            supa.from('settings').select('*')
        ]);

        // Formatar para bater com o padrão antigo do _store
        _store.cartoons = (cartoons || []).map(c => ({...c, createdAt: c.created_at}));
        _store.animes = (animes || []).map(a => ({...a, createdAt: a.created_at}));
        _store.mangas = (mangas || []).map(m => ({...m, createdAt: m.created_at}));
        _store.filmes = (filmesData || []).map(f => ({...f, createdAt: f.created_at}));
        // Settings
        if (settings) {
            settings.forEach(s => {
                if (s.key_name === 'siteConfig') _store.siteConfig = s.config_data;
                if (s.key_name === 'aiConfig') _store.aiConfig = s.config_data;
            });
        }

        // Agrupar Manga Volumes
        if (mangaVols) {
            mangaVols.forEach(v => {
                if (!_store.mangaVolumes[v.manga_id]) _store.mangaVolumes[v.manga_id] = [];
                _store.mangaVolumes[v.manga_id].push({
                   id: v.id, volume_number: v.volume_number, title: v.title, pdf_url: v.pdf_url
                });
            });
        }

        // Agrupar Manga Notes
        if (mangaNotes) {
            mangaNotes.forEach(n => {
                _store.mangaNotes[n.volume_id] = {
                    id: n.id,
                    manga_id: n.manga_id,
                    note_text: n.note_text,
                    page_bookmark: n.page_bookmark
                };
            });
        }

        // Agrupar episodes
        if (episodes) {
            episodes.forEach(ep => {
                if (!_store.episodes[ep.cartoon_id]) _store.episodes[ep.cartoon_id] = {};
                if (!_store.episodes[ep.cartoon_id][ep.temporada]) _store.episodes[ep.cartoon_id][ep.temporada] = [];
                _store.episodes[ep.cartoon_id][ep.temporada].push({ 
                  id: ep.id, 
                  epNumber: ep.ep_number, 
                  title: ep.title, 
                  iframe: cleanIframe(ep.iframe) 
                });
            });
            // Opcional: ordenar episódios
            for(let cid in _store.episodes) {
                for(let sid in _store.episodes[cid]) {
                    _store.episodes[cid][sid].sort((a,b) => a.epNumber - b.epNumber);
                }
            }
        }

        // Agrupar movies
        if (movies) {
            movies.forEach(m => {
                if (!_store.movies[m.cartoon_id]) _store.movies[m.cartoon_id] = [];
                _store.movies[m.cartoon_id].push({ 
                  id: m.id, 
                  title: m.title, 
                  iframe: cleanIframe(m.iframe) 
                });
            });
        }

        // Agrupar animeEpisodes
        if (animeEps) {
            animeEps.forEach(ep => {
                if (!_store.animeEpisodes[ep.anime_id]) _store.animeEpisodes[ep.anime_id] = { dublado: {}, legendado: {} };
                if (!_store.animeEpisodes[ep.anime_id][ep.idioma]) _store.animeEpisodes[ep.anime_id][ep.idioma] = {};
                if (!_store.animeEpisodes[ep.anime_id][ep.idioma][ep.temporada]) _store.animeEpisodes[ep.anime_id][ep.idioma][ep.temporada] = [];
                
                _store.animeEpisodes[ep.anime_id][ep.idioma][ep.temporada].push({
                    id: ep.id, epNumber: ep.ep_number, title: ep.title, iframe: cleanIframe(ep.iframe)
                });
            });
             for(let aid in _store.animeEpisodes) {
                for(let lang in _store.animeEpisodes[aid]) {
                     for(let sid in _store.animeEpisodes[aid][lang]) {
                         _store.animeEpisodes[aid][lang][sid].sort((a,b) => a.epNumber - b.epNumber);
                     }
                }
            }
        }

        // TODO: Anime Movies if it exists in Supabase, but schema.sql didn't have anime_movies table! 
        // We'll just init it empty for now, as it wasn't migrated.
        console.log("Banco de dados sincronizado com o Supabase!");

    } catch (e) {
        console.error("Falha ao inicializar o banco do Supabase:", e);
    }
  },

  // Upload de capa via Supabase Storage (acessível de qualquer lugar)
  async uploadCapa(base64String) {
      const supa = getSupa();
      
      // Extrair extensão e dados binários do base64
      const matches = base64String.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches) throw new Error('Formato de imagem inválido');
      
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      
      // Converter base64 para Uint8Array
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: `image/${matches[1]}` });
      
      const filename = `capa_${Date.now()}.${ext}`;
      
      // Fazer upload para o bucket 'capas' no Supabase Storage
      const { data, error } = await supa.storage
          .from('capas')
          .upload(filename, blob, { contentType: `image/${matches[1]}`, upsert: false });
      
      if (error) throw new Error('Falha no upload da capa: ' + error.message);
      
      // Retornar URL pública da imagem
      const { data: { publicUrl } } = supa.storage
          .from('capas')
          .getPublicUrl(filename);
      
      return publicUrl;
  },

  // Upload de PDF (recebe objeto File do input text, para aguentar PDFs grandes)
  async uploadMangaPdf(file) {
      const supa = getSupa();
      const ext = file.name.split('.').pop() || 'pdf';
      const filename = `manga_vol_${Date.now()}.${ext}`;
      
      const { data, error } = await supa.storage
          .from('mangas_pdfs')
          .upload(filename, file, { contentType: file.type || 'application/pdf', upsert: false });
      
      if (error) throw new Error('Falha no upload do PDF: ' + error.message);
      
      const { data: { publicUrl } } = supa.storage
          .from('mangas_pdfs')
          .getPublicUrl(filename);
      
      return publicUrl;
  },

  /* Cartoons */
  getCartoons() { return [..._store.cartoons]; },
  getCartoonById(id) { return _store.cartoons.find(c => c.id === id) || null; },
  
  async addCartoon(data) {
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const userId = await getCurrentUserId();
    const item = { id: 'c_' + Date.now(), ...data, created_at: Date.now(), user_id: userId };
    
    const { error } = await getSupa().from('cartoons').insert([item]);
    if (error) { console.error(error); throw new Error(error.message); }
    
    _store.cartoons.push({...item, createdAt: item.created_at});
    return item;
  },
  
  async updateCartoon(id, data) {
    await checkItemOwnership(id, 'cartoons');
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    
    const { error } = await getSupa().from('cartoons').update(data).eq('id', id);
    if (error) { console.error(error); throw new Error(error.message); }
    
    _store.cartoons = _store.cartoons.map(c => c.id === id ? { ...c, ...data } : c);
  },
  
  async deleteCartoon(id) {
    await checkItemOwnership(id, 'cartoons');
    const { error } = await getSupa().from('cartoons').delete().eq('id', id);
    if (error) { console.error(error); throw new Error(error.message); }

    _store.cartoons = _store.cartoons.filter(c => c.id !== id);
    delete _store.episodes[id];
  },

  /* Cartoons: Episódios */
  getAllEpisodes() { return _store.episodes; },
  getEpisodesFor(cId) { return _store.episodes[cId] || {}; },
  
  async addEpisode(cId, season, epData) {
    const userId = await getCurrentUserId();
    const item = { 
        id: 'e_' + Date.now(), 
        cartoon_id: cId, 
        temporada: String(season),
        ep_number: epData.epNumber || 1,
        title: epData.title || '',
        iframe: cleanIframe(epData.iframe || ''),
        user_id: userId
    };

    const { error } = await getSupa().from('episodes').insert([item]);
    if (error) throw new Error(error.message);

    if (!_store.episodes[cId]) _store.episodes[cId] = {};
    if (!_store.episodes[cId][season]) _store.episodes[cId][season] = [];
    _store.episodes[cId][season].push({ id: item.id, epNumber: item.ep_number, title: item.title, iframe: item.iframe });
    return item;
  },
  
  async updateEpisode(cId, oldSeason, newSeason, epId, data) {    await checkItemOwnership(epId, 'episodes');     const isSeasonChanging = (oldSeason !== newSeason);
     const updatePayload = {
         title: data.title,
         iframe: cleanIframe(data.iframe),
         ep_number: data.epNumber,
         temporada: String(newSeason)
     };
     // remove undefined fields
     Object.keys(updatePayload).forEach(k => updatePayload[k] === undefined && delete updatePayload[k]);

     const { error } = await getSupa().from('episodes').update(updatePayload).eq('id', epId);
     if (error) throw new Error(error.message);

     if (_store.episodes[cId]?.[oldSeason]) {
      const epIndex = _store.episodes[cId][oldSeason].findIndex(e => e.id === epId);
      if (epIndex > -1) {
          const ep = { ..._store.episodes[cId][oldSeason][epIndex], ...data };
          if (isSeasonChanging) {
            _store.episodes[cId][oldSeason].splice(epIndex, 1);
            if (!_store.episodes[cId][newSeason]) _store.episodes[cId][newSeason] = [];
            _store.episodes[cId][newSeason].push(ep);
          } else {
            _store.episodes[cId][oldSeason][epIndex] = ep;
          }
      }
    }
  },

  async deleteEpisode(cId, season, epId) {
    await checkItemOwnership(epId, 'episodes');
    const { error } = await getSupa().from('episodes').delete().eq('id', epId);
    if (error) throw new Error(error.message);

    if (_store.episodes[cId]?.[season]) {
      _store.episodes[cId][season] = _store.episodes[cId][season].filter(e => e.id !== epId);
    }
  },
  
  async deleteSeason(cId, season) {
    const { error } = await getSupa().from('episodes').delete().eq('cartoon_id', cId).eq('temporada', String(season));
    if (error) throw new Error(error.message);
    if (_store.episodes[cId]) delete _store.episodes[cId][season];
  },

  /* Cartoons: Filmes */
  getMoviesFor(cId) { return _store.movies[cId] || []; },
  
  async addMovie(cId, movieData) {
    const userId = await getCurrentUserId();
    const item = { 
        id: 'm_c_' + Date.now(), 
        cartoon_id: cId, 
        title: movieData.title, 
        iframe: cleanIframe(movieData.iframe),
        user_id: userId
    };
    const { error } = await getSupa().from('movies').insert([item]);
    if (error) throw new Error(error.message);

    if (!_store.movies[cId]) _store.movies[cId] = [];
    _store.movies[cId].push({ id: item.id, title: item.title, iframe: item.iframe });
    return item;
  },

  async updateMovie(cId, mId, data) {
    await checkItemOwnership(mId, 'movies');
    const updatePayload = { ...data };
    if (updatePayload.iframe) updatePayload.iframe = cleanIframe(updatePayload.iframe);
    
    const { error } = await getSupa().from('movies').update(updatePayload).eq('id', mId);
    if (error) throw new Error(error.message);

    if (_store.movies[cId]) {
      _store.movies[cId] = _store.movies[cId].map(m => m.id === mId ? { ...m, ...data } : m);
    }
  },

  async deleteMovie(cId, mId) {
    await checkItemOwnership(mId, 'movies');
    const { error } = await getSupa().from('movies').delete().eq('id', mId);
    if (error) throw new Error(error.message);
    if (_store.movies[cId]) _store.movies[cId] = _store.movies[cId].filter(m => m.id !== mId);
  },

  /* Animes */
  getAnimes() { return [..._store.animes]; },
  getAnimeById(id) { return _store.animes.find(a => a.id === id) || null; },
  
  async addAnime(data) {
    const userId = await getCurrentUserId();
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const item = { id: 'a_' + Date.now(), ...data, created_at: Date.now(), user_id: userId };
    
    const { error } = await getSupa().from('animes').insert([item]);
    if (error) throw new Error(error.message);

    _store.animes.push({...item, createdAt: item.created_at});
    return item;
  },

  async updateAnime(id, data) {
    await checkItemOwnership(id, 'animes');
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const { error } = await getSupa().from('animes').update(data).eq('id', id);
    if (error) throw new Error(error.message);

    _store.animes = _store.animes.map(a => a.id === id ? { ...a, ...data } : a);
  },

  async deleteAnime(id) {
    await checkItemOwnership(id, 'animes');
    const { error } = await getSupa().from('animes').delete().eq('id', id);
    if (error) throw new Error(error.message);

    _store.animes = _store.animes.filter(a => a.id !== id);
    delete _store.animeEpisodes[id];
  },

  /* Animes: Episódios */
  getAnimeEpisodesFor(aId, audio = 'dublado') { 
    if (!_store.animeEpisodes[aId]) return {};
    return _store.animeEpisodes[aId][audio] || {};
  },
  
  async addAnimeEpisode(aId, audio, season, epData) {
    const userId = await getCurrentUserId();
    const item = {
        id: 'ae_' + Date.now(),
        anime_id: aId,
        idioma: audio,
        temporada: String(season),
        ep_number: epData.epNumber || 1,
        title: epData.title || '',
        iframe: cleanIframe(epData.iframe || ''),
        user_id: userId
    };
    const { error } = await getSupa().from('anime_episodes').insert([item]);
    if (error) throw new Error(error.message);

    if (!_store.animeEpisodes[aId]) _store.animeEpisodes[aId] = { dublado: {}, legendado: {} };
    if (!_store.animeEpisodes[aId][audio]) _store.animeEpisodes[aId][audio] = {};
    if (!_store.animeEpisodes[aId][audio][season]) _store.animeEpisodes[aId][audio][season] = [];
    
    _store.animeEpisodes[aId][audio][season].push({id: item.id, epNumber: item.ep_number, title: item.title, iframe: item.iframe});
    return item;
  },

  async updateAnimeEpisode(aId, audio, oldSeason, newSeason, epId, data) {
    await checkItemOwnership(epId, 'anime_episodes');
    const isSeasonChanging = (oldSeason !== newSeason);
    const updatePayload = {
         title: data.title,
         iframe: cleanIframe(data.iframe),
         ep_number: data.epNumber,
         temporada: String(newSeason)
    };
    Object.keys(updatePayload).forEach(k => updatePayload[k] === undefined && delete updatePayload[k]);

    const { error } = await getSupa().from('anime_episodes').update(updatePayload).eq('id', epId);
    if (error) throw new Error(error.message);

    if (_store.animeEpisodes[aId]?.[audio]?.[oldSeason]) {
      const epIndex = _store.animeEpisodes[aId][audio][oldSeason].findIndex(e => e.id === epId);
      if (epIndex > -1) {
          const ep = { ..._store.animeEpisodes[aId][audio][oldSeason][epIndex], ...data };
          if (isSeasonChanging) {
            _store.animeEpisodes[aId][audio][oldSeason].splice(epIndex, 1);
            if (!_store.animeEpisodes[aId][audio][newSeason]) _store.animeEpisodes[aId][audio][newSeason] = [];
            _store.animeEpisodes[aId][audio][newSeason].push(ep);
          } else {
            _store.animeEpisodes[aId][audio][oldSeason][epIndex] = ep;
          }
      }
    }
  },

  async deleteAnimeEpisode(aId, audio, season, epId) {
    await checkItemOwnership(epId, 'anime_episodes');
    const { error } = await getSupa().from('anime_episodes').delete().eq('id', epId);
    if (error) throw new Error(error.message);

    if (_store.animeEpisodes[aId]?.[audio]?.[season]) {
      _store.animeEpisodes[aId][audio][season] = _store.animeEpisodes[aId][audio][season].filter(e => e.id !== epId);
    }
  },

  async deleteAnimeSeason(aId, audio, season) {
    const { error } = await getSupa().from('anime_episodes').delete()
        .eq('anime_id', aId).eq('idioma', audio).eq('temporada', String(season));
    if (error) throw new Error(error.message);

    if (_store.animeEpisodes[aId]?.[audio]) { 
      delete _store.animeEpisodes[aId][audio][season]; 
    }
  },

  /* Animes: Filmes */
  getAnimeMoviesFor(aId) { return _store.animeMovies[aId] || []; },
  async addAnimeMovie(aId, movieData) {
    const userId = await getCurrentUserId();
      if (!_store.animeMovies[aId]) _store.animeMovies[aId] = [];
      const item = { id: 'm_a_' + Date.now(), ...movieData };
      _store.animeMovies[aId].push(item); return item;
      // Not fully integrated to Supabase schema, storing in local _store only (as per previous instructions).
  },
  async updateAnimeMovie(aId, mId, data) {
      if (_store.animeMovies[aId]) {
          _store.animeMovies[aId] = _store.animeMovies[aId].map(m => m.id === mId ? { ...m, ...data } : m);
      }
  },
  async deleteAnimeMovie(aId, mId) {
      if (_store.animeMovies[aId]) {
          _store.animeMovies[aId] = _store.animeMovies[aId].filter(m => m.id !== mId);
      }
  },

  /* Mangás */
  getMangas() { return [..._store.mangas]; },
  async addManga(data) {
    const userId = await getCurrentUserId();
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const item = { id: 'm_' + Date.now(), ...data, created_at: Date.now(), user_id: userId };
    const { error } = await getSupa().from('mangas').insert([item]);
    if (error) throw new Error(error.message);

    _store.mangas.push({...item, createdAt: item.created_at});
    return item;
  },
  async updateManga(id, data) {
    await checkItemOwnership(id, 'mangas');
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const { error } = await getSupa().from('mangas').update(data).eq('id', id);
    if (error) throw new Error(error.message);

    _store.mangas = _store.mangas.map(m => m.id === id ? { ...m, ...data } : m);
  },
  async deleteManga(id) {
    await checkItemOwnership(id, 'mangas');
    const { error } = await getSupa().from('mangas').delete().eq('id', id);
    if (error) throw new Error(error.message);
    _store.mangas = _store.mangas.filter(m => m.id !== id);
  },

  getMangaVolumesFor(mangaId) {
    return _store.mangaVolumes[mangaId] || [];
  },
  async addMangaVolume(mangaId, file, urlExterna, volumeData) {
    const userId = await getCurrentUserId();
    // Fazer upload do PDF ou usar o Link direto
    let pdfUrl = '';
    if (file) {
        pdfUrl = await DB.uploadMangaPdf(file);
    } else if (urlExterna) {
        pdfUrl = urlExterna;
    }
    
    const item = {
        id: 'mv_' + Date.now(),
        manga_id: mangaId,
        volume_number: volumeData.volume,
        title: volumeData.title || '',
        pdf_url: pdfUrl,
        created_at: Date.now(),
        user_id: userId
    };
    
    const { error } = await getSupa().from('manga_volumes').insert([item]);
    if (error) throw new Error(error.message);
    
    if (!_store.mangaVolumes[mangaId]) _store.mangaVolumes[mangaId] = [];
    _store.mangaVolumes[mangaId].push({
        id: item.id, volume_number: item.volume_number, title: item.title, pdf_url: item.pdf_url
    });
    // Reordenar por volume
    _store.mangaVolumes[mangaId].sort((a,b) => a.volume_number - b.volume_number);
    
    return item;
  },
  async deleteMangaVolume(mangaId, volId) {
    await checkItemOwnership(volId, 'manga_volumes');
    const { error } = await getSupa().from('manga_volumes').delete().eq('id', volId);
    if (error) throw new Error(error.message);
    
    if (_store.mangaVolumes[mangaId]) {
        _store.mangaVolumes[mangaId] = _store.mangaVolumes[mangaId].filter(v => v.id !== volId);
    }
  },
  async updateMangaVolume(mangaId, volId, file, urlExterna, volumeData) {
      await checkItemOwnership(volId, 'manga_volumes');
      let pdfUrl = '';
      if (file) {
          pdfUrl = await DB.uploadMangaPdf(file);
      } else if (urlExterna) {
          pdfUrl = urlExterna;
      }
      
      const updatePayload = {
          volume_number: volumeData.volume,
          title: volumeData.title || ''
      };
      
      if (pdfUrl) {
          updatePayload.pdf_url = pdfUrl;
      }
      
      const { error } = await getSupa().from('manga_volumes').update(updatePayload).eq('id', volId);
      if (error) throw new Error(error.message);
      
      if (_store.mangaVolumes[mangaId]) {
          _store.mangaVolumes[mangaId] = _store.mangaVolumes[mangaId].map(v => 
              v.id === volId ? { ...v, ...updatePayload } : v
          );
          _store.mangaVolumes[mangaId].sort((a,b) => a.volume_number - b.volume_number);
      }
  },

  /* Manga Notes & Bookmarks */
  getMangaNote(volumeId) {
      return _store.mangaNotes[volumeId] || null;
  },
  async saveMangaNote(mangaId, volumeId, noteText, pageBookmark) {
      const existing = _store.mangaNotes[volumeId];
      const payload = {
          manga_id: mangaId,
          volume_id: volumeId,
          note_text: noteText || '',
          page_bookmark: pageBookmark ? parseInt(pageBookmark) : null,
          updated_at: Date.now()
      };
      
      let id = existing ? existing.id : 'mn_' + Date.now();
      if (!existing) payload.id = id;

      const { error } = await getSupa().from('manga_notes').upsert([{ id, ...payload }]);
      if (error) throw new Error(error.message);

      _store.mangaNotes[volumeId] = { id, ...payload };
      return _store.mangaNotes[volumeId];
  },
  
  /* Filmes */
  getFilmes() { return [..._store.filmes]; },
  getFilmeById(id) { return _store.filmes.find(f => f.id === id) || null; },
  async addFilme(data) {
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    // Limpa o iframe/url via cleanIframe se for tag
    if (data.iframe) data.iframe = cleanIframe(data.iframe);
    const item = { id: 'f_' + Date.now(), ...data, created_at: Date.now() };
    const { error } = await getSupa().from('filmes').insert([item]);
    if (error) throw new Error(error.message);
    _store.filmes.push({...item, createdAt: item.created_at});
    return item;
  },
  async updateFilme(id, data) {
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    if (data.iframe) data.iframe = cleanIframe(data.iframe);
    const { error } = await getSupa().from('filmes').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    _store.filmes = _store.filmes.map(f => f.id === id ? { ...f, ...data } : f);
  },
  async deleteFilme(id) {
    const { error } = await getSupa().from('filmes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    _store.filmes = _store.filmes.filter(f => f.id !== id);
  },

  /* IA Config */
  getAIConfig() { return { ..._store.aiConfig }; },
  async saveAIConfig(config) { 
      const payload = { ..._store.aiConfig, ...config };
      const { error } = await getSupa().from('settings')
        .upsert({ key_name: 'aiConfig', config_data: payload }, { onConflict: 'key_name' });
      if (error) throw new Error(error.message);
      _store.aiConfig = payload; 
  }
};

/* Globals */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = e => reject(e);
  });
}

function showToast(msg, type = 'success', ms = 3000) {
  const container = document.getElementById('toast');
  if (!container) return;
  
  const el = document.createElement('div');
  el.className = 'undo-toast';
  
  const isError = type === 'error';
  if (isError) {
      el.style.border = '2px solid var(--danger)';
      el.style.boxShadow = '0 0 35px rgba(239, 68, 68, 0.5)';
  }
  
  el.innerHTML = `
    <div class="undo-content" style="justify-content: center;">
      <span style="${isError ? 'color: var(--danger); font-weight: bold;' : ''}">${isError ? '⚠️ ' : ''}${msg}</span>
    </div>
  `;
  
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 500);
  }, ms);
}

function showDarkToast(msg, ms = 5000) {
  const container = document.getElementById('toast');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'undo-toast';
  el.innerHTML = `
    <div class="undo-content" style="justify-content: center;">
      <span>${msg}</span>
    </div>
  `;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 500);
  }, ms);
}

function showUndoToast(msg, onComplete, onUndo) {
  const container = document.getElementById('toast');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'undo-toast';
  el.innerHTML = `
    <div class="undo-content">
      <span>${msg}</span>
      <button class="btn-undo">DESFAZER (7s)</button>
    </div>
    <div class="undo-progress"></div>
  `;
  container.appendChild(el);

  let timeLeft = 7;
  const btn = el.querySelector('.btn-undo');
  const timer = setInterval(() => {
    timeLeft--;
    btn.textContent = `DESFAZER (${timeLeft}s)`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 500);
      onComplete();
    }
  }, 1000);

  btn.onclick = () => {
    clearInterval(timer);
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 500);
    onUndo();
    showDarkToast('Ação cancelada!', 5000);
  };
}

// Nav links highlighting and scroll sync
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.navbar-links a');
  const path  = location.pathname.split('/').pop() || 'index.html';
  
  let activeLink = null;
  links.forEach(a => { 
    if (a.getAttribute('href') === path) {
      a.classList.add('active');
      activeLink = a;
    }
  });
  
  const burger = document.getElementById('navBurger');
  const menu   = document.getElementById('navLinks');
  if (burger && menu) burger.addEventListener('click', () => menu.classList.toggle('open'));

  // Persistir posição do scroll da navbar de forma otimizada
  if (menu) {
    const savedScroll = sessionStorage.getItem('navbarScrollPosition');
    
    // Se tem scroll salvo, restaura. Senão, rola até o item ativo.
    if (savedScroll !== null) {
      menu.scrollLeft = parseInt(savedScroll, 10);
    } else if (activeLink) {
      // Pequeno delay para garantir que o CSS do flexbox aplicou
      setTimeout(() => {
        const padding = 20;
        menu.scrollLeft = activeLink.offsetLeft - padding;
      }, 50);
    }

    // Salva o scroll sem travar a interface (debounce)
    let scrollTimeout;
    menu.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        sessionStorage.setItem('navbarScrollPosition', menu.scrollLeft);
      }, 100); // Aguarda 100ms após o scroll parar para salvar
    });
  }
});
