# UC-07 - Validazione back-office del profilo

Stato: confermato (con assunzioni aperte segnalate in fondo al documento)
Ultimo aggiornamento: 2026-08-05
Documenti correlati: uc-02_login-utente.md, uc-04_profilazione-societa.md,
uc-05_profilazione-atleta.md, uc-06_profilazione-staff.md

## Obiettivo

Permettere a un operatore back-office di esaminare i profili utente (Società, Atleta, Membro
staff) che hanno completato la profilazione, approvandoli o rifiutandoli, in modo che solo i
profili conformi diventino visibili e ricercabili sulla piattaforma.

## Attori

- Operatore back-office
- Sistema (piattaforma Sporteca)
- Utente (destinatario indiretto: riceve l'esito della validazione)

## Precondizioni

- Esiste almeno un profilo (Società, Atleta o Staff) nello stato "profilazione completata, in
  attesa di validazione back-office" (raggiunto tramite UC-04, UC-05 o UC-06)

## Trigger

Un profilo entra nella coda di validazione al completamento della profilazione, oppure vi rientra
dopo che l'utente ha corretto e reinviato un profilo precedentemente rifiutato.

---

## Flusso principale

1. L'operatore back-office accede alla coda dei profili in attesa di validazione
2. L'operatore seleziona un profilo ed esamina in un unico passaggio sia i dati anagrafici sia i
   documenti caricati dall'utente
3. L'operatore verifica la coerenza tra i dati anagrafici inseriti e i documenti caricati (es.
   corrispondenza nome/cognome con il documento di identità), e la validità/leggibilità dei
   documenti stessi
4. L'operatore registra l'esito della validazione: Approvato oppure Rifiutato
5. Se **Approvato**: il sistema aggiorna lo stato del profilo a "validato"; il profilo diventa
   ricercabile nel motore di ricerca (subordinatamente al flag di visibilità impostato
   dall'utente in fase di profilazione) e l'account ottiene accesso completo alle funzionalità
   della piattaforma (vedi UC-02)
6. Se **Rifiutato**: l'operatore è tenuto a inserire una motivazione obbligatoria; il sistema
   notifica l'utente (email) comunicando il rifiuto e la motivazione indicata; il profilo resta
   (o ritorna) nello stato "in attesa di validazione" dal punto di vista dell'accesso (vedi nota
   di raccordo con UC-02 sotto)

---

## Nota di raccordo con UC-02 - stati "in attesa di validazione" vs "sospeso"

Questo documento introduce una precisazione rispetto a UC-02, necessaria per evitare
un'incoerenza: un rifiuto in fase di prima validazione (caso ordinario, correggibile dall'utente)
non deve comportare lo stato "sospeso" definito in UC-02 (che nega il login e richiede
assistenza). Un rifiuto in questa fase riporta semplicemente il profilo allo stato "in attesa di
validazione": l'utente mantiene l'accesso (limitato) e può correggere/reinviare autonomamente,
senza limite di tentativi.

Lo stato "sospeso" resta riservato a un intervento del back-office **successivo** a una
validazione già positiva (es. viene rilevata successivamente una non conformità grave, o dati
palesemente falsi) e non è coperto nel dettaglio da questo documento: il caso d'uso specifico
per la sospensione post-validazione è da definire separatamente (vedi assunzioni aperte).

---

## Flussi alternativi

**A1 - Riesame dopo correzione**
Quando un profilo rifiutato viene corretto e reinviato dall'utente, rientra nella coda di
validazione e segue lo stesso flusso principale, senza distinzioni rispetto a un primo esame.

---

## Eccezioni

**E1 - Documento illeggibile, scaduto o mancante**
Trattato come rifiuto standard: l'operatore indica la motivazione corrispondente.

**E2 - Dati anagrafici incoerenti con i documenti caricati**
Trattato come rifiuto standard: l'operatore indica la motivazione corrispondente.

---

## Postcondizioni

- Se approvato: profilo in stato "validato", account con accesso completo, profilo ricercabile
  se il flag di visibilità è attivo
- Se rifiutato: profilo in stato "in attesa di validazione", utente notificato con la motivazione,
  account con funzionalità limitate fino a nuova validazione positiva

## Regole di business coinvolte

- Un profilo rifiutato può essere corretto e reinviato dall'utente senza limite di tentativi
- Ogni rifiuto richiede una motivazione obbligatoria, sempre comunicata all'utente
- Un profilo non diventa visibile nel motore di ricerca né può iniziare a sbloccare altri profili
  finché non risulta validato positivamente
- La validazione avviene in un unico passaggio (anagrafica e documenti esaminati insieme), non a
  step separati

## Dati utilizzati

Dati anagrafici e sportivi del profilo (ereditati da UC-04/05/06), documenti caricati, esito
della validazione, motivazione del rifiuto (se applicabile), identificativo dell'operatore che ha
esaminato il profilo, data e ora dell'esame.

## Entità coinvolte

- User
- CompanyProfile / AthleteProfile / StaffProfile (a seconda della tipologia)
- Media (documenti esaminati)
- ValidationRecord (nuova entità: rappresenta un singolo esame di validazione, con esito,
  motivazione, operatore e data; consente di mantenere uno storico se un profilo viene esaminato
  più volte a seguito di rifiuti e correzioni)

---

## Assunzioni ancora da validare (non decise, segnalate esplicitamente)

- Se serve mantenere uno storico completo di tutte le validazioni effettuate su un profilo (audit
  trail) o sia sufficiente conservare solo l'esito più recente
- Se esiste un tempo massimo (SLA) entro cui il back-office deve esaminare un profilo in coda
- Se un operatore può assegnarsi/prenotare un profilo dalla coda per evitare che più operatori
  lo esaminino contemporaneamente, o se la coda è a libero accesso
- Se esistono ruoli/permessi differenziati tra operatori back-office (es. operatore junior vs
  supervisore con potere di sospensione)
- Il caso d'uso dedicato alla sospensione di un profilo già validato (distinto dal rifiuto in
  prima validazione, vedi nota di raccordo sopra) non è coperto da questo documento e resta da
  definire