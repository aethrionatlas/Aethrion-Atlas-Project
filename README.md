# Aethrion Atlas Engine

Motore open source per un atlante fantasy interattivo. Versione **0.1.0**: prototipo statico senza account o database.

> La mappa e i luoghi mostrati in questa demo sono segnaposto, **non** rappresentano la geografia canonica di Aethrion.

## Prova in locale

Apri `index.html` nel browser. Trascina la mappa, usa lo zoom e seleziona un segnaposto.

## Pubblicazione gratuita con GitHub Pages

1. Crea su GitHub un repository pubblico, per esempio `aethrion-atlas`.
2. Carica i file di questa cartella **nella radice** del repository (`index.html`, `README.md`, `LICENSE`, `.gitignore`).
3. Vai in **Settings → Pages** del repository.
4. In **Build and deployment** scegli **Deploy from a branch**, branch **main**, cartella **/(root)** e salva.
5. Attendi il completamento del deployment: GitHub mostrerà l'indirizzo del sito, normalmente `https://NOMEUTENTE.github.io/aethrion-atlas/`.

Il sito pubblicato è **pubblico**. Non caricare dati riservati del GM, password, mappe segrete, note private o chiavi API. GitHub Pages ospita contenuti statici: per account e approvazioni servirà un backend dedicato con regole di accesso.

## Separazione tra motore e campagna

Questo repository contiene soltanto il motore e dati dimostrativi. I dati della campagna reale andranno in un archivio separato, inizialmente privato, e saranno pubblicati solo quando il GM li approva. **Non basta nascondere contenuti con JavaScript**: ciò che viene pubblicato nei file statici è accessibile ai visitatori.

## Roadmap indicativa

- Mappe canoniche di continente, regni e città
- Punti di interesse e navigazione tra livelli
- Dungeon, sottosuolo, grotte, porti e moli
- Itinerari, accampamenti e cronologia in-game
- Account e flusso di approvazione GM
- Distruzione e ricostruzione per edificio

## Licenza

Codice distribuito con licenza MIT. La licenza del motore non attribuisce automaticamente licenze ai futuri contenuti della campagna o alle risorse grafiche di terzi. Per contribuire, apri una issue o una pull request.
