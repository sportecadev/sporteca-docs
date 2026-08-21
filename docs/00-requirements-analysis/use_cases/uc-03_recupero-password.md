# UC-03 - Recupero password

Stato: confermato (con assunzioni aperte segnalate in fondo al documento)
Ultimo aggiornamento: 2026-08-05
Documenti correlati: uc-01_registrazione-utente.md, uc-02_login-utente.md

## Obiettivo

Permettere a un utente registrato con credenziali classiche di reimpostare la propria password
in caso di smarrimento, tramite verifica dell'identità basata su domanda di sicurezza e conferma
via email.

## Attori

- Utente registrato (con almeno un metodo di autenticazione classico)
- Genitore/tutore (solo fascia under 14, come destinatario di notifica informativa)
- Sistema (piattaforma Sporteca)

## Precondizioni

- L'utente possiede un account con almeno un metodo di autenticazione classico (email/username +
  password). Un account creato esclusivamente tramite provider social non ha una password locale
  da recuperare (vedi eccezione E1)

## Trigger

L'utente seleziona "Password dimenticata" dalla pagina di login.

---

## Flusso principale

1. L'utente inserisce l'indirizzo email o lo username usato in fase di registrazione
2. Il sistema verifica che l'account esista e disponga di un metodo di autenticazione classico
3. Il sistema mostra la domanda di sicurezza impostata dall'utente in fase di registrazione
4. L'utente inserisce la risposta alla domanda di sicurezza
5. Il sistema verifica la corrispondenza della risposta
6. Se la risposta è corretta, il sistema genera un token di reset e invia un'email contenente il
   link di accesso al form di reimpostazione password, all'indirizzo registrato
7. L'utente clicca sul link ricevuto e accede al form di reset
8. L'utente inserisce la nuova password, soggetta agli stessi vincoli di complessità applicati in
   registrazione (min 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero, 1 carattere speciale)
9. Il sistema aggiorna la password e invalida il token di reset utilizzato
10. Il sistema invia un'email di riepilogo che conferma l'avvenuto cambio password, all'indirizzo
    registrato
11. Se l'account appartiene alla fascia under 14, il sistema invia inoltre una notifica informativa
    all'indirizzo email del genitore/tutore registrato, segnalando che la password del minore è
    stata modificata

---

## Flussi alternativi

**A1 - Reinvio email di reset**
Se l'utente non riceve l'email al punto 6, è disponibile una funzione di reinvio, analoga a quella
prevista per l'attivazione account (UC-01).

---

## Eccezioni

**E1 - Account privo di password locale (solo provider social)**
Se l'email/username corrisponde a un account creato esclusivamente tramite provider social, il
sistema non avvia il flusso di reset: mostra un messaggio esplicito che indica con quale provider
è stato registrato l'account e invita l'utente ad accedere tramite quel metodo. Questo è coerente
con quanto già definito nella sezione "Impatto sul recupero password" di UC-01.

**E2 - Email o username non trovato**
Il sistema mostra un messaggio generico, senza confermare o negare esplicitamente l'esistenza
dell'account, per coerenza con il principio anti-enumeration già adottato in UC-02 (E1).

**E3 - Risposta alla domanda di sicurezza errata**
Il sistema mostra un messaggio di errore e consente un nuovo tentativo. Un eventuale limite al
numero di tentativi è rimandato al documento di sicurezza dedicato (vedi UC-02, sezione "Fuori
perimetro").

**E4 - Token di reset scaduto o già utilizzato**
Il sistema mostra un messaggio esplicito e invita l'utente a ripetere la procedura dall'inizio.

---

## Postcondizioni

- Password dell'account aggiornata
- Utente in grado di accedere con le nuove credenziali
- Se fascia under 14: genitore/tutore informato via email dell'avvenuto cambio password

## Regole di business coinvolte

- Il recupero password si applica esclusivamente ad account con almeno un metodo di
  autenticazione classico
- La verifica della domanda di sicurezza è un passaggio obbligatorio prima dell'invio del link di
  reset, in aggiunta al possesso dell'indirizzo email
- Per gli account under 14, il genitore/tutore riceve sempre una notifica informativa quando la
  password del minore viene modificata

## Dati utilizzati

Email o username, risposta alla domanda di sicurezza (hash), nuova password (hash), token di
reset, email del genitore/tutore (solo fascia under 14, per la notifica).

## Entità coinvolte

- User
- PasswordResetToken (nuova entità)

---

## Assunzioni ancora da validare (non decise, segnalate esplicitamente)

- Tempo di scadenza del token di reset (analogo al tema già aperto per i token di attivazione e
  consenso genitore in UC-01)
- Se la notifica al genitore/tutore per la fascia under 14 è puramente informativa oppure richiede
  un'azione di conferma da parte del genitore prima che il cambio password sia effettivo
- Limite di tentativi sulla risposta alla domanda di sicurezza, e relativa policy di blocco
  temporaneo (rimandato al documento di sicurezza dedicato)