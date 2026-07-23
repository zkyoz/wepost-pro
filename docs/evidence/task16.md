# Preuves — Tâche 16

## Résumé

La tâche ajoute un assistant de rédaction borné, historisé et soumis à validation humaine. L’abstraction fournisseur, le prompt `text-v1`, le mock local/CI, l’exécution BullMQ, la sélection explicite et l’audit sont couverts sans appeler de fournisseur réel.

## Code structurant

- migration `1784781000000_create_ai_generations.ts` et modèle `AiGeneration` ;
- domaine `app/domain/ai`, fournisseur protégé, service, queue, validateurs et contrôleur API ;
- routes génération/historique/statut/application/annulation et permission `ai.generate` ;
- processeur worker `ai-text-generation`, dépôt PostgreSQL et backoff dédié ;
- composant `AiTextAssistant`, composable et types Nuxt ;
- tests Japa, Vitest et parcours Playwright avec fournisseur mock.

## Résultats locaux du 23/07/2026

| Contrôle                          | Résultat                                                         |
| --------------------------------- | ---------------------------------------------------------------- |
| API Japa complet                  | 155/155, dont 7 tests IA dédiés                                  |
| Worker Vitest complet             | 95/95, dont 5 tests IA dédiés                                    |
| Frontend Vitest complet           | 77/77, dont 4 tests IA dédiés                                    |
| Playwright Task 16                | 1/1 Chromium : générer, choisir, appliquer, axe et capture       |
| Migration locale                  | appliquée et régénération du schéma Lucid réussie                |
| Couverture API                    | lignes 83,36 %, branches 71,63 %, fonctions 79,53 %              |
| Couverture frontend               | lignes 83,73 %, branches 87,69 %, fonctions 74,49 %              |
| Couverture worker                 | lignes 92,23 %, branches 81,52 %, fonctions 86,29 %              |
| Typecheck, lint, format et builds | API, frontend et worker OK                                       |
| Capture desktop                   | `docs/evidence/task16/screenshots/ai-text-assistant-desktop.png` |

## Contrôle visuel

La capture Task 16 a été comparée à la référence acceptée Task 15 sur cinq points : même palette bleu nuit/corail, même hiérarchie typographique, mêmes surfaces claires bordées, mêmes rayons de cartes et mêmes dimensions de contrôles. La copie change volontairement des statistiques vers une aide rédactionnelle qui insiste sur la validation humaine. Le panneau est plus compact qu’un dashboard complet et la comparaison utilise trois cartes en ligne, puis deux et une en responsive, afin de rendre le choix des variantes immédiat.

La recette préproduction, les contrôles RGAA manuels, la CI, le SHA et la configuration d’un fournisseur réel restent manuels.
