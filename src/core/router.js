export function routeHref(mapId, placeId) {
  return `#/map/${encodeURIComponent(mapId)}${placeId ? `/place/${encodeURIComponent(placeId)}` : ''}`;
}

export function readRoute(atlas, hash = location.hash) {
  if (!hash || hash === '#') return { map: atlas.maps.get(atlas.rootMapId), place: null };
  const match = hash.match(/^#\/map\/([^/]+)(?:\/place\/([^/]+))?$/);
  if (!match) throw new Error('Indirizzo dell’atlante non valido.');
  let mapId, placeId;
  try {
    mapId = decodeURIComponent(match[1]);
    placeId = match[2] ? decodeURIComponent(match[2]) : null;
  } catch { throw new Error('Indirizzo dell’atlante non valido.'); }
  const map = atlas.maps.get(mapId), place = placeId ? atlas.places.get(placeId) : null;
  if (!map || (placeId && (!place || place.mapId !== map.id))) throw new Error('Mappa o luogo non trovato.');
  return { map, place };
}
