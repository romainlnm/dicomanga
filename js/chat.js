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
      publicIntro: 'Salon ouvert à tous les membres connectés. Reste respectueux.'
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
      publicIntro: 'Open to all signed-in members. Please stay respectful.'
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

// ----- Modal open/close -----

async function ouvrirChatModal() {
  if (!currentUser) { ouvrirAuthModal(); return; }
  const modal = document.getElementById('chatModal');
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  await chargerProfilMoi();
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
  unsubscribeFromMessages();
  unsubscribeFromPublic();
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
    await chargerPublicMessages();
    subscribeToPublicMessages();
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
    .select('id, sender_id, recipient_id, content, created_at, read_at')
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
    const preview = c.lastMessage.sender_id === currentUser.id
      ? '→ ' + escapeHtml(c.lastMessage.content.slice(0, 60))
      : escapeHtml(c.lastMessage.content.slice(0, 60));
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
  await markConversationAsRead(otherUserId);
}

async function chargerMessages(otherUserId) {
  const { data, error } = await supabaseClient
    .from('messages')
    .select('id, sender_id, recipient_id, content, created_at, read_at')
    .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUser.id})`)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) { console.error('Load messages:', error); return; }
  chatMessagesCache[otherUserId] = data || [];
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
      <img src="${avatar}" alt="" class="chat-avatar">
      <span class="chat-view-name">${escapeHtml(chatActiveConversation.username)}</span>
    </div>
    <div class="chat-messages" id="chatMessages">
      ${msgs.map(renderMessageBubble).join('')}
    </div>
    <form class="chat-input-form" onsubmit="envoyerMessage(event)">
      <textarea id="chatInput" rows="1" placeholder="${escapeHtml(getChatText('typeMessage'))}" maxlength="2000"
        onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); document.getElementById('chatSendBtn').click(); }"></textarea>
      <button type="submit" id="chatSendBtn" class="chat-send-btn">${escapeHtml(getChatText('send'))}</button>
    </form>
  `;
  const container = document.getElementById('chatMessages');
  if (container) container.scrollTop = container.scrollHeight;
}

function renderMessageBubble(m) {
  const mine = m.sender_id === currentUser.id;
  const reportBtn = !mine
    ? `<button class="chat-report-btn" title="${escapeHtml(getChatText('report'))}" onclick="signalerMessage('${m.id}', '${m.sender_id}')" aria-label="${escapeHtml(getChatText('report'))}">🚩</button>`
    : '';
  return `
    <div class="chat-bubble ${mine ? 'mine' : 'theirs'}">
      <div class="chat-bubble-content">${escapeHtml(m.content)}</div>
      <div class="chat-bubble-footer">
        <span class="chat-bubble-time">${formatTime(m.created_at)}</span>
        ${reportBtn}
      </div>
    </div>
  `;
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

// ----- Envoyer un message -----

async function envoyerMessage(event) {
  if (event) event.preventDefault();
  if (!chatActiveConversation || !currentUser) return;
  const input = document.getElementById('chatInput');
  if (!input) return;
  const content = input.value.trim();
  if (!content) { showToast(getChatText('messageEmpty')); return; }
  if (content.length > 2000) { showToast(getChatText('messageTooLong')); return; }

  const { data, error } = await supabaseClient
    .from('messages')
    .insert({
      sender_id: currentUser.id,
      recipient_id: chatActiveConversation.userId,
      content
    })
    .select()
    .single();

  if (error) { console.error('Send message:', error); showToast('Erreur envoi'); return; }

  input.value = '';
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
  }
  chatConversations.sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));
  renderConversations();
  if (chatActiveConversation && chatActiveConversation.userId === otherId) {
    renderChatView();
    await markConversationAsRead(otherId);
  } else {
    updateChatBadge();
  }
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
    chatConversations = [];
    chatMessagesCache = {};
    chatActiveConversation = null;
    chatMyProfile = null;
    chatPublicMessages = [];
    chatPublicProfiles = {};
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
    .select('id, sender_id, content, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) { console.error('Load public messages:', error); if (view) view.innerHTML = ''; return; }

  chatPublicMessages = (data || []).reverse();
  await hydratePublicProfiles(chatPublicMessages.map(m => m.sender_id));
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
      <span class="chat-public-icon">🌐</span>
      <span class="chat-view-name">${escapeHtml(getChatText('publicWelcome'))}</span>
    </div>
    <div class="chat-messages" id="chatPublicMessagesList">
      ${chatPublicMessages.length
        ? chatPublicMessages.map(renderPublicBubble).join('')
        : `<div class="chat-empty">${escapeHtml(getChatText('publicEmpty'))}</div>`}
    </div>
    <form class="chat-input-form" onsubmit="envoyerPublicMessage(event)">
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
  const reportBtn = !mine
    ? `<button class="chat-report-btn" title="${escapeHtml(getChatText('report'))}" onclick="signalerPublicMessage('${m.id}', '${m.sender_id}')" aria-label="${escapeHtml(getChatText('report'))}">🚩</button>`
    : '';
  const header = !mine
    ? `<div class="chat-public-author">
         <img src="${avatar}" alt="" class="chat-avatar chat-avatar-sm">
         <span class="chat-public-name">${escapeHtml(username)}</span>
       </div>`
    : '';
  return `
    <div class="chat-bubble chat-bubble-public ${mine ? 'mine' : 'theirs'}">
      ${header}
      <div class="chat-bubble-content">${escapeHtml(m.content)}</div>
      <div class="chat-bubble-footer">
        <span class="chat-bubble-time">${formatTime(m.created_at)}</span>
        ${reportBtn}
      </div>
    </div>
  `;
}

async function envoyerPublicMessage(event) {
  if (event) event.preventDefault();
  if (!currentUser) return;
  const input = document.getElementById('chatPublicInput');
  if (!input) return;
  const content = input.value.trim();
  if (!content) { showToast(getChatText('messageEmpty')); return; }
  if (content.length > 2000) { showToast(getChatText('messageTooLong')); return; }

  const { data, error } = await supabaseClient
    .from('public_messages')
    .insert({ sender_id: currentUser.id, content })
    .select()
    .single();

  if (error) { console.error('Send public:', error); showToast('Erreur envoi'); return; }

  input.value = '';
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
    .subscribe();
}

function unsubscribeFromPublic() {
  if (chatPublicRealtime) {
    supabaseClient.removeChannel(chatPublicRealtime);
    chatPublicRealtime = null;
  }
}

async function handleIncomingPublicMessage(msg) {
  if (chatPublicMessages.some(m => m.id === msg.id)) return;
  chatPublicMessages.push(msg);
  if (chatPublicMessages.length > 200) chatPublicMessages = chatPublicMessages.slice(-150);
  await hydratePublicProfiles([msg.sender_id]);
  if (chatMode === 'public') renderPublicView();
}
