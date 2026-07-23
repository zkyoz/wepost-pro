# Schéma de données progressif

État après la tâche 20. Les migrations restent la source de vérité.

Les tâches 14 et 15 n’ajoutent aucune donnée dénormalisée. Elles ajoutent uniquement des index pour la supervision et les agrégations statistiques : publications par agence/date/projet, programmations par date/statut/réseau, décisions client, commentaires actifs et médias actifs. Toutes les métriques restent calculées depuis les tables métier qui demeurent la source de vérité.

## Locales et `publication_translations`

`users.locale` contient `fr` ou `en`, vaut `fr` par défaut et conserve le choix d’interface de l’utilisateur.

| Colonne                                    | Type             | Règle                                                 |
| ------------------------------------------ | ---------------- | ----------------------------------------------------- |
| `id`, `agency_id`, `publication_id`        | UUID             | traduction, portée agence et publication              |
| `source_locale`, `target_locale`           | varchar(5)       | `fr` ou `en`, obligatoirement différentes             |
| `source_version`, `source_hash`            | integer/char(64) | version positive et empreinte SHA-256 du texte source |
| `text`                                     | text             | traduction séparée, jamais le texte source            |
| `status`                                   | varchar(20)      | `draft`, `approved` ou `stale`                        |
| `generated_by_ai`, `provider`, `model`     | bool/varchar     | provenance sans secret                                |
| `created_by`, `approved_by`, `approved_at` | UUID/timestamptz | auteur et validation humaine                          |
| `created_at`, `updated_at`                 | timestamptz      | cycle UTC                                             |

Unicité : `(publication_id, target_locale, source_version)`. Index : agence/statut et publication/langue/statut. Une modification source marque les anciennes traductions obsolètes dans la transaction de versionnement.

## `calendar_feed_tokens`

| Colonne                      | Type          | Règle                                                        |
| ---------------------------- | ------------- | ------------------------------------------------------------ |
| `id`, `user_id`              | UUID          | token et propriétaire en clé étrangère                       |
| `project_id`                 | UUID nullable | projet bornant le flux ; `null` signifie tous ceux autorisés |
| `token_hash`                 | char(64)      | SHA-256 unique ; token brut jamais persisté                  |
| `created_at`, `last_used_at` | timestamptz   | création et dernier accès UTC                                |
| `revoked_at`                 | timestamptz   | révocation logique immédiate                                 |

Index : utilisateur/révocation/date et projet/révocation. La suppression physique du propriétaire ou du projet supprime le token technique associé.

## `annotations`

| Colonne                                         | Type                  | Règle                                                       |
| ----------------------------------------------- | --------------------- | ----------------------------------------------------------- |
| `id`, `publication_id`, `media_id`, `author_id` | UUID                  | annotation, publication, média et auteur en clés étrangères |
| `comment_id`                                    | UUID nullable         | commentaire lié, validé dans la même publication            |
| `publication_version`                           | integer               | version positive figée côté serveur                         |
| `media_version`                                 | char(64)              | checksum immuable du média annoté                           |
| `shape`                                         | varchar(20)           | `point` ou `rectangle`                                      |
| `x`, `y`, `width`, `height`                     | numeric(6,5) nullable | coordonnées normalisées 0..1 ; dimensions pour rectangle    |
| `body`                                          | text                  | source textuelle accessible, 1 à 2 000 caractères en base   |
| `created_at`, `updated_at`, `deleted_at`        | timestamptz           | cycle UTC et suppression logique                            |

Les contraintes interdisent les coordonnées hors média, les rectangles débordants et les dimensions sur un point. Index : média/version/date, publication/version/date, auteur et commentaire.

## `publication_network_variants`

| Colonne                     | Type        | Règle                                                   |
| --------------------------- | ----------- | ------------------------------------------------------- |
| `id`, `publication_id`      | UUID        | variante et publication en FK avec cascade technique    |
| `network`                   | varchar(30) | réseau social validé                                    |
| `source_version`            | integer     | version positive du texte source                        |
| `text`                      | text        | texte brut de la variante                               |
| `status`                    | varchar(20) | `draft`, `approved` ou `stale`                          |
| `generated_by_ai`           | boolean     | provenance de création, conservée après édition humaine |
| `created_by`, `approved_by` | UUID        | auteur et approbateur nullable en FK                    |
| `approved_at`, `stale_at`   | timestamptz | approbation et invalidation UTC                         |
| `created_at`, `updated_at`  | timestamptz | cycle de vie UTC                                        |

