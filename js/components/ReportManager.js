// Report Manager Component
const ReportManager = ({ sheets, darkMode, language = 'it', companyLogo }) => {
    const t = translations[language];
    const [reportType, setReportType] = React.useState('weekly'); // weekly, monthly, custom
    const [dateRange, setDateRange] = React.useState({
        start: '',
        end: ''
    });
    
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white' : 
        'bg-white border-gray-300 text-gray-900';

    const generateReport = () => {
        let filteredSheets = [];
        const now = new Date();
        
        if (reportType === 'weekly') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredSheets = sheets.filter(s => new Date(s.data) >= weekAgo);
        } else if (reportType === 'monthly') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredSheets = sheets.filter(s => new Date(s.data) >= monthAgo);
        } else if (reportType === 'custom' && dateRange.start && dateRange.end) {
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            filteredSheets = sheets.filter(s => {
                const sheetDate = new Date(s.data);
                return sheetDate >= start && sheetDate <= end;
            });
        }
        
        if (filteredSheets.length === 0) {
            showToast('❌ Nessun foglio nel periodo selezionato', 'error');
            return;
        }
        
        generateAggregateReport(filteredSheets, reportType);
    };

    const generateAggregateReport = (filteredSheets, type) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 40, 'F');
        
        if (companyLogo) {
            try {
                doc.addImage(companyLogo, 'PNG', 10, 5, 30, 30);
            } catch (e) {
                console.error('Errore logo:', e);
            }
        }
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        const title = type === 'weekly' ? 'REPORT SETTIMANALE' : 
                     type === 'monthly' ? 'REPORT MENSILE' : 'REPORT PERSONALIZZATO';
        doc.text(title, companyLogo ? 45 : 10, 25);
        
        // Period info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        let y = 50;
        
        if (type === 'custom') {
            doc.text(`Periodo: ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`, 10, y);
        } else {
            doc.text(`Periodo: ${type === 'weekly' ? 'Ultimi 7 giorni' : 'Ultimi 30 giorni'}`, 10, y);
        }
        doc.text(`Data generazione: ${formatDate(new Date().toISOString())}`, 10, y + 8);
        
        y += 25;
        
        // Summary statistics
        let totalHours = 0;
        let totalWorkers = 0;
        const workerHours = {};
        const companyHours = {};
        
        filteredSheets.forEach(sheet => {
            sheet.lavoratori?.forEach(worker => {
                const hours = parseFloat(worker.oreTotali) || 0;
                totalHours += hours;
                totalWorkers++;
                
                const workerName = `${worker.nome} ${worker.cognome}`;
                workerHours[workerName] = (workerHours[workerName] || 0) + hours;
                
                companyHours[sheet.titoloAzienda] = (companyHours[sheet.titoloAzienda] || 0) + hours;
            });
        });
        
        // Statistics box
        doc.setFillColor(243, 244, 246);
        doc.rect(10, y, 190, 35, 'F');
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('STATISTICHE PERIODO', 15, y + 10);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Fogli: ${filteredSheets.length}`, 15, y + 20);
        doc.text(`Lavoratori: ${totalWorkers}`, 70, y + 20);
        doc.text(`Ore Totali: ${totalHours.toFixed(1)}h`, 130, y + 20);
        
        y += 45;
        
        // Top workers table
        doc.setFont(undefined, 'bold');
        doc.text('TOP 10 LAVORATORI', 10, y);
        y += 10;
        
        doc.setFillColor(99, 102, 241);
        doc.rect(10, y, 190, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Nome', 15, y + 7);
        doc.text('Ore Totali', 150, y + 7);
        y += 10;
        
        doc.setTextColor(0, 0, 0);
        const topWorkers = Object.entries(workerHours)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);
        
        topWorkers.forEach(([name, hours], i) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            
            if (i % 2 === 0) {
                doc.setFillColor(243, 244, 246);
                doc.rect(10, y, 190, 8, 'F');
            }
            
            doc.text(name, 15, y + 6);
            doc.text(hours.toFixed(1) + 'h', 150, y + 6);
            y += 8;
        });
        
        y += 10;
        
        // Companies breakdown
        if (y > 240) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text('RIPARTIZIONE PER AZIENDA', 10, y);
        y += 10;
        
        doc.setFillColor(99, 102, 241);
        doc.rect(10, y, 190, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('Azienda', 15, y + 7);
        doc.text('Ore', 150, y + 7);
        y += 10;
        
        doc.setTextColor(0, 0, 0);
        Object.entries(companyHours)
            .sort(([, a], [, b]) => b - a)
            .forEach(([company, hours], i) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                
                if (i % 2 === 0) {
                    doc.setFillColor(243, 244, 246);
                    doc.rect(10, y, 190, 8, 'F');
                }
                
                doc.text(company, 15, y + 6);
                doc.text(hours.toFixed(1) + 'h', 150, y + 6);
                y += 8;
            });
        
        // Save
        const fileName = `report_${type}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        showToast('✅ Report PDF generato!', 'success');
    };

    return (
        <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
            <h2 className="text-2xl font-bold mb-6">
                📊 {t.manageReports}
            </h2>
            
            <div className="space-y-6">
                {/* Report Type Selection */}
                <div>
                    <label className="block font-semibold mb-3">Tipo di Report</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={() => setReportType('weekly')}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                                reportType === 'weekly'
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                    : darkMode ? 'border-gray-600' : 'border-gray-300'
                            }`}
                        >
                            <p className="font-semibold text-lg">📅 Settimanale</p>
                            <p className={`text-sm ${textClass}`}>Ultimi 7 giorni</p>
                        </button>
                        
                        <button
                            onClick={() => setReportType('monthly')}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                                reportType === 'monthly'
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                    : darkMode ? 'border-gray-600' : 'border-gray-300'
                            }`}
                        >
                            <p className="font-semibold text-lg">📆 Mensile</p>
                            <p className={`text-sm ${textClass}`}>Ultimi 30 giorni</p>
                        </button>
                        
                        <button
                            onClick={() => setReportType('custom')}
                            className={`p-4 rounded-lg border-2 transition-colors ${
                                reportType === 'custom'
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                    : darkMode ? 'border-gray-600' : 'border-gray-300'
                            }`}
                        >
                            <p className="font-semibold text-lg">🗓️ Personalizzato</p>
                            <p className={`text-sm ${textClass}`}>Scegli periodo</p>
                        </button>
                    </div>
                </div>

                {/* Custom Date Range */}
                {reportType === 'custom' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-semibold mb-1 ${textClass}`}>
                                    Data Inizio
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                    className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-semibold mb-1 ${textClass}`}>
                                    Data Fine
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                    className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Generate Button */}
                <button
                    onClick={generateReport}
                    disabled={reportType === 'custom' && (!dateRange.start || !dateRange.end)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold text-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    📄 {t.generateReport}
                </button>

                {/* Info Box */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                    <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        💡 <strong>Suggerimento:</strong> I report PDF includono statistiche dettagliate, 
                        top lavoratori del periodo e ripartizione ore per azienda.
                    </p>
                </div>
            </div>
        </div>
    );
};
