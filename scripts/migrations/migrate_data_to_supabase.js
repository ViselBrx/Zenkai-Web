const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://bxifddhrbxbmimjkgwzr.supabase.co';
// ATENÇÃO: Use a chave 'service_role' (secret) aqui para ignorar a segurança (RLS) durante a migração
const SUPABASE_SERVICE_KEY = 'sb_secret_Cr0BzLecxWabufFasf0kQg_xJtI5VsM'; // <-- TROQUE PELA SUA SERVICE_ROLE KEY

// Ler data/data.json (novo layout da pasta)
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const dataPath = path.join(ROOT_DIR, 'data', 'data.json');
let db;
try {
    db = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (e) {
    console.error('Erro ao ler data.json:', e);
    process.exit(1);
}

// Helper para enviar pro Supabase (Bulk Insert)
async function insertSupabase(table, dataArray) {
    if (!dataArray || dataArray.length === 0) return;

    // Supabase permite insert múltiplo mandando um array no body
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal' // Nao precisa devolver os dados pro servidor
        },
        body: JSON.stringify(dataArray)
    });

    if (!res.ok) {
        let err = await res.text();
        console.error(`Erro inserindo em ${table}:`, err);
    } else {
        console.log(`✅ ${dataArray.length} registros inseridos na tabela '${table}'`);
    }
}

async function runMigration() {
    console.log('🚀 Iniciando Migração do data.json para o Supabase...');

    // 1. CARTOONS
    if (db.cartoons && db.cartoons.length > 0) {
        const payload = db.cartoons.map(c => ({
            id: c.id,
            nome: c.nome || '',
            produtora: c.produtora || '',
            temporadas: c.temporadas || 1,
            capa: c.capa || '',
            created_at: c.createdAt || Date.now()
        }));
        await insertSupabase('cartoons', payload);
    }

    // 2. EPISODES (Cartoons)
    let epsPayload = [];
    if (db.episodes) {
        for (const [cartoonId, seasons] of Object.entries(db.episodes)) {
            for (const [seasonStr, eps] of Object.entries(seasons)) {
                for (const ep of eps) {
                    epsPayload.push({
                        id: ep.id,
                        cartoon_id: cartoonId,
                        temporada: seasonStr.toString(),
                        ep_number: ep.epNumber || 1,
                        title: ep.title || '',
                        iframe: ep.iframe || ''
                    });
                }
            }
        }
    }
    // Cortar em pedaços de 500 para não estourar payload da API (embora 1000 costuma ir de boa)
    for (let i = 0; i < epsPayload.length; i += 500) {
        await insertSupabase('episodes', epsPayload.slice(i, i + 500));
    }

    // 3. MOVIES (Cartoons)
    let moviesPayload = [];
    if (db.movies) {
        for (const [cartoonId, moviesArr] of Object.entries(db.movies)) {
            for (const m of moviesArr) {
                moviesPayload.push({
                    id: m.id,
                    cartoon_id: cartoonId,
                    title: m.title || '',
                    iframe: m.iframe || ''
                });
            }
        }
        await insertSupabase('movies', moviesPayload);
    }

    // 4. ANIMES
    if (db.animes && db.animes.length > 0) {
        const aPayload = db.animes.map(a => ({
            id: a.id,
            nome: a.nome || '',
            estudio: a.estudio || '',
            genero: a.genero || '',
            temporadas: a.temporadas || 1,
            capa: a.capa || '',
            created_at: a.createdAt || Date.now()
        }));
        await insertSupabase('animes', aPayload);
    }

    // 5. ANIME_EPISODES
    let aEpsPayload = [];
    if (db.animeEpisodes) {
        for (const [animeId, audios] of Object.entries(db.animeEpisodes)) {
            for (const [idioma, seasons] of Object.entries(audios)) {
                for (const [seasonStr, eps] of Object.entries(seasons)) {
                    for (const ep of eps) {
                        aEpsPayload.push({
                            id: ep.id,
                            anime_id: animeId,
                            idioma: idioma, // 'dublado' ou 'legendado'
                            temporada: seasonStr.toString(),
                            ep_number: ep.epNumber || 1,
                            title: ep.title || '',
                            iframe: ep.iframe || ''
                        });
                    }
                }
            }
        }
    }
    for (let i = 0; i < aEpsPayload.length; i += 500) {
        await insertSupabase('anime_episodes', aEpsPayload.slice(i, i + 500));
    }

    // 6. MANGAS
    if (db.mangas && db.mangas.length > 0) {
        const mPayload = db.mangas.map(m => ({
            id: m.id,
            nome: m.nome || '',
            autor: m.autor || '',
            capitulos: m.capitulos || 1,
            capa: m.capa || '',
            link_drive: m.link_drive || '',
            created_at: m.createdAt || Date.now()
        }));
        await insertSupabase('mangas', mPayload);
    }

    // 7. SETTINGS
    const settingsPayload = [];
    if (db.siteConfig) settingsPayload.push({ key_name: 'siteConfig', config_data: db.siteConfig });
    if (db.aiConfig) settingsPayload.push({ key_name: 'aiConfig', config_data: db.aiConfig });

    if (settingsPayload.length > 0) {
        await insertSupabase('settings', settingsPayload);
    }

    console.log('🎉 Migração concluída com sucesso!');
}

runMigration().catch(console.error);
