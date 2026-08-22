# 03.1 - Architettura di Autenticazione, SSO e Integrazione API Jmix Marketplace 🔒🔑

Questo documento fornisce una valutazione architetturale approfondita per la gestione dell'autenticazione in **Sporteca**. Analizza i requisiti di accesso degli utenti del **Back-office** (operatori Sporteca) e del **Front-office** (Atleti, Staff, Società) e valuta l'adozione di due importanti add-on del Jmix Marketplace per l'integrazione di sistemi SSO ed API stateless.

---

## 👥 1. I Requisiti di Autenticazione in Sporteca

Per supportare l'ecosistema Sporteca, il sistema deve gestire due flussi di login profondamente distinti:

### A. Utenti del Back-office (Operatori Sporteca)
*   **Obiettivo**: Permettere agli amministratori interni e ai verificatori di accedere alla console **Jmix Cockpit (Flow UI)**.
*   **Canale**: Devono poter entrare utilizzando le proprie credenziali istituzionali associate al dominio aziendale di Sporteca (es. `admin@sporteca.it`, `operator@sporteca.it`).
*   **Architettura**: Stateful (Cookie di sessione, HTTPS standard) per visualizzare le schermate gestionali Vaadin.

### B. Utenti del Front-office (Atleti, Staff, Società Sportive)
*   **Obiettivo**: Consentire l'accesso da applicazioni esterne reattive (App Flutter per mobile, Dashboard React `sporteca-scaper-app` ed embed di terze parti).
*   **Metodi**: Supportare Social Logins (Google, Apple, Instagram personali) e credenziali classiche (Email + Password), oltre a Single Sign-On professionali (Google Workspace, M365) per i Club aziendali.
*   **Architettura**: **Rigidamente Stateless**. Tutte le chiamate alle API REST di `/api/v1/**` o `/rest/**` devono essere veicolate tramite **token JWT (Bearer Token)** per garantire scalabilità e performance sub-50ms.

---

## 🔍 2. Valutazione Tecnica dei Plugin Jmix Marketplace

