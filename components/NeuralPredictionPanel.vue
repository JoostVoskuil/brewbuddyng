<template>
  <section class="rounded border bg-background p-3 text-sm shadow-sm no-print">
    <div class="mb-2 flex items-center justify-between gap-2">
      <h3 class="font-semibold">{{ t('recipe.toolbar.neural.title') }}</h3>
      <button type="button" class="text-muted-foreground hover:text-foreground" :aria-label="t('common.close')" @click="emit('close')">×</button>
    </div>

    <p class="mb-2 text-xs text-muted-foreground">{{ t('recipe.toolbar.neural.featureHint') }}</p>
    <div class="mb-3 grid grid-cols-2 gap-1 text-xs">
      <div v-for="feature in featureVector" :key="feature.key" class="flex justify-between gap-2 rounded bg-muted/40 px-2 py-1">
        <span>{{ feature.label }}</span>
        <span class="font-mono">{{ formatValue(feature.value) }}</span>
      </div>
    </div>

    <label class="block text-xs font-medium">
      {{ t('recipe.toolbar.neural.network') }}
      <select v-model.number="selectedId" class="mt-1 w-full rounded border bg-background px-2 py-1" :disabled="loading">
        <option :value="null">{{ t('recipe.toolbar.neural.select') }}</option>
        <option v-for="network in matchingNetworks" :key="network.id" :value="network.id">
          {{ network.name }} ({{ network.inputParamsList.join(', ') }})
        </option>
      </select>
    </label>

    <div class="mt-3 flex flex-wrap gap-2">
      <button type="button" class="rounded border px-3 py-1.5 text-xs" :disabled="loading" @click="loadNetworks">
        {{ t('recipe.toolbar.neural.refresh') }}
      </button>
      <button type="button" class="rounded bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-60" :disabled="!selectedNetwork || predicting" @click="predict">
        {{ predicting ? t('common.loading') : t('recipe.toolbar.neural.predict') }}
      </button>
    </div>

    <p v-if="error" class="mt-2 text-xs text-red-700">{{ error }}</p>
    <p v-else-if="!loading && !matchingNetworks.length" class="mt-2 text-xs text-muted-foreground">
      {{ t('recipe.toolbar.neural.noMatches') }}
    </p>

    <div v-if="prediction" class="mt-3 rounded border p-2">
      <div v-for="(value, index) in prediction.outputs" :key="index" class="flex justify-between gap-3">
        <span>{{ selectedNetwork?.outputParamsList[index] || `output${index + 1}` }}</span>
        <span class="font-mono">{{ formatValue(value) }}</span>
      </div>
      <p class="mt-2 text-xs text-muted-foreground">
        {{ t('recipe.toolbar.neural.lastPredicted') }}: {{ prediction.predictedAt }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
interface RecipeFeature {
  key: string
  label: string
  value: number
  aliases?: string[]
}

interface NeuralNetworkItem {
  id: number
  name: string
  inputSize: number
  outputSize: number
  inputParamsList: string[]
  outputParamsList: string[]
  trainedAt?: string | null
  weights?: string | null
}

const props = defineProps<{
  recipeId: number | string
  featureVector: RecipeFeature[]
}>()

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

const networks = ref<NeuralNetworkItem[]>([])
const selectedId = ref<number | null>(null)
const loading = ref(false)
const predicting = ref(false)
const error = ref('')
const prediction = ref<{ outputs: number[], predictedAt: string } | null>(null)

const settingKey = computed(() => `recipe.${props.recipeId}.neural.lastNetwork`)

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

const featureLookup = computed(() => {
  const entries = new Map<string, number>()
  for (const feature of props.featureVector) {
    for (const key of [feature.key, feature.label, ...(feature.aliases ?? [])]) entries.set(normalize(key), feature.value)
  }
  return entries
})

function inputsFor(network: NeuralNetworkItem): number[] | null {
  const labelled = network.inputParamsList.map((param) => featureLookup.value.get(normalize(param)))
  if (labelled.every((value) => value != null)) return labelled as number[]
  if (network.inputSize === props.featureVector.length) return props.featureVector.map((feature) => feature.value)
  return null
}

const matchingNetworks = computed(() => networks.value.filter((network) => Boolean(network.weights) && inputsFor(network)))
const selectedNetwork = computed(() => matchingNetworks.value.find((network) => network.id === selectedId.value) ?? null)

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) < 2 && value !== 0) return value.toFixed(3)
  if (Math.abs(value) < 10) return value.toFixed(2)
  return value.toFixed(1)
}

async function loadLastSelected() {
  const settings = await $fetch<Record<string, string>>('/api/settings')
  const saved = Number(settings[settingKey.value])
  if (Number.isInteger(saved)) selectedId.value = saved
}

async function persistSelected(id: number) {
  await $fetch('/api/settings', { method: 'PUT', body: { [settingKey.value]: String(id) } })
}

async function loadNetworks() {
  loading.value = true
  error.value = ''
  try {
    networks.value = await $fetch<NeuralNetworkItem[]>('/api/neural-networks')
    if (!selectedNetwork.value) selectedId.value = matchingNetworks.value[0]?.id ?? null
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('recipe.toolbar.neural.loadFailed')
  } finally {
    loading.value = false
  }
}

async function predict() {
  const network = selectedNetwork.value
  if (!network) return
  const inputs = inputsFor(network)
  if (!inputs) return
  predicting.value = true
  error.value = ''
  try {
    const result = await $fetch<{ outputs: number[] }>(`/api/neural-networks/${network.id}/predict`, {
      method: 'POST',
      body: { inputs },
    })
    prediction.value = { outputs: result.outputs, predictedAt: new Date().toLocaleString() }
    await persistSelected(network.id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('recipe.toolbar.neural.predictFailed')
  } finally {
    predicting.value = false
  }
}

watch(selectedId, (id) => {
  prediction.value = null
  if (id != null) void persistSelected(id)
})

watch(() => props.featureVector, () => {
  prediction.value = null
}, { deep: true })

onMounted(async () => {
  await loadLastSelected().catch(() => undefined)
  await loadNetworks()
})
</script>
