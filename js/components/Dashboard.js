// Dashboard Component - DESIGN FREEPIK PROFESSIONALE
const Dashboard = ({ sheets, darkMode, language = 'it' }) => {
    const t = translations[language];
    const [selectedPeriod, setSelectedPeriod] = React.useState('week');
    const [activeView, setActiveView] = React.useState('overview');

    const cardClass = `${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-sm`;
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const titleClass = darkMode ? 'text-white' : 'text-gray-900';

    // Calcolo statistiche
    const stats = React.useMemo(() => {
        return calculateAdvancedStats(sheets, selectedPeriod);
    }, [sheets, selectedPeriod]);

    // 🎯 HEADER PRINCIPALE
    const renderHeader = () => (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
                <h1 className={`text-2xl font-bold ${titleClass} mb-2`}>Dashboard Overview</h1>
                <p className={`text-sm ${textClass}`}>
                    Monitoraggio completo delle attività e delle performance
                </p>
            </div>
            <div className="flex flex-wrap gap-3">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => setActiveView('overview')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeView === 'overview'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveView('analytics')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeView === 'analytics'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Analytics
                    </button>
                </div>
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                </select>
            </div>
        </div>
    );

    // 📊 METRICHE PRINCIPALI - Design Freepik
    const renderMetrics = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
                {
                    title: 'Total Hours',
                    value: stats.weeklyHours.toFixed(1),
                    change: '+12%',
                    trend: 'up',
                    icon: '⏱️',
                    color: 'blue'
                },
                {
                    title: 'Active Workers',
                    value: stats.activeWorkers,
                    change: '+5%',
                    trend: 'up',
                    icon: '👥',
                    color: 'green'
                },
                {
                    title: 'Completed Sheets',
                    value: stats.completedSheets,
                    change: '+8%',
                    trend: 'up',
                    icon: '✅',
                    color: 'purple'
                },
                {
                    title: 'Efficiency Rate',
                    value: `${stats.efficiency.toFixed(0)}%`,
                    change: '+3%',
                    trend: 'up',
                    icon: '📈',
                    color: 'orange'
                }
            ].map((metric, index) => (
                <div key={index} className={`${cardClass} p-6`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg bg-${metric.color}-50 dark:bg-${metric.color}-900/20 flex items-center justify-center`}>
                            <span className="text-xl">{metric.icon}</span>
                        </div>
                        <div className={`text-sm font-medium ${
                            metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                            {metric.change}
                        </div>
                    </div>
                    <h3 className={`text-sm font-medium ${textClass} mb-1`}>{metric.title}</h3>
                    <p className={`text-2xl font-bold ${titleClass}`}>{metric.value}</p>
                </div>
            ))}
        </div>
    );

    // 📈 GRAFICO PRINCIPALE - Design pulito
    const renderMainChart = () => {
        const maxHours = Math.max(...stats.chartData.map(day => day.hours));
        
        return (
            <div className={`${cardClass} p-6 mb-8`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <h3 className={`text-lg font-semibold ${titleClass} mb-2 sm:mb-0`}>Hours Trend</h3>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className={textClass}>Work Hours</span>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {stats.chartData.map((day, index) => {
                        const percentage = maxHours > 0 ? (day.hours / maxHours) * 100 : 0;
                        
                        return (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-16 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {day.label}
                                </div>
                                <div className="flex-1">
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                                        <div 
                                            className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="w-12 text-right text-sm font-semibold">
                                    {day.hours.toFixed(1)}h
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // 📋 TABELLA ATTIVITÀ - Design professionale
    const renderActivityTable = () => (
        <div className={`${cardClass} p-6 mb-8`}>
            <h3 className={`text-lg font-semibold ${titleClass} mb-6`}>Recent Activity</h3>
            
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Company</th>
                            <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                            <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Workers</th>
                            <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Hours</th>
                            <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sheets
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .slice(0, 5)
                            .map((sheet, index) => {
                                const totalHours = sheet.lavoratori?.reduce((sum, worker) => 
                                    sum + parseFloat(worker.oreTotali || 0), 0
                                ) || 0;
                                
                                const getStatus = () => {
                                    if (sheet.archived) return { text: 'Archived', color: 'gray' };
                                    if (sheet.status === 'completed') return { text: 'Completed', color: 'green' };
                                    return { text: 'Draft', color: 'yellow' };
                                };
                                
                                const status = getStatus();
                                
                                return (
                                    <tr key={sheet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {sheet.titoloAzienda || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {sheet.responsabile}
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-gray-900 dark:text-white">
                                            {formatDate(sheet.data)}
                                        </td>
                                        <td className="py-4 text-sm text-gray-900 dark:text-white">
                                            {sheet.lavoratori?.length || 0}
                                        </td>
                                        <td className="py-4 text-sm font-medium text-gray-900 dark:text-white">
                                            {totalHours.toFixed(1)}h
                                        </td>
                                        <td className="py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                status.color === 'green' 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : status.color === 'yellow'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                            }`}>
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

    // 🏆 TOP PERFORMERS - Design elegante
    const renderTopPerformers = () => (
        <div className={`${cardClass} p-6`}>
            <h3 className={`text-lg font-semibold ${titleClass} mb-6`}>Top Performers</h3>
            
            <div className="space-y-4">
                {stats.topWorkers.slice(0, 4).map((worker, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                                index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                                #{index + 1}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {worker.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {worker.hours.toFixed(1)} total hours
                                </div>
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {worker.hours.toFixed(1)}h
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // 📊 DISTRIBUZIONE AZIENDE - Grafico torta semplificato
    const renderCompanyDistribution = () => {
        const totalHours = stats.topCompanies.reduce((sum, company) => sum + company.hours, 0);
        
        if (totalHours === 0) {
            return (
                <div className={`${cardClass} p-6`}>
                    <h3 className={`text-lg font-semibold ${titleClass} mb-6`}>Company Distribution</h3>
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <span className="text-2xl">💼</span>
                        <p className="mt-2 text-sm">No company data available</p>
                    </div>
                </div>
            );
        }

        return (
            <div className={`${cardClass} p-6`}>
                <h3 className={`text-lg font-semibold ${titleClass} mb-6`}>Company Distribution</h3>
                
                <div className="space-y-4">
                    {stats.topCompanies.slice(0, 4).map((company, index) => {
                        const percentage = totalHours > 0 ? (company.hours / totalHours) * 100 : 0;
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                        
                        return (
                            <div key={index} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                                        {company.name}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {percentage.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full ${colors[index]} transition-all duration-1000`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>{company.hours.toFixed(1)} hours</span>
                                    <span>{percentage.toFixed(1)}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // 🎯 LAYOUT PRINCIPALE - Grid professionale
    return (
        <div className="space-y-8 animate-fade-in">
            {renderHeader()}
            {renderMetrics()}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonna sinistra - Grafico principale */}
                <div className="lg:col-span-2 space-y-8">
                    {renderMainChart()}
                    {renderActivityTable()}
                </div>
                
                {/* Colonna destra - Sidebar widgets */}
                <div className="space-y-8">
                    {renderTopPerformers()}
                    {renderCompanyDistribution()}
                    
                    {/* Quick Stats */}
                    <div className={`${cardClass} p-6`}>
                        <h3 className={`text-lg font-semibold ${titleClass} mb-4`}>Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Sheets</div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalSheets}</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Draft</div>
                                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.draftSheets}</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Archived</div>
                                <div className="text-xl font-bold text-gray-600 dark:text-gray-400">{stats.archivedSheets}</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Daily</div>
                                <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.avgDailyHours}h</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
