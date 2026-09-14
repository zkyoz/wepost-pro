# Démonstration locale — oral BC03

Pour activer une publication LinkedIn réelle, suivre le
[guide LinkedIn](linkedin-live-demo.md). Le profil décrit ci-dessous reste
celui de la répétition simulée ; l’activation réelle est volontairement séparée.
Pour LinkedIn personnel, Instagram réel et les médias R2 privés, utiliser le
[profil social R2](r2-live-demo.md), sans tunnel vers le Mac.

## Ce qui fonctionne réellement

Nuxt, AdonisJS, PostgreSQL, les sessions Redis et le worker BullMQ fonctionnent
sur le Mac. Les projets, publications, commentaires, décisions et tentatives
sont enregistrés en base. Une action peut être refaite et son résultat relu.

Les appels aux réseaux sociaux et à l’IA utilisent les adaptateurs de test.
Un identifiant `mock-facebook-…` n’est pas une publication sur Facebook.
Les e-mails sont rendus par le worker puis capturés dans `.demo/outbox`, sans
envoi à un destinataire externe. Les médias sont conservés dans `.demo/media`,
avec les contrôles existants de type, taille, accès et URL signée ; R2 n’est
pas utilisé par ce profil. Ces limites concernent les fournisseurs externes,
pas la réalité des opérations effectuées dans l’application.

## Démarrer

Prérequis : Docker Desktop démarré, Node.js 24, pnpm 11.11.0 et dépendances
installées avec `pnpm install --frozen-lockfile`.

Depuis la racine de cette copie de travail :

```bash
nvm use
pnpm demo:oral:prepare
pnpm demo:oral:build
pnpm demo:oral:start
```

Laisser ce terminal ouvert. Ouvrir **http://127.0.0.1:3000**. Utiliser toujours
`127.0.0.1`, sans alterner avec `localhost` : les cookies et URLs signées
s’appuient sur cette adresse.

Dans un second terminal, `pnpm demo:oral:check` vérifie le frontend et les deux
routes de santé de l’API. Les applications utilisent les ports 3000 et 3333 ;
PostgreSQL et Redis utilisent les ports dédiés 5543 et 6380.

Après la préparation initiale, il suffit de relancer `demo:oral:start` si les
conteneurs tournent encore et que le code n’a pas changé. `Ctrl+C` arrête les
applications, sans effacer les données. Pour arrêter aussi les conteneurs :
`node infra/scripts/demo.mjs stop`. Relancer `prepare` les remet en route.
Ne pas supprimer les volumes, `.demo/runtime.env` ou `.demo/media` entre les
répétitions : ils contiennent les données et les clés locales correspondantes.

## Comptes de démonstration

| Rôle           | Adresse             |
| -------------- | ------------------- |
| Agence         | agence@wepost.local |
| Client         | client@wepost.local |
| Administrateur | admin@wepost.local  |

Mot de passe des trois comptes : `Demo-Wepost-2026!`.
Ces comptes publics de test ne doivent jamais être créés en production.

Le projet initial est **Maison Azur — Démonstration**. Les exemples préchargés
servent à montrer les états du workflow ; pour démontrer le worker, créer et
programmer une nouvelle publication pendant la répétition.

## Scénario principal à répéter

1. Se connecter comme agence. Ouvrir le projet, puis ses publications.
2. Créer un post Facebook avec un titre distinct, par exemple « Portes ouvertes
   — répétition 2 ». Saisir le texte et, si souhaité, ajouter un vrai PNG/JPEG
   avec une alternative textuelle **avant** de demander l’approbation.
3. Passer le post en **En cours**, puis **En attente de validation client**.
4. Se déconnecter et se connecter comme client. Ouvrir ce même post, écrire
   un commentaire, puis approuver la version et confirmer la décision.
5. Revenir au compte agence. Dans **Facebook**, renseigner `1234567890`, puis
   **Continuer avec Facebook**. Le profil local connecte la Page de test.
6. Revenir sur le post. Dans **Publication Facebook**, cliquer **Valider pour
   Facebook**, puis **Programmer sur Facebook**. Sans date souhaitée ni date
   saisie, le traitement est immédiat ; pour montrer une attente, saisir une
   date proche dans le futur.
7. Recharger le détail une fois le worker passé. Montrer **Publiée**, la
   tentative **Réussie** et l’identifiant de simulation. Le panneau ne possède
   pas encore de rafraîchissement automatique de son statut.
8. Montrer le commentaire et la décision conservés. Dans `.demo/outbox`,
   ouvrir un fichier HTML : c’est le contenu réellement produit par le worker,
   capturé localement. Les fichiers JSON associés indiquent les destinataires
   fictifs et le mode `local-demo-outbox`.

Pour répondre au jury, repartir d’un nouveau brouillon ou dupliquer un post.
Ne pas tenter de republier indéfiniment la même version : l’idempotence doit
empêcher les doublons. Une modification du contenu peut invalider son
approbation ; faire alors relire la nouvelle version.

## Points complémentaires

- Le calendrier propose une vue mensuelle et une liste accessible. Utiliser
  une publication avec une date souhaitée pour démontrer son placement.
- Les comptes client et agence n’ont pas les mêmes boutons ni autorisations
  serveur. Montrer cette différence en changeant réellement de compte.
- Les statistiques sociales externes ne prouvent pas une audience réelle
  dans ce profil. L’IA utilise des réponses de test, pas un modèle connecté.
- La supervision générale est accessible au compte administrateur. Un état
  R2 non configuré est normal dans cette démonstration locale.

## Préparer l’oral

Faire une répétition complète avec le chargeur branché, les notifications du
Mac coupées et les mêmes fenêtres que le jour de l’oral. Prévoir une copie
vidéo comme secours technique, sans remplacer la manipulation interactive.
Ne pas modifier de dépendances ni nettoyer les données juste avant de passer.

En cas d’échec, conserver l’écran et le message, vérifier le terminal du
worker, puis `demo:oral:check`. Ne pas réinitialiser la base pour masquer une
erreur. La procédure utilise un environnement local isolé ; aucune mise en
production ni connexion réelle à un fournisseur externe n’en découle.
