// Blacklist Component - 5 LINGUE COMPLETE
const Blacklist = ({ blacklist, removeFromBlacklist, darkMode, language = 'it' }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const t = translations[language];

    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 
        'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

    // Filter blacklist
    const filteredBlacklist = React.useMemo(() => {
        if (!searchTerm) return blacklist;
        
        return blacklist.filter(item => 
            item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.cognome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.codiceFiscale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.numeroIdentita?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.reason?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [blacklist, searchTerm]);

    const handleRemove = async (id, name) => {
        if (!confirm(`${t.confirm}? ${t.removeFromBlacklist}: ${name}`)) return;
        
        await removeFromBlacklist(id);
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
                </div>

                {/* Search Bar */}
                {blacklist.length > 0 && (
                    <input
                        type="text"
                        placeholder={`🔍 ${t.name}, ${t.surname}, ${t.taxCode}, ${t.reason}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-red-500 text-base`}
                    />
                )}
            </div>

            {/* Blacklist Items */}
            {filteredBlacklist.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {filteredBlacklist.map((item) => (
                        <div
                            key={item.id}
                            className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-red-500`}
                        >
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                {/* Worker Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="text-3xl sm:text-4xl flex-shrink-0">⚠️</span>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400 mb-1">
                                                {item.nome} {item.cognome}
                                            </h3>
                                            <p className={`text-sm sm:text-base ${textClass} mb-2`}>
                                                <span className="font-semibold">{t.reason}:</span> {item.reason}
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
                                </div>
                            </div>
                        </div>
                    ))}
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
        </div>
    );
};
