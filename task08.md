# Tâche 08 — Publication automatique Facebook

> Ordre : 8/23  
> Dépendances : Tâches 01 à 07 validées  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.2, C2.2.3, C2.2.4, C2.3.1, C2.3.2

## Objectif

Créer l’adaptateur Facebook, la connexion OAuth et un cycle de publication fiable, testable sans appel réel en CI.

## Périmètre

- connexion OAuth d’une Page explicitement sélectionnée et révocation locale ;
- chiffrement authentifié des tokens, scopes minimaux et état d’expiration ;
- validation texte/images/vidéo avant programmation ;
- programmation BullMQ, worker séparé, tentatives persistées et relance manuelle ;
- contrôle de la version approuvée et de l’empreinte exacte du contenu ;
- idempotence interne par publication, réseau, version et compte ;
- adaptateur Graph API réel et mode mock hermétique pour les tests ;
- interfaces Nuxt de connexion, validation, statut et historique ;
- tests domaine, HTTP, worker, frontend et E2E, sécurité et preuves.

## Règles structurantes

- seules les versions approuvées sont programmables ;
- le worker revérifie version, statut, texte et médias avant l’appel externe ;
- une tentative initiale et trois retries utilisent 1, 5 et 15 minutes ;
- seules les erreurs transitoires sont relancées automatiquement ;
- un client consulte le statut de ses projets mais ne connecte ni ne programme ;
- aucun token ni contenu éditorial sensible n’est journalisé ;
- l’identifiant distant est persisté et toute exécution déjà aboutie est ignorée.

## Définition de terminé

- [x] Parcours nominal utilisable avec le driver Facebook simulé.
- [x] Autorisations et isolation testées côté serveur.
- [x] Migration réversible et documentée.
- [x] Tests unitaires, HTTP, worker, frontend et E2E écrits.
- [x] Idempotence, retries, expiration, erreurs et IDOR couverts.
- [x] Contrôles RGAA automatisés exécutés.
- [x] Lint, format, typecheck, tests et builds locaux verts.
- [ ] Application Meta validée et recette avec une Page de test réelle.
- [ ] Contrôles RGAA manuels et recette exécutés en préproduction.
- [ ] Alerte externe au-delà de 5 % d’échecs sur 24 h configurée.

Les versions/endpoints Graph exacts doivent être sélectionnés depuis l’application Meta réelle et sa documentation officielle au moment de la recette ; aucune valeur non vérifiée n’est figée dans le dépôt.
