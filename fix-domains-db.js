const SUPABASE_URL = 'https://bxifddhrbxbmimjkgwzr.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_Cr0BzLecxWabufFasf0kQg_xJtI5VsM';

async function updateIframe(table, id, oldIframe) {
    if (!oldIframe) return;
    
    let newIframe = oldIframe.replace(/redecanais\.ooo/g, 'redecanais.in')
                              .replace(/redecanais\.cafe/g, 'redecanais.in')
                              .replace(/redecanais\.la/g, 'redecanais.in')
                              .replace(/redecanais\.dev/g, 'redecanais.in')
                              .replace(/%72%65%64%65%63%61%6E%61%69%73%2E%6F%6F%6F/g, '%72%65%64%65%63%61%6E%61%69%73%2E%69%6E')
                              .replace(/%72%65%64%65%63%61%6E%61%69%73%2E%63%61%66%65/g, '%72%65%64%65%63%61%6E%61%69%73%2E%69%6E')
                              .replace(/%72%65%64%65%63%61%6E%61%69%73%2E%6C%61/g, '%72%65%64%65%63%61%6E%61%69%73%2E%69%6E');

    if (newIframe.includes('src="//')) {
        newIframe = newIframe.replace('src="//', 'src="https://');
    }

    if (newIframe === oldIframe) return;

    console.log(`  Updating ${table} ID ${id}...`);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ iframe: newIframe })
    });

    if (!res.ok) {
        console.error(`    ❌ Error updating ${id}: ${await res.text()}`);
    } else {
        console.log(`    ✅ Updated ${id}`);
    }
}

async function fixAll() {
    console.log('🚀 Fixing Redecanais domains in Supabase...');

    // 1. Episodes
    console.log('\nChecking Episodes...');
    const epsRes = await fetch(`${SUPABASE_URL}/rest/v1/episodes?select=id,iframe`, {
        headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
    });
    const episodes = await epsRes.json();
    for (const ep of episodes) await updateIframe('episodes', ep.id, ep.iframe);

    // 2. Movies
    console.log('\nChecking Movies...');
    const movRes = await fetch(`${SUPABASE_URL}/rest/v1/movies?select=id,iframe`, {
        headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
    });
    const movies = await movRes.json();
    for (const m of movies) await updateIframe('movies', m.id, m.iframe);

    // 3. Anime Episodes
    console.log('\nChecking Anime Episodes...');
    const aEpsRes = await fetch(`${SUPABASE_URL}/rest/v1/anime_episodes?select=id,iframe`, {
        headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
    });
    const animeEps = await aEpsRes.json();
    for (const ep of animeEps) await updateIframe('anime_episodes', ep.id, ep.iframe);

    console.log('\n✨ Database fix completed!');
}

fixAll().catch(console.error);
