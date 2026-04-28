// ===== AUTHENTIFICATION SUPABASE =====

// État actuel de l'onglet auth (login ou register)
let currentAuthTab = 'login';

// Traductions pour l'auth
const authTranslations = {
  fr: {
    signIn: 'Connexion',
    signUp: 'Inscription',
    signOut: 'Déconnexion',
    email: 'Email',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    username: 'Pseudo',
    chooseAvatar: 'Choisir un avatar',
    forgotPassword: 'Mot de passe oublié ?',
    continueWithGoogle: 'Continuer avec Google',
    or: 'ou',
    guestInfo: 'Sans compte, vos données restent sur cet appareil uniquement.',
    signInSuccess: 'Connexion réussie !',
    signUpSuccess: 'Inscription réussie !',
    signOutSuccess: 'Déconnexion réussie',
    resetPasswordSent: 'Email de réinitialisation envoyé !',
    synced: 'Synchronisé',
    syncing: 'Synchronisation...',
    offline: 'Hors-ligne',
    account: 'Mon compte',
    errorInvalidEmail: 'Email invalide',
    errorInvalidPassword: 'Mot de passe incorrect',
    errorUserNotFound: 'Utilisateur non trouvé',
    errorEmailInUse: 'Email déjà utilisé',
    errorWeakPassword: 'Mot de passe trop faible (min 6 caractères)',
    errorPasswordMismatch: 'Les mots de passe ne correspondent pas',
    errorGeneric: 'Une erreur est survenue'
  },
  en: {
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    username: 'Username',
    chooseAvatar: 'Choose an avatar',
    forgotPassword: 'Forgot password?',
    continueWithGoogle: 'Continue with Google',
    or: 'or',
    guestInfo: 'Without an account, your data stays on this device only.',
    signInSuccess: 'Successfully signed in!',
    signUpSuccess: 'Successfully signed up!',
    signOutSuccess: 'Successfully signed out',
    resetPasswordSent: 'Password reset email sent!',
    synced: 'Synced',
    syncing: 'Syncing...',
    offline: 'Offline',
    account: 'My account',
    errorInvalidEmail: 'Invalid email',
    errorInvalidPassword: 'Wrong password',
    errorUserNotFound: 'User not found',
    errorEmailInUse: 'Email already in use',
    errorWeakPassword: 'Password too weak (min 6 characters)',
    errorPasswordMismatch: 'Passwords do not match',
    errorGeneric: 'An error occurred'
  }
};

// Helper pour obtenir la traduction
function getAuthText(key) {
  const lang = localStorage.getItem('lang') || 'fr';
  return authTranslations[lang]?.[key] || authTranslations['fr'][key] || key;
}

// ===== UI MODAL =====

function ouvrirAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    switchAuthTab('login');
  }
}

function fermerAuthModal(event) {
  if (event && event.target.id === 'authModal') {
    fermerAuthModalBtn();
  }
}

function fermerAuthModalBtn() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    clearAuthError();
    clearAuthForm();
  }
}

function switchAuthTab(tab) {
  currentAuthTab = tab;
  const tabs = document.querySelectorAll('.auth-tab');
  const confirmGroup = document.getElementById('confirmPasswordGroup');
  const usernameGroup = document.getElementById('usernameGroup');
  const avatarGroup = document.getElementById('avatarGroup');
  const submitText = document.getElementById('authSubmitText');

  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });

  const isRegister = tab === 'register';

  if (confirmGroup) {
    confirmGroup.style.display = isRegister ? 'block' : 'none';
  }
  if (usernameGroup) {
    usernameGroup.style.display = isRegister ? 'block' : 'none';
  }
  if (avatarGroup) {
    avatarGroup.style.display = isRegister ? 'block' : 'none';
  }

  if (submitText) {
    submitText.textContent = getAuthText(isRegister ? 'signUp' : 'signIn');
  }
}

