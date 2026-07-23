<script setup lang="ts">
import { NOTIFICATION_LABELS, type Notification } from "~/types/collaboration";

definePageMeta({ middleware: "auth" });
useHead({ title: "Notifications" });
const api = useCollaborationApi();
const onlyUnread = ref(false);
const page = ref(1);
const result = ref(await api.notifications());
const announcement = ref("");

async function load() {
  result.value = await api.notifications({
    page: page.value,
    unread: onlyUnread.value || undefined,
  });
}

async function toggleUnreadFilter() {
  page.value = 1;
  await load();
}

async function mark(item: Notification, read: boolean) {
  Object.assign(item, (await api.markNotification(item.id, read)).data);
  announcement.value = read
    ? "Notification marquée comme lue."
    : "Notification marquée comme non lue.";
  await load();
}

const emailLabel = {
  pending: "E-mail en attente",
  sent: "E-mail envoyé",
  failed: "Échec de l’e-mail — la notification reste disponible ici",
} as const;
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Activité</p>
          <h1>Notifications</h1>
          <p>{{ result.meta.unreadCount }} notification(s) non lue(s).</p>
        </div>
      </div>
      <p class="status-message" role="status" aria-live="polite">
        {{ announcement }}
      </p>
      <label class="check-control">
        <input
          v-model="onlyUnread"
          type="checkbox"
          @change="toggleUnreadFilter"
        />
        Afficher uniquement les notifications non lues
      </label>
      <p v-if="!result.data.length">Aucune notification.</p>
      <ol v-else class="notification-list">
        <li
          v-for="item in result.data"
          :key="item.id"
          :class="{ 'is-unread': !item.readAt }"
        >
          <article>
            <h2>{{ NOTIFICATION_LABELS[item.type] }}</h2>
            <p>
              <time :datetime="item.createdAt">{{
                new Date(item.createdAt).toLocaleString("fr-FR")
              }}</time>
              — {{ item.readAt ? "Lue" : "Non lue" }}
            </p>
            <p>{{ emailLabel[item.emailStatus] }}</p>
            <div class="page-actions">
              <NuxtLink :to="`/publications/${item.payload.publicationId}`"
                >Voir la publication</NuxtLink
              >
              <button type="button" @click="mark(item, !item.readAt)">
                Marquer comme {{ item.readAt ? "non lue" : "lue" }}
              </button>
            </div>
          </article>
        </li>
      </ol>
      <nav
        v-if="result.meta.lastPage > 1"
        class="pagination"
        aria-label="Pagination des notifications"
      >
        <button
          type="button"
          :disabled="page <= 1"
          @click="
            page--;
            load();
          "
        >
          Précédent
        </button>
        <span>Page {{ page }} sur {{ result.meta.lastPage }}</span>
        <button
          type="button"
          :disabled="page >= result.meta.lastPage"
          @click="
            page++;
            load();
          "
        >
          Suivant
        </button>
      </nav>
    </main>
  </PrivateShell>
</template>
