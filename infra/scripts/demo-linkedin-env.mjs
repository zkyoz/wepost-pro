export function linkedinLiveEnvironment(base, credentials) {
  const keys = [
    "LINKEDIN_APP_ID",
    "LINKEDIN_APP_SECRET",
    "LINKEDIN_API_VERSION",
  ];
  if (Object.keys(credentials).some((key) => !keys.includes(key))) {
    throw new Error(
      "linkedin.env ne doit contenir que les trois paramètres LinkedIn documentés.",
    );
  }
  for (const key of keys) {
    if (
      !credentials[key] ||
      /^(TODO|mock|linkedin-demo)/i.test(credentials[key])
    ) {
      throw new Error(`Configuration réelle manquante : ${key}`);
    }
  }
  if (!/^20\d{2}(0[1-9]|1[0-2])$/.test(credentials.LINKEDIN_API_VERSION)) {
    throw new Error(
      "LINKEDIN_API_VERSION doit être une version prise en charge au format AAAAMM.",
    );
  }
  if (
    base.NODE_ENV !== "development" ||
    base.DB_HOST !== "127.0.0.1" ||
    base.REDIS_HOST !== "127.0.0.1"
  ) {
    throw new Error(
      "Ce démarrage est réservé à l’environnement local de démonstration.",
    );
  }
  return {
    ...base,
    ...credentials,
    LINKEDIN_API_DRIVER: "linkedin",
    LINKEDIN_OAUTH_REDIRECT_URI:
      "http://127.0.0.1:3333/api/v1/social/linkedin/oauth/callback",
    LINKEDIN_OAUTH_SUCCESS_URL: "http://127.0.0.1:3000/settings/linkedin",
  };
}
