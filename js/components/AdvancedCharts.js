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

// ========================================
// 📍 TOP LOCATIONS CHART - Indirizzi più utilizzati
// ========================================
const TopLocationsChart = ({ sheets, darkMode, title }) => {
    const chartId = React.useRef(generateChartId());
    const chartInstance = React.useRef(null);
    
    // Calcola statistiche locations dai fogli
    const locationStats = React.useMemo(() => {
        if (!sheets || sheets.length === 0) return [];
        
        const stats = {};
        let totalHours = 0;
        let totalSheets = 0;
        
        sheets.forEach(sheet => {
            // Skippa fogli archiviati
            if (sheet.archived) return;
            
            const address = sheet.indirizzoEvento;
            if (!address || !address.trim()) return;
            
            // 🔧 Normalizza indirizzo per evitare duplicati (usa la stessa funzione di utils.js)
            const normalized = typeof window.normalizeAddress === 'function' 
                ? window.normalizeAddress(address)
                : address.toLowerCase().trim();
            
            // Calcola ore del foglio
            let sheetHours = 0;
            if (sheet.lavoratori && Array.isArray(sheet.lavoratori)) {
                sheet.lavoratori.forEach(worker => {
                    if (worker.oraIn && worker.oraOut) {
                        const [hIn, mIn] = worker.oraIn.split(':').map(Number);
                        const [hOut, mOut] = worker.oraOut.split(':').map(Number);
                        const totalMinutes = (hOut * 60 + mOut) - (hIn * 60 + mIn) - (worker.pausaMinuti || 0);
                        sheetHours += totalMinutes / 60;
                    }
                });
            }
            
            // Usa normalized come chiave per aggregare
            if (!stats[normalized]) {
                stats[normalized] = {
                    address: address, // Mantieni l'originale per visualizzazione
                    normalized: normalized,
                    sheets: 0,
                    hours: 0,
                    workers: 0
                };
            } else {
                // Se esiste già, usa l'indirizzo più recente (quello corrente)
                stats[normalized].address = address;
            }
            
            stats[normalized].sheets++;
            stats[normalized].hours += sheetHours;
            stats[normalized].workers += (sheet.lavoratori?.length || 0);
            totalHours += sheetHours;
            totalSheets++;
        });
        
        // Converti in array e calcola percentuali
        const result = Object.values(stats)
            .map(stat => ({
                ...stat,
                percentage: totalSheets > 0 ? (stat.sheets / totalSheets * 100) : 0,
                hoursPercentage: totalHours > 0 ? (stat.hours / totalHours * 100) : 0,
                avgHoursPerSheet: stat.sheets > 0 ? (stat.hours / stat.sheets) : 0
            }))
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 10); // Top 10 locations
        
        return result;
    }, [sheets]);
    
    const dataKey = React.useMemo(() => JSON.stringify(locationStats), [locationStats]);
    
    React.useEffect(() => {
        if (!hasChartJS || locationStats.length === 0) return;
        
        const ctx = document.getElementById(chartId.current);
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        // Tronca indirizzi lunghi per le labels
        const labels = locationStats.map(stat => {
            const addr = stat.address;
            return addr.length > 30 ? addr.substring(0, 30) + '...' : addr;
        });
        
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ore Totali',
                    data: locationStats.map(s => s.hours.toFixed(1)),
                    backgroundColor: COLORS.gradient,
                    borderColor: COLORS.gradient.map(c => c),
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
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        titleColor: darkMode ? '#FFFFFF' : '#1F2937',
                        bodyColor: darkMode ? '#D1D5DB' : '#6B7280',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            title: (items) => {
                                const idx = items[0].dataIndex;
                                return locationStats[idx].address;
                            },
                            label: (context) => {
                                const idx = context.dataIndex;
                                const stat = locationStats[idx];
                                return [
                                    `Ore totali: ${stat.hours.toFixed(1)}h (${stat.hoursPercentage.toFixed(1)}%)`,
                                    `Fogli: ${stat.sheets} (${stat.percentage.toFixed(1)}%)`,
                                    `Media: ${stat.avgHoursPerSheet.toFixed(1)}h per foglio`,
                                    `Lavoratori totali: ${stat.workers}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: darkMode ? '#374151' : '#E5E7EB',
                            drawBorder: false
                        },
                        ticks: {
                            color: darkMode ? '#9CA3AF' : '#6B7280',
                            callback: (value) => `${value}h`
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: darkMode ? '#9CA3AF' : '#6B7280',
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [dataKey, darkMode]);
    
    if (!hasChartJS) {
        return React.createElement('div', { 
            className: `p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}` 
        }, '⚠️ Chart.js non disponibile');
    }
    
    if (locationStats.length === 0) {
        return React.createElement('div', {
            className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`
        },
            React.createElement('h3', {
                className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
            }, title || '📍 Top Locations'),
            React.createElement('div', {
                className: 'text-center py-8'
            },
                React.createElement('p', {
                    className: `text-4xl mb-2`
                }, '📍'),
                React.createElement('p', {
                    className: `${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                }, 'Nessun indirizzo nei fogli')
            )
        );
    }
    
    return React.createElement('div', {
        className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`
    },
        React.createElement('h3', {
            className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
        }, title || '📍 Top Locations'),
        React.createElement('div', {
            style: { height: '400px', position: 'relative' }
        },
            React.createElement('canvas', {
                id: chartId.current
            })
        )
    );
};

// ========================================
// 📈 TREND CHART - Andamento con previsioni e confronto
// ========================================
const TrendChart = ({ sheets, darkMode, title, period = 'month' }) => {
    const chartId = React.useRef(generateChartId());
    const chartInstance = React.useRef(null);
    
    // Calcola statistiche trend con previsioni
    const trendData = React.useMemo(() => {
        if (!sheets || sheets.length === 0) return null;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Mese corrente (INCLUDI anche archiviati per ore totali reali del mese)
        const currentMonthSheets = sheets.filter(s => {
            // ✅ Includi TUTTI i fogli del mese (anche archiviati) per dati accurati
            const sheetDate = s.data ? new Date(s.data) : null;
            return sheetDate && sheetDate.getMonth() === currentMonth && sheetDate.getFullYear() === currentYear;
        });
        
        // Mese precedente (INCLUDI anche archiviati per confronto accurato)
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const prevMonthSheets = sheets.filter(s => {
            // ✅ Includi TUTTI i fogli del mese precedente per confronto corretto
            const sheetDate = s.data ? new Date(s.data) : null;
            return sheetDate && sheetDate.getMonth() === prevMonth && sheetDate.getFullYear() === prevYear;
        });
        
        // Calcola ore per ogni gruppo
        const calculateHours = (sheetsList) => {
            return sheetsList.reduce((total, sheet) => {
                if (!sheet.lavoratori) return total;
                const sheetHours = sheet.lavoratori.reduce((sum, worker) => {
                    if (worker.oraIn && worker.oraOut) {
                        const [hIn, mIn] = worker.oraIn.split(':').map(Number);
                        const [hOut, mOut] = worker.oraOut.split(':').map(Number);
                        const totalMinutes = (hOut * 60 + mOut) - (hIn * 60 + mIn) - (worker.pausaMinuti || 0);
                        return sum + (totalMinutes / 60);
                    }
                    return sum;
                }, 0);
                return total + sheetHours;
            }, 0);
        };
        
        const currentHours = calculateHours(currentMonthSheets);
        const prevHours = calculateHours(prevMonthSheets);
        
        // Calcola trend % (confronto mese corrente vs precedente)
        const trend = prevHours > 0 ? ((currentHours - prevHours) / prevHours * 100) : 0;
        
        // Previsione basata su media giornaliera
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const currentDay = now.getDate();
        const avgHoursPerDay = currentDay > 0 ? currentHours / currentDay : 0;
        const projectedHours = avgHoursPerDay * daysInMonth;
        
        // Dati ultimi 6 mesi per grafico (INCLUDI ARCHIVIATI per storico completo)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(currentYear, currentMonth - i, 1);
            const m = monthDate.getMonth();
            const y = monthDate.getFullYear();
            
            const monthSheets = sheets.filter(s => {
                // ✅ INCLUDI anche fogli archiviati per analisi storica
                const sheetDate = s.data ? new Date(s.data) : null;
                return sheetDate && sheetDate.getMonth() === m && sheetDate.getFullYear() === y;
            });
            
            const hours = calculateHours(monthSheets);
            const monthName = monthDate.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
            
            monthlyData.push({
                month: monthName,
                hours: parseFloat(hours.toFixed(1)),
                isCurrent: m === currentMonth && y === currentYear
            });
        }
        
        return {
            currentHours: parseFloat(currentHours.toFixed(1)),
            prevHours: parseFloat(prevHours.toFixed(1)),
            trend: parseFloat(trend.toFixed(1)),
            projectedHours: parseFloat(projectedHours.toFixed(1)),
            avgHoursPerDay: parseFloat(avgHoursPerDay.toFixed(1)),
            currentDay,
            daysInMonth,
            monthlyData,
            currentMonthSheets: currentMonthSheets.length,
            prevMonthSheets: prevMonthSheets.length
        };
    }, [sheets, period]);
    
    const dataKey = React.useMemo(() => JSON.stringify(trendData), [trendData]);
    
    React.useEffect(() => {
        if (!hasChartJS || !trendData || trendData.monthlyData.length === 0) return;
        
        const ctx = document.getElementById(chartId.current);
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.monthlyData.map(d => d.month),
                datasets: [
                    {
                        label: 'Ore Effettive',
                        data: trendData.monthlyData.map(d => d.hours),
                        borderColor: COLORS.primary,
                        backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: trendData.monthlyData.map(d => d.isCurrent ? COLORS.success : COLORS.primary),
                        pointRadius: trendData.monthlyData.map(d => d.isCurrent ? 8 : 5),
                        pointHoverRadius: 10
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        titleColor: darkMode ? '#FFFFFF' : '#1F2937',
                        bodyColor: darkMode ? '#D1D5DB' : '#6B7280',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                return `Ore: ${context.parsed.y}h`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: darkMode ? '#374151' : '#E5E7EB',
                            drawBorder: false
                        },
                        ticks: {
                            color: darkMode ? '#9CA3AF' : '#6B7280',
                            callback: (value) => `${value}h`
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: darkMode ? '#9CA3AF' : '#6B7280'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
        
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [dataKey, darkMode]);
    
    if (!hasChartJS) {
        return React.createElement('div', { 
            className: `p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}` 
        }, '⚠️ Chart.js non disponibile');
    }
    
    if (!trendData) {
        return React.createElement('div', {
            className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`
        },
            React.createElement('h3', {
                className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
            }, title || '📈 Trend Temporale'),
            React.createElement('div', {
                className: 'text-center py-8'
            },
                React.createElement('p', {
                    className: `${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                }, 'Dati insufficienti')
            )
        );
    }
    
    return React.createElement('div', {
        className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`
    },
        React.createElement('h3', {
            className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
        }, title || '📈 Trend Temporale'),
        
        // KPI Cards
        React.createElement('div', {
            className: 'grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'
        },
            // Mese corrente
            React.createElement('div', {
                className: `${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg p-3`
            },
                React.createElement('div', {
                    className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`
                }, 'Mese Corrente'),
                React.createElement('div', {
                    className: `text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                }, `${trendData.currentHours}h`),
                React.createElement('div', {
                    className: `text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`
                }, `${trendData.currentMonthSheets} fogli`)
            ),
            
            // Trend
            React.createElement('div', {
                className: `${darkMode ? 'bg-gray-700' : trendData.trend >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-3`
            },
                React.createElement('div', {
                    className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`
                }, 'Trend vs Mese Prec.'),
                React.createElement('div', {
                    className: `text-2xl font-bold ${darkMode ? (trendData.trend >= 0 ? 'text-green-400' : 'text-red-400') : (trendData.trend >= 0 ? 'text-green-600' : 'text-red-600')}`
                }, `${trendData.trend >= 0 ? '+' : ''}${trendData.trend}%`),
                React.createElement('div', {
                    className: `text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`
                }, `${trendData.prevHours}h`)
            ),
            
            // Previsione
            React.createElement('div', {
                className: `${darkMode ? 'bg-gray-700' : 'bg-purple-50'} rounded-lg p-3`
            },
                React.createElement('div', {
                    className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`
                }, '🔮 Previsione Fine Mese'),
                React.createElement('div', {
                    className: `text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`
                }, `${trendData.projectedHours}h`),
                React.createElement('div', {
                    className: `text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`
                }, `Giorno ${trendData.currentDay}/${trendData.daysInMonth}`)
            ),
            
            // Media giornaliera
            React.createElement('div', {
                className: `${darkMode ? 'bg-gray-700' : 'bg-indigo-50'} rounded-lg p-3`
            },
                React.createElement('div', {
                    className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`
                }, 'Media Giornaliera'),
                React.createElement('div', {
                    className: `text-2xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`
                }, `${trendData.avgHoursPerDay}h`),
                React.createElement('div', {
                    className: `text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`
                }, 'per giorno')
            )
        ),
        
        // Grafico
        React.createElement('div', {
            style: { height: '300px', position: 'relative' }
        },
            React.createElement('canvas', {
                id: chartId.current
            })
        )
    );
};

// ========================================
// 📅 WEEKDAY DISTRIBUTION CHART - Distribuzione per giorno settimana
// ========================================
const WeekdayDistributionChart = ({ sheets, darkMode, title }) => {
    const chartId = React.useRef(generateChartId());
    const chartInstance = React.useRef(null);
    
    const weekdayData = React.useMemo(() => {
        if (!sheets || sheets.length === 0) return [];
        
        const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        const stats = Array(7).fill(0).map((_, i) => ({ day: dayNames[i], hours: 0, sheets: 0 }));
        
        sheets.forEach(sheet => {
            const sheetDate = sheet.data ? new Date(sheet.data) : null;
            if (!sheetDate || !sheet.lavoratori) return;
            
            const dayIndex = sheetDate.getDay();
            const sheetHours = sheet.lavoratori.reduce((sum, worker) => {
                if (worker.oraIn && worker.oraOut) {
                    const [hIn, mIn] = worker.oraIn.split(':').map(Number);
                    const [hOut, mOut] = worker.oraOut.split(':').map(Number);
                    const totalMinutes = (hOut * 60 + mOut) - (hIn * 60 + mIn) - (worker.pausaMinuti || 0);
                    return sum + (totalMinutes / 60);
                }
                return sum;
            }, 0);
            
            stats[dayIndex].hours += sheetHours;
            stats[dayIndex].sheets++;
        });
        
        return stats.map(s => ({ ...s, hours: parseFloat(s.hours.toFixed(1)) }));
    }, [sheets]);
    
    const dataKey = React.useMemo(() => JSON.stringify(weekdayData), [weekdayData]);
    
    React.useEffect(() => {
        if (!hasChartJS || weekdayData.length === 0) return;
        
        const ctx = document.getElementById(chartId.current);
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weekdayData.map(d => d.day),
                datasets: [{
                    label: 'Ore',
                    data: weekdayData.map(d => d.hours),
                    backgroundColor: COLORS.gradient,
                    borderColor: COLORS.gradient,
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        titleColor: darkMode ? '#FFFFFF' : '#1F2937',
                        bodyColor: darkMode ? '#D1D5DB' : '#6B7280',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                const idx = context.dataIndex;
                                return [
                                    `Ore totali: ${weekdayData[idx].hours}h`,
                                    `Fogli: ${weekdayData[idx].sheets}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: darkMode ? '#374151' : '#E5E7EB',
                            drawBorder: false
                        },
                        ticks: {
                            color: darkMode ? '#9CA3AF' : '#6B7280',
                            callback: (value) => `${value}h`
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: darkMode ? '#9CA3AF' : '#6B7280' }
                    }
                },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
            }
        });
        
        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [dataKey, darkMode]);
    
    if (!hasChartJS || weekdayData.length === 0) {
        return React.createElement('div', {
            className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`
        },
            React.createElement('h3', {
                className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
            }, title || '📅 Distribuzione Settimanale'),
            React.createElement('p', {
                className: `text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
            }, 'Nessun dato disponibile')
        );
    }
    
    return React.createElement('div', {
        className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`
    },
        React.createElement('h3', {
            className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
        }, title || '📅 Distribuzione Settimanale'),
        React.createElement('div', {
            style: { height: '300px', position: 'relative' }
        },
            React.createElement('canvas', { id: chartId.current })
        )
    );
};

// ========================================
// 🎯 EFFICIENCY CHART - Ore Stimate vs Effettive
// ========================================
const EfficiencyChart = ({ sheets, darkMode, title }) => {
    const chartId = React.useRef(generateChartId());
    const chartInstance = React.useRef(null);
    
    const efficiencyData = React.useMemo(() => {
        if (!sheets || sheets.length === 0) return null;
        
        let totalEstimated = 0;
        let totalActual = 0;
        let sheetsWithEstimate = 0;
        
        sheets.forEach(sheet => {
            const actualHours = sheet.lavoratori?.reduce((sum, worker) => {
                if (worker.oraIn && worker.oraOut) {
                    const [hIn, mIn] = worker.oraIn.split(':').map(Number);
                    const [hOut, mOut] = worker.oraOut.split(':').map(Number);
                    const totalMinutes = (hOut * 60 + mOut) - (hIn * 60 + mIn) - (worker.pausaMinuti || 0);
                    return sum + (totalMinutes / 60);
                }
                return sum;
            }, 0) || 0;
            
            // Calculate estimated hours from time range (orarioStimatoDa - orarioStimatoA)
            let estimatedHours = 0;
            if (sheet.orarioStimatoDa && sheet.orarioStimatoA) {
                const [hStart, mStart] = sheet.orarioStimatoDa.split(':').map(Number);
                const [hEnd, mEnd] = sheet.orarioStimatoA.split(':').map(Number);
                const estimatedMinutes = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);
                estimatedHours = estimatedMinutes / 60;
            }
            // Fallback: support old orePreviste field if it exists
            else if (sheet.orePreviste) {
                estimatedHours = parseFloat(sheet.orePreviste);
            }
            
            if (estimatedHours > 0 && actualHours > 0) {
                totalEstimated += estimatedHours;
                totalActual += actualHours;
                sheetsWithEstimate++;
            }
        });
        
        if (sheetsWithEstimate === 0) return null;
        
        const variance = totalEstimated > 0 ? ((totalActual - totalEstimated) / totalEstimated * 100) : 0;
        
        return {
            estimated: parseFloat(totalEstimated.toFixed(1)),
            actual: parseFloat(totalActual.toFixed(1)),
            variance: parseFloat(variance.toFixed(1)),
            sheetsCount: sheetsWithEstimate
        };
    }, [sheets]);
    
    const dataKey = React.useMemo(() => JSON.stringify(efficiencyData), [efficiencyData]);
    
    React.useEffect(() => {
        if (!hasChartJS || !efficiencyData) return;
        
        const ctx = document.getElementById(chartId.current);
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ore Stimate', 'Ore Effettive'],
                datasets: [{
                    label: 'Ore',
                    data: [efficiencyData.estimated, efficiencyData.actual],
                    backgroundColor: [COLORS.warning, COLORS.success],
                    borderColor: [COLORS.warning, COLORS.success],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        titleColor: darkMode ? '#FFFFFF' : '#1F2937',
                        bodyColor: darkMode ? '#D1D5DB' : '#6B7280',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        borderWidth: 1,
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: darkMode ? '#374151' : '#E5E7EB',
                            drawBorder: false
                        },
                        ticks: {
                            color: darkMode ? '#9CA3AF' : '#6B7280',
                            callback: (value) => `${value}h`
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: darkMode ? '#9CA3AF' : '#6B7280' }
                    }
                },
                animation: { duration: 1000, easing: 'easeInOutQuart' }
            }
        });
        
        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [dataKey, darkMode]);
    
    if (!hasChartJS || !efficiencyData) {
        return React.createElement('div', {
            className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`
        },
            React.createElement('h3', {
                className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
            }, title || '🎯 Efficienza'),
            React.createElement('p', {
                className: `text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
            }, 'Nessun dato con ore stimate')
        );
    }
    
    return React.createElement('div', {
        className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`
    },
        React.createElement('h3', {
            className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
        }, title || '🎯 Efficienza: Stimate vs Effettive'),
        React.createElement('div', {
            className: `mb-4 p-3 rounded-lg ${efficiencyData.variance > 0 ? (darkMode ? 'bg-red-900/20' : 'bg-red-50') : (darkMode ? 'bg-green-900/20' : 'bg-green-50')}`
        },
            React.createElement('div', {
                className: `text-center`
            },
                React.createElement('div', {
                    className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                }, 'Varianza'),
                React.createElement('div', {
                    className: `text-2xl font-bold ${efficiencyData.variance > 0 ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-green-400' : 'text-green-600')}`
                }, `${efficiencyData.variance >= 0 ? '+' : ''}${efficiencyData.variance}%`),
                React.createElement('div', {
                    className: `text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`
                }, `${efficiencyData.sheetsCount} fogli con stima`)
            )
        ),
        React.createElement('div', {
            style: { height: '250px', position: 'relative' }
        },
            React.createElement('canvas', { id: chartId.current })
        )
    );
};

