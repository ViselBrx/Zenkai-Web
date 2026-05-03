/**
 * utils-stats.js
 * Utilitário para cálculo e exibição de progresso por categoria.
 */

const StatsManager = (() => {
  function getCategoryStats(category) {
    if (typeof DB === 'undefined') return { total: 0, watched: 0 };
    
    let total = 0;
    let watchedCount = 0;
    const allWatched = DB.getAllWatched ? DB.getAllWatched() : new Set();

    if (category === 'desenhos') {
      const allCartoons = DB.getCartoons();
      allCartoons.forEach(c => {
        const episodes = DB.getEpisodesFor(c.id);
        for (const season in episodes) {
          episodes[season].forEach(ep => {
            total++;
            if (allWatched.has(ep.id)) watchedCount++;
          });
        }
        const movies = DB.getMoviesFor(c.id);
        movies.forEach(m => {
          total++;
          if (allWatched.has(m.id)) watchedCount++;
        });
      });
    } else if (category === 'animes') {
      const allAnimes = DB.getAnimes();
      allAnimes.forEach(a => {
        // Precisamos contar dublado e legendado separadamente se quisermos o total geral
        ['dublado', 'legendado'].forEach(audio => {
          const seasons = DB.getAnimeEpisodesFor(a.id, audio);
          for (const seasonNo in seasons) {
            const eps = seasons[seasonNo];
            if (Array.isArray(eps)) {
              eps.forEach(ep => {
                total++;
                if (allWatched.has(ep.id)) watchedCount++;
              });
            }
          }
        });
        // Movies
        const movies = DB.getAnimeMoviesFor ? DB.getAnimeMoviesFor(a.id) : [];
        movies.forEach(m => {
          total++;
          if (allWatched.has(m.id)) watchedCount++;
        });
      });
    } else if (category === 'mangas') {
      const allMangas = DB.getMangas();
      allMangas.forEach(m => {
        const volumes = DB.getMangaVolumesFor(m.id);
        volumes.forEach(v => {
          total++;
          if (allWatched.has(v.id)) watchedCount++;
        });
      });
    } else if (category === 'hqs') {
      const allHQs = DB.getHQs();
      allHQs.forEach(h => {
        const editions = DB.getHQEditionsFor(h.id);
        editions.forEach(e => {
          total++;
          if (allWatched.has(e.id)) watchedCount++;
        });
      });
    } else if (category === 'filmes') {
      const allFilmes = DB.getFilmes();
      total = allFilmes.length;
      allFilmes.forEach(f => {
        if (allWatched.has(f.id)) watchedCount++;
      });
    } else if (category === 'youtube') {
      const allPlaylists = DB.getYoutubePlaylists();
      allPlaylists.forEach(p => {
        const videos = DB.getYoutubeVideosFor(p.id);
        videos.forEach(v => {
          total++;
          if (allWatched.has(v.id)) watchedCount++;
        });
      });
    }

    return { total, watched: watchedCount };
  }

  function render(category) {
    const container = document.getElementById('statsWidget');
    if (!container) return;

    const stats = getCategoryStats(category);
    const labelMap = {
      'desenhos': 'Episódios',
      'animes': 'Episódios',
      'mangas': 'Volumes',
      'hqs': 'Edições',
      'filmes': 'Filmes',
      'youtube': 'Vídeos'
    };

    const label = labelMap[category] || 'Itens';
    
    // Regra especial para Filmes: metade cadastrada conta como visto para o gráfico
    let barPct = stats.total === 0 ? 0 : (stats.watched / stats.total) * 100;

    const userRank = localStorage.getItem('animehouse_userRank') || 'Novato';
    const totalXP = localStorage.getItem('animehouse_totalXP') || '0';

    const colorMap = { 'filmes': '#ffd700', 'youtube': '#ff0000' };
    const barColor = colorMap[category] || 'var(--primary)';

    container.innerHTML = `
      <div class="stats-info">
        <span class="label">Total ${label}</span>
        <span class="count">${stats.total}</span>
      </div>
      <div class="stats-info" style="margin-top: -6px;">
        <span class="label">Vistos / Assistidos</span>
        <span class="count" style="color: ${category === 'filmes' ? '#ffd700' : 'var(--accent)'};">${stats.watched}</span>
      </div>
      <div class="stats-progress-container">
        <div class="stats-progress-fill" style="width: ${barPct}%; background: ${barColor}; box-shadow: 0 0 10px ${barColor};"></div>
      </div>
      <div class="stats-info" style="margin-top: 8px; border-top: 1px solid rgba(var(--primary-rgb), 0.1); padding-top: 8px;">
        <span class="label" style="color: var(--primary); font-weight: bold;">${userRank}</span>
        <span class="count" style="font-size: 0.8rem; opacity: 0.8;">XP total: ${totalXP}</span>
      </div>
    `;
  }

  return { render };
})();

// Escutar mudanças no checklist para atualizar o widget automaticamente
document.addEventListener('watched:change', () => {
    const path = window.location.pathname;
    if (path.includes('desenhos')) StatsManager.render('desenhos');
    else if (path.includes('anime-episodios')) StatsManager.render('animes');
    else if (path.includes('mangas')) StatsManager.render('mangas');
    else if (path.includes('hq')) StatsManager.render('hqs');
    else if (path.includes('filmes')) StatsManager.render('filmes');
    else if (path.includes('youtube-videos')) StatsManager.render('youtube');
});
