(function() {
    async function applyTheme(theme) {
        document.body.classList.remove('theme-default', 'theme-ben10', 'theme-vinland', 'theme-aot', 'theme-tt-classic', 'theme-mutant-rex');
        if (theme) document.body.classList.add(theme);
        else document.body.classList.add('theme-default');
        
        // Salvar no servidor (Persistência Definitiva)
        try {
            await fetch('/api/set-theme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme })
            });
        } catch (e) { console.error('Erro ao salvar tema no servidor:', e); }

        // Sincronizar botões se existirem
        document.querySelectorAll('.theme-opt-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
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

        // Sincronizar estado inicial com a classe injetada pelo servidor
        const currentTheme = Array.from(document.body.classList).find(c => c.startsWith('theme-')) || '';
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
            { href: 'home.html', label: '🏠 Início', icon: '🏠' },
            { href: 'index.html', label: '🎬 Desenhos', icon: '🎬' },
            { href: 'animes.html', label: '⛩️ Animes', icon: '⛩️' },
            { href: 'desenhos.html', label: '▶️ Eps. Desenhos', icon: '▶️' },
            { href: 'anime-episodios.html', label: '▶️ Eps. Animes', icon: '▶️' },
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
            if (currentPage === page.href || (currentPage === '' && page.href === 'index.html')) {
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
        injectSwitcher();
        setupNavbarScrollIndicator();
        // Não chamamos applyTheme() aqui para não sobrescrever a injeção do servidor
    });
})();
