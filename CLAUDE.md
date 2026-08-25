# NegoAsia — site web

Contexte pour Claude Code. Lis ce fichier avant toute modification.
Dernière mise à jour : 2026-08-25.

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

**Le déploiement consomme des crédits Netlify** — 15 par build de production. L'offre
gratuite en donne 300 par mois, soit 20 déploiements, et le plafond a bloqué la
production le 17/08 : un `git push` a bien poussé sur GitHub, et Netlify a affiché
`Skipped due to account credit usage exceeded` sans rien construire. Le compte est passé
au plan **Personal** (9 $/mois, 1 000 crédits) le même jour. Si un jour un push ne
déclenche plus rien, regarder les crédits **avant** de soupçonner le webhook : c'est la
piste qui m'a fait perdre du temps ce jour-là.

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
8. **Sur Windows** : `git config core.fileMode false` est déjà posé, et un `.gitattributes`
   force `eol=lf`. Sans ces deux réglages, OneDrive et les fins de ligne font apparaître une
   dizaine de fichiers « modifiés » à chaque livraison, et les vrais changements s'y noient.
9. **Deux copies du projet existent : le disque de Bruno et la session Cowork.** Les
   fichiers du site sont écrits dans la session puis recopiés sur le disque. Mais les
   fichiers de configuration — `.gitignore`, `CLAUDE.md`, `netlify.toml` — sont aussi
   édités depuis le poste, et **la copie de la session prend alors du retard sans que
   rien ne le signale**. Recopier une version périmée efface la modification faite ici.
   C'est arrivé le 25/08 : la ligne `_tmp/` du `.gitignore` a disparu d'une livraison,
   et sans elle les 54 fichiers d'un ancien snapshot redevenaient candidats au prochain
   `git add .`. **Avant d'écrire sur le disque un fichier que le poste peut avoir touché,
   le relire depuis le disque et comparer.** Pour les pages du site, la session fait foi ;
   pour la configuration, c'est le disque.

## Widget de retours (préversion uniquement)

Un bouton « A remark on this page » s'affiche en bas à droite, **uniquement sur
`*.netlify.app`** — il ne peut donc jamais apparaître sur negoasia.com. Il est injecté par
`site.js` ; son formulaire est déclaré statiquement dans `site/forms.html`, page noindex qui
n'existe que pour que Netlify le détecte au build. **Ne pas supprimer `forms.html`** : sans
lui, les envois partent dans le vide sans erreur visible. Les retours arrivent dans
Netlify → Forms → `review`. Chaque retour arrive avec l'URL, la **section** et le
**type d'élément** en clair (« Stats › Key figure »), un **extrait du texte visé** et un
**sélecteur CSS** qui permet de retrouver l'élément exact par script. Au survol d'un
paragraphe, d'un titre, d'une puce ou d'un chiffre, un liseré doré et une pastille
apparaissent : Nicolas désigne, il n'a plus à décrire.

**Une image peut être jointe au retour** (25/08), une seule par envoi : collage
(`Ctrl+V` d'une capture d'écran, le geste visé), glisser-déposer, ou choix de fichier.
Trois conséquences techniques à ne pas défaire :

- Le champ `image` doit rester **déclaré dans `forms.html`**, avec
  `enctype="multipart/form-data"` sur le `<form>`. Un champ ajouté seulement côté JS
  n'est pas vu au build, et le fichier repartirait dans le vide.
- L'envoi se fait en **`FormData`, sans en-tête `Content-Type`**. C'est le navigateur qui
  pose le multipart et sa frontière ; l'écrire à la main casse l'envoi côté Netlify.
- **Netlify plafonne la requête à 8 Mo et coupe à 30 s.** `site.js` réduit donc les images
  de plus de 1,5 Mo à 2000 px de large en JPEG 0,9 — mesuré : un PNG de 5,4 Mo en 3200 px
  descend à 1,7 Mo. Les petites images passent intactes. Au-delà de 7 Mo après réduction,
  l'envoi est refusé avec un message plutôt qu'un échec silencieux.

**Le chemin inverse existe aussi** (25/08) : `?rv=<sélecteur CSS>` sur n'importe quelle
page de la préversion amène le lecteur sur l'élément visé, le cerne du même liseré doré
pendant six secondes, puis retire le paramètre de la barre d'adresse. C'est ce qui rend
cliquable chaque ligne du rapport de retours envoyé à Nicolas : il ne cherche plus la
correction, elle vient à lui. Même garde-fou que le widget — inactif hors `*.netlify.app`.

**Sur mobile**, un doigt ne survole pas : le bouton ouvre un mode « désigner »
(bandeau en haut, en-tête masqué), et le tap suivant choisit l'élément au lieu de
suivre le lien — l'interception se fait en phase de capture. Le bouton est décalé
de `--cc-h`, la hauteur de la bannière cookies publiée par `site.js` : sans ce
décalage il se posait pile sur le bouton « Accept », or sur or, donc invisible.

## Formulaires Netlify — le piège qui ne fait pas de bruit

La détection de formulaires se fait **au build**, dans l'étape de post-traitement.
Tant qu'elle est désactivée, le log affiche `Skipping form detection` et **aucun
formulaire n'est enregistré** : les envois partent en 404 côté serveur, mais le
`fetch()` du widget ne le voit pas et affiche quand même « Got it — thank you ».
C'est resté ainsi jusqu'au 02/08 — pour le widget *et* pour le formulaire de
contact, la seule capture de prospect du site.

Deux conséquences pratiques :

- **Activer la détection ne suffit pas. Il faut redéployer.** Le réglage
  n'agit qu'au build suivant.
- **Après toute intervention sur l'hébergement, relire le log de déploiement** et
  vérifier la présence de `Post processing - Forms` suivi de `Processing form - audit`
  et `Processing form - review`. C'est la seule preuve que la chaîne tient.

Une notification email est en place sur l'adresse de service du projet, sur **tout**
formulaire — donc les retours de Nicolas comme les demandes d'audit. L'adresse exacte
est dans `NegoAsia-Projet.md` : ce dépôt est public, et une adresse écrite en clair
dans un fichier indexé par GitHub finit chez les moissonneurs.

**Le connecteur MCP Netlify ne voit pas ce projet.** Il est authentifié sur un autre
compte ; `negoasia-web` appartient à **Team Negoasia**, qui ne contient que lui. Ce que
le MCP renvoie concerne donc un autre compte — il a déjà ramené un `negoasia-preview`
annoncé « forms: not enabled », ce qui ressemble au piège ci-dessus mais ne dit
strictement rien du site en ligne. **Pour contrôler la chaîne réelle, ouvrir le log de
déploiement dans l'interface Netlify**, pas le MCP.

## Cache

Les noms de fichiers ne sont **pas** hachés. Le `netlify.toml` en tient compte : polices
figées un an, mais **CSS et JS en `must-revalidate`**. Ne jamais remettre un `max-age`
long sur `/assets/css/` ou `/assets/js/` sans mettre en place un hachage des noms — sinon
une correction de design ne parvient jamais aux visiteurs qui ont l'ancienne feuille en
cache. C'est arrivé le 01/08.

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
