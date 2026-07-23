<script setup lang="ts">
import type { BackupRun, BackupSummary } from "~/types/admin";

definePageMeta({ middleware: ["auth", "role"], requiredRoles: ["admin"] });
useHead({ title: "Sauvegardes" });

const runs = ref<BackupRun[]>([]);
const summary = ref<BackupSummary | null>(null);
const loading = ref(true);
const errorMessage = ref("");

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "Jamais";
}

function formatSize(value: number | null) {
  return value === null
    ? "N/A"
    : new Intl.NumberFormat("fr-FR", {
        style: "unit",
        unit: "megabyte",
        maximumFractionDigits: 2,
      }).format(value / 1_048_576);
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await useAdminApi().backups();
    runs.value = response.data;
    summary.value = response.summary;
  } catch {
    errorMessage.value =
      "Impossible de récupérer l’historique des sauvegardes.";
  } finally {
    loading.value = false;
  }
}

await load();
</script>

<template>
  <PrivateShell>
    <main id="main-content" class="dashboard" tabindex="-1">
      <nav class="breadcrumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><NuxtLink to="/admin">Administration</NuxtLink></li>
          <li>Sauvegardes</li>
        </ol>
      </nav>

      <div class="system-heading">
        <div>
          <h1>Sauvegardes et restaurations</h1>
          <p class="dashboard__lead">
            Historique en lecture seule des sauvegardes chiffrées et des tests
            de restauration.
          </p>
        </div>
        <button
          type="button"
          class="button-secondary"
          :disabled="loading"
          @click="load"
        >
          {{ loading ? "Actualisation…" : "Actualiser" }}
        </button>
      </div>

      <p
        v-if="errorMessage"
        class="form-errors"
        role="alert"
        aria-live="assertive"
      >
        {{ errorMessage }}
      </p>

      <dl
        v-if="summary"
        class="project-counters"
        aria-label="Résumé des sauvegardes"
      >
        <div>
          <dt>Dernière sauvegarde vérifiée</dt>
          <dd>{{ formatDate(summary.lastVerifiedAt) }}</dd>
        </div>
        <div>
          <dt>Âge de la sauvegarde</dt>
          <dd>
            {{
              summary.lastVerifiedAgeHours === null
                ? "N/A"
                : `${summary.lastVerifiedAgeHours.toFixed(1)} h`
            }}
          </dd>
        </div>
        <div>
          <dt>Dernière sauvegarde validée par restauration</dt>
          <dd>{{ formatDate(summary.lastValidAt) }}</dd>
        </div>
        <div>
          <dt>Dernier test de restauration</dt>
          <dd>{{ formatDate(summary.lastRestoreAt) }}</dd>
        </div>
        <div>
          <dt>Taux de succès</dt>
          <dd>
            {{
              summary.successRate === null
                ? "N/A"
                : `${(summary.successRate * 100).toFixed(1)} %`
            }}
          </dd>
        </div>
      </dl>

      <div class="table-scroll" tabindex="0">
        <table class="users-table system-table">
          <caption>
            Historique des sauvegardes et restaurations
          </caption>
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Début</th>
              <th scope="col">Statut</th>
              <th scope="col">Rétention</th>
              <th scope="col">Taille</th>
              <th scope="col">Vérification</th>
              <th scope="col">Erreur</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in runs" :key="run.id">
              <th scope="row">
                {{
                  run.type === "database"
                    ? "Sauvegarde PostgreSQL"
                    : "Test de restauration"
                }}
              </th>
              <td>{{ formatDate(run.startedAt) }}</td>
              <td>
                {{
                  run.status === "succeeded"
                    ? "Réussie"
                    : run.status === "failed"
                      ? "Échouée"
                      : "En cours"
                }}
              </td>
              <td>{{ run.retentionTier ?? "N/A" }}</td>
              <td>{{ formatSize(run.sizeBytes) }}</td>
              <td>{{ formatDate(run.verifiedAt) }}</td>
              <td>{{ run.errorCode ?? "Aucune" }}</td>
            </tr>
            <tr v-if="!runs.length">
              <td colspan="7">Aucune sauvegarde enregistrée.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="field-hint">
        Aucun dump, secret ou lien de téléchargement n’est exposé dans cette
        interface.
      </p>
    </main>
  </PrivateShell>
</template>
