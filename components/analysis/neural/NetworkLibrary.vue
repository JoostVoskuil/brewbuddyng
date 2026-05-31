<script setup lang="ts">
interface NeuralNetworkItem {
  id: number
  name: string
  inputSize: number
  outputSize: number
  hiddenLayersList: number[]
  samplesCount?: number
  finalError?: number | null
}

const props = defineProps<{
  networks: NeuralNetworkItem[]
  selectedId: number | null
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
  rename: [id: number, name: string]
  delete: [id: number]
  duplicate: [id: number]
  export: [id: number]
  import: [file: File]
}>()

const { t } = useI18n()
const fileInput = ref<HTMLInputElement | null>(null)
const names = reactive<Record<number, string>>({})

watch(
  () => props.networks,
  (networks) => {
    for (const network of networks) names[network.id] = network.name
  },
  { immediate: true },
)

function onImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('import', file)
  input.value = ''
}
</script>

<template>
  <section class="card space-y-3">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">{{ t('analysis.neural.networks') }}</h2>
      <div class="flex gap-2">
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          class="hidden"
          @change="onImport"
        />
        <button class="btn" type="button" @click="fileInput?.click()">
          {{ t('analysis.neural.importWeights') }}
        </button>
      </div>
    </div>
    <p v-if="!props.networks.length" class="text-sm text-muted-foreground">
      {{ t('analysis.neural.noNetworks') }}
    </p>
    <div
      v-for="network in props.networks"
      :key="network.id"
      class="rounded border p-3"
      :class="network.id === props.selectedId ? 'border-primary bg-primary/5' : ''"
    >
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="font-medium hover:underline"
          @click="emit('select', network.id)"
        >
          {{ network.name }}
        </button>
        <span class="text-xs text-muted-foreground"
          >{{ network.inputSize }}→{{ network.hiddenLayersList.join('-') }}→{{
            network.outputSize
          }}</span
        >
        <span class="text-xs text-muted-foreground"
          >{{ t('analysis.neural.samples') }} {{ network.samplesCount ?? 0 }}</span
        >
        <span class="text-xs text-muted-foreground"
          >RMSE {{ network.finalError?.toFixed(5) ?? '—' }}</span
        >
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        <input v-model="names[network.id]" class="field max-w-60" />
        <button
          class="btn"
          :disabled="props.loading"
          @click="emit('rename', network.id, names[network.id] || network.name)"
        >
          {{ t('analysis.neural.rename') }}
        </button>
        <button class="btn" :disabled="props.loading" @click="emit('duplicate', network.id)">
          {{ t('analysis.neural.duplicate') }}
        </button>
        <button class="btn" :disabled="props.loading" @click="emit('export', network.id)">
          {{ t('analysis.neural.exportWeights') }}
        </button>
        <button class="btn-danger" :disabled="props.loading" @click="emit('delete', network.id)">
          {{ t('analysis.neural.delete') }}
        </button>
      </div>
    </div>
  </section>
</template>
