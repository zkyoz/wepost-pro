# Recette — Tâche 18

Version : arbre local du 23/07/2026. Environnement : macOS, PostgreSQL, Redis, AdonisJS et Nuxt. SHA et préproduction à compléter.

| ID     | Scénario                         | Résultat attendu                                                  | Observé local             | Statut  |
| ------ | -------------------------------- | ----------------------------------------------------------------- | ------------------------- | ------- |
| ANN-01 | Point à la souris                | coordonnées normalisées et texte enregistrés                      | Playwright Chromium       | OK      |
| ANN-02 | Rectangle au clavier             | forme créée par champs X/Y/largeur/hauteur sans pointeur          | Playwright desktop/mobile | OK      |
| ANN-03 | Texte obligatoire                | création vide rejetée côté interface et API                       | Japa/Vitest               | OK      |
| ANN-04 | Contraintes géométriques         | coordonnées 0..1 et rectangle contenu dans le média               | Japa                      | OK      |
| ANN-05 | Lecture chronologique            | numéros, auteur, date, forme, position et texte disponibles       | Vitest/Playwright         | OK      |
| ANN-06 | Édition/suppression              | auteur autorisé ; suppression logique ; autre utilisateur refusé  | Japa                      | OK      |
| ANN-07 | Modération admin                 | action autorisée et auditée sans corps de texte                   | Japa                      | OK      |
| ANN-08 | Changement de version            | anciennes annotations affichées comme historique, overlay inactif | Playwright                | OK      |
| ANN-09 | Client d’un autre projet         | ressource masquée en 404                                          | Japa                      | OK      |
| ANN-10 | Lien avec un commentaire         | identifiants liés exposés sur le commentaire de la publication    | Japa/Vitest               | OK      |
| ANN-11 | URL média privée                 | lecture via URL signée existante, aucune URL R2 permanente        | revue/Japa                | OK      |
| ANN-12 | Axe automatisé                   | aucune violation sérieuse ou critique dans l’espace d’annotation  | Playwright                | OK auto |
| ANN-13 | VoiceOver, zoom et reflow 320 px | parcours utilisable sans perte                                    | préproduction             | À faire |
