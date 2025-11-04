// 📋 CHANGELOG MULTILANGUAGE - All versions in 2 languages

const changelogs = {
    it: [
        {
            version: 'v5.1',
            date: '4 Novembre 2025',
            changes: [
                '🔐 NEW: Sistema completo autenticazione admin con password',
                '🔑 NEW: Recupero password tramite domande di sicurezza',
                '💾 NEW: Password e domande salvate in Firebase (non più hardcoded)',
                '⚙️ NEW: Cambio password direttamente dalle Impostazioni',
                '🛡️ NEW: Sezione Sicurezza dedicata in Settings',
                '✅ NEW: Password reimpostata automaticamente senza interventi manuali',
                '🔒 NEW: Hash SHA-256 per password e risposte di sicurezza',
                '📱 NEW: Schermata login moderna con dark mode',
                '🔓 NEW: Link "Password dimenticata?" nel form login',
                '💡 NEW: Sistema sessioni 24h con localStorage',
                '🌐 FIX: Tooltip Dashboard ore in andamento ora visibile correttamente',
                '🎯 FIX: Tooltip con z-index 9999 sopra tutti gli elementi',
                '📊 FIX: Rimosso tooltip nativo browser (title attribute)',
                '🔥 NEW: Firestore Rules aggiornate per proteggere dati sensibili',
                '📝 NEW: Traduzioni complete IT/EN per sistema autenticazione'
            ]
        },
        {
            version: 'v5.0',
            date: '4 Novembre 2025',
            changes: [
                '🎨 NEW: Redesign completo interfaccia Settings con sezioni collassabili',
                '📱 NEW: Bottom Navigation moderna per mobile (5 icone + menu popup)',
                '💾 NEW: Backup & Restore integrati in Settings',
                '📝 NEW: Audit Log integrato in Settings con filtri e selezione multipla',
                '📋 NEW: Card fogli più compatte con bordo colorato verticale per stato',
                '🟢 NEW: Verde per completati, 🟡 Giallo per bozze, ⚪ Grigio per archiviati',
                '⚡ FIX: Dashboard sfarfallio risolto (rimosso loading inutile)',
                '🌐 IMPROVED: Traduzioni complete in inglese per tutte le nuove funzioni',
                '📊 FIX: Dati Dashboard ora sempre visibili e aggiornati',
                '🎯 IMPROVED: Performance migliorate rimuovendo stati ridondanti',
                '🔧 FIX: Changelog rendering sicuro con controlli null safety'
            ]
        },
        {
            version: 'v4.3',
            date: '10 Luglio 2025',
            changes: [
                '🌟 NEW: Miglioramenti al sistema di notifiche programmate',
                '📊 NEW: Statistiche avanzate per lavoratori',
                '🔒 FIX: Ottimizzazioni di sicurezza per backup e restore',
                '🌐 IMPROVED: Traduzioni aggiornate in tutte le lingue supportate'
            ]
        },
        {
            version: 'v4.2',
            date: '28 Giugno 2025',
            changes: [
                '⏰ NEW: Sistema Notifiche Programmate - scegli orari e messaggi personalizzati',
                '📱 NEW: Notifiche Android completamente funzionanti (PWA con Service Worker)',
                '💬 NEW: Messaggi personalizzati con emoji nei reminder',
                '📅 NEW: Selezione giorni della settimana per ogni notifica',
                '🔔 NEW: Abilitazione/disabilitazione singole notifiche',
                '🧪 NEW: Test immediato notifiche con pulsante dedicato',
                '💡 NEW: Messaggi di esempio pronti all\'uso',
                '🎨 IMPROVED: Interfaccia notifiche moderna e intuitiva'
            ]
        },
        {
            version: 'v4.1',
            date: '15 Giugno 2025',
            changes: [
                '🎨 FIX: Canvas firma ora visibile in dark mode (sfondo scuro, tratto bianco)',
                '📝 FIX: Placeholder nome/cognome corretti (non più "undefined")',
                '📅 NEW: Campo "Data di Nascita" nei campi opzionali lavoratore',
                '🏷️ NEW: Etichetta "(facoltativo)" su tutti i campi opzionali',
                '🌐 NEW: Selettore lingua indipendente per modalità lavoratore',
                '💾 IMPROVED: Sistema auto-save sessione lavoratore ottimizzato'
            ]
        },
        {
            version: 'v4.0',
            date: '1 Giugno 2025',
            changes: [
                '📊 NEW: Export Excel (XLSX) con formattazione avanzata',
                '🔔 NEW: Notifiche browser quando lavoratore invia dati',
                '📆 NEW: Vista Calendario interattiva con FullCalendar',
                '👤 NEW: Statistiche dettagliate per singolo lavoratore',
                '💾 NEW: Sistema Backup/Restore completo (JSON)',
                '🔍 NEW: Ricerca globale in tutti i fogli',
                '📈 NEW: Comparazione periodi (questo mese vs scorso)',
                '💡 NEW: Auto-completamento intelligente per campi ripetuti',
                '🚀 NEW: PWA migliorata con offline mode'
            ]
        },
        {
            version: 'v3.5',
            date: '18 Maggio 2025',
            changes: [
                '📊 NEW: Grafici comparativi anno su anno',
                '🔐 NEW: Audit trail completo per compliance GDPR',
                '📱 NEW: Installazione PWA con prompt personalizzato',
                '💾 NEW: Auto-backup giornaliero programmabile',
                '🎨 IMPROVED: Performance rendering liste grandi',
                '🌐 IMPROVED: SEO e meta tags ottimizzati'
            ]
        },
        {
            version: 'v3.0',
            date: '5 Maggio 2025',
            changes: [
                '🐛 FIX: Scadenza link ora parte dal momento della generazione',
                '🐛 FIX: Firma cancellabile e rifacibile senza problemi',
                '📋 NEW: Changelog integrato in Settings',
                '🔧 IMPROVED: Sistema di gestione link più robusto',
                '⚡ IMPROVED: Velocità caricamento pagine del 50%'
            ]
        },
        {
            version: 'v2.5',
            date: '20 Aprile 2025',
            changes: [
                '⚙️ NEW: Settings per scadenza link lavoratori (8h, 24h, 48h, 72h, Mai)',
                '💾 NEW: Salvataggio automatico sessione lavoratore',
                '↩️ NEW: Ripristino sessione precedente per lavoratori',
                '🌓 NEW: Dark mode locale per modalità lavoratore',
                '📄 NEW: Possibilità per i lavoratori di rigenerare il proprio PDF',
                '✏️ NEW: Modifica dati dopo invio (con re-firma)'
            ]
        },
        {
            version: 'v2.0',
            date: '5 Aprile 2025',
            changes: [
                '📊 NEW: Dashboard avanzata con grafici animati',
                '📈 NEW: Statistiche in tempo reale (ore oggi, settimana, mese)',
                '🏆 NEW: Top 10 lavoratori e top 5 aziende',
                '📉 NEW: Grafici: Barre animate, Torta distribuzione',
                '📋 NEW: Tabella attività recenti',
                '🔔 NEW: Widget notifiche e performance'
            ]
        },
        {
            version: 'v1.5',
            date: '20 Marzo 2025',
            changes: [
                '🌐 NEW: Supporto multilingua (IT, EN)',
                '🌓 NEW: Dark mode completo',
                '📝 NEW: Modifica multipla lavoratori (bulk edit)',
                '✏️ NEW: Modifica inline singolo lavoratore',
                '🚫 NEW: Sistema blacklist con controllo automatico',
                '📝 NEW: Audit log completo con filtri',
                '📈 NEW: Report Manager (settimanali, mensili, custom)',
                '📄 NEW: Export CSV'
            ]
        },
        {
            version: 'v1.0',
            date: '1 Marzo 2025',
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
    ],
    en: [
        {
            version: 'v5.1',
            date: 'November 4, 2025',
            changes: [
                '🔐 NEW: Complete admin authentication system with password',
                '🔑 NEW: Password recovery via security questions',
                '💾 NEW: Password and questions saved in Firebase (no longer hardcoded)',
                '⚙️ NEW: Change password directly from Settings',
                '🛡️ NEW: Dedicated Security section in Settings',
                '✅ NEW: Password reset automatically without manual intervention',
                '🔒 NEW: SHA-256 hash for passwords and security answers',
                '📱 NEW: Modern login screen with dark mode',
                '🔓 NEW: "Forgot password?" link in login form',
                '💡 NEW: 24h session system with localStorage',
                '🌐 FIX: Dashboard hours in progress tooltip now visible correctly',
                '🎯 FIX: Tooltip with z-index 9999 above all elements',
                '📊 FIX: Removed native browser tooltip (title attribute)',
                '🔥 NEW: Firestore Rules updated to protect sensitive data',
                '📝 NEW: Complete IT/EN translations for authentication system'
            ]
        },
        {
            version: 'v5.0',
            date: 'November 4, 2025',
            changes: [
                '🎨 NEW: Complete Settings interface redesign with collapsible sections',
                '📱 NEW: Modern Bottom Navigation for mobile (5 icons + popup menu)',
                '💾 NEW: Backup & Restore integrated in Settings',
                '📝 NEW: Audit Log integrated in Settings with filters and multi-selection',
                '📋 NEW: More compact sheet cards with colored vertical border by status',
                '🟢 NEW: Green for completed, 🟡 Yellow for drafts, ⚪ Gray for archived',
                '⚡ FIX: Dashboard flickering resolved (removed useless loading)',
                '🌐 IMPROVED: Complete English translations for all new features',
                '📊 FIX: Dashboard data now always visible and updated',
                '🎯 IMPROVED: Improved performance removing redundant states',
                '🔧 FIX: Changelog rendering safe with null safety checks'
            ]
        },
        {
            version: 'v4.3',
            date: 'July 10, 2025',
            changes: [
                '🌟 NEW: Improvements to scheduled notifications system',
                '📊 NEW: Advanced statistics for workers',
                '🔒 FIX: Security optimizations for backup and restore',
                '🌐 IMPROVED: Updated translations in all supported languages'
            ]
        },
        {
            version: 'v4.2',
            date: 'June 28, 2025',
            changes: [
                '⏰ NEW: Scheduled Notifications System - choose custom times and messages',
                '📱 NEW: Fully functional Android notifications (PWA with Service Worker)',
                '💬 NEW: Custom messages with emoji in reminders',
                '📅 NEW: Weekday selection for each notification',
                '🔔 NEW: Enable/disable individual notifications',
                '🧪 NEW: Instant notification test with dedicated button',
                '💡 NEW: Ready-to-use example messages',
                '🎨 IMPROVED: Modern and intuitive notification interface'
            ]
        },
        {
            version: 'v4.1',
            date: 'June 15, 2025',
            changes: [
                '🎨 FIX: Signature canvas now visible in dark mode (dark background, white stroke)',
                '📝 FIX: First name/last name placeholders corrected (no more "undefined")',
                '📅 NEW: "Birth Date" field in worker optional fields',
                '🏷️ NEW: "(optional)" label on all optional fields',
                '🌐 NEW: Independent language selector for worker mode',
                '💾 IMPROVED: Worker session auto-save system optimized'
            ]
        },
        {
            version: 'v4.0',
            date: 'June 1, 2025',
            changes: [
                '📊 NEW: Excel export (XLSX) with advanced formatting',
                '🔔 NEW: Browser notifications when worker submits data',
                '📆 NEW: Interactive Calendar view with FullCalendar',
                '👤 NEW: Detailed statistics per worker',
                '💾 NEW: Complete Backup/Restore system (JSON)',
                '🔍 NEW: Global search across all sheets',
                '📈 NEW: Period comparison (this month vs last)',
                '💡 NEW: Smart auto-completion for repeated fields',
                '🚀 NEW: Improved PWA with offline mode'
            ]
        },
        {
            version: 'v3.5',
            date: 'May 18, 2025',
            changes: [
                '📊 NEW: Year-over-year comparison charts',
                '🔐 NEW: Complete audit trail for GDPR compliance',
                '📱 NEW: PWA installation with custom prompt',
                '💾 NEW: Schedulable daily auto-backup',
                '🎨 IMPROVED: Large list rendering performance',
                '🌐 IMPROVED: Optimized SEO and meta tags'
            ]
        },
        {
            version: 'v3.0',
            date: 'May 5, 2025',
            changes: [
                '🐛 FIX: Link expiration now starts from generation time',
                '🐛 FIX: Signature clearable and redoable without issues',
                '📋 NEW: Integrated Changelog in Settings',
                '🔧 IMPROVED: More robust link management system',
                '⚡ IMPROVED: 50% faster page loading speed'
            ]
        },
        {
            version: 'v2.5',
            date: 'April 20, 2025',
            changes: [
                '⚙️ NEW: Settings for worker link expiration (8h, 24h, 48h, 72h, Never)',
                '💾 NEW: Automatic worker session saving',
                '↩️ NEW: Previous session restore for workers',
                '🌓 NEW: Local dark mode for worker mode',
                '📄 NEW: Workers can regenerate their own PDF',
                '✏️ NEW: Edit data after submission (with re-signature)'
            ]
        },
        {
            version: 'v2.0',
            date: 'April 5, 2025',
            changes: [
                '📊 NEW: Advanced dashboard with animated charts',
                '📈 NEW: Real-time statistics (hours today, week, month)',
                '🏆 NEW: Top 10 workers and top 5 companies',
                '📉 NEW: Charts: Animated bars, Distribution pie',
                '📋 NEW: Recent activity table',
                '🔔 NEW: Notifications and performance widgets'
            ]
        },
        {
            version: 'v1.5',
            date: 'March 20, 2025',
            changes: [
                '🌐 NEW: Multi-language support (IT, EN)',
                '🌓 NEW: Complete dark mode',
                '📝 NEW: Bulk edit workers',
                '✏️ NEW: Inline edit single worker',
                '🚫 NEW: Blacklist system with automatic check',
                '📝 NEW: Complete audit log with filters',
                '📈 NEW: Report Manager (weekly, monthly, custom)',
                '📄 NEW: CSV export'
            ]
        },
        {
            version: 'v1.0',
            date: 'March 1, 2025',
            changes: [
                '🎉 RELEASE: First public version',
                '📋 NEW: Basic timesheet management',
                '👷 NEW: Worker mode with registration form',
                '✍️ NEW: Touch-friendly digital signature',
                '📄 NEW: Automatic PDF generation',
                '🔥 NEW: Firebase integration (Firestore + Storage)',
                '🖼️ NEW: Company logo upload',
                '📦 NEW: Sheet archiving',
                '🗑️ NEW: Sheet deletion',
                '📱 NEW: Mobile-first responsive design'
            ]
        }
    ]
};