# Sécurité — Tâche 16

Les routes de génération exigent une session Adonis et la permission centralisée `ai.generate`, accordée uniquement aux rôles agence et administrateur. La publication est résolue avec la portée issue de la session ; un identifiant inter-agence renvoie 404 et aucun `agency_id` du navigateur n’est accepté.

Le brief est validé entre 10 et 2 000 caractères, délimité comme contenu non fiable et accompagné d’une instruction système qui interdit de suivre ses consignes. Les e-mails, numéros de téléphone et motifs de secret détectés sont remplacés avant le fournisseur. Les logs ne contiennent ni brief, ni résultat, ni secret : uniquement identifiants internes, fournisseur, modèle, version de prompt, état et latence.

Le nombre de propositions est limité de 2 à 5 et leur longueur à 280, 800 ou 1 500 caractères. La réponse fournisseur doit être un JSON strict avec le nombre exact de textes. Un quota de 50 générations sur 24 heures par utilisateur, configurable, complète la limite de 10 requêtes par heure. Le fournisseur est protégé par un timeout de 15 secondes et un circuit breaker après trois échecs. Le worker réessaie les erreurs transitoires après 5, 30 et 120 secondes ; les sorties invalides sont définitives.

L’application d’une variante vérifie la version optimiste, écrit une nouvelle `publication_version` et un audit transactionnel. Elle ne change jamais le statut vers `scheduled` ou `published`. Aucun secret fournisseur n’est stocké en base ou envoyé au frontend.

Le dépôt fournit uniquement les drivers `mock` et `disabled`. En production, l’absence de configuration désactive la génération. Le choix d’un fournisseur réel, son traitement RGPD, son modèle, ses conditions contractuelles et son mécanisme de consentement restent des décisions manuelles avant activation.
