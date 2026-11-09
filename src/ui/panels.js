import { routeHref } from '../core/router.js';
export const labels = { continent: 'Continente', kingdom: 'Regno', city: 'Città' };
const element = (tag, text) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
};
export function placeLink(place) {
  const link = element('a', place.name);
  link.href = routeHref(place.mapId, place.id);
  return link;
}
export function renderList(target, places) {
  target.replaceChildren(...places.map(place => {
    const li = element('li'); li.append(placeLink(place)); return li;
  }));
}
export function renderPanel(place, map) {
  const panel = document.querySelector('#place-panel');
  const type = element('small', `${labels[place.type]} · Demo`);
  const title = element('h2', place.name); title.id = 'place-name';
  const text = element('p', place.description);
  panel.replaceChildren(type, title, text);
  if (place.detailMapId !== map.id) {
    const link = element('a', place.type === 'kingdom' ? 'Esplora il regno →' : 'Apri la mappa della città →');
    link.href = routeHref(place.detailMapId);
    panel.append(link);
  }
}
export function renderBreadcrumbs(atlas, map) {
  const chain = [];
  let owner = atlas.places.get(map.ownerId);
  while (owner) { chain.unshift(owner); owner = atlas.places.get(owner.parentId); }
  const ol = element('ol');
  for (const [i, place] of chain.entries()) {
    const li = element('li');
    if (i === chain.length - 1) {
      const span = element('span', place.name); span.setAttribute('aria-current', 'page'); li.append(span);
    } else {
      const link = element('a', place.name); link.href = routeHref(place.detailMapId); li.append(link);
    }
    ol.append(li);
  }
  document.querySelector('#breadcrumbs').replaceChildren(ol);
}
export function setupSearch(atlas) {
  const input = document.querySelector('#search');
  const results = document.querySelector('#search-results');
  const count = document.querySelector('#search-count');
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it');
  input.disabled = false;
  input.addEventListener('input', () => {
    const query = normalize(input.value.trim());
    const matches = query ? [...atlas.places.values()].filter(place => normalize(place.name).includes(query)) : [];
    renderList(results, matches);
    count.textContent = query ? `${matches.length} luoghi trovati` : '';
  });
}
