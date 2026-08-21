# 01 - Panoramica di Sistema (System Overview) 🌐

Questo documento descrive ad alto livello l'architettura complessiva di **Sporteca**, identificando gli attori coinvolti, i casi d'uso principali, la separazione dei canali di autenticazione e la confluenza dei sistemi nel nuovo repository unificato **`sporteca-backend`**.

---

## 👥 Gli Attori del Sistema nell'MVP

1.  **Atleta (User):** Calciatore dilettante che si registra tramite canali rapidi (Social Logins: Google, Apple) per creare la propria scheda sportiva digitale e rivendicare (claiming) le sue statistiche reali.
2.  **Genitore/Tutore (User):** Attore fondamentale per la compliance dei minori under 14, interviene nel flusso di registrazione rilasciando il consenso digitale (GDPR).
3.  **Membro dello Staff (User):** Allenatori, preparatori e dirigenti tecnici che si registrano per esporre le proprie qualifiche e trovare contratti con le società.
4.  **Società Sportiva (Company):** Club che si registra tramite credenziali istituzionali formali o **Enterprise Single Sign-On (Microsoft Entra ID)** per effettuare ricerche mirate ed accedere (previo acquisto/sblocco) ai contatti dei talenti.
5.  **Super Amministratore (Admin):** Personale interno Sporteca che gestisce le configurazioni multi-sport e valida le anagrafiche/documenti inviati tramite l'interfaccia di amministrazione.
6.  **Scraper (Ingestion Process):** Processo asincrono Python che estrae i dati ufficiali dei campionati da Tuttocampo.it.
7.  **Scraper Prototype App (`sporteca-scaper-app`):** Il client web di test React (precedentemente denominato `sporteca-app`) che consuma direttamente i dati JSON locali dello scraper per validare i widget grafici e la visualizzazione dati delle classifiche prima della messa in produzione delle API REST finali.

---

## 🗺️ Architettura Consolidata (Unified Architecture)

Il sistema adotta un approccio **Ibrido Monolite Modulare** centralizzato nel repository **`sporteca-backend`** (Spring Boot + Jmix), mandando in pensione la vecchia struttura frammentata di `sporteca-api`.

```
[ Fonti Esterne: Tuttocampo ]
             |
             v (Scraping periodico asincrono)
     [ Sporteca Scraper ] ─── (Genera JSON locali in db/)
             │
             +───► Consumati direttamente da ───► [ sporteca-scaper-app ] (React Prototype)
                                                                 
                                                                 
                                                          +─────────────────────────+
                                                          |    SPORTECA BACKEND     |
                                                          |  (Spring Boot + Jmix)   |
                                                          +───┬─────────────────┬───+
                                                              |                 |
                    +─────────────────────────────────────────+                 +──────────────────────────+
                    | (Interfaccia nativa Jmix Flow UI)                                                    | (REST APIs over JWT)
                    v                                                                                      v
         +──────────────────────────+                                                          +──────────────────────────+
         |     Jmix Cockpit Admin   |                                                          |   Spring REST Stateless  |
         | - Portale Super Admin    |                                                          |   - Auth, Profiles,      |
         | - Configurazione Sport   |                                                          |     Localities, Skills   |
         | - Approvazioni Profili   |                                                          +───┬──────────────────┬───+
         +──────────────────────────+                                                              |                  |
                                                                                                   v                  v
                                                                                            [ App Flutter ]    [ Widget Embed ]
                                                                                            (Atleti/Staff)    (WordPress Club)
```

---

## 🔒 Canali di Autenticazione e Sessioni Stateless

L'architettura di autenticazione è concepita per essere solida e scalabile, segregando gli accessi per tipologia di utenza:

*   **Atleti, Staff e Genitori (Canale Mobile/Social)**:
    *   Effettuano l'accesso in modo rapido tramite **Google o Apple OAuth2 / OIDC**.
    *   Il backend convalida il token emesso dai social provider e restituisce una coppia di token stateless di Sporteca: **Access Token (JWT)** a breve scadenza e **Refresh Token** memorizzato su database per il rinnovo.
    *   Nessuna sessione pesante viene mantenuta in memoria a livello di server, assicurando tempi di risposta inferiori a 50ms per le chiamate API mobile.
*   **Società Sportive (Canale B2B / Enterprise)**:
    *   Effettuano l'accesso tramite credenziali classiche (Email Istituzionale + Password) oppure tramite **Enterprise Single Sign-On (Microsoft Entra ID)**.
    *   Al login con Microsoft Entra, lo strato Spring Security Resource Server convalida il token emesso da Microsoft, e il componente interno `UserProvisioningService` effettua il provisioning o la sincronizzazione dinamica dell'anagrafica e dei ruoli dell'utente in tempo reale all'interno del database Jmix, garantendo massima compliance aziendale.
*   **Super Amministratori (Canale Cockpit Admin)**:
    *   Accedono tramite l'interfaccia Jmix Cockpit protetta da Spring Security con sessione stateful standard (Cookie + Session HTTP protetti).

---

## ⚡ Flussi di Lavoro Principali (Core Use Cases)

### 1. Registrazione e Convalida Minorile (UC-01)
I minorenni under 14 avviano autonomamente il flusso social/classico fornendo l'email del genitore. L'account è attivato (stato `ACTIVE_UNVALIDATED`) solo dopo la doppia conferma via email (minore + link di consenso esplicito del genitore).

### 2. Recupero Password Stateless (UC-03)
Il vecchio meccanismo basato su domande di sicurezza ed email con link temporanei in chiaro è eliminato. Il recupero password avviene in modo sicuro tramite **One-Time Passcode (OTP)** a 6 cifre inviato via email/SMS con scadenza di 10 minuti, oppure tramite **Magic Link** temporaneo firmato con JWT che autorizza istantaneamente la pagina di reset password sul client.

### 3. Sincronizzazione ed Ingestione Enterprise (UC-09)
Grazie all'integrazione di Microsoft Entra ID, i dipendenti delle Società non devono ricordare password locali. I loro profili sono sincronizzati e i ruoli operativi Jmix sono assegnati in base ai gruppi di sicurezza Microsoft, minimizzando lo sforzo amministrativo.
