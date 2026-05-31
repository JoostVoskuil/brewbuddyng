<script setup lang="ts">
import type { NeuralCsvSample } from '~/composables/useNeuralCsv'

type ActivationName = 'sigmoid' | 'tanh' | 'relu'

interface NeuralNetworkItem {
  id: number
  name: string
  inputSize: number
  outputSize: number
  inputParamsList: string[]
  outputParamsList: string[]
  hiddenLayersList: number[]
  finalError?: number | null
  samplesCount?: number
  trainedAt?: string | null
  weights?: string | null
}

const { t } = useI18n()

const networks = ref<NeuralNetworkItem[]>([])
const selectedId = ref<number | null>(null)
const loading = ref(false)
const training = ref(false)
const message = ref('')
const rmseHistory = ref<Array<{ epoch: number, rmse: number }>>([])
const prediction = ref<number[] | null>(null)
const batchPredictions = ref<number[][]>([])
const trainingAbort = shallowRef<AbortController | null>(null)

const selectedNetwork = computed(
  () => networks.value.find((network) => network.id === selectedId.value) ?? null,
)

async function loadNetworks() {
  networks.value = await $fetch<NeuralNetworkItem[]>('/api/neural-networks')
  if (!selectedId.value && networks.value.length) selectedId.value = networks.value[0]!.id
  if (selectedId.value && !networks.value.some((network) => network.id === selectedId.value)) {
    selectedId.value = networks.value[0]?.id ?? null
  }
}

async function createNetwork(payload: {
  name: string
  inputParams: string[]
  outputParams: string[]
  hiddenLayers: number[]
  activation: ActivationName
}) {
  loading.value = true
  try {
    const created = await $fetch<NeuralNetworkItem>('/api/neural-networks', {
      method: 'POST',
      body: { ...payload, name: payload.name || t('analysis.neural.defaultName') },
    })
    selectedId.value = created.id
    rmseHistory.value = []
    message.value = t('analysis.neural.created')
    await loadNetworks()
  } finally {
    loading.value = false
  }
}

async function addSamples(samples: NeuralCsvSample[]) {
  if (!selectedNetwork.value) return
  loading.value = true
  try {
    await $fetch(`/api/neural-networks/${selectedNetwork.value.id}/samples`, {
      method: 'POST',
      body: samples,
    })
    message.value = t('analysis.neural.samplesAdded')
    await loadNetworks()
  } finally {
    loading.value = false
  }
}

async function trainNetwork(options: { maxEpochs: number, targetRmse: number, learningRate: number, momentum: number }) {
  if (!selectedNetwork.value) return
  training.value = true
  rmseHistory.value = []
  trainingAbort.value = new AbortController()
  try {
    const result = await $fetch<{ rmse: number, epochs: number, history?: Array<{ epoch: number, rmse: number }> }>(
      `/api/neural-networks/${selectedNetwork.value.id}/train`,
      { method: 'POST', body: { ...options, collectHistory: true }, signal: trainingAbort.value.signal },
    )
    rmseHistory.value = result.history?.length ? result.history : [{ epoch: result.epochs, rmse: result.rmse }]
    message.value = t('analysis.neural.trained', { rmse: result.rmse.toFixed(5), epochs: result.epochs })
    await loadNetworks()
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') message.value = t('analysis.neural.stopped')
    else throw error
  } finally {
    training.value = false
    trainingAbort.value = null
  }
}

function stopTraining() {
  trainingAbort.value?.abort()
}

async function predict(inputs: number[]) {
  if (!selectedNetwork.value) return
  const result = await $fetch<{ outputs: number[] }>(
    `/api/neural-networks/${selectedNetwork.value.id}/predict`,
    { method: 'POST', body: { inputs } },
  )
  prediction.value = result.outputs
}

async function batchPredict(rows: number[][]) {
  batchPredictions.value = []
  for (const row of rows) {
    if (!selectedNetwork.value || row.length !== selectedNetwork.value.inputSize) continue
    const result = await $fetch<{ outputs: number[] }>(
      `/api/neural-networks/${selectedNetwork.value.id}/predict`,
      { method: 'POST', body: { inputs: row } },
    )
    batchPredictions.value.push(result.outputs)
  }
}

async function renameNetwork(id: number, name: string) {
  loading.value = true
  try {
    await $fetch(`/api/neural-networks/${id}`, { method: 'PATCH', body: { name } })
    message.value = t('analysis.neural.renamed')
    await loadNetworks()
  } finally {
    loading.value = false
  }
}

async function deleteNetwork(id: number) {
  loading.value = true
  try {
    await $fetch(`/api/neural-networks/${id}`, { method: 'DELETE' })
    if (selectedId.value === id) selectedId.value = null
    message.value = t('analysis.neural.deleted')
    await loadNetworks()
  } finally {
    loading.value = false
  }
}

async function duplicateNetwork(id: number) {
  loading.value = true
  try {
    const copy = await $fetch<NeuralNetworkItem>(`/api/neural-networks/${id}/duplicate`, { method: 'POST' })
    selectedId.value = copy.id
    message.value = t('analysis.neural.duplicated')
    await loadNetworks()
  } finally {
    loading.value = false
  }
}

