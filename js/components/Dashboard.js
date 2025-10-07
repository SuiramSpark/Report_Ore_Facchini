// Dashboard Component - 5 LINGUE COMPLETE
const Dashboard = ({ sheets, darkMode, language = 'it' }) => {
    const t = translations[language];
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';

    // Calculate statistics
    const stats = React.useMemo(() => {
        return getStatistics(sheets);
    }, [sheets]);

    const activeSheets = sheets.filter(s => !s.archived).length;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Welcome Header */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">👋 {t.dashboard}</h1>
                <p className={textClass}>
                    {t.recentActivity}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                {/* Weekly Hours */}
                <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-sm sm:text-base font-semibold ${textClass}`}>
                            {t.weeklyHours}
                        </h3>
                        <span className="text-2xl sm:text-3xl">📅</span>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                        {stats.weeklyHours.toFixed(1)}{t.hours_short}
                    </p>
                    <p className={`text-xs sm:text-sm ${textClass} mt-1`}>{t.lastDays}</p>
                </div>

                {/* Monthly Hours */}
                <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-sm sm:text-base font-semibold ${textClass}`}>
                            {t.monthlyHours}
                        </h3>
                        <span className="text-2xl sm:text-3xl">📆</span>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
                        {stats.monthlyHours.toFixed(1)}{t.hours_short}
                    </p>
                    <p className={`text-xs sm:text-sm ${textClass} mt-1`}>{t.lastDaysMonth}</p>
                </div>

                {/* Active Sheets */}
                <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-sm sm:text-base font-semibold ${textClass}`}>
                            {t.activeSheets}
                        </h3>
                        <span className="text-2xl sm:text-3xl">📋</span>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                        {activeSheets}
                    </p>
                    <p className={`text-xs sm:text-sm ${textClass} mt-1`}>{t.nonArchivedSheets}</p>
                </div>
            </div>

            {/* Top Workers */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <span className="text-2xl sm:text-3xl">🏆</span>
                    <h2 className="text-lg sm:text-2xl font-bold">{t.topWorkers}</h2>
                </div>

                {stats.topWorkers.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                        {stats.topWorkers.map((worker, i) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className="text-xl sm:text-2xl flex-shrink-0">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-sm sm:text-base truncate">
                                            {worker.name}
                                        </p>
                                        <p className={`text-xs sm:text-sm ${textClass}`}>
                                            {worker.hours.toFixed(1)} {t.hours_short}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 sm:py-12">
                        <p className={`${textClass} text-sm sm:text-base`}>
                            {t.noWorkersThisMonth}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
