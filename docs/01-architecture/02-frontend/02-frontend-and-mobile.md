# 02 - Strategia Frontend e Mobile 📱🎨

Questo documento descrive le scelte tecnologiche e i pattern di progettazione per l'interfaccia utente (UI/UX) di **Sporteca**, focalizzandosi sull'App Mobile (Flutter), sui Portali Amministrativi (Jmix Web UI) e sulla gestione dell'internazionalizzazione (i18n).

---

## 📱 L'App Mobile (Flutter)

Per ottimizzare lo sforzo di sviluppo di un **singolo sviluppatore** senza sacrificare la fluidità e l'impatto visivo, adotteremo **Flutter** come tecnologia cross-platform per iOS e Android.

### 1. Architettura dell'App (Clean Architecture)
L'applicazione mobile sarà strutturata seguendo i sani principi del disaccoppiamento. Questo garantisce che se in futuro si dovesse decidere di migrare verso tecnologie 100% native (Swift/Kotlin), la logica di business rimarrà inalterata e facilmente leggibile.

```
+--------------------------------------------------------------+
|                    PRESENTATION LAYER (UI)                   |
|  - UI Widgets (Schermate, Popup, bottoni)                    |
|  - State Management: Riverpod o BLoC                         |
+------------------------------┬-------------------------------+
                               |
                               v
+------------------------------┴-------------------------------+
|                        DOMAIN LAYER                          |
|  - Use Cases (es. ClaimProfile, SearchScoutedPlayers)        |
|  - Entity Models (Puri modelli Dart)                         |
+------------------------------┬-------------------------------+
                               |
                               v
+------------------------------┴-------------------------------+
|                         DATA LAYER                           |
|  - Repositories (Implementazioni concrete delle interfacce)  |
|  - Data Sources (Retrofit / Dio Client per REST, WebSockets)  |
|  - Mappers (Convertono i DTO JSON in Entità del Domain)      |
+--------------------------------------------------------------+
```

### 2. Come ottenere una UI/UX "Mega Figa" in Flutter
Per superare i limiti visivi delle app ibride standard e dare un look "premium" e dinamico a Sporteca:
* **Custom Theme & Typography:** Sincronizzazione dei temi chiaro/scuro in linea con l'estetica DaisyUI utilizzata sul web. Uso di font moderni e fluidi (es. *DM Sans*).
* **Hero Transitions:** Transizioni fluide degli elementi durante la navigazione. Ad esempio, cliccando sulla foto di un calciatore nella lista di ricerca, questa si ingrandisce in modo naturale fino a occupare la sua posizione di rilievo nella scheda di dettaglio.
* **Micro-Interazioni & Lottie:** Uso di animazioni Lottie ultraleggere per feedback di successo (es. claim confermato, iscrizione completata) o stati di caricamento personalizzati e interattivi.
* **Sliver Widgets (Custom Scrolling):** Utilizzo di `SliverAppBar` e scrolling collassabili per dare un senso di profondità alle schede degli atleti, dove la foto sfuma o si rimpicciolisce elegantemente quando si scorrono le statistiche.
* **Gestione dello Stato Reattivo (Riverpod):** Riverpod gestirà in modo granulare i cambi di stato per evitare ridisegni inutili e garantire i 60fps/120fps stabili sia su schermi iOS ProMotion che Android ad alta frequenza di aggiornamento.

---

## 🌐 Gestione dell'Internazionalizzazione (i18n) sui Client

L'applicazione deve essere predisposta fin dal primo giorno per supportare più lingue (Italiano, Inglese, Spagnolo, ecc.).

### 1. Testi Statici (Localizzazione UI)
Tutti i testi cablati nell'interfaccia utente vengono estratti in file JSON dedicati all'interno degli asset dell'applicazione mobile e del web frontend.

* **Struttura dei file di traduzione (`assets/translations/`):**
  ```json
  // it.json
  {
    "search": {
      "placeholder": "Cerca un calciatore...",
      "no_results": "Nessun atleta trovato"
    },
    "claiming": {
      "title": "Rivendica il tuo Profilo",
      "button": "Questo sono io!"
    }
  }
  ```
* **Libreria consigliata per Flutter:** `easy_localization` o `flutter_localizations` nativa. Permettono il cambio lingua in tempo reale senza dover riavviare l'applicazione.
* **Rilevamento Automatico:** Al primo avvio, l'applicazione rileva la lingua di sistema del dispositivo e la imposta come predefinita.

### 2. Sincronizzazione con il Backend (HTTP Header)
Ogni volta che l'applicazione mobile effettua una chiamata alle API REST del backend Jmix, inserisce automaticamente l'header standard:
```http
Accept-Language: it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7
```
Il backend leggerà questo header per formattare correttamente le risposte di errore, i messaggi di notifica o per recuperare dati localizzati dal database.

---

## 🖥️ Portale Web per Super Admin e Company (Jmix UI Engine)

La parte web rivolta ai **Super Amministratori** e ai gestori delle **Company (Società Sportive)** per l'MVP sfrutterà l'enorme potenziale del generatore di interfacce di **Jmix**.

* **Jmix UI (Vaadin / React):** Jmix fornisce un motore di rendering web pronto all'uso basato su standard industriali (con supporto nativo di layout responsive, tabelle di dati filtrate, export in Excel, popup e form di creazione).
* **Ottimizzazione del Tempo per il Solo-Developer:** Invece di dover programmare da zero due diversi frontend in React/Angular per gli amministratori (che richiederebbero mesi di lavoro su grafici, tabelle, permessi e validazioni), Jmix genera queste visualizzazioni partendo direttamente dal modello dei dati (Entità JPA) e applicando i permessi di sicurezza in automatico.
* **Segregazione Visiva dei Dati:** Tramite le politiche di sicurezza a livello di riga (Row-level Security) integrate in Jmix, l'interfaccia del Portale Company mostrerà esclusivamente i dati di competenza della società loggata, mentre il Super Admin vedrà una dashboard di controllo globale di tutto il sistema.
