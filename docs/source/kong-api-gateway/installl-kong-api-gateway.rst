Kong API Gateway 
================

Prerequisiti
------------

- Docker

Installazione e configurazione Kong API Gateway
-----------------------------------------------

.. _introduzione

Introduzione
------------

Il presente documento descrive le procedure di installazione e configurazione di Kong API Gateway e delle Sporteca API

.. _installazione kong

Installing Kong
---------------

Di seguito sono riportati tutti gli **STEP** necessari al completamento dell'installazione e della configurazione del **Kong Gateway** su containers Docker.
*Per praticità, l'installazione di seguito riportata, fa riferimento ad un installazione in localhost.*

**STEP 1** - Creare una network che verrà successivamente utilizzata dai vari containers che andremo a definire durante questa procedura

.. code-block:: console

  docker network create kong-net

**STEP 2** - Predisporre un container in cui deployare Postgres su cui configurare il database utilizzato da Kong Gateway

.. code-block:: console

  docker run -d --name kong-database --network=kong-net -p 5432:5432 -e “POSTGRES_USER=kong” -e “POSTGRES_DB=kong” -e "POSTGRES_PASSWORD=kong" postgres:9.6

**STEP 3** - Configurare il database "**kong-database**" sul container definito allo STEP 2

.. code-block:: console

docker run --rm --network=kong-net -e "KONG_DATABASE=postgres" -e "KONG_PG_HOST=kong-database" -e "KONG_PG_USER=kong" -e "KONG_PG_PASSWORD=kong" kong:latest kong migrations bootstrap

**STEP 4** - Predisporre un container in cui deployare l' ultima istanza di Kong Gateway

.. code-block:: console
docker run -d --name kong --network=kong-net -e "KONG_DATABASE=postgres" -e "KONG_PG_HOST=kong-database" -e "KONG_PG_USER=kong" -e "KONG_PG_PASSWORD=kong" -e "KONG_PROXY_ACCESS_LOG=/dev/stdout" -e "KONG_ADMIN_ACCESS_LOG=/dev/stdout" -e "KONG_PROXY_ERROR_LOG=/dev/stderr" -e "KONG_ADMIN_ERROR_LOG=/dev/stderr" -e "KONG_ADMIN_LISTEN=0.0.0.0:8001, 0.0.0.0:8444 ssl" -p 8000:8000 -p 8443:8443 -p 127.0.0.1:8001:8001 -p 127.0.0.1:8444:8444 kong:latest

.. code-block:: console
curl -i http://localhost:8001/

.. code-block:: console
curl -i http://localhost:8000/

## Installing Konga
.. code-block:: console
docker run -d -p 1337:1337 --network=kong-net --name konga -v <path-to-kongdata>/kongadata:/app/kongadata -e "NODE_ENV=production" pantsel/konga

.. code-block:: console
docker run --rm --network=kong-net pantsel/konga -c prepare -a postgres -u postgresql://kong:kong@kong-database:5432/konga_db

.. code-block:: console
docker run --rm --network=kong-net pantsel/konga:latest -c prepare -a postgres -u postgresql://kong:kong@kong-database:5432/konga_db

.. code-block:: console
docker run -p 1337:1337 --network=kong-net -e "DB_ADAPTER=postgres" -e "DB_HOST=kong-database" -e "DB_USER=kong" -e "DB_DATABASE=konga_db" -e "KONGA_HOOK_TIMEOUT=120000" -e "NODE_ENV=production" --name konga pantsel/konga

**Importante**: Sostituire a <**path-to-kongdata**> (presente nel primo comando del blocco di cui sopra) un path del server/macchina host in cui storare i kongdata.

###Configurazione Kong API Gateway
Dopo aver terminato la procedura di installazione di Kong Gateway è possibile procedere alla relativa configurazione. Assumiamo quindi che tutti 
i containers definiti all'interno della procedura di installazione siano stati avviati.

Aprire un qualsiasi browser e digitare la seguente url http://localhost:1337/ per accedere all'UI di Konga. Al primo avvio sarà necessario creare un account
di amministrazione al fine di poter accedere alle funzionalità del back end. Dopo aver creato l'account di amministrazione eseguire l'accesso.

![screenshot](images/01_img.jpg)

