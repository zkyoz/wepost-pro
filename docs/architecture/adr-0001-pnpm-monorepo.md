# ADR-0001 — pnpm pour le monorepo

- Statut : accepté
- Date : 22 juillet 2026

## Contexte

Le dépôt ne possédait aucun lockfile au moment de son initialisation. Il doit héberger plusieurs applications TypeScript avec des dépendances partagées et une installation reproductible en CI.

## Décision

Utiliser pnpm 11.11.0, déclaré dans `packageManager`, avec un workspace couvrant `apps/*`. Le lockfile `pnpm-lock.yaml` est la source de vérité des résolutions. Les scripts de compilation natifs sont explicitement autorisés dans `pnpm-workspace.yaml`.

## Conséquences

- les installations CI utilisent `pnpm install --frozen-lockfile` ;
- les commandes racine orchestrent les applications avec les filtres pnpm ;
- tout changement de dépendance doit mettre à jour le lockfile ;
- aucun second lockfile npm, Yarn ou Bun ne doit être ajouté.
