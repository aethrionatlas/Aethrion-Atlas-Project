const TYPES = new Set(['continent', 'kingdom', 'city']);

export function validateAtlas(data) {
  if (data.schemaVersion !== 1 || !Array.isArray(data.maps) || !Array.isArray(data.places)) {
    throw new Error('Formato dei dati non supportato.');
  }
  const index = (items) => {
    const result = new Map();
    for (const item of items) {
      if (!item.id || typeof item.id !== 'string' || result.has(item.id)) throw new Error('ID assente o duplicato.');
      result.set(item.id, item);
    }
    return result;
  };
  const maps = index(data.maps), places = index(data.places);
  if (!maps.has(data.rootMapId)) throw new Error('Mappa iniziale assente.');
  for (const place of places.values()) {
    if (!TYPES.has(place.type) || typeof place.name !== 'string' || typeof place.description !== 'string' ||
        !maps.has(place.mapId) || !maps.has(place.detailMapId) ||
        (place.parentId !== null && !places.has(place.parentId))) throw new Error('Luogo o riferimento non valido.');
    const seen = new Set([place.id]);
    let parent = place.parentId;
    while (parent !== null) {
      if (seen.has(parent)) throw new Error('Gerarchia ciclica.');
      seen.add(parent);
      parent = places.get(parent).parentId;
    }
    if (maps.get(place.detailMapId).ownerId !== place.id) throw new Error('Mappa di dettaglio incoerente.');
  }
  for (const map of maps.values()) {
    if (!places.has(map.ownerId) || !TYPES.has(map.level) || typeof map.name !== 'string' ||
        !Number.isFinite(map.width) || map.width <= 0 || !Number.isFinite(map.height) || map.height <= 0 ||
        !Array.isArray(map.placements)) throw new Error('Mappa non valida.');
    const seen = new Set();
    for (const item of map.placements) {
      if (!places.has(item.placeId) || places.get(item.placeId).mapId !== map.id || seen.has(item.placeId) ||
          !Number.isFinite(item.x) || !Number.isFinite(item.y) || item.x < 0 || item.x > map.width || item.y < 0 || item.y > map.height ||
          ((item.width !== undefined || item.height !== undefined) &&
           (!Number.isFinite(item.width) || item.width <= 0 || !Number.isFinite(item.height) || item.height <= 0 || item.x + item.width > map.width || item.y + item.height > map.height))) {
        throw new Error('Posizionamento non valido.');
      }
      seen.add(item.placeId);
    }
  }
  for (const place of places.values()) {
    if (place.parentId !== null && !maps.get(place.mapId).placements.some(item => item.placeId === place.id)) {
      throw new Error('Luogo senza posizionamento.');
    }
  }
  return { ...data, maps, places };
}

export async function loadAtlas() {
  // Resolve against the module, so project Pages subdirectories work unchanged.
  const response = await fetch(new URL('../../data/demo/atlas.json', import.meta.url));
  if (!response.ok) throw new Error(`Caricamento dati non riuscito (${response.status}).`);
  return validateAtlas(await response.json());
}
