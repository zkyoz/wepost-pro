# Preuves — Tâche 07

## Résumé

La collaboration par publication comprend un fil de commentaires en texte brut, des revues client versionnées, des notifications persistantes et un worker BullMQ séparé qui envoie des e-mails Resend minimaux avec idempotence.

## Code structurant

- migration `1784760000000_create_collaboration_tables.ts` ;
- domaine `app/domain/collaboration/review.ts` ;
- contrôleurs Discussion, Comments, Reviews et Notifications ;
- service de destinataires et producteur BullMQ ;
- `apps/worker` avec processeur, dépôt PostgreSQL, template HTML/texte et adaptateur Resend ;
- composant `PublicationDiscussion`, page `/notifications` et composable Nuxt ;
- suites Japa, Vitest et parcours Playwright étendu.

## Résultats locaux du 22/07/2026

| Contrôle                                            | Résultat                    |
| --------------------------------------------------- | --------------------------- |
| API Japa                                            | 74/74                       |
| Frontend Vitest                                     | 43/43                       |
| Worker Vitest                                       | 8/8                         |
| Playwright                                          | 10/10, desktop et mobile    |
| Couverture API lignes / branches / fonctions        | 86,73 % / 77,55 % / 87,06 % |
| Domaine collaboration lignes / branches / fonctions | 100 % / 100 % / 100 %       |
| Contrôleur Reviews lignes / branches / fonctions    | 91,05 % / 76,47 % / 100 %   |
| Couverture frontend lignes / branches / fonctions   | 90,96 % / 82,35 % / 82,19 % |
| Cœur worker lignes / branches / fonctions           | 96,77 % / 78,57 % / 100 %   |
| lint / format / typecheck / builds                  | OK                          |

## Cas de bogue et non-régression — `COL-BUG-01`

- Détection : le premier parcours Playwright client déclenchait `Cannot read properties of null (reading 'role')` pendant l’hydratation.
- Criticité : majeure, la fiche publication pouvait ne plus se rendre après une reconnexion.
- Cause racine : le template utilisait `user!.role` alors que l’état d’authentification Nuxt peut être brièvement `null` pendant l’hydratation.
- Correctif : rendre `PublicationDiscussion` uniquement lorsque `user` est disponible et n’activer ses actions qu’après `onMounted`.
- Non-régression : 43 tests frontend et le parcours complet Playwright 10/10, desktop/mobile.
- Recette : validation locale OK ; confirmation préproduction à faire.

## Preuves externes restantes

Ajouter SHA, runs CI, captures fonctionnelles, réception réelle via un domaine Resend vérifié, attributs du job BullMQ sans données sensibles et recette VoiceOver/320 px/200 %.
