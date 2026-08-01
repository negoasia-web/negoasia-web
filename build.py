#!/usr/bin/env python3
"""
NegoAsia site build.

Reads content/articles/*.md and regenerates:
  - site/<slug>/index.html   (one page per article, WordPress URLs preserved)
  - site/blog/index.html     (the Insights index: featured post + card grid)
  - site/sitemap.xml         (article entries kept in sync)

Runs on Netlify with zero third-party dependencies — standard library only.

Body content may be written either as HTML (what the migrated WordPress articles
use) or as Markdown (what Decap CMS produces when Nicolas writes a new post).
Blocks that already start with an HTML tag are passed through untouched, so the
migrated articles are byte-identical to the hand-built versions.

    python3 build.py            # build
    python3 build.py --check    # build into memory and report differences only
"""

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).parent
SITE = ROOT / "site"
CONTENT = ROOT / "content" / "articles"


# ---------------------------------------------------------------- front matter

def esc(s):
    """Attribute-safe escaping that leaves apostrophes alone (they are fine in
    HTML text and in double-quoted attributes, and &#x27; reads badly in a title)."""
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def unquote(v):
    """Front matter values are written as JSON strings (valid double-quoted YAML)
    so that a colon inside a description cannot break the document. Decap writes
    them the same way. Fall back to the raw value for hand-edited files."""
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        try:
            import json
            return json.loads(v) if v[0] == '"' else v[1:-1]
        except ValueError:
            return v[1:-1]
    return v


def parse_front_matter(text):
    """Minimal YAML front matter: `key: value` plus `key: |` block scalars."""
    if not text.startswith("---"):
        raise ValueError("missing front matter")
    _, fm, body = text.split("---", 2)
    meta, key, block = {}, None, []

    for raw in fm.strip("\n").split("\n"):
        if key is not None:
            if raw.startswith("  ") or not raw.strip():
                block.append(raw[2:] if raw.startswith("  ") else "")
                continue
            meta[key] = "\n".join(block).rstrip()
            key, block = None, []
        if not raw.strip():
            continue
        k, _, v = raw.partition(":")
        k, v = k.strip(), v.strip()
        if v == "|":
            key, block = k, []
        else:
            meta[k] = unquote(v)

    if key is not None:
        meta[key] = "\n".join(block).rstrip()
    return meta, body.lstrip("\n")


# ------------------------------------------------------------------- markdown

INLINE = [
    # Images first: ![alt](src) would otherwise be eaten by the link rule and
    # left as a stray "!" in front of an anchor. Decap's editor emits this form,
    # so any image Nicolas drops into an article body arrives here.
    (re.compile(r"!\[([^\]]*)\]\(([^)\s]+)\)"),
     r'<img src="\2" alt="\1" loading="lazy" '
     r'style="border:1px solid var(--line);border-radius:2px;margin:2rem 0;width:100%">'),
    (re.compile(r"\*\*(.+?)\*\*"), r"<strong>\1</strong>"),
    (re.compile(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])"), r"<em>\1</em>"),
    (re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)"), r'<a href="\2">\1</a>'),
]


def inline(s):
    for pat, rep in INLINE:
        s = pat.sub(rep, s)
    return s


def render_body(src):
    """Markdown subset -> HTML. Raw HTML blocks pass through unchanged."""
    src = src.replace("\r\n", "\n").strip("\n")
    out, lines, i = [], src.split("\n"), 0

    while i < len(lines):
        line = lines[i]

        if not line.strip():
            i += 1
            continue

        # Raw HTML block: consume until a blank line at depth zero.
        if line.lstrip().startswith("<"):
            block = []
            while i < len(lines) and lines[i].strip():
                block.append(lines[i])
                i += 1
            out.append("\n".join(block))
            continue

        # Headings
        m = re.match(r"^(#{2,4})\s+(.*)$", line)
        if m:
            lvl = len(m.group(1))
            out.append("<h%d>%s</h%d>" % (lvl, inline(m.group(2).strip()), lvl))
            i += 1
            continue

        # Horizontal rule
        if re.match(r"^(-{3,}|\*{3,})$", line.strip()):
            out.append("<hr>")
            i += 1
            continue

        # Blockquote
        if line.lstrip().startswith(">"):
            buf = []
            while i < len(lines) and lines[i].lstrip().startswith(">"):
                buf.append(lines[i].lstrip()[1:].strip())
                i += 1
            out.append("<blockquote>%s</blockquote>" % inline(" ".join(buf)))
            continue

        # Lists
        bullet = re.match(r"^\s*[-*+]\s+(.*)$", line)
        number = re.match(r"^\s*\d+[.)]\s+(.*)$", line)
        if bullet or number:
            tag = "ul" if bullet else "ol"
            pat = r"^\s*[-*+]\s+(.*)$" if bullet else r"^\s*\d+[.)]\s+(.*)$"
            items = []
            while i < len(lines):
                m = re.match(pat, lines[i])
                if not m:
                    break
                items.append("  <li>%s</li>" % inline(m.group(1).strip()))
                i += 1
            out.append("<%s>\n%s\n</%s>" % (tag, "\n".join(items), tag))
            continue

        # Paragraph
        buf = []
        while i < len(lines) and lines[i].strip() and not lines[i].lstrip().startswith(("<", "#", ">", "-", "*")) \
                and not re.match(r"^\s*\d+[.)]\s", lines[i]):
            buf.append(lines[i].strip())
            i += 1
        if buf:
            out.append("<p>%s</p>" % inline(" ".join(buf)))
        else:
            out.append("<p>%s</p>" % inline(line.strip()))
            i += 1

    return "\n".join(out)


