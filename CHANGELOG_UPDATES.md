# 📝 Changelog Aggiornamenti - Report Ore Facchini

Questo file tiene traccia di tutti gli aggiornamenti e modifiche apportate all'applicazione.

---

## 🗓️ 04 Novembre 2025

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
