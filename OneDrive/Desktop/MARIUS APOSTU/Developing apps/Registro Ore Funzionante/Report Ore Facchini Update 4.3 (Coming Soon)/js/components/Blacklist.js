// Blacklist Component - 5 LINGUE COMPLETE + Advanced Features
const Blacklist = ({ blacklist, removeFromBlacklist, darkMode, language = 'it' }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [severityFilter, setSeverityFilter] = React.useState('all');
    const [expiryFilter, setExpiryFilter] = React.useState('all');
    const [sortBy, setSortBy] = React.useState('dateAdded');
    const [selectedItems, setSelectedItems] = React.useState([]);
    const [showStats, setShowStats] = React.useState(true);
    const [showNotesModal, setShowNotesModal] = React.useState(null);
    const t = translations[language];

    // Severity badge colors
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return 'bg-red-600 text-white';
            case 'medium': return 'bg-yellow-600 text-white';
            case 'low': return 'bg-blue-600 text-white';
            default: return 'bg-gray-600 text-white';
        }
    };

    // Check if item is expired
    const isExpired = (item) => {
        if (!item.expiryDate) return false;
        return new Date(item.expiryDate) < new Date();
    };

    // Calculate statistics
    const stats = React.useMemo(() => {
        const total = blacklist.length;
        const activeBlacklist = blacklist.filter(item => !isExpired(item));
        
        // Top 5 reasons
        const reasonCounts = {};
        blacklist.forEach(item => {
            const reason = item.reason || 'Unknown';
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        });
        const topReasons = Object.entries(reasonCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Average duration
        const now = new Date();
        const durations = activeBlacklist
            .map(item => Math.floor((now - new Date(item.addedAt)) / (1000 * 60 * 60 * 24)))
            .filter(d => d >= 0);
        const avgDuration = durations.length > 0 
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) 
            : 0;

        // Severity breakdown
        const severityCounts = {
            high: blacklist.filter(i => i.severity === 'high').length,
            medium: blacklist.filter(i => i.severity === 'medium').length,
            low: blacklist.filter(i => i.severity === 'low').length,
        };

        return { total, active: activeBlacklist.length, topReasons, avgDuration, severityCounts };
    }, [blacklist]);

    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 
        'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

    // Filter and sort blacklist
    const filteredBlacklist = React.useMemo(() => {
        let result = blacklist;

        // Search filter
        if (searchTerm) {
            result = result.filter(item => 
                item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.cognome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.codiceFiscale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.numeroIdentita?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.addedBy?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Severity filter
        if (severityFilter !== 'all') {
            result = result.filter(item => (item.severity || 'medium') === severityFilter);
        }

        // Expiry filter
        if (expiryFilter === 'permanent') {
            result = result.filter(item => !item.expiryDate);
        } else if (expiryFilter === 'temporary') {
            result = result.filter(item => item.expiryDate && !isExpired(item));
        } else if (expiryFilter === 'expired') {
            result = result.filter(item => isExpired(item));
        }

        // Sort
        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'dateAdded':
                    return new Date(b.addedAt) - new Date(a.addedAt);
                case 'alphabetical':
                    return `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`);
                case 'bySeverity':
                    const severityOrder = { high: 3, medium: 2, low: 1 };
                    return (severityOrder[b.severity] || 2) - (severityOrder[a.severity] || 2);
                default:
                    return 0;
            }
        });

        return result;
    }, [blacklist, searchTerm, severityFilter, expiryFilter, sortBy]);

    // Bulk actions
    const toggleSelectAll = () => {
        if (selectedItems.length === filteredBlacklist.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredBlacklist.map(item => item.id));
        }
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkRemove = async () => {
        if (selectedItems.length === 0) return;
        
        const reason = prompt(`${t.removalReason}:`);
        if (!reason) return;

        const signature = prompt(`${t.signatureRequired} - ${t.yourNameSurname}:`);
        if (!signature) {
            alert(t.signatureRequired);
            return;
        }

        if (!confirm(`${t.confirm}? ${t.removeSelected}: ${selectedItems.length} ${t.selectedItems}`)) return;

        for (const id of selectedItems) {
            await removeFromBlacklist(id, reason, signature);
        }
        setSelectedItems([]);
    };

    const handleRemove = async (id, name) => {
        const reason = prompt(`${t.removalReason} - ${name}:`);
        if (!reason) return;

        const signature = prompt(`${t.signatureRequired} - ${t.yourNameSurname}:`);
        if (!signature) {
            alert(t.signatureRequired);
            return;
        }

        if (!confirm(`${t.confirm}? ${t.removeFromBlacklist}: ${name}`)) return;
        
        await removeFromBlacklist(id, reason, signature);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl sm:text-3xl">🚫</span>
                    <div className="flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold">{t.blacklist}</h1>
                        <p className={`${textClass} text-sm sm:text-base`}>
                            {filteredBlacklist.length} {filteredBlacklist.length === 1 ? t.workers.slice(0, -1).toLowerCase() : t.workers.toLowerCase()}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                    >
                        📊 {showStats ? t.hide : t.show}
                    </button>
                </div>

                {/* Statistics Dashboard */}
                {showStats && stats.total > 0 && (
                    <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <h3 className="font-bold mb-3">📊 {t.blacklistStats}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-500">{stats.total}</p>
                                <p className={`text-xs ${textClass}`}>{t.totalBlacklisted}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-500">{stats.active}</p>
                                <p className={`text-xs ${textClass}`}>{t.temporary}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-500">{stats.avgDuration}</p>
                                <p className={`text-xs ${textClass}`}>{t.avgDuration} ({t.days})</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-500">{stats.topReasons.length}</p>
                                <p className={`text-xs ${textClass}`}>{t.topReasons}</p>
                            </div>
                        </div>
                        
                        {/* Severity Breakdown */}
                        <div className="flex gap-2 flex-wrap mb-3">
                            <span className={`px-2 py-1 rounded text-xs ${getSeverityColor('high')}`}>
                                {t.high}: {stats.severityCounts.high}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${getSeverityColor('medium')}`}>
                                {t.medium}: {stats.severityCounts.medium}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${getSeverityColor('low')}`}>
                                {t.low}: {stats.severityCounts.low}
                            </span>
                        </div>

                        {/* Top Reasons */}
                        {stats.topReasons.length > 0 && (
                            <div className="mt-3">
                                <p className="font-semibold text-sm mb-2">{t.topReasons}:</p>
                                {stats.topReasons.map(([reason, count], idx) => (
                                    <div key={idx} className="flex justify-between text-xs mb-1">
                                        <span className="truncate">{idx + 1}. {reason}</span>
                                        <span className="font-bold ml-2">{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Search and Filters */}
                {blacklist.length > 0 && (
                    <div className="mt-4 space-y-3">
                        {/* Search Bar */}
                        <input
                            type="text"
                            placeholder={`🔍 ${t.name}, ${t.surname}, ${t.taxCode}, ${t.blacklistReason}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-red-500 text-base`}
                        />

                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {/* Severity Filter */}
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className={`px-3 py-2 rounded-lg border ${inputClass} text-sm`}
                            >
                                <option value="all">{t.all} ({t.severity})</option>
                                <option value="high">🔴 {t.high}</option>
                                <option value="medium">🟡 {t.medium}</option>
                                <option value="low">🔵 {t.low}</option>
                            </select>

                            {/* Expiry Filter */}
                            <select
                                value={expiryFilter}
                                onChange={(e) => setExpiryFilter(e.target.value)}
                                className={`px-3 py-2 rounded-lg border ${inputClass} text-sm`}
                            >
                                <option value="all">{t.all}</option>
                                <option value="permanent">♾️ {t.permanent}</option>
                                <option value="temporary">⏳ {t.temporary}</option>
                                <option value="expired">❌ {t.expired}</option>
                            </select>

                            {/* Sort By */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className={`px-3 py-2 rounded-lg border ${inputClass} text-sm`}
                            >
                                <option value="dateAdded">📅 {t.dateAdded}</option>
                                <option value="alphabetical">🔤 {t.alphabetical}</option>
                                <option value="bySeverity">⚠️ {t.bySeverity}</option>
                            </select>
                        </div>

                        {/* Bulk Actions */}
                        {filteredBlacklist.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                                <button
                                    onClick={toggleSelectAll}
                                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs sm:text-sm"
                                >
                                    {selectedItems.length === filteredBlacklist.length ? '☐' : '☑'} {t.selectMultiple}
                                </button>
                                {selectedItems.length > 0 && (
                                    <>
                                        <span className={`text-sm ${textClass}`}>
                                            {selectedItems.length} {t.selectedItems}
                                        </span>
                                        <button
                                            onClick={handleBulkRemove}
                                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm"
                                        >
                                            ↩️ {t.removeSelected}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Blacklist Items */}
            {filteredBlacklist.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {filteredBlacklist.map((item) => {
                        const expired = isExpired(item);
                        const severity = item.severity || 'medium';
                        
                        return (
                            <div
                                key={item.id}
                                className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 border-l-4 ${
                                    expired ? 'border-gray-500 opacity-60' : 
                                    severity === 'high' ? 'border-red-500' :
                                    severity === 'medium' ? 'border-yellow-500' :
                                    'border-blue-500'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    {/* Worker Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-3 mb-3">
                                            {/* Checkbox for bulk selection */}
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(item.id)}
                                                onChange={() => toggleSelectItem(item.id)}
                                                className="mt-1 w-5 h-5 cursor-pointer"
                                            />
                                            
                                            <span className="text-3xl sm:text-4xl flex-shrink-0">
                                                {expired ? '⏰' : '⚠️'}
                                            </span>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <h3 className={`text-lg sm:text-xl font-bold ${
                                                        expired ? 'text-gray-500' : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {item.nome} {item.cognome}
                                                    </h3>
                                                    
                                                    {/* Severity Badge */}
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(severity)}`}>
                                                        {severity === 'high' ? t.high : severity === 'medium' ? t.medium : t.low}
                                                    </span>

                                                    {/* Expiry Badge */}
                                                    {item.expiryDate && (
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                            expired ? 'bg-gray-500 text-white' : 
                                                            'bg-orange-500 text-white'
                                                        }`}>
                                                            {expired ? `❌ ${t.expired}` : `⏳ ${t.expiresOn}: ${formatDate(item.expiryDate)}`}
                                                        </span>
                                                    )}
                                                    {!item.expiryDate && (
                                                        <span className="px-2 py-1 rounded text-xs font-bold bg-purple-600 text-white">
                                                            ♾️ {t.permanent}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className={`text-sm sm:text-base ${textClass} mb-2`}>
                                                    <span className="font-semibold">{t.blacklistReason}:</span> {item.reason}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Additional Info */}
                                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm ${textClass}`}>
                                            {item.codiceFiscale && (
                                                <p className="truncate">
                                                    <span className="font-semibold">🆔 {t.taxCode}:</span> {item.codiceFiscale}
                                                </p>
                                            )}
                                            {item.numeroIdentita && (
                                                <p className="truncate">
                                                    <span className="font-semibold">📇 {t.idNumber}:</span> {item.numeroIdentita}
                                                </p>
                                            )}
                                            {item.telefono && (
                                                <p className="truncate">
                                                    <span className="font-semibold">📱 {t.phone}:</span> {item.telefono}
                                                </p>
                                            )}
                                            {item.email && (
                                                <p className="truncate">
                                                    <span className="font-semibold">📧 {t.email}:</span> {item.email}
                                                </p>
                                            )}
                                        </div>

                                        {/* Notes Preview */}
                                        {item.notes && item.notes.length > 0 && (
                                            <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                <p className={`text-xs ${textClass}`}>
                                                    📝 {item.notes.length} {t.notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <div className={`flex flex-wrap gap-3 text-xs ${textClass}`}>
                                                <span>📅 {formatDate(item.addedAt)}</span>
                                                {item.addedBy && <span>👤 {t.addedBy}: {item.addedBy}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex sm:flex-col gap-2">
                                        <button
                                            onClick={() => handleRemove(item.id, `${item.nome} ${item.cognome}`)}
                                            className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base whitespace-nowrap"
                                            title={t.secondChance}
                                        >
                                            ↩️ {t.secondChance}
                                        </button>
                                        
                                        {/* Notes button */}
                                        <button
                                            onClick={() => setShowNotesModal(item)}
                                            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                                            title={t.notes}
                                        >
                                            📝 {t.notes}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={`${cardClass} rounded-xl shadow-lg p-8 sm:p-12 text-center`}>
                    <p className="text-4xl sm:text-5xl mb-4">✅</p>
                    <p className={`${textClass} text-base sm:text-lg font-semibold mb-2`}>
                        {searchTerm ? t.noSheets : t.noBlacklist}
                    </p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                        >
                            ✗ {t.clear}
                        </button>
                    )}
                </div>
            )}

            {/* Notes Modal */}
            {showNotesModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => setShowNotesModal(null)}
                >
                    <div 
                        className={`${cardClass} rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold">
                                📝 {t.notes} - {showNotesModal.nome} {showNotesModal.cognome}
                            </h3>
                            <button
                                onClick={() => setShowNotesModal(null)}
                                className="text-2xl hover:text-red-500 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Display Notes/History */}
                        <div className="space-y-3">
                            <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <p className="font-semibold mb-1">{t.blacklistReason}:</p>
                                <p className={textClass}>{showNotesModal.reason}</p>
                            </div>

                            {showNotesModal.notes && showNotesModal.notes.length > 0 ? (
                                showNotesModal.notes.map((note, idx) => (
                                    <div key={idx} className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        <p className={`text-sm ${textClass} mb-1`}>
                                            👤 {note.addedBy} - 📅 {formatDate(note.addedAt)}
                                        </p>
                                        <p>{note.text}</p>
                                        {note.signature && (
                                            <p className={`text-xs ${textClass} mt-1 italic`}>
                                                ✍️ {note.signature}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className={`${textClass} text-center py-4`}>{t.noBlacklist}</p>
                            )}
                        </div>

                        <button
                            onClick={() => setShowNotesModal(null)}
                            className="mt-4 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                        >
                            {t.close}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};