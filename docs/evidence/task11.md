# Preuves — Tâche 11

## Résumé

La publication Pinterest réutilise le socle social commun : OAuth, compte et tableaux, tokens AES-256-GCM, programmation versionnée/idempotente et worker BullMQ. L’adaptateur crée un Pin image avec l’API v5 depuis une URL R2 privée signée. Tous les appels externes sont simulés dans les tests.

## Code structurant

- domaine, contrôleur, validateurs, client OAuth, service et producteur Pinterest dans `apps/api` ;
- adaptateur API v5, URL média privée et processeur dans `apps/worker/src/social` ;
- page `/settings/pinterest`, composable et panneau de publication dans `apps/web` ;
- payload Pinterest figé dans `scheduled_publications.network_payload_json` ;
- tests Japa, Vitest et parcours Playwright desktop/mobile.

## Migration

`1784766000000_add_social_network_payload.ts` ajoute le JSONB non nul `network_payload_json` avec `{}` par défaut et un `down` réversible. Il mémorise le tableau, le titre, la description et le lien réellement programmés, indépendamment du contenu modifié ensuite.

## Résultats locaux du 22/07/2026

| Contrôle                                          | Résultat                    |
| ------------------------------------------------- | --------------------------- |
| API Japa                                          | 114/114                     |
| Frontend Vitest                                   | 59/59                       |
| Worker Vitest                                     | 77/77                       |
| Playwright                                        | 10/10, desktop et mobile    |
| Couverture API lignes / branches / fonctions      | 86,28 % / 71,32 % / 80,82 % |
| Couverture frontend lignes / branches / fonctions | 85,09 % / 85,45 % / 73,87 % |
| Couverture worker lignes / branches / fonctions   | 92,13 % / 80,54 % / 86,81 % |
| Typecheck API/frontend/worker                     | OK                          |
| ESLint / format Prettier                          | OK                          |
| Builds API/frontend/worker                        | OK                          |
| Audit des dépendances                             | aucune vulnérabilité connue |

Le premier passage de couverture API a bloqué à 67,73 % de branches. Les cas Pinterest manquants ont été ajoutés sans abaisser le seuil ; le second passage atteint 71,32 %. Le harnais worker inclut explicitement l’adaptateur et le processeur Pinterest ; l’adaptateur atteint 100 % de lignes et 92 % de branches.

## Preuves externes restantes

Ajouter le SHA, les runs CI rouge/vert, les captures, l’approbation de l’application Pinterest, un tableau de test, un Pin réellement publié sans duplication, les métriques 24 h et la recette préproduction. Ne jamais capturer token, URL R2 signée ou clé de chiffrement.
