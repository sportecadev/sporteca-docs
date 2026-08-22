# 04 - Allineamento Database Relazionale e Registro Federale delle Prestazioni 📊🏈

Questo documento descrive il disegno dettagliato del modello dati relazionale di **Sporteca** (persisto su **MySQL 8.x** gestito da **Jmix & Spring Boot**) e definisce come questi dati si integrano e si allineano con l'**Anagrafica Federale / Registro Nazionale delle Prestazioni** (`fed_`), superando il concetto di semplice "scraper" ed elevando lo strato dati ad un'autorità sportiva federata ad alta scalabilità.

---

## 🏛️ 1. Mappatura dei Prefissi delle Tabelle di Backend

Per garantire la massima leggibilità, auditing e coerenza strutturale nel framework Jmix, le tabelle del database sono divise in tre sole categorie tassonomiche distinte:

1.  **Tabelle del Dominio Core & Tabelle Tassonomiche (senza prefisso)**: Contengono i dati operativi del monorepo, inclusi i profili, le relazioni tutore-minore, le squadre reali, i consensi GDPR e tutti i dizionari di riferimento (es. `accounts`, `profiles`, `teams`, `legal_documents`, `account_consents`, `sports`, `categories`, `roles`, `skills`, `countries`). Jmix gestirà l'eventuale prefisso applicativo SPT a monte in automatico.
2.  **Tabelle di Configurazione UI & Runtime (prefisso `cfg_`)**: Memorizzano i layout e le regole delle interfacce dinamiche ed i form reattivi (es. `cfg_sport_attribute_definitions`, `cfg_sport_roles`, `cfg_sport_category_skills`).
3.  **Tabelle del Registro Sportivo Federato (prefisso `fed_`)**: L'anagrafica nazionale indipendente di atleti, squadre e prestazioni (es. `fed_championships`, `fed_teams`, `fed_players`, `fed_player_performances`). Può essere alimentato in modo del tutto trasparente da scraper automatici, fogli Excel o inserimenti manuali del back-office.

---

## 👤 2. Area Account & Profilo (Multi-Identità, Multi-Figlio e GDPR)

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
*   `email` (VARCHAR(150), Univoca, Not Null): Email unica (ammessi domini personali consumer per tutti, comprese le Società).
*   `username` (VARCHAR(50), Univoco, Not Null)
*   `birth_date` (DATE, Not Null)
*   `active` (BOOLEAN, Not Null)
*   `status` (VARCHAR(30), Not Null): `PENDING_ACTIVATION`, `PENDING_PARENT_CONSENT`, `ACTIVE_UNVALIDATED`, `ACTIVE_VALIDATED`, `SUSPENDED`.
*   `creation_provider` (VARCHAR(30)): Canale di origine (`LOCAL`, `GOOGLE`, `APPLE`).
*   `primary_provider` (VARCHAR(30)): Canale d'accesso attivo.

#### Tabella: `auth_methods` (Unione dei canali d'accesso)
*   `id` (BIGINT, PK, AutoIncrement)
*   `account_id` (UUID, FK -> `accounts`)
*   `provider` (VARCHAR(30), Not Null)
*   `provider_user_id` (VARCHAR(150), Unique)
*   `password_hash` (VARCHAR(255), Nullable): Password locale. Sbiacata/disabilitata se `primary_provider` != `LOCAL`.

#### Tabella: `profile_guardian_relations` (Relazione Multi-Figlio Tutore-Minore)
*   `id` (BIGINT, PK)
*   `guardian_account_id` (UUID, FK -> `accounts`): L'account del genitore.
*   `minor_profile_id` (UUID, FK -> `profiles`): Il profilo del figlio minorenne in gestione.

---

## 🔒 3. Gestione Consensi GDPR & Termini Versionati (Legal Auditing)

Per garantire la massima conformità legale e tracciabilità, i flag di privacy e termini non sono semplici booleani statici in tabella (che perderebbero lo storico), ma sono gestiti tramite un **Registro dei Consensi Versionato**:

#### Tabella: `legal_documents` (Dizionario Documenti Legali)
Archivia i documenti e le versioni attive nel sistema.
*   `id` (BIGINT, PK)
*   `document_code` (VARCHAR(50)): `PRIVACY_POLICY`, `TERMS_AND_CONDITIONS`, `MARKETING_CONSENT`, `PROFILING_CONSENT`.
*   `name` (VARCHAR(100)): Es. *"Condizioni Generali di Contratto"*.
*   `version` (VARCHAR(20)): Es. *"1.0"*, *"1.1"*.
*   `file_path` (VARCHAR(255)): Percorso del file PDF caricato su Google Cloud Storage.
*   `mandatory` (BOOLEAN): Se obbligatorio per l'attivazione dell'account.
*   `active` (BOOLEAN): Indica se è la versione corrente che tutti gli utenti devono aver firmato.

