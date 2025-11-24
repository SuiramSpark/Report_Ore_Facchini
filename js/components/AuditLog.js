// Audit Log Component - 5 LINGUE COMPLETE

// 🔧 FIX: Funzione formatDateTime mancante
function formatDateTime(timestamp) {
    if (!timestamp) return 'N/D';
    try {
        const date = new Date(timestamp);
        if (isNaN(date)) return 'N/D';
        return date.toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'N/D';
    }
}

const AuditLog = ({ auditLog, darkMode, language = 'it', db }) => {
    const [filter, setFilter] = React.useState('all');
    const [clearing, setClearing] = React.useState(false);
    const [selectedLogs, setSelectedLogs] = React.useState([]);
    const [selectMode, setSelectMode] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);
    
    // 🚀 FILTRI AVANZATI
    const [searchQuery, setSearchQuery] = React.useState('');
    const [userFilter, setUserFilter] = React.useState('all');
    const [eventTypeFilter, setEventTypeFilter] = React.useState('all');
    const [dateFilter, setDateFilter] = React.useState('all'); // all, today, week, month
    const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
    
    // 🚀 OTTIMIZZAZIONE: Paginazione lazy load
    const [displayLimit, setDisplayLimit] = React.useState(20);
    const ITEMS_PER_PAGE = 20;
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

    // 🚀 ESTRAI LISTA UTENTI UNICI
    const uniqueUsers = React.useMemo(() => {
        const users = [...new Set(auditLog.map(log => log.user))];
        return users.sort();
    }, [auditLog]);

    // 🚀 TIPI DI EVENTI DISPONIBILI
    const eventTypes = React.useMemo(() => {
        const types = [...new Set(auditLog.map(log => log.action))];
        return types.sort();
    }, [auditLog]);

    // 🚀 FILTRI AVANZATI CON SEARCH, USER, EVENT TYPE, DATE
    const filteredLogs = React.useMemo(() => {
        let logs = auditLog;

        // Filtro base (create/edit/delete/all)
        if (filter !== 'all') {
            logs = logs.filter(log => {
                const action = log.action.toLowerCase();
                if (filter === 'create') return action.includes('create');
                if (filter === 'edit') return action.includes('edit') || action.includes('update');
                if (filter === 'delete') return action.includes('delete');
                return true;
            });
        }

        // Search query (cerca in action e details)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            logs = logs.filter(log => 
                log.action.toLowerCase().includes(query) || 
                log.details.toLowerCase().includes(query) ||
                log.user.toLowerCase().includes(query)
            );
        }

        // User filter
        if (userFilter !== 'all') {
            logs = logs.filter(log => log.user === userFilter);
        }

        // Event type filter
        if (eventTypeFilter !== 'all') {
            logs = logs.filter(log => log.action === eventTypeFilter);
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

            logs = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                if (dateFilter === 'today') return logDate >= today;
                if (dateFilter === 'week') return logDate >= weekAgo;
                if (dateFilter === 'month') return logDate >= monthAgo;
                return true;
            });
        }

        return logs;
    }, [auditLog, filter, searchQuery, userFilter, eventTypeFilter, dateFilter]);

    // Filter logs (VECCHIA LOGICA - SOSTITUITA DA filteredLogs sopra)
    // const filteredLogs = React.useMemo(() => {
    //     if (filter === 'all') return auditLog;
    //     return auditLog.filter(log => {
    //         const action = log.action.toLowerCase();
    //         if (filter === 'create') return action.includes('create');
    //         if (filter === 'edit') return action.includes('edit') || action.includes('update');
    //         if (filter === 'delete') return action.includes('delete');
    //         return true;
    //     });
    // }, [auditLog, filter]);
    
    // 🚀 Displayed logs (con limite paginazione)
    const displayedLogs = React.useMemo(() => {
        return filteredLogs.slice(0, displayLimit);
    }, [filteredLogs, displayLimit]);
    
    // Reset limit quando cambiano filtri
    React.useEffect(() => {
        setDisplayLimit(ITEMS_PER_PAGE);
    }, [filter, searchQuery, userFilter, eventTypeFilter, dateFilter]);

    // Reset advanced filters
    const resetAdvancedFilters = () => {
        setSearchQuery('');
        setUserFilter('all');
        setEventTypeFilter('all');
        setDateFilter('all');
    };

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

    // Toggle select mode
    const toggleSelectMode = () => {
        setSelectMode(!selectMode);
        setSelectedLogs([]);
    };

    // Toggle single log selection
    const toggleLogSelection = (index) => {
        setSelectedLogs(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    // Select all visible logs
    const selectAllLogs = () => {
        if (selectedLogs.length === filteredLogs.length) {
            setSelectedLogs([]);
        } else {
            setSelectedLogs(filteredLogs.map((_, i) => i));
        }
    };

    // Delete selected logs
    const deleteSelectedLogs = async () => {
        if (!db) {
            showToast(`❌ ${t.dbNotConnected}`, 'error');
            return;
        }

        if (selectedLogs.length === 0) {
            showToast(`⚠️ ${t.noLogsSelected}`, 'warning');
            return;
        }

        if (!confirm(`⚠️ ${t.confirmDeleteSelected.replace('{count}', selectedLogs.length)}`)) {
            return;
        }

        setDeleting(true);

        try {
            const batch = db.batch();
            const snapshot = await db.collection('auditLog').get();
            
            // Get selected log items from filtered list
            const logsToDelete = selectedLogs.map(index => filteredLogs[index]);
            
            // Find and delete matching documents
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const shouldDelete = logsToDelete.some(log => 
                    log.timestamp === data.timestamp && 
                    log.action === data.action &&
                    log.user === data.user
                );
                if (shouldDelete) {
                    batch.delete(doc.ref);
                }
            });

            await batch.commit();
            showToast(`✅ ${t.logsDeleted.replace('{count}', selectedLogs.length)}`, 'success');
            setSelectedLogs([]);
            setSelectMode(false);
        } catch (error) {
            console.error('Errore:', error);
            showToast(`❌ ${t.errorDeletingLogs}`, 'error');
        }

        setDeleting(false);
    };

    // Action icon
    const getActionIcon = (action) => {
        if (action.includes('PASSWORD')) return '🔐';
        if (action.includes('AVATAR') || action.includes('PROFILE')) return '👤';
        if (action.includes('CREATE')) return '➕';
        if (action.includes('EDIT') || action.includes('UPDATE')) return '✏️';
        if (action.includes('DELETE')) return '🗑️';
        if (action.includes('COMPLETE')) return '✅';
        if (action.includes('ARCHIVE')) return '📦';
        if (action.includes('RESTORE')) return '↩️';
        if (action.includes('BLACKLIST')) return '🚫';
        if (action.includes('SIGNATURE')) return '✍️';
        if (action.includes('USER')) return '👥';
        return '📝';
    };

    // Action color
    const getActionColor = (action) => {
        if (action.includes('PASSWORD')) return darkMode ? 'text-yellow-400' : 'text-yellow-600';
        if (action.includes('DELETE')) return darkMode ? 'text-red-400' : 'text-red-600';
        if (action.includes('CREATE')) return darkMode ? 'text-green-400' : 'text-green-600';
        if (action.includes('EDIT') || action.includes('UPDATE')) return darkMode ? 'text-blue-400' : 'text-blue-600';
        if (action.includes('COMPLETE')) return darkMode ? 'text-purple-400' : 'text-purple-600';
        if (action.includes('BLACKLIST')) return darkMode ? 'text-orange-400' : 'text-orange-600';
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
                {/* Search Bar + Advanced Filters Toggle */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder={`🔍 ${t.search || 'Cerca'} (evento, dettagli, utente)...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${
                                darkMode 
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        />
                    </div>
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                            showAdvancedFilters
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        }`}
                    >
                        {showAdvancedFilters ? '🔼' : '🔽'} {t.advancedFilters || 'Filtri Avanzati'}
                    </button>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <div className={`p-4 rounded-lg space-y-3 ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* User Filter */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                                    👤 {t.user || 'Utente'}
                                </label>
                                <select
                                    value={userFilter}
                                    onChange={(e) => setUserFilter(e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg border ${
                                        darkMode 
                                            ? 'bg-gray-800 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                >
                                    <option value="all">{t.allUsers || 'Tutti gli utenti'}</option>
                                    {uniqueUsers.map(user => (
                                        <option key={user} value={user}>{user}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Event Type Filter */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                                    📋 {t.eventType || 'Tipo Evento'}
                                </label>
                                <select
                                    value={eventTypeFilter}
                                    onChange={(e) => setEventTypeFilter(e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg border ${
                                        darkMode 
                                            ? 'bg-gray-800 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                >
                                    <option value="all">{t.allEvents || 'Tutti gli eventi'}</option>
                                    {eventTypes.map(type => (
                                        <option key={type} value={type}>
                                            {getActionIcon(type)} {type.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Filter */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                                    📅 {t.period || 'Periodo'}
                                </label>
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg border ${
                                        darkMode 
                                            ? 'bg-gray-800 border-gray-600 text-white' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                >
                                    <option value="all">{t.allTime || 'Sempre'}</option>
                                    <option value="today">{t.today || 'Oggi'}</option>
                                    <option value="week">{t.lastWeek || 'Ultima settimana'}</option>
                                    <option value="month">{t.lastMonth || 'Ultimo mese'}</option>
                                </select>
                            </div>
                        </div>

                        {/* Reset Filters Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={resetAdvancedFilters}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                    darkMode
                                        ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                        : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                                }`}
                            >
                                🔄 {t.resetFilters || 'Reset Filtri'}
                            </button>
                        </div>
                    </div>
                )}

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

                {/* Action Buttons Row */}
                <div className="flex flex-col sm:flex-row gap-2">
                    {/* Select Mode Toggle */}
                    <button
                        onClick={toggleSelectMode}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                            selectMode
                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        }`}
                    >
                        {selectMode ? `✖️ ${t.cancelSelection}` : `☑️ ${t.selectLogs}`}
                    </button>

                    {/* Select All - visible only in select mode */}
                    {selectMode && (
                        <button
                            onClick={selectAllLogs}
                            disabled={filteredLogs.length === 0}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                                darkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                        >
                            {selectedLogs.length === filteredLogs.length ? `⬜ ${t.deselectAll}` : `☑️ ${t.selectAll}`}
                        </button>
                    )}

                    {/* Delete Selected - visible only in select mode */}
                    {selectMode && (
                        <button
                            onClick={deleteSelectedLogs}
                            disabled={deleting || selectedLogs.length === 0}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            {deleting 
                                ? `⏳ ${t.deleting}` 
                                : `🗑️ ${t.deleteSelected} (${selectedLogs.length})`}
                        </button>
                    )}

                    {/* Clear All - visible only when NOT in select mode */}
                    {!selectMode && (
                        <button
                            onClick={clearAuditLog}
                            disabled={clearing || auditLog.length === 0}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                            {clearing ? `⏳ ${t.clearing}` : `🗑️ ${t.clearRegistry}`}
                        </button>
                    )}
                </div>
            </div>

            {/* Logs List */}
            {filteredLogs.length > 0 ? (
                <>
                <div className="space-y-2 sm:space-y-3 max-h-[70vh] overflow-y-auto">
                    {displayedLogs.map((log, i) => (
                        <div
                            key={i}
                            className={`p-3 sm:p-4 rounded-lg border-l-4 ${
                                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                            } ${selectMode ? 'cursor-pointer hover:opacity-80' : ''} ${
                                selectedLogs.includes(i) ? 'ring-2 ring-blue-500' : ''
                            }`}
                            style={{ 
                                borderLeftColor: 
                                    getActionColor(log.action).includes('red') ? '#ef4444' : 
                                    getActionColor(log.action).includes('green') ? '#10b981' :
                                    getActionColor(log.action).includes('blue') ? '#3b82f6' : 
                                    getActionColor(log.action).includes('yellow') ? '#f59e0b' :
                                    getActionColor(log.action).includes('purple') ? '#a855f7' :
                                    getActionColor(log.action).includes('orange') ? '#f97316' :
                                    '#6b7280' 
                            }}
                            onClick={() => selectMode && toggleLogSelection(i)}
                        >
                            <div className="flex items-start gap-3">
                                {/* Checkbox in select mode */}
                                {selectMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedLogs.includes(i)}
                                        onChange={() => toggleLogSelection(i)}
                                        className="mt-1 w-5 h-5 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                                
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
                
                {/* 🚀 Load More Button */}
                {displayedLogs.length < filteredLogs.length && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => setDisplayLimit(prev => prev + ITEMS_PER_PAGE)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                darkMode 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                        >
                            📥 {t.loadMore || 'Carica altri'} ({filteredLogs.length - displayedLogs.length} {t.remaining || 'rimanenti'})
                        </button>
                    </div>
                )}
                </>
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
