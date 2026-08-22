# UC-09 - Gestione dell'Identità, Collegamento Account (Merge) e Multi-Profilo

Stato: confermato
Ultimo aggiornamento: 2026-08-21
Documenti correlati: uc-01_registrazione-utente.md, uc-02_login-utente.md, 01-decisioni-perimetro-mvp.md, 04-database-schema-and-scraper-alignment.md

## Obiettivo

Definire le linee guida concettuali per la gestione delle identità degli utenti su Sporteca. L'obiettivo è garantire la massima flessibilità: consentire ad un singolo **Account** di collegarsi a molteplici **Metodi di Autenticazione** (classici e social), unire dinamicamente le credenziali nel tempo (Merge/Join) con gestione della password sbiacata (disabilitata), supportare relazioni **Multi-Figlio (Tutore-Minori)** e tracciare in modo dettagliato ogni evoluzione di accesso in un **Registro di Audit Storico delle Identità (Identity Audit Log)** ad uso esclusivo del back-office amministrativo.

---

## 🛠️ 1. Il Concetto di Account vs Profilo

Per supportare flussi complessi, l'architettura separa nettamente l'identità di accesso dai dati operativi:

*   **Account (Identità di Login)**: Rappresenta le credenziali e i metodi per accedere. È unico per indirizzo email. Contiene la lista dei metodi di accesso associati (`AuthMethod`), il `creation_provider` e il `primary_provider` attivo.
*   **Profilo (Scheda Operativa)**: Rappresenta il ruolo effettivo sulla piattaforma (Atleta, Membro dello Staff, Società Sportiva). Contiene i dati anagrafici, sportivi, squadre, documenti e certificati. **La tipologia del profilo dichiarata costituisce la sorgente di verità del sistema per l'abilitazione delle funzionalità B2B o B2C, a prescindere dal dominio dell'email dell'account (sono ammessi domini generici come `@gmail.com` anche per le Società).**

---

## 🔄 2. Collegamento Dinamico dei Canali (Auth Join & Password Sbiacata)

Il sistema consente ad un utente di arricchire o modificare i propri metodi di accesso nel tempo:

1.  **Da Classico a Social (Google/Apple/Instagram)**: Se un utente si registra con Email e Password, può successivamente cliccare su "Collega Google" dalle impostazioni. Il sistema aggiunge `AuthMethod: GOOGLE` all'account.
2.  **Governanza del Canale Primario (Password Sbiacata)**: Quando un account viene collegato ad un social provider esterno ed impostato come primario (`primary_provider` = `GOOGLE`), **la password locale viene sbiacata (disabilitata/mascherata)**. Questo significa che:
    *   L'hash locale (`password_hash`) viene disabilitato temporaneamente a DB per motivi di sicurezza, costringendo l'utente a transitare unicamente tramite l'autenticazione sicura dell'IdP esterno.
    *   Ogni tentativo di login classico inserendo la vecchia password locale viene bloccato (UC-02 - E3).
3.  **Merge automatico al Login**: Se un utente registrato con password locale tenta in un secondo momento di effettuare l'accesso cliccando su un social provider che condivide la **stessa identica email**, il sistema esegue un accorpamento dinamico silente: inserisce il record `AuthMethod` social ed aggiorna il `primary_provider`, sbiacando la password locale e registrando l'evento nell'Audit Log.

---

## 📜 3. Registro Storico di Audit delle Identità (Identity Audit Log)

Qualsiasi variazione legata alla sicurezza, all'autenticazione o alle credenziali dell'account deve essere memorizzata in modo permanente ed immutabile nel database all'interno della tabella `account_identity_audit_logs`. 

Questo consente al personale del back-office amministrativo di ricostruire l'esatta storia dei cambi di credenziali in caso di problemi di login e, se necessario, di eseguire azioni manuali di emergenza per ripristinare l'accesso.

### Campi del Log:
*   `id` (BIGINT, PK, AutoIncrement)
*   `account_id` (UUID, FK -> `accounts`)
*   `action_type` (Enum): `ACCOUNT_CREATED`, `PROVIDER_LINKED`, `PROVIDER_UNLINKED`, `PRIMARY_PROVIDER_CHANGED`, `PASSWORD_CHANGED`, `PASSWORD_DISABLED` (Sbiacata), `PASSWORD_ENABLED`, `FORCE_LOCAL_AUTH_RESET` (Azione operatore).
*   `performed_by` (VARCHAR(100)): `"SYSTEM"` o `"USER"` o l'username dell'operatore di back-office.
*   `old_value` (VARCHAR(255), Nullable)
*   `new_value` (VARCHAR(255), Nullable)
*   `ip_address` (VARCHAR(45))
*   `timestamp` (TIMESTAMP)

### Scenario di Ripristino in Back-Office:
Se un utente perde l'accesso al proprio IdP aziendale o social (es. l'email aziendale viene disabilitata) ed è bloccato:
1.  L'operatore di back-office visualizza la scheda Jmix dell'utente ed apre la sezione **"Registro Storico Accesso"**.
2.  Legge lo storico: *"Utente registrato in data X con LOCAL password. Collegato Google in data Y. Password sbiacata e Google impostato come Primario in data Y"*.
3.  L'operatore attiva l'azione di emergenza **"Ripristina Credenziali Locali"**:
    *   Imposta `primary_provider` = `LOCAL` a database.
    *   Genera ed invia il codice OTP moderno (UC-03) all'email alternativa fornita.
    *   Scollega l'anagrafica social difettosa.
4.  La transazione viene registrata nell'Audit Log con `performed_by = <username_operatore>` per garantire totale trasparenza e tracciabilità anti-frode.

---

