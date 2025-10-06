const generatePDF = async (sheet, companyLogo = null) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    // --- Header blu compatto ---
    const HEADER_HEIGHT = 24;
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 297, HEADER_HEIGHT, 'F');

    // Logo
    if (companyLogo) {
        try {
            doc.addImage(companyLogo, 'PNG', 10, 4, 24, 16);
        } catch (e) { console.error('Errore logo:', e); }
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(sheet.titoloAzienda || 'REGISTRO ORE', companyLogo ? 40 : 15, 16);

    // --- Info DATA/RESPONSABILE/LOCALITA ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13); doc.setFont(undefined, 'bold');
    let y = HEADER_HEIGHT + 12;
    doc.text('Data:', 12, y);
    doc.setFont(undefined, 'normal'); doc.setFontSize(12);
    doc.text(`${formatDate(sheet.data)}`, 35, y);

    y += 8; doc.setFont(undefined, 'bold'); doc.setFontSize(13);
    doc.text('Responsabile:', 12, y);
    doc.setFont(undefined, 'normal'); doc.setFontSize(12);
    doc.text(sheet.responsabile || '', 48, y);

    y += 8; doc.setFont(undefined, 'bold'); doc.setFontSize(13);
    doc.text('Località:', 12, y);
    doc.setFont(undefined, 'normal'); doc.setFontSize(12);
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
    const rowHeight = 30; // RIGA PIU' ALTA per la firma in fondo
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    sheet.lavoratori?.forEach((worker, i) => {
        if (y > 170) { doc.addPage(); y = 20; }
        if (i % 2 === 0) {
            doc.setFillColor(243, 244, 246);
            doc.rect(12, y, 273, rowHeight, 'F');
        }
        // Nome e dati in alto
        doc.text(`${worker.nome} ${worker.cognome}`, xCols[0], y + 8);
        doc.text(worker.oraIn, xCols[1], y + 8);
        doc.text(worker.oraOut, xCols[2], y + 8);
        doc.text(`${worker.pausaMinuti || 0}min`, xCols[3], y + 8);
        doc.setFont(undefined, 'bold');
        doc.text(worker.oreTotali + 'h', xCols[4], y + 8);
        doc.setFont(undefined, 'normal');
        // Firma lavoratore in fondo alla cella
        if (worker.firma) {
            try {
                // Firma centrata in verticale nella cella "Firma"
                doc.addImage(worker.firma, 'PNG', xCols[5], y + 14, 38, 12);
            } catch (e) { console.error('Errore firma:', e); }
        }
        y += rowHeight;
    });

    // --- Firma responsabile ---
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Firma Responsabile:', 14, y);
    if (sheet.firmaResponsabile) {
        try {
            doc.addImage(sheet.firmaResponsabile, 'PNG', 48, y - 8, 60, 22);
        } catch (e) { console.error('Errore firma responsabile:', e); }
    }

    const fileName = `registro_${sheet.titoloAzienda}_${sheet.data}.pdf`;
    doc.save(fileName);
    showToast('📄 PDF generato con successo!', 'success');
};
