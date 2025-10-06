// Sheet Editor Component - COMPLETO
const SheetEditor = ({ 
    sheet, 
    onSave, 
    onComplete, 
    onBack, 
    db,
    blacklist = [],
    addToBlacklist,
    addAuditLog,
    darkMode, 
    language = 'it',
    companyLogo 
}) => {
    const t = translations[language];
    const [currentSheet, setCurrentSheet] = React.useState(sheet);
    const [loading, setLoading] = React.useState(false);
    const [selectedWorkers, setSelectedWorkers] = React.useState([]);
    const [bulkEditMode, setBulkEditMode] = React.useState(false);
    const [bulkEditData, setBulkEditData] = React.useState({ pausaMinuti: '' });
    const [editingWorker, setEditingWorker] = React.useState(null);
    
    const respCanvasRef = React.useRef(null);
    
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white' : 
        'bg-white border-gray-300 text-gray-900';

    React.useEffect(() => {
        if (respCanvasRef.current) {
            initCanvas(respCanvasRef.current, darkMode);
        }
    }, [darkMode]);

    const saveSheet = async () => {
        if (!currentSheet.titoloAzienda || !currentSheet.responsabile) {
            showToast('❌ Compila almeno azienda e responsabile', 'error');
            return;
        }

        setLoading(true);
        try {
            await onSave(currentSheet);
            if (addAuditLog) {
                await addAuditLog('SHEET_EDIT', `Modificato: ${currentSheet.titoloAzienda}`);
            }
            showToast('✅ Foglio salvato!', 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Errore salvataggio', 'error');
        }
        setLoading(false);
    };

    const saveResponsabileSignature = async () => {
        if (!respCanvasRef.current) return;
        
        if (isCanvasBlank(respCanvasRef.current)) {
            showToast('❌ Firma prima di salvare', 'error');
            return;
        }

        setLoading(true);
        const firma = respCanvasRef.current.toDataURL('image/png');
        
        try {
            await db.collection('timesheets').doc(currentSheet.id).update({
                firmaResponsabile: firma
            });
            
            setCurrentSheet(prev => ({ ...prev, firmaResponsabile: firma }));
            
            if (addAuditLog) {
                await addAuditLog('SIGNATURE_ADD', `Firma responsabile aggiunta: ${currentSheet.responsabile}`);
            }
            
            showToast('✅ Firma salvata!', 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Errore salvataggio firma', 'error');
        }
        setLoading(false);
    };

    const deleteWorker = async (workerId) => {
        if (!confirm('Eliminare questo lavoratore?')) return;
        
        setLoading(true);
        const worker = currentSheet.lavoratori.find(w => w.id === workerId);
        const updatedLavoratori = currentSheet.lavoratori.filter(w => w.id !== workerId);
        
        try {
            await db.collection('timesheets').doc(currentSheet.id).update({
                lavoratori: updatedLavoratori
            });
            
            setCurrentSheet(prev => ({ ...prev, lavoratori: updatedLavoratori }));
            
            if (addAuditLog) {
                await addAuditLog('WORKER_DELETE', `Eliminato: ${worker.nome} ${worker.cognome}`);
            }
            
            showToast('✅ Lavoratore eliminato', 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Errore eliminazione', 'error');
        }
        setLoading(false);
    };

    const updateWorker = async (workerId, updatedData) => {
        setLoading(true);
        const updatedLavoratori = currentSheet.lavoratori.map(w => 
            w.id === workerId ? { ...w, ...updatedData, oreTotali: calculateHours(updatedData.oraIn, updatedData.oraOut, updatedData.pausaMinuti) } : w
        );
        
        try {
            await db.collection('timesheets').doc(currentSheet.id).update({
                lavoratori: updatedLavoratori
            });
            
            setCurrentSheet(prev => ({ ...prev, lavoratori: updatedLavoratori }));
            setEditingWorker(null);
            
            if (addAuditLog) {
                await addAuditLog('WORKER_EDIT', `Modificato: ${updatedData.nome} ${updatedData.cognome}`);
            }
            
            showToast('✅ Lavoratore aggiornato', 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Errore aggiornamento', 'error');
        }
        setLoading(false);
    };

    const bulkUpdateWorkers = async () => {
        if (selectedWorkers.length === 0) {
            showToast('❌ Seleziona almeno un lavoratore', 'error');
            return;
        }
        
        setLoading(true);
        const updatedLavoratori = currentSheet.lavoratori.map(w => {
            if (selectedWorkers.includes(w.id)) {
                const newOre = calculateHours(w.oraIn, w.oraOut, bulkEditData.pausaMinuti);
                return { ...w, pausaMinuti: bulkEditData.pausaMinuti, oreTotali: newOre };
            }
            return w;
        });
        
        try {
            await db.collection('timesheets').doc(currentSheet.id).update({
                lavoratori: updatedLavoratori
            });
            
            setCurrentSheet(prev => ({ ...prev, lavoratori: updatedLavoratori }));
            setSelectedWorkers([]);
            setBulkEditMode(false);
            
            if (addAuditLog) {
                await addAuditLog('BULK_UPDATE', `${selectedWorkers.length} lavoratori modificati`);
            }
            
            showToast(`✅ ${selectedWorkers.length} lavoratori aggiornati`, 'success');
        } catch (error) {
            console.error(error);
            showToast('❌ Errore aggiornamento multiplo', 'error');
        }
        setLoading(false);
    };

    const completeSheet = async () => {
        if (!currentSheet.firmaResponsabile) {
            showToast('❌ Firma del responsabile mancante', 'error');
            return;
        }
        
        if (!currentSheet.lavoratori || currentSheet.lavoratori.length === 0) {
            showToast('❌ Nessun lavoratore registrato', 'error');
            return;
        }

        setLoading(true);
        try {
            await onComplete(currentSheet);
            await generatePDF(currentSheet, companyLogo);
            
            if (addAuditLog) {
                await addAuditLog('SHEET_COMPLETE', `Completato: ${currentSheet.titoloAzienda}`);
            }
            
            showToast('✅ Foglio completato e PDF generato!', 'success');
            setTimeout(() => onBack(), 1500);
        } catch (error) {
            console.error(error);
            showToast('❌ Errore completamento', 'error');
        }
        setLoading(false);
    };

    const checkWorkerBlacklist = (worker) => {
        return checkBlacklist(worker, blacklist);
    };

    const toggleWorkerSelection = (workerId) => {
        setSelectedWorkers(prev => 
            prev.includes(workerId) 
                ? prev.filter(id => id !== workerId)
                : [...prev, workerId]
        );
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
            <div className="max-w-6xl mx-auto">
                <div className={`${cardClass} rounded-xl shadow-lg p-6 mb-6`}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">✏️ Gestione Foglio Ore</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={onBack}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                            >
                                ← Indietro
                            </button>
                        </div>
                    </div>

                    {/* Sheet Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Azienda Cliente *"
                            value={currentSheet.titoloAzienda}
                            onChange={(e) => setCurrentSheet({...currentSheet, titoloAzienda: e.target.value})}
                            className={`px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                        />
                        <input
                            type="date"
                            value={currentSheet.data}
                            onChange={(e) => setCurrentSheet({...currentSheet, data: e.target.value})}
                            className={`px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                        />
                        <input
                            type="text"
                            placeholder="Responsabile *"
                            value={currentSheet.responsabile}
                            onChange={(e) => setCurrentSheet({...currentSheet, responsabile: e.target.value})}
                            className={`px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                        />
                        <input
                            type="text"
                            placeholder="Località"
                            value={currentSheet.location}
                            onChange={(e) => setCurrentSheet({...currentSheet, location: e.target.value})}
                            className={`px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                        />
                    </div>

                    <textarea
                        placeholder="Note (opzionale)"
                        value={currentSheet.note || ''}
                        onChange={(e) => setCurrentSheet({...currentSheet, note: e.target.value})}
                        className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 mb-4`}
                        rows="3"
                    />

                    {/* Workers Section */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">
                                👷 Lavoratori Registrati ({currentSheet.lavoratori?.length || 0})
                            </h3>
                            
                            {currentSheet.lavoratori?.length > 0 && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setBulkEditMode(!bulkEditMode)}
                                        className={`px-4 py-2 rounded-lg font-semibold ${
                                            bulkEditMode 
                                                ? 'bg-indigo-600 text-white' 
                                                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                        }`}
                                    >
                                        {bulkEditMode ? '✓ Modifica Multipla' : '📝 Modifica Multipla'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Bulk Edit Mode */}
                        {bulkEditMode && (
                            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                                <div className="flex gap-2 mb-3">
                                    <button
                                        onClick={() => setSelectedWorkers(currentSheet.lavoratori.map(w => w.id))}
                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                    >
                                        ✓ Seleziona Tutti
                                    </button>
                                    <button
                                        onClick={() => setSelectedWorkers([])}
                                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                                    >
                                        ✗ Deseleziona Tutti
                                    </button>
                                    <span className={textClass}>
                                        {selectedWorkers.length} selezionati
                                    </span>
                                </div>
                                
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Pausa (minuti)"
                                        value={bulkEditData.pausaMinuti}
                                        onChange={(e) => setBulkEditData({...bulkEditData, pausaMinuti: e.target.value})}
                                        className={`flex-1 px-4 py-2 rounded-lg border ${inputClass}`}
                                    />
                                    <button
                                        onClick={bulkUpdateWorkers}
                                        disabled={selectedWorkers.length === 0}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold disabled:bg-gray-400"
                                    >
                                        Aggiorna Tutti
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Workers List */}
                        {currentSheet.lavoratori?.length > 0 ? (
                            <div className="space-y-3">
                                {currentSheet.lavoratori.map((worker, i) => {
                                    const isInBlacklist = checkWorkerBlacklist(worker);
                                    const isSelected = selectedWorkers.includes(worker.id);
                                    const isEditing = editingWorker?.id === worker.id;
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            className={`p-4 rounded-lg border-2 ${
                                                isInBlacklist 
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                                                    : darkMode ? 'border-gray-700' : 'border-gray-200'
                                            } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                                        >
                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="text"
                                                            value={editingWorker.nome}
                                                            onChange={(e) => setEditingWorker({...editingWorker, nome: e.target.value})}
                                                            className={`px-3 py-2 rounded border ${inputClass}`}
                                                            placeholder="Nome"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editingWorker.cognome}
                                                            onChange={(e) => setEditingWorker({...editingWorker, cognome: e.target.value})}
                                                            className={`px-3 py-2 rounded border ${inputClass}`}
                                                            placeholder="Cognome"
                                                        />
                                                        <input
                                                            type="time"
                                                            value={editingWorker.oraIn}
                                                            onChange={(e) => setEditingWorker({...editingWorker, oraIn: e.target.value})}
                                                            className={`px-3 py-2 rounded border ${inputClass}`}
                                                        />
                                                        <input
                                                            type="time"
                                                            value={editingWorker.oraOut}
                                                            onChange={(e) => setEditingWorker({...editingWorker, oraOut: e.target.value})}
                                                            className={`px-3 py-2 rounded border ${inputClass}`}
                                                        />
                                                        <input
                                                            type="number"
                                                            value={editingWorker.pausaMinuti}
                                                            onChange={(e) => setEditingWorker({...editingWorker, pausaMinuti: e.target.value})}
                                                            className={`px-3 py-2 rounded border ${inputClass}`}
                                                            placeholder="Pausa (min)"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => updateWorker(worker.id, editingWorker)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded"
                                                        >
                                                            ✓ Salva
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingWorker(null)}
                                                            className="px-4 py-2 bg-gray-600 text-white rounded"
                                                        >
                                                            ✗ Annulla
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-4">
                                                    {bulkEditMode && (
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleWorkerSelection(worker.id)}
                                                            className="mt-1 w-5 h-5"
                                                        />
                                                    )}
                                                    
                                                    <div className="flex-1">
                                                        {isInBlacklist && (
                                                            <div className="bg-red-600 text-white px-3 py-1 rounded-lg mb-2 text-sm font-semibold">
                                                                ⚠️ {t.blacklistWarning}
                                                                <p className="text-xs mt-1">{t.reason}: {isInBlacklist.reason}</p>
                                                            </div>
                                                        )}
                                                        
                                                        <p className="font-semibold text-lg">
                                                            {i + 1}. {worker.nome} {worker.cognome}
                                                        </p>
                                                        <div className={`text-sm ${textClass} mt-1`}>
                                                            <p>🕐 {worker.oraIn} - {worker.oraOut}</p>
                                                            <p>⏸️ Pausa: {worker.pausaMinuti || 0} min</p>
                                                            <p className="font-semibold">⏱️ Totale: {worker.oreTotali}h</p>
                                                        </div>
                                                        {worker.firma && (
                                                            <img src={worker.firma} alt="Firma" className="mt-2 h-12 border rounded" />
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex gap-2 mobile-buttons">
                                                        <button
                                                            onClick={() => setEditingWorker(worker)}
                                                            className="px-3 py-2 bg-blue-600 text-white rounded touch-button"
                                                        >
                                                            ✏️
                                                        </button>
                                                        {!isInBlacklist && addToBlacklist && (
                                                            <button
                                                                onClick={() => {
                                                                    const reason = prompt('Motivo blacklist:');
                                                                    if (reason) addToBlacklist(worker, reason);
                                                                }}
                                                                className="px-3 py-2 bg-orange-600 text-white rounded touch-button"
                                                            >
                                                                🚫
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteWorker(worker.id)}
                                                            className="px-3 py-2 bg-red-600 text-white rounded touch-button"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className={`text-center py-8 ${textClass}`}>
                                Nessun lavoratore ancora registrato
                            </p>
                        )}
                    </div>

                    {/* Firma Responsabile */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold mb-4">✍️ Firma Responsabile</h3>
                        
                        {currentSheet.firmaResponsabile ? (
                            <div>
                                <img 
                                    src={currentSheet.firmaResponsabile} 
                                    alt="Firma Responsabile" 
                                    className="border-2 border-green-500 rounded-lg mb-3 p-2 bg-white" 
                                />
                                <button
                                    onClick={() => {
                                        if (confirm('Cancellare la firma?')) {
                                            setCurrentSheet({...currentSheet, firmaResponsabile: null});
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg"
                                >
                                    🗑️ Cancella Firma
                                </button>
                            </div>
                        ) : (
                            <div>
                                <canvas 
                                    ref={respCanvasRef} 
                                    width={500} 
                                    height={150} 
                                    className={`w-full mb-3 ${darkMode ? 'dark-mode' : ''}`}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={saveResponsabileSignature}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
                                    >
                                        ✓ Salva Firma
                                    </button>
                                    <button
                                        onClick={() => clearCanvas(respCanvasRef.current)}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                                    >
                                        🗑️ Cancella
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={saveSheet}
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            💾 Salva Foglio
                        </button>
                        
                        <button
                            onClick={() => generateShareLink(currentSheet.id)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                        >
                            🔗 Genera Link Lavoratori
                        </button>
                        
                        <button
                            onClick={completeSheet}
                            disabled={!currentSheet.firmaResponsabile || loading}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                        >
                            ✅ Completa e Genera PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
