/**
 * Worker Dashboard Component
 * Dashboard personale per lavoratori con statistiche individuali
 */

window.WorkerDashboard = function({ userId, userName, db, darkMode }) {
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
    const [monthlyData, setMonthlyData] = React.useState([]);
    
    const t = window.translations || {};
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';

    React.useEffect(() => {
        loadWorkerStats();
    }, [userId, selectedMonth, selectedYear]);

    const loadWorkerStats = async () => {
        try {
            setLoading(true);
            
            // Carica tutti i fogli
            const sheetsSnapshot = await db.collection('sheets').get();
            const allSheets = sheetsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Normalizza il nome utente per la ricerca
            const normalizedUserName = userName.toLowerCase().replace(/\s+/g, '');
            
            // Filtra solo i dati del worker corrente
            const workerData = [];
            let totalHours = 0;
            let totalDays = 0;
            const monthlyHours = Array(12).fill(0);
            
            allSheets.forEach(sheet => {
                if (!sheet.lavoratori) return;
                
                Object.entries(sheet.lavoratori).forEach(([workerKey, data]) => {
                    const normalizedKey = workerKey.toLowerCase().replace(/\s+/g, '');
                    
                    if (normalizedKey === normalizedUserName) {
                        const sheetDate = new Date(sheet.date);
                        const sheetMonth = sheetDate.getMonth();
                        const sheetYear = sheetDate.getFullYear();
                        
                        const hours = parseFloat(data.ore) || 0;
                        totalHours += hours;
                        totalDays++;
                        
                        monthlyHours[sheetMonth] += hours;
                        
                        // Dati per il mese selezionato
                        if (sheetMonth === selectedMonth && sheetYear === selectedYear) {
                            workerData.push({
                                date: sheet.date,
                                hours: hours,
                                note: data.note || ''
                            });
                        }
                    }
                });
            });
            
            // Calcola media
            const avgHoursPerDay = totalDays > 0 ? (totalHours / totalDays).toFixed(2) : 0;
            
            // Ordina dati mensili per data
            workerData.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            setStats({
                totalHours: totalHours.toFixed(2),
                totalDays: totalDays,
                avgHoursPerDay: avgHoursPerDay,
                monthlyHours: monthlyHours,
                currentMonthHours: monthlyHours[selectedMonth].toFixed(2)
            });
            
            setMonthlyData(workerData);
            
        } catch (error) {
            console.error('Errore caricamento statistiche:', error);
        } finally {
            setLoading(false);
        }
    };

    const monthNames = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    if (loading) {
        return React.createElement('div', {
            className: 'flex items-center justify-center h-64'
        }, React.createElement('div', {
            className: 'text-xl'
        }, t.loading || 'Caricamento...'));
    }

    return React.createElement('div', {
        className: `p-6 space-y-6`
    },
        // Header
        React.createElement('div', { className: 'mb-6' },
            React.createElement('h1', { className: 'text-3xl font-bold mb-2' }, 
                `👋 Ciao, ${userName}!`
            ),
            React.createElement('p', { className: textClass }, 
                'Ecco le tue statistiche di lavoro'
            )
        ),
        
        // Statistiche principali
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
            // Ore totali
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', null,
                        React.createElement('p', { className: textClass + ' text-sm mb-1' }, 'Ore Totali'),
                        React.createElement('p', { className: 'text-3xl font-bold' }, stats.totalHours)
                    ),
                    React.createElement('div', { className: 'text-4xl' }, '⏰')
                )
            ),
            
            // Giorni lavorati
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', null,
                        React.createElement('p', { className: textClass + ' text-sm mb-1' }, 'Giorni Lavorati'),
                        React.createElement('p', { className: 'text-3xl font-bold' }, stats.totalDays)
                    ),
                    React.createElement('div', { className: 'text-4xl' }, '📅')
                )
            ),
            
            // Media ore/giorno
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', null,
                        React.createElement('p', { className: textClass + ' text-sm mb-1' }, 'Media Ore/Giorno'),
                        React.createElement('p', { className: 'text-3xl font-bold' }, stats.avgHoursPerDay)
                    ),
                    React.createElement('div', { className: 'text-4xl' }, '📊')
                )
            ),
            
            // Ore mese corrente
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6 bg-blue-500 text-white` },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-white opacity-90 text-sm mb-1' }, 'Ore Questo Mese'),
                        React.createElement('p', { className: 'text-3xl font-bold' }, stats.currentMonthHours)
                    ),
                    React.createElement('div', { className: 'text-4xl' }, '🎯')
                )
            )
        ),
        
        // Selettore mese
        React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
            React.createElement('div', { className: 'flex items-center justify-between mb-6' },
                React.createElement('h2', { className: 'text-xl font-bold' }, 
                    `📆 Dettaglio ${monthNames[selectedMonth]} ${selectedYear}`
                ),
                React.createElement('div', { className: 'flex space-x-2' },
                    React.createElement('select', {
                        value: selectedMonth,
                        onChange: (e) => setSelectedMonth(parseInt(e.target.value)),
                        className: `px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`
                    }, monthNames.map((name, idx) =>
                        React.createElement('option', { key: idx, value: idx }, name)
                    )),
                    React.createElement('select', {
                        value: selectedYear,
                        onChange: (e) => setSelectedYear(parseInt(e.target.value)),
                        className: `px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`
                    }, 
                        React.createElement('option', { value: 2024 }, '2024'),
                        React.createElement('option', { value: 2025 }, '2025'),
                        React.createElement('option', { value: 2026 }, '2026')
                    )
                )
            ),
            
            monthlyData.length === 0 ? React.createElement('div', {
                className: 'text-center py-12'
            },
                React.createElement('div', { className: 'text-6xl mb-4' }, '📭'),
                React.createElement('p', { className: textClass }, 'Nessun dato per questo mese')
            ) : React.createElement('div', { className: 'space-y-2' },
                monthlyData.map((entry, idx) =>
                    React.createElement('div', {
                        key: idx,
                        className: `flex items-center justify-between p-4 border rounded-lg ${
                            darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                        }`
                    },
                        React.createElement('div', { className: 'flex items-center space-x-4' },
                            React.createElement('div', { className: 'text-2xl' }, '📅'),
                            React.createElement('div', null,
                                React.createElement('p', { className: 'font-medium' }, 
                                    new Date(entry.date).toLocaleDateString('it-IT', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })
                                ),
                                entry.note && React.createElement('p', { className: `text-sm ${textClass}` }, 
                                    entry.note
                                )
                            )
                        ),
                        React.createElement('div', { className: 'text-right' },
                            React.createElement('p', { className: 'text-2xl font-bold text-blue-600' }, 
                                `${entry.hours}h`
                            )
                        )
                    )
                )
            )
        ),
        
        // Grafico annuale
        React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
            React.createElement('h2', { className: 'text-xl font-bold mb-6' }, '📈 Ore Mensili Anno ' + selectedYear),
            React.createElement('div', { className: 'space-y-3' },
                stats.monthlyHours.map((hours, idx) =>
                    React.createElement('div', { key: idx, className: 'flex items-center' },
                        React.createElement('div', { className: 'w-24 text-sm font-medium' }, monthNames[idx]),
                        React.createElement('div', { className: 'flex-1 mx-4' },
                            React.createElement('div', { 
                                className: 'h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'
                            },
                                React.createElement('div', {
                                    className: `h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-end pr-2 text-white text-xs font-bold rounded-full transition-all duration-500`,
                                    style: { 
                                        width: `${Math.min((hours / Math.max(...stats.monthlyHours)) * 100, 100)}%` 
                                    }
                                }, hours > 0 ? `${hours.toFixed(1)}h` : '')
                            )
                        ),
                        React.createElement('div', { className: 'w-16 text-right text-sm font-semibold' }, 
                            `${hours.toFixed(1)}h`
                        )
                    )
                )
            )
        )
    );
};
