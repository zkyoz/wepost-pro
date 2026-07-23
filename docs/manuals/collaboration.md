# Manuel des commentaires, validations et notifications

## Commenter

Ouvrir une publication puis utiliser « Ajouter un commentaire ». Le fil conserve l’auteur, la date et l’ordre chronologique. Un auteur peut modifier ou supprimer son commentaire pendant la fenêtre configurée par `COMMENT_EDIT_WINDOW_MINUTES`. L’administrateur peut modérer avec une trace d’audit.

Le commentaire est enregistré avant la mise en file de l’e-mail : un problème Redis ou Resend n’annule donc jamais la contribution.

## Valider côté client

Lorsque la publication est « En attente de validation client », le client affecté peut :

- approuver exactement la version affichée ;
- demander des corrections avec un message obligatoire.

Une confirmation rappelle la version concernée. Si l’agence modifie entre-temps le contenu, l’API refuse la décision obsolète et demande de recharger. Toute modification après approbation invalide l’approbation précédente.

## Notifications

Le lien « Notifications » affiche les activités personnelles, le compteur non lu et l’état de l’e-mail. Chaque notification peut être marquée lue ou non lue. Un échec d’e-mail ne masque pas la notification dans l’application.

## Worker et Resend

Le worker est un processus séparé :

```bash
cp apps/worker/.env.example apps/worker/.env
pnpm dev:worker
```

En recette et production, configurer `RESEND_API_KEY`, `EMAIL_FROM`, `WEB_APP_URL`, PostgreSQL, `EMAIL_QUEUE_NAME`, `REDIS_QUEUE_DB` et le même `REDIS_KEY_PREFIX` que l’API. Vérifier le domaine expéditeur dans Resend. Ne jamais placer ces secrets dans Nuxt.

Le mécanisme suit les documentations officielles [BullMQ retries](https://docs.bullmq.io/guide/retrying-failing-jobs) et [Resend Send Email](https://resend.com/docs/api-reference/emails/send-email).
