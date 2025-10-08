// Settings Component - NUOVO - Configurazione Scadenza Link
const Settings = ({ db, darkMode, language = 'it' }) => {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [linkExpirationHours, setLinkExpirationHours] = React.useState(24);
    const [customHours, setCustomHours] = React.useState('');
    
    const t = translations[language];
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
    const inputClass = darkMode ? 
        'bg-gray-700 border-gray-600 text-white' : 
        'bg-white border-gray-300 text-gray-900';

    // Load settings
    React.useEffect(() => {
        const loadSettings = async () => {
            if (!db) return;
            
            try {
                const doc = await db.collection('settings').doc('global').get();
                if (doc.exists) {
                    const data = doc.data();
                    setLinkExpirationHours(data.linkExpirationHours || 24);
                } else {
                    // Create default settings
                    await db.collection('settings').doc('global').set({
                        linkExpirationHours: 24
                    });
                    setLinkExpirationHours(24);
                }
            } catch (error) {
                console.error('Errore caricamento impostazioni:', error);
            }
            
            setLoading(false);
        };
        
        loadSettings();
    }, [db]);

    const saveSettings = async () => {
        if (!db) {
            showToast(`❌ ${t.dbNotConnected}`, 'error');
            return;
        }

        setSaving(true);

        try {
            await db.collection('settings').doc('global').set({
                linkExpirationHours: linkExpirationHours
            }, { merge: true });

            showToast(`✅ ${t.settingsSaved}`, 'success');
        } catch (error) {
            console.error('Errore salvataggio:', error);
            showToast(`❌ ${t.errorSaving}`, 'error');
        }

        setSaving(false);
    };

    const presets = [
        { value: 0, label: t.never || '0h (Mai)' },
        { value: 8, label: '8h' },
        { value: 24, label: '24h' },
        { value: 48, label: '48h' },
        { value: 72, label: '72h' },
        { value: 144, label: '144h (6 giorni)' }
    ];

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
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl sm:text-3xl">⚙️</span>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">{t.settings}</h1>
                        <p className={`${textClass} text-sm sm:text-base`}>
                            {t.configureApp}
                        </p>
                    </div>
                </div>
            </div>

            {/* Link Expiration Settings */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h2 className="text-lg sm:text-xl font-bold mb-4">
                    🔗 {t.linkExpiration}
                </h2>
                
                <p className={`${textClass} text-sm sm:text-base mb-4`}>
                    {t.linkExpirationDesc}
                </p>

                {/* Quick Presets */}
                <div className="mb-6">
                    <label className="block font-semibold mb-3 text-sm sm:text-base">
                        {t.quickPresets}:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {presets.map((preset) => (
                            <button
                                key={preset.value}
                                onClick={() => setLinkExpirationHours(preset.value)}
                                className={`px-4 py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                                    linkExpirationHours === preset.value
                                        ? 'bg-indigo-600 text-white'
                                        : darkMode
                                        ? 'bg-gray-700 hover:bg-gray-600'
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Hours */}
                <div className="mb-6">
                    <label className="block font-semibold mb-2 text-sm sm:text-base">
                        {t.customHours}:
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="0"
                            placeholder={t.enterHours}
                            value={customHours}
                            onChange={(e) => setCustomHours(e.target.value)}
                            className={`flex-1 px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-indigo-500`}
                        />
                        <button
                            onClick={() => {
                                const hours = parseInt(customHours);
                                if (!isNaN(hours) && hours >= 0) {
                                    setLinkExpirationHours(hours);
                                    setCustomHours('');
                                }
                            }}
                            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm sm:text-base"
                        >
                            {t.apply}
                        </button>
                    </div>
                </div>

                {/* Current Setting Display */}
                <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                    <p className="font-semibold text-base sm:text-lg mb-2">
                        {t.currentSetting}:
                    </p>
                    <p className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        {linkExpirationHours === 0 
                            ? `♾️ ${t.never}` 
                            : `⏱️ ${linkExpirationHours}h`}
                    </p>
                    {linkExpirationHours > 0 && (
                        <p className={`${textClass} text-xs sm:text-sm mt-2`}>
                            {t.linksWillExpireAfter}: {linkExpirationHours} {t.hours.toLowerCase()}
                        </p>
                    )}
                </div>

                {/* Save Button */}
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="w-full py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-base sm:text-lg transition-colors disabled:bg-gray-400 shadow-lg"
                >
                    {saving ? `⏳ ${t.saving}...` : `💾 ${t.saveSettings}`}
                </button>
            </div>

            {/* Info Box */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h3 className="font-bold mb-3 text-base sm:text-lg">ℹ️ {t.howItWorks}</h3>
                <ul className={`${textClass} space-y-2 text-sm sm:text-base`}>
                    <li>• {t.linkExpirationInfo1}</li>
                    <li>• {t.linkExpirationInfo2}</li>
                    <li>• {t.linkExpirationInfo3}</li>
                    <li>• {t.linkExpirationInfo4}</li>
                </ul>
            </div>
        </div>
    );
};
