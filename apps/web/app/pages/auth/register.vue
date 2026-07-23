<script setup lang="ts">
import { getApiErrors } from "~/utils/api-errors";

definePageMeta({ middleware: "guest" });
const { t } = useLocale();
useHead(() => ({ title: t("register.title") }));

const { register, isLoading } = useAuth();
const displayName = ref("");
const email = ref("");
const password = ref("");
const passwordConfirmation = ref("");
const fieldErrors = reactive<Record<string, string>>({});
const generalErrors = ref<string[]>([]);
const errorSummary = ref<HTMLElement | null>(null);

function validate() {
  Object.keys(fieldErrors).forEach((key) =>
    Reflect.deleteProperty(fieldErrors, key),
  );
  if (displayName.value.trim().length < 2)
    fieldErrors.displayName = t("register.nameInvalid");
  if (!/^\S+@\S+\.\S+$/.test(email.value))
    fieldErrors.email = t("register.emailInvalid");
  if (password.value.length < 12)
    fieldErrors.password = t("register.passwordInvalid");
  if (passwordConfirmation.value !== password.value)
    fieldErrors.passwordConfirmation = t("register.confirmationInvalid");
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
    await register({
      displayName: displayName.value.trim(),
      email: email.value.trim().toLowerCase(),
      password: password.value,
      passwordConfirmation: passwordConfirmation.value,
    });
    await navigateTo("/dashboard");
  } catch (error) {
    const apiErrors = getApiErrors(error);
    generalErrors.value = apiErrors.length
      ? apiErrors.map((item) => item.message)
      : [t("register.failed")];
    apiErrors.forEach((item) => {
      if (item.field) fieldErrors[item.field] = item.message;
    });
    await focusErrors();
  }
}
</script>

<template>
  <AuthShell
    :title="t('register.storyTitle')"
    :accent="t('register.storyAccent')"
    :description="t('register.storyDescription')"
  >
    <section class="auth-form" aria-labelledby="register-title">
      <p class="auth-form__eyebrow">{{ t("register.eyebrow") }}</p>
      <h1 id="register-title">{{ t("register.heading") }}</h1>
      <p class="auth-form__intro">
        {{ t("register.intro") }}
      </p>
      <div
        v-if="generalErrors.length"
        ref="errorSummary"
        class="error-summary"
        role="alert"
        tabindex="-1"
      >
        <p>{{ t("register.summary") }}</p>
        <ul>
          <li v-for="message in generalErrors" :key="message">{{ message }}</li>
        </ul>
      </div>
      <form class="form-stack" novalidate @submit.prevent="submit">
        <div class="form-field">
          <label for="display-name"
            >{{ t("register.displayName") }}
            <span class="required-marker" aria-hidden="true">*</span></label
          >
          <div class="form-field__control">
            <input
              id="display-name"
              v-model="displayName"
              type="text"
              autocomplete="name"
              required
              aria-required="true"
              :aria-invalid="Boolean(fieldErrors.displayName)"
              :aria-describedby="
                fieldErrors.displayName ? 'display-name-error' : undefined
              "
            />
          </div>
          <p
            v-if="fieldErrors.displayName"
            id="display-name-error"
            class="form-field__error"
          >
            {{ fieldErrors.displayName }}
          </p>
        </div>
        <div class="form-field">
          <label for="register-email"
            >{{ t("register.email") }}
            <span class="required-marker" aria-hidden="true">*</span></label
          >
          <div class="form-field__control">
            <input
              id="register-email"
              v-model="email"
              type="email"
              autocomplete="email"
              inputmode="email"
              required
              aria-required="true"
              :aria-invalid="Boolean(fieldErrors.email)"
              :aria-describedby="
                fieldErrors.email ? 'register-email-error' : undefined
              "
            />
          </div>
          <p
            v-if="fieldErrors.email"
            id="register-email-error"
            class="form-field__error"
          >
            {{ fieldErrors.email }}
          </p>
        </div>
        <PasswordField
          id="register-password"
          v-model="password"
          :label="t('register.password')"
          autocomplete="new-password"
          :hint="t('register.passwordHint')"
          :error="fieldErrors.password"
        />
        <PasswordField
          id="password-confirmation"
          v-model="passwordConfirmation"
          :label="t('register.passwordConfirmation')"
          autocomplete="new-password"
          :error="fieldErrors.passwordConfirmation"
        />
        <button class="button-primary" type="submit" :disabled="isLoading">
          {{ isLoading ? t("register.submitting") : t("register.submit") }}
        </button>
      </form>
      <p class="auth-form__switch">
        {{ t("register.hasAccount") }}
        <NuxtLink to="/auth/login">{{ t("register.login") }}</NuxtLink>
      </p>
    </section>
  </AuthShell>
</template>
