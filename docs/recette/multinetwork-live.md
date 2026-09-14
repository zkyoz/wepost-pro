# Recette de diffusion LinkedIn et Instagram

## Périmètre

Répétition sur le build local de la branche `codex/bc03-demo`, avec API
officielles LinkedIn personnel et Instagram professionnel, worker BullMQ,
PostgreSQL/Redis locaux et médias dans un bucket R2 privé. Les autres réseaux,
les e-mails et l'IA ne sont pas des résultats live de cette recette.

## Reprise du premier essai

Fiche `d4a7c929-a1e2-4b0d-b028-5f1b9804decc`, version 2 approuvée.
Après correction du statut multiréseau, la validation puis la programmation
LinkedIn ont réussi. Une seule tentative, identifiant
`urn:li:share:7505363578728693762`.

La cible Instagram n'a pas été relancée : la tentative existante et
l'identifiant `18366504844214760` sont conservés.

## Nouvelle répétition complète

Fiche `fb71f267-d02b-4099-9127-70a298df922c`, projet Maison Azur.

1. Création d'un brouillon ciblant Instagram et LinkedIn.
2. Téléversement du JPEG `dashboard-dark.jpg` dans R2 avec alternative textuelle.
3. Passage en cours puis demande de validation client.
4. Connexion client : commentaire et demande de correction de la version 1.
5. Connexion agence : correction du texte et nouvelle version 2.
6. Connexion client : approbation explicite de la version 2.
7. Connexion agence : validation de compatibilité et programmation des deux
   réseaux à la même échéance.
8. Vérification du calendrier mois, semaine, liste et filtres projet/réseau.
9. Exécution automatique : une tentative réussie par réseau, badge global publié.
10. Ouverture des réseaux : texte corrigé et image confirmés visuellement.

| Réseau | Identifiant distant | Résultat |
| --- | --- | --- |
| LinkedIn personnel | `urn:li:share:7505365765185794048` | Publiée, 1 tentative |
| Instagram | `18215166229346369` | Publiée, 1 tentative |

Posts de test conservés au terme de la recette :
[LinkedIn](https://www.linkedin.com/feed/update/urn:li:share:7505365765185794048/)
et [Instagram](https://www.instagram.com/dev251205/p/DdSBccPlksi/).
Ils pourront être supprimés par leur propriétaire ; leurs liens ne constituent
donc pas une archive permanente.

## Chronométrage et limites

Durée mesurée : **7 min 49 s**, du clic de création au constat des deux statuts
publiés dans WePost. Cette durée comprend les connexions successives, le
téléversement et l'attente de l'échéance. L'ouverture des deux sites externes
et les captures ont été réalisées ensuite, hors de ces 7 min 49 s.
Ce temps d'exécution instrumentée ne mesure pas le discours oral du candidat.

Un défaut distinct a été constaté dans le formulaire de modification : une
date UTC était tronquée puis affichée comme une heure locale. L'heure voulue a
été ressaisie pendant cet essai. Le correctif utilise ensuite l'utilitaire
existant `toLocalDateTimeInput` avec le fuseau de la publication. Trois cas
échouent avant correction ; les cinq tests du formulaire passent après
correction (Paris été/hiver, UTC, New York avec changement de jour, création).
La suite frontend complète compte alors 123 tests réussis.

Aucune migration, modification de jeton ou réinitialisation de la base de
démonstration. Les tests automatisés ne publient pas sur les réseaux réels.
La CI distante et la référence figée doivent être relevées sur la version
effectivement poussée, séparément de ces résultats de recette.
