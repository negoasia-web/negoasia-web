# NegoAsia — website

Static site for [negoasia.com](https://www.negoasia.com). No framework, no
JavaScript build, no dependencies. Deployed on Netlify.

## Layout

```
site/                     what gets published (Netlify publish directory)
  index.html              home
  about/ services/ contact/ blog/ ai/ terms/ privacy/ thanks/
  <article-slug>/         one folder per article — URLs inherited from WordPress
  admin/                  Decap CMS (config.yml needs the repo name filled in)
  assets/css|js|fonts|img
  _redirects robots.txt sitemap.xml 404.html llms.txt
content/articles/*.md     article source — this is what the CMS edits
templates/                page shells used by build.py
build.py                  content/ + templates/ -> site/
verify.py                 screenshots, link check, console-error check
maquettes/                the client-approved design reference
assets/                   raw material received from the client (originals:
                          high-resolution portraits, vector logo). Working
                          copies used by the site live in site/assets/.
commercial/               quotes and proposals — git-ignored, never pushed
NegoAsia-Projet.md        project file — git-ignored: it holds pricing strategy
                          and internal client notes. Lives on Bruno's disk and
                          in the Claude project, not in this repo.
```

## Commands

```bash
python3 build.py            # regenerate article pages + the Insights index
python3 build.py --check    # report what would change, write nothing
python3 verify.py           # screenshot all pages, check links and JS errors
```

`build.py` is idempotent: running it on unchanged content prints
"everything already up to date" and touches no file.

## Editing content

Articles are Markdown files in `content/articles/` with YAML front matter
(`title`, `date`, `tag`, `standfirst`, `description`, `image`, body). Everything
else — reading time, formatted date, ordering, the Insights index, the sitemap
entries — is derived at build time.

Nicolas edits them through Decap CMS at `/admin/`. Two things must be set up
once for that to work:

1. Fill in `repo: OWNER/REPO` in `site/admin/config.yml`.
2. In Netlify: Site configuration → Access & security → OAuth → install the
   GitHub provider.

## Design system

Everything visual lives in `site/assets/css/site.css` — colours, type scale,
spacing, and every component. Pages never carry their own CSS. The reference
rendering is `maquettes/negoasia-home-classic.html`, approved by the client.

Fonts (Archivo, Libre Franklin) are self-hosted in `site/assets/fonts/`. There
is no request to Google Fonts, which is both faster and simpler under the PDPA.

## Before going live

- [ ] `site/robots.txt` — currently `Disallow: /`. Open the site up.
- [ ] `site/assets/js/site.js` — set `GA4_ID` to the real measurement ID.
- [ ] `site/admin/config.yml` — set `repo`.
- [ ] Fill every highlighted placeholder in `/terms/` and `/privacy/`.
- [ ] Copy the current DNS records (**especially MX**) before repointing.
