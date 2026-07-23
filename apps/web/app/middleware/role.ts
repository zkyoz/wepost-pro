import type { UserRole } from "~/types/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchCurrentUser, hasLoaded } = useAuth();
  if (!hasLoaded.value) await fetchCurrentUser();

  const requiredRoles = (to.meta.requiredRoles ?? []) as UserRole[];
  if (
    requiredRoles.length === 0 ||
    !user.value ||
    !requiredRoles.includes(user.value.role)
  ) {
    return navigateTo("/access-denied");
  }
});
