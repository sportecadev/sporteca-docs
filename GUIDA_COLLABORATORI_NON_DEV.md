# Guida per Collaboratori Non-Tecnici: Come Modificare i Documenti di Business su Sporteca 🚀

Questa guida è stata pensata appositamente per chi non si occupa di programmazione (ad esempio, Product Manager, Business Analyst, Marketing Specialist o Copywriter) ma ha la necessità di consultare, arricchire o aggiornare la documentazione strategica di **Sporteca**.

Il tuo lavoro si concentrerà esclusivamente sui file di testo semplici (scritti in formato **Markdown**, con estensione `.md`) e non rischierai mai di intaccare o rompere il codice sorgente scritto dagli sviluppatori.

---

## 📄 Come Esportare questa Guida in PDF
Puoi stampare o salvare questa guida in un comodissimo file PDF in due modi rapidi:
1. **Da GitHub (Browser):** Premi `Ctrl + P` (o `Cmd + P` su Mac) mentre visualizzi questa pagina e seleziona **"Salva come PDF"** (o "Save as PDF").
2. **Da VS Code:** Apri il file, premi `Ctrl + Shift + P` (o `Cmd + Shift + P` su Mac), digita `Markdown: Export as PDF` e premi Invio.

---

## 1. Che cos'è Git e il nostro Repository?

Pensa a **Git** come a un archivio digitale super-sicuro. Invece di scambiarci continui file Word via email o su Slack (con il rischio di generare versioni confuse come `business_model_v2_definitivo_FINALE.docx`), Git conserva tutto in un unico posto chiamato **Repository** (o "Repo").
Git tiene traccia di ogni singola parola aggiunta o rimossa, permettendoci di sapere chi ha fatto cosa e, se necessario, di tornare indietro nel tempo a una versione precedente senza perdere nulla.

---

## 2. Installazione dello Strumento Visivo: GitHub Desktop

Per lavorare non dovrai usare lo schermo nero con i comandi testuali (la riga di comando). Utilizzeremo invece un programma grafico semplicissimo chiamato **GitHub Desktop**.

