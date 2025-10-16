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
