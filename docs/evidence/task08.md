# Preuves — Tâche 08

## Résumé

La publication Facebook comprend une connexion OAuth de Page, le chiffrement AES-256-GCM des tokens, une programmation versionnée/idempotente et un worker BullMQ qui publie le texte ou les médias privés via un adaptateur Graph API. Les tests utilisent exclusivement des adaptateurs simulés.

## Code structurant

- migration `1784763000000_create_social_publishing_tables.ts` ;
- modèles `SocialAccount`, `ScheduledPublication` et `PublicationAttempt` ;
- domaine `app/domain/social/facebook.ts`, contrôleur, validateurs, service OAuth et producteur BullMQ ;
- worker `src/social/*` avec adaptateur Facebook réel/mock, dépôt PostgreSQL, déchiffrement et lecture R2 ;
- composant `FacebookPublishingPanel`, page `/settings/facebook` et composable Nuxt ;
- tests Japa, Vitest et parcours Playwright étendu.

## Résultats locaux du 22/07/2026

| Contrôle                                           | Résultat                    |
| -------------------------------------------------- | --------------------------- |
| API Japa                                           | 84/84                       |
| Frontend Vitest                                    | 47/47                       |
| Worker Vitest                                      | 28/28                       |
| Playwright                                         | 10/10, desktop et mobile    |
| Couverture API lignes / branches / fonctions       | 90,18 % / 74,75 % / 86,36 % |
| Domaine Facebook API lignes / branches / fonctions | 88,80 % / 61,29 % / 100 %   |
| Couverture frontend lignes / branches / fonctions  | 89,20 % / 84,61 % / 79,26 % |
| Couverture worker lignes / branches / fonctions    | 95,39 % / 87,59 % / 96,55 % |
| lint / format / typecheck / builds                 | OK                          |
| `pnpm audit --audit-level high`                    | aucune vulnérabilité connue |

## Preuves externes restantes

Ajouter le SHA, les runs CI rouge/vert, les captures fonctionnelles, l’identifiant d’une Page de test Meta, les permissions validées lors de l’App Review, un post texte/image/vidéo réel non dupliqué et la recette préproduction. Ne jamais capturer la valeur d’un token, d’un cookie ou de `SOCIAL_TOKEN_ENCRYPTION_KEY`.
