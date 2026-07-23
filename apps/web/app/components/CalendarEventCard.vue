<script setup lang="ts">
import {
  PUBLICATION_STATUS_LABELS,
  type PublicationStatus,
} from "~/types/publication";
import type { CalendarEvent } from "~/types/calendar";
import { toLocalDateTimeInput } from "~/utils/calendar";

const props = defineProps<{
  event: CalendarEvent;
  displayTimezone: string;
  canManage: boolean;
}>();
const emit = defineEmits<{
  move: [
    input: {
      event: CalendarEvent;
      scheduledAt: string;
      timezone: string;
    },
  ];
}>();

const scheduledAt = ref(
  toLocalDateTimeInput(props.event.scheduledAt, props.displayTimezone),
);
const timezone = ref(props.event.timezone || props.displayTimezone);
const moveAllowed = computed(
  () =>
    props.canManage &&
    !(["publishing", "published", "archived"] as PublicationStatus[]).includes(
      props.event.status,
    ),
);
const accessibleName = computed(
  () =>
    `${props.event.title} — ${props.event.projectName} — ${PUBLICATION_STATUS_LABELS[props.event.status]} — ${props.event.scheduledAt ? new Date(props.event.scheduledAt).toLocaleString("fr-FR", { timeZone: props.displayTimezone }) : "sans date"}`,
);
</script>

<template>
  <article class="calendar-event">
    <span class="status-badge" :class="`status-badge--${event.status}`">
      {{ PUBLICATION_STATUS_LABELS[event.status] }}
    </span>
    <h3>
      <NuxtLink :to="`/publications/${event.id}`" :aria-label="accessibleName">
        {{ event.title }}
      </NuxtLink>
    </h3>
    <p>{{ event.projectName }} — {{ event.clientName }}</p>
    <p v-if="event.scheduledAt">
      <time :datetime="event.scheduledAt">
        {{
          new Date(event.scheduledAt).toLocaleString("fr-FR", {
            timeZone: displayTimezone,
            dateStyle: "short",
            timeStyle: "short",
          })
        }}
      </time>
    </p>
    <p v-else>Sans date souhaitée</p>

    <details v-if="moveAllowed" class="calendar-move">
      <summary>Déplacer {{ event.title }}</summary>
      <form @submit.prevent="emit('move', { event, scheduledAt, timezone })">
        <div class="form-field">
          <label :for="`calendar-date-${event.id}`">Date et heure</label>
          <input
            :id="`calendar-date-${event.id}`"
            v-model="scheduledAt"
            type="datetime-local"
            required
          />
        </div>
        <div class="form-field">
          <label :for="`calendar-timezone-${event.id}`">Fuseau horaire</label>
          <input
            :id="`calendar-timezone-${event.id}`"
            v-model="timezone"
            required
            maxlength="80"
          />
        </div>
        <button type="submit">Enregistrer le déplacement</button>
      </form>
    </details>
  </article>
</template>
