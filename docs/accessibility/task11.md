# Accessibilité — Tâche 11

## Mesures intégrées

- labels natifs pour compte, tableau, titre, description, lien et date ;
- compteurs de caractères associés aux champs avec `aria-describedby` ;
- statuts, succès et erreurs textuels annoncés par `aria-live`, `role="status"` ou `role="alert"` ;
- historique des tentatives en tableau avec légende et en-têtes ;
- contrôles clavier ordinaires, sans widget Pinterest externe ;
- boutons désactivés pendant hydratation/traitement et codes accompagnés d’un libellé compréhensible.

## Contrôles automatisés

Vitest vérifie panneau, rôles et annonces. Le parcours Playwright couvre OAuth mock, tableau, validation, programmation et scan axe. Les dix tests passent sur Chromium desktop/mobile sans violation axe sérieuse ou critique sur l’écran Pinterest connecté.

## Contrôles manuels restant en préproduction

- Tab/Maj+Tab/Entrée/Espace sur connexion, tableau, champs, programmation et relance ;
- retour OAuth et annonces avec VoiceOver ;
- historique au lecteur d’écran ;
- zoom 200 %, reflow 320 px, contraste et focus après erreur ;
- comportement d’un token expiré et d’un tableau devenu indisponible.

Aucune conformité RGAA complète n’est déclarée avant ces contrôles.
