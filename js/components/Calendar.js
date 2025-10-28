// Calendar Component - Vista Calendario con FullCalendar
const Calendar = ({ sheets, darkMode, language = 'it', onSelectSheet }) => {
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

            return {
                id: sheet.id,
                title: `${sheet.titoloAzienda || 'N/D'} (${workersCount} 👷)`,
                start: sheet.data,
                allDay: true,
                backgroundColor: sheet.status === 'completed' ? '#10b981' : 
                               sheet.archived ? '#6b7280' : '#4f46e5',
                borderColor: sheet.status === 'completed' ? '#059669' : 
                            sheet.archived ? '#4b5563' : '#4338ca',
                extendedProps: {
                    sheet: sheet,
                    hours: totalHours.toFixed(1),
                    workers: workersCount,
                    location: sheet.location
                }
            };
        });

        // Create calendar
        const cal = new FullCalendar.Calendar(calendarRef.current, {
            initialView: 'dayGridMonth',
            locale: language,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            events: events,
            eventClick: function(info) {
                if (onSelectSheet) {
                    onSelectSheet(info.event.extendedProps.sheet);
                }
            },
            eventContent: function(arg) {
                const hours = arg.event.extendedProps.hours;
                const workers = arg.event.extendedProps.workers;
                
                return {
                    html: `
                        <div class="fc-event-main-frame" style="padding: 2px 4px;">
                            <div class="fc-event-title-container">
                                <div class="fc-event-title" style="font-size: 11px; font-weight: 600;">
                                    ${arg.event.title}
                                </div>
                                <div style="font-size: 10px; opacity: 0.9;">
                                    ⏱️ ${hours}h
                                </div>
                            </div>
                        </div>
                    `
                };
            },
            height: 'auto',
            contentHeight: 600,
            aspectRatio: 1.8,
            displayEventTime: false,
            eventDisplay: 'block',
            dayMaxEvents: 3,
            moreLinkClick: 'popover',
            buttonText: {
                today: t.calendar_today || 'Oggi',
                month: t.calendar_month || 'Mese',
                week: t.calendar_week || 'Settimana',
                list: t.calendar_list || 'Lista'
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
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold">📆 {t.calendar}</h2>
                        <p className={`${textClass} text-sm sm:text-base mt-1`}>
                            {sheets.length} {sheets.length === 1 ? t.sheets.slice(0, -1).toLowerCase() : t.sheets.toLowerCase()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4`}>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-indigo-600"></div>
                        <span>{t.draft}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-600"></div>
                        <span>{t.completed}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-600"></div>
                        <span>{t.archived}</span>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 sm:p-6`}>
                <div 
                    ref={calendarRef}
                    className={darkMode ? 'fc-dark-theme' : ''}
                    style={{
                        '--fc-border-color': darkMode ? '#374151' : '#e5e7eb',
                        '--fc-button-bg-color': '#4f46e5',
                        '--fc-button-border-color': '#4338ca',
                        '--fc-button-hover-bg-color': '#4338ca',
                        '--fc-button-active-bg-color': '#3730a3',
                        '--fc-today-bg-color': darkMode ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.1)'
                    }}
                />
            </div>

            {/* Info */}
            <div className={`${cardClass} rounded-xl shadow-lg p-4 text-center`}>
                <p className={`${textClass} text-sm`}>
                        💡 {t.calendar_click_event || 'Clicca su un evento per aprire il foglio ore'}
                    </p>
            </div>
        </div>
    );
};
