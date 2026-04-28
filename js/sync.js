// ===== SYNCHRONISATION SUPABASE =====

// Queue de synchronisation avec debounce
let syncQueue = {};
let syncTimeout = null;
const SYNC_DEBOUNCE = 2000; // 2 secondes

// ===== RÉCUPÉRATION DES DONNÉES LOCALES =====

function getLocalUserData() {
  return {
    favoris: JSON.parse(localStorage.getItem('mangaFavoris') || '[]'),
    aLire: JSON.parse(localStorage.getItem('mangaALire') || '[]'),
    customLists: JSON.parse(localStorage.getItem('mangaCustomLists') || '{}'),
    userRatings: JSON.parse(localStorage.getItem('mangaUserRatings') || '{}'),
    notes: JSON.parse(localStorage.getItem('mangaNotes') || '{}'),
    historique: JSON.parse(localStorage.getItem('mangaHistorique') || '[]'),
    visitDays: JSON.parse(localStorage.getItem('mangaVisitDays') || '[]'),
    readTomes: JSON.parse(localStorage.getItem('mangaReadTomes') || '{}'),
    preferences: {
      theme: localStorage.getItem('theme') || 'dark',
      colorTheme: localStorage.getItem('colorTheme') || 'red',
      lang: localStorage.getItem('lang') || 'fr',
      viewMode: localStorage.getItem('viewMode') || 'grid',
      cardSize: localStorage.getItem('cardSize') || 'medium'
    }
  };
}

function saveLocalUserData(data) {
  if (data.favoris) localStorage.setItem('mangaFavoris', JSON.stringify(data.favoris));
  if (data.aLire) localStorage.setItem('mangaALire', JSON.stringify(data.aLire));
  if (data.customLists) localStorage.setItem('mangaCustomLists', JSON.stringify(data.customLists));
  if (data.userRatings) localStorage.setItem('mangaUserRatings', JSON.stringify(data.userRatings));
  if (data.notes) localStorage.setItem('mangaNotes', JSON.stringify(data.notes));
  if (data.historique) localStorage.setItem('mangaHistorique', JSON.stringify(data.historique));
  if (data.visitDays) localStorage.setItem('mangaVisitDays', JSON.stringify(data.visitDays));
  if (data.readTomes) localStorage.setItem('mangaReadTomes', JSON.stringify(data.readTomes));
}

// ===== SYNCHRONISATION CLOUD =====

async function getCloudUserData(userId) {
  try {
    const { data, error } = await supabaseClient
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return data?.data || null;
  } catch (error) {
    console.error('Error fetching cloud data:', error);
    return null;
  }
}

