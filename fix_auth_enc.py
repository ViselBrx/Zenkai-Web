import os

file_path = 'js-src/auth.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'âœ•': '✕',
    'ðŸ—‘ï¸ ': '🗑️',
    'âœ…': '✅',
    'âš ï¸ ': '⚠️',
    'â Œ': '❌',
    'ðŸ””': '🔔',
    'ï¸ ': '', # any stray modifiers
    'â€œ': '"',
    'â€': '"',
    'Ã¢A"': '',
    'Ã§Ãµes': 'ções',
    'notificaes': 'notificações',
    'Notificaes': 'Notificações',
    'usurios': 'usuários',
    'Usurios': 'Usuários',
    'Notificaes': 'Notificações',
    'notificaes': 'notificações',
    'Y""': '🔔',
    'o.': '✅',
    'Y': '🔔'
}

for bad, good in replacements.items():
    content = content.replace(bad, good)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed auth.js encoding issues.")
