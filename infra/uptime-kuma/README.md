# Uptime Kuma

Le profil Docker `monitoring` démarre Uptime Kuma v2 sur le port 3001 :

```bash
docker compose --profile monitoring up -d uptime-kuma
```

En recette et production, déployer ce service séparément avec Coolify, un volume local persistant pour `/app/data`, TLS et un accès administrateur protégé par MFA. Ne pas utiliser un partage NFS pour les données.

Moniteurs à créer manuellement :

| Nom                   | Type      | Cible                                           | Intervalle | Alerte                |
| --------------------- | --------- | ----------------------------------------------- | ---------- | --------------------- |
| API liveness          | HTTP      | `https://api.<env>/health/live`                 | 60 s       | 3 échecs              |
| Application readiness | HTTP JSON | `https://api.<env>/health/ready`                | 60 s       | 2 échecs              |
| Worker heartbeat      | Push      | URL injectée dans `UPTIME_KUMA_WORKER_PUSH_URL` | 60 s       | absence pendant 5 min |
| Frontend              | HTTP      | `https://app.<env>/`                            | 60 s       | 3 échecs              |

Dans Uptime Kuma, `3 échecs` correspond à deux tentatives après le premier
contrôle en erreur ; `2 échecs` correspond à une tentative. Les alertes sont
répétées toutes les 15 occurrences hors ligne, soit environ toutes les
15 minutes avec cet intervalle. Une notification de rétablissement est envoyée
au retour à l'état opérationnel.

Les noms des moniteurs et notifications doivent contenir l'environnement. Le
canal local de preuve est un webhook ; les deux canaux et destinataires de
production restent à valider avant la mise en service. L'URL Push est un
secret : elle reste dans Coolify et ne doit jamais être journalisée.

Ne pas activer l'enregistrement du corps des réponses d'erreur sur les
moniteurs de production. L'état HTTP, le composant, l'heure et le
`correlation_id` suffisent au diagnostic initial et évitent de transmettre une
stack ou une donnée sensible au canal d'alerte.
