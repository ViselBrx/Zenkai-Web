/**
 * watched.js - Checklist permanente de episodios, filmes e mangas.
 */

const Watched = (() => {
  function dispatchChange() {
    document.dispatchEvent(new CustomEvent('watched:change'));
  }

  function getDb() {
    if (typeof DB === 'undefined') {
      throw new Error('Checklist permanente indisponivel.');
    }
    return DB;
  }

  return {
    refreshUserId() {
      return null;
    },

    isWatched(id) {
      return typeof DB !== 'undefined' && typeof DB.isWatched === 'function'
        ? DB.isWatched(id)
        : false;
    },

    async toggle(id, contentType = 'generic') {
      const nextState = !this.isWatched(id);
      return this.setWatched(id, nextState, contentType);
    },

    async markWatched(id, contentType = 'generic') {
      return this.setWatched(id, true, contentType);
    },

    async unmarkWatched(id, contentType = 'generic') {
      return this.setWatched(id, false, contentType);
    },

    async setWatched(id, watched, contentType = 'generic') {
      const result = await getDb().setWatched(id, watched, contentType);
      dispatchChange();
      return result;
    },

    countWatched(ids) {
      return typeof DB !== 'undefined' && typeof DB.countWatched === 'function'
        ? DB.countWatched(ids)
        : 0;
    },

    getAll() {
      return typeof DB !== 'undefined' && typeof DB.getAllWatched === 'function'
        ? DB.getAllWatched()
        : new Set();
    }
  };
})();

function updateWatchedButtonState(btn, isWatched) {
  btn.classList.toggle('watched', isWatched);
  btn.title = isWatched ? 'Marcar como nao assistido' : 'Marcar como assistido';
  btn.setAttribute('aria-label', btn.title);
  btn.innerHTML = isWatched
    ? '<span class="watched-icon">&#10003;</span>'
    : '<span class="watched-icon">&#9675;</span>';
}

/**
 * Cria o botao de marcar como assistido para um card.
 * @param {string} id
 * @param {function} onToggle
 * @param {string} contentType
 * @returns {HTMLButtonElement}
 */
function createWatchedBtn(id, onToggle, contentType = 'generic') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'watched-btn';
  btn.dataset.id = id;
  updateWatchedButtonState(btn, Watched.isWatched(id));

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (btn.disabled) return;

    btn.disabled = true;
    try {
      const nowWatched = await Watched.toggle(id, contentType);
      updateWatchedButtonState(btn, nowWatched);
      btn.classList.add('pop');
      setTimeout(() => btn.classList.remove('pop'), 400);
      if (onToggle) onToggle(id, nowWatched);
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast(err.message || 'Nao foi possivel atualizar o checklist.', 'error');
      } else {
        console.error(err);
      }
    } finally {
      btn.disabled = false;
    }
  });

  return btn;
}

/**
 * Cria barra de progresso de uma temporada.
 * @param {string[]} epIds
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
