# Sécurité — Tâche 07

## Autorisation et isolation

Toutes les routes relisent la publication via la portée projet existante. Une ressource d’un autre client ou d’une autre agence répond 404. Seul un client affecté peut décider ; agence et admin peuvent commenter, mais reçoivent 403 sur une revue. La modification appartient uniquement à l’auteur pendant la fenêtre configurée. Une modération admin est une suppression logique auditée.

## Entrées, sorties et concurrence

- UUID, longueurs, enums et versions sont validés par VineJS ;
- décisions limitées à `approved` et `changes_requested` par application et contrainte PostgreSQL ;
- demande de corrections avec message obligatoire ;
- approbation liée à `content_version`, version périmée en 409 ;
- commentaires rendus par interpolation Vue, sans `v-html` ;
- CSRF Shield et rate limiting appliqués aux écritures sensibles ;
- aucune valeur `agency_id`, auteur, statut ou version approuvée n’est acceptée du frontend.

## E-mails et file

Le job contient uniquement l’identifiant de notification et la version de template. Le worker recharge le destinataire depuis PostgreSQL. Ni le corps du commentaire, ni le message de revue, ni un token ne figurent dans le job, l’e-mail ou les logs. Les templates échappent leurs valeurs et fournissent HTML sémantique et texte brut. La clé d’idempotence Resend est stable par notification et version de template.

BullMQ effectue une tentative initiale puis trois retries espacés de 1, 5 et 15 minutes. Les erreurs fonctionnelles permanentes arrêtent les retries ; l’état `pending`, `sent` ou `failed`, le nombre d’essais et une erreur générique restent en PostgreSQL. Une panne de file ne revient jamais sur la transaction commentaire/revue.

## Tests

Les tests couvrent IDOR, décision par rôle interdit, version obsolète, corps XSS, propriété d’un commentaire, échec d’enqueue, succès/retry/échec définitif du worker et absence de contenu sensible dans le template.
