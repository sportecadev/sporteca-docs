# UC-04 - Profilazione utente Società (Multi-Squadra e Multi-Sport)

Stato: confermato
Ultimo aggiornamento: 2026-08-21
Documenti correlati: uc-01_registrazione-utente.md, 01-decisioni-perimetro-mvp.md

## Obiettivo

Permettere a un utente registrato con tipologia account "Società" (Company) di completare i dati anagrafici, fiscali e legali del Club, e di gestire la propria struttura sportiva configurando **più Squadre (Teams)** operanti in **diversi Sport e Categorie** (ad esempio, una società polisportiva che gestisce una squadra di Calcio a 11 in Serie D e una squadra di Calcio a 5 Under 19).

---

## 🏗️ La Struttura Multi-Squadra

Nell'MVP di Sporteca, una Società Sportiva non è limitata ad un singolo sport o ad una singola categoria. Il profilo societario rappresenta l'ente giuridico (il Club), il quale può registrare e gestire un numero illimitato di **Squadre (Teams)**:

```
                  +──────────────────────────────+
                  |  PROFILO SOCIETÀ / CLUB (B2B)|
                  |  (P.IVA, CONI, Legale Rapp.) |
                  +──────────────┬───────────────+
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
+──────────────────+    +──────────────────+    +──────────────────+
|     SQUADRA 1    |    |     SQUADRA 2    |    |     SQUADRA 3    |
| - Calcio a 11    |    | - Calcio a 5     |    | - Basket         |
| - Serie D        |    | - Under 19       |    | - Serie C        |
+──────────────────+    +──────────────────+    +──────────────────+
```

---

## Attori

- Utente registrato di tipo Società (rappresentante legale o delegato del Club)
- Sistema (piattaforma Sporteca)
- Operatore back-office (destinatario indiretto per la validazione cumulativa)

## Precondizioni

- L'utente possiede un account attivo di tipo "Società" (creato via UC-01).
- La profilazione legale e fiscale non è ancora stata completata (o è in stato di revisione/modifica).

## Trigger

Al primo accesso post-attivazione dell'account, il sistema reindirizza la Società alla schermata di profilazione legale. L'utente può accedere successivamente alla gestione del proprio Club per aggiungere o modificare le proprie squadre.

---

## Flusso Principale - Profilazione Societaria & Gestione Squadre

### Fase 1: Profilazione Legale e Fiscale (Obbligatoria per la validazione)
1. L'utente compila i dati fiscali e anagrafici del Club:
   - Ragione Sociale.
   - Partita IVA (Univoca, verificata a database in tempo reale).
   - Indirizzo della sede legale, Comune e C.A.P.
   - Nome, Cognome e Codice Fiscale del Legale Rappresentante.
2. L'utente effettua l'upload dei documenti probatori:
   - Certificato di Affiliazione CONI (o Federazione Sportiva) in corso di validità per la stagione corrente.
   - Documento d'identità in corso di validità del Legale Rappresentante.
3. Il sistema salva i dati fiscali e contrattuali impostando lo stato in `PENDING_REVIEW` (In attesa di validazione back-office).

### Fase 2: Configurazione della Struttura Sportiva (Gestione Squadre)
1. Dalla propria dashboard di amministrazione del Club, l'utente seleziona "Aggiungi Squadra".
2. Compila i dati della specifica squadra:
   - **Nome/Etichetta della Squadra** (es. *Prima Squadra*, *Juniores Under 19*, *Academy Under 15*).
   - **Sport Praticato** (selezionato dal modello dinamico `Sport`, es. *Calcio a 11*, *Calcio a 5*).
   - **Categoria** (selezionato dal modello dinamico `Category` filtrato in base allo sport scelto, es. *Serie D*, *Eccellenza*, *Regionale*).
3. Il sistema valida la coerenza e salva la squadra, associandola al profilo societario.
4. L'utente può ripetere i passi da 1 a 3 per registrare tutte le squadre attive all'interno del proprio club.

---

## Flussi alternativi

### A1 - Modifica di un profilo già validato
Se la Società modifica dati considerati critici (come la Partita IVA, il Legale Rappresentante o carica un nuovo Certificato CONI):
1. Il sistema salva le modifiche in bozza.
2. Imposta automaticamente lo stato del profilo societario in `PENDING_REVIEW` per forzare un nuovo controllo amministrativo.
3. Le squadre già create rimangono attive, ma la visibilità del Club e la facoltà di sbloccare contatti vengono temporaneamente sospese finché l'operatore (o l'AI) non convalida i nuovi documenti.

---

## Eccezioni

*   **E1 - Partita IVA già registrata**: Il sistema blocca il salvataggio evidenziando l'errore di duplicazione.
*   **E2 - Documento illeggibile o non supportato**: Il sistema avverte l'utente ed interrompe l'upload.
*   **E3 - Mancata compilazione dei campi obbligatori della squadra**: Il sistema impedisce il salvataggio della singola squadra finché sport e categoria non sono configurati.

---

## Postcondizioni

*   Profilo legale del Club compilato ed in attesa di validazione.
*   Struttura sportiva (squadre) registrata ed associata al profilo.
*   Il Club non può avviare ricerche o sbloccare profili di atleti finché il profilo legale non è approvato dal back-office (UC-07).
