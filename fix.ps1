# 1. Add notification logic to auth.js
$authPath = "c:\Users\enzot\Desktop\Anime-House-Web\js-src\auth.js"
$authContent = [System.IO.File]::ReadAllText($authPath, [System.Text.Encoding]::UTF8)

$notifCode = @"
// ===== NOTIFICATION CENTER UI HELPERS =====

function updateNotificationBadge(count) {
  const badge = document.getElementById('navbarBellBadge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

async function fetchNotificationCount() {
  if (!supaClient || !notificationState.userId) return;
  try {
    const { count } = await supaClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', notificationState.userId)
      .eq('read', false);
    updateNotificationBadge(count || 0);
  } catch (e) {
    console.warn('[NotificationHub] Erro ao buscar contagem:', e);
  }
}

function createNotificationCenterUI() {
  const existingCenter = document.getElementById('notificationCenter');
  const existingOverlay = document.getElementById('notificationOverlay');
  if (existingCenter) existingCenter.remove();
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'notificationOverlay';
  overlay.className = 'notification-center-overlay';
  overlay.onclick = () => toggleNotificationCenter();

  const center = document.createElement('div');
  center.id = 'notificationCenter';
  center.className = 'notification-center';

  const adminPanelHtml = notificationState.isAdmin ? `
    <details class="notification-admin-panel" style="margin-bottom:1rem;">
      <summary style="cursor:pointer; font-weight:700; color:var(--primary); padding:8px 0;">
        <i class="fa-solid fa-shield-halved"></i> Painel Admin - Enviar Notificação
      </summary>
      <div style="margin-top:0.75rem; display:flex; flex-direction:column; gap:0.5rem;">
        <input id="adminNotifUserId" type="text" placeholder="User ID do destinatário (deixe vazio para todos)" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:8px 12px; color:var(--text-main); font-size:0.85rem;"/>
        <input id="adminNotifTitle" type="text" placeholder="Título da notificação" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:8px 12px; color:var(--text-main); font-size:0.85rem;"/>
        <textarea id="adminNotifMessage" rows="2" placeholder="Mensagem..." style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:8px 12px; color:var(--text-main); font-size:0.85rem; resize:vertical;"></textarea>
        <input id="adminNotifLink" type="text" placeholder="Link (opcional)" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:8px 12px; color:var(--text-main); font-size:0.85rem;"/>
        <button onclick="sendAdminNotification()" style="background:var(--primary); color:#fff; border:none; border-radius:8px; padding:8px 16px; cursor:pointer; font-weight:700;">
          <i class="fa-solid fa-paper-plane"></i> Enviar
        </button>
      </div>
    </details>
  ` : '';

  center.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
      <h3 style="font-family:'Bangers'; font-size:1.4rem; color:var(--primary); letter-spacing:1px; margin:0;">
        <i class="fa-solid fa-bell"></i> Notificações
      </h3>
      <button class="notification-center__close" onclick="toggleNotificationCenter()" title="Fechar">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    ${adminPanelHtml}
    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem; flex-wrap:wrap;">
      <div style="display:flex; gap:0.5rem;">
        <button class="notif-tab active" data-tab="all" onclick="switchNotifTab('all', this)">Todas</button>
        <button class="notif-tab" data-tab="site" onclick="switchNotifTab('site', this)">Site</button>
        <button class="notif-tab" data-tab="chat" onclick="switchNotifTab('chat', this)">Chat</button>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem; margin-left:auto;">
        <input type="checkbox" id="selectAllNotifs" title="Selecionar todas" style="cursor:pointer;">
        <span style="font-size:0.8rem; color:var(--text-muted);">Selecionar todas</span>
      </div>
    </div>
    <div id="notifCenterContent" class="notification-center__content">
      <div style="text-align:center; padding:20px;"><span class="loader-ring"></span> Carregando...</div>
    </div>
    <div class="notification-center__footer" style="display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:space-between; align-items:center;">
      <div style="display:flex; gap:0.5rem;">
        <button id="markSelectedReadBtn" class="btn-notif-action" onclick="handleBatchAction('read')" disabled>
          <i class="fa-solid fa-check-double"></i> Marcar lidas
        </button>
        <button id="deleteSelectedBtn" class="btn-notif-action danger" onclick="handleBatchAction('delete')" disabled>
          <i class="fa-solid fa-trash"></i> Excluir
        </button>
      </div>
      <button class="btn-notif-action" onclick="markAllAsRead()">
        <i class="fa-solid fa-envelope-open"></i> Marcar todas como lidas
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(center);

  const selectAll = document.getElementById('selectAllNotifs');
  if (selectAll) {
    selectAll.onchange = () => {
      const content = document.getElementById('notifCenterContent');
      const checkboxes = content?.querySelectorAll('.notification-item__checkbox') || [];
      checkboxes.forEach(cb => { cb.checked = selectAll.checked; });
      syncNotificationSelectionState();
    };
  }
}

function attachNotificationListeners() {
  const bell = document.getElementById('navbarBellTrigger');
  if (bell && !bell._notifListenerAttached) {
    bell.onclick = (e) => {
      e.stopPropagation();
      toggleNotificationCenter();
    };
    bell._notifListenerAttached = true;
  }
  const selectAll = document.getElementById('selectAllNotifs');
  if (selectAll) {
    selectAll.onchange = () => {
      const content = document.getElementById('notifCenterContent');
      const checkboxes = content?.querySelectorAll('.notification-item__checkbox') || [];
      checkboxes.forEach(cb => { cb.checked = selectAll.checked; });
      syncNotificationSelectionState();
    };
  }
}

window.switchNotifTab = function(tab, btnEl) {
  document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  notificationState.activeFilter = tab;
  notificationState.notifications = [];
  loadNotificationsList(tab);
};

window.sendAdminNotification = async function() {
  if (!supaClient) return;
  const userId = document.getElementById('adminNotifUserId')?.value.trim();
  const title = document.getElementById('adminNotifTitle')?.value.trim();
  const message = document.getElementById('adminNotifMessage')?.value.trim();
  const link = document.getElementById('adminNotifLink')?.value.trim();
  if (!title || !message) {
    if (window.showToast) showToast('Preencha título e mensagem.', 'error');
    return;
  }
  const payload = { title, message, link: link || null, type: 'site', read: false };
  if (userId) payload.user_id = userId;
  const { error } = await supaClient.from('notifications').insert([payload]);
  if (error) {
    if (window.showToast) showToast('Erro ao enviar notificação.', 'error');
  } else {
    if (window.showToast) showToast('Notificação enviada!', 'success');
    document.getElementById('adminNotifTitle').value = '';
    document.getElementById('adminNotifMessage').value = '';
    document.getElementById('adminNotifLink').value = '';
    document.getElementById('adminNotifUserId').value = '';
  }
};

// Notification hub overrides
async function initializeNotificationHub(userId) {
"@

$authContent = $authContent.Replace("// Notification hub overrides`nasync function initializeNotificationHub(userId) {", $notifCode)
$authContent = $authContent.Replace("// Notification hub overrides`r`nasync function initializeNotificationHub(userId) {", $notifCode)
[System.IO.File]::WriteAllText($authPath, $authContent, [System.Text.Encoding]::UTF8)
Write-Host "Updated auth.js"


# 2. Add youtube_video to perfil.html
$perfilPath = "c:\Users\enzot\Desktop\Anime-House-Web\perfil.html"
$perfilContent = [System.IO.File]::ReadAllText($perfilPath, [System.Text.Encoding]::UTF8)

$oldStr = "ai_compare: `"IA - Compara" + [char]0xE7 + [char]0xE3 + "o`"," + "`r`n`r`n          };"
$newStr = "ai_compare: `"IA - Compara" + [char]0xE7 + [char]0xE3 + "o`"," + "`r`n`r`n            youtube_video: `"V" + [char]0xED + "deo do YouTube`"," + "`r`n`r`n            manga_chapter: `"Mang" + [char]0xE1 + " - Cap" + [char]0xED + "tulo`"," + "`r`n`r`n            hq_chapter: `"HQ - Cap" + [char]0xED + "tulo`"," + "`r`n`r`n          };"

$oldStr2 = "ai_compare: `"IA - Compara" + [char]0xE7 + [char]0xE3 + "o`"," + "`r`r`n          };"
$newStr2 = "ai_compare: `"IA - Compara" + [char]0xE7 + [char]0xE3 + "o`"," + "`r`r`n`r`r`n            youtube_video: `"V" + [char]0xED + "deo do YouTube`"," + "`r`r`n`r`r`n            manga_chapter: `"Mang" + [char]0xE1 + " - Cap" + [char]0xED + "tulo`"," + "`r`r`n`r`r`n            hq_chapter: `"HQ - Cap" + [char]0xED + "tulo`"," + "`r`r`n          };"

