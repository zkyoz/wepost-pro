# Manuel — Génération assistée de textes

## Utilisation

Depuis une publication modifiable, un administrateur ou membre agence renseigne le brief, le ton, la longueur, la langue et le nombre de propositions. Le bouton de génération crée un traitement historisé. Aucun résultat n’est appliqué tant que l’utilisateur ne sélectionne pas « Utiliser la proposition N ».

L’application remplace le texte de travail, incrémente sa version et invalide une éventuelle approbation suivant les mêmes règles qu’une édition manuelle. Le texte doit ensuite suivre le circuit normal de validation client et de programmation.

## Configuration

```dotenv
AI_PROVIDER_DRIVER=mock
AI_DAILY_QUOTA=50
```

`mock` est réservé au développement, aux tests et aux démonstrations. `disabled` désactive le service. En production sans valeur explicite, l’API reste désactivée. Aucun driver réel n’est inclus dans la tâche 16 : ajouter un adaptateur conforme à `AiTextProvider` après validation du fournisseur, du modèle, des conditions RGPD et des secrets Coolify.

Avec `EMAIL_QUEUE_DRIVER=redis`, l’API dépose le job `ai-text-generation` dans la queue globale et le worker doit recevoir le même `AI_PROVIDER_DRIVER`. Avec le driver mémoire de test/local, le mock est exécuté immédiatement.

## Exploitation

Les états sont `queued`, `processing`, `completed`, `failed` et `cancelled`. Une annulation n’est possible qu’en attente. Les logs `ai.generation_created`, `ai.variant_applied` et les métriques worker ne contiennent pas le brief. En cas d’échec, vérifier le code expurgé, la latence, le driver, la disponibilité du worker et le quota sans copier de contenu client dans les tickets.
