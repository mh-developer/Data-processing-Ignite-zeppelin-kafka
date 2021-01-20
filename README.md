# Data processing - Ignite & Zeppelin & Kafka & NodeJS

## Main idea

We created data processing and visualization system where we logging data of visitors in our touristic agency website. So on website we logging which landmarks, events, tourist destinations visitors views. We sending data with Kafka messaging system and collect this data in Ignite Persistence database, then we can visualize collected data in Apache Zeppelin.

## Technology used

- Ignite
- Zeppelin
- Kafka
- Zookeeper
- NodeJS
- Docker compose

## Installation and running

Make sure you have already installed both `Docker Engine` and `Docker Compose`.

Then we need to run next command for start Kafka, Zookeeper, Ignite and Zeppelin.
```
docker-compose up
```

Next we need to install npm packages and run producer, which sending data to Kafka system. So we can have multiple producers.

```
npm install
npm run producer
```

So then we can run listeners which subscribe to Kafka messaging queue and consume received data. We can run multiple consumers.
```
npm run consumer
```

If we want import domain data from our website, we need import data from provided CSV file. We need to run following commands

```
docker cp ./imports/all_data_with_id_without_header.csv <ContainerID>:/storage/all_data_with_id_without_header.csv
```
Access container in shell mode:
```
docker exec -it <ContainerID> /bin/sh
```
Run Sqlline shell access to storage, create table and import data:
```
./sqlline.sh -u jdbc:ignite:thin://127.0.0.1/PUBLIC

CREATE TABLE IF NOT EXISTS OglediTable (
    OgledID integer primary key,
    KrajID integer,
    Naziv varchar,
    PostnaStevilka varchar,
    TuristicnaTelefonskaStevika varchar,
    gostovanjeID integer,
    prireditevNaziv varchar,
    prireditveDatum varchar,
    znamenitostID integer,
    znamenitostNaziv varchar,
    razdaljeID integer,
    krajBNaziv varchar,
    razdaljaVKm double
) WITH "CACHE_NAME=OglediTable, template=replicated";

COPY FROM '/storage/all_data_with_id_without_header.csv' INTO OglediTable (OgledID, KrajID, Naziv, PostnaStevilka, TuristicnaTelefonskaStevika, 
gostovanjeID, prireditevNaziv, prireditveDatum, znamenitostID, znamenitostNaziv,
razdaljeID, krajBNaziv, razdaljaVKm) FORMAT CSV;
```

Ignite provide us by default data storage in-memory mode.
If you want enable Ingite Persistence mode you need to add following configuration in Ignite default config:

```
    <bean id="grid.cfg" class="org.apache.ignite.configuration.IgniteConfiguration">
      <property name="dataStorageConfiguration">
         <bean class="org.apache.ignite.configuration.DataStorageConfiguration">
            <property name="defaultDataRegionConfiguration">
                <bean class="org.apache.ignite.configuration.DataRegionConfiguration">
                    <property name="persistenceEnabled" value="true"/>
                </bean>
            </property>
         </bean>
      </property>
    </bean>
```

Then, If you need active clusters and server nodes, you need to run  following command in Ignite `/bin` directory.
```
./control.sh --set-state ACTIVE
```

## Visualizations

When we have data in our Ignite database, then we can start analyzing.

First we need to access our Zeppelin on `http://localhost:8080`. Then we setup connection string to get data from our Ignite. So we go to `Settings -> Interpreters` and find "Ignite". Click edit and disable client mode and add following connection string.
```
jdbc:ignite:thin://ignite/PUBLIC
```

Well done. We can start analyzing data. First we need to create new workbook, where we can run SQL queries. Following we have some examples.


```
%ignite.ignitesql
SELECT OglediTable.NAZIV, AVG(OglediTable.RAZDALJAVKM) AS RAZDALJA
FROM OglediTable, OglediUporabnikov
WHERE OglediTable.KRAJID=OglediUporabnikov.KRAJID
GROUP BY OglediTable.NAZIV;
```

```
%ignite.ignitesql
SELECT TO_DATE(OglediUporabnikov.PRIREDITEVDATUM, 'YYYY-MM-DD') AS DATUM, COUNT(OglediTable.PRIREDITEVNAZIV) AS NAZIV
FROM OglediTable, OglediUporabnikov
WHERE OglediTable.OGLEDID=OglediUporabnikov.USEROGLEDID
GROUP BY DATUM
ORDER BY DATUM ASC
LIMIT 20;
```

```
%ignite.ignitesql
SELECT OglediUporabnikov.ZNAMENITOSTNAZIV, COUNT(OglediUporabnikov.ZNAMENITOSTNAZIV) AS ZNAMENITOSTI
FROM OglediTable, OglediUporabnikov
WHERE OglediTable.OGLEDID=OglediUporabnikov.USEROGLEDID
GROUP BY OglediUporabnikov.ZNAMENITOSTNAZIV
ORDER BY ZNAMENITOSTI DESC
LIMIT 20;
```
