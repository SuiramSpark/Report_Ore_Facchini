// ========================================
// UTILITY FUNCTIONS - v4.3 EXACT PDF MATCH
// ========================================

// 🇮🇹 FESTIVI NAZIONALI ITALIANI (2024-2026)
window.ITALIAN_HOLIDAYS = {
    2024: [
        '2024-01-01', // Capodanno
        '2024-01-06', // Epifania
        '2024-03-31', // Pasqua
        '2024-04-01', // Lunedì dell'Angelo
        '2024-04-25', // Festa della Liberazione
        '2024-05-01', // Festa dei Lavoratori
        '2024-06-02', // Festa della Repubblica
        '2024-08-15', // Ferragosto
        '2024-11-01', // Tutti i Santi
        '2024-12-08', // Immacolata Concezione
        '2024-12-25', // Natale
        '2024-12-26'  // Santo Stefano
    ],
    2025: [
        '2025-01-01', // Capodanno
        '2025-01-06', // Epifania
        '2025-04-20', // Pasqua
        '2025-04-21', // Lunedì dell'Angelo
        '2025-04-25', // Festa della Liberazione
        '2025-05-01', // Festa dei Lavoratori
        '2025-06-02', // Festa della Repubblica
        '2025-08-15', // Ferragosto
        '2025-11-01', // Tutti i Santi
        '2025-12-08', // Immacolata Concezione
        '2025-12-25', // Natale
        '2025-12-26'  // Santo Stefano
    ],
    2026: [
        '2026-01-01', // Capodanno
        '2026-01-06', // Epifania
        '2026-04-05', // Pasqua
        '2026-04-06', // Lunedì dell'Angelo
        '2026-04-25', // Festa della Liberazione
        '2026-05-01', // Festa dei Lavoratori
        '2026-06-02', // Festa della Repubblica
        '2026-08-15', // Ferragosto
        '2026-11-01', // Tutti i Santi
        '2026-12-08', // Immacolata Concezione
        '2026-12-25', // Natale
        '2026-12-26'  // Santo Stefano
    ]
};

// 📅 Funzione: Controlla se una data è un festivo
window.isItalianHoliday = (dateString) => {
    const year = dateString.substring(0, 4);
    const holidays = window.ITALIAN_HOLIDAYS[year] || [];
    return holidays.includes(dateString);
};

// 📅 Funzione: Controlla se una data è weekend (sabato o domenica)
window.isWeekend = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = domenica, 6 = sabato
};

// 📅 Funzione: Controlla se una data è lavorativa (non weekend e non festivo)
window.isWorkingDay = (dateString) => {
    return !window.isWeekend(dateString) && !window.isItalianHoliday(dateString);
};

// 📅 Funzione: Conta giorni lavorativi in un range di date
window.countWorkingDays = (startDate, endDate) => {
    let count = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (window.isWorkingDay(dateStr)) {
            count++;
        }
    }
    return count;
};

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

// Format Date for Italian locale (used in PDF)
window.formatDateItalian = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Format Time (HH:MM to readable)
window.formatTime = (timeString) => {
    return timeString || '00:00';
};

// Calculate Work Hours - PAUSA CORRETTA
window.calculateWorkHours = (oraIn, oraOut, pausaMinuti = 0) => {
    // Normalize inputs: treat placeholders like "--:--" or invalid formats as empty
    try {
        if (!oraIn || !oraOut) return '0.00';
        const sIn = ('' + oraIn).trim();
        const sOut = ('' + oraOut).trim();

        const timeRegex = /^\s*\d{1,2}:\d{2}\s*$/;
        if (!timeRegex.test(sIn) || !timeRegex.test(sOut)) return '0.00';

        const [inHours, inMinutes] = sIn.split(':').map((v) => Number(v));
        const [outHours, outMinutes] = sOut.split(':').map((v) => Number(v));

        if ([inHours, inMinutes, outHours, outMinutes].some(n => Number.isNaN(n))) {
            return '0.00';
        }

        let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
        if (totalMinutes < 0) totalMinutes += 24 * 60; // handle overnight

        const pausa = parseInt(pausaMinuti) || 0;
        totalMinutes -= pausa;
        if (totalMinutes < 0) return '0.00';

        return (totalMinutes / 60).toFixed(2);
    } catch (error) {
        console.error('Errore calcolo ore:', error);
        return '0.00';
    }
};

// Alias for compatibility
window.calculateHours = window.calculateWorkHours;

// Generate Random ID
window.generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Copy to Clipboard
window.copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        showToast((typeof window !== 'undefined' && window.t) ? window.t('copySuccess') : '✅ Copiato negli appunti!', 'success');
        return true;
    } catch (err) {
    showToast((typeof window !== 'undefined' && window.t) ? window.t('copyError') : '❌ Errore copia', 'error');
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
    
    showToast((typeof window !== 'undefined' && window.t) ? window.t('exportCSVSuccess') : '✅ CSV esportato!', 'success');
};

