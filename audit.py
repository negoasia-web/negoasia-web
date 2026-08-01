#!/usr/bin/env python3
"""Technical SEO + typography audit over the built site."""
import pathlib, re, collections

SITE = pathlib.Path(__file__).parent / "site"
pages = sorted(p for p in SITE.rglob("*.html") if "/admin/" not in p.as_posix())

def txt(html):
    h = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()

def tag(html, pat):
    m = re.search(pat, html, re.I | re.S)
    return m.group(1).strip() if m else None

rows, titles, descs = [], collections.Counter(), collections.Counter()
issues = collections.defaultdict(list)
dash_total = 0

for p in pages:
    html = p.read_text(encoding="utf-8")
    rel = "/" + p.relative_to(SITE).as_posix().replace("index.html", "")
    body = txt(html)
    words = len(body.split())

    title = tag(html, r"<title>(.*?)</title>")
    desc = tag(html, r'<meta name="description" content="(.*?)">')
    canon = tag(html, r'<link rel="canonical" href="(.*?)">')
    h1s = re.findall(r"<h1[^>]*>(.*?)</h1>", html, re.S | re.I)
    ogt = tag(html, r'<meta property="og:title" content="(.*?)">')
    ogi = tag(html, r'<meta property="og:image" content="(.*?)">')
    ld = len(re.findall(r'application/ld\+json', html))
    lang = tag(html, r'<html lang="(.*?)">')
    noindex = "noindex" in (tag(html, r'<meta name="robots" content="(.*?)">') or "")

    imgs = re.findall(r"<img\b[^>]*>", html, re.I)
    no_alt = [i for i in imgs if not re.search(r'\balt="[^"]', i)]

    # heading hierarchy
    levels = [int(m) for m in re.findall(r"<h([1-6])\b", html, re.I)]
    skips = [f"h{a}->h{b}" for a, b in zip(levels, levels[1:]) if b > a + 1]

    dashes = body.count("—")
    dash_total += dashes
    per1k = round(dashes / max(words, 1) * 1000, 1)

    if not noindex:
        if title: titles[title] += 1
        if desc: descs[desc] += 1
        if not title: issues["title manquant"].append(rel)
        elif not (25 <= len(title) <= 65): issues["titre hors 25-65 car."].append(f"{rel} ({len(title)})")
        if not desc: issues["meta description manquante"].append(rel)
        elif not (110 <= len(desc) <= 175): issues["description hors 110-175 car."].append(f"{rel} ({len(desc)})")
        if not canon: issues["canonical manquant"].append(rel)
        if len(h1s) != 1: issues[f"h1 != 1"].append(f"{rel} ({len(h1s)})")
        if not ogt or not ogi: issues["Open Graph incomplet"].append(rel)
        if not lang: issues["attribut lang manquant"].append(rel)
        if skips: issues["hiérarchie de titres cassée"].append(f"{rel} {skips}")
        if no_alt: issues["image sans alt"].append(f"{rel} ({len(no_alt)})")
        if words < 250: issues["contenu très court (<250 mots)"].append(f"{rel} ({words})")

    rows.append((rel, words, len(title or ""), len(desc or ""), len(h1s), ld,
                 dashes, per1k, "noindex" if noindex else ""))

print("PAGE                                  MOTS  TITRE  DESC  H1  LD  TIRETS  /1000mots")
for r in sorted(rows, key=lambda x: -x[6]):
    print("%-36s %5d  %5d %5d  %2d  %2d  %5d  %8s  %s"
          % (r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8]))
print("\nTOTAL tirets cadratins : %d sur %d pages" % (dash_total, len(pages)))

print("\n--- DOUBLONS ---")
for lbl, c in (("titre", titles), ("description", descs)):
    d = {k: v for k, v in c.items() if v > 1}
    print("  %s dupliqué(s) : %s" % (lbl, d if d else "aucun"))

print("\n--- PROBLÈMES ---")
if not issues:
    print("  aucun")
for k, v in issues.items():
    print("  %-32s %s" % (k, ", ".join(v[:6]) + (" …" if len(v) > 6 else "")))

# sitemap coverage
sm = (SITE / "sitemap.xml").read_text(encoding="utf-8")
listed = set(re.findall(r"<loc>https://www\.negoasia\.com(.*?)</loc>", sm))
real = {r[0] for r in rows if not r[8]}
print("\n--- SITEMAP ---")
print("  dans le sitemap mais introuvable :", sorted(listed - real) or "aucune")
print("  page publiable absente du sitemap :", sorted(real - listed) or "aucune")
