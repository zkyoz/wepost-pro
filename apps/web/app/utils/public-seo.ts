export const landingSeoMeta = {
  title: "Publications sociales, de la préparation à la diffusion",
  description:
    "Wepost.pro centralise le calendrier éditorial, les retours clients, les validations et la programmation des publications sociales.",
  ogTitle: "Wepost.pro — Le workflow éditorial partagé",
  ogDescription:
    "Préparez, faites valider et programmez les publications sociales dans un espace commun à l’agence et à ses clients.",
  ogType: "website" as const,
  twitterCard: "summary" as const,
};

export function buildCanonicalUrl(siteUrl: string) {
  return new URL("/", siteUrl).toString();
}
