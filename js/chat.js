// ===== CHAT DM =====
// Nécessite : supabaseClient (supabase-config.js), currentUser, window.supabase.

let chatActiveConversation = null; // { userId, username, avatar, avatar_url }
let chatMessagesCache = {};        // { otherUserId: [messages] }
let chatConversations = [];        // liste triée par dernier message
let chatRealtimeChannel = null;
let chatMyProfile = null;
let chatSearchTimer = null;
let chatMode = 'private';          // 'private' | 'public'
let chatPublicMessages = [];       // liste des messages publics (ordre chrono)
let chatPublicProfiles = {};       // { user_id: profile } — cache pour le salon public
let chatPublicRealtime = null;
let chatBlockedIds = new Set();    // utilisateurs que j'ai bloqués
let chatTypingChannel = null;      // presence channel pour la conv active
let chatTypingTimer = null;        // debounce côté émetteur
let chatPeerTyping = false;        // l'autre personne est en train d'écrire
let chatNotifPref = localStorage.getItem('chatNotif') || 'ask'; // 'on' | 'off' | 'ask'

// Réactions : { messageId: { emoji: Set<userId> } } — privé et public séparés
let chatReactions = {};
let chatPublicReactions = {};
let chatReactionsRealtime = null;
let chatPublicReactionsRealtime = null;


// Emojis pour réactions rapides (limité)
const QUICK_REACTIONS = ['👍','❤️','😂','😮','😢','🔥'];

// Fichier image en attente d'envoi : { private: File|null, public: File|null }
const pendingChatImage = { private: null, public: null };
const MAX_CHAT_IMAGE_BYTES = 20 * 1024 * 1024; // 20 Mo


function getChatText(key) {
  const lang = localStorage.getItem('lang') || 'fr';
  const dict = {
    fr: {
      messages: 'Messages', newConversation: 'Nouvelle conversation',
      searchUser: 'Chercher un pseudo...', noConversations: 'Aucune conversation',
      selectConversation: 'Sélectionne une conversation', typeMessage: 'Écris un message...',
      send: 'Envoyer', noResults: 'Aucun utilisateur trouvé',
      messageEmpty: 'Le message est vide', messageTooLong: 'Message trop long (max 2000)',
      yesterday: 'hier', now: 'maintenant',
      report: 'Signaler', reportTitle: 'Signaler ce message',
      reportPrompt: 'Pourquoi signales-tu ce message ? (optionnel)',
      reportSent: 'Message signalé, merci', reportAlready: 'Déjà signalé',
      reportError: 'Erreur lors du signalement',
      publicWelcome: 'Salon public', publicEmpty: 'Aucun message. Soyez le premier à écrire !',
      publicIntro: 'Salon ouvert à tous les membres connectés. Reste respectueux.',
      block: 'Bloquer', blockConfirm: 'Bloquer cet utilisateur ? Tu ne verras plus ses messages.',
      blocked: 'Utilisateur bloqué', unblock: 'Débloquer',
      blockedUsers: 'Utilisateurs bloqués', noBlocked: 'Aucun utilisateur bloqué',
      deleteMsg: 'Supprimer', deleteConfirm: 'Supprimer ce message ?',
      notifEnable: 'Activer les notifications', notifDenied: 'Notifications refusées',
      notifOn: 'Notifications activées', notifOff: 'Notifications désactivées',
      typing: 'est en train d\'écrire…',
      newMessageFrom: 'Nouveau message de'
    },
    en: {
      messages: 'Messages', newConversation: 'New conversation',
      searchUser: 'Search a username...', noConversations: 'No conversations',
      selectConversation: 'Select a conversation', typeMessage: 'Type a message...',
      send: 'Send', noResults: 'No user found',
      messageEmpty: 'Message is empty', messageTooLong: 'Message too long (max 2000)',
      yesterday: 'yesterday', now: 'now',
      report: 'Report', reportTitle: 'Report this message',
      reportPrompt: 'Why are you reporting this message? (optional)',
      reportSent: 'Message reported, thank you', reportAlready: 'Already reported',
      reportError: 'Report failed',
      publicWelcome: 'Public room', publicEmpty: 'No messages yet. Be the first to write!',
      publicIntro: 'Open to all signed-in members. Please stay respectful.',
      block: 'Block', blockConfirm: 'Block this user? You will no longer see their messages.',
      blocked: 'User blocked', unblock: 'Unblock',
      blockedUsers: 'Blocked users', noBlocked: 'No blocked users',
      deleteMsg: 'Delete', deleteConfirm: 'Delete this message?',
      notifEnable: 'Enable notifications', notifDenied: 'Notifications denied',
      notifOn: 'Notifications enabled', notifOff: 'Notifications disabled',
      typing: 'is typing…',
      newMessageFrom: 'New message from'
    }
  };
  return dict[lang]?.[key] || dict.fr[key] || key;
}

// ----- Helpers -----

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return getChatText('now');
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return getChatText('yesterday');
  return d.toLocaleDateString();
}

function avatarSrc(profile) {
  if (!profile) return 'images/avatars/avatar1.svg';
  if (profile.avatar === 'custom' && profile.avatar_url) return profile.avatar_url;
  return `images/avatars/avatar${profile.avatar || 1}.svg`;
}

// ----- Réactions : helpers -----

function reactionsStore(scope) {
  return scope === 'public' ? chatPublicReactions : chatReactions;
}

function reactionsTable(scope) {
  return scope === 'public' ? 'public_message_reactions' : 'message_reactions';
}

async function loadReactionsForMessages(messageIds, scope) {
  if (!messageIds || !messageIds.length) return;
  const { data, error } = await supabaseClient
    .from(reactionsTable(scope))
    .select('message_id, user_id, emoji')
    .in('message_id', messageIds);
  if (error) { console.error('Load reactions:', error); return; }
  const store = reactionsStore(scope);
  for (const id of messageIds) {
    if (!store[id]) store[id] = {};
  }
  for (const r of data || []) {
    if (!store[r.message_id]) store[r.message_id] = {};
    if (!store[r.message_id][r.emoji]) store[r.message_id][r.emoji] = new Set();
    store[r.message_id][r.emoji].add(r.user_id);
  }
}

