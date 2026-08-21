# UC-09 - Gestione dell'Identità, Collegamento Account (Merge) e Multi-Profilo

Stato: confermato
Ultimo aggiornamento: 2026-08-21
Documenti correlati: uc-01_registrazione-utente.md, uc-02_login-utente.md, 01-decisioni-perimetro-mvp.md

## Obiettivo

Definire le linee guida concettuali per la gestione delle identità degli utenti su Sporteca. L'obiettivo è garantire la massima flessibilità: consentire ad un singolo **Account** di collegarsi a molteplici **Metodi di Autenticazione** (classici e social), unire dinamicamente le credenziali nel tempo (Merge/Join) e permettere l'associazione di un Account a **uno o più Profili** (ad esempio, un genitore che gestisce più figli minorenni).

---

## 🛠️ 1. Il Concetto di Account vs Profilo

Per supportare flussi complessi, l'architettura separa nettamente l'identità di accesso dai dati operativi:

*   **Account (Identità di Login)**: Rappresenta le credenziali e i metodi per accedere. È unico per indirizzo email. Contiene la lista dei metodi di accesso associati (`AuthMethod`: password locale, Google, Apple, Instagram, Microsoft Entra).
*   **Profilo (Scheda Operativa)**: Rappresenta il ruolo effettivo sulla piattaforma (Atleta, Membro dello Staff, Società Sportiva). Contiene i dati anagrafici, sportivi, documenti e certificati.

---

## 🔄 2. Collegamento Dinamico dei Canali (Auth Join/Merge)

Il sistema deve consentire ad un utente di arricchire i propri metodi di accesso in qualsiasi momento, sia in fase di registrazione sia successivamente dalle impostazioni del proprio profilo.

### Regole di Join:
1.  **Da Classico a Social/Enterprise**: Se un utente si registra inizialmente con Email e Password, deve poter andare nelle impostazioni e cliccare su "Collega Google" o "Collega Instagram". Da quel momento, il sistema inserisce un record `AuthMethod` associato all'account esistente. L'utente potrà accedere indifferentemente inserendo la password o cliccando sull'icona social.
2.  **Da Social a Social**: Un utente registrato tramite Google può successivamente collegare Apple o Instagram.
3.  **Merge automatico al Login**: Se un utente è già registrato con una mail ed in un secondo momento tenta di fare login cliccando su un social provider che condivide la **stessa identica email**, il sistema esegue un accorpamento silente: aggiunge il provider social alla lista dei metodi abilitati per quell'account e lo fa entrare direttamente, evitando la duplicazione delle identità.

---

## 🚦 3. Flusso di Registrazione Smart e Profilazione Differenziata

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
    *   **Canali**: L'Account deve essere di tipo istituzionale (credenziali classiche o SSO Microsoft Entra). I canali social personali sono disabilitati.
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

## 👨‍👩‍👧‍👦 4. Scenario Reale: Gestione Multi-Figlio (Genitore / Tutore)

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
    *   Il Figlio 2 (maggiore di 14 anni) si registra autonomamente tramite **Google Login**.
    *   In fase di profilazione, inserisce i dati del genitore e aggancia il *Profilo Figlio 2* all'**Account Genitore** già esistente nel sistema.
    *   Il Genitore riceve una notifica sul suo pannello e conferma il collegamento. Da questo momento il Figlio 2 accede autonomamente tramite Google, ma il genitore ha visibilità sulla sua scheda.

---

## 💾 5. Impatto sul Modello Dati Relazionale

Per supportare questo schema flessibile, le tabelle del database di `sporteca-backend` devono essere strutturate così:

*   `Account` (1 --- N) `AuthMethod`: Consente la memorizzazione di più metodi d'accesso (Google, Instagram, Apple, local password) per lo stesso account.
*   `Profile` (1 --- 1) `Account` (opzionale): Consente l'associazione di profili ad account specifici.
*   `ProfileGuardianRelation` (Tabella di Join N --- M): Associa un **Profilo Atleta Minorenne** ad un **Account Genitore/Tutore**. Questa tabella relazionale consente ad un singolo Account Genitore di avere più record collegati (gestione multi-figlio) e, teoricamente, ad un minore di avere più di un tutore abilitato (madre e padre).