function selectAvatar(element) {
  document.querySelectorAll('.avatar-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  element.classList.add('selected');

  // Cacher la preview si on sélectionne un avatar prédéfini
  const preview = document.getElementById('avatarPreview');
  if (preview && element.dataset.avatar !== 'custom') {
    preview.style.display = 'none';
    customAvatarUrl = null;
  }
}

// Variable pour stocker l'URL de l'avatar custom
let customAvatarUrl = null;

async function handleAvatarUpload(input) {
  const file = input.files[0];
  if (!file) return;

  // Vérifier la taille (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showAuthError('Image trop grande (max 2MB)');
    return;
  }

  // Vérifier le type
  if (!file.type.startsWith('image/')) {
    showAuthError('Fichier non valide');
    return;
  }

  try {
    // Afficher preview locale
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('avatarPreview');
      const previewImg = document.getElementById('avatarPreviewImg');
      if (preview && previewImg) {
        previewImg.src = e.target.result;
        preview.style.display = 'flex';
      }
    };
    reader.readAsDataURL(file);

    // Sélectionner l'option custom
    document.querySelectorAll('.avatar-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    document.querySelector('.avatar-upload')?.classList.add('selected');

    // Stocker le fichier pour l'upload lors de l'inscription
    customAvatarFile = file;

  } catch (error) {
    console.error('Error handling avatar:', error);
    showAuthError('Erreur lors du chargement de l\'image');
  }
}

let customAvatarFile = null;

