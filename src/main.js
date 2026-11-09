import { loadAtlas } from './core/data.js';
import { readRoute, routeHref } from './core/router.js';
import { renderMap } from './map/renderer.js';
import { createViewport } from './map/viewport.js';
import { labels, renderBreadcrumbs, renderList, renderPanel, setupSearch } from './ui/panels.js';

const status = document.querySelector('#status');
try {
  const atlas = await loadAtlas();
  const svg = document.querySelector('#viewport');
  const viewport = createViewport(document.querySelector('#map'), svg);
  let previousMap;
  function render() {
    let route;
    try { route = readRoute(atlas); }
    catch (error) {
      status.textContent = `${error.message} Usa il collegamento per tornare al continente.`;
      status.className = 'error';
      const recovery = document.createElement('a');
      recovery.href = routeHref(atlas.rootMapId);
      recovery.textContent = ' Torna al continente';
      status.append(recovery);
      route = { map: atlas.maps.get(atlas.rootMapId), place: null };
    }
    const { map, place } = route;
    const changed = previousMap !== map.id;
    const focusedId = document.activeElement?.getAttribute('data-place-id');
    const scene = renderMap(svg, atlas, map, place, selected => {
      location.hash = routeHref(map.id, selected.id);
    });
    viewport.setScene(scene, changed);
    renderBreadcrumbs(atlas, map);
    renderPanel(place || atlas.places.get(map.ownerId), map);
    renderList(document.querySelector('#place-list'), map.placements.map(item => atlas.places.get(item.placeId)));
    document.querySelector('#map-title').textContent = map.name;
    document.querySelector('#map-level').textContent = labels[map.level];
    if (!map.placements.length) {
      const li = document.createElement('li'); li.textContent = 'Pianta di prova: edifici non ancora definiti.';
      document.querySelector('#place-list').append(li);
    }
    if (status.className !== 'error') status.textContent = `${map.placements.length} luoghi esplorabili · geografia dimostrativa`;
    // Keep keyboard selection on the corresponding SVG control after rendering.
    if (!changed && focusedId) {
      [...svg.querySelectorAll('[data-place-id]')].find(node => node.dataset.placeId === focusedId)?.focus({ preventScroll: true });
    } else if (changed && previousMap) document.querySelector('#map').focus({ preventScroll: true });
    previousMap = map.id;
  }
  setupSearch(atlas);
  window.addEventListener('hashchange', () => { status.className = ''; render(); });
  render();
} catch (error) {
  document.querySelector('#map-title').textContent = 'Atlante non disponibile';
  status.textContent = `${error.message} Ricarica la pagina oppure verifica i file della campagna.`;
  status.className = 'error';
}
