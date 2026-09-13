# Sécurité — Tâche 09

## Autorisation et isolation

Les routes utilisent la session AdonisJS puis les permissions centralisées. Admin/agence connectent, programment, relancent et révoquent ; un client affecté consulte seulement le statut. L’agence vient du serveur, les comptes sont filtrés par réseau/agence et les ressources étrangères restent masquées.

## OAuth et secrets

- `state` aléatoire 256 bits, chiffré/signé, lié à l’acteur, l’agence et au compte demandé, valable dix minutes et consommable une seule fois ;
- compte professionnel vérifié dans les Pages gérées retournées par Meta ;
- scopes minimaux documentés et absence de token dans les réponses, jobs, logs et audits ;
- tokens chiffrés AES-256-GCM avec une clé distincte par environnement ;
- `appsecret_proof` sur les appels Graph et révocation locale effaçant les secrets.

PKCE n’est pas activé sans confirmation du flux Meta réellement configuré. Le point doit être revu dans le tableau de bord Meta avant recette. Un token expiré impose une reconnexion, sans refresh inventé.

## Publication et résilience

La validation exige la version approuvée, un compte connecté et exactement un JPEG ou MP4 propre. Le serveur choisit la clé R2 ; le worker signe lui-même une URL de lecture courte et n’accepte aucune URL utilisateur, ce qui limite le risque SSRF. Le texte, la clé, le MIME, le checksum et la position sont inclus dans l’empreinte SHA-256 revérifiée avant Meta.

Une contrainte unique protège l’idempotence interne. Le worker persiste les tentatives, normalise les erreurs, applique les retries 1/5/15 minutes aux timeouts, 429 et 5xx, et arrête les erreurs définitives. Limite résiduelle : un crash après création distante mais avant persistance de l’identifiant peut nécessiter une réconciliation manuelle, Meta ne fournissant pas ici une clé d’idempotence distante démontrée.

## Complément — Instagram Login direct et répétition BC03

`INSTAGRAM_LOGIN_MODE=instagram` utilise exclusivement `graph.instagram.com`
et le token utilisateur Bearer ; la preuve de secret Facebook n’est envoyée que
dans le mode Facebook Login. API et worker refusent les comptes d’un mode
incompatible, avant tout appel de publication.

La commande d’import est limitée à une base locale `wepost_demo`, exige un fichier
de token privé (0600), vérifie le nom du compte via Meta et utilise AES-256-GCM.
Elle n’affiche pas le token et ajoute une entrée d’audit sans secret.

Le pont média de test écoute sur loopback et ne sert qu’un chemin opaque vers un
JPEG, sans liste de fichiers ni API. Il expire après 30 minutes. Le worker compare
l’empreinte des octets du média avec celle du JPEG autorisé avant d’en fournir
l’URL HTTPS. Le tunnel est arrêté après le test. R2 reste le fournisseur prévu
pour le stockage durable. Les tokens ne sont jamais placés dans l’URL publique.

## Validation automatisée

Le profil `start-social-r2` remplace le pont de test par R2 privé et efface ses
deux paramètres d'URL/empreinte. Le worker signe uniquement la clé du média
validé pour 1 200 secondes au moment du traitement. La lecture est possible à
toute personne détenant ce lien pendant sa validité ; ne pas l'enregistrer dans
les preuves publiques. La [recette réelle](../evidence/r2-demo/verification.md)
a confirmé une publication, sans duplication de tentative.

Les tests couvrent state/rejeu, chiffrement, rôle client, validation, formats, version et empreinte, token expiré, conteneur image/vidéo, attente, timeout, 429, 5xx, erreurs définitives, idempotence, retry et révocation. Tous les appels Meta sont simulés.
