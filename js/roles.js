/**
 * 🎭 SISTEMA RUOLI SEMPLIFICATO
 * 4 ruoli per utenti permanenti + worker-link per form temporaneo
 */

// ===========================
// 📋 DEFINIZIONE RUOLI
// ===========================

const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    RESPONSABILE: 'responsabile',
    WORKER: 'worker'
    // worker-link NON è un ruolo permanente - è solo per accesso form via link
};

// ===========================
// 🔍 HELPER FUNCTIONS
// ===========================

/**
 * Verifica se un utente ha accesso a una funzionalità specifica
 * @param {Object} user - L'oggetto utente con campo role
 * @param {string} feature - La funzionalità da verificare
 * @returns {boolean} - True se l'utente ha accesso
 */
function hasRoleAccess(user, feature) {
    if (!user || !user.role) return false;
    
    const role = user.role;
    
    // Admin ha accesso a tutto
    if (role === ROLES.ADMIN) return true;
    
    // Controlla accesso per ogni ruolo
    switch (feature) {
        // ==================
        // 📊 DASHBOARD
        // ==================
        case 'dashboard.view':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        
        // ==================
        // 📅 CALENDAR
        // ==================
        case 'calendar.view':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'calendar.clickSheets':
            return ['admin', 'manager', 'responsabile'].includes(role);
        
        // ==================
        // 📞 WORKERS ON-CALL
        // ==================
        case 'onCall.view':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'onCall.viewProfiles':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'onCall.addToBlacklist':
            return ['admin', 'responsabile'].includes(role);
        
        // ==================
        // 👥 USER MANAGEMENT
        // ==================
        case 'users.view':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'users.viewProfiles':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'users.viewFullProfile':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'users.viewInfoAndStats':
            return role === 'worker'; // Worker vede solo info + statistics
        case 'users.modify':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'users.delete':
            return role === 'admin';
        
        // ==================
        // 🚫 BLACKLIST
        // ==================
        case 'blacklist.view':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'blacklist.giveSecondChance':
            return ['admin', 'responsabile'].includes(role);
        
        // ==================
        // 📈 REPORTS
        // ==================
        case 'reports.view':
            return ['admin', 'manager'].includes(role);
        
        // ==================
        // ⚙️ SETTINGS
        // ==================
        case 'settings.view':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'settings.general':
            // Worker può vedere in view-only, manager può modificare
            return ['admin', 'manager', 'worker'].includes(role);
        case 'settings.companies':
            // Worker può vedere in view-only, manager può modificare
            return ['admin', 'manager', 'worker'].includes(role);
        case 'settings.addresses':
            // Worker può vedere in view-only, responsabile e manager possono modificare
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'settings.addresses.modify':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'settings.activities':
            // Worker può vedere in view-only, altri possono modificare
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'settings.advanced':
            // Worker può vedere in view-only
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'settings.calendar':
            // Worker può vedere calendar settings in view-only
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'settings.log':
            // Worker può vedere log in view-only
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'settings.terms':
            // Worker può vedere termini in view-only
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'settings.gdpr':
            // Worker può vedere GDPR in view-only
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'settings.modify':
            // Solo questi possono modificare settings
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'settings.viewOnly':
            return role === 'worker';
        
        // ==================
        // 📄 SHEETS (Fogli di lavoro)
        // ==================
        case 'sheets.view':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'sheets.viewOwn':
            return role === 'worker'; // Worker vede solo dove è presente
        case 'sheets.downloadPdf':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'sheets.delete':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'sheets.archive':
            return ['admin', 'manager'].includes(role);
        case 'sheets.changeCompany':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'sheets.changeDate':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'sheets.changeSupervisor':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'sheets.changeAddress':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'sheets.changeEstimatedHours':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'sheets.changeActivity':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'sheets.signAsSupervisor':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'sheets.generatePdf':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'sheets.generateLink':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'sheets.save':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'sheets.addWorkers':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'sheets.addWeatherCity':
            return ['admin', 'manager', 'responsabile'].includes(role);
        case 'sheets.modifyOwnData':
            return role === 'worker'; // Worker modifica solo proprie ore/dati
        case 'sheets.changeWeather':
            return ['admin', 'manager', 'responsabile'].includes(role);
        
        // ==================
        // 👤 PROFILE
        // ==================
        case 'profile.viewOwn':
            return ['admin', 'manager', 'responsabile', 'worker'].includes(role);
        case 'profile.viewAdminSection':
            return role === 'admin';
        
        // Default: nessun accesso
        default:
            return false;
    }
}

/**
 * Ottieni il nome visualizzato del ruolo
 * @param {string} role - Il ruolo
 * @returns {string} - Nome visualizzato
 */
function getRoleDisplayName(role) {
    const names = {
        'admin': 'Amministratore',
        'manager': 'Manager',
        'responsabile': 'Responsabile',
        'worker': 'Lavoratore',
        'worker-link': 'Lavoratore (Solo Form)'
    };
    return names[role] || role;
}

/**
 * Verifica se un ruolo può vedere una sezione specifica dell'app
 * @param {string} role - Il ruolo dell'utente
 * @param {string} section - La sezione (dashboard, calendar, users, etc.)
 * @returns {boolean}
 */
function canViewSection(role, section) {
    if (role === ROLES.ADMIN) return true;
    
    const accessMatrix = {
        'dashboard': ['admin', 'manager', 'responsabile', 'worker'],
        'calendar': ['admin', 'manager', 'responsabile', 'worker'],
        'users': ['admin', 'manager', 'responsabile', 'worker'],
        'blacklist': ['admin', 'manager', 'responsabile', 'worker'],
        'reports': ['admin', 'manager'],
        'settings': ['admin', 'manager', 'responsabile', 'worker'],
        'profile': ['admin', 'manager', 'responsabile', 'worker'],
        'onCall': ['admin', 'manager', 'responsabile', 'worker']
    };
    
    return accessMatrix[section]?.includes(role) || false;
}

// Esponi globalmente
window.ROLES = ROLES;
window.hasRoleAccess = hasRoleAccess;
window.getRoleDisplayName = getRoleDisplayName;
window.canViewSection = canViewSection;
