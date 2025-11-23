// Worker Statistics Component - v4.2 FIX DUPLICATI + SINGLE USER SUPPORT
const WorkerStats = ({ 
    sheets, 
    darkMode, 
    language = 'it', 
    onBack, 
    onAddToBlacklist, 
    blacklist = [], 
    activityTypes = [], 
    onViewProfile, 
    db,
    currentUser, // 👤 Utente corrente per controllo permessi
    selectedWorker: initialSelectedWorker = null // 🎯 Supporto per vista singolo utente
}) => {
    const [selectedWorker, setSelectedWorker] = React.useState(initialSelectedWorker);
    const [stats, setStats] = React.useState(null);
    const [permanentWorkers, setPermanentWorkers] = React.useState([]); // 👥 Lista lavoratori fissi
    
    // 🎯 Aggiorna selectedWorker se la prop cambia (per supporto vista profilo utente)
    React.useEffect(() => {
        if (initialSelectedWorker) {
            setSelectedWorker(initialSelectedWorker);
        }
    }, [initialSelectedWorker]);
    
    // 📥 Carica lista lavoratori permanenti da Firestore
    React.useEffect(() => {
        if (!db) return;
        
        const loadPermanentWorkers = async () => {
            try {
                const snapshot = await db.collection('users')
                    .where('isPermanent', '==', true)
                    .get();
                
                // ✅ FILTRA: Solo utenti VERAMENTE permanenti (esclude worker-link)
                const permanentNames = snapshot.docs
                    .filter(doc => {
                        const data = doc.data();
                        // Worker-link NON è considerato permanente per WorkerStats
                        return data.role !== 'worker-link';
                    })
                    .map(doc => {
                        const data = doc.data();
                        return window.normalizeWorkerName(data.firstName || '', data.lastName || '');
                    });
                
                setPermanentWorkers(permanentNames);
            } catch (error) {
                console.error('Errore caricamento lavoratori permanenti:', error);
            }
        };
        
        loadPermanentWorkers();
    }, [db]);
    
    // Rendi activityTypes disponibile globalmente per i grafici
    React.useEffect(() => {
        window.activityTypes = activityTypes;
    }, [activityTypes]);
    
    // Funzione per verificare se il lavoratore selezionato è già in blacklist
    const isWorkerBlacklisted = React.useMemo(() => {
        if (!selectedWorker || !Array.isArray(blacklist)) return false;
        const normalizeWorkerName = window.normalizeWorkerName;
        const [nome, ...cognomeParts] = selectedWorker.split(' ');
        const cognome = cognomeParts.join(' ');
        const normalizedSelected = normalizeWorkerName(nome, cognome);
        return blacklist.some(bl => {
            const n = normalizeWorkerName(bl.nome, bl.cognome);
            return n === normalizedSelected;
        });
    }, [selectedWorker, blacklist]);
    
    // Translation helper: prefer the centralized runtime `window.t` (provided by js/i18n.js).
    // Keep a safe fallback to the legacy `translations` object so migration is incremental.
    const t = new Proxy({}, {
        get: (_target, prop) => {
            try {
                const key = String(prop);
                if (typeof window !== 'undefined' && typeof window.t === 'function') return window.t(key);
                const all = (typeof window !== 'undefined' && window.translations) || (typeof translations !== 'undefined' && translations) || {};
                const lang = language || 'it';
                return (all[lang] && all[lang][key]) || (all['it'] && all['it'][key]) || key;
            } catch (e) { return String(prop); }
        }
    });
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';

    // Usa la funzione globale per normalizzare nome e cognome
    const normalizeWorkerName = window.normalizeWorkerName;

    // Search state
    const [search, setSearch] = React.useState("");
    
    // 🔍 FILTRI AVANZATI
    const [filters, setFilters] = React.useState({
        company: '',
        activityType: '',
        minHours: '',
        maxHours: '',
        dateFrom: '',
        dateTo: ''
    });
    const [showFilters, setShowFilters] = React.useState(false);

    // Get all unique workers con gestione duplicati, filtered by search and filters
    const workers = React.useMemo(() => {
        const workerMap = new Map(); // normalizedKey -> worker data with stats
        
        sheets.forEach(sheet => {
            // Applica filtri a livello di foglio
            let passesFilters = true;
            
            // Filtro azienda
            if (filters.company && sheet.titoloAzienda !== filters.company) {
                passesFilters = false;
            }
            
            // Filtro tipo attività
            if (filters.activityType && (!sheet.tipoAttivita || !sheet.tipoAttivita.includes(filters.activityType))) {
                passesFilters = false;
            }
            
            // Filtro data
            if (filters.dateFrom && sheet.data < filters.dateFrom) {
                passesFilters = false;
            }
            if (filters.dateTo && sheet.data > filters.dateTo) {
                passesFilters = false;
            }
            
            if (!passesFilters) return;
            
            sheet.lavoratori?.forEach(w => {
                const normalizedKey = normalizeWorkerName(w.nome, w.cognome);
                const hours = parseFloat(w.oreTotali) || 0;
                
                if (!workerMap.has(normalizedKey)) {
                    workerMap.set(normalizedKey, { 
                        nome: w.nome, 
                        cognome: w.cognome,
                        displayName: `${w.nome} ${w.cognome}`.trim(),
                        normalized: normalizedKey,
                        totalHours: 0
                    });
                }
                
                // Accumula ore totali
                const workerData = workerMap.get(normalizedKey);
                workerData.totalHours += hours;
            });
        });
        
        let arr = Array.from(workerMap.values());
        
        // Filtro ore minime/massime
        if (filters.minHours) {
            const min = parseFloat(filters.minHours);
            arr = arr.filter(worker => worker.totalHours >= min);
        }
        if (filters.maxHours) {
            const max = parseFloat(filters.maxHours);
            arr = arr.filter(worker => worker.totalHours <= max);
        }
        
        // Filtro ricerca testuale
        if (search.trim()) {
            const normSearch = normalizeWorkerName(search, "");
            arr = arr.filter(worker => worker.normalized.includes(normSearch));
        }
        
        // 🚫 ESCLUDI lavoratori già FISSI (isPermanent: true in Firestore)
        arr = arr.filter(worker => !permanentWorkers.includes(worker.normalized));
        
        return arr.map(worker => worker.displayName).sort();
    }, [sheets, normalizeWorkerName, search, filters, permanentWorkers]);

    // Calculate stats when worker selected - CON NORMALIZZAZIONE
    React.useEffect(() => {
        if (selectedWorker) {
            // Normalizza il nome selezionato per trovare tutte le sue varianti
            const [nome, ...cognomeParts] = selectedWorker.split(' ');
            const cognome = cognomeParts.join(' ');
            const normalizedSelected = normalizeWorkerName(nome, cognome);
            
            // Calcola statistiche aggregate per tutte le varianti del nome
            const workerStats = getWorkerDetailedStats(sheets, normalizedSelected, normalizeWorkerName);
            setStats(workerStats);
        }
    }, [selectedWorker, sheets, normalizeWorkerName]);

    // 👥 Rendi utente permanente
    const handleMakePermanent = async () => {
        if (!selectedWorker || !db) return;
        
        const [firstName, ...lastNameParts] = selectedWorker.split(' ');
        const lastName = lastNameParts.join(' ');
        
        if (!confirm(t.confirmMakePermanent || `Confermi di rendere ${selectedWorker} un utente fisso?`)) {
            return;
        }
        
        try {
            const normalized = normalizeWorkerName(firstName, lastName);
            const userId = 'worker-' + normalized;
            
            // Verifica se esiste già
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // ✅ RIPRISTINO: Se era worker-link, lo riportiamo a worker permanente
                if (userData.role === 'worker-link') {
                    await db.collection('users').doc(userId).update({
                        role: 'worker',
                        isPermanent: true,
                        restoredAt: firebase.firestore.FieldValue.serverTimestamp(),
                        movedToOnCallAt: null // Rimuovi il timestamp di quando fu spostato
                    });
                    
                    alert('✅ ' + (t.userRestored || `${selectedWorker} è stato ripristinato come utente fisso con tutti i suoi dati precedenti!`));
                } else {
                    // Utente già permanente, solo aggiorna timestamp
                    await db.collection('users').doc(userId).update({
                        isPermanent: true,
                        madePermanentAt: firebase.firestore.FieldValue.serverTimestamp(),
                        madePermanentBy: 'admin'
                    });
                    
                    alert('✅ ' + (t.userMadePermanent || `${selectedWorker} è ora un utente fisso!`));
                }
            } else {
                // Crea nuovo utente
                await db.collection('users').doc(userId).set({
                    firstName: firstName || '',
                    lastName: lastName || '',
                    email: '',
                    phone: '',
                    role: 'worker',
                    isPermanent: true,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    madePermanentAt: firebase.firestore.FieldValue.serverTimestamp(),
                    madePermanentBy: 'admin',
                    documenti: [],
                    uploadCounter: { count: 0, resetDate: new Date() }
                });
                
                alert('✅ ' + (t.userMadePermanent || `${selectedWorker} è ora un utente fisso!`));
            }
            
            // Chiudi il dettaglio e torna alla lista
            setSelectedWorker(null);
            
        } catch (error) {
            console.error('Errore durante conversione:', error);
            alert('❌ Errore durante la conversione');
        }
    };

    const handleAddToBlacklist = async () => {
        if (!selectedWorker) return;
        
        const [nome, ...cognomeParts] = selectedWorker.split(' ');
        const cognome = cognomeParts.join(' ');
        
        const reason = prompt(t.blacklistReason + ':');
        if (!reason) return;

        // Ask for severity
        const severityChoice = prompt(`${t.severity}:\n1 = ${t.low}\n2 = ${t.medium}\n3 = ${t.high}`, '2');
        let severity = 'medium';
        if (severityChoice === '1') severity = 'low';
        else if (severityChoice === '3') severity = 'high';

        // Ask for expiry (optional)
        const wantsExpiry = confirm(`${t.temporary}? (${t.cancel} = ${t.permanent})`);
        let expiryDate = null;
        if (wantsExpiry) {
            const days = prompt(`${t.expiryDate} (${t.days}):`, '30');
            if (days && !isNaN(days)) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + parseInt(days));
                expiryDate = expiry.toISOString();
            }
        }

        // Signature
        const signature = prompt(`${t.signatureRequired} - ${t.yourNameSurname}:`, 'Admin');
        if (!signature) {
            alert(t.signatureRequired);
            return;
        }
        
        if (onAddToBlacklist) {
            await onAddToBlacklist({ nome, cognome }, reason, severity, expiryDate, signature);
            showToast(`✅ ${t.addedToBlacklistSuccess}`, 'success');
        }
    };

    if (!selectedWorker) {
        // 🎯 Se siamo in vista profilo utente (initialSelectedWorker passato), non mostrare nulla
        if (initialSelectedWorker) {
            return React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6 text-center` },
                React.createElement('p', { className: textClass }, '⏳ Caricamento statistiche utente...')
            );
        }
        
        // Vista normale: lista lavoratori
        return (
            <div className="space-y-4">
                <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl sm:text-2xl font-bold">👤 {t.workerStatistics}</h2>
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                ← {t.back}
                            </button>
                        )}
                    </div>
                    {/* Search input */}
                    <div className="mb-4">
                        <label htmlFor="worker-search" className={`block mb-1 font-semibold ${textClass}`}>
                            {t.searchWorker || 'Cerca lavoratore'}
                        </label>
                        <input
                            id="worker-search"
                            type="text"
                            className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                            placeholder={t.searchByName || 'Cerca per nome...'}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    
                    {/* 🔍 FILTRI AVANZATI */}
                    <div className="mb-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-between ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            <span>🔍 Filtri Avanzati</span>
                            <span>{showFilters ? '▲' : '▼'}</span>
                        </button>
                        
                        {showFilters && (
                            <div className={`mt-3 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} space-y-3`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {/* Filtro Azienda */}
                                    <div>
                                        <label className={`block mb-1 text-sm font-semibold ${textClass}`}>
                                            🏢 Azienda
                                        </label>
                                        <select
                                            value={filters.company}
                                            onChange={e => setFilters({...filters, company: e.target.value})}
                                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                        >
                                            <option value="">Tutte le aziende</option>
                                            {Array.from(new Set(sheets.map(s => s.titoloAzienda).filter(Boolean))).sort().map((company, i) => (
                                                <option key={i} value={company}>{company}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Filtro Tipo Attività */}
                                    <div>
                                        <label className={`block mb-1 text-sm font-semibold ${textClass}`}>
                                            🎨 Tipo Attività
                                        </label>
                                        <select
                                            value={filters.activityType}
                                            onChange={e => setFilters({...filters, activityType: e.target.value})}
                                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                        >
                                            <option value="">Tutte le attività</option>
                                            {(activityTypes || []).map(activity => (
                                                <option key={activity.id} value={activity.id}>
                                                    {activity.emoji} {activity.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Filtro Ore Minime */}
                                    <div>
                                        <label className={`block mb-1 text-sm font-semibold ${textClass}`}>
                                            ⏰ Ore Minime
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={filters.minHours}
                                            onChange={e => setFilters({...filters, minHours: e.target.value})}
                                            placeholder="Es: 10"
                                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                        />
                                    </div>
                                    
                                    {/* Filtro Ore Massime */}
                                    <div>
                                        <label className={`block mb-1 text-sm font-semibold ${textClass}`}>
                                            ⏰ Ore Massime
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={filters.maxHours}
                                            onChange={e => setFilters({...filters, maxHours: e.target.value})}
                                            placeholder="Es: 100"
                                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                        />
                                    </div>
                                    
                                    {/* Filtro Data Inizio */}
                                    <div>
                                        <label className={`block mb-1 text-sm font-semibold ${textClass}`}>
                                            📅 Da Data
                                        </label>
                                        <input
                                            type="date"
                                            value={filters.dateFrom}
                                            onChange={e => setFilters({...filters, dateFrom: e.target.value})}
                                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                        />
                                    </div>
                                    
                                    {/* Filtro Data Fine */}
                                    <div>
                                        <label className={`block mb-1 text-sm font-semibold ${textClass}`}>
                                            📅 A Data
                                        </label>
                                        <input
                                            type="date"
                                            value={filters.dateTo}
                                            onChange={e => setFilters({...filters, dateTo: e.target.value})}
                                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                                        />
                                    </div>
                                </div>
                                
                                {/* Pulsanti Azioni */}
                                <div className="flex gap-2 justify-end mt-3">
                                    <button
                                        onClick={() => setFilters({company: '', activityType: '', minHours: '', maxHours: '', dateFrom: '', dateTo: ''})}
                                        className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-semibold transition-colors"
                                    >
                                        🔄 Resetta Filtri
                                    </button>
                                </div>
                                
                                {/* Contatore Risultati */}
                                <div className={`text-sm ${textClass} text-center pt-2 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                    📊 Trovati <strong>{workers.length}</strong> lavoratori
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <p className={`${textClass} mb-4 text-sm sm:text-base`}>
                        {t.selectWorker}
                    </p>
                    {workers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {workers.map((worker, i) => {
                                // Evidenzia se in blacklist e prendi gravità
                                let borderColor = 'border-transparent';
                                if (Array.isArray(blacklist)) {
                                    const normalizeWorkerName = window.normalizeWorkerName;
                                    const [nome, ...cognomeParts] = worker.split(' ');
                                    const cognome = cognomeParts.join(' ');
                                    const normalized = normalizeWorkerName(nome, cognome);
                                    const bl = blacklist.find(bl => normalizeWorkerName(bl.nome, bl.cognome) === normalized);
                                    if (bl) {
                                        if (bl.severity === 'high') borderColor = 'border-red-600';
                                        else if (bl.severity === 'medium') borderColor = 'border-yellow-500';
                                        else if (bl.severity === 'low') borderColor = 'border-blue-500';
                                        else borderColor = 'border-gray-500';
                                    }
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedWorker(worker)}
                                        className={`w-full p-4 rounded-lg transition-all ${
                                            darkMode 
                                                ? 'bg-gray-700 hover:bg-gray-600' 
                                                : 'bg-gray-50 hover:bg-gray-100'
                                        } border-2 ${borderColor} shadow-sm hover:shadow-md text-left cursor-pointer`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">👤</span>
                                            <span className="font-semibold text-sm sm:text-base flex-1">{worker}</span>
                                            <span className="text-xl opacity-50">→</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className="text-5xl mb-4 block">👷</span>
                            <p className="text-lg font-semibold">{t.noWorkersFound || 'Nessun lavoratore trovato'}</p>
                            <p className="text-sm mt-2">{t.addWorkersFirst || 'Aggiungi lavoratori ai fogli ore per visualizzare le statistiche'}</p>
                        </div>
                    )}
                </div>

                {/* ========================================
                    STATISTICHE AGGREGATE GLOBALI
                    ======================================== */}
                {workers.length > 0 && (() => {
                    const normalizeWorkerName = window.normalizeWorkerName;
                    
                    // Mappa per mantenere i nomi originali con maiuscole
                    const workerDisplayNames = new Map(); // normalizedKey -> displayName
                    
                    // Calcola statistiche aggregate di tutti i lavoratori ON-CALL (esclusi fissi)
                    const aggregateStats = {
                        totalWorkers: workers.length,
                        totalHours: 0,
                        totalPresences: 0,
                        workerHours: {}, // nome normalizzato -> ore totali
                        companyHours: {}, // azienda -> ore totali
                        activityHours: {}, // tipo attività -> ore totali
                        monthlyHours: {}, // YYYY-MM -> ore totali
                        dailyAverages: [] // per ogni lavoratore
                    };

                    // Aggrega dati da tutti i fogli (SOLO LAVORATORI ON-CALL)
                    sheets.forEach(sheet => {
                        sheet.lavoratori?.forEach(w => {
                            const normalizedKey = normalizeWorkerName(w.nome, w.cognome);
                            
                            // 🚫 SALTA se è un lavoratore permanente
                            if (permanentWorkers.includes(normalizedKey)) {
                                return; // Skip this worker
                            }
                            
                            const hours = parseFloat(w.oreTotali) || 0;
                            
                            // Salva il nome originale con maiuscole
                            if (!workerDisplayNames.has(normalizedKey)) {
                                workerDisplayNames.set(normalizedKey, `${w.nome} ${w.cognome}`.trim());
                            }
                            
                            aggregateStats.totalHours += hours;
                            aggregateStats.totalPresences += 1;
                            
                            // Ore per lavoratore
                            aggregateStats.workerHours[normalizedKey] = (aggregateStats.workerHours[normalizedKey] || 0) + hours;
                            
                            // Ore per azienda (USA CAMPO CORRETTO)
                            const company = sheet.titoloAzienda || sheet.azienda || 'N/D';
                            aggregateStats.companyHours[company] = (aggregateStats.companyHours[company] || 0) + hours;
                            
                            // 🎯 Ore per tipo attività (PRENDE DAL FOGLIO - sheet.tipoAttivita è un array)
                            if (sheet.tipoAttivita && Array.isArray(sheet.tipoAttivita) && sheet.tipoAttivita.length > 0) {
                                // Distribuisci le ore equamente tra tutte le attività del foglio
                                const hoursPerActivity = hours / sheet.tipoAttivita.length;
                                sheet.tipoAttivita.forEach(activityId => {
                                    aggregateStats.activityHours[activityId] = (aggregateStats.activityHours[activityId] || 0) + hoursPerActivity;
                                });
                            }
                            
                            // Ore mensili
                            const month = sheet.data.substring(0, 7); // YYYY-MM
                            aggregateStats.monthlyHours[month] = (aggregateStats.monthlyHours[month] || 0) + hours;
                        });
                    });

                    // Calcola medie
                    const avgHoursPerWorker = aggregateStats.totalHours / workers.length;
                    const avgPresencesPerWorker = aggregateStats.totalPresences / workers.length;

                    return React.createElement('div', { className: 'space-y-6 mt-6' },
                        
                        // === SEZIONE TITOLO ===
                        React.createElement('div', { className: `${cardClass} rounded-xl shadow-lg p-6` },
                            React.createElement('h2', {
                                className: `text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`
                            }, '📊 Statistiche Globali Lavoratori')
                        ),

                        // === KPI CARDS ===
                        React.createElement('div', { className: 'grid grid-cols-2 lg:grid-cols-4 gap-4' },
                            [
                                { icon: '👷', label: t.totalWorkersLabel, value: aggregateStats.totalWorkers, color: 'blue' },
                                { icon: '⏰', label: t.totalHoursLabel, value: `${aggregateStats.totalHours.toFixed(1)}h`, color: 'green' },
                                { icon: '📈', label: t.avgHoursPerWorker, value: `${avgHoursPerWorker.toFixed(1)}h`, color: 'purple' },
                                { icon: '📅', label: t.totalPresencesLabel, value: aggregateStats.totalPresences, color: 'orange' }
                            ].map((kpi, idx) =>
                                React.createElement('div', {
                                    key: idx,
                                    className: `${cardClass} rounded-xl shadow-lg p-6 border-l-4 border-${kpi.color}-500 animate-fade-in`,
                                    style: { animationDelay: `${idx * 100}ms` }
                                },
                                    React.createElement('div', { className: 'flex items-center justify-between mb-2' },
                                        React.createElement('span', { className: 'text-3xl' }, kpi.icon)
                                    ),
                                    React.createElement('p', { className: `text-sm ${textClass} mb-1` }, kpi.label),
                                    React.createElement('p', {
                                        className: `text-3xl font-bold text-${kpi.color}-600 dark:text-${kpi.color}-400`
                                    }, kpi.value)
                                )
                            )
                        ),

                        // === TOP 10 LAVORATORI - BAR CHART ===
                        (() => {
                            const { TopItemsBarChart } = window.AdvancedCharts || {};
                            if (!TopItemsBarChart) return null;

                            const topWorkers = Object.entries(aggregateStats.workerHours)
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 10)
                                .map(([normalizedName, hours]) => ({
                                    name: workerDisplayNames.get(normalizedName) || normalizedName, // USA NOME CON MAIUSCOLE
                                    value: parseFloat(hours.toFixed(1))
                                }));

                            return React.createElement(TopItemsBarChart, {
                                data: topWorkers,
                                darkMode,
                                title: '🏆 Top 10 Lavoratori per Ore Totali'
                            });
                        })(),

                        // === TOP AZIENDE - BAR CHART ===
                        (() => {
                            const { TopItemsBarChart } = window.AdvancedCharts || {};
                            if (!TopItemsBarChart || Object.keys(aggregateStats.companyHours).length === 0) return null;

                            const topCompanies = Object.entries(aggregateStats.companyHours)
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 8)
                                .map(([name, hours]) => ({
                                    name,
                                    value: parseFloat(hours.toFixed(1))
                                }));

                            return React.createElement(TopItemsBarChart, {
                                data: topCompanies,
                                darkMode,
                                title: '🏢 Top Aziende per Ore Lavorate'
                            });
                        })(),

                        // === DISTRIBUZIONE ORE PER AZIENDA - PIE CHART ===
                        (() => {
                            const { DistributionPieChart } = window.AdvancedCharts || {};
                            if (!DistributionPieChart || Object.keys(aggregateStats.companyHours).length === 0) return null;

                            const companyDistribution = Object.entries(aggregateStats.companyHours)
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 6)
                                .map(([name, hours]) => ({
                                    name,
                                    value: parseFloat(hours.toFixed(1))
                                }));

                            return React.createElement(DistributionPieChart, {
                                data: companyDistribution,
                                darkMode,
                                title: '🎯 Distribuzione Ore per Azienda (Top 6)'
                            });
                        })(),

                        // === MESSAGGIO SE NON CI SONO ATTIVITÀ ===
                        (() => {
                            if (Object.keys(aggregateStats.activityHours).length > 0) return null;
                            
                            return React.createElement('div', {
                                className: `${cardClass} rounded-xl shadow-lg p-8 text-center`
                            },
                                React.createElement('div', { className: 'text-6xl mb-4' }, '🎨'),
                                React.createElement('h3', {
                                    className: `text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`
                                }, 'Nessun Tipo di Attività Registrato'),
                                React.createElement('p', {
                                    className: `${textClass} mb-4`
                                }, t.noActivityTypesAssigned || 'I fogli ore non hanno tipi di attività assegnati.'),
                                React.createElement('p', {
                                    className: `text-sm ${textClass}`
                                }, t.goToSheetEditorInstruction || 'Vai in "Modifica Fogli" e aggiungi i tipi di attività ai fogli archiviati per vedere le statistiche.')
                            );
                        })(),

                        // === TIPI DI ATTIVITÀ - BAR CHART ===
                        (() => {
                            const { TopItemsBarChart } = window.AdvancedCharts || {};
                            const activityTypes = window.activityTypes || [];
                            if (!TopItemsBarChart || Object.keys(aggregateStats.activityHours).length === 0) return null;

                            const activityBarData = Object.entries(aggregateStats.activityHours)
                                .map(([activityId, hours]) => {
                                    const activity = activityTypes.find(a => a.id === activityId);
                                    // USA .nome e .emoji dalle impostazioni
                                    const activityName = activity ? `${activity.emoji || '📋'} ${activity.nome}` : `Attività #${activityId}`;
                                    
                                    return {
                                        name: activityName,
                                        value: parseFloat(hours.toFixed(1))
                                    };
                                })
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 10);

                            return React.createElement(TopItemsBarChart, {
                                data: activityBarData,
                                darkMode,
                                title: '🎨 Ore per Tipo di Attività (Top 10)'
                            });
                        })(),

                        // === TABELLA DETTAGLIATA TIPI DI ATTIVITÀ ===
                        (() => {
                            const activityTypes = window.activityTypes || [];
                            if (Object.keys(aggregateStats.activityHours).length === 0) return null;

                            const totalActivityHours = Object.values(aggregateStats.activityHours).reduce((sum, h) => sum + h, 0);

                            const activityTableData = Object.entries(aggregateStats.activityHours)
                                .map(([activityId, hours]) => {
                                    const activity = activityTypes.find(a => a.id === activityId);
                                    // USA .nome e .emoji dalle impostazioni
                                    const activityName = activity ? `${activity.emoji || '📋'} ${activity.nome}` : `Attività #${activityId}`;
                                    const percentage = ((hours / totalActivityHours) * 100).toFixed(1);
                                    
                                    // Conta quanti lavoratori hanno fatto questa attività (dal FOGLIO)
                                    const workersCount = new Set();
                                    sheets.forEach(sheet => {
                                        // Controlla se il foglio ha questa attività
                                        if (sheet.tipoAttivita && Array.isArray(sheet.tipoAttivita) && sheet.tipoAttivita.includes(activityId)) {
                                            // Aggiungi tutti i lavoratori di questo foglio
                                            sheet.lavoratori?.forEach(w => {
                                                workersCount.add(normalizeWorkerName(w.nome, w.cognome));
                                            });
                                        }
                                    });
                                    
                                    return {
                                        name: activityName,
                                        hours: hours.toFixed(1),
                                        percentage: percentage,
                                        workers: workersCount.size
                                    };
                                })
                                .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));

                            return React.createElement('div', { className: `${cardClass} rounded-xl shadow-lg p-6` },
                                React.createElement('h3', {
                                    className: `text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`
                                }, '🎨 Dettaglio Tipi di Attività'),
                                
                                React.createElement('div', { className: 'overflow-x-auto' },
                                    React.createElement('table', { className: 'w-full' },
                                        React.createElement('thead', {},
                                            React.createElement('tr', {
                                                className: `border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
                                            },
                                                React.createElement('th', { className: `text-left p-3 ${textClass}` }, '#'),
                                                React.createElement('th', { className: `text-left p-3 ${textClass}` }, 'Tipo Attività'),
                                                React.createElement('th', { className: `text-right p-3 ${textClass}` }, 'Ore Totali'),
                                                React.createElement('th', { className: `text-right p-3 ${textClass}` }, '% del Totale'),
                                                React.createElement('th', { className: `text-right p-3 ${textClass}` }, 'N° Lavoratori')
                                            )
                                        ),
                                        React.createElement('tbody', {},
                                            activityTableData.map((activity, idx) =>
                                                React.createElement('tr', {
                                                    key: idx,
                                                    className: `border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} transition-colors`
                                                },
                                                    React.createElement('td', { className: 'p-3 font-semibold' }, idx + 1),
                                                    React.createElement('td', { className: 'p-3' }, activity.name),
                                                    React.createElement('td', {
                                                        className: `p-3 text-right font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                                                    }, `${activity.hours}h`),
                                                    React.createElement('td', {
                                                        className: `p-3 text-right ${darkMode ? 'text-purple-400' : 'text-purple-600'} font-semibold`
                                                    }, `${activity.percentage}%`),
                                                    React.createElement('td', {
                                                        className: `p-3 text-right ${textClass}`
                                                    }, activity.workers)
                                                )
                                            )
                                        )
                                    )
                                ),
                                
                                // Totale
                                React.createElement('div', {
                                    className: `mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`
                                },
                                    React.createElement('span', { className: 'font-bold' }, t.total),
                                    React.createElement('span', {
                                        className: `font-bold text-lg ${darkMode ? 'text-green-400' : 'text-green-600'}`
                                    }, `${totalActivityHours.toFixed(1)}h`)
                                )
                            );
                        })(),

                        // === ANDAMENTO MENSILE - LINE CHART ===
                        (() => {
                            const { DailyHoursLineChart } = window.AdvancedCharts || {};
                            if (!DailyHoursLineChart || Object.keys(aggregateStats.monthlyHours).length === 0) return null;

                            const monthlyData = Object.entries(aggregateStats.monthlyHours)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .slice(-6) // Ultimi 6 mesi
                                .map(([month, hours]) => ({
                                    day: month,
                                    hours: parseFloat(hours.toFixed(1))
                                }));

                            return React.createElement(DailyHoursLineChart, {
                                data: monthlyData,
                                darkMode,
                                title: '📈 Andamento Ore Mensili (Ultimi 6 Mesi)'
                            });
                        })(),

                        // === ORE CUMULATIVE - AREA CHART ===
                        (() => {
                            const { CumulativeAreaChart } = window.AdvancedCharts || {};
                            if (!CumulativeAreaChart || Object.keys(aggregateStats.monthlyHours).length === 0) return null;

                            let cumulative = 0;
                            const cumulativeData = Object.entries(aggregateStats.monthlyHours)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .slice(-6)
                                .map(([month, hours]) => {
                                    cumulative += hours;
                                    return {
                                        day: month,
                                        cumulative: parseFloat(cumulative.toFixed(1))
                                    };
                                });

                            return React.createElement(CumulativeAreaChart, {
                                data: cumulativeData,
                                darkMode,
                                title: '📊 Ore Cumulative (Ultimi 6 Mesi)'
                            });
                        })(),

                        // === TABELLA TOP PERFORMERS ===
                        React.createElement('div', { className: `${cardClass} rounded-xl shadow-lg p-6` },
                            React.createElement('h3', {
                                className: `text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`
                            }, '🏆 Top 15 Lavoratori'),
                            
                            React.createElement('div', { className: 'overflow-x-auto' },
                                React.createElement('table', { className: 'w-full' },
                                    React.createElement('thead', {},
                                        React.createElement('tr', {
                                            className: `border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
                                        },
                                            React.createElement('th', { className: `text-left p-3 ${textClass}` }, '#'),
                                            React.createElement('th', { className: `text-left p-3 ${textClass}` }, t.worker || 'Lavoratore'),
                                            React.createElement('th', { className: `text-right p-3 ${textClass}` }, t.totalHoursLabel),
                                            React.createElement('th', { className: `text-right p-3 ${textClass}` }, t.avgPerAttendance)
                                        )
                                    ),
                                    React.createElement('tbody', {},
                                        Object.entries(aggregateStats.workerHours)
                                            .sort(([,a], [,b]) => b - a)
                                            .slice(0, 15)
                                            .map(([normalizedName, hours], idx) => {
                                                // Conta presenze per questo lavoratore
                                                let presences = 0;
                                                sheets.forEach(sheet => {
                                                    sheet.lavoratori?.forEach(w => {
                                                        if (normalizeWorkerName(w.nome, w.cognome) === normalizedName) {
                                                            presences++;
                                                        }
                                                    });
                                                });
                                                const avgPerPresence = presences > 0 ? hours / presences : 0;
                                                
                                                // USA NOME CON MAIUSCOLE
                                                const displayName = workerDisplayNames.get(normalizedName) || normalizedName;

                                                return React.createElement('tr', {
                                                    key: idx,
                                                    className: `border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} transition-colors`
                                                },
                                                    React.createElement('td', { className: 'p-3 font-semibold' }, idx + 1),
                                                    React.createElement('td', { className: 'p-3' }, displayName),
                                                    React.createElement('td', {
                                                        className: `p-3 text-right font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`
                                                    }, `${hours.toFixed(1)}h`),
                                                    React.createElement('td', {
                                                        className: `p-3 text-right ${textClass}`
                                                    }, `${avgPerPresence.toFixed(1)}h`)
                                                );
                                            })
                                    )
                                )
                            )
                        )
                    );
                })()}
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <span>👤</span> {selectedWorker}
                    </h2>
                    {/* 🎯 Nascondi azioni quando siamo in vista profilo utente */}
                    {!initialSelectedWorker && (
                        <div className="flex gap-2">
                            {onAddToBlacklist && window.hasRoleAccess(currentUser, 'onCall.addToBlacklist') && (
                                <button
                                    onClick={isWorkerBlacklisted ? undefined : handleAddToBlacklist}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-md ${isWorkerBlacklisted ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                    title={isWorkerBlacklisted ? t.blacklistWarning : t.addToBlacklist}
                                    disabled={isWorkerBlacklisted}
                                >
                                    🚫 <span className="hidden sm:inline">{isWorkerBlacklisted ? t.blacklistWarning : t.addToBlacklist}</span>
                                </button>
                            )}
                            {db && window.hasRoleAccess(currentUser, 'users.modify') && (
                                <button
                                    onClick={handleMakePermanent}
                                    className="px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-md bg-green-600 hover:bg-green-700 text-white"
                                    title={t.makePermanent || 'Rendi User Fisso'}
                                >
                                    ✅ <span className="hidden sm:inline">{t.makePermanent || 'Rendi User Fisso'}</span>
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedWorker(null)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                            >
                                ← {t.back}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    {
                        icon: '📅',
                        value: stats.totalPresences,
                        label: t.totalPresences,
                        color: 'indigo'
                    },
                    {
                        icon: '⏰',
                        value: `${stats.totalHours}h`,
                        label: t.totalHours,
                        color: 'green'
                    },
                    {
                        icon: '📊',
                        value: `${stats.avgHours}h`,
                        label: t.avgHoursPerDay,
                        color: 'blue'
                    },
                    {
                        icon: '🏢',
                        value: stats.companies.length,
                        label: t.companiesWorked,
                        color: 'purple'
                    }
                ].map((metric, i) => (
                    <div 
                        key={i}
                        className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-${metric.color}-500 animate-fade-in`}
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{metric.icon}</span>
                        </div>
                        <p className={`text-xs sm:text-sm ${textClass} mb-1`}>{metric.label}</p>
                        <p className={`text-2xl sm:text-3xl font-bold text-${metric.color}-600 dark:text-${metric.color}-400`}>
                            {metric.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Monthly Trend - Grafico Recharts */}
            {Object.keys(stats.monthlyTrend).length > 0 && (() => {
                const { DailyHoursLineChart } = window.AdvancedCharts || {};
                if (!DailyHoursLineChart) return null;
                
                // Prepara dati ultimi 3 mesi
                const monthlyData = Object.entries(stats.monthlyTrend)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 3)
                    .reverse()
                    .map(([month, hours]) => ({
                        day: month,
                        hours: parseFloat(hours.toFixed(1))
                    }));
                
                return React.createElement(DailyHoursLineChart, {
                    data: monthlyData,
                    darkMode,
                    title: `📈 ${t.monthlyTrend || 'Andamento Mensile'} (ultimi 3 mesi)`
                });
            })()}

            {/* 📊 Top Aziende - Bar Chart */}
            {stats.companies.length > 0 && (() => {
                const { TopItemsBarChart } = window.AdvancedCharts || {};
                if (!TopItemsBarChart) return null;
                
                // Calcola ore per azienda
                const companyHours = {};
                stats.entries.forEach(entry => {
                    const company = entry.company || 'N/D';
                    companyHours[company] = (companyHours[company] || 0) + entry.hours;
                });
                
                const companyData = Object.entries(companyHours)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([name, value]) => ({
                        name,
                        value: parseFloat(value.toFixed(1))
                    }));
                
                return React.createElement(TopItemsBarChart, {
                    data: companyData,
                    darkMode,
                    title: `📊 ${t.companiesWorked || 'Aziende'} - Top 5`,
                    dataKey: 'value',
                    nameKey: 'name'
                });
            })()}

            {/* 🎯 Performance - Metriche Lavoratore con 5 KPI + TOOLTIP */}
            {(() => {
                // 🎯 PRODUTTIVITÀ: Ore medie giornaliere su 8h standard
                const avgHoursPerDay = stats.totalHours / Math.max(stats.uniqueWorkDays || stats.totalDays, 1);
                const productivity = Math.min((avgHoursPerDay / 8) * 100, 100);
                
                // 📊 COSTANZA: Rapporto fogli/giorni lavorativi
                const consistency = stats.totalDays > 0 ? Math.min((stats.totalSheets / stats.totalDays) * 100, 100) : 0;
                
                // 🎓 ESPERIENZA: Giorni lavorati su giorni lavorativi totali nel periodo
                const experience = stats.workingDaysInPeriod > 0 
                    ? Math.min((stats.uniqueWorkDays / stats.workingDaysInPeriod) * 100, 100) 
                    : 0;
                
                // 📅 DISPONIBILITÀ: Giorni weekend/festivi lavorati
                const totalWeekendDays = stats.entries.filter(e => 
                    window.isWeekend(e.date) || window.isItalianHoliday(e.date)
                ).length;
                const availability = totalWeekendDays > 0 
                    ? Math.min((stats.weekendDaysWorked / totalWeekendDays) * 100, 100) 
                    : (stats.weekendDaysWorked > 0 ? 100 : 0);
                
                // 🎯 AFFIDABILITÀ: Formula complessa a 5 fattori
                // 30% Completezza dati
                const completeness = stats.totalSheets > 0 ? (stats.completedSheets / stats.totalSheets) * 30 : 0;
                
                // 20% Presenza costante
                const presenceRatio = stats.totalDays > 0 ? Math.min((stats.totalSheets / stats.totalDays), 1) * 20 : 0;
                
                // 20% Puntualità (arrivi anticipati + uscite posticipate)
                const punctualityScore = stats.totalSheets > 0 
                    ? ((stats.earlyArrivals + stats.lateExits) / (stats.totalSheets * 2)) * 20 
                    : 0;
                
                // 20% Reputazione Blacklist
                const blacklistPenalty = isWorkerBlacklisted ? 
                    (blacklist.find(bl => {
                        const [nome, ...cognomeParts] = selectedWorker.split(' ');
                        const cognome = cognomeParts.join(' ');
                        return normalizeWorkerName(bl.nome, bl.cognome) === normalizeWorkerName(nome, cognome);
                    })?.severity === 'high' ? 0 : 
                     blacklist.find(bl => {
                        const [nome, ...cognomeParts] = selectedWorker.split(' ');
                        const cognome = cognomeParts.join(' ');
                        return normalizeWorkerName(bl.nome, bl.cognome) === normalizeWorkerName(nome, cognome);
                    })?.severity === 'medium' ? 10 : 15) 
                    : 20;
                
                // 10% Disponibilità weekend
                const availabilityBonus = (availability / 100) * 10;
                
                const reliability = Math.min(completeness + presenceRatio + punctualityScore + blacklistPenalty + availabilityBonus, 100);
                
                return React.createElement('div', {
                    className: `${cardClass} rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-orange-500 animate-fade-in`,
                    style: { animationDelay: '300ms' }
                },
                    React.createElement('h3', {
                        className: `text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`
                    }, `🎯 Performance ${selectedWorker}`),
                    
                    // 5 KPI Cards con TOOLTIP
                    React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4' },
                        [
                            { 
                                label: t.productivity, 
                                value: Math.round(productivity), 
                                icon: '⚡', 
                                color: 'purple',
                                tooltip: `Media ${avgHoursPerDay.toFixed(1)}h/giorno su 8h standard`
                            },
                            { 
                                label: t.consistency, 
                                value: Math.round(consistency), 
                                icon: '📊', 
                                color: 'blue',
                                tooltip: `${stats.totalSheets} fogli in ${stats.totalDays} giorni`
                            },
                            { 
                                label: t.experience, 
                                value: Math.round(experience), 
                                icon: '🎓', 
                                color: 'green',
                                tooltip: `${stats.uniqueWorkDays} giorni su ${stats.workingDaysInPeriod} lavorativi`
                            },
                            { 
                                label: t.availability, 
                                value: Math.round(availability), 
                                icon: '📅', 
                                color: 'indigo',
                                tooltip: `${stats.weekendDaysWorked} weekend/festivi lavorati`
                            },
                            { 
                                label: t.reliability, 
                                value: Math.round(reliability), 
                                icon: '🎯', 
                                color: 'orange',
                                tooltip: `Dati completi + Puntualità + Reputazione`
                            }
                        ].map((metric, idx) =>
                            React.createElement('div', {
                                key: idx,
                                className: `p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center cursor-help group relative`,
                                title: metric.tooltip
                            },
                                React.createElement('div', { className: 'text-2xl mb-1' }, metric.icon),
                                React.createElement('div', {
                                    className: `text-2xl font-bold text-${metric.color}-600 dark:text-${metric.color}-400`
                                }, `${metric.value}%`),
                                React.createElement('div', {
                                    className: `text-xs ${textClass} mt-1`
                                }, metric.label),
                                // Tooltip hover
                                React.createElement('div', {
                                    className: `absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg`
                                }, metric.tooltip)
                            )
                        )
                    ),
                    
                    // Divisore
                    React.createElement('div', {
                        className: `border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} my-4`
                    }),
                    
                    // Dettaglio Breakdown Affidabilità
                    React.createElement('div', {},
                        React.createElement('h4', {
                            className: `text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`
                        }, '🔍 Dettaglio Calcolo Affidabilità'),
                        
                        React.createElement('div', { className: 'space-y-2 text-xs sm:text-sm' },
                            // Completezza Dati
                            React.createElement('div', {
                                className: `flex items-center justify-between p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                            },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('span', { className: 'text-lg' }, '📝'),
                                    React.createElement('span', { className: textClass }, 'Completezza Dati (30%)')
                                ),
                                React.createElement('div', { className: 'text-right' },
                                    React.createElement('div', {
                                        className: `font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`
                                    }, `${stats.completedSheets}/${stats.totalSheets} fogli`),
                                    React.createElement('div', {
                                        className: `text-xs ${textClass}`
                                    }, `${Math.round(completeness)}% di 30`)
                                )
                            ),
                            
                            // Presenza Costante
                            React.createElement('div', {
                                className: `flex items-center justify-between p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                            },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('span', { className: 'text-lg' }, '📅'),
                                    React.createElement('span', { className: textClass }, 'Presenza Costante (20%)')
                                ),
                                React.createElement('div', { className: 'text-right' },
                                    React.createElement('div', {
                                        className: `font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                                    }, `${stats.totalSheets}/${stats.totalDays} giorni`),
                                    React.createElement('div', {
                                        className: `text-xs ${textClass}`
                                    }, `${Math.round(presenceRatio)}% di 20`)
                                )
                            ),
                            
                            // Puntualità Arrivo/Uscita
                            React.createElement('div', {
                                className: `flex items-center justify-between p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                            },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('span', { className: 'text-lg' }, '⏰'),
                                    React.createElement('span', { className: textClass }, 'Puntualità Orari (20%)')
                                ),
                                React.createElement('div', { className: 'text-right' },
                                    React.createElement('div', {
                                        className: `font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`
                                    }, `${stats.earlyArrivals} arrivi + ${stats.lateExits} uscite`),
                                    React.createElement('div', {
                                        className: `text-xs ${textClass}`
                                    }, `${Math.round(punctualityScore)}% di 20`)
                                )
                            ),
                            
                            // Reputazione Blacklist
                            React.createElement('div', {
                                className: `flex items-center justify-between p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                            },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('span', { className: 'text-lg' }, isWorkerBlacklisted ? '🚫' : '✅'),
                                    React.createElement('span', { className: textClass }, 'Reputazione (20%)')
                                ),
                                React.createElement('div', { className: 'text-right' },
                                    React.createElement('div', {
                                        className: `font-bold ${isWorkerBlacklisted ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-green-400' : 'text-green-600')}`
                                    }, isWorkerBlacklisted ? 'In Blacklist' : 'Pulito'),
                                    React.createElement('div', {
                                        className: `text-xs ${textClass}`
                                    }, `${Math.round(blacklistPenalty)}% di 20`)
                                )
                            ),
                            
                            // Disponibilità Weekend
                            React.createElement('div', {
                                className: `flex items-center justify-between p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                            },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('span', { className: 'text-lg' }, '🌙'),
                                    React.createElement('span', { className: textClass }, 'Disponibilità (10%)')
                                ),
                                React.createElement('div', { className: 'text-right' },
                                    React.createElement('div', {
                                        className: `font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`
                                    }, `${stats.weekendDaysWorked} weekend`),
                                    React.createElement('div', {
                                        className: `text-xs ${textClass}`
                                    }, `${Math.round(availabilityBonus)}% di 10`)
                                )
                            ),
                            
                            // Totale
                            React.createElement('div', {
                                className: `flex items-center justify-between p-3 rounded mt-2 border-t-2 ${darkMode ? 'bg-gray-600 border-orange-500' : 'bg-orange-50 border-orange-400'}`
                            },
                                React.createElement('div', { className: 'flex items-center gap-2' },
                                    React.createElement('span', { className: 'text-lg' }, '🎯'),
                                    React.createElement('span', {
                                        className: `font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`
                                    }, t.totalReliability || 'Affidabilità Totale')
                                ),
                                React.createElement('div', {
                                    className: `text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`
                                }, `${Math.round(reliability)}%`)
                            )
                        )
                    )
                );
            })()}

            {/* 📊 BAR CHART - Ore per Tipo di Attività (Lavoratore Singolo) */}
            {(() => {
                const { TopItemsBarChart } = window.AdvancedCharts || {};
                const activityTypes = window.activityTypes || [];
                
                if (!TopItemsBarChart || !stats.activityHours || Object.keys(stats.activityHours).length === 0) {
                    // Mostra messaggio se non ci sono attività
                    return React.createElement('div', {
                        className: `${cardClass} rounded-xl shadow-lg p-6 text-center animate-fade-in`,
                        style: { animationDelay: '400ms' }
                    },
                        React.createElement('div', { className: 'text-5xl mb-3' }, '🎨'),
                        React.createElement('h3', {
                            className: `text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`
                        }, t.noActivityRegistered || 'Nessuna Attività Registrata'),
                        React.createElement('p', {
                            className: `text-sm ${textClass}`
                        }, `${selectedWorker} ${t.workerNoActivityTypes || 'non ha fogli con tipi di attività assegnati.'}`)
                    );
                }
                
                const activityBarData = Object.entries(stats.activityHours)
                    .map(([activityId, hours]) => {
                        const activity = activityTypes.find(a => a.id === activityId);
                        // USA .nome e .emoji dalle impostazioni
                        const activityName = activity ? `${activity.emoji || '📋'} ${activity.nome}` : `Attività #${activityId}`;
                        
                        return {
                            name: activityName,
                            value: parseFloat(hours.toFixed(1))
                        };
                    })
                    .sort((a, b) => b.value - a.value);
                
                return React.createElement(TopItemsBarChart, {
                    data: activityBarData,
                    darkMode,
                    title: `🎨 Ore per Tipo di Attività - ${selectedWorker}`
                });
            })()}

            {/* 📋 TABELLA DETTAGLIATA ATTIVITÀ (Lavoratore Singolo) */}
            {(() => {
                const activityTypes = window.activityTypes || [];
                
                if (!stats.activityHours || Object.keys(stats.activityHours).length === 0) {
                    return null;
                }
                
                const totalActivityHours = Object.values(stats.activityHours).reduce((sum, h) => sum + h, 0);
                
                const activityTableData = Object.entries(stats.activityHours)
                    .map(([activityId, hours]) => {
                        const activity = activityTypes.find(a => a.id === activityId);
                        // USA .nome e .emoji dalle impostazioni
                        const activityName = activity ? `${activity.emoji || '📋'} ${activity.nome}` : `Attività #${activityId}`;
                        const percentage = ((hours / totalActivityHours) * 100).toFixed(1);
                        
                        // Conta quante volte ha fatto questa attività
                        let count = 0;
                        stats.entries.forEach(entry => {
                            if (entry.tipoAttivita === activityId) {
                                count++;
                            }
                        });
                        
                        return {
                            name: activityName,
                            hours: hours.toFixed(1),
                            percentage: percentage,
                            count: count
                        };
                    })
                    .sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours));
                
                return React.createElement('div', {
                    className: `${cardClass} rounded-xl shadow-lg p-4 sm:p-6 animate-fade-in`,
                    style: { animationDelay: '450ms' }
                },
                    React.createElement('h3', {
                        className: `text-lg sm:text-xl font-bold mb-4 flex items-center gap-2`
                    }, 
                        React.createElement('span', {}, '🎨'),
                        ` Dettaglio Attività - ${selectedWorker}`
                    ),
                    
                    React.createElement('div', { className: 'overflow-x-auto' },
                        React.createElement('table', { className: 'w-full text-sm sm:text-base' },
                            React.createElement('thead', {},
                                React.createElement('tr', {
                                    className: `border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
                                },
                                    React.createElement('th', { className: `text-left p-2 sm:p-3 ${textClass}` }, '#'),
                                    React.createElement('th', { className: `text-left p-2 sm:p-3 ${textClass}` }, 'Tipo Attività'),
                                    React.createElement('th', { className: `text-right p-2 sm:p-3 ${textClass}` }, 'Ore'),
                                    React.createElement('th', { className: `text-right p-2 sm:p-3 ${textClass}` }, '%'),
                                    React.createElement('th', { className: `text-right p-2 sm:p-3 ${textClass}` }, 'N° Volte')
                                )
                            ),
                            React.createElement('tbody', {},
                                activityTableData.map((activity, idx) =>
                                    React.createElement('tr', {
                                        key: idx,
                                        className: `border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} transition-colors`
                                    },
                                        React.createElement('td', { className: 'p-2 sm:p-3 font-semibold' }, idx + 1),
                                        React.createElement('td', { className: 'p-2 sm:p-3' }, activity.name),
                                        React.createElement('td', {
                                            className: `p-2 sm:p-3 text-right font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                                        }, `${activity.hours}h`),
                                        React.createElement('td', {
                                            className: `p-2 sm:p-3 text-right ${darkMode ? 'text-purple-400' : 'text-purple-600'} font-semibold`
                                        }, `${activity.percentage}%`),
                                        React.createElement('td', {
                                            className: `p-2 sm:p-3 text-right ${textClass}`
                                        }, activity.count)
                                    )
                                )
                            )
                        )
                    ),
                    
                    // Totale
                    React.createElement('div', {
                        className: `mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center flex-wrap gap-2`
                    },
                        React.createElement('span', { className: 'font-bold text-sm sm:text-base' }, t.totalActivityHours),
                        React.createElement('span', {
                            className: `font-bold text-lg sm:text-xl ${darkMode ? 'text-green-400' : 'text-green-600'}`
                        }, `${totalActivityHours.toFixed(1)}h (100%)`)
                    )
                );
            })()}

            {/* Companies */}
            {stats.companies.length > 0 && (
                <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 animate-fade-in`} style={{ animationDelay: '500ms' }}>
                    <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                        <span>🏢</span> {t.companiesWorked}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.companies.map((company, i) => (
                            <span 
                                key={i}
                                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                                    darkMode 
                                        ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60' 
                                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                }`}
                            >
                                {company}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Entries */}
            {stats.entries.length > 0 && (
                <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 animate-fade-in`} style={{ animationDelay: '600ms' }}>
                    <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                        <span>📋</span> {t.recentAttendances}
                    </h3>
                    <div className="space-y-2">
                        {stats.entries.slice(0, 10).map((entry, i) => (
                            <div 
                                key={i}
                                className={`p-3 rounded-lg transition-all ${
                                    darkMode 
                                        ? 'bg-gray-700 hover:bg-gray-600' 
                                        : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm sm:text-base truncate" title={entry.company}>
                                            {entry.company}
                                        </p>
                                        <p className={`text-xs sm:text-sm ${textClass}`}>
                                            {formatDate(entry.date)} • {entry.oraIn} - {entry.oraOut}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-3">
                                        <p className={`font-bold text-base sm:text-lg ${
                                            darkMode ? 'text-indigo-400' : 'text-indigo-600'
                                        }`}>
                                            {entry.oreTotali}h
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {stats.entries.length === 0 && (
                <div className={`${cardClass} rounded-xl shadow-lg p-8 sm:p-12 text-center`}>
                    <span className="text-5xl mb-4 block">📊</span>
                    <p className={`${textClass} text-lg font-semibold`}>
                        {t.noDataAvailable || 'Nessun dato disponibile per questo lavoratore'}
                    </p>
                </div>
            )}
        </div>
    );
};
