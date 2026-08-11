# Changelog

Toutes les évolutions notables de Wepost.pro sont consignées ici.

## [Unreleased]

### Fixed

- Isolé les endpoints de health du middleware de session Redis afin que le liveness reste disponible pendant une panne de dépendance.

### Changed

- Documenté les seuils de supervision, la répétition des alertes et l'exercice local Uptime Kuma de C4.1.2.
- Structuré la collecte des anomalies avec un template GitHub complet, des
  statuts, des niveaux de criticité, des priorités et la fiche réelle
  `BUG-022`.
- Documenté la chaîne de correction de `BUG-022`, sa validation avant/après et
  l'anomalie résiduelle de readiness `BUG-024`.
- Ajouté une répétition automatique de déploiement du build API compilé et ses
  smoke tests après les contrôles CI.

### Ajouté

- documentation de l’architecture et de l’arborescence du monorepo.

### Sécurité

- mise à jour de Nuxt 4.5.0 vers 4.5.2 et verrouillage des versions corrigées
  de huit dépendances transitives ; l’audit pnpm complet du 8 août 2026 ne
  détecte plus de vulnérabilité connue.

## [0.1.0-rc.1] - 2026-07-23

Première préversion traçable destinée à la validation en recette. Elle ne
constitue pas une mise en production.

### Ajouté

- documentation OpenAPI 3.1 générée depuis les routes AdonisJS, catalogue des endpoints,
  interface accessible `/api/docs` et contrôle de synchronisation bloquant en CI ;
