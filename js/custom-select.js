/**
 * custom-select.js
 * Converte todos os <select> dentro de .search-bar em dropdowns
 * customizados que sempre abrem para baixo e seguem o tema do site.
 */
(function () {
  function initCustomSelects() {
    const bars = document.querySelectorAll('.search-bar, .community-filter');
    bars.forEach(bar => {
      bar.querySelectorAll('select').forEach(nativeSelect => {
        if (nativeSelect.dataset.customized) return;
        nativeSelect.dataset.customized = '1';
        buildCustomSelect(nativeSelect);
      });
    });
  }

  function buildCustomSelect(native) {
    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'cs-wrapper';
    wrapper.style.flex = native.style.flex || '';
    wrapper.style.minWidth = native.style.minWidth || '';

    // Trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cs-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const triggerText = document.createElement('span');
    triggerText.className = 'cs-trigger-text';

    const arrow = document.createElement('span');
    arrow.className = 'cs-arrow';
    arrow.innerHTML = `<svg viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    trigger.appendChild(triggerText);
    trigger.appendChild(arrow);

    // Dropdown list
    const dropdown = document.createElement('div');
    dropdown.className = 'cs-dropdown';
    dropdown.setAttribute('role', 'listbox');

    wrapper.appendChild(trigger);
    wrapper.appendChild(dropdown);

    // Hide the native select but keep it functional for JS listeners
    native.style.display = 'none';
    native.parentNode.insertBefore(wrapper, native);
    wrapper.appendChild(native);

    function syncOptions() {
      dropdown.innerHTML = '';
      Array.from(native.options).forEach(opt => {
        const item = document.createElement('div');
        item.className = 'cs-option' + (opt.selected ? ' selected' : '');
        item.dataset.value = opt.value;
        item.textContent = opt.text;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
        item.addEventListener('click', () => {
          native.value = opt.value;
          native.dispatchEvent(new Event('change', { bubbles: true }));
          syncSelected();
          close();
        });
        dropdown.appendChild(item);
      });
      syncSelected();
    }

    function syncSelected() {
      const selOpt = native.options[native.selectedIndex];
      triggerText.textContent = selOpt ? selOpt.text : '';
      dropdown.querySelectorAll('.cs-option').forEach(item => {
        const isSel = item.dataset.value === native.value;
        item.classList.toggle('selected', isSel);
        item.setAttribute('aria-selected', isSel ? 'true' : 'false');
      });
    }

    function open() {
      dropdown.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      wrapper.classList.add('open');
    }

    function close() {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      wrapper.classList.remove('open');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      // Close all other dropdowns
      document.querySelectorAll('.cs-dropdown.open').forEach(d => {
        if (d !== dropdown) {
          d.classList.remove('open');
          d.closest('.cs-wrapper').classList.remove('open');
          d.closest('.cs-wrapper').querySelector('.cs-trigger').setAttribute('aria-expanded', 'false');
        }
      });
      isOpen ? close() : open();
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) close();
    });

    // Observe native for option changes (initFilters adds options dynamically)
    const observer = new MutationObserver(syncOptions);
    observer.observe(native, { childList: true, subtree: true, characterData: true });

    // Observe native value changes triggered by JS
    native.addEventListener('change', syncSelected);

    syncOptions();
  }

  // Run after DOM ready and also after dynamic renders
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomSelects);
  } else {
    initCustomSelects();
  }

  // Re-run on every render cycle (for pages that add options dynamically via initFilters)
  const _origInit = window._customSelectInited;
  if (!_origInit) {
    window._customSelectInited = true;
    // Poll once to catch dynamic option population
    setTimeout(initCustomSelects, 500);
    setTimeout(initCustomSelects, 1500);
  }

  // Expose globally for manual calls
  window.initCustomSelects = initCustomSelects;
})();
