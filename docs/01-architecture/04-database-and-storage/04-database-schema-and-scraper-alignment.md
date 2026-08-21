# 04 - Allineamento Database Relazionale e Scraper Data Model 📊🏈

Questo documento descrive il disegno dettagliato del modello dati relazionale di **Sporteca** (persisto su **MySQL 8.x** gestito da **Jmix & Spring Boot**) e definisce come questi dati si integrano e si allineano con i dati raccolti periodicamente in modo asincrono dallo **Scraper Tuttocampo**.

---

## 🏛️ 1. Il Modello Dati del Core Backend (Jmix/Spring Boot)

Di seguito viene illustrata la modellazione a livello di database per la gestione di autenticazioni multiple, profilazione smart con relazioni tutore-minore e configurazione multi-sport dinamica.

### 👤 A. Area Account & Profilo (Multi-Identità e Multi-Figlio)

```
       [ AuthMethod ] (N)
             │
             ▼ (1)
         [ Account ] (1) ──── (opzionale: 1) ────► [ Profile ]
             │                                         │
             │ (1)                                     │ (1)
             ▼                                         ▼
   [ ProfileGuardianRelation ] (N) ◄──── (1) ─── [ ProfilePersonalInfo ]
             │
             ▼ (N)
   (Minori in gestione)
```

#### Tabella: `accounts` (Identità centralizzata)
*   `id` (VARCHAR(36) / UUID, PK)
*   `email` (VARCHAR(150), Univoca, Not Null): Email unica dell'utente.
*   `username` (VARCHAR(50), Univoco, Not Null)
*   `birth_date` (DATE, Not Null)
*   `active` (BOOLEAN, Not Null)
*   `status` (VARCHAR(30), Not Null): `PENDING_ACTIVATION`, `PENDING_PARENT_CONSENT`, `ACTIVE_UNVALIDATED`, `ACTIVE_VALIDATED`, `SUSPENDED`.

#### Tabella: `auth_methods` (Moltissime credenziali legate allo stesso Account)
*   `id` (BIGINT, PK, AutoIncrement)
*   `account_id` (UUID, FK -> `accounts`)
*   `provider` (VARCHAR(30), Not Null): `LOCAL`, `GOOGLE`, `APPLE`, `INSTAGRAM`, `MICROSOFT_ENTRA`.
*   `provider_user_id` (VARCHAR(150), Nullable): L'identificativo fornito dal provider social o aziendale (es. OAuth `sub` claim).
*   `password_hash` (VARCHAR(255), Nullable): Popolato solo se `provider = LOCAL`.

#### Tabella: `profiles` (Contenitore del Profilo)
*   `id` (VARCHAR(36) / UUID, PK)
*   `account_id` (UUID, FK -> `accounts`): Relazione con l'account creatore.
*   `type` (VARCHAR(20), Not Null): `ATHLETE`, `COMPANY`, `STAFF`.
*   `validation_status` (VARCHAR(30), Not Null): `PENDING_REVIEW`, `APPROVED`, `REJECTED`.

#### Tabella: `profile_personal_infos` (Anagrafica Atleta/Staff)
*   `id` (BIGINT, PK)
*   `profile_id` (UUID, FK -> `profiles`)
*   `first_name` (VARCHAR(50), Not Null)
*   `last_name` (VARCHAR(50), Not Null)
*   `fiscal_code` (VARCHAR(16), Univoco, Not Null)
*   `claimed_scraped_player_id` (VARCHAR(36), Nullable, FK -> `scraped_players`): **IL PONTE**: Riferimento all'atleta reale caricato dallo scraper.

#### Tabella: `profile_guardian_relations` (Relazione Multi-Figlio Tutore-Minore)
*   `id` (BIGINT, PK)
*   `guardian_account_id` (UUID, FK -> `accounts`): L'account del genitore.
*   `minor_profile_id` (UUID, FK -> `profiles`): Il profilo del figlio minorenne in gestione.

---

### ⚙️ B. Area Multi-Sport Dinamico (MySQL JSON Columns per i18n)

Per supportare la scalabilità su qualsiasi sport (calcio, basket, volley) senza costringere a modifiche di schema, le tabelle di configurazione utilizzano colonne di tipo `JSON` per la memorizzazione dei testi multilingua:

```
[ Sport ] (1) ───► [ SportRole ] ◄─── (1) [ Role ]
                             ▲
                             │ (1)
                             │
                      [ ProfileSkills ] ◄─── (1) [ Profile ]
```

*   **`sports`**: `id` (PK), `code` (es. `SOCCER_11`), `name` (JSON translation, es. `{"it": "Calcio", "en": "Soccer"}`), `active` (BOOLEAN).
*   **`categories`**: `id` (PK), `name` (JSON), `description` (JSON).
*   **`roles`**: `id` (PK), `code`, `name` (JSON), `type` (`ATHLETE_ROLE`, `STAFF_ROLE`).
*   **`skills`**: `id` (PK), `code` (es. `SPEED`), `name` (JSON), `data_type` (`NUMBER`, `BOOLEAN`).

---

## 🕷️ 2. Il Modello Dati dello Scraper (Tuttocampo.it)

I dati estratti dallo scraper Python vengono riversati periodicamente in tabelle dedicate del database MySQL. La struttura rispecchia l'anagrafica reale e le statistiche dei campionati:

