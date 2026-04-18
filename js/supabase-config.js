// Configuration Supabase pour Dico.Manga
const SUPABASE_URL = 'https://kdcqksxyirblcorjmyzq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tmb4_TwAgsV_ypa1712Atw_8T9sHw18';

// Initialisation du client Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variable globale pour l'utilisateur connecté
let currentUser = null;

// Écouter les changements d'état d'authentification
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event);

  if (session?.user) {
    currentUser = session.user;
    updateAuthUI(true);

    // Sync au login
    if (event === 'SIGNED_IN') {
      syncUserData();
    }
  } else {
    currentUser = null;
    updateAuthUI(false);
  }
});

// Vérifier la session au chargement
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    updateAuthUI(true);
  }
}

// Appeler au chargement de la page
document.addEventListener('DOMContentLoaded', checkAuth);
