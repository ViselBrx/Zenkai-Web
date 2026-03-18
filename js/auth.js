/**
 * js/auth.js — Configuração e Lógica do Supabase
 * ==============================================
 * Aqui você deve colar a URL e a ANON KEY do seu projeto Supabase.
 */

// 1. INSIRA SUAS CREDENCIAIS AQUI:
const SUPABASE_URL = 'https://bxifddhrbxbmimjkgwzr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_secret_Cr0BzLecxWabufFasf0kQg_xJtI5VsM';

// 2. Inicializa o cliente do Supabase
let supabase;
if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabase; // Expondo para o db.js
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

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            errorDiv.textContent = "Email ou senha incorretos.";
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar no Painel';
        } else {
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

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Criar Conta';
        } else {
            successDiv.style.display = 'block';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    });
}

// 6. Lógica Global: Mudar Botoes da Navbar / Proteção de Rota
async function checkAuthStatus() {
    if (!supabase) return;

    const { data: { session } } = await supabase.auth.getSession();
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

    // Nova lógica: Injetar botão de Auth FIXO na navbar
    const nav = document.querySelector('.navbar');
    const links = document.querySelector('.navbar-links');

    if (links && !session) {
        // Usuário não logado, remove links de administração do menu sanduíche
        const adminLinks = Array.from(links.querySelectorAll('a')).filter(a => a.href.includes('cadastro.html') || a.href.includes('cadastro-animes.html'));
        adminLinks.forEach(a => a.parentElement.remove());
    }

    if (nav) {
        const existingContainer = document.getElementById('globalAuthContainer');
        if (existingContainer) existingContainer.remove();

        const authContainer = document.createElement('div');
        authContainer.id = 'globalAuthContainer';
        
        // Empurra para a direita, ao lado do botão de menu sanduíche
        authContainer.style.cssText = 'display: flex; gap: 10px; margin-left: auto; margin-right: 20px; align-items: center; z-index: 2000;';

        if (session) {
            authContainer.innerHTML = `
                <a href="cadastro.html" class="btn btn-primary btn-sm" style="padding: 6px 12px; font-size: 0.8rem; box-shadow: none;">⚙️ Painel</a>
                <button id="globalLogoutBtn" class="btn btn-danger btn-sm" style="padding: 6px 12px; font-size: 0.8rem; box-shadow: none;">Sair</button>
            `;
        } else {
            if (!authRoutes.includes(currentPage)) {
                // Visitantes que não estão logados veem apenas o botão de Login
                authContainer.innerHTML = `
                    <a href="login.html" class="btn btn-ghost btn-sm" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--primary); color: var(--primary);">👤 Login / Cadastro</a>
                `;
            }
        }

        const burger = document.getElementById('navBurger');
        if (burger) {
            nav.insertBefore(authContainer, burger);
        } else {
            nav.appendChild(authContainer);
        }

        if (session) {
            document.getElementById('globalLogoutBtn').onclick = async () => {
                await supabase.auth.signOut();
                window.location.reload();
            };
        }
    }
}

// Escuta a navbar ser gerada no themes.js e logo em seguida roda auth
document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay pra dar tempo do themes.js injetar os links na navbar
    setTimeout(checkAuthStatus, 100);
});
