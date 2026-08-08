# Sécurité — Tâche 21

Les endpoints détaillés et les métriques exigent une session administrateur et sont limités à 30 lectures par minute. Une agence, un client ou un visiteur reçoit respectivement 403 ou 401. Le liveness reste minimal ; la readiness publique ne révèle que les noms et états des dépendances nécessaires.

Les jobs échoués sont listés sans payload ni raison externe brute. La relance accepte un identifiant borné, exige CSRF, vérifie l’état `failed`, applique le rate limiting admin et crée l’audit `system.job_retry_requested`.

Les logs structurés contiennent un `correlation_id`, la méthode, un chemin expurgé, le statut et la durée. Les cookies, tokens OAuth, URL Push Uptime Kuma, secrets R2 et corps de requêtes ne sont jamais journalisés. Le token d'un flux calendrier est remplacé par `[redacted]`.

Les moniteurs de production ne conservent pas le corps des réponses d'erreur :
le test local a montré qu'une réponse de développement pouvait contenir une
stack et des chemins internes. Les notifications ne doivent transmettre que le
nom du moniteur, l'environnement, l'état HTTP, l'heure et un identifiant de
corrélation expurgé. Les routes de health ne créent ni ne lisent de session ;
toute la chaîne session, CSRF et authentification reste appliquée à
`/api/v1`.
