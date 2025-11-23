// Settings Component - v4.3 REDESIGNED - Interfaccia Moderna con Submenu Collassabili + COMPANIES & ADDRESSES
console.log('⚙️ Settings v4.3 loaded - Companies & Addresses sections enabled');

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

const Settings = ({ db, storage, sheets = [], darkMode, language = 'it', companyLogo, setCompanyLogo, companies = [], setCompanies, activeCompanyId, setActiveCompanyId, autoArchiveDay = 5, setAutoArchiveDay, auditLog = [], appSettings, setAppSettings, currentUser, recentAddresses = [] }) => {
    // Debug: Log current user per verificare visibilità sezione sicurezza
    console.log('🔍 Settings currentUser:', {
        id: currentUser?.id,
        role: currentUser?.role,
        isPermanent: currentUser?.isPermanent,
        email: currentUser?.email,
        shouldShowSecurity: currentUser?.id === 'admin' || (currentUser?.role === 'admin' && !currentUser?.isPermanent)
    });
    
    // ==================== RUOLI ====================
    const isWorker = currentUser?.role === 'worker';
    const canModifySettings = !isWorker; // Worker può solo vedere, non modificare
    
    // ==================== STATI ====================
    // Submenu collapse states
    const [expandedSection, setExpandedSection] = React.useState('general'); // 'general', 'notifications', 'calendar', 'privacy', 'termsOfService', 'backup', 'audit', 'advanced'
    
    // GDPR Privacy Notice (default placeholder - can be edited and saved to Firestore)
    const [gdprText, setGdprText] = React.useState(`Informativa sulla privacy (versione predefinita)\n\nQuesto servizio è fornito da Apostu Marius Iulian (contatto: mapostu.04@gmail.com).\n\nFinalità: i dati inseriti dai lavoratori (nome, orari, firma e campi facoltativi) sono utilizzati esclusivamente per la registrazione delle ore e la generazione del documento di riepilogo.\n\nArchiviazione: i dati sono memorizzati in un database Firebase gestito dal proprietario dell'app. I dati vengono conservati finché necessario per lo scopo dichiarato o finché non vengono rimossi manualmente dall'amministratore.\n\nNessun valore legale: questo servizio è fornito a scopo informativo; i documenti generati non hanno valore legale certificato.\n\nPer richieste, cancellazione o rettifica dati contattare: mapostu.04@gmail.com`);
    const [editingGdpr, setEditingGdpr] = React.useState(false);
    const [loadingGdpr, setLoadingGdpr] = React.useState(true);

    // Terms of Service (default placeholder - can be edited and saved to Firestore)
    const [tosText, setTosText] = React.useState(`Termini di Servizio (versione predefinita)\n\nProprietario e contatti: Apostu Marius Iulian - mapostu.04@gmail.com\n\nUso dell'app: l'app permette ai lavoratori di registrare orari e firme per creare un riepilogo delle ore lavorate. I dati inseriti sono salvati su Firebase e l'app è ospitata pubblicamente su GitHub.\n\nAccettazione: compilando e inviando il modulo, il lavoratore dichiara di aver preso visione di questi Termini e accetta che i dati siano salvati per le finalità indicate.\n\nLimitazioni: le informazioni fornite tramite l'app sono a scopo informativo e non costituiscono consulenza legale; i documenti prodotti non garantiscono valore legale.\n\nPer domande o richieste contattare: mapostu.04@gmail.com`);
    const [editingTos, setEditingTos] = React.useState(false);
    const [loadingTos, setLoadingTos] = React.useState(true);

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

    // Security Questions states
    const [securityConfig, setSecurityConfig] = React.useState({
        question1: '',
        answer1: '',
        question2: '',
        answer2: ''
    });
    const [passwordChange, setPasswordChange] = React.useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Activity Types Management states
    const [showActivityModal, setShowActivityModal] = React.useState(false);
    const [editingActivity, setEditingActivity] = React.useState(null);
    const [activityForm, setActivityForm] = React.useState({
        nome: '',
        emoji: '📋',
        colore: '#3B82F6'
    });

    // Companies Management states
    const [showCompanyModal, setShowCompanyModal] = React.useState(false);
    const [editingCompany, setEditingCompany] = React.useState(null);
    const [companyForm, setCompanyForm] = React.useState({
        nome: '',
        logo: '',
        colore: '#10B981',
        partitaIva: ''
    });

    // Addresses Management states
    const [showAddressModal, setShowAddressModal] = React.useState(false);
    const [editingAddress, setEditingAddress] = React.useState(null);
    const [addressForm, setAddressForm] = React.useState({
        nome: '',
        indirizzo: '',
        citta: '',
        cap: '',
        provincia: '',
        emoji: '📍',
        colore: '#8B5CF6',
        googleMapsUrl: ''
    });
    const [addressTab, setAddressTab] = React.useState('fixed'); // 'fixed' or 'recent'

    // Multi-Company Logo System (companies e activeCompanyId vengono passati come props da app.js)
    const [loadingCompanies, setLoadingCompanies] = React.useState(false);

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

    // 🚀 OTTIMIZZAZIONE: Batch query per tutti i settings (1 lettura invece di 3+)
    React.useEffect(() => {
        if (!db) return;
        
        const loadAllSettings = async () => {
            try {
                // Carica TUTTI i settings in una singola query batch
                const snapshot = await db.collection('settings').get();
                
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    
                    switch (doc.id) {
                        case 'linkExpiration':
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
                            break;
                            
                        case 'privacyGDPR':
                            const gdprRemote = data.text;
                            if (gdprRemote && String(gdprRemote).trim().length > 0) {
                                setGdprText(gdprRemote);
                            } else {
                                console.log('privacyGDPR present but empty - keeping default in-code GDPR text');
                            }
                            setLoadingGdpr(false);
                            break;
                            
                        case 'termsOfService':
                            const tosRemote = data.text;
                            if (tosRemote && String(tosRemote).trim().length > 0) {
                                setTosText(tosRemote);
                            } else {
                                console.log('termsOfService present but empty - keeping default in-code ToS text');
                            }
                            setLoadingTos(false);
                            break;
                    }
                });
                
                console.log('✅ Settings batch loaded - 1 query instead of 3+');
            } catch (error) {
                console.error('Error loading settings batch:', error);
                setLoadingGdpr(false);
                setLoadingTos(false);
            }
            setLoading(false);
        };
        
        loadAllSettings();
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

    // Companies sono caricati in app.js e passati come props, non caricarli qui

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

    const saveTosText = async () => {
        if (!db) return;
        setLoadingTos(true);
        try {
            await db.collection('settings').doc('termsOfService').set({ 
                text: tosText, 
                updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
            }, { merge: true });
            showToast('✅ Termini di Servizio aggiornati', 'success');
            setEditingTos(false);
        } catch (e) {
            showToast('❌ Errore salvataggio Termini di Servizio', 'error');
        }
        setLoadingTos(false);
    };

    // 🔐 Save Security Questions
    const saveSecurityQuestions = async () => {
        if (!db) {
            showToast('❌ Database non disponibile', 'error');
            return;
        }

        if (!securityConfig.question1 || !securityConfig.answer1 || !securityConfig.question2 || !securityConfig.answer2) {
            showToast('❌ ' + (t.fillAllFields || 'Compila tutti i campi'), 'error');
            return;
        }

        try {
            // 💾 Salva in Firebase (domande e risposte in chiaro per backup admin)
            const dataToSave = {
                note: '🔐 Domande di sicurezza per recupero password admin123 - SALVATE IN CHIARO per backup',
                question1: securityConfig.question1,
                question2: securityConfig.question2,
                answer1: securityConfig.answer1,
                answer2: securityConfig.answer2,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                // Backup leggibile per admin database
                readableBackup: {
                    domanda1: securityConfig.question1,
                    risposta1: securityConfig.answer1,
                    domanda2: securityConfig.question2,
                    risposta2: securityConfig.answer2
                }
            };
            
            console.log('💾 Saving security questions to Firebase:', dataToSave);
            await db.collection('settings').doc('securityQuestions').set(dataToSave, { merge: true });
            console.log('✅ Security questions saved successfully!');

            showToast('✅ ' + (t.securityQuestionsSaved || 'Domande di sicurezza salvate!'), 'success');
            setSecurityConfig({ question1: '', answer1: '', question2: '', answer2: '' });
        } catch (e) {
            console.error('Error saving security questions:', e);
            showToast('❌ Errore salvataggio', 'error');
        }
    };

    // ==================== COMPANIES MANAGEMENT (Multi-Logo System) ====================
    const addCompany = async (companyName, logoFile) => {
        if (!db || !storage) {
            showToast('❌ Database/Storage non disponibile', 'error');
            return;
        }

        if (!companyName || !companyName.trim()) {
            showToast('❌ Inserisci il nome dell\'azienda', 'error');
            return;
        }

        try {
            showToast('⏳ Aggiunta azienda...', 'info');
            
            let logoURL = '';
            let logoPath = '';
            
            // Upload logo se presente
            if (logoFile) {
                const path = `company-logos/${companyName.trim()}_${Date.now()}.${logoFile.type.split('/')[1]}`;
                const storageRef = storage.ref(path);
                const uploadTask = await storageRef.put(logoFile);
                logoURL = await uploadTask.ref.getDownloadURL();
                logoPath = path;
            }
            
            // Crea documento company
            const companyData = {
                name: companyName.trim(),
                logoURL: logoURL,
                logoPath: logoPath,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: companies.length === 0 // Prima azienda è attiva di default
            };
            
            const docRef = await db.collection('companies').add(companyData);
            
            // Se è la prima azienda, impostala come attiva
            if (companies.length === 0) {
                setActiveCompanyId(docRef.id);
            }
            
            showToast('✅ Azienda aggiunta con successo', 'success');
        } catch (error) {
            console.error('Errore aggiunta azienda:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            showToast(`❌ Errore: ${error.message || 'Errore aggiunta azienda'}`, 'error');
        }
    };

    const updateCompany = async (companyId, updates, newLogoFile = null) => {
        if (!db || !storage) return;
        
        try {
            const updateData = { ...updates };
            
            // Upload nuovo logo se presente
            if (newLogoFile) {
                const company = companies.find(c => c.id === companyId);
                
                // Elimina vecchio logo se esiste
                if (company?.logoPath) {
                    try {
                        await storage.ref(company.logoPath).delete();
                    } catch (err) {
                        console.log('Vecchio logo già eliminato');
                    }
                }
                
                // Upload nuovo logo
                const path = `company-logos/${updates.name || company.name}_${Date.now()}.${newLogoFile.type.split('/')[1]}`;
                const uploadTask = await storage.ref(path).put(newLogoFile);
                updateData.logoURL = await uploadTask.ref.getDownloadURL();
                updateData.logoPath = path;
            }
            
            await db.collection('companies').doc(companyId).update(updateData);
            showToast('✅ Azienda aggiornata', 'success');
        } catch (error) {
            console.error('Errore aggiornamento azienda:', error);
            showToast('❌ Errore aggiornamento', 'error');
        }
    };

    const deleteCompany = async (companyId) => {
        if (!db || !storage) return;
        
        const company = companies.find(c => c.id === companyId);
        if (!company) return;
        
        if (!confirm(`Eliminare "${company.name}"? Questa azione è irreversibile.`)) return;
        
        try {
            // Elimina logo da Storage
            if (company.logoPath) {
                try {
                    await storage.ref(company.logoPath).delete();
                } catch (err) {
                    console.log('Logo già eliminato');
                }
            }
            
            // Elimina documento
            await db.collection('companies').doc(companyId).delete();
            
            // Se era l'azienda attiva, seleziona la prima disponibile
            if (activeCompanyId === companyId) {
                const remaining = companies.filter(c => c.id !== companyId);
                setActiveCompanyId(remaining.length > 0 ? remaining[0].id : null);
            }
            
            showToast('🗑️ Azienda eliminata', 'info');
        } catch (error) {
            console.error('Errore eliminazione azienda:', error);
            showToast('❌ Errore eliminazione', 'error');
        }
    };

    const setActiveCompany = async (companyId) => {
        setActiveCompanyId(companyId);
        
        // Opzionale: salva in Firestore per persistenza tra sessioni
        if (db) {
            try {
                await db.collection('settings').doc('general').set({
                    activeCompanyId: companyId,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error('Errore salvataggio azienda attiva:', error);
            }
        }
    };

    // 🔑 Change Admin Password
    const changeAdminPassword = async () => {
        if (!db) {
            showToast('❌ Database non disponibile', 'error');
            return;
        }

        try {
            // Carica password attuale da Firebase (in chiaro)
            const authDoc = await db.collection('settings').doc('adminAuth').get();
            if (!authDoc.exists) {
                showToast('❌ Configurazione autenticazione non trovata', 'error');
                return;
            }

            const currentPasswordFromDB = authDoc.data().password;

            // Verifica password attuale (confronto diretto)
            if (passwordChange.currentPassword !== currentPasswordFromDB) {
                showToast('❌ ' + (t.wrongPassword || 'Password attuale errata'), 'error');
                return;
            }

            // Valida nuova password
            if (passwordChange.newPassword.length < 6) {
                showToast('❌ ' + (t.passwordTooShort || 'Password troppo corta (minimo 6 caratteri)'), 'error');
                return;
            }

            if (passwordChange.newPassword !== passwordChange.confirmPassword) {
                showToast('❌ ' + (t.passwordMismatch || 'Le password non corrispondono'), 'error');
                return;
            }

            // 💾 Salva in Firebase (password in chiaro per admin123 di sistema)
            await db.collection('settings').doc('adminAuth').set({
                note: 'Password default: admin123 - CAMBIARLA SUBITO!',
                password: passwordChange.newPassword,
                passwordHash: '240be51bfabd2724ddb6f04ee61da59674f8d7e031c08c8f',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedVia: 'settings'
            }, { merge: true });

            showToast('✅ ' + (t.passwordChanged || 'Password cambiata con successo!'), 'success');
            setPasswordChange({ currentPassword: '', newPassword: '', confirmPassword: '' });

            // Invalida sessione corrente per forzare nuovo login
            localStorage.removeItem('adminAuth');
            
            // Mostra conferma con opzione di fare logout
            if (confirm((t.passwordChangedLogout || 'Password cambiata! Vuoi fare logout ora per testare la nuova password?'))) {
                window.location.reload();
            }
        } catch (e) {
            console.error('Error changing password:', e);
            showToast('❌ Errore cambio password', 'error');
        }
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

    // ==================== ACTIVITY TYPES MANAGEMENT ====================
    const handleAddActivity = async () => {
        if (!activityForm.nome.trim()) {
            showToast(t.activityNameRequired || '⚠️ Nome attività obbligatorio', 'warning');
            return;
        }

        const newActivity = {
            id: Date.now().toString(),
            nome: activityForm.nome.trim(),
            emoji: activityForm.emoji,
            colore: activityForm.colore
        };

        const updatedActivities = [...(appSettings?.tipiAttivita || []), newActivity];

        try {
            await db.collection('settings').doc('activityTypes').set({
                tipiAttivita: updatedActivities
            });
            setAppSettings({ ...appSettings, tipiAttivita: updatedActivities });
            showToast(t.activityAdded || '✅ Attività aggiunta', 'success');
            setShowActivityModal(false);
            setActivityForm({ nome: '', emoji: '📋', colore: '#3B82F6' });
        } catch (error) {
            console.error('Error adding activity:', error);
            showToast('❌ Errore durante l\'aggiunta', 'error');
        }
    };

    const handleEditActivity = async () => {
        if (!activityForm.nome.trim()) {
            showToast(t.activityNameRequired || '⚠️ Nome attività obbligatorio', 'warning');
            return;
        }

        const updatedActivities = (appSettings?.tipiAttivita || []).map(act =>
            act.id === editingActivity.id
                ? { ...act, nome: activityForm.nome.trim(), emoji: activityForm.emoji, colore: activityForm.colore }
                : act
        );

        try {
            await db.collection('settings').doc('activityTypes').set({
                tipiAttivita: updatedActivities
            });
            setAppSettings({ ...appSettings, tipiAttivita: updatedActivities });
            showToast(t.activityUpdated || '✅ Attività aggiornata', 'success');
            setShowActivityModal(false);
            setEditingActivity(null);
            setActivityForm({ nome: '', emoji: '📋', colore: '#3B82F6' });
        } catch (error) {
            console.error('Error updating activity:', error);
            showToast('❌ Errore durante l\'aggiornamento', 'error');
        }
    };

    const handleDeleteActivity = async (activityId) => {
        if (!confirm(t.confirmDeleteActivity || '⚠️ Eliminare questa attività?')) {
            return;
        }

        const updatedActivities = (appSettings?.tipiAttivita || []).filter(act => act.id !== activityId);

        try {
            await db.collection('settings').doc('activityTypes').set({
                tipiAttivita: updatedActivities
            });
            setAppSettings({ ...appSettings, tipiAttivita: updatedActivities });
            showToast(t.activityDeleted || '✅ Attività eliminata', 'success');
        } catch (error) {
            console.error('Error deleting activity:', error);
            showToast('❌ Errore durante l\'eliminazione', 'error');
        }
    };

    const openAddActivityModal = () => {
        setActivityForm({ nome: '', emoji: '📋', colore: '#3B82F6' });
        setEditingActivity(null);
        setShowActivityModal(true);
    };

    const openEditActivityModal = (activity) => {
        setActivityForm({ nome: activity.nome, emoji: activity.emoji, colore: activity.colore });
        setEditingActivity(activity);
        setShowActivityModal(true);
    };

    // ==================== COMPANIES MANAGEMENT ====================
    const handleAddCompany = async () => {
        if (!companyForm.nome.trim()) {
            showToast('⚠️ Nome azienda obbligatorio', 'warning');
            return;
        }

        try {
            const companyData = {
                name: companyForm.nome.trim(),
                logoURL: companyForm.logo || '',
                logoPath: '',
                color: companyForm.colore,
                partitaIva: companyForm.partitaIva.trim(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: companies.length === 0
            };
            
            const docRef = await db.collection('companies').add(companyData);
            
            // Se è la prima azienda, impostala come attiva
            if (companies.length === 0) {
                setActiveCompanyId(docRef.id);
            }
            
            showToast('✅ Azienda aggiunta', 'success');
            setShowCompanyModal(false);
            setCompanyForm({ nome: '', logo: '', colore: '#10B981', partitaIva: '' });
        } catch (error) {
            console.error('Error adding company:', error);
            showToast('❌ Errore durante l\'aggiunta', 'error');
        }
    };

    const handleEditCompany = async () => {
        if (!companyForm.nome.trim()) {
            showToast('⚠️ Nome azienda obbligatorio', 'warning');
            return;
        }

        try {
            const updateData = {
                name: companyForm.nome.trim(),
                logoURL: companyForm.logo || '',
                color: companyForm.colore,
                partitaIva: companyForm.partitaIva.trim()
            };
            
            await db.collection('companies').doc(editingCompany.id).update(updateData);
            
            showToast('✅ Azienda aggiornata', 'success');
            setShowCompanyModal(false);
            setEditingCompany(null);
            setCompanyForm({ nome: '', logo: '', colore: '#10B981', partitaIva: '' });
        } catch (error) {
            console.error('Error updating company:', error);
            showToast('❌ Errore durante l\'aggiornamento', 'error');
        }
    };

    const handleDeleteCompany = async (companyId) => {
        const company = companies.find(c => c.id === companyId);
        if (!company) return;
        
        if (!confirm(`⚠️ Eliminare "${company.name}"? Questa azione è irreversibile.`)) {
            return;
        }

        try {
            // Elimina logo da Storage se presente
            if (company.logoPath && storage) {
                try {
                    await storage.ref(company.logoPath).delete();
                } catch (err) {
                    console.log('Logo già eliminato o non presente');
                }
            }
            
            // Elimina documento dalla collezione companies
            await db.collection('companies').doc(companyId).delete();
            
            // Se era l'azienda attiva, seleziona la prima disponibile
            if (activeCompanyId === companyId) {
                const remaining = companies.filter(c => c.id !== companyId);
                setActiveCompanyId(remaining.length > 0 ? remaining[0].id : null);
            }
            
            showToast('✅ Azienda eliminata', 'success');
        } catch (error) {
            console.error('Error deleting company:', error);
            showToast('❌ Errore durante l\'eliminazione', 'error');
        }
    };

    const openAddCompanyModal = () => {
        setCompanyForm({ nome: '', logo: '', colore: '#10B981', partitaIva: '' });
        setEditingCompany(null);
        setShowCompanyModal(true);
    };

    const openEditCompanyModal = (company) => {
        setCompanyForm({ 
            nome: company.name || company.nome || '', 
            logo: company.logoURL || company.logo || '', 
            colore: company.color || company.colore || '#10B981', 
            partitaIva: company.partitaIva || '' 
        });
        setEditingCompany(company);
        setShowCompanyModal(true);
    };

    // ==================== ADDRESSES MANAGEMENT ====================
    const handleAddAddress = async () => {
        if (!addressForm.nome.trim() || !addressForm.indirizzo.trim()) {
            showToast('⚠️ Nome e indirizzo obbligatori', 'warning');
            return;
        }

        const addressId = Date.now().toString();
        const newAddress = {
            name: addressForm.nome.trim(),
            street: addressForm.indirizzo.trim(),
            city: addressForm.citta.trim(),
            zipCode: addressForm.cap.trim(),
            province: addressForm.provincia.trim(),
            emoji: addressForm.emoji,
            color: addressForm.colore,
            googleMapsUrl: addressForm.googleMapsUrl.trim(),
            createdAt: new Date().toISOString()
        };

        try {
            await db.collection('addresses').doc(addressId).set(newAddress);
            showToast('✅ Indirizzo aggiunto', 'success');
            setShowAddressModal(false);
            setAddressForm({ nome: '', indirizzo: '', citta: '', cap: '', provincia: '', emoji: '📍', colore: '#8B5CF6', googleMapsUrl: '' });
        } catch (error) {
            console.error('Error adding address:', error);
            showToast('❌ Errore durante l\'aggiunta', 'error');
        }
    };

    const handleEditAddress = async () => {
        if (!addressForm.nome.trim() || !addressForm.indirizzo.trim()) {
            showToast('⚠️ Nome e indirizzo obbligatori', 'warning');
            return;
        }

        const updatedAddress = {
            name: addressForm.nome.trim(),
            street: addressForm.indirizzo.trim(),
            city: addressForm.citta.trim(),
            zipCode: addressForm.cap.trim(),
            province: addressForm.provincia.trim(),
            emoji: addressForm.emoji,
            color: addressForm.colore,
            googleMapsUrl: addressForm.googleMapsUrl.trim()
        };

        try {
            await db.collection('addresses').doc(editingAddress.id).update(updatedAddress);
            showToast('✅ Indirizzo aggiornato', 'success');
            setShowAddressModal(false);
            setEditingAddress(null);
            setAddressForm({ nome: '', indirizzo: '', citta: '', cap: '', provincia: '', emoji: '📍', colore: '#8B5CF6', googleMapsUrl: '' });
        } catch (error) {
            console.error('Error updating address:', error);
            showToast('❌ Errore durante l\'aggiornamento', 'error');
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!confirm('⚠️ Eliminare questo indirizzo?')) {
            return;
        }

        try {
            await db.collection('addresses').doc(addressId).delete();
            showToast('✅ Indirizzo eliminato', 'success');
        } catch (error) {
            console.error('Error deleting address:', error);
            showToast('❌ Errore durante l\'eliminazione', 'error');
        }
    };

    const openAddAddressModal = () => {
        setAddressForm({ nome: '', indirizzo: '', citta: '', cap: '', provincia: '', emoji: '📍', colore: '#8B5CF6', googleMapsUrl: '' });
        setEditingAddress(null);
        setShowAddressModal(true);
    };

    const openEditAddressModal = (address) => {
        // Map NEW system fields (street, city, zipCode) to form fields (indirizzo, citta, cap)
        setAddressForm({ 
            nome: address.name || address.nome || '',
            indirizzo: address.street || address.indirizzo || '', 
            citta: address.city || address.citta || '', 
            cap: address.zipCode || address.cap || '', 
            provincia: address.province || address.provincia || '', 
            emoji: address.emoji || '📍', 
            colore: address.color || address.colore || '#8B5CF6', 
            googleMapsUrl: address.googleMapsUrl || '' 
        });
        setEditingAddress(address);
        setShowAddressModal(true);
    };

    const generateGoogleMapsUrl = () => {
        const fullAddress = `${addressForm.indirizzo}, ${addressForm.cap} ${addressForm.citta}${addressForm.provincia ? ` (${addressForm.provincia})` : ''}`;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
        setAddressForm({ ...addressForm, googleMapsUrl: url });
        showToast('✅ Link Google Maps generato', 'success');
    };

    // Salva indirizzo recente come fisso
    const saveRecentAsFixed = async (recentAddress) => {
        const addressName = prompt('📍 Dai un nome a questo indirizzo:', recentAddress.address.substring(0, 30));
        if (!addressName || !addressName.trim()) return;

        try {
            const newAddress = {
                name: addressName.trim(),
                street: recentAddress.address,
                city: '',
                zipCode: '',
                province: '',
                emoji: '📍',
                color: '#8B5CF6',
                googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(recentAddress.address)}`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                source: 'promoted'
            };

            await db.collection('addresses').add(newAddress);
            
            // Elimina da recentAddresses per evitare duplicati
            await db.collection('recentAddresses').doc(recentAddress.id).delete();
            
            showToast('✅ Indirizzo salvato come fisso', 'success');
        } catch (error) {
            console.error('Error promoting address:', error);
            showToast('❌ Errore durante il salvataggio', 'error');
        }
    };

    // Elimina indirizzo recente
    const deleteRecentAddress = async (recentId) => {
        if (!confirm('⚠️ Eliminare questo indirizzo recente?')) return;

        try {
            await db.collection('recentAddresses').doc(recentId).delete();
            showToast('✅ Indirizzo recente eliminato', 'success');
        } catch (error) {
            console.error('Error deleting recent address:', error);
            showToast('❌ Errore durante l\'eliminazione', 'error');
        }
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
            ),
            // Worker View-Only Warning
            isWorker && React.createElement('div', { 
                className: `mt-4 p-3 rounded-lg ${darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border-2`
            },
                React.createElement('p', { className: `text-sm font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}` },
                    '👁️ Modalità Solo Visualizzazione - Non puoi modificare le impostazioni'
                )
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

                // Save button (solo se può modificare)
                canModifySettings && React.createElement('button', {
                    onClick: saveSettings,
                    disabled: saving,
                    className: 'w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-lg transition-colors shadow-lg'
                }, saving ? '⏳ ' + (t.saving || 'Salvataggio') + '...' : '💾 ' + (t.saveSettings || 'Salva Impostazioni'))
            )
        ),

        // ========== SEZIONE: NOTIFICHE ========== (NON per worker)
        !isWorker && React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
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

                // Auto-archiviazione (solo Manager e Admin)
                window.hasRoleAccess(currentUser, 'settings.modify') && React.createElement('div', {},
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

                // Save button (solo se può modificare)
                canModifySettings && React.createElement('button', {
                    onClick: saveSettings,
                    disabled: saving,
                    className: 'w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-lg transition-colors shadow-lg'
                }, saving ? '⏳ ' + (t.saving || 'Salvataggio') + '...' : '💾 ' + (t.saveSettings || 'Salva Impostazioni'))
            )
        ),

        // ========== SEZIONE: PRIVACY ========== (solo Manager e Admin)
        window.hasRoleAccess(currentUser, 'settings.modify') && React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
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

        // ========== SEZIONE: GDPR (View-Only per Worker) ==========
        isWorker && React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '🔒', 
                title: 'Privacy & GDPR', 
                sectionKey: 'privacy' 
            }),
            
            expandedSection === 'privacy' && React.createElement('div', { className: 'p-4 space-y-4 animate-fade-in' },
                React.createElement('h3', { className: subSectionHeaderClass },
                    '📜 Informativa Privacy'
                ),
                React.createElement('div', { 
                    className: `p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`,
                    style: { maxHeight: '200px', overflowY: 'auto' }
                },
                    React.createElement('p', { className: textClass, style: { whiteSpace: 'pre-wrap' } },
                        gdprText || 'Nessuna informativa configurata'
                    )
                )
            )
        ),

        // ========== SEZIONE: TERMINI DI SERVIZIO ========== (solo Manager e Admin)
        window.hasRoleAccess(currentUser, 'settings.modify') && React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '📜', 
                title: t.termsOfService || 'Termini di Servizio', 
                sectionKey: 'termsOfService' 
            }),
            
            expandedSection === 'termsOfService' && React.createElement('div', { className: 'p-4 space-y-4 animate-fade-in' },
                React.createElement('h3', { className: subSectionHeaderClass },
                    '📋 ' + (t.tosNotice || 'Termini e Condizioni')
                ),
                React.createElement('p', { className: textClass + ' text-sm mb-3' },
                    t.tosDescription || 'Testo mostrato ai lavoratori prima della firma (accettazione obbligatoria)'
                ),
                
                editingTos
                    ? React.createElement('div', {},
                        React.createElement('textarea', {
                            value: tosText,
                            onChange: (e) => setTosText(e.target.value),
                            rows: 10,
                            className: inputClass + ' p-3 rounded border w-full',
                            placeholder: 'Inserisci i Termini di Servizio...'
                        }),
                        React.createElement('div', { className: 'flex gap-2 mt-3' },
                            React.createElement('button', {
                                onClick: saveTosText,
                                disabled: loadingTos,
                                className: 'flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors'
                            }, loadingTos ? '⏳ Salvataggio...' : '💾 Salva'),
                            React.createElement('button', {
                                onClick: () => setEditingTos(false),
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
                                tosText || (t.noTosText || 'Nessun testo configurato')
                            )
                        ),
                        React.createElement('button', {
                            onClick: () => setEditingTos(true),
                            className: 'mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors'
                        }, '✏️ ' + (t.edit || 'Modifica'))
                    )
            )
        ),

        // ========== SEZIONE: TERMINI DI SERVIZIO (View-Only per Worker) ==========
        isWorker && React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '📜', 
                title: 'Termini di Servizio', 
                sectionKey: 'termsOfService' 
            }),
            
            expandedSection === 'termsOfService' && React.createElement('div', { className: 'p-4 space-y-4 animate-fade-in' },
                React.createElement('h3', { className: subSectionHeaderClass },
                    '📋 Termini e Condizioni'
                ),
                React.createElement('div', { 
                    className: `p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`,
                    style: { maxHeight: '200px', overflowY: 'auto' }
                },
                    React.createElement('p', { className: textClass, style: { whiteSpace: 'pre-wrap' } },
                        tosText || 'Nessun termine configurato'
                    )
                )
            )
        ),

        // ========== SEZIONE: TIPI ATTIVITÀ ==========
        React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-3 sm:p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '🏷️', 
                title: t.manageActivityTypes || 'Gestione Tipi Attività', 
                sectionKey: 'activityTypes',
                count: appSettings?.tipiAttivita?.length || 0
            }),
            
            expandedSection === 'activityTypes' && React.createElement('div', { className: 'p-3 sm:p-4 space-y-4 sm:space-y-6 animate-fade-in' },
                // Header con pulsante aggiungi (solo se non worker)
                React.createElement('div', { className: 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4' },
                    React.createElement('h3', { className: subSectionHeaderClass },
                        '🎯 ' + (t.activityTypes || 'Tipi di Attività')
                    ),
                    canModifySettings && React.createElement('button', {
                        onClick: openAddActivityModal,
                        className: 'w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px]'
                    }, '➕ ' + (t.addActivityType || 'Aggiungi Attività'))
                ),

                // Lista attività
                (appSettings?.tipiAttivita || []).length === 0
                    ? React.createElement('div', { className: `p-8 rounded-lg border-2 border-dashed text-center ${darkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'}` },
                        React.createElement('p', { className: textClass + ' text-lg mb-2' }, '📋'),
                        React.createElement('p', { className: textClass }, t.noActivitiesConfigured || 'Nessuna attività configurata')
                    )
                    : React.createElement('div', { className: 'space-y-3' },
                        ...(appSettings?.tipiAttivita || []).map(activity =>
                            React.createElement('div', { 
                                key: activity.id,
                                className: `flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${darkMode ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`,
                                style: { borderLeftWidth: '6px', borderLeftColor: activity.colore }
                            },
                                React.createElement('div', { className: 'flex items-center gap-3 w-full sm:w-auto' },
                                    React.createElement('span', { 
                                        className: 'text-2xl sm:text-3xl',
                                        style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }
                                    }, activity.emoji),
                                    React.createElement('div', { className: 'flex-1' },
                                        React.createElement('p', { className: 'font-semibold text-sm sm:text-base ' + (darkMode ? 'text-gray-100' : 'text-gray-900') }, 
                                            activity.nome
                                        ),
                                        React.createElement('p', { className: 'text-xs ' + textClass },
                                            activity.colore.toUpperCase()
                                        )
                                    )
                                ),
                                canModifySettings && React.createElement('div', { className: 'flex flex-row gap-2 w-full sm:w-auto flex-shrink-0' },
                                    React.createElement('button', {
                                        onClick: () => openEditActivityModal(activity),
                                        className: 'flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap min-h-[44px]'
                                    }, '✏️ ' + (t.edit || 'Modifica')),
                                    React.createElement('button', {
                                        onClick: () => handleDeleteActivity(activity.id),
                                        className: 'flex-1 sm:flex-none px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap min-h-[44px]'
                                    }, '🗑️ ' + (t.delete || 'Elimina'))
                                )
                            )
                        )
                    )
            )
        ),

        // ========== SEZIONE: GESTIONE AZIENDE ==========
        window.hasRoleAccess(currentUser, 'settings.companies') && React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-3 sm:p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '🏢', 
                title: 'Gestione Aziende', 
                sectionKey: 'companies',
                count: companies.length || 0
            }),
            
            expandedSection === 'companies' && React.createElement('div', { className: 'p-3 sm:p-4 space-y-4 sm:space-y-6 animate-fade-in' },
                React.createElement('div', { className: 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4' },
                    React.createElement('h3', { className: subSectionHeaderClass },
                        '🏢 Aziende Configurate'
                    ),
                    canModifySettings && React.createElement('button', {
                        onClick: openAddCompanyModal,
                        className: 'w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px]'
                    }, '➕ Aggiungi Azienda')
                ),

                companies.length === 0
                    ? React.createElement('div', { className: `p-8 rounded-lg border-2 border-dashed text-center ${darkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'}` },
                        React.createElement('p', { className: textClass + ' text-lg mb-2' }, '🏢'),
                        React.createElement('p', { className: textClass }, 'Nessuna azienda configurata')
                    )
                    : React.createElement('div', { className: 'space-y-3' },
                        ...companies.map(company =>
                            React.createElement('div', { 
                                key: company.id,
                                className: `flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${darkMode ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`,
                                style: { borderLeftWidth: '6px', borderLeftColor: company.color || company.colore || '#10B981' }
                            },
                                React.createElement('div', { className: 'flex items-center gap-3 w-full sm:w-auto' },
                                    (company.logoURL || company.logo) && React.createElement('img', { 
                                        src: company.logoURL || company.logo,
                                        alt: company.name || company.nome,
                                        className: 'w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0'
                                    }),
                                    React.createElement('div', { className: 'flex-1 min-w-0' },
                                        React.createElement('p', { className: 'font-semibold text-sm sm:text-base truncate ' + (darkMode ? 'text-gray-100' : 'text-gray-900') }, 
                                            company.name || company.nome
                                        ),
                                        company.partitaIva && React.createElement('p', { className: 'text-xs truncate ' + textClass },
                                            'P.IVA: ' + company.partitaIva
                                        )
                                    )
                                ),
                                canModifySettings && React.createElement('div', { className: 'flex flex-row gap-2 w-full sm:w-auto flex-shrink-0' },
                                    React.createElement('button', {
                                        onClick: () => openEditCompanyModal(company),
                                        className: 'flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap min-h-[44px]'
                                    }, '✏️ Modifica'),
                                    React.createElement('button', {
                                        onClick: () => handleDeleteCompany(company.id),
                                        className: 'flex-1 sm:flex-none px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap min-h-[44px]'
                                    }, '🗑️ Elimina')
                                )
                            )
                        )
                    )
            )
        ),

        // ========== SEZIONE: GESTIONE INDIRIZZI ==========
        window.hasRoleAccess(currentUser, 'settings.addresses') && React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-3 sm:p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '📍', 
                title: 'Gestione Indirizzi', 
                sectionKey: 'addresses',
                count: appSettings?.addresses?.length || 0
            }),
            
            expandedSection === 'addresses' && React.createElement('div', { className: 'p-3 sm:p-4 space-y-4 sm:space-y-6 animate-fade-in' },
                // Tab Selector
                React.createElement('div', { className: 'flex gap-2 mb-4 border-b overflow-x-auto ' + (darkMode ? 'border-gray-700' : 'border-gray-200') },
                    React.createElement('button', {
                        onClick: () => setAddressTab('fixed'),
                        className: `px-3 sm:px-4 py-2 font-semibold text-sm sm:text-base whitespace-nowrap transition-colors ${addressTab === 'fixed' ? 'border-b-2 border-indigo-600 text-indigo-600' : textClass}`
                    }, '📌 Fissi (' + ((appSettings?.addresses || []).length) + ')'),
                    React.createElement('button', {
                        onClick: () => setAddressTab('recent'),
                        className: `px-3 sm:px-4 py-2 font-semibold text-sm sm:text-base whitespace-nowrap transition-colors ${addressTab === 'recent' ? 'border-b-2 border-indigo-600 text-indigo-600' : textClass}`
                    }, '🕒 Recenti (' + (recentAddresses.length) + ')')
                ),
                
                // Tab Content
                addressTab === 'fixed' ? React.createElement(React.Fragment, null,
                    React.createElement('div', { className: 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4' },
                        React.createElement('h3', { className: subSectionHeaderClass },
                            '📌 Indirizzi Fissi'
                        ),
                        window.hasRoleAccess(currentUser, 'settings.addresses.modify') && React.createElement('button', {
                            onClick: openAddAddressModal,
                            className: 'w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px]'
                        }, '➕ Aggiungi Indirizzo')
                    ),

                (appSettings?.addresses || []).length === 0
                    ? React.createElement('div', { className: `p-8 rounded-lg border-2 border-dashed text-center ${darkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'}` },
                        React.createElement('p', { className: textClass + ' text-lg mb-2' }, '📍'),
                        React.createElement('p', { className: textClass }, 'Nessun indirizzo configurato')
                    )
                    : React.createElement('div', { className: 'space-y-3' },
                        ...(appSettings?.addresses || []).map(address =>
                            React.createElement('div', { 
                                key: address.id,
                                className: `flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${darkMode ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`,
                                style: { borderLeftWidth: '6px', borderLeftColor: address.color || address.colore }
                            },
                                React.createElement('div', { className: 'flex items-start gap-3 flex-1 w-full sm:w-auto' },
                                    React.createElement('span', { 
                                        className: 'text-2xl sm:text-3xl flex-shrink-0',
                                        style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }
                                    }, address.emoji),
                                    React.createElement('div', { className: 'flex-1 min-w-0' },
                                        React.createElement('p', { className: 'font-semibold text-sm sm:text-base ' + (darkMode ? 'text-gray-100' : 'text-gray-900') }, 
                                            address.name || address.nome
                                        ),
                                        React.createElement('p', { className: 'text-xs break-words ' + textClass },
                                            `${address.street || address.indirizzo}, ${address.zipCode || address.cap} ${address.city || address.citta}${(address.province || address.provincia) ? ` (${address.province || address.provincia})` : ''}`
                                        )
                                    ),
                                    address.googleMapsUrl && React.createElement('a', {
                                        href: address.googleMapsUrl,
                                        target: '_blank',
                                        rel: 'noopener noreferrer',
                                        className: 'px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm transition-colors flex-shrink-0 min-h-[44px] flex items-center justify-center'
                                    }, '🗺️ Maps')
                                ),
                                window.hasRoleAccess(currentUser, 'settings.addresses.modify') && React.createElement('div', { className: 'flex flex-row gap-2 w-full sm:w-auto flex-shrink-0' },
                                    React.createElement('button', {
                                        onClick: () => openEditAddressModal(address),
                                        className: 'flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap min-h-[44px]'
                                    }, '✏️ Modifica'),
                                    React.createElement('button', {
                                        onClick: () => handleDeleteAddress(address.id),
                                        className: 'flex-1 sm:flex-none px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap min-h-[44px]'
                                    }, '🗑️ Elimina')
                                )
                            )
                        )
                    )
                ) : React.createElement(React.Fragment, null,
                    // Tab Recenti
                    React.createElement('div', { className: 'flex flex-col gap-2 mb-4' },
                        React.createElement('h3', { className: subSectionHeaderClass },
                            '🕒 Indirizzi Recenti (' + recentAddresses.length + ')'
                        ),
                        React.createElement('p', { className: 'text-xs ' + textClass },
                            'Indirizzi usati nei fogli, salvali come fissi per riutilizzarli'
                        )
                    ),

                    recentAddresses.length === 0
                        ? React.createElement('div', { className: `p-8 rounded-lg border-2 border-dashed text-center ${darkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'}` },
                            React.createElement('p', { className: textClass + ' text-lg mb-2' }, '🕒'),
                            React.createElement('p', { className: textClass }, 'Nessun indirizzo recente')
                        )
                        : React.createElement('div', { className: 'space-y-3' },
                            ...recentAddresses.map(recent =>
                                React.createElement('div', { 
                                    key: recent.id,
                                    className: `flex flex-col gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${darkMode ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`
                                },
                                    React.createElement('div', { className: 'flex items-start gap-3' },
                                        React.createElement('span', { className: 'text-xl sm:text-2xl flex-shrink-0' }, '🕒'),
                                        React.createElement('div', { className: 'flex-1 min-w-0' },
                                            React.createElement('p', { className: 'font-medium text-sm sm:text-base break-words ' + (darkMode ? 'text-gray-100' : 'text-gray-900') }, 
                                                recent.address
                                            ),
                                            React.createElement('p', { className: 'text-xs ' + textClass },
                                                `Usato ${recent.usedCount} ${recent.usedCount === 1 ? 'volta' : 'volte'}`
                                            )
                                        ),
                                        React.createElement('a', {
                                            href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(recent.address)}`,
                                            target: '_blank',
                                            rel: 'noopener noreferrer',
                                            className: 'px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm transition-colors flex-shrink-0 min-h-[44px] flex items-center justify-center'
                                        }, '🗺️')
                                    ),
                                    React.createElement('div', { className: 'flex flex-wrap gap-2' },
                                        window.hasRoleAccess(currentUser, 'settings.addresses.modify') && React.createElement('button', {
                                            onClick: () => saveRecentAsFixed(recent),
                                            className: 'flex-1 sm:flex-none px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap min-h-[44px]'
                                        }, '💾 Salva Fisso'),
                                        React.createElement('button', {
                                            onClick: () => {
                                                const text = `📍 ${recent.address}`;
                                                if (navigator.share) {
                                                    navigator.share({ text });
                                                } else {
                                                    navigator.clipboard.writeText(text);
                                                    showToast('📋 Indirizzo copiato!', 'success');
                                                }
                                            },
                                            className: 'flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap min-h-[44px]'
                                        }, '🔗 Condividi'),
                                        window.hasRoleAccess(currentUser, 'settings.addresses.modify') && React.createElement('button', {
                                            onClick: () => deleteRecentAddress(recent.id),
                                            className: 'flex-1 sm:flex-none px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm whitespace-nowrap min-h-[44px]'
                                        }, '🗑️')
                                    )
                                )
                            )
                        )
                )
            )
        ),

        // ========== SEZIONE: SICUREZZA ========== (SOLO per admin123 di sistema - NON per admin users registrati)
        (currentUser?.id === 'admin' || (currentUser?.role === 'admin' && !currentUser?.isPermanent)) && React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
            React.createElement(SectionHeader, { 
                icon: '🔐', 
                title: (t.securitySettings || 'Impostazioni di Sicurezza') + ' (Admin Sistema)', 
                sectionKey: 'security' 
            }),
            
            expandedSection === 'security' && React.createElement('div', { className: 'p-4 space-y-6 animate-fade-in' },
                // Cambio Password Admin
                React.createElement('div', {},
                    React.createElement('h3', { className: subSectionHeaderClass },
                        '🔑 ' + (t.changeAdminPassword || 'Cambia Password Admin')
                    ),
                    React.createElement('div', { className: 'space-y-3' },
                        React.createElement('input', {
                            type: 'password',
                            value: passwordChange.currentPassword,
                            onChange: (e) => setPasswordChange({...passwordChange, currentPassword: e.target.value}),
                            placeholder: t.currentPassword || 'Password Attuale',
                            className: inputClass + ' p-3 rounded-lg border w-full'
                        }),
                        React.createElement('input', {
                            type: 'password',
                            value: passwordChange.newPassword,
                            onChange: (e) => setPasswordChange({...passwordChange, newPassword: e.target.value}),
                            placeholder: t.newPassword || 'Nuova Password',
                            className: inputClass + ' p-3 rounded-lg border w-full'
                        }),
                        React.createElement('input', {
                            type: 'password',
                            value: passwordChange.confirmPassword,
                            onChange: (e) => setPasswordChange({...passwordChange, confirmPassword: e.target.value}),
                            placeholder: t.confirmPassword || 'Conferma Password',
                            className: inputClass + ' p-3 rounded-lg border w-full'
                        }),
                        React.createElement('button', {
                            onClick: changeAdminPassword,
                            className: 'w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors'
                        }, '🔄 ' + (t.changePassword || 'Cambia Password'))
                    ),
                    React.createElement('div', { className: `mt-3 p-3 rounded-lg ${darkMode ? 'bg-indigo-900/30 border border-indigo-700/50' : 'bg-indigo-50 border border-indigo-200'}` },
                        React.createElement('p', { className: textClass + ' text-xs' },
                            '✅ ' + (t.passwordHashInfo || 'La password viene salvata automaticamente in Firebase (nessun intervento manuale richiesto)')
                        )
                    )
                ),

                // Domande di Sicurezza
                React.createElement('div', {},
                    React.createElement('h3', { className: subSectionHeaderClass },
                        '🛡️ ' + (t.configureSecurityQuestions || 'Configura Domande di Sicurezza')
                    ),
                    React.createElement('p', { className: textClass + ' text-sm mb-3' },
                        t.securityQuestionsDescription || 'Imposta 2 domande di sicurezza per recuperare l\'accesso in caso di password dimenticata'
                    ),
                    React.createElement('div', { className: 'space-y-3' },
                        React.createElement('input', {
                            type: 'text',
                            value: securityConfig.question1,
                            onChange: (e) => setSecurityConfig({...securityConfig, question1: e.target.value}),
                            placeholder: t.question1Placeholder || 'Es: Qual è il nome del tuo primo animale domestico?',
                            className: inputClass + ' p-3 rounded-lg border w-full'
                        }),
                        React.createElement('input', {
                            type: 'text',
                            value: securityConfig.answer1,
                            onChange: (e) => setSecurityConfig({...securityConfig, answer1: e.target.value}),
                            placeholder: t.answer1Placeholder || 'Rispondi alla prima domanda',
                            className: inputClass + ' p-3 rounded-lg border w-full'
                        }),
                        React.createElement('input', {
                            type: 'text',
                            value: securityConfig.question2,
                            onChange: (e) => setSecurityConfig({...securityConfig, question2: e.target.value}),
                            placeholder: t.question2Placeholder || 'Es: In che città sei nato?',
                            className: inputClass + ' p-3 rounded-lg border w-full'
                        }),
                        React.createElement('input', {
                            type: 'text',
                            value: securityConfig.answer2,
                            onChange: (e) => setSecurityConfig({...securityConfig, answer2: e.target.value}),
                            placeholder: t.answer2Placeholder || 'Rispondi alla seconda domanda',
                            className: inputClass + ' p-3 rounded-lg border w-full'
                        }),
                        React.createElement('button', {
                            onClick: saveSecurityQuestions,
                            className: 'w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors'
                        }, '💾 ' + (t.saveSecurityQuestions || 'Salva Domande di Sicurezza'))
                    ),
                    React.createElement('p', { className: textClass + ' text-xs mt-2' },
                        '💡 ' + (t.securityQuestionsHint || 'Le domande e risposte saranno salvate in chiaro nel database')
                    )
                )
            )
        ),

        // ========== SEZIONE: BACKUP & RESTORE ========== (NON per worker)
        !isWorker && React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
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
                    (currentUser?.role === 'admin' || currentUser?.role === 'manager') && React.createElement('button', {
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
                    (currentUser?.role === 'admin' || currentUser?.role === 'manager') && React.createElement('label', {
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
                    currentUser?.role === 'admin' && React.createElement('button', {
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
                        .map((log, index) => {
                            // Traduci l'azione se disponibile
                            const translatedAction = t[log.action] || log.action;
                            
                            // Icona in base al tipo di azione
                            const getActionIcon = (action) => {
                                const a = action.toLowerCase();
                                if (a.includes('create')) return '➕';
                                if (a.includes('edit') || a.includes('update')) return '✏️';
                                if (a.includes('delete')) return '🗑️';
                                if (a.includes('archive')) return '📦';
                                if (a.includes('blacklist')) return '🚫';
                                return '📝';
                            };
                            
                            return React.createElement('div', {
                                key: log.id || index,
                                onClick: selectMode ? () => toggleLogSelection(log.id) : undefined,
                                className: `p-3 sm:p-4 rounded-lg border-l-4 transition-all ${
                                    selectMode && selectedLogs.includes(log.id)
                                        ? 'border-indigo-500 bg-indigo-900/20'
                                        : darkMode ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700' : 'border-gray-300 bg-white hover:bg-gray-50'
                                } ${selectMode ? 'cursor-pointer hover:border-indigo-400' : ''}`,
                                style: { 
                                    borderLeftColor: log.action.toLowerCase().includes('delete') ? '#EF4444' : 
                                                    log.action.toLowerCase().includes('create') ? '#10B981' : 
                                                    log.action.toLowerCase().includes('edit') || log.action.toLowerCase().includes('update') ? '#F59E0B' : '#6366F1'
                                }
                            },
                                React.createElement('div', { className: 'flex items-start justify-between gap-3' },
                                    React.createElement('div', { className: 'flex-1 min-w-0' },
                                        React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                            React.createElement('span', { className: 'text-lg flex-shrink-0' }, getActionIcon(log.action)),
                                            React.createElement('p', { className: 'font-bold text-sm sm:text-base ' + (darkMode ? 'text-white' : 'text-gray-900') }, 
                                                translatedAction
                                            )
                                        ),
                                        React.createElement('p', { className: textClass + ' text-xs sm:text-sm mb-2 break-words' }, log.details),
                                        React.createElement('div', { className: 'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ' + textClass },
                                            React.createElement('span', { className: 'flex items-center gap-1' },
                                                React.createElement('span', null, '👤'),
                                                React.createElement('span', { className: 'font-medium' }, log.user || 'Sistema')
                                            ),
                                            log.userRole && React.createElement('span', { className: 'flex items-center gap-1' },
                                                React.createElement('span', null, '🎭'),
                                                React.createElement('span', null, log.userRole)
                                            ),
                                            React.createElement('span', { className: 'flex items-center gap-1' },
                                                React.createElement('span', null, '🕒'),
                                                React.createElement('span', null, formatDateTime(log.timestamp?.toDate ? log.timestamp.toDate() : log.timestamp))
                                            )
                                        )
                                    ),
                                    selectMode && React.createElement('input', {
                                        type: 'checkbox',
                                        checked: selectedLogs.includes(log.id),
                                        onChange: () => toggleLogSelection(log.id),
                                        className: 'w-5 h-5 rounded flex-shrink-0 mt-1',
                                        onClick: (e) => e.stopPropagation()
                                    })
                                )
                            );
                        })
                ),

                auditLog.length === 0 && React.createElement('div', { 
                    className: `text-center py-8 ${textClass}` 
                },
                    '📭 ' + (t.noAuditLogs || 'Nessun log presente')
                )
            )
        ),

        // ========== SEZIONE: AVANZATE (CHANGELOG) ==========
        window.hasRoleAccess(currentUser, 'settings.advanced') && React.createElement('div', { className: cardClass + ' rounded-xl shadow-lg p-4 space-y-3' },
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
        ),

        // ========== MODAL: AGGIUNGI/MODIFICA ATTIVITÀ ==========
        showActivityModal && React.createElement('div', { 
            className: 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50',
            onClick: () => {
                setShowActivityModal(false);
                setEditingActivity(null);
                setActivityForm({ nome: '', emoji: '📋', colore: '#3B82F6' });
            }
        },
            React.createElement('div', { 
                className: `${cardClass} rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in`,
                onClick: (e) => e.stopPropagation()
            },
                // Modal Header
                React.createElement('div', { className: 'flex items-center justify-between mb-6' },
                    React.createElement('h2', { className: 'text-2xl font-bold ' + (darkMode ? 'text-gray-100' : 'text-gray-900') },
                        editingActivity 
                            ? '✏️ ' + (t.editActivityType || 'Modifica Attività')
                            : '➕ ' + (t.addActivityType || 'Aggiungi Attività')
                    ),
                    React.createElement('button', {
                        onClick: () => {
                            setShowActivityModal(false);
                            setEditingActivity(null);
                            setActivityForm({ nome: '', emoji: '📋', colore: '#3B82F6' });
                        },
                        className: 'text-2xl hover:opacity-70 transition-opacity'
                    }, '✖️')
                ),

                // Form
                React.createElement('div', { className: 'space-y-4' },
                    // Nome
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            t.activityName || 'Nome Attività'
                        ),
                        React.createElement('input', {
                            type: 'text',
                            value: activityForm.nome,
                            onChange: (e) => setActivityForm({ ...activityForm, nome: e.target.value }),
                            placeholder: t.activityNamePlaceholder || 'es. Magazzino, Evento, Trasloco...',
                            className: inputClass + ' w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-indigo-500'
                        })
                    ),

                    // Emoji
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            t.activityEmoji || 'Emoji'
                        ),
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('span', { className: 'text-5xl' }, activityForm.emoji),
                            React.createElement('input', {
                                type: 'text',
                                value: activityForm.emoji,
                                onChange: (e) => setActivityForm({ ...activityForm, emoji: e.target.value.slice(0, 2) }),
                                maxLength: 2,
                                placeholder: '🏢',
                                className: inputClass + ' flex-1 px-4 py-3 rounded-lg border-2 text-center text-2xl'
                            })
                        )
                    ),

                    // Colore
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            t.activityColor || 'Colore'
                        ),
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('div', { 
                                className: 'w-16 h-16 rounded-lg border-2 shadow-inner',
                                style: { backgroundColor: activityForm.colore, borderColor: darkMode ? '#374151' : '#D1D5DB' }
                            }),
                            React.createElement('input', {
                                type: 'color',
                                value: activityForm.colore,
                                onChange: (e) => setActivityForm({ ...activityForm, colore: e.target.value }),
                                className: 'flex-1 h-12 rounded-lg border-2 cursor-pointer'
                            }),
                            React.createElement('input', {
                                type: 'text',
                                value: activityForm.colore,
                                onChange: (e) => setActivityForm({ ...activityForm, colore: e.target.value }),
                                placeholder: '#3B82F6',
                                className: inputClass + ' w-28 px-3 py-2 rounded-lg border-2 text-sm font-mono'
                            })
                        )
                    ),

                    // Pulsanti
                    React.createElement('div', { className: 'flex gap-3 pt-4' },
                        React.createElement('button', {
                            onClick: () => {
                                setShowActivityModal(false);
                                setEditingActivity(null);
                                setActivityForm({ nome: '', emoji: '📋', colore: '#3B82F6' });
                            },
                            className: 'flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors'
                        }, '✖️ ' + (t.cancel || 'Annulla')),
                        React.createElement('button', {
                            onClick: editingActivity ? handleEditActivity : handleAddActivity,
                            className: 'flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors'
                        }, editingActivity 
                            ? '💾 ' + (t.save || 'Salva')
                            : '➕ ' + (t.add || 'Aggiungi')
                        )
                    )
                )
            )
        ),

        // ========== MODAL: AGGIUNGI/MODIFICA AZIENDA ==========
        showCompanyModal && React.createElement('div', { 
            className: 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50',
            onClick: () => {
                setShowCompanyModal(false);
                setEditingCompany(null);
                setCompanyForm({ nome: '', logo: '', colore: '#10B981', partitaIva: '' });
            }
        },
            React.createElement('div', { 
                className: `${cardClass} rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in`,
                onClick: (e) => e.stopPropagation()
            },
                React.createElement('div', { className: 'flex items-center justify-between mb-6' },
                    React.createElement('h2', { className: 'text-2xl font-bold ' + (darkMode ? 'text-gray-100' : 'text-gray-900') },
                        editingCompany ? '✏️ Modifica Azienda' : '➕ Aggiungi Azienda'
                    ),
                    React.createElement('button', {
                        onClick: () => {
                            setShowCompanyModal(false);
                            setEditingCompany(null);
                            setCompanyForm({ nome: '', logo: '', colore: '#10B981', partitaIva: '' });
                        },
                        className: 'text-2xl hover:opacity-70 transition-opacity'
                    }, '✖️')
                ),
                React.createElement('div', { className: 'space-y-4' },
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            'Nome Azienda *'
                        ),
                        React.createElement('input', {
                            type: 'text',
                            value: companyForm.nome,
                            onChange: (e) => setCompanyForm({ ...companyForm, nome: e.target.value }),
                            placeholder: 'es. 4MKTG S.r.l.',
                            className: inputClass + ' w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-indigo-500'
                        })
                    ),
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            'Logo (opzionale)'
                        ),
                        companyForm.logo && React.createElement('div', { className: 'mb-3 flex items-center gap-3' },
                            React.createElement('img', { 
                                src: companyForm.logo,
                                alt: 'Preview logo',
                                className: 'w-20 h-20 object-contain rounded border ' + (darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50')
                            }),
                            React.createElement('button', {
                                onClick: () => setCompanyForm({ ...companyForm, logo: '' }),
                                className: 'px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors'
                            }, '🗑️ Rimuovi')
                        ),
                        React.createElement('input', {
                            type: 'file',
                            accept: 'image/*',
                            onChange: async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                
                                // Carica su Firebase Storage
                                try {
                                    showToast('⏳ Caricamento logo...', 'info');
                                    const path = `company-logos/${companyForm.nome.trim() || 'company'}_${Date.now()}.${file.type.split('/')[1]}`;
                                    const uploadTask = await storage.ref(path).put(file);
                                    const downloadURL = await uploadTask.ref.getDownloadURL();
                                    setCompanyForm({ ...companyForm, logo: downloadURL });
                                    showToast('✅ Logo caricato', 'success');
                                } catch (error) {
                                    console.error('Errore upload logo:', error);
                                    showToast(`❌ ${error.message || 'Errore upload'}`, 'error');
                                }
                            },
                            className: inputClass + ' w-full px-4 py-3 rounded-lg border-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer hover:file:bg-indigo-700'
                        })
                    ),
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            'Partita IVA'
                        ),
                        React.createElement('input', {
                            type: 'text',
                            value: companyForm.partitaIva,
                            onChange: (e) => setCompanyForm({ ...companyForm, partitaIva: e.target.value }),
                            placeholder: 'IT12345678901',
                            className: inputClass + ' w-full px-4 py-3 rounded-lg border-2'
                        })
                    ),
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            'Colore'
                        ),
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('div', { 
                                className: 'w-16 h-16 rounded-lg border-2 shadow-inner',
                                style: { backgroundColor: companyForm.colore, borderColor: darkMode ? '#374151' : '#D1D5DB' }
                            }),
                            React.createElement('input', {
                                type: 'color',
                                value: companyForm.colore,
                                onChange: (e) => setCompanyForm({ ...companyForm, colore: e.target.value }),
                                className: 'flex-1 h-12 rounded-lg border-2 cursor-pointer'
                            })
                        )
                    ),
                    React.createElement('div', { className: 'flex gap-3 pt-4' },
                        React.createElement('button', {
                            onClick: () => {
                                setShowCompanyModal(false);
                                setEditingCompany(null);
                                setCompanyForm({ nome: '', logo: '', colore: '#10B981', partitaIva: '' });
                            },
                            className: 'flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors'
                        }, '✖️ Annulla'),
                        React.createElement('button', {
                            onClick: editingCompany ? handleEditCompany : handleAddCompany,
                            className: 'flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors'
                        }, editingCompany ? '💾 Salva' : '➕ Aggiungi')
                    )
                )
            )
        ),

        // ========== MODAL: AGGIUNGI/MODIFICA INDIRIZZO ==========
        showAddressModal && React.createElement('div', { 
            className: 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50',
            onClick: () => {
                setShowAddressModal(false);
                setEditingAddress(null);
                setAddressForm({ nome: '', indirizzo: '', citta: '', cap: '', provincia: '', emoji: '📍', colore: '#8B5CF6', googleMapsUrl: '' });
            }
        },
            React.createElement('div', { 
                className: `${cardClass} rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto`,
                onClick: (e) => e.stopPropagation()
            },
                React.createElement('div', { className: 'flex items-center justify-between mb-6' },
                    React.createElement('h2', { className: 'text-2xl font-bold ' + (darkMode ? 'text-gray-100' : 'text-gray-900') },
                        editingAddress ? '✏️ Modifica Indirizzo' : '➕ Aggiungi Indirizzo'
                    ),
                    React.createElement('button', {
                        onClick: () => {
                            setShowAddressModal(false);
                            setEditingAddress(null);
                            setAddressForm({ nome: '', indirizzo: '', citta: '', cap: '', provincia: '', emoji: '📍', colore: '#8B5CF6', googleMapsUrl: '' });
                        },
                        className: 'text-2xl hover:opacity-70 transition-opacity'
                    }, '✖️')
                ),
                React.createElement('div', { className: 'space-y-4' },
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            'Nome Indirizzo *'
                        ),
                        React.createElement('input', {
                            type: 'text',
                            value: addressForm.nome,
                            onChange: (e) => setAddressForm({ ...addressForm, nome: e.target.value }),
                            placeholder: 'es. Sede Centrale',
                            className: inputClass + ' w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-indigo-500'
                        })
                    ),
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            'Via e Numero Civico *'
                        ),
                        React.createElement('input', {
                            type: 'text',
                            value: addressForm.indirizzo,
                            onChange: (e) => setAddressForm({ ...addressForm, indirizzo: e.target.value }),
                            placeholder: 'Via Edoardo Chiossone 29',
                            className: inputClass + ' w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-indigo-500'
                        })
                    ),
                    React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                                'CAP'
                            ),
                            React.createElement('input', {
                                type: 'text',
                                value: addressForm.cap,
                                onChange: (e) => setAddressForm({ ...addressForm, cap: e.target.value }),
                                placeholder: '00169',
                                className: inputClass + ' w-full px-4 py-3 rounded-lg border-2'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                                'Provincia'
                            ),
                            React.createElement('input', {
                                type: 'text',
                                value: addressForm.provincia,
                                onChange: (e) => setAddressForm({ ...addressForm, provincia: e.target.value.toUpperCase() }),
                                placeholder: 'RM',
                                maxLength: 2,
                                className: inputClass + ' w-full px-4 py-3 rounded-lg border-2'
                            })
                        )
                    ),
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            'Città'
                        ),
                        React.createElement('input', {
                            type: 'text',
                            value: addressForm.citta,
                            onChange: (e) => setAddressForm({ ...addressForm, citta: e.target.value }),
                            placeholder: 'Roma',
                            className: inputClass + ' w-full px-4 py-3 rounded-lg border-2'
                        })
                    ),
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            'Link Google Maps'
                        ),
                        React.createElement('div', { className: 'flex gap-2' },
                            React.createElement('input', {
                                type: 'url',
                                value: addressForm.googleMapsUrl,
                                onChange: (e) => setAddressForm({ ...addressForm, googleMapsUrl: e.target.value }),
                                placeholder: 'https://maps.google.com/...',
                                className: inputClass + ' flex-1 px-4 py-3 rounded-lg border-2'
                            }),
                            React.createElement('button', {
                                onClick: generateGoogleMapsUrl,
                                className: 'px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors whitespace-nowrap'
                            }, '🗺️ Genera')
                        )
                    ),
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            'Emoji'
                        ),
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('span', { className: 'text-5xl' }, addressForm.emoji),
                            React.createElement('input', {
                                type: 'text',
                                value: addressForm.emoji,
                                onChange: (e) => setAddressForm({ ...addressForm, emoji: e.target.value.slice(0, 2) }),
                                maxLength: 2,
                                placeholder: '📍',
                                className: inputClass + ' flex-1 px-4 py-3 rounded-lg border-2 text-center text-2xl'
                            })
                        )
                    ),
                    React.createElement('div', {},
                        React.createElement('label', { className: 'block text-sm font-semibold mb-2 ' + (darkMode ? 'text-gray-200' : 'text-gray-700') },
                            'Colore'
                        ),
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('div', { 
                                className: 'w-16 h-16 rounded-lg border-2 shadow-inner',
                                style: { backgroundColor: addressForm.colore, borderColor: darkMode ? '#374151' : '#D1D5DB' }
                            }),
                            React.createElement('input', {
                                type: 'color',
                                value: addressForm.colore,
                                onChange: (e) => setAddressForm({ ...addressForm, colore: e.target.value }),
                                className: 'flex-1 h-12 rounded-lg border-2 cursor-pointer'
                            })
                        )
                    ),
                    React.createElement('div', { className: 'flex gap-3 pt-4' },
                        React.createElement('button', {
                            onClick: () => {
                                setShowAddressModal(false);
                                setEditingAddress(null);
                                setAddressForm({ nome: '', indirizzo: '', citta: '', cap: '', provincia: '', emoji: '📍', colore: '#8B5CF6', googleMapsUrl: '' });
                            },
                            className: 'flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors'
                        }, '✖️ Annulla'),
                        React.createElement('button', {
                            onClick: editingAddress ? handleEditAddress : handleAddAddress,
                            className: 'flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors'
                        }, editingAddress ? '💾 Salva' : '➕ Aggiungi')
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


