(function() {
    // Aplicação imediata para evitar flash de estilo no carregamento da página
    const savedTheme = sessionStorage.getItem('theme') || 'theme-default';
    document.documentElement.className = savedTheme;

    function applyTheme(theme) {
        const themeToApply = theme || 'theme-default';
        document.documentElement.className = themeToApply;
        if (document.body) {
            document.body.className = themeToApply;
        }
        
        // Salvar na sessão local (apaga ao fechar navegador, mantém no refresh)
        sessionStorage.setItem('theme', themeToApply);

        // Sincronizar botões se existirem
        document.querySelectorAll('.theme-opt-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === themeToApply);
        });
    }

    function injectSwitcher() {
        if (document.getElementById('theme-switcher')) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'theme-switcher';
        wrapper.className = 'theme-switcher-wrapper';
        wrapper.innerHTML = `
            <button class="theme-main-btn" title="Mudar Tema"><span>🎨</span></button>
            <div class="theme-options">
                <button class="theme-opt-btn" data-theme="" title="Padrão">🏠</button>
                <button class="theme-opt-btn" data-theme="theme-ben10" title="Ben 10">🟢</button>
                <button class="theme-opt-btn" data-theme="theme-vinland" title="Vinland">🌾</button>
                <button class="theme-opt-btn" data-theme="theme-aot" title="Attack on Titan">⚔️</button>
                <button class="theme-opt-btn" data-theme="theme-tt-classic" title="Jovens Titãs">💜</button>
                <button class="theme-opt-btn" data-theme="theme-mutant-rex" title="Mutante Rex">🦎</button>
                <button class="theme-opt-btn" data-theme="theme-regular-show" title="Regular Show">🔵</button>
                <button class="theme-opt-btn" data-theme="theme-vagabond" title="Vagabond">⚪</button>
            </div>
        `;

        // Injetar direto no body: o switcher é fixed e deve funcionar igual em todas as páginas
        document.body.appendChild(wrapper);

        const mainBtn = wrapper.querySelector('.theme-main-btn');
        mainBtn.addEventListener('click', () => {
            wrapper.classList.toggle('active');
        });

        wrapper.querySelectorAll('.theme-opt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                applyTheme(btn.getAttribute('data-theme'));
                wrapper.classList.remove('active');
            });
        });

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) wrapper.classList.remove('active');
        });

        // Sincronizar estado inicial
        const currentTheme = sessionStorage.getItem('theme') || 'theme-default';
        document.querySelectorAll('.theme-opt-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === currentTheme);
        });
    }

    function setupNavbarScrollIndicator() {
        const nav = document.querySelector('.navbar');
        const links = document.querySelector('.navbar-links');
        if (!nav || !links) return;

        // Adicionar todas as páginas aos links
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        const pages = [
            { href: 'index.html', label: '🏠 Início', icon: '🏠' },
            { href: 'catalogo-desenhos.html', label: '🎬 Desenhos', icon: '🎬' },
            { href: 'animes.html', label: '⛩️ Animes', icon: '⛩️' },
            { href: 'filmes.html', label: '🎬 Filmes', icon: '🎬' },
            { href: 'desenhos.html', label: '▶️ Eps. Desenhos', icon: '▶️' },
            { href: 'anime-episodios.html', label: '▶️ Eps. Animes', icon: '▶️' },
            { href: 'cadastro.html', label: '📝 Cad. Desenhos', icon: '📝' },
            { href: 'cadastro-animes.html', label: '📝 Cad. Animes', icon: '📝' },
            { href: 'cadastro-filmes.html', label: '📝 Cad. Filmes', icon: '📝' },
            { href: 'mangas.html', label: '📚 Mangás', icon: '📚' },
            { href: 'agradecimento.html', label: '💖 Agradecimento', icon: '💖' },
            { href: 'open-anime.html', label: '🤖 Open AnIme', icon: '🤖' }
        ];

        // Limpar links existentes (mantém apenas o brand)
        const existingLinks = links.querySelectorAll('li');
        existingLinks.forEach(li => li.remove());

        // Adicionar novos links
        pages.forEach(page => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = page.href;
            link.innerHTML = `<span class="nav-icon">${page.icon}</span> ${page.label.split(' ').slice(1).join(' ')}`;
            
            // Marcar como ativo se for a página atual
            if (currentPage === page.href || (currentPage === '' && page.href === 'index.html') || (currentPage === 'index.html' && page.href === 'index.html')) {
                link.classList.add('active');
            }
            
            li.appendChild(link);
            links.appendChild(li);
        });

        // Scroll suave com mouse wheel
        const onWheel = (e) => {
            const maxScroll = links.scrollWidth - links.clientWidth;
            if (maxScroll <= 2) return;

            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
            if (e.shiftKey) return;

            e.preventDefault();
            links.scrollLeft += e.deltaY;
        };
        
        links.addEventListener('wheel', onWheel, { passive: false });
    }

    window.setTheme = applyTheme;

    document.addEventListener('DOMContentLoaded', () => {
        if (document.body && !document.body.className.includes(savedTheme)) {
            document.body.className = savedTheme;
        }
        injectSwitcher();
        setupNavbarScrollIndicator();
    });
})();
