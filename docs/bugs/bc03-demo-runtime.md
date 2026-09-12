# Correctifs détectés pendant la répétition BC03

Branche : `codex/bc03-demo`, issue de `develop` puis avancée sur le travail
BC04 disponible au commit `3768382`. Environnement : Mac, Node.js 24, build
Nuxt/AdonisJS/worker, PostgreSQL 17 et Redis 7 locaux dédiés.

## Frontend compilé non interactif

Le HTML était renvoyé, mais la CSP bloquait le script inline d’initialisation
Nuxt et les appels à l’API sur son port distinct. Le mode développement ne
reproduisait pas ce défaut, car ce middleware n’y appliquait pas la CSP.

Le correctif calcule les empreintes SHA-256 des scripts inline au rendu Nitro
et autorise l’origine HTTP(S) configurée de l’API pour les requêtes et médias.
Il ne recourt pas à `unsafe-inline` pour les scripts. La directive de montée
vers HTTPS dépend de l’URL configurée du site, afin de conserver un profil
local HTTP utilisable.

Vérifications : tests `tests/public/security-headers.spec.ts`, build puis
connexion, navigation, création et décision client dans le navigateur.
Le serveur local partage aussi le fuseau du Mac pour éviter une divergence
de formatage des dates entre SSR et navigateur. Cela ne constitue pas une
correction universelle des fuseaux pour des visiteurs distants.

## Paramètres OAuth recopiés dans l’URL de retour

Les cinq callbacks retournaient une redirection contenant en plus `code` et
`state`. Sur Facebook, le compte était connecté mais l’URL finale comprenait
deux points d’interrogation. La configuration AdonisJS transmet par défaut
la query string courante lors d’une redirection.

Les cinq callbacks utilisent maintenant `redirect().withQs(false).toPath(...)`.
Les cinq tests HTTP OAuth vérifient exactement l’en-tête `Location` attendu.
Avant correction : **190 tests réussis, 5 en échec** avec ces assertions.
Après correction : **195 tests réussis**. La connexion Facebook a également
été rejouée dans le navigateur, avec l’URL finale attendue, sans `code/state`.

Source technique : [redirections AdonisJS](https://docs.adonisjs.com/guides/basics/response#forwarding-query-strings).

## Médias locaux perdus au redémarrage

Le pilote local utilisait uniquement une Map en mémoire, contrairement aux
métadonnées enregistrées dans PostgreSQL. Un redémarrage faisait donc perdre
les octets. Le profil oral configure maintenant un répertoire privé local.
L’écriture utilise un nom haché, un fichier temporaire et un renommage ; les
fichiers ont des permissions `0600`. La clé métier n’est jamais interprétée
comme un chemin disque. Ce petit stockage synchrone est destiné au local,
pas à une charge de production. Le pilote R2 reste inchangé.

Deux tests vérifient la relecture depuis une nouvelle instance, la suppression,
la protection des chemins, les permissions et le remplacement d’un objet.
La suite API complète passe alors à **197 tests réussis**.

## Notifications sans fournisseur prêt

Le worker conserve la file BullMQ et le rendu réels des messages. Le pilote
`file` capture les messages sans envoi externe et évite les doublons par clé
d’idempotence. Il est refusé hors développement ou avec une base/Redis non
locaux. Le pilote Resend reste le défaut hors profil oral. Trois tests ajoutés
couvrent ces règles. La suite worker compte **100 tests réussis**.

## État de validation

- Tests web : **106 réussis**, 44 fichiers.
- Tests API : **197 réussis** après ajout du stockage persistant.
- Tests worker : **100 réussis**, 9 fichiers.
- Builds web, API, worker réussis ; lint, TypeScript et formatage vérifiés.
- Documentation OpenAPI synchronisée : 146 routes.
- Parcours interactif : création, commentaire, approbation client, connexion
  OAuth simulée, programmation et tentative de publication réussie.
- Pas de push, de PR ni de passage en production déclaré par ce document.
- Pas de preuve d’envoi social/e-mail réel, d’audit RGAA complet ou de CI
  distante sur ces changements. Les captures de répétition sont conservées
  hors du dépôt, dans le dossier `output/playwright` de l’espace Diplome.

Le média ajouté sur le profil persistant reste affiché après un arrêt et un
redémarrage des trois applications. La vue liste du calendrier contient les
six publications de répétition ; aucun débordement horizontal global n’est
observé au viewport 390 × 844. Le menu mobile possède son propre défilement.

### Dépendances : contrôle non validé

L’audit npm de cette répétition signale **9 avis : 4 élevés et 5 modérés**.
Les alertes élevées concernent Browserslist (deux avis), js-yaml et SVGO,
présents dans l’outillage de construction/lint. Les autres concernent qs,
Vitest et SVGO. La présence dans le graphe ne démontre pas à elle seule une
exploitation de l’application. Aucune mise à jour du lockfile n’a été faite
dans ces correctifs fonctionnels.

Ce contrôle empêche de déclarer la chaîne complète verte ou prête à fusionner.
Prévoir une mise à jour ciblée, les tests et un nouvel audit avant la PR de
livraison ; ne pas désactiver le contrôle CI. Gitleaks et la CI distante n’ont
pas été exécutés sur ces changements.
