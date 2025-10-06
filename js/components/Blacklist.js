// Blacklist Component
const Blacklist = ({ blacklist, removeFromBlacklist, darkMode, language = 'it' }) => {
    const t = translations[language];
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';

    return (
        <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
            <h2 className="text-2xl font-bold mb-6">
                🚫 {t.blacklist} ({blacklist.length})
            </h2>
            
            {blacklist.length === 0 ? (
                <div className="text-center py-8">
                    <p className={`text-lg ${textClass}`}>
                        ✅ Nessun lavoratore in blacklist
                    </p>
                    <p className={`text-sm ${textClass} mt-2`}>
                        I lavoratori problematici appariranno qui
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {blacklist.map(bl => (
                        <div 
                            key={bl.id} 
                            className={`border-2 border-red-500 rounded-lg p-4 ${
                                darkMode ? 'bg-red-900/20' : 'bg-red-50'
                            }`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className={`font-bold text-lg ${
                                            darkMode ? 'text-red-300' : 'text-red-700'
                                        }`}>
                                            {bl.nome} {bl.cognome}
                                        </p>
                                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                                            BLACKLIST
                                        </span>
                                    </div>
                                    
                                    <div className={`space-y-1 text-sm ${textClass}`}>
                                        {bl.codiceFiscale && (
                                            <p>
                                                <strong>CF:</strong> {bl.codiceFiscale}
                                            </p>
                                        )}
                                        {bl.numeroIdentita && (
                                            <p>
                                                <strong>CI:</strong> {bl.numeroIdentita}
                                            </p>
                                        )}
                                        {bl.telefono && (
                                            <p>
                                                <strong>Tel:</strong> {bl.telefono}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {bl.reason && (
                                        <div className={`mt-3 p-2 rounded ${
                                            darkMode ? 'bg-gray-700' : 'bg-white'
                                        }`}>
                                            <p className="text-sm">
                                                <strong>{t.reason}:</strong> {bl.reason}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <p className={`text-xs ${textClass} mt-2`}>
                                        Aggiunto il: {formatDateTime(bl.addedAt)}
                                    </p>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        if (confirm(`Rimuovere ${bl.nome} ${bl.cognome} dalla blacklist?`)) {
                                            removeFromBlacklist(bl.id);
                                        }
                                    }}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors touch-button"
                                >
                                    ✓ {t.removeFromBlacklist}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