// ========================================
// SMART SIGNATURE COLOR INVERSION FOR PDF
// ========================================

// Function to detect if signature has dark background (needs inversion)
window.signatureNeedsInversion = (signatureDataURL) => {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            img.onload = () => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const ctx = tempCanvas.getContext('2d');
                
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imageData.data;
                
                // Sample pixels to determine average brightness
                let totalBrightness = 0;
                let sampleCount = 0;
                
                // Sample every 10th pixel to speed up
                for (let i = 0; i < data.length; i += 40) { // RGBA = 4 bytes, so 40 = every 10 pixels
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const alpha = data[i + 3];
                    
                    // Only count non-transparent pixels
                    if (alpha > 128) {
                        // Calculate brightness (perceived luminance)
                        const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
                        totalBrightness += brightness;
                        sampleCount++;
                    }
                }
                
                const avgBrightness = totalBrightness / sampleCount;
                
                // If average brightness is less than 128 (dark), needs inversion
                // If average brightness is >= 128 (light), already correct
                resolve(avgBrightness < 128);
            };
            
            img.onerror = () => reject(new Error('Failed to load signature'));
            img.src = signatureDataURL;
        } catch (error) {
            reject(error);
        }
    });
};

// Function to invert signature colors (dark bg → white, white stroke → black)
window.invertSignatureForPDF = (signatureDataURL) => {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            img.onload = () => {
                // Create temporary canvas
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const ctx = tempCanvas.getContext('2d');
                
                // Draw original image
                ctx.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imageData.data;
                
                // Invert colors (RGBA format)
                for (let i = 0; i < data.length; i += 4) {
                    // Invert RGB, keep Alpha
                    data[i] = 255 - data[i];         // Red
                    data[i + 1] = 255 - data[i + 1]; // Green
                    data[i + 2] = 255 - data[i + 2]; // Blue
                    // data[i + 3] stays the same (Alpha)
                }
                
                // Put inverted data back
                ctx.putImageData(imageData, 0, 0);
                
                // Return inverted signature as data URL
                resolve(tempCanvas.toDataURL('image/png'));
            };
            
            img.onerror = () => reject(new Error('Failed to load signature'));
            img.src = signatureDataURL;
        } catch (error) {
            reject(error);
        }
    });
};

// Deterministic color for a given key (e.g., worker name or id)
window.getColorForKey = (key) => {
    try {
        // Expanded palette with 24 distinct, visually diverse colors
        const palette = [
            '#EF4444', // red-500
            '#F59E0B', // amber-500
            '#10B981', // emerald-500
            '#06B6D4', // cyan-500
            '#3B82F6', // blue-500
            '#8B5CF6', // violet-500
            '#EC4899', // pink-500
            '#F97316', // orange-500
            '#84CC16', // lime-500
            '#14B8A6', // teal-500
            '#6366F1', // indigo-500
            '#A855F7', // purple-500
            '#F43F5E', // rose-500
            '#FBBF24', // amber-400
            '#34D399', // emerald-400
            '#22D3EE', // cyan-400
            '#60A5FA', // blue-400
            '#A78BFA', // violet-400
            '#F472B6', // pink-400
            '#FB923C', // orange-400
            '#A3E635', // lime-400
            '#2DD4BF', // teal-400
            '#818CF8', // indigo-400
            '#C084FC'  // purple-400
        ];

        let h = 0;
        const s = ('' + (key || '')).split('').slice(0, 32);
        for (let i = 0; i < s.length; i++) {
            h = (h * 31 + s[i].charCodeAt(0)) >>> 0;
        }
        return palette[h % palette.length];
    } catch (e) {
        return '#4f46e5';
    }
};

// Smart function: only inverts if needed
window.prepareSignatureForPDF = async (signatureDataURL) => {
    try {
        const needsInversion = await signatureNeedsInversion(signatureDataURL);
        
        if (needsInversion) {
            // Dark signature - invert it
            return await invertSignatureForPDF(signatureDataURL);
        } else {
            // Already light signature - use as is
            return signatureDataURL;
        }
    } catch (error) {
        console.error('Error preparing signature:', error);
        // Fallback: return original
        return signatureDataURL;
    }
};

// ========================================
// EXACT PDF GENERATION - MATCHING PROVIDED TEMPLATE
// ========================================

