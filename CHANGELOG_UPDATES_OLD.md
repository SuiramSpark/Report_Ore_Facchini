# 📝 Changelog Aggiornamenti - Report Ore Facchini

Questo file tiene traccia di tutti gli aggiornamenti e modifiche apportate all'applicazione.

---

## 🗓️ 04 Novembre 2025

### 🎨 Colori Unici per Worker + Paginazione Grafico "Andamento Ore"

**Tipo:** Bug Fix + Feature  
**File modificato:** `js/components/Dashboard.js`  
**Righe:** 464-640

**Descrizione:**  
Risolto problema di colori duplicati nella stessa giornata e aggiunta paginazione intelligente per il grafico "Andamento ore".

**Problemi Risolti:**

**1. Colori Duplicati nella Stessa Riga** ❌→✅
- **Prima**: Ogni lavoratore aveva sempre lo stesso colore basato sul nome
- **Problema**: Nella stessa giornata potevano esserci colori identici
- **Dopo**: Ogni lavoratore ha un colore univoco PER GIORNATA
- **Algoritmo**: Hash deterministico + ricerca del primo colore non utilizzato nella riga

**2. Paginazione Giorni** 📅
- **Mostra 7 giorni** alla volta (primi 7 sempre visibili)
- **Pulsante "Mostra altro"** → aggiunge 7 giorni alla volta
- **Pulsante "Mostra meno"** → torna ai primi 7 giorni
- **Ciclo completo** fino a 31 giorni (o quanti disponibili)

**Dettagli tecnici:**  

**Colori Unici per Giorno:**
```javascript
const getUniqueColorForDay = (workerName, usedColors) => {
    const palette = [24 colori...];
    
    // Hash deterministico dal nome
    let hash = 0;
    for (let i = 0; i < workerName.length; i++) {
        hash = ((hash << 5) - hash) + workerName.charCodeAt(i);
    }
    
    // Cerca primo colore non usato in questa giornata
    const startIdx = Math.abs(hash) % palette.length;
    for (let i = 0; i < palette.length; i++) {
        const idx = (startIdx + i) % palette.length;
        const color = palette[idx];
        if (!usedColors.has(color)) {
            return color; // Trovato colore unico!
        }
    }
};

// Per ogni giorno traccia colori usati
const usedColors = new Set();
for (const wName in stats.workerMap) {
    const color = getUniqueColorForDay(wName, usedColors);
    usedColors.add(color); // Marca come usato
}
```

**Paginazione:**
```javascript
const [visibleDays, setVisibleDays] = React.useState(7);
const displayedDays = dayKeys.slice(0, visibleDays);

// Mostra altro: +7 giorni
setVisibleDays(prev => Math.min(prev + 7, dayKeys.length));

// Mostra meno: torna a 7
setVisibleDays(7);
```

**Comportamento:**
1. Grafico mostra i primi 7 giorni
2. Click "Mostra altro" → mostra giorni 1-14
3. Click "Mostra altro" → mostra giorni 1-21
4. Click "Mostra altro" → mostra giorni 1-28/30/31
5. Click "Mostra meno" → torna a giorni 1-7

**Vantaggi:**
- ✅ Mai colori duplicati nella stessa riga
- ✅ Ogni worker mantiene colore simile (hash deterministico)
- ✅ Grafico pulito e leggibile su mobile
- ✅ Caricamento più veloce (solo 7 giorni iniziali)
- ✅ Controllo utente su quanti giorni vedere

---

### 📅 Calendario: Colori Basati sullo Stato + Mobile-Friendly

**Tipo:** UI/UX Improvement + Feature  
**File modificato:** `js/components/Calendar.js`  
**Righe:** Multiple (27-170)

**Descrizione:**  
Migliorato il componente Calendario con colori distintivi basati sullo stato dei fogli e ottimizzazioni per dispositivi mobili.

**Nuove Funzionalità:**

**1. Colori in Base allo Stato**
- 📦 **Archiviati**: Grigio (priorità massima - anche se completato)
- ✅ **Completati**: Verde (solo se non archiviato)
- ✏️ **Bozza/Attivi**: Indaco

**2. Miglioramenti Mobile**
- Vista iniziale adattiva: `listWeek` su mobile, `dayGridMonth` su desktop
- Altezza calendario ottimizzata per mobile (500px vs 650px desktop)
- Eventi ridotti su mobile (2 max vs 4 desktop)
- Pulsanti toolbar semplificati su schermi piccoli

