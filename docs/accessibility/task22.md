# Accessibilité — Tâche 22

La page administrateur est en lecture seule. L'historique utilise un tableau
avec légende, en-têtes de colonnes et en-tête de ligne pour le type de run. Les
statuts `Réussie`, `Échouée` et `En cours` sont textuels et ne dépendent pas
d'une couleur.

Le résumé utilise une liste de descriptions. Le bouton d'actualisation est un
bouton natif, son état désactivé est exposé et une erreur est annoncée avec
`role="alert"` et `aria-live="assertive"`. Le tableau reste accessible au
clavier dans sa zone de défilement.

Le parcours Playwright vérifie le titre, le tableau et axe sur le contenu
principal. La navigation complète au clavier, VoiceOver, le zoom à 200 % et le
reflow à 320 px restent à consigner manuellement en préproduction.
