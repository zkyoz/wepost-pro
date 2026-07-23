# Tâche 17 — IA : variantes de publications par réseau

> Ordre : 17/23  
> Dépendances : Tâche 16 validée  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.2, C2.2.3, C2.3.1

## Objectif

Créer des variantes distinctes par réseau depuis le texte source, sans modifier silencieusement la publication principale.

## Périmètre

- modèle versionné de variante par réseau ;
- génération groupée ou réseau par réseau via l’abstraction IA de la tâche 16 ;
- validation locale, édition manuelle, comparaison textuelle et compteur ;
- approbation explicite, obsolescence après modification du texte source et fallback ;
- sélection et gel du texte effectif lors de la programmation sociale ;
- onglets accessibles et tests API, frontend et E2E.

## Règles

- chaque variante conserve son réseau et sa version source ;
- une modification du texte source rend les anciennes variantes obsolètes ;
- les limites officielles sont configurables et restent `TODO` tant qu’elles ne sont pas vérifiées ;
- seule une variante approuvée de la version courante remplace le texte source ;
- une variante brouillon ou obsolète n’est jamais publiée ;
- la génération n’applique, ne programme et ne publie aucun contenu automatiquement.

## Données

Créer `publication_network_variants` avec l’identifiant, la publication, le réseau, la version source, le texte, le statut, l’origine IA, les auteurs d’édition/approbation et les timestamps. L’unicité porte sur publication/réseau/version source.

## Tests et livrables

Tester sélection du texte effectif, obsolescence, CRUD, génération mockée, permissions/IDOR, édition, approbation et programmation E2E. Mettre à jour recette, preuve, sécurité, accessibilité, manuel, schéma et changelog sans déclarer de contrôle manuel non exécuté.
