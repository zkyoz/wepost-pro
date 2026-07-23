<script setup lang="ts">
import type { UserRole } from "~/types/auth";
import {
  REVIEW_LABELS,
  type Comment,
  type ReviewDecision,
  type ReviewResult,
} from "~/types/collaboration";
import type { PublicationStatus } from "~/types/publication";

const props = defineProps<{
  publicationId: string;
  status: PublicationStatus;
  contentVersion: number;
  role: UserRole;
}>();
const emit = defineEmits<{ reviewed: [result: ReviewResult] }>();
const api = useCollaborationApi();
const discussion = ref((await api.discussion(props.publicationId)).data);
const body = ref("");
const reviewMessage = ref("");
const editingId = ref<string | null>(null);
const editingBody = ref("");
const announcement = ref("");
const errorMessage = ref("");
const submitting = ref(false);
const isReady = ref(false);

onMounted(() => {
  isReady.value = true;
});

const canReview = computed(
  () => props.role === "client" && props.status === "awaiting_client_review",
);

function announceError(error: unknown) {
  errorMessage.value =
    error instanceof Error
      ? error.message
      : "L’action n’a pas pu être réalisée.";
}

async function addComment() {
  if (!body.value.trim() || submitting.value) return;
  submitting.value = true;
  errorMessage.value = "";
  try {
    const created = (await api.createComment(props.publicationId, body.value))
      .data;
    discussion.value.comments.push(created);
    body.value = "";
    announcement.value = "Le nouveau commentaire a été ajouté.";
  } catch (error) {
    announceError(error);
  } finally {
    submitting.value = false;
  }
}

function startEditing(comment: Comment) {
  editingId.value = comment.id;
  editingBody.value = comment.body ?? "";
}

async function saveComment(comment: Comment) {
  errorMessage.value = "";
  try {
    const updated = (await api.updateComment(comment.id, editingBody.value))
      .data;
    Object.assign(comment, updated);
    editingId.value = null;
    announcement.value = "Le commentaire a été modifié.";
  } catch (error) {
    announceError(error);
  }
}

async function deleteComment(comment: Comment) {
  if (!window.confirm("Supprimer ce commentaire ? Cette action sera tracée."))
    return;
  errorMessage.value = "";
  try {
    await api.deleteComment(comment.id);
    comment.body = null;
    comment.deletedAt = new Date().toISOString();
    comment.canEdit = false;
    comment.canDelete = false;
    announcement.value = "Le commentaire a été supprimé.";
  } catch (error) {
    announceError(error);
  }
}

async function review(decision: ReviewDecision) {
  if (decision === "changes_requested" && !reviewMessage.value.trim()) {
    errorMessage.value =
      "Expliquez les corrections demandées avant de confirmer.";
    return;
  }
  if (
    !window.confirm(
      decision === "approved"
        ? `Confirmer l’approbation de la version ${props.contentVersion} ?`
        : `Confirmer la demande de corrections sur la version ${props.contentVersion} ?`,
    )
  )
    return;
  errorMessage.value = "";
  try {
    const result = (
      await api.review(
        props.publicationId,
        props.contentVersion,
        decision,
        reviewMessage.value.trim() || null,
      )
    ).data;
    discussion.value.reviews.unshift(result.review);
    reviewMessage.value = "";
    announcement.value = `Décision enregistrée : ${REVIEW_LABELS[decision]}.`;
    emit("reviewed", result);
  } catch (error) {
    announceError(error);
  }
}
</script>

