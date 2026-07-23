# Recette — Tâche 20

Version : arbre local du 23/07/2026. SHA et préproduction à compléter.

| ID      | Scénario                      | Résultat attendu                                       | Observé local     | Statut  |
| ------- | ----------------------------- | ------------------------------------------------------ | ----------------- | ------- |
| I18N-01 | Changement FR vers EN         | interface et attribut `lang` passent en anglais        | Vitest/Playwright | OK      |
| I18N-02 | Persistance utilisateur       | la locale EN est restaurée après rechargement          | Japa/Playwright   | OK      |
| I18N-03 | Formats locaux                | nombres et dates suivent FR ou EN                      | Vitest            | OK      |
| I18N-04 | Parité des messages           | aucune clé FR/EN manquante                             | Vitest CI         | OK      |
| I18N-05 | Génération simulée            | brouillon versionné créé, source inchangée             | Japa              | OK      |
| I18N-06 | Édition et approbation        | correction puis validation humaine explicite           | Japa/Vitest       | OK      |
| I18N-07 | Modification source           | traduction précédente marquée obsolète                 | Japa              | OK      |
| I18N-08 | Client                        | lecture autorisée, génération et modification refusées | Japa/Vitest       | OK      |
| I18N-09 | IDOR inter-agence             | ressource masquée en 404                               | Japa              | OK      |
| I18N-10 | Navigation clavier et lecteur | sélecteur et éditeur utilisables sans souris           | préproduction     | À faire |
| I18N-11 | Textes juridiques             | traduction validée par une personne compétente         | préproduction     | À faire |
| I18N-12 | Exhaustivité de l’interface   | tous les écrans métier historiques sont disponibles EN | audit restant     | À faire |
