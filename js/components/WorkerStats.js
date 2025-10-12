// Worker Statistics Component - Statistiche Dettagliate Lavoratore
const WorkerStats = ({ sheets, darkMode, language = 'it', onBack }) => {
    const [selectedWorker, setSelectedWorker] = React.useState(null);
    const [stats, setStats] = React.useState(null);
    
    const t = translations[language];
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';

    // Get all unique workers
    const workers = React.useMemo(() => {
        const workerSet = new Set();
        sheets.forEach(sheet => {
            sheet.lavoratori?.forEach(w => {
                workerSet.add(`${w.nome} ${w.cognome}`);
            });
        });
        return [...workerSet].sort();
    }, [sheets]);

    // Calculate stats when worker selected
    React.useEffect(() => {
        if (selectedWorker) {
            const workerStats = getWorkerDetailedStats(sheets, selectedWorker);
            setStats(workerStats);
        }
    }, [selectedWorker, sheets]);

    if (!selectedWorker) {
        return (
            <div className="space-y-4">
                <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">👤 {t.workerStatistics}</h2>
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                            >
                                ← {t.back}
                            </button>
                        )}
                    </div>
                    
                    <p className={`${textClass} mb-4`}>
                        Seleziona un lavoratore per vedere le statistiche dettagliate
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {workers.map((worker, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedWorker(worker)}
                                className={`p-4 rounded-lg text-left transition-all ${
                                    darkMode 
                                        ? 'bg-gray-700 hover:bg-gray-600' 
                                        : 'bg-gray-50 hover:bg-gray-100'
                                } border-2 border-transparent hover:border-indigo-500`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">👤</span>
                                    <span className="font-semibold">{worker}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">👤 {stats.name}</h2>
                    <button
                        onClick={() => setSelectedWorker(null)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                    >
                        ← {t.back}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                    <p className={`text-sm ${textClass} mb-2`}>{t.totalPresences}</p>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {stats.totalPresences}
                    </p>
                </div>

                <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                    <p className={`text-sm ${textClass} mb-2`}>{t.totalHours}</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.totalHours}h
                    </p>
                </div>

                <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                    <p className={`text-sm ${textClass} mb-2`}>{t.avgHoursPerDay}</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.avgHours}h
                    </p>
                </div>

                <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                    <p className={`text-sm ${textClass} mb-2`}>Aziende</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.companies.length}
                    </p>
                </div>
            </div>

            {/* Monthly Trend */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <h3 className="text-xl font-bold mb-4">📈 Trend Mensile</h3>
                <div className="space-y-3">
                    {Object.entries(stats.monthlyTrend)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([month, hours]) => (
                            <div key={month} className="flex items-center gap-3">
                                <span className="font-semibold w-24">{month}</span>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                                    <div 
                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                        style={{ width: `${Math.min((hours / Math.max(...Object.values(stats.monthlyTrend))) * 100, 100)}%` }}
                                    >
                                        {hours.toFixed(1)}h
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Companies */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <h3 className="text-xl font-bold mb-4">🏢 Aziende Lavorate</h3>
                <div className="flex flex-wrap gap-2">
                    {stats.companies.map((company, i) => (
                        <span 
                            key={i}
                            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold"
                        >
                            {company}
                        </span>
                    ))}
                </div>
            </div>

            {/* Recent Entries */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <h3 className="text-xl font-bold mb-4">📋 Ultime Presenze</h3>
                <div className="space-y-2">
                    {stats.entries.slice(0, 10).map((entry, i) => (
                        <div 
                            key={i}
                            className={`p-3 rounded-lg ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-50'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{entry.company}</p>
                                    <p className={`text-sm ${textClass}`}>
                                        {formatDate(entry.date)} • {entry.oraIn} - {entry.oraOut}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                        {entry.oreTotali}h
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
