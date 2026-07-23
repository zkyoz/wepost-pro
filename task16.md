# Tâche 16 — IA : génération et variantes de textes

> Ordre : 16/23  
> Dépendances : Tâches 01 à 15 validées  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.3, C2.3.1

## Objectif

Ajouter une génération assistée de textes avec validation humaine et abstraction du fournisseur IA.

## Périmètre

- interface fournisseur IA et prompts versionnés ;
- génération depuis un brief avec deux à cinq variantes ;
- historique, statut, erreurs, latence et usage lorsque disponible ;
- application manuelle d’une proposition dans une publication ;
- création, consultation, application et annulation d’une génération ;
- traitement asynchrone BullMQ hors environnement mémoire ;
- interface Nuxt accessible réservée à l’agence et à l’administrateur.

## Règles

- aucun texte IA n’est appliqué ou publié automatiquement ;
- le contenu source et les versions précédentes restent conservés ;
- le brief ne contient aucune donnée client inutile et les données sensibles détectées sont masquées ;
- chaque résultat est identifié comme généré ;
- les longueurs et le nombre de variantes sont bornés ;
- le client consulte uniquement le texte final de la publication ;
- les appels CI utilisent un fournisseur simulé, jamais un fournisseur réel.

## Données

Créer `ai_generations` avec : identifiants et portée agence/publication, fournisseur, modèle, version du prompt, empreinte de l’entrée, sortie, statut, usage, auteur et dates de cycle de vie. Aucun secret fournisseur n’est stocké.

## Sécurité et résilience

Rate limiting, quota quotidien, validation stricte, protection contre l’injection de prompt, logs expurgés, timeout, circuit breaker, retries bornés et permissions serveur centralisées sont obligatoires.

## Tests et livrables

Tester construction/parsing du prompt, timeout, réponse invalide, quota, permissions, worker simulé et parcours E2E générer/choisir/appliquer. Mettre à jour recette, preuve, sécurité, accessibilité, manuel, schéma et changelog sans déclarer de contrôle manuel non exécuté.