window.exportToPDF = async (sheet, companyLogo = null, filename = null) => {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get logo from localStorage if not provided
        if (!companyLogo) {
            companyLogo = localStorage.getItem('companyLogo');
        }
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        let yPos = 10;

        // ========================================
        // COMPACT HEADER - 4X SMALLER
        // ========================================
        
        // Purple header background (reduced height)
        doc.setFillColor(88, 81, 219);
        doc.rect(0, 0, pageWidth, 32, 'F');
        
        // Add Company Logo if available (smaller)
        if (companyLogo) {
            try {
                const logoSize = 18;
                const logoX = 12;
                const logoY = 7;
                doc.addImage(companyLogo, 'PNG', logoX, logoY, logoSize, logoSize);
            } catch (e) {
                console.error('Error adding logo:', e);
            }
        }
        
        // Title "FOGLIO PRESENZE" (smaller)
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text((typeof window !== 'undefined' && window.t) ? window.t('pdfTitleSmall') : 'FOGLIO PRESENZE', 35, 16);
        
    // Subtitle (localized)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text((typeof window !== 'undefined' && window.t) ? window.t('pdfSubtitle') : 'Registro Ore Lavoratori', 35, 23);

        yPos = 38;

        // ========================================
        // COMPACT INFO BOX
        // ========================================
        
        // Light gray background box (expanded height for new fields)
        const infoBoxHeight = (sheet.indirizzoEvento || (sheet.orarioStimatoDa && sheet.orarioStimatoA)) ? 30 : 18;
        doc.setFillColor(240, 242, 247);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, infoBoxHeight, 2, 2, 'F');

        // Info text (smaller fonts)
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);

        const infoY = yPos + 6;
        
        // Left column
        doc.text('AZIENDA:', margin + 3, infoY);
        doc.setFont('helvetica', 'normal');
        const companyText = sheet.titoloAzienda || 'N/D';
        doc.text(companyText.length > 40 ? companyText.substring(0, 40) + '...' : companyText, margin + 20, infoY);

        doc.setFont('helvetica', 'bold');
        doc.text('DATA:', margin + 3, infoY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDateItalian(sheet.data) || 'N/D', margin + 20, infoY + 6);

        // Right column
        doc.setFont('helvetica', 'bold');
        doc.text('RESPONSABILE:', pageWidth / 2 + 5, infoY);
        doc.setFont('helvetica', 'normal');
        const respText = sheet.responsabile || 'N/D';
        doc.text(respText.length > 35 ? respText.substring(0, 35) + '...' : respText, pageWidth / 2 + 28, infoY);

        if (sheet.location) {
            doc.setFont('helvetica', 'bold');
            doc.text((typeof window !== 'undefined' && window.t) ? window.t('pdfLabelLocation') : 'LOCALITÀ:', pageWidth / 2 + 5, infoY + 6);
            doc.setFont('helvetica', 'normal');
            const locationText = sheet.location;
            doc.text(locationText.length > 30 ? locationText.substring(0, 30) + '...' : locationText, pageWidth / 2 + 28, infoY + 6);
        }

        // New fields - Third row
        let thirdRowY = infoY + 12;
        
        if (sheet.indirizzoEvento) {
            doc.setFont('helvetica', 'bold');
            doc.text((typeof window !== 'undefined' && window.t) ? window.t('pdfLabelAddress') : 'INDIRIZZO:', margin + 3, thirdRowY);
            doc.setFont('helvetica', 'normal');
            const addressText = sheet.indirizzoEvento;
            doc.text(addressText.length > 45 ? addressText.substring(0, 45) + '...' : addressText, margin + 20, thirdRowY);
        }

        if (sheet.orarioStimatoDa && sheet.orarioStimatoA) {
            doc.setFont('helvetica', 'bold');
            doc.text((typeof window !== 'undefined' && window.t) ? window.t('pdfLabelEstimatedSchedule') : 'ORARIO STIMATO PRE-LAVORO:', pageWidth / 2 + 5, thirdRowY);
            doc.setFont('helvetica', 'normal');
            doc.text(`${sheet.orarioStimatoDa} - ${sheet.orarioStimatoA}`, pageWidth / 2 + 55, thirdRowY);
        }

        yPos += infoBoxHeight + 4;

        // ========================================
        // COMPACT LAVORATORI SECTION - 4X SMALLER
        // ========================================

        if (sheet.lavoratori && sheet.lavoratori.length > 0) {
            // Section title (smaller)
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(`LAVORATORI (${sheet.lavoratori.length})`, margin, yPos);
            yPos += 6;

            // Calculate total hours
            const totalHours = sheet.lavoratori.reduce((sum, w) => sum + parseFloat(w.oreTotali || 0), 0);

            // Process workers sequentially to handle async signature inversion
            for (let index = 0; index < sheet.lavoratori.length; index++) {
                const worker = sheet.lavoratori[index];
                
                // Check if we need a new page
                if (yPos > pageHeight - 40) {
                    doc.addPage();
                    yPos = margin + 8;
                }

                const cardHeight = 14;
                
                // Card background (white)
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(margin, yPos, pageWidth - 2 * margin, cardHeight, 1.5, 1.5, 'F');
                
                // Card border (purple)
                doc.setDrawColor(88, 81, 219);
                doc.setLineWidth(0.6);
                doc.roundedRect(margin, yPos, pageWidth - 2 * margin, cardHeight, 1.5, 1.5, 'S');

                // Worker number badge
                doc.setFillColor(88, 81, 219);
                doc.circle(margin + 6, yPos + 7, 4, 'F');
                
                // Number in white
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                const numText = (index + 1).toString();
                doc.text(numText, margin + (index + 1 > 9 ? 4.5 : 5.2), yPos + 8.5);

                // Worker name
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text(`${worker.nome} ${worker.cognome}`, margin + 12, yPos + 5);

                // Time info with colored text
                doc.setFontSize(6);
                doc.setFont('helvetica', 'normal');
                
                let xPos = margin + 12;
                
                // ENTRATA (green)
                doc.setTextColor(34, 197, 94);
                doc.text('IN:', xPos, yPos + 10);
                doc.setTextColor(0, 0, 0);
                doc.text(worker.oraIn || '--:--', xPos + 5, yPos + 10);
                xPos += 18;
                
                // USCITA (red)
                doc.setTextColor(239, 68, 68);
                doc.text('OUT:', xPos, yPos + 10);
                doc.setTextColor(0, 0, 0);
                doc.text(worker.oraOut || '--:--', xPos + 7, yPos + 10);
                xPos += 20;
                
                // PAUSA (yellow)
                doc.setTextColor(234, 179, 8);
                doc.text('PAUSA:', xPos, yPos + 10);
                doc.setTextColor(0, 0, 0);
                doc.text(`${worker.pausaMinuti || 0}m`, xPos + 11, yPos + 10);
                xPos += 23;
                
                // TOTALE (purple, bold)
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(88, 81, 219);
                doc.text(`TOT: ${worker.oreTotali}h`, xPos, yPos + 10);

                // Worker Signature with smart color detection
                if (worker.firma) {
                    try {
                        const sigWidth = 20;
                        const sigHeight = 10;
                        const sigX = pageWidth - margin - sigWidth - 3;
                        const sigY = yPos + 2;
                        
                        // WHITE background rectangle
                        doc.setFillColor(255, 255, 255);
                        doc.rect(sigX, sigY, sigWidth, sigHeight, 'F');
                        
                        // Signature box border
                        doc.setDrawColor(200, 200, 200);
                        doc.setLineWidth(0.3);
                        doc.rect(sigX, sigY, sigWidth, sigHeight, 'S');
                        
                        // Smart preparation: only inverts if needed
                        const preparedSignature = await prepareSignatureForPDF(worker.firma);
                        
                        // Add prepared signature on white background
                        doc.addImage(preparedSignature, 'PNG', sigX + 0.5, sigY + 0.5, sigWidth - 1, sigHeight - 1);
                    } catch (e) {
                        console.error('Error adding worker signature:', e);
                        // Fallback: try original signature
                        try {
                            doc.addImage(worker.firma, 'PNG', sigX + 0.5, sigY + 0.5, sigWidth - 1, sigHeight - 1);
                        } catch (e2) {
                            console.error('Fallback failed:', e2);
                        }
                    }
                } else {
                    // Empty signature box
                    const sigX = pageWidth - margin - 20 - 3;
                    const sigY = yPos + 2;
                    
                    doc.setFillColor(255, 255, 255);
                    doc.rect(sigX, sigY, 20, 10, 'F');
                    
                    doc.setDrawColor(220, 220, 220);
                    doc.setLineWidth(0.3);
                    doc.rect(sigX, sigY, 20, 10, 'S');
                }

                yPos += cardHeight + 2;
            }

            yPos += 3;

            // ========================================
            // COMPACT TOTALE BOX
            // ========================================
            
            doc.setFillColor(88, 81, 219);
            doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 1.5, 1.5, 'F');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(255, 255, 255);
            doc.text(`TOTALE ORE: ${totalHours.toFixed(2)}h`, margin + 5, yPos + 5.5);
            doc.text(`LAVORATORI: ${sheet.lavoratori.length}`, pageWidth - margin - 30, yPos + 5.5);

            yPos += 12;
        }

        // ========================================
        // COMPACT FIRMA RESPONSABILE
        // ========================================
        
        if (sheet.firmaResponsabile) {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = margin + 10;
            }

            // Much smaller signature box (4x height, 6x width reduction)
            const sigBoxWidth = 30; // Was ~180, now ~30
            const sigBoxHeight = 12; // Was ~55, now ~12
            
            // White background for signature box
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(margin, yPos, sigBoxWidth, sigBoxHeight, 1.5, 1.5, 'F');
            
            doc.setDrawColor(88, 81, 219);
            doc.setLineWidth(0.5);
            doc.roundedRect(margin, yPos, sigBoxWidth, sigBoxHeight, 1.5, 1.5, 'S');

            // Title (smaller)
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            doc.text((typeof window !== 'undefined' && window.t) ? window.t('pdfResponsibleShort') : 'FIRMA RESP.', margin + 2, yPos + 3);

            try {
                const sigWidth = 12;
                const sigHeight = 6;
                
                // Smart preparation: only inverts if needed
                const preparedSignature = await prepareSignatureForPDF(sheet.firmaResponsabile);
                
                // Add prepared signature on white background
                doc.addImage(preparedSignature, 'PNG', margin + 2, yPos + 4, sigWidth, sigHeight);
                
                // Name (tiny)
                doc.setFontSize(5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(88, 81, 219);
                const respName = sheet.responsabile || 'N/D';
                doc.text(respName.length > 12 ? respName.substring(0, 12) + '.' : respName, margin + 15, yPos + 7);
                
            } catch (e) {
                console.error('Error adding responsible signature:', e);
                // Fallback: try original signature
                try {
                    doc.addImage(sheet.firmaResponsabile, 'PNG', margin + 2, yPos + 4, 12, 6);
                } catch (e2) {
                    console.error('Fallback failed:', e2);
                }
            }
            
            yPos += sigBoxHeight + 3;
        }

        // ========================================
        // COMPACT FOOTER (on all pages)
        // ========================================
        
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            
            // Footer line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.2);
            doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
            
            // Footer text (very small)
            doc.setFontSize(5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(140, 140, 140);
            
            const genDate = new Date().toLocaleDateString((typeof window !== 'undefined' && window.getLanguage && window.getLanguage()) === 'en' ? 'en-US' : 'it-IT', { 
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            doc.text(((typeof window !== 'undefined' && window.t) ? window.t('pdfGeneratedAt') : 'Generato:') + ` ${genDate}`, margin, pageHeight - 6);
            doc.text(`Pag. ${i}/${totalPages}`, pageWidth - margin - 12, pageHeight - 6);
        }

        // ========================================
        // SAVE PDF
        // ========================================
        
    const filenamePrefix = (typeof window !== 'undefined' && window.t) ? window.t('pdfFilenamePrefix') : 'foglio_presenze';
    const pdfFilename = filename || `${filenamePrefix}_${sheet.titoloAzienda || 'N_D'}_${sheet.data}.pdf`.replace(/\s+/g, '_');
        doc.save(pdfFilename);
        
    showToast((typeof window !== 'undefined' && window.t) ? window.t('pdfGeneratedSuccess') : '✅ PDF generato con successo!', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
    showToast((typeof window !== 'undefined' && window.t) ? window.t('pdfGenerationError') : '❌ Errore generazione PDF', 'error');
    }
};

// Alias per compatibilità
window.generatePDF = window.exportToPDF;

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

// EXPORT EXCEL
window.exportToExcel = (sheets, filename = 'registro_ore.xlsx') => {
    if (typeof XLSX === 'undefined') {
    showToast((typeof window !== 'undefined' && window.t) ? window.t('xlsxLibMissing') : '❌ Libreria XLSX non caricata', 'error');
        return;
    }

    const data = [];
    
    data.push([
        'Data', 'Azienda', 'Responsabile', 'Località',
        'Nome', 'Cognome', 'Ora In', 'Ora Out', 
        'Pausa (min)', 'Ore Totali', 'CF', 'Telefono', 'Note'
    ]);

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

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro Ore');

    const maxWidth = data.reduce((w, r) => Math.max(w, r.length), 10);
    ws['!cols'] = Array(maxWidth).fill({ wch: 15 });

    XLSX.writeFile(wb, filename);
    showToast((typeof window !== 'undefined' && window.t) ? window.t('exportExcelSuccess') : '✅ Excel esportato!', 'success');
};

// NOTIFICHE BROWSER
window.requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
    showToast((typeof window !== 'undefined' && window.t) ? window.t('browserNoNotifications') : '❌ Browser non supporta notifiche', 'error');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showToast((typeof window !== 'undefined' && window.t) ? window.t('notificationsEnabled') : '✅ Notifiche attivate', 'success');
            return true;
        }
    }

    showToast((typeof window !== 'undefined' && window.t) ? window.t('notificationsBlocked') : '⚠️ Notifiche bloccate', 'warning');
    return false;
};

