# Sécurité — Tâche 05

## Stockage privé

Le frontend ne reçoit jamais les identifiants R2. L’API génère une clé opaque indépendante du nom original et signe uniquement un PUT au type MIME fixé ou un GET, pour une durée configurable de 300 secondes par défaut. Le bucket doit rester privé. Les origines R2 sont limitées à l’URL exacte du frontend et exposent seulement `ETag`.

Les principes suivent la documentation Cloudflare sur les [URLs présignées R2](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), l’[AWS SDK JavaScript](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js/) et la [configuration CORS](https://developers.cloudflare.com/r2/buckets/cors/).

## Validation après upload

Complément BC03 : les clés S3 sont lues depuis `.demo/r2.env` (0600, ignoré par
Git), limitées au bucket de démonstration et exclues de l'environnement Nuxt.
La CSP autorise seulement l'origine R2 configurée pour les connexions et médias,
sans l'ajouter aux scripts. Le SDK ne signe pas un checksum vide avant le PUT
navigateur ; les vérifications serveur ci-dessous restent actives. Une signature
expirée a effectivement retourné HTTP 403 dans la [recette R2](../evidence/r2-demo/verification.md).

- limite serveur configurable, contrôlée avant et pendant le transfert local ;
- lecture serveur de l’objet après upload ;
- type réel détecté par signature binaire, jamais par extension seule ;
- type déclaré signé comparé au type réel ;
- taille et checksum SHA-256 comparés aux valeurs initiales ;
- dimensions extraites pour PNG, JPEG, GIF et WebP ; dimensions/durée préparées pour MP4 ;
- doublon propre à l’agence détecté par checksum ;
- fichier invalide marqué rejeté puis supprimé du stockage.

## Autorisation et cycle de vie

Les mutations nécessitent `projects.manage`, puis une portée admin/agence. Le client affecté obtient uniquement la lecture signée ; une autre agence reçoit 404. La suppression place d’abord le média en corbeille et retire ses associations. La purge physique est impossible tant que `deleted_at` est nul et génère un audit.

## Antivirus et quarantaine

La colonne `scan_status` prévoit `quarantined`, mais aucun moteur antivirus n’est disponible dans l’environnement actuel. La validation binaire est active ; avant ouverture à des fichiers non maîtrisés en production, ajouter un worker antivirus et ne passer à `clean` qu’après son verdict. Cette limite est volontairement documentée, pas masquée.
