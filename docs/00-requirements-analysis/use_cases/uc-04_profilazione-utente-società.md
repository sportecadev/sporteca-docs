# UC-04 - Profilazione utente Società

Stato: confermato (con assunzioni aperte segnalate in fondo al documento)
Ultimo aggiornamento: 2026-08-05
Documenti correlati: uc-01_registrazione-utente.md, 01-decisioni-perimetro-mvp.md

## Obiettivo

Permettere a un utente registrato con tipologia account "Società" di completare i dati anagrafici
e sportivi necessari per rendere il profilo utilizzabile e ricercabile sulla piattaforma, previa
validazione da parte del back-office.

## Attori

- Utente registrato di tipo Società (rappresentante dell'organizzazione)
- Sistema (piattaforma Sporteca)
- Operatore back-office (destinatario indiretto: riceve il profilo in coda di validazione,
  dettagliato nel caso d'uso dedicato)

## Precondizioni

- L'utente possiede un account attivo (creato tramite UC-01) con tipologia "Società" selezionata
- La profilazione non è ancora stata completata, oppure è stata completata ma è in stato di
  modifica

## Trigger

Al primo accesso successivo all'attivazione dell'account, il sistema indirizza l'utente alla
profilazione. L'utente può anche accedervi volontariamente in un secondo momento per completare
o correggere i dati.

---

## Flusso principale

1. Il sistema mostra il form di profilazione, organizzato in tre sezioni: Anagrafica, Profilo
   sportivo, Preferenze e consensi
2. L'utente compila i dati anagrafici:
   - Ragione sociale
   - Partita IVA
   - Comune di residenza
   - Indirizzo di residenza
   - C.A.P. di residenza (facoltativo)
   - Nome e cognome del legale rappresentante
3. Il sistema valida in tempo reale l'univocità della Partita IVA rispetto agli altri account
   già presenti in piattaforma
4. L'utente seleziona il profilo sportivo: uno Sport e una Categoria, tramite selezione singola
   dipendente (la lista delle categorie disponibili dipende dallo sport scelto, secondo il modello
   dati configurabile Sport/Categoria)
5. L'utente imposta i consensi e le preferenze:
   - Consenso al trattamento dati (base) — obbligatorio
   - Consenso a marketing e comunicazioni promozionali — facoltativo, separato dal consenso base
   - Flag visibilità nel motore di ricerca
   - Flag abilitazione notifiche
6. L'utente carica i documenti richiesti per la validazione:
   - Certificato di affiliazione CONI/Federazione Sportiva Nazionale, in corso di validità
   - Documento di identità del legale rappresentante
7. Il sistema salva il profilo e lo marca come "profilazione completata, in attesa di validazione
   back-office"
8. Il profilo entra nella coda di validazione back-office (vedi caso d'uso dedicato, non coperto
   da questo documento)

---

## Flussi alternativi

**A1 - Compilazione parziale**
L'utente può interrompere la compilazione in qualsiasi momento e riprenderla in una sessione
successiva. Il profilo resta in stato "profilazione incompleta" finché tutti i campi obbligatori
non sono stati forniti.

**A2 - Modifica di un profilo già validato**
Se l'utente modifica, dopo una validazione positiva, campi considerati critici ai fini della
validazione (es. Partita IVA, certificato di affiliazione), il comportamento del sistema
(nuova validazione automatica, oppure profilo che resta valido finché non riesaminato) non è
ancora definito — vedi assunzioni aperte.

---

## Eccezioni

**E1 - Partita IVA già in uso**
Il sistema blocca il salvataggio e mostra un messaggio esplicito di conflitto.

**E2 - Documento caricato non valido**
Formato non supportato o dimensione eccessiva: il sistema mostra un errore e richiede un nuovo
caricamento.

**E3 - Consenso al trattamento dati (base) non fornito**
La profilazione non può essere considerata completa; il sistema impedisce l'invio del form
finché il consenso base non viene fornito. Il consenso marketing resta facoltativo.

---

## Postcondizioni

- Profilo società completo e salvato, in stato "in attesa di validazione back-office"
- L'account resta con funzionalità limitate (non visibile in ricerca, non può sbloccare altri
  profili) finché il back-office non completa la validazione, per coerenza con UC-02

## Regole di business coinvolte

- La Partita IVA è un dato obbligatorio e univoco a livello di piattaforma
- Il consenso al trattamento dati di base è obbligatorio; il consenso a marketing/comunicazioni
  promozionali è facoltativo e gestito come flag separato
- Nell'MVP un account Società gestisce una sola squadra, associata a un solo Sport e una sola
  Categoria (vincolo esplicito, vedi 01-decisioni-perimetro-mvp.md); la gestione di più squadre
  per la stessa società è fuori perimetro
- Il profilo non è visibile nel motore di ricerca né può iniziare a sbloccare altri profili finché
  non risulta validato dal back-office

## Dati utilizzati

Ragione sociale, Partita IVA, comune/indirizzo/C.A.P. di residenza, nome e cognome del legale
rappresentante, Sport, Categoria, consenso trattamento dati, consenso marketing, flag visibilità
motore di ricerca, flag notifiche, documenti caricati (certificato di affiliazione, documento di
identità del legale rappresentante).

## Entità coinvolte

- User (tipo Società)
- CompanyProfile (dati anagrafici e sportivi specifici della società)
- Sport, Categoria (entità di configurazione, condivise con gli altri profili)
- Media (documenti caricati per la validazione)

---

## Rischi individuati

- **Scadenza del certificato di affiliazione**: l'affiliazione CONI/Federazione è rilasciata per
  stagione sportiva, quindi ha una validità temporale. Il documento attuale non prevede un
  meccanismo di richiesta di rinnovo/aggiornamento a scadenza: un profilo potrebbe restare
  validato anche con un certificato ormai scaduto. Da valutare se serva un controllo periodico o
  un promemoria di rinnovo.

## Assunzioni ancora da validare (non decise, segnalate esplicitamente)

- Se la modifica di campi critici su un profilo già validato debba innescare una nuova validazione
  back-office (vedi flusso alternativo A2)
- Se, e come, gestire la scadenza del certificato di affiliazione (vedi rischio sopra)
- Se la compilazione parziale (bozza) debba avere un limite di tempo oltre il quale viene
  eliminata, o resti salvata indefinitamente