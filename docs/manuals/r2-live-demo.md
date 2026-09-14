# Médias R2 privés — démonstration BC03

Ce profil conserve Nuxt, AdonisJS, PostgreSQL, Redis et BullMQ sur le Mac.
LinkedIn personnel et Instagram Login utilisent leurs API réelles ; les médias
sont stockés dans R2. Internet est nécessaire. Les autres réseaux restent
simulés et les e-mails sont capturés localement.

## Configuration initiale

1. Créer le bucket privé `wepost-demo-media`, classe Standard. Ne pas activer
   l'accès public, `r2.dev` ou un domaine public.
2. Créer des identifiants S3 « Lecture/écriture objet », limités à ce bucket.
   Une durée d'une semaine couvre cette répétition et l'oral du 15 septembre.
   La valeur du jeton d'administration Cloudflare n'est pas utilisée.
3. Copier `infra/demo/r2.env.example` dans `.demo/r2.env`, remplir les valeurs
   localement et appliquer `chmod 600 .demo/r2.env`. Ce fichier est ignoré par Git.
4. Dans les paramètres CORS du bucket, enregistrer `infra/demo/r2-cors.json`.
   L'origine autorisée est exactement `http://127.0.0.1:3000`.
5. Conserver `.demo/runtime.env` et `.demo/linkedin.env` : ils contiennent les
   paramètres et clés associés aux données existantes. Ne pas les régénérer.

## Préserver les médias existants

```bash
nvm use
pnpm demo:r2:check
pnpm demo:r2:plan
pnpm demo:r2:copy
```

Le plan est en lecture seule. La copie vérifie taille et SHA-256 avant transfert,
puis relit chaque objet envoyé. Une destination différente ou un original
manquant provoque un arrêt ; aucun objet existant n'est écrasé. Les clés des
anciens médias restent inchangées afin de conserver leurs associations en base.
Les fichiers locaux ne sont pas supprimés et aucune ligne métier n'est modifiée.
Effectuer cette migration avant d'ajouter de nouveaux médias R2 : le script
contrôle les originaux locaux et ne constitue pas une synchronisation permanente.

## Démarrer après la migration

Arrêter le précédent lanceur avec Ctrl+C, puis :

```bash
nvm use
pnpm demo:oral:build
pnpm demo:social:r2:start
```

Ouvrir `http://127.0.0.1:3000`. Ne pas alterner avec `localhost`.
Les nouvelles images sont transférées depuis le navigateur directement vers R2
avec un PUT signé. L'API relit le fichier, vérifie son type réel, sa taille et
son SHA-256, puis autorise son association à la publication.

Les liens de lecture de l'interface et les liens d'upload durent cinq minutes.
Le worker crée un nouveau lien GET de vingt minutes au moment du traitement
Instagram, et non au moment de la programmation. Meta peut ainsi récupérer
l'image sans connexion à WePost. Ce lien donne un accès temporaire à un seul
objet ; toute personne qui le détient peut le lire pendant sa validité.
Il ne faut donc jamais le placer dans une capture de preuve ou dans Git.

Le profil désactive le pont HTTPS de test précédent. Aucun tunnel vers le Mac
n'est nécessaire. L'expiration du lien R2 ne supprime pas un post déjà importé
par Instagram. L'expiration des identifiants S3 empêche en revanche les nouveaux
transferts et signatures : les renouveler avant leur échéance.

## Répéter la publication

Créer un nouveau brouillon Instagram, choisir un JPEG compatible, saisir une
alternative textuelle, puis « Téléverser et associer ». Soumettre le post au
compte client de démonstration, approuver sa version, revenir au compte agence
et valider puis programmer Instagram. Vérifier l'état final, la tentative et
le post sur le compte autorisé. Ne pas programmer une seconde fois pour compenser
un simple délai d'affichage : actualiser le statut d'abord.

Un fichier déjà présent dans la médiathèque de l'agence est rejeté comme doublon
par checksum. Pour un nouvel essai d'upload, choisir un nouveau fichier.

## Repli

Ctrl+C arrête les applications sans supprimer PostgreSQL, Redis ni R2.
Ne pas revenir aveuglément au stockage local : les médias nouvellement déposés
dans R2 n'ont pas de copie locale automatique. Le profil local historique ne
permet donc pas de relire ces nouveaux objets sans export vérifié préalable.

Références : [CORS R2](https://developers.cloudflare.com/r2/buckets/cors/),
[URLs présignées](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).
