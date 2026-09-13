# Recette — Tâche 10

Version testée : arbre local du 22/07/2026. Environnement : macOS, PostgreSQL, Redis, API AdonisJS, worker BullMQ, R2 et API LinkedIn simulés, Nuxt. Testeur automatisé : Codex. SHA et recette préproduction à compléter après déploiement.

| ID    | Scénario                    | Précondition                    | Résultat attendu                        | Observé local              | Statut  |
| ----- | --------------------------- | ------------------------------- | --------------------------------------- | -------------------------- | ------- |
| LI-01 | OAuth avec `state`          | agence authentifiée             | organisation explicitement sélectionnée | API et E2E mock            | OK      |
| LI-02 | Rejeu du callback           | `state` consommé                | requête refusée                         | test API                   | OK      |
| LI-03 | Droits organisation         | rôle administrateur/contenu     | organisation autorisée                  | client OAuth mock/unitaire | OK      |
| LI-04 | Token protégé               | organisation connectée          | tokens chiffrés et jamais renvoyés      | test API/unitaire          | OK      |
| LI-05 | Renouvellement              | refresh token fourni            | nouvel accès chiffré et audit           | test API mock              | OK      |
| LI-06 | Validation texte            | version approuvée               | texte ≤ 3 000 caractères accepté        | domaine/worker             | OK      |
| LI-07 | Validation image            | un JPEG/PNG propre              | contenu compatible                      | API/worker/E2E             | OK      |
| LI-08 | Format ou nombre invalide   | vidéo ou plusieurs médias       | validation refusée                      | domaine/worker             | OK      |
| LI-09 | Programmation               | agence autorisée                | job unique, statut `queued`             | API/E2E                    | OK      |
| LI-10 | Double programmation        | même publication/version/compte | une seule programmation                 | test API                   | OK      |
| LI-11 | Contenu changé              | job programmé                   | blocage avant LinkedIn                  | test worker                | OK      |
| LI-12 | Upload et création du post  | image R2 privée                 | initialisation, transfert puis `/posts` | test worker mock           | OK      |
| LI-13 | Timeout, 429, 5xx           | erreur transitoire              | retries 1/5/15 minutes                  | test worker                | OK      |
| LI-14 | Erreur définitive           | contenu, permission ou token    | échec sans retry inutile                | test worker                | OK      |
| LI-15 | Idempotence                 | deux exécutions                 | un seul identifiant distant simulé      | test worker                | OK      |
| LI-16 | Relance                     | échec corrigé                   | nouvelle exécution auditée              | test API                   | OK      |
| LI-17 | Client                      | projet affecté                  | statut visible, mutation 403            | test API/E2E               | OK      |
| LI-18 | Révocation                  | agence autorisée                | secrets effacés                         | test API                   | OK      |
| LI-19 | Accessibilité auto          | écran LinkedIn connecté         | aucune violation axe sérieuse/critique  | Playwright desktop/mobile  | OK      |
| LI-20 | Publication LinkedIn réelle | App Review et organisation test | texte/image publiés une fois            | à exécuter                 | À faire |
| LI-21 | Clavier/VoiceOver/zoom      | préproduction                   | parcours utilisable                     | à exécuter                 | À faire |
| LI-22 | Alerte 24 h                 | monitoring production           | alerte si échecs > 5 %                  | à configurer               | À faire |

Captures à joindre : connexion sans token, organisation/scopes, validation, statut, tentatives, publication de test, run CI et recette clavier/VoiceOver.

## Extension BC03 — profil personnel et démarrage local réel

Cette extension ne remplace pas les résultats historiques ci-dessus.