Unicité : `(publication_id, network, source_version)`. Index : publication/statut. Une modification source marque les variantes précédentes obsolètes dans la transaction de versionnement.

## `ai_generations`

| Colonne                                                    | Type             | Règle                                                          |
| ---------------------------------------------------------- | ---------------- | -------------------------------------------------------------- |
| `id`, `agency_id`, `publication_id`                        | UUID             | génération, portée agence et publication en FK                 |
| `provider`, `model`, `prompt_version`                      | varchar          | provenance technique explicite                                 |
| `input_hash`                                               | char(64)         | empreinte du brief nettoyé et des paramètres, jamais le secret |
| `output_json`                                              | jsonb            | variantes validées et avertissements                           |
| `status`                                                   | varchar(30)      | `queued`, `processing`, `completed`, `failed` ou `cancelled`   |
| `usage_json`                                               | jsonb            | latence et usage fournisseur lorsque disponible                |
| `error_code`, `applied_variant_id`                         | varchar nullable | erreur expurgée et choix humain                                |
| `created_by`                                               | UUID             | auteur en FK, utilisé pour le quota                            |
| `created_at`, `completed_at`, `cancelled_at`, `applied_at` | timestamptz      | cycle de vie UTC                                               |

Index : `(publication_id, created_at)`, `(agency_id, status, created_at)` et `(created_by, created_at)`. Aucun secret fournisseur ni brief brut n’est stocké.

## `social_accounts`

| Colonne                                             | Type                 | Règle                                        |
| --------------------------------------------------- | -------------------- | -------------------------------------------- |
| `id`, `agency_id`                                   | UUID                 | clé primaire et portée agence                |
| `network`                                           | varchar(30)          | `facebook` pour cette tâche                  |
| `external_account_id`, `external_account_name`      | varchar              | Page explicitement sélectionnée              |
| `encrypted_access_token`, `encrypted_refresh_token` | text nullable        | chiffrement AES-256-GCM, jamais sérialisé    |
| `expires_at`, `revoked_at`                          | timestamptz nullable | expiration et révocation UTC                 |
| `scopes`                                            | jsonb                | permissions réellement accordées             |
| `status`                                            | varchar(30)          | `connected`, `expired`, `revoked` ou `error` |
| `created_at`, `updated_at`                          | timestamptz          | UTC                                          |

Unicité : `(agency_id, network, external_account_id)`. Index : agence/réseau et statut/expiration.

## `scheduled_publications`

| Colonne                              | Type                  | Règle                                                      |
| ------------------------------------ | --------------------- | ---------------------------------------------------------- |
| `id`, `publication_id`, `account_id` | UUID                  | programmation, publication et compte social                |
| `network`                            | varchar(30)           | réseau ciblé                                               |
| `publication_version`                | integer               | version approuvée figée                                    |
| `run_at`                             | timestamptz           | exécution UTC                                              |
| `status`                             | varchar(30)           | `queued`, `publishing`, `published`, `failed`, `cancelled` |
| `idempotency_key`                    | char(64)              | empreinte unique publication/réseau/version/compte         |
| `payload_hash`                       | char(64)              | empreinte du texte et des médias ordonnés                  |
| `network_payload_json`               | jsonb                 | paramètres réseau figés à la programmation                 |
| `provider_job_id`                    | varchar(255) nullable | `publish_id` TikTok conservé avant polling                 |
| `provider_status`                    | varchar(64) nullable  | dernier statut distant TikTok                              |
| `created_at`, `updated_at`           | timestamptz           | UTC                                                        |

## `publication_attempts`

| Colonne                     | Type                  | Règle                                    |
| --------------------------- | --------------------- | ---------------------------------------- |
| `id`, `scheduled_id`        | UUID                  | tentative et programmation               |
| `attempt`                   | integer               | numéro positif, unique par programmation |
| `started_at`, `finished_at` | timestamptz nullable  | chronologie UTC                          |
| `result`                    | varchar(40)           | état normalisé de la tentative           |
| `normalized_error`          | jsonb nullable        | catégorie/code expurgés                  |
| `remote_post_id`            | varchar(255) nullable | identifiant distant dès réception        |

