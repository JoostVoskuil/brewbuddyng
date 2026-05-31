<script setup lang="ts">
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  disabled?: boolean
  training?: boolean
  history: Array<{ epoch: number, rmse: number }>
}>()

const emit = defineEmits<{
  start: [payload: { maxEpochs: number, targetRmse: number, learningRate: number, momentum: number }]
  stop: []
}>()

const { t } = useI18n()
const form = reactive({ maxEpochs: 5000, targetRmse: 0.02, learningRate: 0.7, momentum: 0.1 })

const chartOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 55, right: 20, top: 20, bottom: 35 },
  xAxis: { type: 'category', name: t('analysis.neural.epoch'), data: props.history.map((point) => point.epoch) },
  yAxis: { type: 'value', name: 'RMSE', scale: true },
  series: [{ name: 'RMSE', type: 'line', smooth: true, symbol: 'none', data: props.history.map((point) => point.rmse) }],
}))

function start() {
  emit('start', { ...form })
}
</script>

<template>
  <form class="card space-y-3" @submit.prevent="start">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">{{ t('analysis.neural.train') }}</h2>
      <button type="button" class="btn" :disabled="!props.training" @click="emit('stop')">{{ t('analysis.neural.stopButton') }}</button>
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <label>{{ t('analysis.neural.maxEpochs') }}<input v-model.number="form.maxEpochs" type="number" min="1" class="field" /></label>
      <label>{{ t('analysis.neural.targetRmse') }}<input v-model.number="form.targetRmse" type="number" step="0.001" min="0" class="field" /></label>
      <label>{{ t('analysis.neural.learningRate') }}<input v-model.number="form.learningRate" type="number" step="0.01" min="0" class="field" /></label>
      <label>{{ t('analysis.neural.momentum') }}<input v-model.number="form.momentum" type="number" step="0.01" min="0" max="1" class="field" /></label>
    </div>
    <button class="btn-primary" :disabled="props.disabled || props.training">{{ t('analysis.neural.trainButton') }}</button>
    <AnalysisNeuralRmseHistory :history="props.history" />
    <BaseChart v-if="props.history.length" :option="chartOption" height="240px" />
  </form>
</template>
