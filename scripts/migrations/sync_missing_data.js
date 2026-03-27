const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://bxifddhrbxbmimjkgwzr.supabase.co';
// ATENÇÃO: Use a chave 'service_role' (secret) aqui
const SUPABASE_SERVICE_KEY = 'sb_secret_Cr0BzLecxWabufFasf0kQg_xJtI5VsM';

// Ler data/data.json (novo layout da pasta)
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const dataPath = path.join(ROOT_DIR, 'data', 'data.json');
let db;
try {
    db = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (e) {
    console.error('❌ Erro ao ler data.json:', e);
    process.exit(1);
}

// Helper para UPDATE no Supabase
async function updateSupabase(table, dataArray) {
    if (!dataArray || dataArray.length === 0) {
        console.log(`⏭️  Nenhum registro a atualizar em ${table}`);
        return;
    }

    // Para cada registro, faz um UPDATE individual (mais seguro que bulk update)
    for (const item of dataArray) {
        const { id, ...updateData } = item;
        
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(updateData)
        });

        if (!res.ok) {
            let err = await res.text();
            console.error(`  ⚠️  Erro atualizando ${table} (${id}):`, err);
        } else {
            console.log(`  ✅ ${table} (${id}) atualizado`);
        }
    }
}

async function syncMissingData() {
    console.log('🔄 Sincronizando dados faltantes (iframes e links)...\n');

    // 1. CARTOONS - ATualizar capas se estiverem em branco
    if (db.cartoons && db.cartoons.length > 0) {
        console.log('📺 Verificando Cartoons...');
        const payload = db.cartoons.map(c => ({
            id: c.id,
            capa: c.capa || ''
        }));
        await updateSupabase('cartoons', payload);
    }

    // 2. EPISODES (Cartoons) - Adicionar iframes faltantes
    if (db.episodes) {
        console.log('\n🎬 Verificando Episodes de Cartoons...');
        let epsPayload = [];
        
        for (const [cartoonId, seasons] of Object.entries(db.episodes)) {
            for (const [seasonStr, eps] of Object.entries(seasons)) {
                for (const ep of eps) {
                    epsPayload.push({
                        id: ep.id,
                        title: ep.title || '',
                        iframe: ep.iframe || ''
                    });
                }
            }
        }
        
        // Atualizar em lotes de 50
        for (let i = 0; i < epsPayload.length; i += 50) {
            const batch = epsPayload.slice(i, i + 50);
            await updateSupabase('episodes', batch);
        }
    }

    // 3. MOVIES (Cartoons) - Adicionar iframes faltantes
    if (db.movies) {
        console.log('\n🎥 Verificando Movies de Cartoons...');
        let moviesPayload = [];
        
        for (const [cartoonId, moviesArr] of Object.entries(db.movies)) {
            for (const m of moviesArr) {
                moviesPayload.push({
                    id: m.id,
                    title: m.title || '',
                    iframe: m.iframe || ''
                });
            }
        }
        
        await updateSupabase('movies', moviesPayload);
    }

    // 4. ANIMES - Atualizar capas
    if (db.animes && db.animes.length > 0) {
        console.log('\n⛩️  Verificando Animes...');
        const aPayload = db.animes.map(a => ({
            id: a.id,
            capa: a.capa || ''
        }));
        await updateSupabase('animes', aPayload);
    }

    // 5. ANIME_EPISODES - Adicionar iframes faltantes
    if (db.animeEpisodes) {
        console.log('\n📺 Verificando Episodes de Animes...');
        let aEpsPayload = [];
        
        for (const [animeId, audios] of Object.entries(db.animeEpisodes)) {
            for (const [idioma, seasons] of Object.entries(audios)) {
                for (const [seasonStr, eps] of Object.entries(seasons)) {
                    for (const ep of eps) {
                        aEpsPayload.push({
                            id: ep.id,
                            title: ep.title || '',
                            iframe: ep.iframe || ''
                        });
                    }
                }
            }
        }
        
        // Atualizar em lotes de 50
        for (let i = 0; i < aEpsPayload.length; i += 50) {
            const batch = aEpsPayload.slice(i, i + 50);
            await updateSupabase('anime_episodes', batch);
        }
    }

    // 6. MANGAS - Atualizar link_drive e capa
    if (db.mangas && db.mangas.length > 0) {
        console.log('\n📚 Verificando Mangás...');
        const mPayload = db.mangas.map(m => ({
            id: m.id,
            capa: m.capa || '',
            link_drive: m.link_drive || ''
        }));
        await updateSupabase('mangas', mPayload);
    }

    console.log('\n✨ Sincronização concluída!');
}

syncMissingData().catch(console.error);
