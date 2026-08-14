# SUP-001 - Chargement du tableau de bord après inscription

## Statut

- signal initial : retour ponctuel du porteur-test pendant une recette locale ;
- qualification technique : reproduit de manière contrôlée le 14 août 2026 ;
- criticité : S3 moyenne ;
- priorité : P1 avant pilote utilisateur ;
- correctif : commit `f0f581e` sur la branche
  `codex/docs-c4-2-1-anomalies` ;
- validation : locale et CI réussies ; recette Coolify encore requise ;
- issue GitHub : création en attente de réauthentification GitHub.

Ce cas ne provient pas d'un client externe. Dans le projet individuel WePost,
le porteur a réalisé une recette en adoptant le rôle d'un nouvel utilisateur,
puis a transmis le symptôme à la fonction support. Cette limite est conservée
pour ne pas fabriquer une relation client inexistante.

## Retour initial

Après une création de compte, le porteur-test a décrit une impression de
déconnexion et un chargement continu. Le comportement avait disparu après
rechargement. La date exacte du premier signal, le navigateur, une capture et
les logs n'avaient pas été consignés ; le retour restait donc un signal faible.

Le support a retenu les questions suivantes :

1. le compte et la session sont-ils créés par l'API ?
2. la navigation vers `/dashboard` aboutit-elle ?
3. une dépendance secondaire peut-elle bloquer la page sans limite ?
4. l'interface distingue-t-elle une session valide d'un échec de données ?

## Reproduction contrôlée et cause racine

Le scénario automatisé crée un compte, laisse la session s'établir, puis fait
échouer les requêtes `/projects` et `/calendar` pendant l'arrivée sur le
tableau de bord.

L'analyse du code antérieur au commit `f0f581e` a montré que :

- la page exécutait `await loadDashboard()` au niveau du chargement initial ;
- les requêtes projets, calendrier et supervision étaient séquentielles ;
- aucune limite de durée n'était appliquée ;
- une promesse non résolue pouvait donc empêcher la navigation de se terminer ;
- l'utilisateur ne voyait pas clairement que sa session restait valide.

La reproduction contrôlée explique le symptôme, sans prétendre prouver que la
même défaillance réseau était la cause exacte du signal initial non tracé.

## Résolution

Le commit `f0f581e` :

- rend d'abord le tableau de bord et lance les données après montage ;
- exécute les appels projets, calendrier et supervision en parallèle ;
- borne chaque appel à 5 secondes avec `AbortController` ;
- conserve les données disponibles lorsqu'une seule source échoue ;
- affiche une erreur globale ou partielle accessible ;
- propose l'action `Réessayer` ;
- laisse visible le profil et l'état `Authentification opérationnelle` ;
- ajoute un test unitaire du timeout et un parcours Playwright desktop/mobile.

## Contribution des parties prenantes

| Partie ou fonction                 | Contribution                                                                                                                | Livrable transmis à l'étape suivante                         |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Porteur-test, rôle utilisateur     | signale le symptôme et précise son caractère ponctuel ainsi que le retour à la normale après rechargement                   | signal initial et contournement observé                      |
| Support de niveau 1                | conserve les inconnues, recherche les doublons, reformule le parcours, qualifie S3/P1 et définit les critères d'acceptation | fiche SUP-001 et scénario reproductible sans donnée sensible |
| Expertise technique et maintenance | analyse la session et le chargement, isole la cause, implémente le timeout, le parallélisme, l'erreur et la relance         | commit `f0f581e` et tests de non-régression                  |
| Validation automatisée             | vérifie l'utilitaire, la session, l'interface desktop/mobile, le typage, le lint et le build                                | résultats reproductibles et captures expurgées               |
| Responsable de livraison           | publie la branche, contrôle la CI et doit encore publier l'issue, faire la recette Coolify et rattacher la version livrée   | CI `31757294992` verte ; clôture différée avant recette      |

Dans ce projet individuel, plusieurs fonctions sont exercées successivement par
la même personne. Le tableau décrit donc une séparation de responsabilités et
d'artefacts, pas une équipe fictive.

## Résultats obtenus le 14 août 2026

| Contrôle                               | Résultat                           |
| -------------------------------------- | ---------------------------------- |
| Vitest ciblé `request-timeout.spec.ts` | 4/4 tests réussis                  |
| Suite Vitest frontend                  | 44 fichiers, 104/104 tests réussis |
| TypeScript Nuxt                        | réussi                             |
| ESLint ciblé                           | réussi                             |
| Build Nuxt production                  | réussi                             |
| Playwright correctif desktop + mobile  | 2/2 scénarios réussis              |
| Rejeu Chromium pour captures           | 1/1 scénario réussi                |

Le test Playwright vérifie successivement l'URL `/dashboard`, le nom et
l'adresse du profil, l'alerte, le bouton `Réessayer`, la disparition de l'alerte
et de l'état de chargement, puis la persistance du bloc d'authentification.

## Limites de livraison

Le problème est corrigé localement et la CI GitHub du commit `4543758` est
entièrement verte : qualité, couvertures, builds, audit, CodeQL, Gitleaks,
tests navigateur/accessibilité et répétition de déploiement ont réussi dans le
[run `31757294992`](https://github.com/zkyoz/wepost-pro/actions/runs/31757294992).

Il ne doit toutefois pas être déclaré résolu en production : WePost ne possède
pas encore de déploiement persistant. La création de l'issue et les commentaires
GitHub sont également en attente d'une session autorisée en écriture. La
clôture définitive exige une recette sur le SHA livré et l'identification de la
version contenant le correctif.
