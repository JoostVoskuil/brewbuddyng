<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border bg-background p-4 shadow-xl">
      <div class="flex items-start justify-between gap-3 border-b pb-3">
        <div>
          <h2 class="text-lg font-semibold">{{ $t('wizard.water.title') }}</h2>
          <p class="text-sm text-muted-foreground">{{ $t('wizard.water.subtitle') }}</p>
        </div>
        <button type="button" class="text-xl leading-none" @click="$emit('close')">×</button>
      </div>

      <div class="grid gap-4 py-4 md:grid-cols-3">
        <label class="space-y-1 text-sm font-medium">
          {{ $t('wizard.water.sourceA') }}
          <select v-model.number="sourceAId" class="w-full rounded border bg-background px-3 py-2">
            <option v-for="water in waterProfiles" :key="water.id" :value="water.id">{{ water.name }}</option>
          </select>
        </label>
        <label class="space-y-1 text-sm font-medium">
          {{ $t('wizard.water.sourceB') }}
          <select v-model.number="sourceBId" class="w-full rounded border bg-background px-3 py-2">
            <option :value="0">{{ $t('wizard.water.distilled') }}</option>
            <option v-for="water in waterProfiles" :key="water.id" :value="water.id">{{ water.name }}</option>
          </select>
        </label>
        <label class="space-y-1 text-sm font-medium">
          {{ $t('recipe.waterAmount') }} (L)
          <input v-model.number="volumeL" type="number" min="1" step="0.5" class="w-full rounded border bg-background px-3 py-2 text-right" />
        </label>
        <label class="space-y-1 text-sm font-medium md:col-span-3">
          <span class="flex justify-between"><span>{{ $t('wizard.water.sourceBlend') }}</span><span>{{ sourceAPercent }}% / {{ 100 - sourceAPercent }}%</span></span>
          <input v-model.number="sourceAPercent" type="range" min="0" max="100" step="5" class="w-full" />
        </label>
      </div>

      <div class="grid gap-3 md:grid-cols-6">
        <label v-for="ion in ions" :key="ion.key" class="space-y-1 text-sm font-medium">
          {{ ion.label }}
          <input v-model.number="target[ion.key]" type="number" step="1" min="0" class="w-full rounded border bg-background px-2 py-1 text-right" />
        </label>
      </div>

      <div class="mt-4 grid gap-4 lg:grid-cols-2">
        <div class="rounded border p-3">
          <h3 class="mb-2 text-sm font-semibold">{{ $t('wizard.water.salts') }}</h3>
          <div v-for="salt in salts" :key="salt.key" class="flex justify-between border-t py-1 text-sm first:border-t-0">
            <span>{{ salt.label }}</span>
            <span class="font-mono">{{ result.additions[salt.key].toFixed(2) }} {{ salt.unit }}</span>
          </div>
        </div>
        <div class="rounded border p-3">
          <h3 class="mb-2 text-sm font-semibold">{{ $t('wizard.preview') }}</h3>
          <div v-for="ion in ions" :key="ion.key" class="grid grid-cols-3 gap-2 border-t py-1 text-sm first:border-t-0">
            <span>{{ ion.label }}</span>
            <span class="text-right font-mono">{{ result.finalProfile[ion.key].toFixed(0) }}</span>
            <span class="text-right font-mono text-muted-foreground">Δ {{ result.deltas[ion.key].toFixed(0) }}</span>
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button type="button" class="rounded border px-3 py-2 text-sm" @click="$emit('close')">{{ $t('common.cancel') }}</button>
        <button type="button" class="rounded bg-primary px-3 py-2 text-sm text-primary-foreground" @click="apply">{{ $t('wizard.apply') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { planWaterWizard, type WaterWizardResult } from '~/server/utils/calculations/wizard'
import type { Water } from '~/types'
import type { WaterProfile } from '~/server/utils/calculations/water'

const props = defineProps<{ waterProfiles: Water[]; batchSize: number }>()
const emit = defineEmits<{ close: []; apply: [result: WaterWizardResult] }>()

const emptyWater: WaterProfile = { calcium: 0, magnesium: 0, sodium: 0, chloride: 0, sulfate: 0, bicarbonate: 0, ph: 7 }
const sourceAId = ref(props.waterProfiles[0]?.id ?? 0)
const sourceBId = ref(0)
const sourceAPercent = ref(100)
const volumeL = ref(props.batchSize || 20)
const target = reactive<WaterProfile>({ calcium: 75, magnesium: 10, sodium: 25, chloride: 80, sulfate: 150, bicarbonate: 80, ph: 7 })
const ions = [
  { key: 'calcium' as const, label: 'Ca²⁺' },
  { key: 'magnesium' as const, label: 'Mg²⁺' },
  { key: 'sodium' as const, label: 'Na⁺' },
  { key: 'sulfate' as const, label: 'SO₄²⁻' },
  { key: 'chloride' as const, label: 'Cl⁻' },
  { key: 'bicarbonate' as const, label: 'HCO₃⁻' },
]
const salts = [
  { key: 'cacl2' as const, label: 'CaCl₂', unit: 'g' },
  { key: 'caso4' as const, label: 'CaSO₄', unit: 'g' },
  { key: 'mgso4' as const, label: 'MgSO₄', unit: 'g' },
  { key: 'nacl' as const, label: 'NaCl', unit: 'g' },
  { key: 'nahco3' as const, label: 'NaHCO₃', unit: 'g' },
  { key: 'caco3' as const, label: 'CaCO₃', unit: 'g' },
]

function toProfile(water: Water | undefined): WaterProfile {
  if (!water) return emptyWater
  return {
    calcium: water.calcium ?? 0,
    magnesium: water.magnesium ?? 0,
    sodium: water.sodium ?? 0,
    chloride: water.chloride ?? 0,
    sulfate: water.sulfate ?? 0,
    bicarbonate: water.bicarbonate ?? 0,
    ph: water.ph ?? 7,
  }
}

const sourceA = computed(() => toProfile(props.waterProfiles.find((water) => water.id === sourceAId.value)))
const sourceB = computed(() => toProfile(props.waterProfiles.find((water) => water.id === sourceBId.value)))
const result = computed(() =>
  planWaterWizard({ sourceA: sourceA.value, sourceB: sourceB.value, sourceAPercent: sourceAPercent.value, target, volumeL: volumeL.value }),
)

function apply() {
  emit('apply', result.value)
}
</script>
