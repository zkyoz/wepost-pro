<template>
  <header class="public-header">
    <div class="public-container public-header__inner">
      <AppBrand />
      <nav aria-label="Navigation principale">
        <ul class="public-nav">
          <li><NuxtLink to="/#fonctionnalites">Fonctionnalités</NuxtLink></li>
          <li><NuxtLink to="/#workflow">Workflow</NuxtLink></li>
          <li><NuxtLink to="/#securite">Sécurité</NuxtLink></li>
          <li><NuxtLink to="/#faq">FAQ</NuxtLink></li>
        </ul>
      </nav>
      <NuxtLink class="public-button public-button--compact" to="/auth/login">
        Se connecter
      </NuxtLink>
    </div>
  </header>
</template>
