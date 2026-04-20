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
  ];

  function normalizeTheme(theme) {
    const rawTheme = String(theme || "").trim();
    if (THEME_ALIASES[rawTheme]) return THEME_ALIASES[rawTheme];
    
    // Proteção para o tema cromático: só permite se estiver marcado como equipado no localStorage
    // Isso garante que apenas quem comprou e equipou possa usar, e evita que o tema 
    // fique ativo para outros usuários na mesma máquina após logout (auth.js limpa essa chave).
    if (rawTheme === "theme-cromatico") {
      const isEquipped = localStorage.getItem("equipped_tema_cromatico") === "true" || 
                         localStorage.getItem("animehouse_tema_cromatico") === "true" ||
                         (window.DB?._store?.profile?.store_data?.equipped?.tema_cromatico === true);
      if (!isEquipped) return "theme-ciano";
    }

    return AVAILABLE_THEMES.has(rawTheme) ? rawTheme : "theme-ciano";
  }

  // Restaurar tema cromático de volta à sessionStorage se estava equipado no localStorage
  // (necessário quando o usuário abre nova sessão/aba sem um tema salvo na sessão)
  if (
    localStorage.getItem("animehouse_tema_cromatico") === "true" &&
    (!sessionStorage.getItem("theme") || sessionStorage.getItem("theme") === "theme-ciano")
  ) {
    sessionStorage.setItem("theme", "theme-cromatico");
  }

  // Apply the saved theme early to avoid a flash on load.
  const savedTheme = normalizeTheme(sessionStorage.getItem("theme"));
  document.documentElement.className = savedTheme;
  sessionStorage.setItem("theme", savedTheme);

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
            <button class="theme-main-btn" title="Mudar cor"><span>🎨</span></button>
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
      { href: "index.html", label: "🏠 Inicio", icon: "🏠" },
      { href: "catalogo-desenhos.html", label: "🎬 Desenhos", icon: "🎬" },
      { href: "animes.html", label: "⛩️ Animes", icon: "⛩️" },
      { href: "youtube.html", label: "▶️ YouTube", icon: "▶️" },
      { href: "filmes.html", label: "🎬 Filmes", icon: "🎬" },
      { href: "desenhos.html", label: "▶️ Eps. Desenhos", icon: "▶️" },
      { href: "anime-episodios.html", label: "▶️ Eps. Animes", icon: "▶️" },
      { href: "youtube-videos.html", label: "▶️ Eps. YouTube", icon: "▶️" },
      { href: "cadastro.html", label: "📝 Cad. Desenhos", icon: "📝" },
      { href: "cadastro-animes.html", label: "📝 Cad. Animes", icon: "📝" },
      { href: "cadastro-filmes.html", label: "📝 Cad. Filmes", icon: "📝" },
      { href: "cadastro-youtube.html", label: "📝 Cad. YouTube", icon: "📝" },
      { href: "mangas.html", label: "📚 Mangas", icon: "📚" },
      { href: "loja.html", label: "🎌 SenseiMod Store", icon: "🎌" },
      { href: "open-anime.html", label: "🤖 Open AnIme", icon: "🤖" },
      { href: "agradecimento.html", label: "💖 Agradecimento", icon: "💖" },
    ];

    const existingLinks = links.querySelectorAll("li");
    existingLinks.forEach((li) => li.remove());

    pages.forEach((page) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = page.href;
      link.innerHTML = `<span class="nav-icon">${page.icon}</span> ${page.label.split(" ").slice(1).join(" ")}`;

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

    // Restaura a posição do scroll da navbar salva no localStorage
    const savedScroll = localStorage.getItem("navbarScrollPosition");
    if (savedScroll) {
      links.scrollLeft = parseInt(savedScroll);
    }

    // Salva a posição do scroll sempre que houver rolagem
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
