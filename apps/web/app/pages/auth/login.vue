<script setup lang="ts">
import { getApiErrors, getStatusCode } from "~/utils/api-errors";

definePageMeta({ middleware: "guest" });
const { t } = useLocale();
useHead(() => ({ title: t("login.title") }));

const route = useRoute();
const { login, isLoading } = useAuth();
const email = ref("");
const password = ref("");
const fieldErrors = reactive<Record<string, string>>({});
const generalErrors = ref<string[]>([]);
const errorSummary = ref<HTMLElement | null>(null);
const statusMessage = computed(() => {
  if (route.query.reason === "session-expired") return t("login.expired");
  if (route.query.reason === "api-unavailable") return t("login.unavailable");
  return "";
});

function validate() {
  Object.keys(fieldErrors).forEach((key) =>
    Reflect.deleteProperty(fieldErrors, key),
  );
  generalErrors.value = [];
  if (!email.value.trim()) fieldErrors.email = t("login.emailRequired");
  else if (!/^\S+@\S+\.\S+$/.test(email.value))
    fieldErrors.email = t("login.emailInvalid");
  if (!password.value) fieldErrors.password = t("login.passwordRequired");
  generalErrors.value = Object.values(fieldErrors);
  return generalErrors.value.length === 0;
}

async function focusErrors() {
  await nextTick();
  errorSummary.value?.focus();
}

async function submit() {
  if (!validate()) return focusErrors();
  try {
    await login({
      email: email.value.trim().toLowerCase(),
      password: password.value,
    });
    const redirect =
      typeof route.query.redirect === "string" &&
      route.query.redirect.startsWith("/")
        ? route.query.redirect
        : "/dashboard";
    await navigateTo(redirect);
  } catch (error) {
    const status = getStatusCode(error);
    const apiErrors = getApiErrors(error);
    if (status === 401) generalErrors.value = [t("login.invalidCredentials")];
    else if (apiErrors.length) {
      generalErrors.value = apiErrors.map((item) => item.message);
      apiErrors.forEach((item) => {
        if (item.field) fieldErrors[item.field] = item.message;
      });
    } else generalErrors.value = [t("login.networkError")];
    await focusErrors();
  }
}
</script>

<template>
  <AuthShell
    :title="t('login.storyTitle')"
    :accent="t('login.storyAccent')"
    :description="t('login.storyDescription')"
  >
    <section class="auth-form" aria-labelledby="login-title">
      <p class="auth-form__eyebrow">{{ t("login.eyebrow") }}</p>
      <h1 id="login-title">{{ t("login.heading") }}</h1>
      <p class="auth-form__intro">
        {{ t("login.intro") }}
      </p>
      <p
        v-if="statusMessage"
        class="status-message"
        role="status"
        aria-live="polite"
      >
        {{ statusMessage }}
      </p>
      <div
        v-if="generalErrors.length"
        ref="errorSummary"
        class="error-summary"
        role="alert"
        tabindex="-1"
      >
        <p>{{ t("login.summary") }}</p>
        <ul>
          <li v-for="message in generalErrors" :key="message">{{ message }}</li>
        </ul>
      </div>
      <form class="form-stack" novalidate @submit.prevent="submit">
        <div class="form-field">
          <label for="email"
            >{{ t("login.email") }}
            <span class="required-marker" aria-hidden="true">*</span></label
          >
          <div class="form-field__control">
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              inputmode="email"
              required
              aria-required="true"
              :aria-invalid="Boolean(fieldErrors.email)"
              :aria-describedby="fieldErrors.email ? 'email-error' : undefined"
            />
          </div>
          <p
            v-if="fieldErrors.email"
            id="email-error"
            class="form-field__error"
          >
            {{ fieldErrors.email }}
          </p>
        </div>
        <PasswordField
          id="password"
          v-model="password"
          :label="t('login.password')"
          autocomplete="current-password"
          :error="fieldErrors.password"
        />
        <button class="button-primary" type="submit" :disabled="isLoading">
          {{ isLoading ? t("login.submitting") : t("login.submit") }}
        </button>
      </form>
      <p class="auth-form__switch">
        {{ t("login.noAccount") }}
        <NuxtLink to="/auth/register">{{ t("login.createAccount") }}</NuxtLink>
      </p>
      <p class="security-note">
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 2 20 5v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5l8-3Z"
            stroke="currentColor"
            stroke-width="1.8"
          />
          <path
            d="m8.5 12 2.2 2.2 4.8-5"
            stroke="currentColor"
            stroke-width="1.8"
          />
        </svg>
        {{ t("login.secure") }}
      </p>
    </section>
  </AuthShell>
</template>
