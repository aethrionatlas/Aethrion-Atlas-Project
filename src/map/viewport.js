export function createViewport(container, svg) {
  const DRAG_THRESHOLD = 5; // CSS pixels from the start, independent of zoom.
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
  function releasePointers() {
    const active = [...pointers.entries()];
    pointers.clear();
    for (const [id, pointer] of active) {
      if (pointer.target.hasPointerCapture(id)) pointer.target.releasePointerCapture(id);
    }
  }
  container.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!pointers.size) moved = false;
    // Capture on the original control so a short click still targets the place.
    const target = event.target.closest('.map-place') || container;
    pointers.set(event.pointerId, {
      x: event.clientX, y: event.clientY,
      startX: event.clientX, startY: event.clientY, target
    });
    target.setPointerCapture(event.pointerId);
    if (pointers.size > 1) moved = true; // A multi-touch gesture never selects.
  });
  function movePointer(event) {
    if (!pointers.has(event.pointerId)) return;
    const before = [...pointers.values()];
    const old = pointers.get(event.pointerId);
    const next = { ...old, x: event.clientX, y: event.clientY };
    const wasMoving = moved;
    pointers.set(event.pointerId, next);
    if (Math.hypot(next.x - old.startX, next.y - old.startY) > DRAG_THRESHOLD) moved = true;
    if (pointers.size === 2) {
      const after = [...pointers.values()];
      const mid = list => point((list[0].x + list[1].x) / 2, (list[0].y + list[1].y) / 2);
      const distance = list => Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y);
      const a = mid(before), b = mid(after);
      tx += b.x - a.x; ty += b.y - a.y;
      if (distance(before) > 0) zoom(distance(after) / distance(before), b);
      else draw();
    } else if (pointers.size === 1 && moved) {
      // Include movement accumulated before crossing the threshold once.
      const a = wasMoving ? point(old.x, old.y) : point(old.startX, old.startY);
      const b = point(next.x, next.y);
      tx += b.x - a.x; ty += b.y - a.y; draw();
    }
  }
  container.addEventListener('pointermove', movePointer);
  window.addEventListener('pointerup', event => {
    movePointer(event);
    pointers.delete(event.pointerId);
    // Keep `moved` until the subsequent click (or the next gesture).
  });
  function cancelPointer(event) {
    if (!pointers.has(event.pointerId)) return;
    moved = true;
    // Abort the whole gesture: no stale pointers or jumps after cancellation.
    releasePointers();
  }
  window.addEventListener('pointercancel', cancelPointer);
  window.addEventListener('lostpointercapture', cancelPointer);
  container.addEventListener('click', event => {
    if (moved && event.detail !== 0) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  return {
    setScene(next, resetView) { scene = next; if (resetView) { releasePointers(); reset(); } else draw(); }
  };
}
