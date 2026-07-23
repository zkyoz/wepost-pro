# Tâche 05 — Médias et Cloudflare R2

> Ordre : 5/23  
> Dépendances : Tâches 01 à 04 validées  
> Compétences RNCP principalement couvertes : C2.2.1, C2.2.2, C2.2.3, C2.3.1

## Instruction à Codex

Lire d’abord `context.md`. Examiner l’existant et adapter l’implémentation au monorepo réel. Ne pas casser les tâches validées précédemment. Implémenter uniquement le périmètre de cette tâche et les refactorings strictement nécessaires. Toute valeur non vérifiable doit être laissée en `TODO` plutôt qu’inventée.

## Objectif

Ajouter la gestion sécurisée des médias associés aux publications et configurer Cloudflare R2.

## Périmètre à implémenter

- Créer un média, l’associer, le réordonner, modifier son texte alternatif et le supprimer.
- Configurer des clés R2 distinctes par environnement.
- Utiliser des URLs signées pour l’upload et la consultation privée.
- Calculer et enregistrer taille, type MIME, dimensions et checksum.
- Préparer images et vidéos.

## Règles métier

- Le serveur décide de la clé R2.
- Le type réel du fichier doit être validé après upload.
- Le média reste privé par défaut.
- Une suppression logique précède la purge définitive.
- Ordre des médias stable.
- Texte alternatif obligatoire pour une image informative ; possibilité explicite de la marquer décorative.

## Données et migrations

- `media_assets`: id, agency_id, uploader_id, storage_key, original_name, mime_type, size_bytes, checksum, width, height, duration_ms, alt_text, is_decorative, scan_status, created_at, deleted_at.
- `publication_media`: publication_id, media_id, position, created_at.
- Index et unicité du positionnement.

## API et services

- Initialiser un upload signé.
- Finaliser et valider l’upload.
- Associer/dissocier un média.
- Mettre à jour texte alternatif et ordre.
- Obtenir une URL de lecture signée.
- Supprimer puis purger.

## Interface

- Zone d’upload accessible sans drag-and-drop obligatoire.
- Liste des médias avec progression.
- Réordonnancement avec boutons Monter/Descendre en plus du glisser-déposer.
- Formulaire de texte alternatif.
- Messages d’erreur par fichier.

## Autorisations

- Admin/agence : gestion.
- Client : consultation des médias de ses projets.
- R2 ne doit pas être directement public.

## RGAA 4.1.2

- Alternative au drag-and-drop.
- Progression annoncée.
- Prévisualisations avec alt correct.
- Contrôles d’ordre au clavier.
- Pas de contenu clignotant.
- Erreurs compréhensibles.

## Sécurité

- Limites configurables de taille et type.
- Vérification magic bytes.
- Nom de fichier non utilisé comme clé.
- Checksum contre corruption et doublons.
- URLs signées courtes.
- Pas de clés R2 dans le frontend.
- Préparer une étape antivirus/quarantaine ; documenter si non disponible.

## Tests obligatoires

- Unitaires : validateurs de fichiers et clés.
- Intégration : cycle upload/finalisation avec R2 simulé.
- Sécurité : MIME falsifié, taille excessive, accès d’un autre client.
- E2E : upload, alt, ordre et suppression.
- Test de nettoyage d’un upload abandonné.

## Observabilité

- Compteur stockage par agence/projet.
- Logs des erreurs R2.
- Préparer alertes de quota.

## Livrables documentaires et preuves

Mettre à jour ou créer :

- `docs/recette/task05.md` avec les scénarios, préconditions, étapes, résultats attendus et résultats observés ;
- `docs/evidence/task05.md` avec les fichiers modifiés, migrations, routes, composants, tests, couverture, SHA et captures à fournir ;
- `docs/security/task05.md` ;
- `docs/accessibility/task05.md` ;
- `CHANGELOG.md` avec une entrée Conventional Commits ;
- les manuels concernés dans `docs/manuals/`.

## Définition de terminé

- [x] Fonctionnalité utilisable sur le parcours nominal.
- [x] Autorisations testées côté serveur.
- [x] Migrations appliquées et documentées.
- [x] Tests unitaires écrits.
- [x] Tests d’intégration écrits.
- [x] Test E2E critique écrit.
- [x] Cas d’erreur et de sécurité couverts.
- [ ] Exigences RGAA manuelles vérifiées en préproduction.
- [x] Build, lint et typecheck verts.
- [ ] Recette exécutée en préproduction.
- [x] Documentation et preuves mises à jour.
- [x] Aucun secret ou token dans le dépôt et les logs.

## Compte rendu attendu de Codex

Terminer la réponse par :

1. résumé de l’implémentation ;
2. fichiers créés ou modifiés ;
3. migrations ;
4. commandes exécutées ;
5. résultats des tests et couverture ;
6. résultats RGAA ;
7. risques ou limites ;
8. actions manuelles restantes.
