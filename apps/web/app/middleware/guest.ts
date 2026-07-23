export default defineNuxtRouteMiddleware(async () => {
  const { fetchCurrentUser, hasLoaded, isAuthenticated } = useAuth();
  if (!hasLoaded.value) {
    try {
      await fetchCurrentUser();
    } catch {
      return;
    }
  }
  if (isAuthenticated.value) return navigateTo("/dashboard");
});
