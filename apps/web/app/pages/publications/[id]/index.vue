<script setup lang="ts">
import {
  PUBLICATION_STATUS_LABELS,
  type Publication,
  type PublicationStatus,
} from "~/types/publication";

definePageMeta({ middleware: "auth" });
const api = usePublicationsApi();
const { user } = useAuth();
const publication = ref<Publication>(
  (await api.get(String(useRoute().params.id))).data,
);
const announcement = ref("");
const canManage = computed(
  () => user.value?.role === "admin" || user.value?.role === "agency",
);
const nextStatuses = computed<PublicationStatus[]>(
  () =>
    ({
      draft: ["in_progress"],
      in_progress: ["awaiting_client_review"],
      awaiting_client_review: ["changes_requested", "approved", "in_progress"],
      changes_requested: ["in_progress"],
      approved: ["scheduled", "in_progress"],
      scheduled: ["publishing", "in_progress"],
      publishing: ["published", "failed"],
      published: [],
      failed: ["scheduled", "in_progress"],
      archived: [],
    })[publication.value.status] as PublicationStatus[],
);
useHead(() => ({ title: publication.value.title }));

async function duplicate() {
  const copy = (await api.duplicate(publication.value.id)).data;
  await navigateTo(`/publications/${copy.id}`);
}
async function archive() {
  if (!window.confirm(`Archiver « ${publication.value.title} » ?`)) return;
  publication.value = (await api.archive(publication.value.id)).data;
  announcement.value = "La publication a été archivée.";
}
async function transition(status: PublicationStatus) {
  publication.value = (
    await api.transition(
      publication.value.id,
      publication.value.contentVersion,
      status,
    )
  ).data;
  announcement.value = `Nouveau statut : ${PUBLICATION_STATUS_LABELS[status]}.`;
}

function applyReview(result: {
  publication: {
    status: PublicationStatus;
    contentVersion: number;
    approvedVersion: number | null;
  };
}) {
  Object.assign(publication.value, result.publication);
}

function applyAiVariant(result: { publication: Publication }) {
  Object.assign(publication.value, result.publication);
  announcement.value =
    "Le texte généré choisi a été appliqué à la publication sans la publier.";
}

function applyFacebookSchedule() {
  publication.value.status = "scheduled";
}

function applyInstagramSchedule() {
  publication.value.status = "scheduled";
}

function applyLinkedInSchedule() {
  publication.value.status = "scheduled";
}

function applyPinterestSchedule() {
  publication.value.status = "scheduled";
}

function applyTikTokSchedule() {
  publication.value.status = "scheduled";
}
</script>

