# 07 - Integrazioni Esterne: Pagamenti, Fatturazione e Comunicazioni 💳🧾✉️

Questo documento definisce l'architettura dei flussi di integrazione di **Sporteca** con i fornitori di servizi SaaS esterni. L'obiettivo è sollevare il singolo sviluppatore dalla gestione di processi complessi e delicati (come la sicurezza dei pagamenti, la burocrazia fiscale e la recapitabilità delle email) tramite flussi asincroni e disaccoppiati.

---

## 💳 1. Gestione dei Pagamenti (Stripe & PayPal)

Per monetizzare i servizi di scouting per le Company e gli eventuali abbonamenti premium per gli atleti, Sporteca si integrerà con **Stripe** e **PayPal**.

### Il Flusso di Pagamento Asincrono (PCI-Compliant)

```
[ Client / Web ]                      [ Jmix Backend ]                    [ Stripe / PayPal API ]
       |                                     |                                       |
       | 1. Clicca "Acquista Scouting" ------> |                                       |
       |                                     | 2. Richiede sessione di checkout ----> |
       |                                     |<-3. Ritorna Session ID & URL ----------|
       |<--- 4. Ritorna URL temporanea -------|                                       |
       |                                                                             |
       | 5. Reindirizza l'utente sulla pagina di checkout sicura ------------------> |
       |                                                                             |
       |===================== L'UTENTE COMPLETA IL PAGAMENTO =======================|
       |                                                                             |
       |<-6. Ritorna al sito (Success Page) - - - - - - - - - - - - - - - - - - - - -| (Transazione in sospeso)
       |                                                                             |
       |                                     | <== 7. POST Webhook (Payment Success) =| (Segnale Sicuro Asincrono)
       |                                     |                                       |
       |                                     | 8. Valida firma Webhook               |
       |                                     | 9. Attiva abbonamento/scouting        |
       |                                     | 10. Genera evento "InvoiceRequested"  |
```

### Dettagli Tecnici di Sicurezza:
1. **Validazione della Firma (Signature Validation):** Il backend Jmix convalida crittograficamente la firma dell'header (`Stripe-Signature`) inviata dal webhook tramite una chiave segreta di firma per garantire che la richiesta provenga realmente da Stripe/PayPal e non da un utente malintenzionato che simula un pagamento avvenuto.
2. **Idempotenza:** Ogni evento di webhook ha un ID transazione univoco. Il backend Jmix verifica che l'ID non sia già stato elaborato prima di sbloccare i servizi per prevenire attacchi di tipo *Double Spending* o bug di duplicazione.

---

## 🧾 2. Fatturazione Automatica Esternalizzata (Billing API)

La contabilità, l'applicazione delle tasse (es. IVA italiana, regime forfettario o VAT europea) e la fatturazione elettronica sono completamente delegate a servizi esterni.

* **Fornitore Consigliato (Italia):** **FattureInCloud** o **Aruba API**.
* **Fornitore Consigliato (Estero/Globale):** **Stripe Invoicing** o **Quaderno** / **Paddle**.

### Flusso Asincrono di Generazione Fattura:
1. Al completamento del pagamento, il modulo dei pagamenti nel backend lancia un evento Spring: `PaymentCompletedEvent`.
2. Un ascoltatore asincrono (`@EventListener` con annotazione `@Async`) cattura l'evento in background per non bloccare il thread principale.
3. Il worker esegue una chiamata API HTTPS verso il sistema di fatturazione (es. FattureInCloud), inviando:
   * I dati di fatturazione della Company (P.IVA, Codice Destinatario/SDI per l'Italia).
   * L'importo e la descrizione del servizio acquistato.
4. Il SaaS di fatturazione genera la fattura elettronica, la invia all'Agenzia delle Entrate (SDI) e restituisce una copia PDF.
5. Il backend Jmix riceve il link del PDF e lo salva nello **schema sensibile** della Company, rendendolo consultabile nel suo portale web sotto la voce "Fatture e Ricevute".

---

## ✉️ 3. Email Transazionali (SendGrid / Postmark)

GCP impedisce l'invio SMTP diretto sulla porta 25/465/587 per prevenire lo spam. Integreremo **SendGrid** o **Postmark** tramite le loro API REST native.

### Pattern: Dynamic Template (Template Dinamici)
Per consentire modifiche al layout o al testo delle email (es. conferma registrazione, notifica di claim, ricevuta di pagamento) senza dover ricompilare o riavviare il backend:
* I template HTML delle email vengono creati e gestiti direttamente sulla console web di SendGrid tramite il loro editor drag-and-drop.
* Ciascun template possiede un ID univoco (es. `d-1234567890abcdef`).
* Il codice Java in Jmix chiama le API SendGrid inviando solo l'ID del template e un payload JSON con i dati dinamici:

```java
// Esempio logico di chiamata API SendGrid dal backend
Map<String, Object> templateData = new HashMap<>();
templateData.put("atleta_nome", "Marco Rossi");
templateData.put("link_conferma", "https://sporteca.it/confirm?token=xyz");

SendGridEmailRequest request = new SendGridEmailRequest(
    "atleta@email.it", 
    "d-1234567890abcdef", // ID del template su SendGrid
    templateData
);
emailService.sendAsync(request);
```

---

## 📱 4. Notifiche Push (Firebase Cloud Messaging - FCM)

Sebbene le notifiche push facciano parte di una fase successiva all'MVP, l'architettura è già predisposta per accoglierle:
* **FCM (Firebase Cloud Messaging):** È la tecnologia standard, gratuita e ufficiale supportata nativamente da Flutter per inviare notifiche push sia su dispositivi iOS (tramite APNs di Apple collegato a Firebase) sia su dispositivi Android.
* **Archiviazione Token:** Quando un Atleta esegue il login sull'app Flutter, l'app richiede un "FCM Registration Token" al dispositivo e lo invia al backend Jmix. Il backend lo memorizza associato all'UUID dell'utente nella tabella `user_devices`.
* **Invio:** Quando si verifica un evento (es. un claim confermato o un messaggio), un worker in background legge i token del dispositivo associati a quell'utente e invia la notifica push tramite le API REST di Firebase.
