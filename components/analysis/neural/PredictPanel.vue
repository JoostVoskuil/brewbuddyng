<script setup lang="ts">
import { parseNumericCsv, splitNumbers } from '~/composables/useNeuralCsv'

const props = defineProps<{
  inputParams: string[]
  outputParams: string[]
  disabled?: boolean
  prediction: number[] | null
  batchPredictions: number[][]
}>()

const emit = defineEmits<{
  predict: [inputs: number[]]
  batchPredict: [rows: number[][]]
}>()

const { t } = useI18n()
const inputs = ref<string[]>([])
const batchCsv = ref('')

watch(
  () => props.inputParams,
  (params) => { inputs.value = params.map((_, index) => inputs.value[index] ?? '') },
  { immediate: true },
)

function run() {
  emit('predict', inputs.value.flatMap(splitNumbers).slice(0, props.inputParams.length))
}

function runBatch() {
  emit('batchPredict', parseNumericCsv(batchCsv.value).map((row) => row.slice(0, props.inputParams.length)))
}
</script>

<template>
  <form class="card space-y-3" @submit.prevent="run">
    <h2 class="text-lg font-semibold">{{ t('analysis.neural.predict') }}</h2>
    <div class="grid gap-3 sm:grid-cols-2">
      <label v-for="(name, index) in props.inputParams" :key="name">
        {{ name }}
        <input v-model="inputs[index]" type="number" step="any" class="field" />
      </label>
    </div>
    <button class="btn-primary" :disabled="props.disabled">{{ t('analysis.neural.predictButton') }}</button>
    <div v-if="props.prediction" class="rounded border p-3 text-sm">
      <div v-for="(value, index) in props.prediction" :key="index" class="flex justify-between gap-3">
        <span>{{ props.outputParams[index] || `output${index + 1}` }}</span>
        <span class="font-mono">{{ value.toFixed(5) }}</span>
      </div>
    </div>
    <label>{{ t('analysis.neural.batchCsv') }}<textarea v-model="batchCsv" rows="4" class="field" /></label>
    <button type="button" class="btn" :disabled="props.disabled" @click="runBatch">{{ t('analysis.neural.batchPredict') }}</button>
    <div v-if="props.batchPredictions.length" class="max-h-40 overflow-auto rounded border p-2 text-xs font-mono">
      <div v-for="(row, index) in props.batchPredictions" :key="index">{{ index + 1 }}: {{ row.map((value) => value.toFixed(5)).join(', ') }}</div>
    </div>
  </form>
</template>
