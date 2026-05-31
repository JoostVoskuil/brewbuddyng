<template>
  <div>
    <div class="flex items-center justify-between mb-6 print:hidden">
      <h1 class="text-2xl font-bold">{{ $t('brew.overviewTitle') }}</h1>
      <div class="flex items-center gap-2">
        <NuxtLink to="/brews" class="px-4 py-2 border rounded-md text-sm">{{
          $t('common.back')
        }}</NuxtLink>
        <button
          class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          @click="printReport"
        >
          {{ $t('common.print') }}
        </button>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-3 items-end print:hidden">
      <div>
        <label class="text-sm font-medium">{{ $t('brew.fromDate') }}</label>
        <input
          v-model="fromDate"
          type="date"
          class="block mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div>
        <label class="text-sm font-medium">{{ $t('brew.toDate') }}</label>
        <input
          v-model="toDate"
          type="date"
          class="block mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <select v-model="statusFilter" class="px-3 py-2 border rounded-md bg-background text-sm">
        <option v-for="s in statuses" :key="s.value" :value="s.value">{{ $t(s.label) }}</option>
      </select>
    </div>

    <h2 class="hidden print:block text-xl font-bold mb-2">{{ $t('brew.overviewTitle') }}</h2>
    <p class="hidden print:block text-sm mb-4">{{ reportRange }}</p>

    <div class="border rounded-lg overflow-hidden print:border-0">
      <table class="w-full text-sm">
        <thead class="bg-muted print:bg-transparent">
          <tr>
            <th class="text-left p-3 font-medium">#</th>
            <th class="text-left p-3 font-medium">{{ $t('common.name') }}</th>
            <th class="text-left p-3 font-medium">{{ $t('brew.date') }}</th>
            <th class="text-left p-3 font-medium">{{ $t('brew.status') }}</th>
            <th class="text-right p-3 font-medium">OG</th>
            <th class="text-right p-3 font-medium">FG</th>
            <th class="text-right p-3 font-medium">ABV</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(brew, i) in filtered" :key="brew.id" class="border-t">
            <td class="p-3">{{ i + 1 }}</td>
            <td class="p-3 font-medium">{{ brew.name }}</td>
            <td class="p-3">{{ formatDate(brew.brewDate) || '—' }}</td>
            <td class="p-3">{{ $t(`brew.statuses.${brew.status ?? 'unknown'}`) }}</td>
            <td class="p-3 text-right font-mono">{{ brew.ogActual?.toFixed(3) ?? '—' }}</td>
            <td class="p-3 text-right font-mono">{{ brew.fgActual?.toFixed(3) ?? '—' }}</td>
            <td class="p-3 text-right font-mono">{{ abv(brew) }}</td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="7" class="p-6 text-center text-muted-foreground">
              {{ $t('common.noResults') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mt-3 text-sm text-muted-foreground">
      {{ $t('common.total') }}: {{ filtered.length }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { BrewListItem } from '~/types'
import { calculateABV } from '~/server/utils/calculations/abv'

const { t } = useI18n()
const { formatDate } = useLocaleDate()
const brews = ref<BrewListItem[]>([])
const fromDate = ref('')
const toDate = ref('')
const statusFilter = ref('all')

const statuses = [
  { value: 'all', label: 'common.all' },
  { value: 'planned', label: 'brew.statuses.planned' },
  { value: 'brewing', label: 'brew.statuses.brewing' },
  { value: 'fermenting', label: 'brew.statuses.fermenting' },
  { value: 'conditioning', label: 'brew.statuses.conditioning' },
  { value: 'completed', label: 'brew.statuses.completed' },
]

const filtered = computed(() => {
  return brews.value
    .filter((b) => {
      if (statusFilter.value !== 'all' && b.status !== statusFilter.value) return false
      const d = b.brewDate ?? ''
      if (fromDate.value && (!d || d < fromDate.value)) return false
      if (toDate.value && (!d || d > toDate.value)) return false
      return true
    })
    .sort((a, b) => (a.brewDate ?? '').localeCompare(b.brewDate ?? ''))
})

const reportRange = computed(() => {
  if (fromDate.value && toDate.value) return `${fromDate.value} – ${toDate.value}`
  if (fromDate.value) return `≥ ${fromDate.value}`
  if (toDate.value) return `≤ ${toDate.value}`
  return t('brew.allBrews')
})

function abv(b: BrewListItem): string {
  if (b.ogActual && b.fgActual) return `${calculateABV(b.ogActual, b.fgActual).toFixed(1)}%`
  return '—'
}

function printReport() {
  if (import.meta.client) window.print()
}

onMounted(async () => {
  brews.value = await $fetch<BrewListItem[]>('/api/brews')
})
</script>
