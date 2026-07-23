# Sécurité — Tâche 01

- Date d’évaluation : 22 juillet 2026
- Périmètre : inscription, connexion, session, profil courant et déconnexion
- Résultat automatisé local : OK

## Mesures livrées

- session guard officiel `web`, `sessionUserProvider` Lucid et `User.verifyCredentials()` ;
- Argon2id via le service de hash AdonisJS ;
- aucun access token, JWT, refresh token ni table de sessions PostgreSQL ;
- session Redis avec préfixes et bases distinctes ; mémoire uniquement sous `NODE_ENV=test` ;
- cookie de session `HttpOnly`, `Secure` en production, `SameSite=Lax`, nom par environnement ;
- Shield actif sur POST/PUT/PATCH/DELETE avec cookie chiffré `XSRF-TOKEN` et en-tête `X-XSRF-TOKEN` ;
- CORS limité à `CORS_ORIGINS`, credentials actifs et aucune origine générique ;
- validation VineJS, e-mail normalisé, mot de passe absent des réponses ;
- message identique pour compte inconnu, mauvais mot de passe ou compte désactivé ;
- rate limiting Redis en exécution et mémoire isolée en tests ;
- journalisation structurée sans e-mail complet, cookie, mot de passe ni identifiant de session ;
- Dependabot, audit pnpm, Gitleaks et CodeQL définis dans la CI.

## Preuves automatisées

Les tests API vérifient l’inscription, les doublons, les entrées invalides, la connexion, l’indistinguabilité des erreurs, le compte désactivé, `/auth/me`, le logout, le rejet CSRF (`403`), l’origine CORS interdite et le rate limiting (`429`). Les E2E vérifient en plus l’absence de token dans `localStorage` et `sessionStorage`.

## Analyse OWASP ciblée

| Risque                      | Réponse dans cette tâche                                                          |
| --------------------------- | --------------------------------------------------------------------------------- |
| Contrôle d’accès défaillant | middleware `auth` serveur sur `/me` et `/logout`                                  |
| Défaillance cryptographique | Argon2id, cookie `HttpOnly`, `Secure` en production, secrets hors Git             |
| Injection                   | validateurs VineJS et Lucid ; aucun SQL concaténé                                 |
| Conception non sûre         | session officielle, CSRF, CORS allowlist, deny-by-default des routes privées      |
| Mauvaise configuration      | variables validées au démarrage et valeurs séparées par environnement             |
| Composants vulnérables      | lockfile, Dependabot et `pnpm audit` CI                                           |
| Échec d’authentification    | erreur générique, rate limit, rotation interne de session par le package officiel |
| Intégrité logicielle        | installation figée et contrôles CI bloquants                                      |
| Journalisation insuffisante | événements succès/échec/logout et identifiant de corrélation                      |
| SSRF                        | aucune URL fournie par l’utilisateur ni appel sortant dans ce périmètre           |

## Limites et actions manuelles

- les attributs `Secure` et `Domain=.wepost.pro` doivent être constatés sur la recette HTTPS ;
- la CI GitHub, Gitleaks et CodeQL doivent encore être exécutés sur un commit poussé ;
- CSP est hors du périmètre de cette tâche et reste désactivée ;
- les alertes de volume anormal seront branchées lors de la supervision système ;
- une revue des en-têtes du reverse proxy Coolify reste nécessaire avant production.
