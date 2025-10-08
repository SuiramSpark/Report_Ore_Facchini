// Worker Mode Component - VERSIONE 2.0 CON PERSISTENZA SESSIONE + DARK MODE TOGGLE
const WorkerMode = ({ sheetId, db, darkMode: adminDarkMode, language = 'it' }) => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [sheetData, setSheetData] = React.useState(null);
    const [sessionData, setSessionData] = React.useState(null);
    const [sessionId, setSessionId] = React.useState(null);
    const [workerDarkMode, setWorkerDarkMode] = React.useState(false); // Dark mode per il lavoratore
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
    const [editMode, setEditMode] = React.useState(false);
    
    const canvasRef = React.useRef(null);
    const cleanupRef = React.useRef(null);
    const t = translations[language];

    // Load worker's dark mode preference
    React.useEffect(() => {
        const savedWorkerDarkMode = localStorage.getItem('workerDarkMode') === 'true';
        setWorkerDarkMode(savedWorkerDarkMode);
    }, []);

    // Save worker's dark mode preference
    React.useEffect(() => {
        localStorage.setItem('workerDarkMode', workerDarkMode);
    }, [workerDarkMode]);

    // Generate or retrieve sessionId
    React.useEffect(() => {
        if (!sheetId) return;
        
        const storageKey = `worker_session_${sheetId}`;
        let storedSessionId = localStorage.getItem(storageKey);
        
        if (!storedSessionId) {
            storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(storageKey, storedSessionId);
        }
        
        setSessionId(storedSessionId);
    }, [sheetId]);

    // Listen to sheet changes
    React.useEffect(() => {
        if (!sheetId || !db) return;
        
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
    }, [sheetId, db, language]);

    // Load session data from Firestore
    React.useEffect(() => {
        if (!db || !sessionId) return;
        
        const loadSession = async () => {
            try {
                const sessionDoc = await db.collection('workerSessions').doc(sessionId).get();
                
                if (sessionDoc.exists) {
                    const data = sessionDoc.data();
                    
                    // Check expiration
                    if (data.expiresAt) {
                        const expiresDate = new Date(data.expiresAt);
                        const now = new Date();
                        
                        if (now > expiresDate) {
                            setError(t.sessionExpired || 'Sessione scaduta');
                            return;
                        }
                    }
                    
                    setSessionData(data);
                    
                    // Restore form data if not submitted
                    if (!data.submitted && data.workerData) {
                        setWorkerData(data.workerData);
                        setShowOptionalFields(!!data.workerData.codiceFiscale || !!data.workerData.telefono);
                    }
                } else {
                    // Create new session
                    await db.collection('workerSessions').doc(sessionId).set({
                        sheetId,
                        sessionId,
                        createdAt: new Date().toISOString(),
                        submitted: false,
                        workerData: null,
                        workerId: null
                    });
                }
            } catch (error) {
                console.error('Errore caricamento sessione:', error);
            }
        };
        
        loadSession();
    }, [db, sessionId, sheetId]);

    // Auto-save form data
    React.useEffect(() => {
        if (!db || !sessionId || !sessionData || sessionData.submitted) return;
        
        const timer = setTimeout(async () => {
            try {
                await db.collection('workerSessions').doc(sessionId).update({
                    workerData,
                    lastUpdated: new Date().toISOString()
                });
            } catch (error) {
                console.error('Errore salvataggio automatico:', error);
            }
        }, 1000);
        
        return () => clearTimeout(timer);
    }, [workerData, db, sessionId, sessionData]);

    // Initialize canvas
    React.useEffect(() => {
        if (canvasRef.current) {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
            
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
        
        const workerId = Date.now();
        const worker = {
            ...workerData,
            firma,
            oreTotali,
            id: workerId,
            submittedAt: new Date().toISOString()
        };

        try {
            // Add worker to sheet
            await db.collection('timesheets').doc(sheetId).update({
                lavoratori: firebase.firestore.FieldValue.arrayUnion(worker)
            });
            
            // Get link expiration from settings
            const settingsDoc = await db.collection('settings').doc('global').get();
            const linkExpirationHours = settingsDoc.exists ? (settingsDoc.data().linkExpirationHours || 0) : 0;
            
            let expiresAt = null;
            if (linkExpirationHours > 0) {
                expiresAt = new Date(Date.now() + linkExpirationHours * 60 * 60 * 1000).toISOString();
            }
            
            // Update session
            await db.collection('workerSessions').doc(sessionId).update({
                submitted: true,
                workerId: workerId,
                workerData: worker,
                submittedAt: new Date().toISOString(),
                expiresAt: expiresAt
            });
            
            setSessionData(prev => ({ ...prev, submitted: true, workerId, workerData: worker, expiresAt }));
            showToast(`✅ ${t.dataSent}`, 'success');
        } catch (error) {
            console.error(error);
            showToast(`❌ ${t.errorSending}`, 'error');
        }
        
        setLoading(false);
    };

    const updateWorkerData = async () => {
        if (!sessionData || !sessionData.workerId) return;
        
        // Validation
        if (!workerData.nome || !workerData.cognome || !workerData.oraIn || !workerData.oraOut) {
            showToast(`❌ ${t.fillRequired}`, 'error');
            return;
        }

        setLoading(true);
        
        const oreTotali = calculateHours(workerData.oraIn, workerData.oraOut, workerData.pausaMinuti);
        
        try {
            // Find and update worker in sheet
            const sheetDoc = await db.collection('timesheets').doc(sheetId).get();
            const lavoratori = sheetDoc.data().lavoratori || [];
            
            const updatedLavoratori = lavoratori.map(w => 
                w.id === sessionData.workerId 
                    ? { ...w, ...workerData, oreTotali, lastModified: new Date().toISOString() }
                    : w
            );
            
            await db.collection('timesheets').doc(sheetId).update({
                lavoratori: updatedLavoratori
            });
            
            // Update session
            await db.collection('workerSessions').doc(sessionId).update({
                workerData: { ...workerData, oreTotali },
                lastUpdated: new Date().toISOString()
            });
            
            setEditMode(false);
            showToast(`✅ ${t.workerUpdated}`, 'success');
        } catch (error) {
            console.error(error);
            showToast(`❌ ${t.errorSaving}`, 'error');
        }
        
        setLoading(false);
    };

    const generateWorkerPDF = async () => {
        if (!sheetData || !sessionData || !sessionData.workerId) return;
        
        const worker = sheetData.lavoratori?.find(w => w.id === sessionData.workerId);
        if (!worker) {
            showToast(`❌ ${t.dataNotFound}`, 'error');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Header
            doc.setFillColor(59, 130, 246);
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont(undefined, 'bold');
            doc.text(sheetData.titoloAzienda || t.company, 15, 25);

            // Worker Info
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text(`${worker.nome} ${worker.cognome}`, 15, 55);

            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`${t.date}: ${formatDate(sheetData.data)}`, 15, 65);
            doc.text(`${t.location}: ${sheetData.location || ''}`, 15, 72);
            doc.text(`${t.responsible}: ${sheetData.responsabile || ''}`, 15, 79);

            // Hours
            let y = 95;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(t.hours, 15, y);
            y += 10;

            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(`${t.startTime}: ${worker.oraIn}`, 20, y);
            y += 7;
            doc.text(`${t.endTime}: ${worker.oraOut}`, 20, y);
            y += 7;
            doc.text(`${t.break}: ${worker.pausaMinuti || 0} ${t.min}`, 20, y);
            y += 7;
            
            doc.setFont(undefined, 'bold');
            doc.text(`${t.totalHours}: ${worker.oreTotali}${t.hours_short}`, 20, y);
            y += 15;

            // Signature
            if (worker.firma) {
                doc.setFont(undefined, 'bold');
                doc.text(`${t.signature}:`, 15, y);
                y += 5;
                try {
                    doc.addImage(worker.firma, 'PNG', 15, y, 60, 20);
                } catch (e) {
                    console.error('Errore firma:', e);
                }
            }

            const fileName = `registro_${worker.nome}_${worker.cognome}_${sheetData.data}.pdf`;
            doc.save(fileName);
            showToast('📄 PDF generato con successo!', 'success');
        } catch (error) {
            console.error('Errore PDF:', error);
            showToast(`❌ ${t.error}`, 'error');
        }
    };

    const bgClass = workerDarkMode ? 'bg-gray-900' : 'bg-gray-50';
    const cardClass = workerDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = workerDarkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = workerDarkMode ? 
        'bg-gray-700 border-gray-600 text-white' : 
        'bg-white border-gray-300 text-gray-900';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loader"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-3">
                <div className={`${cardClass} p-6 sm:p-8 rounded-xl shadow-xl text-center max-w-md w-full`}>
                    <h1 className="text-lg sm:text-xl font-bold text-red-600">{error}</h1>
                </div>
            </div>
        );
    }

    // AREA PERSONALE - Worker ha già inviato i dati
    if (sessionData?.submitted && sheetData) {
        const myWorker = sheetData.lavoratori?.find(w => w.id == sessionData.workerId);
        const isCompleted = sheetData.status === 'completed';
        const isExpired = sessionData.expiresAt && new Date(sessionData.expiresAt) < new Date();

        return (
            <div className={`min-h-screen ${bgClass} p-3 sm:p-4`}>
                <div className="max-w-2xl mx-auto">
                    {/* Dark Mode Toggle - WORKER */}
                    <div className="flex justify-end mb-3">
                        <button
                            onClick={() => setWorkerDarkMode(!workerDarkMode)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                workerDarkMode ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-white'
                            }`}
                        >
                            {workerDarkMode ? '☀️ Light' : '🌙 Dark'}
                        </button>
                    </div>

                    <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 mt-3 sm:mt-4`}>
                        <div className="text-center mb-4 sm:mb-6">
                            <h1 className="text-lg sm:text-2xl font-bold mb-1 text-indigo-700 dark:text-indigo-400">
                                {editMode ? '✏️' : '✅'} {editMode ? t.edit : t.submissionSummary}
                            </h1>
                            <p className={`${textClass} text-sm sm:text-base mt-2`}>
                                {sheetData.titoloAzienda} - {formatDate(sheetData.data)}
                            </p>
                        </div>
                        
                        {myWorker ? (
                            <div>
                                {editMode ? (
                                    // EDIT MODE
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 gap-2">
                                            <input
                                                type="text"
                                                placeholder={`${t.name} *`}
                                                value={workerData.nome}
                                                onChange={(e) => setWorkerData({...workerData, nome: e.target.value})}
                                                className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                                            />
                                            <input
                                                type="text"
                                                placeholder={`${t.surname} *`}
                                                value={workerData.cognome}
                                                onChange={(e) => setWorkerData({...workerData, cognome: e.target.value})}
                                                className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                                            />
                                            <input
                                                type="time"
                                                value={workerData.oraIn}
                                                onChange={(e) => setWorkerData({...workerData, oraIn: e.target.value})}
                                                className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                                            />
                                            <input
                                                type="time"
                                                value={workerData.oraOut}
                                                onChange={(e) => setWorkerData({...workerData, oraOut: e.target.value})}
                                                className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                                            />
                                            <input
                                                type="number"
                                                placeholder={t.break}
                                                value={workerData.pausaMinuti}
                                                onChange={(e) => setWorkerData({...workerData, pausaMinuti: e.target.value})}
                                                className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                                            />
                                        </div>
                                        
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={updateWorkerData}
                                                disabled={loading}
                                                className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400"
                                            >
                                                {loading ? `⏳ ${t.loading}...` : `✓ ${t.save}`}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditMode(false);
                                                    setWorkerData(myWorker);
                                                }}
                                                className="w-full py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700"
                                            >
                                                ✗ {t.cancel}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // VIEW MODE
                                    <div>
                                        <div className={`border-l-4 ${isCompleted ? 'border-green-500' : 'border-yellow-500'} p-3 sm:p-4 rounded-r-lg ${workerDarkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
                                            <h2 className="font-bold text-base sm:text-lg mb-2">
                                                👋 {t.hello}, {myWorker.nome}!
                                            </h2>
                                            <p className="mb-1 text-sm sm:text-base">
                                                <span className="font-semibold">{t.hours}:</span> {myWorker.oraIn} - {myWorker.oraOut}
                                            </p>
                                            <p className="mb-1 text-sm sm:text-base">
                                                <span className="font-semibold">{t.break}:</span> {myWorker.pausaMinuti || 0} {t.min}
                                            </p>
                                            <p className="mb-3 text-sm sm:text-base">
                                                <span className="font-semibold">{t.total}:</span> {myWorker.oreTotali}{t.hours_short}
                                            </p>
                                            <p className="mt-2 text-sm sm:text-base">
                                                <span className="font-semibold">{t.status}:</span>{' '}
                                                <span className={`font-bold ${isCompleted ? 'text-green-500' : 'text-yellow-500'}`}>
                                                    {isCompleted ? `✅ ${t.completed}` : `⏳ ${t.waitingSignature}`}
                                                </span>
                                            </p>
                                            
                                            {/* Expiration Info */}
                                            {sessionData.expiresAt && (
                                                <p className={`mt-2 text-xs sm:text-sm ${isExpired ? 'text-red-500 font-semibold' : textClass}`}>
                                                    {isExpired ? '❌' : '📅'} {t.expiresAt || 'Scade il'}: {formatDateTime(sessionData.expiresAt)}
                                                </p>
                                            )}
                                            
                                            <p className={`mt-1 text-xs ${textClass}`}>
                                                📅 {t.submittedAt || 'Inviato il'}: {formatDateTime(myWorker.submittedAt)}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2">
                                            {!isExpired && (
                                                <>
                                                    <button
                                                        onClick={generateWorkerPDF}
                                                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                                                    >
                                                        📄 {t.downloadPDF}
                                                    </button>
                                                    
                                                    {!isCompleted && (
                                                        <button
                                                            onClick={() => {
                                                                setEditMode(true);
                                                                setWorkerData(myWorker);
                                                            }}
                                                            className="w-full py-3 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700"
                                                        >
                                                            ✏️ {t.edit}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
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

    // FORM INIZIALE - Worker non ha ancora inviato dati
    return (
        <div className={`min-h-screen ${bgClass} p-3 sm:p-4`}>
            <div className="max-w-2xl mx-auto">
                {/* Dark Mode Toggle - WORKER */}
                <div className="flex justify-end mb-3">
                    <button
                        onClick={() => setWorkerDarkMode(!workerDarkMode)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            workerDarkMode ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-white'
                        }`}
                    >
                        {workerDarkMode ? '☀️ Light' : '🌙 Dark'}
                    </button>
                </div>

                <div className={`${cardClass} rounded-xl shadow-lg p-3 sm:p-6 mt-3 sm:mt-4`}>
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
                    </div>

                    <div className="space-y-3 sm:space-y-4">
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

                        <div className={`p-3 rounded-lg ${workerDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                            <p className={`font-semibold text-base sm:text-lg ${workerDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                {t.totalHours}: {calculateHours(workerData.oraIn, workerData.oraOut, workerData.pausaMinuti)}{t.hours_short}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowOptionalFields(!showOptionalFields)}
                            className={`w-full py-2 px-3 rounded-lg border ${workerDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'} transition-colors text-sm sm:text-base font-medium`}
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
