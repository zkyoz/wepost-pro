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

### Complément BC03 — Instagram Login réel

La répétition locale a parcouru le brouillon, l’association d’un JPEG, la soumission,
l’approbation via le rôle Client Démo et la programmation via le rôle Agence Démo.
Ces rôles ont été opérés pour le test : ce n’est pas un retour client externe.

- Publication : `3bbfd7e6-1373-4201-914a-860afd5108ef`, version 1.
- Programmation : `4b8489aa-b8a2-4d3e-96fa-619485be4de6`.
- PostgreSQL : `published`, une tentative `success`, aucun code d’erreur.
- Identifiant Instagram : `17911001742285939`.
- [Post vérifié dans Instagram](https://www.instagram.com/p/DdPgH0hjnRW/) : image
  et légende « Publication test depuis WePost. ». Le propriétaire peut supprimer ce test.
- L’API officielle confirme `media_type=IMAGE`, l’identifiant et le permalink.
- Worker : 110 tests réussis ; API Instagram : 5 tests HTTP réussis ; builds des
  trois applications, lint et TypeScript réussis avant le test réel.

Le token Instagram Login a été autorisé dans Meta et importé par une commande
réservée à `wepost_demo`. Il est stocké chiffré. Les endpoints `me` et
`content_publishing_limit` ont été vérifiés ; l’inventaire des scopes et l’expiration
n’ont pas été fournis. Ce test ne valide pas le bouton OAuth Facebook Login.

Le visuel du test LinkedIn a été converti en JPEG 1080 × 1350 avec marges pour
conserver tout le contenu. Seul ce JPEG a été exposé ; serveur et tunnel ont été
fermés après publication. Ce lien temporaire n’est pas un stockage de production.
La vidéo réelle, l’App Review pour des utilisateurs externes et la recette de
préproduction restent des validations distinctes.

Compléter les preuves de CI, vidéo réelle, métriques 24 h et préproduction pour
les périmètres non couverts ci-dessus. Ne jamais capturer de token ni de clé.
