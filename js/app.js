// Main App Component - 5 LINGUE COMPLETE + SETTINGS + v4.2 NEW SCHEDULED NOTIFICATIONS
// Se usi <script type="text/babel">, importa React e gli hook globalmente
const { useState, useEffect, useCallback } = React;

const App = () => {
    // 🔒 ADMIN PASSWORD PROTECTION + RECOVERY
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [showPasswordError, setShowPasswordError] = useState(false);
    const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
    const [securityAnswers, setSecurityAnswers] = useState({ answer1: '', answer2: '' });
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
    const [appSettings, setAppSettings] = useState({ weekStart: 1 });
    const [sheets, setSheets] = useState([]);
    const [blacklist, setBlacklist] = useState([]);
    const [auditLog, setAuditLog] = useState([]);
    const [currentView, setCurrentView] = useState('dashboard');
    const [autoArchiveDay, setAutoArchiveDay] = useState(5); // Day of month to auto-archive

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

        // 🔐 Carica password hash da Firebase
        if (firebaseDb) {
            firebaseDb.collection('settings').doc('adminAuth').get()
                .then(doc => {
                    if (doc.exists && doc.data().passwordHash) {
                        setAdminPasswordHash(doc.data().passwordHash);
                        console.log('✅ Password hash caricato da Firebase');
                    } else {
                        // Prima installazione - usa hash default e salvalo
                        const defaultHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // "admin123"
                        setAdminPasswordHash(defaultHash);
                        firebaseDb.collection('settings').doc('adminAuth').set({
                            passwordHash: defaultHash,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            note: 'Password default: admin123 - CAMBIARLA SUBITO!'
                        }, { merge: true });
                        console.log('⚠️ Password default impostata - CAMBIARLA SUBITO!');
                    }
                })
                .catch(err => {
                    console.error('Errore caricamento password:', err);
                    // Fallback a hash default
                    setAdminPasswordHash('240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');
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
            console.log('👤 Admin mode (default)');
            // Verifica se c'è una sessione valida (24 ore)
            const savedAuth = localStorage.getItem('adminAuth');
            if (savedAuth) {
                try {
                    const { timestamp } = JSON.parse(savedAuth);
                    const now = Date.now();
                    const twentyFourHours = 24 * 60 * 60 * 1000;
                    if (now - timestamp < twentyFourHours) {
                        setIsAuthenticated(true);
                        console.log('✅ Sessione admin valida');
                    } else {
                        localStorage.removeItem('adminAuth');
                        console.log('⏰ Sessione admin scaduta');
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

    // �🔒 Funzione verifica password admin
    const handleAdminLogin = async () => {
        if (!adminPasswordHash) {
            setShowPasswordError(true);
            setTimeout(() => setShowPasswordError(false), 3000);
            return;
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(passwordInput);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            if (hashHex === adminPasswordHash) {
                setIsAuthenticated(true);
                setShowPasswordError(false);
                // Salva sessione per 24 ore
                localStorage.setItem('adminAuth', JSON.stringify({ timestamp: Date.now() }));
            } else {
                setShowPasswordError(true);
                setTimeout(() => setShowPasswordError(false), 3000);
            }
        } catch (e) {
            console.error('Errore verifica password:', e);
            setShowPasswordError(true);
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
            
            if (!securityDoc.exists || !securityDoc.data().question1Hash) {
                setRecoveryError(t.noRecoverySet || 'Nessun sistema di recupero configurato! Vai in Impostazioni per configurarlo.');
                return;
            }

            const { question1Hash, question2Hash } = securityDoc.data();
            
            // Hash delle risposte fornite
            const encoder = new TextEncoder();
            const answer1Buffer = await crypto.subtle.digest('SHA-256', encoder.encode(securityAnswers.answer1.toLowerCase().trim()));
            const answer2Buffer = await crypto.subtle.digest('SHA-256', encoder.encode(securityAnswers.answer2.toLowerCase().trim()));
            const answer1Hash = Array.from(new Uint8Array(answer1Buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            const answer2Hash = Array.from(new Uint8Array(answer2Buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            if (answer1Hash === question1Hash && answer2Hash === question2Hash) {
                // Risposte corrette - permetti reset password
                if (newPassword.length < 6) {
                    setRecoveryError(t.passwordTooShort || 'Password troppo corta (minimo 6 caratteri)');
                    return;
                }
                if (newPassword !== confirmPassword) {
                    setRecoveryError(t.passwordMismatch || 'Le password non corrispondono');
                    return;
                }

                // Genera nuovo hash password
                const newPassBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(newPassword));
                const newPassHash = Array.from(new Uint8Array(newPassBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
                
                // 💾 SALVA in Firebase invece di mostrare alert
                await db.collection('settings').doc('adminAuth').set({
                    passwordHash: newPassHash,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedVia: 'recovery'
                }, { merge: true });

                // Aggiorna lo state locale
                setAdminPasswordHash(newPassHash);
                
                showToast('✅ Password reimpostata con successo!', 'success');
                
                // Resetta il form e torna al login
                setShowPasswordRecovery(false);
                setSecurityAnswers({ answer1: '', answer2: '' });
                setNewPassword('');
                setConfirmPassword('');
                setRecoveryError('');
                setPasswordInput('');
            } else {
                setRecoveryError(t.wrongSecurityAnswers || 'Risposte di sicurezza errate!');
                setTimeout(() => setRecoveryError(''), 3000);
            }
        } catch (e) {
            console.error('Errore recupero password:', e);
            setRecoveryError(t.recoveryError || 'Errore durante il recupero');
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

    // Listen to Firestore collections (Admin mode only)
    useEffect(() => {
        if (!db || mode !== 'admin') return;
        
        const unsubscribeSheets = db.collection('timesheets')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSheets(data);
            });
        
        const unsubscribeBlacklist = db.collection('blacklist')
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
        
        const unsubscribeAudit = db.collection('auditLog')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAuditLog(data);
            });
        
        return () => {
            unsubscribeSheets();
            unsubscribeBlacklist();
            unsubscribeAudit();
        };
    }, [db, mode]);

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
                setAppSettings(prev => ({ ...prev, weekStart: typeof data.weekStart !== 'undefined' ? Number(data.weekStart) : (prev.weekStart || 1) }));
            }, (err) => {
                console.error('Error loading app settings:', err);
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
    const addAuditLog = useCallback(async (action, details) => {
        if (!db) return;
        
        const logEntry = {
            action,
            details,
            timestamp: new Date().toISOString(),
            user: 'Admin'
        };
        
        try {
            await db.collection('auditLog').add(logEntry);
        } catch (error) {
            console.error('Errore log:', error);
        }
    }, [db]);

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
            responsabile: '',
            note: '',
            lavoratori: [],
            firmaResponsabile: null,
            status: 'draft',
            archived: false,
            createdAt: new Date().toISOString()
        };
        try {
            // Reserve a numeric sheetNumber using an atomic counter
            let sheetNumber = null;
            try {
                const counterRef = db.collection('counters').doc('sheets');
                await db.runTransaction(async (tx) => {
                    const snap = await tx.get(counterRef);
                    if (!snap.exists) {
                        tx.set(counterRef, { next: 2 });
                        sheetNumber = 1;
                    } else {
                        const next = snap.data().next || 1;
                        sheetNumber = next;
                        tx.update(counterRef, { next: next + 1 });
                    }
                });
            } catch (e) {
                console.error('Error reserving sheetNumber, proceeding without it', e);
            }

            if (sheetNumber !== null) newSheet.sheetNumber = sheetNumber;

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
    const DashboardComp = window.Dashboard || (() => React.createElement('div', null, t.dashboardNotLoaded || 'Dashboard non caricato'));
    const WorkerModeComp = window.WorkerMode || (() => React.createElement('div', null, t.workerModeNotLoaded || 'WorkerMode non caricato'));
    const SheetListComp = window.SheetList || (() => React.createElement('div', null, t.sheetListNotLoaded || 'SheetList non caricata'));
    const SheetEditorComp = window.SheetEditor || (() => React.createElement('div', null, t.editorNotLoaded || 'Editor non caricato'));
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

    // 🔒 SCHERMATA LOGIN ADMIN
    if (!isAuthenticated) {
        // Se è attiva la schermata di recupero password
        if (showPasswordRecovery) {
            if (loadingRecovery) {
                return (
                    <div className="min-h-screen flex items-center justify-center bg-gray-900">
                        <div className="loader"></div>
                    </div>
                );
            }

            return (
                <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
                    <div className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-800/90 backdrop-blur-lg border border-indigo-500/20' : 'bg-white/90 backdrop-blur-lg border border-indigo-200'}`}>
                        <div className="text-center mb-8">
                            <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                🔑 {t.passwordRecovery || 'Recupero Password'}
                            </h1>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t.answerSecurityQuestions || 'Rispondi alle domande di sicurezza'}
                            </p>
                        </div>

                        {!recoveryData || !recoveryData.question1 ? (
                            <div className="text-center space-y-4">
                                <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                                    ❌ {t.noRecoverySet || 'Nessun sistema di recupero configurato!'}
                                </div>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t.configureRecoveryInSettings || 'Configura le domande di sicurezza nelle Impostazioni dopo il login.'}
                                </p>
                                <button
                                    onClick={() => setShowPasswordRecovery(false)}
                                    className={`w-full py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                >
                                    ← {t.backToLogin || 'Torna al Login'}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); handlePasswordRecovery(); }} className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        {recoveryData.question1 || t.securityQuestion1}
                                    </label>
                                    <input
                                        type="text"
                                        value={securityAnswers.answer1}
                                        onChange={(e) => setSecurityAnswers({...securityAnswers, answer1: e.target.value})}
                                        className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-indigo-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500/50`}
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        {recoveryData.question2 || t.securityQuestion2}
                                    </label>
                                    <input
                                        type="text"
                                        value={securityAnswers.answer2}
                                        onChange={(e) => setSecurityAnswers({...securityAnswers, answer2: e.target.value})}
                                        className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-indigo-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500/50`}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        {t.newPassword || 'Nuova Password'}
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-indigo-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500/50`}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        {t.confirmPassword || 'Conferma Password'}
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={`w-full px-4 py-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-indigo-200 text-gray-900'} focus:ring-2 focus:ring-indigo-500/50`}
                                    />
                                </div>

                                {recoveryError && (
                                    <div className="animate-shake bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                                        ❌ {recoveryError}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <button
                                        type="submit"
                                        className={`w-full py-3 rounded-lg font-semibold ${darkMode ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white' : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'}`}
                                    >
                                        🔓 {t.resetPassword || 'Reimposta Password'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordRecovery(false);
                                            setSecurityAnswers({ answer1: '', answer2: '' });
                                            setNewPassword('');
                                            setConfirmPassword('');
                                            setRecoveryError('');
                                        }}
                                        className={`w-full py-2 rounded-lg font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    >
                                        ← {t.backToLogin || 'Torna al Login'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                                {darkMode ? '☀️' : '🌙'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Schermata login normale
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
                <div className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-2xl ${darkMode ? 'bg-gray-800/90 backdrop-blur-lg border border-indigo-500/20' : 'bg-white/90 backdrop-blur-lg border border-indigo-200'}`}>
                    {/* Logo/Title */}
                    <div className="text-center mb-8">
                        <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            🔒 Admin Access
                        </h1>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t.adminLoginDescription || 'Inserisci la password per accedere alla dashboard amministratore'}
                        </p>
                    </div>

                    {/* Password Form */}
                    <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }} className="space-y-6">
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {t.password || 'Password'}
                            </label>
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full px-4 py-3 rounded-lg border ${
                                    darkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500' 
                                        : 'bg-white border-indigo-200 text-gray-900 placeholder-gray-400 focus:border-indigo-400'
                                } focus:ring-2 focus:ring-indigo-500/50 transition-all`}
                                autoFocus
                            />
                        </div>

                        {showPasswordError && (
                            <div className="animate-shake bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                                ❌ {t.wrongPassword || 'Password errata! Riprova.'}
                            </div>
                        )}

                        <button
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
                        💡 {t.adminLoginHint || 'Password predefinita: admin123 (CAMBIARLA in app.js!)'}
                    </p>
                </div>
            </div>
        );
    }

    // Admin Mode
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
                        {/* Titolo con Animazione */}
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 group relative z-10">
                            <div className="min-w-0">
                                <h1 className={`text-base sm:text-2xl font-bold truncate bg-gradient-to-r ${
                                    darkMode 
                                        ? 'from-white via-indigo-200 to-purple-200' 
                                        : 'from-indigo-600 via-purple-600 to-pink-600'
                                } bg-clip-text text-transparent`}>
                                    {t.administrator}
                                </h1>
                                    <p className={`text-xs sm:text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-500'} font-medium truncate`}>
                                        { t.appSubtitle || '📋 Report Ore Facchini' }
                                    </p>
                            </div>
                        </div>
                        
                        {/* Desktop Navigation - MODERNIZZATO */}
                        <nav className="hidden lg:flex items-center gap-2">
                            {[
                                { view: 'dashboard', icon: '📊', label: t.dashboard },
                                { view: 'list', icon: '📋', label: t.sheets },
                                { view: 'calendar', icon: '📆', label: t.calendar || 'Calendario' },
                                { view: 'workerstats', icon: '👤', label: t.workerStatistics || 'Statistiche' },
                                { view: 'blacklist', icon: '🚫', label: t.blacklist },
                                { view: 'reports', icon: '📈', label: t.reports },
                                { view: 'settings', icon: '⚙️', label: t.settings }
                            ].map(item => (
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

                        {/* Actions - MODERNIZZATE */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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

                            {/* RadioPlayer ora solo nel Dashboard widget */}
                        </div>
                    </div>

                    {/* OLD Mobile Menu Hamburger - DISABLED: Sostituito da bottom nav, mantiene state per compatibilità */}
                    {false && mobileMenuOpen && (
                        <nav className={`lg:hidden mt-3 flex flex-col gap-2 animate-fade-in p-3 rounded-xl ${
                            darkMode ? 'bg-gray-800/50 backdrop-blur-md' : 'bg-white/50 backdrop-blur-md'
                        }`}>
                            {[
                                { view: 'dashboard', icon: '📊', label: t.dashboard },
                                { view: 'list', icon: '📋', label: t.sheets },
                                { view: 'calendar', icon: '📆', label: t.calendar || 'Calendario' },
                                { view: 'workerstats', icon: '👤', label: t.workerStatistics || 'Statistiche' },
                                { view: 'blacklist', icon: '🚫', label: t.blacklist },
                                { view: 'reports', icon: '�', label: t.reports },
                                { view: 'settings', icon: '⚙️', label: t.settings }
                            ].map(item => (
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
                    <button
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
                    </button>

                    {/* Fogli */}
                    <button
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
                    </button>

                    {/* Statistiche */}
                    <button
                        onClick={() => { setCurrentView('workerstats'); setMoreMenuOpen(false); }}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                            currentView === 'workerstats'
                                ? darkMode
                                    ? 'bg-indigo-600 text-white scale-110'
                                    : 'bg-indigo-500 text-white scale-110'
                                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'
                        }`}
                    >
                        <span className="text-xl">👤</span>
                        <span className="text-xs mt-1 font-medium">{t.stats || 'Stats'}</span>
                    </button>

                    {/* Blacklist */}
                    <button
                        onClick={() => { setCurrentView('blacklist'); setMoreMenuOpen(false); }}
                        className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all ${
                            currentView === 'blacklist'
                                ? darkMode
                                    ? 'bg-indigo-600 text-white scale-110'
                                    : 'bg-indigo-500 text-white scale-110'
                                : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'
                        }`}
                    >
                        <span className="text-xl">🚫</span>
                        <span className="text-xs mt-1 font-medium">{t.blacklist || 'Blacklist'}</span>
                    </button>

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
                                { view: 'calendar', icon: '📆', label: t.calendar || 'Calendario' },
                                { view: 'reports', icon: '📈', label: t.reports || 'Report' },
                                { view: 'settings', icon: '⚙️', label: t.settings || 'Impostazioni' }
                            ].map(item => (
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
                    <DashboardComp sheets={sheets} darkMode={darkMode} language={language} weekStart={appSettings.weekStart} />
                )}

                {currentView === 'list' && (
                    <div>
                        <button
                            onClick={createNewSheet}
                            className="w-full mb-4 sm:mb-6 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-base sm:text-lg transition-colors touch-button"
                        >
                            ➕ {t.createNewSheet}
                        </button>
                        <SheetListComp
                            sheets={sheets}
                            onSelectSheet={(sheet) => {
                                setCurrentSheet(sheet);
                                setCurrentView('sheet');
                            }}
                            onDeleteSheet={deleteSheet}
                            onArchiveSheet={archiveSheet}
                            darkMode={darkMode}
                            language={language}
                            companyLogo={companyLogo}
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
                    />
                )}

                {/* Calendar View */}
                {currentView === 'calendar' && (
                    <CalendarComp 
                        sheets={sheets}
                        darkMode={darkMode}
                        language={language}
                        onSelectSheet={(sheet) => {
                            setCurrentSheet(sheet);
                            setCurrentView('sheet');
                        }}
                    />
                )}

                {/* Worker Stats View */}
                {currentView === 'workerstats' && (
                    <WorkerStatsComp
                        sheets={sheets}
                        darkMode={darkMode}
                        language={language}
                        onBack={() => setCurrentView('dashboard')}
                        onAddToBlacklist={addToBlacklist}
                        blacklist={blacklist}
                    />
                )}

                {currentView === 'blacklist' && (
                    <BlacklistComp
                        blacklist={blacklist}
                        removeFromBlacklist={removeFromBlacklist}
                        darkMode={darkMode}
                        language={language}
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
                        sheets={sheets}
                        darkMode={darkMode}
                        language={language}
                        companyLogo={companyLogo}
                        setCompanyLogo={setCompanyLogo}
                        autoArchiveDay={autoArchiveDay}
                        setAutoArchiveDay={setAutoArchiveDay}
                        auditLog={auditLog}
                    />
                )}
            </main>
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
