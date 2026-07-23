# Accessibilité — Tâche 07

## Mesures intégrées

- fil chronologique en liste ordonnée et articles ;
- auteur et date présents, date portée par `<time datetime>` ;
- formulaires natifs avec labels, aide et limites annoncées ;
- nouveau commentaire et décision annoncés par `aria-live`, sans déplacement de focus ;
- erreurs avec `role="alert"` ;
- décisions et états d’e-mail écrits en toutes lettres, jamais uniquement en couleur ;
- confirmation explicite avant toute décision client ;
- page Notifications structurée avec titres, compteur et boutons explicites ;
- e-mail HTML avec langue, `<main>`, titre, paragraphes et lien, accompagné d’une version texte.

## Contrôles automatisés

Vitest vérifie la structure sémantique, la présence de la zone d’annonce et l’échappement d’un commentaire malveillant. Playwright couvre le parcours commentaire → correction → modification → approbation sur desktop et mobile. Les scans axe existants du parcours refusent les violations sérieuses ou critiques.

## Contrôles manuels restant en préproduction

- Tab/Maj+Tab/Entrée/Espace sur fil, édition, décision et notifications ;
- confirmation et annonces avec VoiceOver ;
- lecture de l’e-mail HTML et texte ;
- zoom 200 % et reflow 320 px ;
- focus après erreur serveur, session expirée et conflit de version ;
- contraste des états non lu et échec d’e-mail.

Aucune conformité RGAA complète n’est déclarée avant ces vérifications.
