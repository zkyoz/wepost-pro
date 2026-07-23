# Wepost.pro — Contexte global pour Codex

> **Document de référence à lire avant chaque tâche.**
>
> Version documentaire : **1**  
> Candidat : Martin BARRE  
> Formation : M2 Expert en Développement Full-Stack — RNCP 39583  
> Période : juillet 2026

---

## 1. Finalité du projet

Wepost.pro est une application web développée pour une agence de communication. Elle centralise le travail des équipes de l’agence et de leurs clients autour des publications destinées aux réseaux sociaux.

Le produit doit remplacer les échanges dispersés entre e-mails, messageries, Drive, tableurs et outils natifs des réseaux sociaux par un workflow unique, traçable et sécurisé permettant de :

- gérer les clients et leurs projets ;
- créer, modifier, commenter et valider des publications ;
- visualiser les contenus dans un calendrier éditorial ;
- stocker les médias ;
- connecter les comptes sociaux ;
- programmer et automatiser les publications ;
- superviser les erreurs, commentaires et statuts ;
- produire des statistiques ;
- générer des variantes de contenu avec une IA ;
- garantir l’accessibilité, la sécurité, la maintenabilité et la traçabilité demandées par le Bloc 2 du RNCP 39583.

Le produit est conçu pour **une agence unique avec plusieurs clients**, mais le modèle de données doit conserver un champ `agency_id` afin de ne pas bloquer une évolution ultérieure vers un fonctionnement multi-agences.

---

## 2. Utilisateurs et rôles

Trois rôles applicatifs sont obligatoires.

### Administrateur

L’administrateur supervise l’ensemble de l’application :

- gestion des utilisateurs ;
- gestion des projets ;
- accès aux publications et incidents ;
- supervision des connexions sociales ;
- consultation des journaux et états système ;
- désactivation d’un compte ou d’une intégration ;
- aucune exposition en clair des secrets ou tokens OAuth.

### Agence

Le rôle agence correspond aux membres de l’agence et aux community managers :

- création et gestion des projets ;
- création et programmation des publications ;
- gestion des médias ;
- consultation des commentaires et annotations ;
- génération de variantes ;
- connexion des comptes sociaux ;
- supervision et statistiques ;
- export du calendrier.

### Client

Le client dispose d’un compte complet limité aux projets auxquels il est affecté :

- consultation des projets autorisés ;
- consultation des publications ;
- ajout de commentaires ;
- validation ou demande de corrections ;
- ajout d’annotations ;
- aucune programmation ou publication directe ;
- aucun accès aux données des autres clients.

Toutes les autorisations doivent être vérifiées **côté serveur**. Le masquage d’un bouton côté interface ne constitue jamais une mesure d’autorisation suffisante.

---

## 3. Périmètre fonctionnel et ordre obligatoire

Les fonctionnalités doivent être développées et validées dans l’ordre suivant. Une tâche ne peut être considérée comme terminée que lorsque son code, ses tests, sa documentation, sa recette et ses preuves sont présents.

1. Authentification basique, sans mot de passe oublié et sans double authentification
2. Gestion des rôles et permissions
3. CRUD Projet adapté aux trois rôles
4. CRUD Publications sans images
5. CRUD Médias des publications et configuration Cloudflare R2
6. Calendrier éditorial
7. Commentaires client, validation et notifications e-mail
8. Publication automatique Facebook
9. Publication automatique Instagram
10. Publication automatique LinkedIn
11. Publication automatique Pinterest
12. Publication automatique TikTok
13. CRUD administrateur global
14. Supervision agence des états des publications et commentaires
15. Statistiques agence
16. IA : génération et variantes de textes
17. IA : variantes de publications par réseau
18. Annotations client
19. Export ICS
20. Traduction
21. Supervision système
22. Sauvegardes
23. Landing page

Les fichiers `task01.md` à `task23.md` constituent les prompts d’exécution détaillés.

---

## 4. Décisions techniques confirmées

