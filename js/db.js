/**
 * db.js — Cliente Supabase AnimeHouse
 * =====================================
 * Modificado para usar Supabase no lugar de armazenamento local!
 */

const _DEFAULT = { cartoons: [], episodes: {}, movies: {}, animes: [], animeEpisodes: {}, animeMovies: {}, mangas: [], aiConfig: {}, siteConfig: {} };
let _store = JSON.parse(JSON.stringify(_DEFAULT));

// Checa se o supabase está disponível (injetado via auth.js)
function getSupa() {
    if (!window.supabaseClient) throw new Error("Supabase Client não encontrado!");
    return window.supabaseClient;
}

const DB = {
  // Inicializa o banco (Baixa tudo do Supabase para a memória local)
  async init() {
    try {
        const supa = getSupa();
        const [
            { data: cartoons }, { data: episodes }, { data: movies },
            { data: animes }, { data: animeEps }, { data: mangas }, { data: settings }
        ] = await Promise.all([
            supa.from('cartoons').select('*').order('created_at', { ascending: true }),
            supa.from('episodes').select('*'),
            supa.from('movies').select('*'),
            supa.from('animes').select('*').order('created_at', { ascending: true }),
            supa.from('anime_episodes').select('*'),
            supa.from('mangas').select('*').order('created_at', { ascending: true }),
            supa.from('settings').select('*')
        ]);

        // Formatar para bater com o padrão antigo do _store
        _store.cartoons = (cartoons || []).map(c => ({...c, createdAt: c.created_at}));
        _store.animes = (animes || []).map(a => ({...a, createdAt: a.created_at}));
        _store.mangas = (mangas || []).map(m => ({...m, createdAt: m.created_at}));
        
        // Settings
        if (settings) {
            settings.forEach(s => {
                if (s.key_name === 'siteConfig') _store.siteConfig = s.config_data;
                if (s.key_name === 'aiConfig') _store.aiConfig = s.config_data;
            });
        }

        // Agrupar episodes
        if (episodes) {
            episodes.forEach(ep => {
                if (!_store.episodes[ep.cartoon_id]) _store.episodes[ep.cartoon_id] = {};
                if (!_store.episodes[ep.cartoon_id][ep.temporada]) _store.episodes[ep.cartoon_id][ep.temporada] = [];
                _store.episodes[ep.cartoon_id][ep.temporada].push({ id: ep.id, epNumber: ep.ep_number, title: ep.title, iframe: ep.iframe });
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
                _store.movies[m.cartoon_id].push({ id: m.id, title: m.title, iframe: m.iframe });
            });
        }

        // Agrupar animeEpisodes
        if (animeEps) {
            animeEps.forEach(ep => {
                if (!_store.animeEpisodes[ep.anime_id]) _store.animeEpisodes[ep.anime_id] = { dublado: {}, legendado: {} };
                if (!_store.animeEpisodes[ep.anime_id][ep.idioma]) _store.animeEpisodes[ep.anime_id][ep.idioma] = {};
                if (!_store.animeEpisodes[ep.anime_id][ep.idioma][ep.temporada]) _store.animeEpisodes[ep.anime_id][ep.idioma][ep.temporada] = [];
                
                _store.animeEpisodes[ep.anime_id][ep.idioma][ep.temporada].push({
                    id: ep.id, epNumber: ep.ep_number, title: ep.title, iframe: ep.iframe
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

  // Upload local mantido (usando Node), pois o Supabase Storage precisaria de permissões extras
  async uploadCapa(base64String) {
      const API_BASE = 'http://localhost:3000';
      const res = await fetch(API_BASE + '/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: base64String })
      });
      if (!res.ok) throw new Error('Falha no upload da capa');
      const d = await res.json();
      return d.url;
  },

  /* Cartoons */
  getCartoons() { return [..._store.cartoons]; },
  getCartoonById(id) { return _store.cartoons.find(c => c.id === id) || null; },
  
  async addCartoon(data) {
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const item = { id: 'c_' + Date.now(), ...data, created_at: Date.now() };
    
    const { error } = await getSupa().from('cartoons').insert([item]);
    if (error) { console.error(error); throw new Error(error.message); }
    
    _store.cartoons.push({...item, createdAt: item.created_at});
    return item;
  },
  
  async updateCartoon(id, data) {
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    
    const { error } = await getSupa().from('cartoons').update(data).eq('id', id);
    if (error) { console.error(error); throw new Error(error.message); }
    
    _store.cartoons = _store.cartoons.map(c => c.id === id ? { ...c, ...data } : c);
  },
  
  async deleteCartoon(id) {
    const { error } = await getSupa().from('cartoons').delete().eq('id', id);
    if (error) { console.error(error); throw new Error(error.message); }

    _store.cartoons = _store.cartoons.filter(c => c.id !== id);
    delete _store.episodes[id];
  },

  /* Cartoons: Episódios */
  getAllEpisodes() { return _store.episodes; },
  getEpisodesFor(cId) { return _store.episodes[cId] || {}; },
  
  async addEpisode(cId, season, epData) {
    const item = { 
        id: 'e_' + Date.now(), 
        cartoon_id: cId, 
        temporada: String(season),
        ep_number: epData.epNumber || 1,
        title: epData.title || '',
        iframe: epData.iframe || ''
    };

    const { error } = await getSupa().from('episodes').insert([item]);
    if (error) throw new Error(error.message);

    if (!_store.episodes[cId]) _store.episodes[cId] = {};
    if (!_store.episodes[cId][season]) _store.episodes[cId][season] = [];
    _store.episodes[cId][season].push({ id: item.id, epNumber: item.ep_number, title: item.title, iframe: item.iframe });
    return item;
  },
  
  async updateEpisode(cId, oldSeason, newSeason, epId, data) {
     const isSeasonChanging = (oldSeason !== newSeason);
     const updatePayload = {
         title: data.title,
         iframe: data.iframe,
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
    const item = { 
        id: 'm_c_' + Date.now(), 
        cartoon_id: cId, 
        title: movieData.title, 
        iframe: movieData.iframe 
    };
    const { error } = await getSupa().from('movies').insert([item]);
    if (error) throw new Error(error.message);

    if (!_store.movies[cId]) _store.movies[cId] = [];
    _store.movies[cId].push({ id: item.id, title: item.title, iframe: item.iframe });
    return item;
  },

  async updateMovie(cId, mId, data) {
    const { error } = await getSupa().from('movies').update(data).eq('id', mId);
    if (error) throw new Error(error.message);

    if (_store.movies[cId]) {
      _store.movies[cId] = _store.movies[cId].map(m => m.id === mId ? { ...m, ...data } : m);
    }
  },

  async deleteMovie(cId, mId) {
    const { error } = await getSupa().from('movies').delete().eq('id', mId);
    if (error) throw new Error(error.message);
    if (_store.movies[cId]) _store.movies[cId] = _store.movies[cId].filter(m => m.id !== mId);
  },

  /* Animes */
  getAnimes() { return [..._store.animes]; },
  getAnimeById(id) { return _store.animes.find(a => a.id === id) || null; },
  
  async addAnime(data) {
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const item = { id: 'a_' + Date.now(), ...data, created_at: Date.now() };
    
    const { error } = await getSupa().from('animes').insert([item]);
    if (error) throw new Error(error.message);

    _store.animes.push({...item, createdAt: item.created_at});
    return item;
  },

  async updateAnime(id, data) {
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const { error } = await getSupa().from('animes').update(data).eq('id', id);
    if (error) throw new Error(error.message);

    _store.animes = _store.animes.map(a => a.id === id ? { ...a, ...data } : a);
  },

  async deleteAnime(id) {
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
    const item = {
        id: 'ae_' + Date.now(),
        anime_id: aId,
        idioma: audio,
        temporada: String(season),
        ep_number: epData.epNumber || 1,
        title: epData.title || '',
        iframe: epData.iframe || ''
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
    const isSeasonChanging = (oldSeason !== newSeason);
    const updatePayload = {
         title: data.title,
         iframe: data.iframe,
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
    const item = { id: 'm_' + Date.now(), ...data, created_at: Date.now() };
    const { error } = await getSupa().from('mangas').insert([item]);
    if (error) throw new Error(error.message);

    _store.mangas.push({...item, createdAt: item.created_at});
    return item;
  },
  async updateManga(id, data) {
    const { error } = await getSupa().from('mangas').update(data).eq('id', id);
    if (error) throw new Error(error.message);

    _store.mangas = _store.mangas.map(m => m.id === id ? { ...m, ...data } : m);
  },
  async deleteManga(id) {
    const { error } = await getSupa().from('mangas').delete().eq('id', id);
    if (error) throw new Error(error.message);
    _store.mangas = _store.mangas.filter(m => m.id !== id);
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

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
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
    el.remove();
    onUndo();
    showToast('Ação cancelada!');
  };
}

// Nav links highlighting
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.navbar-links a');
  const path  = location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => { if (a.getAttribute('href') === path) a.classList.add('active'); });
  const burger = document.getElementById('navBurger');
  const menu   = document.getElementById('navLinks');
  if (burger && menu) burger.addEventListener('click', () => menu.classList.toggle('open'));
});
