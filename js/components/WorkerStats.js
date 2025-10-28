// Worker Statistics Component - v4.2 FIX DUPLICATI
const WorkerStats = ({ sheets, darkMode, language = 'it', onBack, onAddToBlacklist, blacklist = [] }) => {
    const [selectedWorker, setSelectedWorker] = React.useState(null);
    const [stats, setStats] = React.useState(null);
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

    // Get all unique workers con gestione duplicati, filtered by search
    const workers = React.useMemo(() => {
        const workerMap = new Map(); // normalizedKey -> first occurrence worker data
        sheets.forEach(sheet => {
            sheet.lavoratori?.forEach(w => {
                const normalizedKey = normalizeWorkerName(w.nome, w.cognome);
                if (!workerMap.has(normalizedKey)) {
                    workerMap.set(normalizedKey, { 
                        nome: w.nome, 
                        cognome: w.cognome,
                        displayName: `${w.nome} ${w.cognome}`.trim(),
                        normalized: normalizedKey
                    });
                }
            });
        });
        let arr = Array.from(workerMap.values());
        if (search.trim()) {
            const normSearch = normalizeWorkerName(search, "");
            arr = arr.filter(worker => worker.normalized.includes(normSearch));
        }
        return arr.map(worker => worker.displayName).sort();
    }, [sheets, normalizeWorkerName, search]);

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
                                        className={`p-4 rounded-lg text-left transition-all ${
                                            darkMode 
                                                ? 'bg-gray-700 hover:bg-gray-600' 
                                                : 'bg-gray-50 hover:bg-gray-100'
                                        } border-2 ${borderColor} hover:border-indigo-500 shadow-sm hover:shadow-md`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">👤</span>
                                            <span className="font-semibold text-sm sm:text-base">{worker}</span>
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
                    <div className="flex gap-2">
                        {onAddToBlacklist && (
                            <button
                                onClick={isWorkerBlacklisted ? undefined : handleAddToBlacklist}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-md ${isWorkerBlacklisted ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                title={isWorkerBlacklisted ? t.blacklistWarning : t.addToBlacklist}
                                disabled={isWorkerBlacklisted}
                            >
                                🚫 <span className="hidden sm:inline">{isWorkerBlacklisted ? t.blacklistWarning : t.addToBlacklist}</span>
                            </button>
                        )}
                        <button
                            onClick={() => setSelectedWorker(null)}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                        >
                            ← {t.back}
                        </button>
                    </div>
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

            {/* Monthly Trend */}
            {Object.keys(stats.monthlyTrend).length > 0 && (
                <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 animate-fade-in`} style={{ animationDelay: '400ms' }}>
                    <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                        <span>📈</span> {t.monthlyTrend}
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats.monthlyTrend)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .slice(0, 6)
                            .map(([month, hours], i) => {
                                const maxHours = Math.max(...Object.values(stats.monthlyTrend));
                                const percentage = maxHours > 0 ? (hours / maxHours) * 100 : 0;
                                
                                return (
                                    <div key={month} className="flex items-center gap-3">
                                        <span className={`font-semibold w-20 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {month}
                                        </span>
                                        <div className="flex-1 relative">
                                            <div className={`rounded-full h-6 overflow-hidden ${
                                                darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                            }`}>
                                                <div 
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-6 rounded-full transition-all duration-1000 ease-out flex items-center justify-center text-white text-xs sm:text-sm font-semibold"
                                                    style={{ 
                                                        width: `${percentage}%`,
                                                        minWidth: hours > 0 ? '40px' : '0px'
                                                    }}
                                                >
                                                    {hours.toFixed(1)}h
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

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