- Architecture : monorepo.
- Poste de développement : macOS.
- Frontend : Nuxt, Vue et TypeScript.
- Backend : AdonisJS et TypeScript.
- Base de données : PostgreSQL.
- Traitements asynchrones : Redis et BullMQ.
- Stockage de médias : Cloudflare R2.
- Infrastructure : VPS Hetzner administré avec Coolify.
- Gestion de sources : Git et GitHub.
- CI : GitHub Actions.
- Déploiement de préproduction : automatique.
- Déploiement de production : après validation manuelle.
- Authentification web : package officiel `@adonisjs/auth` avec session guard et `@adonisjs/session` ; aucun JWT personnalisé.
- Réseaux sociaux : Facebook, Instagram, LinkedIn, Pinterest et TikTok.
- Connexions sociales : OAuth via les API officielles.
- Queue : une queue globale avec des types de jobs et des adaptateurs par réseau.
- Tests demandés : Vitest au minimum.
- Accessibilité cible : RGAA 4.1.2.
- Application responsive et compatible avec les navigateurs modernes.
- Les bases de développement, recette et production doivent être distinctes.

### Versions relevées dans le dépôt le 22 juillet 2026

- Node.js : 24.x via `.nvmrc`, avec un minimum `>=24.0.0` dans le manifeste racine.
- Nuxt : 4.5.0.
- Vue : 3.5.40.
- AdonisJS : 7.3.5 résolu, avec `^7.3.3` déclaré.
- TypeScript : 6.0.3.
- PostgreSQL : version majeure 17 via l’image `postgres:17-alpine`.
- Redis : version majeure 7 via l’image `redis:7-alpine`.
- BullMQ : 5.80.10.
- Resend SDK : 6.18.0.

Les versions exactes doivent être relues dans les fichiers du dépôt et cette section doit être actualisée après toute montée de version.

### Gestionnaire de paquets

Codex doit conserver le gestionnaire associé au lockfile existant. Si aucun lockfile n’existe, utiliser **pnpm** pour le monorepo et documenter cette décision dans un ADR.

---

## 5. Architecture cible

L’arborescence ci-dessous est une cible. Codex doit l’adapter à la structure réelle sans réorganiser inutilement un dépôt déjà fonctionnel.

```text
/
├── apps/
│   ├── web/                 # Nuxt
│   ├── api/                 # AdonisJS
│   └── worker/              # BullMQ
├── packages/
│   ├── shared/              # types, statuts, validateurs, contrats
│   ├── ui/                  # composants partagés si pertinent
│   └── config/              # eslint, typescript, vitest
├── infra/
│   ├── docker/
│   ├── coolify/
│   └── scripts/
├── docs/
│   ├── architecture/
│   ├── deployment/
│   ├── manuals/
│   ├── recette/
│   ├── security/
│   ├── accessibility/
│   └── evidence/
├── .github/
│   ├── workflows/
│   └── ISSUE_TEMPLATE/
├── context.md
├── CHANGELOG.md
└── README.md
```

### Composants d’exécution

1. **Nuxt** : interface, rendu responsive, navigation, accessibilité et appels API.
2. **AdonisJS** : API, authentification, autorisations, validation, règles métier et persistance.
3. **Worker BullMQ** : processus séparé initialisé en tâche 07 pour les e-mails, puis étendu aux publications sociales, tâches IA et traitements différés.
4. **PostgreSQL** : source de vérité métier.
5. **Redis** : queue de jobs, verrous et données éphémères.
6. **Cloudflare R2** : médias et, si retenu, copies de sauvegardes chiffrées.
7. **Uptime Kuma** : disponibilité.
8. **PostHog** : analytics produit uniquement après gestion correcte du consentement.
9. **Resend** : e-mails transactionnels.

---

## 6. Modèle de données progressif

Le schéma définitif sera produit par les migrations. Les principales entités prévues sont :

```text
agencies
users
projects
project_members
publications
publication_versions
publication_network_variants
publication_translations
media_assets
publication_media
comments
publication_reviews
annotations
calendar_feed_tokens
social_accounts
scheduled_publications
publication_attempts
notifications
ai_generations
audit_logs
backup_runs
```

Les sessions web sont gérées par `@adonisjs/session` et stockées dans Redis hors tests. Elles ne constituent pas une entité métier PostgreSQL : aucune table `user_sessions` n’est créée.

### Principes obligatoires

- identifiants UUID ;
- `agency_id` sur les données métier ;
- timestamps UTC ;
- suppression logique lorsque la traçabilité l’exige ;
- contraintes d’unicité et clés étrangères explicites ;
- index sur les clés de filtrage ;
- migrations réversibles lorsque cela est raisonnablement possible ;
- aucune donnée métier importante uniquement dans Redis ;
- aucune donnée binaire lourde en PostgreSQL ;
- secrets et tokens jamais stockés en clair.

Le schéma détaillé est un **TODO** à produire au fur et à mesure des tâches, puis à exporter dans `docs/architecture/database-schema.md`.

