// WeatherWidget is exposed globally as window.WeatherWidget
const WeatherWidget = window.WeatherWidget;
// Report Manager Component - 5 LINGUE COMPLETE
if (!window.ReportManager) {
const ReportManager = ({ sheets, darkMode, language = 'it', companyLogo }) => {
    const [reportType, setReportType] = React.useState('weekly'); // weekly, monthly, custom
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');
    const [generating, setGenerating] = React.useState(false);
    
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
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white' : 
        'bg-white border-gray-300 text-gray-900';

    // Set default dates based on report type
    React.useEffect(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        if (reportType === 'weekly') {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            setStartDate(weekAgo.toISOString().split('T')[0]);
            setEndDate(todayStr);
        } else if (reportType === 'monthly') {
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            setStartDate(monthAgo.toISOString().split('T')[0]);
            setEndDate(todayStr);
        }
    }, [reportType]);

    // Filter sheets by date range
    const filteredSheets = React.useMemo(() => {
        if (!startDate || !endDate) return [];
        
        return sheets.filter(sheet => {
            const sheetDate = new Date(sheet.data);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include end date
            
            return sheetDate >= start && sheetDate <= end;
        });
    }, [sheets, startDate, endDate]);

    // Calculate report statistics
    const reportStats = React.useMemo(() => {

        const stats = {
            totalSheets: filteredSheets.length,
            completedSheets: filteredSheets.filter(s => s.status === 'completed').length,
            totalWorkers: 0, // verrà sovrascritto con il numero di lavoratori unici
            totalHours: 0,
            workerBreakdown: {},
            companyBreakdown: {}
        };

        const uniqueWorkersSet = new Set();

        filteredSheets.forEach(sheet => {
            const normalizeWorkerName = window.normalizeWorkerName;
            sheet.lavoratori?.forEach(worker => {
                const hours = parseFloat(worker.oreTotali) || 0;
                stats.totalHours += hours;

                // Worker breakdown (normalized)
                const normalizedKey = normalizeWorkerName(worker.nome, worker.cognome);
                const displayName = `${worker.nome} ${worker.cognome}`.trim();
                uniqueWorkersSet.add(normalizedKey);
                if (!stats.workerBreakdown[normalizedKey]) {
                    stats.workerBreakdown[normalizedKey] = {
                        name: displayName,
                        hours: 0,
                        days: 0
                    };
                }
                stats.workerBreakdown[normalizedKey].hours += hours;
                stats.workerBreakdown[normalizedKey].days += 1;

                // Company breakdown
                const companyKey = sheet.titoloAzienda || t.company;
                if (!stats.companyBreakdown[companyKey]) {
                    stats.companyBreakdown[companyKey] = {
                        name: companyKey,
                        hours: 0,
                        workers: new Set()
                    };
                }
                stats.companyBreakdown[companyKey].hours += hours;
                stats.companyBreakdown[companyKey].workers.add(normalizedKey);
            });
        });
        stats.totalWorkers = uniqueWorkersSet.size;

        // Convert to arrays and sort
        stats.topWorkers = Object.values(stats.workerBreakdown)
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 10);

        stats.companyList = Object.values(stats.companyBreakdown)
            .map(c => ({
                name: c.name,
                hours: c.hours,
                workers: c.workers.size
            }))
            .sort((a, b) => b.hours - a.hours);

        return stats;
    }, [filteredSheets, language]);

    // Generate PDF Report
    const generateReportPDF = async () => {
        setGenerating(true);

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            let yPos = 20;

            // Header
            if (companyLogo) {
                try {
                    doc.addImage(companyLogo, 'PNG', 15, yPos, 30, 30);
                    yPos += 35;
                } catch (e) {
                    console.error('Error adding logo:', e);
                }
            }

            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text(t.reports, 15, yPos);
            yPos += 10;

            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`${formatDate(startDate)} - ${formatDate(endDate)}`, 15, yPos);
            yPos += 15;

            // Summary Stats
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`${t.total}:`, 15, yPos);
            yPos += 8;

            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(`${t.sheets}: ${reportStats.totalSheets}`, 20, yPos);
            yPos += 6;
            doc.text(`${t.completed}: ${reportStats.completedSheets}`, 20, yPos);
            yPos += 6;
            doc.text(`${t.workers}: ${reportStats.totalWorkers}`, 20, yPos);
            yPos += 6;
            doc.text(`${t.totalHours}: ${reportStats.totalHours.toFixed(2)}${t.hours_short}`, 20, yPos);
            yPos += 12;

            // Top Workers
            if (reportStats.topWorkers.length > 0) {
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text(t.topWorkers, 15, yPos);
                yPos += 8;

                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                reportStats.topWorkers.slice(0, 5).forEach((worker, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                    doc.text(`${medal} ${worker.name}: ${worker.hours.toFixed(2)}${t.hours_short} (${worker.days} ${t.sheets.toLowerCase()})`, 20, yPos);
                    yPos += 6;
                });
                yPos += 8;
            }

            // Company Breakdown
            if (reportStats.companyList.length > 0) {
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text(`${t.company}:`, 15, yPos);
                yPos += 8;

                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                reportStats.companyList.forEach(company => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.text(`• ${company.name}: ${company.hours.toFixed(2)}${t.hours_short} (${company.workers} ${t.workers.toLowerCase()})`, 20, yPos);
                    yPos += 6;
                });
            }

            // Save
            const filename = `report_${startDate}_${endDate}.pdf`;
            doc.save(filename);
            
            showToast(`✅ ${t.downloadPDF}`, 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            showToast(`❌ ${t.error}`, 'error');
        }

        setGenerating(false);
    };

    // Export CSV
    const exportCSV = () => {
        let csv = `${t.name},${t.surname},${t.company},${t.date},${t.startTime},${t.endTime},${t.break},${t.totalHours}\n`;

        filteredSheets.forEach(sheet => {
            sheet.lavoratori?.forEach(worker => {
                csv += `"${worker.nome}","${worker.cognome}","${sheet.titoloAzienda}","${sheet.data}","${worker.oraIn}","${worker.oraOut}","${worker.pausaMinuti || 0}","${worker.oreTotali}"\n`;
            });
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `report_${startDate}_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('✅ CSV exported', 'success');
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* External title for Report Manager */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    📊 {t.reports || 'Reports'}
                </h3>
            </div>
            {/* Header */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl sm:text-3xl">📈</span>
                    <h1 className="text-xl sm:text-2xl font-bold">{t.reports}</h1>
                </div>

                {/* Report Type Selector */}
                <div className="space-y-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                            onClick={() => setReportType('weekly')}
                            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                                reportType === 'weekly'
                                    ? 'bg-indigo-600 text-white'
                                    : darkMode
                                    ? 'bg-gray-700 hover:bg-gray-600'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            📅 {t.reportWeekly}
                        </button>
                        <button
                            onClick={() => setReportType('monthly')}
                            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                                reportType === 'monthly'
                                    ? 'bg-indigo-600 text-white'
                                    : darkMode
                                    ? 'bg-gray-700 hover:bg-gray-600'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            📆 {t.reportMonthly}
                        </button>
                        <button
                            onClick={() => setReportType('custom')}
                            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                                reportType === 'custom'
                                    ? 'bg-indigo-600 text-white'
                                    : darkMode
                                    ? 'bg-gray-700 hover:bg-gray-600'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            🔧 Custom
                        </button>
                    </div>

                    {/* Period descriptions */}
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
                        <p className={`text-xs sm:text-sm ${textClass}`}>
                            {reportType === 'weekly' && (
                                <span>ℹ️ {t.reportWeeklyDesc}</span>
                            )}
                            {reportType === 'custom' && (
                                <span>ℹ️ {t.reportCustomDesc}</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className={`block text-sm font-semibold mb-1 ${textClass}`}>
                            {t.startDate}
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-semibold mb-1 ${textClass}`}>
                            {t.endDate}
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={generateReportPDF}
                        disabled={generating || filteredSheets.length === 0}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:bg-gray-400 text-sm sm:text-base"
                        title={language === 'it' ? 'Genera un report PDF dettagliato con statistiche e grafici' : 
                               language === 'en' ? 'Generate a detailed PDF report with statistics and charts' :
                               language === 'es' ? 'Generar un informe PDF detallado con estadísticas y gráficos' :
                               language === 'fr' ? 'Générer un rapport PDF détaillé avec statistiques et graphiques' :
                               'Generează un raport PDF detaliat cu statistici și grafice'}
                    >
                        {generating ? `⏳ ${t.loading}...` : `📄 ${t.generateReport} PDF`}
                    </button>
                    <button
                        onClick={exportCSV}
                        disabled={filteredSheets.length === 0}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:bg-gray-400 text-sm sm:text-base"
                        title={language === 'it' ? 'Esporta i dati in formato CSV per Excel o altri fogli di calcolo' :
                               language === 'en' ? 'Export data in CSV format for Excel or other spreadsheets' :
                               language === 'es' ? 'Exportar datos en formato CSV para Excel u otras hojas de cálculo' :
                               language === 'fr' ? 'Exporter les données au format CSV pour Excel ou autres tableurs' :
                               'Exportă datele în format CSV pentru Excel sau alte foi de calcul'}
                    >
                        📊 Export CSV
                    </button>
                </div>
            </div>

            {/* Statistics */}
            {filteredSheets.length > 0 && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div className={`${cardClass} rounded-xl shadow-lg p-3 sm:p-4`}>
                            <p className={`text-xs sm:text-sm ${textClass} mb-1`}>{t.sheets}</p>
                            <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                {reportStats.totalSheets}
                            </p>
                        </div>
                        <div className={`${cardClass} rounded-xl shadow-lg p-3 sm:p-4`}>
                            <p className={`text-xs sm:text-sm ${textClass} mb-1`}>{t.completed}</p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                                {reportStats.completedSheets}
                            </p>
                        </div>
                        <div className={`${cardClass} rounded-xl shadow-lg p-3 sm:p-4`}>
                            <p className={`text-xs sm:text-sm ${textClass} mb-1`}>{t.workers}</p>
                            <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {reportStats.totalWorkers}
                            </p>
                        </div>
                        <div className={`${cardClass} rounded-xl shadow-lg p-3 sm:p-4`}>
                            <p className={`text-xs sm:text-sm ${textClass} mb-1`}>{t.totalHours}</p>
                            <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                                {reportStats.totalHours.toFixed(1)}{t.hours_short}
                            </p>
                        </div>
                    </div>

                    {/* Top Workers */}
                    {reportStats.topWorkers.length > 0 && (
                        <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                            <h2 className="text-lg sm:text-xl font-bold mb-4">🏆 {t.topWorkers}</h2>
                            <div className="space-y-2 sm:space-y-3">
                                {reportStats.topWorkers.map((worker, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between p-3 rounded-lg ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="text-xl sm:text-2xl flex-shrink-0">
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm sm:text-base truncate">{worker.name}</p>
                                                <p className={`text-xs sm:text-sm ${textClass}`}>
                                                    {worker.days} {worker.days === 1 ? t.sheets.slice(0, -1).toLowerCase() : t.sheets.toLowerCase()}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-base sm:text-lg text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                            {worker.hours.toFixed(1)}{t.hours_short}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Company Breakdown */}
                    {reportStats.companyList.length > 0 && (
                        <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                            <h2 className="text-lg sm:text-xl font-bold mb-4">🏢 {t.company}</h2>
                            <div className="space-y-2 sm:space-y-3">
                                {reportStats.companyList.map((company, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between p-3 rounded-lg ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm sm:text-base truncate">{company.name}</p>
                                            <p className={`text-xs sm:text-sm ${textClass}`}>
                                                {company.workers} {company.workers === 1 ? t.workers.slice(0, -1).toLowerCase() : t.workers.toLowerCase()}
                                            </p>
                                        </div>
                                        <p className="font-bold text-base sm:text-lg text-green-600 dark:text-green-400 flex-shrink-0">
                                            {company.hours.toFixed(1)}{t.hours_short}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* No Data */}
            {filteredSheets.length === 0 && startDate && endDate && (
                <div className={`${cardClass} rounded-xl shadow-lg p-8 sm:p-12 text-center`}>
                    <p className="text-4xl sm:text-5xl mb-4">📊</p>
                    <p className={`${textClass} text-base sm:text-lg`}>
                        {t.noSheets}
                    </p>
                    <p className={`${textClass} text-sm mt-2`}>
                        {formatDate(startDate)} - {formatDate(endDate)}
                    </p>
                </div>
            )}
        {/* Meteo rimosso dal report per richiesta privacy/funzionalità */}
    </div>
    );
};

// Expose globally for in-page usage
window.ReportManager = ReportManager;
}
