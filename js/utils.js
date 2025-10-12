// ========================================
// ⭐ NUOVE FEATURE UTILITIES
// ========================================

// 1. EXPORT EXCEL
window.exportToExcel = (sheets, filename = 'registro_ore.xlsx') => {
    if (typeof XLSX === 'undefined') {
        showToast('❌ Libreria XLSX non caricata', 'error');
        return;
    }

    const data = [];
    
    // Header
    data.push([
        'Data', 'Azienda', 'Responsabile', 'Località',
        'Nome', 'Cognome', 'Ora In', 'Ora Out', 
        'Pausa (min)', 'Ore Totali', 'CF', 'Telefono', 'Note'
    ]);

    // Rows
    sheets.forEach(sheet => {
        sheet.lavoratori?.forEach(worker => {
            data.push([
                sheet.data,
                sheet.titoloAzienda || '',
                sheet.responsabile || '',
                sheet.location || '',
                worker.nome,
                worker.cognome,
                worker.oraIn,
                worker.oraOut,
                worker.pausaMinuti || 0,
                worker.oreTotali,
                worker.codiceFiscale || '',
                worker.telefono || '',
                worker.note || ''
            ]);
        });
    });

    // Create workbook
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro Ore');

    // Auto-size columns
    const maxWidth = data.reduce((w, r) => Math.max(w, r.length), 10);
    ws['!cols'] = Array(maxWidth).fill({ wch: 15 });

    // Download
    XLSX.writeFile(wb, filename);
    showToast('✅ Excel esportato!', 'success');
};

// 2. NOTIFICHE BROWSER
window.requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        showToast('❌ Browser non supporta notifiche', 'error');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showToast('✅ Notifiche attivate', 'success');
            return true;
        }
    }

    showToast('⚠️ Notifiche bloccate', 'warning');
    return false;
};

window.sendNotification = (title, body, icon = '/Report_Ore_Facchini/icons/icon-192x192.png') => {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: icon,
            badge: icon,
            vibrate: [200, 100, 200],
            tag: 'registro-ore'
        });
    }
};