---

## 7. Cycle de vie d’une publication

Statuts de référence :

```text
draft
in_progress
awaiting_client_review
changes_requested
approved
scheduled
publishing
published
failed
archived
```

### Règles

- l’agence crée et modifie les brouillons ;
- le client commente, approuve ou demande des corrections ;
- seule une version approuvée peut être programmée ;
- une modification après approbation invalide l’approbation précédente ;
- le job de publication mémorise la version approuvée ;
- avant publication, le worker vérifie que la version courante correspond toujours à la version programmée ;
- une publication déjà publiée ne doit jamais être créée une seconde fois lors d’un retry ;
- les transitions invalides sont rejetées par le domaine et testées.

---

## 8. Stratégie Git, intégration continue et déploiement

### Branches

```text
feature/* ou fix/*
        ↓ Pull Request
develop
        ↓ déploiement automatique
préproduction / recette
        ↓ validation manuelle
main
        ↓ approbation de l’environnement GitHub
production
```

### Protection recommandée

Les branches `develop` et `main` doivent :

- interdire les push directs ;
- exiger une Pull Request ;
- exiger les contrôles CI ;
- exiger la résolution des conversations ;
- interdire les force-push ;
- demander une approbation manuelle avant la production.

### Pipeline CI minimale

À chaque push et Pull Request :

1. détection du gestionnaire de paquets et installation reproductible ;
2. lint ;
3. formatage vérifié ;
4. vérification TypeScript ;
5. tests unitaires ;
6. tests d’intégration avec PostgreSQL et Redis de test ;
7. tests E2E critiques ;
8. build du frontend, de l’API et du worker ;
9. audit de dépendances ;
10. scan de secrets ;
11. analyse d’accessibilité automatisable ;
12. archivage des rapports.

Aucun déploiement ne doit démarrer si un contrôle bloquant échoue.

### Déploiement

- `develop` : déploiement automatique sur la recette avec base, secrets et préfixes R2 dédiés.
- `main` : déploiement après approbation manuelle.
- migrations exécutées avant la promotion complète ;
- health checks après démarrage ;
- rollback Coolify vers le déploiement précédent ;
- journal du SHA Git déployé ;
- smoke tests après déploiement.

---

## 9. Tests et seuils de qualité recommandés

Le projet ne possède pas encore de suite de tests complète. Les tâches doivent la construire progressivement.

### Outils

- Vitest : tests unitaires du frontend, du domaine partagé et des utilitaires.
- Japa recommandé pour les tests HTTP et d’intégration AdonisJS si le projet suit la structure standard Adonis.
- Playwright : tests E2E et contrôles axe sur les parcours critiques.
- PostgreSQL et Redis dédiés aux tests dans GitHub Actions.
- Mocks uniquement pour les APIs externes ; ne jamais appeler les réseaux sociaux réels dans la CI.

### Seuils

- couverture lignes globale : au moins 80 % ;
- couverture branches globale : au moins 70 % ;
- services critiques d’autorisation et de publication : au moins 90 % ;
- 100 % des tests bloquants passent avant fusion ;
- aucune vulnérabilité critique connue non justifiée ;
- aucune erreur TypeScript ;
- aucune erreur RGAA automatisable de niveau bloquant sur les parcours testés.

Ces seuils sont des objectifs. La documentation ne doit afficher que des valeurs réellement mesurées.

### Performance cible à mesurer

- API CRUD courante : p95 inférieur à 500 ms ;
- chargement initial des écrans principaux : inférieur à 2 s sur la volumétrie cible ;
- disponibilité cible : 99,5 % ;
- taux de succès des jobs hors erreur externe définitive : au moins 99 % ;
- aucune duplication de publication ;
- calendrier fluide sur environ 20 clients × 40 publications mensuelles ;
- Lighthouse accessibilité visée : au moins 95, sans l’assimiler à une conformité RGAA complète.

---

## 10. Sécurité

Le développement doit couvrir explicitement les dix catégories OWASP Top 10.

### Exigences transverses

