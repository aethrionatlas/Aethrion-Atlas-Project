# Aethrion Atlas Engine

Motore open source per un atlante fantasy interattivo per campagne D&D 3.5.
**Versione 0.2.0**: applicazione statica, senza backend, database o servizi a pagamento.

## Funzionalità

- Navigazione continente → regno → città, con schede informative e breadcrumb.
- Ricerca globale dei luoghi, indipendente dalla mappa aperta.
- Link condivisibili tramite hash, compatibili con ricaricamento e cronologia del browser.
- Trascinamento, zoom centrato sul puntatore, pulsanti e pinch con due dita.
- Selezione da tastiera dei luoghi e lista HTML alternativa alla mappa.
- 15 spazi per regni, 15 città e 31 mappe dimostrative con ID persistenti.

**Nomi, posizioni, rettangoli dei regni e piante delle città sono dimostrativi e
non rappresentano la geografia canonica di Aethrion.** I rettangoli verificano la
navigazione: non sono confini politici. Gli edifici nelle città sono decorazioni
non cliccabili. Non sono implementati account, modifiche della campagna,
approvazioni, alleanze, viaggi o salvataggi.

## Avvio locale

È necessario un server HTTP per i moduli ES e il caricamento JSON. Dalla radice:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Apri il server nel browser. Non aprire direttamente `index.html` tramite `file://`.
Non servono installazione npm, build o chiavi API.

Seleziona un luogo per aprirne la scheda; usa il collegamento nella scheda per
entrare nella mappa di dettaglio. I breadcrumb permettono di risalire ai livelli
superiori. Sulla mappa focalizzata: frecce per spostarsi, `+` e `−` per lo zoom,
`0` per centrare. I luoghi sono raggiungibili con Tab e attivabili con Invio o
Spazio. Un clic breve seleziona; un trascinamento superiore a 5 pixel dalla
posizione iniziale sposta la mappa anche sopra le aree cliccabili, senza selezionare.
Su smartphone trascina con un dito e ingrandisci con due; lo scorrimento
della pagina resta disponibile fuori dalla mappa.

## Struttura

```text
index.html                 struttura e punti di accesso dell'interfaccia
assets/css/app.css         stile fantasy e layout responsive
src/main.js                inizializzazione e coordinamento dei moduli
src/core/data.js           caricamento e validazione dei dati
src/core/router.js         URL hash e risoluzione delle destinazioni
src/map/renderer.js        SVG e luoghi selezionabili
src/map/viewport.js        zoom, puntatore, tastiera e gesti touch
src/ui/panels.js           schede, ricerca, elenchi e breadcrumb
data/demo/atlas.json       campagna dimostrativa indipendente dal renderer
tests/                     validazione dati e smoke test browser
```

Il motore usa ID e tipi, senza incorporare nomi di regni o città canonici. La
sorgente dimostrativa è risolta in `src/core/data.js` rispetto all'URL del modulo,
non alla radice del dominio. Per una futura distribuzione di campagna si potrà
sostituire questa sorgente con un manifest pubblico e versionato.

### Contratto dati, schemaVersion 1

- Campagna: `id`, `schemaVersion`, `rootMapId`, `places`, `maps`.
  `kingdomSlots: 15` documenta la capacità della demo, senza imporre un limite al motore.
- Luogo: `id`, `name`, `type` (`continent`, `kingdom`, `city`), `parentId`,
  `mapId` della mappa che lo contiene, `detailMapId`, `description`.
- Mappa: `id`, `name`, `level`, `ownerId`, `width`, `height`, `placements`.
- Posizionamento: `placeId`, `x`, `y`; `width` e `height` opzionali insieme per
  un'area rettangolare. Senza dimensioni viene rappresentato un segnaposto.

Le coordinate sono unità locali della mappa SVG, non chilometri. Gli ID devono
restare invariati quando cambiano nomi e descrizioni; non ricavarli dai nomi.
`parentId: null` identifica il continente. Nella demo il continente si riferisce
alla propria mappa anche come mappa contenitrice. Ogni altro luogo è collocato
sulla sua `mapId` e possiede una mappa di dettaglio con `ownerId` corrispondente.
La validazione rifiuta ID duplicati, riferimenti mancanti, cicli e posizionamenti
non validi. I contenuti testuali vengono inseriti con `textContent`.

Le decorazioni di regno e città sono attualmente schemi generici del renderer.
Per cartografia reale servirà estendere il contratto con risorse SVG/immagini e
geometrie, mantenendo separati identità del luogo e posizionamento sulla mappa.

## GitHub Pages

Il sito può essere distribuito dalla radice del branch scelto, mantenendo insieme
`index.html`, `assets/`, `src/` e `data/`. Non richiede una build. Percorsi relativi
e URL hash funzionano anche sotto `/Aethrion-Atlas-Project/`, senza regole di
riscrittura o una pagina 404 personalizzata.

Esempio di link interno: `#/map/demo-map-kingdom-01/place/demo-city-01`.
La creazione di un branch o di una Pull Request non richiede cambiare il branch
usato dal sito online: pubblicare solo dopo revisione esplicita.

## Verifiche

Test del contratto dati e del router, con Node.js 22 o successivo:

```sh
node --test tests/data.test.mjs
```

Smoke test browser con Python, il pacchetto Playwright e Chromium installati:

```sh
python3 tests/browser_smoke.py
```

Il test usa `/usr/bin/chromium`, modificabile tramite `CHROMIUM_PATH`. Avvia e
chiude un proprio server temporaneo; prova il sito sotto una sottocartella.
Controlla le 31 mappe, selezione, schede, ricerca, breadcrumb, ricaricamento,
cronologia, tastiera, zoom e trascinamento, layout smartphone, touch e pinch.
Include regressioni per trascinamenti lenti sopra regni e città, clic con piccoli
movimenti, annullamento e perdita della cattura (prima e durante il drag), assenza
di selezioni involontarie, zoom ancorato e nomi completi su più righe.
Verifica inoltre il recupero da URL inesistenti e l'errore visibile per dati non
caricabili, intercettando errori JavaScript e risorse HTTP mancanti nel flusso normale.

## Separazione tra motore e campagna

Questo repository pubblico contiene solo motore e dati di prova. Conservare la
campagna canonica completa in un archivio separato, inizialmente privato.
Distribuire su Pages esclusivamente una selezione esplicitamente approvata dal
Game Master. Tutti i file pubblicati sono scaricabili: nascondere contenuti con
JavaScript o CSS non li protegge. Non inserire note GM, segreti, password o token.

L'approvazione GM non può essere imposta da un flag nel browser. Una futura
fase statica potrà usare proposte esportabili e integrazione da parte del GM;
account, permessi e sincronizzazione richiederanno un servizio esterno.

## Passi successivi

- v0.3: risorse cartografiche esterne, quartieri, edifici, dungeon e collegamenti tra livelli.
- v0.4: condizioni dei luoghi, eventi, alleanze e rivalità.
- v0.5: itinerari, calendario, accampamenti e import/export delle bozze locali.
- v0.6: confronto delle proposte e processo di approvazione GM prima della pubblicazione.

## Licenza

Motore distribuito con licenza MIT. Mappe, testi della campagna e risorse di terzi
richiedono licenze proprie; la licenza del codice non attribuisce diritti su tali
contenuti. La v0.2 non include né riproduce la mappa di riferimento della campagna.
