<template>
  <footer class="public-footer">
    <div class="public-container public-footer__grid">
      <div>
        <AppBrand />
        <p>
          Le workflow partagé entre l’agence et ses clients pour préparer les
          publications sociales.
        </p>
      </div>
      <nav aria-label="Informations légales">
        <ul>
          <li><NuxtLink to="/mentions-legales">Mentions légales</NuxtLink></li>
          <li><NuxtLink to="/confidentialite">Confidentialité</NuxtLink></li>
          <li><NuxtLink to="/accessibilite">Accessibilité</NuxtLink></li>
        </ul>
      </nav>
    </div>
    <p class="public-footer__copyright">
      © {{ new Date().getFullYear() }} Wepost.pro
    </p>
  </footer>
</template>