if ($perfilContent.Contains($oldStr)) { $perfilContent = $perfilContent.Replace($oldStr, $newStr) }
if ($perfilContent.Contains($oldStr2)) { $perfilContent = $perfilContent.Replace($oldStr2, $newStr2) }
[System.IO.File]::WriteAllText($perfilPath, $perfilContent, [System.Text.Encoding]::UTF8)
Write-Host "Updated youtube label in perfil.html"


# 3. Update toggle logic in compras.html
$comprasPath = "c:\Users\enzot\Desktop\Anime-House-Web\compras.html"
$comprasContent = [System.IO.File]::ReadAllText($comprasPath, [System.Text.Encoding]::UTF8)

$oldUnequip = '} else if (type === "tema" || type === "cursor") {
                        if (id === "tema_cromatico") {
                            if (window.setTheme) window.setTheme("theme-ciano");
                        }
                        store.equipped[id] = false;
                        localStorage.removeItem(userKey("animehouse_" + id));
                    }'
$newUnequip = '} else if (type === "tema") {
                        if (window.setTheme) window.setTheme("theme-ciano");
                        store.equipped[id] = false;
                        localStorage.removeItem(userKey("animehouse_" + id));
                    } else if (type === "cursor") {
                        store.equipped[id] = false;
                        localStorage.removeItem(userKey("animehouse_" + id));
                    }'
