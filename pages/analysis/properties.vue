<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h1 class="text-2xl font-bold">{{ $t('analysis.properties.title') }}</h1>
      <NuxtLink to="/analysis" class="px-4 py-2 border rounded-md text-sm print:hidden">{{
        $t('common.back')
      }}</NuxtLink>
    </div>
    <p class="text-muted-foreground mb-6">{{ $t('analysis.properties.subtitle') }}</p>

    <div class="flex flex-wrap items-end gap-4 mb-6 print:hidden">
      <label class="flex flex-col text-sm">
        <span class="mb-1 text-muted-foreground">{{ $t('analysis.properties.dataset') }}</span>
        <select v-model="selectedKind" class="border rounded-md px-3 py-2 bg-background">
          <option v-for="dataset in datasets" :key="dataset.kind" :value="dataset.kind">
            {{ $t(dataset.labelKey) }}
          </option>
        </select>
      </label>
      <label class="flex flex-col text-sm">
        <span class="mb-1 text-muted-foreground">{{ $t('analysis.properties.property') }}</span>
        <select v-model="xKey" class="border rounded-md px-3 py-2 bg-background">
          <option
            v-for="property in currentDataset.properties"
            :key="property.key"
            :value="property.key"
          >
            {{ property.label }}
          </option>
        </select>
      </label>
      <label class="flex flex-col text-sm">
        <span class="mb-1 text-muted-foreground">{{ $t('analysis.properties.secondAxis') }}</span>
        <select v-model="yKey" class="border rounded-md px-3 py-2 bg-background">
          <option value="">{{ $t('analysis.properties.histogram') }}</option>
          <option v-for="property in yProperties" :key="property.key" :value="property.key">
            {{ property.label }}
          </option>
        </select>
      </label>
      <label v-if="!yKey" class="flex flex-col text-sm">
        <span class="mb-1 text-muted-foreground">{{ $t('analysis.intervals') }}</span>
        <input
          v-model.number="bins"
          type="number"
          min="1"
          max="50"
          class="border rounded-md px-3 py-2 bg-background w-28"
        />
      </label>
    </div>

    <div v-if="pending" class="text-sm text-muted-foreground">{{ $t('common.loading') }}</div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-6">
      <div class="border rounded-lg p-5">
        <PropertyGraph
          :rows="graphRows"
          :x-property="xProperty"
          :y-property="yProperty"
          :bins="bins"
          @drill="drillToDatabase"
        />
      </div>
      <aside class="border rounded-lg p-4 h-fit print:hidden">
        <h2 class="font-semibold mb-3">{{ $t('analysis.properties.points') }}</h2>
        <p v-if="!graphRows.length" class="text-sm text-muted-foreground">
          {{ $t('analysis.properties.noData') }}
        </p>
        <button
          v-for="row in graphRows"
          v-else
          :key="row.id"
          class="block w-full text-left text-sm px-2 py-1 rounded hover:bg-muted"
          @click="drillToDatabase(row.id)"
        >
          {{ row.name }}
        </button>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropertyDef, PropertyGraphRow } from '~/components/analysis/PropertyGraph.vue'

type DatasetKind = 'fermentables' | 'hops' | 'yeasts' | 'miscs' | 'waters' | 'styles'

interface DatasetConfig {
  kind: DatasetKind
  endpoint: string
  labelKey: string
  properties: PropertyDef[]
}

const { t } = useI18n()
const router = useRouter()
const pending = ref(true)
const bins = ref(8)
const selectedKind = ref<DatasetKind>('fermentables')
const xKey = ref('color')
const yKey = ref('')
const data = reactive<Record<DatasetKind, Record<string, unknown>[]>>({
  fermentables: [],
  hops: [],
  yeasts: [],
  miscs: [],
  waters: [],
  styles: [],
})

