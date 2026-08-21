# 04 - Database e Gestione Media (Storage) 💾📁

Questo documento descrive l'architettura dei dati di **Sporteca**, focalizzandosi sulla strutturazione del Database Relazionale (MySQL 8.0), sulla segregazione "Multi-Tenant" per garantire l'isolamento dei dati sensibili delle Company (Approccio B) e sulla gestione ottimizzata dei contenuti multimediali (foto e video) tramite Google Cloud Storage.

---

## 💾 Architettura del Database: Due Database Separati

Per proteggere l'integrità dei dati e garantire l'aderenza alle severe normative **GDPR**, l'architettura prevede una separazione fisica tra i dati pubblici/sociali e i dati confidenziali delle società sportive (Company).

```
                             +──────────────────────+
                             |   JMIX APPLICATION   |
                             +──────────┬───────────+
                                        |
                 +──────────────────────┴──────────────────────+
                 | (Routing dinamico tramite Spring DataSource) |
                 v                                             v
     +───────────────────────+                 +───────────────────────────────+
     |   DATABASE CORE       |                 |      DATABASE SENSIBILE       |
     |   (MySQL Istanza 1)   |                 |       (MySQL Istanza 2)       |
     +───────────────────────+                 +───────────────────────────────+
     |                       |                 |                               |
     | Schemi Pubblici:      |                 | Schemi Multi-Tenant Isolati:  |
     |  - users              |                 |  - company_tenant_abc123      |
     |  - players (claims)   |                 |    * certificati_medici       |
     |  - championships_data |                 |    * contratti_e_pagamenti    |
     |  - matchings          |                 |    * bilanci_interni          |
     |                       |                 |  - company_tenant_xyz789      |
     +───────────────────────+                 +───────────────────────────────+
```

### Istanza 1: Database CORE (Dati Pubblici e Sociali)
* **Destinazione:** Contiene i dati che non richiedono segregazione societaria. Ad esempio: anagrafiche base degli utenti, i dati storici del calcio importati dallo scraper (classifiche, marcatori, squadre), lo stato delle relazioni "claim" dei profili dei calciatori dilettanti.
* **Accesso:** Condiviso, multitenant a livello logico (ogni record ha chiavi esterne per mappare le relazioni).

### Istanza 2: Database SENSIBILE (Dati Aziendali Segregati)
* **Destinazione:** Ospita le informazioni strettamente riservate di ciascuna società (certificati medici di idoneità agonistica, dati finanziari, bilanci, anagrafiche dei soci, pagamenti interni delle quote).
* **Meccanismo di Segregazione (Schema-per-Tenant):**
  * Per coniugare la semplicità operativa con una sicurezza granitica, utilizzeremo l'approccio **Schema-per-Tenant**.
  * Ciascuna Company registrata possiede un proprio **Schema di database separato e crittografato** (es. `company_tenant_<UUID_SOCIETA>`).
  * **Routing dei Dati:** Spring Boot implementa un componente che estende `AbstractRoutingDataSource`. Quando un utente Company esegue un'operazione su dati sensibili, l'applicazione intercetta l'UUID della società dal contesto di sicurezza del token JWT e dirotta dinamicamente la connessione JDBC sullo schema specifico di quella società.
* **I vantaggi di questa scelta:**
  * **Nessun rischio di Leak dei dati:** Una query errata (es. una dimenticanza di un `WHERE company_id = ...`) non potrà mai esporre i dati di un'altra società, perché la connessione sta operando fisicamente su uno schema isolato.
  * **Semplificazione GDPR (Diritto all'Oblio):** Se una società cancella il suo account, l'eliminazione dei dati sensibili si riduce a un istantaneo comando `DROP SCHEMA company_tenant_123;`, senza dover fare delete a cascata su tabelle globali.
  * **Backup Dedicati:** È possibile eseguire il backup e il ripristino dei dati di una singola società sportiva senza toccare le altre.

---

## 📁 Gestione dei Media (Google Cloud Storage & URL Firmate)

I contenuti multimediali (foto profilo degli atleti, loghi societari, foto di documenti e in futuro i video delle partite) non risiederanno mai sul server del backend per evitare di saturare lo spazio disco e consumare la RAM dei container Java.

Useremo **Google Cloud Storage (GCS)** con il pattern delle **Signed URLs (URL firmate)** per un'architettura decentralizzata e performante.

### Il Pattern delle URL Firmate (Signed URLs)

```
[ Client / App ]                     [ Jmix Backend ]                  [ Google Cloud Storage ]
       |                                     |                                     |
       | 1. Voglio caricare foto.jpg ------> |                                     |
       |                                     | 2. Genera URL firmata e sicura      |
       |                                     |    (valida solo per 5 minuti)       |
       | <---- 3. Ritorna URL firmata -------|                                     |
       |                                                                           |
       | 4. Esegue HTTP PUT con il file immagine direttamente su GCS -------------> |
       |                                                                           |
       |<--- 5. Convalida e salva il file (risposta HTTP 200 OK) ------------------|
       |                                                                           |
       | 6. Notifica successo (invia nome del file salvato) ---------------------> |
```

#### Perché questo pattern è superiore:
1. **Zero Carico sul Server:** Il file multimediale (anche pesanti video in futuro) viene inviato direttamente dal telefono del calciatore ai server di Google Cloud Storage. Il nostro backend in Java gestisce solo lo scambio di piccoli token di testo (le URL), lasciando la RAM libera per servire le API.
2. **Sicurezza Totale:** I bucket GCS sono impostati come completamente **privati**. Nessuno può accedere a un file senza autorizzazione. Il backend genera una URL temporanea contenente una firma crittografica che scade dopo pochi minuti. Solo chi possiede quella URL temporanea può scaricare o caricare quel file specifico.

---

## ⚡ Formato Immagini e Ottimizzazione Banda

Per garantire che l'app mobile sia "mega figa" e veloce anche sotto rete 3G/4G:
* Tutte le immagini (foto atleti caricate dallo scraper o dagli utenti) verranno normalizzate in formato **WebP**. Il formato WebP garantisce una riduzione del peso dei file fino al 60% rispetto a JPG/PNG mantenendo la stessa qualità visiva.
* **Multi-Risoluzione (Responsive Media):** Quando viene caricata una foto profilo, una funzione serverless asincrona (es. **Cloud Functions** attivata in automatico dall'upload nel bucket di GCS) genererà tre versioni ridimensionate:
  1. `thumbnail` (es. 150x150 px) per le liste di ricerca e le classifiche.
  2. `medium` (es. 600x600 px) per la scheda profilo dettagliata.
  3. `original` protetta nel bucket sensibile (nel caso di certificati medici o documenti).
* L'app Flutter caricherà dinamicamente la versione adatta in base alle dimensioni del widget su schermo per risparmiare traffico dati e velocizzare il caricamento della UI.
