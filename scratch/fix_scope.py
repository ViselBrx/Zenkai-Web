import os

path = r'c:\Users\enzot\Desktop\Videos-redecanais\pages\perfil.html'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_refresh = False
for line in lines:
    if 'refreshHistory = async () => {' in line:
        in_refresh = True
        new_lines.append(line)
        continue
    
    # Se chegamos ao fim do sistema de favoritos e estamos dentro do refresh, fechamos ele.
    if 'loadFavorites();' in line and in_refresh:
        new_lines.append(line)
        new_lines.append('      };\n') # Fecha a função refreshHistory
        in_refresh = False
        continue
    
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.write("".join(new_lines))

print("refreshHistory scoping fixed.")
