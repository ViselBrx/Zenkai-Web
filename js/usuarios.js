document.addEventListener('DOMContentLoaded', async () => {
  const usersGrid = document.getElementById('usersGrid');
  const searchInput = document.getElementById('userSearch');
  const sortSelect = document.getElementById('userSort');
  const profileModal = document.getElementById('profileModal');
  const closeModal = document.getElementById('closeModal');

  const socialSidebar = document.getElementById('socialSidebar');
  const socialOverlay = document.getElementById('socialOverlay');
  const socialToggle = document.getElementById('socialToggle');
  const closeSocialBtn = document.getElementById('closeSocial');
  const followersTabBtn = document.getElementById('followersTabBtn');
  const chatTabBtn = document.getElementById('chatTabBtn');
  const followersPanel = document.getElementById('followersPanel');
  const chatPanel = document.getElementById('chatPanel');
  const socialUnreadBadge = document.getElementById('socialUnreadBadge');
  const socialHeaderUnreadBadge = document.getElementById('socialHeaderUnreadBadge');
  const socialHeaderPresence = document.getElementById('socialHeaderPresence');

  const conversationSearch = document.getElementById('conversationSearch');
  const conversationList = document.getElementById('conversationList');
  const chatEmptyState = document.getElementById('chatEmptyState');
  const chatThread = document.getElementById('chatThread');
  const chatHeaderAvatar = document.getElementById('chatHeaderAvatar');
  const chatHeaderName = document.getElementById('chatHeaderName');
  const chatHeaderStatus = document.getElementById('chatHeaderStatus');
  const chatOpenProfileBtn = document.getElementById('chatOpenProfileBtn');
  const chatDeleteChatBtn = document.getElementById('chatDeleteChatBtn');
  const chatToggleSelectionBtn = document.getElementById('chatToggleSelectionBtn');
  const chatSelectionTools = document.getElementById('chatSelectionTools');
  const chatDefaultTools = document.getElementById('chatDefaultTools');
  const chatSelectionCount = document.getElementById('chatSelectionCount');
  const chatDeleteSelectedBtn = document.getElementById('chatDeleteSelectedBtn');
  const chatCancelSelectionBtn = document.getElementById('chatCancelSelectionBtn');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatAttachmentBtn = document.getElementById('chatAttachmentBtn');
  const chatAttachmentInput = document.getElementById('chatAttachmentInput');
  const chatAttachmentPreview = document.getElementById('chatAttachmentPreview');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatSendBtnLabel = document.getElementById('chatSendBtnLabel');
  const chatDraftLabel = document.getElementById('chatDraftLabel');
  const chatCharCounter = document.getElementById('chatCharCounter');
  const chatCancelEditBtn = document.getElementById('chatCancelEditBtn');
  const chatImageViewer = document.getElementById('chatImageViewer');
  const chatImageViewerImg = document.getElementById('chatImageViewerImg');
  const chatImageViewerTitle = document.getElementById('chatImageViewerTitle');
  const chatImageViewerOpen = document.getElementById('chatImageViewerOpen');
  const chatImageViewerClose = document.getElementById('chatImageViewerClose');
  const chatDeleteConfirmModal = document.getElementById('chatDeleteConfirmModal');
  const chatDeleteConfirmTitle = document.getElementById('chatDeleteConfirmTitle');
  const chatDeleteConfirmText = document.getElementById('chatDeleteConfirmText');
  const chatDeleteConfirmCancel = document.getElementById('chatDeleteConfirmCancel');
  const chatDeleteConfirmAccept = document.getElementById('chatDeleteConfirmAccept');
  const chatActionModal = document.getElementById('chatActionModal');
  const chatActionTitle = document.getElementById('chatActionTitle');
  const chatActionText = document.getElementById('chatActionText');
  const chatActionList = document.getElementById('chatActionList');
  const chatActionCancel = document.getElementById('chatActionCancel');

  const CHAT_TABLE = 'direct_messages';
  const CHAT_ATTACHMENT_BUCKET = 'chat-attachments';
  const CHAT_SETUP_HINT = 'Execute database/schema/14_user_chat.sql no Supabase para ativar o chat.';
  const CHAT_DELETE_SETUP_HINT = 'Execute database/fixes/18_direct_messages_delete_message_support.sql no Supabase para liberar a exclusao de mensagens.';
  const CHAT_ATTACHMENT_SETUP_HINT = 'Execute database/storage/03_chat_attachments_bucket.sql no Supabase para liberar o envio de arquivos.';
  const CHAT_ATTACHMENT_MAX_BYTES = 50 * 1024 * 1024;
  const ONLINE_WINDOW_MS = 300000;
  const COMMUNITY_LEVEL_XP_PER_LEVEL = 100;
  const COMMUNITY_PRESENCE_REFRESH_MS = 30000;
  const COMMUNITY_PIN_LIMIT = 3;
  const SESSION_KEYS = {
    activeChat: 'animehouse_active_chat_user',
    activeTab: 'animehouse_social_tab',
    drafts: 'animehouse_chat_drafts'
  };

  let allUsers = [];
  let allFollowersData = [];
  let currentUser = null;
  let directMessages = [];
  let activeChatUserId = null;
  let activeSidebarTab = 'followers';
  let chatTableAvailable = true;
  let chatSending = false;
  let conversationDrafts = {};
  let selectedChatFile = null;
  let selectedChatPreviewUrl = null;
  let activeChatEditState = null;
  let realtimeReady = false;
  let chatDeleteConfirmResolver = null;
  let activeChatActionMessageId = null;
  let pendingChatRenderMode = 'auto';
  let lastRenderedChatUserId = null;
  let communityPresenceTimer = null;
  let filterRenderTimer = null;
  let sidebarRenderQueued = false;
  let isChatSelectionMode = false;
  let selectedChatMessages = new Set();
  let pendingChatScrollToMessageId = null;

  document.body.classList.add('community-performance');
  restoreSidebarState();
  setupStaticListeners();
  await init();

  async function init() {
    try {
      const supa = window.supabaseClient;
      if (!supa) {
        setTimeout(init, 200);
        return;
      }

      const { data: { session } } = await supa.auth.getSession();
      if (session) {
        currentUser = session.user;
        if (typeof window.startPresenceHeartbeat === 'function') {
          window.startPresenceHeartbeat();
        }
        await renderCurrentUserBadge();
      }

      await loadData();
      syncCurrentUserCommunityState();
      await markPendingMessagesAsDelivered();
      ensureActiveChatStillValid();
      setupRealtimeListeners();
      setupCommunityRefresh();
      applyFilters();
      renderSidebar();
    } catch (err) {
      console.error('Erro ao inicializar comunidade:', err);
      usersGrid.innerHTML = '<p class="error" style="grid-column: 1/-1; text-align:center;">Erro ao carregar a comunidade.</p>';
    }
  }

  function setupStaticListeners() {
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (filterRenderTimer) clearTimeout(filterRenderTimer);
        filterRenderTimer = setTimeout(() => {
          filterRenderTimer = null;
          applyFilters();
        }, 90);
      });
    }
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);

    if (closeModal) {
      closeModal.onclick = () => profileModal.classList.remove('active');
    }

    if (profileModal) {
      profileModal.onclick = (event) => {
        if (event.target === profileModal) profileModal.classList.remove('active');
      };
    }

    if (closeSocialBtn) {
      closeSocialBtn.addEventListener('click', closeSocialSidebar);
    }

    if (socialOverlay) {
      socialOverlay.addEventListener('click', closeSocialSidebar);
    }

    if (followersTabBtn) {
      followersTabBtn.addEventListener('click', () => {
        selectSidebarTab('followers');
      });
    }

    if (chatTabBtn) {
      chatTabBtn.addEventListener('click', () => {
        if (!activeChatUserId) {
          const firstConversation = buildConversationSummaries()[0];
          if (firstConversation) activeChatUserId = firstConversation.otherUserId;
        }
        selectSidebarTab('chat');
      });
    }

    if (chatOpenProfileBtn) {
      chatOpenProfileBtn.addEventListener('click', () => {
        if (!activeChatUserId) return;
        closeSocialSidebar();
        openProfileModal(activeChatUserId);
      });
    }

    if (chatDeleteChatBtn) {
      chatDeleteChatBtn.addEventListener('click', async () => {
        if (!activeChatUserId) return;
        openChatBulkDeleteActions(activeChatUserId);
      });
    }

    if (chatToggleSelectionBtn) {
      chatToggleSelectionBtn.addEventListener('click', () => {
        toggleChatSelectionMode(true);
      });
    }

    if (chatCancelSelectionBtn) {
      chatCancelSelectionBtn.addEventListener('click', () => {
        toggleChatSelectionMode(false);
      });
    }

    if (chatDeleteSelectedBtn) {
      chatDeleteSelectedBtn.addEventListener('click', async () => {
        if (selectedChatMessages.size === 0) return;
        openChatBulkDeleteActions(activeChatUserId, selectedChatMessages);
      });
    }

    if (conversationSearch) {
      conversationSearch.value = '';
      conversationSearch.addEventListener('input', renderConversationList);
    }

    if (chatForm) {
      chatForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await sendCurrentMessage();
      });
    }

    if (chatInput) {
      chatInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
          if (!event.shiftKey) {
            event.preventDefault();
            await sendCurrentMessage();
          }
          // Shift+Enter will naturally insert a newline in the textarea
        }
      });

      chatInput.addEventListener('input', () => {
        autoResizeTextarea();
        persistDraftForActiveChat();
        setChatInputState();
      });
    }

    if (chatCancelEditBtn) {
      chatCancelEditBtn.addEventListener('click', () => {
        clearChatEditState({ restoreDraft: true });
      });
    }

    if (chatAttachmentBtn && chatAttachmentInput) {
      chatAttachmentBtn.addEventListener('click', () => {
        if (!chatAttachmentBtn.disabled) chatAttachmentInput.click();
      });

      chatAttachmentInput.addEventListener('change', async (event) => {
        await handleChatAttachmentSelection(event.target.files?.[0] || null);
      });
    }

    if (chatMessages) {
      chatMessages.addEventListener('click', async (event) => {
        if (isChatSelectionMode) {
          const bubble = event.target.closest('.chat-bubble');
          if (bubble) {
            const msgId = bubble.getAttribute('data-message-id');
            if (msgId) {
              if (selectedChatMessages.has(msgId)) {
                selectedChatMessages.delete(msgId);
                bubble.classList.remove('selected');
              } else {
                selectedChatMessages.add(msgId);
                bubble.classList.add('selected');
              }
              updateChatSelectionUI();
            }
          }
          return;
        }

        const messageActionTrigger = event.target.closest('[data-chat-message-actions-open]');
        if (messageActionTrigger) {
          event.preventDefault();
          openChatMessageActions(messageActionTrigger.getAttribute('data-chat-message-actions-open'));
          return;
        }

        const trigger = event.target.closest('[data-chat-image-url]');
        if (!trigger) return;

        event.preventDefault();
        openChatImageViewer(
          trigger.getAttribute('data-chat-image-url') || '',
          trigger.getAttribute('data-chat-image-name') || 'Imagem do chat'
        );
      });
    }

    if (chatImageViewerClose) {
      chatImageViewerClose.addEventListener('click', closeChatImageViewer);
    }

    if (chatImageViewer) {
      chatImageViewer.addEventListener('click', (event) => {
        if (event.target === chatImageViewer) closeChatImageViewer();
      });
    }

    if (chatDeleteConfirmCancel) {
      chatDeleteConfirmCancel.addEventListener('click', () => {
        resolveChatDeleteConfirm(false);
      });
    }

    if (chatDeleteConfirmAccept) {
      chatDeleteConfirmAccept.addEventListener('click', () => {
        resolveChatDeleteConfirm(true);
      });
    }

    if (chatDeleteConfirmModal) {
      chatDeleteConfirmModal.addEventListener('click', (event) => {
        if (event.target === chatDeleteConfirmModal) {
          resolveChatDeleteConfirm(false);
        }
      });
    }

    if (chatActionCancel) {
      chatActionCancel.addEventListener('click', closeChatMessageActions);
    }

    if (chatActionModal) {
      chatActionModal.addEventListener('click', (event) => {
        if (event.target === chatActionModal) {
          closeChatMessageActions();
          return;
        }

        const actionButton = event.target.closest('[data-chat-message-action]');
        const bulkActionButton = event.target.closest('[data-chat-bulk-action]');

        if (actionButton) {
          const action = actionButton.getAttribute('data-chat-message-action');
          const messageId = actionButton.getAttribute('data-chat-message-id');
          closeChatMessageActions();
          handleChatMessageAction(action, messageId);
          return;
        }

        if (bulkActionButton) {
          const action = bulkActionButton.getAttribute('data-chat-bulk-action');
          const otherUserId = bulkActionButton.getAttribute('data-chat-target-user-id');
          const messageIdsStr = bulkActionButton.getAttribute('data-chat-message-ids');
          const messageIds = messageIdsStr ? new Set(messageIdsStr.split(',')) : null;
          closeChatMessageActions();
          handleChatBulkAction(action, otherUserId, messageIds);
        }
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && chatDeleteConfirmResolver) {
        resolveChatDeleteConfirm(false);
        return;
      }

      if (event.key === 'Escape' && activeChatActionMessageId) {
        closeChatMessageActions();
        return;
      }

      if (event.key === 'Escape' && chatImageViewer?.classList.contains('active')) {
        closeChatImageViewer();
        return;
      }
    });
  }

  function setupRealtimeListeners() {
    if (realtimeReady) return;

    const supa = window.supabaseClient;
    if (!supa) return;

    realtimeReady = true;

    supa
      .channel('followers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'followers' }, async (payload) => {
        console.log('🔔 Mudança Realtime:', payload.eventType);

        if (payload.eventType === 'INSERT') {
          const exists = allFollowersData.some(item =>
            (item.id && item.id === payload.new.id) ||
            (item.follower_id === payload.new.follower_id && item.following_id === payload.new.following_id)
          );
          if (!exists) allFollowersData.push(payload.new);
          updateSpecificUserStats(payload.new.following_id);
        } else if (payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
          const { data: freshFollowers } = await supa.from('followers').select('*');
          if (freshFollowers) {
            allFollowersData = freshFollowers;
            updateAllFollowersUI();
          }
        }
      })
      .subscribe();

    supa
      .channel('profiles-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const index = allUsers.findIndex(user => user.id === payload.new.id);
        if (index !== -1) {
          allUsers[index] = { ...allUsers[index], ...payload.new };
          syncCurrentUserCommunityState();
          refreshCommunityPresenceAndStats();
          if (window.updateMyFollowers && socialSidebar?.classList.contains('active')) window.updateMyFollowers();
        }
      })
      .subscribe();

    if (!currentUser || !chatTableAvailable) return;

    supa
      .channel('direct-messages-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: CHAT_TABLE }, async (payload) => {
        const candidate = payload.new || payload.old;
        if (!candidate) return;

        const belongsToCurrentUser =
          candidate.sender_id === currentUser.id || candidate.recipient_id === currentUser.id;

        if (!belongsToCurrentUser) return;

        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          upsertDirectMessage(payload.new);
        }

        scheduleSidebarRender(payload.eventType === 'INSERT' ? 'auto' : 'preserve');

        if (payload.eventType === 'INSERT' && payload.new && payload.new.recipient_id === currentUser.id) {
          if (activeChatUserId && payload.new.sender_id === activeChatUserId && activeSidebarTab === 'chat') {
            await markConversationAsRead(activeChatUserId);
          } else {
            await markPendingMessagesAsDelivered();
          }
        }
      })
      .subscribe();
  }

  function restoreSidebarState() {
    try {
      activeChatUserId = sessionStorage.getItem(SESSION_KEYS.activeChat) || null;
      activeSidebarTab = sessionStorage.getItem(SESSION_KEYS.activeTab) || 'followers';
      conversationDrafts = JSON.parse(sessionStorage.getItem(SESSION_KEYS.drafts) || '{}') || {};
    } catch (error) {
      activeChatUserId = null;
      activeSidebarTab = 'followers';
      conversationDrafts = {};
    }
  }

  function persistSidebarState() {
    try {
      if (activeChatUserId) {
        sessionStorage.setItem(SESSION_KEYS.activeChat, activeChatUserId);
      } else {
        sessionStorage.removeItem(SESSION_KEYS.activeChat);
      }
      sessionStorage.setItem(SESSION_KEYS.activeTab, activeSidebarTab);
      sessionStorage.setItem(SESSION_KEYS.drafts, JSON.stringify(conversationDrafts));
    } catch (error) {
      console.warn('Não foi possível persistir o estado da sidebar:', error);
    }
  }

  function isMissingRelationError(error) {
    const message = String(error?.message || '');
    return error?.code === 'PGRST205'
      || /relation .* does not exist/i.test(message)
      || /Could not find the table/i.test(message);
  }

  function getUserDisplayName(user) {
    return user?.full_name || user?.username || ('Membro_' + String(user?.id || '').substring(0, 5));
  }

  function getUserAvatar(user) {
    return user?.avatar_url || 'assets/tryhard.png';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getSearchTokens(value) {
    return normalizeSearchText(value)
      .split(' ')
      .map((token) => token.trim())
      .filter(Boolean);
  }

  function formatFileSize(bytes) {
    const size = Number(bytes || 0);
    if (!Number.isFinite(size) || size <= 0) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function sanitizeFileName(name) {
    return String(name || 'arquivo')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 80) || 'arquivo';
  }

  function toFiniteNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function getUserCommunityProgress(user) {
    const storeData = user?.store_data || {};
    const xpCandidates = [
      storeData.total_xp,
      storeData.totalXP,
      storeData.xp,
      user?.total_xp,
      user?.totalXP
    ];

    let totalXp = 0;
    xpCandidates.some((candidate) => {
      const parsed = Number(candidate);
      if (!Number.isFinite(parsed)) return false;
      totalXp = Math.max(0, parsed);
      return true;
    });

    let explicitLevel = 0;
    [storeData.level, storeData.userLevel, user?.level].some((candidate) => {
      const parsed = parseInt(candidate, 10);
      if (!Number.isFinite(parsed) || parsed < 1) return false;
      explicitLevel = parsed;
      return true;
    });

    if (currentUser?.id && user?.id === currentUser.id) {
      const localTotalXp = parseInt(localStorage.getItem('animehouse_totalXP') || '', 10);
      const localLevel = parseInt(localStorage.getItem('animehouse_userLevel') || '', 10);

      if (Number.isFinite(localTotalXp) && localTotalXp >= 0) {
        totalXp = localTotalXp;
      }

      if (Number.isFinite(localLevel) && localLevel >= 1) {
        explicitLevel = Math.max(explicitLevel, localLevel);
      }
    }

    const computedLevel = Math.floor(totalXp / COMMUNITY_LEVEL_XP_PER_LEVEL) + 1;
    const level = Math.max(explicitLevel || 0, computedLevel, 1);

    return {
      totalXp,
      level,
      isVip: totalXp > 5000
    };
  }

  function syncCurrentUserCommunityState() {
    if (!currentUser) return;

    const index = allUsers.findIndex((user) => user.id === currentUser.id);
    if (index === -1) return;

    const currentEntry = allUsers[index] || {};
    const nextStoreData = { ...(currentEntry.store_data || {}) };
    const localTotalXp = parseInt(localStorage.getItem('animehouse_totalXP') || '', 10);
    const localLevel = parseInt(localStorage.getItem('animehouse_userLevel') || '', 10);

    if (Number.isFinite(localTotalXp) && localTotalXp >= 0) {
      nextStoreData.total_xp = localTotalXp;
      nextStoreData.xp = localTotalXp;
    }

    if (Number.isFinite(localLevel) && localLevel >= 1) {
      nextStoreData.level = localLevel;
    }

    allUsers[index] = {
      ...currentEntry,
      last_seen: new Date().toISOString(),
      store_data: nextStoreData
    };
  }

  function getCurrentUserCommunityEntry() {
    if (!currentUser) return null;
    return allUsers.find((user) => user.id === currentUser.id) || null;
  }

  function getPinnedConversationIds() {
    const storeData = getCurrentUserCommunityEntry()?.store_data || {};
    const pinned = Array.isArray(storeData.community_pinned_chats)
      ? storeData.community_pinned_chats
      : Array.isArray(storeData.pinned_community_chats)
        ? storeData.pinned_community_chats
        : [];

    const unique = [];
    pinned.forEach((value) => {
      const normalized = String(value || '').trim();
      if (!normalized || normalized === currentUser?.id || unique.includes(normalized)) return;
      unique.push(normalized);
    });
    return unique.slice(0, COMMUNITY_PIN_LIMIT);
  }

  async function persistCurrentUserCommunityStore(nextStoreData) {
    if (!currentUser) throw new Error('Você precisa estar logado para salvar suas preferências.');

    const supa = window.supabaseClient;
    if (!supa) throw new Error('Cliente do Supabase indisponível no momento.');

    const ts = new Date().toISOString();
    const { error } = await supa
      .from('profiles')
      .update({ store_data: nextStoreData, updated_at: ts })
      .eq('id', currentUser.id);

    if (error) throw error;

    const index = allUsers.findIndex((user) => user.id === currentUser.id);
    if (index >= 0) {
      allUsers[index] = {
        ...allUsers[index],
        store_data: nextStoreData,
        updated_at: ts
      };
    }

    if (window.DB?._store?.profile?.id === currentUser.id) {
      window.DB._store.profile.store_data = nextStoreData;
      window.DB._store.profile.updated_at = ts;
    }
  }

  async function togglePinnedConversation(userId) {
    if (!currentUser) {
      showNotice('Faça login para fixar conversas.');
      return;
    }

    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId || normalizedUserId === currentUser.id) return;

    const currentEntry = getCurrentUserCommunityEntry();
    const storeData = currentEntry?.store_data && typeof currentEntry.store_data === 'object'
      ? { ...currentEntry.store_data }
      : {};
    const pinnedIds = getPinnedConversationIds();
    const alreadyPinned = pinnedIds.includes(normalizedUserId);

    if (!alreadyPinned && pinnedIds.length >= COMMUNITY_PIN_LIMIT) {
      showNotice(`Você pode fixar no máximo ${COMMUNITY_PIN_LIMIT} conversas. Remova uma para adicionar outra.`);
      return;
    }

    const nextPinnedIds = alreadyPinned
      ? pinnedIds.filter((id) => id !== normalizedUserId)
      : [normalizedUserId, ...pinnedIds].slice(0, COMMUNITY_PIN_LIMIT);

    storeData.community_pinned_chats = nextPinnedIds;

    try {
      await persistCurrentUserCommunityStore(storeData);
      renderConversationList();
      showSuccessNotice(
        alreadyPinned
          ? 'Conversa removida dos fixados.'
          : 'Conversa fixada no topo.'
      );
    } catch (error) {
      console.error('Erro ao salvar conversas fixadas:', error);
      showNotice(error?.message || 'Não foi possível atualizar as conversas fixadas.');
    }
  }

  function isImageFile(fileOrMime) {
    const mimeType = typeof fileOrMime === 'string'
      ? fileOrMime
      : String(fileOrMime?.type || '');
    return mimeType.startsWith('image/');
  }

  function getAttachmentKind(source) {
    if (source?.attachment_kind === 'image' || source?.attachment_kind === 'file') {
      return source.attachment_kind;
    }

    const mimeType = String(source?.attachment_mime_type || source?.type || '');
    return isImageFile(mimeType) ? 'image' : 'file';
  }

  function getMessagePreview(message) {
    if (!message) return 'Nova conversa';
    if (isMessageDeletedForEveryone(message)) return 'Mensagem apagada pelo remetente';

    const parts = [];
    if (message.attachment_url) {
      if (getAttachmentKind(message) === 'image') {
        parts.push('Foto enviada');
      } else {
        parts.push(`Arquivo: ${message.attachment_name || 'anexo'}`);
      }
    }

    if (String(message.content || '').trim()) {
      parts.push(String(message.content).trim());
    }

    const preview = parts.join(' • ') || 'Nova conversa';
    return message.sender_id === currentUser?.id ? `Você: ${preview}` : preview;
  }

  function getConversationSearchText(message) {
    if (!message) return '';

    const parts = [];
    if (isMessageDeletedForEveryone(message)) {
      parts.push('mensagem apagada pelo remetente');
    }

    if (message.attachment_url) {
      parts.push(getAttachmentKind(message) === 'image' ? 'foto imagem' : 'arquivo anexo');
    }

    if (message.attachment_name) {
      parts.push(message.attachment_name);
    }

    if (String(message.content || '').trim()) {
      parts.push(String(message.content).trim());
    }

    return parts.join(' ');
  }

  function getMessageStatus(message) {
    if (message.read_at) return 'seen';
    if (message.delivered_at) return 'delivered';
    return 'sent';
  }

  function isMessageDeletedForEveryone(message) {
    return !!message?.deleted_for_everyone_at;
  }

  function isMessageHiddenForCurrentUser(message) {
    if (!currentUser || !message) return false;
    if (message.sender_id === currentUser.id) return !!message.hidden_for_sender_at;
    if (message.recipient_id === currentUser.id) return !!message.hidden_for_recipient_at;
    return false;
  }

  function getRenderableMessageText(message) {
    if (isMessageDeletedForEveryone(message)) {
      return 'Esta mensagem foi apagada pelo usuario que a enviou.';
    }

    return String(message?.content || '').trim();
  }

  function getChatMessageById(messageId) {
    return directMessages.find((message) => String(message.id) === String(messageId)) || null;
  }

  function getChatMessageActions(message) {
    if (!message?.id || !currentUser) return [];

    const actions = [{
      key: 'delete-me',
      label: 'Excluir para mim',
      icon: 'fas fa-trash-alt',
      danger: false
    }];

    if (message.attachment_url && !isMessageDeletedForEveryone(message)) {
      actions.unshift({
        key: 'download',
        label: 'Baixar arquivo',
        icon: 'fas fa-download',
        danger: false
      });
    }

    if (message.sender_id === currentUser.id && !isMessageDeletedForEveryone(message)) {
      actions.unshift({
        key: 'edit',
        label: 'Editar mensagem',
        icon: 'fas fa-pen',
        danger: false
      });
      actions.push({
        key: 'delete-everyone',
        label: 'Excluir para todos',
        icon: 'fas fa-ban',
        danger: true
      });
    }

    return actions;
  }

  function openChatMessageActions(messageId) {
    const message = getChatMessageById(messageId);
    if (!message || !chatActionModal || !chatActionList) return;

    const actions = getChatMessageActions(message);
    if (actions.length === 0) return;

    activeChatActionMessageId = String(message.id);
    if (chatActionTitle) chatActionTitle.textContent = 'Ações da mensagem';
    if (chatActionText) {
      chatActionText.textContent = message.sender_id === currentUser?.id
        ? 'Você pode editar a mensagem, baixar o arquivo, remover só da sua conversa ou apagar para todos.'
        : 'Você pode baixar o arquivo ou remover esta mensagem apenas da sua conversa.';
    }

    chatActionList.innerHTML = actions.map((action) => `
      <button
        type="button"
        class="chat-action-btn ${action.danger ? 'danger' : ''}"
        data-chat-message-action="${escapeHtml(action.key)}"
        data-chat-message-id="${escapeHtml(String(message.id))}"
      >
        <i class="${escapeHtml(action.icon)}"></i>
        <span>${escapeHtml(action.label)}</span>
      </button>
    `).join('');

    chatActionModal.classList.add('active');
    chatActionModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeChatMessageActions() {
    activeChatActionMessageId = null;
    if (chatActionModal) {
      chatActionModal.classList.remove('active');
      chatActionModal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  }

  function renderMessageActionsMarkup(message) {
    if (!message?.id || !currentUser) return '';
    const messageId = escapeHtml(String(message.id));

    return `
      <div class="chat-bubble-head">
        <div class="chat-message-action-wrap">
          <button
            type="button"
            class="chat-message-menu-btn"
            data-chat-message-actions-open="${messageId}"
            title="Ações da mensagem"
          >
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
    `;
  }

  function renderMessageStatusMarkup(message) {
    if (!message || message.sender_id !== currentUser?.id) return '';

    const status = getMessageStatus(message);
    if (status === 'seen') {
      return `
        <span class="chat-message-status seen" title="Visualizada">
          <span class="chat-status-double">
            <i class="fas fa-check"></i><i class="fas fa-check"></i>
          </span>
        </span>
      `;
    }

    if (status === 'delivered') {
      return `
        <span class="chat-message-status delivered" title="Entregue">
          <span class="chat-status-double">
            <i class="fas fa-check"></i><i class="fas fa-check"></i>
          </span>
        </span>
      `;
    }

    return `
      <span class="chat-message-status sent" title="Enviada">
        <i class="fas fa-check"></i>
      </span>
    `;
  }

  function renderMessageAttachmentMarkup(message) {
    if (!message?.attachment_url || isMessageDeletedForEveryone(message)) return '';

    const attachmentUrl = escapeHtml(message.attachment_url);
    const rawAttachmentName = message.attachment_name || 'arquivo';
    const attachmentName = escapeHtml(rawAttachmentName);
    const attachmentSize = formatFileSize(message.attachment_size_bytes);
    const attachmentMeta = attachmentSize
      ? `<small>${escapeHtml(attachmentSize)}</small>`
      : '';

    if (getAttachmentKind(message) === 'image') {
      return `
        <button
          type="button"
          class="chat-attachment-image-link"
          data-chat-image-url="${attachmentUrl}"
          data-chat-image-name="${attachmentName}"
          aria-label="Abrir imagem ${attachmentName}"
        >
          <img class="chat-attachment-image" src="${attachmentUrl}" alt="${attachmentName}">
          <span class="chat-attachment-image-overlay">
            <i class="fas fa-image"></i>
            <span>Foto completa</span>
          </span>
        </button>
        <div class="chat-attachment-actions">
          <button
            type="button"
            class="chat-attachment-caption"
            data-chat-image-url="${attachmentUrl}"
            data-chat-image-name="${attachmentName}"
          >
            <i class="fas fa-image"></i>
            <span>${attachmentName}</span>
            ${attachmentMeta}
          </button>
          <a class="chat-attachment-inline-link" href="${attachmentUrl}" target="_blank" rel="noopener noreferrer">
            Abrir em nova aba
          </a>
          <span style="color:rgba(255,255,255,0.15)">•</span>
          <a class="chat-attachment-inline-link" href="${attachmentUrl}${attachmentUrl.includes('?') ? '&' : '?'}download=${encodeURIComponent(rawAttachmentName)}" title="Baixar imagem">
            <i class="fas fa-download"></i> Baixar
          </a>
        </div>
      `;
    }

    const fileInfo = [
      escapeHtml(message.attachment_mime_type || 'Arquivo'),
      attachmentSize ? escapeHtml(attachmentSize) : ''
    ].filter(Boolean).join(' • ');

    return `
      <div class="chat-file-card-wrapper">
        <a class="chat-file-card" href="${attachmentUrl}" target="_blank" rel="noopener noreferrer">
          <span class="chat-file-icon"><i class="fas fa-paperclip"></i></span>
          <span class="chat-file-meta">
            <strong>${attachmentName}</strong>
            <small>${fileInfo}</small>
          </span>
        </a>
        <a class="chat-file-download-btn" href="${attachmentUrl}${attachmentUrl.includes('?') ? '&' : '?'}download=${encodeURIComponent(rawAttachmentName)}" title="Baixar arquivo">
          <i class="fas fa-download"></i>
        </a>
      </div>
    `;
  }

  function isUserOnline(user) {
    const lastSeen = user?.last_seen ? new Date(user.last_seen) : null;
    return !!(lastSeen && (Date.now() - lastSeen.getTime()) < ONLINE_WINDOW_MS);
  }

  function getStatusText(user) {
    if (isUserOnline(user)) return 'Online agora';

    const lastSeen = user?.last_seen ? new Date(user.last_seen) : null;
    if (!lastSeen || Number.isNaN(lastSeen.getTime())) return 'Offline';

    const diffMinutes = Math.max(1, Math.round((Date.now() - lastSeen.getTime()) / 60000));
    if (diffMinutes < 60) return `Visto há ${diffMinutes} min`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `Visto há ${diffHours} h`;

    return 'Offline';
  }

  function formatConversationTime(value) {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
    if (diffMinutes < 60) return `${diffMinutes} min`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h`;

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function formatMessageTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatMessageDateDivider(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
                    
    const isYesterday = date.getDate() === yesterday.getDate() && 
                        date.getMonth() === yesterday.getMonth() && 
                        date.getFullYear() === yesterday.getFullYear();
                        
    if (isToday) return 'Hoje';
    if (isYesterday) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function buildConversationSummaries() {
    const map = new Map();

    directMessages
      .filter((message) => !isMessageHiddenForCurrentUser(message))
      .forEach((message) => {
      const otherUserId = message.sender_id === currentUser.id ? message.recipient_id : message.sender_id;
      const existing = map.get(otherUserId);
      const nextUnread = (
        message.recipient_id === currentUser.id &&
        !message.read_at &&
        !isMessageDeletedForEveryone(message)
      ) ? 1 : 0;

      if (!existing) {
        map.set(otherUserId, {
          otherUserId,
          lastMessage: message,
          unreadCount: nextUnread
        });
        return;
      }

      existing.unreadCount += nextUnread;
      if (new Date(message.created_at).getTime() >= new Date(existing.lastMessage.created_at).getTime()) {
        existing.lastMessage = message;
      }
    });

    if (activeChatUserId && !map.has(activeChatUserId)) {
      map.set(activeChatUserId, {
        otherUserId: activeChatUserId,
        lastMessage: null,
        unreadCount: 0
      });
    }

    return [...map.values()].sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }

  function getConversationMessages(otherUserId) {
    if (!currentUser) return [];
    return directMessages.filter((message) => {
      const belongsToConversation =
        (message.sender_id === currentUser.id && message.recipient_id === otherUserId) ||
        (message.sender_id === otherUserId && message.recipient_id === currentUser.id);

      return belongsToConversation && !isMessageHiddenForCurrentUser(message);
    });
  }

  function countMatchedSearchTokens(normalizedText, searchTokens) {
    if (!normalizedText || !Array.isArray(searchTokens) || searchTokens.length === 0) {
      return 0;
    }

    let matches = 0;
    searchTokens.forEach((token) => {
      if (normalizedText.includes(token)) matches += 1;
    });
    return matches;
  }

  function buildConversationSearchIndex(searchTokens = []) {
    const index = new Map();
    if (!currentUser) return index;

    directMessages
      .filter((message) => !isMessageHiddenForCurrentUser(message))
      .forEach((message) => {
        const otherUserId = message.sender_id === currentUser.id
          ? message.recipient_id
          : message.sender_id;
        if (!otherUserId || otherUserId === currentUser.id) return;

        const nextText = getConversationSearchText(message);
        const normalizedText = normalizeSearchText(nextText);
        const existing = index.get(otherUserId) || {
          historyText: '',
          matchPreview: '',
          matchScore: 0,
          matchTime: 0,
          fullMatch: false,
          matchMessageId: null
        };

        if (normalizedText) {
          existing.historyText = existing.historyText
            ? `${existing.historyText} ${normalizedText}`
            : normalizedText;
        }

        if (searchTokens.length > 0 && normalizedText) {
          const matchScore = countMatchedSearchTokens(normalizedText, searchTokens);
          if (matchScore > 0) {
            const messageTime = new Date(message.created_at || 0).getTime();
            const shouldReplace =
              matchScore > existing.matchScore ||
              (matchScore === existing.matchScore && messageTime >= existing.matchTime);

            if (shouldReplace) {
              existing.matchPreview = getMessagePreview(message);
              existing.matchScore = matchScore;
              existing.matchTime = Number.isFinite(messageTime) ? messageTime : 0;
              existing.fullMatch = matchScore === searchTokens.length;
              existing.matchMessageId = message.id;
            }
          }
        }

        index.set(otherUserId, existing);
      });

    return index;
  }

  function getConversationDraft(userId) {
    return userId ? String(conversationDrafts[userId] || '') : '';
  }

  function getActiveChatEditMessage() {
    if (!activeChatEditState?.messageId) return null;
    return getChatMessageById(activeChatEditState.messageId);
  }

  function clearChatEditState(options = {}) {
    if (!activeChatEditState) {
      setChatInputState();
      return;
    }

    const { restoreDraft = false } = options;
    const restoreValue = restoreDraft ? String(activeChatEditState.previousDraft || '') : '';
    activeChatEditState = null;

    if (chatInput) {
      chatInput.value = restoreValue;
    }

    if (restoreDraft) {
      setConversationDraft(activeChatUserId, restoreValue);
    }

    setChatInputState();
  }

  function beginChatMessageEdit(message) {
    if (!currentUser || !message?.id || message.sender_id !== currentUser.id || isMessageDeletedForEveryone(message)) {
      return;
    }

    activeChatEditState = {
      messageId: String(message.id),
      previousDraft: String(chatInput?.value || '')
    };

    if (selectedChatFile) {
      clearSelectedChatAttachment();
    }

    if (chatInput) {
      chatInput.value = String(message.content || '');
      chatInput.focus();
      const length = chatInput.value.length;
      if (typeof chatInput.setSelectionRange === 'function') {
        chatInput.setSelectionRange(length, length);
      }
    }

    setChatInputState();
  }

  function getOnlineCount() {
    let count = 0;
    allUsers.forEach((user) => {
      if (isUserOnline(user)) count += 1;
    });
    return count;
  }

  function refreshCommunityPresenceAndStats() {
    syncCurrentUserCommunityState();
    applyFilters();
    scheduleSidebarRender('preserve');

    if (profileModal?.classList.contains('active') && window.currentModalUserId) {
      window.openProfileModal(window.currentModalUserId);
    }
  }

  function setupCommunityRefresh() {
    if (communityPresenceTimer) return;

    communityPresenceTimer = setInterval(() => {
      refreshCommunityPresenceAndStats();
    }, COMMUNITY_PRESENCE_REFRESH_MS);

    window.addEventListener('focus', () => {
      syncCurrentUserCommunityState();
      if (typeof window.startPresenceHeartbeat === 'function') {
        window.startPresenceHeartbeat();
      }
      refreshCommunityPresenceAndStats();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      syncCurrentUserCommunityState();
      refreshCommunityPresenceAndStats();
    });
  }

  function buildFollowersCountMap() {
    const counts = new Map();
    allFollowersData.forEach((item) => {
      counts.set(item.following_id, (counts.get(item.following_id) || 0) + 1);
    });
    return counts;
  }

  function buildFollowingSet(followerId = currentUser?.id) {
    const following = new Set();
    if (!followerId) return following;

    allFollowersData.forEach((item) => {
      if (item.follower_id === followerId) following.add(item.following_id);
    });
    return following;
  }

  function mergeChatRenderMode(currentMode, nextMode) {
    const priority = { auto: 0, preserve: 1, bottom: 2 };
    return (priority[nextMode] || 0) > (priority[currentMode] || 0) ? nextMode : currentMode;
  }

  function scheduleSidebarRender(mode = 'auto') {
    pendingChatRenderMode = mergeChatRenderMode(pendingChatRenderMode, mode);
    if (sidebarRenderQueued) return;
    sidebarRenderQueued = true;

    requestAnimationFrame(() => {
      sidebarRenderQueued = false;
      renderSidebar();
    });
  }

  function setConversationDraft(userId, value) {
    if (!userId) return;

    const normalized = String(value || '').slice(0, 600);
    if (normalized.trim()) {
      conversationDrafts[userId] = normalized;
    } else {
      delete conversationDrafts[userId];
    }

    persistSidebarState();
  }

  function persistDraftForActiveChat() {
    if (activeChatEditState) return;
    setConversationDraft(activeChatUserId, chatInput?.value || '');
  }

  function getUnreadCount() {
    return directMessages.reduce((count, message) => {
      if (
        message.recipient_id === currentUser?.id &&
        !message.read_at &&
        !isMessageHiddenForCurrentUser(message) &&
        !isMessageDeletedForEveryone(message)
      ) {
        return count + 1;
      }
      return count;
    }, 0);
  }

  function renderUnreadBadges() {
    const unreadCount = getUnreadCount();
    const show = unreadCount > 0;

    if (socialUnreadBadge) {
      socialUnreadBadge.style.display = show ? 'inline-flex' : 'none';
      socialUnreadBadge.textContent = unreadCount;
    }

    if (socialHeaderUnreadBadge) {
      socialHeaderUnreadBadge.style.display = show ? 'inline-flex' : 'none';
      socialHeaderUnreadBadge.textContent = unreadCount;
    }
  }

  function updatePresenceLabel() {
    if (!socialHeaderPresence) return;
    const onlineCount = getOnlineCount();
    socialHeaderPresence.innerHTML = `<i class="fas fa-signal"></i><span>${onlineCount} online agora</span>`;
  }

  function autoResizeTextarea() {
    if (!chatInput) return;
    chatInput.style.height = 'auto';
    const nextHeight = Math.min(Math.max(chatInput.scrollHeight, 56), 180);
    chatInput.style.height = `${nextHeight}px`;
  }

  function openChatImageViewer(imageUrl, imageName) {
    if (!chatImageViewer || !chatImageViewerImg) return;
    if (!imageUrl) return;

    const safeName = String(imageName || 'Imagem do chat');
    chatImageViewer.classList.add('active');
    chatImageViewer.setAttribute('aria-hidden', 'false');
    chatImageViewerImg.src = imageUrl;
    chatImageViewerImg.alt = safeName;
    if (chatImageViewerTitle) chatImageViewerTitle.textContent = safeName;
    if (chatImageViewerOpen) chatImageViewerOpen.href = imageUrl;
    document.body.style.overflow = 'hidden';
  }

  function closeChatImageViewer() {
    if (!chatImageViewer || !chatImageViewerImg) return;

    chatImageViewer.classList.remove('active');
    chatImageViewer.setAttribute('aria-hidden', 'true');
    chatImageViewerImg.src = '';
    if (chatImageViewerOpen) chatImageViewerOpen.href = '#';
    document.body.style.overflow = '';
  }

  function openChatDeleteConfirm(options = {}) {
    if (!chatDeleteConfirmModal || !chatDeleteConfirmAccept || !chatDeleteConfirmCancel) {
      return Promise.resolve(false);
    }

    if (chatDeleteConfirmResolver) {
      chatDeleteConfirmResolver(false);
    }

    if (chatDeleteConfirmTitle) {
      chatDeleteConfirmTitle.textContent = options.title || 'Excluir mensagem?';
    }

    if (chatDeleteConfirmText) {
      chatDeleteConfirmText.textContent = options.message || 'Essa ação não poderá ser desfeita.';
    }

    chatDeleteConfirmAccept.textContent = options.confirmLabel || 'Excluir';
    chatDeleteConfirmCancel.textContent = options.cancelLabel || 'Cancelar';
    chatDeleteConfirmModal.classList.add('active');
    chatDeleteConfirmModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    return new Promise((resolve) => {
      chatDeleteConfirmResolver = resolve;
      setTimeout(() => {
        chatDeleteConfirmAccept.focus();
      }, 0);
    });
  }

  function resolveChatDeleteConfirm(confirmed) {
    if (!chatDeleteConfirmResolver) return;

    const resolver = chatDeleteConfirmResolver;
    chatDeleteConfirmResolver = null;

    if (chatDeleteConfirmModal) {
      chatDeleteConfirmModal.classList.remove('active');
      chatDeleteConfirmModal.setAttribute('aria-hidden', 'true');
    }

    document.body.style.overflow = '';
    resolver(!!confirmed);
  }

  function clearSelectedChatAttachment() {
    if (selectedChatPreviewUrl) {
      URL.revokeObjectURL(selectedChatPreviewUrl);
      selectedChatPreviewUrl = null;
    }
    selectedChatFile = null;
    if (chatAttachmentInput) chatAttachmentInput.value = '';
    renderSelectedAttachmentPreview();
  }

  async function handleChatAttachmentSelection(file) {
    if (!file) {
      clearSelectedChatAttachment();
      setChatInputState();
      return;
    }

    if (file.size > CHAT_ATTACHMENT_MAX_BYTES) {
      clearSelectedChatAttachment();
      showNotice('O arquivo excede o limite de 50 MB para o chat.');
      setChatInputState();
      return;
    }

    selectedChatFile = file;
    renderSelectedAttachmentPreview();
    setChatInputState();
  }

  function openChatBulkDeleteActions(otherUserId, messageIds = null) {
    if (!chatActionModal || !chatActionList || !currentUser) return;

    let messages;
    if (messageIds) {
      messages = Array.from(messageIds).map(id => getChatMessageById(id)).filter(Boolean);
    } else {
      messages = getConversationMessages(otherUserId);
    }

    if (messages.length === 0) return;

    const hasMyMessages = messages.some(m => m.sender_id === currentUser.id && !isMessageDeletedForEveryone(m));
    const title = messageIds ? `Apagar ${messages.length} mensagem(ns)` : 'Apagar conversa inteira';
    
    if (chatActionTitle) chatActionTitle.textContent = title;
    if (chatActionText) {
      chatActionText.textContent = hasMyMessages 
        ? 'Deseja apagar estas mensagens para todos ou apenas para você?'
        : 'Deseja apagar estas mensagens para você?';
    }

    const actions = [
      {
        key: 'bulk-delete-me',
        label: 'Apagar para mim',
        icon: 'fas fa-trash-alt',
        description: 'As mensagens sumirão apenas para você. A outra pessoa continuará vendo.',
        danger: false
      }
    ];

    if (hasMyMessages) {
      actions.push({
        key: 'bulk-delete-everyone',
        label: 'Apagar para todos',
        icon: 'fas fa-ban',
        description: 'Suas mensagens enviadas serão apagadas para ambos. As recebidas somem só para você.',
        danger: true
      });
    }

    chatActionList.innerHTML = actions.map((action) => `
      <button
        type="button"
        class="chat-action-btn ${action.danger ? 'danger' : ''}"
        data-chat-bulk-action="${escapeHtml(action.key)}"
        data-chat-target-user-id="${escapeHtml(otherUserId)}"
        data-chat-message-ids="${messageIds ? escapeHtml(Array.from(messageIds).join(',')) : ''}"
        style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 14px 16px; height: auto; width: 100%; border-radius: 12px; margin-bottom: 8px;"
      >
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="${escapeHtml(action.icon)}" style="font-size: 1.1rem;"></i>
          <strong style="font-size: 0.95rem;">${escapeHtml(action.label)}</strong>
        </div>
        <small style="font-size: 0.72rem; opacity: 0.75; font-weight: normal; text-align: left; display: block; white-space: normal; line-height: 1.3;">
          ${escapeHtml(action.description)}
        </small>
      </button>
    `).join('');

    chatActionModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  async function handleChatBulkAction(action, otherUserId, messageIds = null) {
    const isEveryone = action === 'bulk-delete-everyone';
    
    const confirm = await openChatDeleteConfirm({
      title: isEveryone ? 'Excluir para todos?' : 'Excluir para você?',
      message: isEveryone 
        ? 'Suas mensagens enviadas serão removidas para ambos os lados. Mensagens recebidas sumirão apenas para você.'
        : 'As mensagens selecionadas sumirão apenas da sua conversa. A outra pessoa continuará vendo normalmente.',
      confirmLabel: isEveryone ? 'Excluir para todos' : 'Excluir para mim'
    });

    if (!confirm) return;

    try {
      if (messageIds) {
        await deleteSelectedMessages(messageIds, isEveryone);
        toggleChatSelectionMode(false);
      } else {
        await deleteWholeChat(otherUserId, isEveryone);
      }
      showSuccessNotice(`Mensagem(ns) apagada(s) ${isEveryone ? 'para todos' : 'para você'}.`);
    } catch (error) {
      console.error('Erro na ação em massa do chat:', error);
      showNotice('Não foi possível concluir a exclusão.');
    }
  }

  function renderSelectedAttachmentPreview() {
    if (!chatAttachmentPreview) return;

    if (!selectedChatFile) {
      chatAttachmentPreview.classList.add('hidden');
      chatAttachmentPreview.innerHTML = '';
      updateChatComposerMeta();
      return;
    }

    if (selectedChatPreviewUrl) {
      URL.revokeObjectURL(selectedChatPreviewUrl);
      selectedChatPreviewUrl = null;
    }

    const isImage = isImageFile(selectedChatFile);
    selectedChatPreviewUrl = isImage ? URL.createObjectURL(selectedChatFile) : null;

    chatAttachmentPreview.classList.remove('hidden');
    chatAttachmentPreview.innerHTML = `
      <div class="chat-attachment-preview-main">
        ${isImage
          ? `<img class="chat-attachment-preview-thumb" src="${escapeHtml(selectedChatPreviewUrl)}" alt="${escapeHtml(selectedChatFile.name)}">`
          : `<span class="chat-attachment-preview-icon"><i class="fas fa-file"></i></span>`}
        <div class="chat-attachment-preview-meta">
          <span class="chat-attachment-preview-name">${escapeHtml(selectedChatFile.name)}</span>
          <span class="chat-attachment-preview-info">${escapeHtml(selectedChatFile.type || 'Arquivo')} • ${escapeHtml(formatFileSize(selectedChatFile.size))}</span>
        </div>
      </div>
      <button type="button" class="chat-attachment-remove" title="Remover anexo">
        <i class="fas fa-times"></i>
      </button>
    `;

    const removeBtn = chatAttachmentPreview.querySelector('.chat-attachment-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        clearSelectedChatAttachment();
        setChatInputState();
      });
    }

    updateChatComposerMeta();
  }

  function updateChatComposerMeta() {
    if (chatCharCounter) {
      const length = String(chatInput?.value || '').length;
      chatCharCounter.textContent = `${length} / 600 caracteres`;
    }

    if (!chatDraftLabel) return;

    if (!currentUser) {
      chatDraftLabel.textContent = 'Faça login para conversar.';
      return;
    }

    if (!chatTableAvailable) {
      chatDraftLabel.textContent = CHAT_SETUP_HINT;
      return;
    }

    if (!activeChatUserId) {
      chatDraftLabel.textContent = 'Escolha uma conversa para liberar o envio.';
      return;
    }

    if (activeChatEditState) {
      const editingMessage = getActiveChatEditMessage();
      const attachmentHint = editingMessage?.attachment_url ? ' O anexo original será mantido.' : '';
      chatDraftLabel.classList.add('editing');
      chatDraftLabel.textContent = `Modo de edição ativo (alterando a mensagem)${attachmentHint}`;
      return;
    }

    chatDraftLabel.classList.remove('editing');

    if (selectedChatFile) {
      chatDraftLabel.textContent = `Anexo pronto para envio: ${selectedChatFile.name} (${formatFileSize(selectedChatFile.size)})`;
      return;
    }

    const hasDraft = String(chatInput?.value || '').trim().length > 0;
    chatDraftLabel.textContent = hasDraft
      ? 'Rascunho salvo automaticamente. Clique em Enviar ou pressione Enter.'
      : 'Digite, clique em Enviar ou anexe arquivos de até 50 MB.';
  }

  function setChatBusy(isBusy) {
    chatSending = isBusy;
    const idleLabel = activeChatEditState ? 'Salvar' : 'Enviar';
    if (chatSendBtnLabel) {
      chatSendBtnLabel.textContent = isBusy
        ? (activeChatEditState ? 'Salvando...' : 'Enviando...')
        : idleLabel;
    } else if (chatSendBtn) {
      chatSendBtn.textContent = isBusy
        ? (activeChatEditState ? 'Salvando...' : 'Enviando...')
        : idleLabel;
    }
    setChatInputState();
  }

  function setChatInputState() {
    const disabled = !currentUser || !chatTableAvailable || !activeChatUserId || chatSending;

    if (activeChatEditState) {
      const editingMessage = getActiveChatEditMessage();
      const editingOtherUserId = editingMessage
        ? (editingMessage.sender_id === currentUser?.id ? editingMessage.recipient_id : editingMessage.sender_id)
        : null;
      if (!editingMessage || editingOtherUserId !== activeChatUserId) {
        activeChatEditState = null;
      }
    }

    if (activeChatUserId && !activeChatEditState) {
      const draft = getConversationDraft(activeChatUserId);
      if (chatInput && chatInput.value !== draft) chatInput.value = draft;
    } else if (!activeChatUserId && chatInput?.value) {
      chatInput.value = '';
    }

    const editingMessage = getActiveChatEditMessage();
    const hasPayload = String(chatInput?.value || '').trim().length > 0
      || !!selectedChatFile
      || !!(activeChatEditState && editingMessage?.attachment_url);

    if (chatInput) {
      chatInput.disabled = disabled;
      chatInput.placeholder = !currentUser
        ? 'Faça login para conversar...'
        : !chatTableAvailable
          ? 'Ative a tabela do chat no Supabase...'
          : !activeChatUserId
            ? 'Selecione uma conversa para comecar...'
            : activeChatEditState
              ? 'Edite a mensagem e clique em Enviar para salvar...'
              : 'Digite sua mensagem ou envie uma foto...';
    }

    if (chatAttachmentBtn) chatAttachmentBtn.disabled = disabled;
    if (chatAttachmentInput) chatAttachmentInput.disabled = disabled;
    if (chatSendBtn) chatSendBtn.disabled = disabled || !hasPayload;
    if (chatCancelEditBtn) chatCancelEditBtn.hidden = !activeChatEditState;

    autoResizeTextarea();
    updateChatComposerMeta();
  }

  function selectSidebarTab(tabName) {
    activeSidebarTab = tabName === 'chat' ? 'chat' : 'followers';

    if (activeSidebarTab === 'chat' && !activeChatUserId) {
      const firstConversation = buildConversationSummaries()[0];
      if (firstConversation) activeChatUserId = firstConversation.otherUserId;
    }

    if (followersTabBtn) followersTabBtn.classList.toggle('active', activeSidebarTab === 'followers');
    if (chatTabBtn) chatTabBtn.classList.toggle('active', activeSidebarTab === 'chat');
    if (followersPanel) followersPanel.classList.toggle('active', activeSidebarTab === 'followers');
    if (chatPanel) chatPanel.classList.toggle('active', activeSidebarTab === 'chat');

    persistSidebarState();

    if (activeSidebarTab === 'chat' && activeChatUserId) {
      markConversationAsRead(activeChatUserId);
    }
  }

  function openSocialSidebar(tabName = activeSidebarTab) {
    selectSidebarTab(tabName);
    if (socialSidebar) socialSidebar.classList.add('active');
    if (socialOverlay) socialOverlay.classList.add('active');
    if (socialToggle) socialToggle.classList.add('active');
    pendingChatRenderMode = 'bottom';
    renderSidebar(true);
  }

  function closeSocialSidebar() {
    if (socialSidebar) socialSidebar.classList.remove('active');
    if (socialOverlay) socialOverlay.classList.remove('active');
    if (socialToggle) socialToggle.classList.remove('active');
  }

  function ensureActiveChatStillValid() {
    if (!activeChatUserId) return;
    if (currentUser && activeChatUserId === currentUser.id) {
      if (activeChatEditState) clearChatEditState();
      activeChatUserId = null;
      persistSidebarState();
      return;
    }

    const exists = allUsers.some((user) => user.id === activeChatUserId);
    if (!exists && buildConversationSummaries().length === 0) {
      if (activeChatEditState) clearChatEditState();
      activeChatUserId = null;
      persistSidebarState();
    }
  }

  function renderConversationList() {
    if (!conversationList) return;

    if (!currentUser) {
      conversationList.innerHTML = '<div class="social-empty">Faça login para conversar com outros usuários.</div>';
      return;
    }

    if (!chatTableAvailable) {
      conversationList.innerHTML = `<div class="social-empty">${CHAT_SETUP_HINT}</div>`;
      return;
    }

    const searchTokens = getSearchTokens(conversationSearch?.value || '');
    const pinnedIds = getPinnedConversationIds();
    const pinnedOrder = new Map(pinnedIds.map((id, index) => [id, index]));
    const conversationSearchIndex = buildConversationSearchIndex(searchTokens);
    const conversations = buildConversationSummaries()
      .filter((summary) => {
        const otherUser = allUsers.find((item) => item.id === summary.otherUserId);
        if (!otherUser) return false;
        if (searchTokens.length === 0) return true;

        const searchEntry = conversationSearchIndex.get(summary.otherUserId);
        const conversationHistory = searchEntry?.historyText || '';
        const haystack = normalizeSearchText([
          getUserDisplayName(otherUser),
          otherUser.username || '',
          otherUser.full_name || '',
          getMessagePreview(summary.lastMessage),
          conversationHistory
        ].join(' '));

        return searchTokens.every((token) => haystack.includes(token));
      })
      .sort((a, b) => {
        const aPinned = pinnedOrder.has(a.otherUserId);
        const bPinned = pinnedOrder.has(b.otherUserId);

        if (aPinned && bPinned) {
          return pinnedOrder.get(a.otherUserId) - pinnedOrder.get(b.otherUserId);
        }
        if (aPinned) return -1;
        if (bPinned) return 1;

        if (searchTokens.length > 0) {
          const aScore = conversationSearchIndex.get(a.otherUserId)?.matchScore || 0;
          const bScore = conversationSearchIndex.get(b.otherUserId)?.matchScore || 0;
          if (aScore !== bScore) return bScore - aScore;
        }

        const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return bTime - aTime;
      });

    if (conversations.length === 0) {
      conversationList.innerHTML = searchTokens.length
        ? '<div class="social-empty">Nenhuma conversa encontrada para essa busca.</div>'
        : '<div class="social-empty">Nenhuma conversa iniciada ainda.</div>';
      return;
    }

    conversationList.innerHTML = '';

    conversations.forEach((summary) => {
      const otherUser = allUsers.find((item) => item.id === summary.otherUserId);
      if (!otherUser) return;

      const isActive = activeChatUserId === summary.otherUserId;
      const isOnline = isUserOnline(otherUser);
      const isPinned = pinnedOrder.has(summary.otherUserId);
      const searchEntry = conversationSearchIndex.get(summary.otherUserId) || null;
      const hasSearchPreview = searchTokens.length > 0 && !!searchEntry?.matchPreview;
      const preview = hasSearchPreview
        ? searchEntry.matchPreview
        : getMessagePreview(summary.lastMessage);
      const previewLabel = hasSearchPreview
        ? (searchEntry.fullMatch ? 'Trecho encontrado' : 'Historico relacionado')
        : '';

      const item = document.createElement('div');
      item.className = `conversation-item ${isActive ? 'active' : ''} ${isPinned ? 'pinned' : ''} ${hasSearchPreview ? 'search-match' : ''}`;

      item.innerHTML = `
        <button type="button" class="conversation-main-btn" data-open-chat-id="${escapeHtml(summary.otherUserId)}">
          <div class="conversation-avatar-wrap">
            <img src="${getUserAvatar(otherUser)}" class="conversation-avatar" alt="${escapeHtml(getUserDisplayName(otherUser))}">
            <span class="conversation-dot ${isOnline ? 'online' : 'offline'}"></span>
          </div>
          <div class="conversation-meta">
            <div class="conversation-name-row">
              <span class="conversation-name">${escapeHtml(getUserDisplayName(otherUser))}</span>
              <span class="conversation-time">${formatConversationTime(summary.lastMessage?.created_at)}</span>
            </div>
            <div class="conversation-preview-row">
              <div class="conversation-preview-copy">
                ${previewLabel ? `<span class="conversation-preview-label">${previewLabel}</span>` : ''}
                <span class="conversation-preview">${escapeHtml(preview)}</span>
              </div>
              ${summary.unreadCount > 0 ? `<span class="conversation-unread">${summary.unreadCount}</span>` : ''}
            </div>
          </div>
        </button>
        <div class="conversation-item-actions" style="display:flex; flex-direction:column; gap:4px; margin-left: 8px;">
          <button
            type="button"
            class="conversation-pin-btn ${isPinned ? 'active' : ''}"
            data-pin-user-id="${escapeHtml(summary.otherUserId)}"
            aria-pressed="${isPinned ? 'true' : 'false'}"
            title="${isPinned ? 'Desfixar conversa' : 'Fixar conversa'}"
            style="width:34px; height:34px; border-radius:12px; border:1px solid rgba(var(--primary-rgb), 0.2); background:rgba(var(--primary-rgb), 0.05); color:var(--primary); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s;"
          >
            <i class="fas fa-thumbtack" style="font-size:0.85rem;"></i>
          </button>
          <button
            type="button"
            class="conversation-item-delete-btn"
            data-delete-conv-id="${escapeHtml(summary.otherUserId)}"
            title="Apagar conversa"
            style="width:34px; height:34px; border-radius:12px; border:1px solid rgba(239,68,68,0.2); background:rgba(239,68,68,0.05); color:#ef4444; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s;"
          >
            <i class="fas fa-trash-can" style="font-size:0.85rem;"></i>
          </button>
        </div>
      `;

      const openBtn = item.querySelector('[data-open-chat-id]');
      const pinBtn = item.querySelector('[data-pin-user-id]');
      const delBtn = item.querySelector('[data-delete-conv-id]');

      if (openBtn) {
        openBtn.addEventListener('click', () => {
          const matchMessageId = hasSearchPreview && searchEntry ? searchEntry.matchMessageId : null;
          window.openChatWithUser(summary.otherUserId, matchMessageId);
        });
      }

      if (pinBtn) {
        pinBtn.addEventListener('click', async (event) => {
          event.preventDefault();
          event.stopPropagation();
          await togglePinnedConversation(summary.otherUserId);
        });
      }

      if (delBtn) {
        delBtn.addEventListener('click', async (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          const confirmed = await openChatDeleteConfirm({
            title: 'Apagar conversa',
            message: 'Deseja realmente apagar esta conversa inteira?',
            confirmLabel: 'Sim, apagar',
            cancelLabel: 'Cancelar'
          });
          
          if (!confirmed) {
            return;
          }
          
          openChatBulkDeleteActions(summary.otherUserId);
        });
      }

      conversationList.appendChild(item);
    });
  }

  function renderActiveChat() {
    if (!chatEmptyState || !chatThread) return;

    if (!currentUser) {
      lastRenderedChatUserId = null;
      chatEmptyState.style.display = 'block';
      chatThread.classList.add('hidden');
      chatEmptyState.innerHTML = '<i class="fas fa-lock" style="display:block; font-size: 1.4rem; margin-bottom: 10px; opacity: 0.55;"></i>Faça login para usar o chat.';
      setChatInputState();
      return;
    }

    if (!chatTableAvailable) {
      lastRenderedChatUserId = null;
      chatEmptyState.style.display = 'block';
      chatThread.classList.add('hidden');
      chatEmptyState.innerHTML = `<i class="fas fa-database" style="display:block; font-size: 1.4rem; margin-bottom: 10px; opacity: 0.55;"></i>${CHAT_SETUP_HINT}`;
      setChatInputState();
      return;
    }

    if (!activeChatUserId) {
      lastRenderedChatUserId = null;
      chatEmptyState.style.display = 'block';
      chatThread.classList.add('hidden');
      chatEmptyState.innerHTML = '<i class="fas fa-paper-plane" style="display:block; font-size: 1.4rem; margin-bottom: 10px; opacity: 0.55;"></i>Abra uma conversa por um seguidor ou pelo perfil de outro usuário.';
      setChatInputState();
      return;
    }

    const targetUser = allUsers.find((item) => item.id === activeChatUserId);
    if (!targetUser) {
      lastRenderedChatUserId = null;
      chatEmptyState.style.display = 'block';
      chatThread.classList.add('hidden');
      chatEmptyState.innerHTML = '<i class="fas fa-user-slash" style="display:block; font-size: 1.4rem; margin-bottom: 10px; opacity: 0.55;"></i>Usuário não encontrado.';
      setChatInputState();
      return;
    }

    chatEmptyState.style.display = 'none';
    chatThread.classList.remove('hidden');
    chatHeaderAvatar.src = getUserAvatar(targetUser);
    chatHeaderName.textContent = getUserDisplayName(targetUser);
    chatHeaderStatus.textContent = getStatusText(targetUser);

    const messages = getConversationMessages(activeChatUserId);
    const previousScrollTop = chatMessages.scrollTop;
    const previousScrollHeight = chatMessages.scrollHeight;
    const previousClientHeight = chatMessages.clientHeight;
    const previousDistanceFromBottom = previousScrollHeight - (previousScrollTop + previousClientHeight);
    const shouldForceBottom = pendingChatRenderMode === 'bottom' || lastRenderedChatUserId !== activeChatUserId;
    const shouldAutoStickBottom = pendingChatRenderMode === 'auto' && previousDistanceFromBottom <= 36;
    closeChatMessageActions();
    chatMessages.innerHTML = '';

    if (messages.length === 0) {
      chatMessages.innerHTML = '<div class="social-empty" style="padding: 24px 12px;">Conversa iniciada. Envie a primeira mensagem.</div>';
    } else {
      let lastDateLabel = null;

      messages.forEach((message) => {
        const currentDateLabel = formatMessageDateDivider(message.created_at);
        if (currentDateLabel && currentDateLabel !== lastDateLabel) {
          const divider = document.createElement('div');
          divider.className = 'chat-date-divider';
          divider.innerHTML = `<span>${currentDateLabel}</span>`;
          chatMessages.appendChild(divider);
          lastDateLabel = currentDateLabel;
        }

        const bubble = document.createElement('div');
        const isMine = message.sender_id === currentUser.id;
        const hasAttachment = !!message.attachment_url;
        const isDeleted = isMessageDeletedForEveryone(message);
        bubble.className = `chat-bubble ${isMine ? 'me' : ''} ${hasAttachment ? 'has-attachment' : ''} ${isDeleted ? 'is-deleted' : ''} ${selectedChatMessages.has(String(message.id)) ? 'selected' : ''}`.trim();
        bubble.setAttribute('data-message-id', String(message.id));
        bubble.innerHTML = `
          ${renderMessageActionsMarkup(message)}
          ${renderMessageAttachmentMarkup(message)}
          ${isDeleted
            ? `<div class="chat-bubble-deleted"><i class="fas fa-ban"></i><span>${escapeHtml(getRenderableMessageText(message))}</span></div>`
            : (getRenderableMessageText(message)
              ? `<div class="chat-bubble-text">${escapeHtml(getRenderableMessageText(message))}</div>`
              : '')}
          <div class="chat-bubble-footer">
            <span class="chat-bubble-time">${formatMessageTime(message.created_at)}</span>
            ${renderMessageStatusMarkup(message)}
          </div>
        `;
        chatMessages.appendChild(bubble);
      });
    }

    if (pendingChatScrollToMessageId) {
      const targetBubble = chatMessages.querySelector(`[data-message-id="${pendingChatScrollToMessageId}"]`);
      if (targetBubble) {
        targetBubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetBubble.style.transition = 'background-color 0.5s ease';
        targetBubble.style.backgroundColor = 'rgba(var(--primary-rgb), 0.3)';
        setTimeout(() => targetBubble.style.backgroundColor = '', 1500);
      } else {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
      pendingChatScrollToMessageId = null;
    } else if (shouldForceBottom || shouldAutoStickBottom) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
      const maxScrollTop = Math.max(chatMessages.scrollHeight - chatMessages.clientHeight, 0);
      chatMessages.scrollTop = Math.min(previousScrollTop, maxScrollTop);
    }

    lastRenderedChatUserId = activeChatUserId;
    pendingChatRenderMode = 'auto';
    setChatInputState();
  }

  function renderSidebar(forceFull = false) {
    renderUnreadBadges();
    if (!forceFull && !socialSidebar?.classList.contains('active')) return;
    updatePresenceLabel();
    renderConversationList();
    renderActiveChat();
  }

  function upsertDirectMessage(message) {
    if (!message?.id) return;

    const index = directMessages.findIndex((item) => item.id === message.id);
    if (index === -1) {
      directMessages.push(message);
    } else {
      directMessages[index] = { ...directMessages[index], ...message };
    }

    directMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async function markPendingMessagesAsDelivered() {
    if (!currentUser || !chatTableAvailable) return;

    const pending = directMessages.filter((message) =>
      message.recipient_id === currentUser.id &&
      !message.delivered_at &&
      !isMessageHiddenForCurrentUser(message) &&
      !isMessageDeletedForEveryone(message)
    );

    if (pending.length === 0) return;

    const deliveredAt = new Date().toISOString();
    pending.forEach((message) => {
      message.delivered_at = deliveredAt;
    });
    scheduleSidebarRender('preserve');

    try {
      const { error } = await window.supabaseClient
        .from(CHAT_TABLE)
        .update({ delivered_at: deliveredAt })
        .eq('recipient_id', currentUser.id)
        .is('delivered_at', null);

      if (error) throw error;
    } catch (error) {
      console.warn('Não foi possível marcar as mensagens como entregues:', error?.message || error);
    }
  }

  async function markConversationAsRead(otherUserId) {
    if (!currentUser || !chatTableAvailable) return;

    const unread = directMessages.filter((message) =>
      message.sender_id === otherUserId &&
      message.recipient_id === currentUser.id &&
      !message.read_at &&
      !isMessageHiddenForCurrentUser(message) &&
      !isMessageDeletedForEveryone(message)
    );

    if (unread.length === 0) {
      renderUnreadBadges();
      return;
    }

    const readAt = new Date().toISOString();
    unread.forEach((message) => {
      message.delivered_at = message.delivered_at || readAt;
      message.read_at = readAt;
    });
    scheduleSidebarRender('preserve');

    try {
      const { error } = await window.supabaseClient
        .from(CHAT_TABLE)
        .update({ delivered_at: readAt, read_at: readAt })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', currentUser.id)
        .is('read_at', null);

      if (error) throw error;
    } catch (error) {
      console.warn('Não foi possível marcar a conversa como lida:', error?.message || error);
    }
  }

  function showNotice(message) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, 'error', 7000);
    } else {
      alert(message);
    }
  }

  function showSuccessNotice(message) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, 'success', 7000);
    }
  }

  function isChatDeleteSchemaError(error) {
    const message = String(error?.message || '');
    return /hidden_for_sender_at/i.test(message)
      || /hidden_for_recipient_at/i.test(message)
      || /deleted_for_everyone_at/i.test(message)
      || /direct_messages_payload_check/i.test(message)
      || /check constraint/i.test(message);
  }

  function getChatDeleteErrorMessage(error) {
    if (isChatDeleteSchemaError(error)) return CHAT_DELETE_SETUP_HINT;
    return error?.message || 'Nao foi possivel atualizar a mensagem.';
  }

  function isMissingBucketError(error) {
    const message = String(error?.message || '');
    return /bucket/i.test(message) || /storage/i.test(message) || error?.statusCode === '404';
  }

  async function uploadChatAttachment(file) {
    if (!currentUser) throw new Error('Faça login para enviar arquivos.');
    if (!file) return null;

    if (file.size > CHAT_ATTACHMENT_MAX_BYTES) {
      throw new Error('O arquivo excede o limite de 50 MB para o chat.');
    }

    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
    const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
    const filePath = `${currentUser.id}/${Date.now()}_${baseName}${ext}`.replace(/\/+/g, '/');

    const { error } = await window.supabaseClient.storage
      .from(CHAT_ATTACHMENT_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });

    if (error) {
      if (isMissingBucketError(error)) {
        throw new Error(CHAT_ATTACHMENT_SETUP_HINT);
      }
      throw new Error(error.message || 'Não foi possível enviar o arquivo.');
    }

    const { data: { publicUrl } } = window.supabaseClient.storage
      .from(CHAT_ATTACHMENT_BUCKET)
      .getPublicUrl(filePath);

    return {
      attachment_url: publicUrl,
      attachment_path: filePath,
      attachment_name: file.name,
      attachment_size_bytes: file.size,
      attachment_mime_type: file.type || 'application/octet-stream',
      attachment_kind: isImageFile(file) ? 'image' : 'file'
    };
  }

  async function saveCurrentChatEdit() {
    const editingMessage = getActiveChatEditMessage();
    if (!currentUser || !editingMessage?.id || editingMessage.sender_id !== currentUser.id) {
      clearChatEditState();
      return;
    }

    const content = String(chatInput?.value || '').trim();
    const hasExistingAttachment = !!editingMessage.attachment_url;
    if (!content && !hasExistingAttachment) {
      showNotice('A mensagem precisa ter texto ou anexo para ser salva.');
      return;
    }

    setChatBusy(true);

    try {
      let attachmentPayload = {};
      const oldAttachmentPath = editingMessage.attachment_path;

      if (selectedChatFile) {
        attachmentPayload = await uploadChatAttachment(selectedChatFile);
      }

      const { data, error } = await window.supabaseClient
        .from(CHAT_TABLE)
        .update({ 
          content: content || null,
          ...attachmentPayload 
        })
        .eq('id', editingMessage.id)
        .eq('sender_id', currentUser.id)
        .select('*')
        .single();

      if (error) throw error;

      if (selectedChatFile && oldAttachmentPath) {
        await removeChatAttachmentFromStorage(oldAttachmentPath);
      }

      upsertDirectMessage(data);
      clearChatEditState();
      clearSelectedChatAttachment();
      setConversationDraft(activeChatUserId, '');
      scheduleSidebarRender('preserve');
      showSuccessNotice('Mensagem atualizada.');
    } catch (error) {
      console.error('Erro ao editar mensagem:', error);
      showNotice(error?.message || 'Nao foi possivel editar a mensagem.');
    } finally {
      setChatBusy(false);
      setChatInputState();
    }
  }

  async function sendCurrentMessage() {
    if (!currentUser) {
      showNotice('Faça login para usar o chat.');
      return;
    }

    if (!chatTableAvailable) {
      showNotice(CHAT_SETUP_HINT);
      return;
    }

    if (!activeChatUserId) {
      showNotice('Selecione um usuário antes de enviar uma mensagem.');
      return;
    }

    if (activeChatEditState) {
      await saveCurrentChatEdit();
      return;
    }

    const content = String(chatInput?.value || '').trim();
    if ((!content && !selectedChatFile) || chatSending) return;

    setChatBusy(true);

    try {
      const attachmentPayload = selectedChatFile
        ? await uploadChatAttachment(selectedChatFile)
        : {};

      const { data, error } = await window.supabaseClient
        .from(CHAT_TABLE)
        .insert({
          sender_id: currentUser.id,
          recipient_id: activeChatUserId,
          content: content || null,
          ...attachmentPayload
        })
        .select('*')
        .single();

      if (error) throw error;

      upsertDirectMessage(data);
      setConversationDraft(activeChatUserId, '');
      if (chatInput) chatInput.value = '';
      clearSelectedChatAttachment();
      autoResizeTextarea();
      scheduleSidebarRender('bottom');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showNotice(error?.message || 'Não foi possível enviar a mensagem.');
    } finally {
      setChatBusy(false);
      setChatInputState();
    }
  }

  async function removeChatAttachmentFromStorage(attachmentPath) {
    if (!attachmentPath) return;

    const { error } = await window.supabaseClient.storage
      .from(CHAT_ATTACHMENT_BUCKET)
      .remove([attachmentPath]);

    if (error) {
      console.warn('Nao foi possivel remover o anexo do chat:', error?.message || error);
    }
  }

  async function deleteMessageForCurrentUser(message) {
    if (!currentUser || !message?.id) return;

    const isMine = message.sender_id === currentUser.id;
    const hideColumn = isMine ? 'hidden_for_sender_at' : 'hidden_for_recipient_at';
    const ownerColumn = isMine ? 'sender_id' : 'recipient_id';

    const { data, error } = await window.supabaseClient
      .from(CHAT_TABLE)
      .update({ [hideColumn]: new Date().toISOString() })
      .eq('id', message.id)
      .eq(ownerColumn, currentUser.id)
      .select('*')
      .single();

    if (error) throw error;
    upsertDirectMessage(data);
    scheduleSidebarRender('preserve');
  }

  async function deleteMessageForEveryone(message) {
    if (!currentUser || !message?.id || message.sender_id !== currentUser.id || isMessageDeletedForEveryone(message)) {
      return;
    }

    const attachmentPath = message.attachment_path || null;
    const { data, error } = await window.supabaseClient
      .from(CHAT_TABLE)
      .update({
        content: null,
        attachment_url: null,
        attachment_path: null,
        attachment_name: null,
        attachment_size_bytes: null,
        attachment_mime_type: null,
        attachment_kind: null,
        deleted_for_everyone_at: new Date().toISOString()
      })
      .eq('id', message.id)
      .eq('sender_id', currentUser.id)
      .select('*')
      .single();

    if (error) throw error;

    upsertDirectMessage(data);
    scheduleSidebarRender('preserve');

    if (attachmentPath) {
      await removeChatAttachmentFromStorage(attachmentPath);
    }
  }

  async function handleChatMessageAction(action, messageId) {
    const message = getChatMessageById(messageId);
    if (!message) return;

    try {
      if (action === 'download') {
        if (!message.attachment_url) return;
        const url = `${message.attachment_url}${message.attachment_url.includes('?') ? '&' : '?'}download=${encodeURIComponent(message.attachment_name || 'arquivo')}`;
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showSuccessNotice('Iniciando download...');
        return;
      }

      if (action === 'edit') {
        beginChatMessageEdit(message);
        showSuccessNotice('Mensagem pronta para edição.');
        return;
      }

      if (action === 'delete-me') {
        const confirmDelete = await openChatDeleteConfirm({
          title: 'Excluir só para você?',
          message: 'Essa mensagem vai sumir apenas da sua conversa. A outra pessoa continuará vendo normalmente.',
          confirmLabel: 'Excluir para mim'
        });
        if (!confirmDelete) return;
        await deleteMessageForCurrentUser(message);
        showSuccessNotice('Você excluiu a mensagem para você.');
        return;
      }

      if (action === 'delete-everyone') {
        const confirmDelete = await openChatDeleteConfirm({
          title: 'Excluir para todos?',
          message: 'A mensagem será removida da conversa dos dois lados e, se houver anexo, ele também será retirado.',
          confirmLabel: 'Excluir para todos'
        });
        if (!confirmDelete) return;
        await deleteMessageForEveryone(message);
        showSuccessNotice('Voce excluiu a mensagem para todos.');
      }
    } catch (error) {
      console.error('Erro ao atualizar a mensagem do chat:', error);
      showNotice(getChatDeleteErrorMessage(error));
    }
  }

  function updateChatSelectionUI() {
    if (!chatSelectionCount) return;
    chatSelectionCount.textContent = `${selectedChatMessages.size} selecionadas`;
    if (chatDeleteSelectedBtn) {
      chatDeleteSelectedBtn.disabled = selectedChatMessages.size === 0;
    }
  }

  function toggleChatSelectionMode(active) {
    isChatSelectionMode = active;
    selectedChatMessages.clear();
    
    if (chatSelectionTools) chatSelectionTools.classList.toggle('hidden', !active);
    if (chatDefaultTools) chatDefaultTools.classList.toggle('hidden', active);
    
    if (chatMessages) {
      chatMessages.classList.toggle('selection-mode', active);
    }
    
    updateChatSelectionUI();
    renderActiveChat();
  }

  async function deleteWholeChat(otherUserId, deleteMyMessagesForEveryone = false) {
    if (!currentUser || !otherUserId) return;
    const messages = getConversationMessages(otherUserId);
    if (messages.length === 0) return;

    try {
      const ts = new Date().toISOString();
      
      if (deleteMyMessagesForEveryone) {
        const myMessages = messages.filter(m => m.sender_id === currentUser.id && !isMessageDeletedForEveryone(m));
        if (myMessages.length > 0) {
          const ids = myMessages.map(m => m.id);
          const attachmentPaths = myMessages.map(m => m.attachment_path).filter(Boolean);

          await window.supabaseClient.from(CHAT_TABLE).update({
            content: null,
            attachment_url: null,
            attachment_path: null,
            attachment_name: null,
            attachment_size_bytes: null,
            attachment_mime_type: null,
            attachment_kind: null,
            deleted_for_everyone_at: ts
          }).in('id', ids);

          myMessages.forEach(m => {
            m.content = null;
            m.attachment_url = null;
            m.deleted_for_everyone_at = ts;
          });

          for (const path of attachmentPaths) {
            await removeChatAttachmentFromStorage(path);
          }
        }
      }

      const hideAsSender = messages.filter(m => m.sender_id === currentUser.id).map(m => m.id);
      const hideAsRecipient = messages.filter(m => m.recipient_id === currentUser.id).map(m => m.id);

      if (hideAsSender.length > 0) {
        await window.supabaseClient.from(CHAT_TABLE).update({ hidden_for_sender_at: ts }).in('id', hideAsSender);
      }
      if (hideAsRecipient.length > 0) {
        await window.supabaseClient.from(CHAT_TABLE).update({ hidden_for_recipient_at: ts }).in('id', hideAsRecipient);
      }

      messages.forEach(m => {
        if (m.sender_id === currentUser.id) m.hidden_for_sender_at = ts;
        if (m.recipient_id === currentUser.id) m.hidden_for_recipient_at = ts;
        upsertDirectMessage(m);
      });

      if (activeChatUserId === otherUserId) {
        activeChatUserId = null;
      }
      persistSidebarState();
      selectSidebarTab('chat');
      scheduleSidebarRender('preserve');
    } catch (e) {
      console.error('Erro ao apagar conversa inteira:', e);
      throw e;
    }
  }

  async function deleteSelectedMessages(messageIdsSet, deleteMyMessagesForEveryone = false) {
    if (!currentUser || !messageIdsSet || messageIdsSet.size === 0) return;

    const ids = Array.from(messageIdsSet);
    const messagesToProcess = ids.map(id => getChatMessageById(id)).filter(Boolean);
    
    try {
      const ts = new Date().toISOString();
      const myIdsDeletedForEveryone = new Set();

      if (deleteMyMessagesForEveryone) {
        const myMessages = messagesToProcess.filter(m => m.sender_id === currentUser.id && !isMessageDeletedForEveryone(m));
        if (myMessages.length > 0) {
          const myIds = myMessages.map(m => m.id);
          myIds.forEach(id => myIdsDeletedForEveryone.add(id));
          const attachmentPaths = myMessages.map(m => m.attachment_path).filter(Boolean);

          await window.supabaseClient.from(CHAT_TABLE).update({
            content: null,
            attachment_url: null,
            attachment_path: null,
            attachment_name: null,
            attachment_size_bytes: null,
            attachment_mime_type: null,
            attachment_kind: null,
            deleted_for_everyone_at: ts
          }).in('id', myIds);

          myMessages.forEach(m => {
            m.content = null;
            m.attachment_url = null;
            m.deleted_for_everyone_at = ts;
            upsertDirectMessage(m);
          });

          for (const path of attachmentPaths) {
            await removeChatAttachmentFromStorage(path);
          }
        }
      }

      // Hide logic: 
      // - If deleteMyMessagesForEveryone is FALSE, hide EVERYTHING selected.
      // - If deleteMyMessagesForEveryone is TRUE, only hide messages from OTHERS.
      // (Sent messages will stay as "Deleted" for the sender)
      
      const messagesToHide = messagesToProcess.filter(m => {
        if (!deleteMyMessagesForEveryone) return true;
        return m.sender_id !== currentUser.id;
      });

      if (messagesToHide.length > 0) {
        const hideAsSender = messagesToHide.filter(m => m.sender_id === currentUser.id).map(m => m.id);
        const hideAsRecipient = messagesToHide.filter(m => m.recipient_id === currentUser.id).map(m => m.id);

        if (hideAsSender.length > 0) {
          await window.supabaseClient.from(CHAT_TABLE).update({ hidden_for_sender_at: ts }).in('id', hideAsSender);
        }
        if (hideAsRecipient.length > 0) {
          await window.supabaseClient.from(CHAT_TABLE).update({ hidden_for_recipient_at: ts }).in('id', hideAsRecipient);
        }

        messagesToHide.forEach(m => {
          if (m.sender_id === currentUser.id) m.hidden_for_sender_at = ts;
          if (m.recipient_id === currentUser.id) m.hidden_for_recipient_at = ts;
          upsertDirectMessage(m);
        });
      }

      renderActiveChat();
      scheduleSidebarRender('preserve');
    } catch (e) {
      console.error('Erro ao apagar mensagens selecionadas:', e);
      throw e;
    }
  }

  window.openChatWithUser = async function(userId, targetMessageId = null) {
    if (!currentUser) {
      showNotice('Você precisa estar logado para conversar.');
      window.location.href = 'login.html';
      return;
    }

    if (!chatTableAvailable) {
      showNotice(CHAT_SETUP_HINT);
      return;
    }

    if (!userId || userId === currentUser.id) {
      showNotice('Você não pode abrir um chat consigo mesmo.');
      return;
    }

    if (activeChatUserId && activeChatUserId !== userId) {
      if (selectedChatFile) clearSelectedChatAttachment();
      if (activeChatEditState) clearChatEditState({ restoreDraft: true });
      if (isChatSelectionMode) toggleChatSelectionMode(false);
    }

    activeChatUserId = userId;
    if (targetMessageId) pendingChatScrollToMessageId = targetMessageId;
    selectSidebarTab('chat');
    persistSidebarState();
    if (profileModal) profileModal.classList.remove('active');
    openSocialSidebar('chat');
    scheduleSidebarRender();
    await markConversationAsRead(userId);

    if (chatInput) chatInput.focus();
  };

  function updateAllFollowersUI() {
    const followersCountMap = buildFollowersCountMap();
    const followingSet = buildFollowingSet();
    const allCards = document.querySelectorAll('.user-card[data-user-id]');
    allCards.forEach((card) => {
      const userId = card.getAttribute('data-user-id');
      const count = followersCountMap.get(userId) || 0;

      const countSpan = card.querySelector('.stat-box:nth-child(1) .stat-value');
      if (countSpan) countSpan.textContent = count;

      if (currentUser && currentUser.id !== userId) {
        const isFollowing = followingSet.has(userId);
        const btn = card.querySelector('.btn-follow');
        if (btn) {
          btn.classList.toggle('following', isFollowing);
          btn.innerHTML = isFollowing
            ? '<span><i class="fas fa-check"></i> Seguindo</span>'
            : '<i class="fas fa-user-plus"></i> Seguir';
        }
      }
    });

    if (profileModal.classList.contains('active') && window.currentModalUserId) {
      updateSpecificUserStats(window.currentModalUserId);
    }

    if (window.updateMyFollowers && socialSidebar?.classList.contains('active')) window.updateMyFollowers();
  }

  window.updateMyFollowers = function() {
    const listEl = document.getElementById('myFollowersList');
    if (!listEl || !currentUser) return;

    const myFollowers = allFollowersData.filter((item) => item.following_id === currentUser.id);
    if (myFollowers.length === 0) {
      listEl.innerHTML = '<div class="social-empty">Você ainda não tem seguidores.</div>';
      return;
    }

    listEl.innerHTML = '';
    myFollowers.forEach((follow) => {
      const follower = allUsers.find((user) => user.id === follow.follower_id);
      if (!follower) return;

      const card = document.createElement('div');
      card.className = 'follower-mini-card';
      card.onclick = () => {
        closeSocialSidebar();
        openProfileModal(follower.id);
      };

      card.innerHTML = `
        <img src="${getUserAvatar(follower)}" class="follower-mini-avatar" alt="${escapeHtml(getUserDisplayName(follower))}">
        <div class="follower-mini-info">
          <span class="follower-mini-name">${escapeHtml(getUserDisplayName(follower))}</span>
          <span class="follower-mini-status" style="color: ${isUserOnline(follower) ? 'var(--primary)' : 'var(--text-muted)'}">
            <i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 4px;"></i> ${getStatusText(follower)}
          </span>
        </div>
        <div class="follower-mini-actions">
          <button class="social-icon-btn" type="button" title="Conversar">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      `;

      const chatBtn = card.querySelector('.social-icon-btn');
      if (chatBtn) {
        chatBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          window.openChatWithUser(follower.id);
        });
      }

      listEl.appendChild(card);
    });
  };

  function updateSpecificUserStats(userId) {
    const followersCount = buildFollowersCountMap().get(userId) || 0;

    const card = document.querySelector(`.user-card[data-user-id="${userId}"]`);
    if (card) {
      const countSpan = card.querySelector('.stat-box:nth-child(1) .stat-value');
      if (countSpan) countSpan.textContent = followersCount;

      if (currentUser && currentUser.id !== userId) {
        const isFollowing = allFollowersData.some((item) => item.follower_id === currentUser.id && item.following_id === userId);
        const btn = card.querySelector('.btn-follow');
        if (btn) {
          btn.classList.toggle('following', isFollowing);
          btn.innerHTML = isFollowing
            ? '<span><i class="fas fa-check"></i> Seguindo</span>'
            : '<i class="fas fa-user-plus"></i> Seguir';
        }
      }
    }

    if (profileModal.classList.contains('active') && window.currentModalUserId === userId) {
      const modalStats = document.getElementById('modalStats');
      if (modalStats) {
        const countSpan = modalStats.querySelector('.stat-box:nth-child(1) .stat-value');
        if (countSpan) countSpan.textContent = followersCount;
      }

      const isFollowing = currentUser ? buildFollowingSet().has(userId) : false;
      const modalBtn = document.querySelector('#modalActions .btn-follow');
      if (modalBtn && currentUser && currentUser.id !== userId) {
        modalBtn.classList.toggle('following', isFollowing);
        modalBtn.innerHTML = isFollowing
          ? '<span><i class="fas fa-check"></i> Seguindo</span>'
          : '<i class="fas fa-user-plus"></i> Seguir';
      }
    }
  }

  function updateUserCardUI(userId) {
    const card = document.querySelector(`.user-card[data-user-id="${userId}"]`);
    const user = allUsers.find((item) => item.id === userId);
    if (!card || !user) return;

    const dot = card.querySelector('.status-dot-indicator');
    if (dot) {
      dot.className = `status-dot-indicator ${isUserOnline(user) ? 'online' : 'offline'}`;
      dot.title = isUserOnline(user) ? 'Online' : 'Offline';
    }

    const onlineCount = getOnlineCount();
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

      if (!profile) return;

      const userHub = document.getElementById('userHub');
      const userHubName = document.getElementById('userHubName');
      const userHubAvatar = document.getElementById('userHubAvatar');
      const userHubProfile = document.getElementById('userHubProfile');

      if (userHubName) userHubName.textContent = profile.full_name || profile.username || 'Minha Conta';
      if (userHubAvatar) userHubAvatar.src = profile.avatar_url || 'assets/tryhard.png';
      if (userHub) userHub.style.display = 'flex';

      const openSocial = (event) => {
        event.preventDefault();
        event.stopPropagation();
        openSocialSidebar(activeSidebarTab);
        if (window.updateMyFollowers) window.updateMyFollowers();
      };

      if (socialToggle) socialToggle.onclick = openSocial;
      if (userHubProfile) userHubProfile.onclick = openSocial;
    } catch (error) {
      console.warn('Erro ao carregar badge do usuário:', error);
    }
  }

  window.openProfileModal = function(userId) {
    const user = allUsers.find((item) => item.id === userId);
    if (!user) return;

    const storeData = user.store_data || {};
    const progress = getUserCommunityProgress(user);
    const equipped = storeData.equipped || {};
    const name = getUserDisplayName(user);
    const avatar = getUserAvatar(user);
    const banner = equipped.banner || 'none';
    const level = progress.level;
    const xp = progress.totalXp;
    const followersCount = buildFollowersCountMap().get(user.id) || 0;
    const isMe = currentUser && currentUser.id === user.id;
    const statusClass = isUserOnline(user) ? 'online' : 'offline';
    const statusText = isUserOnline(user) ? 'Online' : 'Offline';

    const modalImg = document.getElementById('modalImg');
    if (modalImg) modalImg.src = avatar;

    document.getElementById('modalName').textContent = name;

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
      bannerEl.style.background = 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.2), rgba(0,0,0,0.6))';
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
      actionsEl.innerHTML = '<a href="perfil.html" class="btn-follow" style="text-align:center; text-decoration:none; display:block;">Meu Perfil</a>';
    } else {
      const isFollowing = currentUser ? buildFollowingSet().has(user.id) : false;
      actionsEl.innerHTML = `
        <div class="modal-actions-row">
          <button class="btn-follow ${isFollowing ? 'following' : ''}" onclick="toggleFollowFromModal('${user.id}')">
            ${isFollowing ? '<span><i class="fas fa-check"></i> Seguindo</span>' : '<i class="fas fa-user-plus"></i> Seguir'}
          </button>
          <button class="btn-message" onclick="openChatWithUser('${user.id}')">
            <i class="fas fa-paper-plane"></i> Conversar
          </button>
        </div>
      `;
    }

    window.currentModalUserId = user.id;
    profileModal.classList.add('active');
  };

  window.toggleFollowFromModal = async function(id) {
    await window.toggleFollow(id);
  };

  async function loadData() {
    const supa = window.supabaseClient;

    const usersPromise = supa
      .from('profiles')
      .select('*')
      .order('id', { ascending: false });

    const followersPromise = supa
      .from('followers')
      .select('*');

    const messagesPromise = currentUser
      ? supa
          .from(CHAT_TABLE)
          .select('*')
          .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [], error: null });

    const [
      { data: users, error: errorUsers },
      { data: followers, error: errorFollowers },
      { data: messages, error: errorMessages }
    ] = await Promise.all([usersPromise, followersPromise, messagesPromise]);

    if (errorUsers) throw errorUsers;

    if (errorFollowers) {
      console.warn("A tabela 'followers' não foi encontrada. O SQL foi executado?", errorFollowers);
    }

    if (errorMessages) {
      if (isMissingRelationError(errorMessages)) {
        chatTableAvailable = false;
        console.warn(CHAT_SETUP_HINT);
      } else {
        console.warn('Não foi possível carregar o chat:', errorMessages.message || errorMessages);
      }
    } else {
      chatTableAvailable = true;
    }

    allUsers = users || [];
    allFollowersData = followers || [];
    directMessages = messages || [];

    const onlineCount = getOnlineCount();
    document.getElementById('totalMembers').textContent = allUsers.length;
    document.getElementById('onlineNow').textContent = onlineCount;

    if (window.updateMyFollowers) window.updateMyFollowers();
  }

  function applyFilters() {
    const searchTerm = String(searchInput?.value || '').toLowerCase();
    const sortBy = sortSelect?.value || 'recent';

    let filteredUsers = allUsers.filter((user) => {
      const name = (user.full_name || user.username || 'Usuario').toLowerCase();
      return name.includes(searchTerm);
    });

    switch (sortBy) {
      case 'recent':
        break;
      case 'level-desc':
        filteredUsers.sort((a, b) => getUserCommunityProgress(b).level - getUserCommunityProgress(a).level);
        break;
      case 'xp-desc':
        filteredUsers.sort((a, b) => getUserCommunityProgress(b).totalXp - getUserCommunityProgress(a).totalXp);
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
      alert('Você precisa estar logado para seguir alguém!');
      window.location.href = 'login.html';
      return;
    }

    if (targetId === currentUser.id) {
      alert('Você não pode seguir a si mesmo!');
      return;
    }

    try {
      const supa = window.supabaseClient;
      const isCurrentlyFollowing = allFollowersData.some((item) => item.follower_id === currentUser.id && item.following_id === targetId);

      if (isCurrentlyFollowing) {
        const { error } = await supa
          .from('followers')
          .delete()
          .match({ follower_id: currentUser.id, following_id: targetId });
        if (error) throw error;
        allFollowersData = allFollowersData.filter((item) => !(item.follower_id === currentUser.id && item.following_id === targetId));
      } else {
        const { error } = await supa
          .from('followers')
          .insert({ follower_id: currentUser.id, following_id: targetId });
        if (error) throw error;
        allFollowersData.push({ follower_id: currentUser.id, following_id: targetId, created_at: new Date().toISOString() });
      }

      updateFollowUI(targetId, !isCurrentlyFollowing);
      if (window.updateMyFollowers && socialSidebar?.classList.contains('active')) window.updateMyFollowers();
    } catch (error) {
      console.error('Erro ao seguir/deixar de seguir:', error);
      alert('Ocorreu um erro ao atualizar os seguidores.');
    }
  };

  function updateFollowUI(targetId, isNowFollowing) {
    const gridButtons = document.querySelectorAll(`.btn-follow[onclick*="toggleFollow('${targetId}')"]`);
    gridButtons.forEach((btn) => {
      btn.classList.toggle('following', isNowFollowing);
      btn.innerHTML = isNowFollowing
        ? '<span><i class="fas fa-check"></i> Seguindo</span>'
        : '<i class="fas fa-user-plus"></i> Seguir';
    });

    if (profileModal.classList.contains('active')) {
      const modalActions = document.getElementById('modalActions');
      const modalBtn = modalActions.querySelector('.btn-follow');
      if (modalBtn && modalBtn.getAttribute('onclick')?.includes(targetId)) {
        modalBtn.classList.toggle('following', isNowFollowing);
        modalBtn.innerHTML = isNowFollowing
          ? '<span><i class="fas fa-check"></i> Seguindo</span>'
          : '<i class="fas fa-user-plus"></i> Seguir';
      }

      const followersCount = allFollowersData.filter((item) => item.following_id === targetId).length;
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
    const followersCountMap = buildFollowersCountMap();
    const followingSet = buildFollowingSet();

    if (users.length === 0) {
      usersGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 50px;">Nenhum maratonista encontrado.</p>';
      return;
    }

    usersGrid.innerHTML = '';

    users.forEach((user, index) => {
      const storeData = user.store_data || {};
      const progress = getUserCommunityProgress(user);
      const level = progress.level;
      const xp = progress.totalXp;
      const avatar = getUserAvatar(user);
      const name = getUserDisplayName(user);
      const isVip = progress.isVip;
      const statusText = isUserOnline(user) ? 'Online' : 'Offline';
      const statusClass = isUserOnline(user) ? 'online' : 'offline';
      const equipped = storeData.equipped || {};
      const aura = equipped.aura || 'none';
      const banner = equipped.banner || 'none';
      // Mapear acessórios: perfil usa crownId, usuários usava acessorio
      const accessoryId = equipped.acessorio || equipped.crownId || 'none';
      
      // Coletar ícones dos itens equipados (Aura, Banner, Coroa, Título)
      const equippedIcons = [];
      if (aura !== 'none') {
        const item = ALL_ITEMS.find(i => i.id === aura);
        if (item) equippedIcons.push({ icon: item.icon, name: item.name });
      }
      if (banner !== 'none') {
        const item = ALL_ITEMS.find(i => i.id === banner);
        if (item) equippedIcons.push({ icon: item.icon, name: item.name });
      }
      if (accessoryId !== 'none') {
        const item = ALL_ITEMS.find(i => i.id === accessoryId);
        if (item) equippedIcons.push({ icon: item.icon, name: item.name });
      }
      if (equipped.titulo) {
        const item = ALL_ITEMS.find(i => i.name.includes(equipped.titulo));
        if (item) equippedIcons.push({ icon: item.icon, name: item.name });
      }

      const followersCount = followersCountMap.get(user.id) || 0;
      const isFollowing = currentUser ? followingSet.has(user.id) : false;
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
        : 'background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(0,0,0,0.4));';

      userCard.innerHTML = `
        ${isVip ? '<div class="vip-badge"><i class="fas fa-crown"></i> VIP</div>' : ''}
        <div class="user-banner" style="${bannerStyle}" onclick="openProfileModal('${user.id}')"></div>

        <div class="user-avatar-wrapper" onclick="openProfileModal('${user.id}')">
          <img src="${avatar}" alt="${escapeHtml(name)}" class="user-avatar" onerror="this.src='assets/tryhard.png'">
          ${accessoryId !== 'none' && !accessoryId.includes('coroa') ? `<img src="${accessoryId}" class="user-accessory" alt="Acessório">` : ''}
          <div class="status-dot-indicator ${statusClass}" title="${statusText}"></div>
        </div>

        <div class="user-info-section">
          <span class="user-name" onclick="openProfileModal('${user.id}')" style="cursor:pointer;">${escapeHtml(name)} ${isMe ? '<small>(Você)</small>' : ''}</span>
          <div class="user-level-row">
            <div class="user-level">LVL ${level}</div>
            ${equippedIcons.length > 0 ? `
              <div class="user-equipped-icons">
                ${equippedIcons.map(item => `<span data-tooltip="${item.name}">${item.icon}</span>`).join('')}
              </div>
            ` : ''}
          </div>

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
});
