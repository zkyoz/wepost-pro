# Blocages CI de la branche de démonstration

## Chargement des commandes AdonisJS

Le run [34771219535](https://github.com/zkyoz/wepost-pro/actions/runs/34771219535)
utilise Node 24.20.0 et échoue avant les tests API : `Invalid command exported
from "backup_database.js" file. Invalid URL`. Le premier fichier chargé n'est
pas la cause : Ace 14.1.0 utilise un schéma sans URI de base stable.

Le défaut correspond à [adonisjs/ace#169](https://github.com/adonisjs/ace/issues/169).
La [correction officielle #170](https://github.com/adonisjs/ace/pull/170),
publiée dans Ace 14.1.1, définit un identifiant de schéma. Un override ciblé
remplace uniquement 14.1.0. La cible Node reste 24 ; aucun test ni seuil de
couverture n'est désactivé. Les tests API démarrent les commandes de migration
et couvrent donc ce chargement.

## Extraction des scripts pour la CSP

CodeQL signale `js/bad-tag-filter` dans `public-security.ts` : l'ancienne
expression ne reconnaît pas des fermetures HTML telles que
`</script\t\n bar>`. L'extraction utilise maintenant le parseur HTML parse5.
Les scripts externes et le contenu inerte des commentaires, textarea et
templates ne sont pas ajoutés aux empreintes. Les tests couvrent les balises
atypiques, les attributs contenant `>` et les scripts Nuxt usuels.

Cette fonction calcule les empreintes du HTML rendu par le serveur ; ce n'est
pas un assainisseur de contenu utilisateur. Elle ne remplace pas l'échappement
des données non fiables. Aucun changement d'interface, de permission métier
ou de schéma de données n'est nécessaire. Le rollback consiste à rétablir
les dépendances et les deux fichiers concernés, mais réintroduirait les
défauts décrits.

Sources : [parse5](https://parse5.js.org/functions/parse5.parse.html) et
[release Ace 14.1.1](https://github.com/adonisjs/ace/releases/tag/v14.1.1).

## Vérifications locales du correctif

- Suite API complète réussie sur la base isolée `wepost_test` : couverture
  des lignes 86,57 %, des branches 72,19 %.
- Suite web : 111 tests réussis, dont six tests des en-têtes CSP ; couverture
  des lignes 84,67 %, des branches 76,77 %.
- Lint web, vérification TypeScript web et build Nuxt réussis.
- Aucun secret ou token Instagram inclus dans le changement.

## Synchronisation du parcours OAuth mobile

Le run [34779995683](https://github.com/zkyoz/wepost-pro/actions/runs/34779995683)
valide la qualité, les tests API/web/worker, les builds et les analyses de
sécurité. Le parcours mobile échoue pendant axe avec `Execution context was
destroyed`, puis les nouvelles tentatives rencontrent des publications portant
le même nom.

Les comptes LinkedIn simulés sont partagés entre les parcours desktop et
mobile. Leur présence ne prouve donc pas la fin d'une nouvelle connexion OAuth.
Le test attend désormais une nouvelle navigation du document principal vers
la page de succès puis l'hydratation Nuxt avant de poursuivre. Les inscriptions,
projets, publications et contenus médias utilisent un identifiant propre à
chaque tentative, afin de ne pas sélectionner les données d'un essai précédent.

Les assertions métier et axe, le délai maximal, les projets desktop/mobile
et les seuils de couverture restent inchangés. Aucun code applicatif ni aucune
donnée de démonstration n'est modifié.

Validation locale : le parcours collaboratif complet mobile réussit deux fois
consécutivement (`--repeat-each=2 --retries=0`) sur `wepost_test`, y compris la
reconnexion des comptes déjà présents et les analyses axe. Le lint et le
typecheck web réussissent également. La CI distante doit être relancée sur
le commit de correction avant de déclarer la validation terminée.
