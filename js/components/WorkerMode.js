// WeatherWidget is exposed globally as window.WeatherWidget
const WeatherWidget = window.WeatherWidget;

if (!window.WorkerMode) {
// Worker Mode Component - v4.2 FIX CANVAS BIANCO + CALCOLO PAUSA
const WorkerMode = ({ sheetId, db, darkMode: initialDarkMode, language = 'it' }) => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [sheetData, setSheetData] = React.useState(null);
    const [submittedWorkerId, setSubmittedWorkerId] = React.useState(null);
    
    // 🔍 Debug logging
    console.log('🚀 WorkerMode Component Loaded');
    console.log('📋 Sheet ID:', sheetId);
    console.log('🔥 DB Status:', db ? 'Connected ✅' : 'Not Connected ❌');
    console.log('🌍 Language:', language);
    
    // 🌓 Dark Mode Local State
    // localDarkMode: prefer global initialDarkMode unless the worker explicitly toggled theme before
    const [localDarkMode, setLocalDarkMode] = React.useState(() => {
        try {
            const explicit = localStorage.getItem('workerDarkModeExplicit');
            const saved = localStorage.getItem('workerDarkMode');
            // Only use a saved value if the worker explicitly toggled theme before.
            if (explicit === 'true' && saved !== null) {
                return saved === 'true';
            }
        } catch (e) {
            // ignore storage errors
        }
        // Default to light mode for Worker UI unless the worker explicitly chose dark.
        return false;
    });
    
    // 🌍 Language Local State
    const [localLanguage, setLocalLanguage] = React.useState(() => {
        const saved = localStorage.getItem('workerLanguage');
        return saved || language;
    });
    
    const [workerData, setWorkerData] = React.useState({
        nome: '',
        cognome: '',
        oraIn: '',
        oraOut: '',
        pausaMinuti: '',
        codiceFiscale: '',
        numeroIdentita: '',
        telefono: '',
        email: '',
        indirizzo: '',
        dataNascita: ''
    });
    const [showOptionalFields, setShowOptionalFields] = React.useState(false);
    

    // ⭐ Session Persistence State
    const [showSessionPrompt, setShowSessionPrompt] = React.useState(false);
    const [savedSession, setSavedSession] = React.useState(null);
    const [sessionKey, setSessionKey] = React.useState(null);

    // GDPR Privacy Notice State
    const [gdprText, setGdprText] = React.useState('');
    const [showGdpr, setShowGdpr] = React.useState(false);
    const [loadingGdpr, setLoadingGdpr] = React.useState(true);

    // Terms of Service State
    const [tosText, setTosText] = React.useState('');
    const [showTos, setShowTos] = React.useState(false);
    const [loadingTos, setLoadingTos] = React.useState(true);
    const [tosAccepted, setTosAccepted] = React.useState(false);

    // Load GDPR text from Firestore
    React.useEffect(() => {
        if (!db) return;
        const loadGdpr = async () => {
            try {
                const doc = await db.collection('settings').doc('privacyGDPR').get();
                if (doc.exists) setGdprText(doc.data().text || '');
            } catch (e) { console.error('Error loading GDPR text:', e); }
            setLoadingGdpr(false);
        };
        loadGdpr();
    }, [db]);

    // Load Terms of Service from Firestore
    React.useEffect(() => {
        if (!db) return;
        const loadTos = async () => {
            try {
                const doc = await db.collection('settings').doc('termsOfService').get();
                if (doc.exists) setTosText(doc.data().text || '');
            } catch (e) { console.error('Error loading Terms of Service:', e); }
            setLoadingTos(false);
        };
        loadTos();
    }, [db]);
    
    // 📄 PDF Generation State
    const [generatingPDF, setGeneratingPDF] = React.useState(false);
    
    // ⚙️ Link Expiration State
    const [linkExpired, setLinkExpired] = React.useState(false);
    
    // 🔧 FIX BUG #2: State per forzare re-render canvas
    const [canvasKey, setCanvasKey] = React.useState(0);
    
    const canvasRef = React.useRef(null);
    const cleanupRef = React.useRef(null);
    const autoSaveTimeoutRef = React.useRef(null);
    // Translation helper: prefer the centralized runtime `window.t` (provided by js/i18n.js).
    // Keep a safe fallback to the legacy `translations` object so migration is incremental.
    // We return a Proxy so existing code that uses `t.someKey` continues to work.
    const t = new Proxy({}, {
        get: (_target, prop) => {
            try {
                const key = String(prop);
                // Prefer runtime helper if available (async loader)
                if (typeof window !== 'undefined' && typeof window.t === 'function') {
                    return window.t(key);
                }
                // Fallback to global translations object if present
                const all = (typeof window !== 'undefined' && window.translations) || (typeof translations !== 'undefined' && translations) || {};
                const lang = localLanguage || 'it';
                return (all[lang] && all[lang][key]) || (all['it'] && all['it'][key]) || key;
            } catch (e) {
                return String(prop);
            }
        }
    });

    const darkMode = localDarkMode; // Use local dark mode

    // 🌓 Save Dark Mode Preference
    React.useEffect(() => {
        try {
            // Only set explicit flag when user toggles (we'll set it when toggle is used below).
            localStorage.setItem('workerDarkMode', localDarkMode);
            console.log('🌓 Dark Mode salvato:', localDarkMode);
        } catch (e) {
            console.warn('Could not persist workerDarkMode:', e);
        }
    }, [localDarkMode]);

    // NOTE: Do not modify global document 'dark' class here — WorkerMode uses localDarkMode
    // to style its own elements. Removing global sync avoids changing the admin theme unexpectedly.

    // Use global, validated calculator so placeholders like "--:--" are handled consistently
    const calculateHours = (oraIn, oraOut, pausaMinuti = 0) => {
        try {
            if (typeof window.calculateHours === 'function') {
                return window.calculateHours(oraIn, oraOut, pausaMinuti);
            }
            // Fallback to local simple logic
            if (!oraIn || !oraOut) return '0.00';
            const [inHours, inMinutes] = (''+oraIn).split(':').map(Number);
            const [outHours, outMinutes] = (''+oraOut).split(':').map(Number);
            if ([inHours, inMinutes, outHours, outMinutes].some(n => Number.isNaN(n))) return '0.00';
            let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
            if (totalMinutes < 0) totalMinutes += 24*60;
            const pausa = parseInt(pausaMinuti) || 0;
            totalMinutes -= pausa;
            if (totalMinutes < 0) return '0.00';
            return (totalMinutes / 60).toFixed(2);
        } catch (e) {
            console.error('calculateHours fallback error', e);
            return '0.00';
        }
    };

    // 🔧 FIX BUG #1: Check Link Expiration usando linkGeneratedAt
    React.useEffect(() => {
        if (!db || !sheetId) return;
        
        const checkLinkExpiration = async () => {
            try {
                // Get settings
                const settingsDoc = await db.collection('settings').doc('linkExpiration').get();
                const settings = settingsDoc.data();
                
                if (!settings || !settings.expirationDays || settings.expirationDays === 0) {
                    // No expiration set
                    console.log('✅ Nessuna scadenza impostata');
                    return;
                }
                
                // Get sheet link generation date
                const sheetDoc = await db.collection('timesheets').doc(sheetId).get();
                if (!sheetDoc.exists) return;
                
                // 🔧 FIX: Usa linkGeneratedAt invece di createdAt
                const linkGeneratedAt = sheetDoc.data().linkGeneratedAt;
                
                if (!linkGeneratedAt) {
                    // Link mai generato, non scade
                    console.log('✅ Link mai generato, nessuna scadenza');
                    return;
                }
                
                const generatedDate = new Date(linkGeneratedAt);
                const now = new Date();
                const daysDiff = (now - generatedDate) / (1000 * 60 * 60 * 24);
                
                console.log(`🔗 Link generato: ${generatedDate.toLocaleString()}`);
                console.log(`⏱️ Giorni trascorsi: ${daysDiff.toFixed(2)}`);
                console.log(`⚙️ Scadenza impostata: ${settings.expirationDays} giorni`);
                
                if (daysDiff > settings.expirationDays) {
                    console.log('❌ Link scaduto!');
                    setLinkExpired(true);
                    setError(t.linkExpired);
                    setLoading(false);
                } else {
                    console.log(`✅ Link valido ancora per ${(settings.expirationDays - daysDiff).toFixed(2)} giorni`);
                }
            } catch (err) {
                console.error('Error checking link expiration:', err);
            }
        };
        
        checkLinkExpiration();
    }, [db, sheetId, t]);

    // ⭐ Load Saved Session
    React.useEffect(() => {
        if (!db || !sheetId || linkExpired) return;
        
        const loadSession = async () => {
            try {
                const sessionsRef = db.collection('workerSessions');
                const snapshot = await sessionsRef
                    .where('sheetId', '==', sheetId)
                    .orderBy('lastModified', 'desc')
                    .limit(1)
                    .get();
                
                if (!snapshot.empty) {
                    const sessionDoc = snapshot.docs[0];
                    const session = sessionDoc.data();
                    
                    // Check if session is recent (within last 24 hours)
                    const lastModified = new Date(session.lastModified);
                    const now = new Date();
                    const hoursDiff = (now - lastModified) / (1000 * 60 * 60);
                    
                    if (hoursDiff < 24 && !session.submitted) {
                        setSavedSession(session);
                        setSessionKey(sessionDoc.id);
                        setShowSessionPrompt(true);
                    }
                }
            } catch (err) {
                console.error('Error loading session:', err);
                // If loading the session fails (for example due to missing index),
                // don't keep the whole UI stuck in loading state — allow the
                // form and canvas to initialize so the worker can still use the app.
                try { setLoading(false); } catch (e) { /* ignore */ }
            }
        };
        
        loadSession();
    }, [db, sheetId, linkExpired]);

    // ⭐ Auto-save Session
    const saveSession = React.useCallback(async (data) => {
        if (!db || !sheetId || linkExpired) return;
        
        try {
            const sessionData = {
                sheetId,
                workerData: data,
                lastModified: new Date().toISOString(),
                submitted: false
            };
            
            if (sessionKey) {
                // Update existing session
                await db.collection('workerSessions').doc(sessionKey).update(sessionData);
            } else {
                // Create new session
                const docRef = await db.collection('workerSessions').add(sessionData);
                setSessionKey(docRef.id);
            }
            
            console.log('✅ Session auto-saved');
        } catch (err) {
            console.error('Error saving session:', err);
        }
    }, [db, sheetId, sessionKey, linkExpired]);

    // ⭐ Handle Session Restore
    const restoreSession = () => {
        if (savedSession) {
            setWorkerData(savedSession.workerData);
            setShowSessionPrompt(false);
            showToast(`✅ ${t.sessionRestored}`, 'success');
        }
    };

    const startNewSession = async () => {
        setShowSessionPrompt(false);
        // Delete old session
        if (sessionKey) {
            try {
                await db.collection('workerSessions').doc(sessionKey).delete();
                setSessionKey(null);
            } catch (err) {
                console.error('Error deleting old session:', err);
            }
        }
    };

    // ⭐ Auto-save on data change
    React.useEffect(() => {
        if (showSessionPrompt) return; // Don't auto-save while showing prompt
        
        // Debounce auto-save
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
        
        autoSaveTimeoutRef.current = setTimeout(() => {
            if (workerData.nome || workerData.cognome || workerData.oraIn || workerData.oraOut) {
                saveSession(workerData);
            }
        }, 2000); // Save after 2 seconds of inactivity
        
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [workerData, saveSession, showSessionPrompt]);

    // 🔧 FIX #3: Re-initialize canvas when dark mode changes
    React.useEffect(() => {
        console.log('🎨 Dark mode changed, re-initializing canvas...');
        console.log('🌓 New dark mode value:', localDarkMode);
        
        // Increment canvas key to force re-render
        setCanvasKey(prevKey => prevKey + 1);
    }, [localDarkMode]);

    // 🌍 Save Language Preference
    React.useEffect(() => {
        localStorage.setItem('workerLanguage', localLanguage);
        // Ensure runtime i18n updates immediately for worker form
        try {
            if (typeof window !== 'undefined' && typeof window.setLanguage === 'function') {
                window.setLanguage(localLanguage);
            }
        } catch (e) {
            console.warn('Failed to sync workerLanguage to runtime i18n', e);
        }
    }, [localLanguage]);

    // Listen to sheet changes
    React.useEffect(() => {
        if (!sheetId || !db || linkExpired) return;
        
        const unsubscribe = db.collection('timesheets').doc(sheetId).onSnapshot(
            (doc) => {
                if (doc.exists) {
                    setSheetData({ id: doc.id, ...doc.data() });
                    setLoading(false);
                } else {
                    setError(t.sheetNotFound);
                    setLoading(false);
                }
            },
            (err) => {
                console.error(err);
                setError(t.errorLoading);
                setLoading(false);
            }
        );
        
        return () => unsubscribe();
    }, [sheetId, db, t, linkExpired]);

    // 🔧 FIX #4: Initialize canvas con supporto re-render e DARK MODE CORRETTO
    React.useEffect(() => {
        console.log('📄 WorkerMode: Inizializzo canvas...');
        console.log('🌓 Dark Mode attuale:', localDarkMode);
        console.log('🔑 Canvas Key:', canvasKey);
        
        if (canvasRef.current) {
            // Cleanup previous
            if (cleanupRef.current) {
                console.log('🧹 Cleanup precedente canvas');
                cleanupRef.current();
            }
            
            // 🔧 FIX: Usa localDarkMode per inizializzare correttamente il canvas
            console.log('🎨 Inizializzo canvas con darkMode =', localDarkMode);
            cleanupRef.current = initCanvas(canvasRef.current, localDarkMode);
            // After init, verify canvas has non-blank pixels; retry initialization up to 3 times if blank
            let retries = 0;
            const maxRetries = 3;
            const verifyAndRetry = () => {
                try {
                    const isBlank = window.isCanvasBlank(canvasRef.current);
                    console.log('✍️ Canvas blank check:', isBlank);
                    if (isBlank && retries < maxRetries) {
                        retries++;
                        console.log(`🔁 Canvas blank — retrying init (${retries}/${maxRetries})`);
                        // cleanup and re-init
                        if (cleanupRef.current) cleanupRef.current();
                        // force re-render of canvas element to ensure DOM/layout update
                        setCanvasKey(prev => prev + 1);
                        // schedule another check after a short delay
                        setTimeout(verifyAndRetry, 200);
                    }
                } catch (err) {
                    console.warn('Canvas verify failed:', err);
                }
            };

            // Run verification shortly after initialization
            setTimeout(verifyAndRetry, 150);
        }
        
        return () => {
            if (cleanupRef.current) {
                console.log('🧹 Final cleanup canvas');
                cleanupRef.current();
            }
        };
    }, [canvasKey, localDarkMode]); // 🔧 FIX: Dipende da localDarkMode

    // 🔧 SECONDARY MITIGATION: Force canvas init after a global timeout
    // Sometimes other async failures or race conditions prevent the canvas
    // from being initialized. This effect will try to initialize the canvas
    // a few times after mount to guarantee the signature area becomes usable.
    React.useEffect(() => {
        let attempts = 0;
        const maxAttempts = 3;
        const attemptDelay = 700; // ms
        let timerId = null;

        const tryForceInit = () => {
            attempts++;
            try {
                const c = canvasRef.current;
                const alreadyInit = !!cleanupRef.current;
                console.log(`🔁 forceInit attempt ${attempts}/${maxAttempts}, canvasRef:`, !!c, 'cleanup:', !!cleanupRef.current);

                if (c && (!alreadyInit || (window.isCanvasBlank && window.isCanvasBlank(c)))) {
                    // cleanup if any
                    try { if (cleanupRef.current) cleanupRef.current(); } catch (e) { console.warn('forceInit cleanup failed', e); }
                    try {
                        cleanupRef.current = window.initCanvas(c, localDarkMode);
                        console.log('✅ forceInit: canvas initialized');
                    } catch (e) {
                        console.warn('forceInit: initCanvas failed', e);
                    }
                }

                // If still blank and attempts left, schedule another try
                const isBlank = c && window.isCanvasBlank ? window.isCanvasBlank(c) : false;
                if (( !c || isBlank ) && attempts < maxAttempts) {
                    timerId = setTimeout(tryForceInit, attemptDelay);
                }
            } catch (err) {
                console.warn('forceInit: unexpected error', err);
            }
        };

        // Start first attempt after a short global delay so other async tasks can settle
        timerId = setTimeout(tryForceInit, 1000);

        return () => {
            try { if (timerId) clearTimeout(timerId); } catch (e) {}
        };
    }, [/* run once per mount */]);

    // Add character counter for 'nome', 'cognome', and 'oraIn' fields
    const handleCharacterCount = (field, maxLength) => {
        const value = workerData[field];
        return `${value.length}/${maxLength}`;
    };

    // Update saveWorkerData to enforce required fields
    const saveWorkerData = async () => {
        // Validation
        if (!workerData.nome || !workerData.cognome || !workerData.oraIn || !workerData.oraOut) {
            showToast(`❌ ${t.fillRequired}`, 'error');
            return;
        }

        // Check Terms of Service acceptance
        if (!tosAccepted) {
            showToast(`❌ ${t.mustAcceptTos || 'Devi accettare i Termini di Servizio'}`, 'error');
            return;
        }

        // Check signature
        if (isCanvasBlank(canvasRef.current)) {
            showToast(`❌ ${t.signBeforeSend}`, 'error');
            return;
        }

        setLoading(true);

        const firma = canvasRef.current.toDataURL('image/png');
        console.log('🖊️ Firma dataURL length:', firma ? firma.length : 0);
    const oreTotali = calculateHours(workerData.oraIn, workerData.oraOut, workerData.pausaMinuti);
    console.log('🧮 oreTotali computed:', oreTotali, 'from', workerData.oraIn, workerData.oraOut, 'pausa:', workerData.pausaMinuti);

        const worker = {
            ...workerData,
            firma,
            oreTotali,
            tosAccepted: true,
            tosAcceptedAt: new Date().toISOString(),
            id: Date.now(),
            submittedAt: new Date().toISOString()
        };

        try {
            await db.collection('timesheets').doc(sheetId).update({
                lavoratori: firebase.firestore.FieldValue.arrayUnion(worker)
            });
            
            setSubmittedWorkerId(worker.id);
            
            // ⭐ Mark session as submitted and delete
            if (sessionKey) {
                await db.collection('workerSessions').doc(sessionKey).delete();
            }
            
            showToast(`✅ ${t.dataSent}`, 'success');
        } catch (error) {
            console.error(error);
            showToast(`❌ ${t.errorSending}`, 'error');
        }
        
        setLoading(false);
    };

    // 📄 Generate PDF for worker
    const handleGeneratePDF = async () => {
        if (!sheetData) return;
        
        setGeneratingPDF(true);
        
        try {
            const companyLogo = localStorage.getItem('companyLogo');
            await generatePDF(sheetData, companyLogo);
            showToast(`✅ ${t.pdfRegenerated}`, 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            showToast(`❌ ${t.error}`, 'error');
        }
        
        setGeneratingPDF(false);
    };

    // 📙 Handle Edit/Go Back - 🔧 FIX: con re-inizializzazione canvas
    const handleEditSubmission = async () => {
        if (!db || !sheetId || !submittedWorkerId) return;
        
        const confirmEdit = confirm(t.confirmEdit);
        
        if (!confirmEdit) return;
        
        try {
            // Find and restore worker data
            const mySubmission = sheetData.lavoratori?.find(w => w.id == submittedWorkerId);
            if (mySubmission) {
                setWorkerData({
                    nome: mySubmission.nome || '',
                    cognome: mySubmission.cognome || '',
                    oraIn: mySubmission.oraIn || '',
                    oraOut: mySubmission.oraOut || '',
                    pausaMinuti: mySubmission.pausaMinuti || '',
                    codiceFiscale: mySubmission.codiceFiscale || '',
                    numeroIdentita: mySubmission.numeroIdentita || '',
                    telefono: mySubmission.telefono || '',
                    email: mySubmission.email || '',
                    indirizzo: mySubmission.indirizzo || '',
                    dataNascita: mySubmission.dataNascita || ''
                });
            }
            
            // Remove worker from sheet
            const updatedWorkers = sheetData.lavoratori.filter(w => w.id != submittedWorkerId);
            await db.collection('timesheets').doc(sheetId).update({
                lavoratori: updatedWorkers
            });
            
            // Reset submission
            setSubmittedWorkerId(null);
            
            // 🔧 FIX: Re-inizializza canvas
            console.log('🔄 Re-inizializzo canvas per edit');
            setCanvasKey(prevKey => prevKey + 1);
            
            showToast(`✅ ${t.canEditNow}`, 'success');
        } catch (error) {
            console.error('Error editing submission:', error);
            showToast(`❌ ${t.error}`, 'error');
        }
    };

    // Function to log modifications
    const logModification = async (field, oldValue, newValue) => {
        if (!db || !sheetId) return;

        const modificationLog = {
            field,
            oldValue,
            newValue,
            modifiedAt: new Date().toISOString(),
            modifiedBy: 'Admin', // Replace with actual admin ID if available
        };

        try {
            await db.collection('modificationLogs').add({
                sheetId,
                ...modificationLog,
            });
            console.log('Modification logged:', modificationLog);
        } catch (error) {
            console.error('Error logging modification:', error);
        }
    };

    // Example usage of logModification
    const updateWorkerData = (field, value) => {
        const oldValue = workerData[field];
        setWorkerData((prevData) => ({
            ...prevData,
            [field]: value,
        }));
        logModification(field, oldValue, value);
    };

    // Function to notify workers of modifications
    const notifyWorker = async (workerId, modificationDetails) => {
        if (!db || !sheetId) return;

        const notification = {
            workerId,
            modificationDetails,
            notifiedAt: new Date().toISOString(),
            read: false,
        };

        try {
            await db.collection('workerNotifications').add({
                sheetId,
                ...notification,
            });
            console.log('Worker notified:', notification);
        } catch (error) {
            console.error('Error notifying worker:', error);
        }
    };

    // Example usage of notifyWorker
    const handleWorkerNotification = (field, oldValue, newValue) => {
        const modificationDetails = {
            field,
            oldValue,
            newValue,
        };
        notifyWorker(workerData.id, modificationDetails);
    };

    const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50';
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-900 border border-indigo-100';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-700';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white' : 
        'bg-white/80 border-indigo-200 text-gray-900 focus:border-indigo-400 focus:ring-indigo-200';

    // ⭐ Session Prompt Modal
    if (showSessionPrompt && savedSession) {
        return (
            <div id="worker-root" style={{
                '--worker-input-bg': localDarkMode ? '#0f1724' : '#ffffff',
                '--worker-input-color': localDarkMode ? '#e6eefc' : '#0f172a',
                '--worker-input-border': localDarkMode ? '#374151' : '#d1d5db'
            }} className={`min-h-screen ${bgClass} flex items-center justify-center p-3`}>
                <div className={`${cardClass} rounded-xl shadow-2xl p-6 max-w-md w-full`}>
                    <div className="text-center mb-6">
                        <div className="text-5xl mb-4">💾</div>
                        <h2 className="text-2xl font-bold mb-2">{t.previousSession}</h2>
                        <p className={`${textClass} text-sm`}>
                            {t.continueSession}?
                        </p>
                    </div>
                    
                    <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-indigo-50 border border-indigo-200'}`}>
                        <p className="font-semibold mb-2">{savedSession.workerData.nome} {savedSession.workerData.cognome}</p>
                        <p className={`text-sm ${textClass}`}>
                            {savedSession.workerData.oraIn && `${t.startTime}: ${savedSession.workerData.oraIn}`}
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={restoreSession}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors shadow-lg"
                        >
                            ↩️ {t.continueSession}
                        </button>
                        <button
                            onClick={startNewSession}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors shadow-lg"
                        >
                            ➕ {t.startNew}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 🔥 Check DB Connection
    if (!db) {
        return (
            <div id="worker-root" style={{
                '--worker-input-bg': localDarkMode ? '#0f1724' : '#ffffff',
                '--worker-input-color': localDarkMode ? '#e6eefc' : '#0f172a',
                '--worker-input-border': localDarkMode ? '#374151' : '#d1d5db'
            }} className={`min-h-screen ${bgClass} flex items-center justify-center p-3`}>
                <div className={`${cardClass} p-6 sm:p-8 rounded-xl shadow-xl text-center max-w-md w-full`}>
                    <div className="text-6xl mb-4">🔌</div>
                    <h1 className="text-xl sm:text-2xl font-bold text-orange-600 mb-4">Database Non Connesso</h1>
                    <p className={`${textClass} mb-6`}>Impossibile connettersi al database. Verifica la connessione internet e riprova.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg transition-colors"
                    >
                        🔄 Ricarica Pagina
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div id="worker-root" style={{
                '--worker-input-bg': localDarkMode ? '#0f1724' : '#ffffff',
                '--worker-input-color': localDarkMode ? '#e6eefc' : '#0f172a',
                '--worker-input-border': localDarkMode ? '#374151' : '#d1d5db'
            }} className={`min-h-screen ${bgClass} flex items-center justify-center`}>
                <div className="loader"></div>
            </div>
        );
    }

    // ⚙️ Link Expired View
    if (linkExpired) {
        return (
            <div id="worker-root" style={{
                '--worker-input-bg': localDarkMode ? '#0f1724' : '#ffffff',
                '--worker-input-color': localDarkMode ? '#e6eefc' : '#0f172a',
                '--worker-input-border': localDarkMode ? '#374151' : '#d1d5db'
            }} className={`min-h-screen ${bgClass} flex items-center justify-center p-3`}>
                <div className={`${cardClass} p-6 sm:p-8 rounded-xl shadow-xl text-center max-w-md w-full`}>
                    <div className="text-6xl mb-4">⏰</div>
                    <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">{t.linkExpired}</h1>
                    <p className={`${textClass} mb-6`}>{t.linkExpiredMessage}</p>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                            💡 {t.contactResponsible}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div id="worker-root" style={{
                '--worker-input-bg': localDarkMode ? '#0f1724' : '#ffffff',
                '--worker-input-color': localDarkMode ? '#e6eefc' : '#0f172a',
                '--worker-input-border': localDarkMode ? '#374151' : '#d1d5db'
            }} className={`min-h-screen ${bgClass} flex items-center justify-center p-3`}>
                <div className={`${cardClass} p-6 sm:p-8 rounded-xl shadow-xl text-center max-w-md w-full`}>
                    <h1 className="text-lg sm:text-xl font-bold text-red-600">{error}</h1>
                </div>
            </div>
        );
    }

    if (submittedWorkerId && sheetData) {
        const mySubmission = sheetData.lavoratori?.find(w => w.id == submittedWorkerId);
        const isCompleted = sheetData.status === 'completed';

        return (
            <div id="worker-root" style={{
                '--worker-input-bg': localDarkMode ? '#0f1724' : '#ffffff',
                '--worker-input-color': localDarkMode ? '#e6eefc' : '#0f172a',
                '--worker-input-border': localDarkMode ? '#374151' : '#d1d5db'
            }} className={`min-h-screen ${bgClass} p-3 sm:p-4`}>
                <div className="max-w-2xl mx-auto">
                    {/* 🌓 Dark Mode Toggle */}
                    <div className="flex justify-end mb-3">
                        <button
                            onClick={() => {
                                const next = !localDarkMode;
                                setLocalDarkMode(next);
                                try { localStorage.setItem('workerDarkModeExplicit', 'true'); } catch (e) {}
                            }}
                            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white/90 border border-indigo-100'} shadow-md transition-colors`}
                            title={darkMode ? t.lightMode : t.darkModeWorker}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                    
                    <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                        <div className="text-center mb-4 sm:mb-6">
                            <h1 className="text-lg sm:text-2xl font-bold mb-1 text-indigo-700 dark:text-indigo-400">
                                ✅ {t.submissionSummary}
                            </h1>
                            <p className={`${textClass} text-sm sm:text-base mt-2`}>
                                {sheetData.titoloAzienda} - {formatDate(sheetData.data)}
                            </p>
                        </div>
                        
                        {mySubmission ? (
                            <>
                                <div className={`border-l-4 ${isCompleted ? 'border-green-500' : 'border-yellow-500'} p-3 sm:p-4 rounded-r-lg ${darkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50'} mb-4`}>
                                    <h2 className="font-bold text-base sm:text-lg mb-2">
                                        👋 {t.hello}, {mySubmission.nome}!
                                    </h2>
                                    <p className="mb-1 text-sm sm:text-base">
                                        <span className="font-semibold">{t.hours}:</span> {mySubmission.oraIn} - {mySubmission.oraOut}
                                    </p>
                                    <p className="mb-2 sm:mb-3 text-sm sm:text-base">
                                        <span className="font-semibold">{t.total}:</span> {mySubmission.oreTotali}{t.hours_short}
                                    </p>
                                    <p className="mt-2 text-sm sm:text-base">
                                        <span className="font-semibold">{t.status}:</span>{' '}
                                        <span className={`font-bold ${isCompleted ? 'text-green-500' : 'text-yellow-500'}`}>
                                            {isCompleted ? `✅ ${t.completed}` : `⏳ ${t.waitingSignature}`}
                                        </span>
                                    </p>
                                </div>
                                
                                {/* 📙 Edit Button (only if NOT completed) */}
                                {!isCompleted && (
                                    <button
                                        onClick={handleEditSubmission}
                                        className="w-full py-3 mb-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-colors shadow-lg"
                                    >
                                        ✏️ {t.edit}
                                    </button>
                                )}
                                
                                {/* 📄 PDF Download Button (only if completed) */}
                                {isCompleted && (
                                    <button
                                        onClick={handleGeneratePDF}
                                        disabled={generatingPDF}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:bg-gray-400 shadow-lg"
                                    >
                                        {generatingPDF ? `⏳ ${t.generatingPDF}` : `📄 ${t.downloadYourPDF}`}
                                    </button>
                                )}
                            </>
                        ) : (
                            <p className="text-center text-red-500 text-sm sm:text-base">
                                {t.dataNotFound}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div id="worker-root" style={{
            '--worker-input-bg': localDarkMode ? '#0f1724' : '#ffffff',
            '--worker-input-color': localDarkMode ? '#e6eefc' : '#0f172a',
            '--worker-input-border': localDarkMode ? '#374151' : '#d1d5db'
        }} className={`min-h-screen ${bgClass} p-3 sm:p-4`}>
            <div className="max-w-2xl mx-auto">
                {/* 🌓 Dark Mode Toggle + 🌍 Language Selector */}
                <div className="flex justify-end items-center gap-2 mb-3">
                    {/* 🌍 Language Selector */}
                    <select
                        value={localLanguage}
                        onChange={(e) => {
                            setLocalLanguage(e.target.value);
                            localStorage.setItem('workerLanguage', e.target.value);
                        }}
                        className={`px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-white/90 border border-indigo-100'} shadow-md transition-colors text-sm sm:text-base`}
                        style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                    >
                        {(
                            (typeof window !== 'undefined' && window.availableLanguages) ? window.availableLanguages : ['it','en','es','fr','ro']
                        ).map(langCode => {
                            const meta = {
                                it: '🇮🇹 Italiano',
                                en: '🇬🇧 English',
                                es: '🇪🇸 Español',
                                fr: '🇫🇷 Français',
                                ro: '🇷🇴 Română'
                            };
                            return <option key={langCode} value={langCode}>{meta[langCode] || langCode}</option>;
                        })}
                    </select>
                    
                    {/* 🌓 Dark Mode Toggle */}
                    <button
                        onClick={() => {
                            console.log('🌓 Toggle dark mode button clicked');
                            console.log('🌓 Current localDarkMode:', localDarkMode);
                            const next = !localDarkMode;
                            setLocalDarkMode(next);
                            try { localStorage.setItem('workerDarkModeExplicit', 'true'); } catch (e) {}
                            console.log('🌓 New localDarkMode:', next);
                        }}
                        className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white/90 border border-indigo-100'} shadow-md transition-colors`}
                        title={darkMode ? t.lightMode : t.darkModeWorker}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
                
                <div className={`${cardClass} rounded-xl shadow-lg p-3 sm:p-6`}>
                    {/* Header - OTTIMIZZATO MOBILE */}
                    <div className="text-center mb-4 sm:mb-6">
                        <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 text-indigo-700 dark:text-indigo-400">
                            {t.workerMode}
                        </h1>
                        <p className={`${textClass} text-sm sm:text-lg`}>{t.registerHours}</p>
                        
                        {sheetData && (
                            <div className="mt-3 sm:mt-4">
                                <p className="font-semibold text-base sm:text-lg">{sheetData.titoloAzienda}</p>
                                <p className={`${textClass} text-xs sm:text-base mt-1`}>
                                    {formatDate(sheetData.data)}{sheetData.location && ` - ${sheetData.location}`}
                                </p>
                            </div>
                        )}
                        
                        {/* ⭐ Auto-save indicator */}
                        {sessionKey && (
                            <div className="mt-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                    darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                }`}>
                                    💾 {t.autoSaveEnabled}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        {/* Nome e Cognome - STACK COMPLETO SU MOBILE */}
                        <div className="grid grid-cols-1 gap-2 sm:gap-3">
                            <input
                                type="text"
                                placeholder={`${t.firstName} *`}
                                value={workerData.nome}
                                onChange={(e) => setWorkerData({...workerData, nome: e.target.value})}
                                className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 text-base`}
                            />
                            <input
                                type="text"
                                placeholder={`${t.lastName} *`}
                                value={workerData.cognome}
                                onChange={(e) => setWorkerData({...workerData, cognome: e.target.value})}
                                className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 text-base`}
                            />
                        </div>

                        {/* Orari - STACK COMPLETO SU MOBILE */}
                        <div className="grid grid-cols-1 gap-2 sm:gap-3">
                            <div>
                                <label className={`block text-xs sm:text-sm font-semibold mb-1 ${textClass}`}>
                                    {t.startTime} *
                                </label>
                                <input
                                    type="time"
                                    value={workerData.oraIn}
                                    onChange={(e) => setWorkerData({...workerData, oraIn: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                    style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                                />
                            </div>
                            <div>
                                <label className={`block text-xs sm:text-sm font-semibold mb-1 ${textClass}`}>
                                    {t.endTime} *
                                </label>
                                <input
                                    type="time"
                                    value={workerData.oraOut}
                                    onChange={(e) => setWorkerData({...workerData, oraOut: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                    style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                                />
                            </div>
                            <div>
                                <label className={`block text-xs sm:text-sm font-semibold mb-1 ${textClass}`}>
                                    {t.break} ({t.minutes})
                                </label>
                                <input
                                    type="number"
                                    value={workerData.pausaMinuti}
                                    onChange={(e) => setWorkerData({...workerData, pausaMinuti: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Totale Ore - COMPATTO SU MOBILE */}
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                            <p className={`font-semibold text-base sm:text-lg ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                {t.totalHours}: {calculateHours(workerData.oraIn, workerData.oraOut, workerData.pausaMinuti)}{t.hours_short}
                            </p>
                        </div>

                        {/* Campi Opzionali */}
                        <button
                            type="button"
                            onClick={() => setShowOptionalFields(!showOptionalFields)}
                            className={`w-full py-2 px-3 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-indigo-200 hover:bg-indigo-50'} transition-colors text-sm sm:text-base font-medium`}
                        >
                            {showOptionalFields ? '▼' : '▶'} {t.optionalFields}
                        </button>

                        {showOptionalFields && (
                            <div className="space-y-2 sm:space-y-3 pl-2 sm:pl-3 border-l-2 border-indigo-500">
                                <input
                                    type="text"
                                    placeholder={`${t.taxCode} ${t.optional}`}
                                    value={workerData.codiceFiscale}
                                    onChange={(e) => setWorkerData({...workerData, codiceFiscale: e.target.value.toUpperCase()})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                />
                                <input
                                    type="text"
                                    placeholder={`${t.idNumber} ${t.optional}`}
                                    value={workerData.numeroIdentita}
                                    onChange={(e) => setWorkerData({...workerData, numeroIdentita: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                />
                                <input
                                    type="date"
                                    placeholder={`${t.birthDate} ${t.optional}`}
                                    value={workerData.dataNascita}
                                    onChange={(e) => setWorkerData({...workerData, dataNascita: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                    style={{ colorScheme: darkMode ? 'dark' : 'light' }}
                                />
                                <input
                                    type="tel"
                                    placeholder={`${t.phone} ${t.optional}`}
                                    value={workerData.telefono}
                                    onChange={(e) => setWorkerData({...workerData, telefono: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                />
                                <input
                                    type="email"
                                    placeholder={`${t.email} ${t.optional}`}
                                    value={workerData.email}
                                    onChange={(e) => setWorkerData({...workerData, email: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                />
                            </div>
                        )}

                        {/* GDPR Privacy Notice (collapsible) */}
                        <div className="my-4">
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-lg font-medium shadow-md transition-colors text-sm sm:text-base ${showGdpr ? 'bg-gray-400 text-white hover:bg-gray-500' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                onClick={() => setShowGdpr(v => !v)}
                            >
                                {showGdpr ? (t.hideGdpr || 'Hide GDPR') : (t.showGdpr || 'Show GDPR')}
                            </button>
                            {showGdpr && (
                                <div className={`mt-2 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800'}`} style={{ whiteSpace: 'pre-line' }}>
                                    {loadingGdpr ? (t.loading || 'Loading...') : (gdprText || t.noGdprText || 'No privacy notice set.')}
                                </div>
                            )}
                        </div>

                        {/* Terms of Service (collapsible) */}
                        <div className="my-4">
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-lg font-medium shadow-md transition-colors text-sm sm:text-base ${showTos ? 'bg-gray-400 text-white hover:bg-gray-500' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
                                onClick={() => setShowTos(v => !v)}
                            >
                                {showTos ? (t.hideTos || 'Nascondi Termini') : (t.showTos || 'Visualizza Termini di Servizio')}
                            </button>
                            {showTos && (
                                <div className={`mt-2 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800'}`} style={{ whiteSpace: 'pre-line', maxHeight: '300px', overflowY: 'auto' }}>
                                    {loadingTos ? (t.loading || 'Loading...') : (tosText || t.noTosText || 'Nessun Termine di Servizio configurato.')}
                                </div>
                            )}
                            
                            {/* Terms of Service Acceptance Checkbox */}
                            <div className={`mt-3 flex items-start gap-3 p-3 rounded-lg border-2 ${tosAccepted ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                                <input
                                    type="checkbox"
                                    id="tosAcceptance"
                                    checked={tosAccepted}
                                    onChange={(e) => setTosAccepted(e.target.checked)}
                                    className="mt-1 w-5 h-5 cursor-pointer"
                                />
                                <label htmlFor="tosAcceptance" className={`text-sm sm:text-base font-semibold cursor-pointer ${tosAccepted ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                    {tosAccepted ? '✅ ' : '⚠️ '}
                                    {t.acceptTos || 'Accetto i Termini e le Condizioni di Servizio'} *
                                </label>
                            </div>
                        </div>

                        {/* 🔧 FIX: Firma - CANVAS OTTIMIZZATO MOBILE con key per re-render */}
                        <div className="space-y-2">
                            <label className="block font-semibold text-sm sm:text-base">
                                {t.signature} *
                            </label>
                            
                            <div className={`border-2 ${darkMode ? 'border-indigo-400 bg-gray-800' : 'border-indigo-400 bg-white/80'} rounded-lg p-1 sm:p-2`}>
                                <canvas
                                    key={canvasKey} // 🔧 FIX: Forza re-render quando cambia
                                    ref={canvasRef}
                                    width={800}
                                    height={300}
                                    className="signature-canvas"
                                    style={{ 
                                        touchAction: 'none',
                                        width: '100%',
                                        height: 'auto',
                                        maxHeight: '150px',
                                        aspectRatio: '8/3',
                                        display: 'block'
                                    }}
                                />
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearCanvas(canvasRef.current, localDarkMode);
                                        showToast(`🗑️ ${t.signatureCleared}`, 'success');
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm sm:text-base transition-colors font-medium shadow-md"
                                >
                                    🗑️ {t.clear}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isCanvasBlank(canvasRef.current)) {
                                            showToast(`❌ ${t.canvasEmpty}`, 'error');
                                        } else {
                                            showToast(`✅ ${t.signaturePresent}`, 'success');
                                        }
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base transition-colors font-medium shadow-md"
                                >
                                    ✓ {t.verify}
                                </button>
                            </div>
                            
                            <p className={`text-xs ${textClass} mt-1`}>
                                💡 {t.drawSignature}
                            </p>
                        </div>

                        {/* Submit Button - GRANDE E VISIBILE */}
                        <button
                            onClick={saveWorkerData}
                            disabled={loading}
                            className="w-full py-3 sm:py-4 bg-indigo-600 text-white rounded-lg font-bold text-base sm:text-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-button shadow-lg"
                        >
                            {loading ? `⏳ ${t.sending}` : `📤 ${t.sendData}`}
                        </button>
                    </div>
                </div>
            </div>
        {/* Widget Meteo per la località inserita dal lavoratore */}
        {(workerData?.localita || workerData?.indirizzo) && (
            <div className="my-4">
                <WeatherWidget location={workerData.localita || workerData.indirizzo} darkMode={darkMode} />
            </div>
        )}
    </div>
);
};

// Expose globally for in-page usage
window.WorkerMode = WorkerMode;

}
