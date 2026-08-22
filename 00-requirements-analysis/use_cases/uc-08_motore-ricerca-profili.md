# UC-08 - Motore di ricerca profili

Stato: confermato (con assunzioni aperte segnalate in fondo al documento)
Ultimo aggiornamento: 2026-08-05
Documenti correlati: uc-05_profilazione-atleta.md, uc-06_profilazione-staff.md,
uc-07_validazione-backoffice.md, 01-decisioni-perimetro-mvp.md

## Obiettivo

Permettere a un utente con profilo validato di cercare profili Atleta o Staff visibili in
piattaforma, filtrando per sport, categoria, ruolo, età e prossimità geografica, visualizzando
risultati anonimizzati che potranno successivamente essere sbloccati (vedi UC-09) per accedere
ai dati completi e di contatto.

## Attori

- Utente ricercante (tipicamente Società; vedi assunzione aperta sotto)
- Sistema (piattaforma Sporteca)

## Precondizioni

- L'utente ricercante ha un account con profilo validato dal back-office (stato "validato",
  accesso completo, come da UC-02 e UC-07)

## Trigger

L'utente accede alla sezione di ricerca della piattaforma e imposta i criteri di ricerca.

---

## Flusso principale

1. L'utente accede alla sezione ricerca
2. L'utente imposta i filtri:
   - Sport (obbligatorio, dal modello di configurazione Sport)
   - Categoria (dipendente dallo Sport selezionato)
   - Ruolo (dipendente dallo Sport selezionato)
   - Età (range minimo/massimo)
   - Località di riferimento e raggio di distanza
3. Il sistema esegue la ricerca tra i profili Atleta e Staff che risultano contemporaneamente:
   - validati dal back-office (UC-07)
   - con flag "visibilità motore di ricerca" attivo (impostato in fase di profilazione)
   - compatibili con i filtri impostati, incluso il criterio di distanza geografica
4. Il sistema restituisce un elenco di risultati anonimizzati. Per ciascun risultato vengono
   mostrati esclusivamente: ruolo, età. Non vengono mostrati nome, cognome, dati di contatto,
   né la località del profilo (usata internamente solo per il calcolo della distanza)
5. L'utente può selezionare un risultato per avviare la procedura di sblocco del profilo completo
   (vedi UC-09, caso d'uso separato)

---

## Flussi alternativi

**A1 - Nessun risultato trovato**
Il sistema mostra un messaggio esplicito e suggerisce di ampliare i filtri (es. aumentare il
raggio di distanza o il range di età).

---

## Eccezioni

**E1 - Utente ricercante non ancora validato**
Se l'account dell'utente non ha ancora completato la validazione back-office, l'accesso alla
ricerca è negato o limitato, per coerenza con lo stato di accesso limitato definito in UC-02.

---

## Postcondizioni

- Elenco di risultati anonimizzati mostrato all'utente, pronto per un eventuale sblocco (UC-09)

## Regole di business coinvolte

- Solo i profili validati dal back-office e con flag di visibilità attivo compaiono nei risultati
- I risultati anonimizzati non includono mai nome, cognome, dati di contatto o località precisa,
  coerentemente con la logica "freemium" descritta nel documento di analisi originale
- Il filtro di prossimità geografica utilizza la località del profilo solo internamente per il
  calcolo della distanza, senza mai esporla nei risultati prima dello sblocco

## Dati utilizzati

Criteri di ricerca (sport, categoria, ruolo, range età, località di riferimento, raggio), dati dei
profili Atleta/Staff (sport, categoria, ruolo, età, comune — quest'ultimo usato solo per il
calcolo della distanza), flag visibilità motore di ricerca.

## Entità coinvolte

- AthleteProfile, StaffProfile
- Sport, Categoria, Ruolo, RuoloTecnico (entità di configurazione)

---

## Rischi individuati

- **Re-identificazione in categorie con pochi profili**: anche mostrando solo ruolo ed età, in
  una categoria/sport con pochissimi profili disponibili (es. una sola atleta donna in una
  categoria di nicchia) la combinazione ruolo+età potrebbe essere sufficiente a identificare
  indirettamente la persona per chi conosce già il contesto locale. Da valutare se serva una
  soglia minima di risultati sotto la quale il sistema aggrega o nasconde ulteriormente i dati.

## Assunzioni ancora da validare (non decise, segnalate esplicitamente)

- Se la ricerca è una funzionalità riservata esclusivamente alle Società, oppure se anche gli
  Atleti/Staff devono poter cercare (es. Società che offrono opportunità, in logica di bacheca
  annunci); il documento originale descrive solo lo scenario Società → Atleta
- Se serve un limite al numero di risultati per pagina/query o un meccanismo di paginazione
- Se i profili Staff necessitano di filtri di ricerca dedicati (es. ruolo tecnico invece di ruolo
  di gioco) distinti da quelli degli Atleti, o condividono la stessa interfaccia di ricerca