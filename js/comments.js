// Commentaires sur les pages manga
// Dépend de : supabase-config.js (supabaseClient, currentUser), manga.js (currentLang)

const COMMENTS_MAX_LENGTH = 1000;

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
    tooLong: en ? `Max ${COMMENTS_MAX_LENGTH} characters` : `Max ${COMMENTS_MAX_LENGTH} caractères`,
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

    renderComments(comments || [], profiles);
  } catch (e) {
    console.error('loadComments error', e);
    list.innerHTML = `<div class="comments-empty">${commentsT('error')}</div>`;
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
    const avatar = p.avatar_url || (p.avatar ? `images/avatars/avatar${p.avatar}.svg` : 'images/avatars/avatar1.svg');
    const isMine = c.user_id === myId;
    return `
      <div class="comment-item" data-comment-id="${c.id}">
        <img class="comment-avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(username)}" onerror="this.src='images/avatars/avatar1.svg'">
        <div class="comment-body">
          <div class="comment-head">
            <span class="comment-author">${escapeHtml(username)}</span>
            <span class="comment-date">${formatCommentDate(c.created_at)}</span>
            ${isMine ? `<button class="comment-delete" onclick="deleteComment('${c.id}')" title="${commentsT('confirmDelete')}">🗑️</button>` : ''}
          </div>
          <div class="comment-content">${escapeHtml(c.content)}</div>
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
  if (content.length > COMMENTS_MAX_LENGTH) {
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
  const len = textarea.value.length;
  counter.textContent = `${len} / ${COMMENTS_MAX_LENGTH}`;
  counter.classList.toggle('over-limit', len > COMMENTS_MAX_LENGTH);
}

function buildCommentsSection(mangaId) {
  const isAuth = !!currentUser;
  const composer = isAuth
    ? `
      <div class="comment-composer">
        <textarea
          id="commentInput"
          class="comment-textarea"
          maxlength="${COMMENTS_MAX_LENGTH}"
          placeholder="${commentsT('placeholder')}"
          oninput="updateCommentCounter()"
        ></textarea>
        <div class="comment-composer-footer">
          <span class="comment-counter" id="commentCounter">0 / ${COMMENTS_MAX_LENGTH}</span>
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
