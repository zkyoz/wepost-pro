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

## Extension BC03

Le choix profil/Page utilise un `select` natif étiqueté. L’identifiant de Page
n’apparaît et n’est obligatoire que pour une organisation. Le formulaire
réutilise les styles de champs et boutons de l’application, avec une
présentation mobile. Le statut conserve son annonce `aria-live` ; le lien
vers une publication indique explicitement son ouverture dans un nouvel
onglet. L’actualisation est déclenchable par un bouton, sans rechargement
manuel complet de la page.

Les tests de composant couvrent les libellés, les rôles, l’annulation de la
confirmation d’envoi réel et l’actualisation. Le contrôle visuel BC03 porte
sur Chromium 1440 × 1000 et 390 × 844, en mode de connexion simulée. Il ne
remplace pas VoiceOver, le zoom 200 %, le reflow 320 px ou une recette OAuth
réelle, qui restent à exécuter.

## Correctif de durée OAuth

Le correctif du 13 septembre 2026 ne change ni les composants, ni les labels,
ni l’ordre du focus. Il rétablit les dix minutes prévues pour terminer la
connexion externe. Les tests temporels HTTP ne constituent pas un audit
RGAA ; VoiceOver et les contrôles de zoom restent distincts.
