// Dashboard Component - v4.2 FIXED - Statistiche Corrette + Visualizzazione Ottimizzata
// ========================================
// UTILITY: Format Date
// ========================================
function formatDate(dateString) {
    if (!dateString) return 'N/D';
    const date = new Date(dateString);
    if (isNaN(date)) return 'N/D';
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ========================================
// 📊 CALCOLO STATISTICHE AVANZATE - FIXED
// ========================================
function calculateAdvancedStats(sheets = [], period = 'week') {
    if (!Array.isArray(sheets) || sheets.length === 0) {
        return {
            chartData: [],
            topCompanies: [],
            topWorkers: [],
            hourlyDistribution: new Array(24).fill(0),
            totalSheets: 0,
            draftSheets: 0,
            archivedSheets: 0,
            totalWorkers: 0,
            completedSheets: 0,
            todayHours: 0,
            weeklyHours: 0,
            avgDailyHours: 0,
            activeWorkers: 0,
            efficiency: 0,
            hasData: false
        };
    }

    const now = new Date();
    const periodStart = new Date(now);
    const daysInPeriod = period === 'week' ? 7 : 30;
    periodStart.setDate(now.getDate() - (daysInPeriod - 1));
    periodStart.setHours(0, 0, 0, 0);

    // Filter sheets by period
    const filtered = sheets.filter(s => {
        if (!s.data && !s.createdAt) return false;
        const d = new Date(s.data || s.createdAt);
        return d >= periodStart && d <= now;
    });

    // 🔧 FIX: Pre-popola chartMap con tutti i giorni (anche 0 ore)
    const chartMap = {};
    for (let i = 0; i < daysInPeriod; i++) {
        const date = new Date(periodStart);
        date.setDate(periodStart.getDate() + i);
        const label = date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
        chartMap[label] = 0;
    }

    const hourlyDistribution = new Array(24).fill(0);
    const companyMap = {};
    const workerMap = {};
    let totalHours = 0;
    let completedSheets = 0;

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
        const azienda = sheet.titoloAzienda || 'Sconosciuta';
        companyMap[azienda] = (companyMap[azienda] || 0) + sheetHours;

        // Worker stats and hourly distribution
        for (const w of workers) {
            const name = `${w.nome || ''} ${w.cognome || ''}`.trim() || 'Anonimo';
            const workerHours = parseFloat(w.oreTotali || 0);
            if (!isNaN(workerHours)) {
                workerMap[name] = (workerMap[name] || 0) + workerHours;
            }

            // 🔧 FIX: Calcola distribuzione oraria corretta
            if (w.oraEntrata && w.oraUscita) {
                const [entryHour, entryMin] = w.oraEntrata.split(':').map(Number);
                const [exitHour, exitMin] = w.oraUscita.split(':').map(Number);

                if (!isNaN(entryHour) && !isNaN(entryMin) && !isNaN(exitHour) && !isNaN(exitMin)) {
                    const entryTime = entryHour + (entryMin / 60);
                    const exitTime = exitHour + (exitMin / 60);
                    const pausaOre = (parseFloat(w.pausa || 0) / 60);

                    // Distribuisci le ore negli slot orari
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
        .map(([name, hours]) => ({ name, hours: Math.round(hours * 100) / 100 }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5);

    // Calculate metrics
    const totalSheets = filtered.length;
    const draftSheets = filtered.filter(s => s.status === 'draft').length;
    const archivedSheets = filtered.filter(s => s.archived).length;
    const totalWorkers = Object.keys(workerMap).length;

    // 🔧 FIX: Media giornaliera - conta solo giorni con ore effettive
    const daysWithHours = Object.values(chartMap).filter(h => h > 0).length;
    const avgDailyHours = daysWithHours > 0 
        ? Math.round((totalHours / daysWithHours) * 10) / 10 
        : 0;

    // Today's hours
    const todayLabel = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
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
        draftSheets,
        archivedSheets,
        totalWorkers,
        completedSheets,
        todayHours,
        weeklyHours: Math.round(totalHours * 10) / 10,
        avgDailyHours,
        activeWorkers: totalWorkers,
        efficiency,
        hasData: totalHours > 0
    };
}

// ========================================
// 📊 DASHBOARD COMPONENT - v4.2 FIXED
// ========================================
const Dashboard = ({ sheets, darkMode, language = 'it' }) => {
    const t = translations[language];
    const [selectedPeriod, setSelectedPeriod] = React.useState('week');
    const [loading, setLoading] = React.useState(false);
    const [animated, setAnimated] = React.useState(false);
    const [hasMounted, setHasMounted] = React.useState(false);

    const cardClass = `${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl shadow-lg dashboard-card`;
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';

    // 📊 Calcolo statistiche avanzate
    const stats = React.useMemo(() => {
        return calculateAdvancedStats(sheets, selectedPeriod);
    }, [sheets, selectedPeriod]);

    // Stabilize loading state to prevent flickering
    React.useEffect(() => {
        setHasMounted(true);
        setAnimated(true);
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (!hasMounted) {
        return null; // Avoid rendering until the component has mounted
    }

    // ========================================
    // 🎯 GRAFICO A BARRE AVANZATO - FIXED
    // ========================================
    const renderAdvancedBarChart = () => {
        const maxHours = Math.max(...stats.chartData.map(day => day.hours), 1);
        const colors = ['#4f46e5', '#7c3aed', '#a855f7', '#c084fc', '#d946ef', '#ec4899', '#f97316'];

        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        📈 {t.hoursProgress || 'Andamento Ore'}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedPeriod('week')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                selectedPeriod === 'week'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : darkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {t.days7 || '7 giorni'}
                        </button>
                        <button
                            onClick={() => setSelectedPeriod('month')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                selectedPeriod === 'month'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : darkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {t.days30 || '30 giorni'}
                        </button>
                    </div>
                </div>

                {stats.hasData ? (
                    <div className="space-y-3">
                        {stats.chartData.map((day, i) => {
                            const percentage = maxHours > 0 ? (day.hours / maxHours) * 100 : 0;
                            const color = colors[i % colors.length];

                            return (
                                <div
                                    key={i}
                                    className={`flex items-center gap-3 group ${animated ? 'animate-fade-in' : ''}`}
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    <span className={`text-xs font-medium w-16 text-right truncate ${
                                        darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        {day.label}
                                    </span>
                                    <div className="flex-1 relative">
                                        <div className={`rounded-full h-5 overflow-hidden ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                        }`}>
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: color
                                                }}
                                            ></div>
                                        </div>
                                        {day.hours > 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className={`text-xs font-semibold ${
                                                    percentage > 20 ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'
                                                }`}>
                                                    {day.hours}h
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="text-3xl">📊</span>
                        <p className="mt-2">{t.noData || 'Nessun dato per il periodo selezionato'}</p>
                    </div>
                )}
            </div>
        );
    };

    // ========================================
    // 🍰 GRAFICO A TORTA - FIXED
    // ========================================
    const renderPieChart = () => {
        const totalHours = stats.topCompanies.reduce((sum, company) => sum + company.hours, 0);
        const colors = ['#4f46e5', '#7c3aed', '#a855f7', '#c084fc', '#d946ef'];

        if (!stats.hasData || totalHours === 0) {
            return (
                <div className="space-y-4">
                    <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        🏢 {t.companyDistribution || 'Distribuzione Aziende'}
                    </h3>
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="text-3xl">💼</span>
                        <p className="mt-2">{t.noData || 'Nessun dato aziendale'}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    🏢 {t.companyDistribution || 'Distribuzione Aziende'}
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    {/* SVG Pie Chart */}
                    <svg viewBox="0 0 128 128" className="w-32 h-32 sm:w-40 sm:h-40">
                        {stats.topCompanies.map((company, i) => {
                            const percentage = (company.hours / totalHours) * 100;
                            const circumference = 2 * Math.PI * 45;
                            const strokeDasharray = circumference;
                            const strokeDashoffset = circumference - (percentage / 100) * circumference;
                            const rotation = stats.topCompanies.slice(0, i).reduce((sum, c) =>
                                sum + (c.hours / totalHours) * 360, 0
                            );

                            return (
                                <circle
                                    key={i}
                                    cx="64"
                                    cy="64"
                                    r="45"
                                    fill="transparent"
                                    stroke={colors[i]}
                                    strokeWidth="20"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    transform={`rotate(${rotation - 90} 64 64)`}
                                    className="transition-all duration-1000 ease-out"
                                />
                            );
                        })}
                        <text
                            x="64"
                            y="64"
                            textAnchor="middle"
                            dy="0.3em"
                            className={`text-base font-bold fill-current ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}
                        >
                            {totalHours}h
                        </text>
                    </svg>

                    {/* Legend */}
                    <div className="space-y-3 flex-1 min-w-0">
                        {stats.topCompanies.map((company, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: colors[i] }}
                                    ></div>
                                    <span
                                        className={`truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                        title={company.name}
                                    >
                                        {company.name}
                                    </span>
                                </div>
                                <span className={`font-semibold text-right flex-shrink-0 ml-2 ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                    {company.hours}h
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // ========================================
    // 🕐 GRAFICO DISTRIBUZIONE ORARIA - FIXED
    // ========================================
    const renderHourlyChart = () => {
        const maxHourly = Math.max(...stats.hourlyDistribution.slice(6, 22), 1);

        return (
            <div className="space-y-4">
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    🕐 {t.hourlyDistribution || 'Distribuzione Oraria'}
                </h3>
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
                            {t.workingHours || 'Orario lavorativo'}: 6:00 - 22:00
                        </div>
                    </>
                ) : (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="text-3xl">🕐</span>
                        <p className="mt-2">{t.noData || 'Nessun dato orario'}</p>
                    </div>
                )}
            </div>
        );
    };

    // ========================================
    // 📋 TABELLA ATTIVITÀ RECENTI - FIXED
    // ========================================
    const renderActivityTable = () => {
        const recentActivities = sheets
            .filter(s => s.data || s.createdAt)
            .sort((a, b) => {
                const dateA = new Date(a.data || a.createdAt);
                const dateB = new Date(b.data || b.createdAt);
                return dateB - dateA;
            })
            .slice(0, 10);

        const getStatusBadge = (sheet) => {
            if (sheet.archived) return { text: t.archived || 'Archiviato', color: 'bg-gray-500' };
            if (sheet.status === 'completed') return { text: t.completed || 'Completato', color: 'bg-green-600' };
            return { text: t.draft || 'Bozza', color: 'bg-yellow-600' };
        };

        if (recentActivities.length === 0) {
            return (
                <div className="space-y-4">
                    <h3 className={`font-semibold text-lg flex items-center gap-2 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        <span>📋</span> {t.recentActivity || 'Attività Recenti'}
                    </h3>
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="text-3xl">📝</span>
                        <p className="mt-2">{t.noRecentActivity || 'Nessuna attività recente'}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <h3 className={`font-semibold text-lg flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                    <span>📋</span> {t.recentActivity || 'Attività Recenti'}
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-semibold">{t.company || 'Azienda'}</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold hidden sm:table-cell">{t.date || 'Data'}</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold">{t.workers || 'Lavoratori'}</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold hidden md:table-cell">{t.hours || 'Ore'}</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold">{t.status || 'Stato'}</th>
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
                                                {sheet.titoloAzienda || 'N/D'}
                                            </div>
                                            {sheet.responsabile && (
                                                <div className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {sheet.responsabile}
                                                </div>
                                            )}
                                        </td>
                                        <td className={`px-3 py-3 text-sm hidden sm:table-cell ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                                            {formatDate(sheet.data || sheet.createdAt)}
                                        </td>
                                        <td className={`px-3 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                            <span className="font-semibold">{sheet.lavoratori?.length || 0}</span>
                                        </td>
                                        <td className={`px-3 py-3 text-sm font-semibold hidden md:table-cell ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {totalHours.toFixed(1)}h
                                        </td>
                                        <td className="px-3 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${status.color}`}>
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
    const renderPerformanceWidget = () => {
        return (
            <div className="space-y-4">
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    📈 {t.performance || 'Performance'}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                    <div className={`text-center p-4 rounded-lg ${
                        darkMode 
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600' 
                            : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                    } text-white shadow-lg`}>
                        <div className="text-2xl font-bold">{stats.efficiency}%</div>
                        <div className="text-xs opacity-90 mt-1">{t.efficiency || 'Efficienza'}</div>
                    </div>

                    <div className={`text-center p-4 rounded-lg ${
                        darkMode 
                            ? 'bg-gradient-to-br from-green-600 to-emerald-600' 
                            : 'bg-gradient-to-br from-green-500 to-emerald-500'
                    } text-white shadow-lg`}>
                        <div className="text-2xl font-bold">{stats.avgDailyHours}h</div>
                        <div className="text-xs opacity-90 mt-1">{t.avgDaily || 'Media Giornaliera'}</div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className={`flex justify-between text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span>{t.completedSheets || 'Fogli Completati'}</span>
                        <span className="font-semibold">{stats.completedSheets} / {stats.totalSheets}</span>
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
            </div>
        );
    };

    // ========================================
    // 🔔 WIDGET NOTIFICHE - FIXED
    // ========================================
    const renderNotificationsWidget = () => {
        const pendingSheets = sheets.filter(s =>
            !s.archived && s.status === 'draft' && s.lavoratori?.length > 0
        ).length;

        const unsignedSheets = sheets.filter(s =>
            !s.archived && s.status === 'draft' && s.lavoratori?.length > 0 && !s.firmaResponsabile
        ).length;

        return (
            <div className="space-y-4">
                <h3 className={`font-semibold text-lg flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                    <span>🔔</span> {t.notifications || 'Notifiche'}
                </h3>

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
                                    {pendingSheets} {t.sheetsWaiting || 'fogli in attesa'}
                                </div>
                                <div className={`text-xs ${
                                    darkMode ? 'text-yellow-400' : 'text-yellow-600'
                                }`}>
                                    {t.completeToGeneratePDF || 'Completa per generare PDF'}
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
                                    {unsignedSheets} {t.toSign || 'da firmare'}
                                </div>
                                <div className={`text-xs ${
                                    darkMode ? 'text-orange-400' : 'text-orange-600'
                                }`}>
                                    {t.responsibleSignatureMissing || 'Firma responsabile mancante'}
                                </div>
                            </div>
                        </div>
                    )}

                    {pendingSheets === 0 && unsignedSheets === 0 && (
                        <div className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className="text-3xl">🎉</span>
                            <div className="text-sm mt-2">{t.allDone || 'Tutto fatto!'}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ========================================
    // 🏆 TOP WORKERS WIDGET - FIXED
    // ========================================
    const renderTopWorkers = () => {
        if (!stats.hasData || stats.topWorkers.length === 0) {
            return (
                <div className="space-y-4">
                    <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        🏆 {t.topWorkers || 'Top Lavoratori'}
                    </h3>
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="text-3xl">👷</span>
                        <p className="mt-2">{t.noData || 'Nessun dato disponibile'}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    🏆 {t.topWorkers || 'Top Lavoratori'}
                </h3>
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
                                            {worker.hours} {t.hours_short || 'h'} {t.total || 'totali'}
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
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ========================================
                HEADER
                ======================================== */}
            <div className={`${cardClass} p-4 sm:p-6`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">
                            📊 {t.dashboard || 'Dashboard'}
                        </h1>
                        <p className={`${textClass} mt-1 text-sm sm:text-base`}>
                            {t.dashboardOverview || 'Panoramica generale del sistema'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`text-sm ${textClass}`}>{t.updated || 'Aggiornato'}</p>
                        <p className="text-lg font-semibold">
                            {new Date().toLocaleTimeString(
                                language === 'it' ? 'it-IT' : 
                                language === 'en' ? 'en-US' : 
                                language === 'es' ? 'es-ES' : 
                                language === 'fr' ? 'fr-FR' : 'ro-RO'
                            )}
                        </p>
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
                        label: t.hoursToday || 'Ore Oggi',
                        color: 'green',
                        suffix: 'h'
                    },
                    {
                        icon: '📊',
                        value: stats.weeklyHours,
                        label: selectedPeriod === 'week' ? (t.thisWeek || 'Questa Settimana') : (t.thisMonth || 'Questo Mese'),
                        color: 'blue',
                        suffix: 'h'
                    },
                    {
                        icon: '👥',
                        value: stats.activeWorkers,
                        label: t.activeWorkersLabel || 'Lavoratori Attivi',
                        color: 'purple'
                    },
                    {
                        icon: '✅',
                        value: stats.completedSheets,
                        label: t.completedSheetsLabel || 'Fogli Completati',
                        color: 'orange'
                    }
                ].map((metric, i) => (
                    <div
                        key={i}
                        className={`${cardClass} p-4 sm:p-6 border-l-4 border-${metric.color}-500 ${animated ? 'animate-fade-in' : ''}`}
                        style={{ animationDelay: `${i * 150}ms` }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-xs sm:text-sm font-semibold ${textClass} truncate`}>
                                {metric.label}
                            </h3>
                            <span className="text-xl sm:text-2xl">{metric.icon}</span>
                        </div>
                        <p className={`text-2xl sm:text-3xl font-bold text-${metric.color}-600 dark:text-${metric.color}-400`}>
                            {metric.value}{metric.suffix || ''}
                        </p>
                    </div>
                ))}
            </div>

            {/* ========================================
                GRAFICI PRINCIPALI
                ======================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${cardClass} p-4 sm:p-6`}>
                    {renderAdvancedBarChart()}
                </div>

                <div className={`${cardClass} p-4 sm:p-6`}>
                    {renderPieChart()}
                </div>
            </div>

            {/* ========================================
                TABELLA E WIDGETS
                ======================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`${cardClass} p-4 sm:p-6 lg:col-span-2`}>
                    {renderActivityTable()}
                </div>

                <div className="space-y-6">
                    <div className={`${cardClass} p-4 sm:p-6`}>
                        {renderPerformanceWidget()}
                    </div>

                    <div className={`${cardClass} p-4 sm:p-6`}>
                        {renderNotificationsWidget()}
                    </div>
                </div>
            </div>

            {/* ========================================
                WIDGETS AGGIUNTIVI
                ======================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${cardClass} p-4 sm:p-6`}>
                    {renderTopWorkers()}
                </div>

                <div className={`${cardClass} p-4 sm:p-6`}>
                    {renderHourlyChart()}
                </div>
            </div>

            {/* ========================================
                STATISTICHE AGGIUNTIVE
                ======================================== */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { value: stats.totalSheets, label: t.totalSheets || 'Totale Fogli', color: 'indigo', icon: '📋' },
                    { value: stats.draftSheets, label: t.inDraft || 'In Bozza', color: 'yellow', icon: '✏️' },
                    { value: stats.archivedSheets, label: t.archivedSheets || 'Archiviati', color: 'gray', icon: '📦' },
                    { value: stats.totalWorkers, label: t.totalWorkers || 'Totale Lavoratori', color: 'purple', icon: '👷' }
                ].map((stat, i) => (
                    <div
                        key={i}
                        className={`${cardClass} p-4 text-center ${animated ? 'animate-fade-in' : ''}`}
                        style={{ animationDelay: `${800 + i * 100}ms` }}
                    >
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className={`text-xl sm:text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                            {stat.value}
                        </div>
                        <div className={`text-xs ${textClass} mt-1`}>{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
