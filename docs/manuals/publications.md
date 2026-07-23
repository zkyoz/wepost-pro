# Manuel — Publications textuelles

## Accès

Ouvrir un projet puis **Voir les publications**. L’admin et l’agence peuvent créer et gérer ; le client affecté consulte uniquement.

## Créer et modifier

Renseigner un titre interne, le texte, au moins un réseau, le fuseau IANA et éventuellement la date souhaitée. Le navigateur signale les modifications non enregistrées. Chaque sauvegarde réelle incrémente la version et ajoute un instantané à l’historique.

Si une autre session a déjà sauvegardé, l’API renvoie un conflit avec la version courante : recharger avant de reprendre les modifications. Modifier une version approuvée annule automatiquement cette approbation.

## Statuts

Le détail propose uniquement les transitions suivantes autorisées par la machine à états. Une transition refusée ne modifie aucune donnée. Seule la version approuvée peut ensuite atteindre `scheduled` ; la publication automatique sera implémentée dans les tâches réseau ultérieures.

## Variantes par réseau

Le panneau **Variantes par réseau** permet de conserver un texte distinct pour chaque cible. Une variante doit être relue et approuvée pour la version courante ; sinon le texte principal reste utilisé. Toute modification du texte principal rend automatiquement les anciennes variantes obsolètes. Voir `docs/manuals/network-variants.md` pour la génération, le diff et la configuration des limites.

## Dupliquer et archiver

**Dupliquer** produit un nouveau brouillon version 1 sans approbation. **Archiver** conserve le contenu, les versions et l’audit ; il ne supprime rien physiquement.
