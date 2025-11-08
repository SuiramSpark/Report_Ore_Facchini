// Advanced 3D Statistics & KPI Dashboard Component
// Grafici 3D interattivi con Plotly.js + ECharts + Three.js

const Advanced3DStats = ({ sheets = [], darkMode = false, language = 'it', activityTypes = [], onNavigate }) => {
    const [activeTab, setActiveTab] = React.useState('overview'); // overview, workers, companies, activities
    const containerRef = React.useRef(null);
    
    const t = new Proxy({}, {
        get: (_target, prop) => {
            try {
                const key = String(prop);
                if (typeof window !== 'undefined' && typeof window.t === 'function') return window.t(key);
                return key;
            } catch (e) { return String(prop); }
        }
    });

    // ============================================
    // 📊 CALCOLO STATISTICHE AVANZATE
    // ============================================
    const stats = React.useMemo(() => {
        const nonArchiviati = sheets.filter(s => !s.archiviato);
        
        // Aggregazione ore per lavoratore
        const workerHoursMap = {};
        const workerDaysMap = {};
        const workerCompaniesMap = {};
        const workerActivitiesMap = {};
        
        // Aggregazione ore per azienda
        const companyHoursMap = {};
        const companyWorkersMap = {};
        const companyActivitiesMap = {};
        
        // Aggregazione ore per tipo attività
        const activityHoursMap = {};
        const activityWorkersMap = {};
        const activityCompaniesMap = {};
        
        // Medie giornaliere per mese
        const monthlyData = {};
        
        // Ore totali giornaliere (ultimi 90 giorni)
        const dailyHoursMap = {};
        
        nonArchiviati.forEach(sheet => {
            const hours = window.calculateTotalHours ? window.calculateTotalHours(sheet.oreLavorate || {}) : 0;
            if (hours === 0) return;
            
            const normalizeWorker = window.normalizeWorkerName || ((n, c) => `${n} ${c}`.trim());
            const company = sheet.azienda || 'N/A';
            const date = sheet.data ? new Date(sheet.data) : new Date();
            const dateKey = date.toISOString().split('T')[0];
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            // Per ogni lavoratore nel foglio
            (sheet.lavoratori || []).forEach(lav => {
                const workerKey = normalizeWorker(lav.nome, lav.cognome);
                const workerName = `${lav.nome} ${lav.cognome}`.trim();
                
                // Ore lavoratore
                workerHoursMap[workerKey] = (workerHoursMap[workerKey] || 0) + hours;
                
                // Giorni lavorati
                if (!workerDaysMap[workerKey]) workerDaysMap[workerKey] = new Set();
                workerDaysMap[workerKey].add(dateKey);
                
                // Aziende per lavoratore
                if (!workerCompaniesMap[workerKey]) workerCompaniesMap[workerKey] = new Set();
                workerCompaniesMap[workerKey].add(company);
                
                // Attività per lavoratore
                if (!workerActivitiesMap[workerKey]) workerActivitiesMap[workerKey] = {};
                if (sheet.tipoAttivita && Array.isArray(sheet.tipoAttivita)) {
                    sheet.tipoAttivita.forEach(actId => {
                        workerActivitiesMap[workerKey][actId] = (workerActivitiesMap[workerKey][actId] || 0) + hours;
                    });
                }
            });
            
            // Ore azienda
            companyHoursMap[company] = (companyHoursMap[company] || 0) + hours;
            
            // Lavoratori per azienda
            if (!companyWorkersMap[company]) companyWorkersMap[company] = new Set();
            (sheet.lavoratori || []).forEach(lav => {
                const workerKey = normalizeWorker(lav.nome, lav.cognome);
                companyWorkersMap[company].add(workerKey);
            });
            
            // Attività per azienda
            if (!companyActivitiesMap[company]) companyActivitiesMap[company] = {};
            if (sheet.tipoAttivita && Array.isArray(sheet.tipoAttivita)) {
                sheet.tipoAttivita.forEach(actId => {
                    companyActivitiesMap[company][actId] = (companyActivitiesMap[company][actId] || 0) + hours;
                });
            }
            
            // Ore per tipo attività
            if (sheet.tipoAttivita && Array.isArray(sheet.tipoAttivita)) {
                sheet.tipoAttivita.forEach(actId => {
                    activityHoursMap[actId] = (activityHoursMap[actId] || 0) + hours;
                    
                    // Lavoratori per attività
                    if (!activityWorkersMap[actId]) activityWorkersMap[actId] = new Set();
                    (sheet.lavoratori || []).forEach(lav => {
                        const workerKey = normalizeWorker(lav.nome, lav.cognome);
                        activityWorkersMap[actId].add(workerKey);
                    });
                    
                    // Aziende per attività
                    if (!activityCompaniesMap[actId]) activityCompaniesMap[actId] = new Set();
                    activityCompaniesMap[actId].add(company);
                });
            }
            
            // Dati mensili
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { hours: 0, days: new Set(), workers: new Set(), companies: new Set() };
            }
            monthlyData[monthKey].hours += hours;
            monthlyData[monthKey].days.add(dateKey);
            (sheet.lavoratori || []).forEach(lav => {
                const workerKey = normalizeWorker(lav.nome, lav.cognome);
                monthlyData[monthKey].workers.add(workerKey);
            });
            monthlyData[monthKey].companies.add(company);
            
            // Ore giornaliere
            dailyHoursMap[dateKey] = (dailyHoursMap[dateKey] || 0) + hours;
        });
        
        // Converti Set in count
        Object.keys(workerDaysMap).forEach(k => {
            workerDaysMap[k] = workerDaysMap[k].size;
        });
        Object.keys(workerCompaniesMap).forEach(k => {
            workerCompaniesMap[k] = workerCompaniesMap[k].size;
        });
        Object.keys(companyWorkersMap).forEach(k => {
            companyWorkersMap[k] = companyWorkersMap[k].size;
        });
        Object.keys(activityWorkersMap).forEach(k => {
            activityWorkersMap[k] = activityWorkersMap[k].size;
        });
        Object.keys(activityCompaniesMap).forEach(k => {
            activityCompaniesMap[k] = activityCompaniesMap[k].size;
        });
        
        // Calcola medie
        const totalHours = Object.values(workerHoursMap).reduce((sum, h) => sum + h, 0);
        const totalDays = Object.values(workerDaysMap).reduce((sum, d) => sum + d, 0);
        const totalWorkers = Object.keys(workerHoursMap).length;
        const totalCompanies = Object.keys(companyHoursMap).length;
        const totalActivities = Object.keys(activityHoursMap).length;
        
        const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
        const avgHoursPerWorker = totalWorkers > 0 ? totalHours / totalWorkers : 0;
        const avgDaysPerWorker = totalWorkers > 0 ? totalDays / totalWorkers : 0;
        
        // Top performers
        const topWorkers = Object.entries(workerHoursMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, hours]) => ({
                name,
                hours: parseFloat(hours.toFixed(1)),
                days: workerDaysMap[name] || 0,
                avgHours: workerDaysMap[name] > 0 ? parseFloat((hours / workerDaysMap[name]).toFixed(1)) : 0,
                companies: workerCompaniesMap[name] || 0
            }));
        
        const topCompanies = Object.entries(companyHoursMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, hours]) => ({
                name,
                hours: parseFloat(hours.toFixed(1)),
                workers: companyWorkersMap[name] || 0,
                avgHoursPerWorker: companyWorkersMap[name] > 0 ? parseFloat((hours / companyWorkersMap[name]).toFixed(1)) : 0
            }));
        
        const topActivities = Object.entries(activityHoursMap)
            .sort((a, b) => b[1] - a[1])
            .map(([id, hours]) => {
                const activity = activityTypes.find(a => a.id === id);
                return {
                    id,
                    name: activity ? `${activity.emoji || ''} ${activity.nome}` : `Attività #${id}`,
                    hours: parseFloat(hours.toFixed(1)),
                    workers: activityWorkersMap[id] || 0,
                    companies: activityCompaniesMap[id] || 0,
                    color: activity?.colore || '#888'
                };
            });
        
        // Dati mensili elaborati
        const monthlyStats = Object.entries(monthlyData)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-12) // Ultimi 12 mesi
            .map(([month, data]) => ({
                month,
                hours: parseFloat(data.hours.toFixed(1)),
                days: data.days.size,
                workers: data.workers.size,
                companies: data.companies.size,
                avgHoursPerDay: data.days.size > 0 ? parseFloat((data.hours / data.days.size).toFixed(1)) : 0
            }));
        
        // Dati giornalieri (ultimi 90 giorni)
        const dailyStats = Object.entries(dailyHoursMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-90)
            .map(([date, hours]) => ({
                date,
                hours: parseFloat(hours.toFixed(1))
            }));
        
        return {
            totalHours,
            totalDays,
            totalWorkers,
            totalCompanies,
            totalActivities,
            avgHoursPerDay,
            avgHoursPerWorker,
            avgDaysPerWorker,
            topWorkers,
            topCompanies,
            topActivities,
            monthlyStats,
            dailyStats,
            workerHoursMap,
            workerDaysMap,
            workerActivitiesMap,
            companyHoursMap,
            activityHoursMap
        };
    }, [sheets, activityTypes]);

    // ============================================
    // 🎨 RENDER 3D CHARTS
    // ============================================
    
    // 📊 Grafico 3D: Ore per Lavoratore (Top 20)
    React.useEffect(() => {
        if (!window.Plotly || activeTab !== 'workers') return;
        
        const container = document.getElementById('worker-3d-chart');
        if (!container) return;
        
        const data = stats.topWorkers.map((w, i) => ({
            x: w.name,
            y: w.hours,
            z: w.days,
            text: `${w.name}<br>Ore: ${w.hours}h<br>Giorni: ${w.days}<br>Media: ${w.avgHours}h/giorno`,
            type: 'scatter3d',
            mode: 'markers',
            marker: {
                size: w.hours / 5,
                color: w.hours,
                colorscale: 'Viridis',
                showscale: true,
                colorbar: { title: 'Ore Totali' }
            }
        }));
        
        const layout = {
            title: '🧑‍💼 Analisi 3D Lavoratori (Ore vs Giorni vs Performance)',
            scene: {
                xaxis: { title: 'Lavoratore' },
                yaxis: { title: 'Ore Totali' },
                zaxis: { title: 'Giorni Lavorati' }
            },
            paper_bgcolor: darkMode ? '#1f2937' : '#ffffff',
            plot_bgcolor: darkMode ? '#374151' : '#f9fafb',
            font: { color: darkMode ? '#e5e7eb' : '#1f2937' }
        };
        
        Plotly.newPlot(container, [data[0]], layout, { responsive: true });
    }, [stats, activeTab, darkMode]);
    
    // 🏢 Grafico 3D: Aziende Performance
    React.useEffect(() => {
        if (!window.Plotly || activeTab !== 'companies') return;
        
        const container = document.getElementById('company-3d-chart');
        if (!container) return;
        
        const trace = {
            x: stats.topCompanies.map(c => c.name),
            y: stats.topCompanies.map(c => c.hours),
            z: stats.topCompanies.map(c => c.workers),
            text: stats.topCompanies.map(c => `${c.name}<br>Ore: ${c.hours}h<br>Lavoratori: ${c.workers}`),
            type: 'scatter3d',
            mode: 'markers+text',
            marker: {
                size: stats.topCompanies.map(c => c.hours / 10),
                color: stats.topCompanies.map(c => c.workers),
                colorscale: 'Portland',
                showscale: true,
                colorbar: { title: 'N° Lavoratori' }
            }
        };
        
        const layout = {
            title: '🏢 Analisi 3D Aziende (Ore vs Lavoratori)',
            scene: {
                xaxis: { title: 'Azienda' },
                yaxis: { title: 'Ore Totali' },
                zaxis: { title: 'N° Lavoratori' }
            },
            paper_bgcolor: darkMode ? '#1f2937' : '#ffffff',
            plot_bgcolor: darkMode ? '#374151' : '#f9fafb',
            font: { color: darkMode ? '#e5e7eb' : '#1f2937' }
        };
        
        Plotly.newPlot(container, [trace], layout, { responsive: true });
    }, [stats, activeTab, darkMode]);
    
    // 🎨 Grafico 3D: Attività (ECharts GL)
    React.useEffect(() => {
        if (!window.echarts || activeTab !== 'activities') return;
        
        const container = document.getElementById('activity-3d-chart');
        if (!container) return;
        
        const chart = echarts.init(container);
        
        const option = {
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            title: {
                text: '🎨 Distribuzione 3D Tipi di Attività',
                textStyle: { color: darkMode ? '#e5e7eb' : '#1f2937' }
            },
            tooltip: {},
            xAxis3D: { type: 'category', data: stats.topActivities.map(a => a.name) },
            yAxis3D: { type: 'value', name: 'Ore' },
            zAxis3D: { type: 'value', name: 'Lavoratori' },
            grid3D: {
                boxWidth: 200,
                boxDepth: 80,
                viewControl: { autoRotate: true, autoRotateSpeed: 5 }
            },
            series: [{
                type: 'bar3D',
                data: stats.topActivities.map((a, i) => [i, a.hours, a.workers]),
                shading: 'lambert',
                label: {
                    show: false
                },
                itemStyle: {
                    color: params => stats.topActivities[params.value[0]]?.color || '#888'
                },
                emphasis: {
                    label: { show: true },
                    itemStyle: { color: '#ffcc00' }
                }
            }]
        };
        
        chart.setOption(option);
        
        return () => chart.dispose();
    }, [stats, activeTab, darkMode]);

    // ============================================
    // 🎯 KPI CARDS
    // ============================================
    const KPICard = ({ icon, title, value, subtitle, color, onClick }) => (
        React.createElement('div', {
            className: `${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} 
                       border-2 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer animate__animated animate__fadeInUp`,
            onClick: onClick || null
        },
            React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                React.createElement('div', { className: `text-4xl ${color}` }, icon),
                React.createElement('div', { className: `text-xs px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}` }, 'KPI')
            ),
            React.createElement('h3', { className: `text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}` }, title),
            React.createElement('p', { className: `text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}` }, value),
            subtitle && React.createElement('p', { className: `text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}` }, subtitle)
        )
    );

    // ============================================
    // 🎨 RENDER PRINCIPALE
    // ============================================
    return React.createElement('div', { 
        className: `min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`,
        ref: containerRef 
    },
        // Header con Tab Navigation
        React.createElement('div', { className: 'mb-8' },
            React.createElement('h1', { 
                className: `text-4xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'} animate__animated animate__fadeIn` 
            }, '📊 Statistiche Avanzate 3D'),
            
            // Tabs
            React.createElement('div', { className: 'flex gap-2 mb-6 overflow-x-auto' },
                ['overview', 'workers', 'companies', 'activities'].map(tab => 
                    React.createElement('button', {
                        key: tab,
                        onClick: () => setActiveTab(tab),
                        className: `px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                            activeTab === tab 
                            ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white')
                            : (darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100')
                        }`
                    }, {
                        overview: '📈 Panoramica',
                        workers: '👷 Lavoratori',
                        companies: '🏢 Aziende',
                        activities: '🎨 Attività'
                    }[tab])
                )
            )
        ),

        // Content basato su tab attivo
        activeTab === 'overview' && React.createElement('div', null,
            // KPI Grid
            React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8' },
                React.createElement(KPICard, {
                    icon: '⏱️',
                    title: 'Ore Totali',
                    value: `${stats.totalHours.toFixed(0)}h`,
                    subtitle: `Media ${stats.avgHoursPerDay.toFixed(1)}h/giorno`,
                    color: 'text-blue-500'
                }),
                React.createElement(KPICard, {
                    icon: '👷',
                    title: 'Lavoratori',
                    value: stats.totalWorkers,
                    subtitle: `Media ${stats.avgHoursPerWorker.toFixed(0)}h/lavoratore`,
                    color: 'text-green-500',
                    onClick: () => setActiveTab('workers')
                }),
                React.createElement(KPICard, {
                    icon: '🏢',
                    title: 'Aziende',
                    value: stats.totalCompanies,
                    subtitle: 'Clienti attivi',
                    color: 'text-purple-500',
                    onClick: () => setActiveTab('companies')
                }),
                React.createElement(KPICard, {
                    icon: '🎨',
                    title: 'Tipi Attività',
                    value: stats.totalActivities,
                    subtitle: 'Categorie lavoro',
                    color: 'text-orange-500',
                    onClick: () => setActiveTab('activities')
                }),
                React.createElement(KPICard, {
                    icon: '📅',
                    title: 'Giorni Totali',
                    value: stats.totalDays,
                    subtitle: `Media ${stats.avgDaysPerWorker.toFixed(1)} giorni/lavoratore`,
                    color: 'text-pink-500'
                })
            ),
            
            // Top Performers Preview
            React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
                // Top Workers
                React.createElement('div', { 
                    className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg` 
                },
                    React.createElement('h3', { 
                        className: `text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}` 
                    }, '🥇 Top 5 Lavoratori'),
                    React.createElement('div', { className: 'space-y-3' },
                        stats.topWorkers.slice(0, 5).map((w, i) => 
                            React.createElement('div', { 
                                key: w.name,
                                className: `flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                            },
                                React.createElement('div', { className: 'flex items-center gap-3' },
                                    React.createElement('span', { 
                                        className: `text-2xl ${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}` 
                                    }),
                                    React.createElement('div', null,
                                        React.createElement('p', { 
                                            className: `font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}` 
                                        }, w.name),
                                        React.createElement('p', { 
                                            className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}` 
                                        }, `${w.days} giorni`)
                                    )
                                ),
                                React.createElement('span', { 
                                    className: `font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}` 
                                }, `${w.hours}h`)
                            )
                        )
                    )
                ),
                
                // Top Companies
                React.createElement('div', { 
                    className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg` 
                },
                    React.createElement('h3', { 
                        className: `text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}` 
                    }, '🏢 Top 5 Aziende'),
                    React.createElement('div', { className: 'space-y-3' },
                        stats.topCompanies.slice(0, 5).map(c => 
                            React.createElement('div', { 
                                key: c.name,
                                className: `flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                            },
                                React.createElement('div', null,
                                    React.createElement('p', { 
                                        className: `font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}` 
                                    }, c.name),
                                    React.createElement('p', { 
                                        className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}` 
                                    }, `${c.workers} lavoratori`)
                                ),
                                React.createElement('span', { 
                                    className: `font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}` 
                                }, `${c.hours}h`)
                            )
                        )
                    )
                ),
                
                // Top Activities
                React.createElement('div', { 
                    className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg` 
                },
                    React.createElement('h3', { 
                        className: `text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}` 
                    }, '🎨 Top 5 Attività'),
                    React.createElement('div', { className: 'space-y-3' },
                        stats.topActivities.slice(0, 5).map(a => 
                            React.createElement('div', { 
                                key: a.id,
                                className: `flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                            },
                                React.createElement('div', null,
                                    React.createElement('p', { 
                                        className: `font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}` 
                                    }, a.name),
                                    React.createElement('p', { 
                                        className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}` 
                                    }, `${a.workers} lavoratori, ${a.companies} aziende`)
                                ),
                                React.createElement('span', { 
                                    className: `font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}` 
                                }, `${a.hours}h`)
                            )
                        )
                    )
                )
            )
        ),

        // Tab Workers - Grafico 3D
        activeTab === 'workers' && React.createElement('div', null,
            React.createElement('div', { 
                id: 'worker-3d-chart',
                className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`,
                style: { height: '600px' }
            })
        ),

        // Tab Companies - Grafico 3D
        activeTab === 'companies' && React.createElement('div', null,
            React.createElement('div', { 
                id: 'company-3d-chart',
                className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`,
                style: { height: '600px' }
            })
        ),

        // Tab Activities - Grafico 3D
        activeTab === 'activities' && React.createElement('div', null,
            React.createElement('div', { 
                id: 'activity-3d-chart',
                className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`,
                style: { height: '600px' }
            })
        )
    );
};

// Export
if (typeof window !== 'undefined') {
    window.Advanced3DStats = Advanced3DStats;
}
