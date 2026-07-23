# Accessibilité — Tâche 20

L’attribut `lang` du document suit la locale active. Le sélecteur porte un libellé visible « Langue de l’interface » ou « Interface language » ; les langues sont nommées textuellement, sans drapeau. Le changement est annoncé par une zone `role="status"`.

Dans l’éditeur, les blocs source et cible portent leur propre attribut `lang`. Les libellés, états Brouillon/Approuvée/Obsolète et boutons sont textuels. La traduction est un champ natif modifiable au clavier ; le texte source reste visible à côté et la disposition passe en colonne sous 48 rem.

Les tests automatisés couvrent la parité des libellés, le changement de langue, l’attribut de page, la persistance après rechargement, l’accès en lecture seule du client et un contrôle axe du contenu principal après le passage en anglais. Le contrôle axe ne relève aucune violation sérieuse ou critique sur ce parcours. Restent manuels : VoiceOver, Tab/Shift+Tab complet, zoom 200 %, reflow exact à 320 px et vérification linguistique des textes.
