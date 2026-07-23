# Sécurité — Tâche 19

La permission centralisée `calendar.export` est accordée uniquement aux rôles administrateur et agence. Le client est volontairement exclu tant qu’aucun paramètre métier n’active son export. Les projets sont toujours résolus par `scopedProjectQuery` ou `findAccessibleProject` ; un identifiant inter-agence renvoie 404.

Le token de flux contient 48 octets cryptographiquement aléatoires encodés en base64url. Seul son SHA-256 est stocké avec l’utilisateur et le projet. L’API ne journalise ni token ni URL ; la liste authentifiée ne permet pas de reconstruire un ancien lien. Le lien en clair est retourné une seule fois et la révocation invalide immédiatement le flux. Un utilisateur désactivé ou privé de la permission ne peut plus utiliser son lien.

Le endpoint public est limité par IP à 60 requêtes par minute, renvoie la même 404 pour un token inconnu/révoqué et impose `Cache-Control: private, no-store` avec `nosniff`. La dernière utilisation et un compteur d’accès sont enregistrés sans conserver l’adresse du demandeur.

Le sérialiseur applique l’échappement RFC des antislashs, sauts de ligne, virgules et points-virgules, puis un repli UTF-8 à 75 octets. Le contenu est minimal : titre interne, projet, statut et date. Texte de publication, commentaires, auteurs, e-mails, médias et secrets sont exclus.
