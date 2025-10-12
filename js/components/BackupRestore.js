// Backup & Restore Component
const BackupRestore = ({ db, darkMode, language = 'it' }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    
    const t = translations[language];
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
                        <h3 className="font-semibold mb-2">📤 Esporta Backup</h3>
                        <p className={`${textClass} text-sm mb-3`}>
                            Scarica tutti i dati dell'app in formato JSON. Include fogli ore, impostazioni, blacklist e log.
                        </p>
                        <button
                            onClick={handleBackup}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
                        >
                            {isLoading ? '⏳ Creazione backup...' : '💾 Scarica Backup'}
                        </button>
                    </div>

                    {/* Restore */}
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h3 className="font-semibold mb-2">📥 Ripristina Backup</h3>
                        <p className={`${textClass} text-sm mb-3`}>
                            ⚠️ <strong>ATTENZIONE:</strong> Tutti i dati attuali saranno sostituiti con quelli del backup.
                        </p>
                        <label className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded-lg font-semibold cursor-pointer inline-block text-center transition-colors">
                            {isLoading ? '⏳ Ripristino...' : '📥 Carica Backup'}
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
                            <span>Consigli</span>
                        </h4>
                        <ul className={`${textClass} text-sm space-y-1 list-disc list-inside`}>
                            <li>Crea backup regolari (consigliato: settimanale)</li>
                            <li>Conserva i backup in un luogo sicuro</li>
                            <li>Verifica il backup prima di ripristinare</li>
                            <li>Il ripristino richiede il ricaricamento della pagina</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
