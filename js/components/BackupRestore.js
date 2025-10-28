// Backup & Restore Component
const BackupRestore = ({ db, darkMode, language = 'it' }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    
    // Translation helper: prefer the centralized runtime `window.t` (provided by js/i18n.js).
    // Keep a safe fallback to the legacy `translations` object so migration is incremental.
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
    const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
    const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';

    const handleBackup = async () => {
        setIsLoading(true);
        try {
            await backupAllData(db);
        } catch (error) {
            console.error('Backup error:', error);
            showToast('❌ Errore durante il backup', 'error');
        }
        setIsLoading(false);
    };

    const handleRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoading(true);
        try {
            await restoreFromBackup(db, file);
        } catch (error) {
            console.error('Restore error:', error);
            showToast('❌ Errore durante il ripristino', 'error');
        }
        setIsLoading(false);
        e.target.value = '';
    };

    return (
        <div className="space-y-4">
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <h2 className="text-xl sm:text-2xl font-bold mb-4">💾 {t.backupData}</h2>
                
                {/* Backup */}
                <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className="font-semibold mb-2">📤 {t.exportBackup}</h3>
                        <p className={`${textClass} text-sm mb-3`}>
                            {t.backupDescription}
                        </p>
                        <button
                            onClick={handleBackup}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
                        >
                            {isLoading ? `⏳ ${t.creatingBackup}` : `💾 ${t.downloadBackup}`}
                        </button>
                    </div>

                    {/* Restore */}
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className="font-semibold mb-2">📥 {t.restoreBackupTitle}</h3>
                        <p className={`${textClass} text-sm mb-3`}>
                            ⚠️ <strong>{t.warningAttention}:</strong> {t.currentDataWillBeReplaced}
                        </p>
                        <label className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded-lg font-semibold cursor-pointer inline-block text-center transition-colors">
                            {isLoading ? `⏳ ${t.restoringBackup}` : `📥 ${t.loadBackup}`}
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleRestore}
                                disabled={isLoading}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Info */}
                    <div className={`p-4 rounded-lg border-2 ${darkMode ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <span>💡</span>
                            <span>{t.tips}</span>
                        </h4>
                        <ul className={`${textClass} text-sm space-y-1 list-disc list-inside`}>
                            <li>{t.createRegularBackups}</li>
                            <li>{t.keepBackupsSafe}</li>
                            <li>{t.verifyBeforeRestore}</li>
                            <li>{t.restoreRequiresReload}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
