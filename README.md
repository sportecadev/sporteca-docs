# Sporteca - Portale della Documentazione 📂

Benvenuto nel portale ufficiale della documentazione di **Sporteca**. Questo spazio raccoglie tutti i dettagli strategici, i requisiti di business (casi d'uso) e le specifiche tecniche e architetturali del progetto.

---

## 📂 1. Mappa Globale del Repository Sporteca

Il progetto è strutturato come un monorepo modulare, dove ciascuna cartella ha responsabilità ben definite e isolate. Di seguito viene illustrato il ruolo di ciascuna cartella principale:

```text
/ (Progetto Radice)
├── .gemini/                  # Configurazione dell'AI Agent (workflow, custom skills, stati dei task)
│   ├── workflow/             # Linee guida e standard per lo sviluppo (DoD, Git pipeline)
│   ├── tasks/                # Cartelle dei task (todo, doing, done) per tracciare lo stato di avanzamento
│   └── skills/               # Istruzioni e competenze speciali per l'AI
├── sporteca-api/             # Backend centrale (Spring Boot + Jmix) - approccio Monolite Modulare
│   ├── sporteca-auth-api/     # Modulo per autenticazione JWT, registrazione e privacy dei minori (GDPR)
│   ├── sporteca-countries-api/# Modulo per la gestione geografica e località
│   ├── sporteca-profiles-api/ # Modulo per la profilazione (Atleti, Società, Staff) e validazione dei profili
│   └── sporteca-skills-api/   # Modulo per la gestione dinamica multi-sport (sport, ruoli, abilità)
├── sporteca-app/             # Frontend web client reattivo (React 18 + TypeScript + TailwindCSS v3)
│   ├── src/                  # Codice sorgente della Dashboard e dei componenti grafici
│   └── public/db/            # Collegamento simbolico (symlink) ai file JSON generati dallo scraper
├── sporteca-database/        # Script SQL di definizione dello schema database e popolamento iniziale
├── sporteca-scraper/         # Scraper in Python 3.14 per estrarre i dati dei campionati da Tuttocampo.it
│   ├── scripts/              # Script di esecuzione (`run_scraper.py` e `db_manager.py`)
│   │   └── sports/           # Moduli specifici per sport (calcio, basket, volley, rugby)
│   └── db/                   # Database locale basato su file JSON normalizzati
└── sporteca-docs/            # QUESTA CARTELLA: Portale documentale e analisi strategica
    ├── docs/                 # Documenti di analisi e architettura
    └── README.md             # Questo indice di benvenuto
```

---

## 📑 2. Struttura dei Documenti in `sporteca-docs`

La cartella `sporteca-docs/docs/` è il cuore pulsante dell'analisi strategica del progetto ed è divisa in due macro-aree:

### 🎯 A. `00-requirements-analysis/` (Perimetro di Business)
Questa cartella definisce **cosa** fa l'applicazione, le logiche di business, la conformità legale e la strategia commerciale.
*   **`01_decisioni_perimetro_mvp.md`**: Le linee di confine approvate per la prima release (funzionalità incluse ed escluse come Stonk, badge o chat).
*   **`business_model/`**: Contiene la strategia di business e go-to-market.
    *   `bm-go-to-market.md`: Analisi dettagliata dei concorrenti (debolezze di *Profilo Sportivo*), posizionamento competitivo basato sulla serietà del matching e sulla conformità GDPR dei minori, e strategie di monetizzazione.
*   **`use_cases/`**: I flussi d'uso dettagliati (UC-01 a UC-08) che descrivono i comportamenti del sistema:
    *   `uc-01`: Registrazione utente e gestione minorenni (fasce Under 14, 14-17, 18+).
    *   `uc-02`: Login utente e ciclo di vita degli stati dell'account.
    *   `uc-03`: Recupero password.
    *   `uc-04`: Profilazione utente Società (Partita IVA, CONI, ecc.).
    *   `uc-05`: Profilazione utente Atleta (Codice Fiscale, scheda sportiva, genitori).
    *   `uc-06`: Profilazione utente Staff (Allenatore, Preparatore, ecc.).
    *   `uc-07`: Validazione dei profili da parte del Back-Office.
    *   `uc-08`: Motore di ricerca profili anonimizzato per la massima tutela della privacy.

### ⚙️ B. `01-architecture/` (Perimetro Tecnico)
Questa cartella definisce **come** viene costruita l'applicazione e le scelte tecnologiche.
*   `01-system-overview.md`: Panoramica ad alto livello degli attori del sistema e dei flussi di lavoro (Claiming del profilo, Scouting, ecc.).
*   `02-frontend-and-mobile.md`: Architettura della Web App React e dei widget da incorporare in siti WordPress.
*   `03-jmix-backend.md`: Scelte tecniche del backend Spring Boot + Jmix (sicurezza, api, i18n dinamico).
*   `04-database-and-media.md`: Schema relazionale MySQL e gestione file multimediali su Google Cloud Storage.
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
