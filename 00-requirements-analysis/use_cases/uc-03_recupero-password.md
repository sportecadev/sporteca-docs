# UC-03 - Recupero Password Moderno (stateless OTP / Magic Link)

Stato: confermato
Ultimo aggiornamento: 2026-08-21
Documenti correlati: uc-01_registrazione-utente.md, uc-02_login-utente.md

## Obiettivo

Consentire a un utente registrato con credenziali classiche di reimpostare la propria password in caso di smarrimento o dimenticanza, adottando flussi moderni ad alta sicurezza (One-Time Passcode - OTP temporanei via Email/SMS o Magic Link), eliminando completamente le vecchie procedure vulnerabili o scomode (come le domande di sicurezza e l'invio di password temporanee in chiaro).

---

## Attori

- Utente registrato (con credenziali classiche)
- Genitore/tutore (solo per fascia under 14, come ricevente di notifica obbligatoria)
- Sistema (piattaforma Sporteca)

## Precondizioni

- L'utente possiede un account con credenziali classiche (email/password). Gli account registrati solo tramite social o enterprise non dispongono di una password locale e non usano questo flusso (vedi eccezione **E1**).

## Trigger

L'utente seleziona il link "Password dimenticata" nella schermata di login.

---

## Flusso principale A - Recupero tramite codice OTP (One-Time Passcode)

1. L'utente inserisce l'indirizzo email (o username) del proprio account.
2. Il sistema convalida la richiesta applicando il principio di **Anti-Enumeration** (vedi eccezione **E2**).
3. Il sistema genera un codice **OTP (One-Time Passcode)** numerico a 6 cifre, crittograficamente sicuro (generato tramite `SecureRandom`).
4. Il sistema salva l'hash dell'OTP nel database con una scadenza rigorosa di **10 minuti** e lo associa all'ID dell'account, incrementando un contatore di tentativi per prevenire attacchi brute-force.
5. Il sistema invia il codice OTP:
    *   Via **Email** (all'indirizzo registrato).
    *   Via **SMS** (se l'utente ha inserito e verificato un numero di telefono nel proprio profilo).
6. L'applicazione mostra all'utente una schermata di inserimento con un timer di validità di 10 minuti.
7. L'utente inserisce il codice OTP a 6 cifre ricevuto sul proprio dispositivo.
8. Il sistema convalida il codice:
    *   Se l'OTP coincide ed è attivo → sblocca la schermata per l'immissione della nuova password.
    *   Se l'OTP è scaduto o errato → mostra un messaggio d'errore (massimo 3 tentativi, poi il codice viene invalidato).
9. L'utente compila la nuova password (che deve soddisfare i requisiti di complessità standard: min 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero, 1 carattere speciale).
10. Il sistema invalida l'OTP utilizzato, sovrascrive l'hash della password con il nuovo valore crittografato e invia un'email di notifica di avvenuto cambio password a tutela della sicurezza dell'account.
11. Se l'utente appartiene alla fascia **Under 14**, il sistema invia la notifica informativa anche all'email del genitore/tutore registrato.

---

## Flusso principale B - Recupero rapido tramite Magic Link

1. L'utente inserisce la propria email nella sezione "Password dimenticata" e seleziona "Inviami un link di accesso rapido".
2. Il sistema genera un token JWT firmato, con validità limitata a **15 minuti**, contenente l'UUID dell'utente ed un'operazione specifica (`action: reset_password`).
3. Il sistema invia all'utente un'email contenente un link speciale (Magic Link) strutturato in questo modo:
   `https://app.sporteca.it/reset-password?token=<token_jwt_sicuro>`
4. L'utente clicca sul link dal proprio client/dispositivo.
5. L'applicazione intercetta il token nell'indirizzo web e lo invia al backend per la convalida stateless della firma.
6. Se il token è valido e non scaduto, il backend autorizza temporaneamente la sessione del client esclusivamente per la schermata di impostazione della nuova password.
7. L'utente inserisce e conferma la nuova password.
8. Il backend salva la nuova password, invalida il token e invia le email di notifica di conferma all'utente (e al genitore se minore under 14).

---

## Eccezioni e Sicurezza Avanzata

### E1 - Account registrato solo via Social / Enterprise SSO
Se l'email inserita corrisponde a un account registrato unicamente via Google, Apple o Microsoft Entra (quindi sprovvisto di password locale), il sistema interrompe il flusso e informa l'utente in modo chiaro: *"Questo account accede tramite [Provider]. Non è necessaria alcuna password locale. Effettua il login cliccando sull'icona corrispondente."*

### E2 - Email inesistente (Anti-Enumeration)
Per impedire a malintenzionati di verificare se un'email è iscritta a Sporteca, il sistema mostra sempre la schermata di conferma invio: *"Se l'indirizzo inserito è registrato, riceverai un codice OTP per reimpostare la password"*. Nessun errore viene mostrato a schermo se l'email non esiste nel database.

### E3 - OTP Errato o Brute-Force
Se l'utente sbaglia ad inserire l'OTP per **3 volte di seguito**, il sistema invalida immediatamente il codice a database per sicurezza. L'utente dovrà richiedere la generazione di un nuovo codice OTP.

---

## Postcondizioni

*   Password dell'account aggiornata nel database.
*   Token OTP o Magic Link invalidati permanentemente.
*   Email di notifica di avvenuta modifica inviate all'utente (e al genitore/tutore per gli Under 14) per prevenire account takeover non autorizzati.
