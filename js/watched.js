/**
 * watched.js — Módulo de Marcação de Episódios Assistidos
 * =========================================================
 * Salva no localStorage o estado "assistido" por usuário.
 * Chave: watched_<userId>  → Array JSON de IDs de episódios/filmes assistidos.
 */

const Watched = (() => {
  // Cache do userId para não chamar async toda vez
  let _cachedUserId = null;

  // Tenta obter o userId sincronamente do supabaseClient (que já foi inicializado)
  function _getUserId() {
    if (_cachedUserId) return _cachedUserId;
    try {
      // Tenta pegar da sessão em memória do supabase (síncrono via __session no storage)
      const keys = Object.keys(localStorage).filter(k => k.includes('auth-token') || k.includes('supabase.auth'));
      for (const k of keys) {
        try {
          const val = JSON.parse(localStorage.getItem(k));
          const userId = val?.user?.id || val?.currentSession?.user?.id;
          if (userId) { _cachedUserId = userId; return userId; }
        } catch {}
      }
    } catch {}
    return 'guest';
  }

  function _key() {
    return `watched_${_getUserId()}`;
  }

  function _load() {
    try {
      const raw = localStorage.getItem(_key());
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  function _save(set) {
    try {
      localStorage.setItem(_key(), JSON.stringify([...set]));
      _dispatchChange();
    } catch {}
  }

  function _dispatchChange() {
    document.dispatchEvent(new CustomEvent('watched:change'));
  }

  // Chamado pelo auth.js/db.js após login para atualizar o cache
  function refreshUserId() {
    _cachedUserId = null;
    _getUserId();
  }

  return {
    refreshUserId,

    isWatched(id) {
      return _load().has(id);
    },

    toggle(id) {
      const set = _load();
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      _save(set);
      return set.has(id);
    },

    markWatched(id) {
      const set = _load();
      set.add(id);
      _save(set);
    },

    unmarkWatched(id) {
      const set = _load();
      set.delete(id);
      _save(set);
    },

    countWatched(ids) {
      const set = _load();
      return ids.filter(id => set.has(id)).length;
    },

    getAll() {
      return _load();
    }
  };
})();


/**
 * Cria o botão de "marcar como assistido" para um episode-card.
 * @param {string} id - ID do episódio ou filme
 * @param {function} onToggle - callback(id, isNowWatched) chamado após toggle
 */
function createWatchedBtn(id, onToggle) {
  const btn = document.createElement('button');
  btn.className = 'watched-btn' + (Watched.isWatched(id) ? ' watched' : '');
  btn.dataset.id = id;
  btn.title = Watched.isWatched(id) ? 'Marcar como não assistido' : 'Marcar como assistido';
  btn.setAttribute('aria-label', btn.title);
  btn.innerHTML = Watched.isWatched(id)
    ? '<span class="watched-icon">✓</span>'
    : '<span class="watched-icon">○</span>';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const nowWatched = Watched.toggle(id);
    if (nowWatched) {
      btn.classList.add('watched');
      btn.innerHTML = '<span class="watched-icon">✓</span>';
    } else {
      btn.classList.remove('watched');
      btn.innerHTML = '<span class="watched-icon">○</span>';
    }
    btn.title = nowWatched ? 'Marcar como não assistido' : 'Marcar como assistido';
    btn.setAttribute('aria-label', btn.title);
    btn.classList.add('pop');
    setTimeout(() => btn.classList.remove('pop'), 400);
    if (onToggle) onToggle(id, nowWatched);
  });

  return btn;
}

/**
 * Cria barra de progresso de uma temporada
 * @param {string[]} epIds - IDs dos episódios da temporada
 * @returns {HTMLElement}
 */
function createSeasonProgress(epIds) {
  const total = epIds.length;
  const watched = Watched.countWatched(epIds);
  const pct = total === 0 ? 0 : Math.round((watched / total) * 100);
  const isComplete = watched === total && total > 0;

  const wrapper = document.createElement('div');
  wrapper.className = 'season-progress';
  wrapper.innerHTML = `
    <div class="season-progress-bar">
      <div class="season-progress-fill" style="width:${pct}%"></div>
    </div>
    <span class="season-progress-label${isComplete ? ' complete' : ''}">${watched}/${total} assistidos</span>
  `;
  return wrapper;
}
