// Sheet List Component - FULLY FUNCTIONAL
const SheetList = ({
    sheets = [],
    onSelectSheet,
    onDeleteSheet,
    onArchiveSheet,
    darkMode,
    language = 'it',
    companyLogo
}) => {
    const t = translations[language];
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const buttonBase = "px-3 py-2 rounded font-semibold transition-colors focus:outline-none";

    // Sorting: Most recent first (by date, fallback to createdAt)
    const sortedSheets = [...sheets].sort((a, b) => {
        const dateA = new Date(a.data || a.createdAt);
        const dateB = new Date(b.data || b.createdAt);
        return dateB - dateA;
    });

    return (
        <div className="space-y-5">
            {sortedSheets.length === 0 ? (
                <div className={`${cardClass} p-8 rounded-lg shadow-xl text-center max-w-xl mx-auto`}>
                    <h2 className="text-xl font-bold mb-2">{t.noWorkers}</h2>
                    <p className={textClass}>Clicca su "Crea Nuovo Foglio Ore" per iniziare.</p>
                </div>
            ) : (
                sortedSheets.map((sheet) => (
                    <div
                        key={sheet.id}
                        className={`${cardClass} rounded-xl shadow flex flex-col md:flex-row md:items-center justify-between p-4 gap-4`}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                {companyLogo && (
                                    <img src={companyLogo} alt="Logo" className="h-8 w-8 object-contain rounded" />
                                )}
                                <span className="text-lg font-bold break-all">{sheet.titoloAzienda || 'Senza titolo'}</span>
                                {sheet.archived && (
                                    <span className="ml-2 text-gray-400 font-semibold">📦 {t.archive}</span>
                                )}
                            </div>
                            <div className={`text-sm ${textClass}`}>
                                {formatDate(sheet.data)} • {sheet.lavoratori?.length || 0} lavoratori
                                {sheet.status === 'completed' ? (
                                    <span className="ml-2 text-green-600 font-semibold">✅ Completato</span>
                                ) : (
                                    <span className="ml-2 text-yellow-600 font-semibold">📝 Bozza</span>
                                )}
                            </div>
                            {sheet.note && (
                                <div className={`mt-1 text-xs italic ${textClass}`}>{sheet.note}</div>
                            )}
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end md:justify-normal">
                            <button
                                onClick={() => onSelectSheet(sheet)}
                                className={`${buttonBase} bg-blue-600 text-white hover:bg-blue-700`}
                                title="Visualizza / Modifica"
                            >
                                👁️ {t.edit}
                            </button>
                            <button
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            sheet.archived
                                                ? `Vuoi ripristinare il foglio "${sheet.titoloAzienda || 'Senza titolo'}"?`
                                                : `Vuoi archiviare il foglio "${sheet.titoloAzienda || 'Senza titolo'}"?`
                                        )
                                    ) {
                                        onArchiveSheet(sheet.id, !sheet.archived);
                                    }
                                }}
                                className={`${buttonBase} ${sheet.archived ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-500 hover:bg-gray-700'} text-white`}
                                title={sheet.archived ? t.restore : t.archive}
                            >
                                {sheet.archived ? '↩️ ' + t.restore : '📦 ' + t.archive}
                            </button>
                            <button
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            `Sei sicuro di voler eliminare il foglio "${sheet.titoloAzienda || 'Senza titolo'}"? Questa azione è irreversibile.`
                                        )
                                    ) {
                                        onDeleteSheet(sheet.id);
                                    }
                                }}
                                className={`${buttonBase} bg-red-600 hover:bg-red-700 text-white`}
                                title={t.delete}
                            >
                                🗑️ {t.delete}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