const datasets = computed<DatasetConfig[]>(() => [
  {
    kind: 'fermentables',
    endpoint: '/api/fermentables',
    labelKey: 'inventory.fermentables',
    properties: [
      { key: 'color', label: t('databases.colorEBC'), unit: 'EBC' },
      { key: 'yield', label: t('databases.yield'), unit: '%' },
      { key: 'moisture', label: t('databases.moisture'), unit: '%' },
      { key: 'protein', label: t('analysis.properties.protein'), unit: '%' },
      { key: 'diastaticPower', label: t('analysis.properties.diastaticPower') },
    ],
  },
  {
    kind: 'hops',
    endpoint: '/api/hops',
    labelKey: 'inventory.hops',
    properties: [
      { key: 'alpha', label: t('analysis.properties.alpha'), unit: '%' },
      { key: 'beta', label: t('analysis.properties.beta'), unit: '%' },
      { key: 'hsi', label: t('analysis.properties.hsi'), unit: '%' },
      { key: 'cohumulone', label: t('analysis.properties.cohumulone'), unit: '%' },
      { key: 'myrcene', label: t('analysis.properties.myrcene'), unit: '%' },
      { key: 'totalOil', label: t('analysis.properties.totalOil'), unit: 'ml/100g' },
    ],
  },
  {
    kind: 'yeasts',
    endpoint: '/api/yeasts',
    labelKey: 'inventory.yeasts',
    properties: [
      { key: 'attenuation', label: t('analysis.properties.attenuation'), unit: '%' },
      { key: 'minTemperature', label: t('analysis.properties.minTemperature'), unit: '°C' },
      { key: 'maxTemperature', label: t('analysis.properties.maxTemperature'), unit: '°C' },
    ],
  },
  {
    kind: 'miscs',
    endpoint: '/api/miscs',
    labelKey: 'inventory.miscs',
    properties: [
      { key: 'inventory', label: t('inventory.inStock') },
      { key: 'cost', label: t('inventory.cost') },
    ],
  },
  {
    kind: 'waters',
    endpoint: '/api/waters',
    labelKey: 'inventory.waters',
    properties: [
      { key: 'calcium', label: 'Ca', unit: 'mg/L' },
      { key: 'magnesium', label: 'Mg', unit: 'mg/L' },
      { key: 'sodium', label: 'Na', unit: 'mg/L' },
      { key: 'sulfate', label: 'SO₄', unit: 'mg/L' },
      { key: 'chloride', label: 'Cl', unit: 'mg/L' },
      { key: 'bicarbonate', label: 'HCO₃', unit: 'mg/L' },
      { key: 'ph', label: 'pH' },
    ],
  },
  {
    kind: 'styles',
    endpoint: '/api/styles',
    labelKey: 'analysis.properties.styles',
    properties: [
      { key: 'ibuMid', label: t('analysis.properties.bjcpIbuRange'), unit: 'IBU' },
      { key: 'ogMid', label: 'OG' },
      { key: 'fgMid', label: 'FG' },
      { key: 'abvMid', label: 'ABV', unit: '%' },
      { key: 'colorMid', label: t('recipe.color'), unit: 'SRM' },
    ],
  },
])

const currentDataset = computed(
  () => datasets.value.find((dataset) => dataset.kind === selectedKind.value) ?? datasets.value[0]!,
)
const xProperty = computed(
  () =>
    currentDataset.value.properties.find((property) => property.key === xKey.value) ??
    currentDataset.value.properties[0]!,
)
const yProperties = computed(() =>
  currentDataset.value.properties.filter((property) => property.key !== xKey.value),
)
const yProperty = computed(
  () => currentDataset.value.properties.find((property) => property.key === yKey.value) ?? null,
)

const graphRows = computed<PropertyGraphRow[]>(() =>
  data[selectedKind.value]
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name ?? ''),
      values: propertyValues(item),
    }))
    .filter((row) => row.name),
)

function midpoint(item: Record<string, unknown>, minKey: string, maxKey: string): number | null {
  const min = Number(item[minKey])
  const max = Number(item[maxKey])
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  return (min + max) / 2
}

function propertyValues(item: Record<string, unknown>): Record<string, number | null> {
  return {
    color: numeric(item.color),
    yield: numeric(item.yield),
    moisture: numeric(item.moisture),
    protein: numeric(item.protein),
    diastaticPower: numeric(item.diastaticPower),
    alpha: numeric(item.alpha),
    beta: numeric(item.beta),
    hsi: numeric(item.hsi),
    cohumulone: numeric(item.cohumulone),
    myrcene: numeric(item.myrcene),
    totalOil: numeric(item.totalOil),
    attenuation: numeric(item.attenuation),
    minTemperature: numeric(item.minTemperature),
    maxTemperature: numeric(item.maxTemperature),
    inventory: numeric(item.inventory),
    cost: numeric(item.cost),
    calcium: numeric(item.calcium),
    magnesium: numeric(item.magnesium),
    sodium: numeric(item.sodium),
    sulfate: numeric(item.sulfate),
    chloride: numeric(item.chloride),
    bicarbonate: numeric(item.bicarbonate),
    ph: numeric(item.ph),
    ibuMid: midpoint(item, 'ibuMin', 'ibuMax'),
    ogMid: midpoint(item, 'ogMin', 'ogMax'),
    fgMid: midpoint(item, 'fgMin', 'fgMax'),
    abvMid: midpoint(item, 'abvMin', 'abvMax'),
    colorMid: midpoint(item, 'colorMin', 'colorMax'),
  }
}

function numeric(value: unknown): number | null {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function drillToDatabase(id: number) {
  router.push({ path: `/databases/${selectedKind.value}`, query: { focus: String(id) } })
}

watch(currentDataset, (dataset) => {
  if (!dataset.properties.some((property) => property.key === xKey.value)) {
    xKey.value = dataset.properties[0]?.key ?? ''
  }
  if (!dataset.properties.some((property) => property.key === yKey.value)) yKey.value = ''
})

watch(xKey, () => {
  if (yKey.value === xKey.value) yKey.value = ''
})

onMounted(async () => {
  pending.value = true
  const loaded = await Promise.all(
    datasets.value.map((dataset) => $fetch<Record<string, unknown>[]>(dataset.endpoint)),
  )
  datasets.value.forEach((dataset, index) => {
    data[dataset.kind] = loaded[index] ?? []
  })
  pending.value = false
})
</script>
