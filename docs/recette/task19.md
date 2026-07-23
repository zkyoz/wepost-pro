# Recette — Tâche 19

Version : arbre local du 23/07/2026. Environnement : macOS, PostgreSQL, Redis, AdonisJS et Nuxt. SHA et préproduction à compléter.

| ID     | Scénario                         | Résultat attendu                                             | Observé local   | Statut  |
| ------ | -------------------------------- | ------------------------------------------------------------ | --------------- | ------- |
| ICS-01 | Export par projet et plage       | fichier `.ics` limité aux publications accessibles et datées | Japa/Playwright | OK      |
| ICS-02 | Fuseau                           | `DTSTART` UTC exact, sans heure locale ambiguë               | Japa            | OK      |
| ICS-03 | Mise à jour                      | UID identique et `SEQUENCE` aligné sur `content_version`     | Japa            | OK      |
| ICS-04 | Annulation                       | publication archivée exposée avec `STATUS:CANCELLED`         | Japa            | OK      |
| ICS-05 | Injection CRLF                   | texte échappé, aucune propriété ou composant injecté         | Japa            | OK      |
| ICS-06 | Token d’abonnement               | 64 caractères URL-safe ; seul le SHA-256 est stocké          | Japa            | OK      |
| ICS-07 | Accès public valide              | calendrier servi et `last_used_at` mis à jour                | Japa            | OK      |
| ICS-08 | Révocation                       | le même lien renvoie immédiatement 404                       | Japa/Playwright | OK      |
| ICS-09 | Projet d’une autre agence        | export et création de flux masqués en 404                    | Japa            | OK      |
| ICS-10 | Client                           | export refusé tant que l’activation métier n’existe pas      | Japa/Playwright | OK      |
| ICS-11 | Copie du lien                    | retour annoncé et champ sélectionnable en cas d’échec        | Vitest          | OK auto |
| ICS-12 | Axe automatisé                   | aucune violation sérieuse ou critique dans le panneau        | Playwright      | OK auto |
| ICS-13 | Import Google/Outlook/Apple      | import ponctuel et abonnement lisibles avec mises à jour     | préproduction   | À faire |
| ICS-14 | VoiceOver, zoom et reflow 320 px | parcours sans perte d’information                            | préproduction   | À faire |
