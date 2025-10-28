// Main App Component - 5 LINGUE COMPLETE + SETTINGS + v4.2 NEW SCHEDULED NOTIFICATIONS
// Se usi <script type="text/babel">, importa React e gli hook globalmente
const { useState, useEffect, useCallback } = React;

const App = () => {
    // Importa RadioPlayer dal global scope se usi <script type="text/babel">
    // Assicurati che js/components/RadioPlayer.js sia incluso in index.html prima di app.js
    // Tutto il codice React qui dentro
    const [currentSheet, setCurrentSheet] = useState(null);
    const [companyLogo, setCompanyLogo] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

    // Initialize Firebase
    useEffect(() => {
        const { db: firebaseDb, storage: firebaseStorage } = initializeFirebase();
        setDb(firebaseDb);
        setStorage(firebaseStorage);
        
        // Load preferences
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        const savedLanguage = localStorage.getItem('language') || 'it';
        const savedLogo = localStorage.getItem('companyLogo');
        
    setDarkMode(savedDarkMode);
    setAppLanguage(savedLanguage);
        if (savedLogo) setCompanyLogo(savedLogo);
        
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
        } else {
            console.log('👤 Admin mode (default)');
        }
        
        setLoading(false);
    }, []);

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
                                { view: 'audit', icon: '📝', label: t.auditLog },
                                { view: 'reports', icon: '📈', label: t.reports },
                                { view: 'backup', icon: '💾', label: t.backupData || 'Backup' },
                                { view: 'scheduledNotifications', icon: '⏰', label: t.notifications || 'Notifiche' }, // ⭐ NEW
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


                            {/* Sync Button - PULSE ANIMATION */}
                            <button
                                onClick={() => {
                                    showToast('🔄 ' + (t.syncing || 'Sincronizzazione...'), 'info');
                                    setTimeout(() => {
                                        showToast('✅ ' + (t.synced || 'Sincronizzato!'), 'success');
                                    }, 1000);
                                }}
                                className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 hover:rotate-180 ${
                                    darkMode
                                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 shadow-lg shadow-green-500/20'
                                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-700 shadow-lg shadow-green-500/20'
                                }`}
                                title={t.syncButtonTitle || 'Sincronizza'}
                            >
                                🔄
                            </button>

                            {/* RadioPlayer ora solo nel Dashboard widget */}

                            {/* Logo Upload - GRADIENT BORDER */}
                            <label className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg cursor-pointer transition-all duration-300 hover:scale-110 ${
                                darkMode
                                    ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 shadow-lg shadow-purple-500/20'
                                    : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 shadow-lg shadow-purple-500/20'
                            }`} title={t.uploadLogo}>
                                🖼️
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoUpload} 
                                    className="hidden" 
                                />
                            </label>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className={`lg:hidden px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-bold transition-all duration-300 ${
                                    darkMode
                                        ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-white shadow-lg shadow-indigo-500/20'
                                        : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-700 shadow-lg shadow-indigo-500/20'
                                }`}
                                aria-label="Menu"
                            >
                                {mobileMenuOpen ? '✕' : '☰'}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation - MODERNIZZATO */}
                    {mobileMenuOpen && (
                        <nav className={`lg:hidden mt-3 flex flex-col gap-2 animate-fade-in p-3 rounded-xl ${
                            darkMode ? 'bg-gray-800/50 backdrop-blur-md' : 'bg-white/50 backdrop-blur-md'
                        }`}>
                            {[
                                { view: 'dashboard', icon: '📊', label: t.dashboard },
                                { view: 'list', icon: '📋', label: t.sheets },
                                { view: 'calendar', icon: '📆', label: t.calendar || 'Calendario' },
                                { view: 'workerstats', icon: '👤', label: t.workerStatistics || 'Statistiche' },
                                { view: 'blacklist', icon: '🚫', label: t.blacklist },
                                { view: 'audit', icon: '📝', label: t.auditLog },
                                { view: 'reports', icon: '📈', label: t.reports },
                                { view: 'backup', icon: '💾', label: t.backupData || 'Backup' },
                                { view: 'scheduledNotifications', icon: '⏰', label: t.notifications || 'Notifiche' }, // ⭐ NEW
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

            {/* Main Content */}
            <main className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
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

                {/* ⭐ NEW: Scheduled Notifications View */}
                {currentView === 'scheduledNotifications' && (
                    <ScheduledNotificationsComp
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
