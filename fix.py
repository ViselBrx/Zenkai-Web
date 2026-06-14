import codecs

with open('js/auth.js', 'rb') as f:
    content = f.read()

# Let's try utf-8 with replacement
text = content.decode('utf-8', errors='replace')

text = text.replace(' Redefinir Senha', '<i class=\"fa-solid fa-floppy-disk\"></i> Redefinir Senha')
text = text.replace('', 'ç')
text = text.replace('', 'é') # Mdia

# Actually, the characters are probably windows-1252
text = content.decode('windows-1252', errors='replace')
text = text.replace('ï¿½ï¿½ Redefinir Senha', '<i class=\"fa-solid fa-floppy-disk\"></i> Redefinir Senha')
text = text.replace('ðŸ’¾', '<i class=\"fa-solid fa-floppy-disk\"></i>')

with open('js/auth.js', 'w', encoding='utf-8') as f:
    f.write(text)
