/**
 * Worker Profile Component
 * Profilo personale per lavoratori (worker/datore)
 * Versione semplificata senza permessi admin
 */

window.WorkerProfile = function({ userId, db, storage, darkMode, onLogout, addAuditLog }) {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('info');
    const [documents, setDocuments] = React.useState([]);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [isUploading, setIsUploading] = React.useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
    
    // Form states
    const [editMode, setEditMode] = React.useState(false);
    const [formData, setFormData] = React.useState({});
    const [passwordData, setPasswordData] = React.useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const t = new Proxy({}, { get: (target, prop) => window.t ? window.t(prop) : prop });
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
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (!userDoc.exists) {
                showToast('❌ Profilo non trovato', 'error');
                if (onLogout) onLogout();
                return;
            }
            
            const userData = userDoc.data();
            
            // Controlla se l'utente è sospeso
            if (userData.suspended) {
                showToast('🚫 Account sospeso. Contatta l\'amministratore.', 'error');
                setTimeout(() => {
                    if (onLogout) onLogout();
                }, 2000);
                return;
            }
            
            setUser({ id: userId, ...userData });
            setFormData({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                phone: userData.phone || ''
            });
            
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

    // GESTIONE INFO PERSONALI
    const handleSaveInfo = async () => {
        try {
            await db.collection('users').doc(userId).update({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                updatedAt: new Date().toISOString()
            });
            
            showToast('✅ Profilo aggiornato', 'success');
            setEditMode(false);
            await loadUserData();
        } catch (error) {
            console.error('Errore aggiornamento profilo:', error);
            showToast('❌ Errore aggiornamento profilo', 'error');
        }
    };

    // GESTIONE PASSWORD
    const handleChangePassword = async () => {
        // Validazione
        if (!passwordData.currentPassword) {
            showToast('❌ Inserisci la password attuale', 'error');
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
            // Carica utente corrente
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            
            // ✅ Verifica password corrente (in chiaro)
            const passwordMatch = userData.password === passwordData.currentPassword;
            
            if (!passwordMatch) {
                showToast('❌ Password attuale errata', 'error');
                return;
            }
            
            // ✅ SALVA PASSWORD IN CHIARO (gestita manualmente dall'admin via database)
            await db.collection('users').doc(userId).update({
                password: passwordData.newPassword, // Password in chiaro
                passwordChangedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast('✅ ' + (t.passwordChanged || 'Password modificata con successo!'), 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Errore cambio password:', error);
            showToast('❌ Errore cambio password', 'error');
        }
    };

    // GESTIONE AVATAR
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
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
                const result = await window.StorageManager.uploadAvatar(userId, file);
                
                await db.collection('users').doc(userId).update({
                    avatarURL: result.url,
                    avatarUpdatedAt: new Date().toISOString()
                });
                
                // Audit log
                if (addAuditLog) {
                    await addAuditLog('PROFILE_AVATAR_UPDATE', `Avatar cambiato - ${user.firstName} ${user.lastName}`);
                }
                
                showToast('✅ Avatar aggiornato', 'success');
                await loadUserData();
            }
        } catch (error) {
            console.error('Errore upload avatar:', error);
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
                    userId, // uploadedBy
                    (progress) => setUploadProgress(progress)
                );
                
                showToast('✅ Documento caricato', 'success');
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
            if (doc.url) {
                window.open(doc.url, '_blank');
                return;
            }
            
            if (doc.path) {
                const storageRef = storage.ref(doc.path);
                const url = await storageRef.getDownloadURL();
                window.open(url, '_blank');
            } else {
                showToast('❌ Documento non trovato', 'error');
            }
        } catch (error) {
            console.error('Errore download:', error);
            showToast('❌ Errore download: ' + error.message, 'error');
        }
    };

    const handleDeleteDocument = async (doc) => {
        if (!confirm('Confermi l\'eliminazione del documento?')) return;
        
        try {
            if (window.StorageManager && window.StorageManager.deleteDocument) {
                await window.StorageManager.deleteDocument(userId, doc.path, doc);
                showToast('✅ Documento eliminato', 'success');
                await loadDocuments();
            }
        } catch (error) {
            console.error('Errore eliminazione:', error);
            showToast('❌ Errore eliminazione documento', 'error');
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
            { id: 'info', label: t.myProfile || 'Il Mio Profilo', icon: '👤' },
            { id: 'documents', label: t.myDocuments || 'I Miei Documenti', icon: '📄' },
            { id: 'password', label: t.security || 'Sicurezza', icon: '🔒' }
        ];
        
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

    // TAB: INFORMAZIONI
    const renderInfoTab = () => {
        return React.createElement('div', { className: 'space-y-6 max-w-4xl mx-auto' },
            // Avatar e nome
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('div', { className: 'flex items-center space-x-6' },
                    // Avatar
                    React.createElement('div', { className: 'relative' },
                        React.createElement('div', {
                            className: 'w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold',
                            style: user.avatarURL ? { 
                                backgroundImage: `url(${user.avatarURL})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            } : {}
                        }, !user.avatarURL && (user.firstName?.[0] || 'U')),
                        React.createElement('label', {
                            className: 'absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-3 cursor-pointer hover:bg-blue-600 transition-colors shadow-lg',
                            title: t.changeAvatar || 'Cambia Avatar'
                        },
                            React.createElement('input', {
                                type: 'file',
                                accept: 'image/*',
                                onChange: handleAvatarUpload,
                                className: 'hidden',
                                disabled: isUploadingAvatar
                            }),
                            isUploadingAvatar ? '⏳' : '📷'
                        )
                    ),
                    // Nome e ruolo
                    React.createElement('div', { className: 'flex-1' },
                        React.createElement('h2', { className: 'text-3xl font-bold mb-2' },
                            `${user.firstName} ${user.lastName}`
                        ),
                        React.createElement('div', { className: 'flex items-center space-x-3' },
                            React.createElement('span', {
                                className: `px-4 py-2 rounded-full text-sm font-medium ${
                                    user.role === 'datore' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`
                            }, (t[user.role] || user.role).toUpperCase()),
                            user.isPermanent && React.createElement('span', {
                                className: 'px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800'
                            }, `✓ ${t.permanentUser || 'Utente Fisso'}`)
                        )
                    )
                )
            ),
            
            // Info contatto
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('div', { className: 'flex justify-between items-center mb-4' },
                    React.createElement('h3', { className: 'text-xl font-bold' }, '📧 Informazioni di Contatto'),
                    !editMode && React.createElement('button', {
                        onClick: () => setEditMode(true),
                        className: 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                    }, '✏️ Modifica')
                ),
                
                editMode ? React.createElement('div', { className: 'space-y-4' },
                    React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                        React.createElement('div', null,
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Nome'),
                            React.createElement('input', {
                                type: 'text',
                                value: formData.firstName,
                                onChange: (e) => setFormData({...formData, firstName: e.target.value}),
                                className: `w-full px-4 py-3 border rounded-lg ${inputClass}`
                            })
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Cognome'),
                            React.createElement('input', {
                                type: 'text',
                                value: formData.lastName,
                                onChange: (e) => setFormData({...formData, lastName: e.target.value}),
                                className: `w-full px-4 py-3 border rounded-lg ${inputClass}`
                            })
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Email'),
                        React.createElement('input', {
                            type: 'email',
                            value: formData.email,
                            onChange: (e) => setFormData({...formData, email: e.target.value}),
                            className: `w-full px-4 py-3 border rounded-lg ${inputClass}`
                        })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Telefono'),
                        React.createElement('input', {
                            type: 'tel',
                            value: formData.phone,
                            onChange: (e) => setFormData({...formData, phone: e.target.value}),
                            className: `w-full px-4 py-3 border rounded-lg ${inputClass}`
                        })
                    ),
                    React.createElement('div', { className: 'flex space-x-3' },
                        React.createElement('button', {
                            onClick: handleSaveInfo,
                            className: 'px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium'
                        }, '✅ Salva Modifiche'),
                        React.createElement('button', {
                            onClick: () => setEditMode(false),
                            className: 'px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
                        }, 'Annulla')
                    )
                ) : React.createElement('div', { className: 'space-y-4' },
                    React.createElement('div', { className: 'flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' },
                        React.createElement('span', { className: textClass + ' font-medium' }, '📧 Email'),
                        React.createElement('span', { className: 'font-semibold' }, user.email || '-')
                    ),
                    React.createElement('div', { className: 'flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' },
                        React.createElement('span', { className: textClass + ' font-medium' }, '📱 Telefono'),
                        React.createElement('span', { className: 'font-semibold' }, user.phone || '-')
                    )
                )
            ),
            
            // Info account
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('h3', { className: 'text-xl font-bold mb-4' }, '📅 Informazioni Account'),
                React.createElement('div', { className: 'space-y-3' },
                    React.createElement('div', { className: 'flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' },
                        React.createElement('span', { className: textClass + ' font-medium' }, 'Registrato il'),
                        React.createElement('span', { className: 'font-semibold' }, 
                            user.createdAt 
                                ? (user.createdAt.toDate 
                                    ? user.createdAt.toDate().toLocaleDateString('it-IT') 
                                    : new Date(user.createdAt).toLocaleDateString('it-IT'))
                                : '-'
                        )
                    ),
                    user.madePermanentAt && React.createElement('div', { className: 'flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' },
                        React.createElement('span', { className: textClass + ' font-medium' }, 'Reso fisso il'),
                        React.createElement('span', { className: 'font-semibold' }, 
                            user.madePermanentAt.toDate 
                                ? user.madePermanentAt.toDate().toLocaleDateString('it-IT')
                                : new Date(user.madePermanentAt).toLocaleDateString('it-IT')
                        )
                    )
                )
            )
        );
    };

    // TAB: DOCUMENTI
    const renderDocumentsTab = () => {
        // Calcola limiti upload
        const uploadLimit = user.role === 'datore' ? 30 : 10;
        const uploadCounter = user.uploadCounter || { count: 0 };
        const remainingUploads = uploadLimit - uploadCounter.count;
        
        return React.createElement('div', { className: 'max-w-4xl mx-auto' },
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('div', { className: 'flex justify-between items-center mb-6' },
                    React.createElement('div', null,
                        React.createElement('h3', { className: 'text-xl font-bold' }, 
                            `📄 I Miei Documenti (${documents.length})`
                        ),
                        React.createElement('p', { className: `text-sm ${textClass} mt-1` },
                            `Upload rimasti questo mese: ${remainingUploads}/${uploadLimit}`
                        )
                    ),
                    React.createElement('label', {
                        className: `px-4 py-2 ${
                            remainingUploads > 0 
                                ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer' 
                                : 'bg-gray-400 cursor-not-allowed'
                        } text-white rounded-lg transition-colors`
                    },
                        React.createElement('input', {
                            type: 'file',
                            onChange: handleFileUpload,
                            className: 'hidden',
                            disabled: isUploading || remainingUploads <= 0
                        }),
                        isUploading ? '⏳ Caricamento...' : '📤 Carica Documento'
                    )
                ),
                
                isUploading && React.createElement('div', { className: 'mb-4' },
                    React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-3' },
                        React.createElement('div', {
                            className: 'bg-blue-500 h-3 rounded-full transition-all duration-300',
                            style: { width: `${uploadProgress}%` }
                        })
                    ),
                    React.createElement('p', { className: 'text-sm text-center mt-2' }, 
                        `${Math.round(uploadProgress)}%`
                    )
                ),
                
                documents.length === 0 ? React.createElement('div', {
                    className: 'text-center py-16'
                },
                    React.createElement('div', { className: 'text-6xl mb-4' }, '📭'),
                    React.createElement('p', { className: textClass + ' text-lg' }, 'Nessun documento caricato'),
                    React.createElement('p', { className: textClass + ' text-sm mt-2' }, 'Clicca "Carica Documento" per iniziare')
                ) : React.createElement('div', { className: 'space-y-3' },
                    documents.map((doc, idx) => 
                        React.createElement('div', {
                            key: idx,
                            className: `flex items-center justify-between p-4 border rounded-lg transition-colors ${
                                darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                            }`
                        },
                            React.createElement('div', { className: 'flex items-center space-x-4 flex-1' },
                                React.createElement('div', { className: 'text-3xl' }, 
                                    doc.type?.includes('pdf') ? '📄' :
                                    doc.type?.includes('image') ? '🖼️' :
                                    doc.type?.includes('word') ? '📝' : '📎'
                                ),
                                React.createElement('div', null,
                                    React.createElement('p', { className: 'font-medium' }, doc.nome),
                                    React.createElement('p', { className: `text-sm ${textClass}` },
                                        `${(doc.size / 1024).toFixed(1)} KB • ${
                                            doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('it-IT') : '-'
                                        }`
                                    )
                                )
                            ),
                            React.createElement('div', { className: 'flex space-x-2' },
                                React.createElement('button', {
                                    onClick: () => handleDownloadDocument(doc),
                                    className: 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                                }, '⬇️ Scarica'),
                                React.createElement('button', {
                                    onClick: () => handleDeleteDocument(doc),
                                    className: 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
                                }, '🗑️')
                            )
                        )
                    )
                )
            )
        );
    };

    // TAB: PASSWORD
    const renderPasswordTab = () => {
        return React.createElement('div', { className: 'max-w-2xl mx-auto' },
            React.createElement('div', { className: `${cardClass} rounded-lg shadow-md p-6` },
                React.createElement('h3', { className: 'text-xl font-bold mb-6' }, '🔒 Cambia Password'),
                React.createElement('div', { className: 'space-y-4' },
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
                            'Password Attuale'
                        ),
                        React.createElement('input', {
                            type: 'password',
                            value: passwordData.currentPassword,
                            onChange: (e) => setPasswordData({...passwordData, currentPassword: e.target.value}),
                            className: `w-full px-4 py-3 border rounded-lg ${inputClass}`,
                            placeholder: 'Inserisci la password attuale'
                        })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
                            'Nuova Password'
                        ),
                        React.createElement('input', {
                            type: 'password',
                            value: passwordData.newPassword,
                            onChange: (e) => setPasswordData({...passwordData, newPassword: e.target.value}),
                            className: `w-full px-4 py-3 border rounded-lg ${inputClass}`,
                            placeholder: 'Minimo 6 caratteri'
                        }),
                        React.createElement('p', { className: `text-xs mt-1 ${textClass}` }, 
                            'La password deve contenere almeno 6 caratteri'
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
                            'Conferma Nuova Password'
                        ),
                        React.createElement('input', {
                            type: 'password',
                            value: passwordData.confirmPassword,
                            onChange: (e) => setPasswordData({...passwordData, confirmPassword: e.target.value}),
                            className: `w-full px-4 py-3 border rounded-lg ${inputClass}`,
                            placeholder: 'Ripeti la nuova password'
                        })
                    ),
                    React.createElement('button', {
                        onClick: handleChangePassword,
                        disabled: !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword,
                        className: 'w-full px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg'
                    }, '🔒 Cambia Password')
                )
            )
        );
    };

    // RENDER PRINCIPALE
    return React.createElement('div', {
        className: `min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-6`
    },
        React.createElement('div', { className: 'max-w-7xl mx-auto' },
            // Header
            React.createElement('div', { className: 'mb-6' },
                React.createElement('h1', { className: 'text-3xl font-bold' }, 
                    `👤 ${t.myProfile || 'Il Mio Profilo'}`
                )
            ),
            
            // Tabs
            renderTabs(),
            
            // Contenuto tab attivo
            React.createElement('div', null,
                activeTab === 'info' && renderInfoTab(),
                activeTab === 'documents' && renderDocumentsTab(),
                activeTab === 'password' && renderPasswordTab()
            )
        )
    );
};