Index : `(scheduled_id, started_at)` et identifiant distant.

## `comments`

| Colonne                                 | Type        | Règle                                             |
| --------------------------------------- | ----------- | ------------------------------------------------- |
| `id`                                    | UUID        | clé primaire                                      |
| `publication_id`, `author_id`           | UUID        | publication en cascade technique, auteur conservé |
| `body`                                  | text        | texte brut, 5 000 caractères maximum côté API     |
| `created_at`, `edited_at`, `deleted_at` | timestamptz | UTC, édition et suppression logique               |

Index : `(publication_id, created_at)`.

## `publication_reviews`

| Colonne                         | Type          | Règle                                                  |
| ------------------------------- | ------------- | ------------------------------------------------------ |
| `id`                            | UUID          | clé primaire                                           |
| `publication_id`, `reviewer_id` | UUID          | clés étrangères                                        |
| `version`                       | integer       | version positive du contenu évalué                     |
| `decision`                      | varchar(40)   | `approved` ou `changes_requested`                      |
| `message`                       | text nullable | explication, obligatoire pour les corrections côté API |
| `created_at`                    | timestamptz   | UTC                                                    |

Unicité : `(publication_id, reviewer_id, version)`. Index : `(publication_id, created_at)`.

## `notifications`

| Colonne                 | Type                  | Règle                                      |
| ----------------------- | --------------------- | ------------------------------------------ |
| `id`, `user_id`         | UUID                  | notification et destinataire               |
| `type`                  | varchar(80)           | type applicatif contrôlé                   |
| `payload_json`          | jsonb                 | identifiants publication/projet uniquement |
| `read_at`, `created_at` | timestamptz           | lecture nullable et création UTC           |
| `email_status`          | varchar(20)           | `pending`, `sent` ou `failed`              |
| `email_job_id`          | varchar(160) nullable | identifiant BullMQ sans secret             |
| `email_attempts`        | integer               | compteur positif                           |
| `email_last_error`      | varchar(240) nullable | erreur technique générique                 |
| `emailed_at`            | timestamptz nullable  | succès du transport                        |

Index : utilisateur, lecture/date et statut e-mail.

## `media_assets`

| Colonne                               | Type                    | Règle                                                |
| ------------------------------------- | ----------------------- | ---------------------------------------------------- |
| `id`                                  | UUID                    | clé primaire                                         |
| `agency_id`, `uploader_id`            | UUID                    | portée agence et auteur                              |
| `storage_key`                         | varchar(500)            | clé opaque unique décidée par le serveur             |
| `original_name`                       | varchar(255)            | affichage uniquement                                 |
| `mime_type`, `size_bytes`, `checksum` | varchar/bigint/char(64) | métadonnées validées après upload                    |
| `width`, `height`, `duration_ms`      | integer/bigint nullable | dimensions/durée détectées                           |
| `alt_text`, `is_decorative`           | text/boolean            | alternative accessible explicite                     |
| `scan_status`                         | varchar(30)             | `pending_upload`, `clean`, `rejected`, `quarantined` |
| `upload_expires_at`                   | timestamptz             | nettoyage des uploads abandonnés                     |
| `created_at`, `deleted_at`            | timestamptz             | UTC et suppression logique                           |

Index : agence, checksum agence, statut/expiration et suppression.

## `publication_media`

| Colonne                      | Type        | Règle                                     |
| ---------------------------- | ----------- | ----------------------------------------- |
| `publication_id`, `media_id` | UUID        | clé primaire composée et FK               |
| `position`                   | integer     | position positive, unique par publication |
| `created_at`                 | timestamptz | UTC                                       |

L’ordre est compacté après dissociation et modifié transactionnellement.

## `publications`

| Colonne                    | Type                 | Règle                                           |
| -------------------------- | -------------------- | ----------------------------------------------- |
| `id`                       | UUID                 | clé primaire                                    |
| `agency_id`, `project_id`  | UUID                 | portée serveur, projet en FK                    |
| `title`                    | varchar(120)         | titre interne obligatoire                       |
| `base_text`                | text                 | contenu textuel brut                            |
| `status`                   | varchar(40)          | enum de la machine à états                      |
| `target_networks`          | text[]               | réseaux validés                                 |
| `scheduled_at`             | timestamptz nullable | date souhaitée en UTC                           |
| `timezone`                 | varchar(80)          | fuseau IANA de saisie                           |
| `content_version`          | integer              | version optimiste positive                      |
| `approved_version`         | integer nullable     | version approuvée, jamais supérieure au contenu |
| `created_by`, `updated_by` | UUID                 | FK `users`                                      |
| `created_at`, `updated_at` | timestamptz          | UTC                                             |
| `archived_at`              | timestamptz nullable | archivage logique                               |

