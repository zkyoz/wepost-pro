# Accessibilité — Tâche 10

## Mesures intégrées

- formulaires natifs et labels explicites pour organisation et date ;
- statuts, succès, renouvellement et erreurs écrits en toutes lettres et annoncés par `aria-live`/`role="status"` ;
- erreurs exposées avec `role="alert"` ;
- historique des tentatives sous forme de tableau avec légende et en-têtes ;
- contrôles clavier ordinaires, sans widget LinkedIn externe imposé ;
- actions désactivées durant l’hydratation ou le traitement ;
- codes techniques accompagnés de libellés compréhensibles.

## Contrôles automatisés

Vitest vérifie le panneau, ses rôles, annonces et appels. Le scénario Playwright couvre connexion mock, validation, programmation et scan axe ; les dix tests passent sur Chromium desktop/mobile, sans violation axe sérieuse ou critique sur l’écran LinkedIn connecté.

## Contrôles manuels restant en préproduction

- Tab/Maj+Tab/Entrée/Espace sur connexion, renouvellement, validation, date, programmation et relance ;
- retour OAuth et annonces avec VoiceOver ;
- historique au lecteur d’écran ;
- zoom 200 %, reflow 320 px, contraste et focus après erreur ;
- comportement lors d’un token expiré ou d’un renouvellement indisponible.

Aucune conformité RGAA complète n’est déclarée avant ces contrôles.