# ---------------------------------------------------------------- page shells

ARTICLE_SHELL = (ROOT / "templates" / "article.html").read_text(encoding="utf-8")
BLOG_SHELL = (ROOT / "templates" / "blog.html").read_text(encoding="utf-8")

CARD = ('      <a class="post reveal"{tagattr} href="/{slug}/"><div class="thumb"></div>'
        '<div class="body"><div class="date">{date_label}</div><h3>{title}</h3>'
        '<span class="rd">Read article →</span>{chip}</div></a>')


MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]


def date_label(iso):
    y, m, d = iso.split("-")
    return "%s %d, %s" % (MONTHS[int(m) - 1], int(d), y)


def reading_time(html_body):
    words = len(re.sub(r"<[^>]+>", " ", html_body).split())
    return max(1, round(words / 200))


def hero_media(meta):
    """Featured media block: a real image if one has been imported, the YouTube
    embed for the TEDx page, otherwise the design-system placeholder carrying
    the source URL so the swap stays a one-liner."""
    yt = meta.get("youtube")
    if yt:
        return ('      <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;'
                'border:1px solid var(--line);border-radius:2px;margin-bottom:44px">\n'
                '        <iframe src="https://www.youtube-nocookie.com/embed/{id}" title="{t}" '
                'loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; '
                'picture-in-picture" allowfullscreen '
                'style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"></iframe>\n'
                '      </div>').format(id=yt, t=esc(meta.get("youtube_title", "")))
    img = (meta.get("image") or "").strip("'\"")
    cap = meta.get("image_caption", "")
    if img:
        return ('      <img src="{src}" alt="{alt}" loading="lazy" width="1600" height="900" '
                'style="border:1px solid var(--line);border-radius:2px;margin-bottom:44px;'
                'aspect-ratio:16/9;object-fit:cover;width:100%">').format(src=img, alt=esc(cap))
    src = meta.get("image_source", "")
    note = "      <!-- IMAGE TO IMPORT: %s -->\n" % src if src else ""
    return (note +
            '      <div class="figure photo" style="aspect-ratio:16/9;margin-bottom:44px">'
            '<div class="plabel"><div class="dot"></div><b>Image</b>'
            '<span>%s</span></div></div>' % cap)


def load_articles():
    arts = []
    for f in sorted(CONTENT.glob("*.md")):
        meta, body = parse_front_matter(f.read_text(encoding="utf-8"))
        meta.setdefault("slug", f.stem)
        meta["_body"] = render_body(body)
        meta["date_label"] = date_label(meta["date"])
        meta["read"] = reading_time(meta["_body"])
        meta["title_plain"] = re.sub(r"[\u2018\u2019]", "'", meta["title"])
        meta["hero_media"] = hero_media(meta)
        meta["_file"] = f
        arts.append(meta)
    arts.sort(key=lambda a: (a.get("date", ""), a["slug"]), reverse=True)
    return arts


def render_article(a, others):
    related = "\n".join(
        CARD.format(slug=o["slug"], date_label=o["date_label"], title=o["title"],
                    tagattr="", chip="")
        for o in others[:3])
    return ARTICLE_SHELL.format(
        title=a["title"], title_plain=esc(a["title_plain"]),
        slug=a["slug"], date=a["date_label"], iso=a["date"], tag=a["tag"],
        read=a["read"], description=esc(a["description"]),
        standfirst=a["standfirst"], hero_media=a["hero_media"],
        body=a["_body"], related=related)


