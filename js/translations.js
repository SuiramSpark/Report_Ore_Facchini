// Translations - 5 LINGUE COMPLETE
const translations = {
    it: {
        // Navigation
        dashboard: 'DASHBOARD',
        administrator: 'AMMINISTRATORE',
        blacklist: 'BLACKLIST',
        auditLog: 'REGISTRO MODIFICHE',
        reports: 'REPORT',
        sheets: 'Fogli Ore',
        
        // Dashboard Stats
        weeklyHours: 'Ore Settimanali',
        monthlyHours: 'Ore Mensili',
        activeSheets: 'Fogli Attivi',
        topWorkers: 'Top 3 Lavoratori del Mese',
        noWorkersThisMonth: 'Nessun lavoratore registrato questo mese',
        recentActivity: 'Attività Recente',
        lastDays: 'Ultimi 7 giorni',
        lastDaysMonth: 'Ultimi 30 giorni',
        nonArchivedSheets: 'Fogli non archiviati',
        
        // Worker Mode
        workerMode: 'MODALITÀ LAVORATORE',
        registerHours: 'Registra le tue ore',
        name: 'Nome',
        surname: 'Cognome',
        startTime: 'Ora Inizio',
        endTime: 'Ora Fine',
        break: 'Pausa (min)',
        totalHours: 'Ore totali',
        signature: 'Firma',
        sendData: 'INVIA DATI',
        submissionSummary: 'Riepilogo Inserimento',
        hello: 'Ciao',
        hours: 'Ore',
        total: 'Totale',
        status: 'Stato',
        completed: 'Completato',
        waitingSignature: 'In attesa firma responsabile',
        dataNotFound: 'Dati non trovati',
        drawSignature: 'Disegna con il mouse o con il dito',
        clear: 'Cancella',
        verify: 'Verifica',
        
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
        completeSheet: 'Completa e Genera PDF',
        completePDF: 'COMPLETA E GENERA PDF',
        downloadPDF: 'Scarica PDF',
        backToList: 'Torna alla Lista',
        back: 'Indietro',
        createNewSheet: 'Crea Nuovo Foglio Ore',
        sheetManagement: 'Gestione Foglio Ore',
        saveSheet: 'Salva Foglio',
        
        // Workers
        workers: 'Lavoratori Registrati',
        noWorkers: 'Nessun lavoratore ancora registrato',
        workerNumber: 'Lavoratore',
        pause: 'Pausa',
        
        // Optional Fields
        optionalFields: 'Campi Opzionali',
        taxCode: 'Codice Fiscale',
        idNumber: 'Numero Carta Identità',
        phone: 'Telefono',
        email: 'Email',
        address: 'Indirizzo',
        
        // Blacklist
        blacklistWarning: 'LAVORATORE IN BLACKLIST',
        reason: 'Motivo',
        addToBlacklist: 'Aggiungi a Blacklist',
        removeFromBlacklist: 'Rimuovi da Blacklist',
        secondChance: 'Seconda Possibilità',
        addedBy: 'Aggiunto da',
        noBlacklist: 'Nessun lavoratore in blacklist',
        
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
        
        // Filters
        all: 'Tutti',
        active: 'Attivi',
        archived: 'Archiviati',
        draft: 'Bozze',
        
        // Sheet List
        noSheets: 'Nessun foglio trovato',
        sheetNotFound: 'Foglio non trovato',
        
        // Signature
        responsibleSignature: 'Firma Responsabile',
        saveSignature: 'Salva Firma',
        deleteSignature: 'Cancella Firma',
        signatureRequired: 'Firma richiesta',
        signatureMissing: 'Firma del responsabile mancante',
        
        // Audit Log
        modifications: 'modifica',
        modificationsPlural: 'modifiche',
        additions: 'Aggiunte',
        edits: 'Modifiche',
        deletions: 'Eliminazioni',
        noModifications: 'Nessuna modifica registrata',
        noModificationsFilter: 'Nessuna modifica trovata per questo filtro',
        clearRegistry: 'Svuota Registro',
        clearing: 'Cancellazione...',
        confirmClear: 'Sei sicuro di voler cancellare TUTTO il registro modifiche? Questa azione è irreversibile!',
        
        // Messages
        loading: 'Caricamento...',
        sending: 'INVIO...',
        error: 'Errore',
        success: 'Successo',
        confirm: 'Conferma',
        warning: 'Attenzione',
        
        // Toasts
        sheetSaved: 'Foglio salvato!',
        sheetCompleted: 'Foglio completato e PDF generato!',
        sheetDeleted: 'Foglio eliminato',
        sheetArchived: 'Foglio archiviato',
        sheetRestored: 'Foglio ripristinato',
        workerDeleted: 'Lavoratore eliminato',
        workerUpdated: 'Lavoratore aggiornato',
        linkCopied: 'Link copiato negli appunti!',
        logoUploaded: 'Logo caricato!',
        dataSent: 'Dati inviati con successo!',
        signatureSaved: 'Firma salvata!',
        signatureCleared: 'Firma cancellata',
        signaturePresent: 'Firma presente!',
        canvasEmpty: 'Canvas vuoto!',
        blacklistAdded: 'Aggiunto alla blacklist',
        blacklistRemoved: 'Rimosso dalla blacklist',
        registryCleared: 'Registro modifiche svuotato!',
        
        // Errors
        fillRequired: 'Compila tutti i campi obbligatori',
        signBeforeSend: 'Devi firmare prima di inviare',
        dbNotConnected: 'Database non connesso',
        errorSaving: 'Errore salvataggio',
        errorDeleting: 'Errore eliminazione',
        errorLoading: 'Errore caricamento dati',
        errorSending: 'Errore invio dati',
        errorClearing: 'Errore durante la cancellazione',
        
        // Logo
        logo: 'Logo Aziendale',
        uploadLogo: 'Carica Logo',
        
        // Time
        min: 'min',
        hours_short: 'h'
    },
    
    en: {
        // Navigation
        dashboard: 'DASHBOARD',
        administrator: 'ADMINISTRATOR',
        blacklist: 'BLACKLIST',
        auditLog: 'CHANGE LOG',
        reports: 'REPORTS',
        sheets: 'Timesheets',
        
        // Dashboard Stats
        weeklyHours: 'Weekly Hours',
        monthlyHours: 'Monthly Hours',
        activeSheets: 'Active Sheets',
        topWorkers: 'Top 3 Workers of the Month',
        noWorkersThisMonth: 'No workers registered this month',
        recentActivity: 'Recent Activity',
        lastDays: 'Last 7 days',
        lastDaysMonth: 'Last 30 days',
        nonArchivedSheets: 'Non-archived sheets',
        
        // Worker Mode
        workerMode: 'WORKER MODE',
        registerHours: 'Register your hours',
        name: 'Name',
        surname: 'Surname',
        startTime: 'Start Time',
        endTime: 'End Time',
        break: 'Break (min)',
        totalHours: 'Total hours',
        signature: 'Signature',
        sendData: 'SEND DATA',
        submissionSummary: 'Submission Summary',
        hello: 'Hello',
        hours: 'Hours',
        total: 'Total',
        status: 'Status',
        completed: 'Completed',
        waitingSignature: 'Waiting for supervisor signature',
        dataNotFound: 'Data not found',
        drawSignature: 'Draw with mouse or finger',
        clear: 'Clear',
        verify: 'Verify',
        
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
        completeSheet: 'Complete and Generate PDF',
        completePDF: 'COMPLETE AND GENERATE PDF',
        downloadPDF: 'Download PDF',
        backToList: 'Back to List',
        back: 'Back',
        createNewSheet: 'Create New Timesheet',
        sheetManagement: 'Timesheet Management',
        saveSheet: 'Save Sheet',
        
        // Workers
        workers: 'Registered Workers',
        noWorkers: 'No workers registered yet',
        workerNumber: 'Worker',
        pause: 'Break',
        
        // Optional Fields
        optionalFields: 'Optional Fields',
        taxCode: 'Tax Code',
        idNumber: 'ID Number',
        phone: 'Phone',
        email: 'Email',
        address: 'Address',
        
        // Blacklist
        blacklistWarning: 'WORKER IN BLACKLIST',
        reason: 'Reason',
        addToBlacklist: 'Add to Blacklist',
        removeFromBlacklist: 'Remove from Blacklist',
        secondChance: 'Second Chance',
        addedBy: 'Added by',
        noBlacklist: 'No workers in blacklist',
        
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
        
        // Filters
        all: 'All',
        active: 'Active',
        archived: 'Archived',
        draft: 'Drafts',
        
        // Sheet List
        noSheets: 'No sheets found',
        sheetNotFound: 'Sheet not found',
        
        // Signature
        responsibleSignature: 'Supervisor Signature',
        saveSignature: 'Save Signature',
        deleteSignature: 'Delete Signature',
        signatureRequired: 'Signature required',
        signatureMissing: 'Supervisor signature missing',
        
        // Audit Log
        modifications: 'modification',
        modificationsPlural: 'modifications',
        additions: 'Additions',
        edits: 'Edits',
        deletions: 'Deletions',
        noModifications: 'No modifications recorded',
        noModificationsFilter: 'No modifications found for this filter',
        clearRegistry: 'Clear Registry',
        clearing: 'Clearing...',
        confirmClear: 'Are you sure you want to delete ALL the change log? This action is irreversible!',
        
        // Messages
        loading: 'Loading...',
        sending: 'SENDING...',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
        warning: 'Warning',
        
        // Toasts
        sheetSaved: 'Sheet saved!',
        sheetCompleted: 'Sheet completed and PDF generated!',
        sheetDeleted: 'Sheet deleted',
        sheetArchived: 'Sheet archived',
        sheetRestored: 'Sheet restored',
        workerDeleted: 'Worker deleted',
        workerUpdated: 'Worker updated',
        linkCopied: 'Link copied to clipboard!',
        logoUploaded: 'Logo uploaded!',
        dataSent: 'Data sent successfully!',
        signatureSaved: 'Signature saved!',
        signatureCleared: 'Signature cleared',
        signaturePresent: 'Signature present!',
        canvasEmpty: 'Canvas empty!',
        blacklistAdded: 'Added to blacklist',
        blacklistRemoved: 'Removed from blacklist',
        registryCleared: 'Change log cleared!',
        
        // Errors
        fillRequired: 'Fill in all required fields',
        signBeforeSend: 'You must sign before sending',
        dbNotConnected: 'Database not connected',
        errorSaving: 'Error saving',
        errorDeleting: 'Error deleting',
        errorLoading: 'Error loading data',
        errorSending: 'Error sending data',
        errorClearing: 'Error clearing',
        
        // Logo
        logo: 'Company Logo',
        uploadLogo: 'Upload Logo',
        
        // Time
        min: 'min',
        hours_short: 'h'
    },
    
    es: {
        // Navigation
        dashboard: 'PANEL',
        administrator: 'ADMINISTRADOR',
        blacklist: 'LISTA NEGRA',
        auditLog: 'REGISTRO CAMBIOS',
        reports: 'INFORMES',
        sheets: 'Hojas de Horas',
        
        // Dashboard Stats
        weeklyHours: 'Horas Semanales',
        monthlyHours: 'Horas Mensuales',
        activeSheets: 'Hojas Activas',
        topWorkers: 'Top 3 Trabajadores del Mes',
        noWorkersThisMonth: 'No hay trabajadores registrados este mes',
        recentActivity: 'Actividad Reciente',
        lastDays: 'Últimos 7 días',
        lastDaysMonth: 'Últimos 30 días',
        nonArchivedSheets: 'Hojas no archivadas',
        
        // Worker Mode
        workerMode: 'MODO TRABAJADOR',
        registerHours: 'Registra tus horas',
        name: 'Nombre',
        surname: 'Apellido',
        startTime: 'Hora Inicio',
        endTime: 'Hora Fin',
        break: 'Pausa (min)',
        totalHours: 'Horas totales',
        signature: 'Firma',
        sendData: 'ENVIAR DATOS',
        submissionSummary: 'Resumen Envío',
        hello: 'Hola',
        hours: 'Horas',
        total: 'Total',
        status: 'Estado',
        completed: 'Completado',
        waitingSignature: 'Esperando firma del supervisor',
        dataNotFound: 'Datos no encontrados',
        drawSignature: 'Dibuja con el ratón o el dedo',
        clear: 'Borrar',
        verify: 'Verificar',
        
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
        completeSheet: 'Completar y Generar PDF',
        completePDF: 'COMPLETAR Y GENERAR PDF',
        downloadPDF: 'Descargar PDF',
        backToList: 'Volver a la Lista',
        back: 'Atrás',
        createNewSheet: 'Crear Nueva Hoja de Horas',
        sheetManagement: 'Gestión de Hoja',
        saveSheet: 'Guardar Hoja',
        
        // Workers
        workers: 'Trabajadores Registrados',
        noWorkers: 'No hay trabajadores registrados aún',
        workerNumber: 'Trabajador',
        pause: 'Pausa',
        
        // Optional Fields
        optionalFields: 'Campos Opcionales',
        taxCode: 'Código Fiscal',
        idNumber: 'Número de Identidad',
        phone: 'Teléfono',
        email: 'Email',
        address: 'Dirección',
        
        // Blacklist
        blacklistWarning: 'TRABAJADOR EN LISTA NEGRA',
        reason: 'Motivo',
        addToBlacklist: 'Añadir a Lista Negra',
        removeFromBlacklist: 'Quitar de Lista Negra',
        secondChance: 'Segunda Oportunidad',
        addedBy: 'Añadido por',
        noBlacklist: 'No hay trabajadores en lista negra',
        
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
        
        // Filters
        all: 'Todos',
        active: 'Activos',
        archived: 'Archivados',
        draft: 'Borradores',
        
        // Sheet List
        noSheets: 'No se encontraron hojas',
        sheetNotFound: 'Hoja no encontrada',
        
        // Signature
        responsibleSignature: 'Firma Responsable',
        saveSignature: 'Guardar Firma',
        deleteSignature: 'Borrar Firma',
        signatureRequired: 'Firma requerida',
        signatureMissing: 'Falta firma del responsable',
        
        // Audit Log
        modifications: 'modificación',
        modificationsPlural: 'modificaciones',
        additions: 'Adiciones',
        edits: 'Ediciones',
        deletions: 'Eliminaciones',
        noModifications: 'No hay modificaciones registradas',
        noModificationsFilter: 'No se encontraron modificaciones para este filtro',
        clearRegistry: 'Vaciar Registro',
        clearing: 'Borrando...',
        confirmClear: '¿Estás seguro de que quieres borrar TODO el registro de cambios? ¡Esta acción es irreversible!',
        
        // Messages
        loading: 'Cargando...',
        sending: 'ENVIANDO...',
        error: 'Error',
        success: 'Éxito',
        confirm: 'Confirmar',
        warning: 'Advertencia',
        
        // Toasts
        sheetSaved: '¡Hoja guardada!',
        sheetCompleted: '¡Hoja completada y PDF generado!',
        sheetDeleted: 'Hoja eliminada',
        sheetArchived: 'Hoja archivada',
        sheetRestored: 'Hoja restaurada',
        workerDeleted: 'Trabajador eliminado',
        workerUpdated: 'Trabajador actualizado',
        linkCopied: '¡Enlace copiado al portapapeles!',
        logoUploaded: '¡Logo cargado!',
        dataSent: '¡Datos enviados con éxito!',
        signatureSaved: '¡Firma guardada!',
        signatureCleared: 'Firma borrada',
        signaturePresent: '¡Firma presente!',
        canvasEmpty: '¡Canvas vacío!',
        blacklistAdded: 'Añadido a lista negra',
        blacklistRemoved: 'Quitado de lista negra',
        registryCleared: '¡Registro de cambios vaciado!',
        
        // Errors
        fillRequired: 'Completa todos los campos obligatorios',
        signBeforeSend: 'Debes firmar antes de enviar',
        dbNotConnected: 'Base de datos no conectada',
        errorSaving: 'Error al guardar',
        errorDeleting: 'Error al eliminar',
        errorLoading: 'Error al cargar datos',
        errorSending: 'Error al enviar datos',
        errorClearing: 'Error al borrar',
        
        // Logo
        logo: 'Logo de la Empresa',
        uploadLogo: 'Subir Logo',
        
        // Time
        min: 'min',
        hours_short: 'h'
    },
    
    fr: {
        // Navigation
        dashboard: 'TABLEAU DE BORD',
        administrator: 'ADMINISTRATEUR',
        blacklist: 'LISTE NOIRE',
        auditLog: 'JOURNAL MODIFICATIONS',
        reports: 'RAPPORTS',
        sheets: 'Feuilles de Temps',
        
        // Dashboard Stats
        weeklyHours: 'Heures Hebdomadaires',
        monthlyHours: 'Heures Mensuelles',
        activeSheets: 'Feuilles Actives',
        topWorkers: 'Top 3 Travailleurs du Mois',
        noWorkersThisMonth: 'Aucun travailleur enregistré ce mois-ci',
        recentActivity: 'Activité Récente',
        lastDays: 'Derniers 7 jours',
        lastDaysMonth: 'Derniers 30 jours',
        nonArchivedSheets: 'Feuilles non archivées',
        
        // Worker Mode
        workerMode: 'MODE TRAVAILLEUR',
        registerHours: 'Enregistrez vos heures',
        name: 'Nom',
        surname: 'Prénom',
        startTime: 'Heure Début',
        endTime: 'Heure Fin',
        break: 'Pause (min)',
        totalHours: 'Heures totales',
        signature: 'Signature',
        sendData: 'ENVOYER DONNÉES',
        submissionSummary: 'Résumé Soumission',
        hello: 'Bonjour',
        hours: 'Heures',
        total: 'Total',
        status: 'Statut',
        completed: 'Terminé',
        waitingSignature: 'En attente signature superviseur',
        dataNotFound: 'Données non trouvées',
        drawSignature: 'Dessinez avec la souris ou le doigt',
        clear: 'Effacer',
        verify: 'Vérifier',
        
        // Sheet Info
        company: 'Entreprise Cliente',
        date: 'Date',
        responsible: 'Responsable',
        location: 'Lieu',
        notes: 'Notes',
        
        // Actions
        save: 'Sauvegarder',
        cancel: 'Annuler',
        edit: 'Modifier',
        delete: 'Supprimer',
        archive: 'Archiver',
        restore: 'Restaurer',
        generateLink: 'Générer Lien',
        completeSheet: 'Compléter et Générer PDF',
        completePDF: 'COMPLÉTER ET GÉNÉRER PDF',
        downloadPDF: 'Télécharger PDF',
        backToList: 'Retour à la Liste',
        back: 'Retour',
        createNewSheet: 'Créer Nouvelle Feuille',
        sheetManagement: 'Gestion Feuille',
        saveSheet: 'Sauvegarder Feuille',
        
        // Workers
        workers: 'Travailleurs Enregistrés',
        noWorkers: 'Aucun travailleur enregistré',
        workerNumber: 'Travailleur',
        pause: 'Pause',
        
        // Optional Fields
        optionalFields: 'Champs Optionnels',
        taxCode: 'Code Fiscal',
        idNumber: 'Numéro Identité',
        phone: 'Téléphone',
        email: 'Email',
        address: 'Adresse',
        
        // Blacklist
        blacklistWarning: 'TRAVAILLEUR EN LISTE NOIRE',
        reason: 'Raison',
        addToBlacklist: 'Ajouter à Liste Noire',
        removeFromBlacklist: 'Retirer de Liste Noire',
        secondChance: 'Deuxième Chance',
        addedBy: 'Ajouté par',
        noBlacklist: 'Aucun travailleur en liste noire',
        
        // Bulk Edit
        bulkEdit: 'Édition Multiple',
        selectAll: 'Tout Sélectionner',
        deselectAll: 'Tout Désélectionner',
        selected: 'sélectionnés',
        updateAll: 'Tout Mettre à Jour',
        
        // Reports
        reportWeekly: 'Rapport Hebdomadaire',
        reportMonthly: 'Rapport Mensuel',
        manageReports: 'Gérer Rapports',
        generateReport: 'Générer Rapport',
        
        // Filters
        all: 'Tous',
        active: 'Actifs',
        archived: 'Archivés',
        draft: 'Brouillons',
        
        // Sheet List
        noSheets: 'Aucune feuille trouvée',
        sheetNotFound: 'Feuille non trouvée',
        
        // Signature
        responsibleSignature: 'Signature Responsable',
        saveSignature: 'Sauvegarder Signature',
        deleteSignature: 'Supprimer Signature',
        signatureRequired: 'Signature requise',
        signatureMissing: 'Signature responsable manquante',
        
        // Audit Log
        modifications: 'modification',
        modificationsPlural: 'modifications',
        additions: 'Ajouts',
        edits: 'Modifications',
        deletions: 'Suppressions',
        noModifications: 'Aucune modification enregistrée',
        noModificationsFilter: 'Aucune modification trouvée pour ce filtre',
        clearRegistry: 'Vider Journal',
        clearing: 'Suppression...',
        confirmClear: 'Êtes-vous sûr de vouloir supprimer TOUT le journal des modifications? Cette action est irréversible!',
        
        // Messages
        loading: 'Chargement...',
        sending: 'ENVOI...',
        error: 'Erreur',
        success: 'Succès',
        confirm: 'Confirmer',
        warning: 'Attention',
        
        // Toasts
        sheetSaved: 'Feuille sauvegardée!',
        sheetCompleted: 'Feuille complétée et PDF généré!',
        sheetDeleted: 'Feuille supprimée',
        sheetArchived: 'Feuille archivée',
        sheetRestored: 'Feuille restaurée',
        workerDeleted: 'Travailleur supprimé',
        workerUpdated: 'Travailleur mis à jour',
        linkCopied: 'Lien copié dans le presse-papiers!',
        logoUploaded: 'Logo téléchargé!',
        dataSent: 'Données envoyées avec succès!',
        signatureSaved: 'Signature sauvegardée!',
        signatureCleared: 'Signature effacée',
        signaturePresent: 'Signature présente!',
        canvasEmpty: 'Canvas vide!',
        blacklistAdded: 'Ajouté à liste noire',
        blacklistRemoved: 'Retiré de liste noire',
        registryCleared: 'Journal modifications vidé!',
        
        // Errors
        fillRequired: 'Remplissez tous les champs obligatoires',
        signBeforeSend: 'Vous devez signer avant d\'envoyer',
        dbNotConnected: 'Base de données non connectée',
        errorSaving: 'Erreur de sauvegarde',
        errorDeleting: 'Erreur de suppression',
        errorLoading: 'Erreur de chargement',
        errorSending: 'Erreur d\'envoi',
        errorClearing: 'Erreur de suppression',
        
        // Logo
        logo: 'Logo Entreprise',
        uploadLogo: 'Télécharger Logo',
        
        // Time
        min: 'min',
        hours_short: 'h'
    },
    
    ro: {
        // Navigation
        dashboard: 'TABLOU DE BORD',
        administrator: 'ADMINISTRATOR',
        blacklist: 'LISTĂ NEAGRĂ',
        auditLog: 'JURNAL MODIFICĂRI',
        reports: 'RAPOARTE',
        sheets: 'Fișe de Pontaj',
        
        // Dashboard Stats
        weeklyHours: 'Ore Săptămânale',
        monthlyHours: 'Ore Lunare',
        activeSheets: 'Fișe Active',
        topWorkers: 'Top 3 Muncitori ai Lunii',
        noWorkersThisMonth: 'Niciun muncitor înregistrat luna aceasta',
        recentActivity: 'Activitate Recentă',
        lastDays: 'Ultimele 7 zile',
        lastDaysMonth: 'Ultimele 30 zile',
        nonArchivedSheets: 'Fișe ne-arhivate',
        
        // Worker Mode
        workerMode: 'MOD MUNCITOR',
        registerHours: 'Înregistrează orele',
        name: 'Nume',
        surname: 'Prenume',
        startTime: 'Oră Început',
        endTime: 'Oră Sfârșit',
        break: 'Pauză (min)',
        totalHours: 'Ore totale',
        signature: 'Semnătură',
        sendData: 'TRIMITE DATE',
        submissionSummary: 'Rezumat Înregistrare',
        hello: 'Bună',
        hours: 'Ore',
        total: 'Total',
        status: 'Status',
        completed: 'Finalizat',
        waitingSignature: 'Așteptare semnătură responsabil',
        dataNotFound: 'Date negăsite',
        drawSignature: 'Desenează cu mouse-ul sau degetul',
        clear: 'Șterge',
        verify: 'Verifică',
        
        // Sheet Info
        company: 'Companie Client',
        date: 'Dată',
        responsible: 'Responsabil',
        location: 'Locație',
        notes: 'Note',
        
        // Actions
        save: 'Salvează',
        cancel: 'Anulează',
        edit: 'Editează',
        delete: 'Șterge',
        archive: 'Arhivează',
        restore: 'Restaurează',
        generateLink: 'Generează Link',
        completeSheet: 'Finalizează și Generează PDF',
        completePDF: 'FINALIZEAZĂ ȘI GENEREAZĂ PDF',
        downloadPDF: 'Descarcă PDF',
        backToList: 'Înapoi la Listă',
        back: 'Înapoi',
        createNewSheet: 'Creează Fișă Nouă',
        sheetManagement: 'Gestionare Fișă',
        saveSheet: 'Salvează Fișa',
        
        // Workers
        workers: 'Muncitori Înregistrați',
        noWorkers: 'Niciun muncitor încă înregistrat',
        workerNumber: 'Muncitor',
        pause: 'Pauză',
        
        // Optional Fields
        optionalFields: 'Câmpuri Opționale',
        taxCode: 'Cod Fiscal',
        idNumber: 'Număr Buletin',
        phone: 'Telefon',
        email: 'Email',
        address: 'Adresă',
        
        // Blacklist
        blacklistWarning: 'MUNCITOR ÎN LISTĂ NEAGRĂ',
        reason: 'Motiv',
        addToBlacklist: 'Adaugă în Listă Neagră',
        removeFromBlacklist: 'Elimină din Listă Neagră',
        secondChance: 'A Doua Șansă',
        addedBy: 'Adăugat de',
        noBlacklist: 'Niciun muncitor în listă neagră',
        
        // Bulk Edit
        bulkEdit: 'Editare Multiplă',
        selectAll: 'Selectează Tot',
        deselectAll: 'Deselectează Tot',
        selected: 'selectați',
        updateAll: 'Actualizează Tot',
        
        // Reports
        reportWeekly: 'Raport Săptămânal',
        reportMonthly: 'Raport Lunar',
        manageReports: 'Gestionare Rapoarte',
        generateReport: 'Generează Raport',
        
        // Filters
        all: 'Toate',
        active: 'Active',
        archived: 'Arhivate',
        draft: 'Schițe',
        
        // Sheet List
        noSheets: 'Nicio fișă găsită',
        sheetNotFound: 'Fișă negăsită',
        
        // Signature
        responsibleSignature: 'Semnătură Responsabil',
        saveSignature: 'Salvează Semnătură',
        deleteSignature: 'Șterge Semnătură',
        signatureRequired: 'Semnătură necesară',
        signatureMissing: 'Lipsește semnătura responsabilului',
        
        // Audit Log
        modifications: 'modificare',
        modificationsPlural: 'modificări',
        additions: 'Adăugări',
        edits: 'Modificări',
        deletions: 'Ștergeri',
        noModifications: 'Nicio modificare înregistrată',
        noModificationsFilter: 'Nicio modificare găsită pentru acest filtru',
        clearRegistry: 'Golește Jurnalul',
        clearing: 'Ștergere...',
        confirmClear: 'Ești sigur că vrei să ștergi TOT jurnalul modificărilor? Această acțiune este ireversibilă!',
        
        // Messages
        loading: 'Se încarcă...',
        sending: 'SE TRIMITE...',
        error: 'Eroare',
        success: 'Succes',
        confirm: 'Confirmă',
        warning: 'Atenție',
        
        // Toasts
        sheetSaved: 'Fișă salvată!',
        sheetCompleted: 'Fișă finalizată și PDF generat!',
        sheetDeleted: 'Fișă ștearsă',
        sheetArchived: 'Fișă arhivată',
        sheetRestored: 'Fișă restaurată',
        workerDeleted: 'Muncitor șters',
        workerUpdated: 'Muncitor actualizat',
        linkCopied: 'Link copiat în clipboard!',
        logoUploaded: 'Logo încărcat!',
        dataSent: 'Date trimise cu succes!',
        signatureSaved: 'Semnătură salvată!',
        signatureCleared: 'Semnătură ștearsă',
        signaturePresent: 'Semnătură prezentă!',
        canvasEmpty: 'Canvas gol!',
        blacklistAdded: 'Adăugat în listă neagră',
        blacklistRemoved: 'Eliminat din listă neagră',
        registryCleared: 'Jurnal modificări golit!',
        
        // Errors
        fillRequired: 'Completează toate câmpurile obligatorii',
        signBeforeSend: 'Trebuie să semnezi înainte de a trimite',
        dbNotConnected: 'Baza de date nu este conectată',
        errorSaving: 'Eroare la salvare',
        errorDeleting: 'Eroare la ștergere',
        errorLoading: 'Eroare la încărcare',
        errorSending: 'Eroare la trimitere',
        errorClearing: 'Eroare la ștergere',
        
        // Logo
        logo: 'Logo Companie',
        uploadLogo: 'Încarcă Logo',
        
        // Time
        min: 'min',
        hours_short: 'h'
    }
};
