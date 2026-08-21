# UC-01 - Registrazione utente e Canali d'Accesso Separati

Stato: confermato
Ultimo aggiornamento: 2026-08-21
Documento correlato: 01-decisioni-perimetro-mvp.md

## Obiettivo

Permettere a un visitatore non autenticato di creare un account sulla piattaforma Sporteca. Il flusso divide gli utenti per tipologia di profilo dichiarato (Atleta, Membro dello Staff, Società Sportiva), la quale costituisce la sorgente di verità del sistema, senza imporre vincoli rigidi o escludere email consumer (es. `@gmail.com`), salvaguardando così l'iscrizione delle piccole associazioni dilettantistiche locali. Applica fin dal primo accesso la conformità sul trattamento dati dei minori (GDPR) e traccia l'origine della creazione dell'account.

---

## 👥 Canali d'Accesso per Ruolo

Sporteca adotta canali di registrazione differenziati basati esclusivamente sulla **Tipologia di Profilo** selezionata dall'utente in fase di registrazione, e non sul dominio dell'email aziendale:

| Ruolo Profilo | Canale Registrazione Social (Google/Apple Personale) | Canale Registrazione Classico (Email + Password) | Canale Registrazione Enterprise / Professional SSO |
| --- | :---: | :---: | :---: |
| **Atleta / Genitore** | **Sì (Google/Apple)** | Sì | No |
| **Membro dello Staff** | **Sì (Google/Apple)** | Sì | No |
| **Società Sportiva (Company)**| **NO (Disabilitato per account personali)** | **Sì (Istituzionale/Standard)** | **Sì (SSO Professionale se configurato)** |

### Razionale di business e Inclusività Locale:
*   **Società Sportive (Company)**: Gestiscono dati contrattuali, sblocchi economici, Partita IVA e informazioni sensibili. 
    *   *Nessun blocco domini*: Moltissime piccole associazioni sportive dilettantistiche italiane (A.S.D.) non possiedono un dominio email proprio a causa di limiti di budget, e utilizzano comunemente email consumer (es. `asd.paesello@gmail.com`). **Il sistema consente la registrazione di qualsiasi dominio email per le Società.**
    *   *Canale Social Disabilitato*: Per registrarsi, la Società non può cliccare direttamente sui pulsanti social personali (Google/Apple) nello step di registrazione pubblica, così da prevenire che la proprietà dell'account aziendale venga associata permanentemente al profilo Google personale di un singolo collaboratore provvisorio. Le Società accedono con credenziali classiche o federando l'infrastruttura aziendale se presente.
*   **Atleti, Staff e Genitori**: L'esperienza utente deve essere ultra-rapida. I Social Provider (Google, Apple OAuth2 personali) garantiscono l'immediata verifica dell'email, riducendo l'attrito e migliorando il tasso di conversione.

---

## Attori

- Utente non autenticato (visitatore che si registra)
- Genitore/tutore (solo per utenti under 14, come attore di conferma esterno)
- Provider di identità esterno: Google, Apple (solo per Atleta, Staff, Genitore - account personali)
- Provider Professional/Enterprise SSO (opzionale per Società con tenant dedicati)
- Sistema (piattaforma Sporteca)

## Precondizioni

- L'utente non possiede già un account con la stessa email, indipendentemente dal metodo originale di creazione (classico, social o enterprise).

## Trigger

L'utente accede alla pagina di registrazione e seleziona il proprio ruolo specifico (**Atleta, Membro Staff, Società**), determinando la visualizzazione dei relativi canali abilitati.

---

## Flusso principale A - Registrazione classica (Tutti i ruoli)

1. L'utente seleziona "Registrati con email".
2. L'utente inserisce: email, username, password, data di nascita, flag di accettazione privacy e marketing.
3. Il sistema valida in tempo reale:
    *   Formato email coerente.
    *   Univocità dell'indirizzo email e dello username nel database.
    *   Complessità password (minimo 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero, 1 carattere speciale).
