# Journal des versions et déploiements

Dernière vérification : 12 août 2026.

## Versions

| Version | Publication | Déploiement persistant | Référence | Contenu synthétique |
| --- | --- | --- | --- | --- |
| `v0.1.0-rc.1` | 23 juillet 2026 à 16:30 Europe/Paris | aucun | [release](https://github.com/zkyoz/wepost-pro/releases/tag/v0.1.0-rc.1), commit [`3164aa7`](https://github.com/zkyoz/wepost-pro/commit/3164aa7116c80529f029fb0a62092135d8dd4245) | première prérelease fonctionnelle ; socle Nuxt, API, worker, domaines métier, CI et documentation |
| `Unreleased` | aucune | aucun | `develop` au `46b1032` plus PR [#23](https://github.com/zkyoz/wepost-pro/pull/23) | sécurité des dépendances, `BUG-022`, supervision, déploiement éphémère et documentation de maintenance |

`v0.1.0-rc.1` est une release GitHub, pas une version déployée. Aucun tag
`v0.1.0-rc.2` n'existe à cette date.

## Exécutions de validation

| Date | SHA | Environnement | Résultat | Qualification |
| --- | --- | --- | --- | --- |
| 23 juillet 2026 | `3164aa7` | GitHub Actions | CI de release verte | validation, sans service persistant |
| 8 août 2026 | `00494b6` puis `46b1032` | GitHub Actions | CI corrective et post-fusion vertes | correction intégrée à `develop`, non publiée |
| 12 août 2026 | `c28ec94` | GitHub Actions | build API, démarrage compilé et smoke tests verts | déploiement éphémère, détruit après le job |

## Correctifs

- [`v0.1.0-rc.1`](corrections/v0.1.0-rc.1.md) ;
- [`Unreleased`](corrections/unreleased.md) ;
- anomalie encore ouverte : [BUG-024](https://github.com/zkyoz/wepost-pro/issues/24).

Une date de déploiement n'est renseignée qu'après déploiement persistant du tag
concerné dans Coolify, avec SHA, environnement, migrations et smoke tests.