- monorepo pnpm avec frontend Nuxt et API AdonisJS ;
- environnement local PostgreSQL 17 et Redis 7 avec Docker Compose ;
- authentification par session officielle AdonisJS : inscription, connexion, profil, déconnexion et route privée ;
- sessions Redis, CSRF Shield, CORS sur liste blanche et rate limiting ;
- interfaces Nuxt accessibles et responsives pour connexion, inscription et tableau de bord ;
- tests Japa, Vitest, Playwright, axe et rapports de couverture ;
- pipeline GitHub Actions, Dependabot, Gitleaks et CodeQL ;
- documentation de recette, sécurité, accessibilité, déploiement et preuves de la tâche 01 ;
- rôles `admin`, `agency` et `client` avec matrice d’autorisation deny-by-default ;
- middleware de permissions, règles de portée agence/projet et protections anti-IDOR ;
- administration des rôles et désactivations avec journal d’audit transactionnel ;
- navigation Nuxt adaptée au rôle, page d’accès refusé et parcours responsive à trois comptes ;
- tests et documentation de la tâche 02 ;
- CRUD projet multi-rôles avec recherche, filtres, pagination et compteurs ;
- affectation d’un client principal et de membres avec isolation stricte par agence ;
- archivage logique, réactivation et historique d’audit des projets ;
- écrans Nuxt accessibles de liste, création, détail et modification ;
- tests IDOR, falsification d’agence et parcours E2E agence vers client de la tâche 03.
- CRUD des publications textuelles avec recherche, filtres, duplication et archivage logique ;
- machine à états, contrôle de concurrence optimiste et invalidation des approbations ;
- historique versionné et audits transactionnels des publications ;
- écrans Nuxt accessibles de liste, création, détail et édition ;
- tests IDOR, mass assignment, transitions et parcours E2E multi-rôles de la tâche 04.
- stockage média privé local/R2 avec URLs d’upload et de lecture signées ;
- validation après transfert du MIME réel, de la taille, du checksum et des dimensions ;
- association ordonnée, alternatives accessibles, suppression logique et purge des médias ;
- interface Nuxt d’upload avec progression et réordonnancement clavier ;
- tests MIME falsifié, taille, IDOR, abandon d’upload et parcours E2E de la tâche 05.
- calendrier éditorial avec vues mois, semaine et liste accessible ;
- filtres projet, client, réseau et statut avec portée serveur ;
- déplacement par formulaire, conversion UTC/fuseau, verrou optimiste et audit ;
- tests DST, plage maximale, IDOR et parcours calendrier desktop/mobile de la tâche 06.
- commentaires chronologiques, édition limitée et modération auditée ;
- décisions client versionnées avec demande de corrections et approbation ;
- notifications lues/non lues avec statut durable des e-mails ;
- worker BullMQ séparé, templates HTML/texte et envoi Resend idempotent ;
- retries, échecs définitifs, protections XSS/IDOR et parcours E2E de la tâche 07.
- connexion OAuth d’une Page Facebook avec `state` à usage unique et tokens AES-256-GCM ;
- programmation Facebook versionnée et idempotente avec empreinte du texte et des médias ;
- worker BullMQ Facebook, adaptateur Graph API réel/mock, retries 1/5/15 minutes et tentatives persistées ;
- validation, statut, historique, relance et révocation accessibles dans Nuxt ;
- tests OAuth, IDOR, expiration, erreurs Facebook, médias et parcours E2E de la tâche 08.
- connexion OAuth d’un compte Instagram professionnel lié à une Page avec `state` à usage unique et tokens AES-256-GCM ;
- validation et programmation Instagram d’une image JPEG ou d’une vidéo MP4/Reel sur une version approuvée ;
- worker BullMQ Instagram avec création de conteneur, attente de traitement, publication, idempotence et retries 1/5/15 minutes ;
- URLs R2 privées signées côté worker, historique des tentatives, relance, révocation et interface accessible ;
- tests API, worker, frontend et parcours E2E desktop/mobile de la tâche 09.
- connexion OAuth d’une organisation LinkedIn avec contrôle des rôles et `state` à usage unique ;
- tokens LinkedIn chiffrés, suivi d’expiration et renouvellement lorsque le partenaire reçoit un refresh token ;
- validation et programmation LinkedIn de texte et d’une image JPEG/PNG sur une version approuvée ;
- worker BullMQ LinkedIn avec API Posts/Images, idempotence, tentatives et retries 1/5/15 minutes ;
- interface accessible de connexion, statut, renouvellement, relance et révocation, avec tests de la tâche 10.
- connexion OAuth Pinterest avec récupération et choix explicite du tableau, `state` à usage unique et tokens AES-256-GCM ;
- validation et programmation d’un Pin JPEG/PNG avec titre, description, lien et payload réseau figé ;
- worker BullMQ Pinterest utilisant l’API v5 et une URL R2 signée, avec idempotence, tentatives et retries 1/5/15 minutes ;
- interface accessible, renouvellement, relance, révocation et tests API/frontend/worker/E2E de la tâche 11.
- connexion OAuth TikTok avec capacités créateur, scopes minimaux et tokens chiffrés ;
- Direct Post MP4 privé avec transfert `FILE_UPLOAD`, suivi durable du `publish_id` et confirmation `PUBLISH_COMPLETE` ;
- worker TikTok idempotent avec reprise pending, erreurs normalisées, retries 1/5/15 minutes et relance manuelle ;
- interface accessible avec consentement explicite, confidentialité, transparence, statut distant et tests de la tâche 12.
- administration globale des utilisateurs, projets, publications, comptes sociaux, incidents et audits ;
- recherche, filtres, pagination serveur et fiches détail expurgées de tout secret ;
- archivage/restauration dédié, confirmation accessible et garde-fou transactionnel du dernier administrateur ;
- audit générique immuable, métriques d’actions et tests API/frontend/E2E de la tâche 13.
- supervision agence des commentaires non lus et publications par statut avec compteurs cohérents ;
- filtres persistés client, projet, réseau, période et responsable, listes paginées et action marquer lu ;
- isolation inter-agence, mesure sur 20 × 40 publications et tests API/frontend/E2E de la tâche 14.
- statistiques agence par période, statut, réseau et projet avec définitions métier explicites ;
- taux de succès, délai d’approbation, commentaires, corrections et volume média sans donnée distante inventée ;
- export CSV protégé contre l’injection de formules, dashboard avec alternatives tabulaires et tests de la tâche 15.
- assistant de rédaction avec prompts versionnés, deux à cinq variantes bornées et application humaine explicite ;
- abstraction de fournisseur IA, mock local/CI, timeout, circuit breaker, quota et masquage des données sensibles ;
- historique `ai_generations`, audits, traitement BullMQ et interface Nuxt accessible avec tests de la tâche 16.
- variantes textuelles par réseau, versionnées, éditables, approuvables et invalidées avec le texte source ;
- fallback serveur vers le texte principal et gel de la variante approuvée dans chaque programmation sociale ;
- onglets et diff textuel accessibles, limites configurables, protections IDOR et tests de la tâche 17.
- annotations point et rectangle liées à une version de publication et une empreinte de média ;
- visionneuse avec overlay HTML, liste textuelle chronologique et formulaire clavier complet ;
- historique automatique après changement de version, liens avec les commentaires et modération auditée ;
- contraintes géométriques, suppression logique, protection IDOR et tests API/frontend/E2E de la tâche 18.
- export iCalendar par projet et période avec UID stable, UTC, séquence et annulation ;
- abonnements calendrier privés par token aléatoire hashé, révocables et suivis par dernière utilisation ;
- panneau Nuxt accessible de téléchargement, copie et révocation, avec instructions d’import ;
- échappement CRLF, rate limiting, protections IDOR et tests API/frontend/E2E de la tâche 19.
- interface FR/EN avec messages structurés, locale utilisateur persistée et formats locaux ;
- traductions de publication versionnées, générées ou manuelles, sans écrasement du texte source ;
- approbation humaine, obsolescence automatique, quotas, audits et protections IDOR ;
- sélecteur et éditeur accessibles avec tests API/frontend/E2E de la tâche 20.
- liveness/readiness, métriques corrélées et statut technique protégé de l’API ;
- heartbeat worker Redis/Push, supervision BullMQ et relance auditée des jobs échoués ;
- dashboard admin accessible, Uptime Kuma, smoke tests et runbook incident de la tâche 21.
- sauvegardes PostgreSQL chiffrées AES-256-GCM vers un bucket R2 privé dédié ;
- rétention quotidienne, hebdomadaire et mensuelle avec checksum et vérification distante ;
- restore drill protégé sur base isolée, historique administrateur et runbook de la tâche 22.
- landing page publique SSR avec présentation du workflow, FAQ et CTA de connexion ;
- pages légales, SEO, sitemap, robots et en-têtes de sécurité de la tâche 23 ;
- consentement PostHog Cloud EU, observabilité web et parcours Playwright/axe desktop-mobile ;
- refonte SaaS 2026 de la landing, de l’authentification, de la navigation et
  du dashboard avec la palette `#F2590D`, `#2F343A`, `#000000` et `#BBD9F1` ;
