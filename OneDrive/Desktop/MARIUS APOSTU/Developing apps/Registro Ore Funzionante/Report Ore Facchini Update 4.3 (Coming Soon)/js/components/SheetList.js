// Sheet List Component - 5 LINGUE COMPLETE
const SheetList = ({ sheets, onSelectSheet, onDeleteSheet, onArchiveSheet, darkMode, language = 'it', companyLogo }) => {
    const [filter, setFilter] = React.useState('active');
    const [searchTerm, setSearchTerm] = React.useState('');
    
    const t = translations[language];
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white' : 
        'bg-white border-gray-300 text-gray-900';

    // Filter and search sheets
    const filteredSheets = React.useMemo(() => {
        let filtered = sheets;
        
        // Apply filter
        if (filter === 'active') {
            filtered = filtered.filter(s => !s.archived && s.status !== 'completed');
        } else if (filter === 'archived') {
            filtered = filtered.filter(s => s.archived);
        } else if (filter === 'completed') {
            // 🔧 FIX: Escludere i fogli archiviati dai completati
            filtered = filtered.filter(s => s.status === 'completed' && !s.archived);
        }
        
        // Apply search
        if (searchTerm) {
            filtered = filtered.filter(s => 
                s.titoloAzienda?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.responsabile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.location?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        return filtered;
    }, [sheets, filter, searchTerm]);

    // Get status badge
    const getStatusBadge = (sheet) => {
        if (sheet.archived) {
            return <span className="px-2 py-1 bg-gray-500 text-white rounded text-xs font-semibold">{t.archived}</span>;
        }
        if (sheet.status === 'completed') {
            return <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold">{t.completed}</span>;
        }
        return <span className="px-2 py-1 bg-yellow-600 text-white rounded text-xs font-semibold">{t.draft}</span>;
    };

    return (
        <div className="space-y-4">
            {/* Filters and Search */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                {/* Filter Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                            filter === 'active'
                                ? 'bg-indigo-600 text-white'
                                : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        📋 {t.active}
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                            filter === 'completed'
                                ? 'bg-green-600 text-white'
                                : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        ✅ {t.completed}
                    </button>
                    <button
                        onClick={() => setFilter('archived')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                            filter === 'archived'
                                ? 'bg-gray-600 text-white'
                                : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        📦 {t.archived}
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                            filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        📚 {t.all}
                    </button>
                </div>

                {/* Search Bar */}
                <input
                    type="text"
                    placeholder={`🔍 ${t.company}, ${t.responsible}, ${t.location}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 text-base`}
                />
            </div>

            {/* Results Count */}
            <p className={`${textClass} text-sm sm:text-base px-2`}>
                {filteredSheets.length} {filteredSheets.length === 1 ? t.sheets.slice(0, -1) : t.sheets.toLowerCase()}
            </p>

            {/* Sheets List */}
            {filteredSheets.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {filteredSheets.map((sheet) => (
                        <div
                            key={sheet.id}
                            className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow`}
                        >
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                {/* Sheet Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <h3 className="text-lg sm:text-xl font-bold truncate">
                                            {sheet.titoloAzienda || t.company}
                                        </h3>
                                        {getStatusBadge(sheet)}
                                    </div>
                                    
                                    <div className={`space-y-1 text-sm ${textClass}`}>
                                        <p>📅 {formatDate(sheet.data)}</p>
                                        <p>👤 {sheet.responsabile}</p>
                                        {sheet.location && <p>📍 {sheet.location}</p>}
                                        <p>👷 {sheet.lavoratori?.length || 0} {t.workers.toLowerCase()}</p>
                                        {sheet.firmaResponsabile && (
                                            <p className="text-green-600 dark:text-green-400 font-semibold">
                                                ✍️ {t.responsibleSignature}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-row sm:flex-col gap-2 sm:justify-start">
<button
    onClick={() => onSelectSheet(sheet)}
    className={`flex-1 sm:flex-none px-4 py-2 ${
        sheet.status === 'completed' 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-indigo-600 hover:bg-indigo-700'
    } text-white rounded-lg font-semibold transition-colors text-sm sm:text-base`}
>
    {sheet.status === 'completed' ? '👁️ ' + t.view : '✏️ ' + t.edit}
</button>
                                    
                                    {sheet.status === 'completed' && (
                                        <button
                                            onClick={() => generatePDF(sheet, companyLogo)}
                                            className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                                        >
                                            📄 PDF
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => onArchiveSheet(sheet.id, !sheet.archived)}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                                    >
                                        {sheet.archived ? '↩️' : '📦'}
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            if (confirm(`${t.confirm}?`)) {
                                                onDeleteSheet(sheet.id);
                                            }
                                        }}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`${cardClass} rounded-xl shadow-lg p-8 sm:p-12 text-center`}>
                    <p className="text-4xl sm:text-5xl mb-4">📋</p>
                    <p className={`${textClass} text-base sm:text-lg`}>
                        {searchTerm ? `${t.noSheets}` : `${t.noSheets}`}
                    </p>
                </div>
            )}
        </div>
    );
};