window.sendNotification = (title, body, icon = '/icons/icon-192.png') => {
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

// COMPARAZIONE PERIODI
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

// RICERCA GLOBALE
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

// BACKUP/RESTORE
window.backupAllData = async (db) => {
    if (!db) {
        showToast('❌ Database non connesso', 'error');
        return;
    }

    try {
        const collections = ['timesheets', 'blacklist', 'auditLog', 'settings', 'workerSessions'];
        const backup = {
            version: '4.3',
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

        showToast((typeof window !== 'undefined' && window.t) ? window.t('backupDownloadedSuccess') : '✅ Backup scaricato!', 'success');
    } catch (error) {
        console.error('Backup error:', error);
        showToast((typeof window !== 'undefined' && window.t) ? window.t('backupError') : '❌ Errore durante il backup', 'error');
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
            throw new Error((typeof window !== 'undefined' && window.t) ? window.t('backupInvalidFormat') : 'Formato backup non valido');
        }

        const dateStr = new Date(backup.timestamp).toLocaleString((typeof window !== 'undefined' && window.getLanguage && window.getLanguage()) === 'en' ? 'en-US' : 'it-IT');
        const confirmMsg = (typeof window !== 'undefined' && window.t) ? window.t('backupRestoreConfirm').replace('{date}', dateStr) : `Ripristinare backup del ${dateStr}?\n\n⚠️ ATTENZIONE: Tutti i dati attuali saranno sostituiti!`;
        
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

        showToast((typeof window !== 'undefined' && window.t) ? window.t('backupRestoreSuccess') : '✅ Backup ripristinato! Ricarica pagina.', 'success');
        setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
        console.error('Restore error:', error);
        showToast((typeof window !== 'undefined' && window.t) ? window.t('backupRestoreError') : '❌ Errore durante il ripristino', 'error');
    }
};

// STATISTICHE LAVORATORE
window.getWorkerDetailedStats = (sheets, normalizedWorkerKey, normalizeFunction) => {
    const entries = [];
    const companies = new Set();
    const monthlyTrend = {};
    const activityHours = {}; // 🎯 Ore per tipo attività
    let totalHours = 0;
    let completedSheets = 0; // 🎯 Fogli con dati completi
    let onTimeSheets = 0; // 🎯 Fogli con orari presenti
    let weekendDaysWorked = 0; // 🎯 Giorni weekend/festivi lavorati
    let earlyArrivals = 0; // 🎯 Arrivi anticipati
    let lateExits = 0; // 🎯 Uscite posticipate
    const workDates = new Set(); // 🎯 Date uniche lavorate
    
    sheets.forEach(sheet => {
        sheet.lavoratori?.forEach(worker => {
            const workerNormalizedKey = normalizeFunction(worker.nome, worker.cognome);
            
            if (workerNormalizedKey === normalizedWorkerKey) {
                const hours = parseFloat(worker.oreTotali) || 0;
                totalHours += hours;
                
                if (sheet.titoloAzienda) {
                    companies.add(sheet.titoloAzienda);
                }
                
                // 🎯 Aggiungi data al set delle date lavorate
                if (sheet.data) {
                    workDates.add(sheet.data);
                    
                    // 🎯 Controlla se è weekend o festivo
                    if (window.isWeekend(sheet.data) || window.isItalianHoliday(sheet.data)) {
                        weekendDaysWorked++;
                    }
                }
                
                // 🎯 Calcola affidabilità: conta fogli completi e puntuali
                const hasOraIn = worker.oraIn && worker.oraIn.trim() !== '';
                const hasOraOut = worker.oraOut && worker.oraOut.trim() !== '';
                const hasOreTotali = hours > 0;
                
                // Foglio completo: ha tutti i dati necessari
                if (hasOraIn && hasOraOut && hasOreTotali) {
                    completedSheets++;
                }
                
                // Foglio puntuale: ha almeno gli orari
                if (hasOraIn && hasOraOut) {
                    onTimeSheets++;
                    
                    // 🎯 Calcola puntualità (confronto con orari stimati dal FOGLIO)
                    const orarioStimatoOd = sheet.orarioStimatoOd || '09:00';
                    const orarioStimatoA = sheet.orarioStimatoA || '18:00';
                    
                    // Converte orari in minuti per confronto
                    const timeToMinutes = (time) => {
                        if (!time) return 0;
                        const [h, m] = time.split(':').map(Number);
                        return h * 60 + m;
                    };
                    
                    const arrivoEffettivo = timeToMinutes(worker.oraIn);
                    const uscitaEffettiva = timeToMinutes(worker.oraOut);
                    const arrivoStimato = timeToMinutes(orarioStimatoOd);
                    const uscitaStimata = timeToMinutes(orarioStimatoA);
                    
                    // Arrivo anticipato (almeno 5 minuti prima)
                    if (arrivoEffettivo > 0 && arrivoStimato > 0 && arrivoEffettivo <= (arrivoStimato - 5)) {
                        earlyArrivals++;
                    }
                    
                    // Uscita posticipata (almeno 5 minuti dopo)
                    if (uscitaEffettiva > 0 && uscitaStimata > 0 && uscitaEffettiva >= (uscitaStimata + 5)) {
                        lateExits++;
                    }
                }
                
                // Prendi tipoAttivita dal FOGLIO (sheet), non dal lavoratore
                const sheetActivities = sheet.tipoAttivita || [];
                
                entries.push({
                    date: sheet.data,
                    company: sheet.titoloAzienda || 'N/A',
                    oraIn: worker.oraIn,
                    oraOut: worker.oraOut,
                    oreTotali: worker.oreTotali,
                    hours, // Per calcolo aziende
                    tipoAttivita: sheetActivities.length > 0 ? sheetActivities[0] : null // Prima attività del foglio
                });
                
                if (sheet.data) {
                    const month = sheet.data.substring(0, 7);
                    monthlyTrend[month] = (monthlyTrend[month] || 0) + hours;
                }
                
                // 🎯 Aggrega ore per tipo attività (dal FOGLIO - array)
                // Se il foglio ha più attività, distribuisci le ore equamente
                if (sheet.tipoAttivita && Array.isArray(sheet.tipoAttivita) && sheet.tipoAttivita.length > 0) {
                    const hoursPerActivity = hours / sheet.tipoAttivita.length;
                    sheet.tipoAttivita.forEach(activityId => {
                        activityHours[activityId] = (activityHours[activityId] || 0) + hoursPerActivity;
                    });
                }
            }
        });
    });
    
    entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    
    // 🎯 Calcola giorni lavorativi totali nel periodo
    let workingDaysInPeriod = 0;
    if (entries.length > 0) {
        const dates = entries.map(e => e.date).filter(Boolean);
        if (dates.length > 0) {
            const startDate = dates[dates.length - 1]; // Prima data
            const endDate = dates[0]; // Ultima data
            workingDaysInPeriod = window.countWorkingDays(startDate, endDate);
        }
    }
    
    const displayName = entries.length > 0 
        ? `${entries[0].company}` 
        : 'N/A';
    
    return {
        name: displayName,
        totalPresences: entries.length,
        totalHours: totalHours.toFixed(1),
        avgHours: entries.length > 0 ? (totalHours / entries.length).toFixed(1) : '0.0',
        companies: Array.from(companies),
        monthlyTrend,
        activityHours, // 🎯 Nuovo campo
        entries,
        totalDays: entries.length, // Per calcoli performance
        totalSheets: entries.length,
        completedSheets, // 🎯 Fogli con dati completi (oraIn + oraOut + oreTotali)
        onTimeSheets, // 🎯 Fogli con orari presenti (oraIn + oraOut)
        weekendDaysWorked, // 🎯 NUOVO: Giorni weekend/festivi lavorati
        earlyArrivals, // 🎯 NUOVO: Arrivi anticipati (>5min prima)
        lateExits, // 🎯 NUOVO: Uscite posticipate (>5min dopo)
        workingDaysInPeriod, // 🎯 NUOVO: Giorni lavorativi totali nel periodo
        uniqueWorkDays: workDates.size // 🎯 NUOVO: Giorni unici lavorati
    };
};

// AUTO-COMPLETAMENTO
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

// AUTO-SAVE ADMIN
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
let _pwaInstallTimer = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Safety: do not show install prompt to users who are in worker mode
    // (worker links are single-sheet links and should not be encouraged to install the admin PWA)
    try {
        const params = new URLSearchParams(window.location.search);
        const urlMode = params.get('mode');
        if (urlMode === 'worker') {
            console.log('🚫 Skipping PWA install prompt for worker mode');
            return;
        }
    } catch (err) {
        // ignore parsing errors and proceed to show prompt
    }

    // Don't show the prompt if the app is already installed or running standalone
    try {
        const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone === true);
        const installedFlag = localStorage.getItem('pwa_installed') === 'true';
        if (isStandalone || installedFlag) {
            console.log('✅ PWA already installed or running as standalone — skipping install prompt');
            return;
        }
    } catch (e) {
        // ignore and continue
    }

    const installBtn = document.getElementById('pwa-install-prompt');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.innerHTML = `
            <button class="pwa-install-bubble fixed bottom-4 right-4 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50 flex items-center gap-2">
                <span>📱</span>
                <span>Installa App</span>
            </button>
        `;

        // Ensure any previous timer is cleared and set a 10s auto-hide
        try { if (_pwaInstallTimer) clearTimeout(_pwaInstallTimer); } catch (e) {}
        _pwaInstallTimer = setTimeout(() => {
            try { installBtn.style.display = 'none'; } catch (e) {}
            _pwaInstallTimer = null;
        }, 10000); // hide after 10 seconds

        const btn = installBtn.querySelector('button');
        if (btn) {
            btn.addEventListener('click', async () => {
                // user clicked before timeout: cancel hide timer
                try { if (_pwaInstallTimer) clearTimeout(_pwaInstallTimer); _pwaInstallTimer = null; } catch (e) {}

                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    try {
                        const { outcome } = await deferredPrompt.userChoice;
                        if (outcome === 'accepted') {
                            showToast('✅ App installata!', 'success');
                        }
                    } catch (e) {
                        console.warn('PWA install choice error', e);
                    }

                    deferredPrompt = null;
                }

                try { installBtn.style.display = 'none'; } catch (e) {}
            });
        }
    }
});

