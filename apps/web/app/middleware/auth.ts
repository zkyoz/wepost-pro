export default defineNuxtRouteMiddleware(async (to) => {
  const { fetchCurrentUser, hasLoaded, isAuthenticated } = useAuth();
  try {
    if (!hasLoaded.value) await fetchCurrentUser();
  } catch {
    return navigateTo({
      path: "/auth/login",
      query: { reason: "api-unavailable" },
    });
  }
  if (!isAuthenticated.value) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath, reason: "session-expired" },
    });
  }
});
