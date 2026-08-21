# 03 - Architettura Backend (Jmix & Spring Boot Engine) ⚙️☕

Questo documento descrive la struttura del backend di **Sporteca**, incentrato sull'utilizzo del framework **Jmix** (basato su **Spring Boot**). Spiega come coniugare lo sviluppo rapido del back-office con la necessità di servire API REST stateless ad alte prestazioni per l'app Flutter mobile e i widget WordPress esterni.

---

## 🏗️ L'Approccio: Monolite Modulare (Modular Monolith)

Anziché partire subito con un'architettura a microservizi distribuiti (complessa da gestire, testare e deployare per un solo sviluppatore), Sporteca adotta un approccio a **Monolite Modulare**.

La base tecnologica è un'unica applicazione **Spring Boot** strutturata in moduli o Jmix Add-on interni nettamente separati. Se in futuro l'applicazione dovesse scalare a milioni di utenti, l'estrazione di un modulo specifico (es. il modulo per i pagamenti o per l'ingestione dati dello scraper) in un microservizio separato sarà pulita e richiederà modifiche minime al codice.

```
+─────────────────────────────────────────────────────────────+
|                     SPORTECA BACKEND CORE                   |
|                      (Spring Boot App)                      |
+─────────────────────────────────────────────────────────────+
|                                                             |
|   +──────────────────+   +──────────────────────────────+   |
|   |   Modulo CORE    |   | Modulo COMPANY (Segregato)   |   |
|   | - Anagrafiche    |   | - Bilanci (Futuro)           |   |
|   | - Scraper Sync   |   | - Gestione Certificati       |   |
|   | - Matching engine|   |   (Futuro)                   |   |
|   +────────┬─────────+   +──────────────┬───────────────+   |
|            |                            |                   |
|            v                            v                   |
|   +──────────────────+   +──────────────────────────────+   |
|   |  Database CORE   |   |     Database SENSIBILE       |   |
|   |  (MySQL Pubblico)|   |     (Multi-Tenant isolated)  |   |
|   +──────────────────+   +──────────────────────────────+   |
|                                                             |
+─────────────────────────────────────────────────────────────+
```

---

## ⚡ Il "Doppio Motore": Jmix Web UI + Spring REST puro

Il problema comune dei framework RAD (Rapid Application Development) come Jmix/Cuba è che sono ottimizzati per applicazioni web "stateful" (interfaccia desktop-web ricca). Per risolvere questo problema e garantire la massima scalabilità a Sporteca, utilizzeremo un **approccio a due velocità** all'interno dello stesso progetto:

### 1. Il Motore Jmix (Per i Portali Web Amministrativi)
* Sfrutta le tecnologie visuali integrate di Jmix per generare istantaneamente e in sicurezza le interfacce web responsive per il **Super Admin** e il **Portale Company**.
* Questo elimina il 100% dello sforzo di programmazione di form, tabelle di filtri, export dati e pannelli di gestione dei permessi utente.

### 2. Il Motore Spring REST Puro (Per Flutter e WordPress)
* Per comunicare con l'App Mobile Flutter e con i siti terzi (WordPress/Widget), scriveremo dei normalissimi `@RestController` di Spring Boot.
* Questi controller bypassano completamente il motore grafico pesante di Jmix. Sfruttano direttamente lo strato dei servizi (Spring Services) e i Repository JPA per restituire dati JSON leggeri e performanti.
* Questo garantisce tempi di risposta in millisecondi (sub-50ms) e la possibilità di gestire migliaia di richieste concorrenti con consumo minimo di RAM.

---

## 🔒 Sicurezza e Autenticazione (Stateless JWT)

La sicurezza e l'identificazione degli utenti seguono due canali distinti:

1. **Sessione State-full (Portale Web Jmix):** Gestita in automatico da Jmix (Spring Security con sessione HTTP e cookie protetti) per gli utenti amministratori e le società sportive che usano il browser.
2. **Sessione State-less (App Mobile Flutter):**
   * L'atleta esegue il login inserendo email/password (o tramite Social Login).
   * Il backend valida le credenziali e genera un token **JWT (JSON Web Token)** firmato asimmetricamente (con chiave privata protetta in GCP Secret Manager).
   * L'app Flutter memorizza il token in modo sicuro (tramite `flutter_secure_storage`) e lo invia nell'header di ogni chiamata API: `Authorization: Bearer <token>`.
   * Il backend convalida il JWT in modo totalmente stateless (senza fare query di sessione al DB), decodifica il payload ed estrae l'UUID dell'atleta loggato.

---

## 🌐 Internazionalizzazione (i18n) a Livello Backend

Oltre ai testi statici dell'interfaccia mobile (gestiti in Flutter), il backend deve supportare risposte multilingua dinamiche.

### 1. Gestione dei Messaggi e delle Eccezioni
Spring Boot gestisce nativamente la localizzazione tramite file di risorse (`.properties`).
* Creeremo i file `messages.properties`, `messages_it.properties`, `messages_en.properties` all'interno delle risorse Spring.
* Quando il codice lancia un'eccezione o invia una notifica, la stringa viene recuperata dinamicamente tramite il componente `MessageSource` basandosi sulla lingua specificata nel parametro HTTP `Accept-Language`.

```java
@Autowired
private MessageSource messageSource;

public String getLocalizedError(String messageKey, Locale locale) {
    return messageSource.getMessage(messageKey, null, locale);
}
```

### 2. Gestione Dati Dinamici Tradotti nel DB (MySQL JSON Columns)
Per evitare complesse tabelle di join (es. `ruolo_calciatore` e `ruolo_calciatore_translations`), utilizzeremo colonne di tipo **JSON** (supportate nativamente e in modo performante da MySQL 8.0/PostgreSQL).

* **La Struttura del Record nel DB:**
  ```json
  // Tabella: positions (Ruoli)
  {
    "id": 1,
    "code": "STRIKER",
    "name": {
      "it": "Attaccante",
      "en": "Striker",
      "es": "Delantero"
    }
  }
  ```
* **L'Estrazione:** Nel nostro `@RestController`, quando inviamo la lista dei ruoli all'app mobile, il mapper Java leggerà la lingua dell'utente (dall'header) ed estrarrà esclusivamente la chiave corretta dal JSON prima di inviare la risposta:
  ```json
  // Risposta inviata al client italiano
  {
    "id": 1,
    "code": "STRIKER",
    "name": "Attaccante"
  }
  ```

---

## ⚡ Predisposizione Real-Time: Websocket

Per abilitare aggiornamenti in tempo reale (ad esempio notifiche istantanee, messaggi di chat o aggiornamenti live dei risultati delle partite nell'app mobile):
* Configureremo lo strato di **Spring WebSocket** con protocollo STOMP (Simple Text Oriented Messaging Protocol).
* Per l'MVP configureremo un broker in-memory leggero.
* Quando l'applicazione scalerà a livello globale e avremo più istanze del backend dietro un bilanciatore, collegheremo le Websocket a un broker esterno come **Redis Pub/Sub** (ospitato in modalità gestita su Google Cloud Memorystore) per sincronizzare i messaggi tra tutti i server.
