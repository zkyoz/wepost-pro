# Processus de collecte et de consignation des anomalies

GitHub Issues est la source de vérité des anomalies confirmées de Wepost.pro.
Un retour utilisateur peut arriver par un échange de recette ou un canal de
support, mais le responsable de maintenance le transpose dans une issue afin
que la qualification, la correction, la revue et la validation restent
traçables.

Une vulnérabilité présumée n'est jamais détaillée dans une issue publique. Elle
suit le canal privé défini dans [`SECURITY.md`](../../SECURITY.md).

## Sources de détection

- retours des rôles administrateur, agence et client ;
- recette fonctionnelle et contrôles manuels ;
- tests unitaires, fonctionnels, Playwright et axe ;
- GitHub Actions, audit des dépendances, Gitleaks et CodeQL ;
- Uptime Kuma, health checks et smoke tests ;
- logs corrélés de l'API, du worker et des déploiements ;
- compteurs BullMQ, tentatives de publication et tableau administrateur ;
- revue de code.

## Création et qualification

1. conserver le signal initial sans donnée sensible ;
2. rechercher les issues ouvertes et fermées avec le composant, le message
   d'erreur, la route et les symptômes ;
3. tenter de reproduire le problème sur une version et un environnement
   identifiables ;
4. créer l'issue avec le template `Bogue` ;
5. affecter les labels de composant, criticité et priorité pendant la
   qualification ;
6. relier la branche `fix/*`, le test en échec, le correctif et la Pull Request ;
7. fermer seulement après validation du test de non-régression et de la recette
   correspondant à l'environnement livré.

Dans l'organisation actuelle à une personne, Martin BARRE assure la
centralisation et la qualification. L'auteur du signal fournit les faits et
les preuves disponibles ; il n'est pas chargé de déterminer seul la cause ou
la priorité.

## Statuts

| Label                | Signification                                     |
| -------------------- | ------------------------------------------------- |
| `status:triage`      | signal reçu, reproduction et impact à vérifier    |
| `status:confirmed`   | bogue reproduit et qualifié                       |
| `status:in-progress` | correctif et test de non-régression en cours      |
| `status:review`      | Pull Request ouverte et contrôles en cours        |
| `status:validation`  | correctif intégré dans `develop`, recette requise |
| `status:blocked`     | traitement bloqué, motif documenté dans l'issue   |
| `status:resolved`    | correction validée sur l'environnement visé       |

Une seule étiquette `status:*` doit être active. L'issue reste ouverte jusqu'au
statut `resolved`, puis elle est fermée avec la version, le SHA et la preuve de
validation.

## Criticité et priorité

| Criticité              | Définition                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `severity:S1-blocking` | indisponibilité globale, risque de sécurité, perte ou corruption de données, publication dupliquée   |
| `severity:S2-major`    | fonction essentielle indisponible ou diagnostic opérationnel trompeur, sans contournement acceptable |
| `severity:S3-medium`   | dégradation limitée avec contournement utilisable                                                    |
| `severity:S4-low`      | gêne faible, anomalie visuelle ou documentaire sans blocage métier                                   |

La criticité mesure l'impact. La priorité fixe l'ordre de traitement après
prise en compte de la fréquence, du nombre d'utilisateurs, de l'environnement,
du risque données/sécurité et de l'existence d'un contournement :

- `priority:P0` : traitement immédiat ;
- `priority:P1` : traitement prioritaire ;
- `priority:P2` : prochain cycle planifié ;
- `priority:P3` : backlog non urgent.

## Doublons

Une nouvelle fiche est comparée aux issues ouvertes et fermées. Une même cause
racine conserve une issue principale. Le nouveau signal est ajouté en
commentaire avec sa version, sa fréquence et son contexte, puis l'issue
secondaire reçoit le label `duplicate` et un lien vers la fiche principale.

## Structure minimale d'une fiche

- identifiant `BUG-<numéro GitHub sur trois chiffres>` et titre
  `[BUG][composant] symptôme observable` ;
- date, source de détection, version ou SHA, environnement et composant ;
- description, préconditions et étapes numérotées ;
- résultats attendu et obtenu ;
- fréquence, impact, criticité, priorité et contournement ;
- message d'erreur, logs corrélés et captures expurgées ;
- analyse de cause racine et préconisation ;
- test de non-régression, branche, commit, PR, CI, recette et version livrée.

Le cas réel [`BUG-022`](BUG-022-health-liveness-redis.md) illustre cette
structure.

Le cas de support
[`SUP-001`](../support/SUP-001-dashboard-loading-after-registration.md)
documente également un retour utilisateur interne, sa reproduction contrôlée,
la séparation des contributions et un correctif local en attente de livraison.
