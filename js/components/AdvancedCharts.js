// ========================================
// 📊 ADVANCED CHARTS COMPONENT - Chart.js Version
// Grafici avanzati con Chart.js + AnimateCSS + Tailwind
// ========================================

// Verifica disponibilità Chart.js
const hasChartJS = typeof window !== 'undefined' && typeof window.Chart !== 'undefined';

// 🎨 Paletta colori consistente
const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    cyan: '#06B6D4',
    indigo: '#6366F1',
    gradient: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4']
};

// Helper per generare ID unici
const generateChartId = () => `chart-${Math.random().toString(36).substr(2, 9)}`;

// ========================================
// 📈 LINE CHART - Andamento Ore Giornaliere
// ========================================
const DailyHoursLineChart = ({ data, darkMode, title }) => {
    const chartId = React.useRef(generateChartId());
    const chartInstance = React.useRef(null);
    
    // Converti data in stringa per confronto stabile
    const dataKey = React.useMemo(() => JSON.stringify(data), [data]);
    
    React.useEffect(() => {
        if (!hasChartJS || !data || data.length === 0) return;
        
        const ctx = document.getElementById(chartId.current);
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.day || d.date || d.label || d.month),
                datasets: [{
                    label: 'Ore',
                    data: data.map(d => d.hours || d.value || 0),
                    borderColor: COLORS.primary,
                    backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        titleColor: darkMode ? '#F3F4F6' : '#1F2937',
                        bodyColor: darkMode ? '#D1D5DB' : '#4B5563',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: darkMode ? '#374151' : '#E5E7EB' },
                        ticks: { color: darkMode ? '#9CA3AF' : '#6B7280', callback: (value) => value + 'h' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: darkMode ? '#9CA3AF' : '#6B7280', maxRotation: 45, minRotation: 0 }
                    }
                }
            }
        });
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [dataKey, darkMode]);
    
    if (!hasChartJS) return React.createElement('div', { className: 'text-red-500 p-4' }, '⚠️ Chart.js non caricato');
    
    return React.createElement('div', {
        className: `${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp`
    },
        React.createElement('h3', {
            className: `text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
        }, title || '📈 Andamento Ore'),
        
        React.createElement('div', { style: { position: 'relative', height: '300px' } },
            React.createElement('canvas', { id: chartId.current })
        )
    );
};

// ========================================
// 📊 BAR CHART - Top Aziende/Lavoratori
// ========================================
const TopItemsBarChart = ({ data, darkMode, title }) => {
    const chartId = React.useRef(generateChartId());
    const chartInstance = React.useRef(null);
    
    // Converti data in stringa per confronto stabile
    const dataKey = React.useMemo(() => JSON.stringify(data), [data]);
    
    React.useEffect(() => {
        if (!hasChartJS || !data || data.length === 0) return;
        
        const ctx = document.getElementById(chartId.current);
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.name || d.label),
                datasets: [{
                    label: 'Ore',
                    data: data.map(d => d.value || d.hours || 0),
                    backgroundColor: data.map((_, i) => COLORS.gradient[i % COLORS.gradient.length]),
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        titleColor: darkMode ? '#F3F4F6' : '#1F2937',
                        bodyColor: darkMode ? '#D1D5DB' : '#4B5563',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: (context) => `${context.parsed.x}h`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: darkMode ? '#374151' : '#E5E7EB' },
                        ticks: { color: darkMode ? '#9CA3AF' : '#6B7280', callback: (value) => value + 'h' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: darkMode ? '#9CA3AF' : '#6B7280', font: { size: 11 } }
                    }
                }
            }
        });
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [dataKey, darkMode]);
    
    if (!hasChartJS) return React.createElement('div', { className: 'text-red-500 p-4' }, '⚠️ Chart.js non caricato');
    
    return React.createElement('div', {
        className: `${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg animate__animated animate__zoomIn`
    },
        React.createElement('h3', {
            className: `text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
        }, title || '📊 Classifica'),
        
        React.createElement('div', { style: { position: 'relative', height: '300px' } },
            React.createElement('canvas', { id: chartId.current })
        )
    );
};

