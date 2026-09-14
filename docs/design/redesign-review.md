# Refonte de l'interface

## Périmètre

Refonte visuelle du frontend Nuxt, sans modification des contrats API, des
traitements du worker, du stockage des médias ou des autorisations sociales.
Les composants partagés appliquent la palette sur les pages publiques,
l'authentification et l'ensemble des espaces privés.

## Conception et implémentation

| Point de comparaison | Choix réalisé                                                                       |
| -------------------- | ----------------------------------------------------------------------------------- |
| Navigation           | Barre anthracite sur ordinateur, panneau Nuxt UI sur mobile.                        |
| Hiérarchie           | Titres courts, actions regroupées, sections et espacements réguliers.               |
| Tableau de bord      | Indicateurs compacts, agenda principal et projets récents latéraux.                 |
| Publication          | Contenu et métadonnées séparés, navigation par sections, outils avancés dépliables. |
| Calendrier           | Grille sobre sur ordinateur, liste lisible sur petit écran, export dépliable.       |
| Palette              | Orange #F2590D, anthracite #2F343A, noir #000000, sauge #BBD9D1.                    |
| Deux thèmes          | Surfaces, texte, formulaires et états harmonisés ; préférence persistante.          |
| Ressources           | Inter, Lucide et Simple Icons servis localement, sans CDN d'icônes ou de police.    |

Trois concepts ont guidé la composition : tableau de bord clair, publication
claire et calendrier sombre. Le vert sauge demandé remplace le bleu de la
première proposition. Les boutons orange utilisent un texte foncé pour leur
contraste. Les sections de publication restent montées pour conserver l'état
des formulaires et des outils, plutôt que d'être démontées à chaque onglet.

## Vérification

- Vitest : 46 fichiers, 117 tests réussis. Couverture frontend : 84,96 % des
  lignes et 77,35 % des branches mesurées.
- Playwright : 30 tests réussis sur Chromium ordinateur et mobile, dont la
  persistance du thème, les contrastes et le parcours métier multi-rôle.
- ESLint et TypeScript : réussis.
- Formatage Prettier et build Nuxt compilé : réussis.
- Audit des dépendances de production : aucun niveau haut ou critique ; deux
  alertes modérées sur `qs` et une faible sur `esbuild` transitif restent
  signalées. Le module Nuxt Fonts est désactivé et les polices sont locales ;
  cela ne supprime pas l'alerte du graphe de dépendances.

Les tests de thème et les parcours métier utilisent une base `wepost_test`
séparée des données de démonstration. Les tests E2E utilisent des fournisseurs
simulés : leur réussite ne constitue pas une nouvelle publication réelle.
Les connexions LinkedIn/Instagram et le stockage R2 du profil de démonstration
ne sont pas réinitialisés par la refonte.

Les pages HTML publiques sont rendues côté serveur par requête pour lire la
préférence de thème. `robots.txt` et le sitemap restent prérendus. Aucune
directive de sécurité des scripts n'a été assouplie pour le changement de thème.

Les captures de cette refonte sont distinctes des anciennes preuves RNCP.
Les nouveaux runs E2E déposent leurs captures dans leurs artefacts de test,
sans écraser les fichiers historiques de `docs/evidence`.
Les contrôles automatisés axe portent sur les violations sérieuses et critiques
des écrans testés ; ils ne remplacent pas un audit RGAA manuel complet.

## Corrections après audit visuel

L'audit du build `208297c` a identifié des problèmes d'interface corrigés sans
modifier les contrats API, les droits ou les règles de publication :

| Défaut observé                                       | Correction                                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Six messages d'hydratation sur la supervision        | Instantané SSR partagé avec `useAsyncData`, date formatée dans un fuseau explicite. |
| Dialogues placés en haut à gauche                    | Centrage, taille limitée au viewport, défilement interne et titre accessible.       |
| Débordement à 320 pixels dans la gestion des comptes | Labels invisibles contenus dans le tableau défilant, sans perte d'accessibilité.    |
| Panneau de validation client illisible en sombre     | Couleurs de texte et de surface adaptées au thème.                                  |
| Titres de fonctionnalités peu ou pas visibles        | Couleurs de texte corrigées dans les deux thèmes.                                   |
| Bouton principal remplacé par un bouton neutre       | Spécificité du sélecteur générique diminuée.                                        |
| Badges « Désactivé » peu contrastés en sombre        | Fond sémantique compatible avec la couleur de texte.                                |
| Erreur 404 sans identité visuelle                    | Page d'erreur avec thème mémorisé, message générique et retour à l'accueil.         |

Les tests supplémentaires couvrent le contraste des titres et de la décision
client, les dialogues aux largeurs 320/390/1440 pixels, le focus après fermeture,
la page 404 et le chargement de la supervision sans double requête. Les erreurs
d'hydratation et exceptions navigateur font échouer les tests d'apparence.
Le bouton d'actualisation de la supervision conserve un appel API réel.

Sur le profil compilé de démonstration, six rechargements de `/admin/system`
(clair/sombre, largeurs 320, 390 et 1440 pixels) ont affiché les sept composants
sans avertissement d'hydratation ni exception navigateur. L'actualisation
manuelle met bien à jour l'instantané. Les dialogues ont été ouverts puis
annulés et le panneau de décision a été contrôlé avec le compte client,
sans approuver ni publier de contenu. À 320 pixels, la largeur défilante
globale est bien de 320 pixels ; le tableau conserve son défilement interne.

Ces corrections sont locales : aucun nouveau résultat de CI distante n'est
encore revendiqué. Les vérifications couvrent Chromium et son émulation mobile,
pas Safari/Firefox ni un appareil mobile physique.

La couverture ci-dessus porte sur les composables, middlewares et utilitaires
inclus par la configuration Vitest, pas sur tous les pixels ou tous les états
possibles de l'interface. Les contrôles navigateur complètent cette couverture.

## Captures du build de démonstration

- [Tableau de bord clair](redesign/screenshots/dashboard-light.jpg).
- [Tableau de bord sombre](redesign/screenshots/dashboard-dark.jpg).
- [Fiche publication](redesign/screenshots/publication-light.jpg).
- [Calendrier sombre](redesign/screenshots/calendar-dark.jpg).
- [Navigation mobile](redesign/screenshots/mobile-navigation-dark.jpg).
- [Connexion LinkedIn sur mobile](redesign/screenshots/linkedin-mobile-dark.jpg).

Le build compilé a été ouvert dans le navigateur avec le compte agence de
démonstration. Le changement de thème, la navigation vers une publication,
le calendrier et le panneau mobile ont été contrôlés. Les comptes sociaux
existants sont toujours présents. Aucune publication sociale n'a été créée
ou supprimée pour cette vérification visuelle.
