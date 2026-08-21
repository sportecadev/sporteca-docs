# 02 - Strategia di business model e go-to-market

Stato: bozza per discussione (contiene raccomandazioni e alcune assunzioni da validare)
Ultimo aggiornamento: 2026-08-06
Documenti correlati: 01-decisioni-perimetro-mvp.md, uc-01...uc-08

## Executive summary

Sporteca è un marketplace bilaterale che mette in contatto società sportive con atleti e membri
dello staff tecnico, partendo dal calcio dilettantistico (calcio a 5 / calcio a 11). Il perimetro
MVP è già definito (vedi documenti UC-01/08). Questo documento propone: analisi del panorama
competitivo, modello di ricavo consigliato, strategia di lancio adatta a un contesto bootstrap con
team ridotto, e una roadmap con tempistiche indicative.

Condizioni di partenza dichiarate: finanziamento bootstrap, team di 1-3 persone part-time, lancio
iniziale su un'unica area geografica ristretta (provincia o comitato regionale), con relazioni
personali di base nel settore da sviluppare tramite contatti diretti.

---

## 1. Analisi competitiva

### 1.1 Competitor diretto: Profilo Sportivo

Esiste già un prodotto live, gratuito, con posizionamento molto simile a quello descritto nel
documento di analisi originale di Sporteca. Nato a Verona, digitalizza lo scouting nel calcio
dilettantistico italiano con queste caratteristiche:

- Profilo atleta con ruolo, piede dominante, altezza, peso, esperienze pregresse, categoria, video
- Ricerca per le società tramite geolocalizzazione e filtri tecnici
- Sistema di visibilità/classifica per i profili più attivi (aggiornata ogni due settimane)
- Community di "osservatori" (genitori, amici, spettatori) che votano i giocatori visti dal vivo
- Modalità anonima e possibilità di salvare/seguire profili di interesse
- Comunicazione di posizionamento basata sul fatto che oltre il 90% del movimento calcistico
  italiano è dilettantistico e poco digitalizzato

Sulla carta, quasi tutte le funzionalità escluse dal nostro MVP per complessità (Stonk,
valutazione tramite osservatori, ranking di visibilità) sono già offerte gratuitamente da questo
concorrente. Questo non cambia la correttezza della decisione di escluderle dall'MVP (restano
complesse e a basso valore per una prima release), ma imponeva di ripensare la differenziazione.

**Analisi approfondita: la posizione di Profilo Sportivo è più debole di quanto sembri dal
marketing.** Verificando i dati oggettivi pubblici (scheda Google Play, recensioni, scheda
sicurezza dati), emergono debolezze concrete e sfruttabili:

- **Trazione reale minima**: 100+ download totali e solo 6 recensioni su Google Play, a fronte di
  una comunicazione di posizionamento aggressiva. Non è un incumbent consolidato: è un first mover
  ancora fragile, con adozione reale bassissima.
- **Affidabilità tecnica in dubbio**: una recensione del 27 maggio 2026 segnala l'app come
  "attualmente non utilizzabile", senza indicazioni su tempi di ripristino. Coerente con il fatto
  che lo sviluppatore registrato sull'app è una singola persona fisica, non una software house
  strutturata — probabilmente un progetto sotto-risorsato quanto il nostro.
- **Sicurezza dei dati debole**: la scheda sicurezza dati dell'app dichiara esplicitamente che i
  dati non vengono criptati, e che l'app raccoglie/condivide con terze parti posizione,
  informazioni personali e altri dati inclusi salute/attività fisica e foto/video. Per una
  piattaforma che tratta anche dati di minorenni, è un problema di fiducia serio e verificabile
  pubblicamente da chiunque consulti la scheda dell'app.
- **Deriva verso prodotto social/gamificato, non strumento di reclutamento serio**: l'ultimo
  aggiornamento (11 luglio 2026) introduce un assistente AI per generare automaticamente la bio
  e un sistema di "Corone" che premia la partecipazione alla community con vantaggi e premi
  esclusivi, sopra una home a "reel" in stile social e una classifica bisettimanale di visibilità.
  Il prodotto si sta spostando verso l'intrattenimento/personal branding, non verso il matching
  di reclutamento verificato.
