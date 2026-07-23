# Manuel — Export et abonnement iCalendar

## Télécharger un instantané

Dans le calendrier éditorial, l’agence ou l’administrateur choisit une date de début, une date de fin et éventuellement un projet, puis active « Télécharger le fichier ICS ». Le fichier est un instantané : ses événements ne changeront plus après import.

L’export contient uniquement le titre interne, le nom du projet, le statut et la date. Il ne contient pas le texte de la publication, les commentaires, les coordonnées client ni les médias.

## Créer un abonnement

Choisir un projet ou « Tous les projets accessibles », puis créer le lien. Le copier immédiatement : sa valeur en clair n’est affichée qu’une fois et ne peut pas être récupérée depuis Wepost.pro. Toute personne qui possède ce lien peut lire le calendrier associé.

Le calendrier distant conserve un UID stable par publication. Une modification augmente sa séquence ; une publication archivée devient un événement annulé. Selon le fournisseur, la propagation d’une mise à jour peut être différée.

Pour couper l’accès, activer « Révoquer ». La révocation est immédiate côté Wepost.pro ; il peut être nécessaire de supprimer ensuite l’ancien abonnement dans l’application calendrier.

## Import et abonnement

- Google Calendar sur ordinateur : dans « Autres agendas », choisir l’ajout puis « À partir de l’URL ». [Aide officielle Google Calendar](https://support.google.com/calendar/answer/37100?hl=fr).
- Outlook sur le web : « Ajouter un calendrier », puis « S’abonner à partir du web » et coller l’URL. [Aide officielle Microsoft Outlook](https://support.microsoft.com/outlook/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web).
- Calendrier Apple sur Mac : « Fichier », « Nouvel abonnement à un calendrier », puis coller l’adresse. [Aide officielle Apple](https://support.apple.com/fr-fr/guide/calendar/icl1022/mac).

Pour un import ponctuel, sélectionner le fichier `.ics` téléchargé au lieu de l’URL. Un import ne reçoit pas les mises à jour. Le format généré suit [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html).

## Exploitation

La liste indique le projet, la création, la dernière utilisation et la révocation. Un lien qui retourne 404 est inexistant, révoqué, rattaché à un compte désactivé ou devenu inaccessible. Créer alors un nouveau lien ; ne jamais transmettre un token dans un ticket, une capture ou un journal.
