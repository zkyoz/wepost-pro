# Preuves — Tâche 04

## Résumé

Le cœur textuel des publications couvre création, consultation, recherche, filtres, modification optimiste, duplication, archivage logique et transitions de statut. Chaque contenu sauvegardé possède un instantané versionné. L’agence et l’admin gèrent ; le client affecté lit uniquement.

## Code structurant

- migration `1784751000000_create_publications.ts` ;
- modèles `Publication` et `PublicationVersion` ;
- domaine pur `publication_lifecycle.ts` ;
- service de portée et de sérialisation `publication_service.ts` ;
- contrôleur, validateurs et sept routes REST ;
- pages Nuxt liste, création, détail et édition ;
- composable et formulaire Publications ;
- suites Japa, Vitest et parcours Playwright étendu.

## Migration

La migration crée `publications`, `publication_versions`, contraintes de statut/version, index d’agence/projet/statut et `audit_logs.target_publication_id`. Elle est réversible, appliquée localement et rejouée par `migration:fresh` en E2E.

## Résultats locaux du 22/07/2026

| Contrôle                                           | Résultat                            |
| -------------------------------------------------- | ----------------------------------- |
| API Japa                                           | 51/51                               |
| Frontend Vitest                                    | 30/30                               |
| Playwright                                         | 10/10, desktop et mobile            |
| API lignes / branches / fonctions                  | 89,80 % / 86,43 % / 89,47 %         |
| Domaine publications                               | 100 % lignes, branches et fonctions |
| Service publications lignes / branches / fonctions | 100 % / 76,92 % / 100 %             |
| Frontend lignes / branches / fonctions             | 91,01 % / 91,42 % / 81,57 %         |
| lint / format / typecheck                          | OK                                  |
| builds AdonisJS / Nuxt                             | OK                                  |

## Sécurité et observabilité vérifiées

- refus 403 des cinq mutations client ;
- 404 uniforme pour projet/publication hors agence ;
- falsification `agencyId`, `status` et `contentVersion` à la création sans effet ;
- contrôle de concurrence renvoyant 409 et la version courante ;
- audit transactionnel des créations, modifications, duplications, archivages et transitions ;
- journal structuré des transitions et durée des listes, sans contenu éditorial.

## Limites et preuves externes

La branche du contrôleur Publications mesure 66,66 %, tandis que le seuil global de branches est atteint à 86,43 % et le domaine critique est intégralement couvert. Les captures de recette, le SHA, la CI GitHub rouge/verte et les vérifications RGAA manuelles restent à joindre après commit et déploiement de préproduction.
