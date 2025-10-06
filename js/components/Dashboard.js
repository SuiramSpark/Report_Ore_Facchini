// Dashboard Component
const Dashboard = ({ sheets, darkMode, language = 'it' }) => {
    const t = translations[language];
    const stats = getStatistics(sheets || []);
    
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                    <h3 className={`text-sm font-medium ${textClass}`}>
                        {t.weeklyHours}
                    </h3>
                    <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                        {stats.weeklyHours.toFixed(1)}h
                    </p>
                    <div className="mt-2">
                        <span className={`text-xs ${textClass}`}>
                            📊 Ultimi 7 giorni
                        </span>
                    </div>
                </div>
                
                <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                    <h3 className={`text-sm font-medium ${textClass}`}>
                        {t.monthlyHours}
                    </h3>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">
                        {stats.monthlyHours.toFixed(1)}h
                    </p>
                    <div className="mt-2">
                        <span className={`text-xs ${textClass}`}>
                            📅 Ultimi 30 giorni
                        </span>
                    </div>
                </div>
                
                <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                    <h3 className={`text-sm font-medium ${textClass}`}>
                        {t.activeSheets}
                    </h3>
                    <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                        {sheets.filter(s => !s.archived).length}
                    </p>
                    <div className="mt-2">
                        <span className={`text-xs ${textClass}`}>
                            📋 Fogli non archiviati
                        </span>
                    </div>
                </div>
            </div>

            {/* Top Workers */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <h3 className="text-xl font-bold mb-4">
                    🏆 {t.topWorkers}
                </h3>
                
                {stats.topWorkers.length > 0 ? (
                    <div className="space-y-3">
                        {stats.topWorkers.map((worker, i) => (
                            <div 
                                key={i} 
                                className={`flex justify-between items-center p-4 rounded-lg ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                        i === 0 ? 'bg-yellow-500 text-white' :
                                        i === 1 ? 'bg-gray-400 text-white' :
                                        'bg-orange-600 text-white'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{worker.name}</p>
                                        <p className={`text-sm ${textClass}`}>
                                            {worker.hours.toFixed(1)} ore totali
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {i === 0 && <span className="text-2xl">🥇</span>}
                                    {i === 1 && <span className="text-2xl">🥈</span>}
                                    {i === 2 && <span className="text-2xl">🥉</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={textClass}>
                        Nessun lavoratore registrato questo mese
                    </p>
                )}
            </div>

            {/* Recent Activity */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <h3 className="text-xl font-bold mb-4">
                    📈 Attività Recente
                </h3>
                
                <div className="space-y-2">
                    {sheets.slice(0, 5).map(sheet => (
                        <div 
                            key={sheet.id}
                            className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{sheet.titoloAzienda || 'Senza titolo'}</p>
                                    <p className={`text-sm ${textClass}`}>
                                        {formatDate(sheet.data)} • {sheet.lavoratori?.length || 0} lavoratori
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    sheet.status === 'completed' 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                }`}>
                                    {sheet.status === 'completed' ? '✅ Completato' : '📝 Bozza'}
                                </span>
                            </div>
                        </div>
                    ))}
                    
                    {sheets.length === 0 && (
                        <p className={textClass}>
                            Nessuna attività recente
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
