# Preuves — Tâche 05

## Résumé

La tâche ajoute un stockage média privé avec adaptateurs local et Cloudflare R2, URLs PUT/GET signées, validation binaire après transfert, association ordonnée aux publications, alternatives accessibles et cycle suppression logique puis purge.

## Code structurant

- migration `1784754000000_create_media_assets.ts` ;
- modèles `MediaAsset` et `PublicationMedia` ;
- domaine `media_validation.ts`, abstraction `media_storage.ts` et service de portée ;
- contrôleur, validateurs et onze routes médias ;
- composable Nuxt et `PublicationMediaManager.vue` ;
- exemple CORS R2 dans `infra/coolify/r2-cors.example.json` ;
- suites Japa, Vitest et parcours Playwright multi-rôles étendu.

## Résultats locaux du 22/07/2026

| Contrôle                                          | Résultat                    |
| ------------------------------------------------- | --------------------------- |
| API Japa                                          | 59/59                       |
| Frontend Vitest                                   | 33/33                       |
| Playwright                                        | 10/10, desktop et mobile    |
| Couverture API lignes / branches / fonctions      | 86,95 % / 78,37 % / 85,40 % |
| Services média lignes / branches / fonctions      | 85,15 % / 64,28 % / 69,56 % |
| Couverture frontend lignes / branches / fonctions | 89,28 % / 87,50 % / 79,59 % |
| Composable média lignes / branches / fonctions    | 82,60 % / 60 % / 72,72 %    |
| lint / format / typecheck / builds                | OK                          |

## Sécurité et observabilité

- clé opaque décidée par le serveur et préfixée par environnement/agence ;
- détection magic bytes, comparaison MIME, taille et SHA-256 ;
- URLs à durée courte et bucket R2 privé ;
- contrôle agence/projet et réponses 403/404 testés ;
- stockage consommé journalisé par publication et agence, avertissement à 90 % du quota configuré ;
- erreurs de signature, lecture et validation journalisées sans URL signée ni secret.

## Preuves externes restantes

Ajouter après promotion : SHA, run CI rouge/vert, configuration CORS du bucket sans secret, captures UI, attributs de la requête signée sans sa valeur et procès-verbal RGAA manuel.
