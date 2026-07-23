# Accessibilité — Tâche 19

Chaque contrôle possède un libellé visible et explicite. Les actions disent « Télécharger le fichier ICS », « Créer un lien d’abonnement », « Copier » ou « Révoquer » sans dépendre d’une icône. Le résultat de téléchargement, copie, création et révocation est annoncé par une zone `role="status"`; les erreurs utilisent `role="alert"`.

Le lien secret est présenté dans un champ en lecture seule, sélectionné au focus pour fournir une alternative à l’API Clipboard. Les instructions utilisent un `details`, un `summary` et une liste ordonnée native. L’état Actif/Révoqué est écrit en toutes lettres.

La grille passe de deux colonnes à une colonne sous 48 rem. Les lignes de flux deviennent verticales, les textes restent refluables et les boutons conservent un focus visible. Le parcours Playwright Chromium desktop/mobile avec axe ne relève aucune violation sérieuse ou critique dans le panneau.

Le contrôle visuel porte sur cinq points : palette, titres, labels, densité des panneaux et retour d’état, comparés à la capture Task 15. Restent à vérifier manuellement : VoiceOver, Tab/Shift+Tab complet, copie refusée par le navigateur, zoom 200 %, largeur exacte de 320 px et import dans les applications calendaires ciblées.
