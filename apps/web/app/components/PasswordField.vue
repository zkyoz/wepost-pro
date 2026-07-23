<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: string;
    autocomplete: "current-password" | "new-password";
    error?: string;
    hint?: string;
  }>(),
  { error: undefined, hint: undefined },
);
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const visible = ref(false);
const { t } = useLocale();
const describedBy = computed(
  () =>
    [
      props.hint ? `${props.id}-hint` : "",
      props.error ? `${props.id}-error` : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined,
);
</script>

<template>
  <div class="form-field">
    <label :for="id"
      >{{ label }}
      <span class="required-marker" aria-hidden="true">*</span></label
    >
    <div class="form-field__control">
      <input
        :id="id"
        :value="modelValue"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        :aria-invalid="Boolean(error)"
        :aria-describedby="describedBy"
        aria-required="true"
        required
        @input="
          emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
      />
      <button
        class="password-toggle"
        type="button"
        :aria-label="visible ? t('password.hide') : t('password.show')"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
            stroke="currentColor"
            stroke-width="1.8"
          />
          <circle
            cx="12"
            cy="12"
            r="2.5"
            stroke="currentColor"
            stroke-width="1.8"
          />
        </svg>
      </button>
    </div>
    <p v-if="hint" :id="`${id}-hint`" class="form-field__hint">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="form-field__error">
      {{ error }}
    </p>
  </div>
</template>
