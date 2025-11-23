// This file runs in-browser without bundler; assume React, translations and utils are global
// React is available globally via <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
// WeatherWidget is exposed as window.WeatherWidget
// utils functions (getStatusBadge, formatDate, generatePDF) are global from js/utils.js
const { useState, useMemo } = React;
const WeatherWidget = window.WeatherWidget;
const translations = window.translations;
const { getStatusBadge, formatDate, generatePDF } = window;

if (!window.SheetList) {
// Sheet List Component - 🚀 OTTIMIZZATO con paginazione lazy load
const SheetList = ({ sheets = [], onSelectSheet = () => {}, onDeleteSheet = () => {}, onArchiveSheet = () => {}, darkMode = false, language = 'it', companyLogo, companies = [], activeCompanyId, currentUser }) => {
    // Usa la funzione globale per normalizzare nome e cognome
    const normalizeWorkerName = window.normalizeWorkerName;
    // Local UI state
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [selectedResponsible, setSelectedResponsible] = useState('');
    const [selectedWorker, setSelectedWorker] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortBy, setSortBy] = useState('dateNewest'); // dateNewest, dateOldest, sheetNumber, company
    
    // 🚀 Get active company logo
    const activeCompanyLogo = useMemo(() => {
        if (!activeCompanyId || companies.length === 0) return companyLogo;
        const activeCompany = companies.find(c => c.id === activeCompanyId);
        return activeCompany?.logoURL || companyLogo;
    }, [companies, activeCompanyId, companyLogo]);
    
    // 🚀 OTTIMIZZAZIONE: Paginazione lazy load (20 items per pagina)
    const [displayLimit, setDisplayLimit] = useState(20);
    const ITEMS_PER_PAGE = 20;

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

        // 🔐 FILTRO BASATO SU RUOLI
        if (currentUser) {
            const userRole = currentUser.role;
            
            // Admin, manager, responsabile: vedono tutto
            if (userRole === 'admin' || userRole === 'manager' || userRole === 'responsabile') {
                // Nessun filtro, vedono tutti i fogli
            } else if (userRole === 'worker') {
                // Worker: vede SOLO fogli dove appare come lavoratore
                const workerFullName = normalizeWorkerName(currentUser.name || '', currentUser.surname || '');
                arr = arr.filter(s => {
                    if (!s.lavoratori || !Array.isArray(s.lavoratori)) return false;
                    return s.lavoratori.some(lav => {
                        const lavName = normalizeWorkerName(lav.nome || '', lav.cognome || '');
                        return lavName === workerFullName;
                    });
                });
            }
        }

        // Filtro per stato (all, active, completed, archived)
        if (filter === 'active') {
            arr = arr.filter(s => s.status !== 'completed' && !s.archived);
        } else if (filter === 'completed') {
            arr = arr.filter(s => s.status === 'completed' && !s.archived);
        } else if (filter === 'archived') {
            arr = arr.filter(s => !!s.archived);
        }

        // 🆕 Filtro avanzato: Responsabile
        if (selectedResponsible && selectedResponsible !== '') {
            arr = arr.filter(s => {
                const normResp = normalizeWorkerName(s.responsabile || '', '');
                return normResp === selectedResponsible;
            });
        }

        // 🆕 Filtro avanzato: Lavoratore
        if (selectedWorker && selectedWorker !== '') {
            arr = arr.filter(s => {
                if (!s.lavoratori || !Array.isArray(s.lavoratori)) return false;
                return s.lavoratori.some(lav => {
                    const lavName = normalizeWorkerName(lav.nome || '', lav.cognome || '');
                    return lavName === selectedWorker;
                });
            });
        }

        // 🆕 Filtro avanzato: Intervallo date
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            arr = arr.filter(s => {
                const sheetDate = s.data ? new Date(s.data) : null;
                return sheetDate && sheetDate >= fromDate;
            });
        }
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            arr = arr.filter(s => {
                const sheetDate = s.data ? new Date(s.data) : null;
                return sheetDate && sheetDate <= toDate;
            });
        }

        // Ricerca testuale
        if (searchTerm && searchTerm.trim()) {
            const q = searchTerm.trim().toLowerCase().replace(/\s+/g, ' ');
            arr = arr.filter(s => {
                const normResp = normalizeWorkerName(s.responsabile, '');
                const sheetNumStr = s.sheetNumber ? String(s.sheetNumber).padStart(3, '0') : '';
                const searchNum = q.replace('#', '');
                
                // Cerca anche nei nomi dei lavoratori
                const workerMatch = (s.lavoratori || []).some(lav => {
                    const lavName = normalizeWorkerName(lav.nome || '', lav.cognome || '');
                    return lavName.includes(q);
                });
                
                return (
                    (s.titoloAzienda || '').toLowerCase().includes(q) ||
                    normResp.includes(q) ||
                    ((s.location || s.localita || '') + '').toLowerCase().includes(q) ||
                    ((s.indirizzoEvento || '') + '').toLowerCase().includes(q) ||
                    sheetNumStr.includes(searchNum) ||
                    String(s.sheetNumber || '').includes(searchNum) ||
                    workerMatch
                );
            });
        }

        // 🆕 Ordinamento
        if (sortBy === 'dateNewest') {
            arr.sort((a, b) => {
                const dateA = a.data ? new Date(a.data) : new Date(0);
                const dateB = b.data ? new Date(b.data) : new Date(0);
                return dateB - dateA; // Più recente prima
            });
        } else if (sortBy === 'dateOldest') {
            arr.sort((a, b) => {
                const dateA = a.data ? new Date(a.data) : new Date(0);
                const dateB = b.data ? new Date(b.data) : new Date(0);
                return dateA - dateB; // Più vecchio prima
            });
        } else if (sortBy === 'sheetNumber') {
            arr.sort((a, b) => {
                const numA = a.sheetNumber || 0;
                const numB = b.sheetNumber || 0;
                return numB - numA; // Numero più alto prima
            });
        } else if (sortBy === 'company') {
            arr.sort((a, b) => {
                const compA = (a.titoloAzienda || '').toLowerCase();
                const compB = (b.titoloAzienda || '').toLowerCase();
                return compA.localeCompare(compB);
            });
        }

        return arr;
    }, [sheets, filter, searchTerm, currentUser, selectedResponsible, selectedWorker, dateFrom, dateTo, sortBy]);
    
    // 🚀 Displayed sheets (con limite paginazione)
    const displayedSheets = useMemo(() => {
        return filteredSheets.slice(0, displayLimit);
    }, [filteredSheets, displayLimit]);
    
    // 🆕 Lista unica di responsabili e lavoratori per filtri dropdown
    const uniqueResponsibles = useMemo(() => {
        if (!sheets || !Array.isArray(sheets)) return [];
        const responsibles = new Set();
        sheets.forEach(s => {
            if (s.responsabile) {
                const normResp = normalizeWorkerName(s.responsabile, '');
                if (normResp) responsibles.add(normResp);
            }
        });
        return Array.from(responsibles).sort();
    }, [sheets]);

    const uniqueWorkers = useMemo(() => {
        if (!sheets || !Array.isArray(sheets)) return [];
        const workers = new Set();
        sheets.forEach(s => {
            if (s.lavoratori && Array.isArray(s.lavoratori)) {
                s.lavoratori.forEach(lav => {
                    const lavName = normalizeWorkerName(lav.nome || '', lav.cognome || '');
                    if (lavName) workers.add(lavName);
                });
            }
        });
        return Array.from(workers).sort();
    }, [sheets]);
    
    // Funzione per azzerare tutti i filtri avanzati
    const clearAdvancedFilters = () => {
        setSelectedResponsible('');
        setSelectedWorker('');
        setDateFrom('');
        setDateTo('');
        setSortBy('dateNewest');
    };
    
    // Funzione per caricare altri items
    const loadMore = () => {
        setDisplayLimit(prev => prev + ITEMS_PER_PAGE);

    };
    
    // Reset limit quando cambiano filtri
    React.useEffect(() => {
        setDisplayLimit(ITEMS_PER_PAGE);
    }, [filter, searchTerm]);

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
            
            {/* 🆕 Advanced Filters Toggle Button */}
            <div className="mb-4 flex gap-2">
                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                        showAdvancedFilters
                            ? 'bg-indigo-600 text-white'
                            : darkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                >
                    🔧 {t.advancedFilters || 'Filtri Avanzati'} {showAdvancedFilters ? '▲' : '▼'}
                </button>
                {(selectedResponsible || selectedWorker || dateFrom || dateTo || sortBy !== 'dateNewest') && (
                    <button
                        onClick={clearAdvancedFilters}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                            darkMode
                                ? 'bg-red-700 hover:bg-red-600 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                    >
                        ❌ {t.clearFilters || 'Azzera Filtri'}
                    </button>
                )}
            </div>

            {/* 🆕 Advanced Filters Panel */}
            {showAdvancedFilters && (
                <div className={`${cardClass} rounded-xl shadow-lg p-4 mb-4`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Filtro Responsabile */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${textClass}`}>
                                👤 {t.filterByResponsible || 'Filtra per responsabile'}
                            </label>
                            <select
                                value={selectedResponsible}
                                onChange={e => setSelectedResponsible(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                            >
                                <option value="">{t.allResponsibles || 'Tutti i responsabili'}</option>
                                {uniqueResponsibles.map(resp => (
                                    <option key={resp} value={resp}>{resp}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro Lavoratore */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${textClass}`}>
                                👷 {t.filterByWorker || 'Filtra per lavoratore'}
                            </label>
                            <select
                                value={selectedWorker}
                                onChange={e => setSelectedWorker(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                            >
                                <option value="">{t.allWorkers || 'Tutti i lavoratori'}</option>
                                {uniqueWorkers.map(worker => (
                                    <option key={worker} value={worker}>{worker}</option>
                                ))}
                            </select>
                        </div>

                        {/* Ordinamento */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${textClass}`}>
                                🔀 {t.sortBy || 'Ordina per'}
                            </label>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                            >
                                <option value="dateNewest">{t.dateNewest || 'Data (più recente)'}</option>
                                <option value="dateOldest">{t.dateOldest || 'Data (più vecchia)'}</option>
                                <option value="sheetNumber">{t.sheetNumber || 'Numero foglio'}</option>
                                <option value="company">{t.company || 'Azienda'}</option>
                            </select>
                        </div>

                        {/* Data Da */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${textClass}`}>
                                📅 {t.from || 'Da'}
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                            />
                        </div>

                        {/* Data A */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${textClass}`}>
                                📅 {t.to || 'A'}
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                            />
                        </div>
                    </div>
                </div>
            )}

            <p className={`${textClass} text-sm sm:text-base px-2 mb-4`}>
                {filteredSheets.length} {filteredSheets.length === 1 ? (t.sheets ? t.sheets.slice(0,-1) : 'Sheet') : (t.sheets ? t.sheets.toLowerCase() : 'sheets')}
                {displayedSheets.length < filteredSheets.length && (
                    <span className="text-blue-500 ml-2">
                        ({t.showing || 'mostrando'} {displayedSheets.length} {t.of || 'di'} {filteredSheets.length})
                    </span>
                )}
            </p>
            {/* Sheets List */}
            {filteredSheets.length > 0 ? (
                <>
                <div className="grid grid-cols-1 gap-3">
                    {displayedSheets.map(sheet => {
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
                                            {/* 🔢 Sheet Number Badge */}
                                            {sheet.sheetNumber && (
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                    darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                                                }`}>
                                                    #{String(sheet.sheetNumber).padStart(3, '0')}
                                                </span>
                                            )}
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
                                            {/* Authorization Badges */}
                                            {(sheet.orarioStimatoDa || sheet.orarioStimatoA) && (() => {
                                                const delayAuthorized = sheet.lavoratori?.filter(w => w.ritardoIngressoAutorizzato === true) || [];
                                                const earlyAuthorized = sheet.lavoratori?.filter(w => w.uscitaAnticipoAutorizzata === true) || [];
                                                
                                                if (delayAuthorized.length === 0 && earlyAuthorized.length === 0) return null;
                                                
                                                return (
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {delayAuthorized.length > 0 && (
                                                            <span 
                                                                className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500 text-white"
                                                                title={delayAuthorized.map(w => `${w.nome}: ${w.noteRitardoIngresso || (t.authorized || 'Autorizzato')}`).join('\n')}
                                                            >
                                                                ⏰ {delayAuthorized.length} {t.authorizedDelays || 'Ritardi Autorizzati'}
                                                            </span>
                                                        )}
                                                        {earlyAuthorized.length > 0 && (
                                                            <span 
                                                                className="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-500 text-white"
                                                                title={earlyAuthorized.map(w => `${w.nome}: ${w.noteUscitaAnticipo || (t.authorized || 'Autorizzato')}`).join('\n')}
                                                            >
                                                                🏃 {earlyAuthorized.length} {t.authorizedEarlyExits || 'Uscite Anticipate'}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex flex-row sm:flex-col gap-2 sm:justify-start">
                                        {window.hasRoleAccess(currentUser, 'sheets.view') && (
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
                                        )}
                                        {sheet.status === 'completed' && typeof generatePDF === 'function' && window.hasRoleAccess(currentUser, 'sheets.downloadPdf') && (
                                            <button
                                                onClick={() => generatePDF(sheet, activeCompanyLogo)}
                                                className="flex-1 sm:flex-none px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-xs sm:text-sm"
                                            >
                                                📄 PDF
                                            </button>
                                        )}
                                        {window.hasRoleAccess(currentUser, 'sheets.archive') && (
                                            <button
                                                onClick={() => onArchiveSheet(sheet.id, !sheet.archived)}
                                                className="flex-1 sm:flex-none px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors text-xs sm:text-sm"
                                            >
                                                {sheet.archived ? '↩️' : '📦'}
                                            </button>
                                        )}
                                        {window.hasRoleAccess(currentUser, 'sheets.delete') && (
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
                                        )}
                                    </div>
                                </div>
                                {/* Meteo Compatto - Formato dettagliato come #035 */}
                                {(sheet.weatherStatic || sheet.weatherData) && (
                                    <div className="my-2 flex items-center gap-3 text-sm" title={t.weatherDetails}>
                                        <span style={{fontSize:'1.7em'}} aria-label={t.weatherIcon}>
                                            {(() => {
                                                // Priorità: weatherStatic (storico completo), poi weatherData (corrente)
                                                const weatherCode = sheet.weatherStatic?.weathercode;
                                                const weatherIcon = sheet.weatherData?.icon;
                                                
                                                // Se abbiamo weatherCode da weatherStatic (priorità)
                                                if (typeof weatherCode === 'number') {
                                                    if (weatherCode === 0) return '☀️';
                                                    if (weatherCode >= 1 && weatherCode <= 3) return '🌤️';
                                                    if ((weatherCode >= 45 && weatherCode <= 48)) return '🌫️';
                                                    if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) return '🌧️';
                                                    if (weatherCode >= 71 && weatherCode <= 77) return '❄️';
                                                    if (weatherCode === 95 || (weatherCode >= 96 && weatherCode <= 99)) return '⛈️';
                                                    return '🌡️';
                                                }
                                                
                                                // Altrimenti usa l'icona da weatherData
                                                if (weatherIcon === 'sun') return '☀️';
                                                if (weatherIcon === 'cloud') return '🌤️';
                                                if (weatherIcon === 'rain') return '🌧️';
                                                if (weatherIcon === 'snow') return '❄️';
                                                if (weatherIcon === 'thunder') return '⛈️';
                                                return '🌡️';
                                            })()}
                                        </span>
                                        <span>
                                            {/* Priorità a weatherStatic (formato completo dettagliato) */}
                                            {sheet.weatherStatic ? (
                                                <>
                                                    <b>{t.weatherHistorical || 'Meteo storico'}:</b>{' '}
                                                    <span title={t.weatherMax}>🌡️ {typeof sheet.weatherStatic.temp_max === 'number' ? `${Math.round(sheet.weatherStatic.temp_max)}°C` : '--'}</span>
                                                    {typeof sheet.weatherStatic.temp_min === 'number' ? <span title={t.weatherMin}>{` / ${Math.round(sheet.weatherStatic.temp_min)}°C`}</span> : ''}
                                                    {typeof sheet.weatherStatic.precipitation === 'number' ? <span title={t.weatherRain}>{` • 🌧️ ${sheet.weatherStatic.precipitation}mm`}</span> : ''}
                                                    <span className="ml-2 opacity-70" title={t.weatherCode || "Codice meteo"}>{' '}{(() => {
                                                        const code = sheet.weatherStatic.weathercode;
                                                        if (code === 0) return t.weatherClear;
                                                        if (code >= 1 && code <= 3) return t.weatherCloud;
                                                        if ((code >= 45 && code <= 48)) return 'Nebbia';
                                                        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return t.weatherRain;
                                                        if (code >= 71 && code <= 77) return t.weatherSnow;
                                                        if (code === 95 || (code >= 96 && code <= 99)) return t.weatherThunder;
                                                        return t.weatherUnknown;
                                                    })()}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <b>{sheet.weatherData.location}:</b>{' '}
                                                    <span title={t.weatherTemp}>{typeof sheet.weatherData.temp === 'number' ? `${Math.round(sheet.weatherData.temp)}°C` : '--°C'}</span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                {/* 🚀 Load More Button */}
                {displayedSheets.length < filteredSheets.length && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={loadMore}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                darkMode 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                        >
                            📥 {t.loadMore || 'Carica altri'} ({filteredSheets.length - displayedSheets.length} {t.remaining || 'rimanenti'})
                        </button>
                    </div>
                )}
                </>
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
