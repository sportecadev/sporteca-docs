# 03 - Architettura Backend Consolidata (Jmix & Spring Boot Engine) ⚙️☕

Questo documento descrive la struttura del backend di **Sporteca**, interamente concentrato all'interno del nuovo repository unificato **`sporteca-backend`**. Spiega come il framework **Jmix** (basato su **Spring Boot**) gestisca in modo integrato sia l'interfaccia di amministrazione Cockpit sia i servizi REST stateless ad alte prestazioni per le applicazioni client, con particolare attenzione all'integrazione di **Microsoft Entra ID** e dei **Social Logins**.

---

## 🏗️ Modello di Sviluppo: Backend Unificato ed Isolamento REST

Tutti i vecchi sotto-servizi frammentati di `sporteca-api` confluiscono nel repository **`sporteca-backend`** sotto forma di pacchetti Java ordinati all'interno di un unico monolite Spring Boot altamente coeso e modulare.

L'applicazione si divide fisicamente e logicamente in due motori:

```
+──────────────────────────────────────────────────────────────────────────────────────────+
|                                     SPORTECA BACKEND                                     |
|                       (Spring Boot 3.x + Jmix 2.x - Singolo Eseguibile)                  |
+──────────────────────────────────────────────────────────────────────────────────────────+
|                                                                                          |
|  [ Motore A: Jmix Flow UI (Stateful) ]     [ Motore B: REST API Modulari (Stateless) ]   |
|  - Cockpit Amministrativo di Back-Office   - Esposizione endpoint per App / Web          |
|  - Gestione Configurazioni Sport/Skills    - Moduli: Auth, Profiles, Localities, Skills  |
|  - Flusso Validazione Anagrafica e Doc     - Isolato dal rendering grafico Vaadin        |
|                                                                                          |
+──────────────────────────────────────────────────────────┬───────────────────────────────+
                                                           |
                                                           v
                                            [ Database Unificato (MySQL) ]
                                            - Tabelle Jmix standard (Utenti, Ruoli)
                                            - Tabelle di Configurazione Sport & Skills
                                            - Tabelle profili segregati per tenant
```

---

## 🔒 Architettura di Sicurezza e Canali di Autenticazione

La configurazione di Spring Security nel backend gestisce simultaneamente tre canali di autenticazione distinti, emulando il collaudato pattern del sistema enterprise di riferimento (`onepro-backend`):

### 1. Canale Amministrativo (Jmix Cockpit Web UI)
*   **Tecnologia**: Stateful, basato su cookie di sessione protetti e Spring Security HTTP Session.
*   **Attori**: Super Amministratori e operatori del Back-Office.
*   **Flusso**: Autenticazione classica tramite Username e Password locali verificati sul database Jmix.

### 2. Canale Social Stateless (App Flutter / Atleti e Staff)
*   **Tecnologia**: Stateless JWT (JSON Web Tokens).
*   **Attori**: Atleti, Staff, Genitori.
*   **Flusso**:
    1.  L'utente esegue l'autenticazione tramite Google o Apple OAuth2.
    2.  Il client invia il token del provider a `/api/v1/auth/social-login`.
    3.  Il backend convalida il token esternamente e genera una coppia di token locali:
        *   **Access Token (JWT)**: Firmato asimmetricamente con chiave privata del server.
        *   **Refresh Token**: Memorizzato a database per mantenere attiva la sessione sul dispositivo mobile senza richiedere continui re-login.
    4.  Le chiamate successive alle API includono il JWT nell'header: `Authorization: Bearer <token>`.

### 3. Canale Enterprise SSO (Società Sportive - Company)
*   **Tecnologia**: Spring Security OAuth2 Resource Server integrato con **Microsoft Entra ID (Azure AD)**.
*   **Attori**: Dipendenti e collaboratori delle Società Sportive.
*   **Flusso**:
    1.  L'utente della Società effettua l'autenticazione sul portale federato di Microsoft Entra.
    2.  Il browser/client riceve il token JWT emesso da Microsoft.
    3.  Il client include questo token JWT in ogni chiamata API.
    4.  Lo strato Spring Security Resource Server di `sporteca-backend` intercetta l'header, scarica le chiavi pubbliche di firma Microsoft tramite l'indirizzo configurato **JWKS** (con caching locale), e convalida la firma del token in modo asincrono e stateless.

---

## 🔄 Il Pattern di Provisioning Dinamico (`UserProvisioningService`)

Per supportare l'autenticazione tramite Microsoft Entra ID senza richiedere all'amministratore di creare manualmente le anagrafiche dei dipendenti delle società prima del loro primo accesso, il backend implementa il pattern **`UserProvisioningService`** (estratto dal progetto di riferimento `onepro-backend`).

Quando un JWT valido da Microsoft Entra ID arriva per la prima volta:
1.  Il `JwtTokenAuthenticationConverter` estrae i claims principali (`preferred_username`, `email`, `given_name`, `family_name`, e i gruppi/ruoli di appartenenza).
2.  Delega la risoluzione al componente **`UserProvisioningService.solve()`**:
    *   **Se l'utente non esiste**: Crea un'istanza dell'entità `User` Jmix, genera una password casuale forte tramite `SecureRandom` e la cripta, imposta lo stato a `ACTIVE_UNVALIDATED` e la salva a DB.
    *   **Se l'utente esiste**: Aggiorna i campi di contatto istituzionali.
3.  **Sincronizzazione Dinamica dei Ruoli**:
    *   Il servizio mappa i gruppi di sicurezza Microsoft nei ruoli di sicurezza Jmix (`ResourceRole` e `RowLevelRole`).
    *   Crea i record nella tabella Jmix `RoleAssignmentEntity` per associare all'istante l'utente ai permessi corretti.
    *   Rimuove automaticamente i permessi di sicurezza Jmix non più elencati nel JWT, garantendo l'immediata revoca dell'accesso in caso di disabilitazione aziendale dell'utente.

---

## 🚀 Isolamento delle API REST per Client ed Embed

Tutte le API REST destinate ad essere consumate dall'App mobile e dai widget esterni (es. WordPress) sono implementate tramite classici `@RestController` di Spring Boot.

Questi controller:
1.  **Isolamento**: Non hanno alcuna dipendenza grafica con Vaadin o con il motore Flow UI di Jmix.
2.  **Prestazioni**: Interrogano direttamente lo strato dei servizi Spring e utilizzano `UnconstrainedDataManager` o query native JPQL per azzerare l'overhead di caricamento delle schermate visuali, garantendo risposte sub-50ms.
3.  **Internazionalizzazione (i18n)**:
    *   Le tabelle dinamiche (es. nomi dei ruoli, categorie) contengono colonne MySQL di tipo **JSON** (es. `{"it": "Attaccante", "en": "Striker"}`).
    *   I controller leggono l'header HTTP `Accept-Language` e restituiscono solo la traduzione corrispondente al client, mantenendo il payload JSON compatto ed efficiente.