4. Il sistema calcola l'età dell'utente ed applica la governance minori:
    *   **Under 14**: Richiede l'email obbligatoria del genitore/tutore e invia il link di consenso (doppia conferma).
    *   **14-17 anni**: Registrazione autonoma, l'account si attiva con conferma email standard; i dati/documento del genitore verranno richiesti in fase di profilazione (UC-05).
    *   **18+ (Adulto)**: Registrazione e attivazione autonoma standard.
5. Il sistema crea l'account impostando i campi di tracciamento di sicurezza:
    *   **`creation_provider`** = `LOCAL` (Indica l'origine della creazione dell'account).
    *   **`primary_provider`** = `LOCAL` (Indica il metodo di accesso attualmente attivo).
6. Il sistema registra un evento nel **Registro Storico di Audit delle Identità (Identity Audit Log)** dell'account (dettagliato in UC-09).
7. Il sistema invia un'email di attivazione con un token sicuro a scadenza (24 ore).
8. Al click sul link, l'account passa a `ACTIVE_UNVALIDATED` e l'utente viene indirizzato allo step di profilazione (UC-04/05/06).

---

## Flusso principale B - Registrazione via Provider Social (Solo Atleta, Staff, Genitore)

1. L'utente seleziona un provider abilitato: **Google** o **Apple** (account personali).
2. Il sistema avvia la sequenza OAuth2/OIDC verso il provider.
3. L'utente si autentica e autorizza la condivisione dell'email (già verificata a monte dal provider).
4. Il sistema riceve l'email e l'identificativo unico del provider (Subject / User ID).
5. Il sistema effettua la verifica di esistenza dell'account:
    *   **Se l'email esiste già**: Applica il flusso alternativo **A1 (Accorpamento automatico / Merge)** e reindirizza al login.
    *   **Se l'email è nuova**: Prosegue con la creazione dell'account.
6. Il sistema richiede obbligatoriamente all'utente la data di nascita (non condivisa dai provider social) per determinare la fascia d'età.
7. Il sistema crea l'account impostando:
    *   **`creation_provider`** = `GOOGLE` o `APPLE` (a seconda del provider scelto).
    *   **`primary_provider`** = `GOOGLE` o `APPLE` (il provider comanda l'autenticazione).
    *   **Password locale**: Disabilitata/mascherata (`password_hash` nullo).
8. Il sistema registra l'evento di creazione nel **Registro Storico di Audit delle Identità**.
9. Il sistema applica la logica minori in base alla fascia d'età ed indirizza alla profilazione.

---

## Flussi alternativi e Accorpamenti

### A1 - Accorpamento automatico (Merge) delle identità
Se un utente tenta la registrazione social o enterprise con una mail già registrata tramite credenziali classiche:
1. Il sistema verifica che l'email coincida.
2. Collega automaticamente il nuovo provider social come **metodo di accesso aggiuntivo (AuthMethod)** all'account esistente.
3. **Aggiornamento Sicurezza**: Se l'utente decide di rendere il provider social come canale primario, la password locale viene sbiacata/disabilitata e comanda il provider esterno.
4. Non viene duplicato alcun record nel database.
5. Il sistema registra la variazione nel **Registro Storico di Audit delle Identità**, specificando l'avvenuto collegamento.

---

## Regole di business e Conformità Minori (GDPR)

*   **Under 14 - Doppia Conferma**: L'attivazione richiede obbligatoriamente il click del minore sul link di attivazione E il consenso esplicito del genitore/tutore. Fino ad allora lo stato è `PENDING_PARENT_CONSENT`.
*   **Tracciabilità e Audit**: Qualsiasi transizione o aggiunta di metodi di accesso deve essere immutabilmente registrata a fini di ripristino dell'accesso da parte degli operatori del back-office in caso di problemi di login.
