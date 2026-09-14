/** First-party preference, readable during SSR; no tracking or external scripts. */
export function useAppTheme() {
  const preference = useCookie<string>("wepost-theme", {
    default: () => "light",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  const theme = computed<"light" | "dark">({
    get: () => (preference.value === "dark" ? "dark" : "light"),
    set: (value) => {
      preference.value = value;
    },
  });
  function toggleTheme() {
    theme.value = theme.value === "dark" ? "light" : "dark";
  }
  return { theme, toggleTheme };
}
