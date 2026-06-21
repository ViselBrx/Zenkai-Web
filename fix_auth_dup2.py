import sys

file_path = 'js-src/auth.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = """function getFilteredNotificationState(filter = notificationState.activeFilter) {
  if (filter === 'chat') {
    return notificationState.notifications.filter((item) => item.type === 'chat');
  }
  if (filter === 'site') {
    return notificationState.notifications.filter((item) => item.type !== 'chat');
  }
  return notificationState.notifications.slice();
}

function syncNotificationBadgeFromState() {
  const unreadCount = notificationState.notifications.filter((item) => !item.read).length;
  updateNotificationBadge(unreadCount);
}

function renderNotificationListFromState() {
  const content = document.getElementById('notifCenterContent');
  if (!content) return;

  const notifications = getFilteredNotificationState();
  if (!notifications.length) {
    content.innerHTML = `
      <div class="notif-empty-state">
        <div class="notif-empty-icon"><i class="fa-solid fa-envelope-open-text" style="font-size: 2.5rem; color: var(--primary);"></i></div>
        <p>${notificationState.activeFilter === 'chat' ? 'Nenhuma mensagem recente.' : 'Você não tem notificações.'}</p>
      </div>
    `;
    syncNotificationSelectionState();
    return;
  }

  const notifHtml = notifications.map((n) => {
    const isUnread = !n.read;
    return `
      <div class="notification-item ${isUnread ? 'unread' : 'read'}" data-id="${n.id}" onclick="handleNotificationClick('${n.id}', '${n.link || ''}')">
        <input type="checkbox" class="notification-item__checkbox" onclick="event.stopPropagation()">
        <div class="notification-item__icon">${getNotifIcon(n.type)}</div>
        <div class="notification-item__main">
          <div class="notification-item__title">${n.title}</div>
          <div class="notification-item__text">${n.message}</div>
          <div class="notification-item__time">${formatNotifTime(n.created_at)}</div>
        </div>
        ${isUnread ? '<div class="notification-item__dot"></div>' : ''}
        <button class="notification-item__delete" title="Excluir" onclick="event.stopPropagation(); deleteNotifications(['${n.id}'])"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  }).join('');

  content.innerHTML = notifHtml;
  content.querySelectorAll('.notification-item__checkbox').forEach((checkbox) => {
    checkbox.onchange = () => syncNotificationSelectionState();
  });
  syncNotificationSelectionState();
}"""

idx = content.rfind("function getFilteredNotificationState(filter = notificationState.activeFilter) {")
if idx != -1:
    end_idx = content.find("async function handleBatchActionLegacy", idx)
    if end_idx != -1:
        content = content[:idx] + content[end_idx:]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Duplicates removed.")
    else:
        print("End marker not found")
else:
    print("Start marker not found")