**3. Modernizzazione UI**
- Badge di stato con emoji su ogni evento (✏️/✅/📦)
- Legenda colorata con badge moderni
- Hover effects con scala e transizioni
- Indicatore "oggi" più visibile
- Border radius aumentato per eventi (8px)
- Migliore padding e spaziatura

**4. Interattività Migliorata**
- Effetto hover con scale 1.02
- Z-index dinamico su hover
- Transizioni fluide
- Migliore feedback visivo su touch

**Dettagli tecnici:**  
```javascript
// Colori basati su stato (archived ha priorità)
if (sheet.archived) {
    backgroundColor = '#6B7280'; // grigio
} else if (sheet.status === 'completed') {
    backgroundColor = '#10B981'; // verde
} else {
    backgroundColor = '#6366F1'; // indaco
}

// Responsive view
initialView: window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth'
```

**Legenda Moderna:**
```html
<!-- Badge con background, border e icone -->
<div class="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
    <div class="w-3 h-3 rounded-full bg-indigo-500"></div>
    <span>✏️ Bozza</span>
</div>
```

---

### 🎨 Palette Colori Estesa per Grafico "Andamento Ore"

**Tipo:** UI/UX Improvement  
**File modificato:** `js/utils.js`  
**Righe:** 250-275

**Descrizione:**  
Ampliata la palette di colori da 10 a 24 colori distinti e ben diversificati per evitare che lavoratori diversi abbiano lo stesso colore nel grafico "Andamento ore".

**Motivazione:**  
- Con molti lavoratori, i colori si ripetevano rendendo difficile distinguere le persone
- Senza tooltip, era impossibile capire chi aveva fatto quali ore
- La palette da 10 colori era insufficiente per team numerosi

**Miglioramenti:**  
- ✅ 24 colori distinti invece di 10
- ✅ Colori scelti per massima diversità visiva
- ✅ Migliore leggibilità del grafico con molti lavoratori

**Dettagli tecnici:**  
```javascript
// PRIMA: 10 colori (insufficienti)
const palette = [
    '#4f46e5', '#7c3aed', '#06b6d4', '#f97316', '#ef4444',
    '#10b981', '#eab308', '#3b82f6', '#8b5cf6', '#f472b6'
];

// DOPO: 24 colori diversificati
const palette = [
    '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
    '#EC4899', '#F97316', '#84CC16', '#14B8A6', '#6366F1', '#A855F7',
    '#F43F5E', '#FBBF24', '#34D399', '#22D3EE', '#60A5FA', '#A78BFA',
    '#F472B6', '#FB923C', '#A3E635', '#2DD4BF', '#818CF8', '#C084FC'
];
```

---

### 📱 Tooltip Mobile per Grafico "Andamento Ore"

**Tipo:** Feature  
**File modificato:** `js/components/Dashboard.js`  
**Righe:** 456-550

**Descrizione:**  
Implementati tooltip touch-friendly per il grafico "Andamento ore" che funzionano anche su dispositivi mobili e PWA.

**Motivazione:**  
- I tooltip nativi (attributo `title`) non funzionano su dispositivi touch
- Su mobile/PWA era impossibile vedere i dettagli dei segmenti colorati
- Gli utenti non sapevano quale lavoratore aveva fatto quante ore

**Funzionalità:**  
- ✅ **Desktop**: Tooltip su hover (funzionamento automatico)
- ✅ **Mobile/PWA**: Tooltip su tap/click (rimane visibile finché non si tocca altrove)
- ✅ Mostra nome lavoratore e ore lavorate
- ✅ Design responsive con freccia indicatrice
- ✅ Supporto tema scuro/chiaro

**Comportamento:**  
1. Su desktop: passa il mouse sopra un segmento colorato → tooltip appare
2. Su mobile: tocca un segmento colorato → tooltip appare e rimane visibile
3. Tocca altrove o tocca di nuovo → tooltip scompare

**Dettagli tecnici:**  
```javascript
// Stato per tooltip attivo
const [activeTooltip, setActiveTooltip] = React.useState(null);

// Click/tap su segmento
onClick={(e) => {
    e.stopPropagation();
    setActiveTooltip(isActive ? null : tooltipId);
}}

// Hover su desktop
onMouseEnter={() => {
    if (window.matchMedia('(hover: hover)').matches) {
        setActiveTooltip(tooltipId);
    }
}}
```

---

### 🔧 Correzione Logica Filtri Fogli

