# Accessibilité — Tâche 09

## Mesures intégrées

- formulaires natifs et labels explicites pour compte et date ;
- statuts, succès et erreurs écrits en toutes lettres et annoncés par `aria-live`/`role="status"` ;
- erreurs exposées dans une alerte ;
- historique des tentatives sous forme de tableau avec légende et en-têtes ;
- contrôles clavier ordinaires, sans widget externe imposé ;
- désactivation des actions avant hydratation pour éviter une perte de commande ;
- codes techniques accompagnés de libellés compréhensibles.

## Contrôles automatisés

Vitest vérifie les états, rôles, annonces et appels du panneau. Playwright couvre connexion mock, validation et programmation sur Chromium desktop/mobile. Un scan axe de l’écran Instagram connecté ne relève aucune violation sérieuse ou critique.

## Complément Instagram Login

Le parcours avec R2 conserve les états textuels de validation et de publication.
La capture de recette montre « Publiée » et une tentative « Réussie », ainsi que
la décision client. Aucune signification n'est portée uniquement par la couleur.

Le panneau Instagram dispose également d’un bouton natif « Actualiser le statut
Instagram », avec annonce du résultat sans rechargement global. Les connexions
réelles et simulées sont identifiées textuellement. L’inventaire de permissions
non fourni ne doit pas être affiché comme une absence d’autorisation.

## Contrôles manuels restant en préproduction

- Tab/Maj+Tab/Entrée/Espace sur connexion, validation, date, programmation et relance ;
- retour du flux Meta et annonces avec VoiceOver ;
- historique au lecteur d’écran ;
- zoom 200 %, reflow 320 px, contraste et focus après erreur ;
- expérience lors d’une attente de traitement longue et d’un token expiré.

Aucune conformité RGAA complète n’est déclarée avant ces contrôles.

## Correctif multiréseau — 14 septembre 2026

La [fiche du correctif](../bugs/multinetwork-partial-publication.md) décrit la
reprise d'un réseau restant après le succès de l'autre, les protections serveur,
les résultats des tests et les limites de validation. Les deux ordres
Instagram/LinkedIn sont couverts par les tests sans appels externes.

La [recette réelle multiréseau](../recette/multinetwork-live.md) a ensuite
confirmé la reprise de la première fiche et une nouvelle publication complète
sur les deux comptes autorisés, une seule tentative par cible. Aucun jeton,
URL signée, migration ou modification des droits n'a été nécessaire.