function applyReactionDelta(scope, messageId, emoji, userId, isAdd) {
  const store = reactionsStore(scope);
  if (!store[messageId]) store[messageId] = {};
  if (!store[messageId][emoji]) store[messageId][emoji] = new Set();
  if (isAdd) store[messageId][emoji].add(userId);
  else {
    store[messageId][emoji].delete(userId);
    if (store[messageId][emoji].size === 0) delete store[messageId][emoji];
  }
}

function renderReactions(messageId, scope) {
  const store = reactionsStore(scope);
  const byEmoji = store[messageId];
  if (!byEmoji) return '';
  const me = currentUser?.id;
  const entries = Object.entries(byEmoji).filter(([, set]) => set.size > 0);
  if (!entries.length) return '';
  return `<div class="reaction-row">${entries.map(([emoji, set]) => {
    const mine = me && set.has(me);
    return `<button class="reaction-chip${mine ? ' mine' : ''}" onclick="toggleReaction('${messageId}','${emoji}','${scope}')">${emoji} <span>${set.size}</span></button>`;
  }).join('')}<button class="reaction-add-btn" onclick="event.stopPropagation(); showReactionPicker('${messageId}','${scope}',this)" aria-label="Réagir">+</button></div>`;
}

function showReactionPicker(messageId, scope, btn) {
  const bubble = btn.closest('.chat-bubble');
  if (!bubble) return;
  showQuickReactionBar(
    bubble,
    QUICK_REACTIONS,
    (emoji) => toggleReaction(messageId, emoji, scope),
    () => openFloatingFullPicker(bubble, `react-${scope}-${messageId}`, (emoji) => toggleReaction(messageId, emoji, scope))
  );
}

async function toggleReaction(messageId, emoji, scope) {
  if (!currentUser) { ouvrirAuthModal && ouvrirAuthModal(); return; }
  const store = reactionsStore(scope);
  const has = store[messageId]?.[emoji]?.has(currentUser.id);
  if (has) {
    applyReactionDelta(scope, messageId, emoji, currentUser.id, false);
    rerenderBubble(messageId, scope);
    const { error } = await supabaseClient
      .from(reactionsTable(scope))
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', currentUser.id)
      .eq('emoji', emoji);
    if (error) {
      console.error('Remove reaction:', error);
      applyReactionDelta(scope, messageId, emoji, currentUser.id, true); // rollback
      rerenderBubble(messageId, scope);
    }
  } else {
    applyReactionDelta(scope, messageId, emoji, currentUser.id, true);
    rerenderBubble(messageId, scope);
    const { error } = await supabaseClient
      .from(reactionsTable(scope))
      .insert({ message_id: messageId, user_id: currentUser.id, emoji });
    if (error && error.code !== '23505') {
      console.error('Add reaction:', error);
      applyReactionDelta(scope, messageId, emoji, currentUser.id, false); // rollback
      rerenderBubble(messageId, scope);
    }
  }
}

function rerenderBubble(messageId, scope) {
  const container = scope === 'public'
    ? document.getElementById('chatPublicMessagesList')
    : document.getElementById('chatMessages');
  if (!container) return;
  const bubble = container.querySelector(`[data-msg-id="${messageId}"]`);
  if (!bubble) return;
  const oldRow = bubble.querySelector('.reaction-row');
  if (oldRow) oldRow.remove();
  bubble.insertAdjacentHTML('beforeend', renderReactions(messageId, scope));
}

function subscribeReactions(scope) {
  if (!currentUser || !supabaseClient) return;
  const isPublic = scope === 'public';
  const existing = isPublic ? chatPublicReactionsRealtime : chatReactionsRealtime;
  if (existing) return;
  const channel = supabaseClient
    .channel((isPublic ? 'public_reactions:' : 'reactions:') + currentUser.id)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: reactionsTable(scope) }, (payload) => {
      const r = payload.new;
      if (!r) return;
      applyReactionDelta(scope, r.message_id, r.emoji, r.user_id, true);
      rerenderBubble(r.message_id, scope);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: reactionsTable(scope) }, (payload) => {
      const r = payload.old;
      if (!r) return;
      applyReactionDelta(scope, r.message_id, r.emoji, r.user_id, false);
      rerenderBubble(r.message_id, scope);
    })
    .subscribe();
  if (isPublic) chatPublicReactionsRealtime = channel;
  else chatReactionsRealtime = channel;
}

function unsubscribeReactions(scope) {
  const isPublic = scope === 'public';
  const channel = isPublic ? chatPublicReactionsRealtime : chatReactionsRealtime;
  if (!channel) return;
  supabaseClient.removeChannel(channel);
  if (isPublic) chatPublicReactionsRealtime = null;
  else chatReactionsRealtime = null;
}

// ----- Modal open/close -----

function showChatMain() {
  const layout = document.querySelector('.chat-layout');
  if (layout) layout.classList.add('show-chat');
}

function hideChatMain() {
  const layout = document.querySelector('.chat-layout');
  if (layout) layout.classList.remove('show-chat');
}

