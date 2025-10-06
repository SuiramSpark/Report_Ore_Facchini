// Audit Log Component
const AuditLog = ({ auditLog, darkMode, language = 'it' }) => {
    const t = translations[language];
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const [filter, setFilter] = React.useState('all'); // all, add, edit, delete

    const filteredLogs = React.useMemo(() => {
        if (filter === 'all') return auditLog;
        
        const filterMap = {
            add: ['WORKER_ADD', 'BLACKLIST_ADD', 'SHEET_CREATE'],
            edit: ['WORKER_EDIT', 'BULK_UPDATE', 'SHEET_EDIT'],
            delete: ['WORKER_DELETE', 'BLACKLIST_REMOVE', 'SHEET_DELETE']
        };
        
        return auditLog.filter(log => filterMap[filter]?.some(action => log.action.includes(action)));
    }, [auditLog, filter]);

    const getActionIcon = (action) => {
        if (action.includes('ADD') || action.includes('CREATE')) return '➕';
        if (action.includes('EDIT') || action.includes('UPDATE')) return '✏️';
        if (action.includes('DELETE') || action.includes('REMOVE')) return '🗑️';
        if (action.includes('BLACKLIST')) return '🚫';
        return '📝';
    };

    const getActionColor = (action) => {
        if (action.includes('ADD') || action.includes('CREATE')) return darkMode ? 'text-green-400' : 'text-green-600';
        if (action.includes('EDIT') || action.includes('UPDATE')) return darkMode ? 'text-blue-400' : 'text-blue-600';
        if (action.includes('DELETE') || action.includes('REMOVE')) return darkMode ? 'text-red-400' : 'text-red-600';
        if (action.includes('BLACKLIST')) return darkMode ? 'text-orange-400' : 'text-orange-600';
        return darkMode ? 'text-gray-400' : 'text-gray-600';
    };

    return (
        <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                    📋 {t.auditLog}
                </h2>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                            filter === 'all'
                                ? 'bg-indigo-600 text-white'
                                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Tutti
                    </button>
                    <button
                        onClick={() => setFilter('add')}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                            filter === 'add'
                                ? 'bg-green-600 text-white'
                                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        ➕ Aggiunte
                    </button>
                    <button
                        onClick={() => setFilter('edit')}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                            filter === 'edit'
                                ? 'bg-blue-600 text-white'
                                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        ✏️ Modifiche
                    </button>
                    <button
                        onClick={() => setFilter('delete')}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                            filter === 'delete'
                                ? 'bg-red-600 text-white'
                                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        🗑️ Eliminazioni
                    </button>
                </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.length === 0 ? (
                    <p className={`text-center py-8 ${textClass}`}>
                        {filter === 'all' 
                            ? 'Nessuna modifica registrata' 
                            : 'Nessuna modifica di questo tipo'}
                    </p>
                ) : (
                    filteredLogs.map(log => (
                        <div
                            key={log.id}
                            className={`p-3 rounded-lg border ${
                                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">
                                    {getActionIcon(log.action)}
                                </span>
                                <div className="flex-1">
                                    <p className={`font-semibold ${getActionColor(log.action)}`}>
                                        {log.action}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {log.details}
                                    </p>
                                    <div className={`text-xs ${textClass} mt-1 flex items-center gap-2`}>
                                        <span>🕐 {formatDateTime(log.timestamp)}</span>
                                        {log.user && <span>👤 {log.user}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {filteredLogs.length > 0 && (
                <div className={`mt-4 text-center ${textClass} text-sm`}>
                    Mostrando {filteredLogs.length} di {auditLog.length} modifiche
                </div>
            )}
        </div>
    );
};
