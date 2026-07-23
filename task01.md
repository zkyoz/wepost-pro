# Tâche 01 — Authentification basique avec @adonisjs/auth

> Ordre : 1/23  
> Dépendances : aucune  
> Compétences RNCP principalement couvertes : C2.1.1, C2.1.2, C2.2.1, C2.2.2, C2.2.3 et C2.2.4  
> Mise à jour : 22 juillet 2026 — décision confirmée : session guard et sessions Redis

## Instruction à Codex

Lire d’abord **context.md**, puis auditer le monorepo existant avant toute modification.

Pour l’authentification web, utiliser exclusivement les packages et mécanismes officiels AdonisJS :

- @adonisjs/auth ;
- @adonisjs/session ;
- le session guard officiel ;
- le sessionUserProvider basé sur le modèle Lucid User ;
- le mixin AuthFinder et User.verifyCredentials() ;
- le middleware auth fourni par AdonisJS ;
- @adonisjs/redis pour le stockage des sessions ;
- @adonisjs/limiter pour protéger les endpoints sensibles.

Ne pas créer de guard personnalisé, de JWT, de refresh token, de table user_sessions ou de mécanisme d’authentification maison.

Le guard API par access tokens généré par le starter doit être supprimé pour cette application web. Cela comprend sa configuration, son contrôleur, son usage dans le modèle User et sa migration, dès lors qu’aucune autre dépendance du dépôt ne l’utilise.

La session par cookie est retenue parce que Wepost.pro est une application Nuxt dont le frontend et l’API sont hébergés sous le même domaine principal, par exemple :

```text
app.wepost.pro
api.wepost.pro
```

Si l’infrastructure réelle ne permet pas ce partage de domaine, ne pas basculer silencieusement vers une autre stratégie. Documenter le blocage et proposer l’access tokens guard officiel d’AdonisJS, qui utilise des tokens opaques et non des JWT.

---

## Objectif

Mettre en place le socle d’authentification afin de permettre :

- la création d’un compte ;
- la connexion ;
- le maintien de la session ;
- la restauration de l’état de connexion après rechargement ;
- la consultation de l’utilisateur connecté ;
- la déconnexion ;
- la protection des routes privées ;
- l’exécution des tests unitaires, API, frontend et E2E ;
- la production des preuves nécessaires au Bloc 2.

Cette tâche ne traite ni les rôles détaillés ni les permissions métier, qui seront implémentés dans task02.md.

---

## Choix technique imposé

### Guard

Configurer @adonisjs/auth avec le session guard comme unique guard utilisateur.

Configuration cible à adapter aux versions réellement installées :

```ts
import { defineConfig } from "@adonisjs/auth";
import { sessionGuard, sessionUserProvider } from "@adonisjs/auth/session";

const authConfig = defineConfig({
  default: "web",
  guards: {
    web: sessionGuard({
      useRememberMeTokens: false,
      provider: sessionUserProvider({
        model: () => import("#models/user"),
      }),
    }),
  },
});

export default authConfig;
```

Décisions obligatoires :

- mettre web comme guard par défaut ;
- retirer le guard api par tokens ;
- ne renvoyer aucun token au frontend ;
- ne pas conserver simultanément deux mécanismes d’authentification utilisateur.

### Sessions

Configurer les drivers suivants :

- local : Redis ;
- recette : Redis ;
- production : Redis ;
- CI et tests : memory uniquement.

Redis doit utiliser une connexion ou un préfixe distinct par environnement. Les sessions et les futures queues BullMQ ne doivent pas partager un espace de clés impossible à isoler ou à purger séparément.

Ne pas utiliser :

- memory hors tests ;
- file en recette ou production ;
- cookie comme stockage complet de session ;
- une table PostgreSQL user_sessions.

La session doit contenir uniquement les données nécessaires à l’authentification. Ne pas y stocker de données métier volumineuses ou sensibles.

### Vérification des identifiants

Le modèle User doit utiliser AuthFinder. La connexion doit obligatoirement suivre ce mécanisme :

```ts
const user = await User.verifyCredentials(email, password);
await auth.use("web").login(user);
```

Ne pas coder manuellement un enchaînement findBy(email) puis hash.verify(), afin de conserver la protection d’AdonisJS contre l’énumération par différence de temps.

### Déconnexion

Utiliser :

