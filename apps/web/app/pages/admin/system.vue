<script setup lang="ts">
import type { SystemComponentStatus, SystemStatus } from "~/types/admin";

definePageMeta({ middleware: ["auth", "role"], requiredRoles: ["admin"] });
useHead({ title: "État du système" });

const adminApi = useAdminApi();
const system = ref<SystemStatus | null>(null);
const loading = ref(true);
const message = ref("");
const errorMessage = ref("");

const statusLabels: Record<SystemComponentStatus, string> = {
  operational: "Opérationnel",
  degraded: "Dégradé",
  down: "Indisponible",
  disabled: "Désactivé",
  unknown: "Inconnu",
};

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    system.value = (await adminApi.systemStatus()).data;
    message.value = `État actualisé à ${new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(system.value.generatedAt))}.`;
  } catch {
    errorMessage.value = "Impossible de récupérer l’état du système.";
  } finally {
    loading.value = false;
  }
}

async function retry(jobId: string) {
  message.value = "";
  errorMessage.value = "";
  try {
    await adminApi.retrySystemJob(jobId);
    message.value = "Le job a été replacé dans la file.";
    await load();
  } catch {
    errorMessage.value = "Le job n’a pas pu être relancé.";
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
          <li>État du système</li>
        </ol>
      </nav>

      <div class="system-heading">
        <div>
          <h1>État du système</h1>
          <p class="dashboard__lead">
            Disponibilité des composants techniques et état de la file de
            traitements.
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
        v-if="message || errorMessage"
        class="status-message"
        :class="{ 'form-errors': errorMessage }"
        role="status"
        aria-live="polite"
      >
        {{ errorMessage || message }}
      </p>

      <template v-if="system">
        <dl class="project-counters" aria-label="Résumé de la supervision">
          <div>
            <dt>État général</dt>
            <dd>{{ system.overall }}</dd>
          </div>
          <div>
            <dt>Latence API p95</dt>
            <dd>
              {{
                system.metrics.http.p95LatencyMs === null
                  ? "N/A"
                  : `${system.metrics.http.p95LatencyMs} ms`
              }}
            </dd>
          </div>
          <div>
            <dt>Jobs en échec</dt>
            <dd>{{ system.queue.failed }}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{{ system.release }}</dd>
          </div>
        </dl>

        <div class="table-scroll" tabindex="0">
          <table class="users-table system-table">
            <caption>
              État détaillé des composants
            </caption>
            <thead>
              <tr>
                <th scope="col">Composant</th>
                <th scope="col">État</th>
                <th scope="col">Détail</th>
                <th scope="col">Latence</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="component in system.components" :key="component.id">
                <th scope="row">{{ component.label }}</th>
                <td>
                  <span
                    class="system-status"
                    :class="`system-status--${component.status}`"
                  >
                    {{ statusLabels[component.status] }}
                  </span>
                </td>
                <td>{{ component.message }}</td>
                <td>
                  {{
                    component.latencyMs === undefined
                      ? "N/A"
                      : `${component.latencyMs} ms`
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section class="system-panel" aria-labelledby="queue-heading">
          <h2 id="queue-heading">File BullMQ</h2>
          <dl class="project-counters" aria-label="Compteurs de la file">
            <div>
              <dt>En attente</dt>
              <dd>{{ system.queue.waiting }}</dd>
            </div>
            <div>
              <dt>Actifs</dt>
              <dd>{{ system.queue.active }}</dd>
            </div>
            <div>
              <dt>Différés</dt>
              <dd>{{ system.queue.delayed }}</dd>
            </div>
            <div>
              <dt>Échoués</dt>
              <dd>{{ system.queue.failed }}</dd>
            </div>
          </dl>

          <div
            v-if="system.queue.failedJobs.length"
            class="table-scroll"
            tabindex="0"
          >
            <table class="users-table">
              <caption>
                Dix derniers jobs échoués
              </caption>
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Tentatives</th>
                  <th scope="col">Date</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="job in system.queue.failedJobs" :key="job.id">
                  <th scope="row">{{ job.name }}</th>
                  <td>{{ job.attemptsMade }}</td>
                  <td>
                    {{
                      job.failedAt
                        ? new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(job.failedAt))
                        : "N/A"
                    }}
                  </td>
                  <td class="table-actions">
                    <button type="button" @click="retry(job.id)">
                      Relancer
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else>Aucun job en échec.</p>
        </section>

        <section class="system-panel" aria-labelledby="integrations-heading">
          <h2 id="integrations-heading">Intégrations sociales</h2>
          <p>
            {{ system.social.failures24h }} échec(s) durant les dernières 24
            heures. Les tokens et réponses externes ne sont jamais affichés.
          </p>
        </section>
      </template>
    </main>
  </PrivateShell>
</template>
