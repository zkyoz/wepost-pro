# Recette — Tâche 16

Version : arbre local du 23/07/2026. Environnement : macOS, PostgreSQL, Redis, AdonisJS, BullMQ et Nuxt. SHA et préproduction à compléter.

| ID    | Scénario                           | Résultat attendu                                         | Observé local            | Statut  |
| ----- | ---------------------------------- | -------------------------------------------------------- | ------------------------ | ------- |
| AI-01 | Génération nominale                | 2 à 5 propositions bornées et marquées générées          | Japa/Vitest/Playwright   | OK      |
| AI-02 | Choix explicite                    | seule la proposition choisie remplace le texte           | Japa/Playwright          | OK      |
| AI-03 | Aucune publication automatique     | statut métier inchangé après application                 | Japa                     | OK      |
| AI-04 | Historique                         | fournisseur, modèle, prompt, statut et dates disponibles | Japa/Vitest              | OK      |
| AI-05 | Brief sensible                     | e-mail, téléphone et secret détectés sont masqués        | Japa                     | OK      |
| AI-06 | Prompt hostile                     | brief délimité comme donnée non fiable                   | Japa                     | OK      |
| AI-07 | Réponse invalide                   | génération échouée sans application                      | Japa/Vitest worker       | OK      |
| AI-08 | Timeout et retries                 | timeout borné, circuit breaker et échec final            | Japa/Vitest worker       | OK      |
| AI-09 | Quota et rate limit                | abus refusé en 429                                       | Japa                     | OK      |
| AI-10 | Permissions/IDOR                   | client refusé, autre agence masquée en 404               | Japa                     | OK      |
| AI-11 | Annulation                         | seul un travail en attente est annulable                 | Japa/Vitest worker       | OK      |
| AI-12 | Accessibilité automatisée          | aucune violation axe sérieuse/critique du panneau        | Playwright Chromium      | OK      |
| AI-13 | Clavier, VoiceOver, zoom et reflow | parcours complet utilisable                              | préproduction            | À faire |
| AI-14 | Fournisseur réel                   | consentement, contrat et modèle validés                  | configuration production | À faire |