### Add-on A: Jmix OpenID Connect (OIDC) 🏆 (VINCITORE ASSOLUTO)
*   **Marketplace URL**: [https://www.jmix.io/marketplace/openid-connect/](https://www.jmix.io/marketplace/openid-connect/)
*   **Tecnologia**: Basato su Spring Security OAuth2 Client e Spring Security OAuth2 Resource Server.
*   **Copertura Requisito Back-office**: **Eccellente**. Permette a Jmix di federarsi con un Identity Provider aziendale (come Microsoft Entra ID o Google Workspace configurato per il dominio `sporteca.it`). Quando un operatore accede al Cockpit, viene reindirizzato all'IdP corporate, effettua il login (anche MFA) e ritorna autenticato, mappando in automatico i ruoli Jmix amministrativi a partire dai gruppi aziendali.
*   **Copertura Requisito Front-office via API**: **Eccellente**. 
    *   L'add-on integra nativamente lo strato **OAuth2 Resource Server** in Spring Boot.
    *   Le API REST di Sporteca possono accettare l'header `Authorization: Bearer <JWT>` inviato dai client React o Flutter.
    *   Il backend convalida la firma del JWT in modalità **stateless** scaricando le chiavi pubbliche del provider (JWKS).
    *   Innesca in automatico la classe di mappatura `SynchronizingOidcUserMapper` (l'equivalente del nostro `UserProvisioningService`), che risolve la presenza dell'utente a database in modo silente, creando o sincronizzando il profilo e i relativi ruoli Jmix al primo accesso API.

### Add-on B: Jmix SAML 2.0 ❌ (RIFIUTATO)
*   **Marketplace URL**: [https://www.jmix.io/marketplace/saml/](https://www.jmix.io/marketplace/saml/)
*   **Tecnologia**: Basato su Spring Security SAML 2.0.
*   **Copertura Requisito Back-office**: **Buona**. Consente l'SSO aziendale sul Cockpit Vaadin, ma è limitato a protocolli SAML storici (ADFS).
*   **Copertura Requisito Front-office via API**: **Totalmente Inadatto**.
    *   Il protocollo SAML 2.0 è intrinsecamente basato sul browser, su redirect pesanti e su HTTP POST bindings back-to-server (`/saml/SSO`) che restituiscono asserzioni XML firmate ed impostano cookie stateful.
    *   SAML è **inutilizzabile per client API nativi** (App Flutter, Dashboard esterne React, widget headless) poiché non supporta il pattern stateless dei Bearer Tokens (JWT).
    *   Richiederebbe gateway di traduzione pesanti o l'uso forzato di WebViews all'interno dell'App mobile, degradando la UX a livelli inaccettabili.

---

## 🏗️ 3. Disegno dell'Architettura di Integrazione API (OIDC + JWT REST)

Per sfruttare al massimo il Jmix OIDC Add-on e supportare simultaneamente login classici e molteplici social login personali via API, proponiamo un **Unified Gateway Authentication Flow**:

```
 [ Client React / Flutter ]             [ Identity Providers ]           [ sporteca-backend ]             [ Jmix / DB ]
             │                                     │                               │                                │
             │ 1. Autenticazione Social            │                               │                                │
             │    (Google/Apple SDK Nativo)        │                               │                                │
             |────────────────────────────────────>|                               │                                │
             │<────────────────────────────────────|                               │                                │
             │    (Ritorna IdToken / JWT)          │                               │                                │
             │                                                                     │                                │
             │ 2. Scambio Credenziali (POST /api/v1/auth/exchange) ───────────────>|                                │
             │    (Invia IdToken Social O credenziali classiche Email/Pass)        │ 3. Valida Token (via JWKS)     │
             │                                                                     │    O controlla password a DB   │
             │                                                                     │                                │
             │                                                                     │ 4. Invoca                      │
             │                                                                     │    UserProvisioningService     │
             │                                                                     │    per sincronizzare profile   │
             │                                                                     |───────────────────────────────>|
             │                                                                     │    (Crea/Aggiorna Jmix User)   │
             │                                                                     │<───────────────────────────────|
             │                                                                     │                                │
             │                                                                     │ 5. Genera ed emette            │
             │                                                                     │    Unified Sporteca JWT Token  │
             │<────────────────────────────────────────────────────────────────────|                                │
             │    (Ritorna Unified JWT + Refresh Token)                            │                                │
             │                                                                     │                                │
             │ 6. Consuma API Protetta (GET /rest/entities/Team)                   │                                │
             │    (Authorization: Bearer <Unified JWT>) ──────────────────────────>|                                │
             │                                                                     │ 6. Validazione Stateless       │
             │                                                                     │    della sessione & Jmix Roles │
             │<────────────────────────────────────────────────────────────────────|                                │
```

### I Dettagli di Implementazione:

1.  **Nessun Social Redirect pesanti in App**: I client mobili (Flutter) gestiscono il login social in modo nativo tramite le SDK ufficiali di Apple e Google. Il client ottiene il token direttamente dal dispositivo e lo scambia con il nostro backend, evitando i fastidiosi reindirizzamenti via browser.
2.  **L'Endpoint Unificato di Scambio (`/api/v1/auth/exchange`)**:
    *   Il backend espone un singolo endpoint anonimo che accetta un DTO `ExchangeCredentialsRequest`.
    *   Se l'utente invia **credenziali classiche**: Il backend convalida la password locale, controlla l'Audit Log e i consensi versionati, e genera il JWT unificato di Sporteca.
    *   Se l'utente invia un **token Social**: Il backend valida il token con la chiave pubblica di Google/Apple, invoca il provisioning asincrono dell'Account e del profilo, e rilascia lo **stesso JWT unificato di Sporteca**.
3.  **Il Jmix OIDC Resource Server**:
    *   Il Jmix OIDC Add-on viene configurato come **Resource Server** a protezione del percorso `/rest/**` (Generic REST API di Jmix) e dei controller `/api/v1/**` del nostro monorepo.
    *   Tutte le chiamate successive avvengono via Bearer Token, garantendo disaccoppiamento totale e massima velocità.

---

## 📋 4. Piano d'Azione e Configurazione nel Backend

Per abilitare questo flusso in `sporteca-backend`, seguiremo la seguente pipeline di sviluppo:

1.  **Aggiunta Starter a `build.gradle`**:
    ```groovy
    implementation 'io.jmix.rest:jmix-rest-starter'
    implementation 'io.jmix.oidc:jmix-oidc-starter'
    ```
2.  **Configurazione JWKS in `application.properties`** per la validazione stateless delle firme dei token emessi dai nostri provider configurati:
    ```properties
    # Configurazione OIDC per validare i token Bearer delle API
    spring.security.oauth2.resourceserver.jwt.issuer-uri = https://accounts.google.com
    jmix.resource-server.authenticated-url-patterns = /rest/**, /api/v1/**
    ```
3.  **Configurazione UI Stateful del Back-office**:
    *   Si configura il login di Microsoft Entra o Google Workspace istituzionale per gli operatori Sporteca all'interno della stessa security configuration, mantenendola separata dalle API stateless.
