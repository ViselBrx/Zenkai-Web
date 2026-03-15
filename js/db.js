/**
 * db.js — Cliente do Servidor AnimeHouse
 * Totalmente livre de localStorage. As imagens agora são upadas pro disco via /api/upload
 */

const API_BASE = 'http://localhost:3000';

const _DEFAULT = { cartoons: [], episodes: {}, animes: [], animeEpisodes: {}, mangas: [], aiConfig: {} };
let _store = JSON.parse(JSON.stringify(_DEFAULT));

(function loadFromServer() {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', API_BASE + '/api/data?_t=' + Date.now(), false); // Sync garante que a interface renderize com os dados
    xhr.send();
    if (xhr.status === 200) {
      _store = { ..._DEFAULT, ...JSON.parse(xhr.responseText) };
    }
  } catch {
    console.warn('Servidor offline — usando dados vazios/sem persistência');
  }
})();

function _persist() {
  fetch(API_BASE + '/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(_store)
  }).catch(e => console.error("Falha ao salvar dados permanentemente", e));
}

// Fazer upload da imagem pro disco (Node) e retornar url permanente local: /uploads/arquivo.jpg
async function uploadCapa(base64String) {
  const res = await fetch(API_BASE + '/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64: base64String })
  });
  if (!res.ok) throw new Error('Falha no upload');
  const d = await res.json();
  return d.url;
}

const DB = {
  /* Cartoons */
  getCartoons() { return [..._store.cartoons]; },
  getCartoonById(id) { return _store.cartoons.find(c => c.id === id) || null; },
  async addCartoon(data) {
    if (data.capaBase64) data.capa = await uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const item = { id: 'c_' + Date.now(), ...data, createdAt: Date.now() };
    _store.cartoons.push(item); _persist(); return item;
  },
  async updateCartoon(id, data) {
    if (data.capaBase64) data.capa = await uploadCapa(data.capaBase64);
    delete data.capaBase64;
    _store.cartoons = _store.cartoons.map(c => c.id === id ? { ...c, ...data } : c); _persist();
  },
  deleteCartoon(id) {
    _store.cartoons = _store.cartoons.filter(c => c.id !== id);
    delete _store.episodes[id]; _persist();
  },

  /* Cartoons: Episódios */
  getAllEpisodes() { return _store.episodes; },
  getEpisodesFor(cId) { return _store.episodes[cId] || {}; },
  addEpisode(cId, season, epData) {
    if (!_store.episodes[cId]) _store.episodes[cId] = {};
    if (!_store.episodes[cId][season]) _store.episodes[cId][season] = [];
    const item = { id: 'e_' + Date.now(), ...epData };
    _store.episodes[cId][season].push(item); _persist(); return item;
  },
  updateEpisode(cId, season, epId, data) {
    if (_store.episodes[cId]?.[season]) {
      _store.episodes[cId][season] = _store.episodes[cId][season].map(e => e.id === epId ? { ...e, ...data } : e);
      _persist();
    }
  },
  deleteEpisode(cId, season, epId) {
    if (_store.episodes[cId]?.[season]) {
      _store.episodes[cId][season] = _store.episodes[cId][season].filter(e => e.id !== epId);
      if (_store.episodes[cId][season].length === 0) delete _store.episodes[cId][season];
      _persist();
    }
  },
  deleteSeason(cId, season) {
    if (_store.episodes[cId]) { delete _store.episodes[cId][season]; _persist(); }
  },

  /* Animes */
  getAnimes() { return [..._store.animes]; },
  getAnimeById(id) { return _store.animes.find(a => a.id === id) || null; },
  async addAnime(data) {
    if (data.capaBase64) data.capa = await uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const item = { id: 'a_' + Date.now(), ...data, createdAt: Date.now() };
    _store.animes.push(item); _persist(); return item;
  },
  async updateAnime(id, data) {
    if (data.capaBase64) data.capa = await uploadCapa(data.capaBase64);
    delete data.capaBase64;
    _store.animes = _store.animes.map(a => a.id === id ? { ...a, ...data } : a); _persist();
  },
  deleteAnime(id) {
    _store.animes = _store.animes.filter(a => a.id !== id);
    delete _store.animeEpisodes[id]; _persist();
  },

  /* Animes: Episódios */
  getAnimeEpisodesFor(aId) { return _store.animeEpisodes[aId] || {}; },
  addAnimeEpisode(aId, season, epData) {
    if (!_store.animeEpisodes[aId]) _store.animeEpisodes[aId] = {};
    if (!_store.animeEpisodes[aId][season]) _store.animeEpisodes[aId][season] = [];
    const item = { id: 'ae_' + Date.now(), ...epData };
    _store.animeEpisodes[aId][season].push(item); _persist(); return item;
  },
  updateAnimeEpisode(aId, season, epId, data) {
    if (_store.animeEpisodes[aId]?.[season]) {
      _store.animeEpisodes[aId][season] = _store.animeEpisodes[aId][season].map(e => e.id === epId ? { ...e, ...data } : e);
      _persist();
    }
  },
  deleteAnimeEpisode(aId, season, epId) {
    if (_store.animeEpisodes[aId]?.[season]) {
      _store.animeEpisodes[aId][season] = _store.animeEpisodes[aId][season].filter(e => e.id !== epId);
      if (_store.animeEpisodes[aId][season].length === 0) delete _store.animeEpisodes[aId][season];
      _persist();
    }
  },
  deleteAnimeSeason(aId, season) {
    if (_store.animeEpisodes[aId]) { delete _store.animeEpisodes[aId][season]; _persist(); }
  },

  /* Mangás */
  getMangas() { return [..._store.mangas]; },
  addManga(data) {
    const item = { id: 'm_' + Date.now(), ...data };
    _store.mangas.push(item); _persist(); return item;
  },
  updateManga(id, data) {
    _store.mangas = _store.mangas.map(m => m.id === id ? { ...m, ...data } : m); _persist();
  },
  deleteManga(id) {
    _store.mangas = _store.mangas.filter(m => m.id !== id); _persist();
  },
  
  /* IA Config */
  getAIConfig() { return { ..._store.aiConfig }; },
  saveAIConfig(config) { _store.aiConfig = { ..._store.aiConfig, ...config }; _persist(); }
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

/**
 * showUndoToast - Mostra uma barra com contador e botão de desfazer
 * @param {string} msg Mensagem a exibir
 * @param {function} onComplete Chamada quando o tempo acaba (exclui de verdade)
 * @param {function} onUndo Chamada se o usuário clicar em desfazer
 */
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

document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.navbar-links a');
  const path  = location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => { if (a.getAttribute('href') === path) a.classList.add('active'); });
  const burger = document.getElementById('navBurger');
  const menu   = document.getElementById('navLinks');
  if (burger && menu) burger.addEventListener('click', () => menu.classList.toggle('open'));
});