Una volta effettuato il login sarà necessario definire una **Connection**. Selezionare quindi la voce di menu **Connections** e creare una nuova
**Connection** tramite il pulsante **New Connection**. Appena viene create è necessario cliccare su ACTIVATE per attivare la connessione e sul menù
laterale compariranno nuove voci di menù per gestire le impostazioni dei micro-servizi.

![screenshot](images/02_img.jpg)

Selezionare la voce di menù **Consumers** e cliccare sul pulsante **Create Consumer** per creare un nuovo Consumer.

![screenshot](images/03_img.jpg)

![screenshot](images/04_img.jpg)

Definire delle JWT Credential per il consumer appena creato affinché Kong Gateweay possa verificare e validare i token JWT presenti all' interno delle
richieste inviate dai client. Per fare questo è sufficiente selezionare il comsumer di riferimento dall'archivio dei consumer, selezionare il tab
**Credentials**, selezionare la tipologia di credential denominata **JWT** (posizione in alto a destra).

![screenshot](images/05_img.jpg)

A questo punto indicare un valore per il campo **algorithm** (ossia l'algoritmo per la firma dei token) e il campo **secret** (ossia la chiave segreta utilizzata
dal back end per firmare il token JWT).

![screenshot](images/06_img.jpg)

Dopo aver definito uno o più consumer è necessario configurare uno o più services al fini di poter esporre i micro-servizi di Sporteca API. 
Definiremo un Service per ogni micro-servizio adibito all'accesso di Sporteca API.

Per praticità di seguito riporteremo la configurazione del micro servizio di autenticazione (**sporteca-auth**) e (**sporteca-profiles**). Assumiamo quindi che i due 
micro-servizi siano già stati pubblicati all'interno di appositi containers e che questi risiedono sulla stessa network definita all' interno
del paragrafo di installazione.

Per definire un servizio, selezionare la voce di menù **services** e cliccare sul pulsante **Add new Service**.

![screenshot](images/07_img.jpg)

![screenshot](images/08_img.jpg)

Per completezza riportiamo un comando da eseguire da terminale per creare un services. Il comando è una semplice chiamata curl alle API di Kong Gateway.
>curl -i -X POST \
>--url http://localhost:8001/services/ \
>--data 'name=<name-of-service>' \
>--data 'url=<ip-port-of-service>'

###Configurazione service per sporteca-auth

![screenshot](images/09_img.jpg)

*Nota: in questo caso, il valore inserito all' interno del campo host dell'immagine di cui sopra, coincide con l'indirizzo IP del container predisposto.*

Tutte le richieste intercettate di cui sopra verranno smistate al micro servizio **sporteca-auth** che espone le funzionalità di autenticazione,
pertanto sarà l'unico service configurato all'interno dell'API Gateway non protetto da token JWT.

###Configurazione service per sporteca-profiles

![screenshot](images/10_img.jpg)

*nota: in questo caso, il valore inserito all'interno del campo host dell'immagine di cui sopra, coincide con l'indirizzo IP del contanier predisposto.*

