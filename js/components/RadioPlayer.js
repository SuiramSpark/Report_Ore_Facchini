// RadioPlayer Component - Web Radio per Dashboard
const RadioPlayer = ({ darkMode, language = 'it' }) => {
    const t = translations[language];
    
    // Stazioni radio italiane gratuite
    const stations = [
        { name: 'Radio Italia', url: 'https://radioitalia.fluidstream.eu/RadioItalia.mp3', icon: '🇮🇹' },
        { name: 'RDS', url: 'https://icstream.rds.radio/rds', icon: '📻' },
        { name: 'Radio Deejay', url: 'https://radiodeejay-lh.akamaihd.net/i/RadioDeejay_Live_1@189857/master.m3u8', icon: '🎵' },
        { name: 'Radio 105', url: 'https://icy.unitedradio.it/Radio105.mp3', icon: '🎶' },
        { name: 'Virgin Radio', url: 'https://icecast.unitedradio.it/Virgin.mp3', icon: '🎸' },
        { name: 'RTL 102.5', url: 'https://streamingv2.shoutcast.com/rtl-1025', icon: '📡' },
        { name: 'Radio Capital', url: 'https://radiocapital-lh.akamaihd.net/i/RadioCapital_Live_1@196312/master.m3u8', icon: '🎧' },
        { name: 'M2O', url: 'https://radiom2o-lh.akamaihd.net/i/RadioM2O_Live_1@42518/master.m3u8', icon: '💿' }
    ];

    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentStation, setCurrentStation] = React.useState(0);
    const [volume, setVolume] = React.useState(0.7);
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const audioRef = React.useRef(null);

    // Carica preferenze salvate
    React.useEffect(() => {
        const savedStation = localStorage.getItem('radioStation');
        const savedVolume = localStorage.getItem('radioVolume');
        
        if (savedStation) setCurrentStation(parseInt(savedStation));
        if (savedVolume) setVolume(parseFloat(savedVolume));
    }, []);

    // Inizializza audio
    React.useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.volume = volume;
            audioRef.current.preload = 'none';
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Gestione play/pause
    const togglePlay = async () => {
        if (!audioRef.current) return;

        try {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                setLoading(true);
                audioRef.current.src = stations[currentStation].url;
                await audioRef.current.play();
                setIsPlaying(true);
                setLoading(false);
            }
        } catch (error) {
            console.error('Errore riproduzione:', error);
            showToast('Errore nella riproduzione', 'error');
            setLoading(false);
            setIsPlaying(false);
        }
    };

    // Cambia stazione
    const changeStation = (index) => {
        const wasPlaying = isPlaying;
        
        if (audioRef.current) {
            audioRef.current.pause();
        }
        
        setCurrentStation(index);
        setIsPlaying(false);
        localStorage.setItem('radioStation', index.toString());
        
        if (wasPlaying) {
            setTimeout(() => {
                audioRef.current.src = stations[index].url;
                audioRef.current.play()
                    .then(() => setIsPlaying(true))
                    .catch(err => {
                        console.error('Errore cambio stazione:', err);
                        showToast('Errore nel cambio stazione', 'error');
                    });
            }, 100);
        }
    };

    // Gestione volume
    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
        localStorage.setItem('radioVolume', newVolume.toString());
    };

    const station = stations[currentStation];

    // Versione compatta (default)
    if (!isExpanded) {
        return (
            <div className={`fixed bottom-4 right-4 z-50 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-full shadow-2xl border-2 ${
                isPlaying ? 'border-indigo-500 animate-pulse' : darkMode ? 'border-gray-700' : 'border-gray-200'
            } overflow-hidden transition-all duration-300`}>
                <div className="flex items-center gap-2 p-3">
                    {/* Play/Pause Button */}
                    <button
                        onClick={togglePlay}
                        disabled={loading}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            loading 
                                ? 'bg-gray-400 cursor-wait'
                                : isPlaying
                                ? 'bg-indigo-600 hover:bg-indigo-700'
                                : 'bg-indigo-500 hover:bg-indigo-600'
                        } text-white shadow-lg`}
                    >
                        {loading ? (
                            <span className="loader-small"></span>
                        ) : isPlaying ? (
                            <span className="text-xl">⏸️</span>
                        ) : (
                            <span className="text-xl">▶️</span>
                        )}
                    </button>

                    {/* Station Info */}
                    {isPlaying && (
                        <div className={`animate-fade-in ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <div className="flex items-center gap-1">
                                <span className="text-lg">{station.icon}</span>
                                <span className="text-sm font-semibold">{station.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-red-500">LIVE</span>
                            </div>
                        </div>
                    )}

                    {/* Expand Button */}
                    <button
                        onClick={() => setIsExpanded(true)}
                        className={`p-2 rounded-full transition-colors ${
                            darkMode 
                                ? 'hover:bg-gray-700 text-gray-300' 
                                : 'hover:bg-gray-100 text-gray-600'
                        }`}
                        title="Espandi"
                    >
                        <span className="text-lg">⚙️</span>
                    </button>
                </div>
            </div>
        );
    }

    // Versione espansa
    return (
        <div className={`fixed bottom-4 right-4 z-50 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-xl shadow-2xl border ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
        } w-80 animate-fade-in`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
                <div className="flex items-center gap-2">
                    <span className="text-xl">📻</span>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Web Radio
                    </h3>
                </div>
                <button
                    onClick={() => setIsExpanded(false)}
                    className={`p-1 rounded-lg transition-colors ${
                        darkMode 
                            ? 'hover:bg-gray-700 text-gray-300' 
                            : 'hover:bg-gray-100 text-gray-600'
                    }`}
                >
                    <span className="text-lg">✖️</span>
                </button>
            </div>

            {/* Player Controls */}
            <div className="p-4 space-y-4">
                {/* Current Station */}
                <div className={`text-center p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                    <div className="text-3xl mb-2">{station.icon}</div>
                    <div className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {station.name}
                    </div>
                    {isPlaying && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-red-500 font-semibold">IN DIRETTA</span>
                        </div>
                    )}
                </div>

                {/* Play/Pause + Volume */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={togglePlay}
                        disabled={loading}
                        className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all ${
                            loading 
                                ? 'bg-gray-400 cursor-wait'
                                : isPlaying
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                    >
                        {loading ? 'Caricamento...' : isPlaying ? '⏸️ Pausa' : '▶️ Play'}
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-lg">{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-20"
                        />
                    </div>
                </div>

                {/* Station List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    <div className={`text-xs font-semibold mb-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        CAMBIA STAZIONE
                    </div>
                    {stations.map((st, index) => (
                        <button
                            key={index}
                            onClick={() => changeStation(index)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                                index === currentStation
                                    ? darkMode
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-indigo-500 text-white'
                                    : darkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span className="text-xl">{st.icon}</span>
                            <span className="font-medium text-sm">{st.name}</span>
                            {index === currentStation && isPlaying && (
                                <span className="ml-auto text-xs">🔊</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loader per caricamento */}
            <style>{`
                .loader-small {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #ffffff;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    display: inline-block;
                }
            `}</style>
        </div>
    );
};