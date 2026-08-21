# UC-01 - Registrazione utente

Stato: confermato (con assunzioni aperte segnalate in fondo al documento)
Ultimo aggiornamento: 2026-08-05
Documento correlato: 01-decisioni-perimetro-mvp.md

## Obiettivo

Permettere a un visitatore non autenticato di creare un account sulla piattaforma, tramite
registrazione classica (email/password) oppure tramite un provider di identità social
(Google, Facebook, Apple, Instagram), applicando fin dal primo accesso la corretta gestione
per gli utenti minorenni in base alla fascia d'età.

## Attori

- Utente non autenticato (visitatore che si registra)
- Genitore/tutore (solo per utenti sotto i 14 anni, come attore di conferma esterno al flusso)
- Provider di identità esterno: Google, Facebook, Apple, Instagram (solo flusso social)
- Sistema (piattaforma Sporteca)

## Precondizioni

- L'utente non possiede già un account con la stessa email, indipendentemente dal metodo con cui
  quell'account è stato creato in origine (classico o social)

## Trigger

L'utente accede alla pagina di registrazione e sceglie il metodo: registrazione classica o
registrazione tramite provider social.

---

## Flusso principale A - Registrazione classica

1. L'utente seleziona "Registrati con email"
2. Compila: email, username, password, data di nascita, domanda di sicurezza, risposta di
   sicurezza, flag privacy
3. Il sistema valida in tempo reale: formato email, univocità email/username, complessità password
   (min 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero, 1 carattere speciale)
4. Il sistema calcola l'età dell'utente dalla data di nascita e determina la fascia di
   appartenenza: under 14, 14-17, oppure 18+ (vedi sezione "Gestione minori per fascia d'età")
5. Il sistema applica il ramo di attivazione corrispondente alla fascia (vedi sotto)
6. Al completamento dell'attivazione, l'utente viene indirizzato allo step di profilazione (UC
   separato, non coperto da questo documento)

## Flusso principale B - Registrazione via provider social

1. L'utente seleziona un provider tra Google, Facebook, Apple, Instagram
2. Il sistema avvia il flusso OAuth verso il provider selezionato; l'utente autorizza la
   condivisione di email e, se disponibile, data di nascita
3. Il sistema riceve dal provider l'email (già verificata dal provider stesso) ed
   eventualmente la data di nascita
4. Il sistema verifica se l'email ricevuta corrisponde a un account già esistente sulla
   piattaforma (creato con qualsiasi metodo, classico o altro provider social)
   - Se esiste già → si applica il flusso alternativo A1 (collegamento automatico), la
     registrazione termina qui e l'utente accede con l'account esistente
   - Se non esiste → si prosegue con la creazione di un nuovo account
5. Se il provider non ha fornito la data di nascita, il sistema la richiede esplicitamente come
   campo obbligatorio aggiuntivo, prima di poter proseguire
6. Il sistema determina la fascia d'età (under 14, 14-17, 18+) e applica il ramo di attivazione
   corrispondente, con le stesse regole del flusso classico (vedi sezione dedicata)
7. Nessuna password locale viene richiesta né salvata per gli account creati esclusivamente
   via social
8. Al completamento dell'attivazione, l'utente viene indirizzato allo step di profilazione

---

## Gestione minori per fascia d'età

Questa logica si applica identicamente sia al flusso classico sia al flusso social; cambia solo
il modo in cui l'email dell'utente viene raccolta e verificata (form vs provider).

**Fascia 18+**
- Nessun vincolo aggiuntivo
- Flusso classico: account creato non attivo, email di attivazione inviata all'utente, attivazione
  al click sul link
- Flusso social: email già verificata dal provider, account attivato direttamente senza ulteriore
  email di conferma

**Fascia 14-17**
- Il minore può prestare validamente da sé il consenso al trattamento dati (normativa italiana,
  soglia 14 anni)
- Il flusso di attivazione è identico alla fascia 18+ (email di conferma per il flusso classico,
  attivazione diretta per il flusso social)
- I dati del genitore/tutore verranno raccolti nello step successivo di profilazione, non in
  registrazione, poiché servono per gli aspetti negoziali e non bloccano la creazione dell'account