- validation de toutes les entrées ;
- requêtes via ORM ou paramètres liés ;
- politique d’autorisation centralisée et deny-by-default ;
- isolation par `agency_id`, `project_id` et affectation client ;
- mots de passe hachés avec Argon2 ;
- authentification web via le session guard officiel `@adonisjs/auth` ;
- sessions gérées par `@adonisjs/session`, stockées dans Redis en recette et production ;
- cookies de session `HttpOnly`, `Secure` et `SameSite` ;
- protection CSRF adaptée au mode de transport ;
- CORS restrictif ;
- rate limiting sur les routes sensibles ;
- secrets uniquement dans les variables d’environnement ou secrets Coolify/GitHub ;
- chiffrement applicatif AES-256-GCM ou équivalent pour les tokens OAuth ;
- vérification des types MIME réels et limites d’upload ;
- logs sans secrets, JWT, mots de passe ou contenu sensible inutile ;
- Dependabot ;
- audit du gestionnaire de paquets ;
- Gitleaks ou outil équivalent ;
- Semgrep ou règles statiques équivalentes ;
- journal d’audit pour les actions sensibles.

---

## 11. Accessibilité RGAA 4.1.2

La cible est le RGAA 4.1.2. Le projet ne doit pas déclarer une conformité totale sans audit complet. Les preuves doivent distinguer :

- critères testés automatiquement ;
- critères testés manuellement ;
- critères conformes ;
- non-conformités ;
- critères non applicables.

### Obligations récurrentes

- HTML sémantique ;
- titres hiérarchisés ;
- lien d’évitement ;
- navigation intégrale au clavier ;
- focus visible ;
- absence de piège clavier ;
- modales correctement annoncées et gérées ;
- labels associés aux champs ;
- erreurs identifiées et suggestions de correction ;
- contrastes conformes ;
- information non portée uniquement par la couleur ;
- alternatives textuelles ;
- textes redimensionnables à 200 % ;
- reflow à 320 px ;
- tableaux avec en-têtes ;
- composants personnalisés avec nom, rôle et valeur ;
- messages d’état avec `aria-live` ;
- alternatives aux interactions de type glisser-déposer ou canvas ;
- langue de page et changements de langue ;
- tests clavier, zoom et lecteur d’écran.

Chaque tâche contient ses exigences RGAA spécifiques. Les résultats sont consignés dans `docs/accessibility/`.

---

## 12. Publication sociale et résilience

### Interface d’adaptateur

Chaque réseau doit implémenter un contrat commun, par exemple :

```ts
interface SocialPublisher {
  validate(input: PublishInput): Promise<ValidationResult>;
  publish(input: PublishInput): Promise<PublishResult>;
  refreshCredentials(accountId: string): Promise<void>;
  normalizeError(error: unknown): SocialPublishError;
}
```

Les versions et endpoints des APIs sociales doivent être lus dans les documentations officielles au moment du développement et isolés dans chaque adaptateur.

### Retries recommandés

- 3 tentatives automatiques ;
- backoff exponentiel approximatif : 1 minute, 5 minutes, 15 minutes ;
- aucune nouvelle tentative automatique pour les erreurs fonctionnelles définitives ;
- relance manuelle autorisée à l’agence après correction ;
- clé d’idempotence interne par publication, réseau, version et compte social ;
- verrou Redis court pendant l’exécution ;
- identifiant distant enregistré dès qu’il est reçu.

---

## 13. Conservation recommandée

À valider avec le responsable du projet et la politique RGPD :

- logs applicatifs : 30 jours ;
- logs de sécurité et audit : 12 mois ;
- tentatives de publication : 90 jours ;
- média supprimé : corbeille 30 jours puis purge ;
- sauvegardes quotidiennes : 30 jours ;
- sauvegardes hebdomadaires : 12 semaines ;
- sauvegardes mensuelles : 12 mois ;
- demandes d’export et suppression : journalisées sans conserver inutilement le contenu exporté.

---

## 14. Définition de terminé commune à toutes les tâches

Une tâche est terminée uniquement si :

- le périmètre fonctionnel est livré ;
- les autorisations sont vérifiées côté serveur ;
- les migrations sont présentes ;
- les tests unitaires, intégration et E2E pertinents sont écrits ;
- les tests de sécurité pertinents sont écrits ;
- les contrôles RGAA automatisables et manuels sont documentés ;
- les erreurs sont gérées sans fuite d’information ;
- le build est vert ;
- la fonctionnalité est testée sur l’environnement de recette ;
- le cahier de recette est mis à jour ;
- le changelog est mis à jour ;
- les manuels impactés sont mis à jour ;
- une preuve exploitable pour le dossier RNCP est ajoutée ;
- aucun secret réel n’est commité ;
- aucune affirmation non vérifiée n’est ajoutée dans la documentation.

---

## 15. Preuves à produire après chaque tâche

Créer ou mettre à jour :

