<template>
  <div class="max-w-5xl">
    <h1 class="text-2xl font-bold mb-2">{{ $t('tools.yeastStarterMulti.title') }}</h1>
    <p class="text-sm text-muted-foreground mb-6">{{ $t('tools.yeastStarterMulti.subtitle') }}</p>

    <div class="space-y-6">
      <section class="border rounded-lg p-4 space-y-4">
        <h2 class="font-semibold">{{ $t('tools.yeastStarterMulti.source') }}</h2>
        <div class="grid gap-4 md:grid-cols-4">
          <div>
            <label class="text-sm font-medium">{{
              $t('tools.yeastStarterMulti.sourceType')
            }}</label>
            <select
              v-model="sourceType"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            >
              <option value="activator">{{ $t('tools.yeastStarterMulti.activator') }}</option>
              <option value="slurry">{{ $t('tools.yeastStarterMulti.slurry') }}</option>
              <option value="dregs">{{ $t('tools.yeastStarterMulti.dregs') }}</option>
              <option value="drypack">{{ $t('tools.yeastStarterMulti.drypack') }}</option>
            </select>
          </div>
          <div v-if="sourceType === 'slurry' || sourceType === 'drypack'">
            <label class="text-sm font-medium">{{ $t('tools.yeastStarterMulti.grams') }}</label>
            <input
              v-model.number="sourceGrams"
              type="number"
              min="0"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div v-if="sourceType === 'slurry' || sourceType === 'drypack'">
            <label class="text-sm font-medium">{{
              $t('tools.yeastStarterMulti.cellsPerGram')
            }}</label>
            <input
              v-model.number="cellsPerGram"
              type="number"
              min="0"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div v-if="sourceType === 'drypack'">
            <label class="text-sm font-medium">{{ $t('tools.yeastStarterMulti.daysOld') }}</label>
            <input
              v-model.number="daysOld"
              type="number"
              min="0"
              step="1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium">
            {{ $t('tools.yeastStarterMulti.vitality') }}: {{ vitality.toFixed(2) }}
          </label>
          <input
            v-model.number="vitality"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="w-full"
          />
          <p class="text-sm text-muted-foreground">
            {{ $t('tools.yeastStarterMulti.startingCells') }}:
            <span class="font-mono font-semibold">{{ startingCells.toFixed(1) }}</span>
            {{ $t('tools.yeastStarterMulti.billion') }}
          </p>
        </div>
      </section>

      <section class="border rounded-lg p-4 space-y-4">
        <h2 class="font-semibold">{{ $t('tools.yeastStarterMulti.target') }}</h2>
        <div class="grid gap-4 md:grid-cols-4">
          <div>
            <label class="text-sm font-medium">{{
              $t('tools.yeastStarterMulti.batchVolume')
            }}</label>
            <input
              v-model.number="batchVolumeL"
              type="number"
              min="0"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('tools.yeastStarterMulti.plato') }}</label>
            <input
              v-model.number="plato"
              type="number"
              min="0"
              step="0.1"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{ $t('tools.yeastStarterMulti.pitchRate') }}</label>
            <input
              v-model.number="pitchRateValue"
              type="number"
              min="0"
              step="0.05"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
            />
          </div>
          <div>
            <label class="text-sm font-medium">{{
              $t('tools.yeastStarterMulti.targetCells')
            }}</label>
            <input
              v-model.number="targetCells"
              type="number"
              min="0"
              step="1"
              :disabled="useDerivedTarget"
              class="w-full mt-1 px-3 py-2 border rounded-md bg-background disabled:opacity-60"
            />
          </div>
        </div>
        <label class="inline-flex items-center gap-2 text-sm">
          <input v-model="useDerivedTarget" type="checkbox" class="rounded" />
          {{ $t('tools.yeastStarterMulti.useDerivedTarget') }}
          ({{ derivedTargetCells.toFixed(0) }} {{ $t('tools.yeastStarterMulti.billion') }})
        </label>
      </section>

      <section class="border rounded-lg overflow-hidden">
        <div class="flex items-center justify-between gap-4 p-4 border-b">
          <h2 class="font-semibold">{{ $t('tools.yeastStarterMulti.steps') }}</h2>
          <button
            class="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            @click="addStep"
          >
            {{ $t('common.add') }}
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted">
              <tr>
                <th class="text-left p-3 font-medium">#</th>
                <th class="text-left p-3 font-medium">{{ $t('tools.yeastStarterMulti.mode') }}</th>
                <th class="text-right p-3 font-medium">
                  {{ $t('tools.yeastStarterMulti.wortVolume') }}
                </th>
                <th class="text-right p-3 font-medium">
                  {{ $t('tools.yeastStarterMulti.wortSg') }}
                </th>
                <th class="text-right p-3 font-medium">{{ $t('tools.yeastStarterMulti.dme') }}</th>
                <th class="text-right p-3 font-medium">
                  {{ $t('tools.yeastStarterMulti.endingCells') }}
                </th>
                <th class="text-right p-3 font-medium">{{ $t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(step, index) in steps" :key="step.id" class="border-t">
                <td class="p-3">{{ index + 1 }}</td>
                <td class="p-3">
                  <select
                    v-model="step.mode"
                    class="w-full px-2 py-1 border rounded-md bg-background"
                  >
                    <option value="simple">{{ $t('tools.yeastStarterMulti.simple') }}</option>
                    <option value="aerated">{{ $t('tools.yeastStarterMulti.aerated') }}</option>
                    <option value="stirred">{{ $t('tools.yeastStarterMulti.stirred') }}</option>
                  </select>
                </td>
                <td class="p-3">
                  <input
                    v-model.number="step.volumeL"
                    type="number"
                    min="0"
                    step="0.1"
                    class="w-28 px-2 py-1 border rounded-md bg-background text-right"
                  />
                </td>
                <td class="p-3">
                  <input
                    v-model.number="step.sg"
                    type="number"
                    min="1"
                    step="0.001"
                    class="w-28 px-2 py-1 border rounded-md bg-background text-right"
                  />
                </td>
                <td class="p-3 text-right font-mono">
                  {{ cascade[index]?.dmeGrams.toFixed(0) }} g
                </td>
                <td class="p-3 text-right font-mono font-semibold">
                  {{ cascade[index]?.endingCells.toFixed(1) }}
                </td>
                <td class="p-3 text-right">
                  <button class="text-destructive hover:underline" @click="removeStep(index)">
                    {{ $t('common.delete') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        class="border rounded-lg p-4"
        :class="
          reachesTarget
            ? 'border-green-600 bg-green-50 text-green-900'
            : 'border-red-600 bg-red-50 text-red-900'
        "
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="font-semibold">{{ $t('tools.yeastStarterMulti.result') }}</h2>
            <p class="text-sm">
              {{
                $t(
                  reachesTarget
                    ? 'tools.yeastStarterMulti.reachesTarget'
                    : 'tools.yeastStarterMulti.shortfall',
                )
              }}
            </p>
          </div>
          <div class="text-right font-mono">
            <div>{{ finalCells.toFixed(1) }} / {{ targetCells.toFixed(1) }}</div>
            <div class="text-xs">{{ $t('tools.yeastStarterMulti.billion') }}</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  cascadeStep,
  pitchRateCells,
  viableCells,
  vitalityAdjustedCells,
  type PropagationMode,
} from '~/server/utils/calculations/yeast'

type SourceType = 'activator' | 'slurry' | 'dregs' | 'drypack'

interface StarterStep {
  id: number
  mode: PropagationMode
  volumeL: number
  sg: number
}

const sourceType = ref<SourceType>('activator')
const sourceGrams = ref(11)
const cellsPerGram = ref(6)
const daysOld = ref(0)
const vitality = ref(1)
const batchVolumeL = ref(20)
const plato = ref(12)
const pitchRateValue = ref(0.75)
const useDerivedTarget = ref(true)
const targetCells = ref(180)
const steps = ref<StarterStep[]>([
  { id: 1, mode: 'stirred', volumeL: 1, sg: 1.04 },
  { id: 2, mode: 'stirred', volumeL: 2, sg: 1.04 },
])
let nextStepId = 3

const derivedTargetCells = computed(() =>
  pitchRateCells(batchVolumeL.value, plato.value, pitchRateValue.value),
)
const sourceCells = computed(() => {
  if (sourceType.value === 'activator') return 100
  if (sourceType.value === 'dregs') return 5
  if (sourceType.value === 'drypack') {
    return viableCells(sourceGrams.value * cellsPerGram.value, daysOld.value, 'dry')
  }
  return sourceGrams.value * cellsPerGram.value
})
const startingCells = computed(() => vitalityAdjustedCells(sourceCells.value, vitality.value))
const cascade = computed(() => {
  let currentCells = startingCells.value
  return steps.value.map((step) => {
    const result = cascadeStep(currentCells, step.volumeL, step.sg, step.mode)
    currentCells = result.endingCells
    return result
  })
})
const finalCells = computed(() => cascade.value.at(-1)?.endingCells ?? startingCells.value)
const reachesTarget = computed(() => finalCells.value >= targetCells.value)

watch(
  derivedTargetCells,
  (value) => {
    if (useDerivedTarget.value) targetCells.value = Number(value.toFixed(1))
  },
  { immediate: true },
)
watch(useDerivedTarget, (value) => {
  if (value) targetCells.value = Number(derivedTargetCells.value.toFixed(1))
})
watch(sourceType, (value) => {
  if (value === 'drypack') {
    sourceGrams.value = 11
    cellsPerGram.value = 6
  } else if (value === 'slurry') {
    sourceGrams.value = 100
    cellsPerGram.value = 1.2
  }
})

function addStep() {
  steps.value.push({ id: nextStepId, mode: 'stirred', volumeL: 1, sg: 1.04 })
  nextStepId += 1
}

function removeStep(index: number) {
  steps.value.splice(index, 1)
}
</script>
