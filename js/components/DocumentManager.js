/**
 * Document Manager Component
 * Gestione upload/download/preview documenti e avatar con visualizzazione storage
 */

const DocumentManager = ({ currentUser, onClose }) => {
    const [documents, setDocuments] = React.useState([]);
    const [uploadLimits, setUploadLimits] = React.useState(null);
    const [storageUsage, setStorageUsage] = React.useState(null);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [isUploading, setIsUploading] = React.useState(false);
    const [previewDocument, setPreviewDocument] = React.useState(null);
    const [filterType, setFilterType] = React.useState('all'); // all, pdf, image
    const [sortBy, setSortBy] = React.useState('date'); // date, name, size
    
    const darkMode = window.darkMode || false;
    const t = window.translations || {};
    
    // Carica documenti e limiti
    React.useEffect(() => {
        loadData();
    }, [currentUser]);
    
    const loadData = async () => {
        try {
            // Carica documenti
            const userDoc = await db.collection('users').doc(currentUser.id).get();
            const userData = userDoc.data();
            setDocuments(userData?.documenti || []);
            
            // Calcola limiti upload
            const limits = await window.StorageManager.canUploadDocument(currentUser.id);
            setUploadLimits(limits);
            
            // Calcola storage utilizzato
            const usage = await window.StorageManager.calculateUserStorage(currentUser.id);
            setStorageUsage(usage);
            
        } catch (error) {
            console.error('Errore caricamento dati:', error);
            showToast(`❌ ${t.errorLoading || 'Errore caricamento'}`, 'error');
        }
    };
    
    // Upload documento
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
            const result = await window.StorageManager.uploadDocument(
                currentUser.id,
                file,
                currentUser.id, // uploadedBy
                (progress) => setUploadProgress(progress)
            );
            
            showToast(`✅ ${t.documentUploaded || 'Documento caricato!'}`, 'success');
            await loadData();
            
        } catch (error) {
            console.error('Errore upload:', error);
            showToast(`❌ ${error.message}`, 'error');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            event.target.value = ''; // Reset input
        }
    };
    
    // Elimina documento
    const handleDeleteDocument = async (doc) => {
        if (!confirm(`${t.confirmDelete || 'Confermi eliminazione'}: ${doc.nome}?`)) return;
        
        try {
            await window.StorageManager.deleteDocument(currentUser.id, doc.path, doc);
            showToast(`✅ ${t.documentDeleted || 'Documento eliminato'}`, 'success');
            await loadData();
        } catch (error) {
            console.error('Errore eliminazione:', error);
            showToast(`❌ ${error.message}`, 'error');
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
        
        // Filtra per tipo
        if (filterType === 'pdf') {
            filtered = filtered.filter(d => d.type === 'application/pdf');
        } else if (filterType === 'image') {
            filtered = filtered.filter(d => d.type.startsWith('image/'));
        }
        
        // Ordina
        if (sortBy === 'date') {
            filtered.sort((a, b) => (b.uploadedAt?.toMillis() || 0) - (a.uploadedAt?.toMillis() || 0));
        } else if (sortBy === 'name') {
            filtered.sort((a, b) => a.nome.localeCompare(b.nome));
        } else if (sortBy === 'size') {
            filtered.sort((a, b) => b.size - a.size);
        }
        
        return filtered;
    }, [documents, filterType, sortBy]);
    
    // Ottieni icona file
    const getFileIcon = (type) => {
        if (type === 'application/pdf') return '📄';
        if (type.startsWith('image/')) return '🖼️';
        return '📎';
    };
    
    // Calcola percentuale storage
    const storagePercentage = React.useMemo(() => {
        if (!storageUsage || currentUser.role === 'admin') return 0;
        const limits = window.StorageManager.getUploadLimits(currentUser.role);
        return (storageUsage.totalBytes / limits.maxTotalStorage) * 100;
    }, [storageUsage, currentUser.role]);
    
    const getStorageColor = () => {
        if (storagePercentage > 90) return 'red';
        if (storagePercentage > 70) return 'orange';
        return 'green';
    };
    
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
                React.createElement('div', {},
                    React.createElement('h2', {
                        className: `text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`
                    }, `📁 ${t.myDocuments || 'I Miei Documenti'}`),
                    React.createElement('p', {
                        className: `text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                    }, currentUser.firstName + ' ' + currentUser.lastName)
                ),
                React.createElement('button', {
                    onClick: onClose,
                    className: `p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`
                }, '✕')
            ),
            
            // Body
            React.createElement('div', {
                className: 'flex flex-col lg:flex-row h-full'
            },
                // Sidebar - Upload & Limiti
                React.createElement('div', {
                    className: `lg:w-80 p-6 border-r ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`
                },
                    // Upload Area
                    React.createElement('div', {
                        className: `mb-6 p-4 border-2 border-dashed rounded-lg ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`
                    },
                        React.createElement('div', {
                            className: 'text-center'
                        },
                            React.createElement('div', {
                                className: 'text-5xl mb-3'
                            }, '📤'),
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
                                className: `block px-4 py-2 rounded-lg cursor-pointer transition-all ${
                                    isUploading || !uploadLimits?.canUpload
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : darkMode
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                } text-white font-semibold`
                            }, isUploading ? `⏳ ${Math.round(uploadProgress)}%` : `📎 ${t.uploadDocument || 'Carica Documento'}`),
                            React.createElement('p', {
                                className: `text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                            }, 'PDF, JPG, PNG • Max 5MB')
                        )
                    ),
                    
                    // Limiti Upload
                    uploadLimits && currentUser.role !== 'admin' && React.createElement('div', {
                        className: `mb-6 p-4 rounded-lg border-l-4 ${
                            uploadLimits.remaining > 5 ? 'border-green-500 bg-green-50' :
                            uploadLimits.remaining > 0 ? 'border-orange-500 bg-orange-50' :
                            'border-red-500 bg-red-50'
                        }`
                    },
                        React.createElement('div', {
                            className: 'flex items-center justify-between mb-2'
                        },
                            React.createElement('span', {
                                className: 'font-semibold text-sm'
                            }, `📄 ${t.uploadLimit || 'Limite Upload'}`),
                            React.createElement('span', {
                                className: 'text-2xl font-bold',
                                style: { color: getStorageColor() }
                            }, uploadLimits.remaining)
                        ),
                        React.createElement('div', {
                            className: 'text-xs text-gray-600 mb-2'
                        }, `${t.resetIn || 'Reset tra'} ${uploadLimits.daysUntilReset} ${t.days || 'giorni'}`),
                        React.createElement('div', {
                            className: 'bg-gray-200 rounded-full h-2'
                        },
                            React.createElement('div', {
                                className: `h-2 rounded-full transition-all ${
                                    uploadLimits.remaining > 5 ? 'bg-green-500' :
                                    uploadLimits.remaining > 0 ? 'bg-orange-500' : 'bg-red-500'
                                }`,
                                style: {
                                    width: `${(uploadLimits.remaining / window.StorageManager.getUploadLimits(currentUser.role).maxPerPeriod) * 100}%`
                                }
                            })
                        )
                    ),
                    
                    // Storage Utilizzato
                    storageUsage && React.createElement('div', {
                        className: `p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`
                    },
                        React.createElement('div', {
                            className: 'flex items-center justify-between mb-2'
                        },
                            React.createElement('span', {
                                className: `font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`
                            }, `💾 ${t.storageUsed || 'Storage Utilizzato'}`),
                            React.createElement('span', {
                                className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                            }, `${storageUsage.totalFiles} ${t.files || 'files'}`)
                        ),
                        React.createElement('div', {
                            className: `text-2xl font-bold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                        }, storageUsage.totalFormatted),
                        currentUser.role !== 'admin' && React.createElement('div', {},
                            React.createElement('div', {
                                className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`
                            }, `${window.StorageManager.formatBytes(window.StorageManager.getUploadLimits(currentUser.role).maxTotalStorage)} ${t.available || 'disponibili'}`),
                            React.createElement('div', {
                                className: 'bg-gray-200 rounded-full h-2'
                            },
                                React.createElement('div', {
                                    className: `h-2 rounded-full transition-all ${
                                        storagePercentage > 90 ? 'bg-red-500' :
                                        storagePercentage > 70 ? 'bg-orange-500' : 'bg-green-500'
                                    }`,
                                    style: { width: `${Math.min(storagePercentage, 100)}%` }
                                })
                            )
                        )
                    ),
                    
                    // Info Formati
                    React.createElement('div', {
                        className: `mt-6 p-3 rounded-lg ${darkMode ? 'bg-blue-900 bg-opacity-30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`
                    },
                        React.createElement('div', {
                            className: `text-xs ${darkMode ? 'text-blue-300' : 'text-blue-800'}`
                        },
                            React.createElement('p', { className: 'font-semibold mb-1' }, '💡 ' + (t.allowedFormats || 'Formati consentiti')),
                            React.createElement('p', {}, '• PDF: Documenti, contratti'),
                            React.createElement('p', {}, '• JPG/PNG: Foto, scansioni')
                        )
                    )
                ),
                
                // Main Content - Lista Documenti
                React.createElement('div', {
                    className: 'flex-1 p-6 overflow-y-auto'
                },
                    // Toolbar
                    React.createElement('div', {
                        className: `flex flex-wrap gap-3 mb-6 pb-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
                    },
                        // Filtro tipo
                        React.createElement('select', {
                            value: filterType,
                            onChange: (e) => setFilterType(e.target.value),
                            className: `px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`
                        },
                            React.createElement('option', { value: 'all' }, '📁 ' + (t.all || 'Tutti')),
                            React.createElement('option', { value: 'pdf' }, '📄 PDF'),
                            React.createElement('option', { value: 'image' }, '🖼️ ' + (t.images || 'Immagini'))
                        ),
                        
                        // Ordinamento
                        React.createElement('select', {
                            value: sortBy,
                            onChange: (e) => setSortBy(e.target.value),
                            className: `px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`
                        },
                            React.createElement('option', { value: 'date' }, '📅 ' + (t.sortByDate || 'Data')),
                            React.createElement('option', { value: 'name' }, '🔤 ' + (t.sortByName || 'Nome')),
                            React.createElement('option', { value: 'size' }, '📊 ' + (t.sortBySize || 'Dimensione'))
                        ),
                        
                        React.createElement('div', {
                            className: `ml-auto text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                        }, `${filteredDocuments.length} ${t.documents || 'documenti'}`)
                    ),
                    
                    // Lista Documenti
                    filteredDocuments.length === 0 ? (
                        React.createElement('div', {
                            className: `text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
                        },
                            React.createElement('div', { className: 'text-6xl mb-4' }, '📭'),
                            React.createElement('p', { className: 'text-lg font-semibold' }, t.noDocuments || 'Nessun documento'),
                            React.createElement('p', { className: 'text-sm mt-2' }, t.uploadFirstDocument || 'Carica il tuo primo documento')
                        )
                    ) : (
                        React.createElement('div', {
                            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                        },
                            filteredDocuments.map((doc, index) => 
                                React.createElement('div', {
                                    key: index,
                                    className: `p-4 rounded-lg border transition-all hover:shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'}`
                                },
                                    // Preview/Icon
                                    React.createElement('div', {
                                        className: 'flex items-center gap-3 mb-3'
                                    },
                                        doc.type.startsWith('image/') ? (
                                            React.createElement('img', {
                                                src: doc.url,
                                                alt: doc.nome,
                                                className: 'w-16 h-16 object-cover rounded cursor-pointer',
                                                onClick: () => setPreviewDocument(doc)
                                            })
                                        ) : (
                                            React.createElement('div', {
                                                className: `w-16 h-16 flex items-center justify-center text-3xl rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`
                                            }, getFileIcon(doc.type))
                                        ),
                                        React.createElement('div', {
                                            className: 'flex-1 min-w-0'
                                        },
                                            React.createElement('p', {
                                                className: `font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`,
                                                title: doc.nome
                                            }, doc.nome),
                                            React.createElement('p', {
                                                className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                                            }, window.StorageManager.formatBytes(doc.size))
                                        )
                                    ),
                                    
                                    // Info
                                    React.createElement('div', {
                                        className: `text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                                    },
                                        React.createElement('p', {}, 
                                            '📅 ' + (doc.uploadedAt?.toDate().toLocaleDateString() || '-')
                                        ),
                                        doc.uploadedBy !== currentUser.id && React.createElement('p', {
                                            className: 'text-blue-500 mt-1'
                                        }, '👤 ' + (t.uploadedByAdmin || 'Caricato dall\'admin'))
                                    ),
                                    
                                    // Azioni
                                    React.createElement('div', {
                                        className: 'flex gap-2'
                                    },
                                        React.createElement('button', {
                                            onClick: () => handleDownloadDocument(doc),
                                            className: `flex-1 px-3 py-2 rounded text-sm font-semibold transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`
                                        }, '⬇️ ' + (t.download || 'Scarica')),
                                        React.createElement('button', {
                                            onClick: () => handleDeleteDocument(doc),
                                            className: `px-3 py-2 rounded text-sm font-semibold transition-colors ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`
                                        }, '🗑️')
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

window.DocumentManager = DocumentManager;