// 6. COMPARAZIONE PERIODI
window.comparePeriodsStats = (sheets) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthSheets = sheets.filter(s => {
        const d = new Date(s.data);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastMonthSheets = sheets.filter(s => {
        const d = new Date(s.data);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    const calcHours = (sheets) => {
        return sheets.reduce((sum, sheet) => {
            return sum + (sheet.lavoratori?.reduce((s, w) => 
                s + parseFloat(w.oreTotali || 0), 0) || 0);
        }, 0);
    };

    const currentHours = calcHours(currentMonthSheets);
    const lastHours = calcHours(lastMonthSheets);
    const diff = currentHours - lastHours;
    const diffPercent = lastHours > 0 ? ((diff / lastHours) * 100).toFixed(1) : 0;

    return {
        current: {
            hours: currentHours.toFixed(1),
            sheets: currentMonthSheets.length,
            workers: new Set(currentMonthSheets.flatMap(s => 
                s.lavoratori?.map(w => `${w.nome} ${w.cognome}`) || []
            )).size
        },
        last: {
            hours: lastHours.toFixed(1),
            sheets: lastMonthSheets.length,
            workers: new Set(lastMonthSheets.flatMap(s => 
                s.lavoratori?.map(w => `${w.nome} ${w.cognome}`) || []
            )).size
        },
        diff: {
            hours: diff.toFixed(1),
            percent: diffPercent,
            positive: diff >= 0
        }
    };
};

// 7. RICERCA GLOBALE
window.globalSearch = (sheets, query) => {
    if (!query) return [];
    
    const q = query.toLowerCase();
    const results = [];

    sheets.forEach(sheet => {
        const matches = [];
        
        // Search in sheet data
        if (sheet.titoloAzienda?.toLowerCase().includes(q)) {
            matches.push({ field: 'Azienda', value: sheet.titoloAzienda });
        }
        if (sheet.responsabile?.toLowerCase().includes(q)) {
            matches.push({ field: 'Responsabile', value: sheet.responsabile });
        }
        if (sheet.location?.toLowerCase().includes(q)) {
            matches.push({ field: 'Località', value: sheet.location });
        }
        if (sheet.note?.toLowerCase().includes(q)) {
            matches.push({ field: 'Note', value: sheet.note });
        }

        // Search in workers
        sheet.lavoratori?.forEach(worker => {
            const workerName = `${worker.nome} ${worker.cognome}`.toLowerCase();
            if (workerName.includes(q)) {
                matches.push({ 
                    field: 'Lavoratore', 
                    value: `${worker.nome} ${worker.cognome}`,
                    worker: worker 
                });
            }
            if (worker.codiceFiscale?.toLowerCase().includes(q)) {
                matches.push({ 
                    field: 'CF', 
                    value: worker.codiceFiscale,
                    worker: worker 
                });
            }
            if (worker.note?.toLowerCase().includes(q)) {
                matches.push({ 
                    field: 'Note Lavoratore', 
                    value: worker.note,
                    worker: worker 
                });
            }
        });

        if (matches.length > 0) {
            results.push({
                sheet: sheet,
                matches: matches
            });
        }
    });

    return results;
};

// 10. BACKUP/RESTORE
window.backupAllData = async (db) => {
    if (!db) {
        showToast('❌ Database non connesso', 'error');
        return;
    }

    try {
        const collections = ['timesheets', 'blacklist', 'auditLog', 'settings', 'workerSessions'];
        const backup = {
            version: '4.0',
            timestamp: new Date().toISOString(),
            data: {}
        };

        for (const col of collections) {
            const snapshot = await db.collection(col).get();
            backup.data[col] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }

        // Download JSON
        const blob = new Blob([JSON.stringify(backup, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_registro_ore_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('✅ Backup scaricato!', 'success');
    } catch (error) {
        console.error('Backup error:', error);
        showToast('❌ Errore durante il backup', 'error');
    }
};

window.restoreFromBackup = async (db, file) => {
    if (!db) {
        showToast('❌ Database non connesso', 'error');
        return;
    }

    try {
        const text = await file.text();
        const backup = JSON.parse(text);

        if (!backup.version || !backup.data) {
            throw new Error('Formato backup non valido');
        }

        const confirmMsg = `Ripristinare backup del ${new Date(backup.timestamp).toLocaleString('it-IT')}?\n\n⚠️ ATTENZIONE: Tutti i dati attuali saranno sostituiti!`;
        
        if (!confirm(confirmMsg)) return;

        // Restore each collection
        for (const [collection, documents] of Object.entries(backup.data)) {
            const batch = db.batch();
            
            documents.forEach(doc => {
                const docRef = db.collection(collection).doc(doc.id);
                const { id, ...data } = doc;
                batch.set(docRef, data);
            });

            await batch.commit();
        }

        showToast('✅ Backup ripristinato! Ricarica pagina.', 'success');
        setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
        console.error('Restore error:', error);
        showToast('❌ Errore durante il ripristino', 'error');
    }
};

// 11. STATISTICHE LAVORATORE
window.getWorkerDetailedStats = (sheets, workerName) => {
    const workerSheets = sheets.filter(s => 
        s.lavoratori?.some(w => `${w.nome} ${w.cognome}` === workerName)
    );

    const workerEntries = workerSheets.flatMap(s => 
        s.lavoratori
            .filter(w => `${w.nome} ${w.cognome}` === workerName)
            .map(w => ({
                ...w,
                date: s.data,
                company: s.titoloAzienda
            }))
    );

    const totalHours = workerEntries.reduce((sum, e) => 
        sum + parseFloat(e.oreTotali || 0), 0
    );

    const avgHours = workerEntries.length > 0 ? 
        (totalHours / workerEntries.length).toFixed(2) : 0;

    const companies = [...new Set(workerEntries.map(e => e.company))];

    // Trend mensile
    const monthlyTrend = {};
    workerEntries.forEach(e => {
        const month = e.date.substring(0, 7); // YYYY-MM
        monthlyTrend[month] = (monthlyTrend[month] || 0) + parseFloat(e.oreTotali || 0);
    });

    return {
        name: workerName,
        totalPresences: workerEntries.length,
        totalHours: totalHours.toFixed(1),
        avgHours: avgHours,
        companies: companies,
        monthlyTrend: monthlyTrend,
        entries: workerEntries.sort((a, b) => b.date.localeCompare(a.date))
    };
};

// 18. AUTO-COMPLETAMENTO
window.getAutocompleteSuggestions = (sheets, field, query) => {
    const suggestions = new Set();

    sheets.forEach(sheet => {
        if (field === 'company' && sheet.titoloAzienda) {
            suggestions.add(sheet.titoloAzienda);
        }
        if (field === 'responsible' && sheet.responsabile) {
            suggestions.add(sheet.responsabile);
        }
        if (field === 'location' && sheet.location) {
            suggestions.add(sheet.location);
        }
        if (field === 'worker') {
            sheet.lavoratori?.forEach(w => {
                suggestions.add(w.nome);
                suggestions.add(w.cognome);
                suggestions.add(`${w.nome} ${w.cognome}`);
            });
        }
    });

    const q = query.toLowerCase();
    return [...suggestions]
        .filter(s => s.toLowerCase().includes(q))
        .slice(0, 5);
};

// BONUS: AUTO-SAVE ADMIN
window.saveAdminDraft = (sheetData, key = 'admin_draft') => {
    try {
        localStorage.setItem(key, JSON.stringify({
            data: sheetData,
            timestamp: new Date().toISOString()
        }));
        console.log('💾 Admin draft saved');
    } catch (e) {
        console.error('Draft save error:', e);
    }
};

window.loadAdminDraft = (key = 'admin_draft') => {
    try {
        const draft = localStorage.getItem(key);
        if (draft) {
            const parsed = JSON.parse(draft);
            const age = (new Date() - new Date(parsed.timestamp)) / 1000 / 60; // minutes
            
            if (age < 60 * 24) { // 24 hours
                return parsed.data;
            }
        }
    } catch (e) {
        console.error('Draft load error:', e);
    }
    return null;
};

window.clearAdminDraft = (key = 'admin_draft') => {
    localStorage.removeItem(key);
};

// PWA Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    const installBtn = document.getElementById('pwa-install-prompt');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.innerHTML = `
            <button class="fixed bottom-4 right-4 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50 flex items-center gap-2">
                <span>📱</span>
                <span>Installa App</span>
            </button>
        `;
        
        installBtn.querySelector('button').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    showToast('✅ App installata!', 'success');
                }
                
                deferredPrompt = null;
                installBtn.style.display = 'none';
            }
        });
    }
});
