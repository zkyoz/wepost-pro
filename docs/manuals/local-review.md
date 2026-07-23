# Prise en main et recette locale

Ce guide permet de voir l’application avant de connecter les services externes.
Les données créées par la commande de démonstration sont réservées à la base
PostgreSQL locale. La commande refuse une base distante ou un environnement de
production.

## Préparer la démonstration

Prérequis : Node.js 24, pnpm 11 et Docker Desktop démarré.

```bash
pnpm install --frozen-lockfile
pnpm demo:prepare
pnpm dev
```

Ouvrir ensuite :

- application : <http://localhost:3000> ;
- API liveness : <http://localhost:3333/health/live> ;
- API readiness : <http://localhost:3333/health/ready>.

La commande `pnpm demo:seed` est idempotente : elle complète les données de
démonstration manquantes sans supprimer les données locales existantes.

## Comptes locaux

Le mot de passe commun est `Demo-Wepost-2026!`.

| Rôle   | Identifiant           | Parcours principal                                           |
| ------ | --------------------- | ------------------------------------------------------------ |
| Admin  | `admin@wepost.local`  | administration, utilisateurs, état système, sauvegardes      |
| Agence | `agence@wepost.local` | projets, publications, calendrier, supervision, statistiques |
| Client | `client@wepost.local` | lecture du projet, commentaires, validation et annotations   |

Ces identifiants ne doivent jamais être créés en recette ou en production.

## Parcours de découverte recommandé

1. Visiter la landing page et les pages légales sans connexion.
2. Se connecter comme agence et ouvrir le projet « Maison Azur — Démonstration ».
3. Parcourir ses quatre publications, le calendrier, la supervision et les statistiques.
4. Ouvrir « Retour client à intégrer » pour voir le commentaire et la demande de correction.
5. Se déconnecter puis se connecter comme client ; vérifier que la modification est interdite.
6. Se connecter comme administrateur ; ouvrir les utilisateurs, l’état système et les sauvegardes.
7. Tester une largeur de 320 px, un zoom navigateur à 200 % et le parcours au clavier.

Les écrans de réseaux sociaux utilisent leurs adaptateurs `mock` tant que les
comptes développeur et secrets réels ne sont pas configurés. Le stockage média
local remplace R2 en développement. Le fournisseur IA local est également un
mock explicite.

## Arrêter l’environnement

Arrêter Nuxt et l’API avec `Ctrl+C`, puis :

```bash
pnpm infra:down
```

La commande Docker conserve le volume PostgreSQL local. Elle ne supprime pas les
données de démonstration.