async function ouvrirChatModal() {
  if (!currentUser) { ouvrirAuthModal(); return; }
  const modal = document.getElementById('chatModal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  hideChatMain();
  await chargerProfilMoi();
  await chargerBloques();
  renderBlockedCount();
  if (chatMode === 'private') {
    await chargerConversations();
    subscribeToMessages();
  } else {
    await chargerPublicMessages();
    subscribeToPublicMessages();
  }
}

function fermerChatModal(event) {
  if (event && event.target !== event.currentTarget) return;
  fermerChatModalBtn();
}

function fermerChatModalBtn() {
  const modal = document.getElementById('chatModal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  hideChatMain();
  unsubscribeFromMessages();
  unsubscribeFromPublic();
  unsubscribeTyping();
  unsubscribeReactions('private');
  unsubscribeReactions('public');
}

async function switchChatMode(mode) {
  if (mode === chatMode) return;
  chatMode = mode;
  // Tabs UI
  document.querySelectorAll('.chat-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.chatMode === mode);
  });
  const privSidebar = document.querySelector('.chat-sidebar-private');
  const pubSidebar = document.querySelector('.chat-sidebar-public');
  const privView = document.getElementById('chatView');
  const pubView = document.getElementById('chatPublicView');
  if (!privSidebar || !pubSidebar || !privView || !pubView) return;
  if (mode === 'private') {
    privSidebar.style.display = '';
    pubSidebar.style.display = 'none';
    privView.style.display = '';
    pubView.style.display = 'none';
    unsubscribeFromPublic();
    await chargerConversations();
    subscribeToMessages();
  } else {
    privSidebar.style.display = 'none';
    pubSidebar.style.display = '';
    privView.style.display = 'none';
    pubView.style.display = '';
    unsubscribeFromMessages();
    unsubscribeTyping();
    await chargerPublicMessages();
    subscribeToPublicMessages();
    showChatMain();
  }
}

// ----- Profil courant (assure qu'on a un profil existant) -----

async function chargerProfilMoi() {
  if (!currentUser) return;
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('user_id, username, avatar, avatar_url')
    .eq('user_id', currentUser.id)
    .maybeSingle();
  if (error) { console.error('Load my profile:', error); return; }
  if (data) { chatMyProfile = data; return; }
  // Fallback : crée le profil si le trigger n'a pas fonctionné (ex: user existant avant migration)
  const meta = currentUser.user_metadata || {};
  const base = meta.username || (currentUser.email || '').split('@')[0] || 'user';
  const proposed = base + '_' + currentUser.id.slice(0, 4);
  const { data: inserted } = await supabaseClient
    .from('profiles')
    .insert({
      user_id: currentUser.id,
      username: proposed,
      avatar: meta.avatar || '1',
      avatar_url: meta.avatar_url || null
    })
    .select()
    .maybeSingle();
  chatMyProfile = inserted || null;
}

// ----- Liste des conversations -----

async function chargerConversations() {
  const container = document.getElementById('chatConversationsList');
  if (!container || !currentUser) return;
  container.innerHTML = '<div class="chat-loading">...</div>';

  // Récupère tous les messages où je suis sender ou recipient, limités aux 200 derniers
  const { data: msgs, error } = await supabaseClient
    .from('messages')
    .select('id, sender_id, recipient_id, content, created_at, read_at, image_url')
    .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) { console.error('Load conversations:', error); container.innerHTML = ''; return; }

  // Groupe par autre participant
  const convMap = new Map();
  for (const m of msgs || []) {
    const otherId = m.sender_id === currentUser.id ? m.recipient_id : m.sender_id;
    if (!convMap.has(otherId)) {
      convMap.set(otherId, { otherId, lastMessage: m, unread: 0 });
    }
    if (m.recipient_id === currentUser.id && !m.read_at) {
      convMap.get(otherId).unread++;
    }
  }

  const otherIds = [...convMap.keys()];
  let profilesById = {};
  if (otherIds.length) {
    const { data: profs } = await supabaseClient
      .from('profiles')
      .select('user_id, username, avatar, avatar_url')
      .in('user_id', otherIds);
    (profs || []).forEach(p => { profilesById[p.user_id] = p; });
  }

  chatConversations = [...convMap.values()]
    .filter(c => !chatBlockedIds.has(c.otherId))
    .map(c => ({ ...c, profile: profilesById[c.otherId] || { user_id: c.otherId, username: '?' } }))
    .sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));

  renderConversations();
  updateChatBadge();
}

function renderConversations() {
  const container = document.getElementById('chatConversationsList');
  if (!container) return;
  if (!chatConversations.length) {
    container.innerHTML = `<div class="chat-empty">${getChatText('noConversations')}</div>`;
    return;
  }
  container.innerHTML = chatConversations.map(c => {
    const p = c.profile;
    const rawText = c.lastMessage.content || (c.lastMessage.image_url ? '📷 Photo' : '');
    const preview = c.lastMessage.sender_id === currentUser.id
      ? '→ ' + escapeHtml(rawText.slice(0, 60))
      : escapeHtml(rawText.slice(0, 60));
    const active = chatActiveConversation && chatActiveConversation.userId === c.otherId ? ' active' : '';
    const badge = c.unread > 0 ? `<span class="chat-unread-badge">${c.unread}</span>` : '';
    return `
      <div class="chat-conversation${active}" onclick="ouvrirConversation('${c.otherId}', ${JSON.stringify(p.username).replace(/"/g, '&quot;')})">
        <img src="${avatarSrc(p)}" alt="" class="chat-avatar">
        <div class="chat-conv-info">
          <div class="chat-conv-top">
            <span class="chat-conv-name">${escapeHtml(p.username)}</span>
            <span class="chat-conv-time">${formatTime(c.lastMessage.created_at)}</span>
          </div>
          <div class="chat-conv-preview">${preview}</div>
        </div>
        ${badge}
      </div>
    `;
  }).join('');
}

// ----- Recherche d'utilisateurs -----

function onChatSearchInput(event) {
  const q = event.target.value.trim();
  clearTimeout(chatSearchTimer);
  const results = document.getElementById('chatSearchResults');
  if (!results) return;
  if (q.length < 2) { results.innerHTML = ''; results.style.display = 'none'; return; }
  chatSearchTimer = setTimeout(() => chercherUtilisateurs(q), 250);
}

async function chercherUtilisateurs(q) {
  if (!currentUser) return;
  const results = document.getElementById('chatSearchResults');
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('user_id, username, avatar, avatar_url')
    .ilike('username', `%${q}%`)
    .neq('user_id', currentUser.id)
    .limit(10);
  if (error) { console.error('Search users:', error); return; }
  if (!data || !data.length) {
    results.innerHTML = `<div class="chat-empty">${getChatText('noResults')}</div>`;
  } else {
    results.innerHTML = data.map(p => `
      <div class="chat-search-result" onclick="ouvrirConversation('${p.user_id}', ${JSON.stringify(p.username).replace(/"/g, '&quot;')})">
        <img src="${avatarSrc(p)}" alt="" class="chat-avatar">
        <span>${escapeHtml(p.username)}</span>
      </div>
    `).join('');
  }
  results.style.display = 'block';
}

// ----- Ouvrir une conversation -----

