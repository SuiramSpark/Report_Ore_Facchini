const generatePDF = async (sheet, companyLogo = null) => {
    // Usa A4 orizzontale per più spazio
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" }); // <-- ORIZZONTALE

    // HEADER
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 297, 40, 'F'); // Più largo!
    if (companyLogo) {
        try {
            doc.addImage(companyLogo, 'PNG', 10, 5, 50, 30); // Logo più largo
        } catch (e) {
            console.error('Errore logo:', e);
        }
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text(sheet.titoloAzienda || 'REGISTRO ORE', companyLogo ? 65 : 15, 25);

    // INFO
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    let y = 50;
    doc.text(`Data: ${formatDate(sheet.data)}`, 10, y);
    doc.text(`Responsabile: ${sheet.responsabile}`, 90, y);
    doc.text(`Località: ${sheet.location || 'N/A'}`, 180, y);

    y += 16;

    // TABELLA HEADER
    doc.setFillColor(59, 130, 246);
    doc.rect(10, y, 277, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Nome', 15, y + 8);
    doc.text('Ora In', 70, y + 8);
    doc.text('Ora Out', 100, y + 8);
    doc.text('Pausa', 130, y + 8);
    doc.text('Tot Ore', 160, y + 8);
    doc.text('Firma', 200, y + 8);

    y += 12;

    // TABELLA DATI
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    sheet.lavoratori?.forEach((worker, i) => {
        if (y > 180) { // Più spazio verticale in landscape
            doc.addPage();
            y = 20;
        }
        if (i % 2 === 0) {
            doc.setFillColor(243, 244, 246);
            doc.rect(10, y, 277, 22, 'F');
        }
        doc.text(`${worker.nome} ${worker.cognome}`, 15, y + 8);
        doc.text(worker.oraIn, 70, y + 8);
        doc.text(worker.oraOut, 100, y + 8);
        doc.text(`${worker.pausaMinuti || 0}min`, 130, y + 8);
        doc.setFont(undefined, 'bold');
        doc.text(worker.oreTotali + 'h', 160, y + 8);
        doc.setFont(undefined, 'normal');
        // Firma nella stessa riga, più larga!
        if (worker.firma) {
            try {
                doc.addImage(worker.firma, 'PNG', 200, y + 2, 50, 16);
            } catch (e) {
                console.error('Errore firma:', e);
            }
        }
        y += 22;
    });

    // FIRMA RESPONSABILE
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(13);
    doc.text('Firma Responsabile:', 10, y);
    if (sheet.firmaResponsabile) {
        try {
            doc.addImage(sheet.firmaResponsabile, 'PNG', 60, y - 8, 80, 28); // più largo!
        } catch (e) {
            console.error('Errore firma responsabile:', e);
        }
    }

    const fileName = `registro_${sheet.titoloAzienda}_${sheet.data}.pdf`;
    doc.save(fileName);
    showToast('📄 PDF generato con successo!', 'success');
};
