#!/usr/bin/env python3
"""Render the Open Graph share image (1200x630) from Nicolas's cut-out portrait.

Run this only when the portrait, the tagline or the credential strip changes.
Deliberately separate from verify.py: a verification script must not modify
what it verifies.

    python3 make_og.py
"""
import functools, http.server, pathlib, socketserver, threading
from playwright.sync_api import sync_playwright

SITE = pathlib.Path(__file__).parent / "site"
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(
    ("", 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(SITE)))
threading.Thread(target=httpd.serve_forever, daemon=True).start()
B = "http://localhost:%d" % httpd.server_address[1]

OG = ("""<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="B/assets/css/site.css">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#152238;color:#fff;font-family:"Libre Franklin",sans-serif;position:relative;overflow:hidden}
/* la texture passe AU-DESSUS du degrade, sinon une arete verticale apparait */
body::after{content:"";position:absolute;inset:0;z-index:5;pointer-events:none;
  background:repeating-linear-gradient(135deg,rgba(255,255,255,.02) 0 14px,rgba(255,255,255,.045) 14px 28px)}
.txt{position:absolute;inset:78px auto 74px 84px;width:640px;display:flex;flex-direction:column;justify-content:space-between;z-index:3}
.top{display:flex;align-items:center;gap:13px}
.top svg{width:40px;height:40px;color:#3B78E6}
.wm{font-family:"Archivo",sans-serif;font-size:1.55rem;letter-spacing:.05em}
.wm .t{font-weight:500}.wm b{font-weight:800}
.eyebrow{font-size:.84rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#D8BE8A;margin-bottom:22px;display:block}
h1{font-family:"Archivo",sans-serif;font-weight:900;font-size:3.5rem;line-height:1.04;letter-spacing:-.02em}
h1 .c{color:#D8BE8A}
.bot{border-top:1px solid rgba(255,255,255,.16);padding-top:22px;display:flex;gap:34px;
  font-size:.74rem;letter-spacing:.15em;text-transform:uppercase;color:#D8BE8A;font-weight:700}
.pf{position:absolute;right:-24px;bottom:0;height:104%;z-index:1}
.pf img{height:100%;width:auto;display:block}
.fade{position:absolute;left:0;top:0;width:820px;height:100%;z-index:2;
  background:linear-gradient(90deg,#152238 0%,#152238 46%,rgba(21,34,56,0) 100%)}
</style></head><body>
<div class="pf"><img src="B/assets/img/blog/nicolas-clement-image.webp"></div>
<div class="fade"></div>
<div class="txt">
  <div class="top">
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 35 V18 a4.2 4.2 0 0 1 7.4 -2.7 L32 27"/><path d="M33 13 V30 a4.2 4.2 0 0 1 -7.4 2.7 L16 21"/>
    </svg><span class="wm"><span class="t">NEGO</span><b>ASIA</b></span>
  </div>
  <div>
    <span class="eyebrow eb-stack"><span>Negotiation advisory</span><span>M&amp;A &middot; HR &middot; Commercial</span><span>Asia &middot; Europe &middot; Americas</span></span>
    <h1><span class="c">Control</span> your negotiations or someone else will.</h1>
  </div>
  <div class="bot"><span>LinkedIn Top Voice</span><span>TEDx Speaker</span><span>Stanford SDRM</span><span>Hall of Fame</span></div>
</div></body></html>""").replace("B/assets", B + "/assets")

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1200, "height": 630})
    pg.set_content(OG)
    pg.wait_for_timeout(2500)
    pg.screenshot(path=str(SITE / "assets/img/og-default.png"))
    b.close()
print("og-default.png rendered")