async function ouvrirConversation(otherUserId, username) {
  const results = document.getElementById('chatSearchResults');
  const searchInput = document.getElementById('chatSearchInput');
  if (results) { results.style.display = 'none'; results.innerHTML = ''; }
  if (searchInput) searchInput.value = '';

  // Récupère profil si pas déjà en cache
  const convo = chatConversations.find(c => c.otherId === otherUserId);
  let profile = convo?.profile;
  if (!profile) {
    const { data } = await supabaseClient
      .from('profiles')
      .select('user_id, username, avatar, avatar_url')
      .eq('user_id', otherUserId)
      .maybeSingle();
    profile = data || { user_id: otherUserId, username: username || '?' };
  }

  chatActiveConversation = {
    userId: otherUserId,
    username: profile.username,
    avatar: profile.avatar,
    avatar_url: profile.avatar_url
  };
  renderConversations();
  await chargerMessages(otherUserId);
  renderChatView();
  showChatMain();
  await markConversationAsRead(otherUserId);
  subscribeTyping(otherUserId);
}

async function chargerMessages(otherUserId) {
  const { data, error } = await supabaseClient
    .from('messages')
    .select('id, sender_id, recipient_id, content, created_at, read_at, image_url')
    .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUser.id})`)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) { console.error('Load messages:', error); return; }
  chatMessagesCache[otherUserId] = data || [];
  await loadReactionsForMessages((data || []).map(m => m.id), 'private');
  subscribeReactions('private');
}

function renderChatView() {
  const view = document.getElementById('chatView');
  if (!view) return;
  if (!chatActiveConversation) {
    view.innerHTML = `<div class="chat-empty chat-view-empty">${getChatText('selectConversation')}</div>`;
    return;
  }
  const msgs = chatMessagesCache[chatActiveConversation.userId] || [];
  const avatar = avatarSrc(chatActiveConversation);
  view.innerHTML = `
    <div class="chat-view-header">
      <button class="chat-back-btn" onclick="hideChatMain()" aria-label="Retour">←</button>
      <img src="${avatar}" alt="" class="chat-avatar">
      <span class="chat-view-name">${escapeHtml(chatActiveConversation.username)}</span>
    </div>
    <div class="chat-messages" id="chatMessages">
      ${msgs.map(renderMessageBubble).join('')}
    </div>
    <div class="chat-typing" id="chatTypingIndicator" style="display:none;"></div>
    <form class="chat-input-form" data-scope="private" onsubmit="envoyerMessage(event)">
      <button type="button" class="emoji-toggle-btn" onclick="toggleEmojiPicker('chatInput', this)" aria-label="Emojis">😊</button>
      <button type="button" class="chat-gif-btn" onclick="toggleGifPicker('private', this)" aria-label="GIF">GIF</button>
      <button type="button" class="chat-attach-btn" onclick="pickChatImage('private')" aria-label="Joindre une photo">📎</button>
      <textarea id="chatInput" rows="1" placeholder="${escapeHtml(getChatText('typeMessage'))}" maxlength="2000"
        oninput="onChatInputType()"
        onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); document.getElementById('chatSendBtn').click(); }"></textarea>
      <button type="submit" id="chatSendBtn" class="chat-send-btn">${escapeHtml(getChatText('send'))}</button>
    </form>
  `;
  const container = document.getElementById('chatMessages');
  if (container) container.scrollTop = container.scrollHeight;
}

function renderMessageBubble(m) {
  const mine = m.sender_id === currentUser.id;
  const reactBtn = `<button class="chat-react-btn" title="Réagir" onclick="event.stopPropagation(); showReactionPicker('${m.id}','private',this)" aria-label="React">😊</button>`;
  const actions = !mine
    ? `${reactBtn}
       <button class="chat-report-btn" title="${escapeHtml(getChatText('report'))}" onclick="signalerMessage('${m.id}', '${m.sender_id}')" aria-label="${escapeHtml(getChatText('report'))}">🚩</button>
       <button class="chat-report-btn" title="${escapeHtml(getChatText('block'))}" onclick="bloquerUtilisateur('${m.sender_id}')" aria-label="${escapeHtml(getChatText('block'))}">🚫</button>`
    : reactBtn;
  const image = m.image_url
    ? `<img class="chat-bubble-image" src="${escapeHtml(m.image_url)}" alt="" loading="lazy" onclick="openImageLightbox('${escapeHtml(m.image_url)}')">`
    : '';
  const content = m.content
    ? `<div class="chat-bubble-content">${escapeHtml(m.content)}</div>`
    : '';
  return `
    <div class="chat-bubble ${mine ? 'mine' : 'theirs'}${image ? ' has-image' : ''}" data-msg-id="${m.id}">
      ${image}
      ${content}
      <div class="chat-bubble-footer">
        <span class="chat-bubble-time">${formatTime(m.created_at)}</span>
        ${actions}
      </div>
      ${renderReactions(m.id, 'private')}
    </div>
  `;
}

// ----- Pièces jointes image -----

async function uploadChatImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseClient.storage
    .from('chat-images')
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
  if (error) throw error;
  const { data } = supabaseClient.storage.from('chat-images').getPublicUrl(path);
  return data.publicUrl;
}

function pickChatImage(scope) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Fichier non supporté'); return; }
    if (file.size > MAX_CHAT_IMAGE_BYTES) { showToast('Image trop lourde (max 20 Mo)'); return; }
    pendingChatImage[scope] = file;
    renderChatImagePreview(scope);
  };
  input.click();
}

function clearChatImage(scope) {
  pendingChatImage[scope] = null;
  renderChatImagePreview(scope);
}

function renderChatImagePreview(scope) {
  const form = document.querySelector(`.chat-input-form[data-scope="${scope}"]`);
  if (!form) return;
  const existing = form.querySelector(':scope > .chat-image-preview');
  if (existing) existing.remove();
  const file = pendingChatImage[scope];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const html = `<div class="chat-image-preview">
    <img src="${url}" alt="">
    <button type="button" class="chat-image-preview-remove" aria-label="Retirer" onclick="clearChatImage('${scope}')">×</button>
  </div>`;
  form.insertAdjacentHTML('afterbegin', html);
}

function openImageLightbox(src) {
  document.querySelectorAll('.chat-lightbox').forEach(l => l.remove());
  const html = `<div class="chat-lightbox" onclick="this.remove()">
    <img src="${src}" alt="">
    <button type="button" class="chat-lightbox-close" aria-label="Fermer">×</button>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.addEventListener('keydown', _lightboxEsc, { once: true });
}
function _lightboxEsc(e) {
  if (e.key === 'Escape') document.querySelectorAll('.chat-lightbox').forEach(l => l.remove());
}