// ========================================
// 📈 WEEKLY GROWTH CHART - Crescita Settimanale
// ========================================
const WeeklyGrowthChart = ({ sheets, darkMode, title }) => {
    const growthData = React.useMemo(() => {
        if (!sheets || sheets.length === 0) return null;
        
        const now = new Date();
        // Get start of current week (Sunday = 0)
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);
        
        const lastWeekStart = new Date(currentWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        
        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
        
        const calculateWeekHours = (startDate, endDate) => {
            return sheets.reduce((total, sheet) => {
                // Use sheet.data (date field) or fallback to createdAt
                const dateString = sheet.data || sheet.createdAt;
                if (!dateString) return total;
                
                const sheetDate = new Date(dateString);
                if (isNaN(sheetDate.getTime()) || sheetDate < startDate || sheetDate >= endDate) return total;
                
                const sheetHours = sheet.lavoratori?.reduce((sum, worker) => {
                    if (worker.oraIn && worker.oraOut) {
                        const [hIn, mIn] = worker.oraIn.split(':').map(Number);
                        const [hOut, mOut] = worker.oraOut.split(':').map(Number);
                        const totalMinutes = (hOut * 60 + mOut) - (hIn * 60 + mIn) - (worker.pausaMinuti || 0);
                        return sum + (totalMinutes / 60);
                    }
                    return sum;
                }, 0) || 0;
                
                return total + sheetHours;
            }, 0);
        };
        
        const currentWeekHours = calculateWeekHours(currentWeekStart, currentWeekEnd);
        const lastWeekHours = calculateWeekHours(lastWeekStart, currentWeekStart);
        
        const growth = lastWeekHours > 0 ? ((currentWeekHours - lastWeekHours) / lastWeekHours * 100) : 
                       (currentWeekHours > 0 ? 100 : 0); // If no previous week data, show 100% if current has data
        
        console.log('WeeklyGrowthChart - Current:', currentWeekHours, 'Last:', lastWeekHours, 'Growth:', growth);
        
        return {
            currentWeek: parseFloat(currentWeekHours.toFixed(1)),
            lastWeek: parseFloat(lastWeekHours.toFixed(1)),
            growth: parseFloat(growth.toFixed(1))
        };
    }, [sheets]);
    
    if (!growthData) {
        return React.createElement('div', {
            className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`
        },
            React.createElement('h3', {
                className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
            }, title || '📈 Crescita Settimanale'),
            React.createElement('p', {
                className: `text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
            }, 'Dati insufficienti')
        );
    }
    
    return React.createElement('div', {
        className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`
    },
        React.createElement('h3', {
            className: `text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
        }, title || '📈 Crescita Settimanale'),
        React.createElement('div', {
            className: 'grid grid-cols-2 gap-4'
        },
            React.createElement('div', {
                className: `${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg p-4`
            },
                React.createElement('div', {
                    className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`
                }, 'Questa Settimana'),
                React.createElement('div', {
                    className: `text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                }, `${growthData.currentWeek}h`)
            ),
            React.createElement('div', {
                className: `${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4`
            },
                React.createElement('div', {
                    className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`
                }, 'Settimana Scorsa'),
                React.createElement('div', {
                    className: `text-3xl font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                }, `${growthData.lastWeek}h`)
            )
        ),
        React.createElement('div', {
            className: `mt-4 p-4 rounded-lg ${growthData.growth >= 0 ? (darkMode ? 'bg-green-900/20' : 'bg-green-50') : (darkMode ? 'bg-red-900/20' : 'bg-red-50')}`
        },
            React.createElement('div', {
                className: 'text-center'
            },
                React.createElement('div', {
                    className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`
                }, 'Crescita'),
                React.createElement('div', {
                    className: `text-4xl font-bold ${growthData.growth >= 0 ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`
                }, `${growthData.growth >= 0 ? '+' : ''}${growthData.growth}%`)
            )
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
        TimeDistributionChart,
        TopLocationsChart,
        TrendChart,
        WeekdayDistributionChart,
        EfficiencyChart,
        WeeklyGrowthChart
    };
}
