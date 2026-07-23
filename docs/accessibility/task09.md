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

## Contrôles manuels restant en préproduction

- Tab/Maj+Tab/Entrée/Espace sur connexion, validation, date, programmation et relance ;
- retour du flux Meta et annonces avec VoiceOver ;
- historique au lecteur d’écran ;
- zoom 200 %, reflow 320 px, contraste et focus après erreur ;
- expérience lors d’une attente de traitement longue et d’un token expiré.

Aucune conformité RGAA complète n’est déclarée avant ces contrôles.
