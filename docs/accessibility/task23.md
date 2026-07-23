# Accessibilité — Tâche 23

## Implémentation

- landmarks `header`, `nav`, `main`, `section` et `footer` ;
- lien d’évitement global vers `#main-content` ;
- un titre de niveau 1, puis une hiérarchie de titres structurée ;
- CTA et liens nommés sans dépendre d’une icône ;
- aperçu produit accompagné d’un nom accessible complet ;
- FAQ native avec `<details>` et `<summary>` ;
- couleurs non utilisées comme unique vecteur d’information ;
- focus visible, zones tactiles dimensionnées et ordre DOM logique ;
- mise en page responsive sans interaction obligatoire au pointeur ;
- suppression des transitions avec `prefers-reduced-motion`.
- composants d’interface dessinés en CSS et icônes SVG décoratives masquées
  aux technologies d’assistance ;
- palette de marque ajustée par contexte afin de conserver un contraste
  suffisant, notamment pour les boutons orange et les états désactivés ;
- sélecteur de langue de l’espace privé monté côté client pour garantir son
  fonctionnement après restauration de session et rechargement.

## Résultats locaux

| Contrôle                   | Résultat                                  |
| -------------------------- | ----------------------------------------- |
| axe desktop                | aucune violation sérieuse ou critique     |
| axe mobile                 | aucune violation sérieuse ou critique     |
| reflow mobile 360 CSS px   | aucune coupure observée                   |
| reflow 320 CSS px          | aucune perte ni défilement horizontal     |
| session + changement FR/EN | 2/2 Playwright desktop/mobile             |
| Lighthouse accessibilité   | 100/100                                   |
| navigation CTA et footer   | entièrement au clavier via liens natifs   |
| zoom 200 %                 | à confirmer manuellement en préproduction |
| NVDA/VoiceOver             | à exécuter manuellement                   |

L’état de conformité public reste « non déterminé » tant qu’un audit RGAA
complet n’a pas été réalisé.
