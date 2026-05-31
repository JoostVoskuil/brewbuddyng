<script setup lang="ts">
export type NeuralActivation = 'sigmoid' | 'tanh' | 'relu'

const props = defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  create: [payload: { name: string, inputParams: string[], outputParams: string[], hiddenLayers: number[], activation: NeuralActivation }]
}>()

const { t } = useI18n()
const form = reactive({
  name: '',
  inputSize: 3,
  outputSize: 2,
  inputParams: 'og,ibu,ebc',
  outputParams: 'fg,abv',
  activation: 'sigmoid' as NeuralActivation,
})
const hiddenLayers = ref<number[]>([5])

function names(value: string, size: number, prefix: string) {
  const parsed = value.split(',').map((part) => part.trim()).filter(Boolean)
  return Array.from({ length: size }, (_, index) => parsed[index] || `${prefix}${index + 1}`)
}

function addLayer() {
  hiddenLayers.value = [...hiddenLayers.value, hiddenLayers.value.at(-1) ?? 5]
}

function removeLayer(index: number) {
  hiddenLayers.value = hiddenLayers.value.filter((_, i) => i !== index)
  if (!hiddenLayers.value.length) hiddenLayers.value = [1]
}

function submit() {
  const inputSize = Math.max(1, Math.trunc(form.inputSize))
  const outputSize = Math.max(1, Math.trunc(form.outputSize))
  emit('create', {
    name: form.name,
    inputParams: names(form.inputParams, inputSize, 'input'),
    outputParams: names(form.outputParams, outputSize, 'output'),
    hiddenLayers: hiddenLayers.value.map((n) => Math.max(1, Math.trunc(n))),
    activation: form.activation,
  })
}
</script>

<template>
  <form class="card space-y-3" @submit.prevent="submit">
    <h2 class="text-lg font-semibold">{{ t('analysis.neural.topology') }}</h2>
    <label>{{ t('analysis.neural.name') }}<input v-model="form.name" class="field" /></label>
    <div class="grid gap-3 sm:grid-cols-2">
      <label>{{ t('analysis.neural.inputSize') }}<input v-model.number="form.inputSize" type="number" min="1" class="field" /></label>
      <label>{{ t('analysis.neural.outputSize') }}<input v-model.number="form.outputSize" type="number" min="1" class="field" /></label>
    </div>
    <label>{{ t('analysis.neural.inputs') }}<input v-model="form.inputParams" class="field" /></label>
    <label>{{ t('analysis.neural.outputs') }}<input v-model="form.outputParams" class="field" /></label>
    <label>{{ t('analysis.neural.activation') }}
      <select v-model="form.activation" class="field">
        <option value="sigmoid">sigmoid</option>
        <option value="tanh">tanh</option>
        <option value="relu">relu</option>
      </select>
    </label>
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="font-medium">{{ t('analysis.neural.hiddenLayers') }}</span>
        <button type="button" class="btn" @click="addLayer">{{ t('analysis.neural.addLayer') }}</button>
      </div>
      <div v-for="(neurons, index) in hiddenLayers" :key="index" class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">#{{ index + 1 }}</span>
        <input v-model.number="hiddenLayers[index]" type="number" min="1" class="field" />
        <button type="button" class="btn" @click="removeLayer(index)">{{ t('analysis.neural.remove') }}</button>
      </div>
    </div>
    <button class="btn-primary" :disabled="props.loading">{{ t('analysis.neural.createButton') }}</button>
  </form>
</template>
