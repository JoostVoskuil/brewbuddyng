<template>
  <div class="max-w-3xl">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.gristWizard') }}</h1>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div>
        <label class="text-sm font-medium">{{ $t('recipe.batchSize') }} (L)</label>
        <input
          v-model.number="batchSize"
          type="number"
          step="0.5"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div>
        <label class="text-sm font-medium">{{ $t('recipe.targetOg') }}</label>
        <input
          v-model.number="targetOg"
          type="number"
          step="0.001"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div>
        <label class="text-sm font-medium">{{ $t('recipe.efficiency') }} (%)</label>
        <input
          v-model.number="efficiency"
          type="number"
          step="1"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div>
        <label class="text-sm font-medium">{{ $t('tools.attenuation') }} (%)</label>
        <input
          v-model.number="attenuation"
          type="number"
          step="1"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
    </div>

    <div class="flex items-center gap-2 mb-3">
      <select v-model="picker" class="px-3 py-2 border rounded-md bg-background text-sm flex-1">
        <option value="">{{ $t('tools.addFermentable') }}…</option>
        <option v-for="f in fermentableDb" :key="f.id" :value="f.id">{{ f.name }}</option>
      </select>
      <button
        class="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        @click="addFromPicker"
      >
        {{ $t('common.add') }}
      </button>
    </div>

    <table v-if="rows.length" class="w-full text-sm border rounded-lg overflow-hidden mb-4">
      <thead class="bg-muted">
        <tr>
          <th class="text-left p-2">{{ $t('common.name') }}</th>
          <th class="text-left p-2 w-1/3">%</th>
          <th class="text-right p-2">Yield %</th>
          <th class="text-right p-2">EBC</th>
          <th class="text-right p-2">kg</th>
          <th class="p-2"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in rows" :key="i" class="border-t">
          <td class="p-2">{{ r.name }}</td>
          <td class="p-2">
            <div class="flex items-center gap-2">
              <input
                v-model.number="r.percent"
                type="range"
                min="0"
                max="100"
                step="1"
                class="flex-1"
              />
              <span class="font-mono w-12 text-right">{{ (r.percent || 0).toFixed(0) }}%</span>
            </div>
          </td>
          <td class="p-2 text-right">{{ r.yield }}</td>
          <td class="p-2 text-right">{{ r.color }}</td>
          <td class="p-2 text-right font-mono">{{ weightFor(i) }}</td>
          <td class="p-2 text-right">
            <button class="text-destructive" @click="rows.splice(i, 1)">✕</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="result" class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div class="border rounded-lg p-3 text-center">
        <div class="text-xs text-muted-foreground">OG</div>
        <div class="font-mono font-semibold">{{ result.og.toFixed(3) }}</div>
      </div>
      <div class="border rounded-lg p-3 text-center">
        <div class="text-xs text-muted-foreground">FG</div>
        <div class="font-mono font-semibold">{{ result.fg.toFixed(3) }}</div>
      </div>
      <div class="border rounded-lg p-3 text-center">
        <div class="text-xs text-muted-foreground">ABV</div>
        <div class="font-mono font-semibold">{{ result.abv.toFixed(1) }}%</div>
      </div>
      <div class="border rounded-lg p-3 text-center">
        <div class="text-xs text-muted-foreground">{{ $t('recipe.color') }}</div>
        <div class="flex items-center justify-center gap-1 font-mono font-semibold">
          <span
            class="w-3 h-3 rounded border"
            :style="{ backgroundColor: ebcToRGB(result.color) }"
          ></span>
          {{ result.color }} EBC
        </div>
      </div>
      <div class="border rounded-lg p-3 text-center">
        <div class="text-xs text-muted-foreground">{{ $t('tools.attenuation') }}</div>
        <div class="font-mono font-semibold">{{ result.attenuation.toFixed(1) }}%</div>
      </div>
    </div>
    <p v-if="result" class="mt-3 text-sm text-muted-foreground">
      {{ $t('common.total') }}: {{ result.totalWeight.toFixed(2) }} kg
    </p>
  </div>
</template>

<script setup lang="ts">
import { ebcToRGB } from '~/server/utils/calculations/color'

interface DbFermentable {
  id: number
  name: string
  yield?: number
  color?: number
}
interface Row {
  name: string
  yield: number
  color: number
  percent: number
}
interface WizardResult {
  fermentables: { name: string; amount: number }[]
  totalWeight: number
  og: number
  fg: number
  abv: number
  color: number
  attenuation: number
}

const batchSize = ref(20)
const targetOg = ref(1.05)
const efficiency = ref(75)
const attenuation = ref(75)
const fermentableDb = ref<DbFermentable[]>([])
const picker = ref<number | ''>('')
const rows = ref<Row[]>([])
const result = ref<WizardResult | null>(null)

function addFromPicker() {
  if (picker.value === '') return
  const f = fermentableDb.value.find((x) => x.id === picker.value)
  if (!f) return
  rows.value.push({
    name: f.name,
    yield: f.yield ?? 80,
    color: f.color ?? 0,
    percent: rows.value.length === 0 ? 100 : 0,
  })
  picker.value = ''
}

function weightFor(i: number): string {
  const f = result.value?.fermentables[i]
  return f ? f.amount.toFixed(3) : '—'
}

async function recompute() {
  if (!rows.value.length) {
    result.value = null
    return
  }
  result.value = await $fetch<WizardResult>('/api/calculations/grist-wizard', {
    method: 'POST',
    body: {
      fermentables: rows.value,
      batchSize: batchSize.value,
      targetOg: targetOg.value,
      efficiency: efficiency.value,
      attenuation: attenuation.value,
    },
  })
}

watch([rows, batchSize, targetOg, efficiency, attenuation], recompute, { deep: true })

onMounted(async () => {
  fermentableDb.value = await $fetch<DbFermentable[]>('/api/fermentables')
})
</script>
