// Calendar Component - Vista Calendario con FullCalendar
const Calendar = ({ sheets, darkMode, language = 'it', onSelectSheet, currentUser }) => {
    const calendarRef = React.useRef(null);
    const [calendar, setCalendar] = React.useState(null);
    
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

    // Initialize FullCalendar
    React.useEffect(() => {
        if (!calendarRef.current || typeof FullCalendar === 'undefined') return;

        // Prepare events from sheets
        const events = sheets.map(sheet => {
            const workersCount = sheet.lavoratori?.length || 0;
            const totalHours = sheet.lavoratori?.reduce((sum, w) => 
                sum + parseFloat(w.oreTotali || 0), 0
            ) || 0;

            // Determine color based on status (archived takes precedence)
            let backgroundColor, borderColor, textColor;
            
            if (sheet.archived) {
                // Archiviati - Grigio
                backgroundColor = '#6B7280'; // gray-500
                borderColor = '#4B5563'; // gray-600
                textColor = '#F3F4F6'; // gray-100
            } else if (sheet.status === 'completed') {
                // Completati - Verde
                backgroundColor = '#10B981'; // emerald-500
                borderColor = '#059669'; // emerald-600
                textColor = '#FFFFFF';
            } else {
                // Bozza/Attivi - Indaco
                backgroundColor = '#6366F1'; // indigo-500
                borderColor = '#4F46E5'; // indigo-600
                textColor = '#FFFFFF';
            }

            return {
                id: sheet.id,
                title: `${sheet.titoloAzienda || 'N/D'} (${workersCount} 👷)`,
                start: sheet.data,
                allDay: true,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                textColor: textColor,
                extendedProps: {
                    sheet: sheet,
                    hours: totalHours.toFixed(1),
                    workers: workersCount,
                    location: sheet.location,
                    status: sheet.archived ? 'archived' : sheet.status
                }
            };
        });

        // Create calendar
        const cal = new FullCalendar.Calendar(calendarRef.current, {
            initialView: window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth',
            locale: language,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: window.innerWidth < 768 ? 'dayGridMonth,listWeek' : 'dayGridMonth,timeGridWeek,listWeek'
            },
            events: events,
            eventClick: function(info) {
                // Worker NON può cliccare sui fogli nel calendario
                if (currentUser?.role === 'worker') {
                    return false;
                }
                if (onSelectSheet) {
                    onSelectSheet(info.event.extendedProps.sheet);
                }
            },
            eventContent: function(arg) {
                const hours = arg.event.extendedProps.hours;
                const workers = arg.event.extendedProps.workers;
                const status = arg.event.extendedProps.status;
                
                // Status icon
                let statusIcon = '';
                if (status === 'archived') statusIcon = '📦';
                else if (status === 'completed') statusIcon = '✅';
                else statusIcon = '✏️';
                
                return {
                    html: `
                        <div class="fc-event-main-frame" style="padding: 3px 5px; border-radius: 6px;">
                            <div class="fc-event-title-container">
                                <div class="fc-event-title" style="font-size: 12px; font-weight: 600; line-height: 1.3; margin-bottom: 2px;">
                                    ${statusIcon} ${arg.event.title}
                                </div>
                                <div style="font-size: 10px; opacity: 0.95; display: flex; align-items: center; gap: 4px;">
                                    <span>⏱️ ${hours}h</span>
                                </div>
                            </div>
                        </div>
                    `
                };
            },
            height: 'auto',
            contentHeight: window.innerWidth < 768 ? 500 : 650,
            aspectRatio: window.innerWidth < 768 ? 1 : 1.8,
            displayEventTime: false,
            eventDisplay: 'block',
            dayMaxEvents: window.innerWidth < 768 ? 2 : 4,
            moreLinkClick: 'popover',
            eventClassNames: 'cursor-pointer hover:opacity-90 transition-opacity',
            nowIndicator: true,
            buttonText: {
                today: t.calendar_today || 'Oggi',
                month: t.calendar_month || 'Mese',
                week: t.calendar_week || 'Settimana',
                list: t.calendar_list || 'Lista'
            },
            // Better mobile interaction
            eventMouseEnter: function(info) {
                info.el.style.transform = 'scale(1.02)';
                info.el.style.zIndex = '10';
            },
            eventMouseLeave: function(info) {
                info.el.style.transform = 'scale(1)';
                info.el.style.zIndex = '1';
            }
        });

        cal.render();
        setCalendar(cal);

        return () => {
            if (cal) cal.destroy();
        };
    }, [sheets, language, darkMode, onSelectSheet]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                            📆 {t.calendar}
                        </h2>
                        <p className={`${textClass} text-sm sm:text-base mt-1`}>
                            {sheets.length} {sheets.length === 1 ? t.sheets.slice(0, -1).toLowerCase() : t.sheets.toLowerCase()}
                        </p>
                    </div>
                    
                    {/* Legend inline on desktop */}
                    <div className="hidden sm:flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                            <span className="font-medium">✏️ {t.draft}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="font-medium">✅ {t.completed}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-500/20 border border-gray-500/30">
                            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                            <span className="font-medium">📦 {t.archived}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend for mobile */}
            <div className={`sm:hidden ${cardClass} rounded-xl shadow-lg p-4`}>
                <div className="flex flex-wrap gap-3 text-sm justify-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        <span className="font-medium">✏️ {t.draft}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="font-medium">✅ {t.completed}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-500/20 border border-gray-500/30">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        <span className="font-medium">📦 {t.archived}</span>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className={`${cardClass} rounded-xl shadow-lg p-3 sm:p-6 overflow-hidden`}>
                <div 
                    ref={calendarRef}
                    className={`${darkMode ? 'fc-dark-theme' : ''} calendar-modern`}
                    style={{
                        '--fc-border-color': darkMode ? '#374151' : '#e5e7eb',
                        '--fc-button-bg-color': '#6366F1',
                        '--fc-button-border-color': '#4F46E5',
                        '--fc-button-hover-bg-color': '#4F46E5',
                        '--fc-button-active-bg-color': '#4338CA',
                        '--fc-today-bg-color': darkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                        '--fc-event-border-radius': '8px'
                    }}
                />
            </div>

            {/* Info */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 text-center`}>
                <p className={`${textClass} text-sm flex items-center justify-center gap-2`}>
                    <span className="text-lg">💡</span>
                    <span>{t.calendar_click_event || 'Clicca su un evento per aprire il foglio ore'}</span>
                </p>
            </div>
        </div>
    );
};
