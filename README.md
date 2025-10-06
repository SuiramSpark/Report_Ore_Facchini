# 📋 Registro Ore Lavoratori - COMPLETO

Sistema completo di gestione fogli ore con Firebase, dark mode, multilingua e PDF generation.

## 🚀 Deploy su GitHub Pages

### Opzione 1: Caricamento Diretto
1. Crea una nuova repository su GitHub
2. Carica TUTTI i file mantenendo la struttura:
   ```
   /
   ├── index.html
   ├── css/
   │   └── styles.css
   └── js/
       ├── config.js
       ├── translations.js
       ├── utils.js
       ├── app.js
       └── components/
           ├── WorkerMode.js
           ├── Dashboard.js
           ├── Blacklist.js
           ├── AuditLog.js
           ├── SheetList.js
           ├── SheetEditor.js
           └── ReportManager.js
   ```
3. Vai su Settings > Pages
4. Seleziona branch "main" e cartella "/ (root)"
5. Clicca Save
6. L'app sarà disponibile su: `https://[tuo-username].github.io/[nome-repo]`

### Opzione 2: Git Push
```bash
git init
git add .
git commit -m "Initial commit - Registro Ore Completo"
git branch -M main
git remote add origin https://github.com/[tuo-username]/[nome-repo].git
git push -u origin main
```

Poi attiva GitHub Pages come sopra.

## ✨ Funzionalità Incluse

### 👨‍💼 Modalità Amministratore
- ✅ **Dashboard** con statistiche in tempo reale
- ✅ **Gestione Fogli Ore** - Crea, modifica, archivia, elimina
- ✅ **Blacklist** - Gestione lavoratori bannati con verifica automatica
- ✅ **Audit Log** - Registro completo di tutte le modifiche
- ✅ **Report PDF** - Settimanali, mensili e personalizzati
- ✅ **Firma Responsabile** - Canvas per firma digitale
- ✅ **Modifica Multipla** - Aggiorna più lavoratori contemporaneamente
- ✅ **Filtri e Ricerca** - Per data, azienda, status
- ✅ **Dark Mode** - Tema scuro/chiaro persistente
- ✅ **Multi-lingua** - IT/EN/ES

### 👷 Modalità Lavoratore
- ✅ **Registrazione Ore** - Form intuitivo
- ✅ **Firma Digitale** - Canvas touch-friendly
- ✅ **Campi Opzionali** - CF, CI, telefono, email, indirizzo
- ✅ **Controllo Blacklist** - Avviso automatico se in lista
- ✅ **Riepilogo** - Visualizzazione dati inviati
- ✅ **Notifica Completamento** - Quando il responsabile firma

### 📄 Generazione PDF
- ✅ PDF Singoli per ogni foglio completato
- ✅ Report aggregati (settimanali/mensili)
- ✅ Logo aziendale personalizzato
- ✅ Firme digitali integrate
- ✅ Tabelle formattate professionalmente

### 🔥 Firebase Integration
- ✅ Real-time Database (Firestore)
- ✅ Storage per logo e firme
- ✅ Sincronizzazione automatica
- ✅ Listener per aggiornamenti live

## 🎨 Temi e Lingue

### Dark Mode
- Toggle automatico nel header
- Persistente tramite localStorage
- Applica a tutti i componenti

### Lingue Disponibili
- 🇮🇹 Italiano (default)
- 🇬🇧 English
- 🇪🇸 Español

## 📱 Responsive Design

Completamente ottimizzato per:
- 📱 Mobile (touch-friendly)
- 💻 Tablet
- 🖥️ Desktop

## 🔧 Configurazione

### Firebase (Già Configurato)
Il file `js/config.js` contiene già la configurazione Firebase.

Per usare il TUO Firebase:
1. Vai su https://console.firebase.google.com
2. Crea un nuovo progetto
3. Abilita Firestore Database
4. Sostituisci le credenziali in `js/config.js`:
   ```javascript
   const FIREBASE_CONFIG = {
       apiKey: "TUA_API_KEY",
       authDomain: "TUO_PROJECT.firebaseapp.com",
       projectId: "TUO_PROJECT_ID",
       // ... altre chiavi
   };
   ```

### Logo Aziendale
- Upload direttamente dall'interfaccia (icona 🖼️)
- Salvato in localStorage
- Appare su PDF e header

## 🔗 Link Condivisione

Per permettere ai lavoratori di registrare ore:
1. Crea un foglio ore
2. Clicca "🔗 Genera Link"
3. Il link viene copiato automaticamente
4. Condividi con i lavoratori

Formato link: `https://tuo-sito.github.io?mode=worker&sheet=SHEET_ID`

## 📊 Struttura Dati Firebase

### Collection: timesheets
```javascript
{
  id: "auto-generated",
  data: "2025-01-15",
  titoloAzienda: "Azienda Cliente",
  location: "Roma",
  responsabile: "Mario Rossi",
  note: "Note opzionali",
  lavoratori: [
    {
      id: 1234567890,
      nome: "Giovanni",
      cognome: "Bianchi",
      oraIn: "08:00",
      oraOut: "17:00",
      pausaMinuti: "30",
      oreTotali: "8.50",
      firma: "data:image/png;base64...",
      codiceFiscale: "BNCGNN...",
      // ... altri campi opzionali
    }
  ],
  firmaResponsabile: "data:image/png;base64...",
  status: "completed", // o "draft"
  archived: false,
  createdAt: "2025-01-15T10:00:00.000Z"
}
```

### Collection: blacklist
```javascript
{
  id: "auto-generated",
  nome: "Nome",
  cognome: "Cognome",
  codiceFiscale: "...",
  numeroIdentita: "...",
  telefono: "...",
  reason: "Motivo blacklist",
  addedAt: "2025-01-15T10:00:00.000Z",
  addedBy: "Admin"
}
```

### Collection: auditLog
```javascript
{
  id: "auto-generated",
  action: "WORKER_ADD", // WORKER_ADD, SHEET_EDIT, etc.
  details: "Dettagli azione",
  timestamp: "2025-01-15T10:00:00.000Z",
  user: "Admin"
}
```

## 🐛 Troubleshooting

### PDF non si genera
- Verifica che jsPDF sia caricato correttamente
- Controlla la console per errori

### Firebase non si connette
- Verifica le credenziali in `config.js`
- Controlla le regole Firestore
- Verifica che Firestore sia abilitato

### Link lavoratori non funziona
- Assicurati che l'URL includa i parametri: `?mode=worker&sheet=ID`
- Verifica che lo sheet ID esista in Firebase

### Dark mode non persiste
- Controlla che il browser supporti localStorage
- Verifica che non ci siano blocchi privacy

## 📈 Prossimi Sviluppi (Opzionali)

- [ ] Autenticazione utenti
- [ ] Export Excel
- [ ] Notifiche email
- [ ] App mobile nativa
- [ ] Geolocalizzazione check-in
- [ ] QR code per accesso rapido

## 💡 Suggerimenti

1. **Backup Regolare**: Esporta i dati da Firestore periodicamente
2. **Regole Firestore**: Configura le regole di sicurezza in produzione
3. **Custom Domain**: Configura un dominio personalizzato su GitHub Pages
4. **Analytics**: Aggiungi Google Analytics per tracciare l'utilizzo

## 📝 Licenza

Open Source - Usa liberamente per i tuoi progetti!

## 🤝 Supporto

Per problemi o domande:
1. Controlla la console del browser (F12)
2. Verifica i log Firebase
3. Controlla che tutti i file siano caricati correttamente

---

**Fatto con ❤️ per semplificare la gestione delle ore lavorative**
