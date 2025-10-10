// Utilities Functions - VERSIONE COMPLETA DASHBOARD

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

// Generate Share Link con WEB SHARE API
const generateShareLink = async (sheetId) => {
    const baseUrl = `${window.location.origin}/Report_Ore_Facchini`;
    const link = `${baseUrl}/?mode=worker&sheet=${sheetId}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Registro Ore Lavoratori',
                text: 'Compila il tuo foglio ore:',
                url: link
            });
            showToast('✅ Link condiviso!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                copyToClipboard(link);
            }
        }
    } else {
        copyToClipboard(link);
    }
};

// Funzione helper per copiare negli appunti
const copyToClipboard = (link) => {
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
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

// Check if Canvas is Blank
const isCanvasBlank = (canvas) => {
    if (!canvas) return true;
    
    const ctx = canvas.getContext('2d');
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    for (let i = 0; i < pixelData.length; i += 4) {
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

// ========================================
// FUNZIONI DASHBOARD AVANZATA
// ========================================

// Calcolo statistiche avanzate per dashboard
const calculateAdvancedStats = (sheets, period = 'week') => {
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let weeklyHours = 0;
    let monthlyHours = 0;
    let todayHours = 0;
    let activeWorkers = new Set();
    const workerHours = {};
    const dailyHours = {};
    const companyHours = {};
    const hourlyDistribution = Array(24).fill(0);
    const locationHours = {};

    sheets.forEach(sheet => {
        const sheetDate = new Date(sheet.data);
        
        // Ore di oggi
        if (sheet.data === today) {
            sheet.lavoratori?.forEach(worker => {
                todayHours += parseFloat(worker.oreTotali) || 0;
            });
        }
        
        sheet.lavoratori?.forEach(worker => {
            const hours = parseFloat(worker.oreTotali) || 0;
            
            if (sheetDate >= weekAgo) {
                weeklyHours += hours;
            }
            
            if (sheetDate >= monthAgo) {
                monthlyHours += hours;
            }
            
            // Worker unici
            const workerKey = `${worker.nome} ${worker.cognome}`;
            activeWorkers.add(workerKey);
            
            // Ore per worker
            workerHours[workerKey] = (workerHours[workerKey] || 0) + hours;
            
            // Ore per azienda
            const companyKey = sheet.titoloAzienda || 'Non specificato';
            companyHours[companyKey] = (companyHours[companyKey] || 0) + hours;
            
            // Ore per location
            const locationKey = sheet.location || 'Non specificato';
            locationHours[locationKey] = (locationHours[locationKey] || 0) + hours;
            
            // Ore giornaliere
            const dateKey = sheet.data;
            dailyHours[dateKey] = (dailyHours[dateKey] || 0) + hours;
            
            // Distribuzione oraria
            if (worker.oraIn) {
                const hour = parseInt(worker.oraIn.split(':')[0]);
                hourlyDistribution[hour] += hours;
            }
        });
    });

    const topWorkers = Object.entries(workerHours)
        .map(([name, hours]) => ({ name, hours }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 10);

    const topCompanies = Object.entries(companyHours)
        .map(([name, hours]) => ({ name, hours }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5);

    const topLocations = Object.entries(locationHours)
        .map(([name, hours]) => ({ name, hours }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5);

    // Dati per grafico
    const days = period === 'week' ? 7 : 30;
    const chartData = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        chartData.push({
            date: dateStr,
            hours: dailyHours[dateStr] || 0,
            label: date.toLocaleDateString('it-IT', { 
                month: 'short', 
                day: 'numeric',
                weekday: days === 7 ? 'short' : undefined 
            })
        });
    }

    return {
        weeklyHours,
        monthlyHours,
        todayHours,
        activeWorkers: activeWorkers.size,
        totalSheets: sheets.length,
        completedSheets: sheets.filter(s => s.status === 'completed').length,
        draftSheets: sheets.filter(s => s.status === 'draft').length,
        archivedSheets: sheets.filter(s => s.archived).length,
        topWorkers,
        topCompanies,
        topLocations,
        chartData,
        hourlyDistribution,
        totalWorkers: Object.keys(workerHours).length,
        avgDailyHours: (monthlyHours / 30).toFixed(1),
        efficiency: sheets.length > 0 ? (sheets.filter(s => s.status === 'completed').length / sheets.length) * 100 : 0
    };
};

// Inizializza Chart.js per dashboard
const initDashboardCharts = (canvasId, chartType, data, darkMode) => {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js non caricato');
        return null;
    }

    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Distruggi chart esistente
    if (ctx.chart) {
        ctx.chart.destroy();
    }

    const textColor = darkMode ? '#fff' : '#333';
    const gridColor = darkMode ? '#374151' : '#E5E7EB';
    const borderColor = darkMode ? '#4B5563' : '#D1D5DB';

    const config = {
        type: chartType,
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColor,
                        font: {
                            size: window.innerWidth < 768 ? 9 : 11
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    ticks: {
                        color: textColor,
                        font: {
                            size: window.innerWidth < 768 ? 9 : 11
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    };

    ctx.chart = new Chart(ctx, config);
    return ctx.chart;
};

// Animazioni per elementi dashboard
const animateValue = (element, start, end, duration) => {
    if (!element) return;
    
    const startTime = performance.now();
    const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };
    
    requestAnimationFrame(step);
};

// Generate PDF 
const generatePDF = async (sheet, companyLogo = null) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    // Header blu compatto
    const HEADER_HEIGHT = 24;
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 297, HEADER_HEIGHT, 'F');

    // Logo
    if (companyLogo) {
        try {
            doc.addImage(companyLogo, 'PNG', 10, 4, 24, 16);
        } catch (e) {
            console.error('Errore logo:', e);
        }
    }

    // Titolo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(sheet.titoloAzienda || 'REGISTRO ORE', companyLogo ? 40 : 15, 16);

    // Info sezione
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
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

    // Tabella header
    doc.setFillColor(59, 130, 246);
    doc.rect(12, y, 273, 11, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    const xCols = [16, 80, 108, 136, 164, 196, 240];
    doc.text('Nome', xCols[0], y + 8);
    doc.text('Ora In', xCols[1], y + 8);
    doc.text('Ora Out', xCols[2], y + 8);
    doc.text('Pausa', xCols[3], y + 8);
    doc.text('Tot Ore', xCols[4], y + 8);
    doc.text('Firma', xCols[5], y + 8);

    y += 11;

    // Tabella dati lavoratori
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    sheet.lavoratori?.forEach((worker, i) => {
        if (y > 170) { doc.addPage(); y = 20; }
        if (i % 2 === 0) {
            doc.setFillColor(243, 244, 246);
            doc.rect(12, y, 273, 20, 'F');
        }
        doc.text(`${worker.nome} ${worker.cognome}`, xCols[0], y + 8);
        doc.text(worker.oraIn, xCols[1], y + 8);
        doc.text(worker.oraOut, xCols[2], y + 8);
        doc.text(`${worker.pausaMinuti || 0}min`, xCols[3], y + 8);
        doc.setFont(undefined, 'bold');
        doc.text(worker.oreTotali + 'h', xCols[4], y + 8);
        doc.setFont(undefined, 'normal');
        if (worker.firma) {
            try {
                doc.addImage(worker.firma, 'PNG', xCols[5], y + 1, 38, 14);
            } catch (e) {
                console.error('Errore firma:', e);
            }
        }
        y += 20;
    });

    // Firma responsabile
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Firma Responsabile:', 14, y);
    if (sheet.firmaResponsabile) {
        try {
            doc.addImage(sheet.firmaResponsabile, 'PNG', 48, y - 8, 60, 22);
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
