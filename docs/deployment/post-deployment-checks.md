# Contrôles post-déploiement

Après les migrations et avant la promotion complète :

```bash
pnpm smoke:health -- https://api.<environnement>.wepost.pro
```

Vérifier ensuite :

1. liveness HTTP 200 ;
2. readiness HTTP 200 avec PostgreSQL, Redis et file disponibles ;
3. SHA attendu dans `/admin/system` via `GIT_SHA` ;
4. heartbeat worker reçu depuis moins de cinq minutes ;
5. absence de job failed inattendu ;
6. chargement du frontend et connexion d’un compte de recette ;
7. moniteurs Uptime Kuma au vert.

Si la readiness échoue après déploiement, ne pas promouvoir. Consulter le composant en échec, les logs corrélés et le runbook, puis revenir au déploiement Coolify précédent si la dépendance ne peut pas être restaurée rapidement.