async function signalerMessage(messageId, senderId) {
  if (!currentUser) return;
  const reason = window.prompt(getChatText('reportTitle') + '\n\n' + getChatText('reportPrompt'));
  if (reason === null) return; // annulé
  const trimmed = (reason || '').trim().slice(0, 500);
  const { error } = await supabaseClient
    .from('message_reports')
    .insert({
      message_id: messageId,
      reporter_id: currentUser.id,
      reported_user_id: senderId,
      reason: trimmed || null
    });
  if (error) {
    if (error.code === '23505') { showToast(getChatText('reportAlready')); return; }
    console.error('Report message:', error);
    showToast(getChatText('reportError'));
    return;
  }
  showToast(getChatText('reportSent'));
}

// ----- Envoyer un GIF (Giphy URL, pas d'upload) -----

async function sendChatGif(scope, url) {
  if (!currentUser || !url) return;
  if (scope === 'private') {
    if (!chatActiveConversation) return;
    const { data, error } = await supabaseClient
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        recipient_id: chatActiveConversation.userId,
        content: null,
        image_url: url
      })
      .select()
      .single();
    if (error) { console.error('Send GIF:', error); showToast('Erreur envoi'); return; }
    const arr = chatMessagesCache[chatActiveConversation.userId] || [];
    arr.push(data);
    chatMessagesCache[chatActiveConversation.userId] = arr;
    const existing = chatConversations.find(c => c.otherId === chatActiveConversation.userId);
    if (existing) { existing.lastMessage = data; }
    else {
      chatConversations.unshift({
        otherId: chatActiveConversation.userId,
        lastMessage: data,
        unread: 0,
        profile: { ...chatActiveConversation, user_id: chatActiveConversation.userId }
      });
    }
    chatConversations.sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));
    renderConversations();
    renderChatView();
    return;
  }
  if (scope === 'public') {
    const { data, error } = await supabaseClient
      .from('public_messages')
      .insert({ sender_id: currentUser.id, content: null, image_url: url })
      .select()
      .single();
    if (error) { console.error('Send public GIF:', error); showToast('Erreur envoi'); return; }
    if (!chatPublicMessages.some(m => m.id === data.id)) {
      chatPublicMessages.push(data);
      if (!chatPublicProfiles[currentUser.id] && chatMyProfile) {
        chatPublicProfiles[currentUser.id] = chatMyProfile;
      }
      renderPublicView();
    }
  }
}

// ----- Envoyer un message -----

async function envoyerMessage(event) {
  if (event) event.preventDefault();
  if (!chatActiveConversation || !currentUser) return;
  const input = document.getElementById('chatInput');
  if (!input) return;
  const content = input.value.trim();
  const file = pendingChatImage.private;
  if (!content && !file) { showToast(getChatText('messageEmpty')); return; }
  if (content.length > 2000) { showToast(getChatText('messageTooLong')); return; }

  const sendBtn = document.getElementById('chatSendBtn');
  if (sendBtn) sendBtn.disabled = true;
  let image_url = null;
  if (file) {
    try { image_url = await uploadChatImage(file); }
    catch (e) { console.error('Upload image:', e); showToast('Erreur upload image'); if (sendBtn) sendBtn.disabled = false; return; }
  }

  const { data, error } = await supabaseClient
    .from('messages')
    .insert({
      sender_id: currentUser.id,
      recipient_id: chatActiveConversation.userId,
      content: content || null,
      image_url
    })
    .select()
    .single();

  if (sendBtn) sendBtn.disabled = false;
  if (error) { console.error('Send message:', error); showToast('Erreur envoi'); return; }

  input.value = '';
  pendingChatImage.private = null;
  const arr = chatMessagesCache[chatActiveConversation.userId] || [];
  arr.push(data);
  chatMessagesCache[chatActiveConversation.userId] = arr;

  // Mise à jour de la liste conv
  const existing = chatConversations.find(c => c.otherId === chatActiveConversation.userId);
  if (existing) { existing.lastMessage = data; }
  else {
    chatConversations.unshift({
      otherId: chatActiveConversation.userId,
      lastMessage: data,
      unread: 0,
      profile: { ...chatActiveConversation, user_id: chatActiveConversation.userId }
    });
  }
  chatConversations.sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));
  renderConversations();
  renderChatView();
}

// ----- Marquer comme lu -----

async function markConversationAsRead(otherUserId) {
  if (!currentUser) return;
  await supabaseClient
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', otherUserId)
    .eq('recipient_id', currentUser.id)
    .is('read_at', null);
  const convo = chatConversations.find(c => c.otherId === otherUserId);
  if (convo) { convo.unread = 0; }
  updateChatBadge();
  renderConversations();
}

// ----- Realtime -----

