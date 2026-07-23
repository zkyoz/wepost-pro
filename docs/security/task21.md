# Sécurité — Tâche 21

Les endpoints détaillés et les métriques exigent une session administrateur et sont limités à 30 lectures par minute. Une agence, un client ou un visiteur reçoit respectivement 403 ou 401. Le liveness reste minimal ; la readiness publique ne révèle que les noms et états des dépendances nécessaires.

Les jobs échoués sont listés sans payload ni raison externe brute. La relance accepte un identifiant borné, exige CSRF, vérifie l’état `failed`, applique le rate limiting admin et crée l’audit `system.job_retry_requested`.

Les logs structurés contiennent un `correlation_id`, la méthode, un chemin expurgé, le statut et la durée. Les cookies, tokens OAuth, URL Push Uptime Kuma, secrets R2 et corps de requêtes ne sont jamais journalisés. Le token d’un flux calendrier est remplacé par `[redacted]`.
