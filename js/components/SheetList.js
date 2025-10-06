// Sheet List Component
const SheetList = ({ 
    sheets, 
    onSelectSheet, 
    onDeleteSheet, 
    onArchiveSheet, 
    darkMode, 
    language = 'it',
    companyLogo 
}) => {
    const t = translations[language];
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all'); // all, draft, completed, archived
    const [sortBy, setSortBy] = React.useState('date'); // date, company, workers
    
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white' : 
        'bg-white border-gray-300 text-gray-900';

    const filteredSheets = React.useMemo(() => {
        let result = [...sheets];
        
        // Filter by status
        if (filterStatus === 'draft') {
            result = result.filter(s => s.status !== 'completed' && !s.archived);
        } else if (filterStatus === 'completed') {
            result = result.filter(s => s.status === 'completed' && !s.archived);
        } else if (filterStatus === 'archived') {
            result = result.filter(s => s.archived);
        } else if (filterStatus === 'all') {
            result = result.filter(s => !s.archived);
        }
        
        // Search
        if (searchTerm) {
            result = result.filter(s => 
                s.titoloAzienda?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.responsabile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.location?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Sort
        result.sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.data) - new Date(a.data);
            } else if (sortBy === 'company') {
                return (a.titoloAzienda || '').localeCompare(b.titoloAzienda || '');
            } else if (sortBy === 'workers') {
                return (b.lavoratori?.length || 0) - (a.lavoratori?.length || 0);
            }
            return 0;
        });
        
        return result;
    }, [sheets, searchTerm, filterStatus, sortBy]);

    return (
        <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                {companyLogo && (
                    <img src={companyLogo} alt="Logo" className="h-12 w-12 object-contain" />
                )}
                <h2 className="text-2xl font-bold flex-1">
                    📋 Fogli Ore Registrati ({filteredSheets.length})
                </h2>
            </div>

            {/* Filters and Search */}
            <div className="space-y-4 mb-6">
                {/* Search Bar */}
                <input
                    type="text"
                    placeholder="🔍 Cerca per azienda, responsabile o località..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                />
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            filterStatus === 'all'
                                ? 'bg-indigo-600 text-white'
                                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        Tutti
                    </button>
                    <button
                        onClick={() => setFilterStatus('draft')}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            filterStatus === 'draft'
                                ? 'bg-yellow-600 text-white'
                                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        📝 Bozze
                    </button>
                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            filterStatus === 'completed'
                                ? 'bg-green-600 text-white'
                                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        ✅ Completati
                    </button>
                    <button
                        onClick={() => setFilterStatus('archived')}
                        className={`px-4 py-2 rounded-lg font-semibold ${
                            filterStatus === 'archived'
                                ? 'bg-gray-600 text-white'
                                : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        📦 Archiviati
                    </button>
                </div>
                
                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                >
                    <option value="date">Ordina per Data (più recenti)</option>
                    <option value="company">Ordina per Azienda (A-Z)</option>
                    <option value="workers">Ordina per N. Lavoratori</option>
                </select>
            </div>

            {/* Sheets List */}
            <div className="space-y-3">
                {filteredSheets.length === 0 ? (
                    <div className="text-center py-12">
                        <p className={`text-lg ${textClass}`}>
                            {searchTerm ? '🔍 Nessun risultato trovato' : '📋 Nessun foglio ancora registrato'}
                        </p>
                    </div>
                ) : (
                    filteredSheets.map(sheet => (
                        <div
                            key={sheet.id}
                            className={`p-4 rounded-lg border ${
                                darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                            } transition-colors ${sheet.archived ? 'opacity-60' : ''}`}
                        >
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-bold text-lg">
                                            {sheet.titoloAzienda || 'Senza titolo'}
                                        </h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            sheet.status === 'completed' 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                        }`}>
                                            {sheet.status === 'completed' ? '✅ Completato' : '📝 Bozza'}
                                        </span>
                                        {sheet.archived && (
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-500 text-white">
                                                📦 Archiviato
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className={`text-sm ${textClass} space-y-1`}>
                                        <p>📅 {formatDate(sheet.data)}</p>
                                        {sheet.responsabile && <p>👤 {sheet.responsabile}</p>}
                                        {sheet.location && <p>📍 {sheet.location}</p>}
                                        <p>👷 {sheet.lavoratori?.length || 0} lavoratori registrati</p>
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 mobile-buttons">
                                    <button
                                        onClick={() => onSelectSheet(sheet)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors touch-button"
                                    >
                                        ✏️ Modifica
                                    </button>
                                    
                                    <button
                                        onClick={() => generateShareLink(sheet.id)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors touch-button"
                                    >
                                        🔗 Link
                                    </button>
                                    
                                    {!sheet.archived ? (
                                        <button
                                            onClick={() => onArchiveSheet(sheet.id, true)}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors touch-button"
                                        >
                                            📦 Archivia
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onArchiveSheet(sheet.id, false)}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors touch-button"
                                        >
                                            ↩️ Ripristina
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => {
                                            if (confirm(`Eliminare definitivamente "${sheet.titoloAzienda}"?`)) {
                                                onDeleteSheet(sheet.id);
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors touch-button"
                                    >
                                        🗑️ Elimina
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
