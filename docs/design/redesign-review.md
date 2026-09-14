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

- Vitest : 45 fichiers, 115 tests réussis. Couverture frontend : 84,96 % des
  lignes et 77,35 % des branches mesurées.
- Playwright : 24 tests réussis sur Chromium ordinateur et mobile, dont la
  persistance du thème, les contrastes et le parcours métier multi-rôle.
- ESLint et TypeScript : réussis.
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
