const generatePDF = async (sheet, companyLogo = null) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    // --- Header blu compatto ---
    const HEADER_HEIGHT = 32;
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 297, HEADER_HEIGHT, 'F');

    // Logo: il doppio più largo, stessa altezza
    const logoW = 48, logoH = 16;
    if (companyLogo) {
        try {
            doc.addImage(companyLogo, 'PNG', 10, 8, logoW, logoH);
        } catch (e) { console.error('Errore logo:', e); }
    }

    // Titolo a destra del logo, font 14
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(sheet.titoloAzienda || 'REGISTRO ORE', 10 + logoW + 6, 18);

    // --- Info DATA/RESPONSABILE/LOCALITA ---
    // Simmetria: titoli e dati allineati a griglia
    // Colonna titoli (campo): 20, colonna valori: 55
    let y = HEADER_HEIGHT + 14;
    const colTitle = 20, colValue = 55, rowGap = 9;

    // Determina se la data è festiva (sabato o domenica)
    const dt = new Date(sheet.data);
    const isHoliday = dt.getDay() === 0 || dt.getDay() === 6;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Data:', colTitle, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);

    if (isHoliday) {
        doc.setTextColor(220, 38, 38); // rosso
    } else {
        doc.setTextColor(0, 0, 0);
    }
    doc.text(formatDate(sheet.data), colValue, y);

    y += rowGap;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Responsabile:', colTitle, y);
    doc.setFont(undefined, 'normal');
    doc.text(sheet.responsabile || '', colValue, y);

    y += rowGap;
    doc.setFont(undefined, 'bold');
    doc.text('Località:', colTitle, y);
    doc.setFont(undefined, 'normal');
    doc.text(sheet.location || '', colValue, y);

    // --- Tabella subito sotto, con spazio ---
    y += rowGap + 2;

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

    // --- Tabella dati lavoratori ---
    const rowHeight = 30;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    sheet.lavoratori?.forEach((worker, i) => {
        if (y > 170) { doc.addPage(); y = 20; }
        if (i % 2 === 0) {
            doc.setFillColor(243, 244, 246);
            doc.rect(12, y, 273, rowHeight, 'F');
        }
        doc.text(`${worker.nome} ${worker.cognome}`, xCols[0], y + 8);
        doc.text(worker.oraIn, xCols[1], y + 8);
        doc.text(worker.oraOut, xCols[2], y + 8);
        doc.text(`${worker.pausaMinuti || 0}min`, xCols[3], y + 8);
        doc.setFont(undefined, 'bold');
        doc.text(worker.oreTotali + 'h', xCols[4], y + 8);
        doc.setFont(undefined, 'normal');
        // Firma lavoratore in fondo alla cella "Firma"
        if (worker.firma) {
            try {
                doc.addImage(worker.firma, 'PNG', xCols[5], y + 14, 38, 12);
            } catch (e) { console.error('Errore firma:', e); }
        }
        y += rowHeight;
    });

    // --- Firma responsabile: sotto la scritta, metà larghezza, 25% meno alta ---
    y += 12;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Firma Responsabile:', 14, y);
    if (sheet.firmaResponsabile) {
        try {
            doc.addImage(sheet.firmaResponsabile, 'PNG', 14, y + 3, 30, 16.5);
        } catch (e) { console.error('Errore firma responsabile:', e); }
    }

    const fileName = `registro_${sheet.titoloAzienda}_${sheet.data}.pdf`;
    doc.save(fileName);
    showToast('📄 PDF generato con successo!', 'success');
};
