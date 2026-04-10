/**
 * js/auth.js — Configuração e Lógica do Supabase (LIMPO E ORGANIZADO)
 */

// 1. CREDENCIAIS
const SUPABASE_URL = window.ENV?.SUPABASE_URL || 'https://bxifddhrbxbmimjkgwzr.supabase.co';
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || 'sb_publishable_P2YveYtfG8469tWxpcR0ig_hZxLXIol';

// 2. Inicializa o cliente
let supaClient;
let previousSessionId = null;

if (window.supabase) {
    try {
        supaClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supaClient;
        
        supaClient.auth.onAuthStateChange((event, session) => {
            const currentSessionId = session?.user?.id || null;
            if (previousSessionId !== null && previousSessionId !== currentSessionId) {
                window.location.reload();
            }
            previousSessionId = currentSessionId;
        });
    } catch (e) { console.error("Erro Supabase:", e); }
}

// 3. Lógica de Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';
        errorDiv.style.display = 'none';

        try {
            const { data, error } = await supaClient.auth.signInWithPassword({ email, password });
            if (error) {
                errorDiv.textContent = "Erro: " + (error.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : error.message);
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Entrar no Painel';
                return;
            }

            if (data.user && !data.user.email_confirmed_at) {
                errorDiv.textContent = "⚠️ Confirme seu email antes de entrar.";
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Entrar';
                return;
            }

            window.location.href = 'index.html';
        } catch (err) {
            errorDiv.textContent = "Erro inesperado.";
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
        }
    });
}

// 4. Lógica de Registro
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorDiv = document.getElementById('registerError');
        const successDiv = document.getElementById('registerSuccess');
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        if (password !== confirmPassword) {
            errorDiv.textContent = "As senhas não coincidem.";
            errorDiv.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';

        const { data, error } = await supaClient.auth.signUp({ email, password });
        if (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
        } else {
            successDiv.style.display = 'block';
            submitBtn.disabled = false;
        }
    });
}

// 5. Banners e Cosméticos
window.loadBanners = async function() {
    window.BANNER_MAP = {}; 
    
    if (window.supabaseClient) {
        try {
            console.log("🛰️ Sincronizando com Storage do Supabase...");
            const { data: supaBanners } = await window.supabaseClient.from('store_banners').select('id, image_url');
            
            if (supaBanners) {
                supaBanners.forEach(b => {
                    if (b.image_url) {
                        const cleanId = b.id.trim();
                        window.BANNER_MAP[cleanId] = b.image_url;
                        
                        // Mapeamentos Inteligentes (Garante compatibilidade com a Loja)
                        if (cleanId.includes('guts')) window.BANNER_MAP['banner_berserk'] = b.image_url;
                        if (cleanId.includes('aurora')) window.BANNER_MAP['banner_claro'] = b.image_url;
                        if (cleanId.includes('shiganshina')) window.BANNER_MAP['banner_aot'] = b.image_url;
                        if (cleanId.includes('vinland')) window.BANNER_MAP['banner_vinland'] = b.image_url;
                        if (cleanId.includes('cosmica')) window.BANNER_MAP['banner_cosmica'] = b.image_url;
                        if (cleanId.includes('oni')) window.BANNER_MAP['banner_oni'] = b.image_url;
                        if (cleanId.includes('shinobi')) window.BANNER_MAP['banner_shinobi'] = b.image_url;
                        if (cleanId.includes('ragnarok')) window.BANNER_MAP['banner_ragnarok'] = b.image_url;
                        if (cleanId.includes('cosmos')) window.BANNER_MAP['banner_cosmos'] = b.image_url;
                        
                        // Se o usuário subir com extensão, mapeia também
                        const idNoExt = cleanId.replace(/\.[^/.]+$/, "");
                        window.BANNER_MAP[idNoExt] = b.image_url;
                    }
                });
            }
            updateNavbarCosmetics();
        } catch (err) { console.error("❌ Erro Banners:", err); }
    }
};

