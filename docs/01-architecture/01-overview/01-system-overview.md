# 01 - Panoramica di Sistema (System Overview) 🌐

Questo documento descrive ad alto livello l'architettura complessiva di **Sporteca**, identificando gli attori coinvolti nell'MVP, i casi d'uso principali e i flussi di dati che permettono al sistema di scalare da una configurazione locale a un deployment cloud-native.

---

## 👥 Gli Attori del Sistema nell'MVP

Nell'MVP, ridotto alle sue funzioni fondamentali di incontro tra domanda e offerta sportiva, operano i seguenti attori:

1. **Atleta (User):** Calciatore dilettante che si registra per creare il proprio profilo sportivo digitale e rivendicare (claiming) le sue statistiche storiche reali.
2. **Company (Società Sportiva):** Società/Club che si registra per ricercare talenti e atleti sul mercato, accedendo ai profili completi e verificati.
3. **Super Amministratore (Admin):** Personale interno Sporteca con visibilità globale di tutti i dati del database, deputato al controllo, alla moderazione e all'assistenza clienti.
4. **Scraper (Ingegnere di Ingestione Dati):** Un processo automatizzato asincrono (in Python) che estrae i dati ufficiali dei campionati dai portali sportivi (es. Tuttocampo) per popolare la base dati di confronto.

---

## 🗺️ Architettura di Alto Livello (High-Level Architecture)

Il sistema adotta un approccio **Ibrido Monolite Modulare** per il backend, esponendo interfacce differenziate per i vari canali di consumo:

```
[ Fonti Esterne: Tuttocampo ]
             |
             v (Scraping periodico asincrono)
     [ Sporteca Scraper ] ─── (API di Importazione / Scraper API) ───+
                                                                     |
                                                                     v
                                                          +────────────────----+
                                                          |  Jmix Backend Core |
                                                          | (Spring Boot REST) |
                                                          +───┬────────────┬───+
                                                              |            |
                      +───────────────────────────────────────+            +──────────────────────────+
                      | (Interfaccia nativa Jmix Web UI)                                              | (REST APIs over JWT)
                      v                                                                               v
          +────────────────────────+                                                      +────────────────────────+
          |   Pannelli Web App     |                                                      |  API Gateway o Direct  |
          | - Portale Super Admin  |                                                      |   (Routing & Security) |
          | - Portale Company      |                                                      +───┬────────────────┬───+
          +────────────────────────+                                                          |                |
                                                                                              v                v
                                                                                       [ App Flutter ]  [ Widget Embed ]
                                                                                       (Atleti Mobile)   (es. Wordpress)
```

---

## ⚡ Flussi di Lavoro Principali (Core Use Cases)

### 1. Registrazione dell'Atleta e "Claiming" del Profilo
Il valore aggiunto di Sporteca per l'atleta è l'associazione istantanea con la sua carriera sportiva reale senza necessità di inserimento manuale.

```
[ Atleta ]                            [ App Flutter ]                     [ Jmix Backend ]               [ DB MySQL Core ]
    |                                        |                                    |                              |
    | 1. Inserisce Nome/Cognome, Nascita ---->|                                    |                              |
    |                                        | 2. Chiamata POST /api/register --->|                              |
    |                                        |                                    | 3. Query corrispondenze ---->|
    |                                        |                                    |<-4. Ritorna profili scraper--|
    |                                        |<--5. Mostra lista profili trovati--|                              |
    | 6. Seleziona "Sono io!" -------------->|                                    |                              |
    |                                        | 7. POST /api/players/claim -------->|                              |
    |                                        |    (Invia prove/identità)          | 8. Associa User UUID         |
    |                                        |                                    |    a Player ID ------------->|
    |                                        |                                    | 9. Salva stato "CLAIMED" ----|
    |                                        |<--10. Profilo associato con successo|                              |
```

*Nota:* Nella fase MVP, per velocizzare l'adozione, il processo di claim può essere automatico se la corrispondenza dei dati inseriti (es. Codice Fiscale o combinazione Nome-Cognome-Data di Nascita) è univoca, oppure può finire in una coda di moderazione visibile nel pannello del **Super Amministratore**.

---

## 2. Ricerca e Scouting delle Company
Le Company accedono a uno strumento avanzato di filtraggio per la selezione di atleti.

```
[ Company ]                           [ Jmix Web Portal ]                 [ Jmix Backend ]               [ DB MySQL Core ]
    |                                        |                                    |                              |
    | 1. Imposta filtri (es. "Attaccanti     |                                    |                              |
    |    2001, Basilicata, >10 gol") -------->|                                    |                              |
    |                                        | 2. Esegue query filtrata --------->|                              |
    |                                        |                                    | 3. SELECT JOIN players       |
    |                                        |                                    |    & player_stats ---------->|
    |                                        |                                    |<-4. Ritorna record ----------|
    |                                        |<--5. Mostra griglia risultati------|                              |
```

---

## 3. Integrazione Esterna (Widget Generico per Siti Club / WordPress)
Una delle funzionalità chiave richieste è la capacità di integrare le statistiche in tempo reale direttamente sui siti web delle società (spesso realizzati in WordPress).

* **La Soluzione:** Il backend Jmix espone un set di API REST pubbliche a sola lettura (`/api/public/v1/teams/{team_id}/standings` e `/api/public/v1/teams/{team_id}/roster`).
* **La Sicurezza:** L'accesso a queste API è regolato tramite una **API Key pubblica** (Token) univoca per ciascuna Company, inseribile nelle impostazioni del plugin WordPress o di uno script JavaScript incorporabile (iframe o fetch nativa).
* **Il Risultato:** La società sportiva visualizza sul proprio sito ufficiale la classifica e la rosa dei giocatori sempre aggiornate in automatico, senza dover scrivere codice o effettuare aggiornamenti manuali.
