export function createViewport(container, svg) {
  let scene, scale = 1, tx = 0, ty = 0, moved = false;
  const pointers = new Map();
  const output = document.querySelector('#zoom-value');
  function point(x, y) {
    return new DOMPoint(x, y).matrixTransform(svg.getScreenCTM().inverse());
  }
  function draw() {
    scene?.setAttribute('transform', `translate(${tx} ${ty}) scale(${scale})`);
    output.value = `${Math.round(scale * 100)}%`;
  }
  function zoom(factor, anchor = point(container.getBoundingClientRect().x + container.clientWidth / 2, container.getBoundingClientRect().y + container.clientHeight / 2)) {
    const next = Math.max(0.7, Math.min(6, scale * factor));
    const ratio = next / scale;
    tx = anchor.x - (anchor.x - tx) * ratio;
    ty = anchor.y - (anchor.y - ty) * ratio;
    scale = next;
    draw();
  }
  function reset() { scale = 1; tx = ty = 0; draw(); }
  document.querySelector('#plus').addEventListener('click', () => zoom(1.25));
  document.querySelector('#minus').addEventListener('click', () => zoom(0.8));
  document.querySelector('#reset').addEventListener('click', reset);
  container.addEventListener('wheel', event => {
    event.preventDefault();
    zoom(Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.002), point(event.clientX, event.clientY));
  }, { passive: false });
  container.addEventListener('keydown', event => {
    if (event.target.closest('.map-place')) return;
    const steps = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] };
    if (steps[event.key]) { event.preventDefault(); tx += steps[event.key][0]; ty += steps[event.key][1]; draw(); }
    if (['+', '=', '-', '0'].includes(event.key)) {
      event.preventDefault();
      if (event.key === '0') reset(); else zoom(event.key === '-' ? 0.8 : 1.25);
    }
  });
  container.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!pointers.size) moved = false;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, pin: !!event.target.closest('.map-place') });
    if (!event.target.closest('.map-place')) container.setPointerCapture(event.pointerId);
  });
  container.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    const before = [...pointers.values()];
    const old = pointers.get(event.pointerId);
    const next = { ...old, x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, next);
    if (Math.hypot(next.x - old.x, next.y - old.y) > 2) moved = true;
    if (pointers.size === 2) {
      moved = true;
      const after = [...pointers.values()];
      const mid = list => point((list[0].x + list[1].x) / 2, (list[0].y + list[1].y) / 2);
      const distance = list => Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y);
      const a = mid(before), b = mid(after);
      tx += b.x - a.x; ty += b.y - a.y;
      if (distance(before) > 0) zoom(distance(after) / distance(before), b);
      else draw();
    } else if (pointers.size === 1 && !old.pin) {
      const a = point(old.x, old.y), b = point(next.x, next.y);
      tx += b.x - a.x; ty += b.y - a.y; draw();
    }
  });
  // Listen on window as a pointer starting on a pin isn't captured by the map.
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    window.addEventListener(type, event => pointers.delete(event.pointerId));
  }
  container.addEventListener('click', event => {
    if (moved && event.detail !== 0) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  return {
    setScene(next, resetView) { scene = next; if (resetView) { pointers.clear(); reset(); } else draw(); }
  };
}