| Scénario                                     | Résultat vérifié                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Profil personnel sans identifiant de Page    | Callback simulé HTTP 302, identité issue du client OAuth, jeton chiffré ; test API                                 |
| Scopes personnels                            | `openid profile w_member_social`, sans scopes d’organisation ; test du client officiel avec réponses HTTP simulées |
| Rejeu, cible ambiguë, écriture client        | Requêtes refusées ; tests API                                                                                      |
| Compte simulé présenté au mode réel          | Programmation refusée, aucun post externe ; tests API et worker                                                    |
| Auteur personnel et Page                     | Corps Posts API distincts, identifiant invalide refusé ; tests worker                                              |
| Image stockée sur le Mac                     | Lecture du format privé de l’API, clés hachées, refus des liens symboliques ; tests worker                         |
| Envoi public confirmé                        | Annulation de la confirmation empêche la programmation ; test frontend                                             |
| Statut et lien distant                       | Actualisation et lien LinkedIn dérivé d’un identifiant distant validé ; test frontend                              |
| Connexion réelle et publication sur LinkedIn | Non exécutées : accès développeur et autorisation du compte nécessaires                                            |

Procédure à suivre : [premier envoi LinkedIn réel](../manuals/linkedin-live-demo.md).
Aucune migration de schéma ; reconnexion requise pour passer du compte simulé
au compte réel. Le simple retour au mode simulé ne supprime ni les données ni
les jetons, mais bloque l’utilisation d’un compte réel dans ce mode.

## Correctif de durée OAuth — 13 septembre 2026

- Avant correction : les deux nouveaux tests avec un délai de deux secondes
  et neuf minutes échouent (HTTP 400 au lieu de 302).
- Après correction : dix tests HTTP LinkedIn réussissent, dont les trois
  nouveaux cas temporels ; l’expiration à dix minutes et le rejeu sont refusés.
- Suite API complète : 207 tests réussis sur la base dédiée `wepost_test`.
- Build API corrigé redémarré localement : frontend, liveness et readiness
  répondent HTTP 200. Après identification par le titulaire sur LinkedIn,
  le navigateur revient à WePost et affiche son profil avec la mention
  « Connexion réelle à LinkedIn » et les permissions attendues.

Les appels LinkedIn des tests automatisés sont simulés ; la connexion du
navigateur utilise le fournisseur réel. Aucun post réel n’est créé par ces
contrôles. Voir la [fiche du correctif](../bugs/linkedin-oauth-state-expiry.md).

## Recette réelle du profil personnel

Le 13 septembre 2026, le parcours création agence, approbation via le compte
client de démonstration, puis envoi via l’agence a abouti à une publication
textuelle réelle. WePost indique « Publiée » et une tentative réussie ; le
texte « Publication de test depuis WePost. » a également été vérifié sur
LinkedIn, sous le profil personnel autorisé.

Référence distante : `urn:li:share:7504938972733861889`. Cette recette valide
l’envoi texte du profil personnel ; elle ne remplace pas LI-20 pour une Page
entreprise et une image, ni les contrôles de préproduction. Le détail et les
limites sont consignés dans les [preuves de la tâche 10](../evidence/task10.md#premier-envoi-linkedin-réel--13-septembre-2026).

## Recette réelle du profil personnel avec image

Le 13 septembre 2026, sur `codex/bc03-demo` au HEAD `3bd2d79`, les contrôles
manuels suivants ont été réalisés depuis l'interface :

| Contrôle                          | Résultat observé                                                 |
| --------------------------------- | ---------------------------------------------------------------- |
| Création et ajout d'un PNG        | Brouillon créé, média associé et aperçu affiché, 749,6 Ko        |
| Approbation du contenu avec média | Version 1 approuvée via le compte client de démonstration        |
| Compatibilité LinkedIn            | Validation réussie sur le profil personnel réel                  |
| Envoi par le worker               | Statut « Publiée », une tentative réussie                        |
| Vérification sur LinkedIn         | Auteur et texte attendus, image visible, publication publique    |
| Persistance du résultat           | Fiche rechargée : statut « Publiée » et même identifiant distant |
| Console WePost                    | Aucun avertissement ni erreur dans le relevé consulté            |

Référence distante : `urn:li:share:7504950966266388480`. L'envoi personnel
texte/image est donc vérifié ; LI-20 reste distinct pour la Page entreprise.
Le [compte rendu détaillé](../evidence/task10.md#envoi-linkedin-réel-avec-image--13-septembre-2026)
précise le fichier, la publication locale et les limites. Aucun changement
de code, test automatisé supplémentaire ou nouvelle mesure de couverture
n'a été réalisé pour cet essai. La CI reste un chantier séparé.
