# Preuves — Tâche 19

## Résumé

La tâche ajoute un export iCalendar ponctuel par plage/projet et un flux d’abonnement privé. Les événements possèdent un UID stable, un numéro de séquence, des dates UTC et un statut d’annulation pour les publications archivées. Le flux est protégé par un token de 48 octets aléatoires dont seul le SHA-256 est stocké ; il peut être révoqué immédiatement.

## Code structurant

- migration `1784790000000_create_calendar_feed_tokens.ts` et modèle Lucid ;
- sérialiseur ICS sans dépendance, avec échappement TEXT, CRLF et repli UTF-8 à 75 octets ;
- service de portée projet, création/hash/révocation, dernière utilisation et compteur d’accès ;
- contrôleur, validateurs, permission `calendar.export`, rate limiting et routes publique/authentifiées ;
- panneau Nuxt de téléchargement, création, copie, révocation et instructions structurées ;
- tests Japa, Vitest et parcours Playwright desktop/mobile.

## Résultats locaux du 23/07/2026

| Contrôle                          | Résultat                                                                 |
| --------------------------------- | ------------------------------------------------------------------------ |
| API Japa complet                  | 172/172, dont 6 tests Task 19                                            |
| Frontend Vitest complet           | 87/87, dont 4 tests Task 19                                              |
| Worker Vitest complet             | 95/95                                                                    |
| Playwright Task 19                | desktop/mobile : téléchargement, contenu minimal, création et révocation |
| Migration locale                  | appliquée ; schéma Lucid régénéré                                        |
| Couverture API                    | lignes 83,95 %, branches 72,02 %, fonctions 80,99 %                      |
| Couverture frontend               | lignes 85,25 %, branches 84,72 %, fonctions 77,77 %                      |
| Couverture worker                 | lignes 92,23 %, branches 81,52 %, fonctions 86,29 %                      |
| Domaine/service ICS               | domaine 97,87 % ; service 98,27 % des lignes, fonctions 100 %            |
| Typecheck, lint, format et builds | OK sur les trois applications                                            |
| Capture desktop                   | `docs/evidence/task19/screenshots/calendar-export-desktop.png`           |

## Contrôle visuel

Référence acceptée : capture Task 15 du dashboard statistiques, qui utilise le même shell et le même langage de formulaires. Rendu : capture Task 19 produite par Playwright Chromium, le navigateur intégré n’étant pas disponible dans cet environnement.

Comparaison en cinq points : palette blanche/bleu nuit/corail conservée ; hiérarchie H2/H3 et labels cohérente ; grille à deux colonnes calée sur les panneaux existants ; contrôles avec les mêmes bordures, rayons et densité ; message d’état bleu et liste sobre sans dépendance à une icône. À moins de 48 rem, les deux formulaires et chaque ligne de flux passent en colonne. Le flux révoqué est capturé sans exposer sa valeur secrète.

La recette préproduction, VoiceOver, zoom 200 %, reflow exact à 320 px, import réel dans les trois fournisseurs, CI et SHA restent manuels.
