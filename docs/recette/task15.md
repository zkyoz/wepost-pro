# Recette — Tâche 15

Version : arbre local du 23/07/2026. Environnement : macOS, PostgreSQL, Redis, AdonisJS et Nuxt. SHA et préproduction à compléter.

| ID     | Scénario                     | Résultat attendu                            | Observé local       | Statut  |
| ------ | ---------------------------- | ------------------------------------------- | ------------------- | ------- |
| STA-01 | Synthèse                     | métriques issues des données réelles        | Japa                | OK      |
| STA-02 | Statut/réseau/projet         | agrégations cohérentes                      | Japa                | OK      |
| STA-03 | Taux de succès               | publié ÷ (publié + échoué)                  | Japa unitaire/API   | OK      |
| STA-04 | Approbation client           | délai depuis la dernière mise en revue      | Japa                | OK      |
| STA-05 | Filtres                      | période, projet et réseau appliqués partout | Japa/Vitest         | OK      |
| STA-06 | Audience distante absente    | `N/A`, aucune valeur inventée               | Japa                | OK      |
| STA-07 | Export CSV                   | en-têtes explicites et mêmes filtres        | Japa/Vitest         | OK      |
| STA-08 | Injection CSV                | formule neutralisée                         | Japa                | OK      |
| STA-09 | Accès client/inter-agence    | refus ou résultats vides sans fuite         | Japa                | OK      |
| STA-10 | Volumétrie 20 × 40           | réponse sous 500 ms                         | Japa : 3,22 ms      | OK      |
| STA-11 | Dashboard et export          | filtre, tableau, téléchargement et axe      | Playwright Chromium | OK      |
| STA-12 | Clavier/lecteur d’écran/zoom | parcours utilisable                         | préproduction       | À faire |
