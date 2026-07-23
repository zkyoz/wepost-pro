# Preuves — Tâche 18

## Résumé

La tâche ajoute des annotations point et rectangle sur un média privé. Chaque annotation est figée sur la version courante de la publication et l’empreinte immuable du média. Le texte chronologique reste la source de vérité accessible ; une annotation d’une ancienne version demeure consultable comme historique et disparaît de l’overlay actif.

## Code structurant

- migration `1784787000000_create_annotations.ts`, modèle Lucid et contraintes PostgreSQL ;
- domaine de coordonnées normalisées, service transactionnel, contrôleur, validateurs et routes protégées ;
- autorisations projet, propriété de l’auteur, modération admin et audits sans corps de texte ;
- visionneuse Nuxt avec overlay HTML, formulaire clavier complet et liste textuelle synchronisée ;
- liens optionnels annotation/commentaire et URLs média signées réutilisées ;
- tests Japa, Vitest et parcours Playwright Chromium desktop/mobile.

## Résultats locaux du 23/07/2026

| Contrôle                   | Résultat                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------- |
| API Japa complet           | 166/166, dont 6 tests Task 18                                                       |
| Frontend Vitest complet    | 83/83, dont 3 tests Task 18                                                         |
| Worker Vitest complet      | 95/95                                                                               |
| Playwright Task 18         | parcours critique Chromium desktop et mobile : point, rectangle clavier, historique |
| Migration locale           | appliquée ; schéma Lucid régénéré                                                   |
| Couverture API             | lignes 83,62 %, branches 71,84 %, fonctions 80,33 %                                 |
| Couverture frontend        | lignes 84,75 %, branches 85,50 %, fonctions 76,82 %                                 |
| Couverture worker          | lignes 92,23 %, branches 81,52 %, fonctions 86,29 %                                 |
| Domaine/service annotation | domaine 100 % ; service 98,86 % lignes et 100 % fonctions                           |
| Typecheck, lint et format  | API, frontend et worker OK                                                          |
| Builds                     | API, frontend et worker OK                                                          |
| Capture desktop            | `docs/evidence/task18/screenshots/annotations-desktop.png`                          |

## Contrôle visuel

La capture Task 18 a été comparée à la référence Task 17 sur cinq points : palette bleu nuit/corail, typographie et hiérarchie des titres, grille principale à deux colonnes, surfaces claires bordées et annonces d’état bleutées. La visionneuse grise du fixture représente correctement le média de test ; la liste textuelle devient une colonne unique sous l’outil et le formulaire se replie sous le média sur petit écran. Les marqueurs numérotés et les mentions « Historique — version » sont les seuls motifs nouveaux imposés par la fonctionnalité.

Deux défauts détectés pendant le parcours ont été corrigés : l’arrondi de coordonnées pouvait dépasser une contrainte SQL et la transition de couleur d’un bouton désactivé provoquait un contraste transitoire insuffisant. Les deux cas ont désormais un test de non-régression dans le parcours.

La recette préproduction, VoiceOver, zoom 200 %, reflow exact à 320 px, CI, SHA et captures réelles de média restent manuels.
