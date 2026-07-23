# Sécurité — Tâche 22

Le dump PostgreSQL est produit sans propriétaire ni privilèges, puis chiffré
localement en AES-256-GCM avant tout transfert. La clé est une valeur base64 de
32 octets provenant exclusivement des secrets Coolify. Le SHA-256 porte sur le
fichier chiffré et la vérification R2 compare taille et métadonnée.

Le bucket, l'identifiant d'accès et le secret `BACKUP_R2_*` sont distincts des
credentials média. Le bucket est privé et aucun endpoint de téléchargement
n'est exposé. La page `/admin/backups` est protégée par session et permission
administrateur ; une agence, un client ou un visiteur sont refusés côté API.

Les outils PostgreSQL sont lancés sans shell, avec des arguments séparés. Le
mot de passe est transmis uniquement via `PGPASSWORD` au processus enfant.
Leurs sorties ne sont pas journalisées. Les erreurs persistées appartiennent à
une liste de codes expurgés ; toute erreur inconnue devient
`backup_operation_failed`.

La restauration refuse la base courante et exige un nom suffixé `_restore`,
`_drill` ou `_test`. Le checksum est revérifié avant déchiffrement et
`pg_restore`. Les fichiers temporaires sont supprimés dans un bloc `finally`.

Contrôles restants en préproduction : moindre privilège réel des credentials,
Bucket Lock, alerte Push, restore drill sur une base jetable et rotation
documentée de la clé.
