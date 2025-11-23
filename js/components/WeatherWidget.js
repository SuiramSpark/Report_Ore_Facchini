
// Minimal Italian-only WeatherWidget
// - Single input (Italian only)
// - Uses Open-Meteo geocoding + current_weather
// - Simple localStorage caching
// - Themed background based on simplified weatherKey

function WeatherWidget(props) {
    const locationProp = (props && (props.location || props.defaultLocation)) || 'Roma';
    const dark = !!(props && (props.darkMode || props.dark));

    const [query, setQuery] = React.useState(locationProp || '');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [locationLabel, setLocationLabel] = React.useState(locationProp);
    const [candidates, setCandidates] = React.useState(null);
    const [showCandidates, setShowCandidates] = React.useState(false);
    const [temp, setTemp] = React.useState(null);
    const [desc, setDesc] = React.useState('');
    const [weatherKey, setWeatherKey] = React.useState('sun');

    const fullHeight = !!(props && props.fullHeight);
    // showControls: when false the widget will not render its internal input/controls
    const showControls = props && typeof props.showControls !== 'undefined' ? !!props.showControls : true;
    const containerStyle = {
        height: fullHeight ? '100%' : 'auto',
        minHeight: fullHeight ? '100%' : 120,
        borderRadius: 12,
        padding: fullHeight ? 18 : 14,
        display: 'flex',
        flexDirection: 'row',
        alignItems: fullHeight ? 'stretch' : 'center',
        gap: '1rem',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative'
    };

    // simple cache helpers
    const cacheSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify({ ts: Date.now(), v })); } catch (e) {} };
    const cacheGet = (k, maxAgeMs = 5 * 60 * 1000) => {
        try {
            const raw = localStorage.getItem(k);
            if (!raw) return null;
            const p = JSON.parse(raw);
            if (!p || !p.ts) return null;
            if ((Date.now() - p.ts) > maxAgeMs) { localStorage.removeItem(k); return null; }
            return p.v;
        } catch (e) { return null; }
    };

    function codeToKey(code) {
        if (code === 0) return 'sun';
        if (code >= 1 && code <= 3) return 'cloud';
        if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
        if (code >= 71 && code <= 77) return 'snow';
        if (code === 95 || (code >= 96 && code <= 99)) return 'thunder';
        return 'unknown';
    }

    async function geocodeIt(name) {
        const q = ('' + (name || '')).trim();
        if (!q) return null;
        const key = 'geo:' + q.toLowerCase();
        const cached = cacheGet(key, 10 * 60 * 1000);
        if (cached) return cached;
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=it`);
            if (!res.ok) return null;
            const j = await res.json();
            if (j && j.results && j.results.length) {
                cacheSet(key, j.results);
                return j.results;
            }
        } catch (e) {}
        return null;
    }

    async function fetchWeather(lat, lon) {
        const key = `meteo:${lat.toFixed(4)}:${lon.toFixed(4)}`;
        const cached = cacheGet(key, 5 * 60 * 1000);
        if (cached) return cached;
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current_weather=true&timezone=auto`);
            if (!res.ok) throw new Error('Errore meteo');
            const j = await res.json();
            if (!j || !j.current_weather) throw new Error('Dati non disponibili');
            cacheSet(key, j.current_weather);
            return j.current_weather;
        } catch (e) { throw e; }
    }

    async function doSearch(name) {
        const q = ('' + (name || '')).trim();
        if (!q) return;
        setLoading(true); setError(null);
        try {
            const results = await geocodeIt(q);
            if (!results || !results.length) throw new Error((typeof window !== 'undefined' && window.t) ? window.t('weatherLocationNotFound') : 'Località non trovata');
            // if multiple results, try to find exact match; otherwise show candidates for user to choose
            setCandidates(null);
            setShowCandidates(false);
            if (results.length > 1) {
                const qn = q.toLowerCase();
                const exact = results.find(r => (r.name || '').toLowerCase() === qn);
                if (exact) {
                    // use exact match
                    const w = await fetchWeather(exact.latitude, exact.longitude);
                    setTemp(typeof w.temperature === 'number' ? w.temperature : null);
                    setDesc((typeof window !== 'undefined' && window.t) ? window.t('weatherWindPrefix', { speed: w.windspeed ?? '--' }) : `Vento ${w.windspeed ?? '--'} km/h`);
                    setLocationLabel(exact.name + (exact.admin1 ? ', ' + exact.admin1 : ''));
                    setWeatherKey(codeToKey(w.weathercode));
                    if (props && typeof props.onWeatherChange === 'function') {
                        try { 
                            props.onWeatherChange(codeToKey(w.weathercode), {
                                temp: w.temperature,
                                condition: w.weathercode,
                                location: exact.name + (exact.admin1 ? ', ' + exact.admin1 : '')
                            }); 
                        } catch (e) {}
                    }
                    return;
                }
                // show candidates
                setCandidates(results);
                setShowCandidates(true);
                return;
            }
            // single result
            const best = results[0];
            const w = await fetchWeather(best.latitude, best.longitude);
            setTemp(typeof w.temperature === 'number' ? w.temperature : null);
            setDesc((typeof window !== 'undefined' && window.t) ? window.t('weatherWindPrefix', { speed: w.windspeed ?? '--' }) : `Vento ${w.windspeed ?? '--'} km/h`);
            setLocationLabel(best.name + (best.admin1 ? ', ' + best.admin1 : ''));
            setWeatherKey(codeToKey(w.weathercode));
            if (props && typeof props.onWeatherChange === 'function') {
                try { 
                    props.onWeatherChange(codeToKey(w.weathercode), {
                        temp: w.temperature,
                        condition: w.weathercode,
                        location: best.name + (best.admin1 ? ', ' + best.admin1 : '')
                    }); 
                } catch (e) {}
            }
        } catch (e) {
            setError(e && e.message ? e.message : String(e));
            setTemp(null); setDesc('');
        } finally { setLoading(false); }
    }

    // trigger initial search
    React.useEffect(() => { doSearch(locationProp); }, [locationProp]);

    // simple themed background colors with light/dark variants so widget matches both themes
    const themes = {
        sun: {
            light: { start: '#fff9ed', end: '#fff1d6', color: '#f59e0b' },
            dark: { start: '#0f1724', end: '#071428', color: '#f59e0b' }
        },
        cloud: {
            light: { start: '#eef2ff', end: '#e6f0ff', color: '#64748b' },
            dark: { start: '#0b1220', end: '#071428', color: '#94a3b8' }
        },
        rain: {
            light: { start: '#dbeafe', end: '#c7e0ff', color: '#0ea5e9' },
            dark: { start: '#071a2b', end: '#021428', color: '#60a5fa' }
        },
        snow: {
            light: { start: '#f0f8ff', end: '#e6f5ff', color: '#60a5fa' },
            dark: { start: '#081022', end: '#021426', color: '#a8d0ff' }
        },
        thunder: {
            light: { start: '#e6edf8', end: '#cfe6ff', color: '#0ea5e9' },
            dark: { start: '#07101a', end: '#021018', color: '#93c5fd' }
        },
        unknown: {
            light: { start: '#ffffff', end: '#f0f0f0', color: '#334155' },
            dark: { start: '#0f1724', end: '#071428', color: '#94a3b8' }
        }
    };
    const palSet = themes[weatherKey] || themes.sun;
    const pal = dark ? palSet.dark : palSet.light;

    const rootClass = (dark ? 'text-white' : 'text-gray-900');

    // add a smooth transition for background
    const bgStyle = { ...containerStyle, background: `linear-gradient(90deg, ${pal.start}, ${pal.end})`, transition: 'background 600ms ease' };

    // if fullHeight requested, make sure children stretch vertically
    // Allow children to stretch and to shrink properly inside flex column/row
    const leftStyle = {
        flex: '1 1 40%',
        minWidth: 160,
        minHeight: 0,
        height: fullHeight ? '100%' : 'auto',
        alignSelf: fullHeight ? 'stretch' : 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: fullHeight ? 'center' : 'center'
    };

    const centerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flex: '1 1 40%',
        minWidth: 140,
        minHeight: 0,
        height: fullHeight ? '100%' : 'auto',
        alignSelf: fullHeight ? 'stretch' : 'center',
        justifyContent: 'center'
    };

    return React.createElement('div', { className: `weather-widget ${rootClass}`, style: bgStyle },
        // left: input (optional)
            showControls ? React.createElement('div', { style: leftStyle },
                React.createElement('label', { className: 'text-xs block mb-1' }, (typeof window !== 'undefined' && window.t) ? window.t('weatherLabelLocation') : 'Località'),
                React.createElement('div', { className: 'flex gap-2' },
                    React.createElement('input', {
                        value: query,
                        onChange: (e) => setQuery(e.target.value),
                        onKeyDown: (e) => { if (e.key === 'Enter') doSearch(query); },
                        placeholder: (typeof window !== 'undefined' && window.t) ? window.t('weatherPlaceholderCity') : 'Inserisci città (es. Roma)',
                        className: 'rounded px-2 py-1 flex-1 min-w-0 text-sm'
                    }),
                    React.createElement('button', { 
                        className: `px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm whitespace-nowrap ${dark ? 'bg-white/10 text-white' : 'bg-indigo-600 text-white'}`, 
                        onClick: () => doSearch(query), 
                        disabled: loading 
                    }, loading ? '…' : ((typeof window !== 'undefined' && window.t) ? window.t('weatherUpdate') : 'Aggiorna'))
                )
            ) : null,
        // center: icon
        React.createElement('div', { style: centerStyle },
            React.createElement('div', { style: { fontSize: 34 } },
                weatherKey === 'sun' ? '☀️' : weatherKey === 'cloud' ? '☁️' : weatherKey === 'rain' ? '🌧️' : weatherKey === 'snow' ? '❄️' : '⛈️'
            ),
            React.createElement('div', null,
                React.createElement('div', { className: 'text-sm font-semibold' }, locationLabel),
                React.createElement('div', { className: 'text-2xl font-bold mt-1' }, temp !== null ? `${Math.round(temp)}°C` : '--°C'),
                React.createElement('div', { className: 'text-xs opacity-80 mt-1' }, error ? ((typeof window !== 'undefined' && window.t) ? `${window.t('weatherErrorPrefix')} ${error}` : `Errore: ${error}`) : desc || '—')
            )
        )
        ,
        // candidate list (appears below the widget when multiple geocode results)
        (showCandidates && candidates && candidates.length) ? React.createElement('div', { style: { position: 'absolute', left: 12, right: 12, top: '100%', marginTop: 8, zIndex: 60 } },
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded p-2 shadow-lg text-sm', style: { color: dark ? '#fff' : '#111' } },
                React.createElement('div', { className: 'font-semibold mb-2' }, (typeof window !== 'undefined' && window.t) ? window.t('weatherSelectLocation') : 'Seleziona località:'),
                ...candidates.slice(0,6).map((c, i) => React.createElement('button', {
                    key: i,
                    className: 'w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded',
                    onClick: async () => {
                        setCandidates(null); setShowCandidates(false);
                        try {
                            setLoading(true); setError(null);
                            const w = await fetchWeather(c.latitude, c.longitude);
                            setTemp(typeof w.temperature === 'number' ? w.temperature : null);
                            setDesc((typeof window !== 'undefined' && window.t) ? window.t('weatherWindPrefix', { speed: w.windspeed ?? '--' }) : `Vento ${w.windspeed ?? '--'} km/h`);
                            setLocationLabel(c.name + (c.admin1 ? ', ' + c.admin1 : ''));
                            setWeatherKey(codeToKey(w.weathercode));
                            if (props && typeof props.onWeatherChange === 'function') {
                                try { 
                                    props.onWeatherChange(codeToKey(w.weathercode), {
                                        temp: w.temperature,
                                        condition: w.weathercode,
                                        location: c.name + (c.admin1 ? ', ' + c.admin1 : '')
                                    }); 
                                } catch (e) {}
                            }
                        } catch (e) { setError(e && e.message ? e.message : String(e)); }
                        finally { setLoading(false); }
                    }
                }, `${c.name}${c.admin1 ? ', ' + c.admin1 : ''}${c.country ? ' - ' + c.country : ''}`))
            )
        ) : null
    );
}

if (!window.WeatherWidget) window.WeatherWidget = WeatherWidget;
