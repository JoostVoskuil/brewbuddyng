<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold mb-1">{{ $t('tools.styleMatch') }}</h1>
    <p class="text-sm text-muted-foreground mb-6">{{ $t('styleMatch.subtitle') }}</p>

    <div class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label class="text-sm font-medium">OG</label>
          <input
            v-model.number="form.og"
            type="number"
            step="0.001"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">FG</label>
          <input
            v-model.number="form.fg"
            type="number"
            step="0.001"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">IBU</label>
          <input
            v-model.number="form.ibu"
            type="number"
            step="1"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('styleMatch.colorEbc') }}</label>
          <input
            v-model.number="form.colorEbc"
            type="number"
            step="1"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">ABV %</label>
          <input
            v-model.number="form.abv"
            type="number"
            step="0.1"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>

      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="search"
      >
        {{ $t('styleMatch.findStyles') }}
      </button>

      <div v-if="results.length" class="border rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-muted">
            <tr>
              <th class="text-left p-3 font-medium">{{ $t('common.name') }}</th>
              <th class="text-left p-3 font-medium">{{ $t('styleMatch.guide') }}</th>
              <th class="text-right p-3 font-medium">{{ $t('styleMatch.match') }}</th>
              <th class="text-right p-3 font-medium">{{ $t('styleMatch.inRange') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in results" :key="r.style.id" class="border-t">
              <td class="p-3 font-medium">
                {{ r.style.categoryNumber }}{{ r.style.styleLetter }} {{ r.style.name }}
              </td>
              <td class="p-3 text-muted-foreground">{{ r.style.styleGuide }}</td>
              <td class="p-3 text-right">
                <span class="font-mono font-semibold">{{ Math.round(r.score * 100) }}%</span>
              </td>
              <td class="p-3 text-right font-mono">
                {{ r.inRangeCount }}/{{ r.evaluatedCount }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="searched" class="text-sm text-muted-foreground">
        {{ $t('common.noResults') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { srmToEBC } from '~/server/utils/calculations/color'

interface MatchRow {
  style: {
    id: number
    name: string
    categoryNumber: string
    styleLetter: string
    styleGuide: string
  }
  score: number
  inRangeCount: number
  evaluatedCount: number
}

const form = ref({
  og: 1.05,
  fg: 1.012,
  ibu: 30,
  colorEbc: 20,
  abv: undefined as number | undefined,
})
const results = ref<MatchRow[]>([])
const searched = ref(false)

async function search() {
  // Style colour ranges are stored in SRM; convert the EBC input before matching.
  const colorSrm = form.value.colorEbc ? form.value.colorEbc / srmToEBC(1) : undefined
  results.value = await $fetch<MatchRow[]>('/api/calculations/style-match', {
    method: 'POST',
    body: {
      og: form.value.og,
      fg: form.value.fg,
      ibu: form.value.ibu,
      colorSrm,
      abv: form.value.abv,
    },
  })
  searched.value = true
}
</script>
