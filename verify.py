#!/usr/bin/env python3
"""Render the OG image and screenshot every page (desktop + mobile) for review."""
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

OG_HTML = """<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="__CSS__">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#152238;color:#fff;font-family:"Libre Franklin",sans-serif;
     padding:82px 88px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
body::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,.02) 0 14px,rgba(255,255,255,.045) 14px 28px);pointer-events:none}
.top{display:flex;align-items:center;gap:14px;position:relative;z-index:1}
.top svg{width:44px;height:44px;color:#3B78E6}
.wm{font-family:"Archivo",sans-serif;font-size:1.7rem;letter-spacing:.05em}
.wm .t{font-weight:500}.wm b{font-weight:800}
.eyebrow{font-size:.9rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#D8BE8A;margin-bottom:26px;display:block}
h1{font-family:"Archivo",sans-serif;font-weight:900;font-size:4.3rem;line-height:1.03;letter-spacing:-.02em;max-width:17ch}
h1 .c{color:#D8BE8A}
.mid{position:relative;z-index:1}
.bot{border-top:1px solid rgba(255,255,255,.16);padding-top:26px;display:flex;gap:44px;
     font-size:.82rem;letter-spacing:.16em;text-transform:uppercase;color:#D8BE8A;font-weight:700;position:relative;z-index:1}
</style></head><body>
<div class="top">
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 35 V18 a4.2 4.2 0 0 1 7.4 -2.7 L32 27"/><path d="M33 13 V30 a4.2 4.2 0 0 1 -7.4 2.7 L16 21"/>
  </svg>
  <span class="wm"><span class="t">NEGO</span><b>ASIA</b></span>
</div>
<div class="mid">
  <span class="eyebrow">Negotiation advisory · Asia &amp; beyond</span>
  <h1><span class="c">Control</span> your negotiations, or someone else will.</h1>
</div>
<div class="bot"><span>LinkedIn Top Voice</span><span>TEDx Speaker</span><span>Stanford SDRM</span><span>Hall of Fame</span></div>
</body></html>"""

with sync_playwright() as p:
    b = p.chromium.launch()

    # --- Open Graph image, rendered with the real brand fonts ---
    pg = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
    pg.set_content(OG_HTML.replace("__CSS__", BASE + "/assets/css/site.css"))
    pg.wait_for_timeout(2500)
    pg.screenshot(path=str(SITE / "assets/img/og-default.png"))
    pg.close()
    print("og-default.png rendered")

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
