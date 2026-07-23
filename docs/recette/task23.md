# Recette — Tâche 23

Version : arbre local du 23/07/2026. SHA et préproduction à compléter.

| ID      | Scénario                       | Résultat attendu                                                         | Observé local                                       | Statut  |
| ------- | ------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------- | ------- |
| LAND-01 | Accueil public                 | proposition de valeur et sections visibles                               | Vitest + Playwright desktop/mobile                  | OK      |
| LAND-02 | CTA                            | mène vers `/auth/login`                                                  | Playwright                                          | OK      |
| LAND-03 | FAQ                            | contrôles natifs accessibles                                             | rendu `<details>/<summary>`                         | OK      |
| LAND-04 | Pages légales                  | trois pages accessibles depuis le footer                                 | Playwright + build SSR                              | OK      |
| LAND-05 | SSR/no-JS                      | titre principal présent dans la réponse HTML                             | requête Playwright                                  | OK      |
| LAND-06 | SEO                            | title, description, canonical et JSON-LD                                 | build Nuxt                                          | OK      |
| LAND-07 | Indexation                     | sitemap public et routes privées exclues                                 | Playwright                                          | OK      |
| LAND-08 | Accessibilité automatisée      | aucune violation axe sérieuse/critique                                   | desktop + mobile                                    | OK      |
| LAND-09 | Reflow 320 px                  | aucune perte ni défilement horizontal                                    | Playwright                                          | OK      |
| LAND-10 | Analytics refusé/non configuré | aucun chargement tiers                                                   | Vitest + configuration vide                         | OK      |
| LAND-11 | Audit lecteur d’écran          | parcours NVDA ou VoiceOver                                               | préproduction                                       | À faire |
| LAND-12 | Validation légale              | coordonnées et textes définitifs                                         | responsable du projet                               | À faire |
| LAND-13 | Lighthouse                     | rapport local archivé                                                    | 100 / 100 / 100 / 100                               | OK      |
| LAND-14 | Identité visuelle              | palette fournie et langage SaaS cohérents sur accueil, auth et dashboard | inspection desktop/mobile + tests de non-régression | OK      |

Les captures locales sont archivées dans
`docs/evidence/task23/screenshots/landing-desktop.png` et
`docs/evidence/task23/screenshots/landing-mobile.png`.
