# UC-07 - Validazione Automatica AI-Driven e Coda di Back-Office

Stato: confermato
Ultimo aggiornamento: 2026-08-21
Documenti correlati: uc-02_login-utente.md, uc-04_profilazione-societa.md, uc-05_profilazione-atleta.md, 04-database-schema-and-scraper-alignment.md

## Obiettivo

Permettere la verifica e l'approvazione rapida dei profili utente (Società, Atleta, Staff) che hanno completato la profilazione. Il processo combina una **Pipeline di Validazione Automatica gestita da Intelligenza Artificiale (AI-Driven OCR & Matching)** con una coda di revisione manuale per gli operatori umani in caso di anomalie, ottimizzando i tempi di approvazione e riducendo al minimo lo sforzo operativo.

---

## 🤖 1. Il Flusso della Pipeline Automatica AI-Driven

Ogni volta che un utente completa la profilazione, lo stato del profilo passa a `PENDING_REVIEW` (In attesa di revisione). Invece di attendere l'intervento manuale immediato di un operatore, il backend di Sporteca attiva istantaneamente un **servizio asincrono di validazione automatica (AI Validation Pipeline)**:

```
[ Profilo in PENDING_REVIEW ]
             │
             ▼
[ Download Documenti da GCS ]
             │
             ▼
[ AI Document Parser (OCR) ] ───► Estrazione: Nome, Cognome, Codice Fiscale,
             │                             Data Scadenza Documento
             ▼
[ Validation & Matching Engine ]
  * Calcolo Checksum Codice Fiscale
  * Corrispondenza Dati Anagrafici Utente / Dati Documento AI
  * Validazione Scadenza Certificato CONI (per Società)
             │
    ┌────────┴────────┐
    ▼ (Match >= 95%)   ▼ (Match < 95% o Errore)
[ AUTO-APPROVATO ]   [ FLAGGATO MANUALE ]
    │                  │
    ├──────────────────┤
    ▼                  ▼
[ ACTIVE_VALIDATED ] [ ACTIVE_UNVALIDATED ] (Notifica Operatore)
```

---

## Attori

- Sistema (Pipeline AI-Driven del backend Sporteca)
- Operatore back-office (per le verifiche manuali dei casi con basso score di confidenza)
- Utente (destinatario indiretto: riceve notifica istantanea sull'esito)

---

## Flusso Principale: Pipeline AI & Coda di Lavoro

### Fase 1: Elaborazione Automatica AI
1. Un event listener intercetta il passaggio di un profilo allo stato `PENDING_REVIEW`.
2. Il sistema scarica in modo sicuro i documenti d'identità (front/back) e i certificati (CONI) dal bucket di Cloud Storage.
3. Il modulo **AI Document Parser (OCR)** analizza i documenti:
    *   Estrae i testi e i campi chiave: *Nome, Cognome, Codice Fiscale, Data di Nascita, Numero Documento, Data di Scadenza*.
    *   Effettua un controllo visivo del tipo di documento (Carta d'Identità, Patente, Passaporto).
4. Il **Matching Engine** esegue i controlli incrociati di coerenza:
    *   *Controllo CF*: Calcola matematicamente il checksum del Codice Fiscale inserito dall'utente e verifica che coincida con quello estratto dal documento.
    *   *Controllo Coerenza*: Confronta lettera per lettera Nome, Cognome e Data di Nascita inseriti nel profilo con i dati estratti dal documento via OCR.
    *   *Controllo Scadenza CONI*: Per le Società, analizza il documento di affiliazione per estrarre e convalidare la data di fine validità.
5. Il sistema calcola un **Confidence Score (Punteggio di Confidenza)** da 0.0 a 1.0 basato sulla chiarezza del testo e la corrispondenza dei dati.

---

### Fase 2: Gestione dei Verdicts (Esiti AI)

#### Scenario A: High Confidence Match (Score >= 0.95 - Auto-Approvato)
1. Tutti i controlli anagrafici e i Codici Fiscali coincidono perfettamente, i documenti sono nitidi ed in corso di validità.
2. Il sistema imposta automaticamente lo stato del profilo a `APPROVED` ed attiva l'utente impostandolo a `ACTIVE_VALIDATED` (pubblicandolo nel motore di ricerca).
3. Registra nel database Jmix un record di auditing (`ValidationRecord`):
    *   `verified_by`: "AI_PIPELINE"
    *   `confidence_score`: 0.98
    *   `notes`: *"Validazione automatica completata con successo tramite AI. Tutti i dati anagrafici e fiscali corrispondono."*
4. Invia un'email automatica all'utente confermando che il suo profilo è ora attivo e validato.

#### Scenario B: Low Confidence / Mismatch (Score < 0.95 - Revisione Manuale)
1. Uno o più campi non coincidono (es. il Codice Fiscale inserito differisce da quello sul documento, o il certificato CONI è scaduto) oppure il documento è sfocato/illeggibile.
2. Il sistema **non rifiuta l'utente direttamente**, ma lo marca come `FLAGGED_FOR_MANUAL_REVIEW` e lo inserisce nella coda di lavoro degli operatori umani di back-office.
3. Il sistema evidenzia graficamente nel pannello Jmix Cockpit i motivi del flag AI (es. *"Mismatch rilevato sul Codice Fiscale: inserito X, estratto dal documento Y"* o *"Impossibile leggere il documento - immagine sfocata"*).
4. L'operatore back-office umano esamina manualmente il caso (vedi Flusso Manuale).

---

### Fase 3: Revisione Manuale dell'Operatore (Jmix Cockpit)
1. L'operatore accede alla coda Jmix dei profili contrassegnati per la revisione manuale.
2. Apre il profilo ed esamina i dettagli anagrafici affiancati al documento originale ed alle note d'errore evidenziate dall'AI.
3. Registra il verdetto definitivo:
    *   **Approvato**: Sovrascrive il flag AI. Il profilo passa a `ACTIVE_VALIDATED`.
    *   **Rifiutato**: L'operatore seleziona la motivazione corretta (es. *"Documento scaduto"*) ed inserisce la motivazione esplicita per l'utente. Il profilo torna a `ACTIVE_UNVALIDATED` e l'utente riceve un'email automatica contenente le istruzioni esatte su come correggere i dati per riavviare la pipeline.

---

## Regole di business

*   **Raccordo con UC-02**: Il rifiuto (automatico o manuale) in fase di prima validazione non deve mai innescare lo stato `SUSPENDED` (che blocca il login), ma riporta semplicemente il profilo a `ACTIVE_UNVALIDATED`. L'utente può accedere per modificare e reinviare i dati senza limiti di tentativi.
*   **Historizzazione (Audit Trail)**: Ogni singolo esame effettuato (sia dalla pipeline AI, sia dall'operatore umano) crea un record immutabile nella tabella `validation_records`, conservando l'esito storico delle modifiche per motivi di sicurezza e conformità GDPR.
