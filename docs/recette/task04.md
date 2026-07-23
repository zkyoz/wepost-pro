# Recette — Tâche 04

Date d’exécution locale : 22/07/2026  
Environnement : macOS, PostgreSQL/Redis Docker, Chromium desktop/mobile  
Testeur : Codex  
Version/SHA : dépôt sans commit, à compléter après livraison

| ID     | Scénario                       | Précondition                       | Résultat attendu                                | Observé                 | Statut |
| ------ | ------------------------------ | ---------------------------------- | ----------------------------------------------- | ----------------------- | :----: |
| PUB-01 | Agence crée une publication    | projet actif de l’agence           | brouillon version 1 et audit                    | conforme                |   OK   |
| PUB-02 | Liste filtrée                  | publications existantes            | filtres titre, statut et réseau appliqués       | conforme                |   OK   |
| PUB-03 | Agence modifie                 | version courante fournie           | contenu mis à jour, version incrémentée         | conforme                |   OK   |
| PUB-04 | Conflit optimiste              | version obsolète                   | 409 et version courante retournée               | conforme                |   OK   |
| PUB-05 | Agence duplique                | publication accessible             | nouvelle publication brouillon version 1        | conforme                |   OK   |
| PUB-06 | Agence archive                 | statut archivable                  | archivage logique conservant l’historique       | conforme                |   OK   |
| PUB-07 | Transition valide              | statut source compatible           | nouveau statut et audit                         | conforme                |   OK   |
| PUB-08 | Transition interdite           | saut brouillon vers publiée        | conflit explicite                               | conforme                |   OK   |
| PUB-09 | Approbation                    | version courante en revue          | `approved_version` mémorisée                    | conforme                |   OK   |
| PUB-10 | Modification après approbation | publication approuvée              | retour `in_progress`, approbation annulée       | conforme                |   OK   |
| PUB-11 | Client affecté consulte        | membre du projet                   | liste, détail et versions accessibles           | conforme                |   OK   |
| PUB-12 | Client écrit                   | client connecté                    | 403 sur toutes les mutations                    | conforme                |   OK   |
| PUB-13 | Accès inter-agence             | ressource étrangère                | 404 sans fuite                                  | conforme                |   OK   |
| PUB-14 | Projet archivé                 | projet non réactivé                | création refusée                                | conforme                |   OK   |
| PUB-15 | Mass assignment                | payload avec agence/statut/version | champs ignorés, valeurs serveur conservées      | conforme                |   OK   |
| PUB-16 | Parcours E2E                   | comptes agence/client              | créer, modifier, archiver puis lire côté client | conforme desktop/mobile |   OK   |

## Résultats

- 51 tests API réussis ;
- 30 tests frontend réussis ;
- 10 tests Playwright réussis ;
- build, lint, format et typecheck réussis après correction des contrôles lint ;
- recette de préproduction et contrôles RGAA manuels à exécuter.
