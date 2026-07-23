<script setup lang="ts">
defineProps<{ title: string; accent: string; description: string }>();
const { t } = useLocale();
</script>

<template>
  <div class="auth-shell">
    <div class="auth-shell__locale"><LocaleSwitcher /></div>
    <aside class="auth-shell__story" :aria-label="t('authShell.label')">
      <AppBrand />
      <div class="auth-shell__story-copy">
        <h2>
          {{ title }} <em>{{ accent }}</em>
        </h2>
        <p>{{ description }}</p>
        <div class="auth-product-preview" aria-hidden="true">
          <div class="auth-product-preview__header">
            <span
              ><AppIcon name="calendar" :size="18" /> Calendrier éditorial</span
            >
            <span>19 – 25 mai 2026</span>
          </div>
          <div class="auth-product-preview__days">
            <span>Lun 19</span>
            <span>Mar 20</span>
            <span>Mer 21</span>
            <span>Jeu 22</span>
          </div>
          <div class="auth-product-preview__grid">
            <div
              class="auth-product-preview__event auth-product-preview__event--one"
            >
              <small>10:00 · LinkedIn</small>
              <strong>Lancement produit</strong>
              <span>En validation</span>
            </div>
            <div
              class="auth-product-preview__event auth-product-preview__event--two"
            >
              <small>11:00 · Instagram</small>
              <strong>Conseil du jour</strong>
              <span>Programmé</span>
            </div>
            <div
              class="auth-product-preview__event auth-product-preview__event--three"
            >
              <small>14:00 · Facebook</small>
              <strong>Retour client</strong>
              <span>Planifié</span>
            </div>
          </div>
        </div>
        <ol class="workflow">
          <li class="workflow__item">
            <span class="workflow__icon" aria-hidden="true">01</span
            >{{ t("authShell.plan") }}
          </li>
          <li class="workflow__item">
            <span class="workflow__icon" aria-hidden="true">02</span
            >{{ t("authShell.write") }}
          </li>
          <li class="workflow__item">
            <span class="workflow__icon" aria-hidden="true">03</span
            >{{ t("authShell.review") }}
          </li>
          <li class="workflow__item">
            <span class="workflow__icon" aria-hidden="true">04</span
            >{{ t("authShell.publish") }}
          </li>
        </ol>
      </div>
    </aside>
    <header class="auth-shell__mobile-header"><AppBrand /></header>
    <main id="main-content" class="auth-shell__panel" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
