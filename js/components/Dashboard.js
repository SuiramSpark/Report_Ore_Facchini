// WeatherWidget is exposed globally as window.WeatherWidget
// NOTE: we'll resolve it inside the component with a safe fallback to avoid rendering undefined
// ...existing code...

// ========================================
// 📊 DASHBOARD COMPONENT - v4.2 FIXED - Assicurati di usare solo import ES6, non require
// ========================================
// (La dichiarazione duplicata di Dashboard è stata rimossa. Usare solo quella dopo calculateAdvancedStats)

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

    // Overall counts (not limited to period)
    const overallTotalSheets = Array.isArray(sheets) ? sheets.length : 0;
    const overallCompletedSheets = Array.isArray(sheets) ? sheets.filter(s => s.status === 'completed').length : 0;
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
        activeWorkers: totalWorkers,
        efficiency,
        workerMap,
        chartDayKeys,
        hasData: totalHours > 0
    };
}

// ========================================
// 📊 DASHBOARD COMPONENT - v4.2 FIXED
// ========================================
if (!window.Dashboard) {
const Dashboard = ({ sheets, darkMode, language = 'it', weekStart = 1 }) => {
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
                                <div key={label} className={`flex items-center gap-3 group ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                                    <span className={`text-xs font-medium w-16 text-right truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                                    <div className="flex-1 h-5 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden relative flex items-center">
                                        {/* Render stacked segments */}
                                        {segments.length === 0 ? (
                                            <div className="w-full h-full text-center text-xs text-gray-500 flex items-center justify-center">{t.noData}</div>
                                        ) : (
                                            segments.map((seg, idx) => {
                                                const width = maxHours > 0 ? (seg.hours / maxHours) * 100 : 0;
                                                const tooltipId = `${label}-${idx}`;
                                                const isActive = activeTooltip === tooltipId;
                                                
                                                return (
                                                    <div
                                                        key={seg.name + idx}
                                                        className={`h-full relative cursor-pointer transition-opacity ${isActive ? 'z-[100]' : ''}`}
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
                                                                className={`fixed px-4 py-3 rounded-xl shadow-2xl whitespace-nowrap animate-fade-in pointer-events-none ${
                                                                    darkMode ? 'bg-gray-900/98 text-white border-2 border-indigo-400' : 'bg-white/98 text-gray-900 border-2 border-indigo-500'
                                                                }`}
                                                                style={{ 
                                                                    minWidth: '150px',
                                                                    zIndex: 9999,
                                                                    left: '50%',
                                                                    top: '50%',
                                                                    transform: 'translate(-50%, -150%)',
                                                                    backdropFilter: 'blur(16px)'
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <div className="text-lg font-bold mb-1">{seg.name}</div>
                                                                <div className={`text-base font-bold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                                                    {seg.hours.toFixed(1)} ore
                                                                </div>
                                                                {/* Arrow */}
                                                                <div 
                                                                    className="absolute left-1/2 transform -translate-x-1/2"
                                                                    style={{
                                                                        bottom: '-10px',
                                                                        width: 0,
                                                                        height: 0,
                                                                        borderLeft: '8px solid transparent',
                                                                        borderRight: '8px solid transparent',
                                                                        borderTop: `10px solid ${darkMode ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)'}`
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
                    {/* Completed / Total (overall) */}
                    <div className={`col-span-2`}> 
                        <div className={`flex justify-between text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} title={`${stats.overallCompletedSheets} / ${stats.overallTotalSheets}`}>
                            <span>{t.completedSheets}</span>
                            <span className="font-semibold">{stats.overallCompletedSheets} / {stats.overallTotalSheets}</span>
                        </div>
                        <div className={`w-full rounded-full h-2 overflow-hidden ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                            <div
                                className={`h-2 rounded-full transition-all duration-1000 ${
                                    darkMode 
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                                }`}
                                style={{ width: `${stats.efficiency}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Extra small widget: Unique workers */}
                    <div className={`text-center p-3 rounded-lg shadow-sm border ${darkMode ? 'border-indigo-700' : 'border-transparent'}`}>
                        <div className={`p-2 rounded-lg ${darkMode ? 'bg-gradient-to-br from-indigo-700 to-indigo-500 text-white' : 'bg-gradient-to-br from-indigo-500 to-indigo-300 text-white'}`} title={`${stats.totalWorkers} ${t.uniqueWorkers || 'Lavoratori unici'}`}>
                            <div className="text-lg font-bold">{stats.totalWorkers}</div>
                            <div className="text-xs opacity-90 mt-1">{t.uniqueWorkers}</div>
                        </div>
                    </div>
                </div>

                {/* Extra widget row: Total hours in period */}
                <div className={`mt-2 p-3 rounded-lg ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xl font-bold">{stats.weeklyHours}h</div>
                            <div className="text-xs opacity-90 mt-1">{t.totalHoursPeriod}</div>
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
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-3">
                            <div className="text-sm mr-4">
                                <div className={`${textClass}`}>{t.updated}</div>
                                <div className="text-lg font-semibold">
                                    {now.toLocaleTimeString(localeTag)}
                                </div>
                            </div>

                            {/* Live clock toggle (desktop-focused) */}
                            <div className="flex items-center gap-2 text-sm">
                                <label className={`flex items-center gap-2 cursor-pointer ${textClass}`} title={t.liveClock || 'Live clock'}>
                                    <input type="checkbox" checked={!!liveClockEnabled} onChange={(e) => setLiveClockEnabled(!!e.target.checked)} className="rounded" />
                                    <span className="select-none">{t.liveClock || 'Live'}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================
                METRICHE PRINCIPALI
                ======================================== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    {
                        icon: '📅',
                        value: stats.todayHours,
                        labelKey: 'hoursToday',
                        fallback: {
                            it: 'Ore oggi', en: 'Hours today', es: 'Horas hoy', fr: "Heures aujourd'hui", ro: 'Ore azi'
                        },
                        color: 'green',
                        suffix: 'h'
                    },
                    {
                        icon: '📊',
                        value: stats.weeklyHours,
                        // label depends on selectedPeriod
                        labelKeyWeek: 'thisWeek',
                        labelKeyMonth: 'thisMonth',
                        fallback: {
                            it: 'Questa settimana', en: 'This week', es: 'Esta semana', fr: 'Cette semaine', ro: 'Săptămâna aceasta'
                        },
                        color: 'blue',
                        suffix: 'h'
                    },
                    {
                        icon: '👥',
                        value: stats.activeWorkers,
                        labelKey: 'activeWorkersLabel',
                        fallback: {
                            it: 'Lavoratori attivi', en: 'Active workers', es: 'Trabajadores activos', fr: 'Travailleurs actifs', ro: 'Lucrători activi'
                        },
                        color: 'purple'
                    },
                    {
                        icon: '✅',
                        value: stats.completedSheets,
                        labelKey: 'completedSheetsLabel',
                        fallback: {
                            it: 'Fogli completati', en: 'Completed sheets', es: 'Hojas completadas', fr: 'Feuilles terminées', ro: 'Foi finalizate'
                        },
                        color: 'orange'
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
                            className={`${cardClass} p-4 sm:p-6 border-l-4 border-${metric.color}-500 ${animated ? 'animate-fade-in' : ''}`}
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
                            <div className={`text-xs mt-2 ${textClass}`}>
                                {/* Small provenance line: number of sheets used + last update time */}
                                {(() => {
                                    const sheetsCount = stats.totalSheets || (Array.isArray(sheets) ? sheets.length : 0);
                                    const updatedAt = new Date().toLocaleTimeString(localeTag);
                                    return `${t.metricCalculatedOn} ${sheetsCount} ${t.sheets} • ${updatedAt}`;
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>


            {/* ========================================
                WIDGET METEO ADMIN
                ======================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${cardClass} p-4 sm:p-6`}>
                    <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>📊 {t.hoursProgress || 'Andamento ore'}</h3>
                    {renderAdvancedBarChart({ hideTitle: true })}
                </div>

                <div className={`${cardClass} p-0 overflow-hidden`} style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Card title (theme-aware) */}
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                🌤️ {t.weatherTitle || 'Meteo'}
                            </h3>

                            {/* Small control: input + apply + refresh */}
                            <form onSubmit={(e) => { e.preventDefault(); applyWeatherLocation(); }} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={weatherInput}
                                    onChange={(e) => setWeatherInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyWeatherLocation(); } }}
                                    placeholder={t.weatherPlaceholderCity || 'Città, es. Roma'}
                                    className={`px-2 py-1 rounded border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} text-sm w-36`}
                                    aria-label={t.weatherLabelLocation || 'Location'}
                                />
                                <button type="button" onClick={applyWeatherLocation} className={`px-3 py-1 rounded text-sm font-semibold ${darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'}`}>
                                    {t.update || 'Applica'}
                                </button>
                                <button type="button" onClick={() => setRefreshToken(r => r + 1)} title={t.updated || 'Aggiorna'} className={`px-2 py-1 rounded text-sm ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}>
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
            </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${cardClass} p-4 sm:p-6`}>
                    <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🏆 {t.topWorkers || 'Top lavoratori'}</h3>
                    {renderTopWorkers({ hideTitle: true })}
                </div>

                <div className={`${cardClass} p-4 sm:p-6`}>
                    <h3 className={`font-semibold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>🕐 {t.hourlyDistribution || 'Distribuzione oraria'}</h3>
                    {renderHourlyChart({ hideTitle: true })}
                </div>
            </div>

            {/* ========================================
                STATISTICHE AGGIUNTIVE
                ======================================== */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6">
                {/* Stat: Total Sheets */}
                <div className={`${cardClass} p-4 text-center ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `800ms` }}>
                    <div className="text-2xl mb-2">📋</div>
                    <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalSheets}</div>
                    <div className={`text-sm font-semibold mt-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.totalSheets}</div>
                </div>
                {/* Stat: Draft Sheets */}
                <div className={`${cardClass} p-4 text-center ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `900ms` }}>
                    <div className="text-2xl mb-2">✏️</div>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.draftSheets}</div>
                    <div className={`text-sm font-semibold mt-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.inDraft}</div>
                </div>
                {/* Stat: Archived Sheets */}
                <div className={`${cardClass} p-4 text-center ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `1000ms` }}>
                    <div className="text-2xl mb-2">📦</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.archivedSheets}</div>
                    <div className={`text-sm font-semibold mt-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.archivedSheets}</div>
                </div>
                {/* Stat: Total Workers */}
                <div className={`${cardClass} p-4 text-center ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `1100ms` }}>
                    <div className="text-2xl mb-2">👷</div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalWorkers}</div>
                    <div className={`text-sm font-semibold mt-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.totalWorkers}</div>
                </div>
                {/* Stat: All-Time Hours (NEW) */}
                <div className={`${cardClass} p-4 text-center border-2 border-green-500 bg-green-50 dark:bg-green-900/30 ${animated ? 'animate-fade-in' : ''}`} style={{ animationDelay: `1200ms` }}>
                    <div className="text-2xl mb-2">⏳</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{stats.overallTotalHours}h</div>
                    <div className={`text-sm font-semibold mt-2 ${darkMode ? 'text-green-200' : 'text-green-700'}`}>{t.totalHoursAllTime || 'Ore totali (tutti i fogli)'}</div>
                </div>
            </div>
        </div>
    );
};

// Expose globally and close guard
window.Dashboard = Dashboard;
}
