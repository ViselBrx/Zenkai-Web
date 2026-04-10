import os

path = r'c:\Users\enzot\Desktop\Videos-redecanais\pages\perfil.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Atualizando a lógica de carregamento para focar nos 10 mais recentes
old_fav_logic = "const favs = await DB.getFavorites(currentFavType);"
new_fav_logic = "const allFavs = await DB.getFavorites(currentFavType);\n          const favs = allFavs.slice(0, 10);"

if old_fav_logic in content:
    content = content.replace(old_fav_logic, new_fav_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Favorites limit applied (tops 10).")
