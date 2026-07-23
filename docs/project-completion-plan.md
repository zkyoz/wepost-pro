# Plan de clôture du projet Wepost.pro

Date de l’audit : 23 juillet 2026.

## État réel

Les 23 tâches ont produit un socle fonctionnel conséquent : Nuxt, API AdonisJS,
sessions Redis, rôles, projets, publications, médias, calendrier, collaboration,
adaptateurs sociaux, administration, statistiques, IA abstraite, annotations,
ICS, i18n, supervision, sauvegardes et landing page.

Cela ne signifie pas encore que les 23 tâches sont livrées en production. La
définition de terminé du projet exige aussi Git, CI, préproduction, recette
humaine, services externes réels et preuves.

| Domaine                 | État au 23/07/2026                    | Condition de clôture                          |
| ----------------------- | ------------------------------------- | --------------------------------------------- |
| Code fonctionnel 01–23  | campagne locale verte le 23/07/2026   | conserver le même résultat dans la CI         |
| Démonstration locale    | Préparée par `pnpm demo:prepare`      | validation visuelle du porteur                |
| Git et SHA              | aucun commit initial                  | commit, push et SHA traçable                  |
| GitHub Actions          | workflow écrit, jamais exécuté        | run rouge documenté puis run vert             |
| Préproduction           | non déployée                          | Coolify, HTTPS, migrations et smoke tests     |
| Recette humaine         | 38 contrôles marqués partiels/à faire | procès-verbal daté et signé                   |
| Accessibilité manuelle  | non réalisée                          | clavier, zoom, reflow et VoiceOver/NVDA       |
| Services externes       | mocks locaux                          | tests réels contrôlés sans secrets exposés    |
| Sauvegarde/restauration | code et simulations                   | backup R2 réel et restore drill isolé         |
| Dossier RNCP            | structure présente                    | captures, SHA, CI, mesures et limites finales |

## Plan exécutable

### Phase 1 — Voir et accepter le produit local

Responsable principal : porteur du projet. Assistance : Codex.

- [x] démarrer PostgreSQL et Redis ;
- [x] appliquer les migrations locales ;
- [x] ajouter une commande de données de démonstration sûre et idempotente ;
- [x] vérifier landing, session, projet, publications, calendrier et supervision dans le navigateur ;
- [x] vérifier le reflow à 320 px sans débordement horizontal ;
- [x] exécuter lint, format, typecheck, builds, couverture et E2E ;
- [ ] parcourir les trois rôles avec `docs/manuals/local-review.md` ;
- [ ] consigner les anomalies fonctionnelles ou visuelles ;
- [ ] corriger uniquement les anomalies bloquantes avant le gel du code.

Critère de sortie : le porteur sait utiliser le parcours agence/client/admin et
accepte l’interface comme base de recette.

Résultats locaux du 23 juillet 2026 :

| Contrôle                          | Résultat                                     |
| --------------------------------- | -------------------------------------------- |
| lint, format, typecheck et builds | OK pour API, web et worker                   |
| tests API                         | 192/192                                      |
| tests web                         | 100/100                                      |
| tests worker                      | 97/97                                        |
| Playwright                        | 18/18 après correction d’un sélecteur ambigu |
| couverture API                    | lignes 86,19 % ; branches 71,91 %            |
| couverture web                    | lignes 84,03 % ; branches 76,25 %            |
| couverture worker                 | lignes 92,23 % ; branches 81,52 %            |
| santé locale                      | PostgreSQL, Redis et BullMQ opérationnels    |

Les 38 contrôles encore ouverts se répartissent en 19 contrôles manuels
d’accessibilité et 19 validations externes, légales ou opérationnelles. Leur
détail reste la source de vérité dans les tableaux `docs/recette/taskXX.md`.

### Phase 2 — Créer la traçabilité Git et obtenir une CI verte

Responsable principal : Codex, après autorisation explicite du porteur.

- [ ] relire les fichiers à versionner et vérifier l’absence de secret ;
- [ ] créer une branche `develop` ou une branche initiale convenue ;
- [ ] créer le premier commit Conventional Commit ;
- [ ] pousser vers GitHub ;
- [ ] activer les protections de `develop` et `main` ;
- [ ] exécuter GitHub Actions et conserver un exemple rouge puis vert ;
- [ ] reporter le SHA et les liens de runs dans les preuves 01–23.

Critère de sortie : un SHA reproductible possède lint, format, typecheck, tests,
couverture, builds, scans et E2E verts.

### Phase 3 — Déployer la préproduction

