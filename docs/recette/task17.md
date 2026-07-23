# Recette — Tâche 17

Version : arbre local du 23/07/2026. Environnement : macOS, PostgreSQL, Redis, AdonisJS, Nuxt et fournisseur IA mock. SHA et préproduction à compléter.

| ID     | Scénario                         | Résultat attendu                                             | Observé local          | Statut  |
| ------ | -------------------------------- | ------------------------------------------------------------ | ---------------------- | ------- |
| VAR-01 | Génération par réseau            | un brouillon lié au réseau et à la version source            | Japa/Vitest/Playwright | OK      |
| VAR-02 | Génération groupée               | un brouillon par réseau ciblé, aucune publication            | Japa/Vitest            | OK      |
| VAR-03 | Édition manuelle                 | texte sauvegardé et état remis en brouillon                  | Japa/Playwright        | OK      |
| VAR-04 | Approbation explicite            | variante courante approuvée et auditée                       | Japa/Playwright        | OK      |
| VAR-05 | Fallback                         | brouillon/ancienne version ignorée au profit du texte source | Japa                   | OK      |
| VAR-06 | Modification source              | anciennes variantes marquées obsolètes transactionnellement  | Japa                   | OK      |
| VAR-07 | Programmation                    | texte approuvé figé dans le payload et utilisé par le worker | Playwright Chromium    | OK      |
| VAR-08 | Permissions client               | lecture, validation en revue, aucune génération/édition      | Japa                   | OK      |
| VAR-09 | IDOR                             | ressource d’une autre agence masquée en 404                  | Japa                   | OK      |
| VAR-10 | Limite réseau configurée         | dépassement rejeté avec message explicite                    | Japa                   | OK      |
| VAR-11 | Onglets et diff accessibles      | navigation clavier et comparaison textuelle                  | Vitest/Playwright      | OK auto |
| VAR-12 | VoiceOver, zoom et reflow manuel | utilisation sans perte d’information                         | préproduction          | À faire |
