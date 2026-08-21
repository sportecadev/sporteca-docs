# UC-02 - Login, Sessioni JWT e Gestione del Provider Attivo

Stato: confermato
Ultimo aggiornamento: 2026-08-21
Documenti correlati: uc-01_registrazione-utente.md, 01-decisioni-perimetro-mvp.md, uc-09_gestione-identita-collegamento-account.md

## Obiettivo

Consentire a un utente registrato di accedere alla piattaforma Sporteca. Il flusso riconosce la tipologia dell'utente in base alla **sorgente di verità del Profilo dichiarato** (Atleta, Staff, Società) e non sul dominio della mail aziendale. Gestisce l'instradamento in base al **Provider Primario** attivo (local credentials vs social login), disabilitando le credenziali locali se il provider esterno comanda l'accesso, ed esegue il logging puntuale per consentire al back-office il ripristino amministrativo dell'accesso.

---

## Attori

- Utente registrato
- Provider d'identità personale: Google, Apple (solo Atleta, Staff, Genitore)
- Provider Professional/SSO: Google Workspace, Microsoft 365, Okta (opzionali per Società)
- Sistema (piattaforma Sporteca)

## Precondizioni

- L'utente possiede un account esistente (UC-01) con almeno un metodo di autenticazione associato.

## Trigger

L'utente accede alla schermata di login e seleziona il proprio metodo d'accesso (classico o federato/social).

---

## Flusso principale A - Login Classico (Password locale attiva)

1. L'utente inserisce la propria email e la password.
2. Il sistema controlla nel database Jmix se l'account dispone di una password locale attiva (`primary_provider` = `LOCAL` e `password_hash` non nullo):
    *   **Se l'account ha il login social come primario (`primary_provider` != `LOCAL`)**: Il sistema blocca il login classico e devia l'utente su **E3 (Login Social richiesto)**.
3. Il sistema convalida la password.
4. Se corretta, il sistema controlla lo stato dell'account (`PENDING_ACTIVATION`, `PENDING_PARENT_CONSENT`, `SUSPENDED` bloccano l'accesso).
5. Se lo stato è abilitato (`ACTIVE_UNVALIDATED` o `ACTIVE_VALIDATED`), il sistema:
    *   Genera la coppia **Access Token (JWT)** e **Refresh Token**.
    *   Registra l'evento di login con successo nel **Registro Storico di Audit delle Identità** (indicando timestamp e IP).
6. Il client carica la dashboard corrispondente alla tipologia di profilo dell'utente (Società, Atleta, Staff).

---

## Flusso principale B - Login via Provider Social/SSO (Google / Apple / M365)

1. L'utente seleziona "Accedi con Google" o "Accedi con Apple".
2. Il sistema avvia la sequenza OAuth2/OIDC verso il rispettivo provider.
3. Il provider esterno valida l'utente e restituisce il token d'identità firmato.
4. Il backend di Sporteca convalida la firma del token dell'IdP esterno, estrae il Subject ID e l'email aziendale/personale dell'utente.
5. Il sistema esegue la ricerca a database:
    *   **Se l'utente non esiste**: Blocca l'accesso e propone di registrarsi (UC-01).
    *   **Se l'utente esiste ma è associato ad un altro provider primario**:
        *   Se l'email coincide, il sistema effettua l'accorpamento dinamico dei canali (Join/Merge), aggiornando il `primary_provider` sul record account e **disabilitando/sbiacando la password locale** per questioni di sicurezza, delegando l'accesso unicamente al provider social.
        *   Registra l'evento di cambio provider e login con successo nel **Registro Storico di Audit delle Identità**.
6. Il sistema controlla lo stato dell'account e rilascia i token JWT locali per la dashboard del client.

---

## Eccezioni e Procedure di Emergenza del Back-Office

### E1 - Credenziali locali non corrette (Anti-Enumeration)
Risposta d'errore standard generica: *"Email o password errata"*.

### E3 - Tentativo di Login classico su account a comando Social (Password Sbiacata)
Se l'utente inserisce email/password locali su un account in cui il `primary_provider` è impostato su `GOOGLE` o `APPLE` (ad esempio dopo aver unito le credenziali), il sistema **impedisce il login locale** e mostra a schermo il messaggio: *"Questo account è governato dal provider [Google/Apple]. Per accedere, clicca sull'icona corrispondente. Se desideri ripristinare la password classica, contatta l'assistenza."*

### 🛠️ Flusso di Ripristino Accesso da Back-office (Emergenza)
Se un utente perde l'accesso al proprio provider social (es. account Google aziendale disattivato) ed è impossibilitato ad entrare:
1. L'utente contatta l'assistenza amministrativa.
2. L'operatore del back-office Jmix accede all'**Identity Audit Log** dell'account utente.
3. Riesamina l'intera storia dell'account (es. *Registrato in Data X via LOCAL, collegato Google in Data Y, password disabilitata*).
4. L'operatore esegue l'azione di emergenza **"Ripristina Canale Locale (Force Local Auth)"**:
    *   Imposta `primary_provider` = `LOCAL`.
    *   Invia una mail di reset password tramite la procedura moderna OTP (UC-03).
    *   Scollega il provider social non più accessibile.
5. Qualsiasi azione manuale di ripristino dell'operatore viene registrata in modo immutabile nel **Registro Storico di Audit delle Identità** indicando l'identificativo dell'operatore, per prevenire abusi o attacchi di ingegneria sociale.
