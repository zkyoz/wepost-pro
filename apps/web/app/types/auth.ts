export const USER_ROLES = ["admin", "agency", "client"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type AppLocale = "fr" | "en";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  agency: "Agence",
  client: "Client",
};

export type PublicUser = {
  id: string;
  agencyId: string | null;
  email: string;
  displayName: string;
  role: UserRole;
  locale: AppLocale;
  isActive: boolean;
  initials: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiEnvelope<T> = { data: T };
export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & {
  displayName: string;
  passwordConfirmation: string;
};
export type ApiValidationError = {
  message: string;
  field?: string;
  rule?: string;
};