**Fascia under 14**
- Il minore compila comunque personalmente il form di registrazione (o completa l'OAuth social)
- Il sistema richiede, come campo aggiuntivo obbligatorio per questa fascia, l'indirizzo email
  di un genitore/tutore
- Il sistema invia due comunicazioni distinte:
  - al minore, il consueto link di attivazione account
  - al genitore/tutore, un link di consenso esplicito alla registrazione del minore
- L'account resta in stato "non attivo" finché non risultano confermati entrambi i link
  (minore e genitore); solo a quel punto l'account passa allo stato attivo

---

## Flussi alternativi

**A1 - Collegamento automatico a account esistente (solo flusso social)**
Se l'email restituita dal provider social coincide con un'email già registrata sulla piattaforma
(con qualunque metodo), il sistema collega automaticamente il nuovo provider come metodo di
accesso aggiuntivo sull'account esistente, senza creare un duplicato e senza richiedere ulteriori
conferme. Da quel momento l'utente può accedere sia con il metodo originale sia con il provider
appena collegato.

**A2 - Reinvio comunicazioni di attivazione/consenso**
Disponibile sia per l'email di attivazione (flusso classico, tutte le fasce) sia per l'email di
consenso genitore (fascia under 14, entrambi i flussi).

---

## Eccezioni

**E1 - Provider social non fornisce l'email**
Es. permesso negato dall'utente, oppure relay email del provider non attivo. La registrazione
non può proseguire: l'email è un dato obbligatorio e univoco sulla piattaforma. Il sistema mostra
un messaggio esplicito e propone la registrazione classica come alternativa.

**E2 - Provider social irraggiungibile o errore OAuth**
Il sistema mostra un errore e consente di riprovare o di scegliere un metodo alternativo.

**E3 - Token di attivazione o di consenso scaduto**
Comportamento non ancora definito (vedi assunzioni aperte).

**E4 - Il genitore non conferma mai il consenso (fascia under 14)**
Comportamento non ancora definito (vedi assunzioni aperte).

---

## Postcondizioni

- Account creato, con uno o più metodi di autenticazione collegati (classico e/o uno o più
  provider social)
- Stato dell'account: attivo, oppure in attesa di consenso genitore (solo fascia under 14)
- Utente pronto per avviare lo step di profilazione

## Regole di business coinvolte

- Un'unica identità utente per indirizzo email, indipendentemente dal numero di metodi di
  autenticazione collegati
- La data di nascita è un dato obbligatorio raccolto in fase di registrazione, per tutti i
  metodi, poiché necessaria a determinare correttamente la fascia di gestione minori
- Per gli utenti under 14 l'attivazione dell'account richiede doppia conferma: minore e
  genitore/tutore
- Non esiste password locale per gli account creati esclusivamente tramite provider social

## Impatto sul recupero password (nota di collegamento a UC futuro)

Il caso d'uso di recupero password, descritto nel documento di analisi originale, si applica solo
agli account che dispongono di credenziali classiche (username/password). Per un account creato
esclusivamente tramite provider social, la funzione "password dimenticata" non è applicabile: deve
reindirizzare l'utente verso "Accedi con [provider]" invece di attivare un reset password locale,
poiché non esiste alcuna password da recuperare sulla piattaforma. Se un account ha sia credenziali
classiche sia uno o più provider social collegati, il recupero password classico resta comunque
disponibile come canale alternativo. Il caso d'uso di recupero password verrà aggiornato in un
documento dedicato (UC successivo) per riflettere questa distinzione.

## Dati utilizzati

Email, username (solo flusso classico), password hash (solo flusso classico), data di nascita,
provider e identificativo esterno (solo flusso social), email del genitore/tutore (solo fascia
under 14), flag privacy, stato account, token di attivazione, token di consenso genitore.

## Entità coinvolte

- User
- AuthMethod (metodo di autenticazione collegato all'utente: classico o social, un utente può
  averne più di uno)
- ActivationToken
- ParentalConsentToken (solo fascia under 14)

---

## Rischi individuati

- **Verifica identità del genitore non garantita**: il flusso attuale si basa sul possesso di un
  indirizzo email dichiarato come "del genitore" dal minore stesso, senza alcuna verifica reale
  dell'identità di chi lo controlla. Un minore potrebbe indicare un proprio secondo indirizzo email
  come "email del genitore" e auto-confermare il consenso. Va valutato se questo livello di
  controllo sia accettato come sufficiente per l'MVP oppure se serva un meccanismo di verifica
  più solido in una fase successiva.
- **Determinazione età in fase di registrazione**: rispetto al documento di analisi originale, la
  data di nascita non era richiesta in registrazione ma solo nello step di profilazione successivo.
  Questo documento introduce la data di nascita come campo obbligatorio già in registrazione,
  perché necessaria a determinare la fascia d'età prima di attivare l'account. Si tratta di una
  modifica rispetto al documento originale, da validare esplicitamente.

## Assunzioni ancora da validare (non decise, segnalate esplicitamente)

- Tempo di scadenza dei token di attivazione e di consenso genitore
- Policy in caso di mancata conferma del genitore entro un tempo ragionevole (nessuna scadenza,
  oppure cancellazione automatica dell'account dopo un numero di giorni definito)
- Se un profilo minore può avere più di un genitore/tutore collegato all'account
- Se, in futuro, sia richiesta una verifica più solida dell'identità del genitore rispetto alla
  sola conferma via email (vedi rischio sopra)