**Tipo:** Bug Fix  
**File modificato:** `js/components/SheetList.js`  
**Righe:** 45-50

**Descrizione:**  
Corretta la logica di filtro per i fogli nella sezione "Fogli". Ora i filtri funzionano correttamente secondo questa logica:
- **Tutti**: mostra tutti i fogli
- **Attivi**: mostra solo fogli non completati E non archiviati
- **Completati**: mostra solo fogli completati E non archiviati
- **Archiviati**: mostra solo fogli archiviati (indipendentemente dallo stato)

**Motivazione:**  
Il bug precedente mostrava i fogli archiviati anche nelle sezioni "Attivi" e "Completati", creando confusione. Quando un foglio completato veniva archiviato, compariva sia in "Completati" che in "Archiviati".

**Comportamento corretto:**  
- Se archivio un foglio completato → sparisce da "Completati" e appare solo in "Archiviati"
- Se archivio un foglio attivo → sparisce da "Attivi" e appare solo in "Archiviati"
- Ogni foglio appare in una sola sezione alla volta (eccetto "Tutti")

**Dettagli tecnici:**  
```javascript
// PRIMA (ERRATO):
if (filter === 'completed') {
    arr = arr.filter(s => s.status === 'completed'); // mostrava anche gli archiviati!
}

// DOPO (CORRETTO):
if (filter === 'completed') {
    arr = arr.filter(s => s.status === 'completed' && !s.archived);
}
```

---

### 🌐 Traduzioni Complete nella Sezione Notifiche

**Tipo:** UI/UX Improvement  
**File modificato:** `js/components/ScheduledNotifications.js`  
**Righe:** Multiple (283-542)

**Descrizione:**  
Rimossi tutti i fallback hardcoded in inglese dalla sezione "Notifiche Programmate", utilizzando solo le traduzioni già presenti nel file `it.json`.

**Motivazione:**  
- Alcuni titoli e etichette nella sezione notifiche mostravano testo in inglese come fallback
- Le traduzioni italiane erano già presenti nel file di localizzazione ma non venivano utilizzate
- Questo causava inconsistenze nell'interfaccia utente

**Testi tradotti:**  
- "Orario" (Time)
- "Messaggio Personalizzato" (Custom Message)  
- "Messaggi di esempio" (Example messages)
- "Giorni della Settimana" (Days of the Week)
- "Nuova Notifica" (New Notification)
- "Notifiche Attive" (Active Notifications)
- "Informazioni" (Information)
- E molti altri...

**Dettagli tecnici:**  
```javascript
// PRIMA (con fallback inglese):
{t.timeLabel || (language === 'it' ? 'Orario' : 'Time')}

// DOPO (solo traduzione):
{t.timeLabel}
```

---

### ✅ Rimozione Pulsante "Aggiungi Logo" dalla Dashboard

**Tipo:** UI/UX Improvement  
**File modificato:** `js/app.js`  
**Righe:** 578-592

**Descrizione:**  
Rimosso il pulsante duplicato "Aggiungi Logo" (🖼️) dall'header della Dashboard, poiché causava confusione essendo presente sia nella Dashboard che nelle Impostazioni.

**Motivazione:**  
- Il pulsante era presente in due posizioni diverse
- La presenza nella Dashboard era considerata fastidiosa e ridondante
- La funzionalità rimane disponibile nella sezione Impostazioni, dove è più appropriata

**Dettagli tecnici:**  
```javascript
// RIMOSSO:
<label className={...} title={t.uploadLogo}>
    🖼️
    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
</label>
```

**Dove trovare la funzionalità:**  
Il pulsante "Aggiungi Logo" rimane disponibile in:
- **Impostazioni** → Sezione "🖼️ Logo Aziendale"

---

## 📋 Template per Future Modifiche

```markdown
## 🗓️ [DATA]

### [TITOLO MODIFICA]

**Tipo:** [Bug Fix / Feature / UI/UX / Performance / Refactor]  
**File modificato:** `path/to/file`  
**Righe:** [numeri riga]

**Descrizione:**  
[Breve descrizione della modifica]

**Motivazione:**  
[Perché è stata fatta questa modifica]

**Dettagli tecnici:**  
[Codice o dettagli tecnici rilevanti]
```

---

**Note:**  
- Questo file viene aggiornato ad ogni modifica significativa
- Le modifiche sono ordinate dalla più recente alla più vecchia
- Ogni modifica include data, descrizione e motivazione
