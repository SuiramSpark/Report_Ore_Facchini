// Worker Mode Component - 5 LINGUE COMPLETE + NUOVE FUNZIONALITÀ
const WorkerMode = ({ sheetId, db, darkMode: initialDarkMode, language = 'it' }) => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [sheetData, setSheetData] = React.useState(null);
    const [submittedWorkerId, setSubmittedWorkerId] = React.useState(null);
    
    // 🌓 Dark Mode Local State
    const [localDarkMode, setLocalDarkMode] = React.useState(() => {
        const saved = localStorage.getItem('workerDarkMode');
        return saved ? saved === 'true' : initialDarkMode;
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
        indirizzo: ''
    });
    const [showOptionalFields, setShowOptionalFields] = React.useState(false);
    
    // ⭐ Session Persistence State
    const [showSessionPrompt, setShowSessionPrompt] = React.useState(false);
    const [savedSession, setSavedSession] = React.useState(null);
    const [sessionKey, setSessionKey] = React.useState(null);
    
    // 📄 PDF Generation State
    const [generatingPDF, setGeneratingPDF] = React.useState(false);
    
    // ⚙️ Link Expiration State
    const [linkExpired, setLinkExpired] = React.useState(false);
    
    const canvasRef = React.useRef(null);
    const cleanupRef = React.useRef(null);
    const autoSaveTimeoutRef = React.useRef(null);
    const t = translations[language];

    const darkMode = localDarkMode; // Use local dark mode

    // ⚙️ Check Link Expiration
    React.useEffect(() => {
        if (!db || !sheetId) return;
        
        const checkLinkExpiration = async () => {
            try {
                // Get settings
                const settingsDoc = await db.collection('settings').doc('linkExpiration').get();
                const settings = settingsDoc.data();
                
                if (!settings || !settings.expirationDays || settings.expirationDays === 0) {
                    // No expiration set
                    return;
                }
                
                // Get sheet creation date
                const sheetDoc = await db.collection('timesheets').doc(sheetId).get();
                if (!sheetDoc.exists) return;
                
                const sheetCreatedAt = sheetDoc.data().createdAt;
                if (!sheetCreatedAt) return;
                
                const createdDate = new Date(sheetCreatedAt);
                const now = new Date();
                const daysDiff = (now - createdDate) / (1000 * 60 * 60 * 24);
                
                if (daysDiff > settings.expirationDays) {
                    setLinkExpired(true);
                    setError(t.linkExpired);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error checking link expiration:', err);
            }
        };
        
        checkLinkExpiration();
    }, [db, sheetId, language]);

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

    // 🌓 Save Dark Mode Preference
    React.useEffect(() => {
        localStorage.setItem('workerDarkMode', localDarkMode);
    }, [localDarkMode]);

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
    }, [sheetId, db, language, linkExpired]);

    // Initialize canvas
    React.useEffect(() => {
        console.log('🔄 WorkerMode: Inizializzo canvas...');
        
        if (canvasRef.current) {
            // Cleanup previous
            if (cleanupRef.current) {
                cleanupRef.current();
            }
            
            // Initialize
            cleanupRef.current = initCanvas(canvasRef.current);
        }
        
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, [canvasRef.current]);

    const saveWorkerData = async () => {
        // Validation
        if (!workerData.nome || !workerData.cognome || !workerData.oraIn || !workerData.oraOut) {
            showToast(`❌ ${t.fillRequired}`, 'error');
            return;
        }

        // Check signature
        if (isCanvasBlank(canvasRef.current)) {
            showToast(`❌ ${t.signBeforeSend}`, 'error');
            return;
        }

        setLoading(true);
        
        const firma = canvasRef.current.toDataURL('image/png');
        const oreTotali = calculateHours(workerData.oraIn, workerData.oraOut, workerData.pausaMinuti);
        
        const worker = {
            ...workerData,
            firma,
            oreTotali,
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

    // 🔙 Handle Edit/Go Back
    const handleEditSubmission = async () => {
        if (!db || !sheetId || !submittedWorkerId) return;
        
        const confirmEdit = confirm(language === 'it' 
            ? 'Vuoi modificare i tuoi dati? Dovrai reinserire la firma.' 
            : language === 'en'
            ? 'Do you want to edit your data? You will need to re-sign.'
            : language === 'es'
            ? '¿Quieres editar tus datos? Tendrás que volver a firmar.'
            : language === 'fr'
            ? 'Voulez-vous modifier vos données? Vous devrez re-signer.'
            : 'Vrei să modifici datele? Va trebui să semnezi din nou.'
        );
        
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
                    indirizzo: mySubmission.indirizzo || ''
                });
            }
            
            // Remove worker from sheet
            const updatedWorkers = sheetData.lavoratori.filter(w => w.id != submittedWorkerId);
            await db.collection('timesheets').doc(sheetId).update({
                lavoratori: updatedWorkers
            });
            
            // Reset submission
            setSubmittedWorkerId(null);
            
            showToast(`✅ ${language === 'it' ? 'Puoi modificare i tuoi dati' : language === 'en' ? 'You can edit your data' : language === 'es' ? 'Puedes editar tus datos' : language === 'fr' ? 'Vous pouvez modifier vos données' : 'Poți modifica datele'}`, 'success');
        } catch (error) {
            console.error('Error editing submission:', error);
            showToast(`❌ ${t.error}`, 'error');
        }
    };

    const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white' : 
        'bg-white border-gray-300 text-gray-900';

    // ⭐ Session Prompt Modal
    if (showSessionPrompt && savedSession) {
        return (
            <div className={`min-h-screen ${bgClass} flex items-center justify-center p-3`}>
                <div className={`${cardClass} rounded-xl shadow-2xl p-6 max-w-md w-full`}>
                    <div className="text-center mb-6">
                        <div className="text-5xl mb-4">💾</div>
                        <h2 className="text-2xl font-bold mb-2">{t.previousSession}</h2>
                        <p className={`${textClass} text-sm`}>
                            {t.continueSession}?
                        </p>
                    </div>
                    
                    <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className="font-semibold mb-2">{savedSession.workerData.nome} {savedSession.workerData.cognome}</p>
                        <p className={`text-sm ${textClass}`}>
                            {savedSession.workerData.oraIn && `${t.startTime}: ${savedSession.workerData.oraIn}`}
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={restoreSession}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                        >
                            ↩️ {t.continueSession}
                        </button>
                        <button
                            onClick={startNewSession}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors"
                        >
                            ➕ {t.startNew}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
                <div className="loader"></div>
            </div>
        );
    }

    // ⚙️ Link Expired View
    if (linkExpired) {
        return (
            <div className={`min-h-screen ${bgClass} flex items-center justify-center p-3`}>
                <div className={`${cardClass} p-6 sm:p-8 rounded-xl shadow-xl text-center max-w-md w-full`}>
                    <div className="text-6xl mb-4">⏰</div>
                    <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">{t.linkExpired}</h1>
                    <p className={`${textClass} mb-6`}>{t.linkExpiredMessage}</p>
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <p className="text-sm font-semibold">💡 {t.contactResponsible}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen ${bgClass} flex items-center justify-center p-3`}>
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
            <div className={`min-h-screen ${bgClass} p-3 sm:p-4`}>
                <div className="max-w-2xl mx-auto">
                    {/* 🌓 Dark Mode Toggle */}
                    <div className="flex justify-end mb-3">
                        <button
                            onClick={() => setLocalDarkMode(!localDarkMode)}
                            className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-md transition-colors`}
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
                                <div className={`border-l-4 ${isCompleted ? 'border-green-500' : 'border-yellow-500'} p-3 sm:p-4 rounded-r-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
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
                                
                                {/* 🔙 Edit Button (only if NOT completed) */}
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
        <div className={`min-h-screen ${bgClass} p-3 sm:p-4`}>
            <div className="max-w-2xl mx-auto">
                {/* 🌓 Dark Mode Toggle */}
                <div className="flex justify-end mb-3">
                    <button
                        onClick={() => setLocalDarkMode(!localDarkMode)}
                        className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-md transition-colors`}
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
                                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
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
                                placeholder={`${t.name} *`}
                                value={workerData.nome}
                                onChange={(e) => setWorkerData({...workerData, nome: e.target.value})}
                                className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 text-base`}
                            />
                            <input
                                type="text"
                                placeholder={`${t.surname} *`}
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
                                />
                            </div>
                            <div>
                                <label className={`block text-xs sm:text-sm font-semibold mb-1 ${textClass}`}>
                                    {t.break}
                                </label>
                                <input
                                    type="number"
                                    value={workerData.pausaMinuti}
                                    onChange={(e) => setWorkerData({...workerData, pausaMinuti: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                    placeholder="0"
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
                            className={`w-full py-2 px-3 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'} transition-colors text-sm sm:text-base font-medium`}
                        >
                            {showOptionalFields ? '▼' : '▶'} {t.optionalFields}
                        </button>

                        {showOptionalFields && (
                            <div className="space-y-2 sm:space-y-3 pl-2 sm:pl-3 border-l-2 border-indigo-500">
                                <input
                                    type="text"
                                    placeholder={t.taxCode}
                                    value={workerData.codiceFiscale}
                                    onChange={(e) => setWorkerData({...workerData, codiceFiscale: e.target.value.toUpperCase()})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                />
                                <input
                                    type="text"
                                    placeholder={t.idNumber}
                                    value={workerData.numeroIdentita}
                                    onChange={(e) => setWorkerData({...workerData, numeroIdentita: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                />
                                <input
                                    type="tel"
                                    placeholder={t.phone}
                                    value={workerData.telefono}
                                    onChange={(e) => setWorkerData({...workerData, telefono: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                />
                                <input
                                    type="email"
                                    placeholder={t.email}
                                    value={workerData.email}
                                    onChange={(e) => setWorkerData({...workerData, email: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} text-base`}
                                />
                            </div>
                        )}

                        {/* Firma - CANVAS OTTIMIZZATO MOBILE */}
                        <div className="space-y-2">
                            <label className="block font-semibold text-sm sm:text-base">
                                {t.signature} *
                            </label>
                            
                            <div className="border-2 border-indigo-500 rounded-lg p-1 sm:p-2 bg-white">
                                <canvas
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
                                        clearCanvas(canvasRef.current);
                                        showToast(`🗑️ ${t.signatureCleared}`, 'success');
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm sm:text-base transition-colors font-medium"
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
                                    className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base transition-colors font-medium"
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
        </div>
    );
};
