// Dashboard Component - VERSIONE AVANZATA COMPLETA MOBILE
const Dashboard = ({ sheets, darkMode, language = 'it' }) => {
    const t = translations[language];
    const [selectedPeriod, setSelectedPeriod] = React.useState('week');
    const [loading, setLoading] = React.useState(false);
    const [animated, setAnimated] = React.useState(false);

    const cardClass = `${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl shadow-lg dashboard-card`;
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';

    // Calcolo statistiche avanzate
    const stats = React.useMemo(() => {
        return calculateAdvancedStats(sheets, selectedPeriod);
    }, [sheets, selectedPeriod]);

    // Animazione al mount
    React.useEffect(() => {
        setAnimated(true);
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    // 🎯 GRAFICO A BARRE AVANZATO
    const renderAdvancedBarChart = () => {
        const maxHours = Math.max(...stats.chartData.map(day => day.hours));
        const colors = ['#4f46e5', '#7c3aed', '#a855f7', '#c084fc', '#d946ef', '#ec4899', '#f97316'];
        
        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <h3 className="font-semibold text-lg">📈 Andamento Ore Lavorate</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedPeriod('week')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedPeriod === 'week' 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            7 Giorni
                        </button>
                        <button
                            onClick={() => setSelectedPeriod('month')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedPeriod === 'month' 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            30 Giorni
                        </button>
                    </div>
                </div>
                
                <div className="space-y-3">
                    {stats.chartData.map((day, i) => {
                        const percentage = maxHours > 0 ? (day.hours / maxHours) * 100 : 0;
                        const color = colors[i % colors.length];
                        
                        return (
                            <div key={i} className={`flex items-center gap-3 group ${animated ? 'animate-fade-in' : ''}`}
                                 style={{ animationDelay: `${i * 100}ms` }}>
                                <span className="text-xs font-medium w-12 sm:w-16 text-right truncate">
                                    {day.label}
                                </span>
                                <div className="flex-1 relative">
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 sm:h-5 overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000 ease-out transform origin-left"
                                            style={{ 
                                                width: `${percentage}%`,
                                                backgroundColor: color,
                                                transform: `scaleX(0)`,
                                                animation: `growBar 1s ${i * 100}ms ease-out forwards`
                                            }}
                                        ></div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-semibold text-white mix-blend-difference px-1">
                                            {day.hours > 0 ? day.hours.toFixed(1) + 'h' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {stats.chartData.every(day => day.hours === 0) && (
                    <div className="text-center py-8 text-gray-500">
                        <span className="text-3xl">📊</span>
                        <p className="mt-2">Nessun dato disponibile per il periodo selezionato</p>
                    </div>
                )}
            </div>
        );
    };

    // 📊 GRAFICO A TORTA per distribuzione aziende
    const renderPieChart = () => {
        const totalHours = stats.topCompanies.reduce((sum, company) => sum + company.hours, 0);
        const colors = ['#4f46e5', '#7c3aed', '#a855f7', '#c084fc', '#d946ef'];
        
        if (totalHours === 0) {
            return (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">🏢 Distribuzione per Azienda</h3>
                    <div className="text-center py-8 text-gray-500">
                        <span className="text-3xl">💼</span>
                        <p className="mt-2">Nessun dato aziendale disponibile</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">🏢 Distribuzione per Azienda</h3>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40">
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
                                    cx="50%"
                                    cy="50%"
                                    r="45"
                                    fill="transparent"
                                    stroke={colors[i]}
                                    strokeWidth="20"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    transform={`rotate(${rotation} 64 64)`}
                                    className="transition-all duration-1000 ease-out"
                                    style={{ 
                                        strokeDashoffset: circumference,
                                        animation: `fillPie 1s ${i * 200}ms ease-out forwards`
                                    }}
                                />
                            );
                        })}
                        <text x="50%" y="50%" textAnchor="middle" dy="0.3em" 
                              className="text-sm sm:text-base font-bold fill-current">
                            {totalHours.toFixed(0)}h
                        </text>
                    </div>
                    
                    <div className="space-y-3 flex-1 min-w-0">
                        {stats.topCompanies.map((company, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div 
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: colors[i] }}
                                    ></div>
                                    <span className="truncate" title={company.name}>
                                        {company.name}
                                    </span>
                                </div>
                                <span className="font-semibold text-right flex-shrink-0 ml-2">
                                    {company.hours.toFixed(1)}h
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // 📈 GRAFICO DISTRIBUZIONE ORARIA
    const renderHourlyChart = () => {
        const maxHourly = Math.max(...stats.hourlyDistribution) || 1;
        
        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">🕐 Distribuzione Oraria</h3>
                <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-1 sm:gap-2">
                    {stats.hourlyDistribution.slice(6, 22).map((hours, index) => {
                        const hour = index + 6;
                        return (
                            <div key={hour} className="text-center">
                                <div className="text-xs text-gray-500 mb-1">{hour}h</div>
                                <div 
                                    className="bg-indigo-500 rounded-t transition-all duration-500 hover:bg-indigo-600 cursor-help mx-auto"
                                    style={{ 
                                        height: `${(hours / maxHourly) * 40}px`,
                                        width: '80%',
                                        minHeight: hours > 0 ? '4px' : '0px'
                                    }}
                                    title={`${hour}:00 - ${hours.toFixed(1)} ore`}
                                ></div>
                            </div>
                        );
                    })}
                </div>
                <div className="text-xs text-gray-500 text-center">
                    Orario lavorativo: 6:00 - 22:00
                </div>
            </div>
        );
    };

    // 📋 TABELLA ATTIVITÀ RECENTI
    const renderActivityTable = () => {
        const recentActivities = sheets
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6);
        
        const getStatusBadge = (sheet) => {
            if (sheet.archived) return { text: 'Archiviato', color: 'badge-gray' };
            if (sheet.status === 'completed') return { text: 'Completato', color: 'badge-success' };
            return { text: 'Bozza', color: 'badge-warning' };
        };

        if (recentActivities.length === 0) {
            return (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span>📋</span> Attività Recenti
                    </h3>
                    <div className="text-center py-8 text-gray-500">
                        <span className="text-3xl">📝</span>
                        <p className="mt-2">Nessuna attività recente</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span>📋</span> Attività Recenti
                </h3>
                
                <div className="overflow-x-auto">
                    <table className="dashboard-table w-full">
                        <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-semibold">Azienda</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold hidden sm:table-cell">Data</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold">Lavoratori</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold hidden md:table-cell">Ore</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold">Stato</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {recentActivities.map((sheet, i) => {
                                const status = getStatusBadge(sheet);
                                const totalHours = sheet.lavoratori?.reduce((sum, worker) => 
                                    sum + parseFloat(worker.oreTotali || 0), 0
                                ) || 0;
                                
                                return (
                                    <tr 
                                        key={sheet.id} 
                                        className={`transition-colors hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} ${animated ? 'animate-fade-in' : ''}`}
                                        style={{ animationDelay: `${i * 50}ms` }}
                                    >
                                        <td className="px-3 py-3 text-sm">
                                            <div className="font-medium truncate max-w-[120px] sm:max-w-none" title={sheet.titoloAzienda}>
                                                {sheet.titoloAzienda || 'N/D'}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">{sheet.responsabile}</div>
                                        </td>
                                        <td className="px-3 py-3 text-sm hidden sm:table-cell">
                                            {formatDate(sheet.data)}
                                        </td>
                                        <td className="px-3 py-3 text-sm">
                                            <span className="font-semibold">{sheet.lavoratori?.length || 0}</span>
                                        </td>
                                        <td className="px-3 py-3 text-sm font-semibold hidden md:table-cell">
                                            {totalHours.toFixed(1)}h
                                        </td>
                                        <td className="px-3 py-3 text-sm">
                                            <span className={`badge ${status.color}`}>
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

    // 🎯 WIDGET PERFORMANCE
    const renderPerformanceWidget = () => {
        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">📈 Performance</h3>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-4 rounded-lg gradient-primary text-white">
                        <div className="text-xl sm:text-2xl font-bold">{stats.efficiency.toFixed(0)}%</div>
                        <div className="text-xs opacity-90 mt-1">Efficienza</div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg gradient-success text-white">
                        <div className="text-xl sm:text-2xl font-bold">{stats.avgDailyHours}h</div>
                        <div className="text-xs opacity-90 mt-1">Media Giornaliera</div>
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span>Fogli Completati</span>
                        <span className="font-semibold">{stats.completedSheets} / {stats.totalSheets}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                            className="progress-bar-success h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${stats.efficiency}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    };

    // 🔔 WIDGET NOTIFICHE
    const renderNotificationsWidget = () => {
        const pendingSheets = sheets.filter(s => 
            !s.archived && s.status === 'draft' && s.lavoratori?.length > 0
        ).length;
        
        const unsignedSheets = sheets.filter(s => 
            !s.archived && s.status === 'draft' && s.lavoratori?.length > 0 && !s.firmaResponsabile
        ).length;
        
        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span>🔔</span> Notifiche
                </h3>
                
                <div className="space-y-3">
                    {pendingSheets > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                            <span className="text-xl">📋</span>
                            <div className="flex-1">
                                <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                                    {pendingSheets} fogli in attesa
                                </div>
                                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                                    Completali per generare i PDF
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {unsignedSheets > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                            <span className="text-xl">✍️</span>
                            <div className="flex-1">
                                <div className="font-semibold text-orange-800 dark:text-orange-200">
                                    {unsignedSheets} da firmare
                                </div>
                                <div className="text-xs text-orange-600 dark:text-orange-400">
                                    Firma dei responsabili mancante
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {pendingSheets === 0 && unsignedSheets === 0 && (
                        <div className="text-center py-4 text-gray-500">
                            <span className="text-2xl">🎉</span>
                            <div className="text-sm mt-2">Tutto completato!</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // 🏆 TOP WORKERS WIDGET
    const renderTopWorkers = () => {
        if (stats.topWorkers.length === 0) {
            return (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">🏆 Top Lavoratori</h3>
                    <div className="text-center py-8 text-gray-500">
                        <span className="text-3xl">👷</span>
                        <p className="mt-2">Nessun dato disponibile</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">🏆 Top Lavoratori</h3>
                <div className="space-y-3">
                    {stats.topWorkers.slice(0, 5).map((worker, i) => (
                        <div
                            key={i}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-50'
                            } ${animated ? 'animate-fade-in' : ''}`}
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className={`text-lg font-bold ${
                                    i === 0 ? 'text-yellow-500' : 
                                    i === 1 ? 'text-gray-400' : 
                                    i === 2 ? 'text-orange-500' : 'text-gray-500'
                                }`}>
                                    #{i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-sm truncate" title={worker.name}>
                                        {worker.name}
                                    </p>
                                    <p className={`text-xs ${textClass}`}>
                                        {worker.hours.toFixed(1)} ore totali
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-indigo-600 dark:text-indigo-400">
                                    {worker.hours.toFixed(1)}h
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* HEADER */}
            <div className={`${cardClass} p-4 sm:p-6`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">📊 Dashboard</h1>
                        <p className={`${textClass} mt-1 text-sm sm:text-base`}>
                            Panoramica completa delle attività e statistiche
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Aggiornato</p>
                        <p className="text-lg font-semibold">{new Date().toLocaleTimeString('it-IT')}</p>
                    </div>
                </div>
            </div>

            {/* METRICHE PRINCIPALI - MOBILE OPTIMIZED */}
            <div className="stats-grid">
                {[
                    { icon: '📅', value: stats.todayHours.toFixed(1), label: 'Ore Oggi', color: 'green', suffix: 'h' },
                    { icon: '📊', value: stats.weeklyHours.toFixed(1), label: 'Questa Settimana', color: 'blue', suffix: 'h' },
                    { icon: '👥', value: stats.activeWorkers, label: 'Lavoratori Attivi', color: 'purple' },
                    { icon: '✅', value: stats.completedSheets, label: 'Fogli Completati', color: 'orange' }
                ].map((metric, i) => (
                    <div 
                        key={i}
                        className={`${cardClass} metric-card p-4 sm:p-6 border-l-4 border-${metric.color}-500 ${animated ? 'animate-fade-in' : ''}`}
                        style={{ animationDelay: `${i * 150}ms` }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-sm font-semibold ${textClass}`}>{metric.label}</h3>
                            <span className="text-2xl">{metric.icon}</span>
                        </div>
                        <p className={`text-2xl sm:text-3xl font-bold text-${metric.color}-600 dark:text-${metric.color}-400`}>
                            {metric.value}{metric.suffix || ''}
                        </p>
                    </div>
                ))}
            </div>

            {/* PRIMA RIGA: GRAFICI PRINCIPALI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${cardClass} p-4 sm:p-6`}>
                    {renderAdvancedBarChart()}
                </div>
                
                <div className={`${cardClass} p-4 sm:p-6`}>
                    {renderPieChart()}
                </div>
            </div>

            {/* SECONDA RIGA: TABELLA E WIDGETS */}
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

            {/* TERZA RIGA: WIDGETS AGGIUNTIVI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${cardClass} p-4 sm:p-6`}>
                    {renderTopWorkers()}
                </div>
                
                <div className={`${cardClass} p-4 sm:p-6`}>
                    {renderHourlyChart()}
                </div>
            </div>

            {/* QUARTA RIGA: STATISTICHE AGGIUNTIVE */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { value: stats.totalSheets, label: 'Fogli Totali', color: 'indigo' },
                    { value: stats.draftSheets, label: 'In Bozza', color: 'yellow' },
                    { value: stats.archivedSheets, label: 'Archiviati', color: 'gray' },
                    { value: stats.totalWorkers, label: 'Lavoratori Totali', color: 'purple' }
                ].map((stat, i) => (
                    <div 
                        key={i}
                        className={`${cardClass} p-4 text-center ${animated ? 'animate-fade-in' : ''}`}
                        style={{ animationDelay: `${800 + i * 100}ms` }}
                    >
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