$oldEquip = '} else if (type === "tema" || type === "cursor") {
                        if (id === "tema_cromatico") {
                            if (window.setTheme) window.setTheme("theme-cromatico");
                        }
                        store.equipped[id] = true;
                        localStorage.setItem(userKey("animehouse_" + id), "true");
                    }'
$newEquip = '} else if (type === "tema") {
                        ["tema_cromatico", "tema_natal"].forEach(t => {
                            store.equipped[t] = false;
                            localStorage.removeItem(userKey("animehouse_" + t));
                        });
                        const themeAlias = id === "tema_cromatico" ? "theme-cromatico" : 
                                          id === "tema_natal" ? "theme-natal" : "theme-ciano";
                        if (window.setTheme) window.setTheme(themeAlias);
                        store.equipped[id] = true;
                        localStorage.setItem(userKey("animehouse_" + id), "true");
                    } else if (type === "cursor") {
                        ["cursor_camaleao", "cursor_gelo", "cursor_rgb"].forEach(c => {
                            store.equipped[c] = false;
                            localStorage.removeItem(userKey("animehouse_" + c));
                        });
                        store.equipped[id] = true;
                        localStorage.setItem(userKey("animehouse_" + id), "true");
                    }'

$comprasContent = $comprasContent.Replace($oldUnequip, $newUnequip).Replace($oldEquip, $newEquip)
[System.IO.File]::WriteAllText($comprasPath, $comprasContent, [System.Text.Encoding]::UTF8)
Write-Host "Updated toggle logic in compras.html"


# 4. Replace Santa emoji with image in all 4 files
$filesToReplaceEmoji = @(
    "c:\Users\enzot\Desktop\Anime-House-Web\perfil.html",
    "c:\Users\enzot\Desktop\Anime-House-Web\compras.html",
    "c:\Users\enzot\Desktop\Anime-House-Web\loja.html",
    "c:\Users\enzot\Desktop\Anime-House-Web\js-src\db.js"
)
$emojiStr = 'icon: "' + [char]0xD83C + [char]0xDF85 + '"'
$imgStr = 'icon: "<img src=''assets/gorrodenatal.png'' style=''width: 1em; height: 1em; object-fit: contain; vertical-align: text-bottom;''>"'

foreach ($f in $filesToReplaceEmoji) {
    $c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
    if ($c.Contains($emojiStr)) {
        $c = $c.Replace($emojiStr, $imgStr)
        [System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
        Write-Host "Replaced emoji in $f"
    }
}