<script setup lang="ts">
const props = defineProps<{
  title: string;
  description: string;
  rows: Array<{ key: string; label: string; count: number }>;
}>();

const maximum = computed(() =>
  Math.max(1, ...props.rows.map((row) => row.count)),
);
</script>

<template>
  <section class="statistics-breakdown" :aria-labelledby="`${title}-title`">
    <h2 :id="`${title}-title`">{{ title }}</h2>
    <p>{{ description }}</p>

    <p v-if="!rows.length" class="empty-state">
      Aucune donnée sur cette période.
    </p>
    <template v-else>
      <ul class="statistics-bars" aria-hidden="true">
        <li v-for="row in rows" :key="row.key">
          <span>{{ row.label }}</span>
          <span class="statistics-bars__track">
            <span
              class="statistics-bars__value"
              :style="{ width: `${(row.count / maximum) * 100}%` }"
            />
          </span>
          <strong>{{ row.count }}</strong>
        </li>
      </ul>

      <div class="table-wrapper">
        <table class="statistics-table">
          <caption>
            Données du graphique :
            {{
              title.toLowerCase()
            }}
          </caption>
          <thead>
            <tr>
              <th scope="col">Catégorie</th>
              <th scope="col">Publications</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key">
              <th scope="row">{{ row.label }}</th>
              <td>{{ row.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
