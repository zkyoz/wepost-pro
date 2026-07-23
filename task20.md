# Tâche 20 — Traduction

Implémenter l’interface FR/EN, la locale utilisateur et les traductions versionnées des publications en respectant `context.md`.

Points obligatoires :

- messages structurés et parité des clés contrôlée par les tests CI ;
- attribut `lang`, dates et nombres localisés ;
- `users.locale` limité à `fr | en` ;
- traduction générée via une abstraction du fournisseur IA, sans appel réel en CI ;
- texte source conservé, traduction éditable puis approuvée humainement ;
- obsolescence après changement de version source ;
- accès en lecture selon le projet, écriture réservée à l’agence et à l’admin ;
- tests, recette, sécurité, accessibilité, preuves et changelog.
