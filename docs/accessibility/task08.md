# Accessibilité — Tâche 08

## Mesures intégrées

- formulaires natifs avec labels explicites pour Page et date ;
- états et résultats écrits en toutes lettres, jamais uniquement par couleur ;
- annonces de connexion, validation, programmation et relance via `role="status"`/`aria-live` ;
- erreurs placées dans une alerte accessible ;
- historique des tentatives sous forme de tableau avec légende, en-têtes et cellules de ligne ;
- contrôles utilisables au clavier sans widget Facebook embarqué ;
- lien de connexion ordinaire comme alternative complète au flux externe ;
- identifiant distant et code technique accompagnés d’un libellé compréhensible.

## Contrôles automatisés

Vitest vérifie les états, rôles et annonces du panneau. Playwright couvre la connexion mock, la validation, la programmation et la consultation sur Chromium desktop/mobile ; les scans axe existants refusent les violations sérieuses ou critiques.

## Contrôles manuels restant en préproduction

- Tab/Maj+Tab/Entrée/Espace sur connexion, Page, date, validation, programmation et relance ;
- retour de la fenêtre Meta et annonces avec VoiceOver ;
- tableau d’historique au lecteur d’écran ;
- zoom 200 %, reflow 320 px et contrastes ;
- focus après erreur OAuth, expiration, 429 et validation refusée.

Aucune conformité RGAA complète n’est déclarée avant ces vérifications.
