# UC-05 - Profilazione utente Atleta & Campi Sport-Specifici Dinamici

Stato: confermato
Ultimo aggiornamento: 2026-08-21
Documenti correlati: uc-01_registrazione-utente.md, uc-04_profilazione-societa.md, 01-decisioni-perimetro-mvp.md, 04-database-schema-and-scraper-alignment.md

## Obiettivo

Permettere a un utente registrato con tipologia account "Atleta" di completare i dati anagrafici, fiscali e sportivi. Il flusso integra la raccolta obbligatoria del **Codice Fiscale** dell'atleta e del genitore (per i minori) ed introduce un **sistema dinamico ed astratto per i dati sportivi**, dove i campi tecnici addizionali da compilare e mostrare a schermo vengono guidati e configurati in base allo Sport specifico selezionato.

---

## 🏛️ Analisi Architetturale: Gestione dei Campi Sport-Specifici

Ciascun sport richiede la raccolta di parametri atletici e tecnici unici (es. *Altezza del canestro, percentuale da 3 punti* per il Basket; *Massimo di schiacciata, salto verticale* per la Pallavolo; *Piede preferito, velocità su 100m* per il Calcio). 

Per implementare questa dinamicità senza bloccare lo sviluppo, abbiamo confrontato due approcci architetturali:

### Approccio A: Modello EAV (Entity-Attribute-Value)
*   **Struttura**: Tabelle `AttributeDefinition` e `AttributeValue` per mappare ogni singolo campo come riga del database.
*   **Analisi Rigorosa**: Sebbene garantisca la massima flessibilità a livello DB (aggiunta di campi senza modifiche di schema), EAV è **fortemente sconsigliato** per Sporteca. Avendo un motore di ricerca B2B (UC-08) con filtri multipli, le query SQL richiederebbero N join sulla stessa tabella dei valori per filtrare più parametri. Questo degraderebbe le prestazioni del DB e complicherebbe notevolmente le mappature JPA/Hibernate in Spring/Jmix, impedendo tempi di risposta rapidi (sub-50ms).

### Approccio B: Colonne JSON Strutturate + Metadati di Configurazione (SCELTO)
*   **Struttura**:
    *   I campi fisici standard e comuni a tutti gli sport (es. **Peso in Kg**, **Altezza in Cm**) sono memorizzati in colonne relazionali standard indicizzate, poiché critici per le ricerche trasversali.
    *   I campi tecnici sport-specifici sono memorizzati in un'unica colonna nativa MySQL di tipo **JSON** chiamata `sport_attributes` all'interno della tabella del profilo atleta.
    *   Una tabella di metadati chiamata `sport_attribute_definitions` definisce per ciascuno Sport quali chiavi JSON devono essere raccolte, la loro etichetta tradotta, il tipo di input (Numero, Booleano, Stringa) e le regole di convalida.
*   **Razionale di Scelta**: È l'approccio ideale. Offre la flessibilità del database dinamico (i campi cambiano per sport via configurazione di back-office) ma mantiene le performance elevate. Spring Boot ed il motore di ricerca possono estrarre e filtrare velocemente i valori del JSON in SQL usando le funzioni native (`JSON_EXTRACT` o JSON Path in Hibernate) con impatto prestazionale minimo e senza join multipli.

---

## Attori

- Utente registrato di tipo Atleta (Maggiorenne o Minorenne)
- Genitore/tutore (solo se l'atleta è minorenne, per l'approvazione dei dati)
- Sistema (piattaforma Sporteca)
- Operatore back-office (per la validazione finale)

## Precondizioni

- L'utente possiede un account attivo di tipo "Atleta".
- La data di nascita è già disponibile (raccolta in UC-01) per determinare le regole di compilazione dei minori.

---

## Flusso Principale

1. Il sistema mostra il form di profilazione, strutturato in sezioni: Anagrafica, Dati Genitore (se minorenne), Profilo Sportivo standard, Attributi Tecnici Dinamici, e Consensi.
2. L'utente compila i dati anagrafici fondamentali:
   - Nome, Cognome.
   - Sesso.
   - **Codice Fiscale dell'Atleta** (Univoco, obbligatorio e validato formalmente a livello di checksum).
   - Comune di Nascita.
   - Indirizzo di residenza e CAP (residenza e domicilio se diversi).
3. Il sistema controlla la data di nascita: se l'atleta è minorenne (Under 18), richiede obbligatoriamente i dati del Genitore/Tutore:
   - Nome, Cognome.
   - **Codice Fiscale del Genitore/Tutore**.
   - Email del Genitore (se non già verificata in UC-01).
4. **Scelta dello Sport**: L'utente seleziona lo **Sport praticato** (es. *Calcio a 11*).
5. **Configurazione dei Ruoli**: Il sistema espone i ruoli associati allo sport scelto (es. *Portiere, Difensore*). L'utente può selezionare ruoli multipli e deve obbligatoriamente indicare un **Ruolo Principale**.
6. **Caricamento dei Campi Tecnici Dinamici**:
    *   Il backend legge la tabella `sport_attribute_definitions` filtrando per lo Sport selezionato.
    *   L'interfaccia client (App/Web) genera dinamicamente i relativi campi di input a schermo (es. per il basket mostra *"Percentuale da 3 punti"*, *"Schiacciata Max in cm"*; per il calcio mostra *"Piede preferito (Destro/Sinistro)"*).
    *   L'atleta compila i valori richiesti.
7. L'utente inserisce i dati biometrici standard: **Peso (Kg)** ed **Altezza (Cm)**.
8. L'utente esegue l'upload dei documenti:
   - Documento d'identità in corso di validità dell'atleta.
   - Se minorenne, anche il Documento d'identità del Genitore/Tutore.
9. Il sistema salva i valori sport-specifici all'interno della colonna JSON `sport_attributes`, convalida i checksum dei Codici Fiscali e imposta lo stato del profilo in `PENDING_REVIEW` (In attesa di validazione).

---

## Eccezioni

*   **E1 - Codice Fiscale dell'Atleta già in uso**: Il sistema blocca il salvataggio per evitare profili duplicati.
*   **E2 - Checksum del Codice Fiscale non valido**: Il sistema segnala l'errore di digitazione (es. lettere/numeri invertiti) prima di consentire l'invio del form.
*   **E3 - Mancata compilazione dei dati del Genitore**: Per gli utenti minori, il sistema blocca l'avanzamento finché i dati anagrafici e il CF del genitore non sono completati.

---

## Postcondizioni

*   Profilo atleta salvato in stato `PENDING_REVIEW`.
*   Tutti i parametri biometrici e gli attributi tecnici specifici sono archiviati in formato strutturato (colonna JSON) pronti per essere indicizzati e filtrati dal motore di ricerca.
*   Il profilo entra nella coda di validazione del back-office (UC-07).