window.updateNavbarCosmetics = function() {
    const bannerBg = document.querySelector('.user-nav-banner-bg');
    const titleEl = document.querySelector('.user-nav-title');
    const avatarBox = document.querySelector('.user-nav-avatar-box');
    const navAvatar = document.getElementById('navAvatar');
    const burger = document.getElementById('navBurger');
    
    // 💡 Cursor fixes
    if (burger) burger.style.cursor = 'pointer';
    document.querySelectorAll('.navbar-links a').forEach(a => a.style.cursor = 'pointer');

    // Se o elemento ainda não existe (navbar carregando), tenta novamente em 100ms
    if (!bannerBg) {
        setTimeout(updateNavbarCosmetics, 100);
        return;
    }

    // 💡 Dados do Banco (Preferencial)
    let sData = null;
    if (window.DB && window.DB._store && window.DB._store.profile) {
        sData = window.DB._store.profile.store_data || {};
    }

    const savedBanner = (sData && sData.equipped && sData.equipped.banner) || localStorage.getItem('animehouse_customBanner') || 'none';
    const savedAura   = (sData && sData.equipped && sData.equipped.aura)   || localStorage.getItem('animehouse_customAura')   || 'none';
    const savedTitle  = (sData && sData.equipped && sData.equipped.titulo) || localStorage.getItem('animehouse_customTitle')  || '';
    const savedCrown  = (sData && sData.equipped && sData.equipped.crown)  || localStorage.getItem('animehouse_showCrown') === 'true';
    const hasFrame    = (sData && sData.equipped && sData.equipped.frame_dourado) || localStorage.getItem('equipped_frame_dourado') === 'true';

    // 📸 LÓGICA DE BANNER
    if (savedBanner !== 'none' && window.BANNER_MAP) {
        const url = window.BANNER_MAP[savedBanner];
        if (url) {
            console.log(`🖼️ Aplicando banner: ${savedBanner} -> ${url}`);
            bannerBg.style.backgroundImage = `url('${url}')`;
            bannerBg.style.display = 'block';
            bannerBg.style.opacity = '1';
        } else {
            console.warn(`⚠️ Link do banner '${savedBanner}' não encontrado no BANNER_MAP.`);
            bannerBg.style.display = 'none';
        }
    } else {
        bannerBg.style.display = 'none';
    }

    // 🎓 TÍTULO
    if (titleEl) {
        titleEl.textContent = savedTitle;
        titleEl.style.display = savedTitle ? 'block' : 'none';
    }

    // ✨ AURA & FRAME
    const auraClasses = [
        'aura-common-chama', 'aura-common-naruto',
        'aura-rare-ceifador', 'aura-rare-thunder', 'aura-rare-susanoo', 'aura-rare-sakura',
        'aura-epic-gelo', 'aura-epic-stands', 'aura-epic-void',
        'aura-legendary-dragon',
        'avatar-aura-fire', 'avatar-aura-guardian', 'avatar-aura-immortal',
        'frame-dourado'
    ];
    avatarBox.classList.remove(...auraClasses);
    
    if (savedAura !== 'none') {
        avatarBox.classList.add(savedAura);
    }
    
    if (hasFrame) {
        avatarBox.classList.add('frame-dourado');
    }

    if (navAvatar) navAvatar.style.border = 'none';

    // 👑 COROA
    const existingCrown = avatarBox.querySelector('.crown-nav');
    if (existingCrown) existingCrown.remove();
    if (savedCrown) {
        const crown = document.createElement('div');
        crown.className = 'crown-nav';
        crown.innerHTML = '👑';
        crown.style.cssText = 'position: absolute; top: -16px; left: 50%; transform: translateX(-50%) rotate(10deg); font-size: 1.3rem; z-index: 10; text-shadow: 0 0 8px gold;';
        avatarBox.appendChild(crown);
    }

    // 🏠 APLICAR EM PÁGINAS ESPECÍFICAS (PERFIL / HISTÓRICO)
    if (window.location.href.includes('perfil.html') && savedBanner !== 'none') {
        const sidebar = document.querySelector('.history-sidebar') || document.querySelector('.profile-sidebar');
        const bannerUrl = window.BANNER_MAP ? window.BANNER_MAP[savedBanner] : null;

        if (sidebar && bannerUrl) {
            console.log("📌 Aplicando banner no Histórico...");
            sidebar.style.position = 'relative';
            sidebar.style.overflow = 'hidden';
            sidebar.style.zIndex = '1';
            
            let bgOverlay = sidebar.querySelector('.sidebar-banner-overlay');
            if (!bgOverlay) {
                bgOverlay = document.createElement('div');
                bgOverlay.className = 'sidebar-banner-overlay';
                bgOverlay.style.cssText = 'position:absolute; inset:0; z-index:-1; transition:0.5s; pointer-events:none;';
                sidebar.prepend(bgOverlay);
            }
            
            bgOverlay.style.backgroundImage = `linear-gradient(rgba(10, 25, 47, 0.6), rgba(10, 25, 47, 0.9)), url('${bannerUrl}')`;
            bgOverlay.style.backgroundSize = 'cover';
            bgOverlay.style.backgroundPosition = 'center';
            bgOverlay.style.opacity = '0.65'; // Opacidade alta como solicitado
        }
    }
};

