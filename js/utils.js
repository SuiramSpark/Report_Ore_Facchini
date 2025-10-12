// ========================================
// UTILITY FUNCTIONS - BASE
// ========================================

// Toast Notification System
window.showToast = (message, type = 'info', duration = 3000) => {
    const container = document.getElementById('toast-container') || (() => {
        const div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(div);
        return div;
    })();

    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    };

    toast.className = `${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full opacity-0`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);
    
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

// Format Date (YYYY-MM-DD to DD/MM/YYYY)
window.formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

// Format Time (HH:MM to readable)
window.formatTime = (timeString) => {
    return timeString || '00:00';
};

// Calculate Work Hours
window.calculateWorkHours = (oraIn, oraOut, pausaMinuti = 0) => {
    if (!oraIn || !oraOut) return 0;
    
    const [inHours, inMinutes] = oraIn.split(':').map(Number);
    const [outHours, outMinutes] = oraOut.split(':').map(Number);
    
    const totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes) - pausaMinuti;
    return (totalMinutes / 60).toFixed(2);
};

// Generate Random ID
window.generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Copy to Clipboard
window.copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        showToast('✅ Copiato negli appunti!', 'success');
        return true;
    } catch (err) {
        showToast('❌ Errore copia', 'error');
        return false;
    }
};

// Export to CSV
window.exportToCSV = (sheets, filename = 'registro_ore.csv') => {
    const csvRows = [];
    
    // Header
    csvRows.push([
        'Data', 'Azienda', 'Responsabile', 'Località',
        'Nome', 'Cognome', 'Ora In', 'Ora Out', 
        'Pausa (min)', 'Ore Totali', 'CF', 'Telefono'
    ].join(','));

    // Rows
    sheets.forEach(sheet => {
        sheet.lavoratori?.forEach(worker => {
            csvRows.push([
                sheet.data,
                `"${sheet.titoloAzienda || ''}"`,
                `"${sheet.responsabile || ''}"`,
                `"${sheet.location || ''}"`,
                `"${worker.nome}"`,
                `"${worker.cognome}"`,
                worker.oraIn,
                worker.oraOut,
                worker.pausaMinuti || 0,
                worker.oreTotali,
                `"${worker.codiceFiscale || ''}"`,
                `"${worker.telefono || ''}"`
            ].join(','));
        });
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    showToast('✅ CSV esportato!', 'success');
};

// Export to PDF
window.exportToPDF = async (sheet, filename = 'foglio_ore.pdf') => {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(18);
        doc.text('Foglio Ore Lavoratori', 20, 20);
        
        // Sheet Info
        doc.setFontSize(12);
        doc.text(`Data: ${formatDate(sheet.data)}`, 20, 35);
        doc.text(`Azienda: ${sheet.titoloAzienda || 'N/D'}`, 20, 42);
        doc.text(`Responsabile: ${sheet.responsabile || 'N/D'}`, 20, 49);
        
        // Workers Table
        let y = 65;
        doc.setFontSize(10);
        doc.text('Nome', 20, y);
        doc.text('Cognome', 60, y);
        doc.text('Ora In', 100, y);
        doc.text('Ora Out', 130, y);
        doc.text('Ore Tot', 160, y);
        
        y += 7;
        sheet.lavoratori?.forEach(worker => {
            doc.text(worker.nome, 20, y);
            doc.text(worker.cognome, 60, y);
            doc.text(worker.oraIn, 100, y);
            doc.text(worker.oraOut, 130, y);
            doc.text(worker.oreTotali.toString(), 160, y);
            y += 7;
        });
        
        doc.save(filename);
        showToast('✅ PDF esportato!', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showToast('❌ Errore export PDF', 'error');
    }
};

// Validate Italian Fiscal Code (CF)
window.validateCodiceFiscale = (cf) => {
    if (!cf) return false;
    const regex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
    return regex.test(cf.toUpperCase());
};

// Validate Phone Number
window.validatePhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 15;
};

// Get Query Parameter from URL
window.getQueryParam = (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
};

// Set Query Parameter in URL
window.setQueryParam = (param, value) => {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
};

// Debounce Function
window.debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Sort Array of Objects
window.sortByKey = (array, key, order = 'asc') => {
    return array.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (order === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
};

// Get Date Range (last N days)
window.getDateRange = (days = 30) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
};

// Format Number with Locale
window.formatNumber = (number, decimals = 2) => {
    return parseFloat(number).toFixed(decimals);
};


// ========================================
// ⭐ v4.0 NEW FEATURES UTILITIES
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

    const monthlyTrend = {};
    workerEntries.forEach(e => {
        const month = e.date.substring(0, 7);
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
            const age = (new Date() - new Date(parsed.timestamp)) / 1000 / 60;
            
            if (age < 60 * 24) {
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
