// Settings Component - v4.0 CON EXPORT EXCEL + CHANGELOG
const Settings = ({ db, sheets = [], darkMode, language = 'it' }) => {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [showChangelog, setShowChangelog] = React.useState(false);
    const [settings, setSettings] = React.useState({
        expirationDays: 1 // Default 24h
    });
    const [customDays, setCustomDays] = React.useState('');
    
    const t = translations[language];
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white' : 
        'bg-white border-gray-300 text-gray-900';

    // 📋 CHANGELOG DATA
    const changelog = [
        {
            version: 'v4.0',
            date: '2025-01-16',
            changes: [
                '📊 NEW: Export Excel (XLSX) con formattazione avanzata',
                '🔔 NEW: Notifiche browser quando lavoratore invia dati',
                '📆 NEW: Vista Calendario interattiva con FullCalendar',
                '👤 NEW: Statistiche dettagliate per singolo lavoratore',
                '💾 NEW: Sistema Backup/Restore completo (JSON)',
                '🔍 NEW: Ricerca globale in tutti i fogli',
                '📈 NEW: Comparazione periodi (questo mese vs scorso)',
                '💡 NEW: Auto-completamento intelligente per campi ripetuti',
                '🚀 NEW: PWA migliorata con offline mode e install prompt',
                '⚡ NEW: Auto-save avanzato per admin draft'
            ]
        },
        {
            version: 'v3.0',
            date: '2025-01-15',
            changes: [
                '🐛 FIX: Scadenza link ora parte dal momento della generazione, non dalla creazione foglio',
                '🐛 FIX: Firma cancellabile e rifacibile senza problemi (responsabile + worker)',
                '📋 NEW: Changelog integrato in Settings per tracciare tutte le versioni',
                '🔧 IMPROVED: Sistema di gestione link più robusto con timestamp dedicato'
            ]
        },
        {
            version: 'v2.5',
            date: '2025-01-14',
            changes: [
                '⚙️ NEW: Settings per scadenza link lavoratori (8h, 24h, 48h, 72h, 144h, Mai, Custom)',
                '💾 NEW: Salvataggio automatico sessione lavoratore (auto-save ogni 2 secondi)',
                '↩️ NEW: Ripristino sessione precedente per lavoratori',
                '🌓 NEW: Dark mode locale per modalità lavoratore',
                '📄 NEW: Possibilità per i lavoratori di rigenerare il proprio PDF',
                '✏️ NEW: Modifica dati dopo invio (con re-firma)',
                '🇫🇷🇷🇴 NEW: Supporto Francese e Rumeno (totale 5 lingue)'
            ]
        },
        {
            version: 'v2.0',
            date: '2025-01-10',
            changes: [
                '📊 NEW: Dashboard avanzata con grafici animati',
                '📈 NEW: Statistiche in tempo reale (ore oggi, settimana, mese)',
                '🏆 NEW: Top 10 lavoratori e top 5 aziende',
                '📉 NEW: Grafici: Barre animate, Torta distribuzione, Ore per fascia oraria',
                '📋 NEW: Tabella attività recenti',
                '🔔 NEW: Widget notifiche e performance',
                '🎨 NEW: Animazioni fluide e responsive',
                '📱 IMPROVED: Ottimizzazione mobile per dashboard'
            ]
        },
        {
            version: 'v1.5',
            date: '2025-01-05',
            changes: [
                '🇬🇧🇪🇸 NEW: Supporto multilingua (IT, EN, ES)',
                '🌓 NEW: Dark mode completo',
                '📝 NEW: Modifica multipla lavoratori (bulk edit)',
                '✏️ NEW: Modifica inline singolo lavoratore',
                '🚫 NEW: Sistema blacklist con controllo automatico',
                '📝 NEW: Audit log completo con filtri',
                '📈 NEW: Report Manager (settimanali, mensili, custom)',
                '📄 NEW: Export CSV',
                '🔗 NEW: Link condivisione con copia automatica'
            ]
        },
        {
            version: 'v1.0',
            date: '2024-12-20',
            changes: [
                '🎉 RELEASE: Prima versione pubblica',
                '📋 NEW: Gestione fogli ore base',
                '👷 NEW: Modalità lavoratore con form registrazione',
                '✍️ NEW: Firma digitale touch-friendly',
                '📄 NEW: Generazione PDF automatica',
                '🔥 NEW: Integrazione Firebase (Firestore + Storage)',
                '🖼️ NEW: Upload logo aziendale',
                '📦 NEW: Archiviazione fogli',
                '🗑️ NEW: Eliminazione fogli',
                '📱 NEW: Design responsive mobile-first'
            ]
        }
    ];

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
                    setSettings({
                        expirationDays: data.expirationDays || 1
                    });
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
            await db.collection('settings').doc('linkExpiration').set({
                expirationDays: settings.expirationDays,
                updatedAt: new Date().toISOString()
            });
            
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
        
        setSettings({ expirationDays: days });
        setCustomDays('');
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

            {/* ⭐ NEW: Export Section */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                    📥 {language === 'it' ? 'Esportazione Dati' : language === 'en' ? 'Data Export' : language === 'es' ? 'Exportación de Datos' : language === 'fr' ? 'Exportation de Données' : 'Exportare Date'}
                </h2>
                
                <p className={`${textClass} text-sm mb-4`}>
                    {language === 'it' && 'Esporta tutti i fogli ore in formato CSV o Excel'}
                    {language === 'en' && 'Export all timesheets in CSV or Excel format'}
                    {language === 'es' && 'Exportar todas las hojas de horas en formato CSV o Excel'}
                    {language === 'fr' && 'Exporter toutes les feuilles d\'heures au format CSV ou Excel'}
                    {language === 'ro' && 'Exportați toate fișele de ore în format CSV sau Excel'}
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

                    {/* ⭐ NEW: Excel Export */}
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
                            {language === 'it' && `${sheets.length} fogli disponibili per l'esportazione`}
                            {language === 'en' && `${sheets.length} sheets available for export`}
                            {language === 'es' && `${sheets.length} hojas disponibles para exportar`}
                            {language === 'fr' && `${sheets.length} feuilles disponibles pour l'exportation`}
                            {language === 'ro' && `${sheets.length} fișe disponibile pentru export`}
                        </span>
                    </p>
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
                                onClick={() => setSettings({ expirationDays: option.value })}
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
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="w-full py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-base sm:text-lg transition-colors disabled:bg-gray-400 shadow-lg"
                >
                    {saving ? `⏳ ${t.loading}...` : `💾 ${t.saveSettings}`}
                </button>
            </div>

            {/* Info Box */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">ℹ️</span>
                    <div>
                        <h3 className="font-bold mb-2">{t.linkSettings}</h3>
                        <ul className={`space-y-2 text-sm ${textClass}`}>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0">•</span>
                                <span>
                                    {language === 'it' && '✅ FIX v3.0: La scadenza ora parte dal momento in cui si preme "Genera Link"'}
                                    {language === 'en' && '✅ FIX v3.0: Expiration now starts when you press "Generate Link"'}
                                    {language === 'es' && '✅ FIX v3.0: La caducidad ahora comienza cuando se presiona "Generar Enlace"'}
                                    {language === 'fr' && '✅ FIX v3.0: L\'expiration commence maintenant lorsque vous appuyez sur "Générer Lien"'}
                                    {language === 'ro' && '✅ FIX v3.0: Expirarea începe acum când apăsați "Generează Link"'}
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0">•</span>
                                <span>
                                    {language === 'it' && 'Impostando "Mai", i link non scadranno mai'}
                                    {language === 'en' && 'Setting "Never", links will never expire'}
                                    {language === 'es' && 'Configurando "Nunca", los enlaces nunca caducarán'}
                                    {language === 'fr' && 'En paramétrant "Jamais", les liens n\'expireront jamais'}
                                    {language === 'ro' && 'Setând "Niciodată", link-urile nu vor expira niciodată'}
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0">•</span>
                                <span>
                                    {language === 'it' && 'I lavoratori con link scaduti vedranno un messaggio di errore'}
                                    {language === 'en' && 'Workers with expired links will see an error message'}
                                    {language === 'es' && 'Los trabajadores con enlaces caducados verán un mensaje de error'}
                                    {language === 'fr' && 'Les travailleurs avec liens expirés verront un message d\'erreur'}
                                    {language === 'ro' && 'Muncitorii cu link-uri expirate vor vedea un mesaj de eroare'}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 📋 CHANGELOG BUTTON */}
            <button
                onClick={() => setShowChangelog(!showChangelog)}
                className={`w-full py-4 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-xl font-bold text-base sm:text-lg transition-colors shadow-lg flex items-center justify-center gap-3`}
            >
                <span className="text-2xl">📋</span>
                {showChangelog ? '▼ Nascondi Changelog' : '▶ Mostra Changelog'}
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
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                    : 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            } animate-fade-in`}
                            style={{ animationDelay: `${vIndex * 100}ms` }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    {vIndex === 0 && <span className="text-xl">🆕</span>}
                                    {version.version}
                                </h3>
                                <span className={`text-sm ${textClass}`}>
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
};
