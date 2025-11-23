// React and other libs are expected to be available globally (loaded via CDN in index.html)
// Avoid ES module imports when using in-page Babel/UMD environment to prevent `require is not defined`.
// Sheet Editor Component - v4.3 COMPACT UI - Multi-select compatto con tag inline
console.log('🔄 SheetEditor v4.3 COMPACT loaded - Tag inline + traduzioni');
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
    companyLogo,
    companies = [],
    activeCompanyId,
    appSettings = { expirationDays: 1 },
    users = [],
    currentUser,
    recentAddresses = []
}) => {
    // Get logo from sheet's company (NEW system ONLY - companies/ collection)
    const sheetCompanyLogo = React.useMemo(() => {
        // Protezione contro currentSheet undefined o null
        if (!currentSheet) {
            return companyLogo;
        }
        
        console.log('🖼️ DEBUG LOGO - currentSheet.companies:', currentSheet?.companies);
        console.log('🖼️ DEBUG LOGO - companies (NEW system):', companies);
        
        // ✅ Usa SOLO il nuovo sistema companies[] (collection)
        if (currentSheet?.companies && Array.isArray(currentSheet.companies) && currentSheet.companies.length > 0 && companies?.length > 0) {
            const firstCompanyId = currentSheet.companies[0];
            const company = companies.find(c => c.id === firstCompanyId);
            console.log('🖼️ DEBUG LOGO - firstCompanyId:', firstCompanyId);
            console.log('🖼️ DEBUG LOGO - found company:', company);
            if (company?.logoURL) {
                console.log('✅ DEBUG LOGO - Using company logoURL:', company.logoURL);
                return company.logoURL;
            }
        }
        
        // Fallback al logo globale
        console.log('⚠️ DEBUG LOGO - Fallback to global companyLogo:', companyLogo);
        return companyLogo;
    }, [currentSheet, companies, companyLogo]);

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
    
    // 🍞 Toast notification system (local)
    const [toast, setToast] = React.useState({ visible: false, message: '', type: 'info' });
    const showToastLocal = (message, type = 'info') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 3000);
    };
    const [bulkEditMode, setBulkEditMode] = React.useState(false);
    const [partialPDFMode, setPartialPDFMode] = React.useState(false);
    const [bulkEditData, setBulkEditData] = React.useState({ pausaMinuti: '', oraIn: '', oraOut: '' });
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
        telefono: '',
        email: '',
        indirizzo: '',
        dataNascita: '',
        firma: ''
    });
    const [showOptionalFieldsAdd, setShowOptionalFieldsAdd] = React.useState(false);
    const addWorkerCanvasRef = React.useRef(null);
    const [addWorkerSignaturePad, setAddWorkerSignaturePad] = React.useState(null);
    const [showActivityDropdown, setShowActivityDropdown] = React.useState(false);
    const [showCompanyDropdown, setShowCompanyDropdown] = React.useState(false);
    const [showSupervisorDropdown, setShowSupervisorDropdown] = React.useState(false);
    const [showAddressDropdown, setShowAddressDropdown] = React.useState(false);
    const [searchSupervisor, setSearchSupervisor] = React.useState(''); // Search filter for supervisors
    const [addressInputFocused, setAddressInputFocused] = React.useState(false); // Controlla dropdown indirizzi
    const cardClass = darkMode ? 'bg-gray-800' : 'bg-white';
    const inputClass = darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-700';

    // 🔐 CONTROLLO ACCESSO: Worker NON può accedere
    React.useEffect(() => {
        if (currentUser && currentUser.role === 'worker') {
            showToastLocal('🚫 Accesso negato - Solo visualizzazione propri fogli', 'error');
            if (typeof onBack === 'function') {
                setTimeout(() => onBack(), 1500);
            }
        }
    }, [currentUser]);

    // 🔐 PERMESSI BASATI SU RUOLI
    const userRole = currentUser?.role;
    const isAdmin = userRole === 'admin';
    const isManager = userRole === 'manager';
    const isResponsabile = userRole === 'responsabile';
    const isWorker = userRole === 'worker';
    
    // Admin, manager e responsabile possono modificare quasi tutto
    const canEditSheet = isAdmin || isManager || isResponsabile;
    const canSignSheet = isAdmin || isManager || isResponsabile;
    const canAddWorkers = isAdmin || isManager || isResponsabile;
    const canGenerateWorkerLink = isAdmin || isManager || isResponsabile || isWorker;
    
    // Campi specifici per ruolo
    const canEditCompanyName = isAdmin || isManager || isResponsabile;
    const canEditSheetDate = isAdmin || isManager || isResponsabile;
    const canEditManagerName = isAdmin || isManager || isResponsabile;
    const canEditAddress = isAdmin || isManager || isResponsabile;
    const canEditEstimatedHours = isAdmin || isManager || isResponsabile;
    
    // Activity: tutti possono modificare (incluso worker)
    const canEditActivityType = isAdmin || isManager || isResponsabile || isWorker;
    
    // Hours: worker può modificare solo le proprie
    const canEditHours = isAdmin || isManager || isResponsabile || isWorker;

    const canEditWorker = isAdmin || isManager || isResponsabile;
    const canDeleteWorker = isAdmin || isManager || isResponsabile;
    
    // 🔐 READ-ONLY per Datore (legacy, ora gestito da permessi)
    const isReadOnly = currentUser && currentUser.role === 'datore';

    // Se Worker, mostra messaggio e blocca rendering
    if (currentUser && currentUser.role === 'worker') {
        return React.createElement('div', { 
            className: `${cardClass} rounded-xl shadow-lg p-8 text-center`
        },
            React.createElement('div', { className: 'text-6xl mb-4' }, '🚫'),
            React.createElement('h2', { className: 'text-2xl font-bold mb-2 ' + (darkMode ? 'text-white' : 'text-gray-900') },
                'Accesso Negato'
            ),
            React.createElement('p', { className: textClass },
                'I lavoratori possono visualizzare i propri fogli dalla lista.'
            )
        );
    }

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

    // Calcola differenza tra orario effettivo e orario stimato (ritardo o anticipo)
    const calculateTimeDifference = (actualTime, estimatedTime) => {
        if (!actualTime || !estimatedTime) return null;
        
        try {
            const [actualHours, actualMinutes] = actualTime.split(':').map(Number);
            const [estimatedHours, estimatedMinutes] = estimatedTime.split(':').map(Number);
            
            if (isNaN(actualHours) || isNaN(actualMinutes) || isNaN(estimatedHours) || isNaN(estimatedMinutes)) {
                return null;
            }
            
            const actualTotalMinutes = actualHours * 60 + actualMinutes;
            const estimatedTotalMinutes = estimatedHours * 60 + estimatedMinutes;
            const diffMinutes = actualTotalMinutes - estimatedTotalMinutes;
            
            const hours = Math.floor(Math.abs(diffMinutes) / 60);
            const minutes = Math.abs(diffMinutes) % 60;
            
            return {
                diffMinutes,
                hours,
                minutes,
                isLate: diffMinutes > 0,  // true = ritardo (arrivato dopo), false = anticipo
                formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
            };
        } catch (error) {
            console.error('Errore calcolo differenza orari:', error);
            return null;
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

        // Initialize SignaturePad for Add Worker form
        React.useEffect(() => {
            if (showOptionalFieldsAdd && addWorkerCanvasRef.current && !addWorkerSignaturePad) {
                const canvas = addWorkerCanvasRef.current;
                initCanvas(canvas);
                canvas.clearCanvas = () => clearCanvas(canvas);
                canvas.isCanvasBlank = () => isCanvasBlank(canvas);
                setAddWorkerSignaturePad(canvas); // Store canvas reference
            }
        }, [showOptionalFieldsAdd, addWorkerSignaturePad]);

    // Close dropdowns when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (showActivityDropdown && !event.target.closest('.activity-dropdown-container')) {
                setShowActivityDropdown(false);
            }
            if (showCompanyDropdown && !event.target.closest('.company-dropdown-container')) {
                setShowCompanyDropdown(false);
            }
            if (showSupervisorDropdown && !event.target.closest('.supervisor-dropdown-container')) {
                setShowSupervisorDropdown(false);
            }
            if (showAddressDropdown && !event.target.closest('.address-dropdown-container')) {
                setShowAddressDropdown(false);
            }
        };

        if (showActivityDropdown || showCompanyDropdown || showSupervisorDropdown || showAddressDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showActivityDropdown, showCompanyDropdown, showSupervisorDropdown, showAddressDropdown]);

    // --- Static Weather Fetch Logic ---
    // Copied/adapted from WeatherWidget.js for static weather snapshot
    async function geocodeIt(name) {
        const q = ('' + (name || '')).trim();
        if (!q) return null;
        
        // 🔧 FIX: Se la località contiene virgola (es. "Roma, Lazio"), prova prima il nome completo
        // poi solo la prima parte (città)
        const queries = [q];
        if (q.includes(',')) {
            const cityOnly = q.split(',')[0].trim();
            if (cityOnly) queries.push(cityOnly);
        }
        
        for (const query of queries) {
            try {
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=it`);
                if (!res.ok) continue;
                const j = await res.json();
                if (j && j.results && j.results.length) {
                    return j.results[0];
                }
            } catch (e) {
                console.warn(`⚠️ Geocoding fallito per "${query}":`, e);
            }
        }
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
        console.log('💾 DEBUG SAVE - Starting saveSheet...');
        console.log('💾 DEBUG SAVE - currentSheet:', currentSheet);
        console.log('💾 DEBUG SAVE - currentSheet.companies:', currentSheet.companies);
        console.log('💾 DEBUG SAVE - currentSheet.addresses:', currentSheet.addresses);
        console.log('💾 DEBUG SAVE - canEditSheet:', canEditSheet);
        console.log('💾 DEBUG SAVE - isReadOnly:', isReadOnly);
        
        // ✅ Validazione campi obbligatori (companies e supervisors)
        if (!currentSheet.companies || currentSheet.companies.length === 0) {
            alert('❌ Seleziona almeno un\'azienda');
            showToastLocal('❌ Seleziona almeno un\'azienda', 'error');
            return;
        }
        
        if (!currentSheet.supervisors || currentSheet.supervisors.length === 0) {
            alert('❌ Seleziona almeno un responsabile');
            showToastLocal('❌ Seleziona almeno un responsabile', 'error');
            return;
        }

        setLoading(true);
        try {
            // --- Auto-save indirizzo in recentAddresses ---
            if (currentSheet.indirizzoEvento && currentSheet.indirizzoEvento.trim()) {
                await window.saveRecentAddress(db, currentSheet.indirizzoEvento);
            }
            
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
            // Save static weather snapshot in sheet + current weatherData if available
            const sheetToSave = { 
                ...currentSheet, 
                weatherStatic,
                // Salva anche weatherData corrente (temperature, condition, icon) per ricordo
                weatherData: currentSheet.weatherData || null
            };
            console.log('💾 DEBUG SAVE - sheetToSave.companies:', sheetToSave.companies);
            console.log('💾 DEBUG SAVE - sheetToSave.addresses:', sheetToSave.addresses);
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

    // Funzione per condividere l'indirizzo
    const shareAddress = async () => {
        const address = currentSheet.indirizzoEvento;
        if (!address) return;

        // Web Share API (mobile + alcuni browser desktop moderni)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: currentSheet.titoloAzienda || t.locationAddress,
                    text: `📍 ${address}`,
                    url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
                });
            } catch (error) {
                // User cancelled or error - fallback to clipboard
                if (error.name !== 'AbortError') {
                    copyAddressToClipboard(address);
                }
            }
        } else {
            // Fallback: copia negli appunti
            copyAddressToClipboard(address);
        }
    };

    // Helper per copiare l'indirizzo negli appunti
    const copyAddressToClipboard = async (address) => {
        try {
            await navigator.clipboard.writeText(address);
            showToastLocal(`✅ ${t.addressCopied}`, 'success');
        } catch (error) {
            // Fallback per browser vecchi
            const textArea = document.createElement('textarea');
            textArea.value = address;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToastLocal(`✅ ${t.addressCopied}`, 'success');
            } catch (err) {
                showToastLocal(`❌ ${t.errorCopying || 'Errore copia'}`, 'error');
            }
            document.body.removeChild(textArea);
        }
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
        
        // Get signature if available
        let firmaData = '';
        if (addWorkerSignaturePad && typeof addWorkerSignaturePad.isCanvasBlank === 'function' && !addWorkerSignaturePad.isCanvasBlank()) {
            firmaData = addWorkerSignaturePad.toDataURL();
        }
        
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
            telefono: newWorker.telefono || '',
            email: newWorker.email || '',
            indirizzo: newWorker.indirizzo || '',
            dataNascita: newWorker.dataNascita || '',
            firma: firmaData,
            ritardoIngressoAutorizzato: false,
            noteRitardoIngresso: '',
            uscitaAnticipoAutorizzata: false,
            noteUscitaAnticipo: ''
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
                telefono: '',
                email: '',
                indirizzo: '',
                dataNascita: '',
                firma: ''
            });
            
            // Clear signature pad
            if (addWorkerSignaturePad && typeof addWorkerSignaturePad.clearCanvas === 'function') {
                addWorkerSignaturePad.clearCanvas();
            }
            setAddWorkerSignaturePad(null);
            setShowOptionalFieldsAdd(false);

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
                // Use new values if provided, otherwise keep existing
                const newOraIn = bulkEditData.oraIn || w.oraIn;
                const newOraOut = bulkEditData.oraOut || w.oraOut;
                const newPausa = bulkEditData.pausaMinuti !== '' ? bulkEditData.pausaMinuti : w.pausaMinuti;
                
                const newOre = calculateHours(newOraIn, newOraOut, newPausa);
                return { 
                    ...w, 
                    oraIn: newOraIn,
                    oraOut: newOraOut,
                    pausaMinuti: newPausa, 
                    oreTotali: newOre 
                };
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
            setBulkEditData({ pausaMinuti: '', oraIn: '', oraOut: '' }); // Reset form
            
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
        // Validazione campi obbligatori
        if (!currentSheet.companies || currentSheet.companies.length === 0) {
            alert('❌ Seleziona almeno un\'azienda');
            showToastLocal('❌ Seleziona almeno un\'azienda', 'error');
            return;
        }
        
        if (!currentSheet.supervisors || currentSheet.supervisors.length === 0) {
            alert('❌ Seleziona almeno un responsabile');
            showToastLocal('❌ Seleziona almeno un responsabile', 'error');
            return;
        }
        
        if (!currentSheet.firmaResponsabile) {
            alert(`❌ ${t.signatureMissing || 'Firma del responsabile mancante'}`);
            showToastLocal(`❌ ${t.signatureMissing}`, 'error');
            return;
        }
        if (!currentSheet.lavoratori || currentSheet.lavoratori.length === 0) {
            alert(`❌ ${t.noWorkers || 'Nessun lavoratore presente'}`);
            showToastLocal(`❌ ${t.noWorkers}`, 'error');
            return;
        }
        
        setLoading(true);
        try {
            // --- Auto-save indirizzo in recentAddresses ---
            if (currentSheet.indirizzoEvento && currentSheet.indirizzoEvento.trim()) {
                await window.saveRecentAddress(db, currentSheet.indirizzoEvento);
            }
            
            await onComplete(currentSheet);
            
            // Genera PDF usando window.exportToPDF
            if (typeof window.exportToPDF === 'function') {
                await window.exportToPDF(currentSheet, sheetCompanyLogo);
            } else {
                console.error('❌ exportToPDF function not available');
            }
            
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

    const generatePartialPDF = async () => {
        if (selectedWorkers.length === 0) {
            showToastLocal(`❌ ${t.selectWorkersForPDF || 'Seleziona almeno un lavoratore per il PDF'}`, 'error');
            return;
        }

        setLoading(true);
        try {
            // Create a temporary sheet with only selected workers
            const selectedWorkersData = currentSheet.lavoratori.filter(w => selectedWorkers.includes(w.id));
            const partialSheet = {
                ...currentSheet,
                lavoratori: selectedWorkersData
            };

            // Generate PDF with custom filename
            const filenamePrefix = t.pdfFilenamePrefix || 'foglio_presenze';
            const customFilename = `${filenamePrefix}_PARZIALE_${partialSheet.titoloAzienda || 'N_D'}_${partialSheet.data}.pdf`.replace(/\s+/g, '_');
            
            if (typeof window.exportToPDF === 'function') {
                await window.exportToPDF(partialSheet, sheetCompanyLogo, customFilename);
            } else {
                throw new Error('exportToPDF function not available');
            }
            
            if (addAuditLog) {
                await addAuditLog('PDF_PARTIAL', `PDF parziale con ${selectedWorkers.length} lavoratori`);
            }
            
            // Exit partial PDF mode
            setPartialPDFMode(false);
            setSelectedWorkers([]);
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
                {isReadOnly && (
                    <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg flex items-center gap-2">
                        <span className="text-2xl">🔒</span>
                        <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                            Modalità Sola Lettura - Visualizzazione dati senza possibilità di modifica
                        </span>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                    {/* 🏢 CAMPO AZIENDA (multi-select compatto) */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            🏢 {t.company || 'Azienda'} <span className="text-red-500">*</span>
                        </label>
                        
                        {canEditCompanyName ? (
                            <div className="relative company-dropdown-container">
                                <button
                                    type="button"
                                    onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                                    disabled={isReadOnly}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {currentSheet.companies && currentSheet.companies.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {currentSheet.companies.map(companyId => {
                                                const company = companies?.find(c => c.id === companyId);
                                                if (!company) return null;
                                                const displayName = company.name || company.nome;
                                                const displayColor = company.color || company.colore;
                                                return (
                                                    <span
                                                        key={companyId}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-white text-xs"
                                                        style={{ backgroundColor: displayColor }}
                                                    >
                                                        {displayName}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const updated = (currentSheet.companies || []).filter(id => id !== companyId);
                                                                setCurrentSheet({...currentSheet, companies: updated});
                                                            }}
                                                            className="hover:bg-black/20 rounded-full w-3 h-3 flex items-center justify-center text-xs"
                                                            disabled={isReadOnly}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">{t.selectCompanies || 'Seleziona aziende...'}</span>
                                    )}
                                </button>
                                {showCompanyDropdown && (
                                    <div className={`absolute z-50 w-full mt-1 ${cardClass} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} rounded-lg shadow-lg max-h-48 overflow-y-auto`}>
                                        {companies && companies.length > 0 ? (
                                            companies.map(company => {
                                                const isSelected = (currentSheet.companies || []).includes(company.id);
                                                const displayName = company.name || company.nome;
                                                const displayColor = company.color || company.colore;
                                                return (
                                                    <label
                                                        key={company.id}
                                                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                                                        style={{ borderLeft: `3px solid ${displayColor}` }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                const current = currentSheet.companies || [];
                                                                const updated = e.target.checked
                                                                    ? [...current, company.id]
                                                                    : current.filter(id => id !== company.id);
                                                                setCurrentSheet({...currentSheet, companies: updated});
                                                            }}
                                                            className="w-3 h-3"
                                                        />
                                                        <span className="flex-1">{displayName}</span>
                                                    </label>
                                                );
                                            })
                                        ) : (
                                            <div className="px-3 py-2 text-gray-500 text-xs">
                                                {t.noCompaniesConfigured || 'Nessuna azienda configurata'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={`px-3 py-2 rounded-lg border ${inputClass} bg-gray-100 text-sm`}>
                                <span className="text-gray-600">
                                    {currentSheet.companies?.map(cId => {
                                        const c = companies?.find(comp => comp.id === cId);
                                        return c ? (c.name || c.nome) : null;
                                    }).filter(Boolean).join(', ') || t.company}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {/* 📅 CAMPO DATA */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            📅 {t.date || 'Data'} <span className="text-red-500">*</span>
                        </label>
                        {canEditSheetDate ? (
                            <input
                                type="date"
                                value={currentSheet.data}
                                onChange={(e) => setCurrentSheet({...currentSheet, data: e.target.value})}
                                className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 text-sm`}
                            />
                        ) : (
                            <div className={`px-3 py-2 rounded-lg border ${inputClass} bg-gray-100 text-sm`}>
                                <span className="text-gray-600">{currentSheet.data || t.date}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* 👔 CAMPO RESPONSABILE (multi-select compatto) */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            👔 {t.responsible || 'Responsabile'} <span className="text-red-500">*</span>
                        </label>
                        
                        {canEditManagerName ? (
                            <div className="relative supervisor-dropdown-container">
                                <button
                                    type="button"
                                    onClick={() => setShowSupervisorDropdown(!showSupervisorDropdown)}
                                    className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 text-left text-sm`}
                                >
                                    {currentSheet.supervisors && currentSheet.supervisors.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {currentSheet.supervisors.map(userId => {
                                                const user = users.find(u => u.id === userId);
                                                if (!user) return null;
                                                return (
                                                    <span
                                                        key={userId}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 text-white text-xs"
                                                    >
                                                        {user.firstName} {user.lastName}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const updated = (currentSheet.supervisors || []).filter(id => id !== userId);
                                                                setCurrentSheet({...currentSheet, supervisors: updated});
                                                            }}
                                                            className="hover:bg-black/20 rounded-full w-3 h-3 flex items-center justify-center text-xs"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">{t.selectSupervisors || 'Seleziona responsabili...'}</span>
                                    )}
                                </button>
                                {showSupervisorDropdown && (
                                    <div className={`absolute z-50 w-full mt-1 ${cardClass} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col`}>
                                        {/* Search Bar */}
                                        <div className="p-2 border-b" style={{ borderColor: darkMode ? '#374151' : '#E5E7EB' }}>
                                            <input
                                                type="text"
                                                placeholder={t.searchPlaceholder || "🔍 Cerca nome, cognome, email..."}
                                                value={searchSupervisor}
                                                onChange={(e) => setSearchSupervisor(e.target.value)}
                                                className={`w-full px-2 py-1.5 rounded border ${inputClass} focus:ring-2 focus:ring-indigo-500 text-xs`}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        
                                        {/* Users List */}
                                        <div className="overflow-y-auto max-h-48">
                                            {users && users.length > 0 ? (
                                                users
                                                    .filter(user => !user.blocked) // ⚠️ ESCLUDI BLACKLIST
                                                    .filter(user => !user.suspended) // ⚠️ ESCLUDI SOSPESI
                                                    .filter(user => ['admin', 'manager', 'responsabile'].includes(user.role)) // ✅ SOLO RUOLI SUPERVISORI
                                                    .filter(user => {
                                                        if (!searchSupervisor.trim()) return true;
                                                        const search = searchSupervisor.toLowerCase();
                                                        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
                                                        const email = (user.email || '').toLowerCase();
                                                        return fullName.includes(search) || email.includes(search);
                                                    })
                                                    .map(user => {
                                                        const isSelected = (currentSheet.supervisors || []).includes(user.id);
                                                        return (
                                                            <label
                                                                key={user.id}
                                                                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={(e) => {
                                                                        const current = currentSheet.supervisors || [];
                                                                        const updated = e.target.checked
                                                                            ? [...current, user.id]
                                                                            : current.filter(id => id !== user.id);
                                                                        setCurrentSheet({...currentSheet, supervisors: updated});
                                                                    }}
                                                                    className="w-3 h-3"
                                                                />
                                                                <span className="flex-1">{user.firstName} {user.lastName}</span>
                                                                <span className="text-xs text-gray-500">{user.role}</span>
                                                            </label>
                                                        );
                                                    })
                                            ) : (
                                                <div className="px-3 py-2 text-gray-500 text-xs">
                                                    {t.noUsersFound || 'Nessun utente trovato'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={`px-3 py-2 rounded-lg border ${inputClass} bg-gray-100 text-sm`}>
                                <span className="text-gray-600">
                                    {currentSheet.supervisors?.map(userId => {
                                        const u = users.find(user => user.id === userId);
                                        return u ? `${u.firstName} ${u.lastName}` : null;
                                    }).filter(Boolean).join(', ') || t.responsible}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {/* 📍 CAMPO INDIRIZZO (sistema ibrido: autocomplete intelligente filtrato) */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            📍 {t.locationAddress || 'Indirizzo Evento/Magazzino'}
                        </label>
                        
                        {canEditAddress ? (
                            <div className="space-y-2 relative">
                                {/* Input con autocomplete filtrato in tempo reale */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={currentSheet.indirizzoEvento || ''}
                                        onChange={(e) => {
                                            setCurrentSheet({...currentSheet, indirizzoEvento: e.target.value});
                                            setAddressInputFocused(true); // Mostra dropdown quando si scrive
                                        }}
                                        onFocus={() => setAddressInputFocused(true)}
                                        onBlur={() => setTimeout(() => setAddressInputFocused(false), 200)} // Delay per permettere click
                                        placeholder="Via Roma 123, Milano oppure seleziona..."
                                        className={`w-full px-3 py-2 pr-24 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 text-sm`}
                                    />
                                    
                                    {/* Pulsanti condividi e maps */}
                                    {currentSheet.indirizzoEvento && currentSheet.indirizzoEvento.trim() && (
                                        <div className="absolute right-1 top-1 flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const text = `📍 ${t.address || 'Indirizzo'}: ${currentSheet.indirizzoEvento}`;
                                                    if (navigator.share) {
                                                        navigator.share({ text });
                                                    } else {
                                                        navigator.clipboard.writeText(text);
                                                        alert(t.addressCopied || '📋 Indirizzo copiato negli appunti!');
                                                    }
                                                }}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
                                                title={t.shareAddress || 'Condividi indirizzo'}
                                            >
                                                🔗
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentSheet.indirizzoEvento)}`;
                                                    window.open(mapsUrl, '_blank');
                                                }}
                                                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition-colors"
                                                title={t.openInMaps || 'Apri in Google Maps'}
                                            >
                                                🗺️
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {/* 🔽 DROPDOWN AUTOCOMPLETE INTELLIGENTE (solo se focused O se sta scrivendo) */}
                                {addressInputFocused && (() => {
                                    const query = (currentSheet.indirizzoEvento || '').toLowerCase().trim();
                                    
                                    // Combina indirizzi fissi + recenti
                                    const fixedAddresses = (appSettings.addresses || []).map(addr => {
                                        const street = addr.street || addr.indirizzo || '';
                                        const city = addr.city || addr.citta || '';
                                        const zip = addr.zipCode || addr.cap || '';
                                        const fullAddress = `${street}, ${zip} ${city}`.trim();
                                        return {
                                            id: `fixed-${addr.id}`,
                                            display: `${addr.emoji || '📍'} ${addr.name || addr.nome}`,
                                            value: fullAddress,
                                            type: 'fixed',
                                            priority: 100 // Priorità alta
                                        };
                                    });
                                    
                                    const recentList = (recentAddresses || []).map(rec => ({
                                        id: `recent-${rec.id}`,
                                        display: `🕒 ${rec.address}`,
                                        value: rec.address,
                                        type: 'recent',
                                        usedCount: rec.usedCount || 0,
                                        priority: rec.usedCount || 0 // Priorità in base a utilizzo
                                    }));
                                    
                                    // Filtra in base alla query (se lunghezza >= 2)
                                    let filtered = [...fixedAddresses, ...recentList];
                                    if (query.length >= 2) {
                                        filtered = filtered.filter(item => 
                                            item.value.toLowerCase().includes(query) || 
                                            item.display.toLowerCase().includes(query)
                                        );
                                    }
                                    
                                    // Ordina per priorità (fissi prima, poi recenti più usati)
                                    filtered.sort((a, b) => {
                                        if (a.type === 'fixed' && b.type !== 'fixed') return -1;
                                        if (a.type !== 'fixed' && b.type === 'fixed') return 1;
                                        return b.priority - a.priority;
                                    });
                                    
                                    // Limita a 8 risultati max
                                    filtered = filtered.slice(0, 8);
                                    
                                    return filtered.length > 0 ? (
                                        <div className={`absolute z-50 w-full mt-1 rounded-lg shadow-lg border max-h-64 overflow-y-auto ${
                                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                                        }`}>
                                            {filtered.map(item => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setCurrentSheet({...currentSheet, indirizzoEvento: item.value});
                                                        setAddressInputFocused(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 hover:bg-indigo-600 hover:text-white transition-colors ${
                                                        darkMode ? 'text-gray-200' : 'text-gray-800'
                                                    }`}
                                                >
                                                    <div className="text-sm font-medium">{item.display}</div>
                                                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {item.value}
                                                        {item.type === 'recent' && item.usedCount > 0 && (
                                                            <span className="ml-2 text-xs opacity-75">
                                                                ({item.usedCount}x)
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : null;
                                })()}
                                
                                {/* Pulsanti rapidi (solo se input vuoto o < 3 caratteri) */}
                                {(!currentSheet.indirizzoEvento || currentSheet.indirizzoEvento.length < 3) && (
                                    <div className="flex flex-wrap gap-1">
                                        {appSettings.addresses && appSettings.addresses.slice(0, 3).map(address => {
                                            const street = address.street || address.indirizzo || '';
                                            const city = address.city || address.citta || '';
                                            const zip = address.zipCode || address.cap || '';
                                            const fullAddress = `${street}, ${zip} ${city}`.trim();
                                            return (
                                                <button
                                                    key={address.id}
                                                    type="button"
                                                    onClick={() => setCurrentSheet({...currentSheet, indirizzoEvento: fullAddress})}
                                                    className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                                                >
                                                    {address.emoji} {address.name || address.nome}
                                                </button>
                                            );
                                        })}
                                        {recentAddresses && recentAddresses.slice(0, 2).map(recent => (
                                            <button
                                                key={recent.id}
                                                type="button"
                                                onClick={() => setCurrentSheet({...currentSheet, indirizzoEvento: recent.address})}
                                                className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                                            >
                                                🕒 {recent.address.length > 30 ? recent.address.substring(0, 30) + '...' : recent.address}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={`px-4 py-3 rounded-lg border ${inputClass} bg-gray-100 flex items-center justify-between`}>
                                <span className="text-gray-600">
                                    {currentSheet.indirizzoEvento || t.locationAddress || 'Indirizzo'}
                                </span>
                                {currentSheet.indirizzoEvento && (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentSheet.indirizzoEvento)}`;
                                                window.open(mapsUrl, '_blank');
                                            }}
                                            className="text-green-600 hover:text-green-700 text-sm"
                                        >
                                            🗺️
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* 🏷️ NUOVO CAMPO: Tipo Attività (opzionale, multi-select) */}
                    <div className="col-span-1 sm:col-span-2">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {t.activityType || 'Tipo Attività'} <span className="text-gray-400 text-xs">(opzionale)</span>
                        </label>
                        
                        {/* Selected activities badges */}
                        {currentSheet.tipoAttivita && currentSheet.tipoAttivita.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {currentSheet.tipoAttivita.map(activityId => {
                                    const activity = appSettings.tipiAttivita?.find(a => a.id === activityId);
                                    if (!activity) return null;
                                    return (
                                        <span
                                            key={activityId}
                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium"
                                            style={{ backgroundColor: activity.colore }}
                                        >
                                            <span>{activity.emoji}</span>
                                            <span>{activity.nome}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = (currentSheet.tipoAttivita || []).filter(id => id !== activityId);
                                                    setCurrentSheet({...currentSheet, tipoAttivita: updated});
                                                }}
                                                className="ml-1 hover:bg-black/20 rounded-full w-4 h-4 flex items-center justify-center"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Dropdown selector */}
                        <div className="relative activity-dropdown-container">
                            <button
                                type="button"
                                onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                                className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 text-left flex items-center justify-between`}
                            >
                                <span className="text-gray-400">{t.selectActivities || 'Seleziona attività...'}</span>
                                <span className="text-gray-400">▼</span>
                            </button>
                            {showActivityDropdown && (
                                <div className={`absolute z-50 w-full mt-1 ${cardClass} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} rounded-lg shadow-lg max-h-60 overflow-y-auto`}>
                                    {appSettings.tipiAttivita && appSettings.tipiAttivita.length > 0 ? (
                                        appSettings.tipiAttivita.map(activity => {
                                            const isSelected = (currentSheet.tipoAttivita || []).includes(activity.id);
                                            return (
                                                <label
                                                    key={activity.id}
                                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            const current = currentSheet.tipoAttivita || [];
                                                            const updated = e.target.checked
                                                                ? [...current, activity.id]
                                                                : current.filter(id => id !== activity.id);
                                                            setCurrentSheet({...currentSheet, tipoAttivita: updated});
                                                        }}
                                                        className="w-4 h-4"
                                                    />
                                                    <span style={{ color: activity.colore }}>{activity.emoji}</span>
                                                    <span className="flex-1">{activity.nome}</span>
                                                </label>
                                            );
                                        })
                                    ) : (
                                        <div className="px-4 py-3 text-gray-500 text-sm">
                                            {t.noActivitiesConfigured || 'Nessuna attività configurata'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* ⏰ NUOVO CAMPO: Orari Stimati (opzionali) */}
                    <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-3">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {t.estimatedFrom || 'Dalle (stimate)'} <span className="text-gray-400 text-xs">(opzionale)</span>
                            </label>
                            <input
                                type="time"
                                value={currentSheet.orarioStimatoDa || ''}
                                onChange={(e) => setCurrentSheet({...currentSheet, orarioStimatoDa: e.target.value})}
                                className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 ${!canEditEstimatedHours ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800' : ''}`}
                                disabled={!canEditEstimatedHours}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {t.estimatedTo || 'Alle (stimate)'} <span className="text-gray-400 text-xs">(opzionale)</span>
                            </label>
                            <input
                                type="time"
                                value={currentSheet.orarioStimatoA || ''}
                                onChange={(e) => setCurrentSheet({...currentSheet, orarioStimatoA: e.target.value})}
                                className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 ${!canEditEstimatedHours ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800' : ''}`}
                                disabled={!canEditEstimatedHours}
                            />
                        </div>
                    </div>
                </div>

                {/* 🌤️ Widget Meteo Full-Width Unificato */}
                <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        🌤️ {t.location || 'Località'}
                    </label>
                    <WeatherWidget 
                        location={currentSheet.localita || currentSheet.location || 'Roma'} 
                        darkMode={darkMode}
                        showControls={true}
                        onWeatherChange={async (weatherKey, weatherData) => {
                            // Salva i dati meteo correnti nel foglio
                            if (weatherData) {
                                setCurrentSheet(prev => ({ 
                                    ...prev,
                                    localita: weatherData.location,
                                    location: weatherData.location,
                                    weatherData: {
                                        temp: weatherData.temp,
                                        condition: weatherData.condition,
                                        icon: weatherKey,
                                        location: weatherData.location,
                                        timestamp: new Date().toISOString()
                                    }
                                }));
                                
                                // 🌤️ AUTO-CARICA DATI STORICI COMPLETI quando clicchi "Aggiorna"
                                const dateStr = currentSheet.data || currentSheet.date;
                                if (weatherData.location && dateStr) {
                                    try {
                                        const geo = await geocodeIt(weatherData.location);
                                        if (geo && geo.latitude && geo.longitude) {
                                            const weatherStatic = await fetchWeather(geo.latitude, geo.longitude, dateStr);
                                            if (weatherStatic) {
                                                setCurrentSheet(prev => ({
                                                    ...prev,
                                                    weatherStatic
                                                }));
                                                showToastLocal(`✅ ${weatherStatic.temp_max}°C/${weatherStatic.temp_min}°C • ${weatherStatic.precipitation}mm`, 'success');
                                            }
                                        }
                                    } catch (error) {
                                        console.error('⚠️ Errore caricamento dati storici:', error);
                                    }
                                }
                            }
                        }}
                    />
                </div>

                <textarea
                    placeholder={t.notes}
                    value={currentSheet.note || ''}
                    onChange={(e) => setCurrentSheet({...currentSheet, note: e.target.value})}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 mb-4`}
                    rows="3"
                />

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
                    {!isReadOnly && canEditSheet && (
                        <button
                            onClick={saveSheet}
                            disabled={loading}
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors disabled:bg-gray-400 text-sm sm:text-base"
                        >
                            {loading ? `⏳ ${t.loading}...` : `💾 ${t.saveSheet}`}
                        </button>
                    )}
                    
                    {/* 🐛 FIX BUG #1: Nuovo handler per genera link */}
                    {canGenerateWorkerLink && (
                        <button
                            onClick={handleGenerateLink}
                            disabled={loading}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:bg-gray-400 text-sm sm:text-base"
                        >
                            {loading ? `⏳ ${t.loading}...` : `🔗 ${t.generateLink}`}
                        </button>
                    )}
                </div>

                {/* Link visibile con indicatore scadenza */}
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className={`text-xs ${textClass} mb-2 font-semibold flex items-center gap-2 flex-wrap`}>
                        🔗 {t.shareLink || 'Link condivisione'}:
                        {currentSheet.linkGeneratedAt && (
                            <>
                                <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">
                                    ✅ {t.linkActiveFrom || 'Attivo da'} {new Date(currentSheet.linkGeneratedAt).toLocaleString('it-IT')}
                                </span>
                                <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs">
                                    ⏰ {t.linkValidUntil || 'Valido fino a'} {new Date(new Date(currentSheet.linkGeneratedAt).getTime() + (appSettings.expirationDays || 1) * 24 * 60 * 60 * 1000).toLocaleString('it-IT')}
                                </span>
                            </>
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
                            onClick={async () => {
                                const baseUrl = window.location.origin + window.location.pathname;
                                const link = `${baseUrl}?mode=worker&sheet=${currentSheet.id}`;
                                try {
                                    await navigator.clipboard.writeText(link);
                                    showToastLocal(`✅ ${t.linkCopied || 'Link copiato negli appunti!'}`, 'success');
                                } catch (err) {
                                    console.error('Errore copia link:', err);
                                    showToastLocal(`❌ ${t.errorCopyingLink || 'Errore durante la copia'}`, 'error');
                                }
                            }}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold transition-colors"
                            title={t.copyLink || 'Copia link'}
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
                        {canAddWorkers && (
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
                        )}
                        
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
                        
                        {/* Campi obbligatori */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
                                placeholder={`${t.breakMinutes} *`}
                                value={newWorker.pausa}
                                onChange={(e) => setNewWorker({...newWorker, pausa: e.target.value})}
                                className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                            />
                        </div>
                        
                        {/* Bottone campi opzionali */}
                        <button
                            type="button"
                            onClick={() => setShowOptionalFieldsAdd(!showOptionalFieldsAdd)}
                            className={`w-full mb-3 px-4 py-2 rounded-lg font-medium text-sm ${
                                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                        >
                            {showOptionalFieldsAdd ? '▼' : '▶'} {t.optionalFields || 'Campi opzionali'}
                        </button>
                        
                        {/* Campi opzionali */}
                        {showOptionalFieldsAdd && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <input
                                    type="text"
                                    placeholder={t.fiscalCode}
                                    value={newWorker.codiceFiscale}
                                    onChange={(e) => setNewWorker({...newWorker, codiceFiscale: e.target.value})}
                                    className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                                />
                                <input
                                    type="text"
                                    placeholder={t.idNumber}
                                    value={newWorker.numeroIdentita}
                                    onChange={(e) => setNewWorker({...newWorker, numeroIdentita: e.target.value})}
                                    className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                                />
                                <input
                                    type="tel"
                                    placeholder={t.phone || 'Telefono'}
                                    value={newWorker.telefono}
                                    onChange={(e) => setNewWorker({...newWorker, telefono: e.target.value})}
                                    className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                                />
                                <input
                                    type="email"
                                    placeholder={t.email || 'Email'}
                                    value={newWorker.email}
                                    onChange={(e) => setNewWorker({...newWorker, email: e.target.value})}
                                    className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                                />
                                <input
                                    type="text"
                                    placeholder={t.address || 'Indirizzo'}
                                    value={newWorker.indirizzo}
                                    onChange={(e) => setNewWorker({...newWorker, indirizzo: e.target.value})}
                                    className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                                />
                                <input
                                    type="date"
                                    placeholder={t.birthDate || 'Data di nascita'}
                                    value={newWorker.dataNascita}
                                    onChange={(e) => setNewWorker({...newWorker, dataNascita: e.target.value})}
                                    className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-green-500`}
                                />
                            </div>
                        )}
                        
                        {/* Firma */}
                        {showOptionalFieldsAdd && (
                            <div className="mb-3">
                                <label className={`block mb-2 font-medium text-sm ${textClass}`}>
                                    ✍️ {t.signature || 'Firma'}
                                </label>
                                <canvas
                                    ref={addWorkerCanvasRef}
                                    className="w-full border-2 border-gray-400 rounded-lg bg-white"
                                    style={{ touchAction: 'none', height: '150px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (addWorkerSignaturePad && typeof addWorkerSignaturePad.clearCanvas === 'function') {
                                            addWorkerSignaturePad.clearCanvas();
                                        }
                                    }}
                                    className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                                >
                                    🗑️ {t.clearSignature || 'Cancella firma'}
                                </button>
                            </div>
                        )}
                        
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={addWorker}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:bg-gray-400"
                            >
                                {loading ? `⏳ ${t.loading}...` : `✓ ${t.addWorker}`}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddWorkerForm(false);
                                    setShowOptionalFieldsAdd(false);
                                    if (addWorkerSignaturePad && typeof addWorkerSignaturePad.clearCanvas === 'function') {
                                        addWorkerSignaturePad.clearCanvas();
                                    }
                                    setAddWorkerSignaturePad(null);
                                }}
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
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                            <input
                                type="time"
                                placeholder={t.timeIn}
                                value={bulkEditData.oraIn}
                                onChange={(e) => setBulkEditData({...bulkEditData, oraIn: e.target.value})}
                                className={`px-4 py-2 rounded-lg border ${inputClass}`}
                            />
                            <input
                                type="time"
                                placeholder={t.timeOut}
                                value={bulkEditData.oraOut}
                                onChange={(e) => setBulkEditData({...bulkEditData, oraOut: e.target.value})}
                                className={`px-4 py-2 rounded-lg border ${inputClass}`}
                            />
                            <input
                                type="number"
                                placeholder={t.breakMinutes}
                                value={bulkEditData.pausaMinuti}
                                onChange={(e) => setBulkEditData({...bulkEditData, pausaMinuti: e.target.value})}
                                className={`px-4 py-2 rounded-lg border ${inputClass}`}
                            />
                        </div>
                        <button
                            onClick={bulkUpdateWorkers}
                            disabled={selectedWorkers.length === 0}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold disabled:bg-gray-400 text-sm sm:text-base"
                        >
                            {t.updateAll}
                        </button>
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
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm ${!canEditHours ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800' : ''}`}
                                                    disabled={!canEditHours}
                                                />
                                                <input
                                                    type="time"
                                                    value={editingWorker.oraOut}
                                                    onChange={(e) => setEditingWorker({...editingWorker, oraOut: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm ${!canEditHours ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800' : ''}`}
                                                    disabled={!canEditHours}
                                                />
                                                <input
                                                    type="number"
                                                    value={editingWorker.pausaMinuti}
                                                    onChange={(e) => setEditingWorker({...editingWorker, pausaMinuti: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm ${!canEditHours ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-800' : ''}`}
                                                    placeholder={t.break}
                                                    disabled={!canEditHours}
                                                />
                                                <input
                                                    type="text"
                                                    value={editingWorker.codiceFiscale || ''}
                                                    onChange={(e) => setEditingWorker({...editingWorker, codiceFiscale: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm`}
                                                    placeholder={t.fiscalCode}
                                                />
                                                <input
                                                    type="text"
                                                    value={editingWorker.numeroIdentita || ''}
                                                    onChange={(e) => setEditingWorker({...editingWorker, numeroIdentita: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm`}
                                                    placeholder={t.idNumber}
                                                />
                                                <input
                                                    type="tel"
                                                    value={editingWorker.telefono || ''}
                                                    onChange={(e) => setEditingWorker({...editingWorker, telefono: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm`}
                                                    placeholder={t.phone}
                                                />
                                                <input
                                                    type="email"
                                                    value={editingWorker.email || ''}
                                                    onChange={(e) => setEditingWorker({...editingWorker, email: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm`}
                                                    placeholder={t.email}
                                                />
                                                <input
                                                    type="text"
                                                    value={editingWorker.indirizzo || ''}
                                                    onChange={(e) => setEditingWorker({...editingWorker, indirizzo: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm`}
                                                    placeholder={t.address}
                                                />
                                                <input
                                                    type="date"
                                                    value={editingWorker.dataNascita || ''}
                                                    onChange={(e) => setEditingWorker({...editingWorker, dataNascita: e.target.value})}
                                                    className={`px-3 py-2 rounded border ${inputClass} text-sm`}
                                                    placeholder={t.birthDate}
                                                />
                                            </div>
                                            
                                            {/* Sezione Autorizzazioni Orari */}
                                            {(currentSheet.orarioStimatoDa || currentSheet.orarioStimatoA) && (
                                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                    <h4 className="text-sm font-semibold mb-3 text-blue-900 dark:text-blue-100">
                                                        🕐 {t.scheduleAuthorizations}
                                                    </h4>
                                                    
                                                    {/* Autorizzazione Ritardo Ingresso */}
                                                    <div className="mb-3">
                                                        <label className="flex items-center gap-2 mb-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={editingWorker.ritardoIngressoAutorizzato || false}
                                                                onChange={(e) => setEditingWorker({...editingWorker, ritardoIngressoAutorizzato: e.target.checked})}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                {t.authorizeDelay}
                                                            </span>
                                                        </label>
                                                        <textarea
                                                            value={editingWorker.noteRitardoIngresso || ''}
                                                            onChange={(e) => setEditingWorker({...editingWorker, noteRitardoIngresso: e.target.value})}
                                                            placeholder={t.delayNotes}
                                                            className={`w-full px-3 py-2 rounded border ${inputClass} text-sm`}
                                                            rows="2"
                                                        />
                                                    </div>
                                                    
                                                    {/* Autorizzazione Uscita Anticipata */}
                                                    <div>
                                                        <label className="flex items-center gap-2 mb-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={editingWorker.uscitaAnticipoAutorizzata || false}
                                                                onChange={(e) => setEditingWorker({...editingWorker, uscitaAnticipoAutorizzata: e.target.checked})}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                {t.authorizeEarlyExit}
                                                            </span>
                                                        </label>
                                                        <textarea
                                                            value={editingWorker.noteUscitaAnticipo || ''}
                                                            onChange={(e) => setEditingWorker({...editingWorker, noteUscitaAnticipo: e.target.value})}
                                                            placeholder={t.earlyExitNotes}
                                                            className={`w-full px-3 py-2 rounded border ${inputClass} text-sm`}
                                                            rows="2"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            
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
                                            {(bulkEditMode || partialPDFMode) && (
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
                                                
                                                {currentSheet.orarioStimatoDa && currentSheet.orarioStimatoA && (
                                                    (worker.oraIn !== currentSheet.orarioStimatoDa || worker.oraOut !== currentSheet.orarioStimatoA) && (
                                                        <div className="bg-yellow-600 text-white px-3 py-2 rounded-lg mb-2 text-xs sm:text-sm font-semibold">
                                                            ⚠️ {t.hoursMismatch}
                                                        </div>
                                                    )
                                                )}
                                                
                                                {/* Badge Ritardo Ingresso */}
                                                {(() => {
                                                    const delayDiff = calculateTimeDifference(worker.oraIn, currentSheet.orarioStimatoDa);
                                                    if (delayDiff && delayDiff.isLate && delayDiff.diffMinutes > 0) {
                                                        const isAuthorized = worker.ritardoIngressoAutorizzato;
                                                        return (
                                                            <div className={`px-3 py-2 rounded-lg mb-2 text-xs sm:text-sm font-semibold ${
                                                                isAuthorized 
                                                                    ? 'bg-green-600 text-white' 
                                                                    : 'bg-orange-600 text-white'
                                                            }`}>
                                                                {isAuthorized ? '✓' : '⚠️'} {isAuthorized ? t.authorizedLate : t.lateArrival}: {delayDiff.formatted}
                                                                {worker.noteRitardoIngresso && (
                                                                    <p className="text-xs mt-1 opacity-90">📝 {worker.noteRitardoIngresso}</p>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                                
                                                {/* Badge Uscita Anticipata */}
                                                {(() => {
                                                    const earlyDiff = calculateTimeDifference(worker.oraOut, currentSheet.orarioStimatoA);
                                                    if (earlyDiff && !earlyDiff.isLate && earlyDiff.diffMinutes < 0) {
                                                        const isAuthorized = worker.uscitaAnticipoAutorizzata;
                                                        return (
                                                            <div className={`px-3 py-2 rounded-lg mb-2 text-xs sm:text-sm font-semibold ${
                                                                isAuthorized 
                                                                    ? 'bg-green-600 text-white' 
                                                                    : 'bg-orange-600 text-white'
                                                            }`}>
                                                                {isAuthorized ? '✓' : '⚠️'} {isAuthorized ? t.authorizedExit : t.earlyExit}: {earlyDiff.formatted}
                                                                {worker.noteUscitaAnticipo && (
                                                                    <p className="text-xs mt-1 opacity-90">📝 {worker.noteUscitaAnticipo}</p>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                                
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
                                                
                                                {/* Toggle autorizzazioni inline */}
                                                {(currentSheet.orarioStimatoDa || currentSheet.orarioStimatoA) && (
                                                    (() => {
                                                        const delayDiff = calculateTimeDifference(worker.oraIn, currentSheet.orarioStimatoDa);
                                                        const earlyDiff = calculateTimeDifference(worker.oraOut, currentSheet.orarioStimatoA);
                                                        const hasDelay = delayDiff && delayDiff.isLate && delayDiff.diffMinutes > 0;
                                                        const hasEarlyExit = earlyDiff && !earlyDiff.isLate && earlyDiff.diffMinutes < 0;
                                                        
                                                        if (hasDelay || hasEarlyExit) {
                                                            return (
                                                                <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
                                                                    {hasDelay && (
                                                                        <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={worker.ritardoIngressoAutorizzato || false}
                                                                                onChange={async (e) => {
                                                                                    await updateWorker(worker.id, {
                                                                                        ...worker,
                                                                                        ritardoIngressoAutorizzato: e.target.checked
                                                                                    });
                                                                                }}
                                                                                className="w-4 h-4"
                                                                            />
                                                                            <span className="flex-1">{t.authorizeDelay}</span>
                                                                        </label>
                                                                    )}
                                                                    {hasEarlyExit && (
                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={worker.uscitaAnticipoAutorizzata || false}
                                                                                onChange={async (e) => {
                                                                                    await updateWorker(worker.id, {
                                                                                        ...worker,
                                                                                        uscitaAnticipoAutorizzata: e.target.checked
                                                                                    });
                                                                                }}
                                                                                className="w-4 h-4"
                                                                            />
                                                                            <span className="flex-1">{t.authorizeEarlyExit}</span>
                                                                        </label>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()
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
                        {canSignSheet && (
                            <button
                                onClick={deleteResponsabileSignature}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm sm:text-base disabled:bg-gray-400"
                            >
                                {loading ? `⏳ ${t.loading}...` : `🗑️ ${t.deleteSignature}`}
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        {canSignSheet ? (
                            <>
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
                            </>
                        ) : (
                            <p className="text-gray-500 italic">{t.noPermission || 'Non hai i permessi per aggiungere una firma'}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Complete Button */}
            <div className="flex flex-col gap-3">
                {partialPDFMode ? (
                    <>
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} text-center`}>
                            <p className={`text-sm font-semibold ${textClass}`}>
                                📄 {t.selectWorkersForPDF || 'Seleziona i lavoratori da includere nel PDF parziale'}
                            </p>
                            <p className={`text-xs ${textClass} mt-1`}>
                                {selectedWorkers.length} {t.selected || 'selezionati'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {window.hasRoleAccess(currentUser, 'sheets.generatePdf') && (
                                <button
                                    onClick={generatePartialPDF}
                                    disabled={loading || selectedWorkers.length === 0}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm sm:text-base transition-colors disabled:bg-gray-400 shadow-lg"
                                >
                                    {loading ? `⏳ ${t.loading}...` : `📄 ${t.generatePDF || 'Genera PDF'}`}
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setPartialPDFMode(false);
                                    setSelectedWorkers([]);
                                }}
                                className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold text-sm sm:text-base"
                            >
                                {t.cancel}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {window.hasRoleAccess(currentUser, 'sheets.generatePdf') && (
                            <button
                                onClick={completeSheet}
                                disabled={loading}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base sm:text-lg transition-colors disabled:bg-gray-400 shadow-lg"
                            >
                                {loading ? `⏳ ${t.loading}...` : `✅ ${t.completePDF}`}
                            </button>
                        )}
                        {currentSheet.lavoratori && currentSheet.lavoratori.length > 0 && window.hasRoleAccess(currentUser, 'sheets.generatePdf') && (
                            <button
                                onClick={() => setPartialPDFMode(true)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-colors shadow-lg"
                            >
                                📄 {t.partialPDF || 'Genera PDF Parziale'}
                            </button>
                        )}
                    </>
                )}
            </div>
        
        {/* 🍞 Toast Notification Locale */}
        {toast.visible && (
            <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold text-sm sm:text-base transition-all ${
                toast.type === 'success' ? 'bg-green-600' : 
                toast.type === 'error' ? 'bg-red-600' : 
                'bg-blue-600'
            }`}>
                {toast.message}
            </div>
        )}
        </div>
    );
}

// Expose as global for in-page usage (no bundler) with guard to prevent redeclaration
if (!window.SheetEditor) {
    window.SheetEditor = SheetEditor;
}
