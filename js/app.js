// Main App Component - 5 LINGUE COMPLETE
const App = () => {
    const { useState, useEffect, useCallback, useMemo } = React;
    
    // State Management
    const [db, setDb] = useState(null);
    const [storage, setStorage] = useState(null);
    const [mode, setMode] = useState('admin'); // admin, worker
    const [sheetId, setSheetId] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState('it');
    const [loading, setLoading] = useState(true);
    
    // Admin State
    const [currentView, setCurrentView] = useState('dashboard'); // dashboard, list, sheet, blacklist, audit, reports
    const [sheets, setSheets] = useState([]);
    const [blacklist, setBlacklist] = useState([]);
    const [auditLog, setAuditLog] = useState([]);
    const [currentSheet, setCurrentSheet] = useState(null);
    const [companyLogo, setCompanyLogo] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        setLanguage(savedLanguage);
        if (savedLogo) setCompanyLogo(savedLogo);
        
        // Check URL params for worker mode
        const params = new URLSearchParams(window.location.search);
        const urlMode = params.get('mode');
        const urlSheet = params.get('sheet');
        
        if (urlMode === 'worker' && urlSheet) {
            setMode('worker');
            setSheetId(urlSheet);
        }
        
        setLoading(false);
    }, []);

    // Save preferences
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        localStorage.setItem('language', language);
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
        
        setLoading(true);
        
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
    const addToBlacklist = useCallback(async (worker, reason) => {
        if (!db) return;
        
        const blacklistEntry = {
            nome: worker.nome,
            cognome: worker.cognome,
            codiceFiscale: worker.codiceFiscale || '',
            numeroIdentita: worker.numeroIdentita || '',
            telefono: worker.telefono || '',
            reason,
            addedAt: new Date().toISOString(),
            addedBy: 'Admin'
        };
        
        try {
            await db.collection('blacklist').add(blacklistEntry);
            await addAuditLog('BLACKLIST_ADD', `${worker.nome} ${worker.cognome} - ${reason}`);
            showToast(`🚫 ${t.blacklistAdded}`, 'success');
        } catch (error) {
            console.error(error);
            showToast(`❌ ${t.error}`, 'error');
        }
    }, [db, addAuditLog, language]);

    // Remove from Blacklist
    const removeFromBlacklist = useCallback(async (blacklistId) => {
        if (!db) return;
        
        try {
            const doc = await db.collection('blacklist').doc(blacklistId).get();
            const data = doc.data();
            await db.collection('blacklist').doc(blacklistId).delete();
            await addAuditLog('BLACKLIST_REMOVE', `${data.nome} ${data.cognome}`);
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

    const t = translations[language];
    const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-indigo-100';

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="loader"></div>
            </div>
        );
    }

    // Worker Mode
    if (mode === 'worker') {
        return <WorkerMode sheetId={sheetId} db={db} darkMode={darkMode} language={language} />;
    }

    // Admin Mode
    return (
        <div className={`min-h-screen ${bgClass}`}>
            {/* Header - MOBILE OTTIMIZZATO */}
            <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                        {/* Logo e Titolo */}
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink">
                            {companyLogo && (
                                <img 
                                    src={companyLogo} 
                                    alt="Logo" 
                                    className="h-7 w-7 sm:h-10 sm:w-10 object-contain flex-shrink-0" 
                                />
                            )}
                            <h1 className="text-base sm:text-2xl font-bold truncate">
                                {t.administrator}
                            </h1>
                        </div>
                        
                        {/* Desktop Navigation - NASCOSTO SU MOBILE */}
                        <nav className="hidden md:flex items-center gap-3">
                            <button
                                onClick={() => setCurrentView('dashboard')}
                                className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                                    currentView === 'dashboard' 
                                        ? 'bg-white text-indigo-600 font-semibold' 
                                        : 'hover:bg-indigo-700'
                                }`}
                            >
                                📊 {t.dashboard}
                            </button>
                            <button
                                onClick={() => setCurrentView('list')}
                                className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                                    currentView === 'list' 
                                        ? 'bg-white text-indigo-600 font-semibold' 
                                        : 'hover:bg-indigo-700'
                                }`}
                            >
                                📋 {t.sheets}
                            </button>
                            <button
                                onClick={() => setCurrentView('blacklist')}
                                className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                                    currentView === 'blacklist' 
                                        ? 'bg-white text-indigo-600 font-semibold' 
                                        : 'hover:bg-indigo-700'
                                }`}
                            >
                                🚫 {t.blacklist}
                            </button>
                            <button
                                onClick={() => setCurrentView('audit')}
                                className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                                    currentView === 'audit' 
                                        ? 'bg-white text-indigo-600 font-semibold' 
                                        : 'hover:bg-indigo-700'
                                }`}
                            >
                                📝 {t.auditLog}
                            </button>
                            <button
                                onClick={() => setCurrentView('reports')}
                                className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                                    currentView === 'reports' 
                                        ? 'bg-white text-indigo-600 font-semibold' 
                                        : 'hover:bg-indigo-700'
                                }`}
                            >
                                📈 {t.reports}
                            </button>
                        </nav>

                        {/* Actions - COMPATTE SU MOBILE */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {/* Language Selector - 5 LINGUE */}
<select
    value={language}
    onChange={(e) => setLanguage(e.target.value)}
    className="language-selector px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white text-sm"
>
                                <option value="it">🇮🇹 IT</option>
                                <option value="en">🇬🇧 EN</option>
                                <option value="es">🇪🇸 ES</option>
                                <option value="fr">🇫🇷 FR</option>
                                <option value="ro">🇷🇴 RO</option>
                            </select>

                            {/* Dark Mode Toggle */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                                title={darkMode ? 'Light Mode' : 'Dark Mode'}
                            >
                                {darkMode ? '☀️' : '🌙'}
                            </button>

                            {/* Logo Upload */}
                            <label className="px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 cursor-pointer transition-colors" title={t.uploadLogo}>
                                🖼️
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoUpload} 
                                    className="hidden" 
                                />
                            </label>

                            {/* Mobile Menu Toggle - SOLO SU MOBILE */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors font-bold"
                                aria-label="Menu"
                            >
                                {mobileMenuOpen ? '✕' : '☰'}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation - SI APRE SOTTO */}
                    {mobileMenuOpen && (
                        <nav className="md:hidden mt-3 flex flex-col gap-2">
                            <button
                                onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
                                className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                                    currentView === 'dashboard' 
                                        ? 'bg-white text-indigo-600 font-semibold' 
                                        : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                                }`}
                            >
                                📊 {t.dashboard}
                            </button>
                            <button
                                onClick={() => { setCurrentView('list'); setMobileMenuOpen(false); }}
                                className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                                    currentView === 'list' 
                                        ? 'bg-white text-indigo-600 font-semibold' 
                                        : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                                }`}
                            >
                                📋 {t.sheets}
                            </button>
                            <button
                                onClick={() => { setCurrentView('blacklist'); setMobileMenuOpen(false); }}
                                className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                                    currentView === 'blacklist' 
                                        ? 'bg-white text-indigo-600 font-semibold' 
                                        : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                                }`}
                            >
                                🚫 {t.blacklist}
                            </button>
                            <button
                                onClick={() => { setCurrentView('audit'); setMobileMenuOpen(false); }}
                                className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                                    currentView === 'audit' 
                                        ? 'bg-white text-indigo-600 font-semibold' 
                                        : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                                }`}
                            >
                                📝 {t.auditLog}
                            </button>
                            <button
                                onClick={() => { setCurrentView('reports'); setMobileMenuOpen(false); }}
                                className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                                    currentView === 'reports' 
                                        ? 'bg-white text-indigo-600 font-semibold' 
                                        : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                                }`}
                            >
                                📈 {t.reports}
                            </button>
                        </nav>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
                {currentView === 'dashboard' && (
                    <Dashboard sheets={sheets} darkMode={darkMode} language={language} />
                )}

                {currentView === 'list' && (
                    <div>
                        <button
                            onClick={createNewSheet}
                            className="w-full mb-4 sm:mb-6 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-base sm:text-lg transition-colors touch-button"
                        >
                            ➕ {t.createNewSheet}
                        </button>
                        <SheetList
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
                    <SheetEditor
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

                {currentView === 'blacklist' && (
                    <Blacklist
                        blacklist={blacklist}
                        removeFromBlacklist={removeFromBlacklist}
                        darkMode={darkMode}
                        language={language}
                    />
                )}

                {currentView === 'audit' && (
                    <AuditLog
                        auditLog={auditLog}
                        darkMode={darkMode}
                        language={language}
                        db={db}
                    />
                )}

                {currentView === 'reports' && (
                    <ReportManager
                        sheets={sheets}
                        darkMode={darkMode}
                        language={language}
                        companyLogo={companyLogo}
                    />
                )}
            </main>
        </div>
    );
};

// Render App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
