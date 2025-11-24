// Firebase Configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBFxjiGpmD9bjzaXQ4hp7Do9C0_Gp1fOoA",
  authDomain: "reportorefacchinispark.firebaseapp.com",
  projectId: "reportorefacchinispark",
  storageBucket: "reportorefacchinispark.firebasestorage.app",
  messagingSenderId: "630520690479",
  appId: "1:630520690479:web:f2a3e8e5a9604b93fed3da",
  measurementId: "G-TQKXJR4TML"
};

// Initialize Firebase
let db = null;
let storage = null;

// Optional: Google Geocoding API key. If you have a Google Maps Geocoding key,
// paste it here (do NOT commit secrets to version control).
// Example: const GOOGLE_GEOCODING_KEY = 'AIza...';
const GOOGLE_GEOCODING_KEY = 'gzHZD0ATlItrSQNMnTdihgzBFTb6FwSs';

// Optional: Tomorrow.io API key (weather). If you have a Tomorrow.io API key,
// paste it here. The widget will use it for weather lookups when present.
// Example: const TOMORROW_API_KEY = 'gzHZD0ATlItrSQNMnTdihgzBFTb6FwSs';
const TOMORROW_API_KEY = 'gzHZD0ATlItrSQNMnTdihgzBFTb6FwSs';

// 📧 EmailJS Configuration - Password Recovery System
const EMAILJS_CONFIG = {
    serviceId: 'service_1jhq7ri',
    templateId: 'template_711ldjo', // Password reset template
    welcomeTemplateId: 'template_0f4xhjf', // Welcome email template
    publicKey: 'CKA097p1d3E1X6HqH',
    // Token expiry time in hours
    tokenExpiryHours: 24
};

function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        db = firebase.firestore();
        
        // 🚀 OTTIMIZZAZIONE: Abilita cache persistente offline per ridurre letture Firestore
        // La cache locale permette di leggere dati già caricati senza query a Firestore
        // Riduzione stimata letture: -60%
        db.enablePersistence({ synchronizeTabs: true })
            .then(() => console.log('✅ Cache Firestore persistente abilitata (-60% letture)'))
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Cache persistente: multiple tabs aperte, cache solo su tab principale');
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ Cache persistente non supportata su questo browser');
                } else {
                    console.warn('⚠️ Errore cache persistente:', err);
                }
            });
        
        storage = firebase.storage();
        console.log('✅ Firebase inizializzato con successo');
        return { db, storage };
    } catch (error) {
        console.error('❌ Errore inizializzazione Firebase:', error);
        return { db: null, storage: null };
    }
}
