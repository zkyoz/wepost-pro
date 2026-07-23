# Sécurité — Tâche 20

La route de locale exige une session mais reste accessible aux trois rôles. Les routes de lecture des traductions réutilisent la portée projet ; les routes de génération, modification et approbation exigent `translations.manage`, accordée uniquement à l’administrateur et à l’agence. Une ressource hors agence est masquée en 404.

Le texte source reste la source de vérité et n’est jamais écrasé par une traduction. Version et empreinte SHA-256 sont vérifiées avant approbation. Les contenus sont stockés comme texte brut et limités à 10 000 caractères.

Avant un appel IA, les caractères de contrôle et motifs de secrets, tokens, e-mails et téléphones détectables sont expurgés. Le prompt traite le texte comme une donnée non fiable et interdit de suivre ses instructions. La CI utilise exclusivement le fournisseur mock ; un fournisseur indisponible provoque 503.

Les quotas existants limitent les générations sur 24 heures. Les journaux contiennent les identifiants, langues, versions, fournisseur et code d’erreur, jamais le texte source ou traduit. Génération, édition, approbation et changement de locale produisent un audit.
