# Tâche 10 — Publication automatique LinkedIn

> Ordre : 10/23  
> Dépendances : Tâche 09 validée  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.2, C2.2.3, C2.2.4, C2.3.1, C2.3.2

## Objectif

Créer l’adaptateur officiel LinkedIn, la connexion OAuth et le cycle fiable de publication.

## Périmètre

- adaptateur `linkedin` conforme au contrat social commun ;
- OAuth avec sélection explicite d’une organisation administrable et contrôle des droits ;
- chiffrement des tokens, suivi d’expiration et renouvellement lorsque LinkedIn fournit un refresh token ;
- validation d’une version approuvée, programmation BullMQ, idempotence et empreinte du contenu ;
- worker texte/image, journal des tentatives, retries 1/5/15 minutes et relance manuelle ;
- interface de connexion, validation, statut, historique, renouvellement et révocation ;
- mode mock sans appel LinkedIn dans les tests et la CI.

## Règles essentielles

- seuls admin/agence connectent et programment ; le client affecté consulte le statut ;
- le worker revérifie version, approbation, contenu, compte et expiration avant tout appel externe ;
- organisation cible explicite et rôle LinkedIn autorisé obligatoire ;
- une exécution rejouée ne crée pas un second post simulé ;
- tokens et réponses externes sensibles ne sont jamais exposés ou journalisés ;
- texte et une image JPEG/PNG maximum dans le périmètre livré ;
- publicités et messagerie LinkedIn hors périmètre.

## Livrables et validation

Le code API/Nuxt/worker, les tests unitaires, HTTP, worker et E2E, la recette, les preuves, la sécurité, l’accessibilité, le manuel et le changelog doivent être mis à jour. La recette réelle LinkedIn, les captures, les métriques 24 h et le SHA restent explicitement manuels tant qu’aucune application partenaire ni préproduction ne sont disponibles.
