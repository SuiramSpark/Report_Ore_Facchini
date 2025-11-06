// This file runs in-browser without bundler; assume React, translations and utils are global
// React is available globally via <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
// WeatherWidget is exposed as window.WeatherWidget
// utils functions (getStatusBadge, formatDate, generatePDF) are global from js/utils.js
const { useState, useMemo } = React;
const WeatherWidget = window.WeatherWidget;
const translations = window.translations;
const { getStatusBadge, formatDate, generatePDF } = window;

if (!window.SheetList) {
// Sheet List Component - robust version with local state and safe lookups
const SheetList = ({ sheets = [], onSelectSheet = () => {}, onDeleteSheet = () => {}, onArchiveSheet = () => {}, darkMode = false, language = 'it', companyLogo }) => {
    // Usa la funzione globale per normalizzare nome e cognome
    const normalizeWorkerName = window.normalizeWorkerName;
    // Local UI state
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Safe translations lookup (fall back to Italian or empty object)
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

    // Theming classes
    const inputClass = darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800';
    const textClass = darkMode ? 'text-gray-200' : 'text-gray-700';
    const cardClass = darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100';

    // Compute filtered sheets safely
    const filteredSheets = useMemo(() => {
        if (!sheets || !Array.isArray(sheets)) return [];
        let arr = sheets.slice();

        if (filter === 'active') {
            // Attivi: solo fogli non completati E non archiviati
            arr = arr.filter(s => s.status !== 'completed' && !s.archived);
        } else if (filter === 'completed') {
            // Completati: solo fogli completati E non archiviati
            arr = arr.filter(s => s.status === 'completed' && !s.archived);
        } else if (filter === 'archived') {
            // Archiviati: solo fogli archiviati (indipendentemente dallo stato)
            arr = arr.filter(s => !!s.archived);
        }

        if (searchTerm && searchTerm.trim()) {
            const q = searchTerm.trim().toLowerCase().replace(/\s+/g, ' ');
            arr = arr.filter(s => {
                // Normalizza responsabile (nome+cognome)
                const normResp = normalizeWorkerName(s.responsabile, '');
                return (
                    (s.titoloAzienda || '').toLowerCase().includes(q) ||
                    normResp.includes(q) ||
                    ((s.location || s.localita || '') + '').toLowerCase().includes(q) ||
                    ((s.indirizzoEvento || '') + '').toLowerCase().includes(q)
                );
            });
        }

        return arr;
    }, [sheets, filter, searchTerm]);

    return (
        <div>
            {/* External title for Sheet List */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 mb-4`}>
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    📚 {t.sheets || t.sheetManagement || 'Sheets'}
                </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                        filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    onClick={() => setFilter('all')}
                >
                    📚 {t.all || 'All'}
                </button>
                <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                        filter === 'active'
                            ? 'bg-blue-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    onClick={() => setFilter('active')}
                >
                    🟢 {t.active || 'Active'}
                </button>
                <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                        filter === 'completed'
                            ? 'bg-blue-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    onClick={() => setFilter('completed')}
                >
                    ✅ {t.completed || 'Completati'}
                </button>
                <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                        filter === 'archived'
                            ? 'bg-blue-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    onClick={() => setFilter('archived')}
                >
                    📦 {t.archived || 'Archived'}
                </button>
                <input
                    type="text"
                    placeholder={`🔍 ${t.searchSheets || 'Cerca per azienda, responsabile, località, indirizzo'}...`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500 text-base`}
                />
            </div>
            <p className={`${textClass} text-sm sm:text-base px-2`}>
                {filteredSheets.length} {filteredSheets.length === 1 ? (t.sheets ? t.sheets.slice(0,-1) : 'Sheet') : (t.sheets ? t.sheets.toLowerCase() : 'sheets')}
            </p>
            {/* Sheets List */}
            {filteredSheets.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {filteredSheets.map(sheet => {
                        // Determina colore bordo sinistro basato su stato
                        let borderColor = 'border-l-yellow-500'; // Default: draft
                        if (sheet.archived || sheet.status === 'archived') {
                            borderColor = 'border-l-gray-500'; // Archiviati: grigio
                        } else if (sheet.status === 'completed') {
                            borderColor = 'border-l-green-500'; // Completati: verde
                        }
                        
                        return (
                            <div
                                key={sheet.id}
                                className={`${cardClass} rounded-xl shadow-lg border-l-4 ${borderColor} p-3 sm:p-4 hover:shadow-xl transition-all`}
                            >
                                <div className="flex flex-col sm:flex-row justify-between gap-3">
                                    {/* Sheet Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <h3 className="text-base sm:text-lg font-bold truncate">
                                                {sheet.titoloAzienda || t.company || 'Company'}
                                            </h3>
                                            {typeof getStatusBadge === 'function' ? getStatusBadge(sheet) : null}
                                        </div>
                                        <div className={`space-y-0.5 text-xs sm:text-sm ${textClass}`}>
                                            <p>📅 {typeof formatDate === 'function' ? formatDate(sheet.data) : (sheet.data || '')}</p>
                                            <p>👤 {sheet.responsabile}</p>
                                            {sheet.location && <p>📍 {sheet.location}</p>}
                                            <p>👷 {sheet.lavoratori?.length || 0} {(t.workers || 'workers').toLowerCase()}</p>
                                            {sheet.firmaResponsabile && (
                                                <p className="text-green-600 dark:text-green-400 font-semibold">
                                                    ✍️ {t.responsibleSignature || 'Signature'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex flex-row sm:flex-col gap-2 sm:justify-start">
                                        <button
                                            onClick={() => onSelectSheet(sheet)}
                                            className={`flex-1 sm:flex-none px-3 py-1.5 ${
                                                sheet.status === 'completed'
                                                    ? 'bg-blue-600 hover:bg-blue-700'
                                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                            } text-white rounded-lg font-semibold transition-colors text-xs sm:text-sm`}
                                        >
                                            {sheet.status === 'completed' ? '👁️ ' + (t.view || 'View') : '✏️ ' + (t.edit || 'Edit')}
                                        </button>
                                        {sheet.status === 'completed' && typeof generatePDF === 'function' && (
                                            <button
                                                onClick={() => generatePDF(sheet, companyLogo)}
                                                className="flex-1 sm:flex-none px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-xs sm:text-sm"
                                            >
                                                📄 PDF
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onArchiveSheet(sheet.id, !sheet.archived)}
                                            className="flex-1 sm:flex-none px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors text-xs sm:text-sm"
                                        >
                                            {sheet.archived ? '↩️' : '📦'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`${t.confirm || 'Confirm'}?`)) {
                                                    onDeleteSheet(sheet.id);
                                                }
                                            }}
                                            className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-xs sm:text-sm"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                {/* Static Weather Summary (if available) */}
                                {sheet.weatherStatic ? (
                                    <div className="my-2 flex items-center gap-3 text-sm" title={t.weatherDetails}>
                                        <span style={{fontSize:'1.7em'}} aria-label={t.weatherIcon}>
                                            {(() => {
                                                const code = sheet.weatherStatic.weathercode;
                                                if (code === 0) return '☀️';
                                                if (code >= 1 && code <= 3) return '🌤️';
                                                if ((code >= 45 && code <= 48)) return '🌫️';
                                                if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️';
                                                if (code >= 71 && code <= 77) return '❄️';
                                                if (code === 95 || (code >= 96 && code <= 99)) return '⛈️';
                                                return '🌡️';
                                            })()}
                                        </span>
                                        <span>
                                            <b>{t.weatherHistorical || 'Meteo storico'}:</b> 
                                            <span title={t.weatherMax}>{typeof sheet.weatherStatic.temp_max === 'number' ? `🌡️ ${Math.round(sheet.weatherStatic.temp_max)}°C` : '--'}</span>
                                            {typeof sheet.weatherStatic.temp_min === 'number' ? <span title={t.weatherMin}>{` / ${Math.round(sheet.weatherStatic.temp_min)}°C`}</span> : ''}
                                            {typeof sheet.weatherStatic.precipitation === 'number' ? <span title={t.weatherRain}>{` • 🌧️ ${sheet.weatherStatic.precipitation}mm`}</span> : ''}
                                            <span className="ml-2 opacity-70" title="Codice meteo">{(() => {
                                                const code = sheet.weatherStatic.weathercode;
                                                if (code === 0) return t.weatherClear;
                                                if (code >= 1 && code <= 3) return t.weatherCloud;
                                                if ((code >= 45 && code <= 48)) return 'Nebbia';
                                                if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return t.weatherRain;
                                                if (code >= 71 && code <= 77) return t.weatherSnow;
                                                if (code === 95 || (code >= 96 && code <= 99)) return t.weatherThunder;
                                                return t.weatherUnknown;
                                            })()}</span>
                                        </span>
                                    </div>
                                ) : (sheet.localita && WeatherWidget && (
                                    <div className="my-2">
                                        <WeatherWidget location={sheet.localita} darkMode={darkMode} />
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={`${cardClass} rounded-xl shadow-lg p-8 sm:p-12 text-center`}>
                    <p className="text-4xl sm:text-5xl mb-4">📋</p>
                    <p className={`${textClass} text-base sm:text-lg`}>
                        {searchTerm ? `${t.noSheets || 'No sheets found'}` : `${t.noSheets || 'No sheets found'}`}
                    </p>
                </div>
            )}
        </div>
    );
}

window.SheetList = SheetList;

}
