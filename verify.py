#!/usr/bin/env python3
"""Screenshot every page (desktop + mobile), check links and console errors.

Read-only by design: this script must never write into site/. Generating the
Open Graph image used to live here and silently overwrote it on every run —
that job now belongs to make_og.py."""
import http.server, socketserver, threading, functools, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent
SITE = ROOT / "site"
SHOTS = ROOT / "shots"
SHOTS.mkdir(exist_ok=True)
PORT = 0            # 0 = let the OS pick a free port


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    """Serve like Netlify: /path/ -> /path/index.html, unknown -> 404.html."""
    def send_error(self, code, message=None, explain=None):
        if code == 404:
            self.error_message_format = (SITE / "404.html").read_text()
        super().send_error(code, message, explain)


socketserver.TCPServer.allow_reuse_address = True   # must be set before bind
httpd = socketserver.TCPServer(
    ("", PORT), functools.partial(Handler, directory=str(SITE)))
threading.Thread(target=httpd.serve_forever, daemon=True).start()
PORT = httpd.server_address[1]
BASE = f"http://localhost:{PORT}"

PAGES = [
    ("home", "/"),
    ("about", "/about/"),
    ("services", "/services/"),
    ("contact", "/contact/"),
    ("blog", "/blog/"),
    ("ai-brief", "/ai/"),
    ("article-never-take-yes", "/never-take-yes-for-an-answer/"),
    ("article-tedx", "/tedx-nicolas-clement/"),
    ("article-tigers", "/tigers-dont-eat-salad/"),
    ("article-10-rules", "/management-tricks/"),
    ("terms", "/terms/"),
    ("privacy", "/privacy/"),
    ("thanks", "/thanks/"),
    ("404", "/404.html"),
]

with sync_playwright() as p:
    b = p.chromium.launch()

    errors = []
    for name, path in PAGES:
        for label, w, h in (("desktop", 1440, 1000), ("mobile", 390, 844)):
            pg = b.new_page(viewport={"width": w, "height": h},
                            device_scale_factor=1)
            msgs = []
            pg.on("console", lambda m: msgs.append(m) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errors.append(f"{name}: {e}"))
            pg.goto(BASE + path, wait_until="networkidle")
            pg.wait_for_timeout(1500)  # let the cookie banner appear
            # force all reveal animations so nothing is invisible in the capture
            pg.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
            pg.wait_for_timeout(250)
            pg.screenshot(path=str(SHOTS / f"{name}-{label}.png"), full_page=True)
            for m in msgs:
                errors.append(f"{name} [{label}] console: {m.text}")
            pg.close()
        print("shot", name)

    # --- link check across every page ---
    import re, urllib.parse
    pg = b.new_page()
    seen, broken = set(), []
    for name, path in PAGES:
        pg.goto(BASE + path, wait_until="domcontentloaded")
        hrefs = pg.eval_on_selector_all("a[href]", "els=>els.map(e=>e.getAttribute('href'))")
        for h in hrefs:
            if not h or h.startswith(("http", "mailto:", "#", "tel:")):
                continue
            target = urllib.parse.urljoin(path, h).split("#")[0]
            if target in seen:
                continue
            seen.add(target)
            r = pg.request.get(BASE + target)
            if r.status >= 400:
                broken.append(f"{r.status}  {target}  (linked from {path})")
    pg.close()
    b.close()

print("\n=== internal links checked:", len(seen), "===")
print("BROKEN:", *broken, sep="\n  ") if broken else print("no broken internal links")
print("\n=== JS / console errors ===")
print(*errors, sep="\n  ") if errors else print("none")
