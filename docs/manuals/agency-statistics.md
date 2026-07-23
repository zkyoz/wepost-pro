# Manuel — Statistiques agence

La page **Statistiques** est accessible aux rôles agence et administrateur depuis la navigation privée.

1. Choisir une date de début et de fin. Les bornes sont interprétées en UTC et la période ne peut pas dépasser 366 jours.
2. Choisir éventuellement un projet et un réseau.
3. Activer **Appliquer**. Le résumé, les graphiques et leurs tableaux utilisent exactement les mêmes filtres.
4. Activer **Exporter en CSV** pour télécharger les données visibles sous une forme exploitable par un tableur.

Les publications sont comptées selon leur date de création et leur statut courant. Le taux de succès porte uniquement sur les programmations arrivées à l’état `published` ou `failed`. Le délai d’approbation est calculé depuis la dernière soumission documentée en revue client ; il vaut `N/A` si ce point de départ n’existe pas. Les médias supprimés sont exclus.

Les données d’audience externes affichent `N/A` tant qu’aucun connecteur d’insights et scope OAuth officiel n’est configuré. Elles ne sont jamais remplacées par une estimation.
