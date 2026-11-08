import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateAtlas } from '../src/core/data.js';
import { readRoute, routeHref } from '../src/core/router.js';
const raw = JSON.parse(await readFile(new URL('../data/demo/atlas.json', import.meta.url)));
test('demo: 15 kingdoms, unique maps, consistent routes for every place', () => {
  const atlas = validateAtlas(structuredClone(raw));
  assert.equal([...atlas.places.values()].filter(p => p.type === 'kingdom').length, 15);
  assert.equal(atlas.maps.size, 31);
  for (const place of atlas.places.values()) {
    assert.equal(readRoute(atlas, routeHref(place.mapId, place.id)).place.id, place.id);
    assert.equal(readRoute(atlas, routeHref(place.detailMapId)).map.ownerId, place.id);
  }
});
test('reject duplicate IDs, missing references, cycles and invalid placements', () => {
  for (const mutate of [
    d => d.places.push(d.places[0]),
    d => { d.places[1].parentId = 'missing'; },
    d => { d.places[1].parentId = d.places[2].id; },
    d => { d.maps[0].placements[0].x = -1; },
    d => { d.maps[0].placements[0].placeId = 'missing'; },
    d => { d.maps[0].placements[0].width = 2000; }
  ]) {
    const copy = structuredClone(raw); mutate(copy);
    assert.throws(() => validateAtlas(copy));
  }
});
test('invalid deep links are rejected, empty hash opens root', () => {
  const atlas = validateAtlas(raw);
  assert.equal(readRoute(atlas, '').map.id, atlas.rootMapId);
  for (const hash of ['#/map/missing', '#/map/%XX', '#/map/demo-map-city-01/place/demo-kingdom-01', '#bad']) {
    assert.throws(() => readRoute(atlas, hash));
  }
});
