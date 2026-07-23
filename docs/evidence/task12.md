# Preuves — Tâche 12

## Résumé

La tâche ajoute OAuth TikTok, capacités créateur, Direct Post vidéo, stockage immédiat du `publish_id`, suivi asynchrone et reprise idempotente. L’API, Nuxt et le worker ont chacun un mode test sans appel réel.

## Code structurant

- domaine, contrôleur, validateurs, OAuth, service et file TikTok dans `apps/api` ;
- adaptateur officiel/mock et processeur dans `apps/worker/src/social` ;
- page `/settings/tiktok`, composable et panneau dans `apps/web` ;
- migration `1784769000000_add_tiktok_provider_tracking.ts` ;
- tests Japa, Vitest et scénario Playwright.

## Résultats locaux du 23/07/2026

| Contrôle                                          | Résultat                    |
| ------------------------------------------------- | --------------------------- |
| API Japa                                          | 125/125                     |
| Frontend Vitest                                   | 63/63                       |
| Worker Vitest                                     | 90/90                       |
| Playwright                                        | 10/10, desktop et mobile    |
| Couverture API lignes / branches / fonctions      | 82,10 % / 71,07 % / 77,87 % |
| Couverture frontend lignes / branches / fonctions | 84,01 % / 85,71 % / 72,72 % |
| Couverture worker lignes / branches / fonctions   | 92,79 % / 81,54 % / 87,06 % |
| Typecheck API/frontend/worker                     | OK                          |
| ESLint                                            | OK                          |
| Builds API/frontend/worker                        | OK                          |
| Audit des dépendances                             | aucune vulnérabilité connue |

La publication réelle, les captures, runs CI, SHA, métriques 24 h et recette préproduction restent manuels.
