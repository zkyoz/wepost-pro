# Sécurité — Tâche 14

Les routes `/api/v1/supervision/*` utilisent la session Adonis et la permission centralisée `supervision.read`, accordée uniquement aux rôles `admin` et `agency`. Pour une agence, toutes les requêtes ajoutent systématiquement la portée `agency_id` issue de la session ; aucun identifiant d’agence transmis par le navigateur n’est accepté.

Les filtres UUID, réseau, catégorie, période et pagination sont validés et bornés. Un identifiant de client ou projet extérieur renvoie une liste vide sans confirmer son existence. Une notification ne peut être marquée lue que par son destinataire. La mutation utilise CSRF et rate limiting.

Les réponses n’exposent pas le corps des commentaires. Les logs contiennent uniquement acteur, catégorie, volumes et temps de réponse ; aucun contenu de commentaire, token ou donnée OAuth n’y figure.
