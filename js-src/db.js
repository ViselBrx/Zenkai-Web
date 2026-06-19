/**
 * db.js — Cliente Supabase AnimeHouse
 * =====================================
 * Modificado para usar Supabase no lugar de armazenamento local!
 */

const ALL_ITEMS = [
    {
      id: "banner_claro",
      name: "Banner Aurora Simples",
      icon: "🌅",
      category: "banner",
      currency: "ouro",
      price: 3,
    },
    {
      id: "titulo_explorador",
      name: "Título: Explorador",
      icon: "🗺️",
      category: "titulo",
      currency: "ouro",
      price: 5,
    },
    {
      id: "aura_chama",
      name: "Aura Chama Simples",
      icon: "🔥",
      category: "aura",
      currency: "ouro",
      price: 8,
    },
    {
      id: "banner_cosmica",
      name: "Banner Noite Cósmica",
      icon: "🌌",
      category: "banner",
      currency: "ouro",
      price: 10,
    },
    {
      id: "titulo_caçador",
      name: "Título: Caçador de Episódios",
      icon: "🎯",
      category: "titulo",
      currency: "ouro",
      price: 6,
    },
    {
      id: "banner_berserk",
      name: "Banner: Eclipse de Guts",
      icon: "⚔️",
      category: "banner",
      currency: "ouro",
      price: 4,
    },
    {
      id: "titulo_espadachim",
      name: "Título: Espadachim Solitário",
      icon: "🗡️",
      category: "titulo",
      currency: "ouro",
      price: 5,
    },
    {
      id: "aura_chama_naruto",
      name: "Aura Modo Sábio",
      icon: "🔥",
      category: "aura",
      currency: "ouro",
      price: 7,
    },
    {
      id: "aura_ceifador",
      name: "Aura: Olhar do Ceifador",
      icon: "📓",
      category: "aura",
      currency: "ouro",
      price: 15,
    },
    {
      id: "banner_oni",
      name: "Banner Oni Samurai",
      icon: "🎭",
      category: "banner",
      currency: "diamante",
      price: 5,
    },
    {
      id: "aura_thunder",
      name: "Aura Relâmpago Elétrico",
      icon: "⚡",
      category: "aura",
      currency: "diamante",
      price: 8,
    },
    {
      id: "banner_shinobi",
      name: "Banner Shinobi Dark",
      icon: "🥷",
      category: "banner",
      currency: "diamante",
      price: 7,
    },
    {
      id: "titulo_mestre_das_listas",
      name: "Título: Mestre das Listas",
      icon: "📋",
      category: "titulo",
      currency: "diamante",
      price: 10,
    },
    {
      id: "aura_sakura",
      name: "Aura Pétala de Sakura",
      icon: "🌸",
      category: "aura",
      currency: "diamante",
      price: 9,
    },
    {
      id: "aura_gelo",
      name: "Aura Cristal de Gelo",
      icon: "❄️",
      category: "aura",
      currency: "diamante",
      price: 11,
    },
    {
      id: "banner_aot",
      name: "Banner: Attack on Titan",
      icon: "🧱",
      category: "banner",
      currency: "diamante",
      price: 6,
    },
    {
      id: "aura_susanoo",
      name: "Aura Susanoo Perfeito",
      icon: "⚡",
      category: "aura",
      currency: "diamante",
      price: 9,
    },
    {
      id: "banner_ragnarok",
      name: "Banner: Arena Ragnarok",
      icon: "🏛️",
      category: "banner",
      currency: "diamante",
      price: 10,
    },
    {
      id: "aura_stands",
      name: "Aura Stand: Star Platinum",
      icon: "🟣",
      category: "aura",
      currency: "diamante",
      price: 12,
    },
    {
      id: "coroa_lendaria",
      name: "Coroa Rei dos Animes",
      icon: "👑",
      category: "exclusivo",
      currency: "esmeralda",
      price: 3,
    },
    {
      id: "aura_dragon",
      name: "Aura Dragão Arcano",
      icon: "🐉",
      category: "aura",
      currency: "esmeralda",
      price: 5,
    },
    {
      id: "banner_cosmos",
      name: "Banner Cosmos",
      icon: "🌀",
      category: "banner",
      currency: "esmeralda",
      price: 4,
    },
    {
      id: "titulo_guardiao",
      name: "Título: Guardião Lenda",
      icon: "🛡️",
      category: "titulo",
      currency: "esmeralda",
      price: 2,
    },
    {
      id: "coroa_tryhard",
      name: "Caveira do Carrasco",
      icon: "💀",
      category: "exclusivo",
      currency: "esmeralda",
      price: 3,
    },
    {
      id: "titulo_sensei_mod",
      name: "Título: SenseiMod",
      icon: "🎓",
      category: "titulo",
      currency: "esmeralda",
      price: 5,
    },
    {
      id: "banner_vinland",
      name: "Banner: Vinland Saga",
      icon: "🛡️",
      category: "banner",
      currency: "esmeralda",
      price: 6,
    },
    {
      id: "aura_void_saitama",
      name: "Aura ONE PUNCH",
      icon: "👊",
      category: "aura",
      currency: "esmeralda",
      price: 4,
    },
    {
      id: "tema_cromatico",
      name: "Tema Cromático",
      icon: "🌈",
      category: "tema",
      currency: "esmeralda",
      price: 8,
    },
  ];

const RANK_HIERARCHY = [
    "Bronze",
    "Prata",
    "Ouro",
    "Mestre",
    "Lenda",
    "Hokage",
    "Guardião",
    "Imortal",
];

const WATCHED_ITEMS_TABLE = 'user_watched_items';
const WATCHED_ITEMS_SETUP_HINT = 'Execute database/schema/08_watched_items.sql no Supabase para ativar o checklist permanente.';

const _DEFAULT = {
    cartoons: [],
    episodes: {},
    movies: {},
    animes: [],
    animeEpisodes: {},
    animeMovies: {},
    mangas: [],
    mangaVolumes: {},
    mangaNotes: {},
    hqs: [],
    hqEditions: {},
    hqNotes: {},
    filmes: [],
    youtube_playlists: [],
    youtube_videos: {},
    watched: {},
    profile: null, // Perfil completo do usuÃ¡rio (incluindo store_data)
    aiConfig: {},
    siteConfig: {}
};
let _store = JSON.parse(JSON.stringify(_DEFAULT));

function isMissingRelationError(error) {
    const msg = String(error?.message || '');
    return error?.code === 'PGRST205'
        || /relation .* does not exist/i.test(msg)
        || /Could not find the table/i.test(msg);
}

function buildWatchedPersistenceError(error) {
    if (isMissingRelationError(error)) {
        return new Error(`Checklist permanente indisponÃ­vel. ${WATCHED_ITEMS_SETUP_HINT}`);
    }
    return new Error(error?.message || 'Falha ao salvar o checklist permanente.');
}

function clearWatchedItems(ids = []) {
    ids.forEach(id => {
        if (id) delete _store.watched[id];
    });
}

// Checa se o supabase estÃƒÂ¡ disponÃƒÂ­vel (injetado via auth.js)
function getSupa() {
    if (!window.supabaseClient) throw new Error("Supabase Client nÃ£o encontrado!");
    return window.supabaseClient;
}

// Obter o ID do usuÃƒÂ¡rio logado
async function getCurrentUserId() {
    const supa = getSupa();
    const { data: { session } } = await supa.auth.getSession();
    if (session?.user?.id) return session.user.id;
    const { data: { user } } = await supa.auth.getUser();
    return user?.id || null;
}

// Em operaÃƒÂ§ÃƒÂµes de escrita, o usuÃƒÂ¡rio precisa estar autenticado.
async function getRequiredUserId() {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('SessÃ£o expirada. FaÃ§a login novamente.');
    return userId;
}

/** Valida JWT com o servidor (mais confiÃ¡vel que sÃ³ getSession no storage). */
async function resolveAuthUserId() {
    const supa = getSupa();
    const { data: { user }, error } = await supa.auth.getUser();
    if (error) console.warn('[DB] getUser:', error.message);
    if (user?.id) return user.id;
    const { data: { session } } = await supa.auth.getSession();
    return session?.user?.id || null;
}

/** Garante JSON puro para a coluna JSONB (sem _userId, sem referÃªncias quebradas). */
function sanitizeStoreDataForDb(raw) {
    const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
    delete o._userId;
    try {
        return JSON.parse(JSON.stringify(o));
    } catch (e) {
        return {
            purchased: [],
            equipped: {},
            xp: 0,
            ouro: 0,
            diamante: 0,
            esmeralda: 0,
            rank: 'Novato'
        };
    }
}

// Verificar se o usuÃƒÂ¡rio pode editar/deletar um item
async function checkItemOwnership(itemId, table) {
    try {
        const supa = getSupa();
        const userId = await getRequiredUserId();
        
        // UsuÃƒÂ¡rios sÃƒÂ³ podem editar seus prÃƒÂ³prios dados
        const { data, error } = await supa.from(table).select('user_id').eq('id', itemId).single();
        
        if (error || !data) {
            throw new Error('Item nÃ£o encontrado.');
        }
        
        // Se o item for global (user_id Ã© null), permitimos que a requisiÃ§Ã£o siga.
        // O Supabase (RLS) vai barrar se o usuÃ¡rio nÃ£o for o admin no backend.
        if (data.user_id !== null && data.user_id !== userId) {
            throw new Error('VocÃª nÃ£o tem permissÃ£o para modificar este item.');
        }
        
        return true;
    } catch (err) {
        console.error("Erro ao verificar propriedade:", err);
        throw err;
    }
}

