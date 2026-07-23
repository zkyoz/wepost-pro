# Preuves — Tâche 17

## Résumé

La tâche ajoute des textes distincts et versionnés par réseau. Ils peuvent être générés ou édités, doivent être approuvés et deviennent obsolètes dès que la source change. Le texte effectif est sélectionné côté serveur et figé lors de la programmation ; aucun résultat IA n’est publié automatiquement.

## Code structurant

- migration `1784784000000_create_publication_network_variants.ts`, modèle et domaine pur ;
- service de limite, génération, obsolescence et sélection du texte effectif ;
- contrôleur, validateurs, routes par permissions et audits expurgés ;
- intégration aux cinq adaptateurs sociaux et au dépôt PostgreSQL du worker ;
- composant `PublicationNetworkVariants`, composable et types Nuxt ;
- tests Japa, Vitest et parcours Playwright Chromium.

## Résultats locaux du 23/07/2026

| Contrôle                          | Résultat                                                          |
| --------------------------------- | ----------------------------------------------------------------- |
| API Japa complet                  | 160/160, dont 5 tests Task 17                                     |
| Frontend Vitest complet           | 80/80                                                             |
| Worker Vitest complet             | 95/95                                                             |
| Playwright Task 17                | 1/1 Chromium : générer, éditer, approuver, résoudre et programmer |
| Migration locale                  | appliquée et schéma Lucid régénéré                                |
| Couverture API                    | lignes 87,57 %, branches 71,96 %, fonctions 82,41 %               |
| Couverture frontend               | lignes 84,35 %, branches 87,87 %, fonctions 75,94 %               |
| Couverture worker                 | lignes 92,23 %, branches 81,52 %, fonctions 86,29 %               |
| Typecheck, lint, format et builds | API, frontend et worker OK                                        |
| Capture desktop                   | `docs/evidence/task17/screenshots/network-variants-desktop.png`   |

## Contrôle visuel

La capture a été comparée à la référence Task 16 sur cinq points : palette bleu nuit/corail, en-tête avec badge, annonce d’état bleutée, action principale rouge pleine et surfaces claires bordées. La grille à deux colonnes reprend le rythme des cartes de propositions et passe en une colonne sur petit écran. La copie diffère volontairement pour expliciter source, variante, version et fallback. Les onglets ajoutent la seule structure nouvelle nécessaire au changement de réseau.

La recette préproduction, les contrôles RGAA manuels, la CI, le SHA et les limites officielles vérifiées restent manuels.