## 🚦 4. Flusso di Registrazione Smart e Profilazione Differenziata

Il flusso di iscrizione è strutturato in due step successivi e intelligenti per garantire la massima semplicità d'uso:

```
[ STEP 1: Creazione Account ] 
(Email/Password, Google, Apple)
            │
            ▼
[ STEP 2: Scelta Tipo Profilo ]
   ┌────────┼────────┐
   ▼        ▼        ▼
[ COMPANY ] [ ATHLETE ] [ STAFF ]
```

### Regole di instradamento (Routing Smart):
*   ### Scelta Profilo Società (`COMPANY`)
    *   **Vincolo**: Un Account può creare ed essere associato a **un solo profilo Società**.
    *   **Canali**: L'Account può registrarsi con qualsiasi dominio email (incluse le email consumer come `@gmail.com` per le piccole A.S.D. locali). L'Account aziendale comanda l'accesso tramite credenziali classiche o federando l'SSO aziendale se configurato.
*   ### Scelta Profilo Atleta (`ATHLETE`) o Staff (`STAFF`)
    *   **Flessibilità**: Un singolo Account può creare ed essere associato a **più profili Atleta o Staff** (ad esempio, per atleti che praticano più sport o genitori che gestiscono più figli).
    *   **Controllo Età (Maggiorenne o Minorenne)**:
        *   **Utente Maggiorenne (18+)**: Il profilo Atleta viene creato ed associato direttamente allo stesso Account di chi si sta registrando.
        *   **Utente Minorenne (Under 18)**:
            *   L'account del minore viene creato (classico o social).
            *   Il profilo Atleta viene creato in uno stato di "In attesa di collegamento Tutore".
            *   **Fascia Under 14**: Scatta la conformità GDPR obbligatoria. Viene richiesta l'email del genitore e l'account si attiva solo dopo la doppia conferma (minore + consenso esplicito del genitore via email).
            *   **Fascia 14-17**: Il minore si registra autonomamente ma il suo profilo deve essere obbligatoriamente agganciato ad un Account Tutore per la validazione successiva.

---

## 👨‍👩‍👧‍👦 5. Scenario Reale: Gestione Multi-Figlio (Genitore / Tutore)

Questo scenario evidenzia come il modello dati flessibile gestisce le relazioni familiari e l'unione dei canali social.

### Il Contesto:
*   Un **Account Genitore** gestisce le schede e le statistiche di **due figli minorenni** (Figlio 1 e Figlio 2).

### I Flussi Operativi del caso reale:

```
                  +──────────────────────────────+
                  |       ACCOUNT GENITORE       | <─── (Accede con credenziali)
                  +──────────────┬───────────────+
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
+──────────────────+                            +──────────────────+
|  PROFILO FIGLIO 1|                            |  PROFILO FIGLIO 2|
| (Atleta Under 14)|                            | (Atleta 14-17)   |
+────────┬─────────+                            +────────┬─────────+
         │                                               │
         v (Account Figlio 1)                            v (Account Figlio 2)
   [ Credenziali ]                                 [ Google Login ]
  (Collega Gmail & IG)
```

1.  **Dashboard del Genitore**:
    *   Il Genitore effettua il login con il proprio account.
    *   Accedendo alla sua dashboard, il Genitore vede ed ha il controllo amministrativo su **due distinti profili atleta**: il *Profilo Figlio 1* e il *Profilo Figlio 2*. Può caricare i loro certificati medici o visualizzare le loro statistiche di matching.
2.  **Accesso del Figlio 1 (Registrazione Classica + Social Join)**:
    *   Il Figlio 1 si è registrato originariamente tramite Email e Password. Il suo profilo è collegato all'Account del Genitore come tutore.
    *   Nelle impostazioni del suo account, il Figlio 1 decide di collegare il suo account **Instagram** e il suo account **Google (Gmail)** per velocizzare l'accesso.
    *   Il sistema aggiunge `AuthMethod: GOOGLE` e `AuthMethod: INSTAGRAM` al suo account. Da questo momento, il Figlio 1 può effettuare il login con la password classica, con Google o con Instagram. Tutte e tre le modalità lo porteranno allo stesso identico profilo atleta, sempre collegato al genitore comune.
3.  **Accesso del Figlio 2 (Registrazione Social)**:
    *   Il Figlio 2 (maggiore di 14 anni) si registra autonomamente tramite **Google Login** (anche con email `@gmail.com`).
    *   In fase di profilazione, inserisce i dati del genitore e aggancia il *Profilo Figlio 2* all'**Account Genitore** già esistente nel sistema.
    *   Il Genitore riceve una notifica sul suo pannello e conferma il collegamento. Da questo momento il Figlio 2 accede autonomamente tramite Google, ma il genitore ha visibilità sulla sua scheda.

---

## 💾 6. Impatto sul Modello Dati Relazionale

Per supportare questo schema flessibile, le tabelle del database di `sporteca-backend` devono essere strutturate così:

*   `Account` (1 --- N) `AuthMethod`: Consente la memorizzazione di più metodi d'accesso (Google, Instagram, Apple, local password) per lo stesso account.
*   `Profile` (1 --- 1) `Account` (opzionale): Consente l'associazione di profili ad account specifici.
*   `ProfileGuardianRelation` (Tabella di Join N --- M): Associa un **Profilo Atleta Minorenne** ad un **Account Genitore/Tutore**. Questa tabella relazionale consente ad un singolo Account Genitore di avere più record collegati (gestione multi-figlio) e, teoricamente, ad un minore di avere più di un tutore abilitato (madre e padre).
*   `AccountIdentityAuditLog` (1 --- N) con `Account`: Registra in modo immutabile la storia dei cambi di provider e credenziali degli utenti.
