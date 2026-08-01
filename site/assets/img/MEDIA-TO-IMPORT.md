# Media still to import from the WordPress site

These files are referenced in the new pages by an `IMAGE TO IMPORT` HTML comment
next to the placeholder that stands in for them. Download each one from the live
WordPress site (or from the media-library export made during the backup — risk R3
in the project file), drop it into `assets/img/blog/`, and the placeholder can be
swapped for a real `<img>` in one pass.

**Do this BEFORE the DNS switch.** Once negoasia.com points at Netlify, these URLs
stop working and the originals are only recoverable from the WordPress backup.

| Target filename | Source URL | Used on |
|---|---|---|
| `mcnamara-1967.webp` | https://www.negoasia.com/wp-content/uploads/2024/03/Robert-S-McNamara-1967.webp | `/never-take-yes-for-an-answer/` (hero), `/blog/` (featured + card) |
| `meeting-negotiation.jpeg` | https://www.negoasia.com/wp-content/uploads/2024/03/meeting-with-colleagues-negotiation-1024x683.jpeg | `/never-take-yes-for-an-answer/` (in-article) |
| `tedx-still.png` | https://www.negoasia.com/wp-content/uploads/2023/10/Screenshot-2566-10-04-at-17.52.18.png | `/blog/` (card) |
| `tigers.webp` | https://www.negoasia.com/wp-content/uploads/2023/09/Rectangle-22-1.webp | `/tigers-dont-eat-salad/` (hero), `/blog/` (card) |
| `10-rules.webp` | https://www.negoasia.com/wp-content/uploads/2023/09/Rectangle-21-1.webp | `/management-tricks/` (hero), `/blog/` (card) |
| `logo-negoasia.webp` | https://www.negoasia.com/wp-content/uploads/2023/09/Group-11-min.webp | old site logo — for reference only |

## Received

- ✅ **Professional portrait** — `blog/nicolas-clement-image.webp`, 1707 × 2560, cut out
  on a transparent background. Uploaded through the CMS media library on 2026-08-01.
  In use on the About hero, the home Expert section, every article author box, and the
  Open Graph share image. A 320 × 320 face crop is derived from it at
  `nicolas-portrait-square.webp` — regenerate it if the source portrait ever changes.

## Still needed from Nicolas (not on the old site)

- Atmosphere photos: in session, on stage, in the boardroom, in Asia. One slot is still
  a placeholder, in the Credentials section of the About page.
- Vector logo (SVG / AI / EPS).
