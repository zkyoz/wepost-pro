import type { UserRole } from "~/types/auth";

declare module "#app" {
  interface PageMeta {
    requiredRoles?: UserRole[];
  }
}

export {};