### Passo 1: Scarica il programma
1. Vai sul sito ufficiale: [desktop.github.com](https://desktop.github.com/)
2. Scarica la versione adatta al tuo sistema operativo (Windows o macOS).
3. Installa il programma e aprilo.

### Passo 2: Accedi con il tuo account
* Accedi inserendo il tuo account GitHub (se non ne hai uno, registrati gratuitamente su [github.com](https://github.com)).
* Chiedi al lead developer del progetto di essere abilitato come collaboratore sul repository di Sporteca.

---

## 3. Come fare il "Git Clone" (Scaricare il progetto sul tuo PC)

Il "Clone" è semplicemente l'azione di scaricare una copia specchio e sempre aggiornata del progetto sul tuo computer locale.

1. Apri **GitHub Desktop**.
2. Fai clic sul menu in alto a sinistra: **File** -> **Clone Repository...**
3. Seleziona la scheda **GitHub.com**.
4. Cerca nella lista il nome del repository del nostro progetto (ad esempio: `sporteca/repositories` o simile) oppure seleziona la scheda **URL** e incolla l'indirizzo web completo del repository fornito dagli sviluppatori.
5. In basso, alla voce **Local Path**, scegli in quale cartella del tuo computer preferisci salvare il progetto (es. nella cartella `Documenti` o sul `Desktop`).
6. Fai clic sul pulsante azzurro **Clone**.
7. Attendi qualche istante: GitHub Desktop scaricherà tutte le cartelle sul tuo computer.

---

## 🛡️ 4. Il tuo Perimetro di Lavoro: Dove puoi operare?

Per evitare qualsiasi tipo di interferenza con il codice dell'applicazione, il tuo spazio di lavoro è limitato a una singola e specifica area.

### 📍 Il tuo perimetro esclusivo è:
`sporteca-docs/docs/00-requirements-analysis/`

In particolare, sei invitato a concentrarti e lavorare sulla cartella del modello di business:
📁 `sporteca-docs/docs/00-requirements-analysis/business_model/`
📄 Qui troverai il file principale: **`bm-go-to-market.md`** (Strategia di business model e go-to-market).

> ⚠️ **REGOLA D'ORO:** Non aprire, rinominare o modificare nessun file al di fuori della cartella `sporteca-docs/docs/00-requirements-analysis/`. Ignora completamente cartelle come `sporteca-app`, `sporteca-api`, `sporteca-scraper` o `sporteca-database`. Lì risiede il codice di programmazione che fa funzionare l'applicazione.

---

## ✍️ 5. Come Scrivere e Modificare in formato Markdown (.md)

Tutti i nostri documenti utilizzano il formato **Markdown**. Non è altro che testo semplice con alcuni simboli speciali per formattare il testo (titoli, grassetti, elenchi).

### Con cosa puoi modificare i file?
*   **VS Code (Consigliato):** È gratuito, leggero e ha un'anteprima fantastica. Puoi scaricarlo da [code.visualstudio.com](https://code.visualstudio.com/).
*   **Typora o Obsidian:** Editor visuali eccezionali per scrivere in Markdown come se stessi scrivendo su Word o Notion.
*   **Blocco Note / TextEdit:** In alternativa, qualsiasi programma di testo base del computer.
*   **GitHub Web:** Puoi persino fare clic sulla matita direttamente dal sito di GitHub per fare modifiche veloci al volo.

### Mini-Guida ai Simboli di Scrittura (Markdown):
Scrivere in Markdown è semplicissimo. Ecco le regole base:

*   **Titoli:** Usa il simbolo cancelletto `#`.
    *   `# Titolo Principale` (Corrisponde al Titolo 1)
    *   `## Sotto-Titolo` (Corrisponde al Titolo 2)
    *   `### Sezione interna` (Corrisponde al Titolo 3)
*   **Grassetto:** Metti il testo tra due coppie di asterischi, es: `**testo importante**` diventa **testo importante**.
*   **Corsivo:** Metti il testo tra singoli asterischi, es: `*parola*` diventa *parola*.
*   **Elenchi Puntati:** Inizia la riga con un trattino `-` e uno spazio.
    *   `- Primo punto`
    *   `- Secondo punto`
*   **Tabelle:** Puoi creare splendide tabelle separando le colonne con la barra verticale `|`.
    ```text
    | Colonna A | Colonna B |
    | --- | --- |
    | Dato 1 | Dato 2 |
    ```

---

## 🔄 6. Condividere le tue Modifiche con il Team (Commit & Push)

Una volta che hai modificato o aggiunto informazioni a un documento (ad esempio, hai aggiornato l'analisi della concorrenza o aggiunto una nuova idea per i canali di marketing nel file `bm-go-to-market.md`):

1. **Salva il file** dal tuo programma di scrittura (es. premi `Ctrl + S` o `Cmd + S`).
2. Apri **GitHub Desktop**.
3. Noterai che il programma mostra automaticamente, nella colonna di sinistra, i file che hai modificato evidenziando in verde le parti aggiunte e in rosso quelle rimosse.
4. In basso a sinistra, compila la scheda **Summary** scrivendo una brevissima frase che descrive cosa hai fatto (es. *Aggiornato competitor nel business model*).
5. (Opzionale) Aggiungi maggiori dettagli nella sezione *Description*.
6. Fai clic sul pulsante azzurro **Commit to develop** (o *Commit to main*, a seconda del nome del ramo principale impostato). Questa operazione salva la modifica nella storia del tuo computer.
7. Ora fai clic sul pulsante **Push origin** (in alto al centro, o nella barra laterale). Questo comando "spinge" la tua modifica su internet nel server sicuro di Sporteca, rendendola visibile e disponibile a tutto il team!

---

### 🎉 Fatto!
Se hai seguito questi passaggi, hai appena aggiornato la documentazione strategica del progetto in modo professionale e pulito. Gli sviluppatori vedranno le tue modifiche all'istante e potranno allineare lo sviluppo del codice alle tue decisioni di business.

*Per qualsiasi dubbio o supporto nell'installazione, non esitare a chiedere supporto al team di sviluppo!*