#### Tabella: `account_consents` (Registro Firme Consensi)
Crea una prova legale inoppugnabile del consenso. Nessun record viene cancellato o modificato, si inserisce un nuovo record a ogni aggiornamento di policy.
*   `id` (BIGINT, PK, AutoIncrement)
*   `account_id` (UUID, FK -> `accounts`): L'account destinatario del consenso (atleta o minore).
*   `legal_document_id` (BIGINT, FK -> `legal_documents`): Il documento e la versione specifica firmata.
*   `consent_given` (BOOLEAN): `true` se accettato, `false` se revocato (per i consensi opzionali).
*   `signed_at` (TIMESTAMP): Data e ora esatta della firma digitale.
*   `signed_by_guardian_account_id` (UUID, Nullable, FK -> `accounts`): **IL CAPOLAVORO**: Se l'atleta è un minore under 14, questo campo memorizza l'UUID dell'Account del Genitore che ha firmato legalmente per suo conto, garantendo totale tracciabilità.
*   `ip_address` (VARCHAR(45)): IP del firmatario.

---

## ⚽ 4. Modulo Multi-Sport Dinamico (Allineamento PrimeNG Form)

I parametri biometrici comuni (`Weight`, `Height`) sono memorizzati in colonne relazionali fisiche standard. I parametri tecnici sport-specifici vengono invece estratti in un'unica colonna nativa **JSON `sport_attributes`** (es: `{"vertical_jump_cm": 95, "preferred_foot": "LEFT"}`).

La generazione e la validazione dei campi di input a schermo nel frontend (React/Flutter) sono guidate interamente da metadati salvati a database, mappati sulla struttura dei **`FormField` reattivi di PrimeNG**:

#### Tabella: `cfg_sport_attribute_definitions` (Metadata Form UI)
*   `id` (BIGINT, PK)
*   `sport_id` (BIGINT, FK -> `sports`)
*   `attribute_code` (VARCHAR(50)): Chiave JSON (es. `vertical_jump_cm`).
*   `type` (VARCHAR(20)): Tipo di input (`text`, `number`, `select`, `multiselect`, `checkbox`).
*   `label_json` (JSON): Etichette localizzate.
*   `placeholder_json` (JSON): Placeholder localizzati.
*   `help_text_json` (JSON): Testi di aiuto localizzati.
*   `columns` (INTEGER): Larghezza responsive della colonna nella griglia del form UI (xs/md/lg).
*   `validators_json` (JSON): Array di validatori mappato su `FieldValidator[]` (es. `required`, `min: 10`, `max: 250`).
*   `options_json` (JSON): Lista di opzioni `{value, label}` localizzate per i campi di tipo `select` o `multiselect`.

---

## 📊 5. Il Modello Dati del Registro Federale (`fed_` Tables)

I dati degli atleti e delle prestazioni reali sono memorizzati in tabelle del Registro Federale, completamente separate e disaccoppiate dalle fonti dati esterne o dallo scraper:

### Tabella: `fed_championships` (Campionati)
*   `id` (VARCHAR(36) / UUID, PK)
*   `sport_id` (BIGINT, FK -> `sports`)
*   `name` (VARCHAR(150), Not Null): Es. *Seconda Categoria - Girone A*.
*   `season` (VARCHAR(15), Not Null): Es. *2025/2026*.
*   `last_updated` (TIMESTAMP)

### Tabella: `fed_teams` (Società/Squadre del Registro)
*   `id` (VARCHAR(36) / UUID, PK)
*   `name` (VARCHAR(100), Not Null): Nome societario.
*   `logo_url` (VARCHAR(255), Nullable)

### Tabella: `fed_players` (Atleti Reali Tracciati)
*   `id` (VARCHAR(36) / UUID, PK)
*   `first_name` (VARCHAR(50)), `last_name` (VARCHAR(50))
*   `current_team_id` (UUID, FK -> `fed_teams`)
*   `photo_url` (VARCHAR(255))

### Tabella: `fed_player_performances` (Statistiche Atleti)
*   `id` (BIGINT, PK, AutoIncrement)
*   `player_id` (UUID, FK -> `fed_players`)
*   `championship_id` (UUID, FK -> `fed_championships`)
*   `goals` (INT), `penalties` (INT), `assists` (INT), `caps` (INT)
*   `rating` (DECIMAL(3,2)): Media voto delle prestazioni.
*   `last_updated` (TIMESTAMP)

---

## 🌉 6. Il Flusso di Associazione Identità Federale (Claim Flow)

L'atleta registrato rivendica la propria identità sportiva associandosi ad una scheda reale del registro `fed_players`:

1.  **Richiesta di Ricerca**: Dalla dashboard, l'atleta cerca il proprio nome o la squadra reale nella tabella `fed_players`.
2.  **Associazione ed Invio Documento (Claim)**: Seleziona il proprio record reale e richiede l'associazione caricando i documenti d'identità (UC-05).
3.  **Approvazione AI & Operatore (UC-07)**: La pipeline AI (o l'operatore) convalida i dati. In caso di esito positivo, il backend imposta la chiave esterna **`claimed_federated_player_id`** dell'entità `ProfilePersonalInfo` dell'atleta puntando all'UUID dell'atleta in `fed_players`.
4.  **Dashboard Sincronizzata**: Da questo momento, ad ogni accesso del client, il backend esegue una `LEFT JOIN` tra il profilo e le tabelle `fed_players` e `fed_player_performances`, mostrando all'istante le statistiche reali di goal, presenze e voti aggiornati.