<template>
  <section
    class="publication-detail discussion"
    aria-labelledby="discussion-title"
  >
    <h2 id="discussion-title">Commentaires et validation</h2>
    <p class="status-message" role="status" aria-live="polite">
      {{ announcement }}
    </p>
    <p v-if="errorMessage" class="error-summary" role="alert">
      {{ errorMessage }}
    </p>

    <form class="comment-form" @submit.prevent="addComment">
      <label for="new-comment">Ajouter un commentaire</label>
      <textarea
        id="new-comment"
        v-model="body"
        rows="4"
        maxlength="5000"
        required
        aria-describedby="comment-help"
      />
      <p id="comment-help" class="field-hint">
        Texte brut, 5 000 caractères maximum. L’envoi de l’e-mail est
        asynchrone.
      </p>
      <button type="submit" :disabled="submitting || !isReady">
        {{ submitting ? "Envoi…" : "Publier le commentaire" }}
      </button>
    </form>

    <h3>Fil chronologique</h3>
    <p v-if="!discussion.comments.length">Aucun commentaire.</p>
    <ol v-else class="comment-thread">
      <li
        v-for="comment in discussion.comments"
        :id="`comment-${comment.id}`"
        :key="comment.id"
      >
        <article>
          <header>
            <strong>{{ comment.author.displayName }}</strong>
            <time :datetime="comment.createdAt">
              {{ new Date(comment.createdAt).toLocaleString("fr-FR") }}
            </time>
            <span v-if="comment.editedAt"> — modifié</span>
          </header>
          <p v-if="comment.deletedAt" class="field-hint">
            Commentaire supprimé.
          </p>
          <form
            v-else-if="editingId === comment.id"
            class="comment-form"
            @submit.prevent="saveComment(comment)"
          >
            <label :for="`edit-comment-${comment.id}`"
              >Modifier le commentaire</label
            >
            <textarea
              :id="`edit-comment-${comment.id}`"
              v-model="editingBody"
              rows="4"
              maxlength="5000"
              required
            />
            <div class="page-actions">
              <button type="submit">Enregistrer</button>
              <button type="button" @click="editingId = null">Annuler</button>
            </div>
          </form>
          <template v-else>
            <p class="publication-copy">{{ comment.body }}</p>
            <p
              v-if="comment.annotationIds?.length"
              class="comment-annotation-links"
            >
              <span>Annotations liées :</span>
              <a
                v-for="(annotationId, index) in comment.annotationIds ?? []"
                :key="annotationId"
                :href="`#annotation-${annotationId}`"
              >
                annotation {{ index + 1 }}
              </a>
            </p>
            <div
              v-if="comment.canEdit || comment.canDelete"
              class="page-actions"
            >
              <button
                v-if="comment.canEdit"
                type="button"
                @click="startEditing(comment)"
              >
                Modifier
              </button>
              <button
                v-if="comment.canDelete"
                type="button"
                @click="deleteComment(comment)"
              >
                Supprimer
              </button>
            </div>
          </template>
        </article>
      </li>
    </ol>

    <div v-if="canReview" class="review-panel">
      <h3>Décision client sur la version {{ contentVersion }}</h3>
      <label for="review-message">Message de décision</label>
      <textarea
        id="review-message"
        v-model="reviewMessage"
        rows="3"
        maxlength="5000"
        aria-describedby="review-help"
      />
      <p id="review-help" class="field-hint">
        Le message est obligatoire pour demander des corrections.
      </p>
      <div class="page-actions">
        <button type="button" :disabled="!isReady" @click="review('approved')">
          Approuver cette version
        </button>
        <button
          type="button"
          :disabled="!isReady"
          @click="review('changes_requested')"
        >
          Demander des corrections
        </button>
      </div>
    </div>

    <h3>Historique des décisions</h3>
    <p v-if="!discussion.reviews.length">Aucune décision.</p>
    <ol v-else class="review-history">
      <li v-for="item in discussion.reviews" :key="item.id">
        <strong>{{ REVIEW_LABELS[item.decision] }}</strong> — version
        {{ item.version }}, par {{ item.reviewer.displayName }} le
        <time :datetime="item.createdAt">{{
          new Date(item.createdAt).toLocaleString("fr-FR")
        }}</time>
        <p v-if="item.message" class="publication-copy">{{ item.message }}</p>
      </li>
    </ol>
  </section>
</template>
