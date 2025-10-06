// Main App Component
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
            showToast('❌ Database non connesso', 'error');
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
            await addAuditLog('SHEET_CREATE', `Nuovo foglio creato: ${docRef.id}`);
            showToast('✅ Nuovo foglio creato!', 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Errore creazione foglio', 'error');
        }
        
        setLoading(false);
    }, [db, addAuditLog]);

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
            await addAuditLog('SHEET_DELETE', `Eliminato: ${sheet?.titoloAzienda || sheetId}`);
            showToast('✅ Foglio eliminato', 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Errore eliminazione', 'error');
        }
    }, [db, sheets, addAuditLog]);

    // Archive/Restore Sheet
    const archiveSheet = useCallback(async (sheetId, archive = true) => {
        if (!db) return;
        
        try {
            await db.collection('timesheets').doc(sheetId).update({ archived: archive });
            await addAuditLog(
                archive ? 'SHEET_ARCHIVE' : 'SHEET_RESTORE', 
                `${archive ? 'Archiviato' : 'Ripristinato'}: ${sheetId}`
            );
            showToast(archive ? '📦 Foglio archiviato' : '↩️ Foglio ripristinato', 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Errore', 'error');
        }
    }, [db, addAuditLog]);

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
            showToast('🚫 Aggiunto alla blacklist', 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Errore blacklist', 'error');
        }
    }, [db, addAuditLog]);

    // Remove from Blacklist
    const removeFromBlacklist = useCallback(async (blacklistId) => {
        if (!db) return;
        
        try {
            const doc = await db.collection('blacklist').doc(blacklistId).get();
            const data = doc.data();
            await db.collection('blacklist').doc(blacklistId).delete();
            await addAuditLog('BLACKLIST_REMOVE', `${data.nome} ${data.cognome}`);
            showToast('✅ Rimosso dalla blacklist', 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Errore rimozione', 'error');
        }
    }, [db, addAuditLog]);

    // Handle Logo Upload
    const handleLogoUpload = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const logoData = e.target.result;
                setCompanyLogo(logoData);
                localStorage.setItem('companyLogo', logoData);
                showToast('✅ Logo caricato!', 'success');
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const t = translations[language];
    const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-indigo-100';
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';

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
            {/* Header */}
            <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            {companyLogo && (
                                <img src={companyLogo} alt="Logo" className="h-10 w-10 object-contain" />
                            )}
                            <h1 className="text-2xl font-bold">{t.administrator}</h1>
                        </div>
                        
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-4">
                            <button
                                onClick={() => setCurrentView('dashboard')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    currentView === 'dashboard' ? 'bg-white text-indigo-600 font-semibold' : 'hover:bg-indigo-700'
                                }`}
                            >
                                📊 {t.dashboard}
                            </button>
                            <button
                                onClick={() => setCurrentView('list')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    currentView === 'list' ? 'bg-white text-indigo-600 font-semibold' : 'hover:bg-indigo-700'
                                }`}
                            >
                                📋 Fogli
                            </button>
                            <button
                                onClick={() => setCurrentView('blacklist')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    currentView === 'blacklist' ? 'bg-white text-indigo-600 font-semibold' : 'hover:bg-indigo-700'
                                }`}
                            >
                                🚫 {t.blacklist}
                            </button>
                            <button
                                onClick={() => setCurrentView('audit')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    currentView === 'audit' ? 'bg-white text-indigo-600 font-semibold' : 'hover:bg-indigo-700'
                                }`}
                            >
                                📝 {t.auditLog}
                            </button>
                            <button
                                onClick={() => setCurrentView('reports')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    currentView === 'reports' ? 'bg-white text-indigo-600 font-semibold' : 'hover:bg-indigo-700'
                                }`}
                            >
                                📈 {t.reports}
                            </button>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Language Selector */}
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="px-3 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white"
                            >
                                <option value="it">🇮🇹 IT</option>
                                <option value="en">🇬🇧 EN</option>
                                <option value="es">🇪🇸 ES</option>
                            </select>

                            {/* Dark Mode Toggle */}
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="px-3 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                            >
                                {darkMode ? '☀️' : '🌙'}
                            </button>

                            {/* Logo Upload */}
                            <label className="px-3 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 cursor-pointer transition-colors">
                                🖼️
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden px-3 py-2 rounded-lg bg-white bg-opacity-20"
                            >
                                ☰
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <nav className="md:hidden mt-4 flex flex-col gap-2">
                            <button
                                onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
                                className={`text-left px-4 py-2 rounded-lg ${currentView === 'dashboard' ? 'bg-white text-indigo-600' : 'hover:bg-indigo-700'}`}
                            >
                                📊 {t.dashboard}
                            </button>
                            <button
                                onClick={() => { setCurrentView('list'); setMobileMenuOpen(false); }}
                                className={`text-left px-4 py-2 rounded-lg ${currentView === 'list' ? 'bg-white text-indigo-600' : 'hover:bg-indigo-700'}`}
                            >
                                📋 Fogli
                            </button>
                            <button
                                onClick={() => { setCurrentView('blacklist'); setMobileMenuOpen(false); }}
                                className={`text-left px-4 py-2 rounded-lg ${currentView === 'blacklist' ? 'bg-white text-indigo-600' : 'hover:bg-indigo-700'}`}
                            >
                                🚫 {t.blacklist}
                            </button>
                            <button
                                onClick={() => { setCurrentView('audit'); setMobileMenuOpen(false); }}
                                className={`text-left px-4 py-2 rounded-lg ${currentView === 'audit' ? 'bg-white text-indigo-600' : 'hover:bg-indigo-700'}`}
                            >
                                📝 {t.auditLog}
                            </button>
                            <button
                                onClick={() => { setCurrentView('reports'); setMobileMenuOpen(false); }}
                                className={`text-left px-4 py-2 rounded-lg ${currentView === 'reports' ? 'bg-white text-indigo-600' : 'hover:bg-indigo-700'}`}
                            >
                                📈 {t.reports}
                            </button>
                        </nav>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 md:p-6 max-w-7xl mx-auto">
                {currentView === 'dashboard' && (
                    <Dashboard sheets={sheets} darkMode={darkMode} language={language} />
                )}

                {currentView === 'list' && (
                    <div>
                        <button
                            onClick={createNewSheet}
                            className="w-full mb-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors"
                        >
                            ➕ Crea Nuovo Foglio Ore
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
