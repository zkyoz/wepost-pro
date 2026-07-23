# Sécurité — Tâche 17

Toutes les routes exigent la session Adonis. La lecture utilise `projects.read`, la gestion `ai.generate` et l’approbation `projects.review`. La publication et le projet sont résolus depuis l’utilisateur connecté : aucun `agency_id` envoyé par le navigateur n’est accepté et un accès inter-agence renvoie 404.

Les réseaux sont validés par enum et le texte par VineJS, puis par une limite réseau configurable lorsqu’elle est vérifiée. La borne générale de 20 000 caractères protège l’API sans être présentée comme une limite officielle. Les textes sont rendus par interpolation Vue, sans HTML dynamique. Les prompts réutilisent le fournisseur protégé de la tâche 16 et ne modifient jamais le texte source.

L’approbation vérifie que `source_version` correspond encore à `content_version`. Une modification source invalide les variantes dans la même transaction que la nouvelle version. Seule une variante `approved` courante peut devenir le texte effectif ; sinon le service revient au texte source.

La programmation fige le texte effectif et l’identifiant de variante dans le payload du job. Le worker ne relit pas une variante mutable. Les logs et audits conservent les identifiants, le réseau, le statut et la version, jamais le corps du texte ni un secret fournisseur. Les tests couvrent client en écriture, IDOR, variante obsolète et fallback.