### Tabella: `scraped_championships` (Campionati)
*   `id` (VARCHAR(36) / UUID, PK): Identificativo univoco del campionato.
*   `sport_code` (VARCHAR(30), Not Null): Es. `SOCCER_11`, `BASKETBALL`.
*   `name` (VARCHAR(150), Not Null): Es. *Seconda Categoria - Girone A*.
*   `season` (VARCHAR(15), Not Null): Es. *2025/2026*.
*   `last_scraped_at` (TIMESTAMP)

### Tabella: `scraped_teams` (Squadre)
*   `id` (VARCHAR(36) / UUID, PK)
*   `name` (VARCHAR(100), Not Null): Nome societario (es. *A.C. Milan*).
*   `logo_url` (VARCHAR(255), Nullable): Link locale o remoto dell'emblema squadra.

### Tabella: `scraped_players` (Atleti Reali Tracciati)
*   `id` (VARCHAR(36) / UUID, PK): L'identificativo dell'atleta reale estratto dal portale Tuttocampo.
*   `first_name` (VARCHAR(50))
*   `last_name` (VARCHAR(50))
*   `current_team_id` (UUID, FK -> `scraped_teams`): Squadra corrente in cui gioca.
*   `photo_url` (VARCHAR(255))

### Tabella: `scraped_player_stats` (Statistiche Atleti per Campionato)
*   `id` (BIGINT, PK, AutoIncrement)
*   `player_id` (UUID, FK -> `scraped_players`)
*   `championship_id` (UUID, FK -> `scraped_championships`)
*   `goals` (INT)
*   `penalties` (INT)
*   `assists` (INT)
*   `caps` (INT): Presenze in campo.
*   `rating` (DECIMAL(3,2)): Media voto delle prestazioni.

---

## 🌉 3. L'Orchestrazione ed il Collegamento dei Due Mondi (Claim Flow)

La parte più innovativa ed importante del sistema è **l'orchestra di collegamento** tra l'anagrafica istituzionale degli utenti registrati ed i dati reali sportivi estratti in automatico dallo scraper.

### Il Flusso di Claiming (Rivendicazione del Profilo):

```
[ Atleta Registrato ]             [ Client App ]             [ sporteca-backend ]        [ Scraper DB (scraped_players) ]
          │                             │                             │                                 │
          │ 1. Cerca il proprio nome    │                             │                                 │
          │    e squadra di appartenenza│                             │                                 │
          |---------------------------->|                             │                                 │
          │                             │ 2. Esegue query di ricerca ──────────────────────────────────>│
          │                             │    su scraped_players ed    │                                 │
          │                             │    espone i risultati reali │                                 │
          │                             |<────────────────────────────│                                 │
          │ 3. Seleziona il proprio     │                             │                                 │
          │    atleta reale Tuttocampo  │                             │                                 │
          |---------------------------->|                             │                                 │
          │                             │ 4. Richiesta di CLAIM (con  │                                 │
          │                             │    invio documento d'identità)                                │
          │                             |────────────────────────────>|                                 │
          │                             │                             │ 5. L'operatore valida il match  │
          │                             │                             │    (CF e foto coincidono)       │
          │                             │                             │ 6. Imposta ForeignKey           │
          │                             │                             │    claimed_scraped_player_id    │
          │                             │                             │    sul profilo reale            │
          │                             |<────────────────────────────│                                 │
          │ 7. Profilo Collegato!       │                             │                                 │
          │    Mostra dashboard con     │                             │                                 │
          │    statistiche reali.       │                             │                                 │
```

1.  **Registrazione ed Iscrizione Atleta**: L'atleta si registra regolarmente su Sporteca seguendo il routing smart (UC-09) e compila il suo profilo anagrafico inserendo Nome, Cognome, Data di Nascita e Codice Fiscale.
2.  **Ricerche di Identità**: Dalla dashboard utente (stato `ACTIVE_UNVALIDATED`), l'atleta seleziona *"Collega le tue statistiche reali"*. Inserisce il proprio nome o la squadra dilettantistica in cui gioca.
3.  **Visualizzazione del Match**: Il client effettua una ricerca sulla tabella delle anagrafiche dello scraper (`scraped_players`) e mostra a schermo le schede corrispondenti con l'elenco delle statistiche storiche per ciascun campionato (`scraped_player_stats`).
4.  **Flusso di Richiesta Claim (Claiming Request)**: L'atleta seleziona la propria anagrafica e invia la richiesta di associazione. Per validare l'identità, il sistema richiede il caricamento del documento d'identità (front/back).
5.  **Validazione Back-Office**: L'operatore del back-office Jmix esamina la richiesta:
    *   Verifica che il Codice Fiscale del profilo e il Nome/Cognome dell'atleta corrispondano con il documento e con la scheda reale tracciata da Tuttocampo.
    *   Se il controllo è positivo, approva la richiesta.
6.  **Join del DB e Aggiornamento Real-time**:
    *   Il sistema imposta la colonna **`claimed_scraped_player_id`** dell'entità `ProfilePersonalInfo` dell'atleta puntando all'UUID della tabella `scraped_players`.
    *   Il profilo dell'atleta passa a `ACTIVE_VALIDATED`.
7.  **Sincronizzazione della Dashboard**:
    *   Da questo momento, ogni volta che l'atleta apre la propria applicazione client, il backend esegue una `LEFT JOIN` tra il profilo e le tabelle `scraped_players` e `scraped_player_stats`.
    *   L'utente visualizza all'istante la rosa della sua squadra reale, la classifica aggiornata in automatico del suo campionato e le sue prestazioni reali di goal, presenze e voti estratti in background dallo scraper, senza dover inserire manualmente alcun dato!
