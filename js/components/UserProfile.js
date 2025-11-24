/**
 * User Profile Component
 * Profilo utente completo con avatar, info personali e sezione documenti integrata
 */

const UserProfile = ({ userId, workerName, currentUserRole, onClose, onUserMadePermanent, db, storage, darkMode }) => {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('info'); // info, documents, settings
    const [documents, setDocuments] = React.useState([]);
    const [uploadLimits, setUploadLimits] = React.useState(null);
    const [storageUsage, setStorageUsage] = React.useState(null);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [isUploading, setIsUploading] = React.useState(false);
    const [previewDocument, setPreviewDocument] = React.useState(null);
    const [filterType, setFilterType] = React.useState('all');
    const [sortBy, setSortBy] = React.useState('date');
    // Editable profile state
    const [editMode, setEditMode] = React.useState(false);
    // Password change state
    const [pwMode, setPwMode] = React.useState(false);
    const [pwData, setPwData] = React.useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [pwLoading, setPwLoading] = React.useState(false);
    const [editData, setEditData] = React.useState({ firstName: '', lastName: '', email: '', phone: '', avatar: '' });
    
    const t = window.translations || {};
    
    // Carica dati utente
    React.useEffect(() => {
        loadUserData();
    }, [userId]);
    
    const loadUserData = async () => {
        try {
            setLoading(true);
            let userDoc = await db.collection('users').doc(userId).get();
            
            // Se l'utente non esiste E abbiamo il workerName, crealo automaticamente
            if (!userDoc.exists && workerName) {
                console.log(`📝 Creazione automatica profilo per: ${workerName}`);
                
                const [firstName, ...lastNameParts] = workerName.split(' ');
                const lastName = lastNameParts.join(' ');
                
                await db.collection('users').doc(userId).set({
                    firstName: firstName || '',
                    lastName: lastName || '',
                    email: '',
                    phone: '',
                    role: 'worker',
                    isPermanent: false, // Inizialmente temporaneo/on-call
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    documenti: [],
                    uploadCounter: { count: 0, resetDate: new Date() }
                });
                
                // Ricarica il documento appena creato
                userDoc = await db.collection('users').doc(userId).get();
            }
            
            if (!userDoc.exists) {
                showToast('❌ Utente non trovato', 'error');
                onClose();
                return;
            }
            
            const userData = userDoc.data();
            setUser({ id: userId, ...userData });
            setDocuments(userData.documenti || []);
            setEditData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                phone: userData.phone || '',
                avatar: userData.avatar || ''
            });
            
            // Calcola limiti e storage
            if (window.StorageManager) {
                const limits = await window.StorageManager.canUploadDocument(userId);
                setUploadLimits(limits);
                
                const usage = await window.StorageManager.calculateUserStorage(userId);
                setStorageUsage(usage);
            }
            
        } catch (error) {
            console.error('Errore caricamento profilo:', error);
            showToast('❌ ' + (t.errorLoading || 'Errore caricamento'), 'error');
        } finally {
            setLoading(false);
        }
    };
    
    // Verifica permessi (se utente corrente può vedere questo profilo)
    // Editable profile logic
    // Password change logic
    const handleChangePassword = async () => {
        console.log('🔑 Cambio password - userId:', userId, 'currentUser:', user);
        
        if (!canEditProfile()) {
            showToast('❌ Non hai permessi per cambiare la password', 'error');
            return;
        }
        if (!pwData.newPassword || pwData.newPassword.length < 6) {
            showToast('❌ Password troppo corta', 'error');
            return;
        }
        if (pwData.newPassword !== pwData.confirmPassword) {
            showToast('❌ Le password non corrispondono', 'error');
            return;
        }
        setPwLoading(true);
        try {
            // Se userId è 'admin', trova il vero documento tramite email
            let realUserId = userId;
            if (userId === 'admin' && user && user.email) {
                console.log('🔍 Admin detected - searching real userId by email:', user.email);
                const usersSnapshot = await db.collection('users')
                    .where('email', '==', user.email)
                    .limit(1)
                    .get();
                
                if (!usersSnapshot.empty) {
                    realUserId = usersSnapshot.docs[0].id;
                    console.log('✅ Found real userId:', realUserId);
                } else {
                    showToast('❌ Account utente non trovato nel database', 'error');
                    setPwLoading(false);
                    return;
                }
            }
            
            console.log('💾 Salvataggio password per userId:', realUserId, 'nuova password:', pwData.newPassword);
            
            // Salva password in chiaro (per permettere modifica manuale da admin)
            await db.collection('users').doc(realUserId).update({ 
                password: pwData.newPassword,
                updatedAt: new Date().toISOString()
            });
            
            console.log('✅ Password salvata con successo!');
            showToast('✅ Password aggiornata', 'success');
            setPwMode(false);
            setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('❌ Errore salvataggio password:', error);
            showToast('❌ Errore cambio password: ' + (error.message || error), 'error');
        } finally {
            setPwLoading(false);
        }
    };
    const canEditProfile = () => {
        // Admin can edit anyone, user can edit self
        if (currentUserRole === 'admin') return true;
        if (user && user.id === userId) return true;
        return false;
    };

    const handleEditProfile = async () => {
        if (!canEditProfile()) {
            showToast('❌ Non hai permessi per modificare il profilo', 'error');
            return;
        }
        setLoading(true);
        try {
            await db.collection('users').doc(userId).update({
                firstName: editData.firstName,
                lastName: editData.lastName,
                email: editData.email,
                phone: editData.phone,
                avatar: editData.avatar
            });
            showToast('✅ Profilo aggiornato', 'success');
            setEditMode(false);
            await loadUserData();
        } catch (error) {
            showToast('❌ Errore aggiornamento profilo', 'error');
        } finally {
            setLoading(false);
        }
    };
    const canView = () => {
        if (currentUserRole === 'admin') return true;
        if (currentUserRole === 'manager' || currentUserRole === 'datore') return true;
        return false; // Worker può vedere solo il suo
    };
    
    const canEdit = () => {
        if (currentUserRole === 'admin') return true;
        return false; // Solo admin può modificare
    };
    
    const canUploadForUser = () => {
        if (currentUserRole === 'admin') return true; // Admin può caricare per chiunque
        if (user && user.id === userId) return true; // Può caricare per sé stesso
        return false;
    };
    
    const canMakePermanent = () => {
        // Solo admin e manager possono rendere fisso un utente
        if (currentUserRole === 'admin' || currentUserRole === 'manager') return true;
        return false;
    };
    
    // Rendi utente permanente
    const handleMakePermanent = async () => {
        if (!canMakePermanent()) {
            showToast('❌ Non hai permessi per questa operazione', 'error');
            return;
        }
        
        if (user.isPermanent) {
            showToast('ℹ️ Utente già permanente', 'info');
            return;
        }
        
        if (!confirm(t.confirmMakePermanent || 'Confermi di rendere questo lavoratore un utente fisso?')) {
            return;
        }
        
        try {
            // Aggiorna utente in Firestore
            await db.collection('users').doc(userId).update({
                isPermanent: true,
                madePermanentAt: firebase.firestore.FieldValue.serverTimestamp(),
                madePermanentBy: currentUserRole // chi ha fatto l'operazione
            });
            
            showToast('✅ ' + (t.userMadePermanent || 'Utente reso fisso con successo!'), 'success');
            
            // Ricarica dati
            await loadUserData();
            
            // Notifica al componente padre per aggiornare le liste
            if (onUserMadePermanent) {
                onUserMadePermanent(userId);
            }
            
            // Chiudi il modale dopo 1 secondo
            setTimeout(() => {
                onClose();
            }, 1000);
            
        } catch (error) {
            console.error('Errore durante conversione:', error);
            showToast('❌ Errore durante la conversione', 'error');
        }
    };
    
    // Upload documento
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!canUploadForUser()) {
            showToast('❌ Non hai permessi per caricare documenti', 'error');
            return;
        }
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const result = await window.StorageManager.uploadDocument(
                userId,
                file,
                currentUserRole === 'admin' ? 'admin-upload' : userId,
                (progress) => setUploadProgress(progress)
            );
            showToast('✅ Documento caricato con successo!', 'success');
            await loadUserData(); // aggiorna lista documenti
        } catch (error) {
            console.error('Errore upload:', error);
            showToast('❌ Errore durante l\'upload: ' + error.message, 'error');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            event.target.value = '';
        }
    };
    
    // Elimina documento
    const handleDeleteDocument = async (doc) => {
        if (!canEdit()) {
            showToast('❌ Solo admin può eliminare documenti', 'error');
            return;
        }
        if (!confirm(`Confermi eliminazione: ${doc.nome}?`)) return;
        try {
            await window.StorageManager.deleteDocument(userId, doc.path, doc);
            showToast('✅ Documento eliminato!', 'success');
            await loadUserData(); // aggiorna lista documenti
        } catch (error) {
            console.error('Errore eliminazione:', error);
            showToast('❌ Errore durante l\'eliminazione: ' + error.message, 'error');
        }
    };
    
    // Download documento
    const handleDownloadDocument = (doc) => {
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.nome;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // Filtra e ordina documenti
    const filteredDocuments = React.useMemo(() => {
        let filtered = [...documents];
        
        if (filterType === 'pdf') {
            filtered = filtered.filter(d => d.type === 'application/pdf');
        } else if (filterType === 'image') {
            filtered = filtered.filter(d => d.type?.startsWith('image/'));
        }
        
        if (sortBy === 'date') {
            filtered.sort((a, b) => (b.uploadedAt?.toMillis() || 0) - (a.uploadedAt?.toMillis() || 0));
        } else if (sortBy === 'name') {
            filtered.sort((a, b) => a.nome.localeCompare(b.nome));
        } else if (sortBy === 'size') {
            filtered.sort((a, b) => b.size - a.size);
        }
        
        return filtered;
    }, [documents, filterType, sortBy]);
    
    const getFileIcon = (type) => {
        if (type === 'application/pdf') return '📄';
        if (type?.startsWith('image/')) return '🖼️';
        return '📎';
    };
    
    const storagePercentage = React.useMemo(() => {
        if (!storageUsage || user?.role === 'admin') return 0;
        const limits = window.StorageManager?.getUploadLimits(user?.role);
        if (!limits) return 0;
        return (storageUsage.totalBytes / limits.maxTotalStorage) * 100;
    }, [storageUsage, user?.role]);
    
    const getStorageColor = () => {
        if (storagePercentage > 90) return 'red';
        if (storagePercentage > 70) return 'orange';
        return 'green';
    };
    
    if (loading) {
        return React.createElement('div', {
            className: `fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-black bg-opacity-70' : 'bg-gray-900 bg-opacity-50'}`
        },
            React.createElement('div', {
                className: `${darkMode ? 'text-white' : 'text-gray-900'} text-xl`
            }, '⏳ Caricamento...')
        );
    }
    
    if (!user) {
        return null;
    }
    
    return React.createElement('div', {
        className: `fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-black bg-opacity-70' : 'bg-gray-900 bg-opacity-50'}`
    },
        React.createElement('div', {
            className: `w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`
        },
            // Header
            React.createElement('div', {
                className: `flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'}`
            },
                React.createElement('div', { className: 'flex items-center gap-4' },
                    // Avatar
                    React.createElement('div', {
                        className: `w-16 h-16 rounded-full flex items-center justify-center text-3xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`
                    }, user.avatar || '👤'),
                    // Nome e ruolo
                    React.createElement('div', {},
                        React.createElement('h2', {
                            className: `text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`
                        }, `${user.firstName || ''} ${user.lastName || ''}`),
                        React.createElement('p', {
                            className: `text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, 
                            React.createElement('span', {
                                className: `px-2 py-1 rounded text-xs font-semibold ${
                                    user.role === 'admin' ? 'bg-red-500 text-white' :
                                    user.role === 'manager' ? 'bg-blue-500 text-white' :
                                    user.role === 'datore' ? 'bg-purple-500 text-white' :
                                    'bg-green-500 text-white'
                                }`
                            }, (user.role || 'worker').toUpperCase())
                        )
                    )
                ),
                React.createElement('button', {
                    onClick: onClose,
                    className: `p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`
                }, '✕')
            ),
            
            // Tabs
            React.createElement('div', {
                className: `flex gap-2 px-6 pt-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
            },
                // Worker vede solo 'info' e 'statistics' (no documents, no settings)
                (currentUserRole === 'worker' 
                    ? ['info', 'statistics'] 
                    : ['info', 'documents', 'settings']
                ).map(tab => 
                    React.createElement('button', {
                        key: tab,
                        onClick: () => setActiveTab(tab),
                        className: `px-4 py-2 font-semibold transition-all ${
                            activeTab === tab
                                ? darkMode
                                    ? 'border-b-2 border-blue-500 text-blue-400'
                                    : 'border-b-2 border-blue-500 text-blue-600'
                                : darkMode
                                    ? 'text-gray-400 hover:text-gray-300'
                                    : 'text-gray-600 hover:text-gray-800'
                        }`
                    }, tab === 'info' ? '📋 Info' : tab === 'statistics' ? '📊 Statistiche' : tab === 'documents' ? '📁 Documenti' : '⚙️ Impostazioni')
                )
            ),
            
            // Content
                // Tab Settings (password change)
                activeTab === 'settings' && React.createElement('div', { className: 'max-w-md mx-auto' },
                    canEditProfile() ? (
                        pwMode ? (
                            React.createElement('div', {},
                                React.createElement('div', { className: 'mb-4' },
                                    React.createElement('label', { className: 'block mb-2 font-semibold' }, 'Nuova Password'),
                                    React.createElement('input', {
                                        type: 'password',
                                        value: pwData.newPassword,
                                        onChange: e => setPwData({ ...pwData, newPassword: e.target.value }),
                                        className: `w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`
                                    })
                                ),
                                React.createElement('div', { className: 'mb-4' },
                                    React.createElement('label', { className: 'block mb-2 font-semibold' }, 'Conferma Password'),
                                    React.createElement('input', {
                                        type: 'password',
                                        value: pwData.confirmPassword,
                                        onChange: e => setPwData({ ...pwData, confirmPassword: e.target.value }),
                                        className: `w-full px-3 py-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`
                                    })
                                ),
                                React.createElement('div', { className: 'flex gap-2' },
                                    React.createElement('button', {
                                        onClick: handleChangePassword,
                                        disabled: pwLoading,
                                        className: `px-4 py-2 rounded-lg font-bold text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`
                                    }, pwLoading ? '⏳...' : '💾 Salva Password'),
                                    React.createElement('button', {
                                        onClick: () => { setPwMode(false); setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' }); },
                                        className: `px-4 py-2 rounded-lg font-bold ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`
                                    }, 'Annulla')
                                )
                            )
                        ) : (
                            React.createElement('button', {
                                onClick: () => setPwMode(true),
                                className: `px-4 py-2 rounded-lg font-bold text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`
                            }, '🔒 Cambia Password')
                        )
                    ) : (
                        React.createElement('div', { className: 'text-center text-gray-500' }, 'Non hai permessi per modificare la password')
                    )
                ),
            React.createElement('div', {
                className: 'p-6 overflow-y-auto max-h-[calc(90vh-200px)]'
            },
                // Tab Info
                activeTab === 'info' && React.createElement('div', {},
                    canEditProfile() && !editMode && React.createElement('button', {
                        onClick: () => setEditMode(true),
                        className: `mb-4 px-4 py-2 rounded-lg font-bold text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`
                    }, '✏️ Modifica Profilo'),
                    editMode && React.createElement('div', { className: 'flex flex-col gap-4 mb-6' },
                        React.createElement('input', {
                            type: 'text',
                            value: editData.firstName,
                            onChange: (e) => setEditData({ ...editData, firstName: e.target.value }),
                            className: `border rounded p-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'}`,
                            placeholder: 'Nome'
                        }),
                        React.createElement('input', {
                            type: 'text',
                            value: editData.lastName,
                            onChange: (e) => setEditData({ ...editData, lastName: e.target.value }),
                            className: `border rounded p-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'}`,
                            placeholder: 'Cognome'
                        }),
                        React.createElement('input', {
                            type: 'email',
                            value: editData.email,
                            onChange: (e) => setEditData({ ...editData, email: e.target.value }),
                            className: `border rounded p-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'}`,
                            placeholder: 'Email'
                        }),
                        React.createElement('input', {
                            type: 'tel',
                            value: editData.phone,
                            onChange: (e) => setEditData({ ...editData, phone: e.target.value }),
                            className: `border rounded p-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'}`,
                            placeholder: 'Telefono'
                        }),
                        React.createElement('button', {
                            onClick: handleEditProfile,
                            className: `px-4 py-2 rounded-lg font-bold text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`
                        }, '💾 Salva'),
                        React.createElement('button', {
                            onClick: () => { setEditMode(false); setEditData({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, avatar: user.avatar }); },
                            className: `px-4 py-2 rounded-lg font-bold ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`
                        }, 'Annulla')
                    ),
                    React.createElement('div', {
                        className: `grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`
                    },
                        React.createElement('div', {
                            className: `p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                        },
                            React.createElement('p', { className: 'text-sm text-gray-500' }, 'Email'),
                            React.createElement('p', { className: 'font-semibold' }, user.email || '-')
                        ),
                        React.createElement('div', {
                            className: `p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                        },
                            React.createElement('p', { className: 'text-sm text-gray-500' }, 'Telefono'),
                            React.createElement('p', { className: 'font-semibold' }, user.phone || '-')
                        ),
                        React.createElement('div', {
                            className: `p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                        },
                            React.createElement('p', { className: 'text-sm text-gray-500' }, 'Registrato il'),
                            React.createElement('p', { className: 'font-semibold' }, user.createdAt?.toDate().toLocaleDateString() || '-')
                        ),
                        React.createElement('div', {
                            className: `p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                        },
                            React.createElement('p', { className: 'text-sm text-gray-500' }, 'Tipo Account'),
                            React.createElement('p', { className: 'font-semibold' }, user.isPermanent ? '✅ Registrato' : '⚠️ Provvisorio')
                        )
                    ),
                    
                    // Pulsante "Rendi User Fisso" (solo se non è già permanente e ha permessi)
                    !user.isPermanent && canMakePermanent() && window.hasRoleAccess(currentUser, 'users.modify') && React.createElement('div', {
                        className: `p-6 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-green-600' : 'bg-green-50 border-green-500'}`
                    },
                        React.createElement('div', { className: 'flex items-center justify-between' },
                            React.createElement('div', {},
                                React.createElement('h3', {
                                    className: `text-lg font-bold mb-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`
                                }, '✅ ' + (t.makePermanent || 'Rendi User Fisso')),
                                React.createElement('p', {
                                    className: `text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                                }, 'Trasforma questo lavoratore occasionale in un utente registrato permanente.')
                            ),
                            React.createElement('button', {
                                onClick: handleMakePermanent,
                                className: `px-6 py-3 rounded-lg font-bold text-white transition-all ${
                                    darkMode
                                        ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/50'
                                        : 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-300/50'
                                }`
                            }, '✅ Conferma')
                        )
                    )
                ),
                
                // Tab Statistics
                activeTab === 'statistics' && React.createElement('div', {},
                    React.createElement('div', {
                        className: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${darkMode ? 'text-white' : 'text-gray-900'}`
                    },
                        React.createElement('div', {
                            className: `p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                        },
                            React.createElement('p', { className: 'text-sm text-gray-500 mb-2' }, '📊 Fogli Totali'),
                            React.createElement('p', { className: 'text-3xl font-bold' }, user.totalSheets || '0')
                        ),
                        React.createElement('div', {
                            className: `p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                        },
                            React.createElement('p', { className: 'text-sm text-gray-500 mb-2' }, '⏰ Ore Lavorate'),
                            React.createElement('p', { className: 'text-3xl font-bold' }, user.totalHours || '0')
                        ),
                        React.createElement('div', {
                            className: `p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                        },
                            React.createElement('p', { className: 'text-sm text-gray-500 mb-2' }, '💰 Paga Totale'),
                            React.createElement('p', { className: 'text-3xl font-bold' }, `€${user.totalPay || '0'}`)
                        ),
                        React.createElement('div', {
                            className: `p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                        },
                            React.createElement('p', { className: 'text-sm text-gray-500 mb-2' }, '📅 Ultimo Lavoro'),
                            React.createElement('p', { className: 'text-lg font-bold' }, user.lastWorkDate ? new Date(user.lastWorkDate).toLocaleDateString() : '-')
                        ),
                        React.createElement('div', {
                            className: `p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                        },
                            React.createElement('p', { className: 'text-sm text-gray-500 mb-2' }, '🎯 Media Ore/Foglio'),
                            React.createElement('p', { className: 'text-3xl font-bold' }, user.avgHoursPerSheet || '0')
                        ),
                        React.createElement('div', {
                            className: `p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                        },
                            React.createElement('p', { className: 'text-sm text-gray-500 mb-2' }, '📈 Status'),
                            React.createElement('p', { className: 'text-lg font-bold' }, user.isActive ? '✅ Attivo' : '⚠️ Inattivo')
                        )
                    )
                ),
                
                // Tab Documenti
                activeTab === 'documents' && React.createElement('div', {},
                    // Area Upload (solo se ha permessi)
                    canUploadForUser() && React.createElement('div', {
                        className: `mb-6 p-4 border-2 border-dashed rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`
                    },
                        React.createElement('div', { className: 'flex items-center gap-4' },
                            React.createElement('div', { className: 'text-5xl' }, '📤'),
                            React.createElement('div', { className: 'flex-1' },
                                React.createElement('input', {
                                    type: 'file',
                                    id: 'fileUpload',
                                    accept: '.pdf,.jpg,.jpeg,.png',
                                    onChange: handleFileUpload,
                                    disabled: isUploading || !uploadLimits?.canUpload,
                                    className: 'hidden'
                                }),
                                React.createElement('label', {
                                    htmlFor: 'fileUpload',
                                    className: `block px-4 py-2 rounded-lg cursor-pointer text-center transition-all ${
                                        isUploading || !uploadLimits?.canUpload
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : darkMode
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : 'bg-blue-500 hover:bg-blue-600'
                                    } text-white font-semibold`
                                }, isUploading ? `⏳ ${Math.round(uploadProgress)}%` : `📎 ${t.uploadDocument || 'Carica Documento'}`),
                                React.createElement('p', {
                                    className: `text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center`
                                }, 'PDF, JPG, PNG • Max 5MB')
                            ),
                            // Limiti
                            uploadLimits && user.role !== 'admin' && React.createElement('div', {
                                className: `p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} min-w-[150px]`
                            },
                                React.createElement('p', {
                                    className: `text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                                }, `${uploadLimits.remaining}/${window.StorageManager.getUploadLimits(user.role).maxPerPeriod}`),
                                React.createElement('p', {
                                    className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                                }, `Reset: ${uploadLimits.daysUntilReset}gg`)
                            )
                        )
                    ),
                    
                    // Lista Documenti
                    React.createElement('div', {},
                        // Toolbar
                        React.createElement('div', {
                            className: `flex gap-3 mb-4 pb-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
                        },
                            React.createElement('select', {
                                value: filterType,
                                onChange: (e) => setFilterType(e.target.value),
                                className: `px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`
                            },
                                React.createElement('option', { value: 'all' }, '📁 Tutti'),
                                React.createElement('option', { value: 'pdf' }, '📄 PDF'),
                                React.createElement('option', { value: 'image' }, '🖼️ Immagini')
                            ),
                            React.createElement('select', {
                                value: sortBy,
                                onChange: (e) => setSortBy(e.target.value),
                                className: `px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`
                            },
                                React.createElement('option', { value: 'date' }, '📅 Data'),
                                React.createElement('option', { value: 'name' }, '🔤 Nome'),
                                React.createElement('option', { value: 'size' }, '📊 Dimensione')
                            )
                        ),
                        
                        // Grid Documenti
                        filteredDocuments.length === 0 ? (
                            React.createElement('div', {
                                className: `text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
                            },
                                React.createElement('div', { className: 'text-6xl mb-4' }, '📭'),
                                React.createElement('p', { className: 'text-lg font-semibold' }, t.noDocuments || 'Nessun documento')
                            )
                        ) : (
                            React.createElement('div', {
                                className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                            },
                                filteredDocuments.map((doc, index) => 
                                    React.createElement('div', {
                                        key: index,
                                        className: `p-4 rounded-lg border transition-all hover:shadow-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`
                                    },
                                        React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
                                            doc.type?.startsWith('image/') ? (
                                                React.createElement('img', {
                                                    src: doc.url,
                                                    alt: doc.nome,
                                                    className: 'w-16 h-16 object-cover rounded cursor-pointer',
                                                    onClick: () => setPreviewDocument(doc)
                                                })
                                            ) : (
                                                React.createElement('div', {
                                                    className: `w-16 h-16 flex items-center justify-center text-3xl rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`
                                                }, getFileIcon(doc.type))
                                            ),
                                            React.createElement('div', { className: 'flex-1 min-w-0' },
                                                React.createElement('p', {
                                                    className: `font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`,
                                                    title: doc.nome
                                                }, doc.nome),
                                                React.createElement('p', {
                                                    className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                                                }, window.StorageManager?.formatBytes(doc.size) || `${doc.size} bytes`)
                                            )
                                        ),
                                        React.createElement('div', {
                                            className: `text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                                        }, '📅 ' + (doc.uploadedAt?.toDate().toLocaleDateString() || '-')),
                                        React.createElement('div', { className: 'flex gap-2' },
                                            React.createElement('button', {
                                                onClick: () => handleDownloadDocument(doc),
                                                className: `flex-1 px-3 py-2 rounded text-sm font-semibold ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`
                                            }, '⬇️ ' + (t.download || 'Scarica')),
                                            canEdit() && React.createElement('button', {
                                                onClick: () => handleDeleteDocument(doc),
                                                className: `px-3 py-2 rounded text-sm font-semibold ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`
                                            }, '🗑️')
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            
            // Preview Modal
            previewDocument && React.createElement('div', {
                className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90',
                onClick: () => setPreviewDocument(null)
            },
                React.createElement('div', {
                    className: 'relative max-w-4xl max-h-full',
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('button', {
                        onClick: () => setPreviewDocument(null),
                        className: 'absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100'
                    }, '✕'),
                    previewDocument.type === 'application/pdf' ? (
                        React.createElement('iframe', {
                            src: previewDocument.url,
                            className: 'w-full h-screen rounded-lg',
                            title: previewDocument.nome
                        })
                    ) : (
                        React.createElement('img', {
                            src: previewDocument.url,
                            alt: previewDocument.nome,
                            className: 'max-w-full max-h-screen rounded-lg'
                        })
                    )
                )
            )
        )
    );
};

window.UserProfile = UserProfile;