Index composés : `(agency_id, status)` et `(project_id, status)`.

La tâche 06 ajoute les index de calendrier sur `scheduled_at`, `(agency_id, scheduled_at)` et `(project_id, scheduled_at)` sans ajouter de colonne.

## `publication_versions`

| Colonne          | Type        | Règle                                |
| ---------------- | ----------- | ------------------------------------ |
| `publication_id` | UUID        | FK `publications`, cascade technique |
| `version`        | integer     | version positive                     |
| `snapshot_json`  | jsonb       | instantané textuel et paramètres     |
| `author_id`      | UUID        | FK `users`                           |
| `created_at`     | timestamptz | UTC                                  |

La clé primaire composée `(publication_id, version)` interdit un doublon de version.

## `projects`

| Colonne                    | Type                 | Règle                                           |
| -------------------------- | -------------------- | ----------------------------------------------- |
| `id`                       | UUID                 | clé primaire                                    |
| `agency_id`                | UUID                 | obligatoire, indexé, dérivé du client principal |
| `name`                     | varchar(120)         | obligatoire                                     |
| `description`              | text                 | valeur vide autorisée                           |
| `status`                   | varchar(20)          | `active` ou `archived`, indexé                  |
| `client_user_id`           | UUID                 | FK `users`, indexé                              |
| `timezone`                 | varchar(80)          | fuseau IANA                                     |
| `created_by`               | UUID                 | FK `users`                                      |
| `created_at`, `updated_at` | timestamptz          | UTC                                             |
| `archived_at`              | timestamptz nullable | suppression logique                             |

Index composé : `(agency_id, status)`.

## `project_members`

| Colonne           | Type        | Règle                                             |
| ----------------- | ----------- | ------------------------------------------------- |
| `project_id`      | UUID        | FK `projects`, cascade à la suppression technique |
| `user_id`         | UUID        | FK `users`, indexé                                |
| `membership_role` | varchar(20) | `primary` ou `member`                             |
| `created_at`      | timestamptz | UTC                                               |

La clé primaire composée `(project_id, user_id)` interdit une double affectation. Le client principal est toujours ajouté comme membre `primary`.

## `audit_logs`

Les tâches 03 à 05 ajoutent les cibles projet, publication et média, toutes nullables. La tâche 13 ajoute `entity_type`, `entity_id` et `metadata_json` pour une cible générique. Les lignes stockent l’acteur, l’action, les valeurs précédentes/suivantes expurgées à la lecture et la date UTC.

Un trigger complète automatiquement la cible générique. Un second trigger refuse UPDATE et DELETE du contenu ; seul le détachement `SET NULL` d’une ancienne clé étrangère lors d’une purge est permis, sans modifier la cible générique ni la preuve.

## `backup_runs`

| Colonne                      | Type                  | Règle                              |
| ---------------------------- | --------------------- | ---------------------------------- |
| `id`                         | UUID                  | clé primaire                       |
| `type`                       | varchar(30)           | `database` ou `restore_drill`      |
| `started_at`, `completed_at` | timestamptz           | cycle UTC du run                   |
| `status`                     | varchar(20)           | `running`, `succeeded` ou `failed` |
| `object_key`                 | varchar(512) nullable | clé privée R2, jamais une URL      |
| `checksum`                   | varchar(64) nullable  | SHA-256 du fichier chiffré         |
| `size_bytes`                 | bigint nullable       | taille distante vérifiée           |
| `error_redacted`             | text nullable         | code technique expurgé             |
| `retention_tier`             | varchar(20) nullable  | `daily`, `weekly` ou `monthly`     |
| `verified_at`, `restored_at` | timestamptz nullable  | contrôle distant et restore drill  |

Les contraintes imposent un `completed_at` uniquement pour les runs terminés.
La clé AES et les credentials R2 ne sont jamais stockés dans cette table.
