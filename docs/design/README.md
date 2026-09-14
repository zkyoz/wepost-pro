# Direction visuelle Wepost.pro

## Principes

La direction vise une interface SaaS 2026 éditoriale, claire et dense juste ce
qu’il faut : typographie forte, grands espaces, bordures fines, cartes
orientées action et très peu d’effets décoratifs.

La navigation anthracite encadre un espace de travail clair ou sombre. Les
actions principales utilisent l'orange ; le vert sauge accompagne les états et
les surfaces informatives. Les données affichées proviennent toujours de l'API.

## Palette

| Usage                                | Couleur   |
| ------------------------------------ | --------- |
| Action et accent principal           | `#F2590D` |
| Texte secondaire et surfaces sombres | `#2F343A` |
| Texte principal et CTA sombres       | `#000000` |
| Vert sauge et surfaces informatives  | `#BBD9D1` |

Le blanc et des gris neutres légers complètent cette palette pour préserver la
lisibilité. Les couleurs de marque ne remplacent jamais un libellé de statut.
Le bleu présent dans les anciens concepts n'est plus la couleur de charte.

## Interface actuelle

- Nuxt UI 4 : boutons, champs, badges, panneau de navigation mobile et icônes.
- Inter Variable, Lucide et logos Simple Icons servis par l'application.
- Thèmes clair et sombre mémorisés dans un cookie de préférence, appliqués dès
  le rendu serveur, sans modifier les réglages de connexion ou les autorisations.
- [Guide d'apparence et de navigation](../manuals/appearance-and-navigation.md).
- [Compte rendu de la refonte](redesign-review.md).

## Concepts archivés

- `wepost-landing-hero-concept.png` : hero et aperçu produit ;
- `wepost-landing-middle-concept.png` : sections produit et workflow ;
- `wepost-landing-final-concept.png` : landing complète ;
- `wepost-dashboard-concept.png` : navigation privée et dashboard ;
- `wepost-auth-concept.png` : connexion et inscription.

Les images servent uniquement de références de conception, pas de captures du
produit en fonctionnement. L’interface livrée
est rendue en composants Vue, HTML, CSS et SVG afin de rester responsive,
accessible et alimentée par les données réelles.
