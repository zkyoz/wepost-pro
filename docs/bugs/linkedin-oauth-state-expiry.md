# LinkedIn — expiration prématurée de l’état OAuth

## Constat et périmètre

- Détection : 13 septembre 2026, démonstration locale sur macOS, Node.js 24.
- Version affectée observée : `68db95b2204d7ac12d3ef43d4b4f11b2a39d4321`.
- Branche : `codex/bc03-demo` ; [PR #29](https://github.com/zkyoz/wepost-pro/pull/29).
- Composant : contrôleur OAuth LinkedIn, profils personnels et Pages.
- Impact : connexion refusée après l’autorisation sur LinkedIn. Proposition
  de classement S2/P1 : parcours essentiel bloqué, sans perte de données observée.
- Statut : correctif testé localement, non fusionné ; retour OAuth réel à
  vérifier après la nouvelle connexion du titulaire.

## Reproduction et cause

1. Démarrer le parcours LinkedIn depuis une session agence dans WePost.
2. Attendre plus de 600 ms avant de revenir au callback.
3. Constater HTTP 400 avec « État OAuth invalide ou expiré. » au lieu du
   retour attendu vers les comptes connectés.

Le payload prévoyait dix minutes (`expiresAt`), mais l’appel
`encryption.encrypt(payload, 600, purpose)` utilisait une durée numérique
interprétée en millisecondes par les dépendances installées. L’enveloppe
chiffrée expirait donc avant la fin d’une connexion humaine normale.
Le diagnostic a été confirmé par le code installé et par deux tests HTTP
qui échouent avant la correction, puis réussissent après celle-ci.

## Correctif et protections conservées

Le contrôleur utilise désormais les options explicites
`{ expiresIn: '10m', purpose: 'linkedin:oauth-state' }`.
Le nonce de session, son usage unique, l’authentification, le CSRF du départ,
les liaisons acteur/agence/cible et le contrôle temporel du payload restent
inchangés. Aucun secret, callback personnel ou token réel n’est inclus ici.

Source du contrat : [chiffrement AdonisJS](https://docs.adonisjs.com/guides/security/encryption).

## Vérifications exécutées

- Avant correctif : huit tests LinkedIn réussis et deux échecs attendus
  (callback après deux secondes et après neuf minutes).
- Après correctif : dix tests LinkedIn réussis ; callback accepté avant
  expiration, refusé à dix minutes, et rejeu refusé après succès.
- API complète : 207 tests réussis, couverture lignes 86,56 %, branches
  71,90 %, fonctions 83,92 % ; base de tests séparée `wepost_test`.
- Formatage ciblé, lint ciblé, TypeScript et build API : réussis.
- API corrigée chargée dans la démo locale ; frontend, liveness et readiness
  vérifiés en HTTP 200. Données et clés de démonstration conservées.

Les tests HTTP simulent les réponses LinkedIn. Le navigateur atteint de
nouveau la page d’identification officielle ; la validation du retour réel
nécessite la saisie du titulaire. Aucune publication réelle n’a été lancée.

## Livraison et limites

Aucune migration, nouvelle dépendance ou modification du frontend/worker.
Une ancienne URL de callback ne doit pas être réutilisée : repartir du bouton
de connexion pour créer un nouvel état. En cas de retour à une version
antérieure, reconstruire l’API et redémarrer le lanceur ; cette version
réintroduirait le défaut et ne convient pas à la connexion réelle.

La PR reste en brouillon. Le [run CI antérieur](https://github.com/zkyoz/wepost-pro/actions/runs/34762877018)
signale des problèmes distincts du présent correctif (chargement de la commande
`backup_database` et contrôle CodeQL du filtrage HTML). Ils ne sont ni masqués
ni déclarés corrigés par cette modification. Aucune livraison production ou
validation de Page entreprise n’est revendiquée.