// When the app is installed, mark it so we don't show the prompt again
window.addEventListener('appinstalled', (evt) => {
    console.log('📦 PWA installed event received', evt);
    try { localStorage.setItem('pwa_installed', 'true'); } catch (e) { console.warn('Could not persist pwa_installed flag', e); }
    const installBtn = document.getElementById('pwa-install-prompt');
    if (installBtn) {
        try { installBtn.style.display = 'none'; } catch (e) {}
    }
});

// ========================================
// SIGNATURE CANVAS UTILITIES
// ========================================

window.initCanvas = (canvas, darkMode = false) => {
    if (!canvas) return null;

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let rafId = null;
    let resizeObserver = null;
    const listeners = [];

    const setupCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        console.log('initCanvas: setupCanvas called, rect:', rect.width, 'x', rect.height, 'px');
        console.log('initCanvas: devicePixelRatio =', window.devicePixelRatio);
        // If layout not ready, try again on next frame and observe size changes
        if (rect.width === 0 || rect.height === 0) {
            // If ResizeObserver is available, use it to detect when the canvas gets sized
            if (window.ResizeObserver && !resizeObserver) {
                console.log('initCanvas: using ResizeObserver fallback');
                resizeObserver = new ResizeObserver((entries) => {
                    for (const entry of entries) {
                        const cr = entry.contentRect || entry.target.getBoundingClientRect();
                        console.log('initCanvas: ResizeObserver entry:', cr.width, 'x', cr.height);
                        if (cr.width > 0 && cr.height > 0) {
                            try { resizeObserver.disconnect(); } catch (e) { console.warn('initCanvas: resizeObserver disconnect failed', e); }
                            resizeObserver = null;
                            // call setup again on next frame to finalize DPR sizing
                            rafId = requestAnimationFrame(setupCanvas);
                            return;
                        }
                    }
                });

                try {
                    // Observe the canvas itself and its parent as a fallback
                    resizeObserver.observe(canvas);
                    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
                } catch (e) {
                    console.warn('initCanvas: ResizeObserver.observe failed, falling back to RAF', e);
                    // If observe throws, fallback to RAF retry loop
                    rafId = requestAnimationFrame(setupCanvas);
                }
                return;
            }

            rafId = requestAnimationFrame(setupCanvas);
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(rect.width * dpr));
        const height = Math.max(1, Math.floor(rect.height * dpr));

        // set internal canvas resolution to match display size * DPR
        canvas.width = width;
        canvas.height = height;
        // keep CSS size in CSS pixels
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';

    const ctx = canvas.getContext('2d');
        // Fill white background using full pixel buffer
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Drawing style
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const getCoordinates = (e) => {
            const r = canvas.getBoundingClientRect();
            const scaleX = canvas.width / r.width;
            const scaleY = canvas.height / r.height;

            if (e.touches && e.touches.length > 0) {
                return {
                    x: (e.touches[0].clientX - r.left) * scaleX,
                    y: (e.touches[0].clientY - r.top) * scaleY
                };
            }
            return {
                x: (e.clientX - r.left) * scaleX,
                y: (e.clientY - r.top) * scaleY
            };
        };

        const startDrawing = (e) => {
            e.preventDefault();
            isDrawing = true;
            const coords = getCoordinates(e);
            lastX = coords.x;
            lastY = coords.y;
        };

        const draw = (e) => {
            if (!isDrawing) return;
            e.preventDefault();

            const coords = getCoordinates(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();

            lastX = coords.x;
            lastY = coords.y;
        };

        const stopDrawing = (e) => {
            if (isDrawing) {
                e.preventDefault();
                isDrawing = false;
            }
        };

        // Attach listeners and track them for cleanup
        const add = (el, ev, fn, opts) => {
            el.addEventListener(ev, fn, opts || false);
            listeners.push({ el, ev, fn, opts });
        };

        add(canvas, 'mousedown', startDrawing);
        add(canvas, 'mousemove', draw);
        add(canvas, 'mouseup', stopDrawing);
        add(canvas, 'mouseout', stopDrawing);

        add(canvas, 'touchstart', startDrawing, { passive: false });
        add(canvas, 'touchmove', draw, { passive: false });
    add(canvas, 'touchend', stopDrawing, { passive: false });
    console.log('initCanvas: listeners attached:', listeners.map(l => l.ev).join(','));
    };

    // Start setup (may wait for layout)
    setupCanvas();

    // Return cleanup function
    return () => {
        if (rafId) cancelAnimationFrame(rafId);
        try { if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; } } catch (e) {}
        listeners.forEach(({ el, ev, fn, opts }) => {
            try { el.removeEventListener(ev, fn, opts || false); } catch (e) { /* ignore */ }
        });
    };
};

window.clearCanvas = (canvas, darkMode = false) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ALWAYS refill with WHITE background for professional signatures
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

window.isCanvasBlank = (canvas) => {
    if (!canvas) return true;
    
    const ctx = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(
        ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    
    return !pixelBuffer.some(color => color !== 0);
};

window.getCanvasDataURL = (canvas) => {
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
};

// Normalize worker name (nome + cognome): trim, collapse spaces, lowercase
window.normalizeWorkerName = function(nome, cognome) {
    const cleanNome = (nome || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const cleanCognome = (cognome || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return `${cleanNome} ${cleanCognome}`.replace(/\s+/g, ' ').trim();
};
