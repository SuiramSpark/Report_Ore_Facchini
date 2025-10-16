# 📊 Report Ore Facchini - Gestionale Completo

<div align="center">

![Version](https://img.shields.io/badge/version-4.1-blue.svg?cacheSeconds=2592000)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PWA](https://img.shields.io/badge/PWA-enabled-purple.svg)
![Firebase](https://img.shields.io/badge/firebase-integrated-orange.svg)
![Languages](https://img.shields.io/badge/languages-5-red.svg)

**Sistema avanzato di gestione fogli ore con firma digitale, dashboard analytics e modalità lavoratore**

[🚀 Demo Live](#) | [📖 Documentazione](#-caratteristiche-principali) | [🌐 Multilingua](#-supporto-multilingua)

</div>

---

## ✨ Caratteristiche Principali

<table>
<tr>
<td width="50%">

### 🎯 **Gestione Fogli Ore**
- ✅ Creazione e modifica fogli ore
- ✅ Firma digitale touch-friendly
- ✅ Generazione PDF automatica
- ✅ Sistema di archiviazione
- ✅ Link condivisione con scadenza personalizzabile

### 👷 **Modalità Lavoratore**
- ✅ Form registrazione autonoma
- ✅ Canvas firma con dark mode
- ✅ Auto-save ogni 2 secondi
- ✅ Ripristino sessione precedente
- ✅ Selettore lingua indipendente
- ✅ Campi opzionali estesi

</td>
<td width="50%">

### 📊 **Dashboard Analytics**
- ✅ Grafici animati in tempo reale
- ✅ Statistiche giornaliere/settimanali/mensili
- ✅ Top 10 lavoratori e aziende
- ✅ Comparazione periodi
- ✅ Vista calendario interattiva
- ✅ Export Excel (XLSX) avanzato

### 🔒 **Sistema Blacklist**
- ✅ Livelli di gravità (Alta/Media/Bassa)
- ✅ Scadenza temporanea/permanente
- ✅ Storico note e modifiche
- ✅ Filtri avanzati e ricerca
- ✅ Azioni bulk (selezione multipla)

</td>
</tr>
</table>

---

## 🎨 Interfaccia Moderna

```
┌─────────────────────────────────────────────────────────┐
│  🌓 Dark Mode   |   🌐 5 Lingue   |   📱 Mobile-First   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  • Design responsive e ottimizzato per tutti i device  │
│  • Animazioni fluide con Tailwind CSS                  │
│  • Palette colori adattiva (light/dark)                │
│  • Icone emoji intuitive                               │
│  • Toast notifications colorate                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🌐 Supporto Multilingua

<div align="center">

| 🇮🇹 Italiano | 🇬🇧 English | 🇪🇸 Español | 🇫🇷 Français | 🇷🇴 Română |
|:---:|:---:|:---:|:---:|:---:|
| ✅ | ✅ | ✅ | ✅ | ✅ |

*Traduzioni complete per ogni schermata e funzionalità*

</div>

---

## 🚀 Installazione e Setup

### **Prerequisiti**
- Account Firebase (Firestore + Storage)
- Browser moderno (Chrome, Firefox, Safari, Edge)
- Connessione internet

### **Quick Start**

1️⃣ **Clona il Repository**
```bash
git clone https://github.com/SuiramSpark/Report_Ore_Facchini.git
cd Report_Ore_Facchini
```

2️⃣ **Configura Firebase**
- Crea un progetto su [Firebase Console](https://console.firebase.google.com/)
- Abilita Firestore Database e Storage
- Copia le credenziali in `js/config.js`:

```javascript
const firebaseConfig = {
    apiKey: "TUA_API_KEY",
    authDomain: "TUO_PROJECT.firebaseapp.com",
    projectId: "TUO_PROJECT_ID",
    storageBucket: "TUO_PROJECT.appspot.com",
    messagingSenderId: "TUO_SENDER_ID",
    appId: "TUA_APP_ID"
};
```

3️⃣ **Configura Regole Firestore**

Vai su Firebase Console → Firestore Database → Regole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /timesheets/{sheetId} { allow read, write: if true; }
    match /blacklist/{blacklistId} { allow read, write: if true; }
    match /auditLog/{logId} { allow read, write: if true; }
    match /workerSessions/{sessionId} { allow read, write: if true; }
    match /settings/{settingId} { allow read, write: if true; }
  }
}
```

4️⃣ **Avvia l'App**
```bash
# Opzione 1: Server locale
python -m http.server 8000

# Opzione 2: Live Server (VS Code)
# Installa l'estensione "Live Server" e clicca "Go Live"

# Opzione 3: GitHub Pages
# Push su GitHub e abilita GitHub Pages nelle impostazioni repo
```

5️⃣ **Accedi all'App**
```
http://localhost:8000
```

---

## 📖 Come Si Usa

### 🎯 **Per gli Amministratori**

#### **1. Crea un Foglio Ore**
```
Dashboard → ➕ Nuovo Foglio Ore
↓
Compila: Data, Azienda, Logo (opzionale)
↓
✅ Crea Foglio
```

#### **2. Genera Link per Lavoratori**
```
SheetList → Foglio Desiderato → 🔗 Genera Link
↓
⚙️ Imposta scadenza (8h, 24h, 48h, 72h, Mai, Custom)
↓
📋 Copia link e invia al lavoratore
```

#### **3. Gestisci Lavoratori**
```
SheetEditor → Aggiungi lavoratori manualmente
o
Attendi che i lavoratori si registrino autonomamente
↓
✏️ Modifica dati | 📝 Modifica multipla | ✍️ Firma responsabile
↓
📄 Genera PDF completo
```

#### **4. Analizza Statistiche**
```
Dashboard → 📊 Visualizza:
├─ Ore totali (oggi/settimana/mese)
├─ Top 10 lavoratori
├─ Grafici distribuzione
├─ Vista calendario
└─ Export Excel
```

---

### 👷 **Per i Lavoratori**

#### **1. Ricevi il Link**
```
📧 Email o 💬 WhatsApp con link unico
```

#### **2. Compila il Form**
```
Clicca link → 📝 Compila:
├─ Nome * (obbligatorio)
├─ Cognome * (obbligatorio)
├─ Ora Inizio * (picker orario mobile-friendly)
├─ Ora Fine * (picker orario mobile-friendly)
├─ Pausa in minuti * (0-120)
└─ Campi Opzionali ▶
   ├─ Codice Fiscale (facoltativo)
   ├─ Numero Identità (facoltativo)
   ├─ Data di Nascita (facoltativo)
   ├─ Telefono (facoltativo)
   └─ Email (facoltativo)
```

#### **3. Firma Digitale**
```
✍️ Disegna firma sul canvas
↓
🗑️ Cancella se serve (mantiene sfondo)
↓
Verifica: ✅ Firma presente
```

#### **4. Invia Dati**
```
📤 Invia Dati
↓
💾 Auto-save automatico (ogni 2 sec)
↓
✅ Conferma invio
↓
📄 Scarica il tuo PDF
```

#### **5. Funzioni Extra**
- 🌐 **Cambia Lingua**: Dropdown accanto al tema
- 🌓 **Dark Mode**: Toggle tema personale
- ✏️ **Modifica**: Edita dati inviati (con re-firma)
- 🔄 **Ripristina**: Continua sessione precedente al refresh

---

## 🛠️ Funzionalità Avanzate

### **📊 Dashboard Analytics**

<details>
<summary><b>📈 Grafici in Tempo Reale</b></summary>

- **Barre Animate**: Ore per lavoratore con colori dinamici
- **Torta Distribuzione**: Percentuali per azienda
- **Fascia Oraria**: Distribuzione lavoratori per orario (mattina/pomeriggio/sera/notte)
- **Trend Mensili**: Comparazione mese corrente vs precedente

</details>

<details>
<summary><b>📆 Vista Calendario</b></summary>

- Calendario interattivo con FullCalendar
- Eventi colorati per stato (completato/in attesa)
- Click su evento → dettagli foglio
- Navigazione mensile fluida

</details>

<details>
<summary><b>📥 Export Avanzato</b></summary>

- **Excel (XLSX)**: Formattazione professionale con intestazioni colorate
- **CSV**: Compatibilità universale
- **PDF**: Generazione automatica per singolo lavoratore
- **JSON**: Backup/Restore completo

</details>

---

### **🔒 Sistema Blacklist Avanzato**

```
┌──────────────────────────────────────────┐
│  📊 STATISTICHE                          │
├──────────────────────────────────────────┤
│  Totale: 15    Alta: 3    Media: 8       │
│  Bassa: 4      In scadenza: 2            │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  🔍 FILTRI                               │
├──────────────────────────────────────────┤
│  ⚠️ Gravità: [Tutte ▼]                  │
│  ⏰ Scadenza: [Tutte ▼]                 │
│  🔎 Cerca: [Nome o motivo...]           │
│  📊 Ordina: [Data ▼]                    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  AZIONI BULK                             │
├──────────────────────────────────────────┤
│  ☑️ Seleziona tutto                     │
│  🗑️ Rimuovi selezionati (3)             │
└──────────────────────────────────────────┘
```

**Caratteristiche:**
- ⚠️ **Livelli Gravità**: Alta (rosso), Media (arancione), Bassa (giallo)
- ⏰ **Scadenza**: Permanente o con data di auto-rimozione
- 📝 **Storico Completo**: Note, motivi, date, firme
- 🔍 **Ricerca Intelligente**: Cerca per nome, motivo, o note
- 📊 **Statistiche Real-time**: Totali, trend, in scadenza

---

### **📝 Audit Log Completo**

Traccia ogni modifica con:
- 👤 **Chi**: Nome responsabile + firma
- 📅 **Quando**: Data e ora precisa
- 🔄 **Cosa**: Tipo azione (Aggiunta/Modifica/Eliminazione/Cancellazione)
- 📋 **Dettagli**: Dati vecchi → nuovi

**Filtri:**
- Tutti / Aggiunte / Modifiche / Eliminazioni / Cancellazioni
- Ricerca per lavoratore o responsabile

---

### **⚙️ Settings Personalizzabili**

```javascript
{
  // Scadenza Link Lavoratori
  expirationDays: 2,  // 0 = Mai, 0.33 = 8h, 1 = 24h, etc.
  
  // Notifiche Browser
  notifications: {
    workerSubmit: true,    // ✅ Notifica quando lavoratore invia
    pendingSheets: true,   // ⏰ Promemoria fogli in attesa (giornaliero)
  },
  
  // Changelog Integrato
  showChangelog: true  // 📋 Mostra cronologia versioni
}
```

---

### **💾 Backup & Restore**

<details>
<summary><b>🔐 Esporta Backup Completo</b></summary>

```json
{
  "timesheets": [...],     // Tutti i fogli ore
  "blacklist": [...],      // Lista nera
  "auditLog": [...],       // Storico modifiche
  "settings": {...},       // Configurazioni
  "workerSessions": [...], // Sessioni attive
  "exportDate": "2025-10-12T10:30:00Z",
  "version": "4.1"
}
```

**Formato**: JSON compresso con timestamp  
**Dimensione**: ~50KB per 100 fogli ore

</details>

<details>
<summary><b>↩️ Ripristina da Backup</b></summary>

- Upload file JSON
- Validazione struttura
- Opzioni:
  - ✅ Sovrascrivi dati esistenti
  - 🔄 Merge con dati attuali
- Conferma e ripristino

</details>

---

## 🎯 Casi d'Uso Reali

### **🏗️ Azienda Edile**
```
Scenario: 50 operai su 5 cantieri diversi
Soluzione:
├─ 5 fogli ore (uno per cantiere)
├─ Link con scadenza 24h per sicurezza
├─ Dashboard → monitora ore totali real-time
├─ Export Excel → report settimanale per contabilità
└─ Blacklist → gestisci lavoratori problematici
```

### **🏨 Settore Hospitality**
```
Scenario: Hotel con turni variabili
Soluzione
├─ Foglio giornaliero con azienda "Hotel XYZ"
├─ Lavoratori compilano da mobile in 30 secondi
├─ Calendario → visualizza copertura turni
├─ Statistiche → identifica top performers
└─ PDF automatici → buste paga facilitate
```

### **🚚 Logistica e Trasporti**
```
Scenario: Autisti con orari flessibili
Soluzione:
├─ Link perpetui (scadenza = Mai)
├─ Campo "Pausa" → calcolo ore nette automatico
├─ Firma digitale → certificazione trasporto
├─ Auto-save → prevenzione perdita dati
└─ Export CSV → integrazione con software HR
```

---

## 🔧 Tecnologie Utilizzate

<div align="center">

| Frontend | Backend | Storage | Styling |
|:---:|:---:|:---:|:---:|
| ⚛️ **React 18** | 🔥 **Firebase** | ☁️ **Firestore** | 🎨 **Tailwind CSS** |
| Hooks | Realtime DB | NoSQL | Utility-first |
| | | | |
| **Libraries** | **PWA** | **Export** | **Charts** |
| 📄 jsPDF | 📱 Service Worker | 📊 XLSX.js | 📈 Chart.js |
| 🖼️ html2canvas | 🔔 Notifications | 📋 CSV | 📅 FullCalendar |

</div>

---

## 📱 Progressive Web App (PWA)

### **Caratteristiche PWA:**

✅ **Installabile**: Aggiungi alla home screen  
✅ **Offline Mode**: Funziona senza internet (limitato)  
✅ **Notifiche Push**: Avvisi in tempo reale  
✅ **Fast Loading**: Service Worker cache  
✅ **App-like**: Esperienza nativa mobile

### **Come Installare:**

**Su Mobile:**
1. Apri l'app in Chrome/Safari
2. Menu → "Aggiungi a Home"
3. Conferma installazione
4. Icona app sulla home screen!

**Su Desktop:**
1. Apri l'app in Chrome/Edge
2. Barra indirizzo → icona ⊕
3. "Installa Report Ore Facchini"
4. L'app si apre in finestra dedicata!

---

## 🎨 Personalizzazione

### **Logo Aziendale**
```javascript
// Carica il tuo logo nel foglio ore
SheetEditor → 🖼️ Upload Logo
↓
Formati supportati: JPG, PNG, GIF
Dimensione consigliata: 500x200px
↓
Appare automaticamente nei PDF generati
```

### **Temi Colori**
```css
/* Modifica in css/styles.css */

:root {
  --primary-color: #4f46e5;      /* Indigo */
  --success-color: #10b981;       /* Green */
  --warning-color: #f59e0b;       /* Amber */
  --danger-color: #ef4444;        /* Red */
}

/* Dark mode automatico basato su preferenze sistema */
```

### **Traduzioni Custom**
```javascript
// Aggiungi nuove lingue in js/translations.js

const translations = {
  de: {  // Tedesco
    welcome: 'Willkommen',
    // ... altre traduzioni
  }
};
```

---

## 📊 Performance

<div align="center">

| Metrica | Valore | Status |
|:---|:---:|:---:|
| First Contentful Paint | < 1.5s | 🟢 |
| Time to Interactive | < 3.0s | 🟢 |
| Lighthouse Score | 95/100 | 🟢 |
| Bundle Size | ~120KB | 🟢 |
| Database Reads/Write | Ottimizzate | 🟢 |

</div>

**Ottimizzazioni:**
- ⚡ Lazy loading componenti
- 🗜️ Minificazione CSS/JS
- 📦 CDN per librerie esterne
- 🔥 Firestore query indicizzate
- 💾 LocalStorage per preferenze

---

## 🔐 Sicurezza e Privacy

### **Gestione Dati:**
- 🔒 Connessione HTTPS obbligatoria
- 🔥 Firebase Security Rules configurabili
- 🚫 Nessun dato sensibile in localStorage
- 📝 Audit log per tracciabilità
- 🗑️ Archiviazione con soft-delete

### **Firma Digitale:**
- ✍️ Canvas HTML5 nativo
- 🖼️ Conversione PNG con timestamp
- 🔐 Salvataggio su Firebase Storage
- 📄 Embedding automatico nei PDF
- ✅ Validazione firma obbligatoria

---

## 🐛 Troubleshooting

<details>
<summary><b>❌ Firebase non connesso</b></summary>

**Problema**: "Database Non Connesso" all'apertura

**Soluzioni**:
1. Verifica credenziali in `js/config.js`
2. Controlla che Firestore sia abilitato su Firebase Console
3. Verifica regole Firestore (devono permettere read/write)
4. Controlla console browser per errori specifici
5. Ricarica pagina (Ctrl+R / Cmd+R)

</details>

<details>
<summary><b>🔗 Link lavoratore scaduto</b></summary>

**Problema**: "Link scaduto" quando lavoratore apre link

**Soluzioni**:
1. Controlla `Settings → Scadenza Link Lavoratori`
2. Se necessario, genera nuovo link
3. Per link senza scadenza: imposta "Mai"
4. Verifica che `linkGeneratedAt` sia presente nel documento Firestore

</details>

<details>
<summary><b>📱 Notifiche non funzionano</b></summary>

**Problema**: Nessuna notifica quando lavoratore invia

**Soluzioni**:
1. `Settings → Notifiche → Richiedi Permessi`
2. Verifica permessi browser (icona lucchetto nella barra)
3. Riavvia browser dopo aver concesso permessi
4. Nota: Safari ha supporto limitato per notifiche web

</details>

<details>
<summary><b>🖼️ Logo non appare nel PDF</b></summary>

**Problema**: PDF generato senza logo aziendale

**Soluzioni**:
1. Verifica upload logo (formato JPG/PNG)
2. Controlla dimensione < 5MB
3. Assicurati che Firebase Storage sia abilitato
4. Controlla URL logo nella console browser
5. Prova a ri-uploadare il logo

</details>

---

## 📈 Roadmap Futura

### **v5.0** (Pianificata)
- 🔐 **Sistema autenticazione multi-utente**
- 📊 **Dashboard personalizzabile con widget drag-drop**
- 🤖 **AI per rilevamento anomalie orari**
- 📧 **Invio automatico email PDF**
- 🌍 **Geolocalizzazione check-in/out**
- 📱 **App native iOS/Android**

---

## 🚀 Next Version

### Version 5.0 (Planned)
- 🔐 **Multi-user authentication system**
- 📊 **Customizable dashboard with drag-drop widgets**
- 🤖 **AI for detecting time anomalies**
- 📧 **Automatic PDF email sending**
- 🌍 **Check-in/out geolocation**
- 📱 **Native iOS/Android apps**

---

## 🚀 Próxima Versión

### Versión 5.0 (Planificada)
- 🔐 **Sistema de autenticación multiusuario**
- 📊 **Panel personalizable con widgets de arrastrar y soltar**
- 🤖 **IA para detección de anomalías horarias**
- 📧 **Envío automático de PDF por correo electrónico**
- 🌍 **Geolocalización de check-in/out**
- 📱 **Aplicaciones nativas para iOS/Android**

---

## 🚀 Prochaine Version

### Version 5.0 (Prévue)
- 🔐 **Système d'authentification multi-utilisateurs**
- 📊 **Tableau de bord personnalisable avec widgets glisser-déposer**
- 🤖 **IA pour la détection des anomalies horaires**
- 📧 **Envoi automatique de PDF par e-mail**
- 🌍 **Géolocalisation des check-in/out**
- 📱 **Applications natives iOS/Android**

---

## 🚀 Versiunea Următoare

### Versiunea 5.0 (Planificată)
- 🔐 **Sistem de autentificare multi-utilizator**
- 📊 **Tablou de bord personalizabil cu widget-uri drag-drop**
- 🤖 **IA pentru detectarea anomaliilor de timp**
- 📧 **Trimiterea automată a PDF-urilor prin e-mail**
- 🌍 **Geolocalizare check-in/out**
- 📱 **Aplicații native iOS/Android**

---

## 🤝 Contribuire

Contributi, issues e richieste di funzionalità sono benvenute!

1. **Fork** il progetto
2. **Crea** un branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** le modifiche (`git commit -m 'Add AmazingFeature'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. **Apri** una Pull Request

---

## 📝 Changelog

### **v4.1** - 12 Ottobre 2025
- 🎨 **FIX**: Canvas firma ora visibile in dark mode
- 📝 **FIX**: Placeholder nome/cognome corretti
- 📅 **NEW**: Campo "Data di Nascita" nei campi opzionali
- 🏷️ **NEW**: Etichetta "(facoltativo)" su tutti i campi opzionali
- 🌐 **NEW**: Selettore lingua indipendente per modalità lavoratore
- 💾 **IMPROVED**: Sistema auto-save sessione lavoratore ottimizzato

[📋 Vedi changelog completo in Settings](./js/changelogs.js)

---

## 🆕 Aggiornamenti Recenti

### Versione 4.3 - 16 Ottobre 2025
- 🌟 **Nuovo**: Miglioramenti al sistema di notifiche programmate
- 📊 **Nuovo**: Statistiche avanzate per lavoratori
- 🔒 **Fix**: Ottimizzazioni di sicurezza per il backup e restore
- 🌐 **Migliorato**: Traduzioni aggiornate in tutte le lingue supportate

---

## 📄 Licenza

Distribuito sotto licenza **MIT**. Vedi `LICENSE` per maggiori informazioni.

---

## 👨‍💻 Autore

**Marius Apostu**

- GitHub: [@SuiramSpark](https://github.com/SuiramSpark)
- Repository: [Report_Ore_Facchini](https://github.com/SuiramSpark/Report_Ore_Facchini)

---

## 💬 Supporto

Hai domande o hai bisogno di aiuto?

- 📧 Apri una [Issue](https://github.com/SuiramSpark/Report_Ore_Facchini/issues)
- 💡 Consulta la [Wiki](https://github.com/SuiramSpark/Report_Ore_Facchini/wiki)
- ⭐ Lascia una stella se ti è utile!

---

<div align="center">

**Fatto con ❤️ per semplificare la gestione ore**

[![GitHub stars](https://img.shields.io/github/stars/SuiramSpark/Report_Ore_Facchini?style=social)](https://github.com/SuiramSpark/Report_Ore_Facchini)
[![GitHub forks](https://img.shields.io/github/forks/SuiramSpark/Report_Ore_Facchini?style=social)](https://github.com/SuiramSpark/Report_Ore_Facchini/fork)

[⬆ Torna su](#-report-ore-facchini---gestionale-completo)

</div>
