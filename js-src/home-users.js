document.addEventListener('DOMContentLoaded', async () => {
    const recentUsersContainer = document.getElementById('recentUsers');
    if (!recentUsersContainer) return;

    async function loadRecentUsers() {
        try {
            const supa = window.supabaseClient;
            if (!supa) return;

            // Pega os 5 usuários mais recentes
            const { data: users, error } = await supa
                .from('profiles')
                .select('id, full_name, avatar_url, store_data')
                .order('id', { ascending: false })
                .limit(5);

            if (error) throw error;

            if (!users || users.length === 0) {
                recentUsersContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem;">Nenhum usuário ainda.</p>';
                return;
            }

            recentUsersContainer.innerHTML = '';
            users.forEach(user => {
                const name = user.full_name || 'Participante';
                const avatar = user.avatar_url || 'assets/tryhard.png';
                const xp = user.store_data?.xp || 0;
                const level = Math.floor(xp / 1000) + 1;

                const userDiv = document.createElement('div');
                userDiv.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    width: 80px;
                    animation: fadeIn 0.5s ease backwards;
                `;

                userDiv.innerHTML = `
                    <div style="position: relative; width: 60px; height: 60px;">
                        <img src="${avatar}" alt="${name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary); box-shadow: 0 0 10px rgba(var(--primary-rgb), 0.3);">
                        <div style="position: absolute; bottom: -5px; right: -5px; background: var(--primary); color: #000; font-size: 0.6rem; font-weight: 900; padding: 2px 5px; border-radius: 10px; border: 2px solid var(--bg-dark);">LVL ${level}</div>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center; font-weight: 600;">${name}</span>
                `;

                recentUsersContainer.appendChild(userDiv);
            });
        } catch (err) {
            console.error('Erro ao carregar membros recentes:', err);
        }
    }

    loadRecentUsers();
});
