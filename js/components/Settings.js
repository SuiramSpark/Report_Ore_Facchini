// Settings Component - v4.3 REDESIGNED - Interfaccia Moderna con Submenu Collassabili

// Helper function for formatDateTime
function formatDateTime(timestamp) {
    if (!timestamp) return 'N/D';
    try {
        const date = new Date(timestamp);
        if (isNaN(date)) return 'N/D';
        return date.toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'N/D';
    }
}

const Settings = ({ db, sheets = [], darkMode, language = 'it', companyLogo, setCompanyLogo, autoArchiveDay = 5, setAutoArchiveDay, auditLog = [] }) => {
    // ==================== STATI ====================
    // Submenu collapse states
    const [expandedSection, setExpandedSection] = React.useState('general'); // 'general', 'notifications', 'calendar', 'privacy', 'backup', 'audit', 'advanced'
    
    // GDPR Privacy Notice
    const [gdprText, setGdprText] = React.useState('');
    const [editingGdpr, setEditingGdpr] = React.useState(false);
    const [loadingGdpr, setLoadingGdpr] = React.useState(true);

    // Settings state
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [showChangelog, setShowChangelog] = React.useState(false);
    const [settings, setSettings] = React.useState({
        expirationDays: 1,
        notifications: {
            enabled: false,
            newWorker: true,
            sheetCompleted: true,
            reminders: false
        }
    });
    const [weekStart, setWeekStart] = React.useState(1);
    const [customDays, setCustomDays] = React.useState('');
    const [notificationPermission, setNotificationPermission] = React.useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'denied'
    );

    // Scheduled Notifications (integrato)
    const [scheduledNotifications, setScheduledNotifications] = React.useState([]);
    const [newNotification, setNewNotification] = React.useState({
        time: '17:00',
        message: '',
        enabled: true,
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });
    const [editingNotificationId, setEditingNotificationId] = React.useState(null);

    // Backup & Restore states
    const [isLoadingBackup, setIsLoadingBackup] = React.useState(false);

    // Audit Log states
    const [auditFilter, setAuditFilter] = React.useState('all');
    const [clearingAudit, setClearingAudit] = React.useState(false);
    const [selectedLogs, setSelectedLogs] = React.useState([]);
    const [selectMode, setSelectMode] = React.useState(false);
    const [deletingLogs, setDeletingLogs] = React.useState(false);

    // ==================== TRANSLATION HELPER ====================
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

    // ==================== STILI UNIFORMI ====================
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
    const sectionHeaderClass = `text-xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`;
    const subSectionHeaderClass = `text-base font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`;

    // ==================== CHANGELOG ====================
    const changelog = changelogs[language] || changelogs.it;

    // ==================== LOAD SETTINGS ====================
    React.useEffect(() => {
        if (!db) return;
        
        const loadSettings = async () => {
            try {
                const doc = await db.collection('settings').doc('linkExpiration').get();
                
                if (doc.exists) {
                    const data = doc.data();
                    setSettings({
                        expirationDays: data.expirationDays ?? 1,
                        notifications: data.notifications || {
                            enabled: false,
                            newWorker: true,
                            sheetCompleted: true,
                            reminders: false
                        }
                    });
                    if (typeof data.weekStart !== 'undefined' && data.weekStart !== null) {
                        setWeekStart(Number(data.weekStart));
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
            setLoading(false);
        };
        
        loadSettings();
    }, [db]);

    // Load GDPR
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

    // Load Scheduled Notifications
    React.useEffect(() => {
        if (!db) return;

        const unsubscribe = db.collection('scheduledNotifications')
            .orderBy('time', 'asc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setScheduledNotifications(data);
            });

        return () => unsubscribe();
    }, [db]);

    // ==================== SAVE FUNCTIONS ====================
    const saveSettings = async () => {
        if (!db) return;
        setSaving(true);
        try {
            await db.collection('settings').doc('linkExpiration').set({
                expirationDays: settings.expirationDays,
                notifications: settings.notifications,
                weekStart: weekStart,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            showToast('✅ ' + (t.settingsSaved || 'Impostazioni salvate'), 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('❌ ' + (t.errorSaving || 'Errore salvataggio'), 'error');
        }
        setSaving(false);
    };

    const saveGdprText = async () => {
        if (!db) return;
        setLoadingGdpr(true);
        try {
            await db.collection('settings').doc('privacyGDPR').set({ 
                text: gdprText, 
                updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
            }, { merge: true });
            showToast('✅ Privacy aggiornata', 'success');
            setEditingGdpr(false);
        } catch (e) {
            showToast('❌ Errore salvataggio privacy', 'error');
        }
        setLoadingGdpr(false);
    };

    // ==================== NOTIFICATION FUNCTIONS ====================
    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            showToast('❌ ' + (t.notificationsNotSupported || 'Browser non supporta notifiche'), 'error');
            return;
        }

        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === 'granted') {
            showToast('✅ ' + (t.notificationsGranted || 'Notifiche abilitate'), 'success');
        } else {
            showToast('⚠️ ' + (t.notificationsBlocked || 'Notifiche bloccate'), 'warning');
        }
    };

    const addScheduledNotification = async () => {
        if (!db) return;
        if (!newNotification.message.trim()) {
            showToast('⚠️ ' + (t.messageRequired || 'Inserisci un messaggio'), 'warning');
            return;
        }

        try {
            await db.collection('scheduledNotifications').add({
                ...newNotification,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            setNewNotification({
                time: '17:00',
                message: '',
                enabled: true,
                days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            });
            
            showToast('✅ ' + (t.notificationAdded || 'Notifica aggiunta'), 'success');
        } catch (error) {
            console.error('Error adding notification:', error);
            showToast('❌ ' + (t.errorSaving || 'Errore'), 'error');
        }
    };

    const deleteScheduledNotification = async (id) => {
        if (!db || !confirm(t.confirmDelete || 'Confermi eliminazione?')) return;
        
        try {
            await db.collection('scheduledNotifications').doc(id).delete();
            showToast('✅ ' + (t.notificationDeleted || 'Notifica eliminata'), 'success');
        } catch (error) {
            console.error('Error deleting notification:', error);
            showToast('❌ ' + (t.errorDeleting || 'Errore'), 'error');
        }
    };

    const toggleScheduledNotification = async (id, currentState) => {
        if (!db) return;
        
        try {
            await db.collection('scheduledNotifications').doc(id).update({
                enabled: !currentState
            });
        } catch (error) {
            console.error('Error toggling notification:', error);
        }
    };

    // ==================== BACKUP FUNCTIONS ====================
    const handleBackup = async () => {
        setIsLoadingBackup(true);
        try {
            await backupAllData(db);
        } catch (error) {
            console.error('Backup error:', error);
            showToast('❌ Errore durante il backup', 'error');
        }
        setIsLoadingBackup(false);
    };

    const handleRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoadingBackup(true);
        try {
            await restoreFromBackup(db, file);
        } catch (error) {
            console.error('Restore error:', error);
            showToast('❌ Errore durante il ripristino', 'error');
        }
        setIsLoadingBackup(false);
        e.target.value = '';
    };

    // ==================== AUDIT LOG FUNCTIONS ====================
    const clearAuditLog = async () => {
        if (!db) {
            showToast('❌ Database non connesso', 'error');
            return;
        }

        if (!confirm('⚠️ ' + (t.confirmClear || 'Vuoi davvero svuotare il registro?'))) {
            return;
        }

        setClearingAudit(true);

        try {
            const batch = db.batch();
            const snapshot = await db.collection('auditLog').get();
            
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            showToast('✅ ' + (t.registryCleared || 'Registro svuotato'), 'success');
        } catch (error) {
            console.error('Errore:', error);
            showToast('❌ ' + (t.errorClearing || 'Errore durante lo svuotamento'), 'error');
        }

        setClearingAudit(false);
    };

    const toggleSelectMode = () => {
        setSelectMode(!selectMode);
        setSelectedLogs([]);
    };

    const toggleLogSelection = (logId) => {
        setSelectedLogs(prev => 
            prev.includes(logId) 
                ? prev.filter(id => id !== logId)
                : [...prev, logId]
        );
    };

    const deleteSelectedLogs = async () => {
        if (!db || selectedLogs.length === 0) return;

        if (!confirm(`⚠️ Eliminare ${selectedLogs.length} log selezionati?`)) {
            return;
        }

        setDeletingLogs(true);

        try {
            const batch = db.batch();
            selectedLogs.forEach((logId) => {
                const logRef = db.collection('auditLog').doc(logId);
                batch.delete(logRef);
            });

            await batch.commit();
            showToast(`✅ ${selectedLogs.length} log eliminati`, 'success');
            setSelectedLogs([]);
            setSelectMode(false);
        } catch (error) {
            console.error('Errore:', error);
            showToast('❌ Errore durante l\'eliminazione', 'error');
        }

        setDeletingLogs(false);
    };

    // ==================== HELPER COMPONENTS ====================
    const SectionHeader = ({ icon, title, sectionKey, count }) => (
        <button
            onClick={() => setExpandedSection(expandedSection === sectionKey ? null : sectionKey)}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${
                expandedSection === sectionKey 
                    ? darkMode ? 'bg-indigo-900/30 border-2 border-indigo-500' : 'bg-indigo-50 border-2 border-indigo-500'
                    : darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
        >
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div className="text-left">
                    <h2 className={sectionHeaderClass}>{title}</h2>
                    {count !== undefined && (
                        <p className={`text-xs ${textClass}`}>
                            {count} {count === 1 ? 'elemento' : 'elementi'}
                        </p>
                    )}
                </div>
            </div>
            <span className={`text-2xl transition-transform ${expandedSection === sectionKey ? 'rotate-90' : ''}`}>
                ▶
            </span>
        </button>
    );

    const daysOfWeek = [
        { key: 'monday', label: t.weekday_short_monday || 'Lun' },
        { key: 'tuesday', label: t.weekday_short_tuesday || 'Mar' },
        { key: 'wednesday', label: t.weekday_short_wednesday || 'Mer' },
        { key: 'thursday', label: t.weekday_short_thursday || 'Gio' },
        { key: 'friday', label: t.weekday_short_friday || 'Ven' },
        { key: 'saturday', label: t.weekday_short_saturday || 'Sab' },
        { key: 'sunday', label: t.weekday_short_sunday || 'Dom' }
    ];

    const weekOptions = [
        { value: 1, label: language === 'it' ? 'Lunedì' : language === 'en' ? 'Monday' : language === 'es' ? 'Lun' : language === 'fr' ? 'Lun' : 'Luni' },
        { value: 2, label: language === 'it' ? 'Martedì' : language === 'en' ? 'Tuesday' : language === 'es' ? 'Mar' : language === 'fr' ? 'Mar' : 'Marți' },
        { value: 3, label: language === 'it' ? 'Mercoledì' : language === 'en' ? 'Wednesday' : language === 'es' ? 'Mié' : language === 'fr' ? 'Mer' : 'Mier' },
        { value: 4, label: language === 'it' ? 'Giovedì' : language === 'en' ? 'Thursday' : language === 'es' ? 'Jue' : language === 'fr' ? 'Jeu' : 'Joi' },
        { value: 5, label: language === 'it' ? 'Venerdì' : language === 'en' ? 'Friday' : language === 'es' ? 'Vie' : language === 'fr' ? 'Ven' : 'Vin' },
        { value: 6, label: language === 'it' ? 'Sabato' : language === 'en' ? 'Saturday' : language === 'es' ? 'Sáb' : language === 'fr' ? 'Sam' : 'Sâm' },
        { value: 0, label: language === 'it' ? 'Domenica' : language === 'en' ? 'Sunday' : language === 'es' ? 'Dom' : language === 'fr' ? 'Dim' : 'Dum' }
    ];

    const expirationOptions = [
        { value: 0, label: t.never || 'Mai', hours: 0 },
        { value: 0.333, label: '8h', hours: 8 },
        { value: 1, label: '24h', hours: 24 },
        { value: 2, label: '48h', hours: 48 },
        { value: 3, label: '72h', hours: 72 },
        { value: 6, label: '144h (6 ' + (t.days || 'giorni') + ')', hours: 144 }
    ];

    // ==================== RENDER ====================
    if (loading) {
        return React.createElement('div', { className: 'flex items-center justify-center h-64' },
            React.createElement('p', { className: textClass }, '⏳ ' + (t.loading || 'Caricamento') + '...')
        );
    }

    return React.createElement('div', { className: 'max-w-4xl mx-auto p-4 space-y-4' },
        // ========== HEADER ==========
        React.createElement('div', { className: `${cardClass} rounded-xl shadow-lg p-6 mb-6` },
            React.createElement('h1', { className: `text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}` }, 
                '⚙️ ' + (t.settings || 'Impostazioni')
            ),
            React.createElement('p', { className: textClass + ' mt-2' },
                t.settingsDescription || 'Configura l\'applicazione secondo le tue esigenze'
            )
        ),

        // ========== SEZIONE: IMPOSTAZIONI GENERALI ==========
        React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '🎛️', 
                title: t.generalSettings || 'Impostazioni Generali', 
                sectionKey: 'general' 
            }),
            
            expandedSection === 'general' && React.createElement('div', { className: 'p-4 space-y-6 animate-fade-in' },
                // Logo aziendale
                React.createElement('div', {},
                    React.createElement('h3', { className: subSectionHeaderClass }, 
                        '🏢 ' + (t.companyLogo || 'Logo Aziendale')
                    ),
                    React.createElement('div', { className: 'flex flex-col sm:flex-row items-center gap-4' },
                        companyLogo && React.createElement('img', { 
                            src: companyLogo, 
                            alt: 'Company Logo',
                            className: 'w-32 h-32 object-contain border-2 rounded-lg ' + (darkMode ? 'border-gray-600' : 'border-gray-300')
                        }),
                        React.createElement('div', { className: 'flex-1 w-full' },
                            React.createElement('input', {
                                type: 'file',
                                accept: 'image/*',
                                onChange: (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const logo = event.target.result;
                                            setCompanyLogo(logo);
                                            localStorage.setItem('companyLogo', logo);
                                            showToast('✅ Logo caricato', 'success');
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                },
                                className: inputClass + ' p-2 rounded border w-full'
                            }),
                            companyLogo && React.createElement('button', {
                                onClick: () => {
                                    setCompanyLogo(null);
                                    localStorage.removeItem('companyLogo');
                                    showToast('🗑️ Logo rimosso', 'info');
                                },
                                className: 'mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors w-full sm:w-auto'
                            }, '🗑️ ' + (t.removeLogo || 'Rimuovi Logo'))
                        )
                    )
                ),

                // Scadenza link
                React.createElement('div', {},
                    React.createElement('h3', { className: subSectionHeaderClass }, 
                        '⏱️ ' + (t.linkExpiration || 'Scadenza Link')
                    ),
                    React.createElement('p', { className: textClass + ' text-sm mb-3' },
                        t.linkExpirationDescription || 'Dopo quanto tempo il link per i lavoratori scade'
                    ),
                    React.createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 gap-2' },
                        ...expirationOptions.map(opt => 
                            React.createElement('button', {
                                key: opt.value,
                                onClick: () => setSettings({ ...settings, expirationDays: opt.value }),
                                className: `px-4 py-3 rounded-lg font-semibold transition-all ${
                                    settings.expirationDays === opt.value
                                        ? 'bg-indigo-600 text-white scale-105 shadow-lg'
                                        : darkMode 
                                            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                }`
                            }, opt.label)
                        )
                    )
                ),

                // Save button
                React.createElement('button', {
                    onClick: saveSettings,
                    disabled: saving,
                    className: 'w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-lg transition-colors shadow-lg'
                }, saving ? '⏳ ' + (t.saving || 'Salvataggio') + '...' : '💾 ' + (t.saveSettings || 'Salva Impostazioni'))
            )
        ),

        // ========== SEZIONE: NOTIFICHE ==========
        React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '🔔', 
                title: t.notificationSettings || 'Notifiche', 
                sectionKey: 'notifications',
                count: scheduledNotifications.length
            }),
            
            expandedSection === 'notifications' && React.createElement('div', { className: 'p-4 space-y-6 animate-fade-in' },
                // Permessi notifiche
                React.createElement('div', { 
                    className: `p-4 rounded-lg border-2 ${
                        notificationPermission === 'granted'
                            ? darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
                            : darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                    }` 
                },
                    React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
                        React.createElement('span', { className: 'text-2xl' },
                            notificationPermission === 'granted' ? '✅' : '⚠️'
                        ),
                        React.createElement('div', {},
                            React.createElement('p', { className: 'font-semibold ' + (
                                notificationPermission === 'granted'
                                    ? darkMode ? 'text-green-300' : 'text-green-700'
                                    : darkMode ? 'text-yellow-300' : 'text-yellow-700'
                            ) },
                                notificationPermission === 'granted' 
                                    ? t.notificationsGranted || 'Notifiche abilitate'
                                    : t.notificationsBlocked || 'Notifiche bloccate'
                            )
                        )
                    ),
                    notificationPermission !== 'granted' && React.createElement('button', {
                        onClick: requestNotificationPermission,
                        className: 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors'
                    }, '🔔 ' + (t.enableNotifications || 'Abilita Notifiche'))
                ),

                // Notifiche di sistema
                React.createElement('div', {},
                    React.createElement('h3', { className: subSectionHeaderClass },
                        '📬 ' + (t.systemNotifications || 'Notifiche di Sistema')
                    ),
                    React.createElement('div', { className: 'space-y-3' },
                        React.createElement('label', { className: 'flex items-center gap-3 cursor-pointer' },
                            React.createElement('input', {
                                type: 'checkbox',
                                checked: settings.notifications.newWorker,
                                onChange: (e) => setSettings({
                                    ...settings,
                                    notifications: { ...settings.notifications, newWorker: e.target.checked }
                                }),
                                className: 'w-5 h-5 rounded'
                            }),
                            React.createElement('span', { className: textClass },
                                t.notifyNewWorker || 'Nuovo lavoratore aggiunto'
                            )
                        ),
                        React.createElement('label', { className: 'flex items-center gap-3 cursor-pointer' },
                            React.createElement('input', {
                                type: 'checkbox',
                                checked: settings.notifications.sheetCompleted,
                                onChange: (e) => setSettings({
                                    ...settings,
                                    notifications: { ...settings.notifications, sheetCompleted: e.target.checked }
                                }),
                                className: 'w-5 h-5 rounded'
                            }),
                            React.createElement('span', { className: textClass },
                                t.notifySheetCompleted || 'Foglio completato'
                            )
                        )
                    )
                ),

                // Notifiche programmate
                React.createElement('div', {},
                    React.createElement('h3', { className: subSectionHeaderClass },
                        '⏰ ' + (t.scheduledNotifications || 'Notifiche Programmate')
                    ),
                    React.createElement('p', { className: textClass + ' text-sm mb-3' },
                        t.scheduledNotificationsDesc || 'Imposta reminder automatici per non dimenticare di completare i fogli'
                    ),
                    
                    // Aggiungi notifica
                    React.createElement('div', { className: `p-4 rounded-lg border-2 ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}` },
                        React.createElement('input', {
                            type: 'time',
                            value: newNotification.time,
                            onChange: (e) => setNewNotification({ ...newNotification, time: e.target.value }),
                            className: inputClass + ' p-2 rounded border mb-3 w-full'
                        }),
                        React.createElement('input', {
                            type: 'text',
                            placeholder: t.messageNotification || 'Messaggio notifica...',
                            value: newNotification.message,
                            onChange: (e) => setNewNotification({ ...newNotification, message: e.target.value }),
                            className: inputClass + ' p-2 rounded border mb-3 w-full'
                        }),
                        React.createElement('div', { className: 'flex flex-wrap gap-2 mb-3' },
                            ...daysOfWeek.map(day =>
                                React.createElement('button', {
                                    key: day.key,
                                    onClick: () => {
                                        const days = newNotification.days.includes(day.key)
                                            ? newNotification.days.filter(d => d !== day.key)
                                            : [...newNotification.days, day.key];
                                        setNewNotification({ ...newNotification, days });
                                    },
                                    className: `px-3 py-2 rounded-lg font-semibold transition-all ${
                                        newNotification.days.includes(day.key)
                                            ? 'bg-indigo-600 text-white'
                                            : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-900'
                                    }`
                                }, day.label)
                            )
                        ),
                        React.createElement('button', {
                            onClick: addScheduledNotification,
                            className: 'w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors'
                        }, '➕ ' + (t.addNotification || 'Aggiungi Notifica'))
                    ),

                    // Lista notifiche
                    scheduledNotifications.length > 0 && React.createElement('div', { className: 'mt-4 space-y-2' },
                        ...scheduledNotifications.map(notif =>
                            React.createElement('div', {
                                key: notif.id,
                                className: `p-3 rounded-lg border ${
                                    notif.enabled
                                        ? darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                        : darkMode ? 'bg-gray-800 border-gray-700 opacity-50' : 'bg-gray-100 border-gray-300 opacity-50'
                                }`
                            },
                                React.createElement('div', { className: 'flex items-center justify-between' },
                                    React.createElement('div', { className: 'flex-1' },
                                        React.createElement('p', { className: 'font-semibold' }, 
                                            '⏰ ' + notif.time + ' - ' + notif.message
                                        ),
                                        React.createElement('p', { className: textClass + ' text-xs' },
                                            notif.days.map(d => daysOfWeek.find(day => day.key === d)?.label).join(', ')
                                        )
                                    ),
                                    React.createElement('div', { className: 'flex items-center gap-2' },
                                        React.createElement('button', {
                                            onClick: () => toggleScheduledNotification(notif.id, notif.enabled),
                                            className: 'px-3 py-1 rounded ' + (
                                                notif.enabled 
                                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                                            )
                                        }, notif.enabled ? '✓' : '✗'),
                                        React.createElement('button', {
                                            onClick: () => deleteScheduledNotification(notif.id),
                                            className: 'px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded'
                                        }, '🗑️')
                                    )
                                )
                            )
                        )
                    )
                ),

                // Save button
                React.createElement('button', {
                    onClick: saveSettings,
                    disabled: saving,
                    className: 'w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-lg transition-colors shadow-lg'
                }, saving ? '⏳ ' + (t.saving || 'Salvataggio') + '...' : '💾 ' + (t.saveSettings || 'Salva Impostazioni'))
            )
        ),

        // ========== SEZIONE: CALENDARIO ==========
        React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '📅', 
                title: t.calendarSettings || 'Impostazioni Calendario', 
                sectionKey: 'calendar' 
            }),
            
            expandedSection === 'calendar' && React.createElement('div', { className: 'p-4 space-y-6 animate-fade-in' },
                // Inizio settimana
                React.createElement('div', {},
                    React.createElement('h3', { className: subSectionHeaderClass },
                        '📆 ' + (t.weekStartLabel || 'Inizio Settimana')
                    ),
                    React.createElement('p', { className: textClass + ' text-sm mb-3' },
                        t.weekStartDescription || 'Scegli il giorno con cui iniziare la settimana nel calendario'
                    ),
                    React.createElement('select', {
                        value: weekStart,
                        onChange: (e) => setWeekStart(Number(e.target.value)),
                        className: inputClass + ' px-3 py-2 rounded border w-full'
                    },
                        ...weekOptions.map(opt =>
                            React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
                        )
                    )
                ),

                // Auto-archiviazione
                React.createElement('div', {},
                    React.createElement('h3', { className: subSectionHeaderClass },
                        '📦 ' + (t.autoArchiveLabel || 'Auto-Archiviazione')
                    ),
                    React.createElement('p', { className: textClass + ' text-sm mb-3' },
                        t.autoArchiveDescription || 'Giorno del mese in cui archiviare automaticamente i fogli completati del mese precedente'
                    ),
                    React.createElement('select', {
                        value: autoArchiveDay,
                        onChange: (e) => {
                            const day = parseInt(e.target.value);
                            setAutoArchiveDay(day);
                            localStorage.setItem('autoArchiveDay', day);
                            showToast('✅ Giorno auto-archiviazione aggiornato', 'success');
                        },
                        className: inputClass + ' px-3 py-2 rounded border w-full'
                    },
                        ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28].map(day =>
                            React.createElement('option', { key: day, value: day }, 
                                day + (language === 'it' ? '° giorno del mese' : language === 'en' ? ' day of month' : ' del mes')
                            )
                        )
                    )
                ),

                // Save button
                React.createElement('button', {
                    onClick: saveSettings,
                    disabled: saving,
                    className: 'w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-lg transition-colors shadow-lg'
                }, saving ? '⏳ ' + (t.saving || 'Salvataggio') + '...' : '💾 ' + (t.saveSettings || 'Salva Impostazioni'))
            )
        ),

        // ========== SEZIONE: PRIVACY ==========
        React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '🔒', 
                title: t.privacySettings || 'Privacy & GDPR', 
                sectionKey: 'privacy' 
            }),
            
            expandedSection === 'privacy' && React.createElement('div', { className: 'p-4 space-y-4 animate-fade-in' },
                React.createElement('h3', { className: subSectionHeaderClass },
                    '📜 ' + (t.gdprNotice || 'Informativa Privacy')
                ),
                React.createElement('p', { className: textClass + ' text-sm mb-3' },
                    t.gdprDescription || 'Testo mostrato ai lavoratori prima della firma'
                ),
                
                editingGdpr
                    ? React.createElement('div', {},
                        React.createElement('textarea', {
                            value: gdprText,
                            onChange: (e) => setGdprText(e.target.value),
                            rows: 10,
                            className: inputClass + ' p-3 rounded border w-full',
                            placeholder: 'Inserisci l\'informativa privacy GDPR...'
                        }),
                        React.createElement('div', { className: 'flex gap-2 mt-3' },
                            React.createElement('button', {
                                onClick: saveGdprText,
                                disabled: loadingGdpr,
                                className: 'flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors'
                            }, loadingGdpr ? '⏳ Salvataggio...' : '💾 Salva'),
                            React.createElement('button', {
                                onClick: () => setEditingGdpr(false),
                                className: 'px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors'
                            }, '✖️ Annulla')
                        )
                    )
                    : React.createElement('div', {},
                        React.createElement('div', { 
                            className: `p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`,
                            style: { maxHeight: '200px', overflowY: 'auto' }
                        },
                            React.createElement('p', { className: textClass, style: { whiteSpace: 'pre-wrap' } },
                                gdprText || (t.noGdprText || 'Nessuna informativa configurata')
                            )
                        ),
                        React.createElement('button', {
                            onClick: () => setEditingGdpr(true),
                            className: 'mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors'
                        }, '✏️ ' + (t.edit || 'Modifica'))
                    )
            )
        ),

        // ========== SEZIONE: BACKUP & RESTORE ==========
        React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '💾', 
                title: t.backupData || 'Backup & Ripristino', 
                sectionKey: 'backup' 
            }),
            
            expandedSection === 'backup' && React.createElement('div', { className: 'p-4 space-y-6 animate-fade-in' },
                // Export Backup
                React.createElement('div', { className: `p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}` },
                    React.createElement('h3', { className: subSectionHeaderClass }, 
                        '📤 ' + (t.exportBackup || 'Esporta Backup')
                    ),
                    React.createElement('p', { className: textClass + ' text-sm mb-3' },
                        t.backupDescription || 'Scarica una copia completa di tutti i dati in formato JSON'
                    ),
                    React.createElement('button', {
                        onClick: handleBackup,
                        disabled: isLoadingBackup,
                        className: 'w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 text-white rounded-lg font-semibold transition-colors'
                    }, isLoadingBackup ? '⏳ ' + (t.creatingBackup || 'Creazione backup') + '...' : '💾 ' + (t.downloadBackup || 'Scarica Backup'))
                ),

                // Restore Backup
                React.createElement('div', { className: `p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}` },
                    React.createElement('h3', { className: subSectionHeaderClass }, 
                        '📥 ' + (t.restoreBackupTitle || 'Ripristina Backup')
                    ),
                    React.createElement('p', { className: textClass + ' text-sm mb-3' },
                        '⚠️ ',
                        React.createElement('strong', {}, t.warningAttention || 'Attenzione'),
                        ': ' + (t.currentDataWillBeReplaced || 'I dati attuali verranno sostituiti')
                    ),
                    React.createElement('label', {
                        className: 'w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded-lg font-semibold cursor-pointer inline-block text-center transition-colors'
                    },
                        isLoadingBackup ? '⏳ ' + (t.restoringBackup || 'Ripristino') + '...' : '📥 ' + (t.loadBackup || 'Carica Backup'),
                        React.createElement('input', {
                            type: 'file',
                            accept: '.json',
                            onChange: handleRestore,
                            disabled: isLoadingBackup,
                            className: 'hidden'
                        })
                    )
                )
            )
        ),

        // ========== SEZIONE: LOG ATTIVITÀ ==========
        React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '📝', 
                title: t.auditLog || 'Log Attività', 
                sectionKey: 'audit',
                count: auditLog.length
            }),
            
            expandedSection === 'audit' && React.createElement('div', { className: 'p-4 space-y-4 animate-fade-in' },
                // Filter buttons
                React.createElement('div', { className: 'flex flex-wrap gap-2 mb-4' },
                    React.createElement('button', {
                        onClick: () => setAuditFilter('all'),
                        className: `px-4 py-2 rounded-lg font-semibold transition-all ${
                            auditFilter === 'all'
                                ? 'bg-indigo-600 text-white scale-105'
                                : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-900'
                        }`
                    }, t.all || 'Tutti'),
                    React.createElement('button', {
                        onClick: () => setAuditFilter('create'),
                        className: `px-4 py-2 rounded-lg font-semibold transition-all ${
                            auditFilter === 'create'
                                ? 'bg-indigo-600 text-white scale-105'
                                : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-900'
                        }`
                    }, t.additions || 'Creazioni'),
                    React.createElement('button', {
                        onClick: () => setAuditFilter('edit'),
                        className: `px-4 py-2 rounded-lg font-semibold transition-all ${
                            auditFilter === 'edit'
                                ? 'bg-indigo-600 text-white scale-105'
                                : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-900'
                        }`
                    }, t.modifications || 'Modifiche'),
                    React.createElement('button', {
                        onClick: () => setAuditFilter('delete'),
                        className: `px-4 py-2 rounded-lg font-semibold transition-all ${
                            auditFilter === 'delete'
                                ? 'bg-indigo-600 text-white scale-105'
                                : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-900'
                        }`
                    }, t.deletions || 'Eliminazioni')
                ),

                // Actions
                React.createElement('div', { className: 'flex flex-wrap gap-2 mb-4' },
                    React.createElement('button', {
                        onClick: toggleSelectMode,
                        className: `px-4 py-2 ${selectMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg font-semibold transition-colors`
                    }, selectMode ? '✖️ ' + (t.cancelSelection || 'Annulla Selezione') : '☑️ ' + (t.select || 'Seleziona')),
                    selectMode && selectedLogs.length > 0 && React.createElement('button', {
                        onClick: deleteSelectedLogs,
                        disabled: deletingLogs,
                        className: 'px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded-lg font-semibold transition-colors'
                    }, deletingLogs ? '⏳ ' + (t.deleting || 'Eliminazione') + '...' : `🗑️ ${t.delete || 'Elimina'} (${selectedLogs.length})`),
                    React.createElement('button', {
                        onClick: clearAuditLog,
                        disabled: clearingAudit,
                        className: 'px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded-lg font-semibold transition-colors'
                    }, clearingAudit ? '⏳ ' + (t.clearing || 'Svuotamento') + '...' : '🗑️ ' + (t.clearLog || 'Svuota Tutto'))
                ),

                // Log list
                React.createElement('div', { 
                    className: `space-y-2 overflow-y-auto`,
                    style: { maxHeight: '400px' }
                },
                    auditLog
                        .filter(log => {
                            if (auditFilter === 'all') return true;
                            const action = log.action.toLowerCase();
                            if (auditFilter === 'create') return action.includes('create');
                            if (auditFilter === 'edit') return action.includes('edit') || action.includes('update');
                            if (auditFilter === 'delete') return action.includes('delete');
                            return true;
                        })
                        .map((log, index) =>
                            React.createElement('div', {
                                key: log.id || index,
                                onClick: selectMode ? () => toggleLogSelection(log.id) : undefined,
                                className: `p-3 rounded-lg border ${
                                    selectMode && selectedLogs.includes(log.id)
                                        ? 'border-indigo-500 bg-indigo-900/20'
                                        : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                                } ${selectMode ? 'cursor-pointer hover:border-indigo-400' : ''}`
                            },
                                React.createElement('div', { className: 'flex items-start justify-between gap-2' },
                                    React.createElement('div', { className: 'flex-1' },
                                        React.createElement('p', { className: 'font-semibold text-sm' }, log.action),
                                        React.createElement('p', { className: textClass + ' text-xs mt-1' }, log.details),
                                        React.createElement('p', { className: textClass + ' text-xs mt-1' },
                                            formatDateTime(log.timestamp?.toDate ? log.timestamp.toDate() : log.timestamp)
                                        )
                                    ),
                                    selectMode && React.createElement('input', {
                                        type: 'checkbox',
                                        checked: selectedLogs.includes(log.id),
                                        onChange: () => toggleLogSelection(log.id),
                                        className: 'w-5 h-5 rounded',
                                        onClick: (e) => e.stopPropagation()
                                    })
                                )
                            )
                        )
                ),

                auditLog.length === 0 && React.createElement('div', { 
                    className: `text-center py-8 ${textClass}` 
                },
                    '📭 ' + (t.noAuditLogs || 'Nessun log presente')
                )
            )
        ),

        // ========== SEZIONE: AVANZATE (CHANGELOG) ==========
        React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '🔧', 
                title: t.advancedSettings || 'Avanzate', 
                sectionKey: 'advanced' 
            }),
            
            expandedSection === 'advanced' && React.createElement('div', { className: 'p-4 space-y-4 animate-fade-in' },
                React.createElement('h3', { className: subSectionHeaderClass },
                    '📋 ' + (t.changelog || 'Changelog')
                ),
                React.createElement('p', { className: textClass + ' text-sm mb-4' },
                    t.changelogDescription || 'Cronologia delle versioni e aggiornamenti'
                ),
                
                React.createElement('div', { className: 'space-y-4' },
                    ...changelog.map((version, vIndex) =>
                        React.createElement('div', {
                            key: vIndex,
                            className: `p-4 rounded-lg border-l-4 ${
                                vIndex === 0 
                                    ? `border-green-500 ${darkMode ? 'bg-green-900/20' : 'bg-green-50'}` 
                                    : `border-indigo-500 ${darkMode ? 'bg-indigo-900/20' : 'bg-indigo-50'}`
                            }`
                        },
                            React.createElement('div', { className: 'flex items-center justify-between mb-3' },
                                React.createElement('h3', { className: 'text-lg font-bold flex items-center gap-2' },
                                    vIndex === 0 && React.createElement('span', { className: 'text-xl' }, '🆕'),
                                    version.version
                                ),
                                React.createElement('span', { className: textClass + ' text-sm' },
                                    version.date // Usa direttamente la stringa, non fare parsing
                                )
                            ),
                            React.createElement('ul', { className: 'space-y-2' },
                                ...(version.changes || []).map((change, cIndex) =>
                                    React.createElement('li', {
                                        key: cIndex,
                                        className: `text-sm flex items-start gap-2 ${textClass}`
                                    },
                                        React.createElement('span', { className: 'flex-shrink-0 mt-0.5' }, '•'),
                                        React.createElement('span', {}, change)
                                    )
                                )
                            )
                        )
                    )
                ),

                React.createElement('div', { className: `text-center pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}` },
                    React.createElement('p', { className: textClass },
                        '💡 Sviluppato con ❤️ per semplificare la gestione delle ore lavorative'
                    )
                )
            )
        )
    );
};

// Esporta il componente
if (typeof window !== 'undefined') {
    window.Settings = Settings;
}
