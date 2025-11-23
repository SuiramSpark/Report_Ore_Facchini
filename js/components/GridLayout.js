// ========================================
// � DASHBOARD CUSTOMIZER - Riordina & Ridimensiona Widget
// ========================================

if (!window.DashboardCustomizer) {
window.DashboardCustomizer = {
    // Stato di personalizzazione
    isEditMode: false,
    
    // Carica configurazione salvata
    loadConfig: () => {
        try {
            const saved = localStorage.getItem('dashboard-widget-config');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    },
    
    // Salva configurazione
    saveConfig: (config) => {
        try {
            localStorage.setItem('dashboard-widget-config', JSON.stringify(config));
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast('✅ Layout salvato', 'success');
            }
        } catch (e) {
            console.error('Failed to save config:', e);
        }
    },
    
    // Reset configurazione
    resetConfig: () => {
        try {
            localStorage.removeItem('dashboard-widget-config');
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast('🔄 Layout ripristinato', 'success');
            }
            // Ricarica pagina per applicare reset
            window.location.reload();
        } catch (e) {
            console.error('Failed to reset config:', e);
        }
    },
    
    // Toggle edit mode
    toggleEditMode: (callback) => {
        window.DashboardCustomizer.isEditMode = !window.DashboardCustomizer.isEditMode;
        if (callback) callback(window.DashboardCustomizer.isEditMode);
    },
    
    // Get widget size class
    getWidgetSize: (widgetId) => {
        const config = window.DashboardCustomizer.loadConfig();
        return config[widgetId]?.size || 'default';
    },
    
    // Set widget size
    setWidgetSize: (widgetId, size) => {
        const config = window.DashboardCustomizer.loadConfig();
        config[widgetId] = { ...(config[widgetId] || {}), size };
        window.DashboardCustomizer.saveConfig(config);
    },
    
    // Get widget order
    getWidgetOrder: (widgetId) => {
        const config = window.DashboardCustomizer.loadConfig();
        return config[widgetId]?.order !== undefined ? config[widgetId].order : 999;
    },
    
    // Set widget order
    setWidgetOrder: (widgetId, order) => {
        const config = window.DashboardCustomizer.loadConfig();
        config[widgetId] = { ...(config[widgetId] || {}), order };
        window.DashboardCustomizer.saveConfig(config);
    },
    
    // Get widget visibility
    isWidgetVisible: (widgetId) => {
        const config = window.DashboardCustomizer.loadConfig();
        return config[widgetId]?.visible !== false;
    },
    
    // Toggle widget visibility
    toggleWidgetVisibility: (widgetId) => {
        const config = window.DashboardCustomizer.loadConfig();
        const currentVisible = config[widgetId]?.visible !== false;
        config[widgetId] = { ...(config[widgetId] || {}), visible: !currentVisible };
        window.DashboardCustomizer.saveConfig(config);
    },
    
    // Size mapping (Tailwind classes)
    getSizeClass: (size, isFullRow = false) => {
        if (isFullRow) return 'col-span-full';
        
        const sizeMap = {
            'small': 'lg:col-span-1',        // 1/12
            'medium': 'lg:col-span-2',       // 2/12
            'default': 'lg:col-span-6',      // 6/12 (metà)
            'large': 'lg:col-span-8',        // 8/12
            'full': 'col-span-full'          // 12/12
        };
        
        return sizeMap[size] || sizeMap['default'];
    }
};

// 🎨 Modern iOS-style Toggle Switch Component
const ModernToggleSwitch = ({ label, checked, onChange, darkMode, icon = '' }) => {
    return React.createElement('div', {
        className: 'flex items-center gap-3',
        style: { userSelect: 'none' }
    },
        icon && React.createElement('span', { className: 'text-xl' }, icon),
        React.createElement('label', {
            className: 'flex items-center gap-2 cursor-pointer group'
        },
            React.createElement('div', {
                className: `relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-300 ${
                    checked 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                        : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`,
                onClick: () => onChange(!checked),
                style: { cursor: 'pointer' }
            },
                React.createElement('span', {
                    className: `inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                        checked ? 'translate-x-5' : 'translate-x-0.5'
                    }`,
                    style: { boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }
                })
            ),
            React.createElement('span', {
                className: `text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'} group-hover:${darkMode ? 'text-white' : 'text-gray-900'} transition-colors`
            }, label)
        )
    );
};

