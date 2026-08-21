# Sporteca - Documentazione Architetturale 🚀

Benvenuto nella documentazione architetturale ufficiale di **Sporteca**. Questo spazio contiene i dettagli strutturali, i diagrammi di flusso, il disegno del database e le scelte tecnologiche pensate per supportare la piattaforma dal prototipo e dall'MVP fino alla scalabilità su migliaia di utenti.

---

## 📌 Principi Guida per lo Sviluppo (Solo-Developer Framework)

Essendo lo sviluppo portato avanti da un numero ridotto di sviluppatori, l'architettura è stata progettata seguendo tre principi cardine:

1.  **Massimizzazione del Leverage (Leva Tecnologica):** Preferire strumenti che generano automaticamente codice ripetitivo (es. **Jmix 2.x** per i pannelli amministrativi, la sicurezza e la gestione utenti, **Spring Boot 3.x** per lo strato di business).
2.  **Asincronia e Disaccoppiamento (Decoupling):** Esternalizzare i carichi di lavoro pesanti o complessi (es. upload di media tramite GCS Signed URLs, elaborazione di pagamenti via Webhook).
3.  **Monolite Modulare ed API Stateless**: Centralizzare le risorse nel repository unificato **`sporteca-backend`**, separando nettamente l'interfaccia stateful Jmix Cockpit per amministratori dalle API REST stateless destinate all'app client mobile.

---

## 📂 Mappa della Documentazione Architetturale

La documentazione tecnica è suddivisa in aree contestuali per una consultazione mirata:

```text
docs/01-architecture/
├── README.md                           # Questo indice globale
├── 01-overview/
│   └── 01-system-overview.md           # Panoramica del sistema, attori, separazione canali di login
├── 02-frontend/
│   └── 02-frontend-and-mobile.md       # Flutter per client, Widget Embed per siti terzi
├── 03-backend/
│   └── 03-jmix-backend.md              # sporteca-backend Jmix/Spring, JWT, Microsoft Entra SSO, provisioning
├── 04-database-and-storage/
│   ├── 04-database-and-media.md        # Segregazione tenant, schema MySQL e Google Cloud Storage
│   └── 04-database-schema-and-scraper-alignment.md # Allineamento schema DB, scraper e flusso di Claiming dei profili
└── 07-integrations/
    └── 07-payments-billing-comms.md   # Stripe/PayPal, FattureInCloud, SendGrid/Postmark
```

---

## ⚡ Caratteristiche Chiave dell'MVP di Partenza

*   **Autenticazione Ruolo-Centrica & SSO**: Supporto nativo a Social Logins (Google/Apple) per atleti, staff e genitori, e Single Sign-On (Microsoft Entra ID) con provisioning dinamico (`UserProvisioningService`) per Società Sportive.
*   **Claim del Profilo Atleta**: Gli atleti si registrano e "rivendicano" la propria identità sportiva confrontandola con i dati storici reali recuperati dallo scraper.
*   **Prototipazione Scraper (`sporteca-scaper-app`)**: Un'applicazione web React indipendente che consuma in locale i file JSON generati dallo scraper in `db/` (tramite symlink), usata come ambiente di test e validazione visuale delle classifiche ed atleti prima del deployment delle API definitive.
*   **Internazionalizzazione (i18n)**: Supporto nativo multi-lingua integrato a livello database (MySQL JSON Columns per i nomi di sport, categorie e ruoli) e gestito a livello REST dal backend.
