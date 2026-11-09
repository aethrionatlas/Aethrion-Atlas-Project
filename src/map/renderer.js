const NS = 'http://www.w3.org/2000/svg';
function svgNode(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}
// Wrap complete names rather than abbreviating campaign data. SVG text scales
// with the map and keeps its outlined contrast at every zoom level.
function areaLabel(name, item) {
  const label = svgNode('text', { 'text-anchor': 'middle' });
  const measure = document.createElement('canvas').getContext('2d');
  let fontSize = 20, lines;
  function wrap() {
    measure.font = `${fontSize}px Georgia`;
    const result = [];
    let line = '';
    for (const word of name.split(/\s+/)) {
      if (line && measure.measureText(`${line} ${word}`).width <= item.width - 16) {
        line += ` ${word}`;
        continue;
      }
      if (line) result.push(line);
      line = '';
      for (const character of word) {
        if (line && measure.measureText(line + character).width > item.width - 16) {
          result.push(line); line = '';
        }
        line += character;
      }
    }
    if (line) result.push(line);
    return result;
  }
  do { lines = wrap(); if (lines.length * fontSize * 1.2 <= item.height - 16 || fontSize <= 12) break; fontSize--; } while (true);
  label.style.fontSize = `${fontSize}px`;
  const lineHeight = fontSize * 1.2;
  const firstY = item.y + item.height / 2 - (lines.length - 1) * lineHeight / 2 + fontSize * 0.35;
  lines.forEach((line, index) => {
    label.append(svgNode('tspan', { x: item.x + item.width / 2, y: firstY + index * lineHeight }, line));
  });
  return label;
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
      group.append(areaLabel(place.name, item));
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
