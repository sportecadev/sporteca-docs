# Sporteca - Documentazione Architetturale 🚀

Benvenuto nella documentazione architetturale ufficiale di **Sporteca**. Questo spazio contiene i dettagli strutturali, i diagrammi di flusso, il disegno del database e le scelte tecnologiche pensate per supportare la piattaforma dall'MVP fino alla scalabilità globale su migliaia di utenti.

---

## 📌 Principi Guida per lo Sviluppo (Solo-Developer Framework)

Essendo il team di sviluppo composto da un singolo ingegnere software, l'architettura è stata progettata seguendo tre principi cardine:

1. **Massimizzazione del Leverage (Leva Tecnologica):** Preferire strumenti che generano automaticamente codice ripetitivo (es. **Jmix** per i pannelli amministrativi e la sicurezza, **Flutter** per la compilazione cross-platform mobile).
2. **Asincronia e Disaccoppiamento (Decoupling):** Esternalizzare i carichi di lavoro pesanti o complessi (es. upload di media tramite GCS Signed URLs, elaborazione di pagamenti via Webhook, fatturazione automatica tramite API esterne).
3. **Predisposizione alla Scalabilità (Cloud-Native):** Utilizzare servizi gestiti su **Google Cloud Platform (GCP)** per ridurre al minimo l'overhead di manutenzione sistemistica (NoOps / Serverless-first).

---

## 📂 Mappa della Documentazione

La documentazione è suddivisa in aree contestuali per una consultazione mirata:

```
docs/architecture/
├── README.md                           # Questo indice globale
├── 01-overview/
│   └── 01-system-overview.md           # Panoramica del sistema, attori MVP e flussi
├── 02-frontend/
│   └── 02-frontend-and-mobile.md       # Flutter, Web SPA, i18n e gestione dello stato
├── 03-backend/
│   └── 03-jmix-backend.md              # Jmix/Spring Boot, REST APIs, sicurezza e add-on
├── 04-database-and-storage/
│   └── 04-database-and-media.md        # Segregazione tenant, schema MySQL e Google Cloud Storage
├── 05-cloud-and-devops/
│   └── (Futuro: Configurazione CI/CD, Terraform, Cloud Run)
├── 06-ai-and-search/
│   └── (Futuro: Ricerca Semantica, Integrazione MCP, Vector DB)
└── 07-integrations/
    └── 07-payments-billing-comms.md   # Stripe/PayPal, FattureInCloud, SendGrid/Postmark
```

---

## ⚡ Caratteristiche Chiave dell'MVP di Partenza

* **Claim del Profilo Atleta:** Gli atleti si registrano e "rivendicano" la propria identità sportiva confrontandola con i dati storici estratti dallo **Scraper**.
* **Scouting per le Company:** Le società sportive registrate possono effettuare ricerche mirate (filtri avanzati) per scoprire nuovi talenti basandosi su statistiche certificate.
* **Segregazione dei Dati:** Architettura multi-tenant logico/fisica per garantire l'isolamento dei dati sensibili delle società (es. futuri bilanci e certificati medici).
* **Internazionalizzazione (i18n):** Supporto nativo multi-lingua integrato fin dal primo giorno sia a livello database che client.