- **Tutela minori superficiale**: rating "12+, supervisione genitori consigliata" — un banner
  generico da store, senza evidenza di un flusso di consenso genitoriale strutturato e verificato
  come quello progettato in UC-01 di Sporteca.

Implicazione: competere sulla stessa proposta di valore (profilo + community + classifica) sarebbe
comunque una posizione debole, ma non perché il concorrente sia imbattibile — è invece un progetto
piccolo e con criticità reali su affidabilità e trattamento dati. Il varco competitivo è proprio lì.

### 1.2 Competitor adiacenti (non concorrenti diretti)

- **ScoutDecision, Catapult Scout, The Scouting App**: software B2B in abbonamento per scout,
  agenti e club professionistici/semi-professionistici. Centralizzano database giocatori, video,
  report, trattative. Target e prezzo molto più alti del nostro segmento dilettantistico; nessuna
  sovrapposizione diretta, ma confermano che esiste disponibilità a pagare per strumenti di
  scouting strutturati più in alto nella piramide del movimento calcistico.

### 1.3 App informative (potenziali canali, non concorrenti)

- **Tuttocampo, Golix, PlayLND** (quest'ultima app ufficiale FIGC/LND): risultati, classifiche,
  news sul calcio dilettantistico. Non competono sul matchmaking società-atleta, ma intercettano
  lo stesso pubblico e sono potenziali canali di visibilità/partnership futuri.

---

## 2. Posizionamento e differenziazione

Il posizionamento non deve essere "un'alternativa con qualche funzione in più", ma un messaggio
netto, costruito sulle debolezze concrete rilevate nel competitor diretto (vedi 1.1):

**Messaggio di posizionamento proposto: "Sporteca è lo strumento serio per essere davvero
assunti — non un social network per farsi notare."**

Tre argomenti concreti e verificabili a supporto, ciascuno speculare a una debolezza rilevata:

1. **Dati trattati con validazione documentale reale e consenso minori conforme alla normativa
   italiana**, contro un concorrente che dichiara pubblicamente dati non criptati e condivisi con
   terze parti, e una tutela minori ridotta a un banner generico da store. Questo è un argomento
   di vendita diretto verso famiglie e società giovanili, il segmento probabilmente a maggior
   valore di scouting.
2. **Nessuna gamification o classifica di vanità**: la ricerca resta basata su criteri oggettivi
   (sport, categoria, ruolo, età, distanza), non su chi posta più contenuti, accumula punti o
   scala una classifica bisettimanale. Il concorrente si sta spostando esplicitamente verso un
   prodotto di intrattenimento/personal branding (assistente AI per bio, sistema "Corone", home a
   reel) — noi restiamo un canale di reclutamento, non un social network.
3. **Copertura multi-ruolo**: non solo atleti, ma anche membri dello staff tecnico (allenatori,
   preparatori, match analyst) come profili "candidabili" alla pari, ampliando il mercato oltre
   il solo giocatore.

Leve secondarie, meno immediate da comunicare ma comunque rilevanti nel tempo:

4. **Modello multi-sport nativo**: l'architettura dati configurabile (Sport/Categoria/Ruolo)
   permette un'espansione a basket, pallavolo, rugby senza riprogettazione.
5. **Affidabilità operativa**: il concorrente ha segnalazioni pubbliche di malfunzionamento e
   downtime non comunicato; su un prodotto piccolo come il nostro, mantenere l'app sempre
   funzionante è già di per sé un vantaggio competitivo comunicabile nel tempo (recensioni,
   passaparola locale).

Nota: il competitor diretto non è un incumbent consolidato da temere, ma un progetto altrettanto
piccolo (100+ download, sviluppatore singolo) con criticità reali. Questo abbassa la barriera
competitiva rispetto a quanto stimato inizialmente, ma non elimina il rischio che consolidi la
propria posizione prima di noi in una determinata area — da qui l'importanza di muoversi in modo
mirato e rapido sull'area pilota (vedi sezione 4).

---

## 3. Modello di business proposto

Coerentemente con la scelta di mantenere l'MVP privo di logiche di pagamento (sblocco profili
gratuito e illimitato), il modello di ricavo va introdotto in una fase successiva, quando la
piattaforma avrà dimostrato liquidità reale (ricerche che restituiscono risultati utili) nell'area
pilota. Ordine di introduzione consigliato:

