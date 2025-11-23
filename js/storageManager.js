/**
 * Storage Manager - Gestione Upload/Download Documenti & Avatar
 * Sistema con limiti granulari per ruolo e visualizzazione storage utilizzato
 */

// Getter per Firebase (lazy loading per evitare errori di inizializzazione)
const getDb = () => window.db || firebase.firestore();
const getStorage = () => window.storage || firebase.storage();

// ========================================
// CONFIGURAZIONE LIMITI
// ========================================

const STORAGE_LIMITS = {
  admin: {
    maxPerPeriod: Infinity,
    periodDays: 0,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxTotalStorage: Infinity,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  },
  datore: {
    maxPerPeriod: 30,
    periodDays: 30,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxTotalStorage: 150 * 1024 * 1024, // 150MB (30 files × 5MB)
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  },
  manager: {
    maxPerPeriod: 10,
    periodDays: 15,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxTotalStorage: 50 * 1024 * 1024, // 50MB (10 files × 5MB)
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  },
  worker: {
    maxPerPeriod: 10,
    periodDays: 30,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxTotalStorage: 50 * 1024 * 1024, // 50MB (10 files × 5MB)
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
  }
};

const AVATAR_LIMITS = {
  maxSize: 2 * 1024 * 1024, // 2MB
  changeCooldownDays: 15, // Admin: 0, Altri: 15
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png']
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Ottieni limiti in base al ruolo
 */
function getUploadLimits(role) {
  return STORAGE_LIMITS[role] || STORAGE_LIMITS.worker;
}

/**
 * Formatta bytes in formato leggibile
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (bytes === Infinity) return '∞';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calcola storage totale utilizzato da un utente
 */
async function calculateUserStorage(userId) {
  try {
    const userDoc = await getDb().collection('users').doc(userId).get();
    const user = userDoc.data();
    
    if (!user || !user.documenti) {
      return { totalBytes: 0, totalFiles: 0, documents: [] };
    }
    
    const totalBytes = user.documenti.reduce((sum, doc) => sum + (doc.size || 0), 0);
    const totalFiles = user.documenti.length;
    
    return {
      totalBytes,
      totalFiles,
      totalFormatted: formatBytes(totalBytes),
      documents: user.documenti
    };
  } catch (error) {
    console.error('Errore calcolo storage:', error);
    return { totalBytes: 0, totalFiles: 0, documents: [] };
  }
}

/**
 * Controlla se utente può caricare documento
 */
async function canUploadDocument(userId) {
  try {
    const userDoc = await getDb().collection('users').doc(userId).get();
    const user = userDoc.data();
    
    // Admin può sempre
    if (user.role === 'admin') {
      return { 
        canUpload: true, 
        remaining: Infinity,
        reason: 'admin'
      };
    }
    
    const limits = getUploadLimits(user.role);
    const uploads = user.documentUploads || { currentPeriodUploads: 0, currentPeriodStart: Date.now() };
    
    // Controlla se periodo è scaduto → reset
    const now = Date.now();
    const periodStart = uploads.currentPeriodStart || now;
    const daysPassed = (now - periodStart) / (1000 * 60 * 60 * 24);
    
    if (daysPassed >= limits.periodDays) {
      // Reset periodo
      await getDb().collection('users').doc(userId).update({
        'documentUploads.currentPeriodStart': firebase.firestore.FieldValue.serverTimestamp(),
        'documentUploads.currentPeriodUploads': 0
      });
      
      return { 
        canUpload: true, 
        remaining: limits.maxPerPeriod,
        daysUntilReset: limits.periodDays,
        reason: 'period_reset'
      };
    }
    
    // Controlla limite upload periodo
    const remaining = limits.maxPerPeriod - (uploads.currentPeriodUploads || 0);
    
    if (remaining <= 0) {
      return {
        canUpload: false,
        remaining: 0,
        daysUntilReset: Math.ceil(limits.periodDays - daysPassed),
        reason: 'limit_reached'
      };
    }
    
    // Controlla storage totale
    const storage = await calculateUserStorage(userId);
    if (storage.totalBytes >= limits.maxTotalStorage) {
      return {
        canUpload: false,
        remaining,
        daysUntilReset: Math.ceil(limits.periodDays - daysPassed),
        reason: 'storage_full',
        storageUsed: storage.totalFormatted,
        storageLimit: formatBytes(limits.maxTotalStorage)
      };
    }
    
    return { 
      canUpload: true, 
      remaining,
      daysUntilReset: Math.ceil(limits.periodDays - daysPassed),
      reason: 'ok'
    };
    
  } catch (error) {
    console.error('Errore controllo limiti:', error);
    return { 
      canUpload: false, 
      remaining: 0,
      reason: 'error',
      error: error.message
    };
  }
}

/**
 * Valida file prima dell'upload
 */
function validateFile(file, role) {
  const limits = getUploadLimits(role);
  const errors = [];
  
  // Controlla dimensione
  if (file.size > limits.maxFileSize) {
    errors.push(`File troppo grande. Max: ${formatBytes(limits.maxFileSize)}`);
  }
  
  // Controlla tipo
  if (!limits.allowedTypes.includes(file.type)) {
    errors.push('Formato non supportato. Usa: PDF, JPG, PNG');
  }
  
  // Controlla nome
  if (file.name.length > 100) {
    errors.push('Nome file troppo lungo (max 100 caratteri)');
  }
  
  // Controlla caratteri speciali nel nome
  if (!/^[a-zA-Z0-9._-]+$/.test(file.name.replace(/\.[^.]+$/, ''))) {
    errors.push('Nome file contiene caratteri non validi. Usa solo lettere, numeri, - e _');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Incrementa contatore upload
 */
async function incrementUploadCounter(userId, uploadedByAdmin = false) {
  // Se caricato da admin per l'utente, non conta nel limite
  if (uploadedByAdmin) {
    console.log('Upload da admin, non conta nel limite');
    return;
  }
  
  try {
    await getDb().collection('users').doc(userId).update({
      'documentUploads.currentPeriodUploads': firebase.firestore.FieldValue.increment(1),
      'documentUploads.totalUploads': firebase.firestore.FieldValue.increment(1),
      'documentUploads.lastUploadAt': firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Errore incremento contatore:', error);
  }
}

/**
 * Controlla se utente può cambiare avatar
 */
async function canChangeAvatar(userId) {
  try {
    // Admin system (adminAuth) può sempre - non ha documento Firestore
    if (userId === 'admin') {
      return { canChange: true, reason: 'admin-system' };
    }
    
    const userDoc = await getDb().collection('users').doc(userId).get();
    
    // Se utente non esiste in Firestore, blocca per sicurezza
    if (!userDoc.exists) {
      console.warn(`⚠️ Utente ${userId} non trovato in Firestore`);
      return { canChange: false, reason: 'user-not-found' };
    }
    
    const user = userDoc.data();
    
    // Admin può sempre
    if (user.role === 'admin' || user.role === 'manager') {
      return { canChange: true, reason: 'admin' };
    }
    
    const lastUpdate = user.avatarLastUpdate?.toMillis() || 0;
    const now = Date.now();
    const daysPassed = (now - lastUpdate) / (1000 * 60 * 60 * 24);
    
    if (daysPassed < AVATAR_LIMITS.changeCooldownDays) {
      const daysRemaining = Math.ceil(AVATAR_LIMITS.changeCooldownDays - daysPassed);
      return {
        canChange: false,
        reason: 'cooldown',
        daysRemaining
      };
    }
    
    return { canChange: true, reason: 'ok' };
    
  } catch (error) {
    console.error('Errore controllo avatar:', error);
    return { canChange: false, reason: 'error', error: error.message };
  }
}

/**
 * Upload documento
 */
async function uploadDocument(userId, file, uploadedBy, onProgress) {
  try {
    // 1. Valida file
    const user = await getDb().collection('users').doc(userId).get();
    const validation = validateFile(file, user.data().role);
    
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    // 2. Controlla limiti
    const uploadedByAdmin = uploadedBy !== userId;
    
    if (!uploadedByAdmin) {
      const limits = await canUploadDocument(userId);
      if (!limits.canUpload) {
        if (limits.reason === 'limit_reached') {
          throw new Error(`Limite upload raggiunto! Reset tra ${limits.daysUntilReset} giorni.`);
        } else if (limits.reason === 'storage_full') {
          throw new Error(`Storage pieno! Usati ${limits.storageUsed} di ${limits.storageLimit}. Elimina alcuni file.`);
        }
      }
    }
    
    // 3. Upload su Storage
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `documenti/${userId}/${timestamp}_${sanitizedName}`;
    const storageRef = firebase.storage().ref(path);
    const uploadTask = storageRef.put(file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          try {
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
            
            // 4. Salva in Firestore
            const docData = {
              nome: file.name,
              url: downloadURL,
              path: path,
              type: file.type,
              size: file.size,
              uploadedAt: new Date().toISOString(),
              uploadedBy: uploadedBy,
              countsTowardsLimit: !uploadedByAdmin
            };
            
            await getDb().collection('users').doc(userId).update({
              documenti: firebase.firestore.FieldValue.arrayUnion(docData)
            });
            
            // 5. Incrementa contatore
            await incrementUploadCounter(userId, uploadedByAdmin);
            
            resolve({ success: true, url: downloadURL, document: docData });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
    
  } catch (error) {
    console.error('Errore upload documento:', error);
    throw error;
  }
}

/**
 * Elimina documento
 */
async function deleteDocument(userId, documentPath, documentData) {
  try {
    // 1. Elimina da Storage
    await firebase.storage().ref(documentPath).delete();
    
    // 2. Rimuovi da Firestore
    await getDb().collection('users').doc(userId).update({
      documenti: firebase.firestore.FieldValue.arrayRemove(documentData)
    });
    
    // 3. Decrementa contatore se contava nel limite
    if (documentData.countsTowardsLimit) {
      await getDb().collection('users').doc(userId).update({
        'documentUploads.currentPeriodUploads': firebase.firestore.FieldValue.increment(-1),
        'documentUploads.totalUploads': firebase.firestore.FieldValue.increment(-1)
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Errore eliminazione documento:', error);
    throw error;
  }
}

/**
 * Upload avatar
 * @param {string} userId - ID dell'utente target
 * @param {File} file - File immagine da caricare
 * @param {function} onProgress - Callback per progresso upload
 * @param {string} uploadedByUserId - ID dell'utente che esegue l'upload (opzionale)
 */
async function uploadAvatar(userId, file, onProgress, uploadedByUserId = null) {
  try {
    // 1. Valida formato
    if (!AVATAR_LIMITS.allowedTypes.includes(file.type)) {
      throw new Error('Formato avatar non valido. Usa JPG o PNG');
    }
    
    if (file.size > AVATAR_LIMITS.maxSize) {
      throw new Error(`Avatar troppo grande. Max ${formatBytes(AVATAR_LIMITS.maxSize)}`);
    }
    
    // 2. Controlla cooldown (solo se non admin/manager che modifica SE STESSO o altro utente)
    // Se un admin/manager modifica l'avatar di un altro utente, BYPASS del cooldown
    
    // Admin system (adminAuth) può sempre
    if (userId === 'admin' || uploadedByUserId === 'admin') {
      console.log('✅ Admin system - bypass completo controlli avatar');
      // Continua senza check
    } else {
      const user = await getDb().collection('users').doc(userId).get();
      const userRole = user.exists ? user.data()?.role : null;
      
      // Determina chi sta facendo l'upload
      const isUploadedByAdmin = uploadedByUserId && uploadedByUserId !== userId;
      let uploaderRole = null;
      
      if (isUploadedByAdmin) {
        const uploaderDoc = await getDb().collection('users').doc(uploadedByUserId).get();
        uploaderRole = uploaderDoc.exists ? uploaderDoc.data()?.role : null;
      }
      
      // Admin o manager che modificano altri utenti: BYPASS completo del cooldown
      const isSelfEdit = !uploadedByUserId || uploadedByUserId === userId;
      const isAdminEdit = uploaderRole === 'admin' || uploaderRole === 'manager';
      
      // Applica cooldown solo se:
      // 1. È un self-edit (utente modifica se stesso)
      // 2. E l'utente non è admin/manager
      // 3. E l'utente esiste in Firestore
      if (isSelfEdit && userRole !== 'admin' && userRole !== 'manager') {
        const check = await canChangeAvatar(userId);
        if (!check.canChange) {
          throw new Error(`Puoi cambiare avatar tra ${check.daysRemaining} giorni`);
        }
      }
      // Se è un admin che modifica un altro utente, nessun check
    }
    
    // 3. Upload
    const path = `avatars/${userId}/avatar_${Date.now()}.${file.type.split('/')[1]}`;
    const storageRef = firebase.storage().ref(path);
    const uploadTask = storageRef.put(file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          try {
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
            
            // 4. Aggiorna Firestore
            // Admin system (adminAuth) salva in settings/adminAuth invece di users/admin
            if (userId === 'admin') {
              // Usa set con merge per creare il documento se non esiste
              await getDb().collection('settings').doc('adminAuth').set({
                avatarURL: downloadURL,
                avatarPath: path,
                avatarLastUpdate: firebase.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
            } else {
              // Utenti normali salvano in users/{userId}
              await getDb().collection('users').doc(userId).update({
                avatarURL: downloadURL,  // Campo principale
                avatarUrl: downloadURL,   // Backward compatibility
                avatarPath: path,
                avatarLastUpdate: firebase.firestore.FieldValue.serverTimestamp()
              });
            }
            
            resolve({ success: true, url: downloadURL });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
    
  } catch (error) {
    console.error('Errore upload avatar:', error);
    throw error;
  }
}

/**
 * Lista tutti i documenti di un utente
 */
async function listUserDocuments(userId) {
  try {
    const userDoc = await getDb().collection('users').doc(userId).get();
    if (!userDoc.exists) return [];
    
    const user = userDoc.data();
    return user.documenti || [];
  } catch (error) {
    console.error('Errore lista documenti:', error);
    return [];
  }
}

/**
 * Ottieni URL di download per un documento
 */
async function getDocumentURL(userId, fileName) {
  try {
    const storageRef = getStorage().ref();
    const fileRef = storageRef.child(`documenti/${userId}/${fileName}`);
    const url = await fileRef.getDownloadURL();
    return url;
  } catch (error) {
    console.error('Errore URL documento:', error);
    throw error;
  }
}

// Esporta funzioni
window.StorageManager = {
  getUploadLimits,
  formatBytes,
  calculateUserStorage,
  canUploadDocument,
  canChangeAvatar,
  validateFile,
  uploadDocument,
  deleteDocument,
  uploadAvatar,
  listUserDocuments,
  getDocumentURL,
  STORAGE_LIMITS,
  AVATAR_LIMITS
};