```text
docs/recette/taskXX.md
docs/evidence/taskXX.md
docs/security/taskXX.md
docs/accessibility/taskXX.md
CHANGELOG.md
```

Le fichier de preuve doit contenir :

- résumé de la fonctionnalité ;
- user stories couvertes ;
- migrations créées ;
- routes et composants concernés ;
- liste et résultat des tests ;
- couverture mesurée ;
- capture ou référence du run CI ;
- capture de recette à ajouter manuellement si nécessaire ;
- résultats RGAA ;
- risques et limitations ;
- SHA ou tag livré ;
- anomalies rencontrées et corrections.

---

## 16. Couverture des compétences RNCP 39583 — Bloc 2

### C2.1.1 — Environnements, déploiement, qualité et performance

À démontrer :

- environnement macOS détaillé ;
- éditeur et extensions ;
- Node, compilateur TypeScript, Nuxt, AdonisJS ;
- Git/GitHub ;
- Docker si utilisé ;
- PostgreSQL, Redis et R2 ;
- environnements local, test CI, recette et production ;
- séquences de déploiement ;
- critères de qualité et de performance mesurés ;
- Coolify, Uptime Kuma et rapports CI.

### C2.1.2 — Intégration continue

À démontrer :

- stratégie de branches ;
- Pull Requests ;
- fusion contrôlée ;
- CI exécutée régulièrement ;
- code défectueux non fusionnable ;
- tests et builds bloquants ;
- exemple de pipeline rouge puis vert ;
- traçabilité des exécutions.

### C2.2.1 — Prototype et architecture

À démontrer :

- architecture structurée ;
- séparation web, API et worker ;
- frameworks et paradigmes ;
- composants d’interface ;
- user stories ;
- prototype fonctionnel ;
- sécurité intégrée à la conception ;
- responsive.

### C2.2.2 — Harnais de tests

À démontrer :

- tests unitaires d’une fonctionnalité métier complète ;
- majorité du code couverte ;
- seuil de couverture ;
- rapport HTML ou LCOV ;
- test d’autorisation ;
- test de non-régression.

### C2.2.3 — Sécurité, évolutivité et accessibilité

À démontrer :

- couverture OWASP Top 10 ;
- mesures réellement présentes ;
- RGAA 4.1.2 présenté et justifié ;
- audits automatisés ;
- tests manuels ;
- évolutivité par adaptateurs et services séparés ;
- conformité technique et fonctionnelle vérifiée.

### C2.2.4 — Versions et déploiements progressifs

À démontrer :

- Git ;
- Conventional Commits ;
- historique ;
- tags ou releases ;
- changelog ;
- staging puis production ;
- logiciel manipulable en autonomie ;
- rollback.

### C2.3.1 — Cahier de recette

À démontrer :

- scénarios pour toutes les fonctionnalités ;
- préconditions ;
- étapes ;
- résultats attendus et observés ;
- tests fonctionnels, structurels et sécurité ;
- version, date, testeur et anomalie liée.

### C2.3.2 — Correction des bogues

À démontrer :

- détection ;
- qualification ;
- criticité ;
- cause racine ;
- correctif ;
- test de non-régression ;
- recette ;
- livraison ;
- analyse des améliorations.

### C2.4.1 — Documentation

À produire :

- manuel de déploiement initial ;
- manuel de déploiement courant ;
- manuel d’utilisation par rôle ;
- manuel de mise à jour ;
- variables d’environnement anonymisées ;
- procédure de migration ;
- procédure de rollback ;
- procédure de sauvegarde et restauration ;
- choix technologiques et ADR.

---

## 17. Règles de travail pour Codex

1. Lire `context.md` et la tâche courante.
2. Ne pas commencer une tâche si les tests bloquants des tâches précédentes échouent.
3. Examiner le dépôt avant de créer une structure parallèle.
4. Ne pas modifier le périmètre sans l’indiquer.
5. Ne pas inventer une API, un endpoint ou une métrique.
6. Utiliser les documentations officielles pour les APIs sociales.
7. Ajouter les migrations et tests dans le même changement.
8. Préférer des services courts et testables.
9. Centraliser les autorisations.
10. Ne jamais exposer un token OAuth.
11. Respecter le RGAA dès la création des composants.
12. Mettre à jour les preuves et la recette.
13. Résumer à la fin :
    - fichiers modifiés ;
    - migrations ;
    - commandes exécutées ;
    - tests ;
    - couverture ;
    - limites ;
    - actions manuelles restantes.
