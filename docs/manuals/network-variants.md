# Manuel — Variantes de publication par réseau

## Utilisation

Depuis le détail d’une publication, l’agence ou l’administrateur sélectionne un onglet réseau. Il peut saisir une variante, la générer avec le fournisseur IA configuré, la relire puis l’approuver. Le bouton de génération groupée crée un brouillon pour chaque réseau ciblé ; il n’applique, ne programme et ne publie rien.

Le panneau compare toujours le texte source et la variante en texte lisible. Une modification manuelle remet une variante approuvée en brouillon. Un client affecté au projet peut consulter les variantes et les approuver uniquement pendant l’étape `awaiting_client_review`.

## Version et fallback

Une variante appartient à un numéro de `content_version`. Toute modification du texte principal marque transactionnellement les variantes plus anciennes `stale`. Une variante brouillon, obsolète ou issue d’une autre version est ignorée : le texte source devient le fallback.

Lors de la programmation, l’API choisit la variante approuvée de la version courante, puis fige ce texte et l’identifiant de variante dans `scheduled_publications.network_payload_json`. Le worker utilise cette copie figée ; une édition ultérieure ne change donc jamais un job déjà programmé.

## Configuration des limites

Les variables suivantes sont facultatives :

```dotenv
NETWORK_TEXT_LIMIT_FACEBOOK=<verified_limit>
NETWORK_TEXT_LIMIT_INSTAGRAM=<verified_limit>
NETWORK_TEXT_LIMIT_LINKEDIN=<verified_limit>
NETWORK_TEXT_LIMIT_PINTEREST=<verified_limit>
NETWORK_TEXT_LIMIT_TIKTOK=<verified_limit>
```

Ne renseigner une valeur qu’après vérification de la documentation officielle et noter sa source/date dans la documentation de l’adaptateur. Sans valeur, l’interface annonce que la limite officielle reste à configurer ; l’API conserve une borne de sécurité générale de 20 000 caractères mais ne prétend pas connaître une limite plateforme.

## Exploitation

Les états sont `draft`, `approved` et `stale`. Les audits `publication.network_variant_*` ne contiennent pas le texte. En cas de fallback inattendu, vérifier le réseau, la version source, l’état approuvé et l’éventuelle invalidation avant de relancer une génération.