<template>
  <PrivateShell
    ><main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><NuxtLink to="/projects">Projets</NuxtLink></li>
          <li>
            <NuxtLink :to="`/projects/${publication.projectId}/publications`"
              >Publications</NuxtLink
            >
          </li>
          <li aria-current="page">{{ publication.title }}</li>
        </ol>
      </nav>
      <div class="page-heading">
        <div>
          <span
            class="status-badge"
            :class="`status-badge--${publication.status}`"
            >{{ PUBLICATION_STATUS_LABELS[publication.status] }}</span
          >
          <h1>{{ publication.title }}</h1>
        </div>
        <div v-if="canManage" class="page-actions">
          <NuxtLink
            v-if="
              !['publishing', 'published', 'archived'].includes(
                publication.status,
              )
            "
            class="button-link"
            :to="`/publications/${publication.id}/edit`"
            >Modifier</NuxtLink
          >
          <button type="button" @click="duplicate">Dupliquer</button>
          <button
            v-if="publication.status !== 'archived'"
            type="button"
            @click="archive"
          >
            Archiver
          </button>
        </div>
      </div>
      <p class="status-message" role="status" aria-live="polite">
        {{ announcement }}
      </p>
      <section class="publication-detail" aria-labelledby="publication-content">
        <h2 id="publication-content">Contenu</h2>
        <p class="publication-copy">{{ publication.baseText }}</p>
        <dl>
          <div>
            <dt>Réseaux</dt>
            <dd>{{ publication.targetNetworks.join(" · ") }}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>
              {{ publication.contentVersion
              }}<template v-if="publication.approvedVersion">
                — approuvée : {{ publication.approvedVersion }}</template
              >
            </dd>
          </div>
          <div>
            <dt>Date souhaitée</dt>
            <dd>
              {{
                publication.scheduledAt
                  ? new Date(publication.scheduledAt).toLocaleString("fr-FR")
                  : "Non définie"
              }}
              — {{ publication.timezone }}
            </dd>
          </div>
        </dl>
      </section>
      <PublicationTranslations
        v-if="user"
        :publication-id="publication.id"
        :source-text="publication.baseText"
        :content-version="publication.contentVersion"
        :role="user.role"
      />
      <AiTextAssistant
        v-if="
          canManage &&
          !['publishing', 'published', 'archived'].includes(publication.status)
        "
        :publication-id="publication.id"
        :content-version="publication.contentVersion"
        @applied="applyAiVariant"
      />
      <PublicationNetworkVariants
        v-if="user"
        :publication-id="publication.id"
        :source-text="publication.baseText"
        :content-version="publication.contentVersion"
        :target-networks="publication.targetNetworks"
        :role="user.role"
        :publication-status="publication.status"
      />
      <section
        v-if="canManage && nextStatuses.length"
        class="publication-detail"
        aria-labelledby="publication-transitions"
      >
        <h2 id="publication-transitions">Changer le statut</h2>
        <div class="page-actions">
          <button
            v-for="status in nextStatuses"
            :key="status"
            type="button"
            @click="transition(status)"
          >
            {{ PUBLICATION_STATUS_LABELS[status] }}
          </button>
        </div>
      </section>
      <PublicationMediaManager
        :publication-id="publication.id"
        :content-version="publication.contentVersion"
        :can-manage="canManage"
      />
      <PublicationDiscussion
        v-if="user"
        :publication-id="publication.id"
        :status="publication.status"
        :content-version="publication.contentVersion"
        :role="user.role"
        @reviewed="applyReview"
      />
      <FacebookPublishingPanel
        v-if="user && publication.targetNetworks.includes('facebook')"
        :publication-id="publication.id"
        :role="user.role"
        :status="publication.status"
        :scheduled-at="publication.scheduledAt"
        @scheduled="applyFacebookSchedule"
      />
      <InstagramPublishingPanel
        v-if="user && publication.targetNetworks.includes('instagram')"
        :publication-id="publication.id"
        :role="user.role"
        :status="publication.status"
        :scheduled-at="publication.scheduledAt"
        @scheduled="applyInstagramSchedule"
      />
      <LinkedInPublishingPanel
        v-if="user && publication.targetNetworks.includes('linkedin')"
        :publication-id="publication.id"
        :role="user.role"
        :status="publication.status"
        :scheduled-at="publication.scheduledAt"
        @scheduled="applyLinkedInSchedule"
      />
      <PinterestPublishingPanel
        v-if="user && publication.targetNetworks.includes('pinterest')"
        :publication-id="publication.id"
        :role="user.role"
        :status="publication.status"
        :scheduled-at="publication.scheduledAt"
        :publication-title="publication.title"
        :publication-text="publication.baseText"
        @scheduled="applyPinterestSchedule"
      />
      <TikTokPublishingPanel
        v-if="user && publication.targetNetworks.includes('tiktok')"
        :publication-id="publication.id"
        :role="user.role"
        :status="publication.status"
        :scheduled-at="publication.scheduledAt"
        :publication-title="publication.title"
        :publication-text="publication.baseText"
        @scheduled="applyTikTokSchedule"
      />
      <section class="publication-detail" aria-labelledby="publication-history">
        <h2 id="publication-history">Historique des versions</h2>
        <p v-if="!publication.versions?.length">Aucune version.</p>
        <details v-for="version in publication.versions" :key="version.version">
          <summary>
            Version {{ version.version }} —
            <time :datetime="version.createdAt">{{
              new Date(version.createdAt).toLocaleString("fr-FR")
            }}</time>
          </summary>
          <p>
            <strong>{{ version.snapshot.title }}</strong>
          </p>
          <p class="publication-copy">{{ version.snapshot.baseText }}</p>
        </details>
      </section>
    </main></PrivateShell
  >
</template>
