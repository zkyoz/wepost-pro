# Tâche 11 — Publication automatique Pinterest

> Ordre : 11/23  
> Dépendances : Tâche 10 validée  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.2, C2.2.3, C2.2.4, C2.3.1, C2.3.2

## Objectif

Créer l’adaptateur officiel Pinterest, la connexion OAuth et un cycle de publication fiable avec choix explicite du tableau.

## Périmètre

- adaptateur `pinterest` conforme au contrat social commun ;
- OAuth, récupération des tableaux, chiffrement et renouvellement des tokens ;
- validation du titre, de la description, du lien et d’une image JPEG/PNG ;
- programmation BullMQ versionnée et idempotente, tentatives, retries 1/5/15 minutes et relance ;
- interface de connexion, choix du tableau, validation, statut, historique et révocation ;
- mode mock sans appel Pinterest en test ou en CI.

## Règles essentielles

- seuls admin/agence connectent et programment ; un client affecté consulte le statut ;
- seule une version approuvée est programmée et le worker la revérifie avant l’appel externe ;
- la clé d’idempotence associe publication, réseau, version et compte ;
- le serveur fournit la clé R2 privée et Pinterest reçoit une URL signée courte ;
- les tokens et réponses externes sensibles ne sont ni exposés ni journalisés ;
- création avancée de tableaux et formats hors image standard sont hors périmètre.

## Livrables et validation

Le code API/Nuxt/worker, la migration du payload réseau, les tests unitaires, HTTP, worker et E2E, la recette, les preuves, la sécurité, l’accessibilité, le manuel et le changelog sont inclus. La recette Pinterest réelle, les captures, les métriques 24 h et le SHA restent manuels sans application Pinterest ni préproduction disponibles.
