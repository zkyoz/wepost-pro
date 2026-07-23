# Recette — Tâche 03

Date d’exécution locale : 22/07/2026  
Environnement : macOS, PostgreSQL/Redis Docker, Chromium desktop/mobile  
Testeur : Codex  
Version/SHA : dépôt sans commit, à compléter après livraison

| ID      | Scénario                    | Précondition                 | Résultat attendu                          | Observé                 | Statut |
| ------- | --------------------------- | ---------------------------- | ----------------------------------------- | ----------------------- | :----: |
| PROJ-01 | Agence crée un projet       | agence et client même agence | projet actif et audité                    | conforme                |   OK   |
| PROJ-02 | Agence liste/recherche      | projets existants            | résultats filtrés et paginés              | conforme                |   OK   |
| PROJ-03 | Agence modifie              | projet actif de l’agence     | données et audit mis à jour               | conforme                |   OK   |
| PROJ-04 | Agence archive              | projet actif                 | archivage logique, consultation maintenue | conforme                |   OK   |
| PROJ-05 | Modification archivée       | projet archivé               | conflit jusqu’à réactivation              | conforme                |   OK   |
| PROJ-06 | Agence réactive             | projet archivé               | projet actif                              | conforme                |   OK   |
| PROJ-07 | Client affecté consulte     | ligne `project_members`      | liste et détail accessibles               | conforme                |   OK   |
| PROJ-08 | Client affecté modifie      | client connecté              | 403                                       | conforme                |   OK   |
| PROJ-09 | Client non affecté consulte | autre client                 | liste vide et détail 404                  | conforme                |   OK   |
| PROJ-10 | Accès inter-agence          | agence externe               | 404                                       | conforme                |   OK   |
| PROJ-11 | Falsification `agency_id`   | payload hostile              | champ ignoré, agence serveur conservée    | conforme                |   OK   |
| PROJ-12 | Admin multi-agences         | admin connecté               | création et pagination globales           | conforme                |   OK   |
| PROJ-13 | Parcours E2E                | agence et client E2E         | création agence, lecture seule client     | conforme desktop/mobile |   OK   |

## Résultats

- 44 tests API réussis ;
- 26 tests frontend réussis ;
- 10 tests Playwright réussis ;
- builds, lint, format et typecheck réussis ;
- recette de préproduction et contrôles RGAA manuels à exécuter.
