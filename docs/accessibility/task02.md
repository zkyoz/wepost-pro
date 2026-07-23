# Accessibilité — Tâche 02

## Contrôles intégrés

- la navigation n’affiche que les destinations du rôle et retire réellement les contrôles interdits du DOM ;
- la navigation reste visible à 320 px et ne crée pas de focus fantôme ;
- le rôle courant est exposé dans un statut textuel ;
- la page d’accès refusé fournit un titre explicite, une explication et un lien de retour ;
- la gestion des utilisateurs utilise un tableau avec en-têtes, des labels associés aux listes et des boutons natifs ;
- les mises à jour sont annoncées par `role="status"` et `aria-live="polite"` ;
- les contrôles du compte administrateur courant sont désactivés explicitement ;
- le tableau large dispose d’une zone de défilement clavier nommée.

## Résultats du 22/07/2026

Les 8 scénarios Playwright passent sur Chromium desktop et mobile. Le parcours vérifie la présence de la navigation admin, son absence pour agence/client et la redirection vers une page d’accès refusé lors d’un accès direct. Le défaut initial de navigation masquée sous 900 px a été corrigé avant validation finale.

Les tests axe existants ne signalent aucune violation sérieuse ou critique sur la connexion. Ils ne constituent pas un audit RGAA complet.

## Vérifications manuelles restantes

- VoiceOver sur la page d’administration et la page 403 ;
- ordre de tabulation du tableau et annonce après mutation ;
- zoom 200 % ;
- reflow à 320 px sur les navigateurs de recette ;
- contraste et comportement avec styles utilisateur.
