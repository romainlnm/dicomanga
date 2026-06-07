// Commentaires sur les pages manga
// Dépend de : supabase-config.js (supabaseClient, currentUser), manga.js (currentLang),
//             emoji-picker.js (EMOJI_CATEGORIES, showQuickReactionBar, openFloatingFullPicker, toggleEmojiPicker)

const COMMENTS_MAX_WORDS = 1000;
const COMMENT_QUICK_REACTIONS = ['👍','❤️','😂','😮','😢','🔥'];

// Réactions sur les commentaires : { commentId: { emoji: Set<userId> } }
let commentReactions = {};

function countWords(s) {
  const trimmed = String(s).trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function commentsT(key) {
  const en = currentLang === 'en';
  const map = {
    title: en ? 'Comments' : 'Commentaires',
    placeholder: en ? 'Share your thoughts about this manga…' : 'Partage ton avis sur ce manga…',
    submit: en ? 'Post' : 'Publier',
    posting: en ? 'Posting…' : 'Publication…',
    empty: en ? 'No comments yet. Be the first!' : 'Aucun commentaire. Sois le premier !',
    loginToComment: en ? 'Sign in to leave a comment' : 'Connecte-toi pour laisser un commentaire',
    confirmDelete: en ? 'Delete this comment?' : 'Supprimer ce commentaire ?',
    posted: en ? 'Comment posted' : 'Commentaire publié',
    deleted: en ? 'Comment deleted' : 'Commentaire supprimé',
    error: en ? 'Something went wrong' : 'Une erreur est survenue',
    tooLong: en ? `Max ${COMMENTS_MAX_WORDS} words` : `Max ${COMMENTS_MAX_WORDS} mots`,
    justNow: en ? 'just now' : 'à l\'instant',
    minutesAgo: (n) => en ? `${n} min ago` : `il y a ${n} min`,
    hoursAgo: (n) => en ? `${n}h ago` : `il y a ${n}h`,
    daysAgo: (n) => en ? `${n}d ago` : `il y a ${n}j`
  };
  return map[key];
}

function formatCommentDate(iso) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return commentsT('justNow');
  if (diffMin < 60) return commentsT('minutesAgo')(diffMin);
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return commentsT('hoursAgo')(diffH);
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return commentsT('daysAgo')(diffD);
  return date.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadComments(mangaId) {
  const list = document.getElementById('commentsList');
  if (!list) return;
  list.innerHTML = '<div class="comments-loading"></div>';

  try {
    const { data: comments, error } = await supabaseClient
      .from('manga_comments')
      .select('id, user_id, content, created_at')
      .eq('manga_id', mangaId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const userIds = [...new Set((comments || []).map(c => c.user_id))];
    let profiles = {};
    if (userIds.length) {
      const { data: profs } = await supabaseClient
        .from('profiles')
        .select('user_id, username, avatar, avatar_url')
        .in('user_id', userIds);
      (profs || []).forEach(p => { profiles[p.user_id] = p; });
    }

    await loadCommentReactions((comments || []).map(c => c.id));
    renderComments(comments || [], profiles);
  } catch (e) {
    console.error('loadComments error', e);
    list.innerHTML = `<div class="comments-empty">${commentsT('error')}</div>`;
  }
}

async function loadCommentReactions(commentIds) {
  commentReactions = {};
  if (!commentIds.length) return;
  const { data, error } = await supabaseClient
    .from('manga_comment_reactions')
    .select('comment_id, user_id, emoji')
    .in('comment_id', commentIds);
  if (error) { console.error('loadCommentReactions error', error); return; }
  (data || []).forEach(r => {
    if (!commentReactions[r.comment_id]) commentReactions[r.comment_id] = {};
    if (!commentReactions[r.comment_id][r.emoji]) commentReactions[r.comment_id][r.emoji] = new Set();
    commentReactions[r.comment_id][r.emoji].add(r.user_id);
  });
}

function renderCommentReactions(commentId) {
  const entries = Object.entries(commentReactions[commentId] || {}).filter(([, set]) => set.size > 0);
  const me = currentUser?.id;
  const chips = entries.map(([emoji, set]) => {
    const mine = me && set.has(me);
    return `<button class="comment-reaction-chip${mine ? ' mine' : ''}" onclick="toggleCommentReaction('${commentId}','${emoji}')">${emoji} <span>${set.size}</span></button>`;
  }).join('');
  const addBtn = currentUser
    ? `<button class="comment-reaction-add-btn" onclick="event.stopPropagation(); showCommentReactionPicker('${commentId}', this)" aria-label="Réagir">😊+</button>`
    : '';
  if (!chips && !addBtn) return '';
  return `<div class="comment-reaction-row">${chips}${addBtn}</div>`;
}

function showCommentReactionPicker(commentId, btn) {
  if (typeof showQuickReactionBar !== 'function') return;
  const anchor = btn.closest('.comment-item');
  if (!anchor) return;
  showQuickReactionBar(
    anchor,
    COMMENT_QUICK_REACTIONS,
    (emoji) => toggleCommentReaction(commentId, emoji),
    () => openFloatingFullPicker(anchor, `comment-react-${commentId}`, (emoji) => toggleCommentReaction(commentId, emoji))
  );
}

async function toggleCommentReaction(commentId, emoji) {
  if (!currentUser) {
    if (typeof ouvrirAuthModal === 'function') ouvrirAuthModal();
    return;
  }
  if (!commentReactions[commentId]) commentReactions[commentId] = {};
  if (!commentReactions[commentId][emoji]) commentReactions[commentId][emoji] = new Set();
  const set = commentReactions[commentId][emoji];
  const has = set.has(currentUser.id);

  if (has) {
    set.delete(currentUser.id);
    if (set.size === 0) delete commentReactions[commentId][emoji];
    rerenderCommentReactions(commentId);
    const { error } = await supabaseClient
      .from('manga_comment_reactions')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', currentUser.id)
      .eq('emoji', emoji);
    if (error) {
      console.error('toggleCommentReaction delete error', error);
      // rollback
      if (!commentReactions[commentId][emoji]) commentReactions[commentId][emoji] = new Set();
      commentReactions[commentId][emoji].add(currentUser.id);
      rerenderCommentReactions(commentId);
    }
  } else {
    set.add(currentUser.id);
    rerenderCommentReactions(commentId);
    const { error } = await supabaseClient
      .from('manga_comment_reactions')
      .insert({ comment_id: commentId, user_id: currentUser.id, emoji });
    if (error) {
      console.error('toggleCommentReaction insert error', error);
      // rollback
      set.delete(currentUser.id);
      if (set.size === 0) delete commentReactions[commentId][emoji];
      rerenderCommentReactions(commentId);
    }
  }
}

function rerenderCommentReactions(commentId) {
  const item = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
  if (!item) return;
  const existing = item.querySelector('.comment-reaction-row');
  const newHtml = renderCommentReactions(commentId);
  if (existing) {
    if (newHtml) {
      const tmp = document.createElement('div');
      tmp.innerHTML = newHtml;
      existing.replaceWith(tmp.firstElementChild);
    } else {
      existing.remove();
    }
  } else if (newHtml) {
    const body = item.querySelector('.comment-body');
    if (body) body.insertAdjacentHTML('beforeend', newHtml);
  }
}

function renderComments(comments, profiles) {
  const list = document.getElementById('commentsList');
  const countEl = document.getElementById('commentsCount');
  if (!list) return;
  if (countEl) countEl.textContent = comments.length;

  if (!comments.length) {
    list.innerHTML = `<div class="comments-empty">${commentsT('empty')}</div>`;
    return;
  }

  const myId = currentUser?.id;
  list.innerHTML = comments.map(c => {
    const p = profiles[c.user_id] || {};
    const username = p.username || '?';
    // Depuis les pages statiques /manga/…, les chemins racine doivent être absolus.
    const avatarRoot = location.pathname.startsWith('/manga/') ? '/' : '';
    const avatar = p.avatar_url || `${avatarRoot}images/avatars/avatar${p.avatar || 1}.svg`;
    const isMine = c.user_id === myId;
    return `
      <div class="comment-item" data-comment-id="${c.id}">
        <img class="comment-avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(username)}" onerror="this.src='${avatarRoot}images/avatars/avatar1.svg'">
        <div class="comment-body">
          <div class="comment-head">
            <span class="comment-author">${escapeHtml(username)}</span>
            <span class="comment-date">${formatCommentDate(c.created_at)}</span>
            ${isMine ? `<button class="comment-delete" onclick="deleteComment('${c.id}')" title="${commentsT('confirmDelete')}">🗑️</button>` : ''}
          </div>
          <div class="comment-content">${escapeHtml(c.content)}</div>
          ${renderCommentReactions(c.id)}
        </div>
      </div>
    `;
  }).join('');
}

async function postComment(mangaId) {
  if (!currentUser) {
    if (typeof ouvrirAuthModal === 'function') ouvrirAuthModal();
    return;
  }
  const textarea = document.getElementById('commentInput');
  const submitBtn = document.getElementById('commentSubmit');
  if (!textarea) return;
  const content = textarea.value.trim();
  if (!content) return;
  if (countWords(content) > COMMENTS_MAX_WORDS) {
    if (typeof showToast === 'function') showToast(commentsT('tooLong'));
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = commentsT('posting');
  }

  try {
    const { error } = await supabaseClient
      .from('manga_comments')
      .insert({ manga_id: mangaId, user_id: currentUser.id, content });
    if (error) throw error;
    textarea.value = '';
    updateCommentCounter();
    if (typeof showToast === 'function') showToast(commentsT('posted'));
    await loadComments(mangaId);
  } catch (e) {
    console.error('postComment error', e);
    if (typeof showToast === 'function') showToast(commentsT('error'));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = commentsT('submit');
    }
  }
}

async function deleteComment(commentId) {
  if (!confirm(commentsT('confirmDelete'))) return;
  try {
    const { error } = await supabaseClient
      .from('manga_comments')
      .delete()
      .eq('id', commentId);
    if (error) throw error;
    if (typeof showToast === 'function') showToast(commentsT('deleted'));
    const mangaId = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
    if (!Number.isNaN(mangaId)) await loadComments(mangaId);
  } catch (e) {
    console.error('deleteComment error', e);
    if (typeof showToast === 'function') showToast(commentsT('error'));
  }
}

function updateCommentCounter() {
  const textarea = document.getElementById('commentInput');
  const counter = document.getElementById('commentCounter');
  if (!textarea || !counter) return;
  const words = countWords(textarea.value);
  counter.textContent = `${words} / ${COMMENTS_MAX_WORDS}`;
  counter.classList.toggle('over-limit', words > COMMENTS_MAX_WORDS);
}

function buildCommentsSection(mangaId) {
  const isAuth = !!currentUser;
  const composer = isAuth
    ? `
      <div class="comment-composer emoji-picker-host">
        <textarea
          id="commentInput"
          class="comment-textarea"
          placeholder="${commentsT('placeholder')}"
          oninput="updateCommentCounter()"
        ></textarea>
        <div class="comment-composer-footer">
          <button type="button" class="emoji-toggle-btn" onclick="toggleEmojiPicker('commentInput', this)" aria-label="Emojis">😊</button>
          <span class="comment-counter" id="commentCounter">0 / ${COMMENTS_MAX_WORDS}</span>
          <button id="commentSubmit" class="comment-submit-btn" onclick="postComment(${mangaId})">
            ${commentsT('submit')}
          </button>
        </div>
      </div>
    `
    : `
      <div class="comment-login-prompt">
        <button class="comment-login-btn" onclick="ouvrirAuthModal && ouvrirAuthModal()">
          ${commentsT('loginToComment')}
        </button>
      </div>
    `;

  return `
    <div class="manga-section comments-section">
      <h2>${commentsT('title')} <span class="comments-count" id="commentsCount">0</span></h2>
      ${composer}
      <div class="comments-list" id="commentsList">
        <div class="comments-loading"></div>
      </div>
    </div>
  `;
}

// Re-render section + reload when auth state changes (login/logout from another tab/event)
if (typeof supabaseClient !== 'undefined' && supabaseClient.auth?.onAuthStateChange) {
  supabaseClient.auth.onAuthStateChange(() => {
    const section = document.querySelector('.comments-section');
    if (!section) return;
    const mangaId = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
    if (Number.isNaN(mangaId)) return;
    section.outerHTML = buildCommentsSection(mangaId);
    loadComments(mangaId);
  });
}