Il servizio **sporteca-profiles** (e tutti gli altri previsti dall'architettura software eccezion fatta per sporteca-api) espone una serie di
dati legati principalmente ad uno specifico utente Sporteca. Per questo motivo è estremamente necessario definire un meccanismo di protezione/accesso
ai dati al fine di evitare che questi vengano esposti in modo non sicuro.

Per questa tipologia di servizi sarà quindi necessario attivare e configurare i seguenti plugin:
- JWT
- JWT Claim Headers
- ACL
- Rate Limiting

In generale, per attivare un plugin su un service, è sufficiente selezionare il servizio su cui configurare il plugin all'interno dell'archivio
dei servizi (pagina services).

![screenshot](images/11_img.jpg)

Selezionare, all'interno della schermata di dettaglio/modifica del service il tab **Plugins** e cliccare sul pulsante **Add Plugin** in alto a destra.

![screenshot](images/12_img.jpg)

In fine, selezionare il plugin che si vuole aggiungere/configurare sul service.

![screenshot](images/13_img.jpg)

##Configurazione Plugin JWT
Di seguito viene riportata la schermata di configurazione del plugin JWT. Per questo plugin è importante definire almeno i seguenti parametri:
- **uri param names**: serve ad indicare al plugin dove ricercare il token JWT all'interno della query string di una richiesta. 
  All'interno di questo parametro di configurazione sarà possibile definire il/i nome/i del parametro della query string che accoglierà
  il token jwt (es: jwt, token).
- **headers names**: serve ad indicare al plugin in quale header di una richiesta troverà il toke JWT. All'interno di questo parametro di
  configurazione sarà possibile definire il/i nome/i degli headers i cui ricercare il token (es: authorization).
- **key claim name**: serve ad indicare al plugin quali claims dovranno essere presenti all'interno del token JWT (es: iss).

![screenshot](images/14_img.jpg)

##Configurazione Plugin JWT
Di seguito viene riportata la schermata di configurazione del plugin JWT Claims Headers. Per questo plugin è importante definire almeno i seguenti parametri:
- **uri param names**: serve ad indicare al plugin dove ricercare il token JWT all'interno della query string di una richiesta. 
  All'interno di questo parametro di configurazione sarà possibile definire il/i nome/i del parametro della query string che accoglierà il
  token jwt (es: jwt, token).
- **claims to include**: serve a specificare quali claims del token JWT dovranno essere processati dal plugin. Il valore di default è ".*".
  Lasciando il valore di default il plugin scompatterà ed invierà tutti gli header contenuti nel token.
  
![screenshot](images/15_img.jpg)

##Configurazione ACL JWT
Di seguito viene riportata la schermata di configurazione del plugin ACL. Affinché questo plugin possa essere configurato e attivato
su un service (o una rotta) è necessario aver definito, preventivamente, uno o più gruppi di consumer. Per definire un gruppo di consumer
è sufficiente accedere alla schermata di modifica di un consumer, selezionare il tab group, e cliccare sul pulsante **Add group**.

![screenshot](images/16_img.jpg)

Per questo plugin è importante definire almeno i seguenti parametri:
- **whitelist**: serve ad indicare al plugin quale gruppo di consumers potranno accedere al servizio.

![screenshot](images/17_img.jpg)

##Configurazione Rate Limiting
Di seguito viene riportata la schermata di configurazione del plugin Rate Limiting.

![screenshot](images/18_img.jpg)

*Nota: mediamente i parametri di configurazione di questo plugin sarà possibile rallentare/controllare il numero di richieste fatte ad un determinato services/routes*

L'ultimo STEP necessario per completare la configurazione dell'API Gateway consiste nel definire una o più rotte per tutti i services configurati
precedentemente. Per definire una nuova rotta è sufficiente e contestualmente abbinarla ad un service è sufficiente selezionare un 
service dall'archivio dei services e selezionare il tab **Routes** e in fine cliccare sul pulsante **Add route**.

![screenshot](images/19_img.jpg)

Indicare nel form di creazione/modifica un valore per i seguenti parametri principali:
- **name**: identifica il nome della rotta all'interno della configurazione dell'API Gateway.
- **paths**: identifica un path con il quale quella rotta potrà essere richiamata dall'esterno.

![screenshot](images/20_img.jpg)

Per completezza di seguito riportiamo un comando da eseguire da terminale per la creazione di una rotta. Anche in questo caso il comando 
è semplicemente una chiamata curl alle API di Kong.

>curl -i -X POST \
>--url http://localhost:8081/services/..\
>--data 'name=' \
>--data 'paths[]=/ '

###Sporteca Auth Operations
- Method POST - /v1/token/refresh
- Method POST - /v1/public/token/generate
- Method POST - /v1/public/sing-up

###Sporteca Countries Operations
- Method GET - /v1/countries
- Method GET - /v1/countries/{uuid}
- Method GET - /v1/provinces
- Method GET - /v1/provinces/{province-uuid}
- Method GET - /v1/provinces/{province-uuid}/countries
- Method GET - /v1/regions
- Method GET - /v1/regions/{uuid}
- Method GET - /v1/regions/{region-uuid}/provinces
- Method GET - /v1/regions/{region-uuid}/countries

###Sporteca Profiles Operations
- Method GET - /v1/companies
- Method GET - /v1/companies/{uuid}
- Method GET - /v1/profiles
- Method GET - /v1/profiles/{uuid}
- Method GET - /v1/profiles/{uuid}/skills
- Method GET - /v1/profiles/{uuid}/addresses
- Method POST - /v1/profiles

###Sporteca Skills Operations
- Method GET - /v1/roles
- Method GET - /v1/roles/{uuid}
- Method GET - /v1/skills
- Method GET - /v1/skills/{uuid}
- Method GET - /v1/sports
- Method GET - /v1/sports/{uuid}
- Method GET - /v1/sports/{uuid}/skills
- Method GET - /v1/sports/{uuid}/roles

### KongaUI
* URL     : http://localhost:1337/
* username: < username>
* password: < password>

---
# Installazione ulteriori plugin

## JWT Claims Headers Plugin

1. accedere in ssh come root sul container 
  >docker excec -u root -it <container-name> /bin/bash 

2. scaricare (sul container) il plugin da https://github.com/wshirey/kong-plugin-jwt-claims-headers
  wget https://github.com/wshirey/kong-plugin-jwt-claims-headers/archive/master.zip

3. unzip del plugin scaricato al punto 2
  >unzip master.zip

4. Posizionarsi all'interno della directory unzippata e spostare il contenuto della cartella del plugin in  /usr/local/share/lua/5.1/kong/plugins/jwt-claims-headers
  >mv kong-plugin-jwt-claims-headers-master /usr/local/share/lua/5.1/kong/plugins/jwt-claims-headers
  >chown -R 1000.1000 jwt-claims-headers

5. Posizionarsi all'interno della directory /etc/kong/ e creare una copia del file kong.conf.default e rinominarlo in kong.konf
  >cd /etc/kong
  >cp kong.conf.default kong.conf

6. Editare il file kong.conf ed aggiungere all'inizio del file la seguente stringa: plugins = bundled,jwt-claims-headers
  >vi kong.conf
  >plugins = bundled,jwt-claims-headers
  >esc :x

7. Riavviare il container

---
# Dockerizziamo i servizi

## Sporteca Auth Api
**Nota**: posizionarsi all'interno della directory di progetto sporteca-auth-api

1. buildare l'immagine del micro-servizio
> docker build -t sporteca-auth-image .

2. eseguire l'immagine mediante un container
> docker run --name sporteca-auth-container --network=kong-net -p 8081:8080 sporteca-auth-image

3. Recuperare l'indirizzo IP del container necessario per la configurazione del service sull'API Gateway
> docker network inspect kong-net

4. Configurare un service sull'API Gateway che punti al microservizio sporteca-auth (mediante una chiamata alle API di Kong o tramite Konga UI)
> curl -i -X POST --url http://localhost:8001/services/ --data 'name=sporteca-auth-service-v1' --data 'url=http://172.19.0.6:8080/'

**Nota**: in **--data 'url=<provide-container-ip>'** deve essere inserito l'indirizzo IP del container di sporteca-auth-image.

5. Associare una route al service definito sull'API Gateway (mediante una chiamata alle API di Kong o tramite Konga UI).
> curl -i -X POST  --url http://localhost:8001/services/sporteca-auth-service-v1/routes --data 'name=sporteca-auth-route-v1' --data 'paths[]=/sporteca-auth'

6. Una volta completata la configurazione del service e della route sarà possibile interrogare il micro servizio attraverso l'API Gateway mediante le seguenti operation:
http://localhost:8000/sporteca-auth-v1/swagger-ui.html

## Sporteca Countries Api
**Nota**: posizionarsi all'interno della directory di progetto sporteca-countries-api

1. buildare l'immagine del micro-servizio
> docker build -t sporteca-countries-image .

2. eseguire l'immagine mediante un container
> docker run --name sporteca-countries-container --network=kong-net -p 8082:8080 sporteca-countries-image

3. Recuperare l'indirizzo IP del container necessario per la configurazione del service sull'API Gateway
> docker network inspect kong-net

4. Configurare un service sull'API Gateway che punti al microservizio sporteca-auth (mediante una chiamata alle API di Kong o tramite Konga UI)
> curl -i -X POST --url http://localhost:8001/services/ --data 'name=sporteca-countries-service-v1' --data 'url=http://172.19.0.6:8080/'

**Nota**: in **--data 'url=<provide-container-ip>'** deve essere inserito l'indirizzo IP del container di sporteca-countries-image.

5. Associare una route al service definito sull'API Gateway (mediante una chiamata alle API di Kong o tramite Konga UI).
> curl -i -X POST  --url http://localhost:8001/services/sporteca-countries-service-v1/routes --data 'name=sporteca-countries-route-v1' --data 'paths[]=/sporteca-countries'

6. Una volta completata la configurazione del service e della route sarà possibile interrogare il micro servizio attraverso l'API Gateway mediante le seguenti operation:
   http://localhost:8000/sporteca-countries/swagger-ui.html

## Sporteca Profile Api
**Nota**: posizionarsi all'interno della directory di progetto sporteca-profile-api

1. buildare l'immagine del micro-servizio
> docker build -t sporteca-profile-image .

2. deployare ed eseguire l'immagine su un container docker
> docker run --name sporteca-profile-container --network=kong-net -p 8083:8080 sporteca-profile-image

3. Recuperare l'indirizzo IP del container necessario per la configurazione del service sull'API Gateway
> docker network inspect kong-net

4. Configurare un service sull'API Gateway che punti al micro-servizio sporteca-profile (mediante una chiamata alle API di Kong o tramite Konga UI)
> curl -i -X POST --url http://localhost:8001/services/ --data 'name=sporteca-profile-service-v1' --data 'url=http://172.19.0.7:8080/'

**Nota**: in **--data 'url=<provide-container-ip>'** deve essere inserito l'indirizzo IP del container di sporteca-profile-image.

5. Associare una route al service definito sull'API Gateway (mediante una chiamata alle API di Kong o tramite Konga UI).
> curl -i -X POST  --url http://localhost:8001/services/sporteca-profile-service-v1/routes --data 'name=sporteca-profile-route-v1' --data 'paths[]=/sporteca-profile'

6. Una volta completata la configurazione del service e della route sarà possibile interrogare il micro servizio attraverso l'API Gateway mediante le seguenti operation:
   http://localhost:8000/sporteca-profile/swagger-ui.html

## Sporteca Skills Api
**Nota**: posizionarsi all'interno della directory di progetto sporteca-skills-api

1. buildare l'immagine del micro-servizio
> docker build -t sporteca-skills-image .

2. deployare ed eseguire l'immagine su un container docker
> docker run --name sporteca-skills-container --network=kong-net -p 8084:8080 sporteca-skills-image

3. Recuperare l'indirizzo IP del container necessario per la configurazione del service sull'API Gateway
> docker network inspect kong-net

4. Configurare un service sull'API Gateway che punti al micro-servizio sporteca-skills (mediante una chiamata alle API di Kong o tramite Konga UI)
> curl -i -X POST --url http://localhost:8001/services/ --data 'name=sporteca-skills-service-v1' --data 'url=http://172.19.0.8:8080/'

**Nota**: in **--data 'url=<provide-container-ip>'** deve essere inserito l'indirizzo IP del container di sporteca-skills-image.

5. Associare una route al service definito sull'API Gateway (mediante una chiamata alle API di Kong o tramite Konga UI).
> curl -i -X POST  --url http://localhost:8001/services/sporteca-skills-service-v1/routes --data 'name=sporteca-skills-route-v1' --data 'paths[]=/sporteca-skills'

6. Una volta completata la configurazione del service e della route sarà possibile interrogare il micro servizio attraverso l'API Gateway mediante le seguenti operation:
   http://localhost:8000/sporteca-skills/swagger-ui.html

---

## Configuriamo consumer, servizi e plugin dell'API Gateway

- Tramite konga creare un consumer e associare delle JWT credential (indicando key e secret)

- comando per attivare il plugin JWT su un service
> curl -X POST http://localhost:8001/services/sporteca-profile-service-v1/plugins \
    --data "name=jwt"

- comando per attivare il plugin di JWT su una rotta
> curl -X POST http://localhost:8001/routes/sporteca-profile-route-v1/plugins \
    --data "name=jwt" 

- comando per attivare il plugin JWT CLAIMS HEADER su un service
>curl -X POST http://localhost:8001/services/sporteca-profile-service-v1/plugins \
>  --data "name=kong-plugin-jwt-claims-headers" \
>  --data "config.uri_param_names=jwt" \
>  --data "config.claims_to_include=.*" \
>  --data "config.continue_on_error=true"
