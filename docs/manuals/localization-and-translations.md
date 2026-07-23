# Manuel — Langues et traductions

## Langue de l’interface

Le sélecteur « Langue de l’interface » est disponible sur les pages publiques et dans l’en-tête de l’espace connecté. Les langues disponibles sont le français et l’anglais, toujours nommées avec du texte et jamais uniquement par un drapeau.

Pour un utilisateur connecté, le choix est enregistré dans `users.locale` puis restauré à chaque nouvelle session. Pour un visiteur, le choix reste limité à la navigation en cours. Les dates et nombres rendus par le socle i18n utilisent les conventions `fr-FR` ou `en-GB`. L’attribut `lang` du document suit le choix actif.

## Traduire une publication

Dans le détail d’une publication, l’agence ou l’administrateur :

1. choisit la langue source et la langue cible ;
2. génère une proposition ou saisit directement une traduction ;
3. relit et corrige le brouillon ;
4. active « Approuver la traduction ».

Le texte source n’est jamais remplacé. Une génération reste un brouillon jusqu’à son approbation explicite. Le client peut consulter les traductions de ses projets sans les modifier.

Chaque traduction conserve la langue source, la langue cible, la version et l’empreinte du texte source. Une modification de la publication rend les anciennes traductions obsolètes ; elles restent visibles dans l’historique mais ne peuvent plus être approuvées.

## Fournisseur et données

Le développement et la CI utilisent le fournisseur simulé. En production, aucune traduction n’est générée tant qu’un fournisseur réel n’est pas configuré et validé. Le texte est nettoyé des formats de secrets, e-mails et numéros de téléphone détectables avant l’appel au fournisseur. Les textes juridiques et contractuels nécessitent toujours une validation humaine compétente.
