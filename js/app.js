// Main App Component - 5 LINGUE COMPLETE + SETTINGS + v4.3.5 PROFILE CAPITALIZED
// Se usi <script type="text/babel">, importa React e gli hook globalmente
const { useState, useEffect, useCallback } = React;

console.log('✅ App.js v4.3.5 loaded - Profile capitalized');

const App = () => {
    // 🔒 UNIFIED LOGIN SYSTEM - Admin/Manager/Datore/Worker
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // { id, email, role, firstName, lastName, ... }
    const [loginMode, setLoginMode] = useState('admin'); // 'admin' or 'user'
    const [emailInput, setEmailInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [rememberMe, setRememberMe] = useState(true); // ✅ Ricordami checkbox (default true)
    const [showPassword, setShowPassword] = useState(false); // 👁️ Toggle visibilità password
    const [showPasswordError, setShowPasswordError] = useState(false);
    const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedWorkerName, setSelectedWorkerName] = useState(null); // Nome del lavoratore
    const [securityAnswers, setSecurityAnswers] = useState({ answer1: '', answer2: '' });
    
    // 🔍 DEBUG: Esponi currentUser globalmente per test console
    useEffect(() => {
        window.__DEBUG_currentUser = currentUser;
        window.__setCurrentUser = setCurrentUser; // ✅ Esponi setter per PermanentUserProfile
        
        if (currentUser) {
            console.log('👤 Current User Updated:', {
                id: currentUser.id,
                email: currentUser.email,
                role: currentUser.role,
                hasPermissions: !!currentUser.permissions,
                permissionsCount: currentUser.permissions ? Object.keys(currentUser.permissions).length : 0
            });
        }
    }, [currentUser]);
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [recoveryError, setRecoveryError] = useState('');
    const [adminPasswordHash, setAdminPasswordHash] = useState(null); // Caricato da Firebase invece di hardcoded
    const [recoveryData, setRecoveryData] = useState(null); // Domande di sicurezza caricate da Firebase
    const [loadingRecovery, setLoadingRecovery] = useState(true); // Loading per recupero password
    
    // ⚠️ DEPRECATO: Questo hash non viene più usato, viene caricato da Firebase
    // const ADMIN_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // "admin123"
    
    // Importa RadioPlayer dal global scope se usi <script type="text/babel">
    // Assicurati che js/components/RadioPlayer.js sia incluso in index.html prima di app.js
    // Tutto il codice React qui dentro
    const [currentSheet, setCurrentSheet] = useState(null);
    const [companyLogo, setCompanyLogo] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false); // Menu "Altro" mobile
    // Stati principali mancanti
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState('it');

    // Wrapper to synchronize React state and the runtime i18n helper.
    const setAppLanguage = (lang) => {
        try {
            setLanguage(lang);
            if (typeof window !== 'undefined' && typeof window.setLanguage === 'function') {
                window.setLanguage(lang);
            }
        } catch (e) { console.warn('setAppLanguage error', e); }
    };
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('admin');
    const [sheetId, setSheetId] = useState(null);
    const [db, setDb] = useState(null);
    const [storage, setStorage] = useState(null);
    const [appSettings, setAppSettings] = useState({ 
        weekStart: 1, 
        expirationDays: 1,
        tipiAttivita: [
            { id: '1', nome: 'Magazzino', emoji: '🏢', colore: '#3B82F6' },
            { id: '2', nome: 'Evento', emoji: '🎉', colore: '#10B981' },
            { id: '3', nome: 'Trasloco', emoji: '🚚', colore: '#F59E0B' },
            { id: '4', nome: 'Inventario', emoji: '📦', colore: '#8B5CF6' }
        ],
        companies: [],
        addresses: []
    });
    const [sheets, setSheets] = useState([]);
    const [blacklist, setBlacklist] = useState([]);
    const [auditLog, setAuditLog] = useState([]);
    const [users, setUsers] = useState([]); // Lista utenti da Gestione Utenti
    
    // Multi-Company Logo System
    const [companies, setCompanies] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState(null);
    
    const [currentView, setCurrentView] = useState(null); // ✅ Inizia null, sarà impostato in base ai permessi
    const [workerView, setWorkerView] = useState('dashboard'); // 'dashboard' or 'profile' (for worker interface)
    const [autoArchiveDay, setAutoArchiveDay] = useState(5); // Day of month to auto-archive

    // ✅ HELPER: Determina la prima vista disponibile in base ai permessi dell'utente
    const getFirstAvailableView = (user) => {
        if (!user) return 'dashboard';
        
        const availableViews = [
            { view: 'dashboard', feature: 'dashboard.view' },
            { view: 'list', feature: 'sheets.view' },
            { view: 'calendar', feature: 'calendar.view' },
            { view: 'workerstats', feature: 'onCall.view' },
            { view: 'users', feature: 'users.view' },
            { view: 'blacklist', feature: 'blacklist.view' },
            { view: 'reports', feature: 'reports.view' },
            { view: 'settings', feature: 'settings.view' },
            { view: 'Profile', feature: 'profile.viewOwn' }
        ];
        
        for (const item of availableViews) {
            if (window.hasRoleAccess(user, item.feature)) {
                return item.view;
            }
        }
        
        return 'Profile'; // Fallback: profilo sempre visibile
    };

    // Initialize Firebase
    useEffect(() => {
        const { db: firebaseDb, storage: firebaseStorage } = initializeFirebase();
        setDb(firebaseDb);
        setStorage(firebaseStorage);
        
        // Load preferences
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        const savedLanguage = localStorage.getItem('language') || 'it';
        const savedLogo = localStorage.getItem('companyLogo');
        const savedAutoArchiveDay = parseInt(localStorage.getItem('autoArchiveDay')) || 5;
        
        setDarkMode(savedDarkMode);
        setAppLanguage(savedLanguage);
        setAutoArchiveDay(savedAutoArchiveDay);
        if (savedLogo) setCompanyLogo(savedLogo);

        // ✅ Carica password admin in chiaro da Firebase
        if (firebaseDb) {
            firebaseDb.collection('settings').doc('adminAuth').get()
                .then(doc => {
                    if (doc.exists && doc.data().password) {
                        setAdminPasswordHash(doc.data().password);
                        console.log('✅ Password admin caricata da Firebase');
                    } else {
                        // Prima installazione - usa password default e salvala
                        const defaultPassword = 'admin123';
                        setAdminPasswordHash(defaultPassword);
                        firebaseDb.collection('settings').doc('adminAuth').set({
                            password: defaultPassword,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            note: 'Password default: admin123 - CAMBIARLA SUBITO!'
                        }, { merge: true });
                        console.log('⚠️ Password default impostata - CAMBIARLA SUBITO!');
                    }
                })
                .catch(err => {
                    console.error('Errore caricamento password:', err);
                    // Fallback a password default
                    setAdminPasswordHash('admin123');
                });
        }
        
        // Check URL params for worker mode
        const params = new URLSearchParams(window.location.search);
        const urlMode = params.get('mode');
        const urlSheet = params.get('sheet');
        
        console.log('🔍 URL Params:', { urlMode, urlSheet });
        console.log('📍 Current URL:', window.location.href);
        
        if (urlMode === 'worker' && urlSheet) {
            console.log('✅ Worker mode detected! Sheet ID:', urlSheet);
            setMode('worker');
            setSheetId(urlSheet);
            setIsAuthenticated(true); // Worker mode non richiede password
        } else {
            console.log('👤 Verifica sessione salvata...');
            
            // Check for saved user session (workers/datore/manager) - localStorage OR sessionStorage
            const savedUserSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
            if (savedUserSession) {
                try {
                    const { userId, role, timestamp } = JSON.parse(savedUserSession);
                    const now = Date.now();
                    const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 giorni invece di 24 ore
                    
                    if (now - timestamp < thirtyDays) {
                        // Reload user data from Firestore
                        db.collection('users').doc(userId).get()
                            .then(doc => {
                                if (doc.exists) {
                                    const userData = doc.data();
                                    
                                    // Check if still suspended
                                    if (userData.suspended) {
                                        console.log('⚠️ Sessione utente sospesa:', userId);
                                        localStorage.removeItem('userSession');
                                        return;
                                    }
                                    
                                    const user = { id: userId, ...userData };
                                    
                                    // ✅ BLOCCA WORKER-LINK dall'accesso all'app
                                    if (user.role === 'worker-link') {
                                        console.warn('🚫 Worker-link non può accedere all\'app, solo al form');
                                        localStorage.removeItem('userSession');
                                        setLoginError('Account worker-link può solo compilare il form, non accedere all\'app');
                                        return;
                                    }
                                    
                                    // ✅ Sistema basato su ruoli - nessuna generazione di permessi necessaria
                                    console.log(`✅ Utente caricato: ${user.email} (ruolo: ${user.role})`);
                                    
                                    setCurrentUser(user);
                                    setIsAuthenticated(true);
                                    
                                    // ✅ Auto-redirect alla prima sezione con permessi
                                    const firstAvailableView = getFirstAvailableView(user);
                                    setCurrentView(firstAvailableView);
                                    
                                    console.log('✅ Sessione utente ripristinata:', role);
                                    console.log('🔍 DEBUG USER DATA:', { id: userId, role: userData.role, email: userData.email });
                                } else {
                                    localStorage.removeItem('userSession');
                                }
                            })
                            .catch(err => {
                                console.error('❌ Errore ripristino sessione utente:', err);
                                localStorage.removeItem('userSession');
                            });
                    } else {
                        localStorage.removeItem('userSession');
                        console.log('⏰ Sessione utente scaduta (30 giorni)');
                    }
                } catch (e) {
                    localStorage.removeItem('userSession');
                }
            }
            
            // Check for admin session (fallback) - localStorage OR sessionStorage
            const savedAuth = localStorage.getItem('adminAuth') || sessionStorage.getItem('adminAuth');
            if (savedAuth && !savedUserSession) {
                try {
                    const { timestamp } = JSON.parse(savedAuth);
                    const now = Date.now();
                    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                    if (now - timestamp < thirtyDays) {
                        // ✅ Admin legacy - solo ruolo, nessun permesso
                        const adminUser = {
                            role: 'admin',
                            id: 'admin',
                            email: 'admin@reportore.app',
                            firstName: 'Admin',
                            lastName: 'System'
                        };
                        setCurrentUser(adminUser);
                        setIsAuthenticated(true);
                        setCurrentView('dashboard');
                        console.log('✅ Sessione admin ripristinata (role-based)');
                    } else {
                        localStorage.removeItem('adminAuth');
                        console.log('⏰ Sessione admin scaduta (30 giorni)');
                    }
                } catch (e) {
                    localStorage.removeItem('adminAuth');
                }
            }
        }
        
        setLoading(false);
    }, []);

    // � Carica domande di sicurezza per recupero password
    useEffect(() => {
        if (!db || !showPasswordRecovery) return;
        
        setLoadingRecovery(true);
        db.collection('settings').doc('securityQuestions').get()
            .then(doc => {
                if (doc.exists) {
                    setRecoveryData(doc.data());
                }
                setLoadingRecovery(false);
            })
            .catch(() => setLoadingRecovery(false));
    }, [db, showPasswordRecovery]);

    // 🔒 UNIFIED LOGIN SYSTEM - Auto-detect Admin/Manager/Datore/Worker
    const handleUnifiedLogin = async () => {
        if (!passwordInput) {
            setShowPasswordError(true);
            setTimeout(() => setShowPasswordError(false), 3000);
            return;
        }

        try {
            // STRATEGIA AUTO-DETECT:
            // 1. Se c'è email → Cerca utente in Firestore (manager/datore/worker)
            // 2. Se NO email → Prova admin password hash
            
            if (emailInput && emailInput.trim()) {
                // MODE 1: User Login (email + password) → Worker/Datore/Manager
                const email = emailInput.toLowerCase().trim();
                
                // Query Firestore users collection
                const usersSnapshot = await db.collection('users')
                    .where('email', '==', email)
                    .get();
                
                if (usersSnapshot.empty) {
                    setShowPasswordError(true);
                    setTimeout(() => setShowPasswordError(false), 3000);
                    console.log('❌ Email non trovata:', email);
                    return;
                }
                
                const userDoc = usersSnapshot.docs[0];
                const userData = userDoc.data();
                
                // Verifica password in chiaro (semplice confronto stringhe)
                const passwordMatch = passwordInput === userData.password;
                
                if (!passwordMatch) {
                    setShowPasswordError(true);
                    setTimeout(() => setShowPasswordError(false), 3000);
                    console.log('❌ Password errata per:', email);
                    return;
                }
                
                // Check suspension status
                if (userData.suspended) {
                    alert(`🚫 Account sospeso\n\nMotivo: ${userData.suspensionReason || 'Non specificato'}\nData: ${userData.suspendedAt ? new Date(userData.suspendedAt.toDate()).toLocaleDateString('it-IT') : 'N/A'}`);
                    console.log('🚫 Account sospeso:', email);
                    return;
                }
                
                // Success! Set user session
                const user = {
                    id: userDoc.id,
                    ...userData
                };
                
                // ✅ BLOCCA WORKER-LINK dall'accesso all'app
                if (user.role === 'worker-link') {
                    setLoginError('Account worker-link può solo compilare il form, non accedere all\'app');
                    console.warn('🚫 Worker-link tentato accesso all\'app');
                    return;
                }
                
                // ✅ Sistema basato su ruoli - nessuna generazione di permessi
                console.log(`✅ Login riuscito: ${user.email} (ruolo: ${user.role})`);
                
                setCurrentUser(user);
                setIsAuthenticated(true);
                setShowPasswordError(false);
                
                // ✅ Auto-redirect alla prima sezione con permessi
                const firstAvailableView = getFirstAvailableView(user);
                setCurrentView(firstAvailableView);
                console.log('🎯 Redirect automatico a:', firstAvailableView);
                
                // Save session to localStorage (solo se "Ricordami" è attivo)
                if (rememberMe) {
                    localStorage.setItem('userSession', JSON.stringify({
                        userId: user.id,
                        role: user.role,
                        timestamp: Date.now()
                    }));
                    console.log('💾 Sessione salvata (30 giorni)');
                } else {
                    // Sessione solo per questa scheda
                    sessionStorage.setItem('userSession', JSON.stringify({
                        userId: user.id,
                        role: user.role,
                        timestamp: Date.now()
                    }));
                    console.log('💾 Sessione temporanea (solo questa scheda)');
                }
                
                console.log('✅ Login utente riuscito:', {
                    email: user.email,
                    role: user.role,
                    name: `${user.firstName} ${user.lastName}`
                });
                
            } else {
                // MODE 2: Admin Login (password only) → Admin
                if (!adminPasswordHash) {
                    setShowPasswordError(true);
                    setTimeout(() => setShowPasswordError(false), 3000);
                    return;
                }

                // Confronto password in chiaro (semplice)
                const adminPasswordMatch = passwordInput === adminPasswordHash;
                
                if (adminPasswordMatch) {
                    // Cerca un utente admin nella collection users
                    try {
                        const adminSnapshot = await db.collection('users')
                            .where('role', '==', 'admin')
                            .where('isPermanent', '==', true)
                            .limit(1)
                            .get();
                        
                        if (!adminSnapshot.empty) {
                            // Usa i dati dell'admin dalla collection users
                            const adminDoc = adminSnapshot.docs[0];
                            const adminData = adminDoc.data();
                            const adminUser = {
                                id: adminDoc.id,
                                role: 'admin',
                                email: adminData.email || 'admin@reportore.app',
                                firstName: adminData.firstName || 'Admin',
                                lastName: adminData.lastName || 'System',
                                ...adminData
                            };
                            
                            setCurrentUser(adminUser);
                            console.log('✅ Admin trovato in users:', `${adminUser.firstName} ${adminUser.lastName}`);
                        } else {
                            // Fallback: Admin legacy - solo ruolo, nessun permesso
                            const adminUser = { 
                                role: 'admin', 
                                id: 'admin',
                                email: 'admin@reportore.app',
                                firstName: 'Admin',
                                lastName: 'System'
                            };
                            setCurrentUser(adminUser);
                            console.log('⚠️ Admin legacy (non trovato in users)');
                        }
                    } catch (error) {
                        console.error('Errore caricamento admin:', error);
                        // Fallback
                        const adminUser = { 
                            role: 'admin', 
                            id: 'admin',
                            email: 'admin@reportore.app',
                            firstName: 'Admin',
                            lastName: 'System'
                        };
                        setCurrentUser(adminUser);
                    }
                    
                    setIsAuthenticated(true);
                    setShowPasswordError(false);
                    setCurrentView('dashboard');
                    
                    // Save admin session (solo se "Ricordami" è attivo)
                    if (rememberMe) {
                        localStorage.setItem('adminAuth', JSON.stringify({ timestamp: Date.now() }));
                        console.log('✅ Login admin riuscito - Sessione salvata (30 giorni)');
                    } else {
                        sessionStorage.setItem('adminAuth', JSON.stringify({ timestamp: Date.now() }));
                        console.log('✅ Login admin riuscito - Sessione temporanea');
                    }
                } else {
                    setShowPasswordError(true);
                    setTimeout(() => setShowPasswordError(false), 3000);
                }
            }
        } catch (e) {
            console.error('❌ Errore login:', e);
            setShowPasswordError(true);
            setTimeout(() => setShowPasswordError(false), 3000);
        }
    };

    // 🔐 Password Recovery - Verifica risposte sicurezza
    const handlePasswordRecovery = async () => {
        if (!db) {
            setRecoveryError('Database non disponibile');
            return;
        }

        try {
            // Carica domande di sicurezza da Firebase
            const securityDoc = await db.collection('settings').doc('securityQuestions').get();
            
            if (!securityDoc.exists || !securityDoc.data().answer1) {
                setRecoveryError(t.noRecoverySet || 'Nessun sistema di recupero configurato! Vai in Impostazioni per configurarlo.');
                return;
            }

            const securityData = securityDoc.data();

            // Valida risposte (confronto diretto, case-insensitive)
            const answer1Match = securityAnswers.answer1.toLowerCase().trim() === securityData.answer1.toLowerCase().trim();
            const answer2Match = securityAnswers.answer2.toLowerCase().trim() === securityData.answer2.toLowerCase().trim();

            if (!answer1Match || !answer2Match) {
                setRecoveryError(t.wrongSecurityAnswers || 'Risposte errate! Riprova.');
                return;
            }

            // Risposte corrette - salva nuova password in chiaro
            if (newPassword !== confirmPassword) {
                setRecoveryError(t.passwordMismatch || 'Le password non coincidono!');
                return;
            }

            if (newPassword.length < 6) {
                setRecoveryError(t.passwordTooShort || 'Password troppo corta (min 6 caratteri)');
                return;
            }

            // Salva nuova password in chiaro in Firebase
            await db.collection('settings').doc('adminAuth').set({
                password: newPassword,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedVia: 'passwordRecovery'
            }, { merge: true });

            // Aggiorna stato locale
            setAdminPasswordHash(newPassword);

            showToast('✅ Password reimpostata con successo!', 'success');
            setShowPasswordRecovery(false);
            setSecurityAnswers({ answer1: '', answer2: '' });
            setNewPassword('');
            setConfirmPassword('');
            setRecoveryError('');

        } catch (error) {
            console.error('Errore recovery password:', error);
            setRecoveryError(t.recoveryError || 'Errore durante il recupero password');
        }
    };

    // Save preferences
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        localStorage.setItem('language', language);
        
        // 🔧 FIX: Applica la classe dark al documentElement per Tailwind CSS dark mode
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode, language]);

    // 🚀 OTTIMIZZAZIONE: Listen to Firestore collections solo per vista attiva (riduzione -40% letture)
    useEffect(() => {
        if (!db || mode !== 'admin') return;
        
        let unsubscribeSheets = null;
        let unsubscribeBlacklist = null;
        let unsubscribeAudit = null;
        
        // Attiva listener solo per la vista corrente
        if (currentView === 'dashboard' || currentView === 'sheetList' || currentView === 'sheet') {
            unsubscribeSheets = db.collection('timesheets')
                .orderBy('createdAt', 'desc')
                .onSnapshot(snapshot => {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setSheets(data);
                });
        }
        
        if (currentView === 'blacklist') {
            unsubscribeBlacklist = db.collection('blacklist')
                .orderBy('addedAt', 'desc')
                .onSnapshot(snapshot => {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setBlacklist(data);
                    
                    // Auto-remove expired temporary blacklists
                    const now = new Date();
                    let expiredCount = 0;
                    data.forEach(async (item) => {
                        if (item.expiryDate && new Date(item.expiryDate) < now) {
                            expiredCount++;
                            try {
                                await db.collection('blacklist').doc(item.id).delete();
                                await addAuditLog('BLACKLIST_AUTO_REMOVE', `${item.nome} ${item.cognome} - Expired on ${formatDate(item.expiryDate)}`);
                            } catch (error) {
                                console.error('Error auto-removing expired blacklist:', error);
                            }
                        }
                    });
                    
                    if (expiredCount > 0) {
                        showToast(`🕒 ${expiredCount} expired blacklist ${expiredCount === 1 ? 'entry' : 'entries'} auto-removed`, 'info');
                    }
                });
        }
        
        if (currentView === 'auditLog' || currentView === 'settings') {
            unsubscribeAudit = db.collection('auditLog')
                .orderBy('timestamp', 'desc')
                .limit(100)
                .onSnapshot(snapshot => {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setAuditLog(data);
                });
        }
        
        return () => {
            if (unsubscribeSheets) unsubscribeSheets();
            if (unsubscribeBlacklist) unsubscribeBlacklist();
            if (unsubscribeAudit) unsubscribeAudit();
        };
    }, [db, mode, currentView]); // Dipende da currentView per attivare/disattivare listener

    // 🔢 AUTO-ASSIGN SHEET NUMBERS - DISABILITATO
    // I numeri vengono assegnati automaticamente alla creazione del foglio (riga 645-665)
    // 🔢 AUTO-ASSEGNAZIONE NUMERI FOGLI - DISABILITATO
    // Usa il file fix-sheet-numbers.html per riassegnare i numeri una tantum
    // I nuovi fogli ricevono automaticamente il numero dal counter in createNewSheet()

    // Auto-archive completed sheets on configured day of month
    useEffect(() => {
        if (!db || mode !== 'admin' || sheets.length === 0) return;

        const checkAutoArchive = async () => {
            const today = new Date();
            const dayOfMonth = today.getDate();

            // Check if today is the configured auto-archive day
            if (dayOfMonth !== autoArchiveDay) return;

            // Check if we already ran today (using localStorage to track)
            const lastAutoArchive = localStorage.getItem('lastAutoArchive');
            const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
            if (lastAutoArchive === todayString) return; // Already ran today

            // Find completed sheets from previous months that are not archived
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            const sheetsToArchive = sheets.filter(sheet => {
                if (sheet.archived || sheet.status !== 'completed') return false;

                // Get sheet's month/year from createdAt
                const sheetDate = sheet.createdAt?.toDate ? sheet.createdAt.toDate() : new Date(sheet.createdAt);
                const sheetMonth = sheetDate.getMonth();
                const sheetYear = sheetDate.getFullYear();

                // Archive if from previous months
                return (sheetYear < currentYear) || (sheetYear === currentYear && sheetMonth < currentMonth);
            });

            if (sheetsToArchive.length === 0) {
                localStorage.setItem('lastAutoArchive', todayString);
                return;
            }

            // Archive all eligible sheets
            let archivedCount = 0;
            for (const sheet of sheetsToArchive) {
                try {
                    await db.collection('timesheets').doc(sheet.id).update({
                        archived: true,
                        archivedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    await addAuditLog('AUTO_ARCHIVE', `Sheet: ${sheet.month || 'N/A'} - Auto-archived (completed in previous month)`);
                    archivedCount++;
                } catch (error) {
                    console.error('Error auto-archiving sheet:', error);
                }
            }

            if (archivedCount > 0) {
                showToast(`📦 ${archivedCount} ${archivedCount === 1 ? 'foglio completato archiviato' : 'fogli completati archiviati'} automaticamente`, 'success');
            }

            // Mark as done for today
            localStorage.setItem('lastAutoArchive', todayString);
        };

        // Run check immediately
        checkAutoArchive();

        // Set up daily check at midnight
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
        const msUntilMidnight = tomorrow - now;

        const timeoutId = setTimeout(() => {
            checkAutoArchive();
            // Set up daily interval
            const intervalId = setInterval(checkAutoArchive, 24 * 60 * 60 * 1000);
            return () => clearInterval(intervalId);
        }, msUntilMidnight);

        return () => clearTimeout(timeoutId);
    }, [db, mode, sheets, autoArchiveDay]);

    // Load app settings (linkExpiration doc) and keep in state
    useEffect(() => {
        if (!db) return;

        const unsub = db.collection('settings').doc('linkExpiration')
            .onSnapshot(doc => {
                if (!doc.exists) return;
                const data = doc.data() || {};
                setAppSettings(prev => ({ 
                    ...prev, 
                    weekStart: typeof data.weekStart !== 'undefined' ? Number(data.weekStart) : (prev.weekStart || 1),
                    expirationDays: typeof data.expirationDays !== 'undefined' ? Number(data.expirationDays) : (prev.expirationDays || 1),
                    tipiAttivita: data.tipiAttivita || prev.tipiAttivita
                }));
            }, (err) => {
                console.error('Error loading app settings:', err);
            });

        return () => unsub && unsub();
    }, [db]);

    // ❌ VECCHIO SISTEMA RIMOSSO - ora usa companies/ collection
    // ❌ VECCHIO SISTEMA RIMOSSO - ora usa addresses/ collection

    // ✅ Load Companies (Multi-Logo System - NUOVO)
    useEffect(() => {
        if (!db) return;
        
        const unsub = db.collection('companies')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const companiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCompanies(companiesData);
                
                // Carica azienda attiva salvata oppure seleziona la prima
                if (!activeCompanyId && companiesData.length > 0) {
                    db.collection('settings').doc('general').get().then(doc => {
                        const savedActiveId = doc.data()?.activeCompanyId;
                        if (savedActiveId && companiesData.find(c => c.id === savedActiveId)) {
                            setActiveCompanyId(savedActiveId);
                        } else {
                            setActiveCompanyId(companiesData[0].id);
                        }
                    }).catch(() => {
                        setActiveCompanyId(companiesData[0].id);
                    });
                }
            }, error => {
                console.error('Error loading companies:', error);
            });
        
        return () => unsub();
    }, [db, activeCompanyId]);

    // ✅ Load Addresses (Multi-Address System - NUOVO)
    useEffect(() => {
        if (!db) return;
        
        const unsub = db.collection('addresses')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const addressesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAppSettings(prev => ({
                    ...prev,
                    addresses: addressesData
                }));
            }, error => {
                console.error('Error loading addresses:', error);
            });
        
        return () => unsub();
    }, [db]);

    // ✅ Load Recent Addresses (Auto-saved from sheets)
    const [recentAddresses, setRecentAddresses] = useState([]);
    useEffect(() => {
        if (!db) return;
        
        const unsub = db.collection('recentAddresses')
            .orderBy('lastUsed', 'desc')
            .limit(50)
            .onSnapshot(snapshot => {
                const recents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRecentAddresses(recents);
            }, error => {
                console.error('Error loading recent addresses:', error);
            });
        
        return () => unsub();
    }, [db]);

    // Load users from Firestore (for supervisors multi-select)
    useEffect(() => {
        if (!db) return;

        const unsub = db.collection('users')
            .onSnapshot(snapshot => {
                const usersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Filter solo utenti attivi (non bloccati)
                const activeUsers = usersData.filter(u => !u.blocked);
                setUsers(activeUsers);
            }, (err) => {
                console.error('Error loading users:', err);
            });

        return () => unsub && unsub();
    }, [db]);

    // ⭐ NEW: Listen for custom view change events (from Settings button)
    useEffect(() => {
        const handleViewChange = (event) => {
            setCurrentView(event.detail);
            setMobileMenuOpen(false);
        };

        window.addEventListener('changeView', handleViewChange);
        return () => window.removeEventListener('changeView', handleViewChange);
    }, []);

    // ⭐ NEW: Listen for openSheet events dispatched by notifications (or other components)
    useEffect(() => {
        const handleOpenSheet = async (event) => {
            const sheetId = event?.detail?.sheetId;
            console.log('⬇️ Received openSheet event', sheetId, event);
            if (!sheetId) return;

            // Try to find sheet in current state first
            const existing = sheets.find(s => s.id === sheetId);
            if (existing) {
                setCurrentSheet(existing);
                setCurrentView('sheet');
                setMobileMenuOpen(false);
                return;
            }

            // Fallback: fetch from Firestore
                    if (db) {
                try {
                    const doc = await db.collection('timesheets').doc(sheetId).get();
                    if (doc.exists) {
                        const data = { id: doc.id, ...doc.data() };
                        setCurrentSheet(data);
                        setCurrentView('sheet');
                        setMobileMenuOpen(false);
                    } else {
                        showToast('❌ ' + t.sheetNotFound, 'error');
                    }
                } catch (err) {
                    console.error('Error fetching sheet for openSheet event:', err);
                        showToast('❌ ' + t.errorLoading, 'error');
                }
            }
        };

        window.addEventListener('openSheet', handleOpenSheet);
        return () => window.removeEventListener('openSheet', handleOpenSheet);
    }, [sheets, db, language]);

    // Add Audit Log
    const addAuditLog = useCallback(async (action, details, metadata = {}) => {
        if (!db) return;
        
        // Ottieni info utente corrente
        const userName = currentUser 
            ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'Admin System'
            : 'Admin System';
        
        const userRole = currentUser?.role || 'admin';
        
        const logEntry = {
            action,
            details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            user: userName,
            userId: currentUser?.id || 'admin',
            userRole: userRole,
            metadata: {
                ...metadata,
                userAgent: navigator.userAgent,
                language: language || 'it'
            }
        };
        
        try {
            await db.collection('auditLog').add(logEntry);
            console.log('📋 Audit log:', action, '-', details);
        } catch (error) {
            console.error('Errore log:', error);
        }
    }, [db, currentUser, language]);

    // Create New Sheet
    const createNewSheet = useCallback(async () => {
        if (!db) {
            showToast(`❌ ${t.dbNotConnected}`, 'error');
            return;
        }
        const newSheet = {
            data: new Date().toISOString().split('T')[0],
            titoloAzienda: '',
            location: '',
            indirizzoEvento: '',
            orarioStimatoDa: '',
            orarioStimatoA: '',
            responsabile: '',
            note: '',
            lavoratori: [],
            companies: [], // 🏢 Multi-company support
            addresses: [], // 📍 Multi-address support
            firmaResponsabile: null,
            status: 'draft',
            archived: false,
            createdAt: new Date().toISOString()
        };
        try {
            // 🎯 SISTEMA AUTOMATICO: Trova il numero più alto e aggiungi 1
            let sheetNumber = 1;
            try {
                const allSheets = await db.collection('timesheets')
                    .orderBy('sheetNumber', 'desc')
                    .limit(1)
                    .get();
                
                if (!allSheets.empty) {
                    const maxNumber = allSheets.docs[0].data().sheetNumber || 0;
                    sheetNumber = maxNumber + 1;
                }
                console.log(`✅ Numero foglio auto-calcolato: ${sheetNumber}`);
            } catch (e) {
                console.error('Error calculating sheetNumber, using default', e);
                sheetNumber = 1;
            }

            newSheet.sheetNumber = sheetNumber;

            const docRef = await db.collection('timesheets').add(newSheet);
            setCurrentSheet({ id: docRef.id, ...newSheet });
            setCurrentView('sheet');
            await addAuditLog('SHEET_CREATE', `${t.createNewSheet}: ${docRef.id}`);
            showToast(`✅ ${t.sheetSaved}`, 'success');
        } catch (error) {
            console.error(error);
            showToast(`❌ ${t.errorSaving}`, 'error');
        }
        setLoading(false);
    }, [db, addAuditLog, language]);

    // Save Sheet
    const saveSheet = useCallback(async (sheet) => {
        if (!db) return;
        
        try {
            const { id, ...data } = sheet;
            await db.collection('timesheets').doc(id).set(data, { merge: true });
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [db]);

    // Complete Sheet
    const completeSheet = useCallback(async (sheet) => {
        if (!db) return;
        
        try {
            await db.collection('timesheets').doc(sheet.id).update({
                status: 'completed',
                completedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [db]);

    // Delete Sheet
    const deleteSheet = useCallback(async (sheetId) => {
        if (!db) return;
        
        const sheet = sheets.find(s => s.id === sheetId);
        
        try {
            await db.collection('timesheets').doc(sheetId).delete();
            await addAuditLog('SHEET_DELETE', `${t.delete}: ${sheet?.titoloAzienda || sheetId}`);
            showToast(`✅ ${t.sheetDeleted}`, 'success');
        } catch (error) {
            console.error(error);
            showToast(`❌ ${t.errorDeleting}`, 'error');
        }
    }, [db, sheets, addAuditLog, language]);

    // Archive/Restore Sheet
    const archiveSheet = useCallback(async (sheetId, archive = true) => {
        if (!db) return;
        
        try {
            await db.collection('timesheets').doc(sheetId).update({ archived: archive });
            await addAuditLog(
                archive ? 'SHEET_ARCHIVE' : 'SHEET_RESTORE', 
                `${archive ? t.archive : t.restore}: ${sheetId}`
            );
            showToast(archive ? `📦 ${t.sheetArchived}` : `↩️ ${t.sheetRestored}`, 'success');
        } catch (error) {
            console.error(error);
            showToast(`❌ ${t.error}`, 'error');
        }
    }, [db, addAuditLog, language]);

    // Add to Blacklist
    const addToBlacklist = useCallback(async (worker, reason, severity = 'medium', expiryDate = null, signature = 'Admin') => {
        if (!db) return;
        
        const blacklistEntry = {
            nome: worker.nome,
            cognome: worker.cognome,
            codiceFiscale: worker.codiceFiscale || '',
            numeroIdentita: worker.numeroIdentita || '',
            telefono: worker.telefono || '',
            email: worker.email || '',
            reason,
            severity, // 'high', 'medium', 'low'
            expiryDate, // null = permanent, or ISO date string
            notes: [], // Array of { text, addedBy, addedAt, signature }
            history: [{
                action: 'ADDED',
                by: signature,
                at: new Date().toISOString(),
                details: reason
            }],
            addedAt: new Date().toISOString(),
            addedBy: signature
        };
        
        try {
            await db.collection('blacklist').add(blacklistEntry);
            await addAuditLog('BLACKLIST_ADD', `${worker.nome} ${worker.cognome} - ${reason} [${severity.toUpperCase()}]${expiryDate ? ` (Expires: ${expiryDate})` : ''}`);
            showToast(`🚫 ${t.blacklistAdded}`, 'success');
        } catch (error) {
            console.error(error);
            showToast(`❌ ${t.error}`, 'error');
        }
    }, [db, addAuditLog, language]);

    // Remove from Blacklist
    const removeFromBlacklist = useCallback(async (blacklistId, reason = 'Removed', signature = 'Admin') => {
        if (!db) return;
        
        try {
            const doc = await db.collection('blacklist').doc(blacklistId).get();
            const data = doc.data();
            
            // Update history before deleting
            const updatedHistory = [
                ...(data.history || []),
                {
                    action: 'REMOVED',
                    by: signature,
                    at: new Date().toISOString(),
                    details: reason
                }
            ];
            
            await db.collection('blacklist').doc(blacklistId).update({ history: updatedHistory });
            await db.collection('blacklist').doc(blacklistId).delete();
            await addAuditLog('BLACKLIST_REMOVE', `${data.nome} ${data.cognome} - ${reason} (by ${signature})`);
            showToast(`✅ ${t.blacklistRemoved}`, 'success');
        } catch (error) {
            console.error(error);
            showToast(`❌ ${t.errorDeleting}`, 'error');
        }
    }, [db, addAuditLog, language]);

    // Handle Logo Upload
    const handleLogoUpload = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const logoData = e.target.result;
                setCompanyLogo(logoData);
                localStorage.setItem('companyLogo', logoData);
                showToast(`✅ ${t.logoUploaded}`, 'success');
            };
            reader.readAsDataURL(file);
        }
    }, [language]);

    // Safe translations lookup: prefer runtime window.t() if available, fall back to legacy translations.js
    const t = new Proxy({}, {
        get(_, prop) {
            try {
                if (window && typeof window.t === 'function') return window.t(String(prop));
            } catch (e) { /* ignore */ }
            try {
                if (window && window.translations) return (window.translations[language] || window.translations.it || {})[prop];
            } catch (e) { /* ignore */ }
            return undefined;
        }
    });
    const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-indigo-100';

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="loader"></div>
            </div>
        );
    }

    // Resolve components from window with safe fallbacks to avoid React error #130
    // NOTE: Babel scripts load async, so we MUST check window.Component every render for dynamic loading
    const DashboardComp = window.Dashboard || (() => React.createElement('div', null, t.dashboardNotLoaded || 'Dashboard non caricato'));
    const WorkerModeComp = window.WorkerMode || (() => React.createElement('div', null, t.workerModeNotLoaded || 'WorkerMode non caricato'));
    const SheetListComp = window.SheetList || (() => React.createElement('div', null, t.sheetListNotLoaded || 'SheetList non caricata'));
    // SheetEditor: Check dynamically to handle async Babel loading (fixes "Editor non caricato")
    const SheetEditorComp = window.SheetEditor || (() => {
        console.warn('⚠️ SheetEditor not loaded yet, showing fallback');
        return React.createElement('div', { className: 'p-4 text-center' }, 
            React.createElement('p', null, t.editorNotLoaded || 'Editor non caricato'),
            React.createElement('button', { onClick: () => window.location.reload(), className: 'mt-2 px-4 py-2 bg-blue-500 text-white rounded' }, 'Ricarica pagina')
        );
    });
    const CalendarComp = window.Calendar || (() => React.createElement('div', null, t.calendarNotLoaded || 'Calendar non caricato'));
    const WorkerStatsComp = window.WorkerStats || (() => React.createElement('div', null, t.workerStatsNotLoaded || 'WorkerStats non caricata'));
    const BlacklistComp = window.Blacklist || (() => React.createElement('div', null, t.blacklistNotLoaded || 'Blacklist non caricata'));
    const AuditLogComp = window.AuditLog || (() => React.createElement('div', null, t.auditLogNotLoaded || 'AuditLog non caricato'));
    const ReportManagerComp = window.ReportManager || (() => React.createElement('div', null, t.reportManagerNotLoaded || 'ReportManager non caricato'));
    const BackupRestoreComp = window.BackupRestore || (() => React.createElement('div', null, t.backupNotLoaded || 'Backup non caricato'));
    const ScheduledNotificationsComp = window.ScheduledNotifications || (() => React.createElement('div', null, t.scheduledNotificationsNotLoaded || 'ScheduledNotifications non caricato'));
    const SettingsComp = window.Settings || (() => React.createElement('div', null, t.settingsNotLoaded || 'Settings non caricato'));

    // Worker Mode
    if (mode === 'worker') {
        return <WorkerModeComp sheetId={sheetId} db={db} darkMode={darkMode} language={language} />;
    }

    // 🔒 SCHERMATA LOGIN
    if (!isAuthenticated) {
        const PasswordResetComp = window.PasswordReset || (() => <div>PasswordReset non caricato</div>);

        // Schermata login unificata
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
                <div className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-800/90 backdrop-blur-lg border border-indigo-500/20' : 'bg-white/90 backdrop-blur-lg border border-indigo-200'}`}>
                    {/* Logo/Title */}
                    <div className="text-center mb-8">
                        <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            🔒 Report Ore Facchini
                        </h1>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Inserisci le tue credenziali per accedere
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={(e) => { e.preventDefault(); handleUnifiedLogin(); }} className="space-y-4">
                        {/* Email field (opzionale - se lasciato vuoto = admin) */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                📧 Email <span className="text-xs opacity-60">(lascia vuoto per admin)</span>
                            </label>
                            <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="mario.rossi@example.com"
                                className={`w-full px-4 py-3 rounded-lg border ${
                                        darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' 
                                            : 'bg-white border-indigo-200 text-gray-900 placeholder-gray-400 focus:border-indigo-400'
                                    } focus:ring-2 focus:ring-indigo-500/50 transition-all`}
                                autoFocus
                            />
                        </div>

                        {/* Password field */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                🔑 {t.password || 'Password'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                                        darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' 
                                            : 'bg-white border-indigo-200 text-gray-900 placeholder-gray-400 focus:border-indigo-400'
                                    } focus:ring-2 focus:ring-indigo-500/50 transition-all`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-xl transition-all hover:scale-110 ${
                                        darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                    title={showPassword ? 'Nascondi password' : 'Mostra password'}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {/* Checkbox Ricordami */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className={`w-4 h-4 rounded border-2 ${
                                    darkMode 
                                        ? 'border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500' 
                                        : 'border-indigo-300 bg-white text-indigo-600 focus:ring-indigo-400'
                                } focus:ring-2 focus:ring-offset-0 cursor-pointer`}
                            />
                            <label 
                                htmlFor="rememberMe" 
                                className={`ml-2 text-sm cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                                💾 Ricordami per 30 giorni
                            </label>
                        </div>

                        {showPasswordError && (
                            <div className="animate-shake bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                                ❌ Credenziali non valide! Verifica email e password.
                            </div>
                        )}                        <button
                            type="submit"
                            className={`w-full py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                                darkMode
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/50'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-300/50'
                            }`}
                        >
                            🔓 {t.login || 'Accedi'}
                        </button>

                        {/* Password dimenticata? */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setShowPasswordRecovery(true)}
                                className={`text-sm font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'} transition-colors`}
                            >
                                🔑 {t.forgotPassword || 'Password dimenticata?'}
                            </button>
                        </div>
                    </form>

                    {/* Dark Mode Toggle */}
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-lg transition-colors ${
                                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>

                    {/* Info */}
                    <p className={`mt-6 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        💡 Admin: lascia email vuota | Utenti: inserisci email e password
                    </p>
                </div>

                {/* Password Reset Modal */}
                {showPasswordRecovery && (
                    <PasswordResetComp
                        db={db}
                        darkMode={darkMode}
                        onClose={() => setShowPasswordRecovery(false)}
                        onSuccess={() => {
                            setShowPasswordRecovery(false);
                            showToast('✅ Password reimpostata! Ora puoi effettuare il login', 'success');
                        }}
                    />
                )}
            </div>
        );
    }



    // 🔒 ADMIN/MANAGER INTERFACE (interfaccia completa)
    return (
        <div className={`min-h-screen ${bgClass}`}>
            {/* Header - MODERNIZZATO CON GRADIENT E GLASSMORPHISM */}
            <header className={`sticky top-0 z-50 backdrop-blur-md border-b ${
                darkMode 
                    ? 'bg-gradient-to-r from-gray-900/95 via-indigo-900/95 to-purple-900/95 border-gray-700/50 shadow-2xl shadow-purple-500/20' 
                    : 'bg-gradient-to-r from-white/95 via-indigo-50/95 to-purple-50/95 border-indigo-200/50 shadow-xl shadow-indigo-500/10'
            }`}>
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                        {/* Left Side - Language & Theme (Mobile + Desktop) */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            {/* Language Selector - GLASSMORPHISM */}
                            <select
                                value={language}
                                onChange={(e) => setAppLanguage(e.target.value)}
                                className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                    darkMode
                                        ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20'
                                        : 'bg-white/60 backdrop-blur-md border border-indigo-200 text-indigo-700 hover:bg-white/80'
                                } shadow-lg`}
                                style={darkMode ? { colorScheme: 'dark' } : {}}
                            >
                                {(
                                    (typeof window !== 'undefined' && window.availableLanguages) ? window.availableLanguages : ['it','en','es','fr','ro']
                                ).map(langCode => {
                                    const meta = {
                                        it: '🇮🇹 IT',
                                        en: '🇬🇧 EN',
                                        es: '🇪🇸 ES',
                                        fr: '🇫🇷 FR',
                                        ro: '🇷🇴 RO'
                                    };
                                    return (
                                        <option key={langCode} value={langCode} className={darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>{meta[langCode] || langCode.toUpperCase()}</option>
                                    );
                                })}
                            </select>

                            {/* Dark Mode Toggle - ANIMATO */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                                    darkMode
                                        ? 'bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 shadow-lg shadow-yellow-500/20'
                                        : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-700 shadow-lg shadow-indigo-500/20'
                                }`}
                                title={darkMode ? 'Light Mode' : 'Dark Mode'}
                            >
                                <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
                            </button>
                        </div>

                        {/* Desktop Navigation - MODERNIZZATO */}
                        <nav className="hidden lg:flex items-center gap-2">
                            {[
                                { view: 'dashboard', icon: '📊', label: t.dashboard, feature: 'dashboard.view' },
                                { view: 'list', icon: '📋', label: t.sheets, feature: 'sheets.view' },
                                { view: 'calendar', icon: '📆', label: t.calendar || 'Calendario', feature: 'calendar.view' },
                                { view: 'workerstats', icon: '👷', label: t.onCallWorkers || 'Lavoratori On-Call', feature: 'onCall.view' },
                                { view: 'users', icon: '👥', label: t.userManagement || 'Gestione Utenti', feature: 'users.view' },
                                { view: 'blacklist', icon: '🚫', label: t.blacklist, feature: 'blacklist.view' },
                                { view: 'reports', icon: '📈', label: t.reports, feature: 'reports.view' },
                                { view: 'settings', icon: '⚙️', label: t.settings, feature: 'settings.view' }
                            ].filter(item => window.hasRoleAccess(currentUser, item.feature)).map(item => (
                                <button
                                    key={item.view}
                                    onClick={() => setCurrentView(item.view)}
                                    className={`px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                                        currentView === item.view 
                                            ? darkMode
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-105'
                                                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-300/50 scale-105'
                                            : darkMode
                                                ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                                                : 'text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                                    }`}
                                >
                                    <span className="mr-1">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {/* Right Side - Avatar & Logout */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {/* User Avatar - Mobile & Desktop */}
                            <button
                                onClick={() => setCurrentView('Profile')}
                                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 transform hover:scale-110 ${
                                    currentView === 'Profile'
                                        ? darkMode
                                            ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/50'
                                            : 'ring-2 ring-indigo-400 shadow-lg shadow-indigo-400/50'
                                        : 'hover:ring-2 hover:ring-indigo-400/50'
                                }`}
                                title={t.profile || 'Profilo'}
                            >
                                {currentUser?.avatarURL ? (
                                    <img 
                                        src={currentUser.avatarURL} 
                                        alt={t.profile || 'Profilo'}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <div className={`w-full h-full rounded-full flex items-center justify-center text-lg font-bold ${
                                        darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'
                                    }`}>
                                        {currentUser?.firstName?.[0]?.toUpperCase() || '👤'}
                                    </div>
                                )}
                            </button>

                            {/* Logout Button */}
                            <button
                                onClick={() => {
                                    localStorage.removeItem('adminAuth');
                                    setIsAuthenticated(false);
                                    setPasswordInput('');
                                    setShowPasswordError(false);
                                    showToast('🔒 ' + (t.logout || 'Disconnesso!'), 'info');
                                }}
                                className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                                    darkMode
                                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 shadow-lg shadow-red-500/20'
                                        : 'bg-red-500/20 hover:bg-red-500/30 text-red-600 shadow-lg shadow-red-500/20'
                                }`}
                                title={t.logout || 'Esci'}
                            >
                                <span className="text-xl">🚪</span>
                            </button>
                        </div>
                    </div>

                    {/* OLD Mobile Menu Hamburger - DISABLED: Sostituito da bottom nav, mantiene state per compatibilità */}
                    {false && mobileMenuOpen && (
                        <nav className={`lg:hidden mt-3 flex flex-col gap-2 animate-fade-in p-3 rounded-xl ${
                            darkMode ? 'bg-gray-800/50 backdrop-blur-md' : 'bg-white/50 backdrop-blur-md'
                        }`}>
                            {[
                                { view: 'dashboard', icon: '📊', label: t.dashboard, feature: 'dashboard.view' },
                                { view: 'list', icon: '📋', label: t.sheets, feature: 'sheets.view' },
                                { view: 'calendar', icon: '📆', label: t.calendar || 'Calendario', feature: 'calendar.view' },
                                { view: 'workerstats', icon: '👤', label: t.workerStatistics || 'Statistiche', feature: 'onCall.view' },
                                { view: 'users', icon: '👥', label: t.userManagement || 'Gestione Utenti', feature: 'users.view' },
                                { view: 'blacklist', icon: '🚫', label: t.blacklist, feature: 'blacklist.view' },
                                { view: 'reports', icon: '📈', label: t.reports, feature: 'reports.view' },
                                { view: 'settings', icon: '⚙️', label: t.settings, feature: 'settings.view' }
                            ].filter(item => window.hasRoleAccess(currentUser, item.feature)).map(item => (
                                <button
                                    key={item.view}
                                    onClick={() => { setCurrentView(item.view); setMobileMenuOpen(false); }}
                                    className={`text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                                        currentView === item.view 
                                            ? darkMode
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                                            : darkMode
                                                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                                                : 'bg-white/50 text-gray-700 hover:bg-white/80'
                                    }`}
                                >
                                    <span className="mr-2">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    )}
                </div>
            </header>

            {/* 📱 BOTTOM NAVIGATION MOBILE - MODERNA */}
            <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 ${
                darkMode ? 'bg-gray-900/95 border-t border-gray-800' : 'bg-white/95 border-t border-gray-200'
            } backdrop-blur-lg shadow-2xl`}
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex items-center justify-around px-2 py-2">
                    {/* Dashboard */}
                    {window.hasRoleAccess(currentUser, 'dashboard.view') && <button
                        onClick={() => { setCurrentView('dashboard'); setMoreMenuOpen(false); }}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                            currentView === 'dashboard'
                                ? darkMode
                                    ? 'bg-indigo-600 text-white scale-110'
                                    : 'bg-indigo-500 text-white scale-110'
                                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'
                        }`}
                    >
                        <span className="text-xl">📊</span>
                        <span className="text-xs mt-1 font-medium">{t.dashboard || 'Dashboard'}</span>
                    </button>}

                    {/* Fogli */}
                    {window.hasRoleAccess(currentUser, 'sheets.view') && <button
                        onClick={() => { setCurrentView('list'); setMoreMenuOpen(false); }}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                            currentView === 'list'
                                ? darkMode
                                    ? 'bg-indigo-600 text-white scale-110'
                                    : 'bg-indigo-500 text-white scale-110'
                                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'
                        }`}
                    >
                        <span className="text-xl">📋</span>
                        <span className="text-xs mt-1 font-medium">{t.sheets || 'Fogli'}</span>
                    </button>}

                    
                    {/* On-Call Workers */}
                    {window.hasRoleAccess(currentUser, 'onCall.view') && <button
                        onClick={() => { setCurrentView('workerstats'); setMoreMenuOpen(false); }}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                            currentView === 'workerstats'
                                ? darkMode
                                    ? 'bg-indigo-600 text-white scale-110'
                                    : 'bg-indigo-500 text-white scale-110'
                                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'
                        }`}
                    >
                        <span className="text-xl">👷</span>
                        <span className="text-xs mt-1 font-medium">{t.onCall || 'On-Call'}</span>
                    </button>}

                    {/* Altro (Popup Menu) */}
                    <button
                        onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                            moreMenuOpen
                                ? darkMode
                                    ? 'bg-indigo-600 text-white scale-110'
                                    : 'bg-indigo-500 text-white scale-110'
                                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'
                        }`}
                    >
                        <span className="text-xl">⋮</span>
                        <span className="text-xs mt-1 font-medium">{t.more || 'Altro'}</span>
                    </button>
                </div>

                {/* Popup Menu "Altro" */}
                {moreMenuOpen && (
                    <div className={`absolute bottom-full left-0 right-0 mb-2 mx-2 rounded-xl shadow-2xl animate-fade-in ${
                        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                        <div className="p-2 grid grid-cols-3 gap-2">
                            {[
                                { view: 'users', icon: '👥', label: t.userManagement || 'Utenti', feature: 'users.view' },
                                { view: 'blacklist', icon: '🚫', label: t.blacklist || 'Blacklist', feature: 'blacklist.view' },
                                { view: 'calendar', icon: '📆', label: t.calendar || 'Calendario', feature: 'calendar.view' },
                                { view: 'audit', icon: '📜', label: t.auditLog || 'Audit', feature: 'onCall.view' },
                                { view: 'reports', icon: '📈', label: t.reports || 'Report', feature: 'reports.view' },
                                { view: 'settings', icon: '⚙️', label: t.settings || 'Impostazioni', feature: 'settings.view' }
                            ].filter(item => window.hasRoleAccess(currentUser, item.feature)).map(item => (
                                <button
                                    key={item.view}
                                    onClick={() => { setCurrentView(item.view); setMoreMenuOpen(false); }}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                                        currentView === item.view
                                            ? darkMode
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-indigo-500 text-white'
                                            : darkMode
                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <span className="text-2xl mb-1">{item.icon}</span>
                                    <span className="text-xs font-medium text-center">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content - Aggiunto padding-bottom per bottom nav mobile */}
            <main className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto pb-20 lg:pb-6">
                {currentView === 'dashboard' && (
                    <DashboardComp 
                        currentUser={currentUser}
                        sheets={(() => {
                            if (!currentUser || !sheets) return [];
                            // Admin/Manager/Responsabile: vedono tutti i fogli
                            if (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'responsabile') {
                                return sheets;
                            }
                            // Worker: vede solo fogli dove è presente
                            if (currentUser.role === 'worker') {
                                // Mostra solo fogli dove l'utente è responsabile o tra i lavoratori
                                return sheets.filter(sheet => {
                                    // Responsabile
                                    if (sheet.responsabileId && currentUser.id && sheet.responsabileId === currentUser.id) return true;
                                    // Tra i lavoratori
                                    if (Array.isArray(sheet.lavoratori)) {
                                        return sheet.lavoratori.some(w => w.id === currentUser.id);
                                    }
                                    return false;
                                });
                            }
                            // Nessun permesso: nessun foglio
                            return [];
                        })()} 
                        darkMode={darkMode} 
                        language={language} 
                        weekStart={appSettings.weekStart}
                        onNavigate={(view) => setCurrentView(view)}
                        appSettings={appSettings}
                    />
                )}

                {currentView === 'list' && (
                    <div>
                        {/* Pulsante Crea Foglio - Solo con permesso editCompanyName o role admin/manager */}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                            <button
                                onClick={createNewSheet}
                                className="w-full mb-4 sm:mb-6 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-base sm:text-lg transition-colors touch-button"
                            >
                                ➕ {t.createNewSheet}
                            </button>
                        )}
                        {/* Messaggio se non può creare */}
                        {!(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                            <div className="w-full mb-4 sm:mb-6 py-3 sm:py-4 bg-gray-500 text-white rounded-lg font-bold text-base sm:text-lg text-center opacity-60 cursor-not-allowed">
                                🔒 {t.noPermissionCreateSheet || 'Non hai permesso di creare nuovi fogli'}
                            </div>
                        )}
                        <SheetListComp
                            sheets={sheets}
                            onSelectSheet={(sheet) => {
                                // ✅ Inizializza campi mancanti per fogli vecchi
                                const updatedSheet = {
                                    ...sheet,
                                    companies: sheet.companies || [],
                                    addresses: sheet.addresses || []
                                };
                                setCurrentSheet(updatedSheet);
                                setCurrentView('sheet');
                            }}
                            onDeleteSheet={deleteSheet}
                            onArchiveSheet={archiveSheet}
                            darkMode={darkMode}
                            language={language}
                            companyLogo={companyLogo}
                            companies={companies}
                            activeCompanyId={activeCompanyId}
                            currentUser={currentUser}
                        />
                    </div>
                )}

                {currentView === 'sheet' && currentSheet && (
                    <SheetEditorComp
                        sheet={currentSheet}
                        onSave={saveSheet}
                        onComplete={completeSheet}
                        onBack={() => setCurrentView('list')}
                        db={db}
                        blacklist={blacklist}
                        addToBlacklist={addToBlacklist}
                        addAuditLog={addAuditLog}
                        darkMode={darkMode}
                        language={language}
                        companyLogo={companyLogo}
                        companies={companies}
                        activeCompanyId={activeCompanyId}
                        appSettings={appSettings}
                        recentAddresses={recentAddresses}
                        users={users}
                        currentUser={currentUser}
                    />
                )}

                {/* Calendar View */}
                {currentView === 'calendar' && (
                    <CalendarComp 
                        sheets={sheets}
                        darkMode={darkMode}
                        language={language}
                        currentUser={currentUser}
                        onSelectSheet={(sheet) => {
                            setCurrentSheet(sheet);
                            setCurrentView('sheet');
                        }}
                    />
                )}

                {/* Worker Stats View - On-Call Workers */}
                {currentView === 'workerstats' && (
                    <WorkerStatsComp
                        sheets={sheets}
                        darkMode={darkMode}
                        language={language}
                        currentUser={currentUser}
                        onBack={() => setCurrentView('dashboard')}
                        onAddToBlacklist={addToBlacklist}
                        blacklist={blacklist}
                        activityTypes={appSettings.tipiAttivita || []}
                        db={db}
                        onViewProfile={(workerName) => {
                            const normalized = window.normalizeWorkerName(
                                workerName.split(' ')[0], 
                                workerName.split(' ').slice(1).join(' ')
                            );
                            setSelectedUserId('worker-' + normalized);
                            setSelectedWorkerName(workerName);
                            setShowUserProfile(true);
                        }}
                    />
                )}

                {currentView === 'blacklist' && (
                    <BlacklistComp
                        blacklist={blacklist}
                        removeFromBlacklist={removeFromBlacklist}
                        darkMode={darkMode}
                        language={language}
                        currentUser={currentUser}
                    />
                )}

                {currentView === 'audit' && (
                    <AuditLogComp
                        auditLog={auditLog}
                        darkMode={darkMode}
                        language={language}
                        db={db}
                    />
                )}

                {currentView === 'reports' && (
                    <ReportManagerComp
                        sheets={sheets}
                        darkMode={darkMode}
                        language={language}
                        companyLogo={companyLogo}
                        companies={companies}
                        activeCompanyId={activeCompanyId}
                    />
                )}

                {/* Backup View */}
                {currentView === 'backup' && (
                    <BackupRestoreComp
                        db={db}
                        darkMode={darkMode}
                        language={language}
                    />
                )}

                {currentView === 'settings' && (
                    <SettingsComp
                        db={db}
                        storage={storage}
                        sheets={sheets}
                        darkMode={darkMode}
                        language={language}
                        companyLogo={companyLogo}
                        setCompanyLogo={setCompanyLogo}
                        companies={companies}
                        setCompanies={setCompanies}
                        activeCompanyId={activeCompanyId}
                        setActiveCompanyId={setActiveCompanyId}
                        autoArchiveDay={autoArchiveDay}
                        setAutoArchiveDay={setAutoArchiveDay}
                        auditLog={auditLog}
                        appSettings={appSettings}
                        setAppSettings={setAppSettings}
                        currentUser={currentUser}
                        recentAddresses={recentAddresses}
                    />
                )}
                
                {/* User Management View */}
                {currentView === 'users' && window.UserManagement && React.createElement(window.UserManagement, {
                    db: db,
                    storage: storage,
                    currentUserRole: currentUser?.role || 'admin',
                    currentUserId: currentUser?.id || 'admin',
                    currentUser: currentUser,
                    darkMode: darkMode,
                    addAuditLog: addAuditLog
                })}
                
                {/* Profile View - Profilo personalizzato dell'utente loggato */}
                {currentView === 'Profile' && currentUser && window.PermanentUserProfile && React.createElement(window.PermanentUserProfile, {
                    userId: currentUser.id,
                    currentUserRole: currentUser.role || 'admin',
                    currentUserId: currentUser.id,
                    currentUser: currentUser,
                    db: db,
                    storage: storage,
                    darkMode: darkMode,
                    language: language,
                    onBack: () => setCurrentView(getFirstAvailableView(currentUser)),
                    isOwnProfile: true
                })}
            </main>
            
            {/* User Profile Modal - Ora usa PermanentUserProfile anche per on-call workers */}
            {showUserProfile && window.PermanentUserProfile && React.createElement(window.PermanentUserProfile, {
                userId: selectedUserId,
                currentUserRole: currentUser?.role || 'admin',
                currentUserId: currentUser?.id || 'admin',
                onClose: () => {
                    setShowUserProfile(false);
                    setSelectedUserId(null);
                    setSelectedWorkerName(null);
                },
                db: db,
                storage: storage,
                darkMode: darkMode,
                language: language
            })}
        </div>
    );
};

// Diagnostic: log which components are available on window to debug React error #130
try {
    const componentList = [
        'Dashboard','WorkerMode','SheetList','SheetEditor','Calendar','WorkerStats','Blacklist','AuditLog','ReportManager','BackupRestore','ScheduledNotifications','Settings'
    ];
    const availability = {};
    componentList.forEach(name => {
        availability[name] = typeof window[name] !== 'undefined' ? (typeof window[name] === 'function' || typeof window[name] === 'object') : false;
    });
    console.log('🧭 Component availability at render time:', availability);
} catch (err) {
    console.warn('Diagnostic logging failed:', err);
}

// ErrorBoundary to capture render errors and surface diagnostics
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null, info: null };
    }

    componentDidCatch(error, info) {
        // Log full error and component availability at the moment of crash
        try {
            const componentList = [
                'Dashboard','WorkerMode','SheetList','SheetEditor','Calendar','WorkerStats','Blacklist','AuditLog','ReportManager','BackupRestore','ScheduledNotifications','Settings'
            ];
            const availability = {};
            componentList.forEach(name => {
                availability[name] = typeof window[name] !== 'undefined' ? (typeof window[name] === 'function' || typeof window[name] === 'object') : false;
            });
            console.error('❌ Render error caught by ErrorBoundary:', error, info);
            console.log('🧭 Component availability at error time:', availability);
        } catch (e) {
            console.error('Error while reporting diagnostics:', e);
        }

        this.setState({ error, info });
    }

    render() {
        if (this.state && this.state.error) {
            const msg = this.state.error && this.state.error.message ? this.state.error.message : String(this.state.error);
            return (
                <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
                    <h2 style={{ color: '#c53030' }}>Application error</h2>
                    <p>{msg}</p>
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.info && this.state.info.componentStack ? this.state.info.componentStack : 'No stack available'}
                    </details>
                    <p>Open the console to see component availability diagnostics (🧭).</p>
                </div>
            );
        }
        return this.props.children;
    }
}

// Render App inside ErrorBoundary
function renderApp() {
    try {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        );
    } catch (e) {
        console.error('Render failed:', e);
    }
}

// If the i18n loader exposes a readiness Promise, wait for it before rendering.
if (window.i18nReady && typeof window.i18nReady.then === 'function') {
    window.i18nReady.then(() => {
        renderApp();
    }).catch((err) => {
        console.warn('i18n readiness promise rejected, rendering anyway', err);
        renderApp();
    });
} else {
    renderApp();
}



