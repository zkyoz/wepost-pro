# Sécurité — Tâche 08

## Autorisation et isolation

Les routes utilisent la session AdonisJS puis la permission centralisée `social.manage`. Admin/agence connectent, programment, relancent et révoquent ; un client affecté consulte uniquement le statut. Les comptes sont reliés à l’agence dérivée côté serveur et les ressources étrangères répondent 404.

## OAuth et secrets

- `state` aléatoire 256 bits, chiffré/signé par AdonisJS, lié à l’utilisateur, à l’agence et à la Page, expirant après dix minutes et consommable une seule fois ;
- Page explicitement sélectionnée puis vérifiée dans la liste des Pages gérées ;
- scopes limités à `pages_show_list`, `pages_read_engagement` et `pages_manage_posts` ;
- échange contre un token longue durée lorsque le driver réel est actif ;
- tokens chiffrés avec AES-256-GCM et clé dédiée de 32 octets, distincte par environnement ;
- `appsecret_proof` ajouté aux appels Graph et Bearer transmis uniquement à Meta ;
- aucun token dans les réponses, jobs, logs ou audits ; révocation locale effaçant les secrets.

PKCE n’est pas activé sans confirmation officielle pour le flux Page réellement configuré. Cette décision doit être revue dans le tableau de bord Meta avant recette. Un token expiré impose une reconnexion explicite : aucun mécanisme de refresh inventé n’est ajouté.

## Publication et résilience

La programmation possède une contrainte unique sur la clé d’idempotence et gère aussi la course concurrente PostgreSQL. L’empreinte SHA-256 du texte, de l’ordre, des clés, MIME et checksums médias est mémorisée. Le worker revérifie statut, version approuvée et empreinte avant tout appel. Il recharge les octets depuis R2 privé, n’accepte aucune URL fournie par le client et persiste l’identifiant distant dès le succès.

Les erreurs 429, 5xx, réseau et timeout sont transitoires ; permissions, contenu, version et expiration sont définitifs. BullMQ exécute une tentative initiale puis trois retries espacés de 1, 5 et 15 minutes. Les réponses Meta sont réduites à un identifiant, une date et un code normalisé.

Limite résiduelle : Meta ne fournit pas ici de clé d’idempotence distante vérifiée. Un crash entre la création distante et la transaction locale peut donc nécessiter une réconciliation manuelle. Après persistance de l’identifiant distant, tout retry est ignoré.

## Tests

Les tests couvrent OAuth/state/rejeu, chiffrement, scopes, IDOR, rôle client, validation, MIME, empreinte, concurrence interne, succès, timeout, réseau, 429, 5xx, permission, token expiré, retry final, relance et absence d’appel Facebook réel en CI.
