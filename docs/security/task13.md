# Sécurité — Tâche 13

Toutes les routes `/api/v1/admin/*` cumulent session Adonis, permission centralisée `users.manage` et deny-by-default. Les mutations utilisent Shield CSRF, validateurs VineJS, endpoints dédiés et rate limiting par administrateur. Les tests rejettent systématiquement les rôles agence et client, les champs supplémentaires ne déterminent jamais l’agence ou l’état d’une ressource.

Les comptes sociaux sont transformés par liste blanche : aucun access token, refresh token ou `metadata_json` n’est sérialisé. Les erreurs d’incident et valeurs d’audit sont expurgées récursivement. Le dernier administrateur actif est protégé dans une transaction verrouillant les comptes administrateurs concurrents.

La migration Task 13 ajoute une cible générique et des métadonnées à `audit_logs`. Un trigger PostgreSQL interdit UPDATE/DELETE du contenu. Seul le passage automatique d’une ancienne clé étrangère vers `NULL` est accepté lors d’une purge, tandis que `entity_type` et `entity_id` conservent la preuve d’origine. Aucune route d’écriture d’audit n’est exposée.

Les actions sont journalisées avec acteur, cible et compteur `admin_action_total`. L’alerte sur désactivations massives doit être configurée dans l’outil de monitoring de production.