Responsable principal : porteur pour les comptes, domaines et secrets ; Codex
pour la configuration et les vérifications.

- [ ] créer le VPS Hetzner et installer/connecter Coolify ;
- [ ] configurer `app.<domaine>` et `api.<domaine>`, DNS et HTTPS ;
- [ ] créer PostgreSQL et Redis dédiés à la recette ;
- [ ] déployer Nuxt, API et worker comme trois services ;
- [ ] renseigner des secrets distincts et les variables décrites dans le manuel ;
- [ ] exécuter les migrations puis `/health/live` et `/health/ready` ;
- [ ] vérifier cookie, CORS, CSRF, session persistante et logout ;
- [ ] configurer Uptime Kuma et une notification de test.

Critère de sortie : la recette HTTPS est stable et déploie automatiquement le
SHA de `develop`.

### Phase 4 — Brancher les fournisseurs réels

Les activations peuvent être traitées séparément ; aucune clé ne doit être
envoyée dans un chat ou committée.

- [ ] Cloudflare R2 : bucket média privé, CORS, accès API et cycle upload/lecture/suppression ;
- [ ] Resend : domaine validé, expéditeur, e-mail HTML/texte et retry ;
- [ ] Meta : Page de test, compte Instagram professionnel, App Review et posts de test ;
- [ ] LinkedIn : produit/scopes, organisation de test et publication contrôlée ;
- [ ] Pinterest : application, scopes, tableau de test et Pin contrôlé ;
- [ ] TikTok : Content Posting API, audit, compte de test et vidéo contrôlée ;
- [ ] fournisseur IA : choix contractuel/RGPD, modèle, quota, coût et test humain ;
- [ ] PostHog Cloud EU : projet, consentement, opt-out et absence de capture sensible ;
- [ ] R2 sauvegardes : credentials séparés, chiffrement, rétention et restauration.

Critère de sortie : chaque intégration possède une preuve réelle, une procédure
de révocation et aucun secret dans les logs ou captures.

### Phase 5 — Recette manuelle et dossier RNCP

Responsable principal : porteur/testeur humain.

- [ ] exécuter les 23 cahiers `docs/recette/taskXX.md` en préproduction ;
- [ ] compléter date, environnement, testeur, résultat observé et anomalie ;
- [ ] faire les parcours clavier, zoom 200 %, reflow 320 px et VoiceOver ou NVDA ;
- [ ] importer un flux ICS dans Google Calendar, Outlook et Apple Calendar ;
- [ ] valider les textes légaux, la politique RGPD et les durées de conservation ;
- [ ] réaliser les tests réels sociaux, e-mail, alerte et restore drill ;
- [ ] ajouter captures expurgées, SHA et liens CI dans `docs/evidence/` ;
- [ ] corriger chaque KO puis exécuter son test de non-régression ;
- [ ] figer les résultats de couverture et performances réellement mesurés.

Critère de sortie : aucune case bloquante n’est en attente et aucune affirmation
documentaire ne dépasse ce qui a été mesuré.

### Phase 6 — Production

- [ ] valider manuellement la promotion `develop` vers `main` ;
- [ ] sauvegarder avant migration ;
- [ ] déployer le SHA approuvé avec approbation GitHub/Coolify ;
- [ ] exécuter smoke tests, monitoring et vérification du worker ;
- [ ] documenter rollback et résultat de la mise en production ;
- [ ] créer le tag/release et mettre à jour le changelog final.

## Actions qui nécessitent le porteur

Codex ne peut pas remplacer la création ou l’acceptation juridique des comptes,
contrats et permissions externes. Le porteur doit fournir ou valider :

1. le domaine final et l’accès Hetzner/Coolify ;
2. les comptes Cloudflare, Resend, Meta, LinkedIn, Pinterest, TikTok, PostHog et IA ;
3. les secrets via Coolify/GitHub, jamais dans la conversation ;
4. les mentions légales, contacts, politique de confidentialité et choix RGPD ;
5. les tests lecteur d’écran et la signature de recette ;
6. l’autorisation de commit/push et les règles de branches ;
7. les contenus/comptes sociaux de test autorisés ;
8. la validation finale de production.

## Ordre immédiat recommandé

Ne pas ouvrir d’abord tous les portails sociaux. L’ordre efficace est :

1. accepter la démonstration locale ;
2. créer le premier commit et obtenir la CI verte ;
3. déployer une préproduction sans intégrations réelles ;
4. connecter R2 et Resend ;
5. connecter les réseaux un par un ;
6. terminer accessibilité, recette et preuves ;
7. seulement ensuite promouvoir en production.
