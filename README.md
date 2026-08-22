# Sporteca - Portale della Documentazione 📂

Benvenuto nel portale ufficiale della documentazione di **Sporteca**. Questo spazio raccoglie tutti i dettagli strategici, i requisiti di business (casi d'uso) e le specifiche tecniche e architetturali del progetto.

---

## 📂 1. Mappa Globale del Repository Sporteca (Consolidata)

Il progetto è strutturato come un monorepo modulare con responsabilità ben isolate. A seguito del consolidamento dei sistemi, il backend centralizza tutte le funzionalità in un'unica base dati, e il frontend di test dello scraper è stato separato:

```text
/ (Progetto Radice)
├── .gemini/                  # Configurazione dell'AI Agent (workflow, custom skills, stati dei task)
│   ├── workflow/             # Linee guida e standard per lo sviluppo (DoD, Git pipeline)
│   ├── tasks/                # Cartelle dei task (todo, doing, done) per tracciare lo stato di avanzamento
│   └── skills/               # Istruzioni e competenze speciali per l'AI
├── sporteca-backend/         # NUOVO BACKEND UNIFICATO (Spring Boot 3.x + Jmix 2.x)
│   ├── src/main/java/        # Codice sorgente Java consolidato (Jmix Cockpit + REST APIs)
│   ├── src/main/resources/   # File di configurazione, mappe geografiche e risorse di i18n
│   └── CONCETTI_MODELLO_DATI.md # Blueprint con il design del DB derivato dalla convergenza di sporteca-api
├── sporteca-scaper-app/      # EX sporteca-app: Client web React + TypeScript (DaisyUI / Tailwind v3)
│   ├── src/                  # Dashboard prototipo per testare la visualizzazione dati
│   └── public/db/            # Collegamento simbolico (symlink) ai file JSON locali prodotti dallo scraper
├── sporteca-database/        # Script SQL storici di definizione dello schema database e popolamento
├── sporteca-scraper/         # Scraper in Python 3.14 per estrarre i dati dei campionati da Tuttocampo.it
│   ├── scripts/              # Script di esecuzione (`run_scraper.py` e `db_manager.py`)
│   │   └── sports/           # Moduli specifici per sport (calcio, basket, volley, rugby)
│   └── db/                   # Database locale basato su file JSON normalizzati
├── sporteca-docs/            # QUESTA CARTELLA: Portale documentale e analisi strategica
│   ├── docs/                 # Documenti di analisi e architettura
│   └── README.md             # Questo indice di benvenuto
└── sporteca-api/             # DEPRECATO (Rimosso / Confluito in sporteca-backend)
```

---

## 📑 2. Struttura dei Documenti in `sporteca-docs`

La cartella `sporteca-docs/docs/` definisce le specifiche di business e architetturali di Sporteca:

### 🎯 A. `00-requirements-analysis/` (Perimetro di Business & Data Blueprint)
Questa cartella definisce **cosa** fa l'applicazione, le logiche di business, la conformità legale, la strategia commerciale e le specifiche relazionali delle entità.
*   **`01_decisioni_perimetro_mvp.md`**: Le linee di confine approvate per la prima release (funzionalità incluse ed escluse come Stonk, badge o chat).
*   **`db/`**: Progettazione ed entità del database relazionale.
    *   **`models.ts`**: Modelli TypeScript unificati che descrivono tutte le tabelle, tassonomie (`type_`), configurazioni (`cfg_`), relazioni e integrazione con il Registro Federale, allineati al form model reattivo di PrimeNG.
    *   **`schema.dbml`**: Schema logico/sintattico in Database Markup Language (DBML), importabile su dbdiagram.io per la visualizzazione grafica interattiva, completo di relazioni e record di esempio.
*   **`business_model/`**: Contiene la strategia di business e go-to-market.
    *   `bm-go-to-market.md`: Analisi dettagliata dei competitor (come *Profilo Sportivo*), differenziazione sulla sicurezza GDPR dei minori, e strategie di monetizzazione.
*   **`use_cases/`**: I flussi d'uso dettagliati (UC-01 a UC-09) che descrivono i comportamenti del sistema:
    *   **`uc-01_registrazione-utente.md`**: Registrazione utente differenziata per ruolo (Social Google/Apple per atleti/staff, credenziali istituzionali o Enterprise SSO Microsoft Entra per Società) e conformità minori.
    *   **`uc-02_login-utente.md`**: Login differenziato e gestione delle sessioni stateless tramite token JWT e Refresh Token.
    *   **`uc-03_recupero-password.md`**: Recupero password moderno e sicuro tramite codici temporanei OTP (Email/SMS) o Magic Link temporanei (eliminazione domande di sicurezza).
    *   `uc-04_profilazione-utente-società.md`: Profilazione societaria (CONI, Partita IVA).
    *   `uc-05_profilazione-utente-atleta.md`: Profilazione atleta e sezione genitori.
    *   `uc-06_profilazione-utente-staff.md`: Profilazione staff tecnico e patentini.
    *   `uc-07_validazione-back-office-profilo.md`: Flusso cumulativo di approvazione/rifiuto anagrafica e documenti.
    *   `uc-08_motore-ricerca-profili.md`: Ricerca anonima protetta (ruolo ed età) a tutela della privacy.
    *   **`uc-09_gestione-identita-collegamento-account.md`**: Gestione dell'identità unificata, accorpamento credenziali (Merge/Join classico-social) e relazioni tutore-minore per la gestione multi-figlio.

### ⚙️ B. `01-architecture/` (Perimetro Tecnico)
Questa cartella definisce **come** viene costruita l'applicazione e le scelte tecnologiche.
*   `01-system-overview.md`: Panoramica ad alto livello degli attori del sistema, della separazione dei canali di autenticazione e del backend unificato.
*   `02-frontend-and-mobile.md`: Architettura della Web App React e dei widget da incorporare in siti WordPress.
*   `03-jmix-backend.md`: Scelte tecniche del backend Spring Boot + Jmix unificato (doppio motore stateful/stateless, Resource Server JWT per Microsoft Entra ID/Social, i18n dinamico).
*   `04-database-and-media.md`: Schema relazionale MySQL e gestione file multimediali su Google Cloud Storage.
*   `04-database-schema-and-scraper-alignment.md`: Disegno di dettaglio del database di backend, modello dati dello scraper ed il flusso di Claiming dei profili atleti.
*   `07-payments-billing-comms.md`: Integrazioni esterne per pagamenti (Stripe), fatturazione (FattureInCloud) e notifiche (SendGrid).

---

## 📘 3. Guida per Collaboratori Non-Tecnici (Esportabile in PDF)

Sei un collaboratore non-tecnico (ad esempio un Business Analyst, Product Owner o esperto di Marketing)? Abbiamo preparato una guida semplicissima, priva di termini incomprensibili, per insegnarti a scaricare il progetto, modificare i documenti di business e inviare i tuoi aggiornamenti in sicurezza senza rischiare di toccare il codice degli sviluppatori.

La guida è contenuta nel file:
👉 **[`GUIDA_COLLABORATORI_NON_DEV.md`](./GUIDA_COLLABORATORI_NON_DEV.md)**

### 📄 Come salvare la guida in formato PDF:
1. Apri il file `GUIDA_COLLABORATORI_NON_DEV.md` sul portale del tuo codice (es. GitHub o VS Code).
2. Se usi **VS Code**, premi `Ctrl+Shift+P` (o `Cmd+Shift+P` su Mac) e digita `Markdown: Export as PDF` (richiede l'estensione *Markdown PDF*).
3. Se usi il browser su **GitHub**, premi semplicemente `Ctrl+P` (o `Cmd+P` su Mac) e scegli **"Salva come PDF"** per ottenere un documento impaginato e pronto da stampare o inviare via email!
