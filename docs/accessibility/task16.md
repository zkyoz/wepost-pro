# Accessibilité — Tâche 16

Le formulaire utilise des contrôles HTML natifs, des libellés visibles et des instructions avant saisie. La taille du brief est exposée en texte. Les états de génération et d’application sont annoncés dans une zone `role="status"` ; les erreurs utilisent `role="alert"`. Aucun streaming caractère par caractère n’est utilisé.

Chaque variante est un article textuel sélectionnable et copiable. Son origine « Contenu généré » et son numéro sont écrits, sans dépendre d’une couleur. Chaque bouton « Utiliser la proposition N » nomme précisément son action. L’historique utilise `details`, `summary` et une liste ordonnée navigables au clavier.

La grille passe de trois à deux puis une colonne, ce qui évite le défilement horizontal à 320 px. Les contrôles conservent le focus visible global et aucune animation n’est obligatoire. Playwright/axe ne relève aucune violation sérieuse ou critique dans le panneau sur Chromium.

Restent à exécuter en préproduction : parcours complet Tab/Shift+Tab, copie au clavier, zoom 200 %, reflow 320 px, contrastes des navigateurs cibles et lecture VoiceOver des annonces après une vraie latence fournisseur.
