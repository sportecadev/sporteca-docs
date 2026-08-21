# UC-09 - Autenticazione Enterprise & Provisioning via Microsoft Entra ID

Stato: confermato
Ultimo aggiornamento: 2026-08-21
Documenti correlati: uc-01_registrazione-utente.md, uc-02_login-utente.md, 01-decisioni-perimetro-mvp.md

## Obiettivo

Definire il flusso di integrazione con **Microsoft Entra ID (Azure AD)** per le Società Sportive (Company) che richiedono un accesso istituzionale sicuro ed Enterprise Single Sign-On (SSO). Il sistema convalida il token JWT emesso da Microsoft e provvede alla creazione/aggiornamento dinamico delle utenze locali in Jmix (**User Provisioning**) e all'assegnazione automatica dei ruoli operativi di sicurezza.

---

## 🏗️ Architettura del Flusso (Pattern "onepro-backend")

L'integrazione segue il modello strutturato estratto dall'architettura del sistema enterprise di riferimento, che unisce Spring Security OAuth2 Resource Server con il motore di persistenza e sicurezza di Jmix.

```
[ Società Sportiva ]             [ Client App/Web ]           [ Microsoft Entra ID ]         [ sporteca-backend ]
         |                              |                              |                              |
         | 1. Seleziona login aziendale |                              |                              |
         |----------------------------->|                              |                              |
         |                              | 2. Reindirizza a Microsoft ->|                              |
         | 3. Login & MFA su Entra ID   |                              |                              |
         |<-----------------------------|----------------------------->|                              |
         |                              |<-4. Ritorna JWT Token firmato|                              |
         |                              |                              |                              |
         |                              | 5. Chiamata API con Bearer JWT Token ----------------------->|
         |                              |                                                             | 6. Valida firma asimmetrica
         |                              |                                                             |    del token con JWKS Entra ID
         |                              |                                                             | 7. Passa claims a
         |                              |                                                             |    UserProvisioningService
         |                              |                                                             | 8. Solve (Create or Update)
         |                              |                                                             |    user con password random
         |                              |                                                             | 9. Sincronizza ruoli Jmix
         |                              |                                                             |    basandosi sui gruppi JWT
         |                              |<---------------------------------- 10. Ritorna sessione OK -|
```

---

## Attori

- Collaboratore della Società Sportiva (User)
- Provider Microsoft Entra ID (Identity Provider - IdP)
- `UserProvisioningService` (Servizio del backend Sporteca)
- Sistema (piattaforma Sporteca)

---

## Flusso Principale: Login & Provisioning Automatico

1. L'utente clicca su "Accedi con Microsoft Entra / Account Aziendale" dall'interfaccia client.
2. Il client avvia il redirect OAuth2 / OpenID Connect (OIDC) verso l'URL di autorizzazione del tenant Microsoft Entra configurato in piattaforma.
3. L'utente inserisce le credenziali aziendali e supera l'eventuale Multi-Factor Authentication (MFA) imposta dalle policy della propria azienda.
4. Microsoft Entra ID emette un token di identità firmato asimmetricamente (**JWT - JSON Web Token**) contenente le informazioni chiave (Claims) dell'utente:
    *   `unique_name` / `preferred_username`: Username dell'utente (email aziendale).
    *   `email`: Email istituzionale.
    *   `given_name` / `family_name`: Nome e Cognome del collaboratore.
    *   `groups` / `roles`: Elenco dei gruppi di appartenenza aziendali associati all'applicazione.
5. Il client riceve il token JWT e lo inoltra nell'header delle richieste HTTP dirette alle API del backend:
   `Authorization: Bearer <token_jwt_entra>`
6. Lo strato **Spring Security Resource Server** del backend intercetta la richiesta:
    *   Scarica periodicamente le chiavi pubbliche di Microsoft tramite l'endpoint JWKS (`well-known/jwks.json`) per verificare istantaneamente la firma del token in modo stateless.
    *   Estrae i claims dal token validato.
7. Il backend delega la gestione dell'utente al componente interno **`UserProvisioningService`** invocando il metodo `solve(username, attributes, whitelistRoles)`.
8. Il `UserProvisioningService` effettua una ricerca nel database locale di Sporteca tramite `UnconstrainedDataManager` cercando se esiste già un utente Jmix associato a quello specifico `username`:

    *   ### Scenario A: L'utente non esiste a database (Nuovo Provisioning)
        1. Il sistema crea una nuova istanza dell'entità `User` / `Account`.
        2. Popola i dati anagrafici estraendoli dai claims: `email`, `firstName`, `lastName`, `provider = MICROSOFT_ENTRA`.
        3. Genera una password casuale forte tramite `SecureRandom` e la cripta con `PasswordEncoder` per soddisfare i vincoli tecnici di Jmix (sebbene l'utente non la userà mai direttamente).
        4. Imposta l'account in stato `ACTIVE_UNVALIDATED`.
        5. Salva l'utente a database.
        6. Associa dinamicamente i gruppi Microsoft a **Ruoli Jmix (Resource e Row-Level Roles)**, inserendo i record di associazione nella tabella `RoleAssignmentEntity`.

    *   ### Scenario B: L'utente esiste già a database (Sincronizzazione Profilo)
        1. Il sistema carica il record dell'utente Jmix esistente.
        2. Aggiorna eventuali variazioni di `email`, `firstName` e `lastName` ricevute dall'IdP.
        3. Sincronizza i ruoli di sicurezza Jmix:
            *   Rimuove le associazioni a ruoli Jmix non più presenti nei gruppi del token JWT appena ricevuto (escludendo eventuali ruoli speciali presenti in una *Whitelist* locale di ruoli manuali).
            *   Aggiunge i record di associazione per i nuovi ruoli Jmix mappati dai nuovi gruppi presenti nel token JWT.
        4. Salva le modifiche a database.

9. Una volta risolto il provisioning, Spring Security associa la sessione corrente all'utente autenticato a livello di Jmix Context.
10. Il backend autorizza l'esecuzione dell'API richiesta e la risposta viene inoltrata con successo al client.

---

## 🔒 Regole di business per la Sicurezza Enterprise

*   **Whitelist dei Ruoli manuali**: Nel processo di rimozione dei ruoli non più presenti nel JWT di Entra, il backend mantiene intatti i ruoli speciali Jmix (es. *Super Admin* o ruoli di emergenza) assegnati manualmente dall'interfaccia di Jmix Cockpit, purché siano specificati all'interno della lista `whitelistRoles` nel codice di provisioning.
*   **Rotazione delle Chiavi di Firma**: Il backend non memorizza le chiavi di crittografia di Microsoft, ma le consulta in cache tramite l'endpoint ufficiale JWKS di Azure. Se Microsoft ruota le sue chiavi di sicurezza, il backend si allinea in automatico senza disservizi o necessità di riavvii.
*   **Password Casuale Cifrata**: La password casuale generata in fase di creazione del record utente garantisce la compatibilità con i plugin di sicurezza Jmix, ma non è esposta a nessun livello del sistema, costringendo l'utente aziendale a transitare unicamente tramite la federazione di Microsoft Entra ID.
