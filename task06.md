# Tâche 06 — Calendrier éditorial

> Ordre : 6/23  
> Dépendances : Tâches 01 à 05 validées  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.3, C2.3.1

## Instruction à Codex

Lire d’abord `context.md`. Examiner l’existant et adapter l’implémentation au monorepo réel. Ne pas casser les tâches validées précédemment. Implémenter uniquement le périmètre de cette tâche et les refactorings strictement nécessaires. Toute valeur non vérifiable doit être laissée en `TODO` plutôt qu’inventée.

## Objectif

Créer un calendrier éditorial responsive permettant de visualiser et modifier la planification des publications.

## Périmètre à implémenter

- Vues mois, semaine et liste.
- Filtres projet, client, réseau et statut.
- Ouverture du détail.
- Déplacement d’une publication.
- Gestion correcte des fuseaux.
- Affichage des conflits et publications sans date.

## Règles métier

- Les dates sont stockées en UTC et affichées dans le fuseau du projet ou choisi.
- Le déplacement n’est autorisé qu’à l’agence/admin.
- Une publication non approuvée peut recevoir une date souhaitée mais ne devient pas `scheduled`.
- Une publication approuvée déplacée conserve sa version approuvée uniquement si son contenu ne change pas.
- Les mises à jour concurrentes sont détectées.

## Données et migrations

- Réutiliser `publications.scheduled_at`, `timezone` et version.
- Ajouter des index adaptés aux plages de dates.

## API et services

- Endpoint de calendrier par plage de dates.
- Endpoint de déplacement avec version attendue.
- Filtres validés côté serveur.

## Interface

- Vue mois.
- Vue semaine.
- Vue liste accessible.
- Panneau de filtres.
- Carte de publication.
- Alternative aux interactions de glisser-déposer.

## Autorisations

- Client : lecture de ses projets.
- Agence/admin : déplacement et modification.
- Pas d’accès aux autres clients.

## RGAA 4.1.2

- La vue liste constitue l’alternative complète au calendrier visuel.
- Chaque événement possède un nom accessible complet.
- Déplacement avec contrôles clavier et formulaire.
- Statuts avec texte.
- Ordre de lecture logique.
- Zoom 200 % et reflow 320 px.

## Sécurité

- Validation de plage.
- Protection IDOR.
- Limiter les volumes et paginer la vue liste.
- Pas d’injection via titre.

## Tests obligatoires

- Unitaires : conversion fuseau/UTC et règles de déplacement.
- Intégration : plage de dates et filtres.
- E2E : affichage, filtre, déplacement clavier et formulaire.
- Tests autour des changements d’heure.

## Observabilité

- Mesurer le temps de réponse sur la volumétrie cible.
- Tracer les déplacements dans l’audit log.

## Livrables documentaires et preuves

- `docs/recette/task06.md` ;
- `docs/evidence/task06.md` ;
- `docs/security/task06.md` ;
- `docs/accessibility/task06.md` ;
- `CHANGELOG.md` ;
- les manuels concernés dans `docs/manuals/`.

## Définition de terminé

- [x] Fonctionnalité utilisable sur le parcours nominal.
- [x] Autorisations testées côté serveur.
- [x] Migration appliquée et documentée.
- [x] Tests unitaires écrits.
- [x] Tests d’intégration écrits.
- [x] Test E2E critique écrit.
- [x] Cas d’erreur et de sécurité couverts.
- [ ] Exigences RGAA manuelles vérifiées en préproduction.
- [x] Build, lint et typecheck verts.
- [ ] Recette exécutée en préproduction.
- [x] Documentation et preuves mises à jour.
- [x] Aucun secret ou token dans le dépôt et les logs.

## Compte rendu attendu de Codex

Terminer la réponse par :

1. résumé de l’implémentation ;
2. fichiers créés ou modifiés ;
3. migrations ;
4. commandes exécutées ;
5. résultats des tests et couverture ;
6. résultats RGAA ;
7. risques ou limites ;
8. actions manuelles restantes.