async function uploadAvatarToStorage(file, userId) {
  const fileExt = (file.name.split('.').pop() || 'png').toLowerCase();
  // Nom unique à chaque upload : la policy INSERT du bucket suffit, pas
  // besoin d'UPDATE pour écraser. Bonus : les anciens caches CDN sont
  // contournés automatiquement par le nouveau chemin.
  const fileName = `${userId}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabaseClient.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Récupérer l'URL publique
  const { data: urlData } = supabaseClient.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

function removeCustomAvatar() {
  const preview = document.getElementById('avatarPreview');
  const uploadInput = document.getElementById('avatarUpload');

  if (preview) preview.style.display = 'none';
  if (uploadInput) uploadInput.value = '';

  customAvatarUrl = null;
  customAvatarFile = null;

  // Resélectionner le premier avatar
  const firstAvatar = document.querySelector('.avatar-option[data-avatar="1"]');
  if (firstAvatar) {
    document.querySelectorAll('.avatar-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    firstAvatar.classList.add('selected');
  }
}

function clearAuthForm() {
  const form = document.getElementById('authForm');
  if (form) form.reset();

  // Reset avatar selection
  removeCustomAvatar();
}

function clearAuthError() {
  const errorDiv = document.getElementById('authError');
  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }
}

function showAuthError(message) {
  const errorDiv = document.getElementById('authError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

function showAuthLoading(show = true) {
  const btn = document.querySelector('.auth-submit-btn');
  const googleBtn = document.querySelector('.google-btn');

  if (btn) {
    btn.disabled = show;
    btn.style.opacity = show ? '0.7' : '1';
  }
  if (googleBtn) {
    googleBtn.disabled = show;
    googleBtn.style.opacity = show ? '0.7' : '1';
  }
}

// ===== AUTHENTIFICATION =====

async function handleAuthSubmit(event) {
  event.preventDefault();
  clearAuthError();

  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;

  if (!email || !password) {
    showAuthError(getAuthText('errorGeneric'));
    return;
  }

  if (currentAuthTab === 'register') {
    const confirmPassword = document.getElementById('authConfirmPassword').value;
    if (password !== confirmPassword) {
      showAuthError(getAuthText('errorPasswordMismatch'));
      return;
    }
    if (password.length < 6) {
      showAuthError(getAuthText('errorWeakPassword'));
      return;
    }
    await inscription(email, password);
  } else {
    await connexion(email, password);
  }
}

async function connexion(email, password) {
  try {
    showAuthLoading(true);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    fermerAuthModalBtn();
    showToast(getAuthText('signInSuccess'));

  } catch (error) {
    console.error('Login error:', error);
    handleAuthError(error);
  } finally {
    showAuthLoading(false);
  }
}

async function inscription(email, password) {
  try {
    showAuthLoading(true);

    const username = document.getElementById('authUsername').value.trim();
    const selectedAvatar = document.querySelector('.avatar-option.selected')?.dataset.avatar || '1';

    // D'abord créer le compte
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
          avatar: selectedAvatar
        }
      }
    });

    if (error) throw error;

    // Si un avatar custom a été uploadé, l'envoyer au storage
    if (customAvatarFile && data.user) {
      try {
        const avatarUrl = await uploadAvatarToStorage(customAvatarFile, data.user.id);

        // Mettre à jour les métadonnées utilisateur avec l'URL
        await supabaseClient.auth.updateUser({
          data: {
            avatar: 'custom',
            avatar_url: avatarUrl
          }
        });
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        // On continue quand même, l'utilisateur pourra changer son avatar plus tard
      }
    }

    // Reset
    customAvatarFile = null;
    customAvatarUrl = null;

    fermerAuthModalBtn();
    showToast(getAuthText('signUpSuccess'));

  } catch (error) {
    console.error('Signup error:', error);
    handleAuthError(error);
  } finally {
    showAuthLoading(false);
  }
}

async function connexionGoogle() {
  try {
    showAuthLoading(true);

    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;

  } catch (error) {
    console.error('Google login error:', error);
    handleAuthError(error);
    showAuthLoading(false);
  }
}

async function deconnexion() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    currentUser = null;
    updateAuthUI(false);
    fermerUserDropdown();
    showToast(getAuthText('signOutSuccess'));

  } catch (error) {
    console.error('Logout error:', error);
    showToast(getAuthText('errorGeneric'));
  }
}

async function resetPassword() {
  const email = document.getElementById('authEmail').value.trim();

  if (!email) {
    showAuthError(getAuthText('errorInvalidEmail'));
    return;
  }

  try {
    showAuthLoading(true);

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });

    if (error) throw error;

    fermerAuthModalBtn();
    showToast(getAuthText('resetPasswordSent'));

  } catch (error) {
    console.error('Reset password error:', error);
    handleAuthError(error);
  } finally {
    showAuthLoading(false);
  }
}

function handleAuthError(error) {
  const message = error.message || '';

  if (message.includes('Invalid login')) {
    showAuthError(getAuthText('errorInvalidPassword'));
  } else if (message.includes('User not found')) {
    showAuthError(getAuthText('errorUserNotFound'));
  } else if (message.includes('already registered')) {
    showAuthError(getAuthText('errorEmailInUse'));
  } else if (message.includes('valid email')) {
    showAuthError(getAuthText('errorInvalidEmail'));
  } else if (message.includes('password')) {
    showAuthError(getAuthText('errorWeakPassword'));
  } else {
    showAuthError(getAuthText('errorGeneric'));
  }
}

// ===== UI UTILISATEUR =====

// Avatars prédéfinis
const avatarList = [
  'images/avatars/avatar1.svg',
  'images/avatars/avatar2.svg',
  'images/avatars/avatar3.svg',
  'images/avatars/avatar4.svg',
  'images/avatars/avatar5.svg',
  'images/avatars/avatar6.svg',
  'images/avatars/avatar7.svg',
  'images/avatars/avatar8.svg'
];

function getAvatarUrl(avatarId) {
  const id = parseInt(avatarId) || 1;
  if (id >= 1 && id <= avatarList.length) {
    return avatarList[id - 1];
  }
  return avatarList[0];
}

function updateAuthUI(isLoggedIn) {
  const authBtn = document.getElementById('authBtn');
  const userMenu = document.getElementById('userMenu');
  const userName = document.getElementById('userName');
  const userAvatar = document.getElementById('userAvatar');
  const userEmail = document.getElementById('userEmail');

  if (isLoggedIn && currentUser) {
    if (authBtn) authBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';

    const displayName = currentUser.user_metadata?.username ||
      currentUser.user_metadata?.full_name ||
      currentUser.email?.split('@')[0] ||
      'User';

    // Utiliser l'avatar personnalisé ou Google avatar ou avatar par défaut
    let avatarUrl;
    if (currentUser.user_metadata?.avatar === 'custom' && currentUser.user_metadata?.avatar_url) {
      // Avatar custom uploadé par l'utilisateur
      avatarUrl = currentUser.user_metadata.avatar_url;
    } else if (currentUser.user_metadata?.avatar_url) {
      // Avatar Google
      avatarUrl = currentUser.user_metadata.avatar_url;
    } else if (currentUser.user_metadata?.avatar) {
      // Avatar prédéfini (1-8)
      avatarUrl = getAvatarUrl(currentUser.user_metadata.avatar);
    } else {
      avatarUrl = getAvatarUrl(1);
    }

    if (userName) userName.textContent = displayName;
    if (userAvatar) userAvatar.src = avatarUrl;
    if (userEmail) userEmail.textContent = currentUser.email;

  } else {
    if (authBtn) authBtn.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
  }
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.toggle('open');
  }
}

function fermerUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.remove('open');
  }
}

// Fermer le dropdown si on clique ailleurs
document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('userMenu');
  if (userMenu && !userMenu.contains(e.target)) {
    fermerUserDropdown();
  }
});

// ===== MODIFICATION DE LA PHOTO DE PROFIL =====
let avatarModalSelected = '1';
let avatarModalCustomFile = null;

function ouvrirAvatarModal() {
  if (!currentUser) return;
  const modal = document.getElementById('avatarModal');
  if (!modal) return;

  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'fr';
  const currentAvatar = currentUser.user_metadata?.avatar || '1';
  const currentUrl = currentUser.user_metadata?.avatar_url || null;

  avatarModalSelected = currentAvatar;
  avatarModalCustomFile = null;

  // Marquer la sélection actuelle
  document.querySelectorAll('#avatarModal .avatar-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.avatar === currentAvatar);
  });

  // Si custom, montrer la preview de l'avatar actuel
  const preview = document.getElementById('avatarModalPreview');
  const previewImg = document.getElementById('avatarModalPreviewImg');
  if (currentAvatar === 'custom' && currentUrl && preview && previewImg) {
    previewImg.src = currentUrl;
    preview.style.display = 'flex';
  } else if (preview) {
    preview.style.display = 'none';
  }

  const input = document.getElementById('avatarModalUpload');
  if (input) input.value = '';

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  fermerUserDropdown();
}

function fermerAvatarModal(event) {
  if (event && event.target.id !== 'avatarModal') return;
  fermerAvatarModalBtn();
}

function fermerAvatarModalBtn() {
  const modal = document.getElementById('avatarModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

function selectAvatarModal(element) {
  document.querySelectorAll('#avatarModal .avatar-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  avatarModalSelected = element.dataset.avatar;
  if (avatarModalSelected !== 'custom') {
    avatarModalCustomFile = null;
    const preview = document.getElementById('avatarModalPreview');
    if (preview) preview.style.display = 'none';
  }
}

async function handleAvatarModalUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'fr';

  if (file.size > 2 * 1024 * 1024) {
    if (typeof showToast === 'function') {
      showToast(lang === 'en' ? 'Image too large (max 2MB)' : 'Image trop grande (max 2MB)');
    }
    input.value = '';
    return;
  }
  if (!file.type.startsWith('image/')) {
    if (typeof showToast === 'function') {
      showToast(lang === 'en' ? 'Invalid file' : 'Fichier non valide');
    }
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('avatarModalPreview');
    const previewImg = document.getElementById('avatarModalPreviewImg');
    if (preview && previewImg) {
      previewImg.src = e.target.result;
      preview.style.display = 'flex';
    }
  };
  reader.readAsDataURL(file);

  document.querySelectorAll('#avatarModal .avatar-option').forEach(opt => opt.classList.remove('selected'));
  document.querySelector('#avatarModal .avatar-upload')?.classList.add('selected');
  avatarModalSelected = 'custom';
  avatarModalCustomFile = file;
}

function removeAvatarModalCustom() {
  avatarModalCustomFile = null;
  const preview = document.getElementById('avatarModalPreview');
  if (preview) preview.style.display = 'none';
  const input = document.getElementById('avatarModalUpload');
  if (input) input.value = '';
  document.querySelectorAll('#avatarModal .avatar-option').forEach(opt => opt.classList.remove('selected'));
  document.querySelector('#avatarModal .avatar-option[data-avatar="1"]')?.classList.add('selected');
  avatarModalSelected = '1';
}

async function saveAvatarChange() {
  if (!currentUser) return;
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'fr';
  const saveBtn = document.getElementById('avatarSaveBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = lang === 'en' ? 'Saving…' : 'Enregistrement…';
  }

  try {
    let avatarValue = avatarModalSelected;
    let avatarUrl = null;

    if (avatarValue === 'custom') {
      if (avatarModalCustomFile) {
        avatarUrl = await uploadAvatarToStorage(avatarModalCustomFile, currentUser.id);
      } else {
        // L'utilisateur a gardé l'avatar custom existant : on le réutilise
        avatarUrl = currentUser.user_metadata?.avatar_url || null;
        if (!avatarUrl) {
          if (typeof showToast === 'function') {
            showToast(lang === 'en' ? 'Please choose an image' : 'Choisis une image');
          }
          return;
        }
      }
    }

    const metaUpdate = avatarValue === 'custom'
      ? { avatar: 'custom', avatar_url: avatarUrl }
      : { avatar: avatarValue, avatar_url: null };

    const { data: updated, error: authError } = await supabaseClient.auth.updateUser({ data: metaUpdate });
    if (authError) throw authError;
    if (updated?.user) currentUser = updated.user;

    // Synchroniser la table profiles (utilisée par chat + commentaires)
    const profileUpdate = avatarValue === 'custom'
      ? { avatar: 'custom', avatar_url: avatarUrl }
      : { avatar: avatarValue, avatar_url: null };

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', currentUser.id);

    if (profileError) console.warn('Profile update failed (non-critical):', profileError);

    updateAuthUI(true);
    fermerAvatarModalBtn();
    if (typeof showToast === 'function') {
      showToast(lang === 'en' ? 'Profile picture updated' : 'Photo de profil modifiée');
    }
  } catch (e) {
    console.error('saveAvatarChange error:', e);
    if (typeof showToast === 'function') {
      showToast(lang === 'en' ? 'Update failed' : 'Erreur lors de la mise à jour');
    }
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = lang === 'en' ? 'Save' : 'Enregistrer';
    }
  }
}

// ===== SYNC STATUS =====

function updateSyncStatus(status) {
  const syncStatus = document.getElementById('syncStatus');
  const syncIcon = syncStatus?.querySelector('.sync-icon');
  const syncText = syncStatus?.querySelector('.sync-text');

  if (!syncStatus) return;

  syncStatus.className = 'sync-status ' + status;

  if (syncIcon) {
    syncIcon.textContent = status === 'syncing' ? '🔄' :
      status === 'error' ? '❌' :
        status === 'offline' ? '📴' : '☁️';
  }

  if (syncText) {
    syncText.textContent = getAuthText(status === 'syncing' ? 'syncing' :
      status === 'offline' ? 'offline' : 'synced');
  }
}
