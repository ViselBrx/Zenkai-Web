import os

path = r'c:\Users\enzot\Desktop\Videos-redecanais\pages\perfil.html'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Vamos reconstruir a parte final do script de forma limpa.
# Vou procurar onde o refreshHistory original termina e limpar o que veio depois.

new_lines = []
skip = False
for line in lines:
    if '// --- FAVORITOS SYSTEM ---' in line:
        skip = True # Começa a pular a bagunça duplicada
        continue
    if 'updateDashboard();' in line and skip:
        # Se acharmos um updateDashboard fora do lugar, ignoramos até o fim do bloco de erro
        continue
    if 'updateDashboard();' in line and not skip:
        new_lines.append(line)
        continue
    if not skip:
        new_lines.append(line)

# Agora injetamos a versão LIMPA e ÚNICA do sistema de favoritos
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
          if (!favs || favs.length === 0) {
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

      const favTabs = document.querySelectorAll('.fav-tab');
      if (favTabs.length > 0) {
        favTabs.forEach(tab => {
          tab.addEventListener('click', () => {
            document.querySelectorAll('.fav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFavType = tab.getAttribute('data-type');
            loadFavorites();
          });
        });
      }
      loadFavorites();
"""

# Re-insere no local correto (final do initProfile)
final_content = "".join(new_lines)
if 'updateDashboard();' in final_content:
    # Insere antes do fechamento da função initProfile (que termina com })
    # Mas como o arquivo é complexo, vamos inserir antes do checkClient
    final_content = final_content.replace('updateDashboard();', 'updateDashboard();\n' + fav_js)

with open(path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Profile fixed and cleaned!")