**Fase 2 - Ricavo primario: abbonamento B2B per le società**
Un canone stagionale o annuale per società, che dà accesso illimitato a ricerca e sblocco profili.
Preferibile a un sistema a crediti/pay-per-unlock per due motivi: è molto più semplice da
implementare con risorse di sviluppo limitate (un solo piano, non un sistema di conteggio crediti
con casi limite), ed è più facile da vendere a un'organizzazione con un budget dedicato allo
scouting che a un utente singolo abituato a pagamenti spot.

**Fase 3 - Ricavo secondario: funzionalità premium per atleti/staff**
Da valutare con attenzione per non replicare 1:1 il ranking di visibilità già offerto gratis dal
concorrente diretto. Un'alternativa più coerente con il nostro posizionamento potrebbe essere un
badge "verificato" legato alla validazione back-office, o funzionalità di analisi (es. quante
società hanno visualizzato il profilo).

**Fase 3 - Ricavo accessorio: sponsorizzazioni locali**
Partnership con negozi di articoli sportivi, palestre o attività locali nell'area pilota. Basso
sforzo di prodotto, utile anche per costruire relazioni sul territorio in parallelo al lancio.

**Fase 4+ - Ricavi più avanzati (solo dopo scala multi-regionale)**
Prodotti di analisi/dati aggregati per leghe o comitati regionali, eventuale riattivazione in
forma semplificata del servizio di osservazione/scouting oggi escluso dall'MVP.

---

## 4. Strategia go-to-market: superare il cold start

Sporteca è un marketplace bilaterale: serve densità di offerta (atleti/staff) e domanda (società)
nello stesso luogo perché la ricerca produca risultati utili. Con budget bootstrap e team di 1-3
persone, un lancio nazionale diluirebbe le risorse a un punto tale da non generare mai densità
sufficiente da nessuna parte, con alto rischio che i primi utenti trovino risultati di ricerca
vuoti e abbandonino la piattaforma in modo permanente.

**Approccio consigliato: lancio su una singola provincia/comitato**

1. **Selezione dell'area pilota**: scegliere una provincia dove esistono già contatti, anche
   basici, da attivare tramite chiamate dirette e conoscenze comuni (come indicato). Criteri utili
   per la scelta, oltre alla disponibilità di contatti: numero di società dilettantistiche attive
   nella zona (né troppo poche né un bacino enorme impossibile da presidiare con un team ridotto),
   assenza di forte presidio già consolidato del concorrente diretto nella stessa area, se
   verificabile.
2. **Onboarding manuale del primo nucleo (fase pre-lancio pubblico)**: prima di aprire la
   piattaforma al pubblico, reclutare direttamente (telefonate, conoscenze) un primo gruppo di
   società e atleti/staff, aiutandoli personalmente a completare la profilazione. Con un back-office
   di validazione ancora gestito manualmente da 1-3 persone, questo è sostenibile solo su piccola
   scala, il che è un ulteriore motivo per restare inizialmente su un'area ristretta.
3. **Presenza sul territorio**: partecipazione a tornei dilettantistici locali, contatti con
   comitati provinciali, eventuale collaborazione con blog/pagine social locali di settore (sul
   modello di quanto fatto dal concorrente diretto con testate come pianeta-calcio.it).
4. **Crescita organica tramite condivisione del profilo**: anche senza costruire in MVP un sistema
   di inviti formale (rimandato a Fase 2 per decisione già presa), nulla impedisce che un atleta
   condivida il link del proprio profilo pubblico sui social: è un canale di crescita a costo zero
   che vale la pena incoraggiare fin da subito lato comunicazione, anche senza feature dedicata.
5. **Espansione solo dopo validazione**: passare a una provincia adiacente solo dopo aver
   raggiunto una soglia di densità/attività nell'area pilota (vedi metriche al punto 6), replicando
   lo stesso playbook.

---

## 5. Roadmap e tempistiche indicative

Le stime assumono un team part-time di 1-3 persone e sviluppo bootstrap; sono indicative, non
impegnative, e vanno riviste in base alla disponibilità reale del team.

