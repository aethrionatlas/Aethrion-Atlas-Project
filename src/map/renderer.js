const NS = 'http://www.w3.org/2000/svg';
function svgNode(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}
export function renderMap(svg, atlas, map, selected, onSelect) {
  svg.setAttribute('viewBox', `0 0 ${map.width} ${map.height}`);
  // Interactive descendants remain accessible rather than hidden inside an image role.
  svg.setAttribute('role', 'group');
  const title = svgNode('title', { id: 'svg-title' }, `${map.name} — schema dimostrativo`);
  const scene = svgNode('g', { id: 'map-scene' });
  if (map.level === 'kingdom') {
    scene.append(svgNode('path', { class: 'decoration', d: 'M120 180L350 80 750 120 890 340 790 580 300 620 80 410Z' }));
    scene.append(svgNode('path', { class: 'water', d: 'M600 80Q350 300 620 620L650 620Q400 300 630 80Z' }));
  }
  if (map.level === 'city') {
    scene.append(svgNode('rect', { class: 'decoration', x: 180, y: 100, width: 640, height: 500, rx: 80 }));
    for (const x of [260, 450, 640]) for (const y of [180, 400]) {
      scene.append(svgNode('rect', { class: 'region', x, y, width: 110, height: 100, rx: 8 }));
    }
    scene.append(svgNode('text', { x: 500, y: 365, 'text-anchor': 'middle', fill: '#17252b', 'font-size': 24 }, 'Pianta dimostrativa · edifici non definiti'));
  }
  for (const item of map.placements) {
    const place = atlas.places.get(item.placeId);
    const group = svgNode('g', { class: `map-place pin${selected?.id === place.id ? ' selected' : ''}`, tabindex: 0, role: 'button', 'aria-label': `Mostra scheda: ${place.name}`, 'data-place-id': place.id });
    if (item.width) {
      group.append(svgNode('rect', { class: 'region', x: item.x, y: item.y, width: item.width, height: item.height, rx: 22 }));
      group.append(svgNode('text', { x: item.x + item.width / 2, y: item.y + 60, 'text-anchor': 'middle' }, 'Regno demo'));
      group.append(svgNode('text', { x: item.x + item.width / 2, y: item.y + 95, 'text-anchor': 'middle' }, place.name.slice(-2)));
    } else {
      group.append(svgNode('circle', { cx: item.x, cy: item.y, r: 18 }));
      group.append(svgNode('text', { x: item.x, y: item.y - 35, 'text-anchor': 'middle' }, place.name));
    }
    group.addEventListener('click', () => onSelect(place));
    group.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(place); }
    });
    scene.append(group);
  }
  svg.replaceChildren(title, scene);
  return scene;
}
