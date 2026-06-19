/**
 * custom-number.js
 * Converte todos os <input type="number"> com as classes .form-control ou .exchange-input
 * em inputs com botões customizados de incremento e decremento, com o tema do site,
 * mantendo o input original como type="number".
 */
(function () {
  function initCustomNumbers() {
    const numberInputs = document.querySelectorAll('input[type="number"].form-control, input[type="number"].exchange-input');
    numberInputs.forEach(nativeInput => {
      if (nativeInput.dataset.customized) return;
      nativeInput.dataset.customized = '1';
      buildCustomNumber(nativeInput);
    });
  }

  function buildCustomNumber(native) {
    // Criar Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'cn-wrapper ' + native.className;
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'stretch';
    wrapper.style.position = 'relative';
    wrapper.style.padding = '0';
    wrapper.style.overflow = 'hidden';
    if (native.id === 'ouroQtd' || native.id === 'diamanteQtd' || native.id === 'esmeraldaQtd') {
        wrapper.style.flex = '1';
    } else {
        wrapper.style.width = native.style.width || 'auto';
        wrapper.style.flex = native.style.flex || '';
    }

    // Remover classes do native para não duplicar estilos no wrapper
    const isExchange = native.classList.contains('exchange-input');
    native.className = 'cn-input';
    native.style.flex = '1';
    native.style.width = '100%';
    native.style.border = 'none';
    native.style.background = 'transparent';
    native.style.color = 'inherit';
    native.style.textAlign = 'center';
    native.style.outline = 'none';
    native.style.fontFamily = 'inherit';
    native.style.fontSize = 'inherit';
    native.style.minWidth = '50px';
    // Ocultar spinners originais (garantindo via CSS inline)
    native.style.appearance = 'textfield';
    native.style.MozAppearance = 'textfield';

    // Botões de controle
    const btnMinus = document.createElement('button');
    btnMinus.type = 'button';
    btnMinus.className = 'cn-btn cn-minus';
    btnMinus.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    
    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'cn-btn cn-plus';
    btnPlus.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

    // Estilos dos botões
    const btnStyle = "background:transparent;border:none;color:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0 10px;transition:all 0.2s;opacity:0.7;";
    btnMinus.style.cssText = btnStyle;
    btnPlus.style.cssText = btnStyle;

    btnMinus.onmouseover = () => btnMinus.style.opacity = '1';
    btnMinus.onmouseout = () => btnMinus.style.opacity = '0.7';
    btnPlus.onmouseover = () => btnPlus.style.opacity = '1';
    btnPlus.onmouseout = () => btnPlus.style.opacity = '0.7';

    // Lógica de incremento e decremento
    btnMinus.addEventListener('click', (e) => {
        e.preventDefault();
        let val = parseInt(native.value) || 0;
        let min = parseInt(native.min) || 0;
        if (val > min) {
            native.value = val - 1;
            native.dispatchEvent(new Event('input', { bubbles: true }));
            native.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    btnPlus.addEventListener('click', (e) => {
        e.preventDefault();
        let val = parseInt(native.value) || 0;
        let max = parseInt(native.max) || 9999;
        if (val < max) {
            native.value = val + 1;
            native.dispatchEvent(new Event('input', { bubbles: true }));
            native.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    // Substituir no DOM
    native.parentNode.insertBefore(wrapper, native);
    wrapper.appendChild(btnMinus);
    wrapper.appendChild(native);
    wrapper.appendChild(btnPlus);
  }

  // Run after DOM ready and also after dynamic renders
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomNumbers);
  } else {
    initCustomNumbers();
  }

  const _origInitNum = window._customNumberInited;
  if (!_origInitNum) {
    window._customNumberInited = true;
    setTimeout(initCustomNumbers, 500);
    setTimeout(initCustomNumbers, 1500);
  }

  window.initCustomNumbers = initCustomNumbers;
})();
