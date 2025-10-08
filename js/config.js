// Firebase Configuration
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCg3TOQ1vfqcZ1UTXK3NCMbsjf4_z9zvFc",
    authDomain: "registroore-963c6.firebaseapp.com",
    projectId: "registroore-963c6",
    storageBucket: "registroore-963c6.appspot.com",
    messagingSenderId: "413364101167",
    appId: "1:413364101167:web:a83f8023868a717a5fe6da",
    measurementId: "G-J9SX458Z83"
};

// Initialize Firebase
let db = null;
let storage = null;

function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        db = firebase.firestore();
        storage = firebase.storage();
        console.log('✅ Firebase inizializzato con successo');
        return { db, storage };
    } catch (error) {
        console.error('❌ Errore inizializzazione Firebase:', error);
        return { db: null, storage: null };
    }
}
