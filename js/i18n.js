(function(){
    // Async fetch-first i18n loader
    // Purpose: prefer physical JSON files under js/locales/*.json for the requested languages
    // while avoiding main-thread blocking. Exposes `window.i18nReady` Promise that resolves
    // when translations are available (or fallback is used).
    try {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'admin';
    // Global languages for the entire app: keep the app lean (only it/en)
    const globalLangs = ['it','en'];
    // Worker form additional languages (loaded on-demand only)
    const workerExtraLangs = ['es','fr','ro'];
    // Desired languages to load initially: only the global set
    const desired = globalLangs.slice();

        const existing = window.translations || {};
        const result = {};

        const loaders = desired.map(lang => {
            const url = `js/locales/${lang}.json`;
            return fetch(url, { cache: 'no-cache' })
                .then(res => {
                    if (!res.ok) throw new Error('not-found');
                    return res.json().then(json => ({ lang, json, source: 'json' }));
                })
                .catch(() => {
                    if (existing[lang]) return { lang, json: existing[lang], source: 'inline' };
                    return { lang, json: null, source: 'missing' };
                });
        });

        window.i18nReady = Promise.all(loaders)
            .then(results => {
                results.forEach(r => {
                    if (r.json) {
                        result[r.lang] = r.json;
                        console.log(`i18n: loaded ${r.lang} via ${r.source}`);
                    } else {
                        console.warn(`i18n: language ${r.lang} not available`);
                    }
                });

                // If no languages were loaded, fallback to existing global translations
                if (Object.keys(result).length === 0 && Object.keys(existing).length > 0) {
                    Object.keys(existing).forEach(k => { result[k] = existing[k]; });
                    console.log('i18n: falling back to existing inline translations');
                }

                // keep translations for the languages we actually loaded (or had inline)
                window.translations = result;
                // Expose availableLanguages (app-wide) - keep only it/en loaded globally
                window.availableLanguages = desired.slice();
                // Expose workerExtraLangs so forms can lazily load them when needed
                window.workerAvailableLanguages = workerExtraLangs.slice();
                window.i18nMode = mode;
                // expose small helper utilities for runtime usage (safe, minimal, no layout changes)
                (function exposeHelpers() {
                    // current language selection: prefer localStorage, then browser, fallback to 'it'
                    function detectLanguage() {
                        try {
                            const urlParams = new URLSearchParams(window.location.search);
                            const urlLang = urlParams.get('lang') || urlParams.get('language');
                            if (urlLang) return urlLang.substring(0,2);
                        } catch (e) {}
                        const stored = localStorage.getItem('language');
                        if (stored && window.availableLanguages && window.availableLanguages.includes(stored)) return stored;
                        const nav = (navigator.language || navigator.userLanguage || 'it').substring(0,2);
                        if (window.availableLanguages && window.availableLanguages.includes(nav)) return nav;
                        return 'it';
                    }

                    let currentLang = detectLanguage();

                    window.getLanguage = function() { return currentLang; };

                    window.setLanguage = function(lang) {
                        if (!lang) return;
                        const short = String(lang).substring(0,2);
                        // validate against allowed languages for this mode
                        if (window.availableLanguages && !window.availableLanguages.includes(short)) {
                            console.warn(`i18n: attempted to set unsupported language ${short} for mode ${window.i18nMode}`);
                            return;
                        }
                        currentLang = short;
                        try { localStorage.setItem('language', currentLang); } catch(e){}
                        // notify listeners that language changed so UI can re-render
                        try { window.dispatchEvent(new CustomEvent('languageChanged', { detail: currentLang })); } catch (e) {}
                        // no layout changes here; components using window.translations should re-read their local t
                        console.log('i18n: language set to', currentLang);
                    };

                    // map short language -> BCP-47 locale for Date/Number APIs
                    window.getLocale = function() {
                        const map = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', ro: 'ro-RO' };
                        return map[currentLang] || map['it'];
                    };

                    // t(key, vars?) - safe lookup + simple interpolation
                    window.t = function(key, vars) {
                        if (!key) return '';
                        const lang = currentLang || 'it';
                        const src = (window.translations && (window.translations[lang] || window.translations.it)) || {};
                        let str = src[key];
                        if (typeof str === 'undefined') {
                            // fallback to italian
                            const it = (window.translations && window.translations.it) || {};
                            str = it[key];
                        }
                        if (typeof str === 'undefined') {
                            console.warn(`i18n: missing key ${key} for lang ${lang}`);
                            return key;
                        }
                        if (vars && typeof vars === 'object') {
                            Object.keys(vars).forEach(k => {
                                const re = new RegExp(`\\{${k}\\}`, 'g');
                                str = String(str).replace(re, vars[k]);
                            });
                        }
                        return str;
                    };
                    // loader for worker-only locales (es/fr/ro) - fetch and cache in window.translations
                    window.loadWorkerLocale = async function(lang) {
                        try {
                            const short = String(lang).substring(0,2);
                            if (!workerExtraLangs.includes(short)) {
                                throw new Error('unsupported worker locale ' + short);
                            }
                            if (window.translations && window.translations[short]) return window.translations[short];
                            const res = await fetch(`js/locales/${short}.json`, { cache: 'no-cache' });
                            if (!res.ok) throw new Error('not-found');
                            const json = await res.json();
                            if (!window.translations) window.translations = {};
                            window.translations[short] = json;
                            return json;
                        } catch (e) {
                            console.warn('i18n: failed to load worker locale', lang, e);
                            return null;
                        }
                    };
                })();

                console.log('i18n: mode=', mode, 'languages=', window.availableLanguages);
                return { mode, languages: window.availableLanguages };
            })
            .catch(err => {
                console.warn('i18n: loading failed', err);
                window.translations = existing;
                window.availableLanguages = Object.keys(existing);
                window.i18nMode = mode;
                return { mode, languages: window.availableLanguages };
            });

    } catch (err) {
        console.warn('i18n: initialization error', err);
        window.i18nReady = Promise.resolve({ mode: 'admin', languages: Object.keys(window.translations || {}) });
    }
})();
