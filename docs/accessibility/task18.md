# Accessibilité — Tâche 18

La visionneuse utilise des éléments HTML et un overlay de boutons, jamais un canvas comme seule interface. Chaque marqueur actif possède un numéro et un nom accessible complet. La liste textuelle chronologique est la source de vérité : elle expose le texte, l’auteur, la date, la forme, les coordonnées et l’état actif/historique.

Le pointeur permet de placer un point ou tracer un rectangle. L’alternative clavier complète permet de choisir la forme puis de saisir X, Y, largeur et hauteur en pourcentage ; une action place également le point au centre. Activer un marqueur déplace le focus vers l’entrée correspondante. Les ajouts et erreurs utilisent respectivement `role="status"` et `role="alert"` sans déplacer inutilement le focus.

Les annotations historiques sont écrites explicitement et ne sont jamais distinguées par la seule couleur. Les marqueurs ont un contraste renforcé, l’image conserve son alternative, la vidéo ses contrôles natifs, et la grille passe en une colonne sous 48 rem. Le parcours Playwright desktop/mobile incluant axe ne relève aucune violation sérieuse ou critique sur l’espace d’annotation.

Contrôle visuel en cinq points : palette et contrastes cohérents avec Task 17 ; typographie inchangée ; hiérarchie titre/aide/formulaire/liste conservée ; grille deux colonnes puis reflow ; états et numéros lisibles sans couleur seule.

Restent à exécuter en préproduction : Tab/Shift+Tab exhaustif, création rectangle avec VoiceOver, zoom 200 %, largeur exacte de 320 px, contrastes sur les navigateurs cibles et navigation de la liste vers la zone avec un média réel.