// ========================================
// 🥧 PIE CHART - Distribuzione
// ========================================
const DistributionPieChart = ({ data, darkMode, title }) => {
    const chartId = React.useRef(generateChartId());
    const chartInstance = React.useRef(null);
    
    // Converti data in stringa per confronto stabile
    const dataKey = React.useMemo(() => JSON.stringify(data), [data]);
    
    React.useEffect(() => {
        if (!hasChartJS || !data || data.length === 0) return;
        
        const ctx = document.getElementById(chartId.current);
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.name || d.label),
                datasets: [{
                    data: data.map(d => d.value || d.count || 0),
                    backgroundColor: [COLORS.success, COLORS.warning, COLORS.purple, COLORS.cyan, COLORS.pink],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: darkMode ? '#D1D5DB' : '#4B5563',
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        titleColor: darkMode ? '#F3F4F6' : '#1F2937',
                        bodyColor: darkMode ? '#D1D5DB' : '#4B5563',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [dataKey, darkMode]);
    
    if (!hasChartJS) return React.createElement('div', { className: 'text-red-500 p-4' }, '⚠️ Chart.js non caricato');
    
    return React.createElement('div', {
        className: `${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg animate__animated animate__fadeIn`
    },
        React.createElement('h3', {
            className: `text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
        }, title || '🥧 Distribuzione'),
        
        React.createElement('div', { style: { position: 'relative', height: '300px' } },
            React.createElement('canvas', { id: chartId.current })
        )
    );
};

// ========================================
// 📐 RADAR CHART - Performance
// ========================================
const PerformanceRadarChart = ({ data, darkMode, title }) => {
    const chartId = React.useRef(generateChartId());
    const chartInstance = React.useRef(null);
    
    // Converti data in stringa per confronto stabile
    const dataKey = React.useMemo(() => JSON.stringify(data), [data]);
    
    React.useEffect(() => {
        if (!hasChartJS || !data || data.length === 0) return;
        
        const ctx = document.getElementById(chartId.current);
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: data.map(d => d.metric || d.name || d.label),
                datasets: [{
                    label: 'Performance',
                    data: data.map(d => d.value || 0),
                    backgroundColor: darkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.3)',
                    borderColor: COLORS.purple,
                    borderWidth: 3,
                    pointBackgroundColor: COLORS.purple,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: COLORS.purple,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        titleColor: darkMode ? '#F3F4F6' : '#1F2937',
                        bodyColor: darkMode ? '#D1D5DB' : '#4B5563',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => `${context.parsed.r}%`
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            color: darkMode ? '#9CA3AF' : '#6B7280',
                            backdropColor: 'transparent',
                            callback: (value) => value + '%'
                        },
                        grid: { color: darkMode ? '#374151' : '#E5E7EB' },
                        pointLabels: {
                            color: darkMode ? '#D1D5DB' : '#4B5563',
                            font: { size: 11, weight: 'bold' }
                        }
                    }
                }
            }
        });
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [dataKey, darkMode]);
    
    if (!hasChartJS) return React.createElement('div', { className: 'text-red-500 p-4' }, '⚠️ Chart.js non caricato');
    
    return React.createElement('div', {
        className: `${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg animate__animated animate__fadeIn`
    },
        React.createElement('h3', {
            className: `text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
        }, title || '📐 Performance'),
        
        React.createElement('div', { style: { position: 'relative', height: '350px' } },
            React.createElement('canvas', { id: chartId.current })
        )
    );
};

// ========================================
// 📊 AREA CHART - Cumulativo
// ========================================
const CumulativeAreaChart = ({ data, darkMode, title }) => {
    const chartId = React.useRef(generateChartId());
    const chartInstance = React.useRef(null);
    
    // Converti data in stringa per confronto stabile
    const dataKey = React.useMemo(() => JSON.stringify(data), [data]);
    
    React.useEffect(() => {
        if (!hasChartJS || !data || data.length === 0) return;
        
        const ctx = document.getElementById(chartId.current);
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.day || d.date || d.label),
                datasets: [{
                    label: 'Ore Cumulative',
                    data: data.map(d => d.cumulative || d.value || 0),
                    borderColor: COLORS.success,
                    backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.3)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        titleColor: darkMode ? '#F3F4F6' : '#1F2937',
                        bodyColor: darkMode ? '#D1D5DB' : '#4B5563',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => `${context.parsed.y}h totali`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: darkMode ? '#374151' : '#E5E7EB' },
                        ticks: { color: darkMode ? '#9CA3AF' : '#6B7280', callback: (value) => value + 'h' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: darkMode ? '#9CA3AF' : '#6B7280' }
                    }
                }
            }
        });
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [dataKey, darkMode]);
    
    if (!hasChartJS) return React.createElement('div', { className: 'text-red-500 p-4' }, '⚠️ Chart.js non caricato');
    
    return React.createElement('div', {
        className: `${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg animate__animated animate__fadeInUp`
    },
        React.createElement('h3', {
            className: `text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
        }, title || '📊 Andamento Cumulativo'),
        
        React.createElement('div', { style: { position: 'relative', height: '300px' } },
            React.createElement('canvas', { id: chartId.current })
        )
    );
};

// ========================================
// 🎯 POLAR AREA CHART - Distribuzione Attività (Chart.js)
// Grafico radar circolare con aree colorate
// ========================================
const ActivityPolarChart = ({ data, darkMode, title }) => {
    const chartId = React.useRef(generateChartId());
    const chartInstance = React.useRef(null);
    
    const dataKey = React.useMemo(() => JSON.stringify(data), [data]);
    
    React.useEffect(() => {
        if (!hasChartJS || !data || data.length === 0) return;
        
        const ctx = document.getElementById(chartId.current);
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        // Palette colori vivaci per ogni attività
        const colors = [
            'rgba(139, 92, 246, 0.7)',   // Purple
            'rgba(59, 130, 246, 0.7)',   // Blue
            'rgba(16, 185, 129, 0.7)',   // Green
            'rgba(245, 158, 11, 0.7)',   // Orange
            'rgba(239, 68, 68, 0.7)',    // Red
            'rgba(236, 72, 153, 0.7)',   // Pink
            'rgba(6, 182, 212, 0.7)',    // Cyan
            'rgba(99, 102, 241, 0.7)'    // Indigo
        ];
        
        const borderColors = [
            'rgba(139, 92, 246, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(6, 182, 212, 1)',
            'rgba(99, 102, 241, 1)'
        ];
        
        chartInstance.current = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: data.map(d => d.metric || d.name),
                datasets: [{
                    data: data.map(d => d.value || 0),
                    backgroundColor: colors.slice(0, data.length),
                    borderColor: borderColors.slice(0, data.length),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: darkMode ? '#E5E7EB' : '#374151',
                            font: { size: 12, family: 'Inter, sans-serif' },
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        titleColor: darkMode ? '#F3F4F6' : '#1F2937',
                        bodyColor: darkMode ? '#D1D5DB' : '#4B5563',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => `${context.label}: ${context.parsed.r}%`
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            color: darkMode ? '#9CA3AF' : '#6B7280',
                            backdropColor: 'transparent',
                            font: { size: 11 },
                            callback: (value) => value + '%'
                        },
                        grid: {
                            color: darkMode ? '#374151' : '#E5E7EB',
                            lineWidth: 1
                        },
                        pointLabels: {
                            color: darkMode ? '#D1D5DB' : '#4B5563',
                            font: { size: 11, weight: 'bold' }
                        }
                    }
                }
            }
        });
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [dataKey, darkMode]);
    
    if (!hasChartJS) return React.createElement('div', { className: 'text-red-500 p-4' }, '⚠️ Chart.js non caricato');
    
    if (!data || data.length === 0) {
        return React.createElement('div', {
            className: `${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'} p-6 rounded-xl text-center`
        }, '📊 Nessun dato disponibile');
    }
    
    return React.createElement('div', {
        className: `${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow-lg animate__animated animate__fadeIn`
    },
        title ? React.createElement('h3', {
            className: `font-semibold text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
        }, title) : null,
        React.createElement('div', { style: { position: 'relative', height: '400px' } },
            React.createElement('canvas', { id: chartId.current })
        )
    );
};

// ========================================
// ⏰ TIME DISTRIBUTION CHART - Distribuzione Ore per Fascia Oraria
// Mostra quando i lavoratori lavorano effettivamente (dati REALI da oraIn/oraOut)
// ========================================
const TimeDistributionChart = ({ sheets, darkMode, title }) => {
    const chartId = React.useRef(generateChartId());
    const chartInstance = React.useRef(null);
    
    // Calcola distribuzione oraria dai dati REALI
    const timeData = React.useMemo(() => {
        if (!sheets || sheets.length === 0) return null;
        
        // Fasce orarie: Mattina (6-12), Pomeriggio (12-18), Sera (18-22), Notte (22-6)
        const slots = {
            morning: 0,    // 6:00 - 12:00
            afternoon: 0,  // 12:00 - 18:00
            evening: 0,    // 18:00 - 22:00
            night: 0       // 22:00 - 6:00
        };
        
        // Helper: converti "HH:MM" in minuti dall'inizio giornata
        const timeToMinutes = (timeStr) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };
        
        // Helper: calcola ore in una fascia specifica
        const getHoursInSlot = (startMin, endMin, slotStart, slotEnd) => {
            // Gestisci caso notte (attraversa mezzanotte)
            if (slotEnd < slotStart) {
                slotEnd += 24 * 60; // aggiungi 24h
                if (endMin < slotStart) endMin += 24 * 60;
            }
            
            const overlapStart = Math.max(startMin, slotStart);
            const overlapEnd = Math.min(endMin, slotEnd);
            
            if (overlapStart >= overlapEnd) return 0;
            return (overlapEnd - overlapStart) / 60; // converti in ore
        };
        
        // Analizza ogni foglio
        sheets.forEach(sheet => {
            if (!sheet.lavoratori || sheet.lavoratori.length === 0) return;
            
            sheet.lavoratori.forEach(worker => {
                if (!worker.oraIn || !worker.oraOut) return;
                
                const startMin = timeToMinutes(worker.oraIn);
                const endMin = timeToMinutes(worker.oraOut);
                const pausaMin = parseInt(worker.pausaMinuti || 0);
                
                // Calcola ore nette (sottraendo pausa)
                const totalMinutes = endMin - startMin - pausaMin;
                if (totalMinutes <= 0) return;
                
                // Distribuisci ore nelle fasce (6-12, 12-18, 18-22, 22-6)
                slots.morning += getHoursInSlot(startMin, endMin, 6 * 60, 12 * 60);
                slots.afternoon += getHoursInSlot(startMin, endMin, 12 * 60, 18 * 60);
                slots.evening += getHoursInSlot(startMin, endMin, 18 * 60, 22 * 60);
                slots.night += getHoursInSlot(startMin, endMin, 22 * 60, 30 * 60); // 22-6 = 22-30 (mod 24)
            });
        });
        
        const total = slots.morning + slots.afternoon + slots.evening + slots.night;
        if (total === 0) return null;
        
        return {
            labels: ['Mattina (6-12)', 'Pomeriggio (12-18)', 'Sera (18-22)', 'Notte (22-6)'],
            values: [slots.morning, slots.afternoon, slots.evening, slots.night],
            percentages: [
                Math.round((slots.morning / total) * 100),
                Math.round((slots.afternoon / total) * 100),
                Math.round((slots.evening / total) * 100),
                Math.round((slots.night / total) * 100)
            ]
        };
    }, [sheets]);
    
    React.useEffect(() => {
        if (!hasChartJS || !timeData) return;
        
        const ctx = document.getElementById(chartId.current);
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: timeData.labels,
                datasets: [{
                    label: 'Ore Lavorate',
                    data: timeData.values,
                    backgroundColor: [
                        'rgba(251, 191, 36, 0.8)',   // Giallo mattina
                        'rgba(59, 130, 246, 0.8)',   // Blu pomeriggio
                        'rgba(139, 92, 246, 0.8)',   // Viola sera
                        'rgba(30, 41, 59, 0.8)'      // Scuro notte
                    ],
                    borderColor: [
                        'rgb(251, 191, 36)',
                        'rgb(59, 130, 246)',
                        'rgb(139, 92, 246)',
                        'rgb(30, 41, 59)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y', // Barre orizzontali
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: darkMode ? '#1E293B' : '#FFF',
                        titleColor: darkMode ? '#FFF' : '#1E293B',
                        bodyColor: darkMode ? '#94A3B8' : '#64748B',
                        borderColor: darkMode ? '#334155' : '#E2E8F0',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: (context) => {
                                const hours = context.parsed.x.toFixed(1);
                                const percentage = timeData.percentages[context.dataIndex];
                                return `${hours} ore (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: darkMode ? '#334155' : '#E2E8F0',
                            drawBorder: false
                        },
                        ticks: {
                            color: darkMode ? '#94A3B8' : '#64748B',
                            font: { size: 11 },
                            callback: (value) => value + 'h'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: darkMode ? '#CBD5E1' : '#475569',
                            font: { 
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                }
            }
        });
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [timeData, darkMode]);
    
    if (!hasChartJS) {
        return React.createElement('div', { 
            className: 'text-center text-gray-500 py-8' 
        }, '⚠️ Chart.js non disponibile');
    }
    
    if (!timeData) {
        return React.createElement('div', { 
            className: 'text-center text-gray-500 py-8' 
        }, 'Nessun dato disponibile');
    }
    
    return React.createElement('div', { 
        className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4'
    },
        title && React.createElement('h3', { 
            className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' 
        }, title),
        React.createElement('div', { 
            style: { height: '280px', position: 'relative' } 
        },
            React.createElement('canvas', { 
                id: chartId.current,
                style: { maxHeight: '100%' }
            })
        )
    );
};

// Export components
if (typeof window !== 'undefined') {
    window.AdvancedCharts = {
        DailyHoursLineChart,
        TopItemsBarChart,
        DistributionPieChart,
        PerformanceRadarChart,
        CumulativeAreaChart,
        ActivityPolarChart,
        TimeDistributionChart
    };
}
