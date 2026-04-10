import os

path = r'c:\Users\enzot\Desktop\Videos-redecanais\pages\perfil.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

fav_html = """
      <!-- Seção de Favoritos -->
      <div class="favorites-section" id="favoritesSection">
        <div class="main-head">
          <h1>⭐ Meus Favoritos</h1>
          <p>Sua coleção de conteúdos destacados</p>
        </div>
        
        <div class="favorites-tabs">
          <div class="fav-tab active" data-type="anime">Animes</div>
          <div class="fav-tab" data-type="filme">Filmes</div>
          <div class="fav-tab" data-type="desenho">Desenhos</div>
          <div class="fav-tab" data-type="manga">Mangás</div>
        </div>

        <div id="favoritesGrid" class="fav-grid">
          <div class="history-empty" style="grid-column: 1/-1;">
            <p>Carregando favoritos...</p>
          </div>
        </div>
      </div>
"""

fav_js = """
      // --- FAVORITOS SYSTEM ---
      let currentFavType = 'anime';

      async function loadFavorites() {
        const grid = document.getElementById('favoritesGrid');
        if (!grid) return;
        grid.innerHTML = '<div class="history-empty" style="grid-column: 1/-1;"><p>Buscando sua coleção mística...</p></div>';
        try {
          const favs = await DB.getFavorites(currentFavType);
          grid.innerHTML = '';
          if (favs.length === 0) {
            grid.innerHTML = `<div class="history-empty" style="grid-column: 1/-1;"><p>Nenhum ${currentFavType} favoritado ainda. ⭐</p></div>`;
            return;
          }
          favs.forEach(fav => {
            const card = document.createElement('div');
            card.className = 'fav-card';
            const title = fav.metadata?.title || 'Conteúdo';
            const cover = fav.metadata?.cover || 'assets/tryhard.png';
            card.innerHTML = `
              <img src="${cover}" alt="${title}">
              <div class="fav-card-info">
                <div class="fav-card-title">${title}</div>
              </div>
              <button class="fav-card-remove" data-id="${fav.content_id}" title="Remover dos favoritos">✕</button>
            `;
            card.querySelector('.fav-card-remove').onclick = async (e) => {
              e.stopPropagation();
              if (confirm(`Remover "${title}" dos favoritos?`)) {
                await DB.toggleFavorite(fav.content_id, fav.content_type);
                loadFavorites();
                showToast('Removido dos favoritos.');
              }
            };
            grid.appendChild(card);
          });
        } catch (err) { console.error(err); }
      }

      document.querySelectorAll('.fav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.fav-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          currentFavType = tab.getAttribute('data-type');
          loadFavorites();
        });
      });
      loadFavorites();
"""

# Inserindo HTML antes do dashboard ou num local visível
if '<div class="profile-dashboard"' in content:
    content = content.replace('<div class="profile-dashboard"', fav_html + '\n      <div class="profile-dashboard"')

# Inserindo JS após updateDashboard()
if 'updateDashboard();' in content:
    content = content.replace('updateDashboard();', 'updateDashboard();\n' + fav_js)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully!")