// Componente React per il toggle Edit Mode (usa ModernToggleSwitch)
const EditModeToggle = ({ darkMode, isEditMode, onToggle }) => {
    return React.createElement(ModernToggleSwitch, {
        label: isEditMode ? 'Modalità Edit Attiva' : 'Personalizza Layout',
        checked: isEditMode,
        onChange: onToggle,
        darkMode,
        icon: isEditMode ? '✏️' : '🎨'
    });
};

// Componente Widget Wrapper con funzionalità drag & resize
const DraggableWidget = ({ widgetId, children, darkMode, isEditMode, size = 'default', order = 0 }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [showSizeMenu, setShowSizeMenu] = React.useState(false);
    
    const sizeClass = window.DashboardCustomizer.getSizeClass(size);
    
    const handleDragStart = (e) => {
        if (!isEditMode) return;
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('widgetId', widgetId);
    };
    
    const handleDragEnd = () => {
        setIsDragging(false);
    };
    
    const handleDragOver = (e) => {
        if (!isEditMode) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    
    const handleDrop = (e) => {
        if (!isEditMode) return;
        e.preventDefault();
        
        const sourceId = e.dataTransfer.getData('widgetId');
        const targetId = widgetId;
        
        if (sourceId === targetId) return;
        
        // Scambia ordini
        const sourceOrder = window.DashboardCustomizer.getWidgetOrder(sourceId);
        const targetOrder = window.DashboardCustomizer.getWidgetOrder(targetId);
        
        window.DashboardCustomizer.setWidgetOrder(sourceId, targetOrder);
        window.DashboardCustomizer.setWidgetOrder(targetId, sourceOrder);
        
        // Ricarica per applicare modifiche
        window.location.reload();
    };
    
    const changeSizeHandler = (newSize) => {
        window.DashboardCustomizer.setWidgetSize(widgetId, newSize);
        setShowSizeMenu(false);
        window.location.reload();
    };
    
    return React.createElement('div', {
        draggable: isEditMode,
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
        onDragOver: handleDragOver,
        onDrop: handleDrop,
        className: `widget-container ${sizeClass} ${isDragging ? 'dragging' : ''} ${isEditMode ? 'edit-mode' : ''}`,
        style: {
            order,
            position: 'relative',
            opacity: isDragging ? 0.5 : 1,
            cursor: isEditMode ? 'move' : 'default',
            transition: isDragging ? 'none' : 'all 0.3s ease'
        }
    },
        children,
        
        // Controls (solo in edit mode)
        isEditMode && React.createElement('div', {
            className: 'widget-controls',
            style: {
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: '4px',
                zIndex: 100
            }
        },
            // Resize button
            React.createElement('button', {
                onClick: () => setShowSizeMenu(!showSizeMenu),
                className: `px-2 py-1 rounded text-xs font-bold ${darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'}`,
                title: t.resizeWidget || 'Ridimensiona widget'
            }, '↔️'),
            
            // Hide button
            React.createElement('button', {
                onClick: () => {
                    window.DashboardCustomizer.toggleWidgetVisibility(widgetId);
                    window.location.reload();
                },
                className: `px-2 py-1 rounded text-xs font-bold ${darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`,
                title: t.hideWidget || 'Nascondi widget'
            }, '🚫'),
            
            // Size menu
            showSizeMenu && React.createElement('div', {
                className: `absolute top-8 right-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-2 flex flex-col gap-1`,
                style: { minWidth: 120 }
            },
                ['small', 'medium', 'default', 'large', 'full'].map(s =>
                    React.createElement('button', {
                        key: s,
                        onClick: () => changeSizeHandler(s),
                        className: `px-3 py-1.5 rounded text-left text-xs ${
                            s === size 
                                ? darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'
                                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`
                    }, 
                        s === 'small' ? '▪️ Piccolo' :
                        s === 'medium' ? '▪️▪️ Medio' :
                        s === 'default' ? '▪️▪️▪️ Standard' :
                        s === 'large' ? '▪️▪️▪️▪️ Grande' :
                        '▪️▪️▪️▪️▪️ Intera Riga'
                    )
                )
            )
        )
    );
};

window.ModernToggleSwitch = ModernToggleSwitch;
window.EditModeToggle = EditModeToggle;
window.DraggableWidget = DraggableWidget;
}
