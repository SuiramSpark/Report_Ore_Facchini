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

    const t = translations[language];
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 
        'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

    const daysOfWeek = [
        { key: 'monday', label: language === 'it' ? 'Lun' : language === 'en' ? 'Mon' : language === 'es' ? 'Lun' : language === 'fr' ? 'Lun' : 'Lun' },
        { key: 'tuesday', label: language === 'it' ? 'Mar' : language === 'en' ? 'Tue' : language === 'es' ? 'Mar' : language === 'fr' ? 'Mar' : 'Mar' },
        { key: 'wednesday', label: language === 'it' ? 'Mer' : language === 'en' ? 'Wed' : language === 'es' ? 'Mié' : language === 'fr' ? 'Mer' : 'Mie' },
        { key: 'thursday', label: language === 'it' ? 'Gio' : language === 'en' ? 'Thu' : language === 'es' ? 'Jue' : language === 'fr' ? 'Jeu' : 'Joi' },
        { key: 'friday', label: language === 'it' ? 'Ven' : language === 'en' ? 'Fri' : language === 'es' ? 'Vie' : language === 'fr' ? 'Ven' : 'Vin' },
        { key: 'saturday', label: language === 'it' ? 'Sab' : language === 'en' ? 'Sat' : language === 'es' ? 'Sáb' : language === 'fr' ? 'Sam' : 'Sâm' },
        { key: 'sunday', label: language === 'it' ? 'Dom' : language === 'en' ? 'Sun' : language === 'es' ? 'Dom' : language === 'fr' ? 'Dim' : 'Dum' }
    ];

    // Load notifications from Firestore
    React.useEffect(() => {
        if (!db) return;

        const unsubscribe = db.collection('scheduledNotifications')
            .orderBy('time', 'asc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setNotifications(data);
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
            showToast('❌ Notifiche non supportate su questo browser', 'error');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                showToast('✅ Notifiche autorizzate!', 'success');
            } else {
                showToast('⚠️ Notifiche bloccate', 'warning');
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
            showToast('❌ Errore richiesta permessi', 'error');
        }
    };

    // Add new notification
    const addNotification = async () => {
        if (!db) return;
        if (!newNotification.message.trim()) {
            showToast('❌ Inserisci un messaggio', 'error');
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

            showToast('✅ Notifica aggiunta!', 'success');
        } catch (error) {
            console.error('Error adding notification:', error);
            showToast('❌ Errore durante l\'aggiunta', 'error');
        }
    };

    // Update notification
    const updateNotification = async (id, updates) => {
        if (!db) return;

        try {
            await db.collection('scheduledNotifications').doc(id).update(updates);
            setEditingId(null);
            showToast('✅ Notifica aggiornata!', 'success');
        } catch (error) {
            console.error('Error updating notification:', error);
            showToast('❌ Errore durante l\'aggiornamento', 'error');
        }
    };

    // Delete notification
    const deleteNotification = async (id) => {
        if (!db) return;
        if (!confirm('Confermare l\'eliminazione?')) return;

        try {
            await db.collection('scheduledNotifications').doc(id).delete();
            showToast('✅ Notifica eliminata!', 'success');
        } catch (error) {
            console.error('Error deleting notification:', error);
            showToast('❌ Errore durante l\'eliminazione', 'error');
        }
    };

    // Toggle notification enabled
    const toggleEnabled = async (id, currentEnabled) => {
        await updateNotification(id, { enabled: !currentEnabled });
    };

    // Test notification immediately
    const testNotification = (notification) => {
        if (notificationPermission !== 'granted') {
            showToast('❌ Autorizza prima le notifiche', 'error');
            return;
        }

        sendScheduledNotification(notification);
        showToast('✅ Test notifica inviato!', 'success');
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
            {/* Header */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">⏰</span>
                    <div>
                        <h2 className="text-2xl font-bold">
                            {language === 'it' ? 'Notifiche Programmate' :
                             language === 'en' ? 'Scheduled Notifications' :
                             language === 'es' ? 'Notificaciones Programadas' :
                             language === 'fr' ? 'Notifications Programmées' :
                             'Notificări Programate'}
                        </h2>
                        <p className={textClass}>
                            {language === 'it' ? 'Ricevi notifiche automatiche agli orari che preferisci' :
                             language === 'en' ? 'Receive automatic notifications at your preferred times' :
                             language === 'es' ? 'Recibe notificaciones automáticas en tus horarios preferidos' :
                             language === 'fr' ? 'Recevez des notifications automatiques aux heures de votre choix' :
                             'Primește notificări automate la orele preferate'}
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
                                    {language === 'it' ? 'Autorizza le notifiche per usare questa funzione' :
                                     language === 'en' ? 'Authorize notifications to use this feature' :
                                     language === 'es' ? 'Autoriza las notificaciones para usar esta función' :
                                     language === 'fr' ? 'Autorisez les notifications pour utiliser cette fonction' :
                                     'Autorizează notificările pentru a folosi această funcție'}
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
                    {language === 'it' ? 'Nuova Notifica' :
                     language === 'en' ? 'New Notification' :
                     language === 'es' ? 'Nueva Notificación' :
                     language === 'fr' ? 'Nouvelle Notification' :
                     'Notificare Nouă'}
                </h3>

                <div className="space-y-4">
                    {/* Time Input */}
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${textClass}`}>
                            ⏰ {language === 'it' ? 'Orario' : language === 'en' ? 'Time' : language === 'es' ? 'Hora' : language === 'fr' ? 'Heure' : 'Oră'}
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
                            💬 {language === 'it' ? 'Messaggio Personalizzato' :
                                language === 'en' ? 'Custom Message' :
                                language === 'es' ? 'Mensaje Personalizado' :
                                language === 'fr' ? 'Message Personnalisé' :
                                'Mesaj Personalizat'}
                        </label>
                        <textarea
                            value={newNotification.message}
                            onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                            placeholder={language === 'it' ? 'Es: Ciao Mario! ❤️ Ricorda di controllare i fogli ore 📋' :
                                        language === 'en' ? 'E.g: Hi Mario! ❤️ Remember to check timesheets 📋' :
                                        language === 'es' ? 'Ej: ¡Hola Mario! ❤️ Recuerda revisar las hojas 📋' :
                                        language === 'fr' ? 'Ex: Salut Mario! ❤️ N\'oublie pas de vérifier les feuilles 📋' :
                                        'Ex: Salut Mario! ❤️ Nu uita să verifici fișele 📋'}
                            className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                            rows="3"
                        />
                    </div>

                    {/* Example Messages */}
                    <div>
                        <p className={`text-sm font-semibold mb-2 ${textClass}`}>
                            💡 {language === 'it' ? 'Messaggi di Esempio (clicca per usare):' :
                                language === 'en' ? 'Example Messages (click to use):' :
                                language === 'es' ? 'Mensajes de Ejemplo (clic para usar):' :
                                language === 'fr' ? 'Messages Exemple (cliquez pour utiliser):' :
                                'Mesaje Exemplu (clic pentru a folosi):'}
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
                            📅 {language === 'it' ? 'Giorni della Settimana' :
                                language === 'en' ? 'Days of the Week' :
                                language === 'es' ? 'Días de la Semana' :
                                language === 'fr' ? 'Jours de la Semaine' :
                                'Zile ale Săptămânii'}
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
                        ➕ {language === 'it' ? 'Aggiungi Notifica' :
                            language === 'en' ? 'Add Notification' :
                            language === 'es' ? 'Agregar Notificación' :
                            language === 'fr' ? 'Ajouter Notification' :
                            'Adaugă Notificare'}
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>📋</span>
                    {language === 'it' ? `Notifiche Attive (${notifications.length})` :
                     language === 'en' ? `Active Notifications (${notifications.length})` :
                     language === 'es' ? `Notificaciones Activas (${notifications.length})` :
                     language === 'fr' ? `Notifications Actives (${notifications.length})` :
                     `Notificări Active (${notifications.length})`}
                </h3>

                {notifications.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-4xl mb-3">⏰</p>
                        <p className={textClass}>
                            {language === 'it' ? 'Nessuna notifica programmata' :
                             language === 'en' ? 'No scheduled notifications' :
                             language === 'es' ? 'No hay notificaciones programadas' :
                             language === 'fr' ? 'Aucune notification programmée' :
                             'Nicio notificare programată'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-lg border-l-4 ${
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
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                notification.enabled
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-500 text-white'
                                            }`}>
                                                {notification.enabled ? '✓ Attiva' : '✗ Disattivata'}
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
                    {language === 'it' ? 'Informazioni' : language === 'en' ? 'Information' : language === 'es' ? 'Información' : language === 'fr' ? 'Informations' : 'Informații'}
                </h3>
                <ul className={`space-y-2 text-sm ${textClass}`}>
                    <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>{language === 'it' ? 'Le notifiche verranno inviate solo se la tab è aperta nel browser' :
                                language === 'en' ? 'Notifications will only be sent if the tab is open in the browser' :
                                language === 'es' ? 'Las notificaciones solo se enviarán si la pestaña está abierta en el navegador' :
                                language === 'fr' ? 'Les notifications seront envoyées uniquement si l\'onglet est ouvert dans le navigateur' :
                                'Notificările vor fi trimise doar dacă tab-ul este deschis în browser'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>{language === 'it' ? 'Puoi usare emoji nei messaggi personalizzati ❤️ 🎉 👷' :
                                language === 'en' ? 'You can use emoji in custom messages ❤️ 🎉 👷' :
                                language === 'es' ? 'Puedes usar emoji en mensajes personalizados ❤️ 🎉 👷' :
                                language === 'fr' ? 'Vous pouvez utiliser des emoji dans les messages personnalisés ❤️ 🎉 👷' :
                                'Poți folosi emoji în mesajele personalizate ❤️ 🎉 👷'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>{language === 'it' ? 'Le notifiche disattivate non verranno inviate ma rimarranno salvate' :
                                language === 'en' ? 'Disabled notifications won\'t be sent but will remain saved' :
                                language === 'es' ? 'Las notificaciones desactivadas no se enviarán pero permanecerán guardadas' :
                                language === 'fr' ? 'Les notifications désactivées ne seront pas envoyées mais resteront sauvegardées' :
                                'Notificările dezactivate nu vor fi trimise dar vor rămâne salvate'}</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
