// React and other libs are expected to be available globally (loaded via CDN in index.html)
// Avoid ES module imports when using in-page Babel/UMD environment to prevent `require is not defined`.
// Sheet Editor Component - v3.0 FIX BUG LINK + FIRMA
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
    // Translation helper: prefer the centralized runtime `window.t` (provided by js/i18n.js).
    // Keep a safe fallback to the legacy `translations` object so migration is incremental.
    // We return a Proxy so existing code that uses `t.someKey` continues to work.
    const t = new Proxy({}, {
        get: (_target, prop) => {
            try {
                const key = String(prop);
                if (typeof window !== 'undefined' && typeof window.t === 'function') {
                    return window.t(key);
                }
                const all = (typeof window !== 'undefined' && window.translations) || (typeof translations !== 'undefined' && translations) || {};
                const lang = language || 'it';
                return (all[lang] && all[lang][key]) || (all['it'] && all['it'][key]) || key;
            } catch (e) {
                return String(prop);
            }
        }
    });
    // Canvas ref and key used to force re-initialization when signature is deleted
    const respCanvasRef = React.useRef(null);
    const [canvasKey, setCanvasKey] = React.useState(0);
    // Resolve WeatherWidget from global scope to avoid bundler/import issues
    const WeatherWidget = window.WeatherWidget || (() => React.createElement('div', null, t.weatherWidgetNotLoaded || (language === 'it' ? 'Widget Meteo non caricato' : 'WeatherWidget not loaded')));
    const [currentSheet, setCurrentSheet] = React.useState(sheet);
    // Debounced localita update so WeatherWidget doesn't fetch on every keystroke
    const localitaDebounceRef = React.useRef(null);
    // Visible input value for localita (immediate) and debounced update applied to currentSheet.localita
    const [weatherInput, setWeatherInput] = React.useState(sheet?.localita || sheet?.location || '');
    const [loading, setLoading] = React.useState(false);
    const [selectedWorkers, setSelectedWorkers] = React.useState([]);
    const [bulkEditMode, setBulkEditMode] = React.useState(false);
    const [bulkEditData, setBulkEditData] = React.useState({ pausaMinuti: '' });
    const [editingWorker, setEditingWorker] = React.useState(null);
    const [showAddWorkerForm, setShowAddWorkerForm] = React.useState(false);
    const [newWorker, setNewWorker] = React.useState({
        nome: '',
        cognome: '',
        oraEntrata: '',
        oraUscita: '',
        pausa: 0,
        codiceFiscale: '',
        numeroIdentita: '',
        telefono: ''
    });
    const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
    const inputClass = darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-700';

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
    
    try {
        const [inHours, inMinutes] = oraIn.split(':').map(Number);
        const [outHours, outMinutes] = oraOut.split(':').map(Number);
        
        // Verifica valori validi
        if (isNaN(inHours) || isNaN(inMinutes) || isNaN(outHours) || isNaN(outMinutes)) {
            return '0.00';
        }
        
        let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
        
        // Gestisce il caso in cui si supera la mezzanotte
        if (totalMinutes < 0) {
            totalMinutes += 24 * 60; // Aggiungi 24 ore
        }
        
        // Sottrai la pausa
        const pausa = parseInt(pausaMinuti) || 0;
        totalMinutes -= pausa;
        
        // Verifica che il risultato sia positivo
        if (totalMinutes < 0) return '0.00';
        
        const hours = (totalMinutes / 60).toFixed(2);
        return hours;
    } catch (error) {
        console.error('Errore calcolo ore:', error);
        return '0.00';
    }
};

    const checkWorkerBlacklist = (worker) => {
        return blacklist.find(bl => 
            (bl.codiceFiscale && worker.codiceFiscale && bl.codiceFiscale === worker.codiceFiscale) ||
            (bl.numeroIdentita && worker.numeroIdentita && bl.numeroIdentita === worker.numeroIdentita) ||
            (bl.nome === worker.nome && bl.cognome === worker.cognome)
        ) || false;
    };

    // Initialize canvas responsabile - 🐛 FIX: Dipende da canvasKey per re-render
        const initCanvas = (canvas) => {
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            let isDrawing = false;

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
            }

            const startDraw = (e) => {
                isDrawing = true;
                const pos = getPos(e);
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                e.preventDefault();
            };

            const draw = (e) => {
                if (!isDrawing) return;
                const pos = getPos(e);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                e.preventDefault();
            };

            const stopDraw = () => {
                isDrawing = false;
            };

            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDraw);
            canvas.addEventListener('mouseleave', stopDraw);
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

        React.useEffect(() => {
            if (respCanvasRef.current) {
                initCanvas(respCanvasRef.current);
                respCanvasRef.current.clearCanvas = () => clearCanvas(respCanvasRef.current);
                respCanvasRef.current.isCanvasBlank = () => isCanvasBlank(respCanvasRef.current);
            }
        }, [canvasKey]); // 🐛 FIX: Re-inizializza quando canvasKey cambia

    // --- Static Weather Fetch Logic ---
    // Copied/adapted from WeatherWidget.js for static weather snapshot
    async function geocodeIt(name) {
        const q = ('' + (name || '')).trim();
        if (!q) return null;
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=it`);
            if (!res.ok) return null;
            const j = await res.json();
            if (j && j.results && j.results.length) {
                return j.results[0];
            }
        } catch (e) {}
        return null;
    }

    async function fetchWeather(lat, lon, dateStr) {
        // dateStr: YYYY-MM-DD (for historical weather)
        // Open-Meteo API for historical weather: https://open-meteo.com/en/docs#historical
        // We'll fetch daily summary for the given date
        try {
            const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Errore meteo');
            const j = await res.json();
            if (!j || !j.daily) throw new Error('Dati non disponibili');
            // Return summary for the day
            return {
                temp_max: j.daily.temperature_2m_max?.[0],
                temp_min: j.daily.temperature_2m_min?.[0],
                precipitation: j.daily.precipitation_sum?.[0],
                weathercode: j.daily.weathercode?.[0]
            };
        } catch (e) { return null; }
    }

    const saveSheet = async () => {
        if (!currentSheet.titoloAzienda || !currentSheet.responsabile) {
            showToastLocal(`❌ ${t.fillRequired}`, 'error');
            return;
        }

        setLoading(true);
        try {
            // --- Static Weather Fetch ---
            let weatherStatic = null;
            const loc = currentSheet.localita || currentSheet.location;
            const dateStr = currentSheet.data || currentSheet.date; // Expect YYYY-MM-DD
            if (loc && dateStr) {
                const geo = await geocodeIt(loc);
                if (geo && geo.latitude && geo.longitude) {
                    weatherStatic = await fetchWeather(geo.latitude, geo.longitude, dateStr);
                }
            }
            // Save static weather snapshot in sheet
            const sheetToSave = { ...currentSheet, weatherStatic };
            await onSave(sheetToSave);
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

    // 🐛 FIX BUG #1: Genera link e salva timestamp + Web Share API
    const handleGenerateLink = async () => {
        if (!db) {
            showToastLocal(`❌ ${t.dbNotConnected}`, 'error');
            return;
        }

        setLoading(true);
        
        try {
            // Salva il timestamp di generazione link
            const linkGeneratedAt = new Date().toISOString();
            
            await db.collection('timesheets').doc(currentSheet.id).update({
                linkGeneratedAt: linkGeneratedAt
            });
            
            setCurrentSheet(prev => ({ ...prev, linkGeneratedAt }));
            
            // 🔧 FIX: Genera link corretto - più semplice e robusto
            const baseUrl = window.location.origin + window.location.pathname;
            const link = `${baseUrl}?mode=worker&sheet=${currentSheet.id}`;
            
            console.log('🔗 Link generato:', link);
            console.log('📍 Origin:', window.location.origin);
            console.log('📂 Pathname:', window.location.pathname);
            
            // 🔄 NEW: Usa Web Share API se disponibile (mobile/desktop moderni)
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `${t.workerMode} - ${currentSheet.titoloAzienda}`,
                        text: `${t.registerHours} per ${currentSheet.titoloAzienda} - ${currentSheet.data}`,
                        url: link
                    });
                    
                    if (addAuditLog) {
                        await addAuditLog('LINK_SHARED', `Link condiviso per: ${currentSheet.titoloAzienda}`);
                    }
                    
                    showToastLocal(`✅ ${t.linkShared || 'Link condiviso!'} Scadenza calcolata da ora.`, 'success');
                } catch (shareError) {
                    // Utente ha annullato la condivisione
                    if (shareError.name !== 'AbortError') {
                        console.error('Share error:', shareError);
                        // Fallback a copia negli appunti
                        await navigator.clipboard.writeText(link);
                        showToastLocal(`✅ ${t.linkCopied || 'Link copiato!'} Scadenza calcolata da ora.`, 'success');
                    }
                }
            } else {
                // Fallback: copia negli appunti per browser che non supportano Web Share API
                await navigator.clipboard.writeText(link);
                
                if (addAuditLog) {
                    await addAuditLog('LINK_GENERATED', `Link generato per: ${currentSheet.titoloAzienda}`);
                }
                
                showToastLocal(`✅ ${t.linkCopied || 'Link copiato negli appunti!'} Scadenza calcolata da ora.`, 'success');
            }
        } catch (error) {
            console.error('Error generating link:', error);
            showToastLocal(`❌ ${t.error}`, 'error');
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

    // 🐛 FIX BUG #2: Cancella firma e re-inizializza canvas
    const deleteResponsabileSignature = async () => {
        if (!confirm(`${t.confirm}?`)) return;
        
        setLoading(true);
        
        try {
            await db.collection('timesheets').doc(currentSheet.id).update({
                firmaResponsabile: firebase.firestore.FieldValue.delete()
            });
            
            setCurrentSheet(prev => ({ ...prev, firmaResponsabile: null }));
            
            // 🐛 FIX: Forza re-render del canvas incrementando la key
            setCanvasKey(prevKey => prevKey + 1);
            
            if (addAuditLog) {
                await addAuditLog('SIGNATURE_DELETE', `Firma responsabile cancellata: ${currentSheet.responsabile}`);
            }
            
            // Use localized message when available
            showToastLocal(`✅ ${t.signatureCleared || 'Firma cancellata.'}`, 'success');
        } catch (error) {
            console.error(error);
            showToastLocal(`❌ ${t.errorDeleting}`, 'error');
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

    // 🔧 FIX: Funzione per aggiungere un nuovo lavoratore
    const addWorker = async () => {
        if (!newWorker.nome || !newWorker.cognome || !newWorker.oraEntrata || !newWorker.oraUscita) {
            showToastLocal(`❌ ${t.fillRequired}`, 'error');
            return;
        }

        setLoading(true);
        
        const workerToAdd = {
            id: Date.now().toString(),
            nome: newWorker.nome,
            cognome: newWorker.cognome,
            oraIn: newWorker.oraEntrata,
            oraOut: newWorker.oraUscita,
            pausaMinuti: parseInt(newWorker.pausa) || 0,
            oreTotali: calculateHours(newWorker.oraEntrata, newWorker.oraUscita, newWorker.pausa),
            codiceFiscale: newWorker.codiceFiscale || '',
            numeroIdentita: newWorker.numeroIdentita || '',
            telefono: newWorker.telefono || ''
        };

        const updatedLavoratori = [...(currentSheet.lavoratori || []), workerToAdd];

        try {
            await db.collection('timesheets').doc(currentSheet.id).update({
                lavoratori: updatedLavoratori
            });

            setCurrentSheet(prev => ({ ...prev, lavoratori: updatedLavoratori }));
            setShowAddWorkerForm(false);
            setNewWorker({
                nome: '',
                cognome: '',
                oraEntrata: '',
                oraUscita: '',
                pausa: 0,
                codiceFiscale: '',
                numeroIdentita: '',
                telefono: ''
            });

            if (addAuditLog) {
                await addAuditLog('WORKER_ADD', `Aggiunto: ${workerToAdd.nome} ${workerToAdd.cognome}`);
            }

            showToastLocal(`✅ ${t.workerAdded || 'Lavoratore aggiunto con successo!'}`, 'success');
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
            {/* External card title for Sheet Editor */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    📋 {t.sheetManagement || t.sheets || 'Sheet Editor'}
                </h3>
            </div>
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
                    <div className="flex items-center">
                    <input
                        type="text"
                        placeholder={t.location}
                        value={weatherInput}
                        onChange={(e) => {
                            const v = e.target.value;
                            // Update visible input immediately
                            setWeatherInput(v);

                            // Apply immediate compat fields to currentSheet.location for other logic
                            setCurrentSheet(prev => ({ ...prev, location: v }));

                            // Debounced update for currentSheet.localita so WeatherWidget fetches after pause
                            if (localitaDebounceRef.current) clearTimeout(localitaDebounceRef.current);
                            localitaDebounceRef.current = setTimeout(() => {
                                setCurrentSheet(prev => ({ ...prev, localita: v }));
                            }, 600);
                        }}
                        className={`px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (localitaDebounceRef.current) clearTimeout(localitaDebounceRef.current);
                            setCurrentSheet(prev => ({ ...prev, localita: weatherInput }));
                            // ensure compatibility location too
                            setCurrentSheet(prev => ({ ...prev, location: weatherInput }));
                        }}
                        title={t.weatherUpdate}
                        className="ml-3 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                    >
                        {t.weatherUpdate}
                    </button>
                    </div>
                </div>

                <textarea
                    placeholder={t.notes}
                    value={currentSheet.note || ''}
                    onChange={(e) => setCurrentSheet({...currentSheet, note: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 mb-4`}
                    rows="3"
                />

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
                    <button
                        onClick={saveSheet}
                        disabled={loading}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors disabled:bg-gray-400 text-sm sm:text-base"
                    >
                        {loading ? `⏳ ${t.loading}...` : `💾 ${t.saveSheet}`}
                    </button>
                    
                    {/* 🐛 FIX BUG #1: Nuovo handler per genera link */}
                    <button
                        onClick={handleGenerateLink}
                        disabled={loading}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:bg-gray-400 text-sm sm:text-base"
                    >
                        {loading ? `⏳ ${t.loading}...` : `🔗 ${t.generateLink}`}
                    </button>
                </div>

                {/* Link visibile con indicatore scadenza */}
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className={`text-xs ${textClass} mb-2 font-semibold flex items-center gap-2`}>
                        🔗 {t.shareLink || 'Link condivisione'}:
                        {currentSheet.linkGeneratedAt && (
                            <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">
                                ✅ Attivo da {new Date(currentSheet.linkGeneratedAt).toLocaleString('it-IT')}
                            </span>
                        )}
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={(() => {
                                const baseUrl = window.location.origin + window.location.pathname;
                                return `${baseUrl}?mode=worker&sheet=${currentSheet.id}`;
                            })()}
                            readOnly
                            className={`flex-1 px-3 py-2 rounded border ${inputClass} text-xs sm:text-sm`}
                            onClick={(e) => e.target.select()}
                        />
                        <button
                            onClick={() => {
                                const baseUrl = window.location.origin + window.location.pathname;
                                const link = `${baseUrl}?mode=worker&sheet=${currentSheet.id}`;
                                navigator.clipboard.writeText(link);
                                showToastLocal('✅ Link copiato!', 'success');
                            }}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold"
                        >
                            📋
                        </button>
                    </div>
                </div>
            </div>

            {/* Workers Section */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <h3 className="text-lg sm:text-xl font-bold">
                        👷 {t.workers} ({currentSheet.lavoratori?.length || 0})
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {/* 🔧 FIX: Pulsante Aggiungi Lavoratore */}
                        <button
                            onClick={() => setShowAddWorkerForm(!showAddWorkerForm)}
                            className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                                showAddWorkerForm 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            {showAddWorkerForm ? `✕ ${t.cancel}` : `➕ ${t.addWorker}`}
                        </button>
                        
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
                </div>

                {/* 🔧 FIX: Form Aggiungi Lavoratore */}
                {showAddWorkerForm && (
                    <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-green-900/20 border-2 border-green-600' : 'bg-green-50 border-2 border-green-300'}`}>
                        <h4 className="font-bold mb-3 text-base sm:text-lg">➕ {t.addWorker}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder={`${t.firstName} *`}
                                value={newWorker.nome}
                                onChange={(e) => setNewWorker({...newWorker, nome: e.target.value})}
                                className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                            />
                            <input
                                type="text"
                                placeholder={`${t.lastName} *`}
                                value={newWorker.cognome}
                                onChange={(e) => setNewWorker({...newWorker, cognome: e.target.value})}
                                className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                            />
                            <input
                                type="time"
                                placeholder={t.timeIn}
                                value={newWorker.oraEntrata}
                                onChange={(e) => setNewWorker({...newWorker, oraEntrata: e.target.value})}
                                className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                            />
                            <input
                                type="time"
                                placeholder={t.timeOut}
                                value={newWorker.oraUscita}
                                onChange={(e) => setNewWorker({...newWorker, oraUscita: e.target.value})}
                                className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                            />
                            <input
                                type="number"
                                placeholder={t.breakMinutes}
                                value={newWorker.pausa}
                                onChange={(e) => setNewWorker({...newWorker, pausa: e.target.value})}
                                className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                            />
                            <input
                                type="text"
                                placeholder={t.fiscalCode}
                                value={newWorker.codiceFiscale}
                                onChange={(e) => setNewWorker({...newWorker, codiceFiscale: e.target.value})}
                                className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                            />
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={addWorker}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:bg-gray-400"
                            >
                                {loading ? `⏳ ${t.loading}...` : `✓ ${t.addWorker}`}
                            </button>
                            <button
                                onClick={() => setShowAddWorkerForm(false)}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold"
                            >
                                {t.cancel}
                            </button>
                        </div>
                    </div>
                )}
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

            {/* 🐛 FIX BUG #2: Firma Responsabile con canvas re-inizializzabile */}
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
                            onClick={deleteResponsabileSignature}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm sm:text-base disabled:bg-gray-400"
                        >
                            {loading ? `⏳ ${t.loading}...` : `🗑️ ${t.deleteSignature}`}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="border-2 border-indigo-500 rounded-lg p-2 bg-white mb-3">
                            {/* 🐛 FIX: Canvas con key per forzare re-render */}
                            <canvas 
                                key={typeof canvasKey !== 'undefined' ? canvasKey : 0}
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
                                {loading ? `⏳ ${t.loading}...` : `✓ ${t.saveSignature}`}
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
        {/* Widget Meteo per la località del foglio */}
        {currentSheet?.localita && (
                                <div className="my-2">
                                    <WeatherWidget location={currentSheet.localita} darkMode={darkMode} />
                                </div>
        )}
        </div>
    );
}

// Expose as global for in-page usage (no bundler) with guard to prevent redeclaration
if (!window.SheetEditor) {
    window.SheetEditor = SheetEditor;
}
