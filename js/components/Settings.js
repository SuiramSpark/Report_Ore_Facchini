// Settings Component - 5 LINGUE COMPLETE
const Settings = ({ db, darkMode, language = 'it' }) => {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
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
                                    {language === 'it' && 'I link generati scadranno dopo il tempo selezionato'}
                                    {language === 'en' && 'Generated links will expire after the selected time'}
                                    {language === 'es' && 'Los enlaces generados caducarán después del tiempo seleccionado'}
                                    {language === 'fr' && 'Les liens générés expireront après le temps sélectionné'}
                                    {language === 'ro' && 'Link-urile generate vor expira după timpul selectat'}
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
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0">•</span>
                                <span>
                                    {language === 'it' && 'La scadenza viene calcolata dalla data di creazione del foglio ore'}
                                    {language === 'en' && 'Expiration is calculated from the timesheet creation date'}
                                    {language === 'es' && 'La caducidad se calcula desde la fecha de creación de la hoja de horas'}
                                    {language === 'fr' && 'L\'expiration est calculée depuis la date de création de la feuille de temps'}
                                    {language === 'ro' && 'Expirarea este calculată de la data creării fișei de pontaj'}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
