# 🔗 Test Link Worker Mode

## Come Testare il Link Lavoratore

### 1. Genera il Link
1. Apri l'app in modalità Admin
2. Vai su "Fogli Ore" (SheetList)
3. Clicca su un foglio esistente (o creane uno nuovo)
4. Clicca sul pulsante **"📋 Genera Link Lavoratore"**
5. Il link verrà copiato negli appunti

### 2. Verifica il Link Generato
Il link dovrebbe essere nel formato:
```
http://[tuo-dominio]/[percorso]/index.html?mode=worker&sheet=[ID-FOGLIO]
```

Oppure se aperto localmente:
```
file:///C:/Users/.../index.html?mode=worker&sheet=[ID-FOGLIO]
```

### 3. Testa il Link
- Incolla il link in una nuova finestra/tab del browser
- Oppure invialo ad un dispositivo mobile
- Dovresti vedere il **Form Lavoratore** con:
  - ✅ Logo dell'azienda
  - ✅ Campi nome, cognome
  - ✅ Orari (inizio, fine, pausa)
  - ✅ Canvas firma
  - ✅ Campi opzionali (codice fiscale, telefono, etc.)

### 4. Debug Console
Apri la console del browser (F12) e controlla i log:
```
🔍 URL Params: { urlMode: 'worker', urlSheet: '...' }
📍 Current URL: http://...
✅ Worker mode detected! Sheet ID: ...
```

### 5. Se Non Funziona

**Problema: Vedi la schermata Admin invece del form lavoratore**
- Verifica che il link contenga `?mode=worker&sheet=...`
- Controlla la console per i log di debug
- Assicurati che il file `js/components/WorkerMode.js` esista

**Problema: Link scaduto**
- Vai su Impostazioni → Link Lavoratore
- Controlla/modifica il tempo di scadenza
- Ri-genera il link

**Problema: "Foglio non trovato"**
- Verifica che il foglio ore esista ancora nel database
- Controlla l'ID del foglio nel link

## ✅ Fix Applicati

1. **✅ Aggiunto WorkerMode.js in index.html** - Script mancante!
2. **✅ Semplificato calcolo baseUrl** - Rimosso regex complesso
3. **✅ Aggiunti log di debug** - Per tracciare il routing
4. **✅ Verificato routing in app.js** - Controllo parametri URL funziona

## 📝 Note
- Il link è valido finché non scade (configurabile in Settings)
- Ogni volta che clicchi "Genera Link", viene aggiornato il timestamp `linkGeneratedAt`
- I lavoratori possono compilare il form anche se è già stato inviato (edit mode)
