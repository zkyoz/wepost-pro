# Preuves — Tâche 06

## Résumé

Le calendrier éditorial expose les publications autorisées sur une plage bornée, avec vues mois, semaine et liste, filtres projet/client/réseau/statut, affichage par fuseau et déplacement optimiste audité.

## Code structurant

- migration `1784757000000_add_calendar_indexes.ts` ;
- domaine `calendar.ts` pour UTC, DST, plages et règles de déplacement ;
- contrôleur et validateurs Calendar ;
- routes `GET /calendar` et `POST /publications/:id/calendar/move` ;
- page Nuxt `/calendar`, carte événement, composable et utilitaires ;
- suites Japa, Vitest et parcours Playwright étendu.

## Résultats locaux du 22/07/2026

| Contrôle                                            | Résultat                    |
| --------------------------------------------------- | --------------------------- |
| API Japa                                            | 65/65                       |
| Frontend Vitest                                     | 38/38                       |
| Playwright                                          | 10/10, desktop et mobile    |
| Couverture API lignes / branches / fonctions        | 86,85 % / 78,22 % / 85,78 % |
| Domaine calendrier lignes / branches / fonctions    | 100 % / 91,66 % / 100 %     |
| Contrôleur calendrier lignes / branches / fonctions | 90,39 % / 70,58 % / 100 %   |
| Couverture frontend lignes / branches / fonctions   | 92,30 % / 85,71 % / 84,37 % |
| lint / format / typecheck / builds                  | OK                          |

## Observabilité et sécurité

- durée et volume de chaque liste journalisés via `calendar.listed` ;
- ancien/nouvel instant, acteur, publication et version conservés dans l’audit ;
- plage maximale de 366 jours et pagination limitée à 100 éléments ;
- portée serveur issue des projets accessibles ;
- titres rendus par interpolation Vue, sans HTML injecté.

## Preuves externes restantes

Ajouter SHA, runs CI, captures des trois vues, recette 320 px/200 %, essai VoiceOver et mesure sur la volumétrie cible 20 clients × 40 publications.
