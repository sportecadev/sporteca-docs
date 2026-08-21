# UC-05 - Profilazione utente Atleta

Stato: confermato (con assunzioni aperte segnalate in fondo al documento)
Ultimo aggiornamento: 2026-08-05
Documenti correlati: uc-01_registrazione-utente.md, uc-04_profilazione-societa.md,
01-decisioni-perimetro-mvp.md

## Obiettivo

Permettere a un utente registrato con tipologia account "Atleta" di completare i dati anagrafici
e sportivi necessari per rendere il profilo utilizzabile e ricercabile sulla piattaforma, previa
validazione da parte del back-office, applicando la corretta gestione dei dati del genitore/tutore
per gli utenti minorenni.

## Attori

- Utente registrato di tipo Atleta
- Genitore/tutore (solo se l'atleta è minorenne, come fonte dei dati richiesti in questo UC)
- Sistema (piattaforma Sporteca)
- Operatore back-office (destinatario indiretto, vedi caso d'uso dedicato)

## Precondizioni

- L'utente possiede un account attivo (creato tramite UC-01) con tipologia "Atleta" selezionata
- La data di nascita è già nota dal momento della registrazione (raccolta in UC-01) ed è
  utilizzata qui per determinare se si applicano i campi genitore/tutore
- La profilazione non è ancora stata completata, oppure è stata completata ma è in stato di
  modifica

## Trigger

Al primo accesso successivo all'attivazione dell'account, il sistema indirizza l'utente alla
profilazione. L'utente può anche accedervi volontariamente in un secondo momento per completare
o correggere i dati.

---

## Flusso principale

1. Il sistema mostra il form di profilazione, organizzato in sezioni: Anagrafica, Dati
   genitore/tutore (solo se l'utente è minorenne), Profilo sportivo, Preferenze e consensi
2. L'utente compila i dati anagrafici:
   - Nome, Cognome
   - Comune di nascita
   - Sesso
   - Codice fiscale
   - Comune, indirizzo e C.A.P. di residenza (C.A.P. facoltativo)
   - Comune, indirizzo e C.A.P. di domicilio (C.A.P. facoltativo)
   - Nota: la data di nascita non viene richiesta di nuovo, è già disponibile da UC-01
3. Il sistema calcola la fascia d'età dalla data di nascita e, se l'utente risulta minorenne
   (under 14 o 14-17, come da UC-01), attiva obbligatoriamente la sezione dati del genitore/tutore:
   - Nome e cognome del genitore/tutore
   - Codice fiscale del genitore/tutore
   - Email del genitore/tutore (già raccolta in registrazione per la fascia under 14; da
     raccogliere qui per la prima volta per la fascia 14-17)
4. Il sistema valida in tempo reale l'univocità del codice fiscale dell'atleta
5. L'utente seleziona il profilo sportivo:
   - Sport praticato (dal modello di configurazione Sport)
   - Categoria (dipendente dallo Sport selezionato)
   - Ruolo/i (dipendente dallo Sport selezionato; l'utente può indicarne più di uno e specificare
     un ruolo principale)
   - Peso (Kg)
   - Altezza (Cm)
6. L'utente imposta i consensi e le preferenze:
   - Consenso al trattamento dati (base) — obbligatorio
   - Consenso a marketing e comunicazioni promozionali — facoltativo, separato dal consenso base
   - Flag visibilità nel motore di ricerca
   - Flag abilitazione notifiche
7. L'utente carica il documento richiesto per la validazione:
   - Documento di identità dell'atleta
   - Se l'atleta è minorenne, anche il documento di identità del genitore/tutore
8. Il sistema salva il profilo e lo marca come "profilazione completata, in attesa di validazione
   back-office"
9. Il profilo entra nella coda di validazione back-office (vedi caso d'uso dedicato, non coperto
   da questo documento)

---

## Flussi alternativi

**A1 - Compilazione parziale**
L'utente può interrompere la compilazione in qualsiasi momento e riprenderla in una sessione
successiva. Il profilo resta in stato "profilazione incompleta" finché tutti i campi obbligatori
non sono stati forniti.

**A2 - Modifica di un profilo già validato**
Come per UC-04, il comportamento in caso di modifica di campi critici dopo una validazione
positiva (es. codice fiscale, documento di identità) non è ancora definito — vedi assunzioni
aperte.

---

## Eccezioni

**E1 - Codice fiscale già in uso**
Il sistema blocca il salvataggio e mostra un messaggio esplicito di conflitto.

**E2 - Documento caricato non valido**
Formato non supportato o dimensione eccessiva: il sistema mostra un errore e richiede un nuovo
caricamento.

**E3 - Consenso al trattamento dati (base) non fornito**
La profilazione non può essere considerata completa; il sistema impedisce l'invio del form
finché il consenso base non viene fornito.

**E4 - Dati del genitore/tutore mancanti per un atleta minorenne**
Il sistema impedisce il completamento della profilazione finché tutti i campi genitore/tutore
obbligatori non sono stati forniti.

---

## Postcondizioni

- Profilo atleta completo e salvato, in stato "in attesa di validazione back-office"
- L'account resta con funzionalità limitate (non visibile in ricerca, non può sbloccare altri
  profili) finché il back-office non completa la validazione, per coerenza con UC-02

## Regole di business coinvolte

- Il codice fiscale dell'atleta è un dato obbligatorio e univoco a livello di piattaforma
- Per gli atleti minorenni (under 14 e 14-17) sono sempre obbligatori i dati del genitore/tutore:
  nome, cognome, codice fiscale, email
- Il campo Ruolo/i dipende dallo Sport selezionato: non è possibile selezionare un ruolo non
  coerente con lo sport scelto (es. "Portiere" non è selezionabile se lo sport è Pallavolo)
- Il consenso al trattamento dati di base è obbligatorio; il consenso a marketing/comunicazioni
  promozionali è facoltativo e gestito come flag separato
- Il profilo non è visibile nel motore di ricerca né può iniziare a sbloccare altri profili finché
  non risulta validato dal back-office

## Campi esclusi dall'MVP (rispetto al documento di analisi originale)

- **CARATTERISTICHE PRINCIPALI**: escluso in quanto campo auto-valutato, privo di un meccanismo
  di validazione esterna nell'MVP (scouting e valutazione skills a stelle sono entrambi esclusi,
  vedi 01-decisioni-perimetro-mvp.md); da rivalutare in Fase 2
- **GIOCATORE PROFESSIONISTA PREFERITO**: escluso, scopo non definito nel documento originale
- **STIPENDIO**: escluso, dato sensibile non necessario allo scopo minimo della piattaforma
- **Informazioni di carriera** (club precedenti, presenze, goal fatti/subiti): escluse dall'MVP,
  backlog Fase 2
- **Caricamento video/contenuti multimediali**: non è parte di questo caso d'uso; sarà trattato in
  un documento dedicato alla gestione dei contenuti media

## Dati utilizzati

Nome, cognome, comune di nascita, sesso, codice fiscale, comune/indirizzo/C.A.P. di residenza,
comune/indirizzo/C.A.P. di domicilio, dati del genitore/tutore (nome, cognome, codice fiscale,
email — solo se minorenne), Sport, Categoria, Ruolo/i, peso, altezza, consenso trattamento dati,
consenso marketing, flag visibilità motore di ricerca, flag notifiche, documenti caricati
(documento di identità dell'atleta e, se minorenne, del genitore/tutore).

## Entità coinvolte

- User (tipo Atleta)
- AthleteProfile (dati anagrafici e sportivi specifici dell'atleta)
- Sport, Categoria, Ruolo (entità di configurazione, condivise con gli altri profili; Ruolo è
  dipendente da Sport)
- Media (documenti caricati per la validazione)

---

## Rischi individuati

- **Coerenza e verifica dei dati del genitore/tutore**: come già segnalato in UC-01, non esiste
  una verifica reale dell'identità di chi viene indicato come genitore/tutore, né per la fascia
  under 14 né per la fascia 14-17. Il controllo resta interamente affidato all'esame manuale del
  back-office in fase di validazione documentale.

## Assunzioni ancora da validare (non decise, segnalate esplicitamente)

- Se il codice fiscale del genitore/tutore debba essere univoco a livello di piattaforma o possa
  essere condiviso tra più profili atleta (es. fratelli/sorelle con lo stesso genitore)
- Se l'email del genitore/tutore raccolta in questa fase (fascia 14-17) richieda una qualche forma
  di verifica, o resti un campo dichiarativo come per la fascia under 14
- Se la foto profilo sia un campo obbligatorio per completare la profilazione o venga gestita
  interamente nel futuro documento dedicato ai contenuti media
- Se la modifica di campi critici su un profilo già validato debba innescare una nuova validazione
  back-office (stesso tema aperto di UC-04)