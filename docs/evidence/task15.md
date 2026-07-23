# Preuves — Tâche 15

## Résumé

La tâche ajoute des statistiques bornées par agence et période, des définitions métier explicites, un export CSV sécurisé et une interface Nuxt accessible. Les données distantes indisponibles restent à `N/A`.

## Code structurant

- domaine, contrôleur, service et validateur dans `apps/api/app/domain/statistics`, `controllers`, `services/statistics` et `validators` ;
- migration `1784778000000_add_statistics_indexes.ts` ;
- routes `/api/v1/statistics` et `/api/v1/statistics/export.csv` ;
- page `/statistics`, composable, types et composant de graphique/tableau Nuxt ;
- tests Japa, Vitest et parcours Playwright.

## Résultats locaux du 23/07/2026

| Contrôle                          | Résultat                                                            |
| --------------------------------- | ------------------------------------------------------------------- |
| API Japa                          | 146/146                                                             |
| Frontend Vitest complet           | 73/73                                                               |
| Worker Vitest                     | 90/90                                                               |
| Playwright Task 15                | 1/1 Chromium : filtre, export CSV, axe et capture                   |
| Performance 20 × 40               | 3,22 ms pour 800 publications                                       |
| Couverture API                    | lignes 87,35 %, branches 72,03 %, fonctions 81,93 %                 |
| Couverture frontend               | lignes 83,19 %, branches 87,50 %, fonctions 73,23 %                 |
| Couverture worker                 | lignes 92,79 %, branches 81,54 %, fonctions 87,06 %                 |
| Format, lint, typecheck et builds | OK                                                                  |
| Capture desktop                   | `docs/evidence/task15/screenshots/statistics-dashboard-desktop.png` |

## Contrôle visuel

La capture Task 15 a été comparée à la référence acceptée Task 14 sur cinq points : shell et largeur de navigation, hiérarchie du titre, traitement des filtres, cartes blanches avec ombre légère, et tableaux avec bordures sobres. La copie change volontairement de la supervision opérationnelle vers les métriques et leurs définitions. La principale déviation est une page plus verticale, nécessaire pour fournir les trois alternatives tabulaires complètes aux graphiques.

La recette préproduction, les contrôles RGAA manuels, la CI, les captures complémentaires et le SHA restent manuels.
