# Preuves — Tâche 03

## Résumé

Le CRUD projet couvre la liste, la recherche, les filtres, la pagination, la création, le détail, la modification, l’archivage logique et la réactivation. Le client principal et les membres sont isolés par agence et les trois rôles appliquent la matrice de la tâche 02 côté serveur.

## Code structurant

- migration `1784748000000_create_projects_and_members.ts` ;
- modèles `Project` et `ProjectMember` ;
- domaine `project_status.ts` ;
- service `project_service.ts` pour les portées et affectations ;
- contrôleur et validateur projets ;
- quatre pages Nuxt sous `pages/projects` ;
- `ProjectForm.vue` et `ProjectArchiveDialog.vue` ;
- suites Japa, Vitest et Playwright.

## Migration

La migration crée `projects`, `project_members`, leurs contraintes/index et ajoute `audit_logs.target_project_id`. Elle est réversible. Elle a été appliquée localement et rejouée par `migration:fresh` dans le parcours E2E.

## Résultats locaux du 22/07/2026

| Contrôle                                      | Résultat                    |
| --------------------------------------------- | --------------------------- |
| API Japa                                      | 44/44                       |
| Frontend Vitest                               | 26/26                       |
| Playwright                                    | 10/10, desktop et mobile    |
| API lignes / branches / fonctions             | 94,84 % / 91,32 % / 90,74 % |
| Service projets lignes / branches / fonctions | 96,69 % / 82,85 % / 100 %   |
| Domaine projet                                | 100 % lignes et branches    |
| Frontend lignes / branches / fonctions        | 92,30 % / 87,50 % / 82,14 % |
| lint / format / typecheck                     | OK                          |
| builds AdonisJS / Nuxt                        | OK                          |

## Anomalies détectées et corrigées

Le premier parcours UI envoyait un filtre `status` vide, refusé correctement par VineJS en 422. Le composable supprime désormais les filtres vides avant l’appel. Le parcours E2E a aussi été regroupé afin de tester les trois rôles sans contourner le rate limit réel de connexion.

## Limites et preuves externes

La tâche 04 devra appeler `canAcceptPublications` avant toute création de publication. Les captures de recette, le SHA, la CI GitHub rouge/verte et les vérifications RGAA manuelles restent à joindre après commit et déploiement de préproduction.
