# Preuves — Tâche 14

## Résumé

La tâche ajoute une supervision métier bornée par agence, six catégories cohérentes, des filtres persistés, une action de lecture et une interface Nuxt accessible.

## Code structurant

- domaine, contrôleur, service et validateurs dans `apps/api/app/domain/supervision`, `controllers`, `services/supervision` et `validators` ;
- migration `1784775000000_add_supervision_indexes.ts` ;
- page `/supervision`, composable, types et composant de synthèse Nuxt ;
- tests unitaires, Japa, Vitest et parcours Playwright.

## Résultats locaux du 23/07/2026

| Contrôle                          | Résultat                                                             |
| --------------------------------- | -------------------------------------------------------------------- |
| API Japa                          | 138/138                                                              |
| Frontend Vitest                   | 71/71                                                                |
| Worker Vitest                     | 90/90                                                                |
| Playwright Task 14                | 1/1 Chromium : commentaire, supervision, axe et marquage lu          |
| Performance 20 × 40               | 5,88 ms pour la synthèse de 800 publications                         |
| Couverture API                    | lignes 82,74 %, branches 71,19 %, fonctions 79,01 %                  |
| Couverture frontend               | lignes 82,84 %, branches 87,30 %, fonctions 72,26 %                  |
| Couverture worker                 | lignes 92,79 %, branches 81,54 %, fonctions 87,06 %                  |
| Capture desktop                   | `docs/evidence/task14/screenshots/supervision-dashboard-desktop.png` |
| Format, lint, typecheck et builds | OK                                                                   |

La recette préproduction, les contrôles RGAA manuels, la vérification navigateur mobile, les captures complémentaires, la CI et le SHA restent manuels.
