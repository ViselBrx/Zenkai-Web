import os

path = r'c:\Users\enzot\Desktop\Videos-redecanais\pages\perfil.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Limpar CSS (com correção de identação provável)
# Procuro por qualquer variação do erro
content = content.replace('/* Animated loadFavorites();', '/* Animated Avatar Auras */')
content = content.replace('// ====== LEVEL-UP TOAST LOGIC ======\n */', '/* ===== LEVEL UP TOAST ===== */')

# 2. Injetar scripts antes do </body>
scripts = """
<script src="js/db.js"></script>
<script src="js/watched.js"></script>
<script src="js/history.js"></script>
<script src="js/auth.js"></script>
"""
if 'js/auth.js' not in content:
    content = content.replace('</body>', scripts + '</body>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Repair completed successfully.")
