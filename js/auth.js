/**
 * js/auth.js — Configuração e Lógica do Supabase
 * ==============================================
 * Aqui você deve colar a URL e a ANON KEY do seu projeto Supabase.
 */

// 1. INSIRA SUAS CREDENCIAIS AQUI:
const SUPABASE_URL = 'https://bxifddhrbxbmimjkgwzr.supabase.co';
// ⚠️ ATENÇÃO: NÃO COLOQUE A 'URL SECRET' AQUI! O GitHub bloqueia chaves que começam com sb_secret!
// O Supabase possui DUAS chaves: a "anon public" (que começa com eyJhb...) e a "service_role secret" (que começa com sb_secret)
// Você deve colar APENAS A CHAVE ANON (PÚBLICA) AQUI, pois é seguro deixá-la no frontend.
const SUPABASE_ANON_KEY = 'sb_publishable_P2YveYtfG8469tWxpcR0ig_hZxLXIol';

// 2. Inicializa o cliente do Supabase
let supaClient;
if (window.supabase) {
    try {
        supaClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supaClient; // Expondo para o db.js
        console.log("Supabase inicializado com sucesso.");
    } catch (e) {
        console.error("Erro ao criar cliente Supabase:", e);
    }
} else {
    console.error("Erro: Biblioteca Supabase não encontrada! Verifique o link do CDN no HTML.");
}

// 3. Funções Utilitárias de UI (Toast/Alert)
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) {
        alert(msg);
        return;
    }
    toast.textContent = msg;
    toast.style.background = isError ? 'var(--danger)' : 'var(--success)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// 4. Lógica de Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        if (SUPABASE_URL === 'COLE_AQUI_SUA_URL_DO_SUPABASE') {
            errorDiv.textContent = "Erro: Configuração do Supabase ausente. Preencha auth.js.";
            errorDiv.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';
        errorDiv.style.display = 'none';

        console.log("Tentando login com:", email);
        const { data, error } = await supaClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("Erro no login:", error);
            errorDiv.textContent = "Erro: " + (error.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : error.message);
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar no Painel';
        } else {
            console.log("Login realizado:", data);
            showToast('Login realizado com sucesso!');
            setTimeout(() => {
                window.location.href = 'index.html'; // Redireciona pro DB
            }, 1000);
        }
    });
}

// 5. Lógica de Registro
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

        if (SUPABASE_URL === 'COLE_AQUI_SUA_URL_DO_SUPABASE') {
            errorDiv.textContent = "Erro: Configuração do Supabase ausente. Preencha auth.js.";
            errorDiv.style.display = 'block';
            return;
        }

        if (password !== confirmPassword) {
            errorDiv.textContent = "As senhas não coincidem.";
            errorDiv.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrando...';
        errorDiv.style.display = 'none';

        console.log("Tentando registro com:", email);
        const { data, error } = await supaClient.auth.signUp({
            email,
            password
        });

        if (error) {
            console.error("Erro no registro:", error);
            errorDiv.textContent = "Erro ao registrar: " + error.message;
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Criar Conta';
        } else {
            console.log("Registro realizado:", data);
            successDiv.style.display = 'block';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    });
}

// 6. Lógica Global: Mudar Botoes da Navbar / Proteção de Rota
async function checkAuthStatus() {
    if (!supaClient) return;

    const { data: { session } } = await supaClient.auth.getSession();
    const currentPage = window.location.pathname.split('/').pop();

    // Rotas protegidas (apenas logados)
    const protectedRoutes = ['cadastro.html', 'cadastro-animes.html'];

    if (protectedRoutes.includes(currentPage)) {
        if (!session) {
            // Não tá logado! Manda pro login
            window.location.href = 'login.html';
            return;
        }
    }

    // Rotas de Auth (não acessíveis se já tiver logado)
    const authRoutes = ['login.html', 'registro.html'];
    if (authRoutes.includes(currentPage) && session) {
        window.location.href = 'index.html';
        return;
    }

    // Ocultar botões de login na home se estiver logado
    if (currentPage === 'index.html' || currentPage === '') {
        const bannerActions = document.querySelector('.home-banner div');
        if (bannerActions && session) {
            bannerActions.style.display = 'none';
        }
    }

    // Nova lógica: Injetar botão de Auth FIXO na navbar
    const nav = document.querySelector('.navbar');
    const links = document.querySelector('.navbar-links');

    if (links && !session) {
        // Usuário não logado, remove links de administração do menu sanduíche
        const adminLinks = Array.from(links.querySelectorAll('a')).filter(a => a.href.includes('cadastro.html') || a.href.includes('cadastro-animes.html'));
        adminLinks.forEach(a => {
            if (a.parentElement.tagName === 'LI') a.parentElement.remove();
            else a.remove();
        });
    }

    if (nav) {
        const existingContainer = document.getElementById('globalAuthContainer');
        if (existingContainer) existingContainer.remove();

        const authContainer = document.createElement('div');
        authContainer.id = 'globalAuthContainer';

        // Estilo: Compacto no canto
        authContainer.style.cssText = 'display: flex; gap: 10px; margin-left: auto; margin-right: 5px; align-items: center; z-index: 2000;';

        if (session) {
            // Busca dados do perfil (Avatar)
            const { data: profile } = await supaClient
                .from('profiles')
                .select('avatar_url, username')
                .eq('id', session.user.id)
                .single();
            
            const avatarUrl = profile?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

            authContainer.innerHTML = `
                <a href="cadastro.html" class="btn btn-primary btn-sm" style="padding: 5px 10px; font-size: 0.75rem; box-shadow: none;">⚙️ Painel</a>
                <a href="perfil.html" title="Meu Perfil" style="display: flex; align-items: center;">
                    <img src="${avatarUrl}" alt="Perfil" style="width:38px; height:38px; border-radius:50%; border:2px solid var(--primary); object-fit:cover; box-shadow: 0 0 8px rgba(var(--primary-rgb), 0.3); transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                </a>
            `;
        } else {
            if (!authRoutes.includes(currentPage)) {
                // Visitantes que não estão logados veem apenas o botão de Login
                authContainer.innerHTML = `
                    <a href="login.html" class="btn btn-ghost btn-sm" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--primary); color: var(--primary);">👤 Entrar</a>
                `;
            }
        }

        // Coloca no final absoluto da navbar para ficar no "canto"
        nav.appendChild(authContainer);
    }
}

// Escuta a navbar ser gerada no themes.js e logo em seguida roda auth
document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay pra dar tempo do themes.js injetar os links na navbar
    setTimeout(checkAuthStatus, 100);
});
