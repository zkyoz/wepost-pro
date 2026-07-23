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

Les noms des moniteurs et notifications doivent contenir l’environnement. Les canaux d’alerte restent un `TODO` à choisir avec l’agence. L’URL Push est un secret : elle reste dans Coolify et ne doit jamais être journalisée.
