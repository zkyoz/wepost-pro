# Preuves — Tâche 10

## Résumé

La publication LinkedIn réutilise le socle social commun : OAuth 3-legged, organisation cible explicite, tokens AES-256-GCM, programmation versionnée/idempotente et worker BullMQ. L’adaptateur appelle l’API REST LinkedIn Posts et, pour une image R2 privée, initialise un upload LinkedIn avant de créer le post. Les appels externes sont intégralement simulés en test.

## Code structurant

- domaine, contrôleur, validateurs, client OAuth, service et producteur `linkedin` dans `apps/api` ;
- adaptateur Posts API, upload privé et processeur LinkedIn dans `apps/worker/src/social` ;
- page `/settings/linkedin`, composable et panneau de publication dans `apps/web` ;
- modèles sociaux élargis à `facebook | instagram | linkedin` et agrégation multi-réseaux conservée ;
- tests Japa, Vitest et scénario Playwright desktop/mobile.

## Migration

Aucune nouvelle migration : `1784763000000_create_social_publishing_tables.ts`, créée en tâche 08, autorisait déjà `linkedin` et fournit les tables, contraintes et index nécessaires.

## Résultats locaux du 22/07/2026

| Contrôle                                      | Résultat                    |
| --------------------------------------------- | --------------------------- |
| API Japa                                      | 102/102                     |
| Frontend Vitest                               | 55/55                       |
| Worker Vitest                                 | 61/61                       |
| Playwright                                    | 10/10, desktop et mobile    |
| Couverture API lignes / branches / fonctions  | 86,73 % / 70,00 % / 82,19 % |
| Couverture frontend lignes/branches/fonctions | 86,29 % / 85,18 % / 75,24 % |
| Couverture worker lignes/branches/fonctions   | 90,69 % / 78,67 % / 86,11 % |
| Typecheck API / frontend / worker             | OK                          |

Le scénario E2E LinkedIn et son scan axe sont intégrés au parcours multi-réseaux exécuté sur Chromium desktop et mobile.

## Preuves externes restantes

Ajouter le SHA, les runs CI rouge/vert, les captures de connexion/validation/statut, l’approbation du produit LinkedIn requis, une organisation de test, un texte et une image réellement publiés sans duplication, les métriques 24 h et la recette préproduction. Ne jamais capturer un token, une URL d’upload ou la clé de chiffrement.

## Extension BC03 — résultats de la branche de démonstration

- API : 204 tests ; couverture lignes 86,55 %, branches 71,82 %.
- Frontend : 109 tests ; couverture lignes 84,67 %, branches 76,77 %.
- Worker : 106 tests ; couverture lignes 92,26 %, branches 81,69 %.
- Lanceur réel : deux tests Node, sans appel réseau, ajoutés au workflow CI.
- Lint, TypeScript, builds API/Nuxt/worker et synchronisation OpenAPI : réussis localement.
- Parcours navigateur local : connexion agence, choix Page/personnel, callback
  simulé et affichage du profil avec ses scopes ; contrôle console sans erreur
  ni avertissement durant ce parcours. La confirmation d’envoi réel est
  testée avec une réponse simulée, sans publication externe.

Les pourcentages correspondent au périmètre des outils de couverture actuels,
pas à une conformité RGAA ni à une preuve d’autorisation LinkedIn. Le scénario
E2E existant a été adapté aux deux cibles ; sa nouvelle exécution complète en
CI reste à vérifier. Cette branche n’est pas fusionnée dans develop/main et
n’est pas déployée en production.
