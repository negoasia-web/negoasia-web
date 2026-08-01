# NegoAsia — site web

Contexte pour Claude Code. Lis ce fichier avant toute modification.
Dernière mise à jour : 2026-08-01.

## Le projet en trois lignes

Refonte du site de **negoasia.com** — Nicolas Clement, consultant en négociation basé
à Bangkok. Site vitrine premium, statique, éditable par le client, hébergé sur Netlify.
**Anglais d'abord** ; le français viendra dans `/fr/` en phase 2. Le thaï est hors scope.

Le dossier de référence complet est `NegoAsia-Projet.md`, à la racine. **Il fait foi en cas
de doute** — décisions, tarifs, risques, état d'avancement. Il n'est pas dans le dépôt Git
(il contient des notes commerciales internes), mais il est sur le disque à côté de ce fichier.

## État actuel

Le site est **en ligne en préversion** sur https://negoasia-web.netlify.app et **non indexé**
(`site/robots.txt` est en `Disallow: /`). Le domaine `negoasia.com` pointe toujours vers
l'ancien WordPress ; la bascule DNS n'a pas eu lieu.

Chaîne de publication opérationnelle : `git push` sur `main` → Netlify lance
`python3 build.py` → publie `site/`. Le CMS Decap est actif sur `/admin/`.

## Architecture

```
content/articles/*.md     ← LA SOURCE des articles (ce que Decap édite)
content/pages/*.json      ← métadonnées SEO des 7 pages fixes (idem)
templates/                ← gabarits article + index Insights
build.py                  ← content/ + templates/ → site/
site/                     ← ce qui est publié (HTML généré ET pages écrites à la main)
verify.py                 ← captures desktop/mobile, liens, erreurs JS (LECTURE SEULE)
make_og.py                ← régénère l'image de partage Open Graph
audit.py                  ← contrôle SEO technique + densité de tirets cadratins
```

`build.py` fait deux choses distinctes : il **génère** les articles et l'index Insights
depuis `templates/`, et il **corrige en place** les balises meta des 7 pages écrites à la
main depuis `content/pages/*.json`. C'est ce qui rend leur SEO éditable au CMS sans avoir
à transformer chaque page en gabarit.

Les pages Home, About, Services, Contact, Terms, Privacy, `/ai/` et 404 sont du **HTML
écrit à la main** dans `site/`. Seuls les articles et l'index `/blog/` sont générés.

## Règles à respecter

1. **Tout le CSS vit dans `site/assets/css/site.css`.** Jamais de `<style>` dans une page,
   jamais de CSS dupliqué. Le rendu de référence validé par le client est
   `maquettes/negoasia-home-classic.html`.
2. **Ne jamais changer l'URL d'un article.** Les quatre articles ont hérité leurs adresses
   du WordPress (`/tigers-dont-eat-salad/`, `/never-take-yes-for-an-answer/`,
   `/tedx-nicolas-clement/`, `/management-tricks/`). Elles sont indexées par Google et
   conservées à l'identique — c'est ce qui évite toute perte de référencement à la bascule.
3. **Les valeurs du front matter doivent être entre guillemets.** Un `:` non échappé dans
   une description casse le YAML et rend l'article illisible par Decap.
4. **Après toute modification de `content/` ou `templates/`** : `python3 build.py`, puis
   vérifier avec `python3 build.py --check` qu'il ne reste rien à écrire.
5. **Ne jamais commiter** `NegoAsia-Projet.md`, `Message-a-Nicolas.md` ni `commercial/`.
   Le dépôt est **public** et sera remis à Nicolas ; ces fichiers contiennent des notes
   commerciales et des identifiants. Ils sont dans `.gitignore` — ne pas l'affaiblir.
6. **Le sélecteur de langue** (`.lang` dans l'en-tête) affiche EN actif et FR inerte.
   En phase 2, FR devient un lien vers `/fr/` et le `<span class="soon">` devient un `<a>`.
   Codes texte et non drapeaux : un drapeau désigne un pays, pas une langue.
7. **`verify.py` ne doit jamais écrire dans `site/`.** Il générait autrefois l'image
   Open Graph et l'écrasait silencieusement à chaque exécution ; ce travail est passé
   dans `make_og.py`. Un script de vérification qui modifie ce qu'il vérifie ment.
8. **Sur Windows** : `git config core.fileMode false` est déjà posé, sinon OneDrive fait
   apparaître tous les fichiers comme modifiés.

## Design system

Marine `#152238` / `#1B2B44` / `#22344F` · or `#C2A063` et `#D8BE8A` · crème `#F4EFE4` et
`#FAF6EC` · encre `#1D2636` · gris `#6A7080` · bleu du monogramme `#3B78E6`. **Pas de noir.**
Titres en Archivo, corps en Libre Franklin, **auto-hébergées** dans `site/assets/fonts/`
(aucun appel à Google Fonts). Largeur max 1200px, sections 104px, rayon des bords 2px.

## Avant la mise en ligne

La liste à jour est dans le README. Les trois pièges :

- `site/robots.txt` est en `Disallow: /` — **à basculer en dernier**, c'est la seule chose
  qui garde hors de Google les pages légales encore marquées « Pending confirmation ».
- `GA4_ID` est vide en tête de `site/assets/js/site.js` — tant qu'il l'est, aucun analytics
  n'est chargé, ce qui est le comportement voulu.
- **Relever les enregistrements DNS, surtout les MX, avant de repointer le domaine.**
  Les emails `@negoasia.com` en dépendent.

## Ce qui manque côté client

Les photos de Nicolas (portrait pro + ambiances) et son logo vectoriel. Les emplacements
sont des placeholders rayés. C'est le principal levier restant sur le rendu premium.
