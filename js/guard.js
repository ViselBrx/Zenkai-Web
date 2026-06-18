/**
 * js/guard.js — Controle de Acesso para Usuários Não Logados
 * Este script verifica se o usuário tem uma sessão ativa.
 * Caso não tenha, ele bloqueia o acesso a páginas restritas redirecionando para login.html.
 */

document.addEventListener("DOMContentLoaded", async () => {
    // Lista de páginas que DEVEM ser bloqueadas para não logados
    const protectedPages = [
        "youtube.html",
        "youtube-videos.html",
        "cadastro-youtube.html",
        
        "anime-episodios.html",
        "episodios-desenhos.html",
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
                console.log("Acesso negado: Redirecionando para login.");
                // Opcional: passar um parâmetro de retorno
                window.location.href = `login.html?redirect=${encodeURIComponent(currentPath + window.location.search)}`;
            }
        } else {
            // Se falhou ao carregar o Supabase, por segurança redireciona
            window.location.href = "login.html";
        }
    }
});
