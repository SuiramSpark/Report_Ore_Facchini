window.UserManagement = function({ db, storage, currentUserRole, currentUserId, currentUser, darkMode }) {
    const [users, setUsers] = React.useState([]);
    const [filteredUsers, setFilteredUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState('all');
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [showRolePermissions, setShowRolePermissions] = React.useState(false);
    const t = window.translations || {};

    // Load all PERMANENT users from Firestore
    React.useEffect(() => {
        loadUsers();
    }, []);

    // Filter users based on search and role filter
    React.useEffect(() => {
        let filtered = [...users];

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user => 
                (user.firstName || '').toLowerCase().includes(term) ||
                (user.lastName || '').toLowerCase().includes(term) ||
                (user.email || '').toLowerCase().includes(term)
            );
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        setFilteredUsers(filtered);
    }, [searchTerm, roleFilter, users]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            // Carica SOLO utenti permanenti (esclude worker-link che sono in on-call)
            const snapshot = await db.collection('users')
                .where('isPermanent', '==', true)
                .orderBy('createdAt', 'desc')
                .get();

            const usersList = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                // ✅ Filtra fuori gli utenti con ruolo worker-link (sono in Lavoratori On-Call)
                .filter(user => user.role !== 'worker-link');

            setUsers(usersList);
        } catch (error) {
            console.error('Errore nel caricamento utenti:', error);
            showToast('⚠️ Errore caricamento utenti', 'error');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'info') => {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (currentUserRole !== 'admin') {
            showToast('❌ Solo gli admin possono eliminare utenti', 'error');
            return;
        }

        const confirmMsg = t.confirmDeleteUser || 'Sei sicuro di voler eliminare questo utente?';
        if (!confirm(`${confirmMsg}\n\n${userName}`)) {
            return;
        }

        try {
            await db.collection('users').doc(userId).delete();
            
            // Audit log for user deletion
            if (typeof addAuditLog === 'function') {
                await addAuditLog(
                    'USER_DELETE',
                    `Deleted user: ${userName}`,
                    { deletedUserId: userId, deletedUserName: userName }
                );
            }
            
            showToast('✅ ' + (t.userDeleted || 'Utente eliminato con successo'), 'success');
            await loadUsers();
        } catch (error) {
            console.error('Errore eliminazione utente:', error);
            showToast('❌ Errore durante l\'eliminazione', 'error');
        }
    };

    const getRoleBadge = (role) => {
        const roleColors = {
            admin: 'bg-red-500 text-white',
            manager: 'bg-purple-500 text-white',
            responsabile: 'bg-blue-500 text-white',
            worker: 'bg-green-500 text-white'
        };

        const roleLabels = {
            admin: t.roleAdmin || 'Admin',
            manager: t.roleManager || 'Manager',
            responsabile: t.roleResponsabile || 'Responsabile',
            worker: t.roleWorker || 'Lavoratore'
        };

        return React.createElement('span', {
            className: `px-2 py-1 rounded text-xs font-semibold ${roleColors[role] || 'bg-gray-500 text-white'}`
        }, roleLabels[role] || role);
    };

    const UserCard = ({ user }) => {
        const canEdit = currentUserRole === 'admin';
        const canDelete = currentUserRole === 'admin' && user.id !== currentUserId; // ⚠️ Non può eliminare se stesso
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        
        // Determina colore bordo in base allo stato
        const borderColor = user.suspended ? 'border-l-red-500' : 'border-l-green-500';

        return React.createElement('div', {
            className: `${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 ${borderColor}`
        },
            // Header with avatar and name
            React.createElement('div', {
                className: 'flex items-start gap-3 mb-3'
            },
                // Avatar with photo or initials
                user.avatarURL 
                    ? React.createElement('img', {
                        src: user.avatarURL,
                        alt: fullName,
                        className: 'w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-blue-500'
                    })
                    : React.createElement('div', {
                        className: 'w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0'
                    }, (user.firstName?.[0] || '?').toUpperCase()),
                
                // Name and role
                React.createElement('div', {
                    className: 'flex-1 min-w-0'
                },
                    React.createElement('h3', {
                        className: `font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'} truncate`
                    }, fullName || t.noName || 'Senza nome'),
                    
                    React.createElement('div', {
                        className: 'mt-1 flex gap-2 flex-wrap items-center'
                    }, 
                        getRoleBadge(user.role),
                        user.suspended && React.createElement('span', {
                            className: 'px-2 py-1 rounded text-xs font-semibold bg-red-500 text-white flex items-center gap-1'
                        }, '⛔ SOSPESO')
                    )
                )
            ),

            // Email and phone
            React.createElement('div', {
                className: 'space-y-1 mb-4'
            },
                user.email && React.createElement('div', {
                    className: `text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} flex items-center gap-2`
                },
                    React.createElement('span', null, '📧'),
                    React.createElement('span', { className: 'truncate' }, user.email)
                ),
                
                user.phone && React.createElement('div', {
                    className: `text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} flex items-center gap-2`
                },
                    React.createElement('span', null, '📱'),
                    React.createElement('span', null, user.phone)
                )
            ),

            // Registration date and creator info
            React.createElement('div', {
                className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3 space-y-1`
            },
                user.createdAt && React.createElement('div', null,
                    `${t.registeredOn || 'Registrato il'}: ${new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString()}`
                ),
                user.madePermanentBy && React.createElement('div', null,
                    (() => {
                        // Determina se è stato promosso o creato direttamente
                        if (!user.madePermanentAt || !user.createdAt) return `${t.createdBy || 'Creato da'}: ${user.madePermanentBy}`;
                        
                        const createdTime = user.createdAt?.toDate ? user.createdAt.toDate().getTime() : new Date(user.createdAt).getTime();
                        const madePermTime = user.madePermanentAt?.toDate ? user.madePermanentAt.toDate().getTime() : new Date(user.madePermanentAt).getTime();
                        
                        const wasPromoted = Math.abs(madePermTime - createdTime) > 1000;
                        
                        if (wasPromoted) {
                            return `${t.madePermanentOn || 'Reso fisso il'} ${new Date(madePermTime).toLocaleDateString()} da ${user.madePermanentBy}`;
                        } else {
                            return `${t.createdBy || 'Creato da'}: ${user.madePermanentBy}`;
                        }
                    })()
                )
            ),

            // Action buttons
            React.createElement('div', {
                className: 'flex gap-2 flex-wrap'
            },
                // View Profile button
                React.createElement('button', {
                    onClick: () => {
                        console.log('👤 Click su Vedi Profilo:', user);
                        setSelectedUser(user);
                    },
                    className: `flex-1 px-3 py-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded text-sm font-medium transition-colors cursor-pointer`
                }, `👤 ${t.viewProfile || 'Vedi Profilo'}`),

                // Delete button (admin only) - Rimosso bottone Modifica
                canDelete && React.createElement('button', {
                    onClick: () => handleDeleteUser(user.id, fullName),
                    className: `px-3 py-2 ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white rounded text-sm font-medium transition-colors`
                }, '🗑️')
            )
        );
    };

    const CreateUserModal = () => {
        const [formData, setFormData] = React.useState({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            role: 'worker',
            password: '',
            confirmPassword: ''
        });
        const [showPassword, setShowPassword] = React.useState(false);
        const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

        const handleSubmit = async (e) => {
            e.preventDefault();

            // Validation
            if (!formData.firstName || !formData.lastName || !formData.email) {
                showToast('❌ Compila tutti i campi obbligatori', 'error');
                return;
            }

            // Validazione email personalizzata (più permissiva della HTML5)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                showToast('❌ Inserisci un indirizzo email valido', 'error');
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                showToast('❌ ' + (t.passwordMismatch || 'Le password non corrispondono'), 'error');
                return;
            }

            try {
                // Crea nome completo dell'utente che sta creando
                console.log('🔍 DEBUG currentUser:', currentUser);
                console.log('🔍 DEBUG currentUserRole:', currentUserRole);
                
                const creatorName = currentUser && currentUser.firstName && currentUser.lastName
                    ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
                    : (currentUser && currentUser.email 
                        ? currentUser.email 
                        : 'Admin System');
                
                console.log('✅ Creator name:', creatorName);
                
                // Create user in Firestore
                const newUserRef = await db.collection('users').add({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone || '',
                    role: formData.role, // ✅ SOLO RUOLO, nessun permesso!
                    isPermanent: true,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    madePermanentAt: firebase.firestore.FieldValue.serverTimestamp(),
                    madePermanentBy: creatorName,
                    uploadCounter: { count: 0, resetDate: new Date() }
                });
                
                // Audit log for user creation
                if (typeof addAuditLog === 'function') {
                    const newUserName = `${formData.firstName} ${formData.lastName}`.trim();
                    await addAuditLog(
                        'USER_CREATE',
                        `Created user: ${newUserName}`,
                        { 
                            newUserId: newUserRef.id,
                            newUserName: newUserName,
                            email: formData.email,
                            role: formData.role
                        }
                    );
                }

                showToast('✅ ' + (t.userCreated || 'Utente creato con successo!'), 'success');
                setShowCreateModal(false);
                await loadUsers();
            } catch (error) {
                console.error('Errore creazione utente:', error);
                showToast('❌ Errore durante la creazione', 'error');
            }
        };

        return React.createElement('div', {
            className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
            onClick: (e) => {
                if (e.target === e.currentTarget) setShowCreateModal(false);
            }
        },
            React.createElement('div', {
                className: `${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto`
            },
                // Header
                React.createElement('div', {
                    className: `${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} p-4 border-b flex items-center justify-between`
                },
                    React.createElement('h2', {
                        className: 'text-xl font-bold'
                    }, `➕ ${t.createNewUser || 'Crea Nuovo Utente'}`),
                    
                    React.createElement('button', {
                        onClick: () => setShowCreateModal(false),
                        className: 'text-2xl hover:opacity-70 transition-opacity'
                    }, '×')
                ),

                // Form
                React.createElement('form', {
                    onSubmit: handleSubmit,
                    className: 'p-6 space-y-4'
                },
                    // First Name
                    React.createElement('div', null,
                        React.createElement('label', {
                            className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                        }, `${t.firstName || 'Nome'} *`),
                        React.createElement('input', {
                            type: 'text',
                            required: true,
                            value: formData.firstName,
                            onChange: (e) => setFormData({ ...formData, firstName: e.target.value }),
                            className: `w-full px-3 py-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`
                        })
                    ),

                    // Last Name
                    React.createElement('div', null,
                        React.createElement('label', {
                            className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                        }, `${t.lastName || 'Cognome'} *`),
                        React.createElement('input', {
                            type: 'text',
                            required: true,
                            value: formData.lastName,
                            onChange: (e) => setFormData({ ...formData, lastName: e.target.value }),
                            className: `w-full px-3 py-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`
                        })
                    ),

                    // Email
                    React.createElement('div', null,
                        React.createElement('label', {
                            className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                        }, `${t.email || 'Email'} *`),
                        React.createElement('input', {
                            type: 'text',
                            required: true,
                            placeholder: 'esempio@dominio.com',
                            value: formData.email,
                            onChange: (e) => setFormData({ ...formData, email: e.target.value }),
                            className: `w-full px-3 py-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`
                        })
                    ),

                    // Phone
                    React.createElement('div', null,
                        React.createElement('label', {
                            className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                        }, t.phone || 'Telefono'),
                        React.createElement('input', {
                            type: 'tel',
                            value: formData.phone,
                            onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
                            className: `w-full px-3 py-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`
                        })
                    ),

                    // Role
                    React.createElement('div', null,
                        React.createElement('label', {
                            className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                        }, `${t.role || 'Ruolo'} *`),
                        React.createElement('select', {
                            value: formData.role,
                            onChange: (e) => setFormData({ ...formData, role: e.target.value }),
                            className: `w-full px-3 py-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`
                        },
                            React.createElement('option', { value: 'worker' }, t.roleWorker || 'Worker'),
                            React.createElement('option', { value: 'responsabile' }, t.roleResponsabile || 'Responsabile'),
                            React.createElement('option', { value: 'manager' }, t.roleManager || 'Manager'),
                            currentUserRole === 'admin' && React.createElement('option', { value: 'admin' }, t.roleAdmin || 'Admin')
                        )
                    ),

                    // Password
                    React.createElement('div', null,
                        React.createElement('label', {
                            className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                        }, `${t.newPassword || 'Password'} *`),
                        React.createElement('div', {
                            className: 'relative'
                        },
                            React.createElement('input', {
                                type: showPassword ? 'text' : 'password',
                                required: true,
                                value: formData.password,
                                onChange: (e) => setFormData({ ...formData, password: e.target.value }),
                                className: `w-full px-3 py-2 pr-10 rounded border ${
                                    formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                } ${darkMode ? 'text-white' : 'text-gray-900'}`
                            }),
                            React.createElement('button', {
                                type: 'button',
                                onClick: () => setShowPassword(!showPassword),
                                className: `absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`
                            }, showPassword ? '👁️' : '👁️‍🗨️')
                        )
                    ),

                    // Confirm Password
                    React.createElement('div', null,
                        React.createElement('label', {
                            className: `block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                        }, `${t.confirmPassword || 'Conferma Password'} *`),
                        React.createElement('div', {
                            className: 'relative'
                        },
                            React.createElement('input', {
                                type: showConfirmPassword ? 'text' : 'password',
                                required: true,
                                value: formData.confirmPassword,
                                onChange: (e) => setFormData({ ...formData, confirmPassword: e.target.value }),
                                className: `w-full px-3 py-2 pr-10 rounded border ${
                                    formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                } ${darkMode ? 'text-white' : 'text-gray-900'}`
                            }),
                            React.createElement('button', {
                                type: 'button',
                                onClick: () => setShowConfirmPassword(!showConfirmPassword),
                                className: `absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`
                            }, showConfirmPassword ? '👁️' : '👁️‍🗨️')
                        )
                    ),

                    // Submit button
                    React.createElement('button', {
                        type: 'submit',
                        className: `w-full px-4 py-3 ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded font-medium transition-colors`
                    }, `✅ ${t.createNewUser || 'Crea Utente'}`)
                )
            )
        );
    };

    // 👤 Se un utente è selezionato, mostra il profilo completo FULL-PAGE
    if (selectedUser) {
        if (!window.PermanentUserProfile) {
            console.error('❌ PermanentUserProfile non caricato!');
            return React.createElement('div', {
                className: 'p-4 bg-red-100 text-red-800 rounded'
            }, '❌ Errore: Componente profilo non caricato. Ricarica la pagina (F5)');
        }
        
        console.log('✅ Apertura profilo per:', selectedUser);
        return React.createElement(window.PermanentUserProfile, {
            userId: selectedUser.id,
            currentUserRole: currentUserRole,
            currentUserId: currentUserId || 'admin', // Fallback per compatibilità
            onBack: () => {
                setSelectedUser(null);
                loadUsers(); // Ricarica la lista dopo aver chiuso il profilo
            },
            db: db,
            storage: storage,
            darkMode: darkMode,
            language: 'it' // Default language
        });
    }

    // 🔐 Confronto permessi per ruolo
    if (showRolePermissions) {
        const RolePermissionsComparison = () => {
            const roles = ['admin', 'manager', 'responsabile', 'worker', 'worker-link'];
            
            // Nomi ruoli con multilingua
            const roleNames = {
                it: {
                    admin: '👑 Admin',
                    manager: '💼 Manager',
                    responsabile: '👔 Responsabile',
                    worker: '👷 Worker',
                    'worker-link': '🔗 Worker-Link'
                },
                en: {
                    admin: '👑 Admin',
                    manager: '💼 Manager',
                    responsabile: '👔 Supervisor',
                    worker: '👷 Worker',
                    'worker-link': '🔗 Worker-Link'
                }
            };

            // Ottieni lingua corrente (default: italiano)
            const currentLang = window.currentLanguage || 'it';

            // Raggruppa funzionalità per categoria con traduzioni complete IT + EN
            const featureCategories = {
                it: {
                    '📊 Dashboard & Navigazione': [
                        { feature: 'dashboard.view', name: 'Visualizza Dashboard', tooltip: 'Accesso alla schermata principale con statistiche e grafici' },
                        { feature: 'calendar.view', name: 'Visualizza Calendario', tooltip: 'Accesso al calendario con i fogli di lavoro' },
                        { feature: 'calendar.clickSheets', name: 'Aprire Fogli dal Calendario', tooltip: 'Possibilità di cliccare e aprire i fogli direttamente dal calendario' },
                        { feature: 'sheets.view', name: 'Visualizza Elenco Fogli', tooltip: 'Accesso alla lista completa dei fogli di lavoro' },
                        { feature: 'sheets.viewOwn', name: 'Visualizza Solo Propri Fogli', tooltip: 'Vedere solo i fogli dove si è assegnati come lavoratore' },
                        { feature: 'reports.view', name: 'Visualizza Report', tooltip: 'Accesso ai report dettagliati e statistiche avanzate' }
                    ],
                    '📄 Gestione Fogli': [
                        { feature: 'sheets.save', name: 'Creare/Salvare Fogli', tooltip: 'Possibilità di creare nuovi fogli e salvare modifiche' },
                        { feature: 'sheets.delete', name: 'Eliminare Fogli', tooltip: 'Cancellare definitivamente fogli di lavoro' },
                        { feature: 'sheets.archive', name: 'Archiviare Fogli', tooltip: 'Archiviare fogli completati (rimangono consultabili)' },
                        { feature: 'sheets.changeDate', name: 'Modificare Data', tooltip: 'Cambiare la data del foglio di lavoro' },
                        { feature: 'sheets.changeCompany', name: 'Modificare Azienda', tooltip: 'Cambiare l\'azienda assegnata al foglio' },
                        { feature: 'sheets.changeSupervisor', name: 'Modificare Responsabile', tooltip: 'Assegnare un diverso responsabile al foglio' },
                        { feature: 'sheets.changeAddress', name: 'Modificare Indirizzo', tooltip: 'Cambiare l\'indirizzo del cantiere/sede' },
                        { feature: 'sheets.changeEstimatedHours', name: 'Modificare Ore Previste', tooltip: 'Cambiare le ore stimate per il lavoro' },
                        { feature: 'sheets.changeActivity', name: 'Modificare Tipo Attività', tooltip: 'Cambiare la tipologia di attività svolta' },
                        { feature: 'sheets.changeWeather', name: 'Modificare Meteo', tooltip: 'Cambiare città per rilevamento meteo automatico' }
                    ],
                    '👥 Gestione Lavoratori nei Fogli': [
                        { feature: 'sheets.addWorkers', name: 'Aggiungere Lavoratori', tooltip: 'Assegnare lavoratori al foglio di lavoro' },
                        { feature: 'sheets.modifyOwnData', name: 'Modificare Propri Dati', tooltip: 'Modificare solo le proprie ore e note (modalità worker)' },
                        { feature: 'sheets.addWeatherCity', name: 'Aggiungere Città Meteo', tooltip: 'Impostare la città per il rilevamento meteo automatico' },
                        { feature: 'sheets.generateLink', name: 'Generare Link Condivisione', tooltip: 'Creare link temporaneo per compilazione da parte di lavoratori esterni' }
                    ],
                    '✍️ Firme': [
                        { feature: 'sheets.signAsSupervisor', name: 'Firmare come Responsabile', tooltip: 'Apporre firma digitale come responsabile del foglio' }
                    ],
                    '📥 PDF & Export': [
                        { feature: 'sheets.generatePdf', name: 'Generare PDF', tooltip: 'Creare documento PDF del foglio di lavoro' },
                        { feature: 'sheets.downloadPdf', name: 'Scaricare PDF', tooltip: 'Download del PDF generato' }
                    ],
                    '👤 Gestione Utenti': [
                        { feature: 'users.view', name: 'Visualizza Lista Utenti', tooltip: 'Accesso all\'elenco di tutti gli utenti registrati' },
                        { feature: 'users.viewProfiles', name: 'Visualizza Profili', tooltip: 'Vedere le informazioni base degli utenti' },
                        { feature: 'users.viewFullProfile', name: 'Visualizza Profilo Completo', tooltip: 'Accesso a tutte le informazioni dettagliate dell\'utente' },
                        { feature: 'users.viewInfoAndStats', name: 'Visualizza Solo Info+Stats', tooltip: 'Visualizzazione limitata (solo informazioni e statistiche)' },
                        { feature: 'users.modify', name: 'Modificare Utenti', tooltip: 'Modificare ruoli, dati e permessi degli utenti' },
                        { feature: 'users.delete', name: 'Eliminare Utenti', tooltip: 'Cancellare definitivamente utenti dal sistema' }
                    ],
                    '📞 Lavoratori On-Call': [
                        { feature: 'onCall.view', name: 'Visualizza On-Call', tooltip: 'Accesso alla sezione lavoratori disponibili' },
                        { feature: 'onCall.viewProfiles', name: 'Visualizza Profili On-Call', tooltip: 'Vedere i dettagli dei lavoratori disponibili' },
                        { feature: 'onCall.addToBlacklist', name: 'Aggiungere a Blacklist', tooltip: 'Spostare lavoratori nella blacklist' }
                    ],
                    '🚫 Blacklist': [
                        { feature: 'blacklist.view', name: 'Visualizza Blacklist', tooltip: 'Accesso all\'elenco lavoratori bloccati' },
                        { feature: 'blacklist.giveSecondChance', name: 'Dare Seconda Opportunità', tooltip: 'Rimuovere lavoratore dalla blacklist e riabilitarlo' }
                    ],
                    '⚙️ Impostazioni': [
                        { feature: 'settings.view', name: 'Visualizza Impostazioni', tooltip: 'Accesso alla sezione impostazioni' },
                        { feature: 'settings.general', name: 'Impostazioni Generali', tooltip: 'Modificare impostazioni base dell\'applicazione' },
                        { feature: 'settings.companies', name: 'Gestione Aziende', tooltip: 'Aggiungere/modificare aziende' },
                        { feature: 'settings.addresses', name: 'Visualizza Indirizzi', tooltip: 'Vedere l\'elenco degli indirizzi salvati' },
                        { feature: 'settings.addresses.modify', name: 'Modificare Indirizzi', tooltip: 'Aggiungere/modificare/eliminare indirizzi' },
                        { feature: 'settings.activities', name: 'Gestione Attività', tooltip: 'Configurare i tipi di attività disponibili' },
                        { feature: 'settings.advanced', name: 'Impostazioni Avanzate', tooltip: 'Accesso a configurazioni avanzate' },
                        { feature: 'settings.calendar', name: 'Impostazioni Calendario', tooltip: 'Configurare visualizzazione e comportamento calendario' },
                        { feature: 'settings.log', name: 'Registro Modifiche', tooltip: 'Visualizzare log delle modifiche (audit log)' },
                        { feature: 'settings.terms', name: 'Termini e Condizioni', tooltip: 'Visualizzare termini di servizio' },
                        { feature: 'settings.gdpr', name: 'Privacy (GDPR)', tooltip: 'Informazioni privacy e protezione dati' },
                        { feature: 'settings.modify', name: 'Modificare Impostazioni', tooltip: 'Permesso di modificare le configurazioni' },
                        { feature: 'settings.viewOnly', name: 'Solo Visualizzazione', tooltip: 'Accesso in sola lettura alle impostazioni' }
                    ],
                    '👤 Profilo Personale': [
                        { feature: 'profile.viewOwn', name: 'Visualizza Proprio Profilo', tooltip: 'Accesso al proprio profilo utente' },
                        { feature: 'profile.viewAdminSection', name: 'Sezione Admin Profilo', tooltip: 'Accesso alle funzionalità amministrative del profilo' }
                    ],
                    '🔗 Accesso Worker-Link': [
                        { feature: 'workerLink.fillForm', name: 'Compilare Form Temporaneo', tooltip: 'Accesso limitato per compilare ore tramite link temporaneo (nessun login permanente)' }
                    ]
                },
                en: {
                    '📊 Dashboard & Navigation': [
                        { feature: 'dashboard.view', name: 'View Dashboard', tooltip: 'Access to main screen with statistics and charts' },
                        { feature: 'calendar.view', name: 'View Calendar', tooltip: 'Access to calendar with work sheets' },
                        { feature: 'calendar.clickSheets', name: 'Open Sheets from Calendar', tooltip: 'Ability to click and open sheets directly from calendar' },
                        { feature: 'sheets.view', name: 'View Sheet List', tooltip: 'Access to complete list of work sheets' },
                        { feature: 'sheets.viewOwn', name: 'View Only Own Sheets', tooltip: 'See only sheets where assigned as worker' },
                        { feature: 'reports.view', name: 'View Reports', tooltip: 'Access to detailed reports and advanced statistics' }
                    ],
                    '📄 Sheet Management': [
                        { feature: 'sheets.save', name: 'Create/Save Sheets', tooltip: 'Ability to create new sheets and save changes' },
                        { feature: 'sheets.delete', name: 'Delete Sheets', tooltip: 'Permanently delete work sheets' },
                        { feature: 'sheets.archive', name: 'Archive Sheets', tooltip: 'Archive completed sheets (remain accessible)' },
                        { feature: 'sheets.changeDate', name: 'Modify Date', tooltip: 'Change the work sheet date' },
                        { feature: 'sheets.changeCompany', name: 'Modify Company', tooltip: 'Change the company assigned to the sheet' },
                        { feature: 'sheets.changeSupervisor', name: 'Modify Supervisor', tooltip: 'Assign a different supervisor to the sheet' },
                        { feature: 'sheets.changeAddress', name: 'Modify Address', tooltip: 'Change the construction site/office address' },
                        { feature: 'sheets.changeEstimatedHours', name: 'Modify Estimated Hours', tooltip: 'Change estimated hours for the work' },
                        { feature: 'sheets.changeActivity', name: 'Modify Activity Type', tooltip: 'Change the type of activity performed' },
                        { feature: 'sheets.changeWeather', name: 'Modify Weather', tooltip: 'Change city for automatic weather detection' }
                    ],
                    '👥 Worker Management in Sheets': [
                        { feature: 'sheets.addWorkers', name: 'Add Workers', tooltip: 'Assign workers to work sheet' },
                        { feature: 'sheets.modifyOwnData', name: 'Modify Own Data', tooltip: 'Modify only own hours and notes (worker mode)' },
                        { feature: 'sheets.addWeatherCity', name: 'Add Weather City', tooltip: 'Set city for automatic weather detection' },
                        { feature: 'sheets.generateLink', name: 'Generate Sharing Link', tooltip: 'Create temporary link for external workers to fill in' }
                    ],
                    '✍️ Signatures': [
                        { feature: 'sheets.signAsSupervisor', name: 'Sign as Supervisor', tooltip: 'Add digital signature as sheet supervisor' }
                    ],
                    '📥 PDF & Export': [
                        { feature: 'sheets.generatePdf', name: 'Generate PDF', tooltip: 'Create PDF document of work sheet' },
                        { feature: 'sheets.downloadPdf', name: 'Download PDF', tooltip: 'Download generated PDF' }
                    ],
                    '👤 User Management': [
                        { feature: 'users.view', name: 'View User List', tooltip: 'Access to list of all registered users' },
                        { feature: 'users.viewProfiles', name: 'View Profiles', tooltip: 'See basic user information' },
                        { feature: 'users.viewFullProfile', name: 'View Full Profile', tooltip: 'Access to all detailed user information' },
                        { feature: 'users.viewInfoAndStats', name: 'View Only Info+Stats', tooltip: 'Limited view (information and statistics only)' },
                        { feature: 'users.modify', name: 'Modify Users', tooltip: 'Modify user roles, data and permissions' },
                        { feature: 'users.delete', name: 'Delete Users', tooltip: 'Permanently delete users from system' }
                    ],
                    '📞 On-Call Workers': [
                        { feature: 'onCall.view', name: 'View On-Call', tooltip: 'Access to available workers section' },
                        { feature: 'onCall.viewProfiles', name: 'View On-Call Profiles', tooltip: 'See details of available workers' },
                        { feature: 'onCall.addToBlacklist', name: 'Add to Blacklist', tooltip: 'Move workers to blacklist' }
                    ],
                    '🚫 Blacklist': [
                        { feature: 'blacklist.view', name: 'View Blacklist', tooltip: 'Access to blocked workers list' },
                        { feature: 'blacklist.giveSecondChance', name: 'Give Second Chance', tooltip: 'Remove worker from blacklist and re-enable' }
                    ],
                    '⚙️ Settings': [
                        { feature: 'settings.view', name: 'View Settings', tooltip: 'Access to settings section' },
                        { feature: 'settings.general', name: 'General Settings', tooltip: 'Modify basic application settings' },
                        { feature: 'settings.companies', name: 'Company Management', tooltip: 'Add/modify companies' },
                        { feature: 'settings.addresses', name: 'View Addresses', tooltip: 'See list of saved addresses' },
                        { feature: 'settings.addresses.modify', name: 'Modify Addresses', tooltip: 'Add/modify/delete addresses' },
                        { feature: 'settings.activities', name: 'Activity Management', tooltip: 'Configure available activity types' },
                        { feature: 'settings.advanced', name: 'Advanced Settings', tooltip: 'Access to advanced configurations' },
                        { feature: 'settings.calendar', name: 'Calendar Settings', tooltip: 'Configure calendar display and behavior' },
                        { feature: 'settings.log', name: 'Modification Log', tooltip: 'View change log (audit log)' },
                        { feature: 'settings.terms', name: 'Terms & Conditions', tooltip: 'View terms of service' },
                        { feature: 'settings.gdpr', name: 'Privacy (GDPR)', tooltip: 'Privacy information and data protection' },
                        { feature: 'settings.modify', name: 'Modify Settings', tooltip: 'Permission to modify configurations' },
                        { feature: 'settings.viewOnly', name: 'View Only', tooltip: 'Read-only access to settings' }
                    ],
                    '👤 Personal Profile': [
                        { feature: 'profile.viewOwn', name: 'View Own Profile', tooltip: 'Access to own user profile' },
                        { feature: 'profile.viewAdminSection', name: 'Admin Profile Section', tooltip: 'Access to administrative profile features' }
                    ],
                    '🔗 Worker-Link Access': [
                        { feature: 'workerLink.fillForm', name: 'Fill Temporary Form', tooltip: 'Limited access to fill hours via temporary link (no permanent login)' }
                    ]
                }
            };

            // Funzione per verificare se un ruolo ha accesso a una feature
            const hasFeatureAccess = (role, feature) => {
                // Worker-link ha accesso solo alla compilazione form temporanea
                if (role === 'worker-link') {
                    return feature === 'workerLink.fillForm';
                }
                
                if (!window.hasRoleAccess) return false;
                return window.hasRoleAccess({ role: role }, feature);
            };

            // Ottieni categorie e traduzioni per lingua corrente
            const categories = featureCategories[currentLang] || featureCategories['it'];
            const roleLabels = roleNames[currentLang] || roleNames['it'];

            // Traduzioni header
            const headerTexts = {
                it: {
                    title: '🔐 Confronto Permessi per Ruolo',
                    subtitle: 'Confronta le funzionalità disponibili per ciascun ruolo',
                    back: '← Indietro',
                    featureColumn: 'Funzionalità'
                },
                en: {
                    title: '🔐 Role Permissions Comparison',
                    subtitle: 'Compare features available for each role',
                    back: '← Back',
                    featureColumn: 'Feature'
                }
            };

            const texts = headerTexts[currentLang] || headerTexts['it'];

            return React.createElement('div', {
                className: 'h-full flex flex-col'
            },
                // Header con pulsante Back
                React.createElement('div', {
                    className: `${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-3 sm:p-4`
                },
                    React.createElement('div', {
                        className: 'flex items-center gap-2 sm:gap-3'
                    },
                        React.createElement('button', {
                            onClick: () => setShowRolePermissions(false),
                            className: `px-3 py-2 sm:px-4 sm:py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded transition-colors text-sm sm:text-base min-h-[44px]`
                        }, texts.back),
                        React.createElement('h1', {
                            className: `text-lg sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`
                        }, texts.title)
                    ),
                    React.createElement('p', {
                        className: `mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                    }, texts.subtitle)
                ),

                // Contenuto scrollabile
                React.createElement('div', {
                    className: 'flex-1 overflow-y-auto p-2 sm:p-4'
                },
                    React.createElement('div', {
                        className: 'space-y-4 sm:space-y-6'
                    },
                        // Per ogni categoria, mostra tabella comparativa
                        ...Object.entries(categories).map(([categoryName, features]) => {
                            return React.createElement('div', {
                                key: categoryName,
                                className: `${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg overflow-hidden`
                            },
                                // Header categoria
                                React.createElement('div', {
                                    className: `px-3 py-2 sm:px-4 sm:py-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`
                                },
                                    React.createElement('h3', {
                                        className: `text-sm sm:text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`
                                    }, `${categoryName} (${features.length})`)
                                ),

                                // Tabella funzionalità
                                React.createElement('div', {
                                    className: 'overflow-x-auto'
                                },
                                    React.createElement('table', {
                                        className: 'w-full text-xs sm:text-sm'
                                    },
                                        // Header tabella
                                        React.createElement('thead', null,
                                            React.createElement('tr', {
                                                className: darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                                            },
                                                React.createElement('th', {
                                                    className: `px-2 py-1.5 sm:px-4 sm:py-2 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-xs sm:text-sm`
                                                }, texts.featureColumn),
                                                ...roles.map(role =>
                                                    React.createElement('th', {
                                                        key: role,
                                                        className: `px-1 py-1.5 sm:px-4 sm:py-2 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-xs sm:text-sm`
                                                    }, roleLabels[role])
                                                )
                                            )
                                        ),

                                        // Body tabella
                                        React.createElement('tbody', null,
                                            ...features.map((featureData, idx) =>
                                                React.createElement('tr', {
                                                    key: featureData.feature,
                                                    className: `${idx % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-750' : 'bg-gray-50')} group hover:${darkMode ? 'bg-gray-700' : 'bg-blue-50'} transition-colors`
                                                },
                                                    // Nome funzionalità con tooltip
                                                    React.createElement('td', {
                                                        className: `px-2 py-1.5 sm:px-4 sm:py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`,
                                                        title: featureData.tooltip
                                                    },
                                                        React.createElement('div', {
                                                            className: 'flex items-start gap-1 sm:gap-2'
                                                        },
                                                            React.createElement('span', {
                                                                className: 'font-medium text-xs sm:text-sm break-words'
                                                            }, featureData.name),
                                                            React.createElement('span', {
                                                                className: `text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`,
                                                                style: { fontSize: '10px' }
                                                            }, '💡')
                                                        ),
                                                        // Tooltip che appare sempre sotto
                                                        React.createElement('div', {
                                                            className: `text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1 italic leading-tight`
                                                        }, featureData.tooltip)
                                                    ),
                                                    // Checkmark per ogni ruolo
                                                    ...roles.map(role =>
                                                        React.createElement('td', {
                                                            key: role,
                                                            className: 'px-1 py-1.5 sm:px-4 sm:py-2 text-center'
                                                        }, hasFeatureAccess(role, featureData.feature)
                                                            ? React.createElement('span', {
                                                                className: 'text-green-500 font-bold text-base sm:text-lg'
                                                            }, '✅')
                                                            : React.createElement('span', {
                                                                className: 'text-red-500 font-bold text-base sm:text-lg'
                                                            }, '❌')
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            );
                        })
                    )
                )
            );
        };

        return React.createElement(RolePermissionsComparison);
    }

    // 📋 Mostra la lista utenti
    return React.createElement('div', {
        className: 'h-full flex flex-col'
    },
        // Header with search and filters
        React.createElement('div', {
            className: `${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 space-y-4`
        },
            // Title and create button
            React.createElement('div', {
                className: 'flex items-center justify-between gap-3 flex-wrap'
            },
                React.createElement('h1', {
                    className: `text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`
                }, `👥 ${t.permanentUsers || 'Utenti Registrati'}`),

                React.createElement('div', {
                    className: 'flex gap-2'
                },
                    // Confronta Permessi button
                    React.createElement('button', {
                        onClick: () => setShowRolePermissions(true),
                        className: `px-4 py-2 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white rounded font-medium transition-colors`
                    }, `🔐 ${t.compareRoles || 'Confronta Ruoli'}`),

                    // Create User button (solo admin/manager)
                    (currentUserRole === 'admin' || currentUserRole === 'manager') && React.createElement('button', {
                        onClick: () => setShowCreateModal(true),
                        className: `px-4 py-2 ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded font-medium transition-colors`
                    }, `➕ ${t.createNewUser || 'Crea Nuovo Utente'}`)
                )
            ),

            // 📊 Statistics Cards
            React.createElement('div', {
                className: 'grid grid-cols-2 md:grid-cols-5 gap-3 mt-3'
            },
                // Total Users
                React.createElement('div', {
                    className: `${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3`
                },
                    React.createElement('div', {
                        className: 'text-center'
                    },
                        React.createElement('div', {
                            className: `text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`
                        }, users.length),
                        React.createElement('div', {
                            className: `text-xs ${darkMode ? 'text-blue-400' : 'text-blue-700'}`
                        }, t.totalUsers || 'Totale Utenti')
                    )
                ),
                // Admin Count
                React.createElement('div', {
                    className: `${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'} border rounded-lg p-3`
                },
                    React.createElement('div', {
                        className: 'text-center'
                    },
                        React.createElement('div', {
                            className: `text-2xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`
                        }, users.filter(u => u.role === 'admin').length),
                        React.createElement('div', {
                            className: `text-xs ${darkMode ? 'text-purple-400' : 'text-purple-700'}`
                        }, '👑 ' + (t.admin || 'Admin'))
                    )
                ),
                // Manager Count
                React.createElement('div', {
                    className: `${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg p-3`
                },
                    React.createElement('div', {
                        className: 'text-center'
                    },
                        React.createElement('div', {
                            className: `text-2xl font-bold ${darkMode ? 'text-green-300' : 'text-green-600'}`
                        }, users.filter(u => u.role === 'manager').length),
                        React.createElement('div', {
                            className: `text-xs ${darkMode ? 'text-green-400' : 'text-green-700'}`
                        }, '📋 ' + (t.manager || 'Manager'))
                    )
                ),
                // Responsabile Count
                React.createElement('div', {
                    className: `${darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-3`
                },
                    React.createElement('div', {
                        className: 'text-center'
                    },
                        React.createElement('div', {
                            className: `text-2xl font-bold ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`
                        }, users.filter(u => u.role === 'responsabile').length),
                        React.createElement('div', {
                            className: `text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`
                        }, '👔 ' + (t.roleResponsabile || 'Responsabile'))
                    )
                ),
                // Worker Count
                React.createElement('div', {
                    className: `${darkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-200'} border rounded-lg p-3`
                },
                    React.createElement('div', {
                        className: 'text-center'
                    },
                        React.createElement('div', {
                            className: `text-2xl font-bold ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`
                        }, users.filter(u => u.role === 'worker').length),
                        React.createElement('div', {
                            className: `text-xs ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`
                        }, '👷 ' + (t.worker || 'Worker'))
                    )
                )
            ),

            // Search and filter row
            React.createElement('div', {
                className: 'flex gap-3 flex-wrap'
            },
                // Search input
                React.createElement('div', {
                    className: 'flex-1 min-w-[200px]'
                },
                    React.createElement('input', {
                        type: 'text',
                        placeholder: t.searchUsers || 'Cerca utenti...',
                        value: searchTerm,
                        onChange: (e) => setSearchTerm(e.target.value),
                        className: `w-full px-4 py-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`
                    })
                ),

                // Role filter
                React.createElement('select', {
                    value: roleFilter,
                    onChange: (e) => setRoleFilter(e.target.value),
                    className: `px-4 py-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`
                },
                    React.createElement('option', { value: 'all' }, t.allUsers || 'Tutti i Ruoli'),
                    React.createElement('option', { value: 'admin' }, t.roleAdmin || 'Admin'),
                    React.createElement('option', { value: 'manager' }, t.roleManager || 'Manager'),
                    React.createElement('option', { value: 'responsabile' }, t.roleResponsabile || 'Responsabile'),
                    React.createElement('option', { value: 'worker' }, t.roleWorker || 'Worker')
                )
            )
        ),

        // Content area
        React.createElement('div', {
            className: 'flex-1 overflow-y-auto p-4'
        },
            loading ? React.createElement('div', {
                className: `text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
            }, '⏳ Caricamento...') :
            
            filteredUsers.length === 0 ? React.createElement('div', {
                className: `text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
            },
                React.createElement('div', {
                    className: 'text-6xl mb-4'
                }, '👥'),
                React.createElement('p', {
                    className: 'text-xl'
                }, t.noUsersFound || 'Nessun utente trovato')
            ) :

            React.createElement('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            }, filteredUsers.map(user => 
                React.createElement(UserCard, {
                    key: user.id,
                    user: user
                })
            ))
        ),

        // Create user modal
        showCreateModal && React.createElement(CreateUserModal)
    );
};
