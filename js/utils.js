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
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    
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

// Generate Share Link (ALWAYS CORRECT PATH)
const generateShareLink = (sheetId) => {
    const baseUrl = `${window.location.origin}/Report_Ore_Facchini`;
    const link = `${baseUrl}/?mode=worker&sheet=${sheetId}`;
    navigator.clipboard.writeText(link)
        .then(() => {
            showToast('✅ Link copiato negli appunti!', 'success');
        })
        .catch(() => {
            prompt('Copia questo link:', link);
        });
};

// Initialize Canvas for Signature - VERSIONE ULTRA-SEMPLICE CHE FUNZIONA SEMPRE
const initCanvas = (canvas) => {
    if (!canvas) {
        console.error('❌ Canvas è null!');
        return () => {};
    }
    
    console.log('🎨 Inizializzo canvas...');
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('❌ Context non disponibile!');
        return () => {};
    }
    
    // SETUP: Sfondo BIANCO, Linea NERA sempre
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        
        if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDraw = (e) => {
        isDrawing = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
        console.log('✏️ Inizio disegno');
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        e.preventDefault();
    };

    const stopDraw = (e) => {
        if (isDrawing) {
            isDrawing = false;
            console.log('🛑 Fine disegno');
        }
        if (e) e.preventDefault();
    };

    // Eventi
    canvas.addEventListener('mousedown', startDraw, false);
    canvas.addEventListener('mousemove', draw, false);
    canvas.addEventListener('mouseup', stopDraw, false);
    canvas.addEventListener('mouseleave', stopDraw, false);
    canvas.addEventListener('touchstart', startDraw, false);
    canvas.addEventListener('touchmove', draw, false);
    canvas.addEventListener('touchend', stopDraw, false);
    
    console.log('✅ Canvas OK!');
    
    return () => {
        canvas.removeEventListener('mousedown', startDraw);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDraw);
        canvas.removeEventListener('mouseleave', stopDraw);
        canvas.removeEventListener('touchstart', startDraw);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDraw);
    };
};

// Clear Canvas
const clearCanvas = (canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Ridisegna sfondo bianco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

// Check if Canvas is Blank
const isCanvasBlank = (canvas) => {
    if (!canvas) return true;
    
    const ctx = canvas.getContext('2d');
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    // Controlla se tutti i pixel sono bianchi
    for (let i = 0; i < pixelData.length; i += 4) {
        // Se trovi un pixel non bianco, il canvas non è vuoto
        if (pixelData[i] !== 255 || pixelData[i+1] !== 255 || pixelData[i+2] !== 255) {
            return false;
        }
    }
    
    return true;
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
            
            if (sheetDate >= weekAgo) {
                weeklyHours += hours;
            }
            
            if (sheetDate >= monthAgo) {
                monthlyHours += hours;
            }
            
            const workerName = `${worker.nome} ${worker.cognome}`;
            workerHours[workerName] = (workerHours[workerName] || 0) + hours;
        });
    });
    
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
    const doc = new jsPDF({ orientation: "landscape" });

    // --- Header blu compatto ---
    const HEADER_HEIGHT = 24; // era 40 o più, ora più compatto
    doc.setFillColor(59, 130, 246); // blu
    doc.rect(0, 0, 297, HEADER_HEIGHT, 'F');

    // Logo (più basso)
    if (companyLogo) {
        try {
            doc.addImage(companyLogo, 'PNG', 10, 4, 24, 16); // logo più compatto
        } catch (e) {
            console.error('Errore logo:', e);
        }
    }
    // Titolo in bold, più grande, accanto al logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(sheet.titoloAzienda || 'REGISTRO ORE', companyLogo ? 40 : 15, 16);

    // --- Info sezione DATA/RESPONSABILE/LOCALITA ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13); // titoli 2px più grandi
    doc.setFont(undefined, 'bold');

    let y = HEADER_HEIGHT + 12;
    doc.text('Data:', 12, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.text(`${formatDate(sheet.data)}`, 35, y);

    y += 8;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(13);
    doc.text('Responsabile:', 12, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.text(sheet.responsabile || '', 48, y);

    y += 8;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(13);
    doc.text('Località:', 12, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.text(sheet.location || '', 38, y);

    y += 12;

    // --- Tabella header ---
    doc.setFillColor(59, 130, 246);
    doc.rect(12, y, 273, 11, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    const xCols = [16, 80, 108, 136, 164, 196, 240]; // Firma spostata più a destra
    doc.text('Nome', xCols[0], y + 8);
    doc.text('Ora In', xCols[1], y + 8);
    doc.text('Ora Out', xCols[2], y + 8);
    doc.text('Pausa', xCols[3], y + 8);
    doc.text('Tot Ore', xCols[4], y + 8);
    doc.text('Firma', xCols[5], y + 8);

    y += 11;

    // --- Tabella dati lavoratori ---
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    sheet.lavoratori?.forEach((worker, i) => {
        if (y > 170) { doc.addPage(); y = 20; }
        if (i % 2 === 0) {
            doc.setFillColor(243, 244, 246);
            doc.rect(12, y, 273, 20, 'F');
        }
        // Nome
        doc.text(`${worker.nome} ${worker.cognome}`, xCols[0], y + 8);
        // Orari
        doc.text(worker.oraIn, xCols[1], y + 8);
        doc.text(worker.oraOut, xCols[2], y + 8);
        doc.text(`${worker.pausaMinuti || 0}min`, xCols[3], y + 8);
        doc.setFont(undefined, 'bold');
        doc.text(worker.oreTotali + 'h', xCols[4], y + 8);
        doc.setFont(undefined, 'normal');
        // Firma lavoratore (più a destra, allineata)
        if (worker.firma) {
            try {
                doc.addImage(worker.firma, 'PNG', xCols[5], y + 1, 38, 14); // più larga e nella cella giusta!
            } catch (e) {
                console.error('Errore firma:', e);
            }
        }
        y += 20;
    });

    // --- Firma responsabile ---
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Firma Responsabile:', 14, y);
    if (sheet.firmaResponsabile) {
        try {
            doc.addImage(sheet.firmaResponsabile, 'PNG', 48, y - 8, 60, 22); // più largo e ben allineato
        } catch (e) {
            console.error('Errore firma responsabile:', e);
        }
    }

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
