# UC-02 - Login utente

Stato: confermato (con assunzioni aperte segnalate in fondo al documento)
Ultimo aggiornamento: 2026-08-05
Documenti correlati: uc-01_registrazione-utente.md, 01-decisioni-perimetro-mvp.md

## Obiettivo

Permettere a un utente registrato di accedere alla piattaforma, tramite credenziali classiche
(email/username + password) oppure tramite un provider social già collegato al proprio account,
applicando le restrizioni di accesso corrette in base allo stato corrente dell'account.

## Attori

- Utente registrato
- Provider di identità esterno: Google, Facebook, Apple, Instagram (solo flusso social)
- Sistema (piattaforma Sporteca)

## Precondizioni

- L'utente possiede un account (creato tramite UC-01, con almeno un metodo di autenticazione
  associato: classico e/o uno o più provider social)

## Trigger

L'utente accede alla pagina di login e sceglie il metodo: credenziali classiche o provider social.

---

## Stati dell'account rilevanti per il login

Questo caso d'uso non definisce come questi stati vengono raggiunti (sono definiti in UC-01 e nei
futuri UC di profilazione/validazione back-office), ma definisce come il login si comporta per
ciascuno di essi.

| Stato account | Origine | Comportamento al login |
| --- | --- | --- |
| Non attivo - attivazione email pendente | UC-01, tutte le fasce d'età | Login negato |
| Non attivo - consenso genitore pendente | UC-01, fascia under 14 | Login negato |
| Attivo - in attesa di validazione anagrafica | Profilazione incompleta, oppure completa ma non ancora esaminata/validata dal back-office | Login consentito, funzionalità limitate |
| Attivo - sospeso | Back-office ha esaminato l'anagrafica e l'ha giudicata non conforme | Login negato |
| Attivo - validato | Back-office ha validato positivamente l'anagrafica | Login consentito, accesso completo |

Nota: la distinzione tra "in attesa di validazione" e "sospeso" è intenzionale — il primo è uno
stato transitorio normale in cui l'utente può ancora agire autonomamente (completare o correggere
il proprio profilo), il secondo richiede una risoluzione manuale con il supporto, perché deriva da
un esame già concluso con esito negativo.
Il dettaglio di quali funzionalità sono bloccate nello stato "in attesa di validazione" (es.
visibilità nel motore di ricerca, possibilità di sbloccare altri profili) sarà specificato nei
casi d'uso dedicati a Ricerca e Sblocco profilo, non in questo documento.

---

## Flusso principale A - Login classico

1. L'utente inserisce email o username, e password
2. Il sistema verifica la corrispondenza delle credenziali
3. Se le credenziali non sono corrette, si applica l'eccezione E1
4. Se le credenziali sono corrette, il sistema verifica lo stato dell'account (vedi tabella sopra)
5. In base allo stato, il sistema nega l'accesso (con messaggio dedicato) oppure crea una sessione
   utente e reindirizza alla home/dashboard, con il livello di accesso corrispondente allo stato

## Flusso principale B - Login via provider social

1. L'utente seleziona un provider tra Google, Facebook, Apple, Instagram
2. Il sistema avvia il flusso OAuth verso il provider selezionato
3. Il provider restituisce l'esito dell'autenticazione e l'identificativo esterno dell'utente
4. Il sistema verifica che l'identificativo esterno corrisponda a un metodo di autenticazione già
   collegato a un account esistente
   - Se non corrisponde a nessun account → si applica l'eccezione E3
5. Il sistema verifica lo stato dell'account (vedi tabella sopra) e procede come al punto 5 del
   flusso classico

---

## Flussi alternativi

**A1 - Utente tenta login classico su un account privo di password locale**
Se l'email/username inserito corrisponde a un account creato esclusivamente tramite provider
social (nessuna password locale impostata, come da UC-01), il sistema non deve trattare questo
caso come "password errata": mostra invece un messaggio esplicito che indica con quale provider
social è stato registrato l'account, invitando l'utente ad usare quel metodo.

**A2 - Reinvio comunicazioni di attivazione/consenso dal punto di ingresso login**
Se il login viene negato per attivazione email o consenso genitore pendente (vedi E2/E4 sotto),
il messaggio di errore include un link diretto per reinviare la comunicazione, senza dover tornare
al flusso di registrazione.

---

## Eccezioni

**E1 - Credenziali classiche non valide**
Il sistema mostra un messaggio generico ("credenziali non valide"), senza specificare se l'errore
riguarda l'email/username o la password. Questa è una raccomandazione di sicurezza standard per
evitare che un tentativo di login possa essere usato per scoprire quali email sono registrate in
piattaforma (user enumeration); la includo come proposta, da confermare esplicitamente.

**E2 - Account non attivo (email di attivazione non confermata)**
Login negato. Messaggio con link per reinviare l'email di attivazione (vedi A2).

**E3 - Provider social non collegato a nessun account esistente**
Il sistema informa l'utente che non esiste un account associato a quel profilo social e propone
la registrazione (rimando a UC-01, flusso B).

**E4 - Account non attivo (consenso genitore pendente, fascia under 14)**
Login negato. Messaggio con link per reinviare l'email di consenso al genitore/tutore (vedi A2).

**E5 - Account sospeso**
Login negato. Messaggio esplicito che comunica lo stato di sospensione e invita a contattare
l'assistenza. Il motivo esatto della sospensione viene mostrato solo se comunicabile (da definire
nel caso d'uso di validazione back-office).

**E6 - Provider social irraggiungibile o errore OAuth**
Il sistema mostra un errore e consente di riprovare o di scegliere un metodo alternativo.

---

## Postcondizioni

- Sessione utente creata, con livello di accesso corrispondente allo stato dell'account al momento
  del login (accesso limitato oppure completo)

## Regole di business coinvolte

- Il login non deve rivelare se un errore di autenticazione è dovuto a un'identità inesistente o a
  una password errata (proposta di sicurezza, da confermare)
- Un account privo di password locale (solo social) non può autenticarsi con il flusso classico
- Gli stati "non attivo" e "sospeso" negano sempre l'accesso; lo stato "in attesa di validazione"
  consente l'accesso con funzionalità limitate

## Dati utilizzati

Email o username, password hash (solo flusso classico), provider e identificativo esterno (solo
flusso social), stato account.

## Entità coinvolte

- User
- AuthMethod
- Session (nuova entità: rappresenta l'accesso attivo dell'utente; dettagli come durata e gestione
  "ricordami" non ancora definiti, vedi assunzioni aperte)

---

## Fuori perimetro di questo documento

Su richiesta esplicita, la policy anti-bruteforce (blocco account dopo N tentativi di login falliti,
throttling, captcha) è volutamente esclusa da questo caso d'uso e verrà trattata in un documento di
sicurezza dedicato.

## Assunzioni ancora da validare (non decise, segnalate esplicitamente)

- Durata della sessione utente e presenza/assenza di una funzione "ricordami"
- Se sono ammesse sessioni multiple simultanee sullo stesso account (più dispositivi)
- Se e come comunicare all'utente il motivo esatto della sospensione (dipende dal futuro UC di
  validazione back-office)
- Conferma esplicita sulla raccomandazione di sicurezza E1 (messaggio di errore generico)