- commande locale idempotente `dev:seed-demo`, trois comptes de démonstration et
  jeu de données représentatif pour la prise en main ;
- guide de recette locale et plan de clôture Git, CI, préproduction, services
  externes et preuves RNCP.
- README complet avec état réel du produit, architecture, versions,
  installation, résultats mesurés et limites avant production ;
- gouvernance GitHub avec guides de contribution et de sécurité, CODEOWNERS,
  templates d’issues, template de Pull Request et configuration des releases.

### Modifié

- workflow CI complété avec déclenchement manuel, annulation des exécutions
  obsolètes, délais maximaux et rétention explicite des rapports.
- versions du monorepo alignées sur `0.1.0-rc.1`.

### Corrigé

- sélecteur Playwright des variantes réseau ciblé sur sa région afin de
  conserver le parcours E2E multi-rôles vert après l’ajout des traductions.
- hydratation du sélecteur de langue privé fiabilisée afin que le changement
  FR/EN reste interactif après restauration et rechargement de session.
- génération de la documentation API rendue déterministe après formatage
  Prettier ;
- faux positifs Gitleaks limités à une clé de test publique déterministe et à
  une route LinkedIn explicitement identifiée.

### Supprimé

- guard API par access tokens et migration `auth_access_tokens` du starter.

[Unreleased]: https://github.com/zkyoz/wepost-pro/compare/v0.1.0-rc.1...HEAD
[0.1.0-rc.1]: https://github.com/zkyoz/wepost-pro/releases/tag/v0.1.0-rc.1
