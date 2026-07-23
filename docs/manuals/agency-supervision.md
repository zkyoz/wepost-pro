# Supervision métier de l’agence

La page `/supervision` est accessible aux administrateurs et membres de l’agence. Les clients en sont exclus côté serveur et côté navigation.

Les cartes affichent les commentaires non lus du compte connecté et les publications de son agence dans les statuts : attente client, corrections demandées, programmée, publiée et échec. Sélectionner une carte affiche exactement la liste utilisée pour son compteur.

Les filtres client, projet, réseau, période et responsable sont conservés dans l’URL. Faute de champ d’affectation dédié avant une tâche ultérieure, le responsable correspond au membre ayant créé la publication. La période porte sur la date de notification pour les commentaires, sinon sur la date programmée ou, à défaut, la dernière modification.

« Marquer comme lu » renseigne la date de lecture de la notification sans supprimer le commentaire ni l’historique. Le bouton « Actualiser » recharge les données réelles.
