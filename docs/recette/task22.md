# Recette — Tâche 22

Version : arbre local du 23/07/2026. SHA et préproduction à compléter.

| ID     | Scénario             | Résultat attendu                                  | Observé local | Statut  |
| ------ | -------------------- | ------------------------------------------------- | ------------- | ------- |
| BAK-01 | Rétention            | tiers et objets expirés corrects                  | Japa          | OK      |
| BAK-02 | Chiffrement          | dump illisible sans clé et restauré à l'identique | Japa          | OK      |
| BAK-03 | Checksum             | SHA-256 calculé et vérifié                        | Japa          | OK      |
| BAK-04 | Erreur               | code expurgé et alerte Push simulée               | Japa          | OK      |
| BAK-05 | Historique admin     | résumé et runs sans secret                        | Japa          | OK      |
| BAK-06 | Accès non-admin      | visiteur 401, agence/client 403                   | Japa          | OK      |
| BAK-07 | Page accessible      | tableau et axe sans erreur bloquante              | Playwright    | OK      |
| BAK-08 | Sauvegarde R2 réelle | objet chiffré et vérifié                          | préproduction | À faire |
| BAK-09 | Restore drill réel   | base temporaire restaurée et contrôlée            | préproduction | À faire |
| BAK-10 | Purge réelle         | objets hors rétention supprimés                   | préproduction | À faire |

Le test de restauration réel ne peut être déclaré valide qu'après exécution sur
une base isolée et ajout de la date, du testeur, du SHA et des contrôles
fonctionnels observés.

Le parcours Chromium du 23/07/2026 ouvre la page administrateur, vérifie le
tableau, exécute axe sans violation sérieuse ou critique et génère la capture
`docs/evidence/task22/screenshots/backups-desktop.png`.
