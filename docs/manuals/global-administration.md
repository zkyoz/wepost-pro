# Manuel — Administration globale

L’entrée « Administration » est réservée au rôle administrateur. Le tableau de bord affiche des compteurs calculés depuis PostgreSQL et donne accès aux utilisateurs, projets, publications, comptes sociaux, incidents et au journal d’audit.

## Utilisateurs

La recherche porte sur le nom et l’adresse e-mail. Les filtres limitent par rôle et statut. Changer un rôle ou désactiver/réactiver un compte demande une confirmation et crée un audit. Le propre compte de l’acteur et le dernier administrateur actif sont protégés.

## Ressources

Les listes utilisent une pagination serveur. « Consulter le détail » ouvre une fiche sans secret. Les projets et publications sont archivés logiquement et peuvent être restaurés dans leur état antérieur. Une publication en cours d’envoi ne peut pas être archivée.

## Incidents et audit

Les incidents proviennent des tentatives de publication en erreur. Les erreurs sont expurgées et les identifiants distants ne sont pas affichés. Le journal d’audit est en lecture seule ; les clés pouvant contenir mot de passe, cookie, session, secret ou token sont remplacées par `[REDACTED]`.

Toutes les mutations utilisent la session, le jeton CSRF et une limitation de débit. Une suppression physique ou une correction d’audit nécessite une procédure technique exceptionnelle hors interface.