```ts
await auth.use("web").logout();
```

La déconnexion doit invalider uniquement la session courante et supprimer le cookie associé.

### Protection des routes

Utiliser :

```ts
middleware.auth({ guards: ["web"] });
```

Récupérer l’utilisateur connecté avec :

```ts
const user = auth.getUserOrFail();
```

---

## Installation et audit

Utiliser pnpm, détecté via le lockfile racine.

Avant toute installation :

1. vérifier les versions déjà présentes ;
2. comparer les fichiers générés par le starter ;
3. ne pas réinstaller un package déjà correctement configuré ;
4. utiliser les commandes Ace adaptées aux versions installées lorsque l’ajout d’un provider est nécessaire.

Packages et fichiers à vérifier :

```text
@adonisjs/auth
@adonisjs/session
@adonisjs/redis
@adonisjs/limiter
config/auth.ts
config/session.ts
config/redis.ts
config/limiter.ts
app/models/user.ts
app/middleware/auth_middleware.ts
app/middleware/guest_middleware.ts
app/middleware/silent_auth_middleware.ts
start/kernel.ts
adonisrc.ts
.env.example
```

Ne pas écraser un fichier existant sans avoir comparé son contenu.

---

## Périmètre à implémenter

### Backend AdonisJS

- conserver et configurer @adonisjs/auth ;
- conserver et configurer @adonisjs/session ;
- installer et configurer @adonisjs/redis ;
- installer et configurer @adonisjs/limiter ;
- configurer web comme guard par défaut ;
- retirer le guard par access tokens et ses artefacts devenus inutiles ;
- configurer Redis comme store de session local, recette et production ;
- configurer memory exclusivement pour les tests ;
- créer ou compléter le modèle Lucid User ;
- appliquer AuthFinder ;
- créer les validateurs VineJS ;
- créer un contrôleur d’inscription ;
- remplacer AccessTokensController par un contrôleur de session ;
- protéger GET /api/v1/auth/me ;
- ajouter GET /health/live ;
- uniformiser les réponses JSON pour Nuxt ;
- gérer les identifiants invalides sans révéler l’existence d’un compte ;
- ajouter un rate limiting sur l’inscription et la connexion ;
- configurer CORS, cookies et CSRF.

### Frontend Nuxt

- créer une page de connexion ;
- créer une page d’inscription ;
- créer un composable ou store d’authentification ;
- créer un middleware Nuxt de protection des pages privées ;
- créer un middleware pour les pages réservées aux visiteurs ;
- créer une page privée de démonstration ;
- afficher l’utilisateur connecté ;
- ajouter l’action de déconnexion ;
- restaurer l’état de connexion via GET /auth/me ;
- envoyer toutes les requêtes d’authentification avec credentials: include ;
- gérer le cookie XSRF-TOKEN et le header X-XSRF-TOKEN selon le mécanisme officiel ;
- ne jamais lire ou écrire directement le cookie de session depuis JavaScript ;
- ne stocker aucun secret dans le store, localStorage ou sessionStorage.

### CI et qualité

- mettre en place la première pipeline GitHub Actions ;
- lancer l’installation reproductible, le lint et le format check ;
- lancer les typechecks ;
- lancer les tests unitaires, API et frontend ;
- lancer les tests E2E critiques ;
- lancer les builds ;
- utiliser PostgreSQL et Redis dédiés aux tests ;
- publier les rapports de couverture réellement produits ;
- bloquer la fusion lorsqu’un contrôle bloquant échoue ;
- ajouter Dependabot, un audit pnpm, un scan de secrets et une analyse statique TypeScript.

---

## Données et migrations

Créer ou adapter la table users.

Champs minimum :

```text
id              UUID
agency_id       UUID nullable pour cette tâche
email           unique et normalisé en minuscules
password
display_name
role            valeur provisoire
is_active
created_at
updated_at
```

Contraintes :

- identifiant UUID ;
- e-mail unique après normalisation ;
- mot de passe haché avec Argon2 ;
- mot de passe jamais renvoyé dans les réponses ;
- colonne password masquée lors de la sérialisation ;
- timestamps UTC gérés par Lucid ;
- valeur temporaire de rôle documentée sans implémenter task02 ;
- migration réversible lorsque raisonnablement possible.

Ne pas créer :

