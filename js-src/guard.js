/**
 * js/guard.js — Controle de Acesso para Usuários Não Logados
 * Este script verifica se o usuário tem uma sessão ativa.
 * Caso não tenha, ele bloqueia o acesso a páginas restritas redirecionando para login.html.
 */

window.requireContentAccess = function () {
    if (window.AH_AUTH?.isAuthenticated) return true;
    const currentPath = window.location.pathname.split('/').pop() || "index.html";
    window.location.href = `login.html?redirect=${encodeURIComponent(currentPath + window.location.search)}`;
    return false;
};

window.resetGuestProfileState = function () {
    if (window.AH_AUTH?.isAuthenticated) return;
    window.AH_GUEST_PROFILE = { id: null, name: "Visitante", xp: 0, total_xp: 0, level: 0, rank: "" };
    document.documentElement.classList.add("guest-session");

    const homeStatus = document.getElementById("homeUserStatus");
    if (homeStatus) homeStatus.style.display = "none";
    const homeRank = document.getElementById("homeUserRank");
    if (homeRank) homeRank.textContent = "";
    const homeLevel = document.getElementById("homeUserLevel");
    if (homeLevel) homeLevel.textContent = "LVL 0";
};

document.addEventListener("DOMContentLoaded", async () => {
    // Lista de páginas que DEVEM ser bloqueadas para não logados
    const protectedPages = [
        "perfil.html",
        "usuarios.html",
        "compras.html",
        "loja.html",
        "painel-cadastros.html",
        "cadastro.html",
        "cadastro-animes.html",
        "cadastro-filmes.html",
        "cadastro-youtube.html",
        "jogo-gartic.html",
        "jogo-velha.html",
        "lobby.html",
        // adicione outras páginas de conteúdo aqui se necessário
    ];

    const currentPath = window.location.pathname.split('/').pop() || "index.html";

    // Verifica se a página atual é uma das protegidas
    const isProtected = protectedPages.includes(currentPath);

    // Função auxiliar para aguardar o supabaseClient estar disponível
    const getSupabaseClient = async () => {
        let retries = 50; // Tenta por até 5 segundos
        while (!window.supabaseClient && retries > 0) {
            await new Promise(r => setTimeout(r, 100));
            retries--;
        }
        return window.supabaseClient;
    };

    if (isProtected) {
        const client = await getSupabaseClient();
        if (client) {
            const { data: { session } } = await client.auth.getSession();
            if (!session) {
                // Opcional: passar um parâmetro de retorno
                window.location.href = `login.html?redirect=${encodeURIComponent(currentPath + window.location.search)}`;
            }
        } else {
            // Se falhou ao carregar o Supabase, por segurança redireciona
            window.location.href = "login.html";
        }
    } else {
        window.resetGuestProfileState();
    }
});

document.addEventListener("click", (event) => {
    if (window.AH_AUTH?.isAuthenticated) return;
    const protectedAction = event.target.closest(".fav-star, .watched-modal-badge, #saveTimeNoteBtn, [data-requires-auth]");
    if (!protectedAction) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.requireContentAccess();
}, true);
