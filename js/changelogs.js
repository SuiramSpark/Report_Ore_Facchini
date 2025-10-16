// 📋 CHANGELOG MULTILINGUA - Tutte le versioni in 5 lingue

const changelogs = {
    it: [
        {
            version: 'v4.2',
            date: '15 Ottobre 2025',
            changes: [
                '⏰ NEW: Sistema Notifiche Programmate - scegli orari e messaggi personalizzati',
                '📱 NEW: Notifiche Android completamente funzionanti (PWA con Service Worker)',
                '💬 NEW: Messaggi personalizzati con emoji nei reminder (es: "Mario sei bellissimo! ❤️")',
                '📅 NEW: Selezione giorni della settimana per ogni notifica',
                '🔔 NEW: Abilitazione/disabilitazione singole notifiche',
                '🧪 NEW: Test immediato notifiche con pulsante dedicato',
                '💡 NEW: Messaggi di esempio pronti all\'uso',
                '🎨 IMPROVED: Interfaccia notifiche moderna e intuitiva',
                '📊 IMPROVED: Gestione notifiche con persistenza su Firestore',
                '🌐 IMPROVED: Sistema multilingua esteso alle notifiche programmate'
            ]
        },
        {
            version: 'v4.1',
            date: '12 Ottobre 2025',
            changes: [
                '🎨 FIX: Canvas firma ora visibile in dark mode (sfondo scuro, tratto bianco)',
                '📝 FIX: Placeholder nome/cognome corretti (non più "undefined")',
                '📅 NEW: Campo "Data di Nascita" nei campi opzionali lavoratore',
                '🏷️ NEW: Etichetta "(facoltativo)" su tutti i campi opzionali',
                '🌐 NEW: Selettore lingua indipendente per modalità lavoratore',
                '💾 IMPROVED: Sistema auto-save sessione lavoratore ottimizzato',
                '🎨 IMPROVED: Input data con supporto colorScheme per dark mode'
            ]
        },
        {
            version: 'v4.0',
            date: '16 Gennaio 2025',
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
            date: '15 Gennaio 2025',
            changes: [
                '🐛 FIX: Scadenza link ora parte dal momento della generazione, non dalla creazione foglio',
                '🐛 FIX: Firma cancellabile e rifacibile senza problemi (responsabile + worker)',
                '📋 NEW: Changelog integrato in Settings per tracciare tutte le versioni',
                '🔧 IMPROVED: Sistema di gestione link più robusto con timestamp dedicato'
            ]
        },
        {
            version: 'v2.5',
            date: '14 Gennaio 2025',
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
            date: '10 Gennaio 2025',
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
            date: '5 Gennaio 2025',
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
            date: '20 Dicembre 2024',
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
            version: 'v4.2',
            date: 'October 15, 2025',
            changes: [
                '⏰ NEW: Scheduled Notifications System - choose custom times and messages',
                '📱 NEW: Fully functional Android notifications (PWA with Service Worker)',
                '💬 NEW: Custom messages with emoji in reminders (e.g., "Mario you\'re awesome! ❤️")',
                '📅 NEW: Weekday selection for each notification',
                '🔔 NEW: Enable/disable individual notifications',
                '🧪 NEW: Instant notification test with dedicated button',
                '💡 NEW: Ready-to-use example messages',
                '🎨 IMPROVED: Modern and intuitive notification interface',
                '📊 IMPROVED: Notification management with Firestore persistence',
                '🌐 IMPROVED: Multilanguage system extended to scheduled notifications'
            ]
        },
        {
            version: 'v4.1',
            date: 'October 12, 2025',
            changes: [
                '🎨 FIX: Signature canvas now visible in dark mode (dark background, white stroke)',
                '📝 FIX: First name/last name placeholders corrected (no more "undefined")',
                '📅 NEW: "Birth Date" field in worker optional fields',
                '🏷️ NEW: "(optional)" label on all optional fields',
                '🌐 NEW: Independent language selector for worker mode',
                '💾 IMPROVED: Worker session auto-save system optimized',
                '🎨 IMPROVED: Date input with colorScheme support for dark mode'
            ]
        },
        {
            version: 'v4.0',
            date: 'January 16, 2025',
            changes: [
                '📊 NEW: Excel Export (XLSX) with advanced formatting',
                '🔔 NEW: Browser notifications when worker submits data',
                '📆 NEW: Interactive Calendar view with FullCalendar',
                '👤 NEW: Detailed statistics for individual workers',
                '💾 NEW: Complete Backup/Restore system (JSON)',
                '🔍 NEW: Global search across all sheets',
                '📈 NEW: Period comparison (this month vs last)',
                '💡 NEW: Smart auto-complete for repeated fields',
                '🚀 NEW: Enhanced PWA with offline mode and install prompt',
                '⚡ NEW: Advanced auto-save for admin drafts'
            ]
        },
        {
            version: 'v3.0',
            date: 'January 15, 2025',
            changes: [
                '🐛 FIX: Link expiration now starts from generation time, not sheet creation',
                '🐛 FIX: Signature can be deleted and redone without issues (responsible + worker)',
                '📋 NEW: Integrated Changelog in Settings to track all versions',
                '🔧 IMPROVED: More robust link management system with dedicated timestamp'
            ]
        },
        {
            version: 'v2.5',
            date: 'January 14, 2025',
            changes: [
                '⚙️ NEW: Settings for worker link expiration (8h, 24h, 48h, 72h, 144h, Never, Custom)',
                '💾 NEW: Automatic session save for workers (auto-save every 2 seconds)',
                '↩️ NEW: Previous session restore for workers',
                '🌓 NEW: Local dark mode for worker mode',
                '📄 NEW: Workers can regenerate their own PDF',
                '✏️ NEW: Edit data after submission (with re-signature)',
                '🇫🇷🇷🇴 NEW: French and Romanian support (5 languages total)'
            ]
        },
        {
            version: 'v2.0',
            date: 'January 10, 2025',
            changes: [
                '📊 NEW: Advanced dashboard with animated charts',
                '📈 NEW: Real-time statistics (today hours, week, month)',
                '🏆 NEW: Top 10 workers and top 5 companies',
                '📉 NEW: Charts: Animated bars, Distribution pie, Hourly breakdown',
                '📋 NEW: Recent activity table',
                '🔔 NEW: Notifications and performance widgets',
                '🎨 NEW: Smooth and responsive animations',
                '📱 IMPROVED: Mobile optimization for dashboard'
            ]
        },
        {
            version: 'v1.5',
            date: 'January 5, 2025',
            changes: [
                '🇬🇧🇪🇸 NEW: Multi-language support (IT, EN, ES)',
                '🌓 NEW: Complete dark mode',
                '📝 NEW: Bulk edit workers',
                '✏️ NEW: Inline edit single worker',
                '🚫 NEW: Blacklist system with automatic check',
                '📝 NEW: Complete audit log with filters',
                '📈 NEW: Report Manager (weekly, monthly, custom)',
                '📄 NEW: CSV export',
                '🔗 NEW: Share link with auto-copy'
            ]
        },
        {
            version: 'v1.0',
            date: 'December 20, 2024',
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
    ],
    es: [
        {
            version: 'v4.2',
            date: '15 de Octubre 2025',
            changes: [
                '⏰ NEW: Sistema de Notificaciones Programadas - elige horarios y mensajes personalizados',
                '📱 NEW: Notificaciones Android completamente funcionales (PWA con Service Worker)',
                '💬 NEW: Mensajes personalizados con emoji en recordatorios (ej: "¡Mario eres increíble! ❤️")',
                '📅 NEW: Selección de días de la semana para cada notificación',
                '🔔 NEW: Habilitar/deshabilitar notificaciones individuales',
                '🧪 NEW: Prueba instantánea de notificaciones con botón dedicado',
                '💡 NEW: Mensajes de ejemplo listos para usar',
                '🎨 IMPROVED: Interfaz de notificaciones moderna e intuitiva',
                '📊 IMPROVED: Gestión de notificaciones con persistencia en Firestore',
                '🌐 IMPROVED: Sistema multiidioma extendido a notificaciones programadas'
            ]
        },
        {
            version: 'v4.1',
            date: '12 de Octubre 2025',
            changes: [
                '🎨 FIX: Canvas firma ahora visible en modo oscuro (fondo oscuro, trazo blanco)',
                '📝 FIX: Marcadores nombre/apellido corregidos (no más "undefined")',
                '📅 NEW: Campo "Fecha de Nacimiento" en campos opcionales trabajador',
                '🏷️ NEW: Etiqueta "(opcional)" en todos los campos opcionales',
                '🌐 NEW: Selector de idioma independiente para modo trabajador',
                '💾 IMPROVED: Sistema auto-guardado sesión trabajador optimizado',
                '🎨 IMPROVED: Input fecha con soporte colorScheme para modo oscuro'
            ]
        },
        {
            version: 'v4.0',
            date: '16 de Enero 2025',
            changes: [
                '📊 NEW: Exportar Excel (XLSX) con formato avanzado',
                '🔔 NEW: Notificaciones del navegador cuando el trabajador envía datos',
                '📆 NEW: Vista de Calendario interactiva con FullCalendar',
                '👤 NEW: Estadísticas detalladas por trabajador individual',
                '💾 NEW: Sistema completo de Backup/Restauración (JSON)',
                '🔍 NEW: Búsqueda global en todas las hojas',
                '📈 NEW: Comparación de períodos (este mes vs pasado)',
                '💡 NEW: Auto-completado inteligente para campos repetidos',
                '🚀 NEW: PWA mejorada con modo offline y prompt de instalación',
                '⚡ NEW: Auto-guardado avanzado para borradores de admin'
            ]
        },
        {
            version: 'v3.0',
            date: '15 de Enero 2025',
            changes: [
                '🐛 FIX: La caducidad del enlace ahora comienza desde la generación, no desde la creación de la hoja',
                '🐛 FIX: La firma se puede eliminar y rehacer sin problemas (responsable + trabajador)',
                '📋 NEW: Changelog integrado en Configuración para rastrear todas las versiones',
                '🔧 IMPROVED: Sistema de gestión de enlaces más robusto con timestamp dedicado'
            ]
        },
        {
            version: 'v2.5',
            date: '14 de Enero 2025',
            changes: [
                '⚙️ NEW: Configuración para caducidad de enlaces de trabajadores (8h, 24h, 48h, 72h, 144h, Nunca, Personalizado)',
                '💾 NEW: Guardado automático de sesión del trabajador (auto-guardado cada 2 segundos)',
                '↩️ NEW: Restauración de sesión anterior para trabajadores',
                '🌓 NEW: Modo oscuro local para modo trabajador',
                '📄 NEW: Los trabajadores pueden regenerar su propio PDF',
                '✏️ NEW: Editar datos después del envío (con re-firma)',
                '🇫🇷🇷🇴 NEW: Soporte de francés y rumano (5 idiomas en total)'
            ]
        },
        {
            version: 'v2.0',
            date: '10 de Enero 2025',
            changes: [
                '📊 NEW: Dashboard avanzado con gráficos animados',
                '📈 NEW: Estadísticas en tiempo real (horas hoy, semana, mes)',
                '🏆 NEW: Top 10 trabajadores y top 5 empresas',
                '📉 NEW: Gráficos: Barras animadas, Pastel de distribución, Desglose por hora',
                '📋 NEW: Tabla de actividad reciente',
                '🔔 NEW: Widgets de notificaciones y rendimiento',
                '🎨 NEW: Animaciones suaves y responsivas',
                '📱 IMPROVED: Optimización móvil para dashboard'
            ]
        },
        {
            version: 'v1.5',
            date: '5 de Enero 2025',
            changes: [
                '🇬🇧🇪🇸 NEW: Soporte multi-idioma (IT, EN, ES)',
                '🌓 NEW: Modo oscuro completo',
                '📝 NEW: Edición masiva de trabajadores',
                '✏️ NEW: Edición en línea de trabajador individual',
                '🚫 NEW: Sistema de lista negra con verificación automática',
                '📝 NEW: Registro de auditoría completo con filtros',
                '📈 NEW: Gestor de informes (semanales, mensuales, personalizados)',
                '📄 NEW: Exportar CSV',
                '🔗 NEW: Enlace de compartir con copia automática'
            ]
        },
        {
            version: 'v1.0',
            date: '20 de Diciembre 2024',
            changes: [
                '🎉 RELEASE: Primera versión pública',
                '📋 NEW: Gestión básica de hojas de horas',
                '👷 NEW: Modo trabajador con formulario de registro',
                '✍️ NEW: Firma digital táctil',
                '📄 NEW: Generación automática de PDF',
                '🔥 NEW: Integración Firebase (Firestore + Storage)',
                '🖼️ NEW: Carga de logo de empresa',
                '📦 NEW: Archivado de hojas',
                '🗑️ NEW: Eliminación de hojas',
                '📱 NEW: Diseño responsive mobile-first'
            ]
        }
    ],
    fr: [
        {
            version: 'v4.2',
            date: '15 Octobre 2025',
            changes: [
                '⏰ NEW: Système de Notifications Programmées - choisissez horaires et messages personnalisés',
                '📱 NEW: Notifications Android entièrement fonctionnelles (PWA avec Service Worker)',
                '💬 NEW: Messages personnalisés avec emoji dans les rappels (ex: "Mario tu es génial! ❤️")',
                '📅 NEW: Sélection des jours de la semaine pour chaque notification',
                '🔔 NEW: Activer/désactiver les notifications individuelles',
                '🧪 NEW: Test instantané des notifications avec bouton dédié',
                '💡 NEW: Messages d\'exemple prêts à l\'emploi',
                '🎨 IMPROVED: Interface de notifications moderne et intuitive',
                '📊 IMPROVED: Gestion des notifications avec persistance sur Firestore',
                '🌐 IMPROVED: Système multilingue étendu aux notifications programmées'
            ]
        },
        {
            version: 'v4.1',
            date: '12 Octobre 2025',
            changes: [
                '🎨 FIX: Canvas signature maintenant visible en mode sombre (fond sombre, trait blanc)',
                '📝 FIX: Espaces réservés prénom/nom corrigés (plus de "undefined")',
                '📅 NEW: Champ "Date de Naissance" dans champs facultatifs travailleur',
                '🏷️ NEW: Étiquette "(facultatif)" sur tous les champs facultatifs',
                '🌐 NEW: Sélecteur de langue indépendant pour mode travailleur',
                '💾 IMPROVED: Système auto-save session travailleur optimisé',
                '🎨 IMPROVED: Input date avec support colorScheme pour mode sombre'
            ]
        },
        {
            version: 'v4.0',
            date: '16 Janvier 2025',
            changes: [
                '📊 NEW: Export Excel (XLSX) avec formatage avancé',
                '🔔 NEW: Notifications navigateur quand travailleur soumet données',
                '📆 NEW: Vue Calendrier interactive avec FullCalendar',
                '👤 NEW: Statistiques détaillées par travailleur individuel',
                '💾 NEW: Système complet Sauvegarde/Restauration (JSON)',
                '🔍 NEW: Recherche globale dans toutes les feuilles',
                '📈 NEW: Comparaison de périodes (ce mois vs dernier)',
                '💡 NEW: Auto-complétion intelligente pour champs répétés',
                '🚀 NEW: PWA améliorée avec mode hors ligne et prompt d\'installation',
                '⚡ NEW: Auto-sauvegarde avancée pour brouillons admin'
            ]
        },
        {
            version: 'v3.0',
            date: '15 Janvier 2025',
            changes: [
                '🐛 FIX: L\'expiration du lien commence maintenant à partir de la génération, pas de la création de feuille',
                '🐛 FIX: La signature peut être supprimée et refaite sans problèmes (responsable + travailleur)',
                '📋 NEW: Changelog intégré dans Paramètres pour suivre toutes les versions',
                '🔧 IMPROVED: Système de gestion des liens plus robuste avec timestamp dédié'
            ]
        },
        {
            version: 'v2.5',
            date: '14 Janvier 2025',
            changes: [
                '⚙️ NEW: Paramètres pour expiration des liens travailleurs (8h, 24h, 48h, 72h, 144h, Jamais, Personnalisé)',
                '💾 NEW: Sauvegarde automatique de session travailleur (auto-save toutes les 2 secondes)',
                '↩️ NEW: Restauration de session précédente pour travailleurs',
                '🌓 NEW: Mode sombre local pour mode travailleur',
                '📄 NEW: Les travailleurs peuvent régénérer leur propre PDF',
                '✏️ NEW: Modifier données après envoi (avec re-signature)',
                '🇫🇷🇷🇴 NEW: Support Français et Roumain (5 langues au total)'
            ]
        },
        {
            version: 'v2.0',
            date: '10 Janvier 2025',
            changes: [
                '📊 NEW: Dashboard avancé avec graphiques animés',
                '📈 NEW: Statistiques en temps réel (heures aujourd\'hui, semaine, mois)',
                '🏆 NEW: Top 10 travailleurs et top 5 entreprises',
                '📉 NEW: Graphiques: Barres animées, Camembert distribution, Répartition horaire',
                '📋 NEW: Tableau d\'activité récente',
                '🔔 NEW: Widgets notifications et performance',
                '🎨 NEW: Animations fluides et responsives',
                '📱 IMPROVED: Optimisation mobile pour dashboard'
            ]
        },
        {
            version: 'v1.5',
            date: '5 Janvier 2025',
            changes: [
                '🇬🇧🇪🇸 NEW: Support multi-langue (IT, EN, ES)',
                '🌓 NEW: Mode sombre complet',
                '📝 NEW: Édition multiple des travailleurs',
                '✏️ NEW: Édition en ligne d\'un seul travailleur',
                '🚫 NEW: Système de liste noire avec vérification automatique',
                '📝 NEW: Journal d\'audit complet avec filtres',
                '📈 NEW: Gestionnaire de rapports (hebdomadaires, mensuels, personnalisés)',
                '📄 NEW: Export CSV',
                '🔗 NEW: Lien de partage avec copie automatique'
            ]
        },
        {
            version: 'v1.0',
            date: '20 Décembre 2024',
            changes: [
                '🎉 RELEASE: Première version publique',
                '📋 NEW: Gestion de base des feuilles de temps',
                '👷 NEW: Mode travailleur avec formulaire d\'inscription',
                '✍️ NEW: Signature numérique tactile',
                '📄 NEW: Génération automatique de PDF',
                '🔥 NEW: Intégration Firebase (Firestore + Storage)',
                '🖼️ NEW: Téléchargement de logo d\'entreprise',
                '📦 NEW: Archivage des feuilles',
                '🗑️ NEW: Suppression des feuilles',
                '📱 NEW: Design responsive mobile-first'
            ]
        }
    ],
    ro: [
        {
            version: 'v4.2',
            date: '15 Octombrie 2025',
            changes: [
                '⏰ NEW: Sistem Notificări Programate - alege ore și mesaje personalizate',
                '📱 NEW: Notificări Android complet funcționale (PWA cu Service Worker)',
                '💬 NEW: Mesaje personalizate cu emoji în memento-uri (ex: "Mario ești minunat! ❤️")',
                '📅 NEW: Selecție zile ale săptămânii pentru fiecare notificare',
                '🔔 NEW: Activare/dezactivare notificări individuale',
                '🧪 NEW: Test instant notificări cu buton dedicat',
                '💡 NEW: Mesaje exemplu gata de folosit',
                '🎨 IMPROVED: Interfață notificări modernă și intuitivă',
                '📊 IMPROVED: Gestionare notificări cu persistență pe Firestore',
                '🌐 IMPROVED: Sistem multilimbă extins la notificări programate'
            ]
        },
        {
            version: 'v4.1',
            date: '12 Octombrie 2025',
            changes: [
                '🎨 FIX: Canvas semnătură acum vizibil în mod întunecat (fundal întunecat, linie albă)',
                '📝 FIX: Marcatori prenume/nume corectați (nu mai apare "undefined")',
                '📅 NEW: Câmp "Data Nașterii" în câmpuri opționale muncitor',
                '🏷️ NEW: Etichetă "(opțional)" pe toate câmpurile opționale',
                '🌐 NEW: Selector limbă independent pentru mod muncitor',
                '💾 IMPROVED: Sistem auto-salvare sesiune muncitor optimizat',
                '🎨 IMPROVED: Input dată cu suport colorScheme pentru mod întunecat'
            ]
        },
        {
            version: 'v4.0',
            date: '16 Ianuarie 2025',
            changes: [
                '📊 NEW: Export Excel (XLSX) cu formatare avansată',
                '🔔 NEW: Notificări browser când muncitorul trimite date',
                '📆 NEW: Vizualizare Calendar interactivă cu FullCalendar',
                '👤 NEW: Statistici detaliate pentru fiecare muncitor',
                '💾 NEW: Sistem complet Backup/Restaurare (JSON)',
                '🔍 NEW: Căutare globală în toate fișele',
                '📈 NEW: Comparație perioade (luna aceasta vs trecută)',
                '💡 NEW: Auto-completare inteligentă pentru câmpuri repetate',
                '🚀 NEW: PWA îmbunătățită cu mod offline și prompt instalare',
                '⚡ NEW: Auto-salvare avansată pentru draft-uri admin'
            ]
        },
        {
            version: 'v3.0',
            date: '15 Ianuarie 2025',
            changes: [
                '🐛 FIX: Expirarea link-ului începe acum din momentul generării, nu din crearea fișei',
                '🐛 FIX: Semnătura poate fi ștearsă și refăcută fără probleme (responsabil + muncitor)',
                '📋 NEW: Changelog integrat în Setări pentru a urmări toate versiunile',
                '🔧 IMPROVED: Sistem de gestionare link-uri mai robust cu timestamp dedicat'
            ]
        },
        {
            version: 'v2.5',
            date: '14 Ianuarie 2025',
            changes: [
                '⚙️ NEW: Setări pentru expirare link-uri muncitori (8h, 24h, 48h, 72h, 144h, Niciodată, Personalizat)',
                '💾 NEW: Salvare automată sesiune muncitor (auto-save la fiecare 2 secunde)',
                '↩️ NEW: Restaurare sesiune anterioară pentru muncitori',
                '🌓 NEW: Mod întunecat local pentru modul muncitor',
                '📄 NEW: Muncitorii pot regenera propriul PDF',
                '✏️ NEW: Editare date după trimitere (cu re-semnare)',
                '🇫🇷🇷🇴 NEW: Suport Franceză și Română (5 limbi în total)'
            ]
        },
        {
            version: 'v2.0',
            date: '10 Ianuarie 2025',
            changes: [
                '📊 NEW: Dashboard avansat cu grafice animate',
                '📈 NEW: Statistici în timp real (ore astăzi, săptămână, lună)',
                '🏆 NEW: Top 10 muncitori și top 5 companii',
                '📉 NEW: Grafice: Bare animate, Plăcintă distribuție, Defalcare orară',
                '📋 NEW: Tabel activitate recentă',
                '🔔 NEW: Widget-uri notificări și performanță',
                '🎨 NEW: Animații fluide și responsive',
                '📱 IMPROVED: Optimizare mobilă pentru dashboard'
            ]
        },
        {
            version: 'v1.5',
            date: '5 Ianuarie 2025',
            changes: [
                '🇬🇧🇪🇸 NEW: Suport multi-limbă (IT, EN, ES)',
                '🌓 NEW: Mod întunecat complet',
                '📝 NEW: Editare multiplă muncitori',
                '✏️ NEW: Editare inline muncitor individual',
                '🚫 NEW: Sistem listă neagră cu verificare automată',
                '📝 NEW: Jurnal audit complet cu filtre',
                '📈 NEW: Manager rapoarte (săptămânale, lunare, personalizate)',
                '📄 NEW: Export CSV',
                '🔗 NEW: Link partajare cu copiere automată'
            ]
        },
        {
            version: 'v1.0',
            date: '20 Decembrie 2024',
            changes: [
                '🎉 RELEASE: Prima versiune publică',
                '📋 NEW: Gestionare de bază fișe ore',
                '👷 NEW: Mod muncitor cu formular înregistrare',
                '✍️ NEW: Semnătură digitală tactilă',
                '📄 NEW: Generare automată PDF',
                '🔥 NEW: Integrare Firebase (Firestore + Storage)',
                '🖼️ NEW: Încărcare logo companie',
                '📦 NEW: Arhivare fișe',
                '🗑️ NEW: Ștergere fișe',
                '📱 NEW: Design responsive mobile-first'
            ]
        }
    ]
};