def render_blog(arts):
    featured = arts[0]
    cards = "\n".join(
        CARD.format(slug=a["slug"], date_label=a["date_label"], title=a["title"],
                    tagattr=' data-tag="%s"' % a["tag"].lower(),
                    chip='<span class="tag">%s</span>' % a["tag"])
        for a in arts)
    tags = []
    for a in arts:
        if a["tag"] not in tags:
            tags.append(a["tag"])
    filters = '\n      '.join(
        ['<button type="button" data-filter="all" aria-pressed="true">All</button>'] +
        ['<button type="button" data-filter="%s" aria-pressed="false">%s</button>'
         % (t.lower(), t) for t in tags])
    return BLOG_SHELL.format(
        f_slug=featured["slug"], f_date=featured["date_label"], f_read=featured["read"],
        f_title=featured["title"], f_desc=featured["description"],
        f_hero=("      <!-- featured image: see assets/img/MEDIA-TO-IMPORT.md -->"),
        filters=filters, cards=cards)


def sync_sitemap(arts):
    p = SITE / "sitemap.xml"
    t = p.read_text(encoding="utf-8")
    block = "\n".join(
        '  <url><loc>https://www.negoasia.com/%s/</loc><lastmod>%s</lastmod><priority>0.7</priority></url>'
        % (a["slug"], a["date"]) for a in arts)
    t = re.sub(r"(  <url><loc>https://www\.negoasia\.com/[a-z0-9-]+/</loc><lastmod>.*?</url>\n)+",
               block + "\n", t, count=1, flags=re.S)
    p.write_text(t, encoding="utf-8")


# ---------------------------------------------------------------- page SEO

PAGES = [
    ("home",     "index.html"),
    ("about",    "about/index.html"),
    ("services", "services/index.html"),
    ("blog",     "blog/index.html"),
    ("contact",  "contact/index.html"),
    ("ai",       "ai/index.html"),
    ("terms",    "terms/index.html"),
    ("privacy",  "privacy/index.html"),
]

PAGE_META = ROOT / "content" / "pages"
BASE_URL = "https://www.negoasia.com"


def apply_page_seo(check=False):
    """The seven hand-written pages are not generated from templates, so their
    metadata is patched in place from content/pages/*.json. That is what makes
    titles, descriptions and share images editable from the CMS without turning
    every page into a template."""
    changed = []
    for name, rel in PAGES:
        src = PAGE_META / (name + ".json")
        dst = SITE / rel
        if not src.exists() or not dst.exists():
            continue
        d = json.loads(src.read_text(encoding="utf-8"))
        html = dst.read_text(encoding="utf-8")
        out = html

        img = (d.get("image") or "").strip()
        if img and not img.startswith("http"):
            img = BASE_URL + img

        subs = [
            (r"(<title>).*?(</title>)", d.get("title")),
            (r'(<meta name="description" content=").*?(">)', d.get("description")),
            (r'(<meta property="og:title" content=").*?(">)',
             d.get("og_title") or d.get("title")),
            (r'(<meta property="og:description" content=").*?(">)',
             d.get("og_description") or d.get("description")),
            (r'(<meta property="og:image" content=").*?(">)', img),
        ]
        for pat, val in subs:
            if val:
                out = re.sub(pat, lambda m, v=val: m.group(1) + v + m.group(2),
                             out, count=1, flags=re.S)

        if out != html:
            changed.append(rel)
            if not check:
                dst.write_text(out, encoding="utf-8")
    return changed


def main():
    check = "--check" in sys.argv
    arts = load_articles()
    if not arts:
        sys.exit("no articles found in content/articles/")

    changed = []
    targets = []
    for i, a in enumerate(arts):
        others = arts[i + 1:] + arts[:i]
        targets.append((SITE / a["slug"] / "index.html", render_article(a, others)))
    targets.append((SITE / "blog" / "index.html", render_blog(arts)))

    for path, out in targets:
        old = path.read_text(encoding="utf-8") if path.exists() else None
        if old != out:
            changed.append(path.relative_to(ROOT).as_posix())
            if not check:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(out, encoding="utf-8")

    changed += apply_page_seo(check=check)

    if not check:
        sync_sitemap(arts)

    print("%d article(s) · %s" % (
        len(arts),
        ("would change: " + ", ".join(changed)) if check and changed
        else ("changed: " + ", ".join(changed)) if changed
        else "everything already up to date"))


if __name__ == "__main__":
    main()
