/**
 * Permanent User Profile - Full Page Component
 * Profilo completo full-screen per utenti permanenti con tutte le funzionalità admin
 */

window.PermanentUserProfile = function({ userId, currentUserRole, currentUserId, onBack, onClose, db, storage, darkMode, language }) {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('info');
    const [documents, setDocuments] = React.useState([]);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [isUploading, setIsUploading] = React.useState(false);
    const [avatarPreview, setAvatarPreview] = React.useState(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
    const [showAvatarPopup, setShowAvatarPopup] = React.useState(false); // 🖼️ Popup preview avatar
    
    // Form states
    const [editMode, setEditMode] = React.useState(false);
    const [formData, setFormData] = React.useState({});
    const [passwordData, setPasswordData] = React.useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = React.useState(false); // 👁️
    const [showNewPassword, setShowNewPassword] = React.useState(false); // 👁️
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false); // 👁️
    const [permissions, setPermissions] = React.useState({});
    const [suspensionReason, setSuspensionReason] = React.useState('');
    const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
    
    // 📊 Stats tab state
    const [allSheets, setAllSheets] = React.useState([]);
    const [statsLoading, setStatsLoading] = React.useState(false);
    
    const t = window.translations || {};
    const isAdmin = currentUserRole === 'admin';
    const isManager = currentUserRole === 'manager';
    const canEdit = isAdmin || isManager;
    const safeCurrentUser = { id: currentUserId, role: currentUserRole || 'worker' };
    const canDelete = isAdmin && userId !== currentUserId; // ⚠️ Non può eliminare se stesso
    const canSuspend = isAdmin;
    const canChangePermissions = isAdmin;
    const canViewDocuments = isAdmin || isManager || (window.PermissionChecker?.hasPermission({ id: currentUserId, role: currentUserRole }, 'viewUserDocuments'));
    const canChangeOtherPassword = isAdmin || (window.PermissionChecker?.hasPermission({ id: currentUserId, role: currentUserRole }, 'changeOtherUserPassword'));
    
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode 
        ? 'bg-gray-700 border-gray-600 text-white' 
        : 'bg-white border-gray-300 text-gray-900';

    // Carica dati utente
    React.useEffect(() => {
        loadUserData();
    }, [userId]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            
            // 🔧 FIX: Gestisci admin senza documento Firestore
            if (!userId || userId === 'admin') {
                // Admin non ha documento in Firestore - carica da settings/adminAuth
                const adminAuthDoc = await db.collection('settings').doc('adminAuth').get();
                const adminAuthData = adminAuthDoc.exists ? adminAuthDoc.data() : {};
                
                const adminData = {
                    firstName: 'Admin',
                    lastName: 'System',
                    email: adminAuthData.email || 'admin@reportore.app',
                    phone: '',
                    role: 'admin',
                    createdAt: new Date(),
                    avatarURL: adminAuthData.avatarURL || null, // Carica avatar da adminAuth
                    permissions: {
                        viewSheets: true,
                        createSheets: true,
                        editSheets: true,
                        deleteSheets: true,
                        manageUsers: true,
                        viewReports: true,
                        exportData: true,
                        manageSettings: true
                    }
                };
                
                setUser({ id: 'admin', ...adminData });
                setFormData({
                    firstName: adminData.firstName,
                    lastName: adminData.lastName,
                    email: adminData.email,
                    phone: adminData.phone,
                    role: adminData.role
                });
                setPermissions(adminData.permissions);
                setLoading(false);
                return;
            }
            
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (!userDoc.exists) {
                showToast('❌ ' + (t.userNotFound || 'Utente non trovato'), 'error');
                onBack();
                return;
            }
            
            const userData = userDoc.data();
            setUser({ id: userId, ...userData });
            setFormData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                phone: userData.phone || '',
                role: userData.role || 'worker'
            });
            
            // 🔧 FIX: Usa PermissionChecker per default invece di hardcode
            const defaultPermissions = window.PermissionChecker 
                ? window.PermissionChecker.getDefaultPermissions(userData.role || 'worker')
                : {};
            
            setPermissions(userData.permissions || defaultPermissions);
            
            // Carica documenti
            await loadDocuments();
            
        } catch (error) {
            console.error('Errore caricamento profilo:', error);
            showToast('❌ Errore caricamento profilo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadDocuments = async () => {
        try {
            if (!window.StorageManager) return;
            const docs = await window.StorageManager.listUserDocuments(userId);
            setDocuments(docs || []);
        } catch (error) {
            console.error('Errore caricamento documenti:', error);
        }
    };

    // 📊 CARICA TUTTI I FOGLI PER TAB STATISTICHE (WorkerStats filtra automaticamente)
    React.useEffect(() => {
        if (activeTab !== 'stats' || !db) return;
        
        setStatsLoading(true);
        const unsubscribe = db.collection('timesheets')
            .onSnapshot(snapshot => {
                const sheets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllSheets(sheets);
                setStatsLoading(false);
                console.log('📊 Caricati tutti i fogli per WorkerStats:', sheets.length);
            });

        return () => unsubscribe();
    }, [activeTab, db]);

    // GESTIONE INFO PERSONALI
    const handleSaveInfo = async () => {
        // Admin system non può modificare info (sono hard-coded)
        if (userId === 'admin') {
            showToast('⚠️ Admin system non può modificare le proprie info', 'warning');
            return;
        }
        
        try {
            await db.collection('users').doc(userId).update({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUserId
            });
            
            showToast('✅ ' + (t.profileUpdated || 'Profilo aggiornato'), 'success');
            setEditMode(false);
            await loadUserData();
        } catch (error) {
            console.error('Errore aggiornamento profilo:', error);
            showToast('❌ Errore aggiornamento profilo', 'error');
        }
    };

    // GESTIONE PASSWORD
    const handleChangePassword = async () => {
        // Admin system non può cambiare password qui (usa adminAuth)
        if (userId === 'admin') {
            showToast('⚠️ Per cambiare la password admin, usa Impostazioni > Sicurezza', 'warning');
            return;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('❌ ' + (t.passwordMismatch || 'Le password non coincidono'), 'error');
            return;
        }
        
        if (passwordData.newPassword.length < 6) {
            showToast('❌ ' + (t.weakPassword || 'Password troppo debole (min 6 caratteri)'), 'error');
            return;
        }
        
        try {
            // Hash password con bcryptjs se disponibile, altrimenti base64
            let hashedPassword = '';
            if (window.bcrypt && typeof window.bcrypt.hashSync === 'function') {
                try {
                    hashedPassword = window.bcrypt.hashSync(passwordData.newPassword, 10);
                } catch (e) {
                    hashedPassword = btoa(passwordData.newPassword);
                }
            } else {
                hashedPassword = btoa(passwordData.newPassword);
            }
            // Aggiorna password in Firestore
            await db.collection('users').doc(userId).update({
                password: hashedPassword,
                passwordChangedAt: firebase.firestore.FieldValue.serverTimestamp(),
                passwordChangedBy: currentUserId,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('✅ ' + (t.passwordChanged || 'Password modificata con successo!'), 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Errore cambio password:', error);
            showToast('❌ Errore cambio password: ' + (error.message || error), 'error');
        }
    };

    // GESTIONE PERMESSI
    const handleSavePermissions = async () => {
        // Admin system ha permessi fissi
        if (userId === 'admin') {
            showToast('⚠️ Admin system ha permessi completi fissi', 'warning');
            return;
        }
        
        try {
            await db.collection('users').doc(userId).update({
                permissions: permissions,
                permissionsUpdatedAt: new Date().toISOString(),
                permissionsUpdatedBy: currentUserId
            });
            
            // 🔧 FIX: Se sto modificando ME STESSO, ricarica currentUser
            if (userId === currentUserId && window.__setCurrentUser) {
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const updatedUser = { id: userId, ...userDoc.data() };
                    window.__setCurrentUser(updatedUser);
                    console.log('✅ CurrentUser ricaricato con nuovi permessi:', updatedUser.permissions);
                }
            }
            
            showToast('✅ ' + (t.permissionsUpdated || 'Permessi aggiornati'), 'success');
        } catch (error) {
            console.error('Errore aggiornamento permessi:', error);
            showToast('❌ Errore aggiornamento permessi', 'error');
        }
    };

    // GESTIONE AVATAR
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Valida tipo e dimensione
        if (!file.type.startsWith('image/')) {
            showToast('❌ Formato non valido. Usa JPG, PNG o GIF', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ File troppo grande. Massimo 5MB', 'error');
            return;
        }
        
        try {
            setIsUploadingAvatar(true);
            
            if (window.StorageManager && window.StorageManager.uploadAvatar) {
                // Passa currentUserId per permettere agli admin di bypassare il cooldown
                const result = await window.StorageManager.uploadAvatar(userId, file, null, currentUserId);
                
                await db.collection('users').doc(userId).update({
                    avatarURL: result.url,
                    avatarUpdatedAt: new Date().toISOString()
                });
                
                showToast('✅ ' + (t.avatarUpdated || 'Avatar aggiornato'), 'success');
                await loadUserData();
                setShowAvatarPopup(false); // Chiudi popup dopo upload
            }
        } catch (error) {
            console.error('Errore upload avatar:', error);
            showToast('❌ ' + error.message, 'error');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // GESTIONE ELIMINAZIONE AVATAR
    const handleDeleteAvatar = async () => {
        if (!user.avatarURL) return;
        
        if (!confirm(t.confirmDeleteAvatar || 'Confermi di voler eliminare l\'avatar?')) return;
        
        try {
            setIsUploadingAvatar(true);
            
            // Prova a eliminare da Storage (se fallisce, continua comunque)
            try {
                const avatarRef = storage.refFromURL(user.avatarURL);
                await avatarRef.delete();
                console.log('✅ Avatar eliminato da Storage');
            } catch (storageError) {
                console.warn('⚠️ Errore eliminazione da Storage (file già eliminato?):', storageError.message);
                // Continua comunque per pulire Firestore
            }
            
            // Aggiorna Firestore (sempre)
            // Admin system salva in settings/adminAuth
            if (userId === 'admin') {
                await db.collection('settings').doc('adminAuth').set({
                    avatarURL: firebase.firestore.FieldValue.delete(),
                    avatarPath: firebase.firestore.FieldValue.delete(),
                    avatarUpdatedAt: new Date().toISOString()
                }, { merge: true });
            } else {
                await db.collection('users').doc(userId).update({
                    avatarURL: firebase.firestore.FieldValue.delete(),
                    avatarPath: firebase.firestore.FieldValue.delete(),
                    avatarUpdatedAt: new Date().toISOString(),
                    avatarDeletedBy: currentUserId,
                    avatarDeletedAt: new Date().toISOString()
                });
            }
            
            showToast('✅ ' + (t.avatarDeleted || 'Avatar eliminato'), 'success');
            await loadUserData();
            setShowAvatarPopup(false);
        } catch (error) {
            console.error('Errore eliminazione avatar:', error);
            showToast('❌ ' + error.message, 'error');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    // GESTIONE DOCUMENTI
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            setIsUploading(true);
            setUploadProgress(0);
            
            if (window.StorageManager && window.StorageManager.uploadDocument) {
                await window.StorageManager.uploadDocument(
                    userId,
                    file,
                    currentUserId,
                    (progress) => setUploadProgress(progress)
                );
                
                showToast('✅ ' + (t.documentUploaded || 'Documento caricato'), 'success');
                await loadDocuments();
            }
        } catch (error) {
            console.error('Errore upload:', error);
            showToast('❌ ' + (error.message || 'Errore durante upload'), 'error');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDownloadDocument = async (doc) => {
        try {
            // Se il documento ha già l'URL salvato, usalo direttamente
            if (doc.url) {
                window.open(doc.url, '_blank');
                return;
            }
            
            // Altrimenti usa il path per ottenere l'URL da Storage
            if (doc.path) {
                const storageRef = storage.ref(doc.path);
                const url = await storageRef.getDownloadURL();
                window.open(url, '_blank');
            } else {
                showToast('❌ Documento non trovato', 'error');
            }
        } catch (error) {
            console.error('Errore download:', error);
            showToast('❌ Errore download documento: ' + error.message, 'error');
        }
    };

    const handleDeleteDocument = async (doc) => {
        if (!confirm(t.confirmDelete || 'Confermi eliminazione?')) return;
        
        try {
            if (window.StorageManager && window.StorageManager.deleteDocument) {
                await window.StorageManager.deleteDocument(userId, doc.path, doc);
                showToast('✅ ' + (t.documentDeleted || 'Documento eliminato'), 'success');
                await loadDocuments();
            }
        } catch (error) {
            console.error('Errore eliminazione:', error);
            showToast('❌ Errore eliminazione documento', 'error');
        }
    };

    // GESTIONE SOSPENSIONE
    const handleSuspendUser = async () => {
        if (!suspensionReason.trim()) {
            showToast('❌ Inserisci un motivo per la sospensione', 'error');
            return;
        }
        
        if (!confirm(t.confirmSuspension || 'Confermi la sospensione?')) return;
        
        try {
            await db.collection('users').doc(userId).update({
                suspended: true,
                suspendedAt: new Date().toISOString(),
                suspendedBy: currentUserId,
                suspensionReason: suspensionReason
            });
            
            showToast('✅ ' + (t.userSuspended || 'Utente sospeso'), 'success');
            setSuspensionReason('');
            await loadUserData();
        } catch (error) {
            console.error('Errore sospensione:', error);
            showToast('❌ Errore sospensione utente', 'error');
        }
    };

    const handleUnsuspendUser = async () => {
        if (!confirm(t.confirmUnsuspension || 'Confermi lo sblocco?')) return;
        
        try {
            await db.collection('users').doc(userId).update({
                suspended: false,
                unsuspendedAt: new Date().toISOString(),
                unsuspendedBy: currentUserId
            });
            
            showToast('✅ ' + (t.userUnsuspended || 'Utente sbloccato'), 'success');
            await loadUserData();
        } catch (error) {
            console.error('Errore sblocco:', error);
            showToast('❌ Errore sblocco utente', 'error');
        }
    };

    // GESTIONE ELIMINAZIONE
    const handleDeleteUser = async () => {
        const expectedName = `${user.firstName} ${user.lastName}`.toLowerCase();
        
        if (deleteConfirmation.toLowerCase() !== expectedName) {
            showToast('❌ Nome non corretto. Eliminazione annullata.', 'error');
            return;
        }
        
        try {
            // Elimina documenti da Storage
            if (documents.length > 0 && window.StorageManager) {
                for (const doc of documents) {
                    try {
                        await window.StorageManager.deleteDocument(userId, doc.path, doc);
                    } catch (err) {
                        console.error('Errore eliminazione documento:', err);
                    }
                }
            }
            
            // Elimina avatar se esiste
            if (user.avatarURL) {
                try {
                    const avatarRef = storage.refFromURL(user.avatarURL);
                    await avatarRef.delete();
                } catch (err) {
                    console.error('Errore eliminazione avatar:', err);
                }
            }
            
            // Elimina utente da Firestore
            await db.collection('users').doc(userId).delete();
            
            showToast('✅ ' + (t.userDeleted || 'Utente eliminato'), 'success');
            setTimeout(() => onBack(), 1500);
        } catch (error) {
            console.error('Errore eliminazione utente:', error);
            showToast('❌ Errore eliminazione utente', 'error');
        }
    };

    const showToast = (message, type) => {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    };

    if (loading) {
        return React.createElement('div', {
            className: 'flex items-center justify-center h-screen'
        }, React.createElement('div', {
            className: 'text-xl'
        }, t.loading || 'Caricamento...'));
    }

    if (!user) return null;

    // RENDER TABS
    const renderTabs = () => {
        const tabs = [
            { id: 'info', label: t.profileInfo || 'Informazioni', icon: '📋' },
            { id: 'stats', label: t.statistics || 'Statistiche', icon: '📊' }
        ];
        
        // Tab Documenti - Solo se ha permesso
        if (canViewDocuments) {
            tabs.push({ id: 'documents', label: t.documents || 'Documenti', icon: '📄' });
        }
        
        // Tab Password - Solo se è il proprio profilo O ha permesso changeOtherUserPassword
        if (userId === currentUserId || canChangeOtherPassword) {
            tabs.push({ id: 'password', label: t.password || 'Password', icon: '🔒' });
        }
        
        if (canChangePermissions) {
            tabs.push({ id: 'permissions', label: 'Ruolo & Accessi', icon: '🎭' });
        }
        
        if (canSuspend || canDelete) {
            tabs.push({ id: 'admin', label: t.adminActions || 'Azioni Admin', icon: '⚙️' });
        }
        
        return React.createElement('div', {
            className: 'flex border-b border-gray-300 mb-6 overflow-x-auto'
        }, tabs.map(tab => 
            React.createElement('button', {
                key: tab.id,
                onClick: () => setActiveTab(tab.id),
                className: `px-6 py-3 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                        ? 'border-b-2 border-blue-500 text-blue-600' 
                        : textClass + ' hover:text-blue-500'
                }`
            }, `${tab.icon} ${tab.label}`)
        ));
    };

    // TAB: STATISTICHE - FILTRATE PER QUESTO UTENTE (WorkerStats fa il filtro automaticamente)
    const renderStatsTab = () => {
        const workerFullName = user ? `${user.firstName} ${user.lastName}` : '';
        
        console.log('📊 renderStatsTab:', { 
            statsLoading, 
            allSheets: allSheets?.length, 
            workerFullName,
            hasWorkerStats: !!window.WorkerStats 
        });

        if (statsLoading) {
            return React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6 text-center` },
                React.createElement('p', { className: textClass }, '⏳ Caricamento statistiche...')
            );
        }

        if (!window.WorkerStats) {
            return React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6 text-center` },
                React.createElement('p', { className: 'text-red-600 font-bold' }, 
                    '⚠️ Componente WorkerStats non disponibile'
                ),
                React.createElement('p', { className: textClass + ' text-sm mt-2' }, 
                    'Verifica che js/components/WorkerStats.js sia caricato'
                )
            );
        }

        // 🎯 WorkerStats riceve il nome completo come selectedWorker e filtra automaticamente
        return React.createElement(window.WorkerStats, {
            sheets: allSheets,
            selectedWorker: workerFullName, // 🎯 QUESTO FA MOSTRARE SOLO LE STATS DI QUESTO UTENTE
            onBack: null,
            db: db,
            darkMode: darkMode,
            language: language || 'it',
            currentUser: { role: currentUserRole }, // Passa ruolo per permessi
            blacklist: [],
            activityTypes: window.activityTypes || [],
            onAddToBlacklist: () => {},
            onViewProfile: null
        });
    };

    // TAB: INFORMAZIONI
    const renderInfoTab = () => {
        return React.createElement('div', { className: 'space-y-6' },
            // Avatar e nome
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-4 sm:p-6` },
                React.createElement('div', { className: 'flex flex-col sm:flex-row items-center gap-4 sm:gap-6' },
                    // Avatar - Click per aprire popup
                    React.createElement('div', { 
                        className: 'relative cursor-pointer group',
                        onClick: () => setShowAvatarPopup(true)
                    },
                        React.createElement('div', {
                            className: 'w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold transition-transform group-hover:scale-105',
                            style: user.avatarURL ? { 
                                backgroundImage: `url(${user.avatarURL})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            } : {}
                        }, !user.avatarURL && (user.firstName?.[0] || 'U')),
                        // Overlay hover
                        React.createElement('div', {
                            className: 'absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all'
                        },
                            React.createElement('span', {
                                className: 'text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity'
                            }, '🔍')
                        )
                    ),
                    // Nome e ruolo
                    React.createElement('div', { className: 'flex-1 text-center sm:text-left' },
                        React.createElement('h2', { className: 'text-xl sm:text-2xl font-bold mb-2' },
                            `${user.firstName} ${user.lastName}`
                        ),
                        React.createElement('div', { className: 'flex flex-wrap items-center justify-center sm:justify-start gap-2' },
                            React.createElement('span', {
                                className: `px-3 py-1 rounded-full text-sm font-medium ${
                                    (user?.role || 'worker') === 'admin' ? 'bg-red-100 text-red-800' :
                                    (user?.role || 'worker') === 'manager' ? 'bg-purple-100 text-purple-800' :
                                    (user?.role || 'worker') === 'datore' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`
                            }, (t[user?.role || 'worker'] || (user?.role || 'worker')).toUpperCase()),
                            user.suspended && React.createElement('span', {
                                className: 'px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800'
                            }, '🚫 ' + (t.suspended || 'SOSPESO'))
                        )
                    )
                )
            ),
            
            // Info contatto
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('div', { className: 'flex justify-between items-center mb-4' },
                    React.createElement('h3', { className: 'text-xl font-bold' }, t.contactInfo || 'Info Contatto'),
                    canEdit && !editMode && React.createElement('button', {
                        onClick: () => setEditMode(true),
                        className: 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                    }, '✏️ ' + (t.edit || 'Modifica'))
                ),
                
                editMode ? React.createElement('div', { className: 'space-y-4' },
                    React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4' },
                        React.createElement('div', null,
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, t.firstName || 'Nome'),
                            React.createElement('input', {
                                type: 'text',
                                value: formData.firstName,
                                onChange: (e) => setFormData({...formData, firstName: e.target.value}),
                                className: `w-full px-3 py-2 border rounded-lg ${inputClass}`
                            })
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, t.lastName || 'Cognome'),
                            React.createElement('input', {
                                type: 'text',
                                value: formData.lastName,
                                onChange: (e) => setFormData({...formData, lastName: e.target.value}),
                                className: `w-full px-3 py-2 border rounded-lg ${inputClass}`
                            })
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, t.email || 'Email'),
                        React.createElement('input', {
                            type: 'email',
                            value: formData.email,
                            onChange: (e) => setFormData({...formData, email: e.target.value}),
                            className: `w-full px-3 py-2 border rounded-lg ${inputClass}`
                        })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, t.phone || 'Telefono'),
                        React.createElement('input', {
                            type: 'tel',
                            value: formData.phone,
                            onChange: (e) => setFormData({...formData, phone: e.target.value}),
                            className: `w-full px-3 py-2 border rounded-lg ${inputClass}`
                        })
                    ),
                    isAdmin && React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, t.role || 'Ruolo'),
                        React.createElement('select', {
                            value: formData.role,
                            onChange: (e) => setFormData({...formData, role: e.target.value}),
                            className: `w-full px-3 py-2 border rounded-lg ${inputClass}`
                        },
                            React.createElement('option', { value: 'worker' }, t.worker || 'Lavoratore'),
                            React.createElement('option', { value: 'datore' }, t.datore || 'Datore'),
                            React.createElement('option', { value: 'manager' }, t.manager || 'Manager'),
                            React.createElement('option', { value: 'admin' }, t.admin || 'Admin')
                        )
                    ),
                    React.createElement('div', { className: 'flex flex-col sm:flex-row gap-2 sm:gap-3' },
                        React.createElement('button', {
                            onClick: handleSaveInfo,
                            className: 'px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'
                        }, '✅ ' + (t.saveChanges || 'Salva')),
                        React.createElement('button', {
                            onClick: () => setEditMode(false),
                            className: 'px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
                        }, (t.cancel || 'Annulla'))
                    )
                ) : React.createElement('div', { className: 'space-y-3' },
                    React.createElement('div', { className: 'flex justify-between' },
                        React.createElement('span', { className: textClass }, t.email || 'Email'),
                        React.createElement('span', { className: 'font-medium' }, user.email || '-')
                    ),
                    React.createElement('div', { className: 'flex justify-between' },
                        React.createElement('span', { className: textClass }, t.phone || 'Telefono'),
                        React.createElement('span', { className: 'font-medium' }, user.phone || '-')
                    )
                )
            ),
            
            // Info account
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-4 sm:p-6` },
                React.createElement('h3', { className: 'text-lg sm:text-xl font-bold mb-4' }, t.accountInfo || 'Info Account'),
                React.createElement('div', { className: 'space-y-3' },
                    React.createElement('div', { className: 'flex flex-col sm:flex-row sm:justify-between gap-1' },
                        React.createElement('span', { className: textClass + ' text-sm' }, 'Username'),
                        React.createElement('span', { className: 'font-medium text-sm sm:text-base break-all' }, user.username || user.email || '-')
                    ),
                    React.createElement('div', { className: 'flex flex-col sm:flex-row sm:justify-between gap-1' },
                        React.createElement('span', { className: textClass + ' text-sm' }, 'ID Utente'),
                        React.createElement('span', { className: 'font-medium text-xs break-all' }, userId || '-')
                    ),
                    React.createElement('div', { className: 'flex flex-col sm:flex-row sm:justify-between gap-1' },
                        React.createElement('span', { className: textClass + ' text-sm' }, t.registeredOn || 'Registrato il'),
                        React.createElement('span', { className: 'font-medium' }, 
                            user.createdAt 
                                ? (user.createdAt.toDate 
                                    ? user.createdAt.toDate().toLocaleDateString() + ' ' + user.createdAt.toDate().toLocaleTimeString()
                                    : new Date(user.createdAt).toLocaleDateString() + ' ' + new Date(user.createdAt).toLocaleTimeString())
                                : '-'
                        )
                    ),
                    user.lastLogin && React.createElement('div', { className: 'flex justify-between' },
                        React.createElement('span', { className: textClass }, 'Ultimo accesso'),
                        React.createElement('span', { className: 'font-medium' }, 
                            user.lastLogin.toDate 
                                ? user.lastLogin.toDate().toLocaleDateString() + ' ' + user.lastLogin.toDate().toLocaleTimeString()
                                : new Date(user.lastLogin).toLocaleDateString() + ' ' + new Date(user.lastLogin).toLocaleTimeString()
                        )
                    ),
                    user.updatedAt && React.createElement('div', { className: 'flex justify-between' },
                        React.createElement('span', { className: textClass }, 'Ultima modifica'),
                        React.createElement('span', { className: 'font-medium' }, 
                            user.updatedAt.toDate 
                                ? user.updatedAt.toDate().toLocaleDateString() + ' ' + user.updatedAt.toDate().toLocaleTimeString()
                                : new Date(user.updatedAt).toLocaleDateString() + ' ' + new Date(user.updatedAt).toLocaleTimeString()
                        )
                    ),
                    // Solo se l'utente è stato PROMOSSO (madePermanentAt diverso da createdAt)
                    // Confronta i timestamp convertendoli in millisecondi
                    (() => {
                        if (!user.madePermanentAt) return null;
                        
                        const createdTime = user.createdAt?.toDate ? user.createdAt.toDate().getTime() : new Date(user.createdAt).getTime();
                        const madePermTime = user.madePermanentAt?.toDate ? user.madePermanentAt.toDate().getTime() : new Date(user.madePermanentAt).getTime();
                        
                        // Se la differenza è > 1 secondo, mostra "Reso fisso il"
                        if (Math.abs(madePermTime - createdTime) > 1000) {
                            return React.createElement('div', { className: 'flex justify-between' },
                                React.createElement('span', { className: textClass }, t.madePermanentOn || 'Reso fisso il'),
                                React.createElement('span', { className: 'font-medium' }, 
                                    user.madePermanentAt.toDate 
                                        ? user.madePermanentAt.toDate().toLocaleDateString()
                                        : new Date(user.madePermanentAt).toLocaleDateString()
                                )
                            );
                        }
                        return null;
                    })(),
                    // Mostra chi ha creato/promosso l'utente
                    user.madePermanentBy && React.createElement('div', { className: 'flex justify-between' },
                        React.createElement('span', { className: textClass }, 
                            (() => {
                                if (!user.madePermanentAt || !user.createdAt) return 'Creato da';
                                
                                const createdTime = user.createdAt?.toDate ? user.createdAt.toDate().getTime() : new Date(user.createdAt).getTime();
                                const madePermTime = user.madePermanentAt?.toDate ? user.madePermanentAt.toDate().getTime() : new Date(user.madePermanentAt).getTime();
                                
                                // Se la differenza è > 1 secondo, è stato promosso
                                return Math.abs(madePermTime - createdTime) > 1000 ? 'Reso fisso da' : 'Creato da';
                            })()
                        ),
                        React.createElement('span', { className: 'font-medium' }, user.madePermanentBy || '-')
                    ),
                    user.suspended && React.createElement(React.Fragment, null,
                        React.createElement('div', { className: 'flex justify-between' },
                            React.createElement('span', { className: textClass }, t.suspendedSince || 'Sospeso dal'),
                            React.createElement('span', { className: 'font-medium text-red-600' }, 
                                user.suspendedAt?.toDate 
                                    ? user.suspendedAt.toDate().toLocaleDateString()
                                    : new Date(user.suspendedAt).toLocaleDateString()
                            )
                        ),
                        user.suspendedBy && React.createElement('div', { className: 'flex justify-between' },
                            React.createElement('span', { className: textClass }, 'Sospeso da'),
                            React.createElement('span', { className: 'font-medium text-red-600' }, 
                                user.suspendedBy || '-'
                            )
                        ),
                        React.createElement('div', { className: 'flex justify-between' },
                            React.createElement('span', { className: textClass }, t.suspensionReason || 'Motivo'),
                            React.createElement('span', { className: 'font-medium text-red-600' }, 
                                user.suspensionReason || '-'
                            )
                        )
                    )
                )
            )
        );
    };

    // TAB: DOCUMENTI
    const renderDocumentsTab = () => {
        return React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-4 sm:p-6` },
            React.createElement('div', { className: 'flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6' },
                React.createElement('h3', { className: 'text-lg sm:text-xl font-bold' }, 
                    `${t.documents || 'Documenti'} (${documents.length})`
                ),
                canEdit && React.createElement('label', {
                    className: 'px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors'
                },
                    React.createElement('input', {
                        type: 'file',
                        onChange: handleFileUpload,
                        className: 'hidden',
                        disabled: isUploading
                    }),
                    isUploading ? '⏳ ' + t.uploading : '📤 ' + (t.uploadDocument || 'Carica')
                )
            ),
            
            isUploading && React.createElement('div', { className: 'mb-4' },
                React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
                    React.createElement('div', {
                        className: 'bg-blue-500 h-2 rounded-full transition-all duration-300',
                        style: { width: `${uploadProgress}%` }
                    })
                ),
                React.createElement('p', { className: 'text-sm text-center mt-2' }, 
                    `${Math.round(uploadProgress)}%`
                )
            ),
            
            documents.length === 0 ? React.createElement('div', {
                className: 'text-center py-12'
            },
                React.createElement('p', { className: textClass }, t.noDocuments || 'Nessun documento')
            ) : React.createElement('div', { className: 'space-y-3' },
                documents.map((doc, idx) => 
                    React.createElement('div', {
                        key: idx,
                        className: `flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3 ${
                            darkMode ? 'border-gray-700' : 'border-gray-200'
                        }`
                    },
                        React.createElement('div', { className: 'flex items-center space-x-3 flex-1' },
                            React.createElement('span', { className: 'text-2xl' }, 
                                doc.type?.includes('pdf') ? '📄' :
                                doc.type?.includes('image') ? '🖼️' :
                                doc.type?.includes('word') ? '📝' : '📎'
                            ),
                            React.createElement('div', null,
                                React.createElement('p', { className: 'font-medium' }, doc.nome),
                                React.createElement('p', { className: `text-sm ${textClass}` },
                                    `${(doc.size / 1024).toFixed(1)} KB • ${
                                        doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '-'
                                    }`
                                )
                            )
                        ),
                        React.createElement('div', { className: 'flex space-x-2' },
                            React.createElement('button', {
                                onClick: () => handleDownloadDocument(doc),
                                className: 'px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                            }, '⬇️'),
                            canEdit && React.createElement('button', {
                                onClick: () => handleDeleteDocument(doc),
                                className: 'px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
                            }, '🗑️')
                        )
                    )
                )
            )
        );
    };

    // TAB: PASSWORD
    const renderPasswordTab = () => {
        return React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6 max-w-2xl` },
            React.createElement('h3', { className: 'text-xl font-bold mb-6' }, t.changePassword || 'Cambia Password'),
            React.createElement('div', { className: 'space-y-4' },
                !isAdmin && React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
                        t.currentPassword || 'Password Attuale'
                    ),
                    React.createElement('div', { className: 'relative' },
                        React.createElement('input', {
                            type: showCurrentPassword ? 'text' : 'password',
                            value: passwordData.currentPassword,
                            onChange: (e) => setPasswordData({...passwordData, currentPassword: e.target.value}),
                            className: `w-full px-3 py-2 pr-10 border rounded-lg ${inputClass}`
                        }),
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => setShowCurrentPassword(!showCurrentPassword),
                            className: `absolute right-2 top-1/2 -translate-y-1/2 text-xl transition-all hover:scale-110 ${
                                darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                            }`,
                            title: showCurrentPassword ? 'Nascondi' : 'Mostra'
                        }, showCurrentPassword ? '🙈' : '👁️')
                    )
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
                        t.newPassword || 'Nuova Password'
                    ),
                    React.createElement('div', { className: 'relative' },
                        React.createElement('input', {
                            type: showNewPassword ? 'text' : 'password',
                            value: passwordData.newPassword,
                            onChange: (e) => setPasswordData({...passwordData, newPassword: e.target.value}),
                            className: `w-full px-3 py-2 pr-10 border rounded-lg ${inputClass}`
                        }),
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => setShowNewPassword(!showNewPassword),
                            className: `absolute right-2 top-1/2 -translate-y-1/2 text-xl transition-all hover:scale-110 ${
                                darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                            }`,
                            title: showNewPassword ? 'Nascondi' : 'Mostra'
                        }, showNewPassword ? '🙈' : '👁️')
                    ),
                    React.createElement('p', { className: `text-xs mt-1 ${textClass}` }, 
                        'Minimo 6 caratteri'
                    )
                ),
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
                        t.confirmNewPassword || 'Conferma Nuova Password'
                    ),
                    React.createElement('div', { className: 'relative' },
                        React.createElement('input', {
                            type: showConfirmPassword ? 'text' : 'password',
                            value: passwordData.confirmPassword,
                            onChange: (e) => setPasswordData({...passwordData, confirmPassword: e.target.value}),
                            className: `w-full px-3 py-2 pr-10 border rounded-lg ${inputClass}`
                        }),
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => setShowConfirmPassword(!showConfirmPassword),
                            className: `absolute right-2 top-1/2 -translate-y-1/2 text-xl transition-all hover:scale-110 ${
                                darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                            }`,
                            title: showConfirmPassword ? 'Nascondi' : 'Mostra'
                        }, showConfirmPassword ? '🙈' : '👁️')
                    )
                ),
                React.createElement('button', {
                    onClick: handleChangePassword,
                    disabled: !passwordData.newPassword || !passwordData.confirmPassword,
                    className: 'w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
                }, '🔒 ' + (t.changePassword || 'Cambia Password'))
            )
        );
    };

    // TAB: RUOLO & ACCESSI (ex Permessi)
    const renderPermissionsTab = () => {
        const roleCapabilities = {
            'admin': {
                name: 'Amministratore',
                description: 'Accesso completo a tutte le funzionalità',
                color: 'red',
                capabilities: [
                    '✅ Accesso completo a Dashboard',
                    '✅ Gestione completa fogli (crea, modifica, elimina, archivia)',
                    '✅ Gestione utenti (crea, modifica, elimina, sospendi)',
                    '✅ Gestione blacklist (aggiungi, rimuovi, seconda chance)',
                    '✅ Accesso a tutti i report',
                    '✅ Modifica tutte le impostazioni',
                    '✅ Gestione aziende e indirizzi',
                    '✅ Backup e ripristino',
                    '✅ Visualizza log di sistema'
                ]
            },
            'manager': {
                name: 'Manager',
                description: 'Gestione completa con alcune restrizioni',
                color: 'blue',
                capabilities: [
                    '✅ Dashboard completa',
                    '✅ Calendario con click sui fogli',
                    '✅ Gestione fogli (scarica PDF, elimina, archivia)',
                    '✅ Cambia azienda, data, responsabile, indirizzo',
                    '✅ Firma come responsabile',
                    '✅ Genera PDF e link',
                    '✅ Gestione utenti (modifica, non può eliminare)',
                    '✅ Visualizza blacklist (non può dare seconda chance)',
                    '✅ Accesso completo ai report',
                    '✅ Impostazioni: generali, aziende, indirizzi, attività, avanzate',
                    '❌ Non può aggiungere a blacklist da lavoratori on-call',
                    '❌ Non può eliminare utenti'
                ]
            },
            'responsabile': {
                name: 'Responsabile',
                description: 'Gestione fogli e team con alcune limitazioni',
                color: 'green',
                capabilities: [
                    '✅ Dashboard completa',
                    '✅ Calendario con click sui fogli',
                    '✅ Gestione fogli (scarica PDF, elimina)',
                    '✅ Cambia azienda, data, responsabile, indirizzo',
                    '✅ Firma come responsabile',
                    '✅ Genera PDF e link',
                    '✅ Gestione utenti (modifica, visualizza profili)',
                    '✅ Blacklist (aggiungi, seconda chance)',
                    '✅ Gestione lavoratori on-call',
                    '✅ Impostazioni: indirizzi (modifica/elimina), attività, avanzate',
                    '❌ Non può archiviare fogli',
                    '❌ Non può accedere ai report',
                    '❌ Non può vedere/modificare: generali, aziende'
                ]
            },
            'worker': {
                name: 'Lavoratore',
                description: 'Accesso limitato ai propri dati',
                color: 'yellow',
                capabilities: [
                    '✅ Dashboard (visualizzazione)',
                    '✅ Calendario (solo visualizzazione, no click)',
                    '✅ Visualizza solo fogli dove è presente',
                    '✅ Modifica solo proprie ore e dati',
                    '✅ Cambia attività (solo propria)',
                    '✅ Salva modifiche',
                    '✅ Genera link e PDF',
                    '✅ Profili utenti (solo info e statistiche)',
                    '✅ Visualizza blacklist',
                    '✅ Impostazioni (view-only): generali, calendario, log, avanzate, termini, GDPR, attività, indirizzi, aziende',
                    '❌ Non può eliminare o archiviare fogli',
                    '❌ Non può modificare azienda, data, indirizzo',
                    '❌ Non può firmare come responsabile',
                    '❌ Non può aggiungere lavoratori',
                    '❌ Non può modificare impostazioni'
                ]
            }
        };

        const userRole = user?.role || 'worker';
        const roleInfo = roleCapabilities[userRole] || roleCapabilities['worker'];
        
        return React.createElement('div', { className: 'space-y-6' },
            // Header con badge ruolo
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                    React.createElement('h3', { className: 'text-2xl font-bold flex items-center gap-3' }, 
                        '🎭',
                        React.createElement('span', null, roleInfo.name),
                        React.createElement('span', { 
                            className: `text-sm font-normal px-3 py-1 rounded-full bg-${roleInfo.color}-500 text-white`
                        }, userRole.toUpperCase())
                    )
                ),
                React.createElement('p', { className: textClass + ' text-lg mb-6' }, roleInfo.description),
                
                // Cambio ruolo (solo admin)
                canChangePermissions && React.createElement('div', { className: 'mt-4' },
                    React.createElement('label', { className: 'block text-sm font-semibold mb-2' }, '🔄 Cambia Ruolo'),
                    React.createElement('select', {
                        value: userRole,
                        onChange: async (e) => {
                            const newRole = e.target.value;
                            
                            // ⚠️ ATTENZIONE: Se si cambia ruolo a worker-link, l'utente sparisce da Gestione Utenti
                            if (newRole === 'worker-link') {
                                const confirm = window.confirm(
                                    '⚠️ ATTENZIONE!\n\n' +
                                    'Cambiando il ruolo a "Link Temporaneo", questo utente:\n\n' +
                                    '✅ Manterrà TUTTI i suoi dati (documenti, info, statistiche)\n' +
                                    '✅ Verrà spostato nella sezione "Lavoratori On-Call"\n' +
                                    '✅ Potrà essere reso nuovamente fisso in futuro\n' +
                                    '❌ Non potrà più accedere all\'app come utente permanente\n\n' +
                                    'Confermi di voler procedere?'
                                );
                                
                                if (!confirm) return;
                            }
                            
                            try {
                                // Aggiorna il ruolo nel database
                                await db.collection('users').doc(userId).update({ 
                                    role: newRole,
                                    movedToOnCallAt: newRole === 'worker-link' ? new Date().toISOString() : null
                                });
                                
                                setUser({ ...user, role: newRole });
                                
                                if (newRole === 'worker-link') {
                                    showToast('✅ Utente spostato in Lavoratori On-Call', 'success');
                                    // Chiudi il profilo e aggiorna la lista
                                    setTimeout(() => {
                                        if (onClose) onClose();
                                        else if (onBack) onBack();
                                        window.location.reload(); // Ricarica per aggiornare la lista utenti
                                    }, 1500);
                                } else {
                                    showToast('✅ Ruolo aggiornato', 'success');
                                }
                            } catch (error) {
                                console.error('Errore aggiornamento ruolo:', error);
                                showToast('❌ Errore aggiornamento ruolo', 'error');
                            }
                        },
                        className: `w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`
                    },
                        React.createElement('option', { value: 'admin' }, `👑 ${t.roleAdmin || 'Admin'}`),
                        React.createElement('option', { value: 'manager' }, `👔 ${t.roleManager || 'Manager'}`),
                        React.createElement('option', { value: 'responsabile' }, `👷 ${t.roleResponsabile || 'Responsabile'}`),
                        React.createElement('option', { value: 'worker' }, `👤 ${t.roleWorker || 'Worker'}`),
                        React.createElement('option', { value: 'worker-link' }, `🔗 ${t.roleWorkerLink || 'Link Temporaneo'} ⚠️`)
                    )
                )
            ),
            
            // Lista capacità
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('h4', { className: 'text-lg font-bold mb-4' }, '📋 Capacità & Restrizioni'),
                React.createElement('div', { className: 'space-y-2' },
                    ...roleInfo.capabilities.map((cap, idx) => 
                        React.createElement('div', { 
                            key: idx,
                            className: `flex items-start gap-2 p-2 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`
                        },
                            React.createElement('span', { className: 'text-lg' }, cap.startsWith('✅') ? '✅' : '❌'),
                            React.createElement('span', { className: textClass }, cap.substring(2))
                        )
                    )
                )
            )
        );
    };

    // TAB: AZIONI ADMIN
    const renderAdminTab = () => {
        return React.createElement('div', { className: 'space-y-6 max-w-3xl' },
            // Sospensione/Sblocco
            canSuspend && React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 
                    user.suspended ? (t.unsuspendUser || 'Sblocca Utente') : (t.suspendUser || 'Sospendi Utente')
                ),
                
                user.suspended ? React.createElement('div', null,
                    React.createElement('div', { className: 'mb-4 p-4 bg-red-50 border border-red-200 rounded-lg' },
                        React.createElement('p', { className: 'text-red-800 font-medium mb-2' }, 
                            '🚫 Utente attualmente sospeso'
                        ),
                        React.createElement('p', { className: 'text-sm text-red-600' }, 
                            `Motivo: ${user.suspensionReason || '-'}`
                        )
                    ),
                    React.createElement('button', {
                        onClick: handleUnsuspendUser,
                        className: 'w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'
                    }, '✅ ' + (t.unsuspendUser || 'Sblocca Utente'))
                ) : React.createElement('div', null,
                    React.createElement('textarea', {
                        value: suspensionReason,
                        onChange: (e) => setSuspensionReason(e.target.value),
                        placeholder: t.suspensionReason || 'Motivo della sospensione...',
                        className: `w-full px-3 py-2 border rounded-lg mb-4 ${inputClass}`,
                        rows: 3
                    }),
                    React.createElement('button', {
                        onClick: handleSuspendUser,
                        disabled: !suspensionReason.trim(),
                        className: 'w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
                    }, '🚫 ' + (t.suspendUser || 'Sospendi Utente'))
                )
            ),
            
            // Eliminazione
            canDelete && React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6 border-2 border-red-500` },
                React.createElement('h3', { className: 'text-xl font-bold mb-4 text-red-600' }, 
                    '⚠️ ' + (t.deleteUser || 'Elimina Utente')
                ),
                React.createElement('div', { className: 'mb-4 p-4 bg-red-50 border border-red-200 rounded-lg' },
                    React.createElement('p', { className: 'text-red-800 font-medium mb-2' }, 
                        'ATTENZIONE: Questa azione è IRREVERSIBILE!'
                    ),
                    React.createElement('p', { className: 'text-sm text-red-600' }, 
                        'Verranno eliminati: profilo utente, tutti i documenti, avatar e dati associati.'
                    )
                ),
                React.createElement('label', { className: 'block text-sm font-medium mb-2' },
                    `Digita "${user.firstName} ${user.lastName}" per confermare:`
                ),
                React.createElement('input', {
                    type: 'text',
                    value: deleteConfirmation,
                    onChange: (e) => setDeleteConfirmation(e.target.value),
                    placeholder: `${user.firstName} ${user.lastName}`,
                    className: `w-full px-3 py-2 border rounded-lg mb-4 ${inputClass}`
                }),
                React.createElement('button', {
                    onClick: handleDeleteUser,
                    disabled: deleteConfirmation.toLowerCase() !== `${user.firstName} ${user.lastName}`.toLowerCase(),
                    className: 'w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-bold'
                }, '🗑️ ELIMINA DEFINITIVAMENTE')
            )
        );
    };

    // RENDER PRINCIPALE
    return React.createElement('div', {
        className: `min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-6`
    },
        React.createElement('div', { className: 'max-w-6xl mx-auto' },
            // Header con bottone Indietro
            React.createElement('div', { className: 'mb-6' },
                React.createElement('button', {
                    onClick: onBack,
                    className: 'px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
                }, '← ' + (t.back || 'Indietro'))
            ),
            
            // Tabs
            renderTabs(),
            
            // Contenuto tab attivo
            React.createElement('div', null,
                activeTab === 'info' && renderInfoTab(),
                activeTab === 'stats' && renderStatsTab(),
                activeTab === 'documents' && renderDocumentsTab(),
                activeTab === 'password' && renderPasswordTab(),
                activeTab === 'permissions' && renderPermissionsTab(),
                activeTab === 'admin' && renderAdminTab()
            )
        ),
        
        // 🖼️ POPUP AVATAR
        showAvatarPopup && React.createElement('div', {
            className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
            onClick: () => setShowAvatarPopup(false)
        },
            React.createElement('div', {
                className: `${cardClass} rounded-xl shadow-2xl max-w-md w-full p-6`,
                onClick: (e) => e.stopPropagation()
            },
                // Header
                React.createElement('div', { className: 'flex justify-between items-center mb-4' },
                    React.createElement('h3', { className: 'text-xl font-bold' }, '🖼️ Avatar'),
                    React.createElement('button', {
                        onClick: () => setShowAvatarPopup(false),
                        className: 'text-2xl hover:text-red-500 transition-colors'
                    }, '✕')
                ),
                
                // Preview Avatar
                React.createElement('div', { className: 'flex justify-center mb-6' },
                    React.createElement('div', {
                        className: 'w-48 h-48 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-6xl font-bold shadow-lg',
                        style: user.avatarURL ? {
                            backgroundImage: `url(${user.avatarURL})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        } : {}
                    }, !user.avatarURL && (user.firstName?.[0] || 'U'))
                ),
                
                // Bottoni azioni (solo se canEdit)
                canEdit && React.createElement('div', { className: 'space-y-3' },
                    // Sostituisci/Carica avatar
                    React.createElement('label', {
                        className: 'w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer flex items-center justify-center gap-2 font-semibold'
                    },
                        React.createElement('input', {
                            type: 'file',
                            accept: 'image/*',
                            onChange: handleAvatarUpload,
                            className: 'hidden',
                            disabled: isUploadingAvatar
                        }),
                        isUploadingAvatar ? '⏳ Caricamento...' : (user.avatarURL ? '🔄 Sostituisci Avatar' : '📷 Carica Avatar')
                    ),
                    
                    // Elimina avatar (solo se esiste)
                    user.avatarURL && React.createElement('button', {
                        onClick: handleDeleteAvatar,
                        disabled: isUploadingAvatar,
                        className: 'w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold'
                    }, isUploadingAvatar ? '⏳ Eliminazione...' : '🗑️ Elimina Avatar')
                ),
                
                // Info
                !canEdit && React.createElement('p', {
                    className: `text-center ${textClass} text-sm`
                }, 'Solo admin e manager possono modificare l\'avatar')
            )
        )
    );
};
