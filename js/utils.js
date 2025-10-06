// Utilities Functions

// Toast Notification System
const showToast = (message, type = 'default') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = type === 'success' ? '#10B981' : 
                            type === 'error' ? '#dc2626' : 
                            type === 'warning' ? '#f59e0b' : '#4f46e5';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
};

// Calculate Hours Between Times
const calculateHours = (oraIn, oraOut, pausaMinuti = 0) => {
    if (!oraIn || !oraOut) return '0.00';
    
    const [inH, inM] = oraIn.split(':').map(Number);
    const [outH, outM] = oraOut.split(':').map(Number);
    
    let diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle overnight shifts
    
    diffMinutes -= parseInt(pausaMinuti) || 0;
    
    return Math.max(0, diffMinutes / 60).toFixed(2);
};

// Format Date
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
};

// Format DateTime
const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Generate Share Link
const generateShareLink = (sheetId) => {
    const link = `${window.location.origin}${window.location.pathname}?mode=worker&sheet=${sheetId}`;
    navigator.clipboard.writeText(link)
        .then(() => {
            showToast('✅ Link copiato negli appunti!', 'success');
        })
        .catch(() => {
            prompt('Copia questo link:', link);
        });
};

// Initialize Canvas for Signature
const initCanvas = (canvas, darkMode = false) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = darkMode ? '#fff' : '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getCoordinates = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        return { x, y };
    };

    const startDrawing = (e) => {
        drawing = true;
        const { x, y } = getCoordinates(e);
        lastX = x;
        lastY = y;
        ctx.beginPath();
        ctx.moveTo(x, y);
        e.preventDefault();
    };

    const draw = (e) => {
        if (!drawing) return;
        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastX = x;
        lastY = y;
        e.preventDefault();
    };

    const stopDrawing = () => {
        drawing = false;
    };

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    
    return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
    };
};

// Clear Canvas
const clearCanvas = (canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

// Check if Canvas is Blank
const isCanvasBlank = (canvas) => {
    if (!canvas) return true;
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    return canvas.toDataURL() === blank.toDataURL();
};

// Get Statistics from Sheets
const getStatistics = (sheets) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let weeklyHours = 0;
    let monthlyHours = 0;
    const workerHours = {};
    
    sheets.forEach(sheet => {
        const sheetDate = new Date(sheet.data);
        
        sheet.lavoratori?.forEach(worker => {
            const hours = parseFloat(worker.oreTotali) || 0;
            
            // Weekly hours
            if (sheetDate >= weekAgo) {
                weeklyHours += hours;
            }
            
            // Monthly hours
            if (sheetDate >= monthAgo) {
                monthlyHours += hours;
            }
            
            // Worker totals
            const workerName = `${worker.nome} ${worker.cognome}`;
            workerHours[workerName] = (workerHours[workerName] || 0) + hours;
        });
    });
    
    // Top 3 workers
    const topWorkers = Object.entries(workerHours)
        .map(([name, hours]) => ({ name, hours }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 3);
    
    return {
        weeklyHours,
        monthlyHours,
        topWorkers
    };
};

// Generate PDF
const generatePDF = async (sheet, companyLogo = null) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header Background
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Company Logo
    if (companyLogo) {
        try {
            doc.addImage(companyLogo, 'PNG', 10, 5, 30, 30);
        } catch (e) {
            console.error('Errore caricamento logo:', e);
        }
    }
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(sheet.titoloAzienda || 'REGISTRO ORE', companyLogo ? 45 : 10, 25);
    
    // Sheet Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    let y = 50;
    doc.text(`Data: ${formatDate(sheet.data)}`, 10, y);
    doc.text(`Responsabile: ${sheet.responsabile}`, 10, y + 10);
    doc.text(`Località: ${sheet.location || 'N/A'}`, 10, y + 20);
    
    y += 35;
    
    // Table Header
    doc.setFillColor(59, 130, 246);
    doc.rect(10, y, 190, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Nome', 12, y + 7);
    doc.text('Ora In', 70, y + 7);
    doc.text('Ora Out', 95, y + 7);
    doc.text('Pausa', 125, y + 7);
    doc.text('Tot Ore', 150, y + 7);
    doc.text('Firma', 175, y + 7);
    
    y += 10;
    
    // Workers
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    
    sheet.lavoratori?.forEach((worker, i) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        
        // Alternate row colors
        if (i % 2 === 0) {
            doc.setFillColor(243, 244, 246);
            doc.rect(10, y, 190, 25, 'F');
        }
        
        doc.text(`${worker.nome} ${worker.cognome}`, 12, y + 7);
        doc.text(worker.oraIn, 70, y + 7);
        doc.text(worker.oraOut, 95, y + 7);
        doc.text(`${worker.pausaMinuti || 0}min`, 125, y + 7);
        doc.setFont(undefined, 'bold');
        doc.text(worker.oreTotali + 'h', 150, y + 7);
        doc.setFont(undefined, 'normal');
        
        // Worker signature
        if (worker.firma) {
            try {
                doc.addImage(worker.firma, 'PNG', 12, y + 10, 30, 12);
            } catch (e) {
                console.error('Errore firma lavoratore:', e);
            }
        }
        
        y += 25;
    });
    
    // Supervisor Signature
    if (sheet.firmaResponsabile) {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        y += 10;
        doc.setFont(undefined, 'bold');
        doc.text('Firma Responsabile:', 10, y);
        try {
            doc.addImage(sheet.firmaResponsabile, 'PNG', 10, y + 5, 50, 20);
        } catch (e) {
            console.error('Errore firma responsabile:', e);
        }
    }
    
    // Save PDF
    const fileName = `registro_${sheet.titoloAzienda}_${sheet.data}.pdf`;
    doc.save(fileName);
    showToast('📄 PDF generato con successo!', 'success');
};

// Check Blacklist
const checkBlacklist = (workerData, blacklist) => {
    if (!workerData.codiceFiscale && !workerData.numeroIdentita) {
        return null;
    }
    
    return blacklist.find(bl => {
        if (workerData.codiceFiscale && bl.codiceFiscale === workerData.codiceFiscale) {
            return true;
        }
        if (workerData.numeroIdentita && bl.numeroIdentita === workerData.numeroIdentita) {
            return true;
        }
        return false;
    });
};
