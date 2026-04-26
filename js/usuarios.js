document.addEventListener('DOMContentLoaded', async () => {
  const usersGrid = document.getElementById('usersGrid');
  const searchInput = document.getElementById('userSearch');
  const sortSelect = document.getElementById('userSort');
  const currentUserBadge = document.getElementById('currentUserBadge');
  const profileModal = document.getElementById('profileModal');
  const modalImg = document.getElementById('modalImg');
  const closeModal = document.getElementById('closeModal');

  let allUsers = [];
  let allFollowersData = [];
  let currentUser = null;

  async function init() {
    try {
      const supa = window.supabaseClient;
      if (!supa) {
        setTimeout(init, 200);
        return;
      }

      // Verifica usuário logado
      const { data: { session } } = await supa.auth.getSession();
      if (session) {
        currentUser = session.user;
        renderCurrentUserBadge();
      }

      await loadData();
      
      // Configurar Realtime para atualizações instantâneas
      setupRealtimeListeners();
      
      // Listeners
      searchInput.addEventListener('input', applyFilters);
      sortSelect.addEventListener('change', applyFilters);

      // Modal Listeners
      closeModal.onclick = () => profileModal.classList.remove('active');
      profileModal.onclick = (e) => {
        if (e.target === profileModal) profileModal.classList.remove('active');
      };

    } catch (err) {
      console.error('Erro ao inicializar comunidade:', err);
      usersGrid.innerHTML = '<p class="error" style="grid-column: 1/-1; text-align:center;">Erro ao carregar a comunidade.</p>';
    }
  }

  function setupRealtimeListeners() {
    const supa = window.supabaseClient;
    if (!supa) return;

    // 1. Escutar mudanças na tabela de seguidores (Seguidores em tempo real)
    supa
      .channel('followers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'followers' }, async (payload) => {
        console.log('🔔 Mudança Realtime:', payload.eventType);
        
        if (payload.eventType === 'INSERT') {
          // INSERT é fácil: o payload.new tem tudo que precisamos
          const exists = allFollowersData.some(f => 
            (f.id && f.id === payload.new.id) || 
            (f.follower_id === payload.new.follower_id && f.following_id === payload.new.following_id)
          );
          if (!exists) {
            allFollowersData.push(payload.new);
          }
          updateSpecificUserStats(payload.new.following_id);
        } else if (payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
          // DELETE é complexo porque payload.old pode vir incompleto dependendo da config do banco.
          // Para garantir 100% de precisão no "deixar de seguir", buscamos a lista fresca.
          const { data: freshFollowers } = await supa.from('followers').select('*');
          if (freshFollowers) {
            allFollowersData = freshFollowers;
            // Como não sabemos quem foi deletado só pelo payload.old incompleto, 
            // atualizamos os contadores de todos para garantir. 
            // Como otimizei a função abaixo, ela será rápida agora.
            updateAllFollowersUI();
          }
        }
        
        // Atualizar estatística global do topo
        // (Removido totalFollowers)
      })
      .subscribe();

    // 2. Escutar mudanças nos perfis (Status Online/Avatar/Nome)
    supa
      .channel('profiles-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const index = allUsers.findIndex(u => u.id === payload.new.id);
        if (index !== -1) {
          allUsers[index] = { ...allUsers[index], ...payload.new };
          updateUserCardUI(payload.new.id);
        }
      })
      .subscribe();
  }

  // Função otimizada para atualizar TODOS os contadores sem lag
  function updateAllFollowersUI() {
    // Pegamos todos os cards de uma vez para evitar queries repetitivas ao DOM
    const allCards = document.querySelectorAll('.user-card[data-user-id]');
    allCards.forEach(card => {
      const userId = card.getAttribute('data-user-id');
      const count = allFollowersData.filter(f => f.following_id === userId).length;
      
      const countSpan = card.querySelector('.stat-box:nth-child(1) .stat-value');
      if (countSpan) countSpan.textContent = count;

      // Atualizar botão de seguir se necessário
      if (currentUser && currentUser.id !== userId) {
        const isFollowing = allFollowersData.some(f => f.follower_id === currentUser.id && f.following_id === userId);
        const btn = card.querySelector('.btn-follow');
        if (btn) {
           if (isFollowing) {
             btn.classList.add('following');
             btn.innerHTML = '<span><i class="fas fa-check"></i> Seguindo</span>';
           } else {
             btn.classList.remove('following');
             btn.innerHTML = '<i class="fas fa-user-plus"></i> Seguir';
           }
        }
      }
    });

    // Atualizar o modal se estiver aberto
    if (profileModal.classList.contains('active') && window.currentModalUserId) {
      updateSpecificUserStats(window.currentModalUserId);
    }
  }

  // Função para carregar seguidores do usuário logado na Sidebar
  window.updateMyFollowers = function() {
    const listEl = document.getElementById('myFollowersList');
    if (!listEl || !currentUser) return;

    const myFollowers = allFollowersData.filter(f => f.following_id === currentUser.id);
    
    if (myFollowers.length === 0) {
      listEl.innerHTML = '<div class="social-empty">Você ainda não tem seguidores.</div>';
      return;
    }

    listEl.innerHTML = '';
    myFollowers.forEach(follow => {
      const follower = allUsers.find(u => u.id === follow.follower_id);
      if (!follower) return;

      const avatar = follower.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
      const name = follower.full_name || follower.username || 'Maratonista';
      
      // Status Online
      const lastSeen = follower.last_seen ? new Date(follower.last_seen) : null;
      const isOnline = lastSeen && (new Date() - lastSeen) < 300000;
      const statusText = isOnline ? 'Online' : 'Visto por último recentemente';
      const statusColor = isOnline ? 'var(--primary)' : 'var(--text-muted)';

      const card = document.createElement('div');
      card.className = 'follower-mini-card';
      card.onclick = () => {
        document.getElementById('socialSidebar').classList.remove('active');
        document.getElementById('socialOverlay').classList.remove('active');
        openProfileModal(follower.id);
      };
      
      card.innerHTML = `
        <img src="${avatar}" class="follower-mini-avatar" alt="${name}">
        <div class="follower-mini-info">
          <span class="follower-mini-name">${name}</span>
          <span class="follower-mini-status" style="color: ${statusColor}">
            <i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 4px;"></i> ${statusText}
          </span>
        </div>
      `;
      listEl.appendChild(card);
    });
  };

  function updateSpecificUserStats(userId) {
    const followersCount = allFollowersData.filter(f => f.following_id === userId).length;
    
    // 1. Atualizar Card na Grade
    const card = document.querySelector(`.user-card[data-user-id="${userId}"]`);
    if (card) {
      const countSpan = card.querySelector('.stat-box:nth-child(1) .stat-value');
      if (countSpan) countSpan.textContent = followersCount;
      
      if (currentUser && currentUser.id !== userId) {
        const isFollowing = allFollowersData.some(f => f.follower_id === currentUser.id && f.following_id === userId);
        const btn = card.querySelector('.btn-follow');
        if (btn) {
           if (isFollowing) {
             btn.classList.add('following');
             btn.innerHTML = '<span><i class="fas fa-check"></i> Seguindo</span>';
           } else {
             btn.classList.remove('following');
             btn.innerHTML = '<i class="fas fa-user-plus"></i> Seguir';
           }
        }
      }
    }

    // 2. Atualizar Modal se estiver aberto para esse usuário
    if (profileModal.classList.contains('active') && window.currentModalUserId === userId) {
      const modalStats = document.getElementById('modalStats');
      if (modalStats) {
        const countSpan = modalStats.querySelector('.stat-box:nth-child(1) .stat-value');
        if (countSpan) countSpan.textContent = followersCount;
      }
      
      const isFollowing = currentUser ? allFollowersData.some(f => f.follower_id === currentUser.id && f.following_id === userId) : false;
      const modalBtn = document.querySelector('#modalActions .btn-follow');
      if (modalBtn && currentUser.id !== userId) {
        if (isFollowing) {
          modalBtn.classList.add('following');
          modalBtn.innerHTML = '<span><i class="fas fa-check"></i> Seguindo</span>';
        } else {
          modalBtn.classList.remove('following');
          modalBtn.innerHTML = '<i class="fas fa-user-plus"></i> Seguir';
        }
      }
    }
  }

  function updateUserCardUI(userId) {
    // Localizar o card e atualizar elementos chave (status dot, nome, avatar)
    const card = document.querySelector(`.user-card[data-user-id="${userId}"]`);
    const user = allUsers.find(u => u.id === userId);
    if (!card || !user) return;

    // Atualizar status online
    const lastSeen = user.last_seen ? new Date(user.last_seen) : null;
    const isOnline = lastSeen && (new Date() - lastSeen) < 300000;
    const dot = card.querySelector('.status-dot-indicator');
    if (dot) {
      dot.className = `status-dot-indicator ${isOnline ? 'online' : 'offline'}`;
      dot.title = isOnline ? 'Online' : 'Offline';
    }

    // Atualizar stats do topo se mudou online count
    const onlineCount = allUsers.filter(u => {
      const ls = u.last_seen ? new Date(u.last_seen) : null;
      return ls && (new Date() - ls) < 300000;
    }).length;
    document.getElementById('onlineNow').textContent = onlineCount;
  }

  async function renderCurrentUserBadge() {
    if (!currentUser) return;

    try {
      const supa = window.supabaseClient;
      const { data: profile } = await supa
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profile) {
        const name = profile.full_name || profile.username || 'Minha Conta';
        const avatar = profile.avatar_url || 'assets/tryhard.png';
        
        // Preencher Hub Unificado (Cápsula)
        const userHub = document.getElementById('userHub');
        const userHubName = document.getElementById('userHubName');
        const userHubAvatar = document.getElementById('userHubAvatar');
        const socialToggle = document.getElementById('socialToggle');

        if (userHubName) userHubName.textContent = name;
        if (userHubAvatar) userHubAvatar.src = avatar;
        
        if (userHub) userHub.style.display = 'flex';

        // Ativar Hub Social de forma independente
        const openSocial = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const sidebar = document.getElementById('socialSidebar');
          const overlay = document.getElementById('socialOverlay');
          if (sidebar && overlay) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            if (socialToggle) socialToggle.classList.add('active');
            if (window.updateMyFollowers) window.updateMyFollowers();
          }
        };

        if (socialToggle) socialToggle.onclick = openSocial;
        const userHubProfile = document.getElementById('userHubProfile');
        if (userHubProfile) userHubProfile.onclick = openSocial;
      }
    } catch (e) {
      console.warn("Erro ao carregar badge do usuário:", e);
    }
  }

  window.openProfileModal = function(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const storeData = user.store_data || {};
    const equipped = storeData.equipped || {};
    const name = user.full_name || user.username || ('Membro_' + user.id.substring(0, 5));
    const avatar = user.avatar_url || 'assets/tryhard.png';
    const banner = equipped.banner || 'none';
    const level = storeData.xp ? Math.floor(storeData.xp / 1000) + 1 : 1;
    const xp = storeData.xp || 0;
    const followersCount = allFollowersData.filter(f => f.following_id === user.id).length;
    const isMe = currentUser && currentUser.id === user.id;

    // Lógica de Status Online
    const lastSeen = user.last_seen ? new Date(user.last_seen) : null;
    const now = new Date();
    const isOnline = lastSeen && (now - lastSeen) < 300000;
    const statusText = isOnline ? 'Online' : 'Offline';
    const statusClass = isOnline ? 'online' : 'offline';

    // Preenche campos do modal
    const modalImg = document.getElementById('modalImg');
    if (modalImg) modalImg.src = avatar;
    
    document.getElementById('modalName').textContent = name;
    
    // Status no Modal
    const modalLevelEl = document.getElementById('modalLevel');
    modalLevelEl.innerHTML = `
      Nível ${level} 
      <span class="status-badge ${statusClass}">
        <span class="status-dot"></span> ${statusText}
      </span>
    `;
    
    const bannerEl = document.getElementById('modalBanner');
    if (banner !== 'none') {
      bannerEl.style.backgroundImage = `url('${banner}')`;
    } else {
      bannerEl.style.background = `linear-gradient(135deg, rgba(var(--primary-rgb), 0.2), rgba(0,0,0,0.6))`;
    }

    document.getElementById('modalStats').innerHTML = `
      <div class="stat-box">
        <span class="stat-value">${followersCount}</span>
        <span class="stat-label">Seguidores</span>
      </div>
      <div class="stat-box">
        <span class="stat-value"><i class="fas fa-star"></i>${xp}</span>
        <span class="stat-label">XP</span>
      </div>
    `;

    const actionsEl = document.getElementById('modalActions');
    if (isMe) {
      actionsEl.innerHTML = `<a href="perfil.html" class="btn-follow" style="text-align:center; text-decoration:none; display:block;">Meu Perfil</a>`;
    } else {
      const isFollowing = currentUser ? allFollowersData.some(f => f.follower_id === currentUser.id && f.following_id === user.id) : false;
      actionsEl.innerHTML = `
        <button class="btn-follow ${isFollowing ? 'following' : ''}" onclick="toggleFollowFromModal('${user.id}')">
          ${isFollowing ? '<span><i class="fas fa-check"></i> Seguindo</span>' : '<i class="fas fa-user-plus"></i> Seguir'}
        </button>
      `;
    }

    window.currentModalUserId = user.id;
    profileModal.classList.add('active');
  };

  // Função auxiliar para atualizar o modal após seguir
  window.toggleFollowFromModal = async function(id) {
    await window.toggleFollow(id);
  };

  async function loadData() {
    const supa = window.supabaseClient;
    
    // Busca todos os perfis
    const { data: users, error: errorUsers } = await supa
      .from('profiles')
      .select('*')
      .order('id', { ascending: false });

    if (errorUsers) throw errorUsers;

    // Busca a tabela de seguidores (followers)
    const { data: followers, error: errorFollowers } = await supa
      .from('followers')
      .select('*');

    if (errorFollowers) {
      console.warn("A tabela 'followers' não foi encontrada. O SQL foi executado?", errorFollowers);
    }

    allUsers = users;
    allFollowersData = followers;
    
    // Atualizar Stats da Comunidade
    const now = new Date();
    const onlineCount = allUsers.filter(u => {
      const lastSeen = u.last_seen ? new Date(u.last_seen) : null;
      return lastSeen && (now - lastSeen) < 300000;
    }).length;
    
    document.getElementById('totalMembers').textContent = allUsers.length;
    document.getElementById('onlineNow').textContent = onlineCount;
    
    applyFilters();
  }

  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const sortBy = sortSelect.value;

    let filteredUsers = allUsers.filter(user => {
      const name = (user.full_name || user.username || 'Usuario').toLowerCase();
      return name.includes(searchTerm);
    });

    switch (sortBy) {
      case 'recent':
        // A lista já vem ordenada por id desc (mais recentes) do banco
        break;
      case 'level-desc':
        filteredUsers.sort((a, b) => {
          const xpA = a.store_data?.xp || 0;
          const xpB = b.store_data?.xp || 0;
          return xpB - xpA;
        });
        break;
      case 'xp-desc':
        filteredUsers.sort((a, b) => {
          const xpA = a.store_data?.xp || 0;
          const xpB = b.store_data?.xp || 0;
          return xpB - xpA;
        });
        break;
      case 'nome-asc':
        filteredUsers.sort((a, b) => {
          const nameA = a.full_name || a.username || 'Usuario';
          const nameB = b.full_name || b.username || 'Usuario';
          return nameA.localeCompare(nameB);
        });
        break;
    }

    renderUsers(filteredUsers);
  }

  window.toggleFollow = async function(targetId) {
    if (!currentUser) {
      alert("Você precisa estar logado para seguir alguém!");
      window.location.href = "login.html";
      return;
    }

    if (targetId === currentUser.id) {
      alert("Você não pode seguir a si mesmo!");
      return;
    }

    try {
      const supa = window.supabaseClient;
      const isCurrentlyFollowing = allFollowersData.some(f => f.follower_id === currentUser.id && f.following_id === targetId);

      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supa
          .from('followers')
          .delete()
          .match({ follower_id: currentUser.id, following_id: targetId });
        if (error) throw error;
        allFollowersData = allFollowersData.filter(f => !(f.follower_id === currentUser.id && f.following_id === targetId));
      } else {
        // Follow
        const { error } = await supa
          .from('followers')
          .insert({ follower_id: currentUser.id, following_id: targetId });
        if (error) throw error;
        allFollowersData.push({ follower_id: currentUser.id, following_id: targetId, created_at: new Date().toISOString() });
      }

      // Atualizar a UI sem recarregar tudo
      updateFollowUI(targetId, !isCurrentlyFollowing);
    } catch (err) {
      console.error("Erro ao seguir/deixar de seguir:", err);
      alert("Ocorreu um erro ao atualizar os seguidores.");
    }
  };

  function updateFollowUI(targetId, isNowFollowing) {
    // 1. Atualizar botões na grade
    const gridButtons = document.querySelectorAll(`.btn-follow[onclick*="toggleFollow('${targetId}')"]`);
    gridButtons.forEach(btn => {
      if (isNowFollowing) {
        btn.classList.add('following');
        btn.innerHTML = '<span><i class="fas fa-check"></i> Seguindo</span>';
      } else {
        btn.classList.remove('following');
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Seguir';
      }
    });

    // 2. Atualizar contador de seguidores na grade (opcional, mas bom para UX)
    const cards = document.querySelectorAll('.user-card');
    cards.forEach(card => {
      // Infelizmente não temos o ID do usuário no card de forma fácil sem um data-id
      // Mas o botão está dentro do card, podemos subir
    });

    // 3. Atualizar o modal se estiver aberto para esse usuário
    if (profileModal.classList.contains('active')) {
      const modalActions = document.getElementById('modalActions');
      const modalBtn = modalActions.querySelector('.btn-follow');
      if (modalBtn && modalBtn.getAttribute('onclick').includes(targetId)) {
        if (isNowFollowing) {
          modalBtn.classList.add('following');
          modalBtn.innerHTML = '<span><i class="fas fa-check"></i> Seguindo</span>';
        } else {
          modalBtn.classList.remove('following');
          modalBtn.innerHTML = '<i class="fas fa-user-plus"></i> Seguir';
        }
      }
      
      // Atualizar contador de seguidores no modal
      const followersCount = allFollowersData.filter(f => f.following_id === targetId).length;
      const modalStats = document.getElementById('modalStats');
      if (modalStats) {
        const xp = modalStats.querySelector('.stat-box:nth-child(2) .stat-value').innerHTML;
        modalStats.innerHTML = `
          <div class="stat-box">
            <span class="stat-value">${followersCount}</span>
            <span class="stat-label">Seguidores</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">${xp}</span>
            <span class="stat-label">XP</span>
          </div>
        `;
      }
    }
  }

  function renderUsers(users) {
    if (users.length === 0) {
      usersGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 50px;">Nenhum maratonista encontrado.</p>';
      return;
    }

    usersGrid.innerHTML = '';

    users.forEach((user, index) => {
      const storeData = user.store_data || {};
      const level = storeData.xp ? Math.floor(storeData.xp / 1000) + 1 : 1;
      const xp = storeData.xp || 0;
      const avatar = user.avatar_url || 'assets/tryhard.png';
      const name = user.full_name || user.username || ('Membro_' + user.id.substring(0, 5));
      const isVip = xp > 5000;
      
      // Lógica de Status Online
      const lastSeen = user.last_seen ? new Date(user.last_seen) : null;
      const now = new Date();
      const isOnline = lastSeen && (now - lastSeen) < 300000; // 5 minutos em ms
      const statusText = isOnline ? 'Online' : 'Offline';
      const statusClass = isOnline ? 'online' : 'offline';
      
      const equipped = storeData.equipped || {};
      const aura = equipped.aura || 'none';
      const banner = equipped.banner || 'none';
      const accessory = equipped.acessorio || 'none';

      const followersCount = allFollowersData.filter(f => f.following_id === user.id).length;
      const isFollowing = currentUser ? allFollowersData.some(f => f.follower_id === currentUser.id && f.following_id === user.id) : false;
      const isMe = currentUser && currentUser.id === user.id;

      const userCard = document.createElement('div');
      userCard.className = 'user-card';
      userCard.setAttribute('data-user-id', user.id);
      userCard.style.animationDelay = `${index * 0.05}s`;
      if (isMe) userCard.classList.add('me-card');
      
      if (aura !== 'none') {
        userCard.classList.add('has-aura');
        userCard.setAttribute('data-aura', aura);
      }

      const bannerStyle = banner !== 'none' 
        ? `background-image: url('${banner}'); background-size: cover;` 
        : `background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(0,0,0,0.4));`;

      userCard.innerHTML = `
        ${isVip ? '<div class="vip-badge"><i class="fas fa-crown"></i> VIP</div>' : ''}
        <div class="user-banner" style="${bannerStyle}" onclick="openProfileModal('${user.id}')"></div>
        
        <div class="user-avatar-wrapper" onclick="openProfileModal('${user.id}')">
          <img src="${avatar}" alt="${name}" class="user-avatar" onerror="this.src='assets/tryhard.png'">
          ${accessory !== 'none' ? `<img src="${accessory}" class="user-accessory" alt="Acessório">` : ''}
          <div class="status-dot-indicator ${statusClass}" title="${statusText}"></div>
        </div>
        
        <div class="user-info-section">
          <span class="user-name" onclick="openProfileModal('${user.id}')" style="cursor:pointer;">${name} ${isMe ? '<small>(Você)</small>' : ''}</span>
          <div class="user-level">LVL ${level}</div>
          
          <div class="user-stats-grid">
            <div class="stat-box">
              <span class="stat-value">${followersCount}</span>
              <span class="stat-label">Seguidores</span>
            </div>
            <div class="stat-box">
              <span class="stat-value"><i class="fas fa-star"></i>${xp}</span>
              <span class="stat-label">XP</span>
            </div>
          </div>

          ${!isMe ? `
            <button class="btn-follow ${isFollowing ? 'following' : ''}" onclick="toggleFollow('${user.id}')">
              ${isFollowing ? '<span><i class="fas fa-check"></i> Seguindo</span>' : '<i class="fas fa-user-plus"></i> Seguir'}
            </button>
          ` : '<a href="perfil.html" class="btn-follow" style="text-align:center; text-decoration:none; display:block;">Editar Perfil</a>'}
        </div>
      `;

      usersGrid.appendChild(userCard);
    });
  }

  init();
});
