# Tâche 22 — Sauvegardes et restauration

> Ordre : 22/23  
> Dépendances : Tâche 21 validée

## Objectif

Automatiser les sauvegardes PostgreSQL et la protection des médias R2, puis
documenter et tester la restauration.

## Périmètre

- dump PostgreSQL automatisé, chiffré avant envoi dans un bucket R2 dédié ;
- rétention quotidienne, hebdomadaire et mensuelle ;
- contrôle d’intégrité et journal `backup_runs` ;
- restauration contrôlée dans une base isolée ;
- historique en lecture réservé aux administrateurs ;
- stratégie de récupération des médias R2 et runbook ;
- tests de rétention, chiffrement, checksum, purge, accès et erreurs.

## Contraintes

- aucun secret ni clé de chiffrement en base, dans les objets ou dans les logs ;
- credentials R2 de sauvegarde distincts de ceux de l’application ;
- aucun téléchargement direct depuis l’interface ;
- aucune restauration autorisée vers la base applicative courante ;
- une sauvegarde n’est valide qu’après contrôle de son objet distant et test de
  restauration périodique ;
- les validations réelles R2 et restauration restent à consigner en
  préproduction.