```text
auth_access_tokens
user_sessions
refresh_tokens
jwt_tokens
```

Si la migration auth_access_tokens du starter n’a encore aucune donnée utile et n’est plus référencée, la retirer proprement avant le premier historique livré.

---

## Routes API

Respecter le préfixe existant /api/v1 :

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
GET    /health/live
```

Il ne doit exister aucune route de refresh token.

### POST /api/v1/auth/register

- valider le nom, l’e-mail, le mot de passe et sa confirmation ;
- normaliser l’e-mail ;
- créer le compte ;
- connecter immédiatement l’utilisateur avec auth.use('web').login(user) ;
- renvoyer uniquement le profil public ;
- ne renvoyer aucun token.

### POST /api/v1/auth/login

- utiliser User.verifyCredentials() ;
- normaliser l’e-mail avant vérification ;
- refuser les comptes désactivés ;
- ouvrir une session avec auth.use('web').login(user) ;
- renvoyer le profil public minimal ;
- utiliser un message public générique pour l’e-mail inconnu et le mot de passe incorrect ;
- ne renvoyer aucun token.

### POST /api/v1/auth/logout

- protéger la route avec le guard web ;
- utiliser auth.use('web').logout() ;
- invalider uniquement la session courante ;
- renvoyer un statut de succès.

### GET /api/v1/auth/me

- protéger la route avec middleware.auth({ guards: ['web'] }) ;
- utiliser auth.getUserOrFail() ;
- renvoyer uniquement les propriétés publiques nécessaires au frontend.

### GET /health/live

- ne pas exposer de secret ni d’information d’infrastructure sensible ;
- répondre sans dépendre de l’authentification ;
- utiliser un format JSON stable.

---

## Cookies, session, CORS et CSRF

### Cookie de session

Configurer au minimum :

```text
httpOnly: true
secure: true en recette et production
sameSite: lax, sauf justification testée d’une autre valeur
path: /
```

Le nom du cookie doit être spécifique à Wepost et différent entre les environnements :

```text
wepost_session_dev
wepost_session_test
wepost_session_staging
wepost_session
```

Limiter le domaine du cookie de session au périmètre minimal nécessaire. Si app.wepost.pro et api.wepost.pro imposent un domaine parent, utiliser une variable d’environnement documentée et vérifier le comportement réel. Ne jamais coder le domaine de production en dur.

### CORS

- autoriser uniquement les origines Nuxt déclarées par variable d’environnement ;
- autoriser http://localhost:3000 en local ;
- ne pas utiliser une origine générique avec credentials ;
- conserver credentials: true ;
- inclure les méthodes et headers nécessaires au mécanisme CSRF ;
- tester explicitement une origine interdite.

### Frontend

Toutes les requêtes concernées doivent utiliser :

```ts
credentials: "include";
```

Le frontend ne lit jamais le cookie HttpOnly de session.

### Protection CSRF

- activer Shield CSRF pour POST, PUT, PATCH et DELETE ;
- conserver enableXsrfCookie: true ;
- exposer le cookie XSRF-TOKEN attendu par le mécanisme officiel ;
- transmettre sa valeur via le header X-XSRF-TOKEN ;
- ne jamais désactiver globalement CSRF pour les routes /api/v1 ;
- exempter uniquement de futurs webhooks externes identifiés et documentés ;
- tester une requête mutative sans jeton CSRF ;
- documenter le fonctionnement dans docs/security/task01.md.

---

## Règles métier

- pas de mot de passe oublié ;
- pas de double authentification ;
- pas de connexion sociale ;
- pas de case « Se souvenir de moi » ;
- useRememberMeTokens reste à false ;
- un e-mail correspond à un seul compte ;
- l’e-mail est normalisé avant création et connexion ;
- un compte désactivé ne peut pas se connecter ;
- un utilisateur connecté est redirigé hors des pages de connexion et d’inscription ;
- la déconnexion termine uniquement la session courante ;
- les rôles et permissions détaillés restent hors périmètre ;
- aucun token d’authentification n’est renvoyé au frontend ;
- aucun JWT ni refresh token personnalisé ;
- aucun access token guard pour l’authentification web.

---

## Interface Nuxt

### Page d’inscription

Champs minimum :

```text
Nom affiché
Adresse e-mail
Mot de passe
Confirmation du mot de passe
```

### Page de connexion

Champs minimum :

```text
Adresse e-mail
Mot de passe
```

### États obligatoires

- chargement ;
- succès ;
- erreur de validation ;
- identifiants invalides ;
- API indisponible ;
- session expirée ;
- utilisateur déjà connecté.

### Store ou composable

Prévoir au minimum :

```text
user
isAuthenticated
isLoading
fetchCurrentUser()
register()
login()
logout()
```

Le store conserve seulement les informations publiques de l’utilisateur.

---

## Autorisations

### Visiteur

- accéder à l’inscription ;
- accéder à la connexion ;
- accéder à la landing page lorsqu’elle existera ;
- ne pas accéder aux pages privées.

### Utilisateur connecté

- consulter son propre profil minimal ;
- accéder à la page privée de démonstration ;
- se déconnecter ;
- être redirigé hors des pages réservées aux visiteurs.

La gestion métier des rôles admin, agency et client sera centralisée dans task02.md.

---

## RGAA 4.1.2

### Formulaires

- utiliser des éléments HTML natifs ;
- associer chaque label à son champ ;
- ne pas utiliser le placeholder comme seul libellé ;
- utiliser autocomplete=email et autocomplete=current-password ;
- utiliser autocomplete=new-password sur l’inscription ;
- fournir les instructions avant la saisie ;
- indiquer clairement les champs obligatoires ;
- associer les erreurs aux champs avec aria-describedby ;
- annoncer le résumé des erreurs avec aria-live ;
- déplacer le focus vers le résumé ou le premier champ invalide ;
- permettre le collage dans les champs de mot de passe ;
- expliquer toute règle de mot de passe.

### Navigation et affichage

- ordre de tabulation logique ;
- focus toujours visible ;
- activation au clavier ;
- aucun piège clavier ;
- titre de page explicite ;
- lien d’évitement ;
- redirection après connexion compréhensible ;
- contraste conforme ;
- information non portée uniquement par la couleur ;
- zoom à 200 % sans perte ;
- reflow à 320 px ;
- messages d’état annoncés ;
- aucune temporisation courte imposée.

### Tests manuels obligatoires

Documenter :

- Tab et Shift+Tab ;
- soumission avec erreurs ;
- correction des erreurs ;
- inscription, connexion et déconnexion uniquement au clavier ;
- zoom 200 % ;
- reflow 320 px ;
- lecture des formulaires et messages avec VoiceOver ou NVDA.

---

## Sécurité

### Authentification

- session guard officiel uniquement ;
- User.verifyCredentials() ;
- Argon2 via la configuration officielle ;
- régénération de session gérée par le package officiel ;
- destruction de session via logout() ;
- cookie HttpOnly, Secure en production et SameSite approprié ;
- aucune donnée de session lisible depuis JavaScript.

### Protection des endpoints

- rate limiting sur register et login ;
- validation VineJS ;
- CORS en liste blanche ;
- CSRF actif ;
- aucun mass assignment ;
- pas de retour du password ;
- messages génériques pour les identifiants invalides ;
- logs sans mot de passe, cookie, session ID ni header Cookie.

### Protection de l’infrastructure

- APP_KEY différent par environnement ;
- variables de session distinctes ;
- Redis de session distinct ou préfixé par environnement ;
- durée de session explicitement configurée ;
- memory uniquement pour les tests ;
- aucun driver file dans un déploiement multi-instance.

### Dépendances

Mettre en place :

- Dependabot ;
- audit pnpm ;
- Gitleaks ou équivalent ;
- analyse statique TypeScript ;
- archivage des rapports CI.

---

## Tests obligatoires

### Tests unitaires

Tester au minimum :

- normalisation de l’e-mail ;
- validation des champs ;
- refus d’un mot de passe invalide ;
- sérialisation sans mot de passe ;
- refus d’un utilisateur désactivé ;
- mapping du profil public.

### Tests API avec Japa

Utiliser les outils AdonisJS et le driver de session memory.

Scénarios :

1. inscription valide ;
2. e-mail déjà utilisé ;
3. inscription invalide ;
4. connexion valide ;
5. mauvais mot de passe ;
6. e-mail inexistant avec le même message public ;
7. compte désactivé ;
8. /auth/me authentifié ;
9. /auth/me non authentifié ;
10. déconnexion ;
11. session inutilisable après déconnexion ;
12. accès à une route protégée ;
13. rate limiting ;
14. requête mutative sans CSRF ;
15. origine CORS interdite ;
16. session expirée.

Utiliser les helpers de sessions et cookies prévus par AdonisJS. Ne jamais fabriquer un faux bearer token.

### Tests frontend avec Vitest

Tester :

- état initial du store ;
- récupération de /auth/me ;
- état après inscription ;
- état après connexion ;
- état après déconnexion ;
- session expirée ;
- affichage et annonce des erreurs ;
- middleware auth ;
- middleware guest ;
- utilisation de credentials: include.

### Tests E2E avec Playwright

Scénario nominal :

```text
ouvrir l’inscription
→ créer le compte
→ être connecté
→ consulter la page privée
→ recharger la page
→ conserver la session
→ se déconnecter
→ être redirigé vers la connexion
→ ne plus pouvoir ouvrir la page privée
```

Scénarios complémentaires :

- connexion invalide ;
- navigation complète au clavier ;
- annonce des erreurs ;
- expiration ou suppression de session ;
- CSRF refusé ;
- absence de token dans localStorage et sessionStorage.

### Couverture

Objectifs initiaux :

```text
lignes : 80 %
branches : 70 %
service et modèle d’authentification : 90 %
```

Ne déclarer que les valeurs réellement mesurées.

---

## Recette fonctionnelle à produire

Créer docs/recette/task01.md avec au minimum :

| ID      | Scénario                       | Précondition          | Résultat attendu                    |
| ------- | ------------------------------ | --------------------- | ----------------------------------- |
| AUTH-01 | Inscription valide             | aucun compte existant | compte créé et session ouverte      |
| AUTH-02 | E-mail déjà utilisé            | compte existant       | erreur compréhensible               |
| AUTH-03 | Validation formulaire          | aucune                | erreurs associées aux champs        |
| AUTH-04 | Connexion valide               | compte actif          | session ouverte                     |
| AUTH-05 | Connexion invalide             | compte actif          | message générique, aucune session   |
| AUTH-06 | Compte désactivé               | compte inactif        | connexion refusée                   |
| AUTH-07 | Consultation du profil         | connecté              | profil public retourné              |
| AUTH-08 | Route privée sans session      | non connecté          | accès refusé                        |
| AUTH-09 | Persistance après rechargement | connecté              | session conservée                   |
| AUTH-10 | Déconnexion                    | connecté              | session détruite                    |
| AUTH-11 | Réutilisation après logout     | déconnecté            | accès refusé                        |
| AUTH-12 | Navigation clavier             | aucune                | parcours réalisable                 |
| AUTH-13 | Zoom et reflow                 | aucune                | aucune perte d’information          |
| AUTH-14 | CSRF                           | session existante     | requête illégitime bloquée          |
| AUTH-15 | Rate limit                     | plusieurs échecs      | limitation appliquée                |
| AUTH-16 | Expiration                     | session expirée       | accès refusé et interface cohérente |
| AUTH-17 | Origine interdite              | origine non autorisée | CORS bloque l’accès navigateur      |

Ajouter après exécution :

```text
résultat observé
statut OK/KO
date
environnement
testeur
version ou SHA
anomalie liée
```

---

## Observabilité

- logs structurés de connexion réussie ou échouée sans e-mail complet ;
- identifiant de corrélation ;
- compteur des échecs de connexion ;
- compteur des sessions ouvertes uniquement si disponible sans surcharge ;
- health endpoint minimal ;
- alerte documentée sur un volume anormal d’échecs ;
- aucune valeur de cookie ou session dans les logs ;
- SHA Git disponible en recette.

---

## Fichiers attendus ou à vérifier

Adapter les chemins aux conventions réellement présentes :

```text
apps/api/config/auth.ts
apps/api/config/session.ts
apps/api/config/redis.ts
apps/api/config/limiter.ts
apps/api/app/models/user.ts
apps/api/app/controllers/auth/register_controller.ts
apps/api/app/controllers/auth/session_controller.ts
apps/api/app/validators/auth/register_validator.ts
apps/api/app/validators/auth/login_validator.ts
apps/api/app/middleware/auth_middleware.ts
apps/api/app/middleware/guest_middleware.ts
apps/api/app/middleware/silent_auth_middleware.ts
apps/api/start/kernel.ts
apps/api/start/routes.ts
apps/api/database/migrations/*_create_users_table.ts
apps/api/tests/functional/auth/*.spec.ts

apps/web/pages/auth/login.vue
apps/web/pages/auth/register.vue
apps/web/pages/dashboard.vue
apps/web/composables/useAuth.ts
apps/web/middleware/auth.ts
apps/web/middleware/guest.ts
apps/web/tests/auth/*.spec.ts
apps/web/e2e/auth.spec.ts

.github/workflows/ci.yml
.github/dependabot.yml
.env.example
docs/recette/task01.md
docs/evidence/task01.md
docs/security/task01.md
docs/accessibility/task01.md
docs/manuals/authentication.md
docs/manuals/deployment.md
CHANGELOG.md
```

Ne pas créer de fichiers parallèles si une convention équivalente existe déjà.

---

## Hors périmètre

- mot de passe oublié ;
- changement de mot de passe ;
- vérification d’adresse e-mail ;
- double authentification ;
- connexion sociale ;
- « Se souvenir de moi » ;
- gestion complète des rôles ;
- permissions métier ;
- JWT ;
- refresh token ;
- API publique pour applications tierces ;
- access token guard, sauf impossibilité documentée d’utiliser les sessions.

---

## Livrables documentaires et preuves

Créer ou mettre à jour :

- docs/recette/task01.md ;
- docs/evidence/task01.md ;
- docs/security/task01.md ;
- docs/accessibility/task01.md ;
- docs/manuals/authentication.md ;
- docs/manuals/deployment.md ;
- CHANGELOG.md.

Le dossier de preuve doit contenir :

- packages et versions réellement installés ;
- extraits de config/auth.ts et config/session.ts sans secret ;
- configuration Redis sans secret ;
- modèle User et AuthFinder ;
- routes et middleware ;
- résultats des tests ;
- couverture mesurée ;
- capture ou référence d’une CI verte ;
- capture ou référence d’une CI bloquée ;
- captures des pages de connexion et d’inscription ;
- capture du cookie montrant seulement ses attributs, jamais sa valeur ;
- résultats RGAA ;
- risques et limitations ;
- SHA livré.

---

## Définition de terminé

- [ ] @adonisjs/auth est installé et configuré.
- [ ] @adonisjs/session est installé et configuré.
- [ ] @adonisjs/redis est installé et configuré.
- [ ] @adonisjs/limiter est installé et configuré.
- [ ] Le session guard web est l’unique guard utilisateur et le guard par défaut.
- [ ] Le guard API par access tokens et ses artefacts inutilisés ont été retirés.
- [ ] AuthFinder et User.verifyCredentials() sont utilisés.
- [ ] Aucun JWT, bearer token ou refresh token personnalisé n’existe.
- [ ] Redis stocke les sessions en local, recette et production.
- [ ] Memory est utilisé uniquement pour les tests.
- [ ] L’inscription fonctionne.
- [ ] La connexion fonctionne.
- [ ] /auth/me est protégé.
- [ ] La session survit à un rechargement.
- [ ] La déconnexion détruit la session courante.
- [ ] CORS, cookies et CSRF sont configurés.
- [ ] Le rate limiting est actif.
- [ ] Les tests unitaires sont écrits.
- [ ] Les tests API sont écrits.
- [ ] Les tests frontend sont écrits.
- [ ] Les tests E2E sont écrits.
- [ ] Les tests de sécurité sont écrits.
- [ ] Les contrôles RGAA sont exécutés et documentés.
- [ ] Lint, format check, typecheck, tests et builds sont verts.
- [ ] La recette est exécutée en préproduction.
- [ ] La documentation et les preuves sont complètes.
- [ ] Aucun secret, cookie ou identifiant de session n’est commité ou journalisé.

---

## Compte rendu attendu de Codex

Terminer la réponse avec :

1. audit initial du dépôt ;
2. choix de configuration du session guard ;
3. fichiers créés ou modifiés ;
4. migrations ;
5. variables d’environnement ajoutées ;
6. commandes exécutées ;
7. résultats des tests ;
8. couverture mesurée ;
9. résultats RGAA ;
10. résultats sécurité ;
11. limites ou écarts ;
12. actions manuelles restantes.
