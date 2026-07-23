# Tâche 07 — Commentaires, validation client et e-mails

> Ordre : 7/23  
> Dépendances : Tâches 01 à 06 validées  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.2, C2.2.3, C2.3.1, C2.3.2

## Objectif

Permettre au client de commenter une publication, de l’approuver ou de demander des corrections, avec notifications et e-mails asynchrones.

## Périmètre

- commentaires chronologiques attachés à une publication ;
- modification limitée à l’auteur pendant une fenêtre configurée et modération admin auditée ;
- approbation ou demande de corrections liée à `content_version` ;
- notifications lues/non lues ;
- worker BullMQ séparé et e-mails Resend HTML/texte ;
- retries, états d’envoi et échecs persistés ;
- protections IDOR, XSS, CSRF et rate limiting ;
- interfaces Nuxt accessibles, tests API/frontend/worker/E2E et preuves.

## Règles structurantes

- seuls les clients affectés décident ; agence/admin commentent et consultent ;
- une approbation porte sur la version courante ;
- une modification ultérieure invalide l’approbation via le domaine publications ;
- un échec de file ou d’e-mail ne revient jamais sur le commentaire ou la décision ;
- aucun corps de commentaire, token ou contenu éditorial n’est placé dans le job ou l’e-mail ;
- les sorties restent du texte brut rendu sans `v-html`.

## Définition de terminé

- [x] Parcours nominal utilisable.
- [x] Autorisations et isolation testées côté serveur.
- [x] Migration appliquée et documentée.
- [x] Tests unitaires, intégration, worker et E2E écrits.
- [x] Cas d’erreur, XSS, concurrence et IDOR couverts.
- [x] Contrôles RGAA automatisés exécutés.
- [x] Build, lint, format et typecheck verts.
- [ ] Recette et contrôles RGAA manuels exécutés en préproduction.
- [x] Documentation et preuves mises à jour.
- [x] Aucun secret ou token dans le dépôt et les logs.

## Compte rendu attendu

1. résumé de l’implémentation ;
2. fichiers créés ou modifiés ;
3. migrations ;
4. commandes exécutées ;
5. résultats des tests et couverture ;
6. résultats RGAA ;
7. risques ou limites ;
8. actions manuelles restantes.
