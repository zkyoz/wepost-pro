# Sécurité — Tâche 18

Toutes les routes exigent la session Adonis puis la permission `projects.read`. La publication, le média et le projet sont résolus côté serveur ; aucun `agency_id`, numéro de version ou propriétaire transmis par le navigateur n’est considéré comme une autorité. Un client extérieur au projet reçoit 404 afin de limiter l’énumération.

La création fige `publications.content_version` et l’empreinte du média côté serveur. VineJS, le domaine et PostgreSQL appliquent les bornes 0..1, une forme contrôlée, un rectangle contenu dans l’image et un texte non vide de 2 000 caractères maximum. Le lien optionnel vers un commentaire est accepté uniquement si ce commentaire appartient à la même publication.

L’édition et la suppression logique sont réservées à l’auteur ; un administrateur peut modérer avec un audit dédié. Les audits conservent identifiants, forme, version et longueurs avant/après, jamais le commentaire. Le texte est rendu par interpolation Vue, sans HTML dynamique, et les logs techniques ne contiennent pas son corps.

La visionneuse réutilise l’URL de lecture signée et courte fournie par le service média. Aucune clé R2, URL permanente ou clé de stockage n’est ajoutée au frontend. Les tests couvrent IDOR, propriété de l’auteur, géométrie invalide, version historique et suppression logique.
