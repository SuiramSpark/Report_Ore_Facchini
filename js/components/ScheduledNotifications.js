// ScheduledNotifications Component - Sistema Notifiche Programmate con Messaggi Personalizzati
const ScheduledNotifications = ({ db, darkMode, language = 'it' }) => {
    const [notifications, setNotifications] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [newNotification, setNewNotification] = React.useState({
        time: '17:00',
        message: '',
        enabled: true,
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });
    const [editingId, setEditingId] = React.useState(null);
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
        'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 
        'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

    const daysOfWeek = [
        { key: 'monday', label: t.weekday_short_monday || 'Lun' },
        { key: 'tuesday', label: t.weekday_short_tuesday || 'Mar' },
        { key: 'wednesday', label: t.weekday_short_wednesday || 'Mer' },
        { key: 'thursday', label: t.weekday_short_thursday || 'Gio' },
        { key: 'friday', label: t.weekday_short_friday || 'Ven' },
        { key: 'saturday', label: t.weekday_short_saturday || 'Sab' },
        { key: 'sunday', label: t.weekday_short_sunday || 'Dom' }
    ];

    // Load notifications from Firestore
    React.useEffect(() => {
        if (!db) return;

        const unsubscribe = db.collection('scheduledNotifications')
            .orderBy('time', 'asc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setNotifications(data);
                // Auto-link heuristic: for notifications without sheetId, attempt to find a candidate timesheet
                (async () => {
                    try {
                        const missing = data.filter(n => !n.sheetId);
                        if (!missing.length) return;

                        console.log(`🔗 Auto-link: found ${missing.length} notifications without sheetId, attempting to link...`);

                        // Fetch recent timesheets (limit 10) and pick first non-completed, non-archived; otherwise first
                        const tsSnap = await db.collection('timesheets').orderBy('createdAt', 'desc').limit(10).get();
                        const candidates = tsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                        for (const notif of missing) {
                            // Skip if it was linked meanwhile
                            const ref = db.collection('scheduledNotifications').doc(notif.id);
                            const fresh = (await ref.get()).data() || {};
                            if (fresh.sheetId) continue;

                            let candidate = candidates.find(c => c.status !== 'completed' && !c.archived) || candidates[0];
                            if (!candidate) {
                                console.log('🔗 Auto-link: no candidate timesheets found');
                                break;
                            }

                            try {
                                await ref.set({ sheetId: candidate.id }, { merge: true });
                                console.log(`🔗 Auto-linked notification ${notif.id} -> sheet ${candidate.id}`);
                                try { showToast(`🔗 ${t.autoLinkedNotification?.replace('{id}', candidate.id) || `Notifica collegata a foglio ${candidate.id}`}`, 'info'); } catch (e) { }
                            } catch (err) {
                                console.error('🔗 Auto-link error updating notification:', err);
                            }
                        }
                    } catch (err) {
                        console.error('Error during auto-link heuristic:', err);
                    }
                })();
                setLoading(false);
            });

        return () => unsubscribe();
    }, [db]);

    // Check and send notifications every minute
    React.useEffect(() => {
        if (notificationPermission !== 'granted') return;

        const interval = setInterval(() => {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];

            notifications.forEach(notification => {
                if (
                    notification.enabled &&
                    notification.time === currentTime &&
                    notification.days.includes(currentDay)
                ) {
                    sendScheduledNotification(notification);
                }
            });
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [notifications, notificationPermission]);

    // Send scheduled notification
    const sendScheduledNotification = async (notification) => {
        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification('📋 Report Ore Facchini', {
                    body: notification.message,
                    icon: '/Report_Ore_Facchini/icons/icon-192x192.png',
                    badge: '/Report_Ore_Facchini/icons/icon-192x192.png',
                    vibrate: [200, 100, 200],
                    tag: `scheduled-${notification.id}`,
                    requireInteraction: true,
                    silent: false
                });
            } else {
                new Notification('📋 Report Ore Facchini', {
                    body: notification.message,
                    icon: '/Report_Ore_Facchini/icons/icon-192x192.png',
                    badge: '/Report_Ore_Facchini/icons/icon-192x192.png'
                });
            }

            console.log('✅ Scheduled notification sent:', notification.message);
        } catch (error) {
            console.error('❌ Error sending scheduled notification:', error);
        }
    };

    // Request notification permission
    const requestPermission = async () => {
        if (typeof Notification === 'undefined') {
            showToast(`❌ ${t.notificationsNotSupported || 'Notifiche non supportate su questo browser'}`, 'error');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                showToast(`✅ ${t.notificationsAuthorized || 'Notifiche autorizzate!'}`, 'success');
            } else {
                showToast(`⚠️ ${t.notificationsBlocked || 'Notifiche bloccate'}`, 'warning');
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
            showToast(`❌ ${t.errorRequestingPermissions || 'Errore richiesta permessi'}`, 'error');
        }
    };

    // Add new notification
    const addNotification = async () => {
        if (!db) return;
        if (!newNotification.message.trim()) {
            showToast(`❌ ${t.insertMessage || 'Inserisci un messaggio'}`, 'error');
            return;
        }

        try {
            await db.collection('scheduledNotifications').add({
                ...newNotification,
                createdAt: new Date().toISOString()
            });

            setNewNotification({
                time: '17:00',
                message: '',
                enabled: true,
                days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            });

            showToast(`✅ ${t.notificationAdded || 'Notifica aggiunta!'}`, 'success');
        } catch (error) {
            console.error('Error adding notification:', error);
            showToast(`❌ ${t.errorAddingNotification || 'Errore durante l\'aggiunta'}`, 'error');
        }
    };

    // Update notification
    const updateNotification = async (id, updates) => {
        if (!db) return;

        try {
            await db.collection('scheduledNotifications').doc(id).update(updates);
            setEditingId(null);
            showToast(`✅ ${t.notificationUpdated || 'Notifica aggiornata!'}`, 'success');
        } catch (error) {
            console.error('Error updating notification:', error);
            showToast(`❌ ${t.errorUpdatingNotification || 'Errore durante l\'aggiornamento'}`, 'error');
        }
    };

    // Delete notification
    const deleteNotification = async (id) => {
        if (!db) return;
        if (!confirm('Confermare l\'eliminazione?')) return;

        try {
            await db.collection('scheduledNotifications').doc(id).delete();
            showToast(`✅ ${t.notificationDeleted || 'Notifica eliminata!'}`, 'success');
        } catch (error) {
            console.error('Error deleting notification:', error);
            showToast(`❌ ${t.errorDeletingNotification || 'Errore durante l\'eliminazione'}`, 'error');
        }
    };

    // Toggle notification enabled
    const toggleEnabled = async (id, currentEnabled) => {
        await updateNotification(id, { enabled: !currentEnabled });
    };

    // Test notification immediately
    const testNotification = (notification) => {
        if (notificationPermission !== 'granted') {
            showToast(`❌ ${t.authorizeFirst || 'Autorizza prima le notifiche'}`, 'error');
            return;
        }

        sendScheduledNotification(notification);
    showToast(`✅ ${t.testNotificationSent || 'Test notifica inviato!'}`, 'success');
    };

    // Toggle day selection
    const toggleDay = (day) => {
        setNewNotification(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
    };

    // Example messages
    const exampleMessages = [
        '👷 Ciao! Ricorda di controllare i lavoratori e le loro ore',
        '📋 È ora di rivedere i fogli ore del giorno',
        '⏰ Promemoria: Verifica le presenze di oggi',
        '✅ Controlla se ci sono fogli da completare',
        '🎯 Momento perfetto per un controllo rapido!',
        '💼 Ricordati di firmare i fogli completati',
        '🌟 Mario, sei bellissimo! ❤️ Controlla i fogli'
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* External title for Scheduled Notifications */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ⏰ {t.scheduledNotifications || 'Scheduled Notifications'}
                </h3>
            </div>
            {/* Header */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">⏰</span>
                    <div>
                        <h2 className="text-2xl font-bold">
                            {t.scheduledNotifications}
                        </h2>
                        <p className={textClass}>
                            {t.scheduledNotificationsDescription}
                        </p>
                    </div>
                </div>

                {/* Permission Status */}
                {notificationPermission !== 'granted' && (
                    <div className={`p-4 rounded-lg mb-4 ${
                        darkMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div className="flex-1">
                                <p className={`font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                    {t.authorizeNotifications}
                                </p>
                            </div>
                            <button
                                onClick={requestPermission}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                🔔 {t.requestPermission}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add New Notification */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>➕</span>
                    {t.newNotificationTitle}
                </h3>

                <div className="space-y-4">
                    {/* Time Input */}
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${textClass}`}>
                            ⏰ {t.timeLabel}
                        </label>
                        <input
                            type="time"
                            value={newNotification.time}
                            onChange={(e) => setNewNotification({ ...newNotification, time: e.target.value })}
                            className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                            style={darkMode ? { colorScheme: 'dark' } : {}}
                        />
                    </div>

                    {/* Message Input */}
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${textClass}`}>
                            💬 {t.customMessageLabel}
                        </label>
                        <textarea
                            value={newNotification.message}
                            onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                            placeholder={t.notificationPlaceholder || 'Es: Ciao Mario! ❤️ Ricorda di controllare i fogli ore 📋'}
                            className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                            rows="3"
                        />
                    </div>

                    {/* Example Messages */}
                    <div>
                        <p className={`text-sm font-semibold mb-2 ${textClass}`}>
                            💡 {t.exampleMessagesLabel}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {exampleMessages.map((msg, i) => (
                                <button
                                    key={i}
                                    onClick={() => setNewNotification({ ...newNotification, message: msg })}
                                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                        darkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {msg.substring(0, 30)}...
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Days Selection */}
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${textClass}`}>
                            📅 {t.daysOfWeekLabel}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map(day => (
                                <button
                                    key={day.key}
                                    onClick={() => toggleDay(day.key)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                        newNotification.days.includes(day.key)
                                            ? 'bg-indigo-600 text-white'
                                            : darkMode
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={addNotification}
                        disabled={!newNotification.message.trim()}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:bg-gray-400"
                    >
                        ➕ {t.addNotification}
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>📋</span>
                    {`${t.activeNotifications} (${notifications.length})`}
                </h3>

                {notifications.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-4xl mb-3">⏰</p>
                        <p className={textClass}>
                                {t.noScheduledNotifications}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => {
                                    if (notification.sheetId) {
                                        try {
                                            console.log('⤴️ Dispatching openSheet for', notification.sheetId, 'notifId:', notification.id);
                                            window.dispatchEvent(new CustomEvent('openSheet', { detail: { sheetId: notification.sheetId } }));
                                        } catch (e) { console.error('Error dispatching openSheet event', e); }
                                    } else {
                                        console.log('Clicked notification without sheetId', notification.id);
                                    }
                                }}
                                role={notification.sheetId ? 'button' : undefined}
                                title={notification.sheetId ? t.openSheetTitle?.replace('{id}', notification.sheetId) : undefined}
                                className={`p-4 rounded-lg border-l-4 cursor-pointer ${
                                    notification.enabled
                                        ? 'border-green-500'
                                        : 'border-gray-500'
                                } ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Time and Status */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {notification.time}
                                            </span>
                                            {notification.sheetId && (
                                                <span className="ml-2 text-sm" title={t.openSheetTitle?.replace('{id}', notification.sheetId)} aria-hidden>
                                                    🔗
                                                </span>
                                            )}
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                notification.enabled
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-500 text-white'
                                            }`}>
                                                {notification.enabled ? (t.enabled || '✓ Attiva') : (t.disabled || '✗ Disattivata')}
                                            </span>
                                        </div>

                                        {/* Message */}
                                        <p className={`mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {notification.message}
                                        </p>

                                        {/* Days */}
                                        <div className="flex flex-wrap gap-1">
                                            {daysOfWeek.map(day => (
                                                <span
                                                    key={day.key}
                                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                                        notification.days.includes(day.key)
                                                            ? darkMode
                                                                ? 'bg-indigo-800 text-indigo-200'
                                                                : 'bg-indigo-100 text-indigo-700'
                                                            : darkMode
                                                            ? 'bg-gray-800 text-gray-500'
                                                            : 'bg-gray-200 text-gray-400'
                                                    }`}
                                                >
                                                    {day.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => toggleEnabled(notification.id, notification.enabled)}
                                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                                notification.enabled
                                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                        >
                                            {notification.enabled ? '⏸️' : '▶️'}
                                        </button>
                                        <button
                                            onClick={() => testNotification(notification)}
                                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                            title="Test notifica"
                                        >
                                            🧪
                                        </button>
                                        <button
                                            onClick={() => deleteNotification(notification.id)}
                                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <span>💡</span>
                    {t.infoTitle}
                </h3>
                <ul className={`space-y-2 text-sm ${textClass}`}>
                    <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>{t.info_tab_open}</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>{t.info_use_emoji}</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>{t.info_disabled_saved}</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
