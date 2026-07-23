# Politique de sécurité

## Signaler une vulnérabilité

Ne pas ouvrir d’issue publique pour une vulnérabilité, un secret exposé ou une
méthode permettant de contourner une autorisation.

Utiliser le signalement privé depuis l’onglet **Security** du dépôt GitHub. Si
ce canal n’est pas disponible, contacter le propriétaire du dépôt par un canal
privé convenu hors du dépôt.

Le signalement doit contenir :

- le composant et la version ou le SHA concernés ;
- les préconditions ;
- les étapes de reproduction minimales ;
- l’impact observé ;
- les journaux expurgés de tout secret et donnée personnelle.

## Périmètre

Sont notamment prioritaires :

- contournement de l’authentification ou des permissions ;
- accès inter-agence ou inter-client ;
- exposition de cookie, token OAuth, clé R2 ou secret ;
- injection, SSRF ou téléversement de fichier dangereux ;
- duplication d’une publication sociale ;
- altération des audits ou perte de données.

## Versions prises en charge

Wepost.pro est actuellement en préversion. Seule la dernière release ou
prérelease GitHub publiée est évaluée. Aucune version n’est encore déclarée
stable en production.

## Traitement

Une vulnérabilité confirmée suit le cycle :

```text
qualification privée
→ correctif sur branche security/* ou fix/*
→ test de non-régression
→ revue et CI
→ publication coordonnée
→ rotation des secrets si nécessaire
```

Les détails exploitables ne sont rendus publics qu’après disponibilité du
correctif et traitement des secrets ou données éventuellement exposés.
