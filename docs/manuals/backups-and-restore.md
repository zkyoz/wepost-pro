# Manuel — Sauvegardes et restauration

## Architecture

La commande `pnpm backup:database` :

1. crée une ligne `backup_runs` en état `running` ;
2. exécute `pg_dump` au format custom, sans propriétaire ni privilèges ;
3. chiffre le dump localement en AES-256-GCM avec une clé de 32 octets ;
4. calcule le SHA-256 du fichier chiffré ;
5. transfère uniquement ce fichier dans un bucket R2 privé dédié ;
6. vérifie à distance la taille et le checksum stocké en métadonnée ;
7. marque le run `succeeded`, purge les objets expirés et notifie Uptime Kuma ;
8. détruit les fichiers temporaires, y compris après une erreur.

Le dump en clair ne quitte jamais le répertoire temporaire du processus. Aucun
secret ou contenu de dump n'est enregistré dans PostgreSQL ou dans les logs.
Le statut `succeeded` atteste le transfert et l'intégrité distante. La
sauvegarde n'est présentée comme validée/restaurable qu'après un restore drill
réussi, matérialisé par `restored_at`.

## Prérequis Coolify

- installer les clients PostgreSQL 17 `pg_dump` et `pg_restore` dans l'image
  d'exécution de l'API ;
- créer un bucket R2 privé distinct du bucket média ;
- créer des credentials R2 dédiés limités à ce bucket ;
- générer une clé avec
  `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` ;
- stocker la clé et les credentials uniquement dans les secrets Coolify ;
- créer une tâche planifiée quotidienne, par exemple à `02:15 UTC`, qui exécute
  `pnpm backup:database` dans une seule instance ;
- créer un moniteur Push Uptime Kuma et renseigner
  `UPTIME_KUMA_BACKUP_PUSH_URL`.

Ne pas lancer deux sauvegardes simultanément. La planification définitive et
les destinataires d'alerte sont des décisions d'exploitation à valider.

## Rétention

Le premier jour UTC du mois produit un objet `monthly`, le dimanche UTC un
objet `weekly`, et les autres jours un objet `daily`.

| Niveau       | Conservation |
| ------------ | ------------ |
| quotidienne  | 30 jours     |
| hebdomadaire | 12 semaines  |
| mensuelle    | 12 mois      |

La purge ne touche que les clés reconnues sous `BACKUP_R2_PREFIX`. Une règle
[Bucket Lock R2](https://developers.cloudflare.com/r2/buckets/bucket-locks/)
doit protéger le préfixe de sauvegarde contre une suppression anticipée. Les
règles de verrouillage priment sur les
[règles de cycle de vie](https://developers.cloudflare.com/r2/buckets/object-lifecycles/).

## Protection des médias

R2 ne doit pas être considéré comme un système de versioning applicatif. La
récupération des médias repose sur :

- la suppression logique `media_assets.deleted_at` pendant 30 jours ;
- un Bucket Lock de 30 jours sur le préfixe média ;
- la purge applicative uniquement après cette période ;
- un inventaire régulier comparant PostgreSQL aux objets R2.

Une copie inter-bucket indépendante peut être ajoutée après définition du RPO
et du budget. Elle n'est pas déclarée active tant qu'elle n'a pas été vérifiée.

## Test de restauration

1. créer une base vide temporaire dont le nom termine par `_restore`,
   `_drill` ou `_test` ;
2. utiliser des credentials limités à cette base ;
3. renseigner les variables `RESTORE_DB_*` ;
4. exécuter `pnpm backup:restore-drill` pour la dernière sauvegarde vérifiée,
   ou `pnpm backup:restore-drill -- <object_key>` pour une clé précise ;
5. vérifier les migrations et comparer les volumes essentiels ;
6. démarrer une API isolée sur cette base et exécuter les smoke tests ;
7. consigner le résultat dans `docs/recette/task22.md` ;
8. détruire la base temporaire après conservation des preuves.

La commande refuse la base applicative courante et tout nom ne portant pas un
suffixe d'isolation. Elle télécharge l'objet privé côté serveur, vérifie son
checksum, authentifie le chiffrement puis exécute `pg_restore`.

## Incident

En cas d'échec :

1. consulter le code expurgé dans `/admin/backups` ;
2. vérifier l'espace disque temporaire, la présence de `pg_dump`, PostgreSQL et
   les permissions du bucket ;
3. ne jamais copier une URL Push, une clé ou un mot de passe dans un ticket ;
4. corriger la cause puis relancer la tâche planifiée ;
5. vérifier l'objet distant et programmer un restore drill ;
6. déclarer l'incident si la dernière sauvegarde valide dépasse le RPO.

RPO et RTO définitifs : **TODO à valider avec le responsable d'exploitation**.
