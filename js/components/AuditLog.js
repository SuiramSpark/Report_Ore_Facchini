// Audit Log Component - 5 LINGUE COMPLETE
const AuditLog = ({ auditLog, darkMode, language = 'it', db }) => {
    const [filter, setFilter] = React.useState('all');
    const [clearing, setClearing] = React.useState(false);
    const t = translations[language];

    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';

    // Filter logs
    const filteredLogs = React.useMemo(() => {
        if (filter === 'all') return auditLog;
        return auditLog.filter(log => {
            const action = log.action.toLowerCase();
            if (filter === 'create') return action.includes('create');
            if (filter === 'edit') return action.includes('edit') || action.includes('update');
            if (filter === 'delete') return action.includes('delete');
            return true;
        });
    }, [auditLog, filter]);

    // Clear audit log
    const clearAuditLog = async () => {
        if (!db) {
            showToast(`❌ ${t.dbNotConnected}`, 'error');
            return;
        }

        if (!confirm(`⚠️ ${t.confirmClear}`)) {
            return;
        }

        setClearing(true);

        try {
            const batch = db.batch();
            const snapshot = await db.collection('auditLog').get();
            
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            showToast(`✅ ${t.registryCleared}`, 'success');
        } catch (error) {
            console.error('Errore:', error);
            showToast(`❌ ${t.errorClearing}`, 'error');
        }

        setClearing(false);
    };

    // Action icon
    const getActionIcon = (action) => {
        if (action.includes('CREATE')) return '➕';
        if (action.includes('EDIT') || action.includes('UPDATE')) return '✏️';
        if (action.includes('DELETE')) return '🗑️';
        if (action.includes('COMPLETE')) return '✅';
        if (action.includes('ARCHIVE')) return '📦';
        if (action.includes('RESTORE')) return '↩️';
        if (action.includes('BLACKLIST')) return '🚫';
        if (action.includes('SIGNATURE')) return '✍️';
        return '📝';
    };

    // Action color
    const getActionColor = (action) => {
        if (action.includes('DELETE')) return darkMode ? 'text-red-400' : 'text-red-600';
        if (action.includes('CREATE')) return darkMode ? 'text-green-400' : 'text-green-600';
        if (action.includes('EDIT') || action.includes('UPDATE')) return darkMode ? 'text-blue-400' : 'text-blue-600';
        if (action.includes('COMPLETE')) return darkMode ? 'text-purple-400' : 'text-purple-600';
        return darkMode ? 'text-gray-400' : 'text-gray-600';
    };

    return (
        <div className={`${cardClass} rounded-xl shadow-lg p-3 sm:p-6`}>
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">📝 {t.auditLog}</h2>
                <p className={`${textClass} text-sm sm:text-base`}>
                    {filteredLogs.length} {filteredLogs.length === 1 ? t.modifications : t.modificationsPlural}
                </p>
            </div>

            {/* Filters + Clear - MOBILE OTTIMIZZATO */}
            <div className="mb-4 space-y-3">
                {/* Filter Buttons - STACK VERTICALE SU MOBILE */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                            filter === 'all'
                                ? 'bg-indigo-600 text-white'
                                : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        📋 {t.all}
                    </button>
                    <button
                        onClick={() => setFilter('create')}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                            filter === 'create'
                                ? 'bg-green-600 text-white'
                                : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        ➕ {t.additions}
                    </button>
                    <button
                        onClick={() => setFilter('edit')}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                            filter === 'edit'
                                ? 'bg-blue-600 text-white'
                                : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        ✏️ {t.edits}
                    </button>
                    <button
                        onClick={() => setFilter('delete')}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                            filter === 'delete'
                                ? 'bg-red-600 text-white'
                                : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        🗑️ {t.deletions}
                    </button>
                </div>

                {/* Clear Button */}
                <button
                    onClick={clearAuditLog}
                    disabled={clearing || auditLog.length === 0}
                    className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                    {clearing ? `⏳ ${t.clearing}` : `🗑️ ${t.clearRegistry}`}
                </button>
            </div>

            {/* Logs List */}
            {filteredLogs.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 max-h-[70vh] overflow-y-auto">
                    {filteredLogs.map((log, i) => (
                        <div
                            key={i}
                            className={`p-3 sm:p-4 rounded-lg border-l-4 ${
                                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                            }`}
                            style={{ borderLeftColor: getActionColor(log.action).includes('red') ? '#ef4444' : 
                                                       getActionColor(log.action).includes('green') ? '#10b981' :
                                                       getActionColor(log.action).includes('blue') ? '#3b82f6' : '#6b7280' }}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl sm:text-3xl flex-shrink-0">
                                    {getActionIcon(log.action)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-sm sm:text-base ${getActionColor(log.action)} mb-1`}>
                                        {log.action.replace(/_/g, ' ')}
                                    </p>
                                    <p className={`${textClass} text-xs sm:text-sm mb-2 break-words`}>
                                        {log.details}
                                    </p>
                                    <div className="flex flex-wrap gap-2 sm:gap-3 text-xs">
                                        <span className={textClass}>
                                            🕐 {formatDateTime(log.timestamp)}
                                        </span>
                                        <span className={textClass}>
                                            👤 {log.user}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 sm:py-12">
                    <p className={`${textClass} text-base sm:text-lg`}>
                        {filter === 'all' 
                            ? t.noModifications
                            : t.noModificationsFilter}
                    </p>
                </div>
            )}
        </div>
    );
};
