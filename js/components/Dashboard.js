// Dashboard moderno: solo ES6, nessun legacy, nessuna duplicazione. Tutto il codice vecchio, duplicato o commentato è stato rimosso. La UI è ora completamente basata sui permessi e sulle statistiche avanzate.

    // The renderPieChart function has been removed to avoid duplicate declarations.
// Dashboard Component - v4.2 FIXED - Statistiche Corrette + Visualizzazione Ottimizzata
// ========================================
// UTILITY: Format Date
// ========================================
function formatDate(dateString) {
    // Use localized 'not available' when possible
    if (!dateString) return (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t('notAvailable') : 'N/D';
    const date = new Date(dateString);
    if (isNaN(date)) return (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t('notAvailable') : 'N/D';
    const _locale = (typeof window !== 'undefined' && typeof window.getLocale === 'function') ? window.getLocale() : 'it-IT';
    return date.toLocaleDateString(_locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatSheetId(num, padding = 5) {
    if (typeof num === 'undefined' || num === null) return '';
    const str = String(num).padStart(padding, '0');
    // Use runtime translation when available (safe fallback to "ID - ")
    const prefix = (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t('sheetIdPrefix') : 'ID - ';
    return `${prefix}${str}`;
}

// ========================================
// 📊 CALCOLO STATISTICHE AVANZATE - FIXED
// ========================================
function calculateAdvancedStats(sheets = [], period = 'week', weekStart = 1) {
    if (!Array.isArray(sheets) || sheets.length === 0) {
        return {
            chartData: [],
            topCompanies: [],
            topWorkers: [],
            hourlyDistribution: new Array(24).fill(0),
            totalSheets: 0,
            overallTotalSheets: 0,
            draftSheets: 0,
            archivedSheets: 0,
            totalWorkers: 0,
            completedSheets: 0,
            overallCompletedSheets: 0,
            todayHours: 0,
            weeklyHours: 0,
            avgDailyHours: 0,
            activeWorkers: 0,
            efficiency: 0,
            hasData: false,
            workerMap: {},
            chartDayKeys: []
        };
    }

    const now = new Date();
    // Calcola il primo giorno del mese corrente
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    // Calcola il numero di giorni del mese corrente
    const daysInPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    // Filtra solo fogli completati dal 1° del mese corrente
    const filtered = sheets.filter(s => {
        if (s.status !== 'completed') return false;
        if (!s.data && !s.createdAt) return false;
        const d = new Date(s.data || s.createdAt);
        return d >= periodStart && d <= now;
    });

    // DEBUG: Count filtered sheets and workers with valid entry/exit times
    let debugValidWorkers = 0;
    for (const sheet of filtered) {
        const workers = sheet.lavoratori || [];
        for (const w of workers) {
            if (w.oraEntrata && w.oraUscita) debugValidWorkers++;
        }
    }
    if (typeof window !== 'undefined') {
        window._debugDistribuzioneOraria = {
            filteredSheets: filtered.length,
            validWorkers: debugValidWorkers,
            periodStart: periodStart,
            now: now
        };
        console.log('[DEBUG] Distribuzione Oraria:', window._debugDistribuzioneOraria);
    }

    // Pre-populate chartMap and collect day keys
    const chartMap = {};
    const chartDayKeys = [];
    for (let i = 0; i < daysInPeriod; i++) {
        const date = new Date(periodStart);
        date.setDate(periodStart.getDate() + i);
        const _locale = (typeof window !== 'undefined' && typeof window.getLocale === 'function') ? window.getLocale() : 'it-IT';
        const label = date.toLocaleDateString(_locale, { day: '2-digit', month: 'short' });
        chartMap[label] = 0;
        chartDayKeys.push({ label, date });
    }

    const hourlyDistribution = new Array(24).fill(0);
    const companyMap = {};
    const workerMap = {}; // will hold per-worker totals and per-day breakdown
    let totalHours = 0;
    let completedSheets = 0;

    // Overall counts (not limited to period) - exclude archived sheets
    const overallTotalSheets = Array.isArray(sheets) ? sheets.filter(s => !s.archived).length : 0;
    const overallCompletedSheets = Array.isArray(sheets) ? sheets.filter(s => s.status === 'completed' && !s.archived).length : 0;
    // Calcolo ore totali effettive su tutti i fogli completati
    let overallTotalHours = 0;
    if (Array.isArray(sheets)) {
        for (const sheet of sheets) {
            if (sheet.status === 'completed' && Array.isArray(sheet.lavoratori)) {
                for (const w of sheet.lavoratori) {
                    const hours = parseFloat(w.oreTotali || 0);
                    overallTotalHours += isNaN(hours) ? 0 : hours;
                }
            }
        }
        overallTotalHours = Math.round(overallTotalHours * 10) / 10;
    }

    // Process each sheet
    for (const sheet of filtered) {
        const date = new Date(sheet.data || sheet.createdAt || now);
        const label = date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
        const workers = sheet.lavoratori || [];

        // Calculate total hours for this sheet
        const sheetHours = workers.reduce((sum, w) => {
            const hours = parseFloat(w.oreTotali || 0);
            return sum + (isNaN(hours) ? 0 : hours);
        }, 0);

        totalHours += sheetHours;
        if (sheet.status === 'completed') completedSheets++;

        // Add to chart data
        chartMap[label] = (chartMap[label] || 0) + sheetHours;

        // Company stats
    const azienda = sheet.titoloAzienda || (t.unknown || 'Sconosciuta');
        companyMap[azienda] = (companyMap[azienda] || 0) + sheetHours;

        // Worker stats and hourly distribution (and per-day breakdown)
        for (const w of workers) {
            // Normalize name: trim, collapse spaces, lowercase
            let rawName = `${w.nome || ''} ${w.cognome || ''}`;
            let name = rawName
                .replace(/\s+/g, ' ') // collapse multiple spaces
                .trim()
                .toLowerCase();
            // Fallback if name is empty
            if (!name) name = (t.anonymous || 'anonimo');
            const workerHours = parseFloat(w.oreTotali || 0) || 0;
            if (!workerMap[name]) workerMap[name] = { total: 0, perDay: {}, displayName: rawName.trim() };
            workerMap[name].total += workerHours;
            workerMap[name].perDay[label] = (workerMap[name].perDay[label] || 0) + workerHours;

            // hourly distribution unchanged
            if (w.oraEntrata && w.oraUscita) {
                const [entryHour, entryMin] = w.oraEntrata.split(':').map(Number);
                const [exitHour, exitMin] = w.oraUscita.split(':').map(Number);

                if (!isNaN(entryHour) && !isNaN(entryMin) && !isNaN(exitHour) && !isNaN(exitMin)) {
                    const entryTime = entryHour + (entryMin / 60);
                    const exitTime = exitHour + (exitMin / 60);
                    const pausaOre = (parseFloat(w.pausa || 0) / 60);

                    for (let h = Math.floor(entryTime); h <= Math.floor(exitTime); h++) {
                        if (h >= 0 && h < 24) {
                            const startH = Math.max(h, entryTime);
                            const endH = Math.min(h + 1, exitTime);
                            const hoursInSlot = Math.max(0, endH - startH);

                            if (hoursInSlot > 0) {
                                const totalWorkTime = exitTime - entryTime;
                                const adjustedHours = totalWorkTime > 0 
                                    ? hoursInSlot * (1 - (pausaOre / totalWorkTime))
                                    : hoursInSlot;
                                hourlyDistribution[h] += Math.max(0, adjustedHours);
                            }
                        }
                    }
                }
            }
        }
    }

    // Convert to arrays and sort
    const chartData = Object.entries(chartMap)
        .map(([label, hours]) => ({ 
            label, 
            hours: Math.round(hours * 100) / 100 // Round to 2 decimals
        }));

    const topCompanies = Object.entries(companyMap)
        .map(([name, hours]) => ({ name, hours: Math.round(hours * 100) / 100 }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5);

    const topWorkers = Object.entries(workerMap)
        .map(([key, data]) => ({ name: data.displayName || key, hours: Math.round((data.total || 0) * 100) / 100 }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5);

    // Calculate metrics
    const totalSheets = filtered.length;
    const draftSheets = filtered.filter(s => s.status === 'draft').length;
    const archivedSheets = filtered.filter(s => s.archived).length;
    const totalWorkers = Object.keys(workerMap).length;
    
    // 🔧 FIX: Conta TUTTI i lavoratori unici da TUTTI i fogli (non solo periodo selezionato)
    const allWorkersSet = new Set();
    const normalizeFunction = window.normalizeWorkerName || ((nome, cognome) => {
        return `${nome || ''} ${cognome || ''}`.replace(/\s+/g, ' ').trim().toLowerCase();
    });
    
    if (Array.isArray(sheets)) {
        sheets.forEach(sheet => {
            if (Array.isArray(sheet.lavoratori)) {
                sheet.lavoratori.forEach(w => {
                    const normalized = normalizeFunction(w.nome, w.cognome);
                    if (normalized) allWorkersSet.add(normalized);
                });
            }
        });
    }
    const totalUniqueWorkers = allWorkersSet.size;

    // Average daily hours - count only days with hours
    const daysWithHours = Object.values(chartMap).filter(h => h > 0).length;
    const avgDailyHours = daysWithHours > 0 
        ? Math.round((totalHours / daysWithHours) * 10) / 10 
        : 0;

    // Today's hours
    const _locale_global = (typeof window !== 'undefined' && typeof window.getLocale === 'function') ? window.getLocale() : 'it-IT';
    const todayLabel = new Date().toLocaleDateString(_locale_global, { day: '2-digit', month: 'short' });
    const todayHours = Math.round((chartMap[todayLabel] || 0) * 10) / 10;

    // Efficiency
    const efficiency = totalSheets > 0 
        ? Math.round((completedSheets / totalSheets) * 100) 
        : 0;

    return {
        chartData,
        topCompanies,
        topWorkers,
        hourlyDistribution: hourlyDistribution.map(h => Math.round(h * 100) / 100),
        totalSheets,
        overallTotalSheets,
        draftSheets,
        archivedSheets,
        totalWorkers,
        completedSheets,
        overallCompletedSheets,
        todayHours,
        weeklyHours: Math.round(totalHours * 10) / 10,
        overallTotalHours,
        avgDailyHours,
        activeWorkers: totalUniqueWorkers, // Usa il conteggio corretto di tutti i lavoratori
        efficiency,
        workerMap,
        chartDayKeys,
        hasData: totalHours > 0
    };
}

// ========================================
// 📊 DASHBOARD COMPONENT - v4.3 PERMISSION-AWARE
// Modified: 2025-11-20 16:15 - Debug logging added
// ========================================
if (!window.Dashboard) {
console.log('🏗️ Definendo componente Dashboard...');
const Dashboard = ({ sheets, darkMode, language = 'it', weekStart = 1, onNavigate, appSettings = {}, currentUser }) => {
    console.log('🎨 Dashboard render iniziato', { 
        hasSheets: !!sheets, 
        sheetsLength: sheets?.length,
        hasCurrentUser: !!currentUser, 
        userRole: currentUser?.role,
        hasPermissions: !!currentUser?.permissions
    });
    
    // 🔒 PERMISSION CHECKS (V2 System - Dot Notation)
    const hasPermission = (permPath) => {
        try {
            if (!currentUser) return false;
            if (!currentUser.permissions) return false;
            // Admin con wildcard '*'
            if (currentUser.permissions['*'] === true) return true;
            // Controllo specifico permesso
            return currentUser.permissions[permPath] === true;
        } catch (error) {
            console.error('❌ Errore hasPermission:', error);
            return false;
        }
    };
    
    // Dashboard permissions (role-based)
    const canViewDashboard = window.hasRoleAccess(currentUser, 'dashboard.view');
    const canViewStats = canViewDashboard; // Se può vedere dashboard, può vedere statistiche
    const canViewCharts = canViewDashboard; // Se può vedere dashboard, può vedere grafici
    
    console.log('🔍 Dashboard Access:', { canViewDashboard, role: currentUser?.role });
    
    // Se non ha accesso alla dashboard, redirect al profilo
    if (!canViewDashboard) {
        console.log('⛔ Accesso Dashboard negato - redirect a Profilo');
        // Auto-redirect al profilo (sempre accessibile)
        React.useEffect(() => {
            if (onNavigate) {
                onNavigate('profile');
            }
        }, []);
        
        return React.createElement('div', { 
            className: `flex items-center justify-center h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}` 
        },
            React.createElement('div', { className: 'text-center p-8' },
                React.createElement('div', { className: 'text-6xl mb-4' }, '📊'),
                React.createElement('h2', { className: 'text-2xl font-bold mb-2' }, 'Dashboard Non Disponibile'),
                React.createElement('p', { className: 'text-gray-500 mb-4' }, 
                    'Non hai i permessi per visualizzare la Dashboard. Reindirizzamento al profilo...'
                ),
                React.createElement('button', {
                    onClick: () => onNavigate && onNavigate('profile'),
                    className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                }, 'Vai al Profilo')
            )
        );
    }
    
    console.log('✅ Permessi OK - continuando render Dashboard');
    
    // Stato per la location meteo (admin)
    // Immediate input value shown in the field
    const defaultCity = (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t('defaultCity') : (t.defaultCity || 'Roma');
    const [weatherInput, setWeatherInput] = React.useState(defaultCity);
    // Debounced value actually passed to the widget
    const [weatherLocation, setWeatherLocation] = React.useState(defaultCity);
    const weatherLocationDebounceRef = React.useRef(null);
    // Translation helper: prefer the centralized runtime `window.t` (provided by js/i18n.js).
    // Keep a safe fallback to the legacy `translations` object so migration is incremental.
    // We return a Proxy so existing code that uses `t.someKey` continues to work.
    const t = new Proxy({}, {
        get: (_target, prop) => {
            try {
                const key = String(prop);
                if (typeof window !== 'undefined' && typeof window.t === 'function') {
                    return window.t(key);
                }
                const all = (typeof window !== 'undefined' && window.translations) || (typeof translations !== 'undefined' && translations) || {};
                const lang = language || 'it';
                return (all[lang] && all[lang][key]) || (all['it'] && all['it'][key]) || key;
            } catch (e) {
                return String(prop);
            }
        }
    });
    // Force re-render when language changes (components must update to new translations)
    const [localeVersion, setLocaleVersion] = React.useState(0);
    React.useEffect(() => {
        const h = () => setLocaleVersion(v => v + 1);
        try { window.addEventListener('languageChanged', h); } catch (e) {}
        return () => { try { window.removeEventListener('languageChanged', h); } catch (e) {} };
    }, []);

    // Forza re-render anche delle card statistiche aggiuntive in fondo
    // (usando lo stesso stato locale localeVersion come dipendenza)
    // Resolve WeatherWidget from global scope with fallback to avoid crash if not loaded yet
    // Use a translation key when available to avoid hard-coded strings
    const WeatherWidget = window.WeatherWidget || (() => React.createElement('div', null, t.weatherWidgetNotLoaded));
    // days for forecast removed — widget shows only current weather
    const forecastDays = 1;
    // token to force refresh even when location doesn't change
    const [refreshToken, setRefreshToken] = React.useState(0);
    // icon key for select (sun/cloud/rain/other)
    const [weatherIconKey, setWeatherIconKey] = React.useState('sun');

    // Map weather icon key to a background animation duration (seconds)
    const weatherBgDurations = React.useMemo(() => ({
        sun: 18,
        cloud: 16,
        snow: 20,
        rain: 10,
        thunder: 6,
        unknown: 12
    }), []);
    const weatherBgDuration = (weatherBgDurations[weatherIconKey] || weatherBgDurations.unknown);
    const [selectedPeriod, setSelectedPeriod] = React.useState('week');
    const [animated, setAnimated] = React.useState(false);
    // Visible count for recent activities (pagination) — default 5
    const [activityVisibleCount, setActivityVisibleCount] = React.useState(5);
    // Real-time clock state (used only on desktop web to save mobile battery)
    const [now, setNow] = React.useState(new Date());
    // State for mobile tooltip in bar chart
    const [activeTooltip, setActiveTooltip] = React.useState(null);
    // State for visible days in bar chart (pagination)
    const [visibleDays, setVisibleDays] = React.useState(7);

    // Detect desktop-like interaction (fine pointer + hover) to avoid enabling on mobile
    const isDesktop = (typeof window !== 'undefined' && window.matchMedia) ? window.matchMedia('(pointer: fine) and (hover: hover)').matches : true;

    // User preference: enable/disable live clock (persisted in localStorage)
    const [liveClockEnabled, setLiveClockEnabled] = React.useState(() => {
        try {
            const raw = localStorage.getItem('pref_liveClock');
            if (raw === null) return true; // default enabled on desktop
            return raw === '1' || raw === 'true';
        } catch (e) { return true; }
    });

    // Save preference when changed
    React.useEffect(() => {
        try { localStorage.setItem('pref_liveClock', liveClockEnabled ? '1' : '0'); } catch (e) {}
    }, [liveClockEnabled]);

    // Apply weather location immediately (used by Enter key and Apply button)
    const applyWeatherLocation = React.useCallback(() => {
        // ensure we have a non-empty location
        if (weatherInput && weatherInput.trim().length > 0) {
            setWeatherLocation(weatherInput.trim());
            // small token to force child widget to refresh
            setRefreshToken(r => r + 1);
        }
    }, [weatherInput]);


    const cardClass = `${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl shadow-lg dashboard-card`;
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';

    // Track when sheets were last updated (safely derived from incoming props)
    const [lastDataUpdate, setLastDataUpdate] = React.useState(() => new Date());
    // prefer a single locale tag (maps to BCP-47) instead of scattered chained ternaries
    const localeTag = (typeof window !== 'undefined' && typeof window.getLocale === 'function') ? window.getLocale() : (language === 'it' ? 'it-IT' : language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'ro-RO');

    React.useEffect(() => {
        // Update timestamp whenever sheets array reference changes
        setLastDataUpdate(new Date());
    }, [sheets]);

    // Close tooltip when clicking outside (for mobile bar chart)
    React.useEffect(() => {
        const handleClickOutside = () => setActiveTooltip(null);
        if (activeTooltip) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [activeTooltip]);

    // 📊 Calcolo statistiche avanzate
    const stats = React.useMemo(() => {
        return calculateAdvancedStats(sheets, selectedPeriod, weekStart);
    }, [sheets, selectedPeriod, weekStart]);

    // PIE CHART AZIENDE (SEMPLICE)
    const renderPieChart = () => {
        if (!stats.hasData || stats.topCompanies.length === 0) {
            return (
                <div className="text-center py-8">
                    <span className="text-3xl">💼</span>
                    <p className="mt-2">{t.noData}</p>
                </div>
            );
        }
        const total = stats.topCompanies.reduce((sum, c) => sum + c.hours, 0) || 1;
        return (
            <div className="space-y-4">
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    🏢 {t.companyDistribution}
                </h3>
                <ul className="space-y-2">
                    {stats.topCompanies.map((company, i) => (
                        <li key={i} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full inline-block" style={{backgroundColor: '#4f46e5'}}></span>
                            <span className="truncate flex-1">{company.name}</span>
                            <span className="font-semibold">{company.hours}h</span>
                            <span className="text-xs text-gray-500">({Math.round((company.hours/total)*100)}%)</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // Trigger animation on mount
    React.useEffect(() => {
        setAnimated(true);
    }, []);

    // Real-time clock: run only on desktop and only when user enabled.
    // Uses Page Visibility API to pause updates when the tab is hidden and aligns
    // the first tick to the next full second to minimize drift.
    React.useEffect(() => {
        if (!isDesktop || !liveClockEnabled || typeof document === 'undefined') return;

        let intervalId = null;
        let timeoutId = null;

        const startTimer = () => {
            setNow(new Date());
            const msToNextSecond = 1000 - (Date.now() % 1000);
            timeoutId = setTimeout(() => {
                setNow(new Date());
                intervalId = setInterval(() => setNow(new Date()), 1000);
            }, msToNextSecond);
        };

        const stopTimer = () => {
            if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
            if (intervalId) { clearInterval(intervalId); intervalId = null; }
        };

        const handleVisibility = () => {
            if (document.hidden) {
                stopTimer();
            } else {
                startTimer();
            }
        };

        startTimer();
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            stopTimer();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [isDesktop, liveClockEnabled]);

    // ========================================
    // 🎯 GRAFICO A BARRE AVANZATO - FIXED
    // ========================================
    const renderAdvancedBarChart = (opts = {}) => {
        // Build per-day segments based on workerMap
        const dayKeys = stats.chartDayKeys || stats.chartData.map(d => ({ label: d.label }));
        
        // Paginate days (using state from parent component)
        const displayedDays = dayKeys.slice(0, visibleDays);
        const hasMoreDays = visibleDays < dayKeys.length;
        const canShowLess = visibleDays > 7;

        // Compute max daily total for scaling
        const dailyTotals = displayedDays.map(dk => {
            const label = dk.label;
            let total = 0;
            for (const wName in stats.workerMap) {
                total += (stats.workerMap[wName].perDay[label] || 0);
            }
            return total;
        });
        const maxHours = Math.max(...dailyTotals, 1);
        
        // Helper: assign unique colors per day to avoid duplicates in same row
        const getUniqueColorForDay = (workerName, usedColors) => {
            const palette = [
                '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
                '#EC4899', '#F97316', '#84CC16', '#14B8A6', '#6366F1', '#A855F7',
                '#F43F5E', '#FBBF24', '#34D399', '#22D3EE', '#60A5FA', '#A78BFA',
                '#F472B6', '#FB923C', '#A3E635', '#2DD4BF', '#818CF8', '#C084FC'
            ];
            
            // Get deterministic hash for worker
            let hash = 0;
            for (let i = 0; i < workerName.length; i++) {
                hash = ((hash << 5) - hash) + workerName.charCodeAt(i);
                hash = hash & hash;
            }
            
            // Start from hash position and find first unused color
            const startIdx = Math.abs(hash) % palette.length;
            for (let i = 0; i < palette.length; i++) {
                const idx = (startIdx + i) % palette.length;
                const color = palette[idx];
                if (!usedColors.has(color)) {
                    return color;
                }
            }
            
            // Fallback: return any color (shouldn't happen with 24 colors)
            return palette[startIdx % palette.length];
        };

        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    {!opts.hideTitle && (
                        <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            📈 {t.hoursProgress}
                        </h3>
                    )}
                </div>

                {stats.hasData ? (
                    <div className="space-y-3">
                        {displayedDays.map((dk, i) => {
                            const label = dk.label;
                            const segments = [];
                            const usedColors = new Set(); // Track colors used in this day
                            
                            for (const wName in stats.workerMap) {
                                const h = stats.workerMap[wName].perDay[label] || 0;
                                if (h > 0) {
                                    const color = getUniqueColorForDay(wName, usedColors);
                                    usedColors.add(color);
                                    segments.push({ name: wName, hours: h, color: color });
                                }
                            }
                            const dayTotal = segments.reduce((s, seg) => s + seg.hours, 0);
                                return (
                                <div key={label} className={`flex items-center gap-3 group relative ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `${i * 50}ms`, zIndex: activeTooltip && activeTooltip.startsWith(label) ? 1000 : 'auto' }}>
                                    <span className={`text-xs font-medium w-16 text-right truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                                    <div className="flex-1 h-5 rounded bg-gray-200 dark:bg-gray-700 overflow-visible relative flex items-center">
                                        {/* Render stacked segments */}
                                        {segments.length === 0 ? (
                                            <div className="w-full h-full text-center text-xs text-gray-500 flex items-center justify-center">{t.noData}</div>
                                        ) : (
                                            segments.map((seg, idx) => {
                                                const width = maxHours > 0 ? (seg.hours / maxHours) * 100 : 0;
                                                const tooltipId = `${label}-${idx}`;
                                                const isActive = activeTooltip === tooltipId;                                                return (
                                                    <div
                                                        key={seg.name + idx}
                                                        className={`h-full relative cursor-pointer transition-opacity ${isActive ? 'z-[9999]' : 'z-10'}`}
                                                        style={{ width: `${width}%`, backgroundColor: seg.color, transition: 'width 600ms ease, opacity 200ms ease' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveTooltip(isActive ? null : tooltipId);
                                                        }}
                                                        onMouseEnter={() => {
                                                            // Desktop hover - show immediately
                                                            if (window.matchMedia('(hover: hover)').matches) {
                                                                setActiveTooltip(tooltipId);
                                                            }
                                                        }}
                                                        onMouseLeave={() => {
                                                            // Desktop hover - hide on leave
                                                            if (window.matchMedia('(hover: hover)').matches) {
                                                                setActiveTooltip(null);
                                                            }
                                                        }}
                                                    >
                                                        {/* Custom modern tooltip - NO native title attribute */}
                                                        {isActive && (
                                                            <div 
                                                                className={`fixed px-5 py-4 rounded-xl shadow-2xl whitespace-nowrap animate-fade-in pointer-events-none ${
                                                                    darkMode 
                                                                        ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white border-2 border-indigo-400 shadow-indigo-500/50' 
                                                                        : 'bg-gradient-to-br from-white to-gray-50 text-gray-900 border-2 border-indigo-600 shadow-indigo-400/40'
                                                                }`}
                                                                style={{ 
                                                                    minWidth: '160px',
                                                                    zIndex: 999999,
                                                                    left: '50%',
                                                                    top: '50%',
                                                                    transform: 'translate(-50%, -180%)',
                                                                    backdropFilter: 'blur(20px)',
                                                                    boxShadow: darkMode 
                                                                        ? '0 25px 50px -12px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.3)' 
                                                                        : '0 25px 50px -12px rgba(79, 70, 229, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.2)'
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <div className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                    {seg.name}
                                                                </div>
                                                                <div className={`text-xl font-extrabold ${
                                                                    darkMode 
                                                                        ? 'bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent' 
                                                                        : 'bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent'
                                                                }`}>
                                                                    {seg.hours.toFixed(1)} ore
                                                                </div>
                                                                {/* Arrow */}
                                                                <div 
                                                                    className="absolute left-1/2 transform -translate-x-1/2"
                                                                    style={{
                                                                        bottom: '-10px',
                                                                        width: 0,
                                                                        height: 0,
                                                                        borderLeft: '10px solid transparent',
                                                                        borderRight: '10px solid transparent',
                                                                        borderTop: `12px solid ${darkMode ? '#1F2937' : '#FFFFFF'}`,
                                                                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <span className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dayTotal}h</span>
                                </div>
                            );
                        })}

                        {/* Pagination controls */}
                        {dayKeys.length > 7 && (
                            <div className="flex justify-center pt-3">
                                <button
                                    onClick={() => {
                                        if (hasMoreDays) {
                                            // Show 7 more days
                                            setVisibleDays(prev => Math.min(prev + 7, dayKeys.length));
                                        } else if (canShowLess) {
                                            // Show less (back to 7)
                                            setVisibleDays(7);
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                        darkMode 
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                    }`}
                                >
                                    {hasMoreDays ? (
                                        <>📅 {t.showMore || 'Mostra altro'} ({Math.min(7, dayKeys.length - visibleDays)} {t.days || 'giorni'})</>
                                    ) : canShowLess ? (
                                        <>📅 {t.showLess || 'Mostra meno'}</>
                                    ) : null}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="text-3xl">⏰</span>
                        <p className="mt-2">{t.noData}</p>
                    </div>
                )}
            </div>
        );
    };

    // ========================================
    // 🕐 GRAFICO DISTRIBUZIONE ORARIA - FIXED
    // ========================================
    const renderHourlyChart = (opts = {}) => {
        const maxHourly = Math.max(...stats.hourlyDistribution.slice(6, 22), 1);

        return (
            <div className="space-y-4">
                {!opts.hideTitle && (
                    <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        🕐 {t.hourlyDistribution}
                    </h3>
                )}
                {stats.hasData ? (
                    <>
                        <div className="grid grid-cols-8 lg:grid-cols-16 gap-1 sm:gap-2">
                            {stats.hourlyDistribution.slice(6, 22).map((hours, index) => {
                                const hour = index + 6;
                                const height = maxHourly > 0 ? (hours / maxHourly) * 60 : 0;

                                return (
                                    <div key={hour} className="text-center">
                                        <div
                                            className={`bg-indigo-500 rounded-t transition-all duration-500 hover:bg-indigo-600 cursor-help mx-auto relative group ${
                                                hours > 0 ? 'shadow-md' : ''
                                            }`}
                                            style={{
                                                height: `${height}px`,
                                                width: '80%',
                                                minHeight: hours > 0 ? '8px' : '0px'
                                            }}
                                            title={`${hour}:00 - ${hours} ore`}
                                        >
                                            {/* Tooltip on hover */}
                                            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                                                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'
                                            }`}>
                                                {hours.toFixed(1)}h
                                            </div>
                                        </div>
                                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {hour}h
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t.workingHours}: {t.workingHoursRange}
                        </div>
                    </>
                ) : (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="text-3xl">🕐</span>
                        <p className="mt-2">{t.noData || (language === 'it' ? 'Nessun dato orario' : 'No hourly data')}</p>
                    </div>
                )}
            </div>
        );
    };

    // ========================================
    // 📋 TABELLA ATTIVITÀ RECENTI - FIXED
    // ========================================
    const renderActivityTable = (opts = {}) => {
        // Filter: only drafts and completed (NO archived)
        const filteredSheets = sheets.filter(s => {
            if (s.archived) return false; // Escludi archiviati
            if (s.data || s.createdAt) return true;
            return false;
        });

        // Separate drafts and completed
        const drafts = filteredSheets.filter(s => s.status !== 'completed');
        const completed = filteredSheets.filter(s => s.status === 'completed');

        // Sort both by date (most recent first)
        const sortByDate = (a, b) => {
            const dateA = new Date(a.data || a.createdAt);
            const dateB = new Date(b.data || b.createdAt);
            return dateB - dateA;
        };

        drafts.sort(sortByDate);
        completed.sort(sortByDate);

        // Combine: all drafts + last 5 completed
        const recentActivities = [
            ...drafts,
            ...completed.slice(0, 5)
        ].sort(sortByDate); // Re-sort combined list

        const getStatusBadge = (sheet) => {
            if (sheet.archived) return { text: t.archived, color: 'bg-gray-500' };
            if (sheet.status === 'completed') return { text: t.completed, color: 'bg-green-600' };
            return { text: t.draft, color: 'bg-yellow-600' };
        };

        if (recentActivities.length === 0) {
            return (
                <div className="space-y-4">
                    {!opts.hideTitle && (
                        <h3 className={`font-semibold text-lg flex items-center gap-2 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            <span>📋</span> {t.recentActivity}
                        </h3>
                    )}
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="text-3xl">📝</span>
                        <p className="mt-2">{t.noRecentActivity || 'Nessuna attività recente'}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {!opts.hideTitle && (
                        <h3 className={`font-semibold text-lg flex items-center gap-2 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            <span>📋</span> {t.recentActivity}
                        </h3>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-semibold">{t.company}</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold hidden sm:table-cell">{t.date}</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold">{t.workers}</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold hidden md:table-cell">{t.hours}</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold">{t.status}</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {recentActivities.map((sheet, i) => {
                                const status = getStatusBadge(sheet);
                                const totalHours = sheet.lavoratori?.reduce((sum, worker) => {
                                    const hours = parseFloat(worker.oreTotali || 0);
                                    return sum + (isNaN(hours) ? 0 : hours);
                                }, 0) || 0;

                                return (
                                    <tr
                                        key={sheet.id}
                                        className={`transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${animated ? 'animate-fade-in' : ''}`}
                                        style={{ animationDelay: `${i * 50}ms` }}
                                    >
                                        <td className={`px-3 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                                            <div className="font-medium truncate max-w-[150px]" title={sheet.titoloAzienda}>
                                                                {sheet.titoloAzienda}
                                                            </div>
                                                            {sheet.sheetNumber && (
                                                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`} title={formatSheetId(sheet.sheetNumber)}>
                                                                    {formatSheetId(sheet.sheetNumber)}
                                                                </div>
                                                            )}
                                            {sheet.responsabile && (
                                                <div className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {sheet.responsabile}
                                                </div>
                                            )}
                                        </td>
                                        <td className={`px-3 py-3 text-sm hidden sm:table-cell ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                                            {formatDate(sheet.data || sheet.createdAt)}
                                        </td>
                                        <td className={`px-3 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`} title={`${sheet.lavoratori?.length || 0} ${t.workers || 'lavoratori'}`}>
                                            <span className="font-semibold">{sheet.lavoratori?.length || 0}</span>
                                        </td>
                                        <td className={`px-3 py-3 text-sm font-semibold hidden md:table-cell ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {totalHours.toFixed(1)}h
                                        </td>
                                        <td className="px-3 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${status.color}`} title={status.text}>
                                                {status.text}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // ========================================
    // 📈 WIDGET PERFORMANCE - FIXED
    // ========================================
    const renderPerformanceWidget = (opts = {}) => {
        return (
            <div className="space-y-4">
                {!opts.hideTitle && (
                    <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        📈 {t.performance}
                    </h3>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div className={`text-center p-4 rounded-lg ${
                        darkMode 
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                            : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                    } text-white shadow-lg`}>
                        <div className="text-2xl font-bold">{stats.efficiency}%</div>
                        <div className="text-xs opacity-90 mt-1">{t.efficiency}</div>
                    </div>

                    <div className={`text-center p-4 rounded-lg ${
                        darkMode 
                            ? 'bg-gradient-to-br from-green-600 to-emerald-600' 
                            : 'bg-gradient-to-br from-green-500 to-emerald-500'
                    } text-white shadow-lg`}>
                        <div className="text-2xl font-bold">{stats.avgDailyHours}h</div>
                        <div className="text-xs opacity-90 mt-1">{t.avgDaily}</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {/* Completed / Total (overall - tutti i fogli non archiviati) */}
                    <div className={`col-span-2`}> 
                        <div className={`flex justify-between items-baseline text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} title={`${stats.overallCompletedSheets} completati / ${stats.overallTotalSheets} totali (esclusi archiviati)`}>
                            <span>{t.completedSheets} <span className="opacity-70 text-xs ml-1">({t.total || 'totali'})</span></span>
                            <span className="font-semibold whitespace-nowrap">{stats.overallCompletedSheets} / {stats.overallTotalSheets}</span>
                        </div>
                        <div className={`w-full rounded-full h-2 overflow-hidden mt-1 ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                            <div
                                className={`h-2 rounded-full transition-all duration-1000 ${
                                    darkMode 
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                                }`}
                                style={{ width: `${stats.overallTotalSheets > 0 ? Math.round((stats.overallCompletedSheets / stats.overallTotalSheets) * 100) : 0}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Lavoratori unici (tutti i fogli, non solo periodo) */}
                    <div className={`text-center p-3 rounded-lg shadow-sm border ${darkMode ? 'border-indigo-700' : 'border-transparent'}`}>
                        <div className={`p-2 rounded-lg ${darkMode ? 'bg-gradient-to-br from-indigo-700 to-indigo-500 text-white' : 'bg-gradient-to-br from-indigo-500 to-indigo-300 text-white'}`} title={`${stats.activeWorkers} ${t.uniqueWorkers || 'Lavoratori unici'} (tutti i fogli)`}>
                            <div className="text-lg font-bold">{stats.activeWorkers}</div>
                            <div className="text-xs opacity-90 mt-1">{t.uniqueWorkers}</div>
                        </div>
                    </div>
                </div>

                {/* Extra widget row: Total hours in period */}
                <div className={`mt-2 p-3 rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xl font-bold">{stats.weeklyHours}h</div>
                            <div className="text-xs opacity-90 mt-1">
                                {t.totalHoursThisMonth || 'Ore totali questo mese'} ({new Date().toLocaleDateString(localeTag, { day: 'numeric', month: 'short' })})
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">{t.lastUpdated}: {lastDataUpdate.toLocaleTimeString(localeTag)}</div>
                    </div>
                </div>
            </div>
        );
    };

    // ========================================
    // 🔔 WIDGET NOTIFICHE - FIXED
    // ========================================
    const renderNotificationsWidget = (opts = {}) => {
        const pendingSheets = sheets.filter(s =>
            !s.archived && s.status === 'draft' && s.lavoratori?.length > 0
        ).length;

        const unsignedSheets = sheets.filter(s =>
            !s.archived && s.status === 'draft' && s.lavoratori?.length > 0 && !s.firmaResponsabile
        ).length;

        return (
            <div className="space-y-4">
                {!opts.hideTitle && (
                        <h3 className={`font-semibold text-lg flex items-center gap-2 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            <span>🔔</span> {t.notifications}
                        </h3>
                )}

                <div className="space-y-3">
                    {pendingSheets > 0 && (
                        <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                            darkMode 
                                ? 'bg-yellow-900/20 border-yellow-800' 
                                : 'bg-yellow-50 border-yellow-200'
                        }`}>
                            <span className="text-xl">📋</span>
                            <div className="flex-1 min-w-0">
                                <div className={`font-semibold ${
                                    darkMode ? 'text-yellow-200' : 'text-yellow-800'
                                }`}>
                                    {pendingSheets} {t.sheetsWaiting}
                                </div>
                                <div className={`text-xs ${
                                    darkMode ? 'text-yellow-400' : 'text-yellow-600'
                                }`}>
                                    {t.completeToGeneratePDF}
                                </div>
                            </div>
                        </div>
                    )}

                    {unsignedSheets > 0 && (
                        <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                            darkMode 
                                ? 'bg-orange-900/20 border-orange-800' 
                                : 'bg-orange-50 border-orange-200'
                        }`}>
                            <span className="text-xl">✍️</span>
                            <div className="flex-1 min-w-0">
                                <div className={`font-semibold ${
                                    darkMode ? 'text-orange-200' : 'text-orange-800'
                                }`}>
                                    {unsignedSheets} {t.toSign}
                                </div>
                                <div className={`text-xs ${
                                    darkMode ? 'text-orange-400' : 'text-orange-600'
                                }`}>
                                    {t.responsibleSignatureMissing}
                                </div>
                            </div>
                        </div>
                    )}

                    {pendingSheets === 0 && unsignedSheets === 0 && (
                        <div className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className="text-3xl">🎉</span>
                            <div className="text-sm mt-2">{t.allDone}</div>
                        </div>
                    )}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.lastUpdated}: {now.toLocaleTimeString(localeTag)}</div>
            </div>
        );
    };

    // ========================================
    // 🏆 TOP WORKERS WIDGET - FIXED
    // ========================================
    const renderTopWorkers = (opts = {}) => {
        if (!stats.hasData || stats.topWorkers.length === 0) {
            return (
                <div className="space-y-4">
                    {!opts.hideTitle && (
                        <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            🏆 {t.topWorkers}
                        </h3>
                    )}
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="text-3xl">👷‍♂️</span>
                        <p className="mt-2">{t.noData}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {!opts.hideTitle && (
                    <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        🏆 {t.topWorkers}
                    </h3>
                )}
                <div className="space-y-3">
                    {stats.topWorkers.slice(0, 5).map((worker, i) => {
                        const medalColor = i === 0 ? 'text-yellow-500' : 
                                         i === 1 ? 'text-gray-400' : 
                                         i === 2 ? 'text-orange-500' : 'text-gray-500';

                        return (
                            <div
                                key={i}
                                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                                } ${animated ? 'animate-fade-in' : ''}`}
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className={`text-lg font-bold ${medalColor}`}>
                                        #{i + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-sm truncate" title={worker.name}>
                                            {worker.name}
                                        </p>
                                        <p className={`text-xs ${textClass}`}>
                                            {worker.hours} {t.hours_short} {t.total}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className={`font-bold text-lg ${
                                        darkMode ? 'text-indigo-400' : 'text-indigo-600'
                                    }`}>
                                        {worker.hours}h
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ========================================
    // 📊 MAIN RENDER
    // ========================================

    // Fix: racchiudi tutto in un unico div
    return (
        <div className="space-y-6 animate-fade-in">
            {/* ========================================
                HEADER
                ======================================== */}
            <div className={`${cardClass} p-4 sm:p-6`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">
                            📊 {t.dashboard}
                        </h1>
                        <p className={`${textClass} mt-1 text-sm sm:text-base`}>
                            {t.dashboardOverview}
                        </p>
                    </div>
                    
                    {/* WIDGET OROLOGIO E SINCRONIZZAZIONE - Mobile Responsive */}
                    <div className={`${cardClass} p-3 sm:p-4 border-l-4 ${darkMode ? 'border-blue-500' : 'border-blue-600'} w-full sm:w-auto`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                            {/* Orologio Display */}
                            <div className="w-full sm:flex-1">
                                <div className={`${textClass} text-xs uppercase tracking-wide mb-1`}>
                                    {t.updated || 'Aggiornato'}
                                </div>
                                <div className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'} truncate`}>
                                    {now.toLocaleTimeString(localeTag)}
                                </div>
                            </div>

                            {/* Toggle Controls */}
                            <div className="flex flex-col gap-2 sm:gap-3 w-full sm:w-auto sm:border-l sm:pl-4 border-gray-300 dark:border-gray-600">
                                {/* Toggle Live Clock */}
                                <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
                                    <span className={`text-xs sm:text-sm font-medium ${textClass} truncate flex-1 sm:flex-none sm:min-w-[80px]`}>
                                        {t.liveClock || 'Orologio in tempo reale'}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                        <input 
                                            type="checkbox" 
                                            checked={!!liveClockEnabled} 
                                            onChange={(e) => setLiveClockEnabled(!!e.target.checked)} 
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {/* Toggle Auto Sync */}
                                <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
                                    <span className={`text-xs sm:text-sm font-medium ${textClass} truncate flex-1 sm:flex-none sm:min-w-[80px]`}>
                                        {t.autoSync || 'Sincronizzazione automatica'}
                                    </span>
                                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                        <input 
                                            type="checkbox" 
                                            checked={true}
                                            onChange={() => {
                                                if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                                                    window.showToast('🔄 ' + (t.syncing || 'Sincronizzazione...'), 'info');
                                                    setTimeout(() => {
                                                        window.showToast('✅ ' + (t.synced || 'Sincronizzato!'), 'success');
                                                    }, 1000);
                                                }
                                            }}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-green-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================
                METRICHE PRINCIPALI
                ======================================== */}
            {canViewStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    {
                        icon: '📅',
                        value: stats.todayHours,
                        labelKey: 'hoursToday',
                        color: 'green',
                        suffix: 'h'
                    },
                    {
                        icon: '📊',
                        value: stats.weeklyHours,
                        // label depends on selectedPeriod
                        labelKeyWeek: 'thisWeek',
                        labelKeyMonth: 'thisMonth',
                        color: 'blue',
                        suffix: 'h'
                    },
                    {
                        icon: '⏱️',
                        value: stats.overallTotalHours || 0,
                        labelKey: 'totalHoursAllTime',
                        color: 'indigo',
                        suffix: 'h'
                    },
                    {
                        icon: '👥',
                        value: stats.activeWorkers,
                        labelKey: 'activeWorkersLabel',
                        color: 'purple'
                    }
                ].map((metric, i) => {
                    // Resolve label with translation fallback
                    let label = '';
                    if (metric.labelKey) {
                        label = t[metric.labelKey];
                    } else if (metric.labelKeyWeek && metric.labelKeyMonth) {
                        const key = selectedPeriod === 'week' ? metric.labelKeyWeek : metric.labelKeyMonth;
                        label = t[key];
                    }

                    return (
                        <div
                            key={i}
                            onClick={metric.onClick}
                            className={`${cardClass} p-4 sm:p-6 border-l-4 border-${metric.color}-500 ${animated ? 'animate-fade-in' : ''} 
                                       ${metric.onClick ? 'cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-300' : ''}`}
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-sm sm:text-base font-semibold ${textClass} truncate`}>
                                    {label}
                                </h3>
                                <span className="text-xl sm:text-2xl">{metric.icon}</span>
                            </div>
                            <p className={`text-2xl sm:text-3xl font-bold text-${metric.color}-600 dark:text-${metric.color}-400`}>
                                {metric.value}{metric.suffix || ''}
                            </p>
                            <div className={`text-xs mt-2 ${textClass} flex items-center justify-between`}>
                                <span>
                                    {(() => {
                                        const sheetsCount = stats.totalSheets || (Array.isArray(sheets) ? sheets.length : 0);
                                        const updatedAt = new Date().toLocaleTimeString(localeTag);
                                        return `${t.metricCalculatedOn} ${sheetsCount} ${t.sheets} • ${updatedAt}`;
                                    })()}
                                </span>
                                {metric.onClick && <span className="text-indigo-500">👆 {t.clickToView || 'Clicca per dettagli'}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
            )}


            {/* ========================================
                WIDGET METEO ADMIN
                ======================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {canViewCharts && (
                <div className={`${cardClass} p-4 sm:p-6 relative`} style={{ zIndex: activeTooltip ? 9999 : 'auto' }}>
                    <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📊 {t.hoursProgress || 'Andamento ore'}</h3>
                    {renderAdvancedBarChart({ hideTitle: true })}
                </div>
                )}

                {/* Widget meteo - visibile solo con permesso charts o admin wildcard */}
                {canViewCharts && (
                <div className={`${cardClass} p-0 overflow-hidden`} style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Card title (theme-aware) */}
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                🌤️ {t.weatherTitle || 'Meteo'}
                            </h3>

                            {/* Small control: input + apply + refresh */}
                            <form onSubmit={(e) => { e.preventDefault(); applyWeatherLocation(); }} className="flex items-center gap-2 flex-shrink-0">
                                <input
                                    type="text"
                                    value={weatherInput}
                                    onChange={(e) => setWeatherInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyWeatherLocation(); } }}
                                    placeholder={t.weatherPlaceholderCity || 'Città, es. Roma'}
                                    className={`px-2 py-1 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} text-sm w-28 sm:w-36 flex-shrink min-w-0`}
                                    aria-label={t.weatherLabelLocation || 'Location'}
                                />
                                <button type="button" onClick={applyWeatherLocation} className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-semibold whitespace-nowrap ${darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'}`}>
                                    {t.update || 'Applica'}
                                </button>
                                <button type="button" onClick={() => setRefreshToken(r => r + 1)} title={t.updated || 'Aggiorna'} className={`px-2 py-1 rounded text-sm flex-shrink-0 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                    ⟳
                                </button>
                            </form>
                        </div>
                    </div>
                    {/* Full-width widget: widget fills the card */}
                    <div className="weather-area w-full flex items-stretch" style={{ flex: 1, height: '100%', minHeight: 140, ['--weather-bg-duration']: `${weatherBgDuration}s` }}>
                        <div className={`weather-area__bg weather-bg--${weatherIconKey || 'unknown'}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 12 }}></div>
                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <WeatherWidget fullHeight={true} location={weatherLocation} darkMode={darkMode} days={forecastDays} refreshToken={refreshToken} language={language} showControls={false} onWeatherChange={(key) => { if (key) setWeatherIconKey(key); }} />
                        </div>
                    </div>
                </div>
                )}
            </div>

            {/* ========================================
                GRAFICI AVANZATI RECHARTS
                ======================================== */}
            {React.useMemo(() => {
                if (!canViewCharts) return null;
                
                const { DailyHoursLineChart, TopItemsBarChart, DistributionPieChart, CumulativeAreaChart, PerformanceRadarChart, ActivityPolarChart, TimeDistributionChart, TopLocationsChart, TrendChart, WeekdayDistributionChart, EfficiencyChart, WeeklyGrowthChart } = window.AdvancedCharts || {};
                // Se AdvancedCharts non è caricato, non mostrare nulla
                if (!DailyHoursLineChart || !TopItemsBarChart || !DistributionPieChart || !ActivityPolarChart) return null;
                
                // Prepara dati per grafici
                const lineData = stats.chartData.slice(-30).map(d => ({
                    day: d.label || d.day,
                    hours: d.hours || 0
                }));
                
                const topCompaniesData = stats.topCompanies.slice(0, 5).map(c => ({
                    name: c.name,
                    value: parseFloat(c.hours.toFixed(1))
                }));
                
                const topWorkersData = stats.topWorkers.slice(0, 5).map(w => ({
                    name: w.name,
                    value: parseFloat(w.hours.toFixed(1))
                }));
                
                // Distribuzione status fogli
                const statusData = [
                    { name: t.completed || 'Completati', value: stats.completedSheets },
                    { name: t.draft || 'Bozze', value: stats.draftSheets },
                    { name: t.archived || 'Archiviati', value: stats.archivedSheets }
                ].filter(s => s.value > 0);
                
                // Dati cumulativi
                let cumulative = 0;
                const cumulativeData = lineData.map(d => {
                    cumulative += d.hours;
                    return {
                        day: d.day,
                        cumulative: parseFloat(cumulative.toFixed(1))
                    };
                });
                
                // 🎨 Aggregazione ore per tipo di attività (tutti i fogli)
                const activityHoursMap = {};
                sheets.forEach(sheet => {
                    if (sheet.archiviato) return; // Salta fogli archiviati
                    
                    // Calcola ore totali sommando tutte le ore dei lavoratori
                    const hours = sheet.lavoratori?.reduce((sum, worker) => {
                        const workerHours = parseFloat(worker.oreTotali || 0);
                        return sum + (isNaN(workerHours) ? 0 : workerHours);
                    }, 0) || 0;
                    
                    if (sheet.tipoAttivita && Array.isArray(sheet.tipoAttivita) && hours > 0) {
                        const hoursPerActivity = hours / sheet.tipoAttivita.length;
                        sheet.tipoAttivita.forEach(activityId => {
                            activityHoursMap[activityId] = (activityHoursMap[activityId] || 0) + hoursPerActivity;
                        });
                    }
                });
                
                // Crea dati radar per attività - PERCENTUALE SUL TOTALE
                const totalActivityHours = Object.values(activityHoursMap).reduce((sum, h) => sum + h, 0) || 1;
                const activityRadarData = Object.entries(activityHoursMap)
                    .map(([activityId, hours]) => {
                        const activity = appSettings.tipiAttivita?.find(a => a.id === activityId);
                        const activityName = activity ? `${activity.emoji || ''} ${activity.nome || activityId}` : `Attività #${activityId}`;
                        const percentage = Math.round((hours / totalActivityHours) * 100);
                        
                        return {
                            metric: activityName,
                            value: percentage
                        };
                    })
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 8); // Max 8 attività
                
                return React.createElement('div', null,
                    // 📈 Trend Chart con previsioni (full width) - PASSA TUTTI I FOGLI
                    TrendChart ? React.createElement(TrendChart, {
                        sheets: sheets, // ✅ Passa TUTTI i fogli (il componente gestisce i filtri internamente)
                        darkMode,
                        title: `📈 ${t.trendAnalysis || 'Analisi Trend e Previsioni'}`
                    }) : null,
                    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6' },
                    React.createElement(DailyHoursLineChart, {
                        data: lineData,
                        darkMode,
                        title: `📈 ${t.dailyTrend || 'Andamento Giornaliero'} (ultimi 30 giorni)`
                    }),
                    canViewCharts ? React.createElement(TopItemsBarChart, {
                        data: topCompaniesData,
                        darkMode,
                        title: `🏢 ${t.topCompanies || 'Top Aziende'}`
                    }) : null,
                    canViewCharts ? React.createElement(TopItemsBarChart, {
                        data: topWorkersData,
                        darkMode,
                        title: `👷 ${t.topWorkers || 'Top Lavoratori'}`
                    }) : null,
                    React.createElement(DistributionPieChart, {
                        data: statusData,
                        darkMode,
                        title: `🥧 ${t.sheetsDistribution || 'Distribuzione Fogli'}`
                    }),
                    // 🎨 Grafico Circolare Tipi di Attività (se ci sono dati)
                    activityRadarData.length > 0 ? React.createElement(ActivityPolarChart, {
                        data: activityRadarData,
                        darkMode,
                        title: `🎨 ${t.activityTypes || 'Tipi di Attività'} - Distribuzione %`
                    }) : null,
                    // ⏰ Grafico Distribuzione Oraria (dati REALI da oraIn/oraOut)
                    (canViewCharts && TimeDistributionChart) ? React.createElement(TimeDistributionChart, {
                        sheets: sheets.filter(s => !s.archived),
                        darkMode,
                        title: `⏰ ${t.timeDistribution || 'Distribuzione Ore: Fascia Oraria'}`
                    }) : null,
                    // 📍 Grafico Top Locations (NUOVO)
                    (canViewCharts && TopLocationsChart) ? React.createElement(TopLocationsChart, {
                        sheets: sheets.filter(s => !s.archived),
                        darkMode,
                        title: `📍 ${t.topLocations || 'Top Locations - Dove si lavora di più'}`
                    }) : null,
                    
                    // 📅 Grafico Distribuzione Settimanale (NUOVO)
                    (canViewCharts && WeekdayDistributionChart) ? React.createElement(WeekdayDistributionChart, {
                        sheets: sheets,
                        darkMode,
                        title: `📅 ${t.weeklyDistribution || 'Distribuzione Settimanale'}`
                    }) : null,
                    
                    // 🎯 Grafico Efficienza (NUOVO)
                    (canViewCharts && EfficiencyChart) ? React.createElement(EfficiencyChart, {
                        sheets: sheets,
                        darkMode,
                        title: `🎯 ${t.efficiencyChart || 'Efficienza: Stimate vs Effettive'}`
                    }) : null,
                    
                    // 📈 Grafico Crescita Settimanale (NUOVO)
                    (canViewCharts && WeeklyGrowthChart) ? React.createElement(WeeklyGrowthChart, {
                        sheets: sheets,
                        darkMode,
                        title: `📈 ${t.weeklyGrowth || 'Crescita Settimanale'}`
                    }) : null
                    )
                );
            }, [canViewCharts, sheets, darkMode, language, stats, appSettings])}


            {/* ========================================
                TABELLA E WIDGETS
                ======================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`${cardClass} p-4 sm:p-6 lg:col-span-2`}>
                    <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📋 {t.recentActivity || 'Attività Recenti'}</h3>
                    {renderActivityTable({ hideTitle: true })}
                </div>

                <div className="space-y-6">
                    <div className={`${cardClass} p-4 sm:p-6`}>
                        <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📈 {t.performance || 'Performance'}</h3>
                        {renderPerformanceWidget({ hideTitle: true })}
                    </div>

                    <div className={`${cardClass} p-4 sm:p-6`}>
                        <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🔔 {t.notifications || 'Notifiche'}</h3>
                        {renderNotificationsWidget({ hideTitle: true })}
                    </div>
                </div>
            </div>

            {/* ========================================
                WIDGETS AGGIUNTIVI
                ======================================== */}
            <div className="grid grid-cols-1 gap-6">
                <div className={`${cardClass} p-4 sm:p-6`}>
                    <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🏆 {t.topWorkers || 'Top lavoratori'}</h3>
                    {renderTopWorkers({ hideTitle: true })}
                </div>
            </div>

            {/* ========================================
                STATISTICHE AGGIUNTIVE
                ======================================== */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6">
                {/* Stat: Total Sheets (Overall - non-archived) */}
                <div className={`${cardClass} p-4 text-center ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `800ms` }}>
                    <div className="text-2xl mb-2">📋</div>
                    <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.overallTotalSheets}</div>
                    <div className={`text-sm font-semibold mt-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.totalSheets}</div>
                </div>
                {/* Stat: Draft Sheets (Overall) */}
                <div className={`${cardClass} p-4 text-center ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `900ms` }}>
                    <div className="text-2xl mb-2">✏️</div>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{Array.isArray(sheets) ? sheets.filter(s => s.status === 'draft').length : 0}</div>
                    <div className={`text-sm font-semibold mt-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.inDraft}</div>
                </div>
                {/* Stat: Archived Sheets (Overall) */}
                <div className={`${cardClass} p-4 text-center ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `1000ms` }}>
                    <div className="text-2xl mb-2">📦</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{Array.isArray(sheets) ? sheets.filter(s => s.archived === true).length : 0}</div>
                    <div className={`text-sm font-semibold mt-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.archivedSheets}</div>
                </div>
                {/* Stat: Total Unique Workers (Overall) */}
                <div className={`${cardClass} p-4 text-center ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `1100ms` }}>
                    <div className="text-2xl mb-2">👷</div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.activeWorkers}</div>
                    <div className={`text-sm font-semibold mt-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.totalWorkers}</div>
                </div>
                {/* Stat: All-Time Hours (Overall completed sheets) */}
                <div className={`${cardClass} p-4 text-center border-2 border-green-500 bg-green-50 dark:bg-green-900/30 ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `1200ms` }}>
                    <div className="text-2xl mb-2">⏳</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{stats.overallTotalHours}h</div>
                    <div className={`text-sm font-semibold mt-2 ${darkMode ? 'text-green-200' : 'text-green-700'}`}>{t.totalHoursAllTime || 'Ore totali (fogli completati)'}</div>
                </div>
            </div>
        </div>
    );
};

// Expose globally and close guard
window.Dashboard = Dashboard;
}