window.addEventListener('profileUpdated', (event) => {
    const detail = event?.detail || {};
    const navAvatar = document.getElementById('navAvatar');
    const nextAvatar = String(detail.avatarUrl || detail.avatar_url || '').trim();

    if (navAvatar && nextAvatar) {
        navAvatar.src = nextAvatar;
    }

    if (typeof window.updateNavbarCosmetics === 'function') {
        window.updateNavbarCosmetics();
    }
});

window.addEventListener('storage', () => {
    if (typeof window.updateNavbarCosmetics === 'function') {
        window.updateNavbarCosmetics();
    }
});

// 6. Auth Status & Navbar Injection
window.checkAuthStatus = async function() {
    if (!supaClient) return;
    const { data: { session } } = await supaClient.auth.getSession();
    const currentPage = window.location.pathname.split('/').pop();
    const nav = document.querySelector('.navbar');

    // Ocultar botões de login na home se estiver logado
    if ((currentPage === 'index.html' || currentPage === '') && session) {
        const bannerActions = document.querySelector('.hero-buttons') || document.getElementById('homeBannerActions');
        if (bannerActions) {
            const level = localStorage.getItem('animehouse_userLevel') || '1';
            const rank = localStorage.getItem('animehouse_userRank') || 'Novato';
            
            bannerActions.innerHTML = `
                <div id="homeUserStatus" style="display: flex; align-items: center; justify-content: center; margin-top: 15px; animation: fadeIn 1.2s ease;">
                    <div style="display: flex; align-items: center; background: rgba(var(--primary-rgb), 0.15); padding: 6px 20px; border-radius: 50px; border: 1px solid var(--primary); box-shadow: 0 0 15px rgba(var(--primary-rgb), 0.4); backdrop-filter: blur(8px);">
                        <span style="color: var(--primary); font-weight: 900; font-size: 0.85rem; margin-right: 12px; font-family: 'Fredoka', sans-serif; letter-spacing: 1px; text-transform: uppercase;">LVL ${level}</span>
                        <span style="color: #fff; font-family: 'Bangers', cursive; font-size: 1.4rem; letter-spacing: 2px; text-shadow: 0 0 10px var(--primary);">
                            ${rank}
                        </span>
                    </div>
                </div>
            `;
        }
    }

    if (nav) {
        const existing = document.getElementById('globalAuthContainer');
        if (existing) existing.remove();

        const authContainer = document.createElement('div');
        authContainer.id = 'globalAuthContainer';
        authContainer.style.cssText = 'display: flex; gap: 10px; margin-left: auto; align-items: center; z-index: 2000;';

        if (session) {
            const { data: profile } = await supaClient.from('profiles').select('avatar_url').eq('id', session.user.id).single();
            const avatarUrl = profile?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
            
            authContainer.innerHTML = `
                <a href="perfil.html" class="user-nav-link" style="text-decoration: none;">
                    <div class="user-nav-container">
                        <div class="user-nav-banner-bg"></div>
                        <span class="user-nav-title"></span>
                        <div class="user-nav-avatar-box">
                           <img id="navAvatar" src="${avatarUrl}" alt="Perfil" style="width:100%; height:100%; border-radius:50%; object-fit:cover; z-index: 5;">
                        </div>
                    </div>
                </a>
            `;
            nav.appendChild(authContainer);
            if (!window.BANNER_MAP) await loadBanners();
            else updateNavbarCosmetics();
        } else {
            authContainer.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">👤 Entrar</a>`;
            nav.appendChild(authContainer);
        }
    }

    // Proteção de rotas
    const protected = ['cadastro.html', 'cadastro-animes.html'];
    if (protected.includes(currentPage) && !session) window.location.href = 'login.html';
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { window.checkAuthStatus(); }, 150);
});
