// Settings Component - v4.2 CON EXPORT EXCEL + CHANGELOG + NOTIFICHE + LOGO + NOTIFICHE PROGRAMMATE
const Settings = ({ db, sheets = [], darkMode, language = 'it', companyLogo, setCompanyLogo, autoArchiveDay = 5, setAutoArchiveDay }) => {
    // GDPR Privacy Notice state
    const [gdprText, setGdprText] = React.useState('');
    const [editingGdpr, setEditingGdpr] = React.useState(false);
    const [loadingGdpr, setLoadingGdpr] = React.useState(true);

    // Load GDPR text from Firestore
    React.useEffect(() => {
        if (!db) return;
        const loadGdpr = async () => {
            try {
                const doc = await db.collection('settings').doc('privacyGDPR').get();
                if (doc.exists) setGdprText(doc.data().text || '');
            } catch (e) { console.error('Error loading GDPR text:', e); }
            setLoadingGdpr(false);
        };
        loadGdpr();
    }, [db]);

    // Save GDPR text to Firestore
    const saveGdprText = async () => {
        if (!db) return;
        setLoadingGdpr(true);
        try {
            await db.collection('settings').doc('privacyGDPR').set({ text: gdprText, updatedAt: new Date().toISOString() }, { merge: true });
            showToast('✅ Privacy aggiornata', 'success');
            setEditingGdpr(false);
        } catch (e) {
            showToast('❌ Errore salvataggio privacy', 'error');
        }
        setLoadingGdpr(false);
    };
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [showChangelog, setShowChangelog] = React.useState(false);
    const [settings, setSettings] = React.useState({
        expirationDays: 1, // Default 24h
        notifications: {
            enabled: false,
            newWorker: true,
            sheetCompleted: true,
            reminders: false
        }
    });
    // weekStart: 0=Sunday,1=Monday,...6=Saturday. Default to Monday
    const [weekStart, setWeekStart] = React.useState(1);
    const [customDays, setCustomDays] = React.useState('');
    const [notificationPermission, setNotificationPermission] = React.useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'denied'
    );
    
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

    // 📋 CHANGELOG DATA - Multilingua dal file changelogs.js
    const changelog = changelogs[language] || changelogs.it;

    // Predefined expiration options (in days)
    const expirationOptions = [
        { value: 0, label: t.never, hours: 0 },
        { value: 0.333, label: '8h', hours: 8 },
        { value: 1, label: '24h', hours: 24 },
        { value: 2, label: '48h', hours: 48 },
        { value: 3, label: '72h', hours: 72 },
        { value: 6, label: '144h (6 ' + t.days + ')', hours: 144 }
    ];

    // Load settings from Firestore
    React.useEffect(() => {
        if (!db) return;
        
        const loadSettings = async () => {
            try {
                const doc = await db.collection('settings').doc('linkExpiration').get();
                
                if (doc.exists) {
                    const data = doc.data();
                    // 🔧 FIX: Use nullish coalescing to preserve 0 value (Never)
                    setSettings({
                        expirationDays: data.expirationDays ?? 1,
                        notifications: data.notifications || {
                            enabled: false,
                            newWorker: true,
                            sheetCompleted: true,
                            reminders: false
                        }
                    });
                    // load weekStart if present
                    if (typeof data.weekStart !== 'undefined' && data.weekStart !== null) {
                        setWeekStart(Number(data.weekStart));
                    }
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error loading settings:', error);
                setLoading(false);
            }
        };
        
        loadSettings();
    }, [db]);

    // Save settings to Firestore
    const saveSettings = async () => {
        if (!db) {
            showToast(`❌ ${t.dbNotConnected}`, 'error');
            return;
        }
        
        setSaving(true);
        
        try {
            // Use merge to avoid accidentally overwriting other fields stored in the same doc
            await db.collection('settings').doc('linkExpiration').set({
                expirationDays: settings.expirationDays,
                notifications: settings.notifications,
                weekStart: weekStart,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            showToast(`✅ ${t.settingsSaved}`, 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast(`❌ ${t.errorSaving}`, 'error');
        }
        
        setSaving(false);
    };

    // Handle custom days input
    const handleCustomDays = () => {
        const days = parseFloat(customDays);
        if (isNaN(days) || days < 0) {
            showToast(`❌ ${t.fillRequired}`, 'error');
            return;
        }
        
        setSettings({ ...settings, expirationDays: days });
        setCustomDays('');
    };

    // Request notification permission
    const requestNotificationPermission = async () => {
        if (typeof Notification === 'undefined') {
            showToast(`❌ ${t.notificationsBlocked}`, 'error');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            
            if (permission === 'granted') {
                showToast(`✅ ${t.notificationsGranted}`, 'success');
                setSettings({ ...settings, notifications: { ...settings.notifications, enabled: true } });
            } else {
                showToast(`⚠️ ${t.notificationsBlocked}`, 'warning');
                setSettings({ ...settings, notifications: { ...settings.notifications, enabled: false } });
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            showToast(`❌ ${t.error}`, 'error');
        }
    };

    // Test notification - 🔧 FIX: Use Service Worker for Android PWA compatibility
    const sendTestNotification = async () => {
        if (notificationPermission !== 'granted') {
            showToast(`❌ ${t.notificationsBlocked}`, 'error');
            return;
        }

        try {
            const notificationBody = language === 'it' 
                ? 'Le notifiche funzionano correttamente!' 
                : language === 'en'
                ? 'Notifications are working correctly!'
                : language === 'es'
                ? '¡Las notificaciones funcionan correctamente!'
                : language === 'fr'
                ? 'Les notifications fonctionnent correctement!'
                : 'Notificările funcționează corect!';

            // 🔧 FIX: Use Service Worker for PWA (required for Android)
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification('📋 Report Ore Facchini', {
                    body: notificationBody,
                    icon: '/Report_Ore_Facchini/icons/icon-192x192.png',
                    badge: '/Report_Ore_Facchini/icons/icon-192x192.png',
                    vibrate: [200, 100, 200], // Vibration pattern for mobile
                    tag: 'test-notification',
                    requireInteraction: false,
                    silent: false
                });
                console.log('✅ Notification sent via Service Worker');
                showToast(`✅ ${t.testNotification}`, 'success');
            } else {
                // Fallback for desktop browsers
                new Notification('📋 Report Ore Facchini', {
                    body: notificationBody,
                    icon: '/Report_Ore_Facchini/icons/icon-192x192.png',
                    badge: '/Report_Ore_Facchini/icons/icon-192x192.png'
                });
                console.log('✅ Notification sent via Notification API');
                showToast(`✅ ${t.testNotification}`, 'success');
            }
        } catch (error) {
            console.error('❌ Error sending test notification:', error);
            showToast(`❌ ${t.error}: ${error.message}`, 'error');
        }
    };

    // Toggle notification setting
    const toggleNotification = (key) => {
        setSettings({
            ...settings,
            notifications: {
                ...settings.notifications,
                [key]: !settings.notifications[key]
            }
        });
    };

    // Week start selector (UI)
    const weekOptions = [
        { value: 1, label: language === 'it' ? 'Lunedì' : language === 'en' ? 'Monday' : language === 'es' ? 'Lun' : language === 'fr' ? 'Lun' : 'Luni' },
        { value: 2, label: language === 'it' ? 'Martedì' : language === 'en' ? 'Tuesday' : language === 'es' ? 'Mar' : language === 'fr' ? 'Mar' : 'Marți' },
        { value: 3, label: language === 'it' ? 'Mercoledì' : language === 'en' ? 'Wednesday' : language === 'es' ? 'Mié' : language === 'fr' ? 'Mer' : 'Mier' },
        { value: 4, label: language === 'it' ? 'Giovedì' : language === 'en' ? 'Thursday' : language === 'es' ? 'Jue' : language === 'fr' ? 'Jeu' : 'Joi' },
        { value: 5, label: language === 'it' ? 'Venerdì' : language === 'en' ? 'Friday' : language === 'es' ? 'Vie' : language === 'fr' ? 'Ven' : 'Vin' },
        { value: 6, label: language === 'it' ? 'Sabato' : language === 'en' ? 'Saturday' : language === 'es' ? 'Sáb' : language === 'fr' ? 'Sam' : 'Sâm' },
        { value: 0, label: language === 'it' ? 'Domenica' : language === 'en' ? 'Sunday' : language === 'es' ? 'Dom' : language === 'fr' ? 'Dim' : 'Dum' }
    ];

    const handleWeekStartChange = (val) => {
        setWeekStart(Number(val));
    };

    // Get current expiration display
    const getExpirationDisplay = () => {
        if (settings.expirationDays === 0) {
            return { emoji: '♾️', text: t.never, subtext: '' };
        }
        
        const days = settings.expirationDays;
        const hours = days * 24;
        
        if (hours < 24) {
            return { 
                emoji: '⏱️', 
                text: `${hours}h`, 
                subtext: `${t.linkExpiresIn} ${hours} ${hours === 1 ? 'ora' : 'ore'}`
            };
        } else if (days === 1) {
            return { 
                emoji: '⏱️', 
                text: '24h', 
                subtext: `${t.linkExpiresIn} 24 ore`
            };
        } else if (days < 7) {
            return { 
                emoji: '📅', 
                text: `${Math.round(hours)}h`, 
                subtext: `${t.linkExpiresIn} ${days} ${days === 1 ? t.day : t.days}`
            };
        } else {
            return { 
                emoji: '📆', 
                text: `${Math.round(days)} ${t.days}`, 
                subtext: `${t.linkExpiresIn} ${Math.round(days)} ${t.days}`
            };
        }
    };

    const currentDisplay = getExpirationDisplay();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl sm:text-3xl">⚙️</span>
                    <h1 className="text-xl sm:text-2xl font-bold">{t.settings}</h1>
                </div>
                <p className={`${textClass} text-sm sm:text-base`}>
                    {t.systemSettings}
                </p>
            </div>

            {/* ⭐ NEW: Notifiche Programmate Button */}
            <button
                onClick={() => {
                    // Naviga alla vista scheduledNotifications
                    const event = new CustomEvent('changeView', { detail: 'scheduledNotifications' });
                    window.dispatchEvent(event);
                }}
                className={`w-full py-4 ${darkMode ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'} text-white rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3`}
            >
                <span className="text-2xl">⏰</span>
                {language === 'it' ? 'Notifiche Programmate' :
                 language === 'en' ? 'Scheduled Notifications' :
                 language === 'es' ? 'Notificaciones Programadas' :
                 language === 'fr' ? 'Notifications Programmées' :
                 'Notificări Programate'}
            </button>

            {/* ⭐ Export Section */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                    📥 {t.exportData || 'Esportazione Dati'}
                </h2>
                
                <p className={`${textClass} text-sm mb-4`}>
                    { (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t('exportDataDescription') : 'Esporta tutti i fogli ore in formato CSV o Excel' }
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* CSV Export */}
                    <button
                        onClick={() => {
                            if (sheets.length === 0) {
                                showToast('❌ Nessun foglio da esportare', 'error');
                                return;
                            }
                            const filename = `registro_ore_${new Date().toISOString().split('T')[0]}.csv`;
                            exportToCSV(sheets, filename);
                        }}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <span>📄</span>
                        <span>{t.exportCSV || 'Esporta CSV'}</span>
                    </button>

                    {/* ⭐ Excel Export */}
                    <button
                        onClick={() => {
                            if (sheets.length === 0) {
                                showToast('❌ Nessun foglio da esportare', 'error');
                                return;
                            }
                            const filename = `registro_ore_${new Date().toISOString().split('T')[0]}.xlsx`;
                            exportToExcel(sheets, filename);
                        }}
                        className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <span>📊</span>
                        <span>{t.exportExcel || 'Esporta Excel'}</span>
                    </button>
                </div>

                {/* Export Info */}
                <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-sm ${textClass}`}>
                        <p className="flex items-start gap-2">
                        <span>💡</span>
                        <span>
                            { (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t('sheetsAvailable', { count: sheets.length }) : `${sheets.length} fogli disponibili per l'esportazione` }
                        </span>
                    </p>
                </div>
            </div>

            {/* ⭐ Company Logo Section */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                    🖼️ {t.companyLogo}
                </h2>

                <div className="space-y-4">
                    {/* Logo Preview */}
                    {companyLogo && (
                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className={`text-sm font-semibold mb-3 ${textClass}`}>
                                {t.logoPreview}
                            </p>
                            <div className="flex items-center justify-center">
                                <img 
                                    src={companyLogo} 
                                    alt="Company Logo" 
                                    className="max-h-32 max-w-full object-contain rounded-lg shadow-lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Upload/Remove Buttons */}
                    <div className="flex gap-3">
                        <label className="flex-1 cursor-pointer">
                            <div className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-center flex items-center justify-center gap-2">
                                <span>📤</span>
                                <span>{t.uploadLogo}</span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const logoData = event.target.result;
                                            setCompanyLogo(logoData);
                                            localStorage.setItem('companyLogo', logoData);
                                            showToast(`✅ ${t.logoUploaded}`, 'success');
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </label>

                        {companyLogo && (
                            <button
                                onClick={() => {
                                    if (confirm(`${t.confirmDelete} ${t.companyLogo}?`)) {
                                        setCompanyLogo(null);
                                        localStorage.removeItem('companyLogo');
                                        showToast(`✅ ${t.removeLogo}`, 'success');
                                    }
                                }}
                                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                            >
                                <span>🗑️</span>
                                <span className="hidden sm:inline">{t.removeLogo}</span>
                            </button>
                        )}
                    </div>

                    {/* Info */}
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} text-sm ${textClass}`}>
                        <p className="flex items-start gap-2">
                            <span>💡</span>
                                <span>
                                { (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t('logoInfo') : 'Il logo apparirà sui PDF generati ma non nell\'interfaccia' }
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Link Expiration Settings */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                    🔗 {t.linkExpiration}
                </h2>

                {/* Predefined Options */}
                <div className="mb-6">
                    <label className={`block text-sm font-semibold mb-3 ${textClass}`}>
                        {t.expirationTime}
                    </label>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {expirationOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setSettings({ ...settings, expirationDays: option.value })}
                                className={`px-4 py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                                    settings.expirationDays === option.value
                                        ? 'bg-indigo-600 text-white'
                                        : darkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Days Input */}
                <div className="mb-6">
                    <label className={`block text-sm font-semibold mb-3 ${textClass}`}>
                        {t.expirationTime} ({t.days})
                    </label>
                    
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Es: 7"
                            value={customDays}
                            onChange={(e) => setCustomDays(e.target.value)}
                            className={`flex-1 px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                            min="0"
                            step="0.5"
                        />
                        <button
                            onClick={handleCustomDays}
                            disabled={!customDays}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 text-sm sm:text-base"
                        >
                            ✓
                        </button>
                    </div>
                </div>

                {/* Current Setting Preview */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'} mb-6`}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{currentDisplay.emoji}</span>
                        <div>
                            <p className={`font-bold text-lg ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                {currentDisplay.text}
                            </p>
                            <p className={`text-sm ${textClass}`}>
                                {currentDisplay.subtext || t.linkExpiresIn + ' ' + currentDisplay.text}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                {/* Week start selector - saved in the same settings doc */}
                <div className="mb-4">
                    <label className={`block text-sm font-semibold mb-2 ${textClass}`}>{t.weekStartLabel || 'Inizio settimana'}</label>
                    <div className="flex items-center gap-3">
                        <select value={weekStart} onChange={(e) => handleWeekStartChange(e.target.value)} className={`px-3 py-2 rounded border ${inputClass}`}>
                            {weekOptions.map(opt => (
                                React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
                            ))}
                        </select>
                        <div className={`text-sm ${textClass}`}>
                            { (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t('weekStartDescription') : 'Scegli il giorno con cui iniziare la settimana nel grafico settimanale' }
                        </div>
                    </div>
                </div>

                {/* Auto-archive day selector */}
                <div className="mb-4">
                    <label className={`block text-sm font-semibold mb-2 ${textClass}`}>
                        📦 {t.autoArchiveLabel || 'Giorno auto-archiviazione'}
                    </label>
                    <div className="flex items-center gap-3">
                        <select 
                            value={autoArchiveDay} 
                            onChange={(e) => {
                                const day = parseInt(e.target.value);
                                setAutoArchiveDay(day);
                                localStorage.setItem('autoArchiveDay', day);
                                showToast('✅ Giorno auto-archiviazione aggiornato', 'success');
                            }} 
                            className={`px-3 py-2 rounded border ${inputClass}`}
                        >
                            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28].map(day => (
                                React.createElement('option', { key: day, value: day }, day)
                            ))}
                        </select>
                        <div className={`text-sm ${textClass}`}>
                            {t.autoArchiveDescription || 'Giorno del mese in cui archiviare automaticamente i fogli completati del mese precedente'}
                        </div>
                    </div>
                </div>

                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="w-full py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-base sm:text-lg transition-colors disabled:bg-gray-400 shadow-lg"
                >
                    {saving ? `⏳ ${t.loading}...` : `💾 ${t.saveSettings}`}
                </button>
            </div>

            {/* Notification Settings */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                    🔔 {t.notificationSettings}
                </h2>

                {/* Permission Status */}
                <div className={`p-4 rounded-lg mb-6 ${
                    notificationPermission === 'granted' 
                        ? darkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'
                        : darkMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">
                            {notificationPermission === 'granted' ? '✅' : '⚠️'}
                        </span>
                        <div>
                            <p className={`font-semibold ${
                                notificationPermission === 'granted'
                                    ? darkMode ? 'text-green-300' : 'text-green-700'
                                    : darkMode ? 'text-yellow-300' : 'text-yellow-700'
                            }`}>
                                {notificationPermission === 'granted' 
                                    ? t.notificationsGranted
                                    : notificationPermission === 'denied'
                                    ? t.notificationsBlocked
                                    : t.requestPermission
                                }
                            </p>
                            {notificationPermission !== 'granted' && (
                                <button
                                    onClick={requestNotificationPermission}
                                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                                >
                                    🔔 {t.requestPermission}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Master Toggle */}
                <div className="mb-4">
                    <label className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔔</span>
                            <div>
                                <p className={`font-semibold ${textClass}`}>
                                    {t.enableNotifications}
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={settings.notifications.enabled}
                                onChange={() => toggleNotification('enabled')}
                                disabled={notificationPermission !== 'granted'}
                                className="sr-only peer"
                            />
                            <div className={`w-14 h-7 rounded-full transition-colors ${
                                settings.notifications.enabled 
                                    ? 'bg-green-600' 
                                    : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                            } ${notificationPermission !== 'granted' ? 'opacity-50' : ''}`}>
                            </div>
                            <div className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                settings.notifications.enabled ? 'translate-x-7' : ''
                            }`}>
                            </div>
                        </div>
                    </label>
                </div>

                {/* Individual Notification Types */}
                <div className={`space-y-3 mb-6 ${!settings.notifications.enabled || notificationPermission !== 'granted' ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* New Worker */}
                    <label className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">👤</span>
                            <div>
                                <p className={`font-semibold text-sm ${textClass}`}>
                                    {t.notifyNewWorker}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t.notifyNewWorkerDesc}
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={settings.notifications.newWorker}
                                onChange={() => toggleNotification('newWorker')}
                                className="sr-only peer"
                            />
                            <div className={`w-12 h-6 rounded-full transition-colors ${
                                settings.notifications.newWorker 
                                    ? 'bg-blue-600' 
                                    : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                            }`}>
                            </div>
                            <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                settings.notifications.newWorker ? 'translate-x-6' : ''
                            }`}>
                            </div>
                        </div>
                    </label>

                    {/* Sheet Completed */}
                    <label className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📋</span>
                            <div>
                                <p className={`font-semibold text-sm ${textClass}`}>
                                    {t.notifySheetCompleted}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t.notifySheetCompletedDesc}
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={settings.notifications.sheetCompleted}
                                onChange={() => toggleNotification('sheetCompleted')}
                                className="sr-only peer"
                            />
                            <div className={`w-12 h-6 rounded-full transition-colors ${
                                settings.notifications.sheetCompleted 
                                    ? 'bg-blue-600' 
                                    : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                            }`}>
                            </div>
                            <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                settings.notifications.sheetCompleted ? 'translate-x-6' : ''
                            }`}>
                            </div>
                        </div>
                    </label>

                    {/* Reminders */}
                    <label className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">⏰</span>
                            <div>
                                <p className={`font-semibold text-sm ${textClass}`}>
                                    {t.notifyReminders}
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t.notifyRemindersDesc}
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={settings.notifications.reminders}
                                onChange={() => toggleNotification('reminders')}
                                className="sr-only peer"
                            />
                            <div className={`w-12 h-6 rounded-full transition-colors ${
                                settings.notifications.reminders 
                                    ? 'bg-blue-600' 
                                    : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                            }`}>
                            </div>
                            <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                settings.notifications.reminders ? 'translate-x-6' : ''
                            }`}>
                            </div>
                        </div>
                    </label>
                </div>

                {/* Test Notification Button */}
                {notificationPermission === 'granted' && settings.notifications.enabled && (
                    <button
                        onClick={sendTestNotification}
                        className={`w-full py-3 mb-4 rounded-lg font-semibold transition-colors ${
                            darkMode 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300'
                        }`}
                    >
                        🧪 {t.testNotification}
                    </button>
                )}

                {/* Save Button */}
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="w-full py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-base sm:text-lg transition-colors disabled:bg-gray-400 shadow-lg"
                >
                    {saving ? `⏳ ${t.loading}...` : `💾 ${t.saveSettings}`}
                </button>
            </div>

            {/* GDPR Privacy Section */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 mb-6`}>
                <h2 className="text-xl font-bold mb-2">🔒 Privacy GDPR</h2>
                {loadingGdpr ? (
                    <div className="text-gray-500">Caricamento...</div>
                ) : editingGdpr ? (
                    <>
                        <textarea
                            className={`w-full min-h-[120px] p-2 rounded border mt-2 mb-2 ${inputClass}`}
                            value={gdprText}
                            onChange={e => setGdprText(e.target.value)}
                            placeholder="Inserisci qui il testo della privacy GDPR..."
                        />
                        <div className="flex gap-2">
                            <button onClick={saveGdprText} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold">Salva</button>
                            <button onClick={() => setEditingGdpr(false)} className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded font-semibold">Annulla</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={`whitespace-pre-line p-2 rounded ${textClass} bg-gray-50 dark:bg-gray-900 mb-2`} style={{minHeight:'80px'}}>
                            {gdprText || <span className="italic text-gray-400">Nessun testo privacy inserito</span>}
                        </div>
                        <button onClick={() => setEditingGdpr(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">Modifica</button>
                    </>
                )}
            </div>

            {/* 📋 CHANGELOG BUTTON */}
            <button
                onClick={() => setShowChangelog(!showChangelog)}
                className={`w-full py-4 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-xl font-bold text-base sm:text-lg transition-colors shadow-lg flex items-center justify-center gap-3`}
            >
                <span className="text-2xl">📋</span>
                {showChangelog ? `▼ ${t.hideChangelog}` : `▶ ${t.showChangelog}`}
            </button>

            {/* 📋 CHANGELOG SECTION */}
            {showChangelog && (
                <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6 space-y-4`}>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">📋</span>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold">Changelog</h2>
                            <p className={`text-sm ${textClass}`}>
                                {language === 'it' && 'Storico versioni e aggiornamenti'}
                                {language === 'en' && 'Version history and updates'}
                                {language === 'es' && 'Historial de versiones y actualizaciones'}
                                {language === 'fr' && 'Historique des versions et mises à jour'}
                                {language === 'ro' && 'Istoricul versiunilor și actualizări'}
                            </p>
                        </div>
                    </div>

                    {changelog.map((version, vIndex) => (
                        <div 
                            key={vIndex}
                            className={`p-4 rounded-lg border-l-4 ${
                                vIndex === 0 
                                    ? `border-green-500 ${darkMode ? 'bg-green-900/20 text-gray-200' : 'bg-green-50 text-gray-900'}` 
                                    : `border-indigo-500 ${darkMode ? 'bg-indigo-900/20 text-gray-200' : 'bg-indigo-50 text-gray-900'}`
                            } animate-fade-in`}
                            style={{ animationDelay: `${vIndex * 100}ms` }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                    {vIndex === 0 && <span className="text-xl">🆕</span>}
                                    {version.version}
                                </h3>
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {new Date(version.date).toLocaleDateString(language === 'it' ? 'it-IT' : language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'ro-RO')}
                                </span>
                            </div>
                            
                            <ul className="space-y-2">
                                {version.changes.map((change, cIndex) => (
                                    <li key={cIndex} className={`text-sm flex items-start gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <span className="flex-shrink-0 mt-0.5">•</span>
                                        <span>{change}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Footer info */}
                    <div className={`text-center pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`text-sm ${textClass}`}>
                            {language === 'it' && '💡 Sviluppato con ❤️ per semplificare la gestione delle ore lavorative'}
                            {language === 'en' && '💡 Developed with ❤️ to simplify work hours management'}
                            {language === 'es' && '💡 Desarrollado con ❤️ para simplificar la gestión de horas laborales'}
                            {language === 'fr' && '💡 Développé avec ❤️ pour simplifier la gestion des heures de travail'}
                            {language === 'ro' && '💡 Dezvoltat cu ❤️ pentru a simplifica gestionarea orelor de lucru'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
// Expose globally for in-page usage
window.Settings = Settings;
