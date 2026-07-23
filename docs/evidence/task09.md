# Preuves — Tâche 09

## Résumé

La publication Instagram réutilise le socle social de la tâche 08 : connexion OAuth Meta d’un compte Business/Creator lié à une Page, tokens AES-256-GCM, programmation versionnée/idempotente et worker BullMQ. L’adaptateur réel signe le média R2 privé, crée un conteneur, attend son traitement puis le publie. La CI et les tests n’appellent jamais Meta.

## Code structurant

- domaine, contrôleur, validateurs, client OAuth, service et producteur `instagram` dans `apps/api` ;
- adaptateur, fournisseur d’URL R2 et processeur Instagram dans `apps/worker/src/social` ;
- page `/settings/instagram`, composable et panneau de publication dans `apps/web` ;
- modèles sociaux élargis à `facebook | instagram` et agrégation du statut multi-réseaux ;
- tests Japa, Vitest et parcours Playwright desktop/mobile.

## Migration

Aucune nouvelle migration : `1784763000000_create_social_publishing_tables.ts`, créée en tâche 08, autorisait déjà `instagram` et fournit les contraintes/index nécessaires.

## Résultats locaux du 22/07/2026

| Contrôle                                            | Résultat                    |
| --------------------------------------------------- | --------------------------- |
| API Japa                                            | 93/93                       |
| Frontend Vitest                                     | 51/51                       |
| Worker Vitest                                       | 44/44, dont 16 Instagram    |
| Playwright                                          | 10/10, desktop et mobile    |
| Couverture API lignes / branches / fonctions        | 83,25 % / 71,63 % / 81,59 % |
| Domaine Instagram API lignes / branches / fonctions | 90,32 % / 67,85 % / 100 %   |
| Couverture frontend lignes / branches / fonctions   | 87,63 % / 84,90 % / 76,92 % |
| Couverture worker lignes / branches / fonctions     | 92,08 % / 81,17 % / 90,38 % |
| lint / format / typecheck / builds                  | OK                          |
| `pnpm audit --audit-level high`                     | aucune vulnérabilité connue |

## Preuves externes restantes

Ajouter le SHA, les runs CI rouge/vert, les captures de connexion/validation/statut, l’App Review, un compte professionnel de test, une image et une vidéo réellement publiées sans duplication, les métriques 24 h et la recette préproduction. Ne jamais capturer un token, une URL R2 signée ou la clé de chiffrement.
