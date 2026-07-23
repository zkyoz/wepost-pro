# Sécurité — Tâche 11

## Autorisation et isolation

Les routes utilisent session AdonisJS, CSRF et permissions centralisées. Admin/agence connectent, renouvellent, programment, relancent et révoquent ; un client affecté consulte seulement le statut. Comptes, publications et tableaux restent filtrés par agence et projet, avec réponses 404 pour les ressources étrangères.

## OAuth et secrets

- `state` aléatoire de 256 bits, chiffré/signé, lié à l’acteur et à l’agence, valable dix minutes et consommable une fois ;
- scopes minimaux `user_accounts:read`, `boards:read`, `pins:read`, `pins:write` ;
- access et refresh tokens chiffrés AES-256-GCM, jamais renvoyés, placés dans un job ou journalisés ;
- expiration access/refresh suivie et renouvellement avec `grant_type=refresh_token` ;
- révocation locale effaçant les secrets ; la révocation côté Pinterest reste complémentaire.

PKCE n’est pas supposé sans support confirmé pour le flux confidentiel retenu. Le `state` reste obligatoire. Les URLs API réelles sont limitées aux hôtes HTTPS Pinterest production/sandbox.

## Publication et résilience

Le worker revérifie version approuvée, compte, expiration et empreinte SHA-256 du payload/média. Il signe une lecture R2 courte et envoie uniquement cette URL à `POST /v5/pins`. Tableau, titre, description, URL et MIME sont validés côté serveur.

La contrainte unique protège l’idempotence interne. Les tentatives stockent un code normalisé sans réponse sensible ; timeout, 429 et 5xx utilisent 1/5/15 minutes, tandis que contenu, permission et token expiré échouent définitivement. Risque résiduel : un crash après création distante mais avant persistance de l’identifiant exige une réconciliation, faute de garantie distante d’idempotence démontrée.

## Tests

Les tests couvrent state/rejeu, sélection d’agence, chiffrement/renouvellement, IDOR, CSRF via le socle, tableau/lien/média invalides, ressources absentes, empreinte, version, expiration, timeout, 429, 5xx, erreurs définitives, retry et révocation. Aucun appel Pinterest réel n’est effectué en CI.
