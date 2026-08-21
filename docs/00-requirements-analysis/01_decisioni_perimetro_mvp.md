# 01 - Decisioni di perimetro MVP

Stato: confermato
Ultimo aggiornamento: 2026-08-05
Progetto: Sporteca.it / Bravo.com (componente profili utente)

## Scopo del documento

Questo documento registra le decisioni di perimetro (scope) prese in fase di analisi dei requisiti,
prima della definizione dettagliata dei singoli casi d'uso e del modello dati.
Ogni decisione riportata è stata validata esplicitamente con il team di prodotto.
Nessuna informazione in questo documento è stata assunta senza conferma.

Questo file è pensato per essere leggibile sia da un umano che da un agente AI che lavori
sull'implementazione: ogni decisione è tracciabile e motivata, senza ambiguità di interpretazione.

## 1. Obiettivo minimo del prodotto (MVP)

Il requisito minimo del progetto è:

- Mettere in contatto professionisti/aziende dello sport con atleti e membri dello staff tecnico
- Gestire correttamente i casi particolari legati ai minorenni
- Predisporre il modello dati per essere multi-sport, pur partendo con un solo sport attivo

Target di lancio: calcio a 5 e/o calcio a 11.

## 2. Funzionalità escluse dall'MVP

Le seguenti funzionalità, descritte nel documento di analisi originale, sono escluse dalla prima
release e trattate come backlog futuro (Fase 2 in avanti):

| Funzionalità | Descrizione breve | Motivo esclusione |
| --- | --- | --- |
| Stonk | Evidenza a pagamento del profilo atleta nei risultati di ricerca | Non essenziale al requisito minimo |
| Ricerca casuale | Scheda di scoperta casuale di video/immagini profili nelle vicinanze | Non essenziale al requisito minimo |
| Badge / gamification | Componenti grafici (medaglie, cornici, livelli) sui profili | Non essenziale al requisito minimo |
| Valutazione skills a stelle | Votazione delle competenze atleta da parte di utenze collegate | Non essenziale al requisito minimo |
| Servizio di osservazione (scouting a pagamento) | Servizio a pagamento con osservatori esterni per popolare il profilo tecnico | Non essenziale al requisito minimo, dipendenze esterne (rete di osservatori) non definite |

Nota: il sistema di crediti/slot gratuiti (20 schede profilo, 5 video, +1 slot per invito) descritto nel
documento originale non è stato ancora classificato come incluso o escluso dall'MVP. Da definire in
una decisione successiva, quando si affronterà il caso d'uso della ricerca e dello sblocco profili.

## 3. Tipologie di account attive nell'MVP

Tutte e tre le tipologie previste dal documento originale sono attive dal lancio:

- Società
- Atleta
- Membro dello staff (allenatore, operatore di segreteria, preparatore atletico)

## 4. Modello multi-sport

Decisione: il modello dati per sport, ruoli e categorie deve essere progettato come **configurabile
e dinamico** fin dall'MVP (non hardcoded su calcio), anche se in fase di lancio verranno popolati
solo i dati relativi a calcio a 5 e calcio a 11.

Implicazione per il modello dati: le entità relative a sport, ruoli, categorie e caratteristiche
tecniche devono essere strutturate come dati di configurazione (es. tabelle Sport, Ruolo, Categoria),
non come enumerazioni fisse nel codice.

## 5. Modalità di contatto tra società e atleta/staff

Decisione: il contatto avviene esclusivamente tramite **sblocco dei dati di contatto** (email e/o
telefono) dell'atleta/membro staff da parte della società, a seguito della procedura di acquisto/
sblocco del profilo. Non è prevista una chat interna alla piattaforma nell'MVP.

Nota storica: nel documento di analisi originale erano presenti due proposte contrastanti
(chat interna vs sblocco dati). Questa decisione chiude la discrepanza a favore dello sblocco dati.

## 6. Gestione utenti minorenni

Questo è uno dei punti a maggiore rischio di compliance del progetto (GDPR + Codice Privacy italiano,
d.lgs. 196/2003 art. 2-quinquies) ed è stato trattato con particolare attenzione.

Riferimento normativo verificato: in Italia il limite di età per il consenso autonomo al trattamento
dati per servizi della società dell'informazione è fissato a 14 anni. Sotto tale soglia il consenso
deve essere prestato da chi esercita la responsabilità genitoriale. La capacità di agire per atti
negoziali (es. acquisti, abbonamenti) resta comunque acquisita solo a 18 anni.

Di conseguenza il sistema distingue tre fasce di età, con governance differenziata:

| Fascia età | Chi si registra | Chi presta il consenso privacy | Chi gestisce gli aspetti negoziali/contrattuali |
| --- | --- | --- | --- |
| Under 14 | Il minore compila il form di registrazione | Il genitore/tutore, tramite conferma esplicita | Il genitore/tutore |
| 14-17 | Il minore, in autonomia | Il minore stesso (per legge) | Il genitore/tutore (dati raccolti in fase di profilazione, come già previsto nel documento originale) |
| 18+ | L'utente, in autonomia | L'utente stesso | L'utente stesso |

Architettura scelta per la fascia Under 14 (Opzione B, tra le due valutate):

- Il minore avvia comunque il flusso di registrazione standard (non è il genitore a creare l'account).
- L'account resta in stato non attivo finché non arriva una conferma/consenso esplicito del genitore,
  raccolto tramite un secondo link di conferma inviato via email all'indirizzo del genitore/tutore
  (indirizzo raccolto durante la registrazione stessa, come step aggiuntivo per questa fascia d'età).
- Solo dopo la doppia conferma (minore + genitore) l'account viene attivato.

Punti ancora aperti su questo flusso, da chiudere nel dettaglio del caso d'uso dedicato:

- Comportamento in caso di mancata conferma del genitore (timeout, scadenza, ripetizione invio)
- Se un profilo minore può avere più di un genitore/tutore collegato
- Come viene raccolto e verificato l'indirizzo email del genitore/tutore per la fascia Under 14
- Come viene determinata l'età dell'utente in fase di registrazione, dato che nel form base attuale
  la data di nascita non è ancora richiesta (è presente solo nello step di profilazione)

## 7. Ambito dell'entity Media

Decisione: l'entity Media associata agli utenti copre:

- Video (limite gratuito di riferimento: 5, da confermare se ancora valido per l'MVP)
- Foto profilo
- Documenti di identità caricati per la validazione back-office

Nota: i documenti di identità richiedono trattamento differenziato rispetto a foto/video per via
della loro natura di dato particolare/sensibile (accesso riservato al back-office, non pubblico
sul profilo). Questo vincolo va formalizzato nel documento di modello dati.

## Tracciabilità

Le decisioni di questo documento derivano da una sessione di allineamento perimetro condotta in
data 2026-08-05, a partire dall'analisi del documento sorgente
"Analisi dei requisiti - sporteca.it". I file Database.xlsx e Modules_and_features.xlsx, citati come
riferimenti di progetto, non sono ancora stati resi disponibili in modo leggibile: eventuali
informazioni in essi contenute non sono state considerate in questo documento e andranno
riconciliate appena disponibili.