function printPage() {
  if (import.meta.client) window.print()
}

async function exportWeights(id: number) {
  const network = await $fetch<NeuralNetworkItem>(`/api/neural-networks/${id}`)
  const blob = new Blob([JSON.stringify(network, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${network.name.replace(/[^a-z0-9-]+/gi, '-') || 'network'}-weights.json`
  link.click()
  URL.revokeObjectURL(url)
}

async function importWeights(file: File) {
  const payload = JSON.parse(await file.text()) as Partial<NeuralNetworkItem> & { inputSize?: number, outputSize?: number, hiddenLayers?: number[] }
  const serialized = payload.weights ? JSON.parse(payload.weights) as { inputSize: number, outputSize: number, hiddenLayers: number[] } : payload
  const inputSize = payload.inputParamsList?.length ?? serialized.inputSize ?? 1
  const outputSize = payload.outputParamsList?.length ?? serialized.outputSize ?? 1
  let id = selectedId.value
  if (!id) {
    const created = await $fetch<NeuralNetworkItem>('/api/neural-networks', {
      method: 'POST',
      body: {
        name: payload.name || t('analysis.neural.defaultName'),
        inputParams: payload.inputParamsList ?? Array.from({ length: inputSize }, (_, index) => `input${index + 1}`),
        outputParams: payload.outputParamsList ?? Array.from({ length: outputSize }, (_, index) => `output${index + 1}`),
        hiddenLayers: payload.hiddenLayersList ?? serialized.hiddenLayers ?? [Math.max(1, Math.round((inputSize + outputSize) / 2))],
      },
    })
    id = created.id
  }
  await $fetch(`/api/neural-networks/${id}/weights`, { method: 'PUT', body: payload })
  selectedId.value = id
  message.value = t('analysis.neural.imported')
  await loadNetworks()
}

await loadNetworks()
</script>

<template>
  <div class="neural-page neural-samples-print space-y-4">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">{{ t('analysis.neural.title') }}</h1>
        <p class="text-muted-foreground">{{ t('analysis.neural.description') }}</p>
      </div>
      <button type="button" class="btn print:hidden" @click="printPage">{{ t('common.print') }}</button>
    </header>

    <p v-if="message" class="rounded border bg-muted p-3 text-sm font-medium">{{ message }}</p>

    <AnalysisNeuralNetworkLibrary
      :networks="networks"
      :selected-id="selectedId"
      :loading="loading"
      @select="selectedId = $event"
      @rename="renameNetwork"
      @delete="deleteNetwork"
      @duplicate="duplicateNetwork"
      @export="exportWeights"
      @import="importWeights"
    />

    <section v-if="selectedNetwork" class="rounded border p-3 text-sm text-muted-foreground">
      {{ t('analysis.neural.selected') }}: {{ selectedNetwork.name }} ·
      {{ selectedNetwork.inputParamsList.join(', ') }} → {{ selectedNetwork.outputParamsList.join(', ') }} ·
      {{ t('analysis.neural.samples') }} {{ selectedNetwork.samplesCount ?? 0 }} · RMSE {{ selectedNetwork.finalError?.toFixed(5) ?? '—' }}
    </section>

    <div class="grid gap-4 xl:grid-cols-2">
      <AnalysisNeuralTopologyEditor :loading="loading" @create="createNetwork" />
      <AnalysisNeuralSampleEditor
        :input-params="selectedNetwork?.inputParamsList ?? []"
        :output-params="selectedNetwork?.outputParamsList ?? []"
        :disabled="loading || !selectedNetwork"
        @add="addSamples"
      />
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <AnalysisNeuralTrainingPanel
        :disabled="loading || !selectedNetwork"
        :training="training"
        :history="rmseHistory"
        @start="trainNetwork"
        @stop="stopTraining"
      />
      <AnalysisNeuralPredictPanel
        :input-params="selectedNetwork?.inputParamsList ?? []"
        :output-params="selectedNetwork?.outputParamsList ?? []"
        :disabled="!selectedNetwork"
        :prediction="prediction"
        :batch-predictions="batchPredictions"
        @predict="predict"
        @batch-predict="batchPredict"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.card) {
  border: 1px solid hsl(var(--border, 214 32% 91%));
  border-radius: 0.75rem;
  padding: 1rem;
  background: hsl(var(--background, 0 0% 100%));
}
:deep(label) {
  display: grid;
  gap: 0.25rem;
  font-size: 0.875rem;
}
:deep(.field) {
  width: 100%;
  border: 1px solid hsl(var(--border, 214 32% 91%));
  border-radius: 0.375rem;
  background: hsl(var(--background, 0 0% 100%));
  padding: 0.5rem 0.75rem;
}
:deep(.btn),
:deep(.btn-primary),
:deep(.btn-danger) {
  border-radius: 0.375rem;
  border: 1px solid hsl(var(--border, 214 32% 91%));
  padding: 0.45rem 0.75rem;
  font-size: 0.875rem;
}
:deep(.btn-primary) {
  background: hsl(var(--primary, 222 47% 11%));
  color: hsl(var(--primary-foreground, 210 40% 98%));
}
:deep(.btn-danger) {
  color: #dc2626;
}
:deep(button:disabled) {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
