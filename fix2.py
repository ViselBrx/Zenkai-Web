import codecs

with open('js/auth.js', 'r', encoding='utf-8') as f:
    t = f.read()

t = t.replace('Mangs', 'Mangás')
t = t.replace('Mangǭs', 'Mangás')
t = t.replace('Y'' Entrar', '<i class=""fa-solid fa-right-to-bracket""></i> Entrar')

t = t.replace(
    ""  if (typeof showToast === 'function') showToast('Senha ultra-segura (32 chars) gerada e preenchida!', 'success', 4000);\n  else alert('Senha ultra-segura (32 chars) gerada e preenchida!');"",
    """"""  if (typeof showToast === 'function') {
    showToast('Senha ultra-segura gerada e preenchida!', 'success', 4000);
  } else {
    const t = document.createElement('div');
    t.textContent = 'Senha ultra-segura gerada e preenchida!';
    t.style.position = 'fixed';
    t.style.bottom = '20px';
    t.style.right = '20px';
    t.style.background = 'var(--success, #22c55e)';
    t.style.color = '#fff';
    t.style.padding = '12px 20px';
    t.style.borderRadius = '8px';
    t.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    t.style.zIndex = '9999';
    t.style.transition = 'opacity 0.3s';
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
  }""""""
)

with open('js/auth.js', 'w', encoding='utf-8') as f:
    f.write(t)
