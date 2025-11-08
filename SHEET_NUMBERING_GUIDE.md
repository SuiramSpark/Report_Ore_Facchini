# 🔢 Sistema Numerazione Fogli - Completamente Automatico

## ✅ Come Funziona

### Sistema Intelligente Auto-Assegnazione
L'app **assegna automaticamente** i numeri ai fogli senza intervento manuale!

**Quando succede:**
- Al caricamento della Dashboard (mode admin)
- Quando i fogli vengono caricati dal database
- Ogni volta che rileva fogli senza numero

**Cosa fa:**
1. 🔍 Controlla se ci sono fogli senza `sheetNumber`
2. 📊 Trova il numero più alto esistente
3. 🔢 Assegna numeri sequenziali in ordine cronologico
4. 💾 Salva tutto in batch (efficiente)
5. ✅ Aggiorna il counter automaticamente

**Completamente silenzioso** - lavora in background senza popup!

---

## 🎯 Caratteristiche

### 1. **Numerazione Automatica**
- ✅ Tutti i 27+ fogli riceveranno numeri automaticamente
- ✅ Ordine cronologico: primo creato = #001
- ✅ Non serve tool manuale
- ✅ Non serve cliccare nulla

### 2. **Visualizzazione**
- **SheetList**: Badge blu `#001`, `#002`, ecc.
- **Dashboard Widget**: Numero sotto nome azienda
- **Formato**: `#XXX` (3 cifre con padding)

### 3. **Ricerca Intelligente**
Cerca per numero nella search bar:
- `#014` → Trova foglio #014
- `14` → Trova foglio #014  
- `014` → Trova foglio #014

### 4. **Protezioni Anti-Loop**
- Esegue max 1 volta all'ora
- Usa localStorage per tracciare esecuzioni
- Non esegue se tutto già numerato

---

## � Logica di Assegnazione

```javascript
// Esempio con 27 fogli
Fogli senza numero: 27
Numero più alto esistente: 0 (nessuno ha numeri)
Counter Firebase: { next: 14 } (ignorato se troppo basso)

Assegnazione:
- Foglio più vecchio (2024-01-01) → #001
- Secondo più vecchio (2024-01-05) → #002
- ...
- Foglio più recente (2025-11-06) → #027

Prossimo nuovo foglio → #028
```

---

## � Dettagli Tecnici

### Condizioni di Esecuzione
Auto-assegnazione si attiva SE:
- ✅ Sei in mode admin
- ✅ Database connesso
- ✅ Ci sono fogli caricati
- ✅ Almeno 1 foglio senza `sheetNumber`
- ✅ È passata almeno 1 ora dall'ultima esecuzione

### Protezioni
```javascript
localStorage:
  lastAutoAssignSheetNumbers: timestamp ultima esecuzione
  lastSheetCount: numero fogli all'ultima esecuzione

Trigger riassegnazione se:
- Mai eseguito prima
- Passata 1+ ora
- Numero fogli cambiato di ±5
```

### Batch Operations
- Usa Firestore batch writes (efficiente)
- Max 500 documenti per batch
- Aggiorna counter in stessa transaction

---

## � Primo Utilizzo

### Step 1: Fai login come admin
```
1. Apri app
2. Login admin (password: 040394 o admin123)
3. Vai su Dashboard
```

### Step 2: Aspetta 2-3 secondi
```
L'app carica i fogli e assegna numeri automaticamente
Console mostra:
  🔢 Trovati 27 fogli senza numero - assegnazione automatica...
  ✅ #001 → Azienda A
  ✅ #002 → Azienda B
  ...
  🎉 Auto-assegnazione completata! 27 fogli numerati
```

### Step 3: Verifica
```
Vai su "Lista Fogli" → Vedi badge #001, #002, ecc.
Cerca "#005" → Trova quel foglio
Dashboard widget → Mostra numeri
```

---

## 🛠️ Tool Manuale (Opzionale)

Se preferisci controllo manuale, c'è ancora il tool HTML:
```
Apri: js/tools/assign_sheet_numbers.html
- Anteprima prima di modificare
- Log dettagliato
- Controllo manuale
```

**MA NON È NECESSARIO** - l'app fa tutto da sola! ✨

---

## ⚠️ Note Importanti

### Sicurezza
- ✅ Usa batch transactions (atomiche)
- ✅ Non crea duplicati
- ✅ Gestisce errori gracefully
- ✅ Log console per debugging

### Performance
- ✅ Esegue solo quando necessario (throttling 1h)
- ✅ Usa batch writes (efficiente Firestore)
- ✅ Non blocca UI
- ✅ Toast discreto (2 secondi)

### Persistenza
- ✅ Numeri salvati permanentemente in Firestore
- ✅ Sopravvivono a reload/logout
- ✅ Sincronizzati multi-device

---

## 📝 Change Log

### v4.3.1 - Sistema Automatico Intelligente
- ✅ **Auto-assegnazione completa** - nessun tool manuale richiesto
- ✅ Gestisce 27+ fogli automaticamente
- ✅ Protezioni anti-loop e throttling
- ✅ Batch operations per efficienza
- ✅ Log console dettagliati
- ✅ Badge visuali everywhere
- ✅ Ricerca per numero
- ✅ Tool HTML opzionale per controllo manuale

---

## 🎉 Pronto!

**Non devi fare NIENTE!** 🚀

Semplicemente:
1. Fai login come admin
2. L'app assegna i numeri automaticamente
3. Fatto! ✨

I tuoi 27 fogli avranno numeri #001 → #027 in ordine cronologico.

---
