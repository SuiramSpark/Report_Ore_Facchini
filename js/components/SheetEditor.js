// Sheet Editor Component - VERSIONE COMPLETA 5 LINGUE
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

    // FUNZIONI HELPER LOCALI
    const showToastLocal = (message, type = 'info') => {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    };

    const calculateHours = (oraIn, oraOut, pausaMinuti = 0) => {
        if (!oraIn || !oraOut) return '0.00';
        
        const [inHours, inMinutes] = oraIn.split(':').map(Number);
        const [outHours, outMinutes] = oraOut.split(':').map(Number);
        
        let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
        totalMinutes -= parseInt(pausaMinuti) || 0;
        
        if (totalMinutes < 0) return '0.00';
        
        const hours = (totalMinutes / 60).toFixed(2);
        return hours;
    };

    const checkWorkerBlacklist = (worker) => {
        return blacklist.find(bl => 
            (bl.codiceFiscale && worker.codiceFiscale && bl.codiceFiscale === worker.codiceFiscale) ||
            (bl.numeroIdentita && worker.numeroIdentita && bl.numeroIdentita === worker.numeroIdentita) ||
            (bl.nome === worker.nome && bl.cognome === worker.cognome)
        ) || false;
    };

    const generateShareLink = (sheetId) => {
        const baseUrl = `${window.location.origin}/Report_Ore_Facchini`;
        const link = `${baseUrl}/?mode=worker&sheet=${sheetId}`;
        navigator.clipboard.writeText(link)
            .then(() => {
                showToastLocal(`✅ ${t.linkCopied}`, 'success');
            })
            .catch(() => {
                prompt(`${t.generateLink}:`, link);
            });
    };

    // Initialize canvas responsabile
    React.useEffect(() => {
        const initCanvas = (canvas) => {
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            // Sfondo bianco
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            let isDrawing = false;
            let lastX = 0;
            let lastY = 0;

            const getPos = (e) => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                
                let clientX, clientY;
                
                if (e.touches && e.touches[0]) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }
                
                return {
                    x: (clientX - rect.left) * scaleX,
                    y: (clientY - rect.top) * scaleY
                };
            };

            const startDraw = (e) => {
                isDrawing = true;
                const pos = getPos(e);
                lastX = pos.x;
                lastY = pos.y;
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                e.preventDefault();
            };

            const draw = (e) => {
                if (!isDrawing) return;
                const pos = getPos(e);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                lastX = pos.x;
                lastY = pos.y;
                e.preventDefault();
            };

            const stopDraw = () => {
                isDrawing = false;
            };

            // Eventi mouse
            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDraw);
            canvas.addEventListener('mouseleave', stopDraw);

            // Eventi touch
            canvas.addEventListener('touchstart', startDraw);
            canvas.addEventListener('touchmove', draw);
            canvas.addEventListener('touchend', stopDraw);
        };

        const clearCanvas = (canvas) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const isCanvasBlank = (canvas) => {
            if (!canvas) return true;
            const ctx = canvas.getContext('2d');
            const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            
            for (let i = 0; i < pixelData.length; i += 4) {
                if (pixelData[i] !== 255 || pixelData[i+1] !== 255 || pixelData[i+2] !== 255) {
                    return false;
                }
            }
            return true;
        };

        if (respCanvasRef.current) {
            initCanvas(respCanvasRef.current);
            
            // Salva le funzioni nel ref
            respCanvasRef.current.clearCanvas = () => clearCanvas(respCanvasRef.current);
            respCanvasRef.current.isCanvasBlank = () => isCanvasBlank(respCanvasRef.current);
        }
    }, []);

    const saveSheet = async () => {
        if (!currentSheet.titoloAzienda || !currentSheet.responsabile) {
            showToastLocal(`❌ ${t.fillRequired}`, 'error');
            return;
        }

        setLoading(true);
        try {
            await onSave(currentSheet);
            if (addAuditLog) {
                await addAuditLog('SHEET_EDIT', `${t.edit}: ${currentSheet.titoloAzienda}`);
            }
            showToastLocal(`✅ ${t.sheetSaved}`, 'success');
        } catch (error) {
            console.error(error);
            showToastLocal(`❌ ${t.errorSaving}`, 'error');
        }
        setLoading(false);
    };

    const saveResponsabileSignature = async () => {
        if (!respCanvasRef.current) return;
        
        if (respCanvasRef.current.isCanvasBlank && respCanvasRef.current.isCanvasBlank()) {
            showToastLocal(`❌ ${t.signBeforeSend}`, 'error');
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
                await addAuditLog('SIGNATURE_ADD', `${t.responsibleSignature}: ${currentSheet.responsabile}`);
            }
            
            showToastLocal(`✅ ${t.signatureSaved}`, 'success');
        } catch (error) {
            console.error(error);
            showToastLocal(`❌ ${t.errorSaving}`, 'error');
        }
        setLoading(false);
    };

    const deleteWorker = async (workerId) => {
        if (!confirm(`${t.confirm}?`)) return;
        
        setLoading(true);
        const worker = currentSheet.lavoratori.find(w => w.id === workerId);
        const updatedLavoratori = currentSheet.lavoratori.filter(w => w.id !== workerId);
        
        try {
            await db.collection('timesheets').doc(currentSheet.id).update({
                lavoratori: updatedLavoratori
            });
            
            setCurrentSheet(prev => ({ ...prev, lavoratori: updatedLavoratori }));
            
            if (addAuditLog) {
                await addAuditLog('WORKER_DELETE', `${t.delete}: ${worker.nome} ${worker.cognome}`);
            }
            
            showToastLocal(`✅ ${t.workerDeleted}`, 'success');
        } catch (error) {
            console.error(error);
            showToastLocal(`❌ ${t.errorDeleting}`, 'error');
        }
        setLoading(false);
    };

    const updateWorker = async (workerId, updatedData) => {
        setLoading(true);
        const updatedLavoratori = currentSheet.lavoratori.map(w => 
            w.id === workerId ? { 
                ...w, 
                ...updatedData, 
                oreTotali: calculateHours(updatedData.oraIn, updatedData.oraOut, updatedData.pausaMinuti) 
            } : w
        );
        
        try {
            await db.collection('timesheets').doc(currentSheet.id).update({
                lavoratori: updatedLavoratori
            });
            
            setCurrentSheet(prev => ({ ...prev, lavoratori: updatedLavoratori }));
            setEditingWorker(null);
            
            if (addAuditLog) {
                await addAuditLog('WORKER_EDIT', `${t.edit}: ${updatedData.nome} ${updatedData.cognome}`);
            }
            
            showToastLocal(`✅ ${t.workerUpdated}`, 'success');
        } catch (error) {
            console.error(error);
            showToastLocal(`❌ ${t.errorSaving}`, 'error');
        }
        setLoading(false);
    };

    const bulkUpdateWorkers = async () => {
        if (selectedWorkers.length === 0) {
            showToastLocal(`❌ ${t.fillRequired}`, 'error');
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
                await addAuditLog('BULK_UPDATE', `${selectedWorkers.length} ${t.workers.toLowerCase()}`);
            }
            
            showToastLocal(`✅ ${selectedWorkers.length} ${t.workerUpdated}`, 'success');
        } catch (error) {
            console.error(error);
            showToastLocal(`❌ ${t.errorSaving}`, 'error');
        }
        setLoading(false);
    };

    const completeSheet = async () => {
        if (!currentSheet.firmaResponsabile) {
            showToastLocal(`❌ ${t.signatureMissing}`, 'error');
            return;
        }
        if (!currentSheet.lavoratori || currentSheet.lavoratori.length === 0) {
            showToastLocal(`❌ ${t.noWorkers}`, 'error');
            return;
        }
        
        setLoading(true);
        try {
            await onComplete(currentSheet);
            await generatePDF(currentSheet, companyLogo);
            
            showToastLocal(`✅ ${t.sheetCompleted}`, 'success');
            
            if (addAuditLog) {
                await addAuditLog('SHEET_COMPLETE', `${t.completed}: ${currentSheet.titoloAzienda}`);
            }
            
            setTimeout(() => onBack(), 1500);
        } catch (error) {
            console.error(error);
            showToastLocal(`❌ ${t.error}`, 'error');
        }
        setLoading(false);
    };

    const toggleWorkerSelection = (workerId) => {
        setSelectedWorkers(prev => 
            prev.includes(workerId) 
                ? prev.filter(id => id !== workerId)
                : [...prev, workerId]
        );
    };

    const clearSignature = () => {
        if (respCanvasRef.current && respCanvasRef.current.clearCanvas) {
            respCanvasRef.current.clearCanvas();
            showToastLocal(`🗑️ ${t.signatureCleared}`, 'success');
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold">✏️ {t.sheetManagement}</h1>
                    <button
                        onClick={onBack}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                    >
                        ← {t.back}
                    </button>
                </div>
            </div>

            {/* Sheet Info */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    <input
                        type="text"
                        placeholder={`${t.company} *`}
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
                        placeholder={`${t.responsible} *`}
                        value={currentSheet.responsabile}
                        onChange={(e) => setCurrentSheet({...currentSheet, responsabile: e.target.value})}
                        className={`px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                    />
                    <input
                        type="text"
                        placeholder={t.location}
                        value={currentSheet.location || ''}
                        onChange={(e) => setCurrentSheet({...currentSheet, location: e.target.value})}
                        className={`px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                    />
                </div>

                <textarea
                    placeholder={t.notes}
                    value={currentSheet.note || ''}
                    onChange={(e) => setCurrentSheet({...currentSheet, note: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 mb-4`}
                    rows="3"
                />

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={saveSheet}
                        disabled={loading}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors disabled:bg-gray-400 text-sm sm:text-base"
                    >
                        {loading ? `⏳ ${t.loading}...` : `💾 ${t.saveSheet}`}
                    </button>
                    
                    <button
                        onClick={() => generateShareLink(currentSheet.id)}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors text-sm sm:text-base"
                    >
                        🔗 {t.generateLink}
                    </button>
                </div>
            </div>

            {/* Workers Section */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <h3 className="text-lg sm:text-xl font-bold">
                        👷 {t.workers} ({currentSheet.lavoratori?.length || 0})
                    </h3>
                    
                    {currentSheet.lavoratori?.length > 0 && (
                        <button
                            onClick={() => setBulkEditMode(!bulkEditMode)}
                            className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                                bulkEditMode 
                                    ? 'bg-indigo-600 text-white' 
                                    : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            {bulkEditMode ? `✓ ${t.bulkEdit}` : `📝 ${t.bulkEdit}`}
                        </button>
                    )}
                </div>

                {/* Bulk Edit Panel */}
                {bulkEditMode && (
                    <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                        <div className="flex flex-wrap gap-2 mb-3">
                            <button
                                onClick={() => setSelectedWorkers(currentSheet.lavoratori.map(w => w.id))}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs sm:text-sm font-semibold"
                            >
                                ✓ {t.selectAll}
                            </button>
                            <button
                                onClick={() => setSelectedWorkers([])}
                                className="px-3 py-1 bg-gray-600 text-white rounded text-xs sm:text-sm font-semibold"
                            >
                                ✗ {t.deselectAll}
                            </button>
                            <span className={`${textClass} text-xs sm:text-sm`}>
                                {selectedWorkers.length} {t.selected}
                            </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="number"
                                placeholder={t.break}
                                value={bulkEditData.pausaMinuti}
                                onChange={(e) => setBulkEditData({...bulkEditData, pausaMinuti: e.target.value})}
                                className={`flex-1 px-4 py-2 rounded-lg border ${inputClass}`}
                            />
                            <button
                                onClick={bulkUpdateWorkers}
                                disabled={selectedWorkers.length === 0}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold disabled:bg-gray-400 text-sm sm:text-base"
                            >
                                {t.updateAll}
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
                                    key={worker.id || i} 
                                    className={`p-3 sm:p-4 rounded-lg border-2 ${
                                        isInBlacklist 
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                                            : isSelected
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                            : darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    {isEditing ? (
                                        // EDIT MODE
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={editingWorker.nome}
                                                    onChange={(e) => setEditingWorker({...editingWorker, nome: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm`}
                                                    placeholder={t.name}
                                                />
                                                <input
                                                    type="text"
                                                    value={editingWorker.cognome}
                                                    onChange={(e) => setEditingWorker({...editingWorker, cognome: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm`}
                                                    placeholder={t.surname}
                                                />
                                                <input
                                                    type="time"
                                                    value={editingWorker.oraIn}
                                                    onChange={(e) => setEditingWorker({...editingWorker, oraIn: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm`}
                                                />
                                                <input
                                                    type="time"
                                                    value={editingWorker.oraOut}
                                                    onChange={(e) => setEditingWorker({...editingWorker, oraOut: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm`}
                                                />
                                                <input
                                                    type="number"
                                                    value={editingWorker.pausaMinuti}
                                                    onChange={(e) => setEditingWorker({...editingWorker, pausaMinuti: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm`}
                                                    placeholder={t.break}
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <button
                                                    onClick={() => updateWorker(worker.id, editingWorker)}
                                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-semibold text-sm"
                                                >
                                                    ✓ {t.save}
                                                </button>
                                                <button
                                                    onClick={() => setEditingWorker(null)}
                                                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded font-semibold text-sm"
                                                >
                                                    ✗ {t.cancel}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // VIEW MODE
                                        <div className="flex items-start gap-3">
                                            {bulkEditMode && (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleWorkerSelection(worker.id)}
                                                    className="mt-1 w-5 h-5 flex-shrink-0"
                                                />
                                            )}
                                            
                                            <div className="flex-1 min-w-0">
                                                {isInBlacklist && (
                                                    <div className="bg-red-600 text-white px-3 py-2 rounded-lg mb-2 text-xs sm:text-sm font-semibold">
                                                        ⚠️ {t.blacklistWarning}
                                                        <p className="text-xs mt-1">{t.reason}: {isInBlacklist.reason}</p>
                                                    </div>
                                                )}
                                                
                                                <p className="font-semibold text-sm sm:text-base mb-1">
                                                    {t.workerNumber} #{i + 1}: {worker.nome} {worker.cognome}
                                                </p>
                                                <div className={`text-xs sm:text-sm ${textClass} space-y-1`}>
                                                    <p>🕐 {worker.oraIn} - {worker.oraOut}</p>
                                                    <p>⏸️ {t.pause}: {worker.pausaMinuti || 0} {t.min}</p>
                                                    <p className="font-semibold">⏱️ {t.total}: {worker.oreTotali}{t.hours_short}</p>
                                                </div>
                                                {worker.firma && (
                                                    <img 
                                                        src={worker.firma} 
                                                        alt={t.signature} 
                                                        className="mt-2 h-12 sm:h-16 border rounded bg-white" 
                                                    />
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => setEditingWorker(worker)}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs sm:text-sm font-semibold hover:bg-blue-700"
                                                >
                                                    ✏️
                                                </button>
                                                {!isInBlacklist && addToBlacklist && (
                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt(`${t.reason}:`);
                                                            if (reason) addToBlacklist(worker, reason);
                                                        }}
                                                        className="px-3 py-2 bg-orange-600 text-white rounded text-xs sm:text-sm font-semibold hover:bg-orange-700"
                                                    >
                                                        🚫
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteWorker(worker.id)}
                                                    className="px-3 py-2 bg-red-600 text-white rounded text-xs sm:text-sm font-semibold hover:bg-red-700"
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
                    <div className="text-center py-8 sm:py-12">
                        <p className="text-3xl sm:text-4xl mb-3">👷</p>
                        <p className={`${textClass} text-sm sm:text-base`}>{t.noWorkers}</p>
                    </div>
                )}
            </div>

            {/* Firma Responsabile */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h3 className="text-lg sm:text-xl font-bold mb-4">✍️ {t.responsibleSignature}</h3>
                
                {currentSheet.firmaResponsabile ? (
                    <div>
                        <img 
                            src={currentSheet.firmaResponsabile} 
                            alt={t.responsibleSignature}
                            className="border-2 border-green-500 rounded-lg mb-3 p-2 bg-white max-w-md w-full" 
                        />
                        <button
                            onClick={() => {
                                if (confirm(`${t.confirm}?`)) {
                                    setCurrentSheet({...currentSheet, firmaResponsabile: null});
                                }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm sm:text-base"
                        >
                            🗑️ {t.deleteSignature}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="border-2 border-indigo-500 rounded-lg p-2 bg-white mb-3">
                            <canvas 
                                ref={respCanvasRef} 
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
                                onClick={saveResponsabileSignature}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 text-sm sm:text-base"
                            >
                                ✓ {t.saveSignature}
                            </button>
                            <button
                                onClick={clearSignature}
                                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold text-sm sm:text-base"
                            >
                                🗑️ {t.clear}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Complete Button */}
            <button
                onClick={completeSheet}
                disabled={!currentSheet.firmaResponsabile || loading}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base sm:text-lg transition-colors disabled:bg-gray-400 shadow-lg"
            >
                {loading ? `⏳ ${t.loading}...` : `✅ ${t.completePDF}`}
            </button>
        </div>
    );
};
