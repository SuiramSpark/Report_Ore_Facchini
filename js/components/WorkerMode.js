// Worker Mode Component - MOBILE PORTRAIT OTTIMIZZATO
const WorkerMode = ({ sheetId, db, darkMode, language = 'it' }) => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [sheetData, setSheetData] = React.useState(null);
    const [submittedWorkerId, setSubmittedWorkerId] = React.useState(null);
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
    
    const canvasRef = React.useRef(null);
    const cleanupRef = React.useRef(null);
    const t = translations[language];

    // Listen to sheet changes
    React.useEffect(() => {
        if (!sheetId || !db) return;
        
        const unsubscribe = db.collection('timesheets').doc(sheetId).onSnapshot(
            (doc) => {
                if (doc.exists) {
                    setSheetData({ id: doc.id, ...doc.data() });
                    setLoading(false);
                } else {
                    setError('Foglio non trovato');
                    setLoading(false);
                }
            },
            (err) => {
                console.error(err);
                setError('Errore caricamento dati');
                setLoading(false);
            }
        );
        
        return () => unsubscribe();
    }, [sheetId, db]);

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
            showToast('❌ Compila tutti i campi obbligatori', 'error');
            return;
        }

        // Check signature
        if (isCanvasBlank(canvasRef.current)) {
            showToast('❌ Devi firmare prima di inviare', 'error');
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
            showToast('✅ Dati inviati con successo!', 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Errore invio dati', 'error');
        }
        
        setLoading(false);
    };

    const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
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

    if (submittedWorkerId && sheetData) {
        const mySubmission = sheetData.lavoratori?.find(w => w.id == submittedWorkerId);
        const isCompleted = sheetData.status === 'completed';

        return (
            <div className={`min-h-screen ${bgClass} p-3 sm:p-4`}>
                <div className="max-w-2xl mx-auto">
                    <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 mt-3 sm:mt-4`}>
                        <div className="text-center mb-4 sm:mb-6">
                            <h1 className="text-lg sm:text-2xl font-bold mb-1 text-indigo-700 dark:text-indigo-400">
                                ✅ Riepilogo Inserimento
                            </h1>
                            <p className={`${textClass} text-sm sm:text-base mt-2`}>
                                {sheetData.titoloAzienda} - {formatDate(sheetData.data)}
                            </p>
                        </div>
                        
                        {mySubmission ? (
                            <div className={`border-l-4 ${isCompleted ? 'border-green-500' : 'border-yellow-500'} p-3 sm:p-4 rounded-r-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <h2 className="font-bold text-base sm:text-lg mb-2">
                                    👋 Ciao, {mySubmission.nome}!
                                </h2>
                                <p className="mb-1 text-sm sm:text-base">
                                    <span className="font-semibold">Ore:</span> {mySubmission.oraIn} - {mySubmission.oraOut}
                                </p>
                                <p className="mb-2 sm:mb-3 text-sm sm:text-base">
                                    <span className="font-semibold">Totale:</span> {mySubmission.oreTotali}h
                                </p>
                                <p className="mt-2 text-sm sm:text-base">
                                    <span className="font-semibold">Stato:</span>{' '}
                                    <span className={`font-bold ${isCompleted ? 'text-green-500' : 'text-yellow-500'}`}>
                                        {isCompleted ? '✅ Completato' : '⏳ In attesa firma responsabile'}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            <p className="text-center text-red-500 text-sm sm:text-base">
                                Dati non trovati.
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
                <div className={`${cardClass} rounded-xl shadow-lg p-3 sm:p-6 mt-3 sm:mt-4`}>
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
                                {t.totalHours}: {calculateHours(workerData.oraIn, workerData.oraOut, workerData.pausaMinuti)}h
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
                                        showToast('🗑️ Firma cancellata', 'success');
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm sm:text-base transition-colors font-medium"
                                >
                                    🗑️ Cancella
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isCanvasBlank(canvasRef.current)) {
                                            showToast('❌ Canvas vuoto!', 'error');
                                        } else {
                                            showToast('✅ Firma presente!', 'success');
                                        }
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base transition-colors font-medium"
                                >
                                    ✓ Verifica
                                </button>
                            </div>
                            
                            <p className={`text-xs ${textClass} mt-1`}>
                                💡 Disegna con il mouse o con il dito
                            </p>
                        </div>

                        {/* Submit Button - GRANDE E VISIBILE */}
                        <button
                            onClick={saveWorkerData}
                            disabled={loading}
                            className="w-full py-3 sm:py-4 bg-indigo-600 text-white rounded-lg font-bold text-base sm:text-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors touch-button shadow-lg"
                        >
                            {loading ? '⏳ INVIO...' : `📤 ${t.sendData}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
