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

// Export components
if (typeof window !== 'undefined') {
    window.AdvancedCharts = {
        DailyHoursLineChart,
        TopItemsBarChart,
        DistributionPieChart,
        PerformanceRadarChart,
        CumulativeAreaChart
    };
}
