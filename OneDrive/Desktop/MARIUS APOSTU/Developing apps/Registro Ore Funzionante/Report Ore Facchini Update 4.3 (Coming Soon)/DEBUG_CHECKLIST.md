# 🔧 DEBUG CHECKLIST - Link Lavoratore Non Funziona

## ✅ Step 1: Test Routing Basico
Apri questo file nel browser:
```
http://127.0.0.1:5500/test-worker.html?mode=worker&sheet=MyvO2rOChH8PkyUK4xGO
```

**Risultato Atteso:** Dovresti vedere un messaggio "Worker Mode Riconosciuto!"

---

## ✅ Step 2: Verifica Console Browser
Apri la Console (F12) quando carichi:
```
http://127.0.0.1:5500/index.html?mode=worker&sheet=MyvO2rOChH8PkyUK4xGO
```

**Log Attesi:**
```javascript
🔍 URL Params: { urlMode: 'worker', urlSheet: 'MyvO2rOChH8PkyUK4xGO' }
📍 Current URL: http://127.0.0.1:5500/index.html?mode=worker&sheet=...
✅ Worker mode detected! Sheet ID: MyvO2rOChH8PkyUK4xGO
🚀 WorkerMode Component Loaded
📋 Sheet ID: MyvO2rOChH8PkyUK4xGO
🔥 DB Status: Connected ✅ (o Not Connected ❌)
🌐 Language: it
```

---

## ✅ Step 3: Verifica Caricamento Script

Nella Console, verifica che WorkerMode sia definito:
```javascript
console.log(typeof WorkerMode);
// Dovrebbe mostrare: "function"
```

Se mostra `undefined`, significa che lo script non è stato caricato!

---

## ✅ Step 4: Verifica Ordine Script in index.html

Apri `index.html` e verifica che ci sia:
```html
<script type="text/babel" src="js/components/WorkerMode.js"></script>
```

**PRIMA DI:**
```html
<script type="text/babel" src="js/app.js"></script>
```

---

## ✅ Step 5: Verifica File Esiste

Controlla che il file esista:
```
js/components/WorkerMode.js
```

Nella console PowerShell:
```powershell
Test-Path "js/components/WorkerMode.js"
# Dovrebbe restituire: True
```

---

## ✅ Step 6: Verifica Connessione Database

Se vedi il messaggio "Database Non Connesso":

1. **Controlla Firebase Config** in `js/config.js`
2. **Verifica Internet** - Firebase richiede connessione
3. **Controlla Console** per errori Firebase

---

## ✅ Step 7: Errori Comuni

### Errore: "WorkerMode is not defined"
**Causa:** Script non caricato
**Fix:** Verifica index.html contiene lo script

### Errore: "Cannot read property 'collection' of null"
**Causa:** db è null
**Fix:** Aspetta che Firebase si connetta

### Errore: "Sheet not found"
**Causa:** ID foglio non esiste
**Fix:** Verifica ID nel database Firebase

### Link apre Admin invece di Worker
**Causa:** Parametri URL non riconosciuti
**Fix:** Verifica formato: `?mode=worker&sheet=XXX`

---

## 🔍 Debug Commands

Nella Console Browser, esegui:

```javascript
// 1. Verifica WorkerMode è caricato
console.log('WorkerMode defined:', typeof WorkerMode);

// 2. Verifica parametri URL
const params = new URLSearchParams(window.location.search);
console.log('Mode:', params.get('mode'));
console.log('Sheet:', params.get('sheet'));

// 3. Verifica Firebase
console.log('Firebase defined:', typeof firebase);
console.log('DB defined:', typeof db);

// 4. Test Firebase connection
if (firebase && firebase.firestore) {
    const testDB = firebase.firestore();
    console.log('Firebase initialized:', testDB ? 'YES' : 'NO');
}
```

---

## 📋 Cosa Fare Ora

1. **Ricarica con cache svuotata**: CTRL+SHIFT+R (Windows/Linux) o CMD+SHIFT+R (Mac)
2. **Apri test-worker.html** per verificare routing
3. **Apri index.html** con parametri worker
4. **Controlla Console** per i log di debug
5. **Manda screenshot** della console se non funziona

---

## 🎯 Link da Testare

### Test Routing:
```
http://127.0.0.1:5500/test-worker.html?mode=worker&sheet=MyvO2rOChH8PkyUK4xGO
```

### Test App Completa:
```
http://127.0.0.1:5500/index.html?mode=worker&sheet=MyvO2rOChH8PkyUK4xGO
```

---

## 📸 Screenshot Richiesti

Se non funziona, manda screenshot di:
1. Console Browser (F12) → Tab Console
2. Console Browser (F12) → Tab Network (filtra per "WorkerMode.js")
3. La schermata che vedi (Admin o Worker o Errore)

---

## ✅ Modifiche Applicate

1. ✅ Aggiunto WorkerMode.js in index.html
2. ✅ Rimosso duplicato WorkerMode.js
3. ✅ Semplificato calcolo baseUrl
4. ✅ Aggiunti log debug in app.js
5. ✅ Aggiunti log debug in WorkerMode.js
6. ✅ Aggiunto controllo DB connection
7. ✅ Creato test-worker.html per test routing

---

Prova ora! 🚀
