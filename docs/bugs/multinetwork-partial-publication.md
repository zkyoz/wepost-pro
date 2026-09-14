# Diffusion multiréseau : second réseau bloqué après un premier succès

**Mise à jour de recette :** la reprise LinkedIn et une nouvelle diffusion sur
les deux réseaux ont depuis réussi, une seule tentative par cible. Voir le
[compte rendu de recette réelle](../recette/multinetwork-live.md).
Les sections ci-dessous conservent les étapes historiques du diagnostic.

Détection : 14 septembre 2026, répétition locale sur macOS, branche
`codex/bc03-demo`, base Git `208297c` avec modifications locales.
Criticité proposée : S2, priorité P1 (parcours principal de diffusion bloqué).
Fréquence : reproductible dans l'ordre décrit ci-dessous.

## Reproduction et cause

1. Approuver une publication ciblant Instagram et LinkedIn.
2. Programmer uniquement Instagram et laisser le worker terminer.
3. Tenter de programmer LinkedIn sur la même version approuvée.

La fiche devient prématurément `published` ; LinkedIn répond HTTP 422.
L'agrégation du worker regardait uniquement les programmations existantes,
pas les réseaux ciblés sans programmation. La validation LinkedIn refuse
ensuite ce statut, même si la version du contenu est toujours approuvée.
L'actualisation d'un panneau ne rechargeait pas non plus le résumé global.

## Correction

- Le worker agrège les réseaux ciblés et les programmations de la version
  courante. Un réseau restant empêche le passage global à `published`.
- Les fins de traitement sont sérialisées par verrou sur la publication,
  avant la modification des programmations. Les débuts de tentative suivent
  le même ordre de verrouillage.
- `ensurePublished` utilise deux instructions SQL successives dans une
  transaction pour lire le résultat de sa propre mise à jour.
- Les résultats d'une ancienne version ne remplacent pas une nouvelle
  demande de validation.
- Pour les anciennes fiches déjà mal classées, les services LinkedIn et
  Instagram autorisent le réseau restant seulement si la version est toujours
  approuvée, ce réseau est ciblé, un autre réseau a réussi sur cette version
  et aucune programmation du réseau demandé n'existe.
- L'interface permet cette reprise après validation positive du serveur.
  L'actualisation d'un réseau recharge également le résumé de la fiche.

Les statuts existants sont conservés : une cible manquante conserve
`scheduled` ; une erreur définitive sans job actif donne `failed`.
Les programmations explicitement annulées restent terminales comme auparavant.

## Vérifications automatisées

Avant correction : le test HTTP de reprise LinkedIn échoue ; quatre des six
nouveaux tests SQL worker échouent. Après correction :

| Suite | Résultat |
| --- | --- |
| API Japa complète | 213 tests réussis |
| Frontend Vitest complet | 119 tests réussis |
| Worker Vitest complet | 116 tests réussis |
| TypeScript et lint API / web / worker | Réussis |
| Builds API / web / worker | Réussis |

Les tests HTTP couvrent les deux ordres Instagram/LinkedIn, le refus sans
approbation, une livraison d'ancienne version, le refus du rôle client,
la double programmation idempotente et la conservation du premier résultat.
Les tests worker utilisent PostgreSQL avec des tables temporaires propres à
la connexion, exclusivement sur une base dont le nom se termine par `_test`.
La démo `wepost_demo` n'est ni tronquée ni utilisée par ces tests.
Les fournisseurs externes sont simulés : aucun post n'est créé par les tests.

Fichiers de tests : `apps/api/tests/functional/social/linkedin.spec.ts`,
`apps/worker/tests/social_repository.spec.ts` et les deux tests de composants
`apps/web/tests/social/*-publishing-panel.spec.ts`.

## Sécurité, accessibilité et livraison

Permissions agence/projet, CSRF, version approuvée, médias, comptes connectés,
empreintes et idempotence restent contrôlés par le serveur. Aucun secret,
scope OAuth, URL R2 ou contrat HTTP n'est modifié. Les requêtes SQL restent
paramétrées. Les boutons natifs, labels et annonces textuelles sont conservés.
Les tests de composants ne constituent pas un audit RGAA complet.

Aucune migration ni modification manuelle des données existantes. Pour revenir
en arrière, reconstruire la version précédente du code ; le défaut de reprise
réapparaîtrait. Le changement est local : aucun commit, push, merge, tag ou
déploiement distant n'est effectué dans cette intervention. Une nouvelle CI,
une nouvelle mesure de couverture et la répétition publique multiréseau restent
distinctes de ces validations locales.

## Contrôle de la fiche réelle après redémarrage

Les trois applications ont été reconstruites et relancées avec le profil local
`start-social-r2`. Sur la fiche de répétition déjà bloquée, la validation
LinkedIn affiche « La publication est compatible avec LinkedIn » et
« Validation réussie ». Le bouton « Programmer sur LinkedIn » est actif.
L'actualisation Instagram conserve sa tentative réussie et recharge la fiche.
Le relevé console ne contient aucune erreur ni avertissement.

Le contrôle s'arrête avant le bouton de programmation : il démontre la levée
du blocage local, pas un nouvel envoi LinkedIn. Le statut historique global
`published` n'est pas réécrit par une simple validation ; il est recalculé
lors d'une prochaine programmation ou d'un résultat worker.