function subscribeToMessages() {
  if (!currentUser || !supabaseClient || chatRealtimeChannel) return;
  chatRealtimeChannel = supabaseClient
    .channel('messages:' + currentUser.id)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${currentUser.id}`
    }, (payload) => {
      handleIncomingMessage(payload.new);
    })
    .subscribe();
}

function unsubscribeFromMessages() {
  if (chatRealtimeChannel) {
    supabaseClient.removeChannel(chatRealtimeChannel);
    chatRealtimeChannel = null;
  }
}

async function handleIncomingMessage(msg) {
  const otherId = msg.sender_id;
  if (chatBlockedIds.has(otherId)) return; // Ignore blocked
  // Update cache
  if (chatMessagesCache[otherId]) {
    chatMessagesCache[otherId].push(msg);
  }
  // Update conv list
  let convo = chatConversations.find(c => c.otherId === otherId);
  if (convo) {
    convo.lastMessage = msg;
    if (!chatActiveConversation || chatActiveConversation.userId !== otherId) convo.unread++;
  } else {
    const { data: prof } = await supabaseClient
      .from('profiles')
      .select('user_id, username, avatar, avatar_url')
      .eq('user_id', otherId)
      .maybeSingle();
    chatConversations.push({
      otherId,
      lastMessage: msg,
      unread: 1,
      profile: prof || { user_id: otherId, username: '?' }
    });
    convo = chatConversations[chatConversations.length - 1];
  }
  chatConversations.sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));
  renderConversations();
  if (chatActiveConversation && chatActiveConversation.userId === otherId) {
    renderChatView();
    await markConversationAsRead(otherId);
  } else {
    updateChatBadge();
    maybeNotify(convo.profile, msg.content || (msg.image_url ? '📷 Photo' : ''));
  }
}

function maybeNotify(profile, content) {
  if (chatNotifPref !== 'on') return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  // Pas de notif si l'onglet est focus ET le chat ouvert sur cette conv
  if (!document.hidden) {
    const modalOpen = document.getElementById('chatModal')?.classList.contains('open');
    if (modalOpen && chatActiveConversation?.userId === profile?.user_id) return;
  }
  try {
    const n = new Notification(
      `${getChatText('newMessageFrom')} ${profile?.username || '?'}`,
      { body: (content || '').slice(0, 140), icon: 'images/logo.svg', tag: 'chat-' + (profile?.user_id || '') }
    );
    n.onclick = () => {
      window.focus();
      ouvrirChatModal();
      if (profile?.user_id) ouvrirConversation(profile.user_id, profile.username);
      n.close();
    };
  } catch (e) { /* ignore */ }
}

// ----- Badge notifications non lues -----

function updateChatBadge() {
  const badge = document.getElementById('chatUnreadBadge');
  if (!badge) return;
  const total = chatConversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  if (total > 0) {
    badge.textContent = total > 99 ? '99+' : String(total);
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

// Au login, charger le compteur de messages non lus même sans ouvrir la modale
async function initChatBadge() {
  if (!currentUser) return;
  const { count, error } = await supabaseClient
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', currentUser.id)
    .is('read_at', null);
  if (error) { console.error('Init badge:', error); return; }
  const badge = document.getElementById('chatUnreadBadge');
  if (!badge) return;
  if (count && count > 0) {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

// Hook : au changement d'auth, affiche/masque le bouton chat + init badge
function chatOnAuth(isAuth) {
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) chatBtn.style.display = isAuth ? '' : 'none';
  if (isAuth) {
    initChatBadge();
  } else {
    const badge = document.getElementById('chatUnreadBadge');
    if (badge) badge.style.display = 'none';
    unsubscribeFromMessages();
    unsubscribeFromPublic();
    unsubscribeReactions('private');
    unsubscribeReactions('public');
    chatConversations = [];
    chatMessagesCache = {};
    chatActiveConversation = null;
    chatMyProfile = null;
    chatPublicMessages = [];
    chatPublicProfiles = {};
    chatReactions = {};
    chatPublicReactions = {};
    chatBlockedIds = new Set();
    unsubscribeTyping();
  }
}

// Listener auth Supabase (en plus de celui de supabase-config.js)
if (typeof supabaseClient !== 'undefined') {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    chatOnAuth(!!session?.user);
  });
}

// Au chargement, si déjà connecté (session restaurée), bascule aussi
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { if (currentUser) chatOnAuth(true); }, 100);
  renderNotifBtn();
});

// ============================================================================
// ===== CHAT PUBLIC (salon unique) ===========================================
// ============================================================================

async function chargerPublicMessages() {
  if (!currentUser) return;
  const view = document.getElementById('chatPublicView');
  if (view) view.innerHTML = `<div class="chat-loading">...</div>`;

  const { data, error } = await supabaseClient
    .from('public_messages')
    .select('id, sender_id, content, created_at, image_url')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) { console.error('Load public messages:', error); if (view) view.innerHTML = ''; return; }

  chatPublicMessages = (data || []).filter(m => !chatBlockedIds.has(m.sender_id)).reverse();
  await hydratePublicProfiles(chatPublicMessages.map(m => m.sender_id));
  await loadReactionsForMessages(chatPublicMessages.map(m => m.id), 'public');
  subscribeReactions('public');
  renderPublicView();
}

async function hydratePublicProfiles(userIds) {
  const missing = [...new Set(userIds)].filter(id => !chatPublicProfiles[id]);
  if (!missing.length) return;
  const { data } = await supabaseClient
    .from('profiles')
    .select('user_id, username, avatar, avatar_url')
    .in('user_id', missing);
  (data || []).forEach(p => { chatPublicProfiles[p.user_id] = p; });
}

function renderPublicView() {
  const view = document.getElementById('chatPublicView');
  if (!view) return;
  view.innerHTML = `
    <div class="chat-view-header">
      <button class="chat-back-btn" onclick="hideChatMain()" aria-label="Retour">←</button>
      <span class="chat-public-icon">🌐</span>
      <span class="chat-view-name">${escapeHtml(getChatText('publicWelcome'))}</span>
    </div>
    <div class="chat-messages" id="chatPublicMessagesList">
      ${chatPublicMessages.length
        ? chatPublicMessages.map(renderPublicBubble).join('')
        : `<div class="chat-empty">${escapeHtml(getChatText('publicEmpty'))}</div>`}
    </div>
    <form class="chat-input-form" data-scope="public" onsubmit="envoyerPublicMessage(event)">
      <button type="button" class="emoji-toggle-btn" onclick="toggleEmojiPicker('chatPublicInput', this)" aria-label="Emojis">😊</button>
      <button type="button" class="chat-gif-btn" onclick="toggleGifPicker('public', this)" aria-label="GIF">GIF</button>
      <button type="button" class="chat-attach-btn" onclick="pickChatImage('public')" aria-label="Joindre une photo">📎</button>
      <textarea id="chatPublicInput" rows="1" placeholder="${escapeHtml(getChatText('typeMessage'))}" maxlength="2000"
        onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); document.getElementById('chatPublicSendBtn').click(); }"></textarea>
      <button type="submit" id="chatPublicSendBtn" class="chat-send-btn">${escapeHtml(getChatText('send'))}</button>
    </form>
  `;
  const list = document.getElementById('chatPublicMessagesList');
  if (list) list.scrollTop = list.scrollHeight;
}

function renderPublicBubble(m) {
  const mine = m.sender_id === currentUser.id;
  const profile = chatPublicProfiles[m.sender_id];
  const username = profile?.username || '?';
  const avatar = avatarSrc(profile);
  const reactBtn = `<button class="chat-react-btn" title="Réagir" onclick="event.stopPropagation(); showReactionPicker('${m.id}','public',this)" aria-label="React">😊</button>`;
  const actions = mine
    ? `${reactBtn}
       <button class="chat-report-btn" title="${escapeHtml(getChatText('deleteMsg'))}" onclick="supprimerPublicMessage('${m.id}')" aria-label="${escapeHtml(getChatText('deleteMsg'))}">🗑️</button>`
    : `${reactBtn}
       <button class="chat-report-btn" title="${escapeHtml(getChatText('report'))}" onclick="signalerPublicMessage('${m.id}', '${m.sender_id}')" aria-label="${escapeHtml(getChatText('report'))}">🚩</button>
       <button class="chat-report-btn" title="${escapeHtml(getChatText('block'))}" onclick="bloquerUtilisateur('${m.sender_id}')" aria-label="${escapeHtml(getChatText('block'))}">🚫</button>`;
  const header = !mine
    ? `<div class="chat-public-author">
         <img src="${avatar}" alt="" class="chat-avatar chat-avatar-sm">
         <span class="chat-public-name">${escapeHtml(username)}</span>
       </div>`
    : '';
  const image = m.image_url
    ? `<img class="chat-bubble-image" src="${escapeHtml(m.image_url)}" alt="" loading="lazy" onclick="openImageLightbox('${escapeHtml(m.image_url)}')">`
    : '';
  const content = m.content
    ? `<div class="chat-bubble-content">${escapeHtml(m.content)}</div>`
    : '';
  return `
    <div class="chat-bubble chat-bubble-public ${mine ? 'mine' : 'theirs'}${image ? ' has-image' : ''}" data-msg-id="${m.id}">
      ${header}
      ${image}
      ${content}
      <div class="chat-bubble-footer">
        <span class="chat-bubble-time">${formatTime(m.created_at)}</span>
        ${actions}
      </div>
      ${renderReactions(m.id, 'public')}
    </div>
  `;
}

async function envoyerPublicMessage(event) {
  if (event) event.preventDefault();
  if (!currentUser) return;
  const input = document.getElementById('chatPublicInput');
  if (!input) return;
  const content = input.value.trim();
  const file = pendingChatImage.public;
  if (!content && !file) { showToast(getChatText('messageEmpty')); return; }
  if (content.length > 2000) { showToast(getChatText('messageTooLong')); return; }

  const sendBtn = document.getElementById('chatPublicSendBtn');
  if (sendBtn) sendBtn.disabled = true;
  let image_url = null;
  if (file) {
    try { image_url = await uploadChatImage(file); }
    catch (e) { console.error('Upload image:', e); showToast('Erreur upload image'); if (sendBtn) sendBtn.disabled = false; return; }
  }

  const { data, error } = await supabaseClient
    .from('public_messages')
    .insert({ sender_id: currentUser.id, content: content || null, image_url })
    .select()
    .single();

  if (sendBtn) sendBtn.disabled = false;
  if (error) { console.error('Send public:', error); showToast('Erreur envoi'); return; }

  input.value = '';
  pendingChatImage.public = null;
  // On laisse le realtime gérer l'affichage, mais on l'ajoute quand même en cas de latence
  if (!chatPublicMessages.some(m => m.id === data.id)) {
    chatPublicMessages.push(data);
    if (!chatPublicProfiles[currentUser.id] && chatMyProfile) {
      chatPublicProfiles[currentUser.id] = chatMyProfile;
    }
    renderPublicView();
  }
}

async function signalerPublicMessage(messageId, senderId) {
  if (!currentUser) return;
  const reason = window.prompt(getChatText('reportTitle') + '\n\n' + getChatText('reportPrompt'));
  if (reason === null) return;
  const trimmed = (reason || '').trim().slice(0, 500);
  const { error } = await supabaseClient
    .from('public_message_reports')
    .insert({
      message_id: messageId,
      reporter_id: currentUser.id,
      reported_user_id: senderId,
      reason: trimmed || null
    });
  if (error) {
    if (error.code === '23505') { showToast(getChatText('reportAlready')); return; }
    console.error('Report public:', error);
    showToast(getChatText('reportError'));
    return;
  }
  showToast(getChatText('reportSent'));
}

function subscribeToPublicMessages() {
  if (!currentUser || !supabaseClient || chatPublicRealtime) return;
  chatPublicRealtime = supabaseClient
    .channel('public_messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'public_messages'
    }, (payload) => {
      handleIncomingPublicMessage(payload.new);
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'public_messages'
    }, (payload) => {
      const id = payload.old?.id;
      if (!id) return;
      chatPublicMessages = chatPublicMessages.filter(m => m.id !== id);
      if (chatMode === 'public') renderPublicView();
    })
    .subscribe();
}

function unsubscribeFromPublic() {
  if (chatPublicRealtime) {
    supabaseClient.removeChannel(chatPublicRealtime);
    chatPublicRealtime = null;
  }
}

async function handleIncomingPublicMessage(msg) {
  if (chatBlockedIds.has(msg.sender_id)) return;
  if (chatPublicMessages.some(m => m.id === msg.id)) return;
  chatPublicMessages.push(msg);
  if (chatPublicMessages.length > 200) chatPublicMessages = chatPublicMessages.slice(-150);
  await hydratePublicProfiles([msg.sender_id]);
  if (chatMode === 'public') renderPublicView();
}

// ============================================================================
// ===== BLOCAGE D'UTILISATEURS ===============================================
// ============================================================================

async function chargerBloques() {
  if (!currentUser) { chatBlockedIds = new Set(); return; }
  const { data, error } = await supabaseClient
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', currentUser.id);
  if (error) { console.error('Load blocked:', error); return; }
  chatBlockedIds = new Set((data || []).map(r => r.blocked_id));
}

async function bloquerUtilisateur(userId) {
  if (!currentUser || userId === currentUser.id) return;
  if (!window.confirm(getChatText('blockConfirm'))) return;
  const { error } = await supabaseClient
    .from('blocked_users')
    .insert({ blocker_id: currentUser.id, blocked_id: userId });
  if (error && error.code !== '23505') { console.error('Block:', error); showToast(getChatText('reportError')); return; }
  chatBlockedIds.add(userId);
  showToast(getChatText('blocked'));
  // Retire des listes locales
  chatConversations = chatConversations.filter(c => c.otherId !== userId);
  chatPublicMessages = chatPublicMessages.filter(m => m.sender_id !== userId);
  if (chatActiveConversation?.userId === userId) chatActiveConversation = null;
  renderConversations();
  renderChatView();
  if (chatMode === 'public') renderPublicView();
  renderBlockedCount();
}

async function debloquerUtilisateur(userId) {
  if (!currentUser) return;
  const { error } = await supabaseClient
    .from('blocked_users')
    .delete()
    .eq('blocker_id', currentUser.id)
    .eq('blocked_id', userId);
  if (error) { console.error('Unblock:', error); return; }
  chatBlockedIds.delete(userId);
  afficherBloques();
  renderBlockedCount();
}

function renderBlockedCount() {
  const el = document.getElementById('chatBlockedCount');
  if (!el) return;
  const n = chatBlockedIds.size;
  el.textContent = n > 0 ? `${getChatText('blockedUsers')} (${n})` : getChatText('blockedUsers');
  el.style.display = '';
}

async function afficherBloques() {
  const panel = document.getElementById('chatBlockedPanel');
  if (!panel) return;
  if (panel.classList.contains('open')) { panel.classList.remove('open'); return; }
  panel.classList.add('open');
  if (chatBlockedIds.size === 0) {
    panel.innerHTML = `<div class="chat-empty">${escapeHtml(getChatText('noBlocked'))}</div>`;
    return;
  }
  const ids = [...chatBlockedIds];
  const { data } = await supabaseClient
    .from('profiles')
    .select('user_id, username, avatar, avatar_url')
    .in('user_id', ids);
  const profs = data || [];
  panel.innerHTML = profs.map(p => `
    <div class="chat-blocked-row">
      <img src="${avatarSrc(p)}" alt="" class="chat-avatar chat-avatar-sm">
      <span>${escapeHtml(p.username)}</span>
      <button class="chat-unblock-btn" onclick="debloquerUtilisateur('${p.user_id}')">${escapeHtml(getChatText('unblock'))}</button>
    </div>
  `).join('');
}

// ============================================================================
// ===== SUPPRESSION MESSAGE PUBLIC ===========================================
// ============================================================================

async function supprimerPublicMessage(messageId) {
  if (!currentUser) return;
  if (!window.confirm(getChatText('deleteConfirm'))) return;
  const { error } = await supabaseClient
    .from('public_messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', currentUser.id);
  if (error) { console.error('Delete public:', error); showToast(getChatText('reportError')); return; }
  chatPublicMessages = chatPublicMessages.filter(m => m.id !== messageId);
  renderPublicView();
}

// ============================================================================
// ===== NOTIFICATIONS NAVIGATEUR =============================================
// ============================================================================

async function toggleChatNotif() {
  if (typeof Notification === 'undefined') return;
  if (chatNotifPref === 'on') {
    chatNotifPref = 'off';
    localStorage.setItem('chatNotif', 'off');
    showToast(getChatText('notifOff'));
  } else {
    if (Notification.permission === 'denied') { showToast(getChatText('notifDenied')); return; }
    if (Notification.permission !== 'granted') {
      const res = await Notification.requestPermission();
      if (res !== 'granted') { showToast(getChatText('notifDenied')); return; }
    }
    chatNotifPref = 'on';
    localStorage.setItem('chatNotif', 'on');
    showToast(getChatText('notifOn'));
  }
  renderNotifBtn();
}

function renderNotifBtn() {
  const btn = document.getElementById('chatNotifBtn');
  if (!btn) return;
  const on = chatNotifPref === 'on' && (typeof Notification !== 'undefined') && Notification.permission === 'granted';
  btn.textContent = on ? '🔔' : '🔕';
  btn.title = on ? getChatText('notifOn') : getChatText('notifEnable');
}

// ============================================================================
// ===== INDICATEUR DE FRAPPE (Supabase Presence) =============================
// ============================================================================

function typingChannelName(userA, userB) {
  return 'typing:' + [userA, userB].sort().join(':');
}

function subscribeTyping(otherUserId) {
  unsubscribeTyping();
  if (!currentUser || !supabaseClient) return;
  const name = typingChannelName(currentUser.id, otherUserId);
  chatTypingChannel = supabaseClient.channel(name, {
    config: { presence: { key: currentUser.id } }
  });
  chatTypingChannel.on('presence', { event: 'sync' }, () => {
    const state = chatTypingChannel.presenceState();
    const peer = state[otherUserId];
    const typing = !!(peer && peer.some(p => p.typing));
    if (typing !== chatPeerTyping) {
      chatPeerTyping = typing;
      renderTypingIndicator();
    }
  });
  chatTypingChannel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await chatTypingChannel.track({ typing: false });
    }
  });
}

function unsubscribeTyping() {
  if (chatTypingChannel) {
    supabaseClient.removeChannel(chatTypingChannel);
    chatTypingChannel = null;
  }
  chatPeerTyping = false;
  clearTimeout(chatTypingTimer);
  chatTypingTimer = null;
}

function onChatInputType() {
  if (!chatTypingChannel) return;
  chatTypingChannel.track({ typing: true });
  clearTimeout(chatTypingTimer);
  chatTypingTimer = setTimeout(() => {
    if (chatTypingChannel) chatTypingChannel.track({ typing: false });
  }, 2500);
}

function renderTypingIndicator() {
  const el = document.getElementById('chatTypingIndicator');
  if (!el) return;
  if (chatPeerTyping && chatActiveConversation) {
    el.textContent = `${chatActiveConversation.username} ${getChatText('typing')}`;
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}
