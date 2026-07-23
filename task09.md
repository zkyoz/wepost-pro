# Tâche 09 — Publication automatique Instagram

> Ordre : 9/23  
> Dépendances : Tâche 08 validée  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.2, C2.2.3, C2.2.4, C2.3.1, C2.3.2

## Instruction à Codex

Lire d’abord `context.md`. Examiner l’existant et adapter l’implémentation au monorepo réel. Ne pas casser les tâches validées précédemment. Implémenter uniquement le périmètre de cette tâche et les refactorings strictement nécessaires. Toute valeur non vérifiable doit être laissée en `TODO` plutôt qu’inventée.

## Objectif

Créer l’adaptateur officiel Instagram, la connexion OAuth et le cycle fiable de publication.

## Périmètre à implémenter

- créer l’adaptateur `instagram` conforme au contrat commun ;
- connexion OAuth et gestion du renouvellement ;
- validation préalable du contenu ;
- création d’un job BullMQ ;
- publication, journalisation, retries et relance manuelle ;
- enregistrer l’identifiant distant ;
- ajouter un mode sandbox/mock pour les tests ;
- supporter les formats autorisés par le périmètre retenu et documenter les formats non couverts.

## Règles métier

- seule une version approuvée peut être publiée ;
- le worker vérifie la version avant l’appel externe ;
- clé d’idempotence par publication/réseau/version/compte ;
- trois nouvelles tentatives avec backoff 1, 5 et 15 minutes pour les erreurs transitoires ;
- les erreurs fonctionnelles définitives passent directement en `failed` ;
- la relance manuelle réutilise la même logique d’idempotence ;
- la date distante et la réponse sont normalisées ;
- valider que le compte sélectionné est compatible via l’API officielle ;
- traiter les publications média en plusieurs étapes lorsque l’API l’exige.

## Données et migrations

- `social_accounts` : agence, réseau, compte externe, tokens chiffrés, expiration, scopes et statut ;
- `scheduled_publications` : publication, réseau, compte, version, date, statut et clé d’idempotence ;
- `publication_attempts` : programmation, tentative, dates, résultat, erreur normalisée et identifiant distant ;
- champs Instagram spécifiques uniquement dans un JSON validé ou une table dédiée si nécessaire.

## API, interface et autorisations

- routes OAuth, validation, programmation, relance et consultation des tentatives ;
- callback OAuth protégé par `state` ;
- écran de connexion, état du token/scopes, validation, historique et action Relancer ;
- admin/agence connectent et programment ; client consulte seulement le statut ;
- tokens jamais visibles.

## RGAA 4.1.2

- statuts annoncés textuellement ;
- boutons et erreurs accessibles ;
- historique dans un tableau correctement balisé ;
- mises à jour asynchrones annoncées avec `aria-live` ;
- aucun widget externe inaccessible sans alternative.

## Sécurité

- OAuth `state` et PKCE si supporté ;
- tokens chiffrés AES-256-GCM ou équivalent ;
- scopes minimaux et aucun token dans les logs ;
- protection SSRF pour les médias distants ;
- réponses externes expurgées ;
- révocation et déconnexion du compte.

## Tests obligatoires

- unitaires : validation et normalisation d’erreur ;
- intégration : callback OAuth simulé ;
- worker : succès, timeout, 429, 5xx, erreur définitive et token expiré ;
- idempotence : deux exécutions créent un seul post distant simulé ;
- E2E : programmer puis consulter le statut avec API mockée ;
- aucun appel réel dans la CI ;
- simuler création de conteneur, attente de traitement et publication.

## Observabilité

- métriques de succès/échec Instagram, durée et retries ;
- alerte si le taux d’échec dépasse 5 % sur 24 h.

## Hors périmètre

- Stories ou formats non supportés par l’API au moment du développement, sauf décision explicite.

## Livrables et définition de terminé

Mettre à jour la recette, les preuves, la sécurité, l’accessibilité, le changelog et les manuels. Le parcours nominal, les autorisations serveur, migrations applicables, tests unitaires/intégration/E2E, sécurité, RGAA, lint, typecheck et builds doivent être vérifiés. La recette préproduction, les preuves externes et les captures restent explicitement identifiées lorsqu’elles nécessitent Meta ou un déploiement.
