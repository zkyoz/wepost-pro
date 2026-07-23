# Accessibilité — Tâche 01

- Référentiel cible : RGAA 4.1.2
- Date : 22 juillet 2026
- Conclusion : contrôles automatisés conformes sur le périmètre testé ; audit manuel restant

## Implémentation

Les pages utilisent des titres explicites, un lien d’évitement, des régions nommées, des labels natifs, les attributs `autocomplete`, des instructions de mot de passe, un résumé d’erreurs `role=alert`, `aria-describedby`, un focus visible et des boutons natifs. Les formulaires acceptent le collage. La mise en page passe d’un écran partagé à une colonne sans interaction spécifique au pointeur.

## Résultats automatisés

- axe Playwright sur `#main-content` : aucune violation critique ou sérieuse ;
- profil Desktop Chrome : OK ;
- profil Pixel 7 : OK ;
- parcours inscription, session, déconnexion et erreur clavier : 6 tests E2E sur 6 réussis ;
- contraste du bouton principal ajusté avec un corail `#c93630` sur fond blanc.

Ces résultats ne constituent pas une déclaration de conformité RGAA complète.

## Fidélité visuelle vérifiée

| Point       | Décision appliquée                                                            |
| ----------- | ----------------------------------------------------------------------------- |
| Géométrie   | panneau éditorial + formulaire sur desktop, formulaire prioritaire sur mobile |
| Typographie | hiérarchie nette, titres courts, corps lisible et largeur de ligne limitée    |
| Couleur     | bleu encre, blanc et corail contrasté, état non transmis par la couleur seule |
| Hiérarchie  | marque, promesse, titre de formulaire, champs puis action principale          |
| Responsive  | suppression du panneau secondaire sous le breakpoint et reflow mono-colonne   |
| Interaction | focus visible, affichage du mot de passe via bouton nommé, erreurs annoncées  |

## Vérifications manuelles à exécuter en recette

- [ ] Tab puis Shift+Tab sur tout le parcours ;
- [ ] soumission vide, lecture et correction des erreurs ;
- [ ] inscription, connexion et déconnexion uniquement au clavier ;
- [ ] zoom navigateur à 200 % ;
- [ ] reflow à 320 px de large ;
- [ ] VoiceOver sur macOS ou NVDA sur Windows ;
- [ ] contrôle manuel des contrastes de tous les états focus, erreur et désactivé.
