# Preuves — Tâche 20

## Résumé

La tâche ajoute un socle i18n FR/EN typé, une locale utilisateur persistée et des traductions de publication versionnées. Le texte source est conservé ; une proposition générée ou manuelle reste en brouillon jusqu’à une approbation humaine explicite.

## Code structurant

- migration `1784793000000_create_locales_and_translations.ts` ;
- messages structurés FR/EN, composable de locale et contrôle CI de parité ;
- sélecteur de langue public/connecté et formats `Intl` ;
- service, contrôleur, validateurs, permission et audits des traductions ;
- éditeur source/traduction responsive avec états et historique obsolète ;
- tests Japa, Vitest et parcours Playwright FR/EN.

## Résultats locaux du 23/07/2026

| Contrôle                          | Résultat                                                    |
| --------------------------------- | ----------------------------------------------------------- |
| Tests Task20 API                  | 5/5                                                         |
| Tests Task20 frontend             | 14/14                                                       |
| Suites complètes                  | API 177/177 ; web 94/94 ; worker 95/95                      |
| Playwright FR/EN                  | Chromium 1/1 ; changement, persistance, retour FR et axe    |
| Migration locale                  | appliquée ; schéma Lucid régénéré                           |
| Couverture API                    | lignes 83,96 % ; branches 72,01 % ; fonctions 81,25 %       |
| Couverture web                    | lignes 86,49 % ; branches 83,96 % ; fonctions 79,25 %       |
| Couverture worker                 | lignes 92,23 % ; branches 81,52 % ; fonctions 86,29 %       |
| Typecheck, lint, format et builds | OK sur API, web et worker                                   |
| Parité des traductions            | 3/3 ; aucune clé FR/EN manquante                            |
| Capture EN                        | `docs/evidence/task20/screenshots/interface-en-desktop.png` |

## Contrôle visuel

Référence interne : capture Task 15 du dashboard, qui définit le shell, la palette, les contrôles et la densité. Le rendu Task20 est produit à 1280 × 803 par le Playwright du dépôt car le navigateur intégré n’est pas disponible.

Comparaison finale à taille native :

1. le shell conserve la barre latérale bleu nuit et l’en-tête blanc de la référence ;
2. la palette blanche, bleu nuit et corail ainsi que les bordures sont inchangées ;
3. la hiérarchie typographique du titre, du texte introductif et des panneaux est conservée ;
4. le sélecteur de langue reprend la taille, la bordure et le focus des contrôles existants ;
5. les espacements, cartes et densité restent cohérents avec le dashboard de référence.

La différence de copie est limitée aux libellés fonctionnels traduits et au nouveau sélecteur. Le nom utilisateur et les autres contenus métier ne sont volontairement pas traduits. Aucun texte marketing ni aucune métrique n’a été inventé. La fidélité au design existant est jugée élevée ; la navigation plus courte de la capture Task20 vient du rôle Client, pas d’un écart de mise en page.

## Limites

Le catalogue FR/EN couvre le shell partagé, l’authentification, le dashboard et l’éditeur de traduction. Les écrans métier historiques des tâches précédentes contiennent encore des libellés français à migrer avant de pouvoir revendiquer une interface anglaise exhaustive.

Le fournisseur réel et son modèle restent à sélectionner. Les textes juridiques exigent une validation humaine. La recette préproduction, VoiceOver, zoom 200 %, largeur exacte 320 px, exécution GitHub CI et SHA livré restent manuels.
