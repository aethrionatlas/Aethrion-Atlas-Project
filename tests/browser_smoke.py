"""Run with Python + Playwright + a Chromium executable (no browser download).
Starts a local HTTP server; tests the site at its GitHub Pages project subpath.
"""
import functools
import json
import os
from pathlib import Path
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
from browser_gestures import run_gesture_tests

ROOT = Path(__file__).resolve().parents[1]
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT.parent)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}/{ROOT.name}/'
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1366, 'height': 900})
        errors, failed = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: failed.append(response.url) if response.status >= 400 else None)
        page.goto(base)
        page.wait_for_selector('[data-place-id="demo-kingdom-01"]')
        assert page.locator('.map-place').count() == 15
        page.locator('[data-place-id="demo-kingdom-01"]').click()
        page.wait_for_function('document.querySelector("#place-name").textContent === "Regno dimostrativo 01"')
        page.get_by_role('link', name='Esplora il regno →').click()
        page.wait_for_selector('[data-place-id="demo-city-01"]')
        page.locator('[data-place-id="demo-city-01"]').focus()
        page.keyboard.press('Enter')
        page.get_by_role('link', name='Apri la mappa della città →').click()
        page.wait_for_function('document.querySelector("#map-level").textContent === "Città"')
        assert page.locator('#breadcrumbs li').count() == 3
        page.reload()
        page.wait_for_function('document.querySelector("#map-level").textContent === "Città"')
        page.locator('#breadcrumbs a').first.click()
        page.wait_for_selector('[data-place-id="demo-kingdom-01"]')
        page.go_back()
        page.wait_for_function('document.querySelector("#map-level").textContent === "Città"')
        page.go_forward()
        page.wait_for_selector('[data-place-id="demo-kingdom-01"]')
        # Search navigates to a place on its containing map.
        page.locator('#search').fill('CITTÀ DIMOSTRATIVA 15')
        assert page.locator('#search-results a').count() == 1
        page.locator('#search-results a').click()
        page.wait_for_function('document.querySelector("#place-name").textContent === "Città dimostrativa 15"')
        page.locator('#search').fill('nessun-luogo')
        assert page.locator('#search-results a').count() == 0
        assert page.locator('#search-count').inner_text() == '0 luoghi trovati'
        page.locator('#plus').click()
        assert page.locator('#zoom-value').inner_text() == '125%'
        page.locator('#minus').click()
        assert page.locator('#zoom-value').inner_text() == '100%'
        box = page.locator('#map').bounding_box()
        x, y = box['x'] + 50, box['y'] + 50
        page.mouse.move(x, y)
        page.mouse.wheel(0, -100)
        page.wait_for_function('document.querySelector("#zoom-value").value !== "100%"')
        page.locator('#reset').click()
        initial = page.locator('#map-scene').get_attribute('transform')
        page.mouse.move(x, y); page.mouse.down(); page.mouse.move(x + 60, y + 40); page.mouse.up()
        assert page.locator('#map-scene').get_attribute('transform') != initial
        page.locator('#reset').click()
        assert page.locator('#map-scene').get_attribute('transform') == 'translate(0 0) scale(1)'
        page.locator('#map').focus(); page.keyboard.press('+')
        assert page.locator('#zoom-value').inner_text() == '125%'
        page.keyboard.press('0')
        # Load every detail map to catch broken IDs and render paths.
        data = json.loads((ROOT / 'data/demo/atlas.json').read_text())
        for map_data in data['maps']:
            page.goto(base + '#/map/' + map_data['id'])
            page.wait_for_function('(id) => document.querySelector("#map-title").textContent === id', arg=map_data['name'])
            assert page.locator('.map-place').count() == len(map_data['placements'])
        page.goto(base + '#/map/missing')
        page.get_by_role('link', name='Torna al continente').click()
        page.wait_for_selector('[data-place-id="demo-kingdom-01"]')
        # Actual touch events through Chromium's protocol, including pinch.
        mobile = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        phone = mobile.new_page()
        phone.on('pageerror', lambda error: errors.append(str(error)))
        phone.goto(base)
        phone.wait_for_selector('[data-place-id="demo-kingdom-01"]')
        assert phone.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert phone.locator('aside').bounding_box()['y'] >= phone.locator('#map').bounding_box()['y'] + phone.locator('#map').bounding_box()['height']
        bounds = phone.locator('#map').bounding_box()
        cx, cy = bounds['x'] + bounds['width']/2, bounds['y'] + bounds['height']/2
        cdp = mobile.new_cdp_session(phone)
        def touch(kind, points):
            cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': a, 'y': b, 'id': i} for i, (a, b) in enumerate(points)]})
        touch('touchStart', [(cx-30, cy), (cx+30, cy)])
        touch('touchMove', [(cx-60, cy), (cx+60, cy)])
        touch('touchEnd', [])
        phone.wait_for_function('parseInt(document.querySelector("#zoom-value").value) > 100')
        phone.locator('#reset').tap()
        transform = phone.locator('#map-scene').get_attribute('transform')
        touch('touchStart', [(bounds['x']+20, bounds['y']+20)])
        touch('touchMove', [(bounds['x']+60, bounds['y']+55)])
        touch('touchEnd', [])
        assert phone.locator('#map-scene').get_attribute('transform') != transform
        phone.locator('#reset').tap()
        phone.locator('#place-list a').first.tap()
        phone.get_by_role('link', name='Esplora il regno →').tap()
        phone.wait_for_function('document.querySelector("#map-level").textContent === "Regno"')
        assert not errors, errors
        assert not failed, failed
        # HTTP failure must produce a visible recoverable error, no uncaught JS exception.
        bad = browser.new_page()
        bad.route('**/data/demo/atlas.json', lambda route: route.fulfill(status=404, body='not found'))
        bad.goto(base)
        bad.wait_for_function('document.querySelector("#map-title").textContent === "Atlante non disponibile"')
        assert '404' in bad.locator('#status').inner_text()
        run_gesture_tests(browser, base, data)
        browser.close()
        print('PASS: 31 maps; kingdom/city selection, breadcrumbs, deep links, history, search, desktop zoom/drag/keyboard, mobile layout/pinch/drag/navigation, invalid route and data failure; no JavaScript errors or failed assets.')
finally:
    server.shutdown()
    server.server_close()
