# Tâche 12 — Publication automatique TikTok

> Ordre : 12/23  
> Dépendances : Tâche 11 validée

## Objectif

Créer l’adaptateur officiel TikTok, la connexion OAuth et le cycle fiable de publication vidéo.

## Périmètre

- adaptateur `tiktok` conforme au contrat social commun ;
- OAuth, renouvellement et révocation ;
- interrogation des capacités du créateur avant validation ;
- programmation BullMQ, suivi du traitement distant, tentatives et relance ;
- mode mock sans appel externe en CI ;
- vidéo MP4 privée chargée depuis R2.

## Règles obligatoires

- seule une version approuvée est publiable ;
- le worker revérifie version, compte et empreinte ;
- idempotence publication/réseau/version/compte ;
- retries 1, 5 et 15 minutes pour les erreurs transitoires ;
- l’identifiant `publish_id` est persisté dès l’initialisation et réutilisé ;
- une publication n’est marquée `published` qu’après `PUBLISH_COMPLETE` ;
- tokens chiffrés et absents des réponses/logs ;
- client en lecture seule, admin/agence en gestion ;
- contrôles accessibles, statuts textuels, annonces `aria-live` et historique tabulaire.

## Routes

OAuth, comptes, validation, programmation, statut, tentatives et relance sont exposés sous `/social/tiktok` en suivant les conventions des autres adaptateurs.

## Tests et livrables

Tests unitaires, HTTP, worker, frontend et E2E mocké ; documentation dans `docs/recette/task12.md`, `docs/evidence/task12.md`, `docs/security/task12.md`, `docs/accessibility/task12.md` et `docs/manuals/tiktok-publishing.md`. La publication réelle, la recette RGAA manuelle, les captures, le SHA et l’alerte de production restent à fournir après déploiement.
