# UC-01 - Registrazione utente e Canali d'Accesso Separati

Stato: confermato
Ultimo aggiornamento: 2026-08-21
Documento correlato: 01-decisioni-perimetro-mvp.md

## Obiettivo

Permettere a un visitatore non autenticato di creare un account sulla piattaforma Sporteca. Il flusso divide gli utenti per tipologia per garantire che le Società Sportive utilizzino canali istituzionali formali, mentre Atleti, Membri dello Staff e Genitori godano di accessi moderni e rapidi (Social Logins). Applica fin dal primo accesso la conformità sul trattamento dati dei minori (GDPR).

---

## 👥 Canali d'Accesso Separati per Ruolo

Per garantire la massima coerenza e sicurezza nel matching, Sporteca adotta canali di registrazione differenziati:

| Ruolo Profilo | Canale Registrazione Social (Google/Apple) | Canale Registrazione Classico (Email + Password) | Canale Registrazione Enterprise SSO (Microsoft Entra) |
| --- | :---: | :---: | :---: |
| **Atleta / Genitore** | **Sì (Fortemente consigliato)** | Sì | No |
| **Membro dello Staff** | **Sì (Fortemente consigliato)** | Sì | No |
| **Società Sportiva (Company)**| **NO (Disabilitato)** | **Sì (Istituzionale)** | **Sì (Enterprise Integration)** |

### Razionale di business:
*   **Società Sportive (Company)**: Gestiscono dati contrattuali, sblocchi economici, Partita IVA e informazioni sensibili. Devono registrarsi esclusivamente con la loro email istituzionale (es. `segreteria@acmilan.it`) o tramite SSO aziendale. Questo previene il rischio che un profilo societario venga legato permanentemente al profilo Google o Apple personale di un singolo dipendente o collaboratore.
*   **Atleti, Staff e Genitori**: L'esperienza utente deve essere ultra-rapida. I Social Provider (Google, Apple OAuth2) garantiscono l'immediata verifica dell'email, riducendo l'attrito del caricamento e migliorando il tasso di conversione.

---

## Attori

- Utente non autenticato (visitatore che si registra)
- Genitore/tutore (solo per utenti under 14, come attore di conferma esterno)
- Provider di identità esterno: Google, Apple (solo per Atleta, Staff, Genitore)
- Provider Enterprise SSO: Microsoft Entra ID (solo per Società Sportive)
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
5. Il sistema invia un'email di attivazione con un token sicuro a scadenza (24 ore).
6. Al click sul link, l'account passa a `ACTIVE_UNVALIDATED` e l'utente viene indirizzato allo step di profilazione (UC-04/05/06).

---

## Flusso principale B - Registrazione via Provider Social (Solo Atleta, Staff, Genitore)

1. L'utente seleziona un provider abilitato: **Google** o **Apple**.
2. Il sistema avvia la sequenza OAuth2/OIDC verso il provider.
3. L'utente si autentica e autorizza la condivisione dell'email (già verificata a monte dal provider).
4. Il sistema riceve l'email e l'identificativo unico del provider (Subject / User ID).
5. Il sistema effettua la verifica di esistenza dell'account:
    *   **Se l'email esiste già**: Applica il flusso alternativo **A1 (Accorpamento automatico / Merge)** e reindirizza al login.
    *   **Se l'email è nuova**: Prosegue con la creazione dell'account.
6. Il sistema richiede obbligatoriamente all'utente la data di nascita (non condivisa dai provider social) per determinare la fascia d'età.
7. Il sistema applica la logica minori in base alla fascia d'età:
    *   **14+ / Adulto**: L'account viene impostato direttamente in stato `ACTIVE_UNVALIDATED` senza ulteriori email di conferma (l'email è già verificata dal social provider).
    *   **Under 14**: Richiede l'email del genitore/tutore per avviare il flusso di doppia conferma. L'account rimane disattivato fino al consenso del genitore.
8. Nessuna password locale viene registrata per gli utenti creati via Social.

---

## Flusso principale C - Registrazione via Enterprise SSO / Microsoft Entra (Solo Società)

1. L'utente (Società Sportiva) seleziona "Registrati tramite Account Aziendale (Microsoft Entra)".
2. Il sistema avvia la federazione SAML 2.0 / OpenID Connect verso il tenant Microsoft configurato per la Società (o il tenant multitenant di Sporteca Enterprise).
3. L'utente effettua il login aziendale e autorizza lo scambio delle credenziali.
4. Il sistema riceve il JWT Token firmato da Microsoft, estrae le informazioni della Società:
    *   Email istituzionale.
    *   Ragione sociale della società.
    *   Username univoco basato sulla mail istituzionale.
5. Il sistema effettua il provisioning automatico dell'account (in linea con il pattern `UserProvisioningService` descritto nell'architettura). L'account viene impostato in stato `ACTIVE_UNVALIDATED` poiché l'email è già certificata dall'infrastruttura Enterprise.
6. L'utente viene reindirizzato alla compilazione dei dati societari integrativi (Partita IVA e Certificato CONI - UC-04).

---

## Flussi alternativi e Accorpamenti

### A1 - Accorpamento automatico (Merge) delle identità
Se un utente tenta la registrazione social o enterprise con una mail già registrata tramite credenziali classiche (o un altro provider):
1. Il sistema verifica che l'email coincida.
2. Collega automaticamente il nuovo provider social o aziendale come **metodo di accesso aggiuntivo (AuthMethod)** all'account esistente.
3. Non viene duplicato alcun record nel database.
4. L'utente mantiene tutte le proprie anagrafiche e profili intatti e da quel momento può effettuare il login con entrambi i canali.

---

## Regole di business e Conformità Minori (GDPR)

*   **Under 14 - Doppia Conferma**: L'attivazione richiede obbligatoriamente il click del minore sul link di attivazione E il consenso esplicito del genitore/tutore (fornito cliccando sul link inviato alla sua email). Fino ad allora lo stato è `PENDING_PARENT_CONSENT`.
*   **Univocità dell'Email**: Ad ogni indirizzo email corrisponde una sola entità `Account` logica, indipendentemente dai provider di accesso collegati.
*   **Sicurezza dei Social Account**: Nessuna password locale viene creata per gli utenti registrati esclusivamente con provider esterni. Se tentano un ripristino password classico, il sistema devia l'utente spiegando che l'accesso è veicolato via Social.
*   **Restrizione Società**: Qualsiasi tentativo di associare un account Società con un provider social personale (Google/Apple) viene bloccato dall'interfaccia e dalle API di validazione del backend.
