// Translations / Traduzioni
const translations = {
    it: {
        // Navigation
        dashboard: 'DASHBOARD',
        administrator: 'AMMINISTRATORE',
        blacklist: 'BLACKLIST',
        auditLog: 'REGISTRO MODIFICHE',
        reports: 'REPORT',
        
        // Dashboard Stats
        weeklyHours: 'Ore Settimanali',
        monthlyHours: 'Ore Mensili',
        activeSheets: 'Fogli Attivi',
        topWorkers: 'Top 3 Lavoratori del Mese',
        
        // Worker Mode
        workerMode: 'MODALITÀ LAVORATORE',
        registerHours: 'Registra le tue ore',
        name: 'Nome',
        surname: 'Cognome',
        startTime: 'Ora Inizio',
        endTime: 'Ora Fine',
        break: 'Pausa (min)',
        totalHours: 'Ore totali',
        signature: 'Firma richiesta',
        sendData: 'INVIA DATI AL RESPONSABILE',
        
        // Sheet Info
        company: 'Azienda Cliente',
        date: 'Data',
        responsible: 'Responsabile',
        location: 'Località',
        notes: 'Note',
        
        // Actions
        save: 'Salva',
        cancel: 'Annulla',
        edit: 'Modifica',
        delete: 'Elimina',
        archive: 'Archivia',
        restore: 'Ripristina',
        generateLink: 'Genera Link',
        completeSheet: 'COMPLETA E GENERA PDF',
        downloadPDF: 'SCARICA PDF',
        backToList: 'Torna alla Lista',
        
        // Workers
        workers: 'Lavoratori Registrati',
        noWorkers: 'Nessun lavoratore ancora registrato',
        
        // Optional Fields
        optionalFields: 'Campi Opzionali (accesso cantieri)',
        taxCode: 'Codice Fiscale',
        idNumber: 'Numero Carta Identità',
        phone: 'Telefono',
        email: 'Email',
        address: 'Indirizzo',
        
        // Blacklist
        blacklistWarning: '⚠️ ATTENZIONE: LAVORATORE IN BLACKLIST',
        reason: 'Motivo',
        addToBlacklist: 'Aggiungi a Blacklist',
        removeFromBlacklist: 'Rimuovi da Blacklist',
        secondChance: 'Seconda Possibilità',
        
        // Bulk Edit
        bulkEdit: 'Modifica Multipla',
        selectAll: 'Seleziona Tutti',
        deselectAll: 'Deseleziona Tutti',
        selected: 'selezionati',
        updateAll: 'Aggiorna Tutti',
        
        // Reports
        reportWeekly: 'Report Settimanale',
        reportMonthly: 'Report Mensile',
        manageReports: 'Gestione Report',
        generateReport: 'Genera Report',
        
        // Messages
        loading: 'Caricamento...',
        error: 'Errore',
        success: 'Successo',
        confirm: 'Conferma',
        
        // Logo
        logo: 'Logo Aziendale',
        uploadLogo: 'Carica Logo'
    },
    
    en: {
        // Navigation
        dashboard: 'DASHBOARD',
        administrator: 'ADMINISTRATOR',
        blacklist: 'BLACKLIST',
        auditLog: 'AUDIT LOG',
        reports: 'REPORTS',
        
        // Dashboard Stats
        weeklyHours: 'Weekly Hours',
        monthlyHours: 'Monthly Hours',
        activeSheets: 'Active Sheets',
        topWorkers: 'Top 3 Workers of the Month',
        
        // Worker Mode
        workerMode: 'WORKER MODE',
        registerHours: 'Register your hours',
        name: 'Name',
        surname: 'Surname',
        startTime: 'Start Time',
        endTime: 'End Time',
        break: 'Break (min)',
        totalHours: 'Total hours',
        signature: 'Required signature',
        sendData: 'SEND DATA TO SUPERVISOR',
        
        // Sheet Info
        company: 'Client Company',
        date: 'Date',
        responsible: 'Supervisor',
        location: 'Location',
        notes: 'Notes',
        
        // Actions
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        archive: 'Archive',
        restore: 'Restore',
        generateLink: 'Generate Link',
        completeSheet: 'COMPLETE AND GENERATE PDF',
        downloadPDF: 'DOWNLOAD PDF',
        backToList: 'Back to List',
        
        // Workers
        workers: 'Registered Workers',
        noWorkers: 'No workers registered yet',
        
        // Optional Fields
        optionalFields: 'Optional Fields (site access)',
        taxCode: 'Tax Code',
        idNumber: 'ID Number',
        phone: 'Phone',
        email: 'Email',
        address: 'Address',
        
        // Blacklist
        blacklistWarning: '⚠️ WARNING: WORKER IN BLACKLIST',
        reason: 'Reason',
        addToBlacklist: 'Add to Blacklist',
        removeFromBlacklist: 'Remove from Blacklist',
        secondChance: 'Second Chance',
        
        // Bulk Edit
        bulkEdit: 'Bulk Edit',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        selected: 'selected',
        updateAll: 'Update All',
        
        // Reports
        reportWeekly: 'Weekly Report',
        reportMonthly: 'Monthly Report',
        manageReports: 'Manage Reports',
        generateReport: 'Generate Report',
        
        // Messages
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
        
        // Logo
        logo: 'Company Logo',
        uploadLogo: 'Upload Logo'
    },
    
    es: {
        // Navigation
        dashboard: 'PANEL DE CONTROL',
        administrator: 'ADMINISTRADOR',
        blacklist: 'LISTA NEGRA',
        auditLog: 'REGISTRO DE CAMBIOS',
        reports: 'INFORMES',
        
        // Dashboard Stats
        weeklyHours: 'Horas Semanales',
        monthlyHours: 'Horas Mensuales',
        activeSheets: 'Hojas Activas',
        topWorkers: 'Top 3 Trabajadores del Mes',
        
        // Worker Mode
        workerMode: 'MODO TRABAJADOR',
        registerHours: 'Registra tus horas',
        name: 'Nombre',
        surname: 'Apellido',
        startTime: 'Hora Inicio',
        endTime: 'Hora Fin',
        break: 'Pausa (min)',
        totalHours: 'Horas totales',
        signature: 'Firma requerida',
        sendData: 'ENVIAR DATOS AL SUPERVISOR',
        
        // Sheet Info
        company: 'Empresa Cliente',
        date: 'Fecha',
        responsible: 'Responsable',
        location: 'Ubicación',
        notes: 'Notas',
        
        // Actions
        save: 'Guardar',
        cancel: 'Cancelar',
        edit: 'Editar',
        delete: 'Eliminar',
        archive: 'Archivar',
        restore: 'Restaurar',
        generateLink: 'Generar Enlace',
        completeSheet: 'COMPLETAR Y GENERAR PDF',
        downloadPDF: 'DESCARGAR PDF',
        backToList: 'Volver a la Lista',
        
        // Workers
        workers: 'Trabajadores Registrados',
        noWorkers: 'No hay trabajadores registrados aún',
        
        // Optional Fields
        optionalFields: 'Campos Opcionales (acceso obras)',
        taxCode: 'Código Fiscal',
        idNumber: 'Número de Identidad',
        phone: 'Teléfono',
        email: 'Email',
        address: 'Dirección',
        
        // Blacklist
        blacklistWarning: '⚠️ ATENCIÓN: TRABAJADOR EN LISTA NEGRA',
        reason: 'Motivo',
        addToBlacklist: 'Añadir a Lista Negra',
        removeFromBlacklist: 'Quitar de Lista Negra',
        secondChance: 'Segunda Oportunidad',
        
        // Bulk Edit
        bulkEdit: 'Edición Múltiple',
        selectAll: 'Seleccionar Todos',
        deselectAll: 'Deseleccionar Todos',
        selected: 'seleccionados',
        updateAll: 'Actualizar Todos',
        
        // Reports
        reportWeekly: 'Informe Semanal',
        reportMonthly: 'Informe Mensual',
        manageReports: 'Gestionar Informes',
        generateReport: 'Generar Informe',
        
        // Messages
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        confirm: 'Confirmar',
        
        // Logo
        logo: 'Logo de la Empresa',
        uploadLogo: 'Subir Logo'
    }
};