// UtilitÃƒÂ¡rio para limpar os iframes (Redecanais mudam muito de domÃƒÂ­nio)
// PROBLEMA RAIZ: os iframes usam hostname percent-encoded (ex: %72%65%64%65%63%61%6E%61%69%73%2E%6F%6F%6F
// que ÃƒÂ© 'redecanais.ooo'). Browsers NÃƒÆ’O conseguem resolver hostnames codificados assim,
// por isso o player fica preto. A correÃƒÂ§ÃƒÂ£o ÃƒÂ© decodificar o src e substituir o domÃƒÂ­nio.
function cleanIframe(iframe) {
    if (!iframe) return '';
    const iframeTrim = iframe.trim();

    // --- Caso 1: tag <iframe> completa ---
    if (iframeTrim.toLowerCase().startsWith('<iframe')) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(iframeTrim, 'text/html');
            const el = doc.querySelector('iframe');
            if (el) {
                let src = el.getAttribute('src') || '';

                // DECODE: converte %72%65%64... Ã¢â€ â€™ redecanais.ooo (etc.)
                try { src = decodeURIComponent(src); } catch(e) { /* ignora erros de decode */ }

                // Protocolo absoluto
                if (src.startsWith('//')) src = 'https:' + src;
                if (src.startsWith('http://')) src = 'https://' + src.slice(7);

                // SubstituiÃƒÂ§ÃƒÂ£o de domÃƒÂ­nio (cobre todos os domÃƒÂ­nios conhecidos do Redecanais)
                src = src.replace(/redecanais\.[a-z]{2,10}/gi, 'redecanais.ph');

                el.setAttribute('src', src);
                el.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
                el.setAttribute('allowfullscreen', '');
                el.setAttribute('frameborder', '0');
                el.setAttribute('width', '100%');
                el.removeAttribute('loading');

                return el.outerHTML;
            }
        } catch(e) {
            console.warn('cleanIframe DOMParser error, usando fallback regex:', e);
        }

        // Fallback regex se DOMParser falhar
        return iframeTrim
            .replace(/src="([^"]+)"/gi, (_, rawSrc) => {
                let s = rawSrc;
                try { s = decodeURIComponent(s); } catch(e) {}
                if (s.startsWith('//')) s = 'https:' + s;
                s = s.replace(/redecanais\.[a-z]{2,10}/gi, 'redecanais.ph');
                return `src="${s}"`;
            })
            .replace(/allow="[^"]*"/gi, 'allow="autoplay; encrypted-media; picture-in-picture; fullscreen"');
    }

    // --- Caso 2: sÃƒÂ³ a URL ---
    let url = iframeTrim;
    try { url = decodeURIComponent(url); } catch(e) {}
    if (url.startsWith('//')) url = 'https:' + url;
    if (url.startsWith('http://')) url = 'https://' + url.slice(7);
    url = url.replace(/redecanais\.[a-z]{2,10}/gi, 'redecanais.ph');

    if (url.startsWith('https://')) {
        return `<iframe src="${url}" frameborder="0" width="100%" style="aspect-ratio:16/9" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    }

    return iframe; // devolve original se nÃƒÂ£o reconheceu
}

const MAIN_ACCOUNT_EMAIL = 'davizeravisel@gmail.com';
const USER_CATALOG_TABLES = [
    'cartoons',
    'episodes',
    'movies',
    'animes',
    'anime_episodes',
    'anime_movies',
    'mangas',
    'manga_volumes',
    'manga_notes',
    'hqs',
    'hq_editions',
    'hq_notes',
    'filmes',
    'youtube_playlists',
    'youtube_videos'
];

// Resgata itens legados sem user_id para o dono principal.
async function claimLegacyCatalogForMainAccount(userId) {
    const supa = getSupa();
    for (const table of USER_CATALOG_TABLES) {
        try {
            await supa.from(table).update({ user_id: userId }).is('user_id', null);
        } catch (error) {
            console.warn(`NÃ£o foi possÃ­vel resgatar legados em ${table}:`, error?.message || error);
        }
    }
}


const DB = {
  get _store() { return _store; },
  // Inicializa o banco (Baixa tudo do Supabase para a memÃ³ria local)
  async init(modules = 'all') {
    try {
        _store = JSON.parse(JSON.stringify(_DEFAULT));
        const supa = getSupa();
        // Filtro: Se logado, vÃª os seus + globais. Se deslogado, vÃª apenas os globais (nulos).
        const userId = await getCurrentUserId();
        
        const buildQuery = (table) => {
            let q = supa.from(table).select('*');
            if (userId) {
                q = q.or(`user_id.is.null,user_id.eq.${userId}`);
            } else {
                q = q.is('user_id', null);
            }
            return q;
        };

        const safeFetch = async (query, label) => {
            try {
                // Supabase pode limitar respostas a 1000 linhas por request.
                // Fazemos paginaÃ§Ã£o por faixa para carregar o catÃ¡logo completo.
                const pageSize = 1000;
                const maxPages = 200; // margem ampla de seguranÃ§a
                let page = 0;
                let allRows = [];

                while (page < maxPages) {
                    const from = page * pageSize;
                    const to = from + pageSize - 1;
                    const { data, error } = await query.range(from, to);
                    if (error) {
                        console.warn(`âš ï¸ [DB] Erro ao carregar ${label} (pÃ¡gina ${page + 1}):`, error.message);
                        return allRows;
                    }
                    const rows = data || [];
                    allRows = allRows.concat(rows);
                    if (rows.length < pageSize) break; // Ãºltima pÃ¡gina
                    page++;
                }
                return allRows;
            } catch (err) {
                console.error(`âŒ [DB] Falha crÃ­tica na query ${label}:`, err);
                return [];
            }
        };

        const fetchTasks = [];
        const results = {};

        const addFetch = (key, query, label) => {
            if (modules === 'all' || modules.includes(key)) {
                fetchTasks.push(
                    safeFetch(query, label).then(data => { results[key] = data; })
                );
            } else {
                results[key] = []; // vazio se nÃ£o for requisitado
            }
        };

        addFetch('cartoons', buildQuery('cartoons').order('created_at', { ascending: true }), 'Cartoons');
        addFetch('episodes', buildQuery('episodes'), 'Episodes');
        addFetch('movies', buildQuery('movies'), 'Movies');
        addFetch('animes', buildQuery('animes').order('created_at', { ascending: true }), 'Animes');
        addFetch('animeEpisodes', buildQuery('anime_episodes'), 'AnimeEpisodes');
        addFetch('mangas', buildQuery('mangas').order('created_at', { ascending: true }), 'Mangas');
        addFetch('mangaVolumes', buildQuery('manga_volumes').order('volume_number', { ascending: true }), 'MangaVolumes');
        addFetch('mangaNotes', buildQuery('manga_notes'), 'MangaNotes');
        addFetch('filmes', buildQuery('filmes').order('created_at', { ascending: true }), 'Filmes');
        addFetch('youtubePlaylists', buildQuery('youtube_playlists').order('created_at', { ascending: true }), 'YoutubePlaylists');
        addFetch('youtubeVideos', buildQuery('youtube_videos'), 'YoutubeVideos');
        addFetch('animeMovies', buildQuery('anime_movies'), 'AnimeMovies');
        addFetch('hqs', buildQuery('hqs').order('created_at', { ascending: true }), 'HQs');
        addFetch('hqEditions', buildQuery('hq_editions').order('edition_number', { ascending: true }), 'HQEditions');
        addFetch('hqNotes', buildQuery('hq_notes'), 'HQNotes');
        
        // Settings sempre carregado
        fetchTasks.push(safeFetch(supa.from('settings').select('*').limit(100), 'Settings').then(data => { results['settings'] = data; }));

        await Promise.all(fetchTasks);

        const cartoons = results.cartoons;
        const episodes = results.episodes;
        const movies = results.movies;
        const animes = results.animes;
        const animeEps = results.animeEpisodes;
        const mangas = results.mangas;
        const mangaVols = results.mangaVolumes;
        const mangaNotes = results.mangaNotes;
        const filmesData = results.filmes;
        const ytPlaylists = results.youtubePlaylists;
        const ytVideos = results.youtubeVideos;
        const animeMovies = results.animeMovies;
        const hqs = results.hqs;
        const hqEditions = results.hqEditions;
        const hqNotes = results.hqNotes;
        const settings = results.settings;

        // Busca de Perfil (Isolada para nÃ£o quebrar o catÃ¡logo se houver erro de coluna/schema)
        // Chave de localStorage isolada por usuÃ¡rio para garantir que cada conta tenha seus prÃ³prios dados
        const userStoreKey = `animehouse_store_${userId}`;
        try {
            const { data: profileData, error: profileError } = await supa.from('profiles').select('*').eq('id', userId).maybeSingle();
            if (profileError) {
                console.warn("âš ï¸ [DB] Erro ao carregar perfil do banco:", profileError.message);
            } else if (profileData) {
                _store.profile = profileData;

                const dbStore = profileData.store_data || { purchased: [], equipped: {} };
                let localParsed = null;
                try {
                    const raw = localStorage.getItem(userStoreKey);
                    if (raw) {
                        const p = JSON.parse(raw);
                        if (p && p._userId === userId) localParsed = p;
                    }
                } catch (e) { /* ignore */ }

                const dbP = Array.isArray(dbStore.purchased) ? [...dbStore.purchased] : [];
                const localP = localParsed && Array.isArray(localParsed.purchased) ? [...localParsed.purchased] : [];

                const mergedStore = JSON.parse(JSON.stringify(dbStore));
                mergedStore.purchased = [...new Set([...dbP, ...localP])];
                mergedStore.equipped = {
                    ...(localParsed?.equipped && typeof localParsed.equipped === 'object' ? localParsed.equipped : {}),
                    ...(dbStore.equipped && typeof dbStore.equipped === 'object' ? dbStore.equipped : {})
                };

                mergedStore._userId = userId;
                _store.profile.store_data = mergedStore;

                localStorage.setItem(userStoreKey, JSON.stringify(mergedStore));
                localStorage.setItem('animehouse_store', JSON.stringify(mergedStore));

                // ðŸ”„ Sincronizar TODOS os cosmÃ©ticos equipados para localStorage
                if (mergedStore.equipped && typeof mergedStore.equipped === 'object') {
                    // Sincronizar Aura
                    if (mergedStore.equipped.aura) {
                        localStorage.setItem('animehouse_customAura', mergedStore.equipped.aura);
                    } else if (mergedStore.equipped.aura === 'none') {
                        localStorage.setItem('animehouse_customAura', 'none');
                    }

                    // Sincronizar TÃ­tulo
                    if (mergedStore.equipped.titulo) {
                        localStorage.setItem('animehouse_customTitle', mergedStore.equipped.titulo);
                    } else if (mergedStore.equipped.titulo === '') {
                        localStorage.setItem('animehouse_customTitle', '');
                    }

                    // Sincronizar Banner
                    if (mergedStore.equipped.banner) {
                        localStorage.setItem('animehouse_customBanner', mergedStore.equipped.banner);
                    } else if (mergedStore.equipped.banner === 'none') {
                        localStorage.setItem('animehouse_customBanner', 'none');
                    }

                    // Sincronizar Coroa/Exclusivo
                    if (mergedStore.equipped.crown === true && mergedStore.equipped.crownId) {
                        localStorage.setItem('animehouse_showCrown', 'true');
                        localStorage.setItem('animehouse_equippedCrownId', mergedStore.equipped.crownId);
                        if (mergedStore.equipped.crownIcon) {
                            localStorage.setItem('animehouse_equippedCrownIcon', mergedStore.equipped.crownIcon);
                        }
                    } else if (mergedStore.equipped.crown === false) {
                        localStorage.setItem('animehouse_showCrown', 'false');
                        localStorage.removeItem('animehouse_equippedCrownId');
                        localStorage.removeItem('animehouse_equippedCrownIcon');
                    }

                    // Sincronizar Tema CromÃ¡tico
                    if (mergedStore.equipped.tema_cromatico === true) {
                        localStorage.setItem('equipped_tema_cromatico', 'true');
                        localStorage.setItem('animehouse_tema_cromatico', 'true');
                        // Se o tema atual nÃ£o for o cromÃ¡tico, aplicar agora que sabemos que o usuÃ¡rio possui
                        if (sessionStorage.getItem('theme') !== 'theme-cromatico' && window.setTheme) {
                            window.setTheme('theme-cromatico');
                        }
                    } else if (mergedStore.equipped.tema_cromatico === false) {
                        localStorage.removeItem('equipped_tema_cromatico');
                        localStorage.removeItem('animehouse_tema_cromatico');
                    }
                }

                if (mergedStore.purchased.length > dbP.length) {
                    try {
                        await this.saveStoreData(mergedStore);
                    } catch (healErr) {
                        console.warn('[DB] Compras locais nÃ£o sincronizadas ao servidor neste carregamento:', healErr?.message || healErr);
                    }
                }
            }
        } catch (err) {
            console.error("âŒ [DB] Falha crÃ­tica ao tentar ler tabela 'profiles':", err);
        }

        const { data: watchedItems, error: watchedError } = await supa
            .from(WATCHED_ITEMS_TABLE)
            .select('id, content_id, content_type, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (watchedError) {
            if (isMissingRelationError(watchedError)) {
                console.warn(WATCHED_ITEMS_SETUP_HINT);
            } else {
                console.warn('NÃ£o foi possÃ­vel carregar o checklist permanente:', watchedError.message || watchedError);
            }
        } else if (watchedItems) {
            watchedItems.forEach(item => {
                _store.watched[item.content_id] = {
                    id: item.id,
                    content_type: item.content_type,
                    created_at: item.created_at
                };
            });
        }

        // Formatar para bater com o padrÃƒÂ£o antigo do _store
        _store.cartoons = (cartoons || []).map(c => ({...c, createdAt: c.created_at}));
        _store.animes = (animes || []).map(a => ({...a, createdAt: a.created_at}));
        _store.mangas = (mangas || []).map(m => ({...m, createdAt: m.created_at}));
        _store.hqs = (hqs || []).map(h => ({...h, createdAt: h.created_at}));
        _store.filmes = (filmesData || []).map(f => ({...f, createdAt: f.created_at}));
        _store.youtube_playlists = (ytPlaylists || []).map(p => ({...p, createdAt: p.created_at}));
        // Settings
        if (settings) {
            settings.forEach(s => {
                if (s.key_name === 'siteConfig') _store.siteConfig = s.config_data;
                if (s.key_name === 'aiConfig') _store.aiConfig = s.config_data;
            });
        }

        // Agrupar Manga Volumes
        if (mangaVols) {
            mangaVols.forEach(v => {
                if (!_store.mangaVolumes[v.manga_id]) _store.mangaVolumes[v.manga_id] = [];
                _store.mangaVolumes[v.manga_id].push({
                   id: v.id, volume_number: v.volume_number, title: v.title, pdf_url: v.pdf_url
                });
            });
        }

        // Agrupar Manga Notes
        if (mangaNotes) {
            mangaNotes.forEach(n => {
                _store.mangaNotes[n.volume_id] = {
                    id: n.id,
                    manga_id: n.manga_id,
                    note_text: n.note_text,
                    page_bookmark: n.page_bookmark
                };
            });
        }

        // Agrupar episodes
        if (episodes) {
            episodes.forEach(ep => {
                if (!_store.episodes[ep.cartoon_id]) _store.episodes[ep.cartoon_id] = {};
                if (!_store.episodes[ep.cartoon_id][ep.temporada]) _store.episodes[ep.cartoon_id][ep.temporada] = [];
                
                const targetArr = _store.episodes[ep.cartoon_id][ep.temporada];
                if (!targetArr.find(existing => existing.epNumber === ep.ep_number)) {
                    targetArr.push({ 
                      id: ep.id, 
                      epNumber: ep.ep_number, 
                      title: ep.title, 
                      iframe: cleanIframe(ep.iframe) 
                    });
                }
            });
            // Opcional: ordenar episÃƒÂ³dios
            for(let cid in _store.episodes) {
                for(let sid in _store.episodes[cid]) {
                    _store.episodes[cid][sid].sort((a,b) => a.epNumber - b.epNumber);
                }
            }
        }

        // Agrupar movies
        if (movies) {
            movies.forEach(m => {
                if (!_store.movies[m.cartoon_id]) _store.movies[m.cartoon_id] = [];
                _store.movies[m.cartoon_id].push({ 
                  id: m.id, 
                  title: m.title, 
                  iframe: cleanIframe(m.iframe) 
                });
            });
        }

        // Agrupar animeEpisodes
        if (animeEps) {
            animeEps.forEach(ep => {
                if (!_store.animeEpisodes[ep.anime_id]) _store.animeEpisodes[ep.anime_id] = { dublado: {}, legendado: {} };
                if (!_store.animeEpisodes[ep.anime_id][ep.idioma]) _store.animeEpisodes[ep.anime_id][ep.idioma] = {};
                if (!_store.animeEpisodes[ep.anime_id][ep.idioma][ep.temporada]) _store.animeEpisodes[ep.anime_id][ep.idioma][ep.temporada] = [];
                
                const targetArr = _store.animeEpisodes[ep.anime_id][ep.idioma][ep.temporada];
                if (!targetArr.find(existing => existing.epNumber === ep.ep_number)) {
                    targetArr.push({
                        id: ep.id, epNumber: ep.ep_number, title: ep.title, iframe: cleanIframe(ep.iframe)
                    });
                }
            });
             for(let aid in _store.animeEpisodes) {
                for(let lang in _store.animeEpisodes[aid]) {
                     for(let sid in _store.animeEpisodes[aid][lang]) {
                         _store.animeEpisodes[aid][lang][sid].sort((a,b) => a.epNumber - b.epNumber);
                     }
                }
            }
        }

        // Agrupar youtube videos
        if (ytVideos) {
            ytVideos.forEach(v => {
                if (!_store.youtube_videos[v.playlist_id]) _store.youtube_videos[v.playlist_id] = [];
                _store.youtube_videos[v.playlist_id].push({
                    id: v.id, title: v.title, iframe: cleanIframe(v.iframe), created_at: v.created_at
                });
            });
            for(let pid in _store.youtube_videos) {
                _store.youtube_videos[pid].sort((a,b) => a.created_at - b.created_at);
            }
        }

        // Agrupar anime movies
        if (animeMovies) {
            animeMovies.forEach(m => {
                if (!_store.animeMovies[m.anime_id]) _store.animeMovies[m.anime_id] = [];
                _store.animeMovies[m.anime_id].push({
                    id: m.id, title: m.title, iframe: cleanIframe(m.iframe)
                });
            });
        }

        // Agrupar HQ Editions (CORREÃ‡ÃƒO: estava faltando!)
        if (hqEditions) {
            hqEditions.forEach(ed => {
                if (!_store.hqEditions[ed.hq_id]) _store.hqEditions[ed.hq_id] = [];
                _store.hqEditions[ed.hq_id].push({
                    id: ed.id, edition_number: ed.edition_number, title: ed.title, pdf_url: ed.pdf_url
                });
            });
            // Ordenar por nÃºmero
            for(let hqid in _store.hqEditions) {
                _store.hqEditions[hqid].sort((a,b) => a.edition_number - b.edition_number);
            }
        }

        // Agrupar HQ Notes (CORREÃ‡ÃƒO: estava faltando!)
        if (hqNotes) {
            hqNotes.forEach(n => {
                _store.hqNotes[n.edition_id] = {
                    id: n.id,
                    hq_id: n.hq_id,
                    note_text: n.note_text,
                    page_bookmark: n.page_bookmark
                };
            });
        }

        // console.log("Banco de dados sincronizado com o Supabase!");

    } catch (e) {
        console.error("Falha ao inicializar o banco do Supabase:", e);
    }
  },

  // Upload de capa via Supabase Storage (acessÃƒÂ­vel de qualquer lugar)
  async uploadCapa(base64String) {
      const supa = getSupa();
      
      // Extrair extensÃƒÂ£o e dados binÃƒÂ¡rios do base64
      const matches = base64String.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches) throw new Error('Formato de imagem invÃ¡lido');
      
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      
      // Converter base64 para Uint8Array
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: `image/${matches[1]}` });
      
      const filename = `capa_${Date.now()}.${ext}`;
      
      // Fazer upload para o bucket 'capas' no Supabase Storage
      const { data, error } = await supa.storage
          .from('capas')
          .upload(filename, blob, { contentType: `image/${matches[1]}`, upsert: false });
      
      if (error) throw new Error('Falha no upload da capa: ' + error.message);
      
      // Retornar URL pÃƒÂºblica da imagem
      const { data: { publicUrl } } = supa.storage
          .from('capas')
          .getPublicUrl(filename);
      
      return publicUrl;
  },

  // Upload de PDF (recebe objeto File do input text, para aguentar PDFs grandes)
  async uploadMangaPdf(file) {
      const supa = getSupa();
      const ext = file.name.split('.').pop() || 'pdf';
      const filename = `manga_vol_${Date.now()}.${ext}`;
      
      const { data, error } = await supa.storage
          .from('mangas_pdfs')
          .upload(filename, file, { contentType: file.type || 'application/pdf', upsert: false });
      
      if (error) throw new Error('Falha no upload do PDF: ' + error.message);
      
      const { data: { publicUrl } } = supa.storage
          .from('mangas_pdfs')
          .getPublicUrl(filename);
      
      return publicUrl;
  },

  /* Cartoons */
  getCartoons() { return [..._store.cartoons]; },
  getCartoonById(id) { return _store.cartoons.find(c => c.id === id) || null; },
  
  async addCartoon(data) {
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const userId = await getRequiredUserId();
    const item = { id: 'c_' + Date.now(), user_id: userId, ...data, created_at: Date.now() };
    
    const { error } = await getSupa().from('cartoons').insert([item]);
    if (error) { console.error(error); throw new Error(error.message); }
    
    _store.cartoons.push({...item, createdAt: item.created_at});
    return item;
  },
  
  async updateCartoon(id, data) {
    await checkItemOwnership(id, 'cartoons');
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    
    const { error } = await getSupa().from('cartoons').update(data).eq('id', id);
    if (error) { console.error(error); throw new Error(error.message); }
    
    _store.cartoons = _store.cartoons.map(c => c.id === id ? { ...c, ...data } : c);
  },
  
  async deleteCartoon(id) {
    await checkItemOwnership(id, 'cartoons');
    const { error } = await getSupa().from('cartoons').delete().eq('id', id);
    if (error) { console.error(error); throw new Error(error.message); }

    const seasonEntries = Object.values(_store.episodes[id] || {}).flat();
    const movieEntries = _store.movies[id] || [];
    clearWatchedItems([
        ...seasonEntries.map(ep => ep.id),
        ...movieEntries.map(movie => movie.id)
    ]);
    _store.cartoons = _store.cartoons.filter(c => c.id !== id);
    delete _store.episodes[id];
    delete _store.movies[id];
  },

  /* Cartoons: EpisÃƒÂ³dios */
  getAllEpisodes() { return _store.episodes; },
  getEpisodesFor(cId) { return _store.episodes[cId] || {}; },
  
  async addEpisode(cId, season, epData) {
    const userId = await getRequiredUserId();
    const item = { 
        user_id: userId,
        ...epData,
        id: 'e_' + Date.now(), 
        cartoon_id: cId, 
        temporada: String(season),
        ep_number: epData.epNumber || 1,
        title: epData.title || '',
        iframe: cleanIframe(epData.iframe || '')
    };
    delete item.epNumber; // Remove key que nÃ£o existe no banco

    const { error } = await getSupa().from('episodes').insert([item]);
    if (error) throw new Error(error.message);

    if (!_store.episodes[cId]) _store.episodes[cId] = {};
    if (!_store.episodes[cId][season]) _store.episodes[cId][season] = [];
    _store.episodes[cId][season].push({ id: item.id, epNumber: item.ep_number, title: item.title, iframe: item.iframe });
    return item;
  },
  
  async updateEpisode(cId, oldSeason, newSeason, epId, data) {    await checkItemOwnership(epId, 'episodes');     const isSeasonChanging = (oldSeason !== newSeason);
     const updatePayload = {
         title: data.title,
         iframe: cleanIframe(data.iframe),
         ep_number: data.epNumber,
         temporada: String(newSeason)
     };
     // remove undefined fields
     Object.keys(updatePayload).forEach(k => updatePayload[k] === undefined && delete updatePayload[k]);

     const { error } = await getSupa().from('episodes').update(updatePayload).eq('id', epId);
     if (error) throw new Error(error.message);

     if (_store.episodes[cId]?.[oldSeason]) {
      const epIndex = _store.episodes[cId][oldSeason].findIndex(e => e.id === epId);
      if (epIndex > -1) {
          const ep = { ..._store.episodes[cId][oldSeason][epIndex], ...data };
          if (isSeasonChanging) {
            _store.episodes[cId][oldSeason].splice(epIndex, 1);
            if (!_store.episodes[cId][newSeason]) _store.episodes[cId][newSeason] = [];
            _store.episodes[cId][newSeason].push(ep);
          } else {
            _store.episodes[cId][oldSeason][epIndex] = ep;
          }
      }
    }
  },

  async deleteEpisode(cId, season, epId) {
    await checkItemOwnership(epId, 'episodes');
    const { error } = await getSupa().from('episodes').delete().eq('id', epId);
    if (error) throw new Error(error.message);

    clearWatchedItems([epId]);
    if (_store.episodes[cId]?.[season]) {
      _store.episodes[cId][season] = _store.episodes[cId][season].filter(e => e.id !== epId);
    }
  },
  
  async deleteSeason(cId, season) {
    const deletedIds = (_store.episodes[cId]?.[season] || []).map(ep => ep.id);
    const { error } = await getSupa().from('episodes').delete().eq('cartoon_id', cId).eq('temporada', String(season));
    if (error) throw new Error(error.message);
    clearWatchedItems(deletedIds);
    if (_store.episodes[cId]) delete _store.episodes[cId][season];
  },

  /* Cartoons: Filmes */
  getMoviesFor(cId) { return _store.movies[cId] || []; },
  
  async addMovie(cId, movieData) {
    const userId = await getRequiredUserId();
    const item = { 
        user_id: userId,
        ...movieData,
        id: 'm_c_' + Date.now(), 
        cartoon_id: cId, 
        title: movieData.title, 
        iframe: cleanIframe(movieData.iframe)
    };
    const { error } = await getSupa().from('movies').insert([item]);
    if (error) throw new Error(error.message);

    if (!_store.movies[cId]) _store.movies[cId] = [];
    _store.movies[cId].push({ id: item.id, title: item.title, iframe: item.iframe });
    return item;
  },

  async updateMovie(cId, mId, data) {
    await checkItemOwnership(mId, 'movies');
    const updatePayload = { ...data };
    if (updatePayload.iframe) updatePayload.iframe = cleanIframe(updatePayload.iframe);
    
    const { error } = await getSupa().from('movies').update(updatePayload).eq('id', mId);
    if (error) throw new Error(error.message);

    if (_store.movies[cId]) {
      _store.movies[cId] = _store.movies[cId].map(m => m.id === mId ? { ...m, ...data } : m);
    }
  },

  async deleteMovie(cId, mId) {
    await checkItemOwnership(mId, 'movies');
    const { error } = await getSupa().from('movies').delete().eq('id', mId);
    if (error) throw new Error(error.message);
    clearWatchedItems([mId]);
    if (_store.movies[cId]) _store.movies[cId] = _store.movies[cId].filter(m => m.id !== mId);
  },

  /* Animes */
  getAnimes() { return [..._store.animes]; },
  getAnimeById(id) { return _store.animes.find(a => a.id === id) || null; },
  
  async addAnime(data) {
    const userId = await getRequiredUserId();
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const item = { id: 'a_' + Date.now(), user_id: userId, ...data, created_at: Date.now() };
    
    const { error } = await getSupa().from('animes').insert([item]);
    if (error) throw new Error(error.message);

    _store.animes.push({...item, createdAt: item.created_at});
    return item;
  },

  async updateAnime(id, data) {
    await checkItemOwnership(id, 'animes');
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const { error } = await getSupa().from('animes').update(data).eq('id', id);
    if (error) throw new Error(error.message);

    _store.animes = _store.animes.map(a => a.id === id ? { ...a, ...data } : a);
  },

  async deleteAnime(id) {
    await checkItemOwnership(id, 'animes');
    const { error } = await getSupa().from('animes').delete().eq('id', id);
    if (error) throw new Error(error.message);

    const animeEpisodeIds = Object.values(_store.animeEpisodes[id] || {})
      .flatMap(audioGroup => Object.values(audioGroup || {}).flat().map(ep => ep.id));
    const animeMovieIds = (_store.animeMovies[id] || []).map(movie => movie.id);
    clearWatchedItems([...animeEpisodeIds, ...animeMovieIds]);
    _store.animes = _store.animes.filter(a => a.id !== id);
    delete _store.animeEpisodes[id];
    delete _store.animeMovies[id];
  },

  /* Animes: EpisÃƒÂ³dios */
  getAnimeEpisodesFor(aId, audio = 'dublado') { 
    if (!_store.animeEpisodes[aId]) return {};
    return _store.animeEpisodes[aId][audio] || {};
  },
  getAnimeEpisodes() { return _store.animeEpisodes; },
  
  async addAnimeEpisode(aId, audio, season, epData) {
    const userId = await getRequiredUserId();
    const item = {
        user_id: userId,
        ...epData,
        id: 'ae_' + Date.now(),
        anime_id: aId,
        idioma: audio,
        temporada: String(season),
        ep_number: epData.epNumber || 1,
        title: epData.title || '',
        iframe: cleanIframe(epData.iframe || '')
    };
    delete item.epNumber; // Remove key que nÃ£o existe no banco
    const { error } = await getSupa().from('anime_episodes').insert([item]);
    if (error) throw new Error(error.message);

    if (!_store.animeEpisodes[aId]) _store.animeEpisodes[aId] = { dublado: {}, legendado: {} };
    if (!_store.animeEpisodes[aId][audio]) _store.animeEpisodes[aId][audio] = {};
    if (!_store.animeEpisodes[aId][audio][season]) _store.animeEpisodes[aId][audio][season] = [];
    
    _store.animeEpisodes[aId][audio][season].push({id: item.id, epNumber: item.ep_number, title: item.title, iframe: item.iframe});
    return item;
  },

  async updateAnimeEpisode(aId, audio, oldSeason, newSeason, epId, data) {
    await checkItemOwnership(epId, 'anime_episodes');
    const isSeasonChanging = (oldSeason !== newSeason);
    const updatePayload = {
         title: data.title,
         iframe: cleanIframe(data.iframe),
         ep_number: data.epNumber,
         temporada: String(newSeason)
    };
    Object.keys(updatePayload).forEach(k => updatePayload[k] === undefined && delete updatePayload[k]);

    const { error } = await getSupa().from('anime_episodes').update(updatePayload).eq('id', epId);
    if (error) throw new Error(error.message);

    if (_store.animeEpisodes[aId]?.[audio]?.[oldSeason]) {
      const epIndex = _store.animeEpisodes[aId][audio][oldSeason].findIndex(e => e.id === epId);
      if (epIndex > -1) {
          const ep = { ..._store.animeEpisodes[aId][audio][oldSeason][epIndex], ...data };
          if (isSeasonChanging) {
            _store.animeEpisodes[aId][audio][oldSeason].splice(epIndex, 1);
            if (!_store.animeEpisodes[aId][audio][newSeason]) _store.animeEpisodes[aId][audio][newSeason] = [];
            _store.animeEpisodes[aId][audio][newSeason].push(ep);
          } else {
            _store.animeEpisodes[aId][audio][oldSeason][epIndex] = ep;
          }
      }
    }
  },

  async deleteAnimeEpisode(aId, audio, season, epId) {
    await checkItemOwnership(epId, 'anime_episodes');
    const { error } = await getSupa().from('anime_episodes').delete().eq('id', epId);
    if (error) throw new Error(error.message);

    clearWatchedItems([epId]);
    if (_store.animeEpisodes[aId]?.[audio]?.[season]) {
      _store.animeEpisodes[aId][audio][season] = _store.animeEpisodes[aId][audio][season].filter(e => e.id !== epId);
    }
  },

  async deleteAnimeSeason(aId, audio, season) {
    const deletedIds = (_store.animeEpisodes[aId]?.[audio]?.[season] || []).map(ep => ep.id);
    const { error } = await getSupa().from('anime_episodes').delete()
        .eq('anime_id', aId).eq('idioma', audio).eq('temporada', String(season));
    if (error) throw new Error(error.message);

    clearWatchedItems(deletedIds);
    if (_store.animeEpisodes[aId]?.[audio]) { 
      delete _store.animeEpisodes[aId][audio][season]; 
    }
  },

  /* Animes: Filmes */
  getAnimeMoviesFor(aId) { return _store.animeMovies[aId] || []; },
  async addAnimeMovie(aId, movieData) {
    const userId = await getRequiredUserId();
    const item = { 
        user_id: userId,
        ...movieData,
        id: 'm_a_' + Date.now(), 
        anime_id: aId, 
        title: movieData.title, 
        iframe: cleanIframe(movieData.iframe)
    };
    const { error } = await getSupa().from('anime_movies').insert([item]);
    if (error) throw new Error(error.message);

    if (!_store.animeMovies[aId]) _store.animeMovies[aId] = [];
    _store.animeMovies[aId].push({ id: item.id, title: item.title, iframe: item.iframe });
    return item;
  },
  async updateAnimeMovie(aId, mId, data) {
    await checkItemOwnership(mId, 'anime_movies');
    const updatePayload = { ...data };
    if (updatePayload.iframe) updatePayload.iframe = cleanIframe(updatePayload.iframe);

    const { error } = await getSupa().from('anime_movies').update(updatePayload).eq('id', mId);
    if (error) throw new Error(error.message);

    if (_store.animeMovies[aId]) {
      _store.animeMovies[aId] = _store.animeMovies[aId].map(m => m.id === mId ? { ...m, ...data } : m);
    }
  },
  async deleteAnimeMovie(aId, mId) {
    await checkItemOwnership(mId, 'anime_movies');
    const { error } = await getSupa().from('anime_movies').delete().eq('id', mId);
    if (error) throw new Error(error.message);

    clearWatchedItems([mId]);
    if (_store.animeMovies[aId]) {
      _store.animeMovies[aId] = _store.animeMovies[aId].filter(m => m.id !== mId);
    }
  },

  /* MangÃƒÂ¡s */
  getMangas() { return [..._store.mangas]; },
  getMangaById(id) { return _store.mangas.find(m => m.id === id) || null; },
  async addManga(data) {
    const userId = await getRequiredUserId();
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const item = { 
      id: 'm_' + Date.now(), 
      user_id: data.user_id !== undefined ? data.user_id : userId, 
      ...data, 
      created_at: Date.now() 
    };
    const { error } = await getSupa().from('mangas').insert([item]);
    if (error) throw new Error(error.message);

    _store.mangas.push({...item, createdAt: item.created_at});
    return item;
  },
  async updateManga(id, data) {
    await checkItemOwnership(id, 'mangas');
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const { error } = await getSupa().from('mangas').update(data).eq('id', id);
    if (error) throw new Error(error.message);

    _store.mangas = _store.mangas.map(m => m.id === id ? { ...m, ...data } : m);
  },
  async deleteManga(id) {
    await checkItemOwnership(id, 'mangas');
    const { error } = await getSupa().from('mangas').delete().eq('id', id);
    if (error) throw new Error(error.message);
    clearWatchedItems((_store.mangaVolumes[id] || []).map(v => v.id));
    _store.mangas = _store.mangas.filter(m => m.id !== id);
    delete _store.mangaVolumes[id];
  },

  getMangaVolumesFor(mangaId) {
    return _store.mangaVolumes[mangaId] || [];
  },
  async addMangaVolume(mangaId, file, urlExterna, volumeData) {
    const userId = await getRequiredUserId();
    // Fazer upload do PDF ou usar o Link direto
    let pdfUrl = '';
    if (file) {
        pdfUrl = await DB.uploadMangaPdf(file);
    } else if (urlExterna) {
        pdfUrl = urlExterna;
    }
    
    const item = {
        user_id: volumeData.user_id !== undefined ? volumeData.user_id : userId,
        ...volumeData,
        id: 'mv_' + Date.now(),
        manga_id: mangaId,
        volume_number: volumeData.volume,
        title: volumeData.title || '',
        pdf_url: pdfUrl,
        created_at: Date.now()
    };
    delete item.volume; // Remove key que nÃ£o existe no banco
    
    const { error } = await getSupa().from('manga_volumes').insert([item]);
    if (error) throw new Error(error.message);
    
    if (!_store.mangaVolumes[mangaId]) _store.mangaVolumes[mangaId] = [];
    _store.mangaVolumes[mangaId].push({
        id: item.id, volume_number: item.volume_number, title: item.title, pdf_url: item.pdf_url
    });
    // Reordenar por volume
    _store.mangaVolumes[mangaId].sort((a,b) => a.volume_number - b.volume_number);
    
    return item;
  },
  async deleteMangaVolume(mangaId, volId) {
    await checkItemOwnership(volId, 'manga_volumes');
    const { error } = await getSupa().from('manga_volumes').delete().eq('id', volId);
    if (error) throw new Error(error.message);
    
    clearWatchedItems([volId]);
    if (_store.mangaVolumes[mangaId]) {
        _store.mangaVolumes[mangaId] = _store.mangaVolumes[mangaId].filter(v => v.id !== volId);
    }
  },
  async updateMangaVolume(mangaId, volId, file, urlExterna, volumeData) {
      await checkItemOwnership(volId, 'manga_volumes');
      let pdfUrl = '';
      if (file) {
          pdfUrl = await DB.uploadMangaPdf(file);
      } else if (urlExterna) {
          pdfUrl = urlExterna;
      }
      
      const updatePayload = {
          volume_number: volumeData.volume,
          title: volumeData.title || ''
      };
      
      if (pdfUrl) {
          updatePayload.pdf_url = pdfUrl;
      }
      
      const { error } = await getSupa().from('manga_volumes').update(updatePayload).eq('id', volId);
      if (error) throw new Error(error.message);
      
      if (_store.mangaVolumes[mangaId]) {
          _store.mangaVolumes[mangaId] = _store.mangaVolumes[mangaId].map(v => 
              v.id === volId ? { ...v, ...updatePayload } : v
          );
          _store.mangaVolumes[mangaId].sort((a,b) => a.volume_number - b.volume_number);
      }
  },

  /* Manga Notes & Bookmarks */
  getMangaNote(volumeId) {
      return _store.mangaNotes[volumeId] || null;
  },
  async saveMangaNote(mangaId, volumeId, noteText, pageBookmark) {
      const userId = await getRequiredUserId();
      const existing = _store.mangaNotes[volumeId];
      const payload = {
          manga_id: mangaId,
          volume_id: volumeId,
          note_text: noteText || '',
          page_bookmark: pageBookmark ? parseInt(pageBookmark) : null,
          user_id: userId,
          updated_at: Date.now()
      };
      
      let id = existing ? existing.id : 'mn_' + Date.now();
      if (!existing) payload.id = id;

      const { error } = await getSupa().from('manga_notes').upsert([{ id, ...payload }]);
      if (error) throw new Error(error.message);

      _store.mangaNotes[volumeId] = { id, ...payload };
      return _store.mangaNotes[volumeId];
  },
  
  /* HQs (HistÃ³rias em Quadrinhos) */
  getHQs() { return [..._store.hqs]; },
  getHQById(id) { return _store.hqs.find(h => h.id === id) || null; },
  async addHQ(data) {
    const userId = await getRequiredUserId();
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const item = { 
      id: 'hq_' + Date.now(), 
      user_id: data.user_id !== undefined ? data.user_id : userId, 
      ...data, 
      created_at: Date.now() 
    };
    const { error } = await getSupa().from('hqs').insert([item]);
    if (error) throw new Error(error.message);
    _store.hqs.push({...item, createdAt: item.created_at});
    return item;
  },
  async updateHQ(id, data) {
    await checkItemOwnership(id, 'hqs');
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const { error } = await getSupa().from('hqs').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    _store.hqs = _store.hqs.map(h => h.id === id ? { ...h, ...data } : h);
  },
  async deleteHQ(id) {
    await checkItemOwnership(id, 'hqs');
    const { error } = await getSupa().from('hqs').delete().eq('id', id);
    if (error) throw new Error(error.message);
    clearWatchedItems((_store.hqEditions[id] || []).map(v => v.id));
    _store.hqs = _store.hqs.filter(h => h.id !== id);
    delete _store.hqEditions[id];
  },

  /* HQ Editions */
  getHQEditionsFor(hqId) { return _store.hqEditions[hqId] || []; },
  async addHQEdition(hqId, file, urlExterna, editionData) {
    const userId = await getRequiredUserId();
    let pdfUrl = '';
    if (file) {
        pdfUrl = await DB.uploadHQPdf(file);
    } else if (urlExterna) {
        pdfUrl = urlExterna;
    }
    const item = {
        user_id: editionData.user_id !== undefined ? editionData.user_id : userId,
        ...editionData,
        id: 'hqe_' + Date.now(),
        hq_id: hqId,
        edition_number: editionData.edition,
        title: editionData.title || '',
        pdf_url: pdfUrl,
        created_at: Date.now()
    };
    delete item.edition; // Remove key que nÃ£o existe no banco
    const { error } = await getSupa().from('hq_editions').insert([item]);
    if (error) throw new Error(error.message);
    if (!_store.hqEditions[hqId]) _store.hqEditions[hqId] = [];
    _store.hqEditions[hqId].push({
        id: item.id, edition_number: item.edition_number, title: item.title, pdf_url: item.pdf_url
    });
    _store.hqEditions[hqId].sort((a, b) => a.edition_number - b.edition_number);
    return item;
  },
  async deleteHQEdition(hqId, edId) {
    await checkItemOwnership(edId, 'hq_editions');
    const { error } = await getSupa().from('hq_editions').delete().eq('id', edId);
    if (error) throw new Error(error.message);
    clearWatchedItems([edId]);
    if (_store.hqEditions[hqId]) {
        _store.hqEditions[hqId] = _store.hqEditions[hqId].filter(v => v.id !== edId);
    }
  },
  async updateHQEdition(hqId, edId, file, urlExterna, editionData) {
    await checkItemOwnership(edId, 'hq_editions');
    let pdfUrl = '';
    if (file) {
        pdfUrl = await DB.uploadHQPdf(file);
    } else if (urlExterna) {
        pdfUrl = urlExterna;
    }
    const updatePayload = {
        edition_number: editionData.edition,
        title: editionData.title || ''
    };
    if (pdfUrl) updatePayload.pdf_url = pdfUrl;
    const { error } = await getSupa().from('hq_editions').update(updatePayload).eq('id', edId);
    if (error) throw new Error(error.message);
    if (_store.hqEditions[hqId]) {
        _store.hqEditions[hqId] = _store.hqEditions[hqId].map(v =>
            v.id === edId ? { ...v, ...updatePayload } : v
        );
        _store.hqEditions[hqId].sort((a, b) => a.edition_number - b.edition_number);
    }
  },

  /* HQ Notes & Bookmarks */
  getHQNote(editionId) { return _store.hqNotes[editionId] || null; },
  async saveHQNote(hqId, editionId, noteText, pageBookmark) {
    const userId = await getRequiredUserId();
    const existing = _store.hqNotes[editionId];
    const payload = {
        hq_id: hqId,
        edition_id: editionId,
        note_text: noteText || '',
        page_bookmark: pageBookmark ? parseInt(pageBookmark) : null,
        user_id: userId,
        updated_at: Date.now()
    };
    let id = existing ? existing.id : 'hqn_' + Date.now();
    if (!existing) payload.id = id;
    const { error } = await getSupa().from('hq_notes').upsert([{ id, ...payload }]);
    if (error) throw new Error(error.message);
    _store.hqNotes[editionId] = { id, ...payload };
    return _store.hqNotes[editionId];
  },

  /* Upload de PDF para HQs */
  async uploadHQPdf(file) {
    const supa = getSupa();
    const ext = file.name.split('.').pop() || 'pdf';
    const filename = `hq_ed_${Date.now()}.${ext}`;
    const { data, error } = await supa.storage
        .from('hqs_pdfs')
        .upload(filename, file, { contentType: file.type || 'application/pdf', upsert: false });
    if (error) throw new Error('Falha no upload do PDF: ' + error.message);
    const { data: { publicUrl } } = supa.storage.from('hqs_pdfs').getPublicUrl(filename);
    return publicUrl;
  },

  /* Filmes */
  getFilmes() { return [..._store.filmes]; },
  getFilmeById(id) { return _store.filmes.find(f => f.id === id) || null; },
  async addFilme(data) {
    const userId = await getRequiredUserId();
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    // Limpa o iframe/url via cleanIframe se for tag
    if (data.iframe) data.iframe = cleanIframe(data.iframe);
    const item = { id: 'f_' + Date.now(), user_id: userId, ...data, created_at: Date.now() };
    const { error } = await getSupa().from('filmes').insert([item]);
    if (error) throw new Error(error.message);
    _store.filmes.push({...item, createdAt: item.created_at});
    return item;
  },
  async updateFilme(id, data) {
    await checkItemOwnership(id, 'filmes');
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    if (data.iframe) data.iframe = cleanIframe(data.iframe);
    const { error } = await getSupa().from('filmes').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    _store.filmes = _store.filmes.map(f => f.id === id ? { ...f, ...data } : f);
  },
  async deleteFilme(id) {
    await checkItemOwnership(id, 'filmes');
    const { error } = await getSupa().from('filmes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    clearWatchedItems([id]);
    _store.filmes = _store.filmes.filter(f => f.id !== id);
  },

  /* Checklist Permanente */
  isWatched(contentId) {
    return Boolean(contentId && _store.watched[contentId]);
  },
  countWatched(ids = []) {
    return ids.reduce((total, id) => total + (_store.watched[id] ? 1 : 0), 0);
  },
  getAllWatched() {
    return new Set(Object.keys(_store.watched));
  },
  async setWatched(contentId, watched, contentType = 'generic') {
    if (!contentId) return false;

    const supa = getSupa();
    const userId = await getRequiredUserId();

    if (watched) {
      const payload = {
        user_id: userId,
        content_id: contentId,
        content_type: contentType
      };

      const { data, error } = await supa
        .from(WATCHED_ITEMS_TABLE)
        .upsert([payload], { onConflict: 'user_id,content_id' })
        .select('id, content_type, created_at')
        .single();

      if (error) throw buildWatchedPersistenceError(error);

      _store.watched[contentId] = {
        id: data?.id,
        content_type: data?.content_type || contentType,
        created_at: data?.created_at || Date.now()
      };
      return true;
    }

    const { error } = await supa
      .from(WATCHED_ITEMS_TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('content_id', contentId);

    if (error) throw buildWatchedPersistenceError(error);

    delete _store.watched[contentId];
    return false;
  },

  /* IA Config */
  getAIConfig() { return { ..._store.aiConfig }; },
  async saveAIConfig(config) { 
      const payload = { ..._store.aiConfig, ...config };
      const { error } = await getSupa().from('settings')
        .upsert({ key_name: 'aiConfig', config_data: payload }, { onConflict: 'key_name' });
      if (error) throw new Error(error.message);
      _store.aiConfig = payload; 
  },

  /* Favoritos Categorizados */
  async getFavorites(contentType = null) {
      const supa = getSupa();
      const userId = await getCurrentUserId();
      if (!userId) return [];
      let query = supa.from('user_favorites').select('*').eq('user_id', userId);
      if (contentType) query = query.eq('content_type', contentType);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) { console.error(error); return []; }
      return data || [];
  },

  async toggleFavorite(contentId, contentType, metadata = {}) {
      const supa = getSupa();
      const userId = await getRequiredUserId();
      
      // Busca especÃ­fica com ID e CATEGORIA para evitar ambiguidades
      const { data: existing } = await supa.from('user_favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('content_id', contentId)
          .eq('content_type', contentType)
          .maybeSingle();

      if (existing) {
          const { error } = await supa.from('user_favorites').delete().eq('id', existing.id);
          if (error) {
              console.error("Erro ao remover favorito:", error);
              throw new Error(error.message || 'Falha ao remover favorito.');
          }
          try {
            window.dispatchEvent(new CustomEvent('favoritesChanged', {
              detail: { contentId, contentType, action: 'removed' }
            }));
          } catch (_) { /* ignore */ }
          return { action: 'removed' };
      } else {
          const { error } = await supa.from('user_favorites').insert([{ 
              user_id: userId, 
              content_id: contentId, 
              content_type: contentType, 
              title: metadata.title || '',
              cover_url: metadata.cover || '',
              metadata: metadata, 
              created_at: new Date().toISOString() 
          }]);
          
          if (error) {
              console.error("Erro ao adicionar favorito:", error);
              throw new Error(error.message || 'Falha ao adicionar favorito.');
          }
          try {
            window.dispatchEvent(new CustomEvent('favoritesChanged', {
              detail: { contentId, contentType, action: 'added' }
            }));
          } catch (_) { /* ignore */ }
          return { action: 'added' };
      }
  },

  /** Atualiza o botÃ£o de favorito num .card sem re-render da lista */
  applyFavoriteCardChrome(card, isFav) {
      if (!card) return;
      const star = card.querySelector('.fav-star');
      if (star) {
        const label = isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
        star.classList.toggle('active', isFav);
        star.innerHTML = isFav ? 'â˜…' : 'â˜†';
        star.title = label;
        star.setAttribute('aria-label', label);
        star.setAttribute('aria-pressed', String(isFav));
      }

      const area = card.querySelector('.card-click-area');
      const ribbon = area?.querySelector('.fav-ribbon');
      if (ribbon) ribbon.remove();
  },

  /** Reordena filhos `.card` do grid: favoritos no topo, ordem original preservada */
  reorderFavoriteCards(grid) {
      if (!grid) return;
      const cards = [...grid.querySelectorAll(':scope > .card')];
      if (cards.length <= 1) return;
      cards.sort((a, b) => {
        const aFav = a.querySelector('.fav-star')?.classList.contains('active') ? 1 : 0;
        const bFav = b.querySelector('.fav-star')?.classList.contains('active') ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
        const ai = parseInt(a.dataset.originIndex, 10);
        const bi = parseInt(b.dataset.originIndex, 10);
        return (Number.isFinite(ai) ? ai : 0) - (Number.isFinite(bi) ? bi : 0);
      });
      cards.forEach((c) => grid.appendChild(c));
  },

  findFavoriteCardByContentId(grid, contentId) {
      if (!grid || contentId == null || contentId === '') return null;
      const id = String(contentId);
      const esc = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const star = grid.querySelector(`.fav-star[data-id="${esc}"]`);
      return star ? star.closest('.card') : null;
  },

  /** Wrappers de pÃ­lula (desenhos): filhos diretos com .fav-star interno */
  reorderFavoritePillWrappers(container) {
      if (!container) return;
      const items = [...container.children];
      if (items.length <= 1) return;
      items.sort((a, b) => {
        const aFav = a.querySelector('.fav-star')?.classList.contains('active') ? 1 : 0;
        const bFav = b.querySelector('.fav-star')?.classList.contains('active') ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
        const ai = parseInt(a.dataset.originIndex, 10);
        const bi = parseInt(b.dataset.originIndex, 10);
        return (Number.isFinite(ai) ? ai : 0) - (Number.isFinite(bi) ? bi : 0);
      });
      items.forEach((el) => container.appendChild(el));
  },

  async isFavorite(contentId, contentType = null) {
      const supa = getSupa();
      const userId = await getCurrentUserId();
      if (!userId) return false;
      
      let query = supa.from('user_favorites').select('id').eq('user_id', userId).eq('content_id', contentId);
      if (contentType) query = query.eq('content_type', contentType);
      
      const { data, error } = await query.maybeSingle();
      if (error) {
        console.warn("ðŸ“Œ [isFavorite Check] Erro ou nÃ£o encontrado:", error.message);
        return false;
      }
      return !!data;
  },

  async removeFavorite(id) {
      const supa = getSupa();
      const { error } = await supa.from('user_favorites').delete().eq('id', id);
      if (error) { console.error(error); return false; }
      return true;
  },

  /* PERKS (Database Driven) */
  isPerkEquipped(perkId) {
    let store = null;

    // 1) Prioridade para memÃ³ria sincronizada (estado atual da sessÃ£o)
    if (_store.profile && _store.profile.store_data) {
      store = _store.profile.store_data;
    }

    // 2) Fallback por usuÃ¡rio isolado, quando disponÃ­vel
    if (!store || !Array.isArray(store.purchased)) {
      try {
        const currentUserId = _store.profile?.id || store?._userId || null;
        if (currentUserId) {
          const isolatedStore = JSON.parse(localStorage.getItem(`animehouse_store_${currentUserId}`) || 'null');
          if (isolatedStore && Array.isArray(isolatedStore.purchased)) {
            store = isolatedStore;
          }
        }
      } catch (e) {}
    }

    // 3) Chave genÃ©rica sÃ³ se for explicitamente deste usuÃ¡rio
    if (!store || !Array.isArray(store.purchased)) {
      try {
        const uid = _store.profile?.id;
        const localStore = JSON.parse(localStorage.getItem('animehouse_store') || 'null');
        if (localStore && Array.isArray(localStore.purchased) && uid && localStore._userId === uid) {
          store = localStore;
        }
      } catch (e) {}
    }

    if (!store) return false;

    const purchased = Array.isArray(store.purchased) ? store.purchased : [];
    const equipped = store.equipped || {};
    const hasPurchased = purchased.includes(perkId);
    const isStrictlyEquipped = (equipped[perkId] === true || equipped[perkId] === 'true');
    const isStampedEquipped = localStorage.getItem(`equipped_${perkId}`) === 'true';

    // Se o usuÃ¡rio nÃ£o estÃ¡ logado, nenhum perk deve estar ativo (itens desequipam)
    const uid = _store.profile?.id;
    if (!uid) return false;

    // Regra rÃ­gida: sÃ³ pode estar equipado se foi comprado
    const result = hasPurchased && (isStrictlyEquipped || isStampedEquipped);

    if (perkId === 'lista_destaque') {
      window.perkFavoritos = result; // Atalho para debug no console
      console.log(`â­ [Perk System] lista_destaque ativo: ${result}`);
      if (!result) {
        console.warn(`ðŸ“Œ [Perk Debug] Motivo: NÃ£o comprado (${!hasPurchased}), NÃ£o equipado no banco (${!isStrictlyEquipped}), NÃ£o equipado localmente (${!isStampedEquipped})`);
      }
    }

    return result;
  },

  async saveStoreData(newStoreData) {
    if (!_store.profile) _store.profile = {};
    _store.profile.store_data = newStoreData;

    let userId = null;
    try {
      userId = await resolveAuthUserId();
    } catch (e) {
      console.warn('[DB] resolveAuthUserId falhou:', e?.message);
    }
    if (!userId) {
      try {
        userId = await getCurrentUserId();
      } catch (e) {}
    }

    const storeForDb = sanitizeStoreDataForDb(newStoreData);

    const storeWithUserId = { ...storeForDb, _userId: userId };
    try {
      if (userId) {
        localStorage.setItem(`animehouse_store_${userId}`, JSON.stringify(storeWithUserId));
        localStorage.setItem('animehouse_store', JSON.stringify(storeWithUserId));
        console.log('ðŸ’¾ [DB] Store salvo no localStorage (GARANTIDO):', storeWithUserId.purchased);
      } else {
        console.warn('[DB] Sem userId â€” nÃ£o gravando animehouse_store (evita vazamento entre contas).');
      }
    } catch (err) {
      console.error('âŒ [DB] Falha ao salvar no localStorage:', err);
    }

    if (!userId) {
      console.warn('[DB] Sem userId, pulando sincronizaÃ§Ã£o com Supabase.');
      return;
    }

    let supa;
    try {
      supa = getSupa();
    } catch (e) {
      console.warn('[DB] Cliente Supabase ausente â€” sÃ³ cache local.');
      return;
    }

    const ts = new Date().toISOString();

    const { error: rpcErr } = await supa.rpc('animehouse_save_store_data', {
      p_store: storeForDb
    });

    if (!rpcErr) {
      console.log('âœ… [DB] Store persistido via RPC animehouse_save_store_data.');
      return;
    }

    const msg = String(rpcErr.message || rpcErr.details || '');
    const rpcMissing =
      /does not exist|could not find|schema cache/i.test(msg) ||
      rpcErr.code === '42883' ||
      rpcErr.code === 'PGRST202';

    if (rpcMissing) {
      console.warn('[DB] RPC animehouse_save_store_data indisponÃ­vel â€” usando REST. Rode database/fixes/14_animehouse_save_store_data_rpc.sql no Supabase.');
    } else {
      console.warn('[DB] RPC animehouse_save_store_data:', rpcErr.message || rpcErr);
    }

    try {
      const { data: updatedRows, error: updateError } = await supa
        .from('profiles')
        .update({ store_data: storeForDb, updated_at: ts })
        .eq('id', userId)
        .select('id');

      const updateOk = !updateError && updatedRows && updatedRows.length > 0;

      if (updateOk) {
        console.log('âœ… [DB] Store sincronizado com Supabase (update).');
        return;
      }

      if (updateError) {
        console.warn('[DB] Update falhou:', updateError.message);
      }

      const { error: upsertError } = await supa
        .from('profiles')
        .upsert(
          {
            id: userId,
            store_data: storeForDb,
            updated_at: ts
          },
          { onConflict: 'id' }
        );

      if (upsertError) {
        console.error('[DB] Upsert store_data falhou:', upsertError.message);
        throw upsertError;
      }
      console.log('âœ… [DB] Store salvo via upsert (fallback REST).');
    } catch (err) {
    }
  },

  /* YouTube Playlists */
  getYoutubePlaylists() { return [..._store.youtube_playlists]; },
  getYoutubePlaylistById(id) { return _store.youtube_playlists.find(p => p.id === id) || null; },
  async addYoutubePlaylist(data) {
    const userId = await getRequiredUserId();
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const item = { id: 'ytp_' + Date.now(), user_id: userId, ...data, created_at: Date.now() };
    const { error } = await getSupa().from('youtube_playlists').insert([item]);
    if (error) throw new Error(error.message);
    _store.youtube_playlists.push({...item, createdAt: item.created_at});
    return item;
  },
  async updateYoutubePlaylist(id, data) {
    await checkItemOwnership(id, 'youtube_playlists');
    if (data.capaBase64) data.capa = await DB.uploadCapa(data.capaBase64);
    delete data.capaBase64;
    const { error } = await getSupa().from('youtube_playlists').update(data).eq('id', id);
    if (error) throw new Error(error.message);
    _store.youtube_playlists = _store.youtube_playlists.map(p => p.id === id ? { ...p, ...data } : p);
  },
  async deleteYoutubePlaylist(id) {
    await checkItemOwnership(id, 'youtube_playlists');
    const { error } = await getSupa().from('youtube_playlists').delete().eq('id', id);
    if (error) throw new Error(error.message);
    const videoIds = (_store.youtube_videos[id] || []).map(v => v.id);
    clearWatchedItems([...videoIds]);
    _store.youtube_playlists = _store.youtube_playlists.filter(p => p.id !== id);
    delete _store.youtube_videos[id];
  },

  /* YouTube Videos */
  getYoutubeVideosFor(plId) { return _store.youtube_videos[plId] || []; },
  async addYoutubeVideo(plId, data) {
    const userId = await getRequiredUserId();
    const item = {
      user_id: userId,
      ...data,
      id: 'ytv_' + Date.now(),
      playlist_id: plId,
      title: data.title,
      iframe: cleanIframe(data.iframe),
      created_at: Date.now()
    };
    const { error } = await getSupa().from('youtube_videos').insert([item]);
    if (error) throw new Error(error.message);
    if (!_store.youtube_videos[plId]) _store.youtube_videos[plId] = [];
    _store.youtube_videos[plId].push({ id: item.id, title: item.title, iframe: item.iframe, created_at: item.created_at });
    return item;
  },
  async updateYoutubeVideo(plId, vId, data) {
    await checkItemOwnership(vId, 'youtube_videos');
    const updatePayload = { ...data };
    if (updatePayload.iframe) updatePayload.iframe = cleanIframe(updatePayload.iframe);
    const { error } = await getSupa().from('youtube_videos').update(updatePayload).eq('id', vId);
    if (error) throw new Error(error.message);
    if (_store.youtube_videos[plId]) {
      _store.youtube_videos[plId] = _store.youtube_videos[plId].map(v => v.id === vId ? { ...v, ...updatePayload } : v);
    }
  },
  async deleteYoutubeVideo(plId, vId) {
    await checkItemOwnership(vId, 'youtube_videos');
    const { error } = await getSupa().from('youtube_videos').delete().eq('id', vId);
    if (error) throw new Error(error.message);
    clearWatchedItems([vId]);
    if (_store.youtube_videos[plId]) {
      _store.youtube_videos[plId] = _store.youtube_videos[plId].filter(v => v.id !== vId);
    }
  }
};

if (typeof window !== 'undefined') {
  window.DB = DB;
}


/* Globals */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = e => reject(e);
  });
}

function showToast(msg, type = 'success', ms = 7000) {
  const container = document.getElementById('toast');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'undo-toast';

  const isError = type === 'error';
  if (isError) {
      el.style.border = '2px solid var(--danger)';
      el.style.boxShadow = '0 0 35px rgba(239, 68, 68, 0.5)';
  }

  const errorPrefix = isError ? '⚠️ ' : '';
  const progressStyle = isError
    ? `animation-duration:${ms}ms; background: var(--danger); box-shadow: 0 0 20px var(--danger);`
    : `animation-duration:${ms}ms;`;

  el.innerHTML = `
    <div class="undo-content" style="justify-content: center;">
      <span style="${isError ? 'color: var(--danger); font-weight: bold;' : ''}">${errorPrefix}${msg}</span>
    </div>
    <div class="undo-progress" style="${progressStyle}"></div>
  `;

  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 500);
  }, ms);
}

function showDarkToast(msg, ms = 7000) {
  const container = document.getElementById('toast');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'undo-toast';
  el.innerHTML = `
    <div class="undo-content" style="justify-content: center;">
      <span>${msg}</span>
    </div>
    <div class="undo-progress" style="animation-duration:${ms}ms;"></div>
  `;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 500);
  }, ms);
}

function showUndoToast(msg, onComplete, onUndo) {
  const container = document.getElementById('toast');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'undo-toast';
  el.innerHTML = `
    <div class="undo-content">
      <span>${msg}</span>
      <button class="btn-undo">DESFAZER (7s)</button>
    </div>
    <div class="undo-progress"></div>
  `;
  container.appendChild(el);

  let timeLeft = 7;
  const btn = el.querySelector('.btn-undo');
  const timer = setInterval(() => {
    timeLeft--;
    btn.textContent = `DESFAZER (${timeLeft}s)`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 500);
      onComplete();
    }
  }, 1000);

  btn.onclick = () => {
    clearInterval(timer);
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 500);
    onUndo();
    showDarkToast('AÃ§Ã£o cancelada!', 7000);
  };
}

function showUndoToast(msg, onComplete, onUndo) {
  const container = document.getElementById('toast');
  if (!container) return;

  const el = document.createElement('div');
  el.className = 'undo-toast';
  el.innerHTML = `
    <div class="undo-content">
      <span>${msg}</span>
      <button class="btn-undo">DESFAZER (7s)</button>
    </div>
    <div class="undo-progress"></div>
  `;
  container.appendChild(el);

  let timeLeft = 7;
  const btn = el.querySelector('.btn-undo');
  const timer = setInterval(() => {
    timeLeft--;
    btn.textContent = `DESFAZER (${timeLeft}s)`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 500);
      onComplete();
    }
  }, 1000);

  btn.onclick = () => {
    clearInterval(timer);
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 500);
    onUndo();
    showDarkToast('A\u00E7\u00E3o cancelada.', 7000);
  };
}

// Nav links highlighting and scroll sync
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.navbar-links a');
  const path  = location.pathname.split('/').pop() || 'index.html';
  
  let activeLink = null;
  links.forEach(a => { 
    if (a.getAttribute('href') === path) {
      a.classList.add('active');
      activeLink = a;
    }
  });
  
  const burger = document.getElementById('navBurger');
  const menu   = document.getElementById('navLinks');
  if (burger && menu) burger.addEventListener('click', () => menu.classList.toggle('open'));

  // Persistir posiÃƒÂ§ÃƒÂ£o do scroll da navbar de forma otimizada
  if (menu) {
    const savedScroll = sessionStorage.getItem('navbarScrollPosition');
    
    // Se tem scroll salvo, restaura. SenÃƒÂ£o, rola atÃƒÂ© o item ativo.
    if (savedScroll !== null) {
      menu.scrollLeft = parseInt(savedScroll, 10);
    } else if (activeLink) {
      // Pequeno delay para garantir que o CSS do flexbox aplicou
      setTimeout(() => {
        const padding = 20;
        menu.scrollLeft = activeLink.offsetLeft - padding;
      }, 50);
    }

    // Salva o scroll sem travar a interface (debounce)
    let scrollTimeout;
    menu.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        sessionStorage.setItem('navbarScrollPosition', menu.scrollLeft);
      }, 100); // Aguarda 100ms apÃƒÂ³s o scroll parar para salvar
    });
  }
});

// Prevenir caracteres nÃ£o numÃ©ricos em inputs de nÃºmero
document.addEventListener('input', function(e) {
  if (e.target && e.target.type === 'number') {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  }
});
