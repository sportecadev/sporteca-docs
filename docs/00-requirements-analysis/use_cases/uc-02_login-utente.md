# UC-02 - Login e Gestione delle Sessioni JWT

Stato: confermato
Ultimo aggiornamento: 2026-08-21
Documenti correlati: uc-01_registrazione-utente.md, 01-decisioni-perimetro-mvp.md

## Obiettivo

Consentire a un utente registrato di accedere alla piattaforma Sporteca, garantendo che le Società Sportive utilizzino canali istituzionali (credenziali classiche o SSO Microsoft Entra) e gli Atleti/Staff/Genitori utilizzino credenziali social (Google/Apple) o classiche, gestendo correttamente lo stato dell'account e restituendo un token JWT per sessioni stateless.

---

## Attori

- Utente registrato
- Provider di identità esterno: Google, Apple (solo Atleti, Staff, Genitori)
- Provider Enterprise SSO: Microsoft Entra ID (solo Società Sportive)
- Sistema (piattaforma Sporteca)

## Precondizioni

- L'utente possiede un account esistente creato tramite UC-01, con almeno un metodo di autenticazione associato.

## Trigger

L'utente accede alla schermata di login del client (App o Web) e seleziona il proprio ruolo per visualizzare le modalità d'accesso consentite.

---

## Flusso principale A - Login Classico (Tutti i ruoli)

1. L'utente inserisce la propria email (o username) istituzionale/personale e la password.
2. Il sistema esegue la verifica delle credenziali a livello di database.
3. Se le credenziali sono errate, si attiva l'eccezione **E1 (Credenziali non valide - Anti-Enumeration)**.
4. Se le credenziali sono corrette, il sistema controlla lo stato dell'account:
    *   **Stato `PENDING_ACTIVATION` o `PENDING_PARENT_CONSENT`**: L'accesso viene bloccato (Rimanda a **E2**).
    *   **Stato `SUSPENDED`**: L'accesso viene bloccato (Rimanda a **E5**).
    *   **Stato `ACTIVE_UNVALIDATED` o `ACTIVE_VALIDATED`**: Accesso consentito.
5. Il sistema genera una coppia di token stateless:
    *   **Access Token (JWT)**: Validità breve (es. 1 ora), firmato asimmetricamente dal backend. Contiene l'UUID dell'account, il ruolo e lo stato di validazione del profilo.
    *   **Refresh Token**: Validità lunga (es. 30 giorni), memorizzato su database per consentire la rigenerazione automatica della sessione ed il tracciamento del dispositivo.
6. Il client (App React o App Flutter) memorizza i token e reindirizza l'utente alla dashboard con le restrizioni specifiche del suo stato.

---

## Flusso principale B - Login via Provider Social (Solo Atleta, Staff, Genitore)

1. L'utente seleziona "Accedi con Google" o "Accedi con Apple".
2. Il sistema avvia il protocollo OAuth2/OIDC verso il provider.
3. Il provider restituisce l'esito positivo dell'autenticazione ed il token d'identità.
4. Il sistema convalida il token del provider ed estrae l'identificativo unico (Subject ID) ed email.
5. Il sistema verifica se l'identificativo o l'email è collegata a un account registrato in Sporteca:
    *   **Se non collegato**: Blocca l'accesso e propone di registrarsi (UC-01).
    *   **Se collegato**: Verifica lo stato dell'account (vedi Flusso Classico) e genera la sessione JWT.

---

## Flusso principale C - Login via Microsoft Entra ID / Enterprise SSO (Solo Società)

1. L'utente (Società Sportiva) seleziona "Accedi con Account Aziendale".
2. Il sistema reindirizza il browser dell'utente alla pagina di login federata di Microsoft Entra ID.
3. Il server di Microsoft convalida le credenziali aziendali e rimanda l'utente al backend di Sporteca con il JWT firmato contenente i claims della società.
4. Il backend valida il token, estrae le informazioni della società, e provvede a sincronizzare e aggiornare l'utenza locale (tramite il pattern `UserProvisioningService` descritto nell'architettura).
5. Il sistema genera la sessione con Access Token e Refresh Token dedicati per la sessione client della Società.

---

## Eccezioni e Sicurezza

### E1 - Credenziali classiche errate o inesistenti (Anti-Enumeration)
Per impedire ad hacker o terzi malintenzionati di scoprire quali indirizzi email sono registrati sulla piattaforma, il sistema risponde sempre con un messaggio d'errore generico: *"Email o Password errata"*. La risposta è identica sia nel caso in cui la mail non esista a database, sia nel caso in cui la password sia errata.

### E2 - Account non attivo (Attivazione o Consenso Genitore pendente)
Il login viene bloccato. La schermata mostra all'utente lo stato attuale (es. *"In attesa di consenso del genitore"* o *"Verifica la tua email"*) e fornisce un comodo pulsante per reinviare immediatamente la comunicazione (attivazione o consenso genitore) senza dover ripetere la registrazione.

### E3 - Login classico su account creato solo via Social
Se un utente tenta di inserire l'email e una password fittizia per un account che è stato registrato esclusivamente tramite Google/Apple (nessuna password locale presente a DB), il sistema risponde con un messaggio dedicato: *"Questo account è gestito tramite Google/Apple. Effettua l'accesso cliccando sull'icona del tuo social provider."*

### E5 - Account Sospeso
Login bloccato definitivamente. Il sistema restituisce un codice di errore specifico e una schermata che invita l'utente a contattare l'assistenza per via amministrativa.

---

## Postcondizioni

*   Sessione stateless creata sul client tramite JWT token.
*   Il backend convalida le chiamate successive verificando semplicemente la firma asimmetrica del JWT, garantendo tempi di risposta inferiori a 50ms (senza overhead di interrogazione del database ad ogni chiamata).
