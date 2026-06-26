const CONV_PREFIX = 'gx_conv_';
const MAX_MESSAGES = 50;

function saveMessages(roleId, messages) {
  // Trim to max
  const trimmed = messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;
  localStorage.setItem(CONV_PREFIX + roleId, JSON.stringify(trimmed));
}

function loadMessages(roleId) {
  const data = localStorage.getItem(CONV_PREFIX + roleId);
  return data ? JSON.parse(data) : [];
}

function clearMessages(roleId) {
  if (roleId) {
    localStorage.removeItem(CONV_PREFIX + roleId);
  } else {
    // Clear all
    Object.keys(localStorage)
      .filter(k => k.startsWith(CONV_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
}

function getAllConversations() {
  return Object.keys(localStorage)
    .filter(k => k.startsWith(CONV_PREFIX))
    .map(k => {
      const messages = JSON.parse(localStorage.getItem(k) || '[]');
      return {
        roleId: k.replace(CONV_PREFIX, ''),
        messageCount: messages.length,
        lastMessage: messages.length > 0 ? messages[messages.length - 1].content?.slice(0, 50) : ''
      };
    });
}

window.ConversationStore = { saveMessages, loadMessages, clearMessages, getAllConversations };
