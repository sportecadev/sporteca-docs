# UC-06 - Profilazione utente Membro dello staff

Stato: confermato (con assunzioni aperte segnalate in fondo al documento)
Ultimo aggiornamento: 2026-08-05
Documenti correlati: uc-01_registrazione-utente.md, uc-04_profilazione-societa.md,
uc-05_profilazione-atleta.md, 01-decisioni-perimetro-mvp.md

## Obiettivo

Permettere a un utente registrato con tipologia account "Membro dello staff" di completare i dati
anagrafici e tecnici necessari per rendere il profilo utilizzabile e ricercabile sulla piattaforma,
previa validazione da parte del back-office. Il profilo staff ha la stessa finalità di
"candidabilità" del profilo Atleta: il membro dello staff si registra per essere trovato e
potenzialmente ingaggiato da una società.

## Attori

- Utente registrato di tipo Membro dello staff
- Sistema (piattaforma Sporteca)
- Operatore back-office (destinatario indiretto, vedi caso d'uso dedicato)

## Precondizioni

- L'utente possiede un account attivo (creato tramite UC-01) con tipologia "Membro dello staff"
  selezionata
- La profilazione non è ancora stata completata, oppure è stata completata ma è in stato di
  modifica

## Trigger

Al primo accesso successivo all'attivazione dell'account, il sistema indirizza l'utente alla
profilazione. L'utente può anche accedervi volontariamente in un secondo momento per completare
o correggere i dati.

---

## Flusso principale

1. Il sistema mostra il form di profilazione, organizzato in sezioni: Anagrafica, Profilo tecnico
   e sportivo, Preferenze e consensi
2. L'utente compila i dati anagrafici:
   - Nome, Cognome
   - Comune di nascita
   - Codice fiscale
   - Comune, indirizzo e C.A.P. di residenza (C.A.P. facoltativo)
   - Comune, indirizzo e C.A.P. di domicilio (C.A.P. facoltativo)
   - Nota: la data di nascita non viene richiesta di nuovo, è già disponibile da UC-01
3. Il sistema valida in tempo reale l'univocità del codice fiscale
4. L'utente seleziona il profilo tecnico e sportivo:
   - Sport di competenza (dal modello di configurazione Sport, coerente con il modello atleta)
   - Categoria di riferimento (dipendente dallo Sport selezionato)
   - Ruolo tecnico (selezione singola da elenco configurabile: Allenatore, Allenatore in seconda,
     Allenatore dei portieri, Preparatore atletico, Dirigente, Match Analyst)
5. L'utente imposta i consensi e le preferenze:
   - Consenso al trattamento dati (base) — obbligatorio
   - Consenso a marketing e comunicazioni promozionali — facoltativo, separato dal consenso base
   - Flag visibilità nel motore di ricerca
   - Flag abilitazione notifiche
6. L'utente carica i documenti richiesti per la validazione:
   - Documento di identità — obbligatorio
   - Tesserino federale o patentino di abilitazione, se posseduto — facoltativo, non bloccante
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
Come per UC-04 e UC-05, il comportamento in caso di modifica di campi critici dopo una validazione
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

---

## Postcondizioni

- Profilo staff completo e salvato, in stato "in attesa di validazione back-office"
- L'account resta con funzionalità limitate (non visibile in ricerca, non può sbloccare altri
  profili) finché il back-office non completa la validazione, per coerenza con UC-02

## Regole di business coinvolte

- Il codice fiscale del membro dello staff è un dato obbligatorio e univoco a livello di
  piattaforma
- Il profilo tecnico (ruolo) è un dato obbligatorio, selezionato da un elenco configurabile, non
  hardcoded
- Sport e Categoria sono obbligatori, per rendere il profilo coerentemente ricercabile insieme ai
  profili Atleta all'interno dello stesso contesto sportivo
- Il tesserino federale/patentino non è richiesto come obbligatorio: la normativa delle federazioni
  sportive non lo impone in modo uniforme a tutte le categorie dilettantistiche (verificato per il
  calcio: in Terza Categoria non sono previsti obblighi di abilitazione per gli allenatori);
  trattarlo come obbligatorio escluderebbe ingiustamente staff legittimo delle categorie più basse
- Il consenso al trattamento dati di base è obbligatorio; il consenso a marketing/comunicazioni
  promozionali è facoltativo e gestito come flag separato
- Il profilo non è visibile nel motore di ricerca né può iniziare a sbloccare altri profili finché
  non risulta validato dal back-office

## Campi esclusi o modificati rispetto al documento di analisi originale

- **Operatore di segreteria**: rimosso dall'elenco dei ruoli tecnici; sostituito da un ruolo
  generico "Dirigente"
- **Match Analyst**: aggiunto all'elenco dei ruoli tecnici, non presente nel documento originale
- **Corsi di abilitazione effettuati** (con dettaglio ente/data/luogo): esclusi dall'MVP come
  sezione strutturata; sostituiti da un singolo upload facoltativo del tesserino/patentino, senza
  tracciamento dettagliato dei singoli corsi. La gestione strutturata dei corsi è backlog Fase 2
- **Video allenamenti particolari**: non è parte di questo caso d'uso; sarà trattato, come per
  l'atleta, in un documento dedicato alla gestione dei contenuti media
- **Campo Sport di competenza**: non era esplicitamente presente nel documento originale per lo
  staff (la sezione "profilo sportivo" elencava solo materiale caricabile). È stato aggiunto in
  questo documento perché necessario a rendere il profilo staff ricercabile per sport, in coerenza
  con il modello multi-sport e con la natura "candidabile" del profilo staff — modifica da validare
  esplicitamente

## Dati utilizzati

Nome, cognome, comune di nascita, codice fiscale, comune/indirizzo/C.A.P. di residenza,
comune/indirizzo/C.A.P. di domicilio, Sport, Categoria, ruolo tecnico, consenso trattamento dati,
consenso marketing, flag visibilità motore di ricerca, flag notifiche, documenti caricati
(documento di identità, tesserino/patentino facoltativo).

## Entità coinvolte

- User (tipo Membro dello staff)
- StaffProfile (dati anagrafici e tecnici specifici dello staff)
- Sport, Categoria, RuoloTecnico (entità di configurazione; RuoloTecnico è specifica per lo staff,
  distinta dall'entità Ruolo usata per l'atleta)
- Media (documenti caricati per la validazione)

---

## Assunzioni ancora da validare (non decise, segnalate esplicitamente)

- Il documento originale non prevede alcuna gestione minorenni per lo staff: si assume che i
  membri dello staff siano sempre maggiorenni. Da confermare esplicitamente (es. un assistente
  allenatore minorenne non è un caso previsto in questo documento)
- Se la modifica di campi critici su un profilo già validato debba innescare una nuova validazione
  back-office (stesso tema aperto di UC-04 e UC-05)
- Se l'elenco dei ruoli tecnici configurabili debba essere esteso con altre figure (es. medico
  sociale, osservatore) in una fase successiva