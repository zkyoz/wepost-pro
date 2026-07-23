# Sécurité — Tâche 15

Les routes `GET /api/v1/statistics` et `GET /api/v1/statistics/export.csv` exigent la session Adonis et la permission centralisée `statistics.read`, accordée uniquement à l’agence et à l’administrateur. Toutes les requêtes agence ajoutent `agency_id` depuis la session ; aucun périmètre envoyé par le navigateur n’est considéré comme une autorisation. Un projet extérieur produit donc des métriques vides sans confirmer son existence.

Les dates, UUID et réseaux sont validés. La période est ordonnée et limitée à 366 jours. Les agrégations sont bornées par la période et appuyées par des index dédiés. L’export place une apostrophe devant toute cellule commençant par `=`, `+`, `-`, `@`, tabulation ou retour chariot, puis applique l’échappement CSV standard afin de prévenir l’exécution de formules.

Aucun token OAuth, contenu de commentaire ou média n’est renvoyé. Les logs structurés contiennent seulement acteur, période, volume et durée. Les données distantes non disponibles sont signalées `N/A` et ne déclenchent aucun appel externe.
