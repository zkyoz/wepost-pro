# Sécurité — Tâche 10

## Autorisation et isolation

Les routes utilisent la session AdonisJS, CSRF et les permissions centralisées. Admin/agence connectent, renouvellent, programment, relancent et révoquent ; un client affecté consulte uniquement le statut. Les comptes sont filtrés par réseau et agence, et les ressources étrangères restent masquées.

## OAuth et secrets

- `state` aléatoire 256 bits, chiffré/signé, lié à l’acteur, l’agence et l’organisation, valable dix minutes et consommable une fois ;
- organisation vérifiée via `organizationAcls` et limitée aux rôles autorisés à publier ;
- scopes minimaux `r_organization_admin` et `w_organization_social` ;
- access et refresh tokens chiffrés AES-256-GCM, jamais renvoyés, placés dans un job ou journalisés ;
- expiration suivie et renouvellement programmatique uniquement si LinkedIn fournit réellement un refresh token ; sinon reconnexion explicite ;
- révocation locale effaçant les secrets ; la révocation dans le portail LinkedIn reste une action complémentaire.

PKCE n’est pas ajouté au flux web confidentiel sans preuve de support et de configuration pour le produit LinkedIn retenu. Le support des refresh tokens dépend de l’approbation Marketing Developer Platform et n’est donc jamais supposé.

## Publication et résilience

Le worker revérifie version approuvée, statut, compte, expiration et empreinte SHA-256 du texte/média avant l’appel externe. Une image est chargée par sa clé R2 serveur ; l’URL d’upload retournée est limitée à HTTPS et à un hôte LinkedIn, ce qui bloque une redirection arbitraire vers un hôte utilisateur.

Une contrainte unique protège l’idempotence interne. Les tentatives persistent un code normalisé sans réponse sensible ; timeouts, 429 et 5xx utilisent 1/5/15 minutes, tandis que contenu, permission et token expiré échouent définitivement. Risque résiduel : un crash après création distante mais avant persistance de `x-restli-id` peut demander une réconciliation manuelle, faute de clé d’idempotence distante démontrée.

## Tests

Les tests couvrent state/rejeu, chiffrement et renouvellement, client en écriture, validation, médias, version/empreinte, token expiré, upload, hôte inattendu, timeout, 429, 5xx, erreurs définitives, idempotence, retry et révocation. Aucun appel LinkedIn réel n’est exécuté en CI.