| Fase | Periodo indicativo | Contenuto |
| --- | --- | --- |
| 0 - Preparazione | Mese 1 | Definizione legale (termini di servizio, privacy policy, gestione minori — consigliata una consulenza legale dedicata data la sensibilità del tema), scelta dell'area pilota, primi contatti telefonici |
| 1 - Costruzione MVP | Mese 1-5 | Sviluppo di UC-01/08 (registrazione, login, recupero password, tre profilazioni, validazione back-office anche in forma semplice/manuale, ricerca) |
| 2 - Pilota chiuso | Mese 5-6 | Onboarding manuale del primo nucleo di società e atleti/staff nell'area scelta, raccolta feedback, correzioni critiche |
| 3 - Lancio pubblico locale | Mese 6-9 | Apertura pubblica nell'area pilota, presenza su tornei/eventi locali, prime partnership territoriali |
| 4 - Validazione e monetizzazione | Mese 9-14 | Se le metriche di densità sono soddisfacenti, introduzione dell'abbonamento B2B per le società (UC-09), inizio espansione a 1-2 province adiacenti |
| 5 - Scala regionale | Anno 2 | Replica del playbook su più province, valutazione di un secondo sport (basket o pallavolo) sfruttando il modello multi-sport già predisposto |
| 6 - Scala nazionale / valutazione funding | Anno 2-3 | Copertura multi-regionale, valutazione di un round di investimento con dati di trazione reali, prodotti di analisi/dati per leghe e comitati |

---

## 6. Metriche chiave da monitorare

- Numero di profili atleta/staff attivi e validati nell'area pilota
- Numero di società attive e validate nell'area pilota
- Percentuale di ricerche che restituiscono almeno un risultato utile (indicatore diretto di
  densità/liquidità del marketplace)
- Tasso di completamento profilazione (utenti che iniziano vs completano)
- Tasso di validazione positiva al primo esame back-office (qualità dei dati inseriti)
- Ricerche effettuate per settimana
- Retention mese su mese di società e atleti/staff attivi
- (Fase 4+) Tasso di conversione all'abbonamento B2B

---

## 7. Rischi

- **Cold start anche locale**: se l'area pilota scelta ha densità insufficiente di società o
  atleti disposti a registrarsi, il problema del marketplace vuoto si ripresenta anche su scala
  ridotta
- **Espansione del concorrente diretto**: Profilo Sportivo è già live a livello nazionale e
  potrebbe consolidarsi anche nell'area scelta come pilota prima che Sporteca raggiunga massa
  critica
- **Compliance minori**: già segnalato più volte nei documenti dei casi d'uso; un errore su questo
  fronte ha conseguenze legali reali, non solo di prodotto — consigliata verifica legale prima del
  lancio pubblico
- **Back-office manuale non scala**: la validazione gestita direttamente dal team è sostenibile
  solo fino a un certo volume di profili; va previsto un punto nella roadmap in cui investire in
  strumenti o risorse dedicate
- **Bus factor**: con un team di 1-3 persone, la dipendenza da singole persone per sviluppo,
  validazione e relazioni territoriali è un rischio operativo da tenere presente

---

## Assunzioni e domande aperte

- Provincia/comitato specifico di lancio: da decidere insieme quando il team è pronto ad avviare
  i contatti
- Se lanciare inizialmente solo su calcio a 5, solo calcio a 11, o entrambi nell'area pilota
- Tempistiche di sviluppo effettive, dipendenti dalla reale disponibilità part-time del team
- Se prevedere un budget minimo, anche ridotto, per consulenza legale sulla gestione dei minori
  prima del lancio pubblico (fortemente consigliato, non è stata presa una decisione esplicita)

## Fonti consultate

- https://www.profilosportivo.it/
- https://play.google.com/store/apps/details?id=com.sportprofile.profilosportivo&hl=it (scheda
  app, recensioni, scheda sicurezza dati, note di rilascio versione 11 luglio 2026)
- https://www.pianeta-calcio.it/news/ultimora/profilo-sportivo-lapp-gratuita-che-digitalizza-il-calcio-dilettantistico-scouting-piu-rapido-talenti-piu-visibili/
- https://www.scoutdecision.com/it/
- https://www.catapult.com/it/solutions/scouts