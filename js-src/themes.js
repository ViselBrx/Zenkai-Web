(function () {
  const THEME_ALIASES = {
    "": "theme-ciano",
    "theme-default": "theme-ciano",
    "theme-ben10": "theme-verde",
    "theme-vinland": "theme-dourado",
    "theme-aot": "theme-vermelho",
    "theme-tt-classic": "theme-roxo",
    "theme-mutant-rex": "theme-laranja",
    "theme-regular-show": "theme-azul",
    "theme-demon-slayer": "theme-verde-escuro",
    "theme-vagabond": "theme-branco",
    tema_cromatico: "theme-cromatico",
    tema_natal: "theme-natal",
  };
  const AVAILABLE_THEMES = new Set([
    "theme-ciano",
    "theme-verde",
    "theme-dourado",
    "theme-vermelho",
    "theme-roxo",
    "theme-laranja",
    "theme-azul",
    "theme-verde-escuro",
    "theme-branco",
    "theme-aqua-verde",
    "theme-cromatico",
    "theme-natal",
  ]);

  const ALL_THEME_CLASSES = [
    "theme-ciano",
    "theme-default",
    "theme-verde",
    "theme-ben10",
    "theme-dourado",
    "theme-vinland",
    "theme-vermelho",
    "theme-aot",
    "theme-roxo",
    "theme-tt-classic",
    "theme-laranja",
    "theme-mutant-rex",
    "theme-azul",
    "theme-regular-show",
    "theme-verde-escuro",
    "theme-demon-slayer",
    "theme-branco",
    "theme-vagabond",
    "theme-aqua-verde",
    "theme-cromatico",
    "theme-natal",
  ];

  const CHROMATIC_THEME = "theme-cromatico";
  const CHROMATIC_LITE_CLASS = "theme-cromatico-lite";
  const CHROMATIC_PAUSED_CLASS = "theme-cromatico-paused";
  const CHROMATIC_HUE_START = 210;
  const CHROMATIC_HUE_STEP = 10;
  const CHROMATIC_TICK_MS = 450;
  const chromaticMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  let chromaticHue = CHROMATIC_HUE_START;
  let chromaticTimer = null;

  function setChromaticHue(hue) {
    chromaticHue = ((Number(hue) % 360) + 360) % 360;
    const hueValue = `${chromaticHue}deg`;
    document.documentElement.style.setProperty("--chromatic-hue", hueValue);
    if (document.body) {
      document.body.style.setProperty("--chromatic-hue", hueValue);
    }
  }

  function stopChromaticCycle() {
    if (!chromaticTimer) return;
    window.clearInterval(chromaticTimer);
    chromaticTimer = null;
  }

  function startChromaticCycle() {
    if (chromaticTimer) return;
    chromaticTimer = window.setInterval(() => {
      if (document.hidden || chromaticMotionQuery?.matches) return;
      setChromaticHue(chromaticHue + CHROMATIC_HUE_STEP);
    }, CHROMATIC_TICK_MS);
  }

  function syncChromaticRuntimeClasses(theme) {
    const normalizedTheme = normalizeTheme(theme);
    const isChromatic = normalizedTheme === CHROMATIC_THEME;
    const shouldPause =
      !isChromatic || document.hidden || chromaticMotionQuery?.matches;
    const targets = [document.documentElement, document.body].filter(Boolean);

    targets.forEach((target) => {
      target.classList.toggle(CHROMATIC_LITE_CLASS, isChromatic);
      target.classList.toggle(CHROMATIC_PAUSED_CLASS, isChromatic && shouldPause);
    });

    if (!isChromatic) {
      stopChromaticCycle();
      return;
    }

    setChromaticHue(chromaticHue);

    if (shouldPause) {
      stopChromaticCycle();
      return;
    }

    startChromaticCycle();
  }

  function syncNatalDecorations(theme) {
    const isNatal = normalizeTheme(theme) === "theme-natal";
    const existingDecor = document.getElementById("natal-decorations");

    if (!isNatal) {
      if (existingDecor) existingDecor.remove();
      return;
    }

    if (!existingDecor && document.body) {
      const decorContainer = document.createElement("div");
      decorContainer.id = "natal-decorations";
      decorContainer.innerHTML = `
        <div class="christmas-snowflakes">
          ${Array(30).fill('<div class="snowflake">❄️</div>').join("")}
        </div>
        <ul class="christmas-lights">
          ${Array(20).fill('<li></li>').join("")}
        </ul>
        <div class="corner-decor top-left"></div>
        <div class="corner-decor bottom-right"></div>
      `;
      document.body.appendChild(decorContainer);
    }
  }

  function normalizeTheme(theme) {
    const rawTheme = String(theme || "").trim();
    if (THEME_ALIASES[rawTheme]) return THEME_ALIASES[rawTheme];

    // Proteção para o tema cromático: isolamento por usuário
    if (rawTheme === "theme-cromatico") {
      let uid = null;
      try {
        const sessionToken = localStorage.getItem("sb-bxifddhrbxbmimjkgwzr-auth-token");
        uid = sessionToken ? JSON.parse(sessionToken).user?.id : null;
      } catch (e) { }

      const userKey = uid ? `animehouse_tema_cromatico_${uid}` : "animehouse_tema_cromatico";
      const isEquipped = localStorage.getItem(userKey) === "true" ||
        (window.DB?._store?.profile?.store_data?.equipped?.tema_cromatico === true);

      if (!isEquipped) return "theme-ciano";
    }

    if (rawTheme === "theme-natal") {
      let uid = null;
      try {
        const sessionToken = localStorage.getItem("sb-bxifddhrbxbmimjkgwzr-auth-token");
        uid = sessionToken ? JSON.parse(sessionToken).user?.id : null;
      } catch (e) { }

      const userKey = uid ? `animehouse_tema_natal_${uid}` : "animehouse_tema_natal";
      const isEquipped = localStorage.getItem(userKey) === "true" ||
        (window.DB?._store?.profile?.store_data?.equipped?.tema_natal === true);

      if (!isEquipped) return "theme-ciano";
    }

    return AVAILABLE_THEMES.has(rawTheme) ? rawTheme : "theme-ciano";
  }

  // Restaurar tema cromático de volta A  sessionStorage se estava equipado no localStorage (user-scoped)
  const syncChromaticTheme = () => {
    let uid = null;
    try {
      const sessionToken = localStorage.getItem("sb-bxifddhrbxbmimjkgwzr-auth-token");
      uid = sessionToken ? JSON.parse(sessionToken).user?.id : null;
    } catch (e) { }

    const themeKey = uid ? `animehouse_tema_cromatico_${uid}` : "animehouse_tema_cromatico";
    if (
      localStorage.getItem(themeKey) === "true" &&
      (!sessionStorage.getItem("theme") || sessionStorage.getItem("theme") === "theme-ciano")
    ) {
      sessionStorage.setItem("theme", "theme-cromatico");
    }

    const natalKey = uid ? `animehouse_tema_natal_${uid}` : "animehouse_tema_natal";
    if (
      localStorage.getItem(natalKey) === "true" &&
      (!sessionStorage.getItem("theme") || sessionStorage.getItem("theme") === "theme-ciano")
    ) {
      sessionStorage.setItem("theme", "theme-natal");
    }
  };
  syncChromaticTheme();

  // Apply the saved theme early to avoid a flash on load.
  const savedTheme = normalizeTheme(sessionStorage.getItem("theme"));
  document.documentElement.className = savedTheme;
  sessionStorage.setItem("theme", savedTheme);
  syncChromaticRuntimeClasses(savedTheme);
  syncNatalDecorations(savedTheme);

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.body) return;
    const currentTheme = normalizeTheme(sessionStorage.getItem("theme"));

    ALL_THEME_CLASSES.forEach((cls) => document.body.classList.remove(cls));
    document.body.classList.add(currentTheme);
    syncChromaticRuntimeClasses(currentTheme);
    syncNatalDecorations(currentTheme);
  });

  document.addEventListener("visibilitychange", () => {
    syncChromaticRuntimeClasses(sessionStorage.getItem("theme"));
  });

  if (chromaticMotionQuery) {
    const handleChromaticMotionChange = () => {
      syncChromaticRuntimeClasses(sessionStorage.getItem("theme"));
    };

    if (typeof chromaticMotionQuery.addEventListener === "function") {
      chromaticMotionQuery.addEventListener("change", handleChromaticMotionChange);
    } else if (typeof chromaticMotionQuery.addListener === "function") {
      chromaticMotionQuery.addListener(handleChromaticMotionChange);
    }
  }

  function applyTheme(theme) {
    const themeToApply = normalizeTheme(theme);

    document.documentElement.classList.add("theme-switching");

    ALL_THEME_CLASSES.forEach((cls) =>
      document.documentElement.classList.remove(cls),
    );
    document.documentElement.classList.add(themeToApply);

    if (document.body) {
      ALL_THEME_CLASSES.forEach((cls) => document.body.classList.remove(cls));
      document.body.classList.add(themeToApply);
    }

    syncChromaticRuntimeClasses(themeToApply);
    syncNatalDecorations(themeToApply);

    sessionStorage.setItem("theme", themeToApply);

    document.querySelectorAll(".theme-opt-btn").forEach((btn) => {
      btn.classList.toggle(
        "active",
        btn.getAttribute("data-theme") === themeToApply,
      );
    });

    // Dispatch event para listeners que precisam recarregar cores em tempo real (como o Chart.js no dashboard)
    window.dispatchEvent(
      new CustomEvent("themeChanged", { detail: themeToApply }),
    );

    setTimeout(() => {
      document.documentElement.classList.remove("theme-switching");
    }, 280);
  }

  function injectSwitcher() {
    if (document.getElementById("theme-switcher")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "theme-switcher";
    wrapper.className = "theme-switcher-wrapper";
    wrapper.innerHTML = `
            <button class="theme-main-btn" title="Mudar cor"><i class="fa-solid fa-palette"></i></button>
            <div class="theme-options">
                <button class="theme-opt-btn" data-theme="theme-ciano" title="Ciano" aria-label="Ciano"></button>
                <button class="theme-opt-btn" data-theme="theme-verde" title="Verde" aria-label="Verde"></button>
                <button class="theme-opt-btn" data-theme="theme-dourado" title="Dourado" aria-label="Dourado"></button>
                <button class="theme-opt-btn" data-theme="theme-vermelho" title="Vermelho" aria-label="Vermelho"></button>
                <button class="theme-opt-btn" data-theme="theme-roxo" title="Roxo" aria-label="Roxo"></button>
                <button class="theme-opt-btn" data-theme="theme-laranja" title="Laranja" aria-label="Laranja"></button>
                <button class="theme-opt-btn" data-theme="theme-azul" title="Azul" aria-label="Azul"></button>
                <button class="theme-opt-btn" data-theme="theme-verde-escuro" title="Verde escuro" aria-label="Verde escuro"></button>
                <button class="theme-opt-btn" data-theme="theme-branco" title="Branco" aria-label="Branco"></button>
                <button class="theme-opt-btn" data-theme="theme-aqua-verde" title="Aqua verde" aria-label="Aqua verde"></button>
            </div>
        `;

    document.body.appendChild(wrapper);

    const mainBtn = wrapper.querySelector(".theme-main-btn");
    mainBtn.addEventListener("click", () => {
      wrapper.classList.toggle("active");
    });

    wrapper.querySelectorAll(".theme-opt-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyTheme(btn.getAttribute("data-theme"));
        wrapper.classList.remove("active");
      });
    });

    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) wrapper.classList.remove("active");
    });

    const currentTheme = normalizeTheme(sessionStorage.getItem("theme"));
    document.querySelectorAll(".theme-opt-btn").forEach((btn) => {
      btn.classList.toggle(
        "active",
        btn.getAttribute("data-theme") === currentTheme,
      );
    });
  }

  function setupNavbarScrollIndicator() {
    const nav = document.querySelector(".navbar");
    const links = document.querySelector(".navbar-links");
    if (!nav || !links) return;

    if (document.getElementById("nav-links-built")) return;
    const marker = document.createElement("span");
    marker.id = "nav-links-built";
    marker.style.display = "none";
    links.appendChild(marker);

    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";

    const pages = [
      { href: "index.html", label: " Inicio", icon: "<i class='fa-solid fa-house'></i>" },
      { href: "desenhos.html", label: " Desenhos", icon: "<i class='fa-solid fa-tv'></i>" },
      { href: "animes.html", label: " Animes", icon: "<i class='fa-solid fa-torii-gate'></i>" },
      { href: "youtube.html", label: " YouTube", icon: "<i class='fa-solid fa-play'></i>" },
      { href: "filmes.html", label: " Filmes", icon: "<i class='fa-solid fa-clapperboard'></i>" },
      { href: "episodios-desenhos.html", label: " Eps. Desenhos", icon: "<i class='fa-solid fa-play'></i>" },
      { href: "anime-episodios.html", label: " Eps. Animes", icon: "<i class='fa-solid fa-play'></i>" },
      { href: "youtube-videos.html", label: " Eps. YouTube", icon: "<i class='fa-solid fa-play'></i>" },
      { href: "painel-cadastros.html", label: " Painel de Cadastros", icon: "<i class='fa-solid fa-pen-to-square'></i>" },
      { href: "mangas.html", label: " Mangas", icon: "<i class='fa-solid fa-book'></i>" },
      { href: "hq.html", label: " HQs", icon: "<i class='fa-regular fa-comment-dots'></i>" },
      { href: "loja.html", label: " SenseiMod Store", icon: "<i class='fa-solid fa-flag'></i>" },
      { href: "open-anime.html", label: " Open AnIme", icon: "<i class='fa-solid fa-robot'></i>" },
      { href: "agradecimento.html", label: " Agradecimento", icon: "<i class='fa-solid fa-heart'></i>" },
    ];

    const existingLinks = links.querySelectorAll("li");
    existingLinks.forEach((li) => li.remove());

    pages.forEach((page) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = page.href;
      link.innerHTML = `<span class="nav-icon">${page.icon}</span> ${page.label.trim()}`;

      if (
        currentPage === page.href ||
        (currentPage === "" && page.href === "index.html") ||
        (currentPage === "index.html" && page.href === "index.html")
      ) {
        link.classList.add("active");
      }

      li.appendChild(link);
      links.appendChild(li);
    });

    // Restaura a posiA§A£o do scroll da navbar salva no localStorage
    const savedScroll = localStorage.getItem("navbarScrollPosition");
    if (savedScroll) {
      links.scrollLeft = parseInt(savedScroll);
    }

    // Salva a posiA§A£o do scroll sempre que houver rolagem
    links.addEventListener("scroll", () => {
      localStorage.setItem("navbarScrollPosition", links.scrollLeft.toString());
    });

    const onWheel = (e) => {
      const maxScroll = links.scrollWidth - links.clientWidth;
      if (maxScroll <= 2) return;

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.shiftKey) return;

      e.preventDefault();
      links.scrollLeft += e.deltaY;
    };

    links.addEventListener("wheel", onWheel, { passive: false });
  }

  window.setTheme = applyTheme;
  window.normalizeTheme = normalizeTheme;

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body && !document.body.classList.contains(savedTheme)) {
      ALL_THEME_CLASSES.forEach((cls) => document.body.classList.remove(cls));
      document.body.classList.add(savedTheme);
    }
    injectSwitcher();
    setupNavbarScrollIndicator();
  });
})();

