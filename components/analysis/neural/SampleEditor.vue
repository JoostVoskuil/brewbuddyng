<script setup lang="ts">
import {
  buildCsvSamples,
  parseNumericCsv,
  splitNumbers,
  type NeuralCsvSample,
} from '~/composables/useNeuralCsv'

const props = defineProps<{
  inputParams: string[]
  outputParams: string[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  add: [samples: NeuralCsvSample[]]
}>()

const { t } = useI18n()
const csv = ref('')
const trainingPercent = ref(80)
const manualInputs = ref('')
const manualOutputs = ref('')
const manualWeight = ref(1)
const manualTraining = ref(true)
const dragActive = ref(false)

const csvRows = computed(() => parseNumericCsv(csv.value))
const csvSamples = computed(() =>
  buildCsvSamples(
    csvRows.value,
    props.inputParams.length,
    props.outputParams.length,
    trainingPercent.value,
  ),
)

function addCsv() {
  if (csvSamples.value.length) emit('add', csvSamples.value)
}

function addManual() {
  emit('add', [
    {
      inputs: splitNumbers(manualInputs.value).slice(0, props.inputParams.length),
      outputs: splitNumbers(manualOutputs.value).slice(0, props.outputParams.length),
      weight: manualWeight.value,
      useForTraining: manualTraining.value,
    },
  ])
  manualInputs.value = ''
  manualOutputs.value = ''
}

async function onDrop(event: DragEvent) {
  dragActive.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  csv.value = await file.text()
}
</script>

<template>
  <section class="card space-y-3">
    <h2 class="text-lg font-semibold">{{ t('analysis.neural.addSamples') }}</h2>
    <form class="space-y-3" @submit.prevent="addManual">
      <div class="grid gap-3 sm:grid-cols-2">
        <label
          >{{ t('analysis.neural.sampleInputs')
          }}<input v-model="manualInputs" class="field" :placeholder="props.inputParams.join(', ')"
        /></label>
        <label
          >{{ t('analysis.neural.sampleOutputs')
          }}<input
            v-model="manualOutputs"
            class="field"
            :placeholder="props.outputParams.join(', ')"
        /></label>
        <label
          >{{ t('analysis.neural.weight')
          }}<input v-model.number="manualWeight" type="number" min="0.01" step="0.01" class="field"
        /></label>
        <label class="flex items-center gap-2 pt-6"
          ><input v-model="manualTraining" type="checkbox" />
          {{ t('analysis.neural.trainingSample') }}</label
        >
      </div>
      <button class="btn" :disabled="props.disabled">{{ t('analysis.neural.addManual') }}</button>
    </form>
    <div
      class="rounded border border-dashed p-3"
      :class="dragActive ? 'border-primary bg-primary/5' : ''"
      @dragover.prevent="dragActive = true"
      @dragleave.prevent="dragActive = false"
      @drop.prevent="onDrop"
    >
      <label>{{ t('analysis.neural.csv') }}<textarea v-model="csv" rows="6" class="field" /></label>
      <div class="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <label class="flex items-center gap-2"
          >{{ t('analysis.neural.trainingSplit')
          }}<input v-model.number="trainingPercent" type="range" min="0" max="100" />
          {{ trainingPercent }}%</label
        >
        <span class="text-muted-foreground">{{
          t('analysis.neural.validationSamples', {
            count: csvSamples.filter((sample) => !sample.useForTraining).length,
          })
        }}</span>
      </div>
    </div>
    <button class="btn-primary" :disabled="props.disabled || !csvSamples.length" @click="addCsv">
      {{ t('analysis.neural.addButton') }} ({{ csvSamples.length }})
    </button>
  </section>
</template>