async function saveCloudUserData(userId, userData) {
  try {
    const { error } = await supabaseClient
      .from('user_data')
      .upsert({
        user_id: userId,
        data: userData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving cloud data:', error);
    return false;
  }
}

// ===== FUSION DES DONNÉES =====

function mergeArrays(local, cloud) {
  return [...new Set([...(local || []), ...(cloud || [])])];
}

function mergeObjects(local, cloud) {
  return { ...(cloud || {}), ...(local || {}) };
}

// Pour readTomes : { mangaId: [num1, num2,...] } → union par manga
function mergeReadTomes(local, cloud) {
  const out = { ...(cloud || {}) };
  for (const [k, arr] of Object.entries(local || {})) {
    out[k] = [...new Set([...(out[k] || []), ...(arr || [])])].sort((a, b) => a - b);
  }
  return out;
}

function mergeUserData(localData, cloudData) {
  if (!cloudData) return localData;
  if (!localData) return cloudData;

  return {
    // Arrays : union sans doublons
    favoris: mergeArrays(localData.favoris, cloudData.favoris),
    aLire: mergeArrays(localData.aLire, cloudData.aLire),
    historique: mergeArrays(localData.historique, cloudData.historique).slice(0, 20),
    visitDays: mergeArrays(localData.visitDays, cloudData.visitDays),

    // Objects : merge (local prioritaire)
    customLists: mergeObjects(localData.customLists, cloudData.customLists),
    userRatings: mergeObjects(localData.userRatings, cloudData.userRatings),
    notes: mergeObjects(localData.notes, cloudData.notes),
    readTomes: mergeReadTomes(localData.readTomes, cloudData.readTomes),

    // Préférences : local prioritaire
    preferences: localData.preferences || cloudData.preferences
  };
}

// ===== SYNC PRINCIPAL =====

async function syncUserData() {
  if (!currentUser) return;

  try {
    updateSyncStatus('syncing');

    // Récupérer les données locales et cloud
    const localData = getLocalUserData();
    const cloudData = await getCloudUserData(currentUser.id);

    // Fusionner les données
    const mergedData = mergeUserData(localData, cloudData);

    // Sauvegarder partout
    saveLocalUserData(mergedData);
    await saveCloudUserData(currentUser.id, mergedData);

    updateSyncStatus('synced');
    console.log('Sync completed successfully');

    // Rafraîchir l'affichage si nécessaire
    if (typeof afficherMangas === 'function') {
      afficherMangas(mangas);
    }

  } catch (error) {
    console.error('Sync error:', error);
    updateSyncStatus('error');
  }
}

// ===== SYNC INCRÉMENTAL (TEMPS RÉEL) =====

function queueSync(field, value) {
  if (!currentUser) return;

  syncQueue[field] = value;

  // Debounce
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(processSyncQueue, SYNC_DEBOUNCE);
}

async function processSyncQueue() {
  if (!currentUser || Object.keys(syncQueue).length === 0) return;

  if (!navigator.onLine) {
    // Stocker pour sync ultérieur
    localStorage.setItem('pendingSync', JSON.stringify(syncQueue));
    updateSyncStatus('offline');
    return;
  }

  try {
    updateSyncStatus('syncing');

    // Récupérer les données actuelles du cloud
    const cloudData = await getCloudUserData(currentUser.id) || {};

    // Appliquer les modifications
    const updatedData = { ...cloudData };
    Object.keys(syncQueue).forEach(field => {
      updatedData[field] = syncQueue[field];
    });

    // Sauvegarder
    await saveCloudUserData(currentUser.id, updatedData);

    syncQueue = {};
    updateSyncStatus('synced');

  } catch (error) {
    console.error('Queue sync error:', error);
    updateSyncStatus('error');
  }
}

// ===== GESTION HORS-LIGNE =====

window.addEventListener('online', async () => {
  if (currentUser) {
    // Sync les données en attente
    const pending = localStorage.getItem('pendingSync');
    if (pending) {
      syncQueue = JSON.parse(pending);
      await processSyncQueue();
      localStorage.removeItem('pendingSync');
    } else {
      await syncUserData();
    }
  }
});

window.addEventListener('offline', () => {
  updateSyncStatus('offline');
});

// ===== FONCTIONS HELPER POUR L'APP =====

// Wrapper pour sauvegarder les favoris avec sync
function saveFavorisWithSync(favoris) {
  localStorage.setItem('mangaFavoris', JSON.stringify(favoris));
  queueSync('favoris', favoris);
}

// Wrapper pour sauvegarder la liste à lire avec sync
function saveALireWithSync(aLire) {
  localStorage.setItem('mangaALire', JSON.stringify(aLire));
  queueSync('aLire', aLire);
}

// Wrapper pour sauvegarder les listes custom avec sync
function saveCustomListsWithSync(customLists) {
  localStorage.setItem('mangaCustomLists', JSON.stringify(customLists));
  queueSync('customLists', customLists);
}

// Wrapper pour sauvegarder les ratings avec sync
function saveUserRatingsWithSync(ratings) {
  localStorage.setItem('mangaUserRatings', JSON.stringify(ratings));
  queueSync('userRatings', ratings);
}

// Wrapper pour sauvegarder les notes avec sync
function saveNotesWithSync(notes) {
  localStorage.setItem('mangaNotes', JSON.stringify(notes));
  queueSync('notes', notes);
}

// Wrapper pour sauvegarder l'historique avec sync
function saveHistoriqueWithSync(historique) {
  localStorage.setItem('mangaHistorique', JSON.stringify(historique));
  queueSync('historique', historique);
}

// Wrapper pour sauvegarder les tomes lus avec sync
function saveReadTomesWithSync(readTomes) {
  localStorage.setItem('mangaReadTomes', JSON.stringify(readTomes));
  queueSync('readTomes', readTomes);
}

// Forcer la synchronisation manuelle
async function forcerSync() {
  if (!currentUser) {
    showToast(getAuthText('signIn'));
    return;
  }
  await syncUserData();
  showToast(getAuthText('synced'));
}
