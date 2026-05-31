<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h1 class="text-2xl font-bold">{{ $t('analysis.title') }}</h1>
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/analysis/styles"
          class="text-sm border rounded-md px-3 py-1.5 hover:bg-accent print:hidden"
        >
          {{ $t('analysis.styleAnalysis') }}
        </NuxtLink>
        <NuxtLink
          to="/analysis/properties"
          class="text-sm border rounded-md px-3 py-1.5 hover:bg-accent print:hidden"
        >
          {{ $t('analysis.properties.title') }}
        </NuxtLink>
        <button
          class="text-sm border rounded-md px-3 py-1.5 hover:bg-accent print:hidden"
          @click="printAnalysis"
        >
          {{ $t('common.print') }}
        </button>
      </div>
    </div>
    <p class="text-muted-foreground mb-6">{{ $t('analysis.subtitle') }}</p>

    <!-- Tabs -->
    <div class="border-b mb-6 print:hidden">
      <nav class="flex gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === tab.key
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          ]"
          @click="activeTab = tab.key"
        >
          {{ $t(tab.label) }}
        </button>
      </nav>
    </div>

    <p v-if="!brews.length" class="text-muted-foreground text-sm">{{ $t('analysis.noData') }}</p>

    <!-- Overview tab -->
    <div v-else-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="border rounded-lg p-6">
        <h3 class="font-semibold mb-4">{{ $t('analysis.efficiency') }}</h3>
        <BaseChart :option="efficiencyOption" height="280px" />
      </div>
      <div class="border rounded-lg p-6">
        <h3 class="font-semibold mb-4">{{ $t('analysis.statistics') }}</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>{{ $t('analysis.totalBrews') }}:</span
            ><span class="font-medium">{{ brews.length }}</span>
          </div>
          <div class="flex justify-between">
            <span>{{ $t('analysis.avgEfficiency') }}:</span
            ><span class="font-medium">{{ avgEfficiency.toFixed(1) }}%</span>
          </div>
          <div class="flex justify-between">
            <span>{{ $t('analysis.avgOG') }}:</span
            ><span class="font-mono">{{ avgOG.toFixed(3) }}</span>
          </div>
          <div class="flex justify-between">
            <span>{{ $t('analysis.avgRating') }}:</span
            ><span class="font-medium">{{ avgRating.toFixed(1) }}/10</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Histogram tab -->
    <div v-else-if="activeTab === 'histogram'" class="space-y-4">
      <div class="flex flex-wrap items-end gap-4 print:hidden">
        <label class="flex flex-col text-sm">
          <span class="mb-1 text-muted-foreground">{{ $t('analysis.parameter') }}</span>
          <select v-model="histParam" class="border rounded-md px-3 py-2 bg-background">
            <option v-for="p in numericParams" :key="p.key" :value="p.key">
              {{ $t(p.label) }}
            </option>
          </select>
        </label>
        <label class="flex flex-col text-sm">
          <span class="mb-1 text-muted-foreground">{{ $t('analysis.intervals') }}</span>
          <input
            v-model.number="histIntervals"
            type="number"
            min="1"
            max="50"
            class="border rounded-md px-3 py-2 bg-background w-28"
          />
        </label>
        <label class="flex items-center gap-2 text-sm pb-2">
          <input v-model="histPercentage" type="checkbox" />
          <span>{{ $t('analysis.showPercentage') }}</span>
        </label>
      </div>
      <div class="border rounded-lg p-6">
        <p v-if="!histogramBins.length" class="text-muted-foreground text-sm">
          {{ $t('analysis.notEnoughData') }}
        </p>
        <BaseChart v-else :option="histogramOption" height="360px" />
      </div>
    </div>

    <!-- X-Y graph tab -->
    <div v-else-if="activeTab === 'xy'" class="space-y-4">
      <div class="flex flex-wrap items-end gap-4 print:hidden">
        <label class="flex flex-col text-sm">
          <span class="mb-1 text-muted-foreground">{{ $t('analysis.xAxis') }}</span>
          <select v-model="xParam" class="border rounded-md px-3 py-2 bg-background">
            <option v-for="p in numericParams" :key="p.key" :value="p.key">
              {{ $t(p.label) }}
            </option>
          </select>
        </label>
        <label class="flex flex-col text-sm">
          <span class="mb-1 text-muted-foreground">{{ $t('analysis.yAxis') }}</span>
          <select v-model="yParam" class="border rounded-md px-3 py-2 bg-background">
            <option v-for="p in numericParams" :key="p.key" :value="p.key">
              {{ $t(p.label) }}
            </option>
          </select>
        </label>
        <label class="flex flex-col text-sm">
          <span class="mb-1 text-muted-foreground">{{ $t('analysis.fitType') }}</span>
          <select v-model="fitTypeRef" class="border rounded-md px-3 py-2 bg-background">
            <option value="linear">{{ $t('analysis.fitLinear') }}</option>
            <option value="polynomial">{{ $t('analysis.fitPolynomial') }}</option>
            <option value="exponential">{{ $t('analysis.fitExponential') }}</option>
            <option value="power">{{ $t('analysis.fitPower') }}</option>
          </select>
        </label>
        <label class="flex flex-col text-sm">
          <span class="mb-1 text-muted-foreground">{{ $t('analysis.equipmentFilter') }}</span>
          <select v-model="selectedEquipmentId" class="border rounded-md px-3 py-2 bg-background">
            <option value="all">{{ $t('analysis.allEquipment') }}</option>
            <option v-for="item in equipmentList" :key="item.id" :value="String(item.id)">
              {{ item.name }}
            </option>
          </select>
        </label>
        <label class="flex items-center gap-2 text-sm pb-2">
          <input v-model="showPointLabels" type="checkbox" />
          <span>{{ $t('analysis.showPointLabels') }}</span>
        </label>
      </div>
      <div class="border rounded-lg p-4 print:hidden">
        <h3 class="font-semibold mb-3">{{ $t('analysis.visibleBrews') }}</h3>
        <p v-if="!equipmentFilteredBrews.length" class="text-muted-foreground text-sm">
          {{ $t('analysis.noMatchingBrews') }}
        </p>
        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-auto pr-1"
        >
          <label
            v-for="brew in equipmentFilteredBrews"
            :key="brew.id"
            class="flex items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              :checked="isBrewVisible(brew)"
              @change="setBrewVisibilityFromEvent(brew, $event)"
            />
            <span>{{ brew.name }}</span>
          </label>
        </div>
      </div>
      <div class="border rounded-lg p-6">
        <p v-if="xyPoints.length < 2" class="text-muted-foreground text-sm">
          {{ $t('analysis.notEnoughData') }}
        </p>
        <template v-else>
          <BaseChart :option="xyOption" height="360px" />
          <div v-if="fit" class="mt-4 text-sm border-t pt-3">
            <div class="font-semibold mb-1">{{ $t('analysis.fitResult') }}</div>
            <div class="font-mono">{{ fit.equation }}</div>
            <div>r² = {{ fit.r2.toFixed(4) }}</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Brew, Equipment, Recipe } from '~/types'
import type { EChartsOption } from 'echarts'
import { fitCurve, predict, histogram, type FitType } from '~/server/utils/calculations/regression'

const { t } = useI18n()

const brews = ref<Brew[]>([])
const recipes = ref<Recipe[]>([])
const equipmentList = ref<Equipment[]>([])

const tabs = [
  { key: 'overview', label: 'analysis.overview' },
  { key: 'histogram', label: 'analysis.histogram' },
  { key: 'xy', label: 'analysis.xyGraph' },
]
const activeTab = ref('overview')

const numericParams = [
  { key: 'og', label: 'analysis.paramOG' },
  { key: 'fg', label: 'analysis.paramFG' },
  { key: 'abv', label: 'analysis.paramABV' },
  { key: 'efficiency', label: 'analysis.paramEfficiency' },
  { key: 'attenuation', label: 'analysis.paramAttenuation' },
  { key: 'rating', label: 'analysis.paramRating' },
  { key: 'carbonation', label: 'analysis.paramCarbonation' },
]

/** Extract a numeric parameter value from a brew, or null when not valid. */
function paramValue(brew: Brew, key: string): number | null {
  const og = brew.ogActual ?? 0
  const fg = brew.fgActual ?? 0
  switch (key) {
    case 'og':
      return og > 1 ? og : null
    case 'fg':
      return fg > 1 ? fg : null
    case 'abv':
      return og > 1 && fg > 0 && og > fg ? (og - fg) * 131.25 : null
    case 'efficiency': {
      const e = brew.efficiencyActual ?? 0
      return e > 0 ? e : null
    }
    case 'attenuation':
      return og > 1 && fg > 0 && og > fg ? ((og - fg) / (og - 1)) * 100 : null
    case 'rating': {
      const r = brew.tasteRating ?? 0
      return r > 0 ? r : null
    }
    case 'carbonation': {
      const c = brew.carbonationVolume ?? 0
      return c > 0 ? c : null
    }
    default:
      return null
  }
}

function paramLabel(key: string): string {
  const p = numericParams.find((x) => x.key === key)
  return p ? t(p.label) : key
}

// --- Overview: efficiency over time ---
const efficiencyOption = computed<EChartsOption>(() => {
  const valid = brews.value.filter((b) => (b.efficiencyActual ?? 0) > 0)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 16, bottom: 60 },
    xAxis: {
      type: 'category',
      data: valid.map((b) => b.name),
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: { type: 'value', name: '%' },
    series: [
      {
        type: 'bar',
        data: valid.map((b) => Number((b.efficiencyActual ?? 0).toFixed(1))),
        itemStyle: { color: '#d97706' },
      },
    ],
  }
})

const avgEfficiency = computed(() => {
  const valid = brews.value.filter((b) => (b.efficiencyActual ?? 0) > 0)
  return valid.length ? valid.reduce((s, b) => s + (b.efficiencyActual ?? 0), 0) / valid.length : 0
})
const avgOG = computed(() => {
  const valid = brews.value.filter((b) => (b.ogActual ?? 0) > 1)
  return valid.length ? valid.reduce((s, b) => s + (b.ogActual ?? 0), 0) / valid.length : 0
})
const avgRating = computed(() => {
  const valid = brews.value.filter((b) => (b.tasteRating ?? 0) > 0)
  return valid.length ? valid.reduce((s, b) => s + (b.tasteRating ?? 0), 0) / valid.length : 0
})

// --- Histogram ---
const histParam = ref('og')
const histIntervals = ref(8)
const histPercentage = ref(false)

const histogramBins = computed(() => {
  const values = brews.value
    .map((b) => paramValue(b, histParam.value))
    .filter((v): v is number => v !== null)
  return histogram(values, histIntervals.value)
})

const histogramOption = computed<EChartsOption>(() => {
  const bins = histogramBins.value
  return {
    title: {
      text: t('analysis.histogramOf', { param: paramLabel(histParam.value) }),
      textStyle: { fontSize: 14 },
    },
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 16, top: 48, bottom: 40 },
    xAxis: {
      type: 'category',
      data: bins.map((b) => `${b.start.toFixed(2)}–${b.end.toFixed(2)}`),
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: histPercentage.value ? '%' : t('analysis.count'),
    },
    series: [
      {
        type: 'bar',
        data: bins.map((b) => (histPercentage.value ? Number(b.percentage.toFixed(1)) : b.count)),
        itemStyle: { color: '#d97706' },
      },
    ],
  }
})

// --- X-Y graph with curve fit ---
const xParam = ref('og')
const yParam = ref('abv')
const fitTypeRef = ref<FitType>('linear')
const selectedEquipmentId = ref('all')
const hiddenBrewIds = ref<number[]>([])
const showPointLabels = ref(true)

const XY_EQUIPMENT_KEY = 'brewbuddy.analysis.xy.equipmentId'
const XY_HIDDEN_BREWS_KEY = 'brewbuddy.analysis.xy.hiddenBrewIds'
const XY_LABELS_KEY = 'brewbuddy.analysis.xy.showPointLabels'

const recipeEquipmentById = computed(
  () => new Map(recipes.value.map((recipe) => [recipe.id, recipe.equipmentId ?? null])),
)

function brewEquipmentId(brew: Brew): number | null {
  return brew.recipeId == null ? null : (recipeEquipmentById.value.get(brew.recipeId) ?? null)
}

const equipmentFilteredBrews = computed(() => {
  if (selectedEquipmentId.value === 'all') return brews.value
  const selectedId = Number(selectedEquipmentId.value)
  return brews.value.filter((brew) => brewEquipmentId(brew) === selectedId)
})

function isBrewVisible(brew: Brew): boolean {
  return !hiddenBrewIds.value.includes(brew.id)
}

function setBrewVisible(brew: Brew, visible: boolean) {
  hiddenBrewIds.value = visible
    ? hiddenBrewIds.value.filter((id) => id !== brew.id)
    : Array.from(new Set([...hiddenBrewIds.value, brew.id]))
}

function setBrewVisibilityFromEvent(brew: Brew, event: Event) {
  setBrewVisible(brew, (event.target as HTMLInputElement).checked)
}

const xyPoints = computed(() => {
  const pts: { x: number; y: number; name: string }[] = []
  for (const b of equipmentFilteredBrews.value) {
    if (!isBrewVisible(b)) continue
    const x = paramValue(b, xParam.value)
    const y = paramValue(b, yParam.value)
    if (x !== null && y !== null) pts.push({ x, y, name: b.name })
  }
  return pts
})

const fit = computed(() =>
  fitCurve(
    xyPoints.value.map((p) => ({ x: p.x, y: p.y })),
    fitTypeRef.value,
  ),
)

const xyOption = computed<EChartsOption>(() => {
  const pts = xyPoints.value

  // Build the fit line data (empty when no usable fit).
  const fitLine: number[][] = []
  const f = fit.value
  if (f && pts.length >= 2) {
    const xs = pts.map((p) => p.x)
    const min = Math.min(...xs)
    const max = Math.max(...xs)
    const steps = 40
    for (let i = 0; i <= steps; i++) {
      const x = min + ((max - min) * i) / steps
      fitLine.push([x, predict(f, fitTypeRef.value, x)])
    }
  }

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const item = params as { name?: string; value?: number[] }
        const [x, y] = item.value ?? []
        return `${item.name ?? ''}<br/>${paramLabel(xParam.value)}: ${x}<br/>${paramLabel(yParam.value)}: ${y}`
      },
    },
    grid: { left: 50, right: 24, top: 24, bottom: 50 },
    xAxis: { type: 'value', name: paramLabel(xParam.value), scale: true },
    yAxis: { type: 'value', name: paramLabel(yParam.value), scale: true },
    series: [
      {
        type: 'scatter',
        data: pts.map((p) => ({ value: [p.x, p.y], name: p.name })),
        itemStyle: { color: '#d97706' },
        symbolSize: 10,
        label: {
          show: showPointLabels.value,
          formatter: (params: unknown) => (params as { name?: string }).name ?? '',
          position: 'right',
        },
      },
      {
        type: 'line',
        data: fitLine,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#1d4ed8', width: 2 },
      },
    ],
  }
})

function printAnalysis() {
  if (import.meta.client) window.print()
}

onMounted(async () => {
  selectedEquipmentId.value = localStorage.getItem(XY_EQUIPMENT_KEY) ?? 'all'
  showPointLabels.value = localStorage.getItem(XY_LABELS_KEY) !== 'false'
  try {
    hiddenBrewIds.value = JSON.parse(localStorage.getItem(XY_HIDDEN_BREWS_KEY) ?? '[]')
  } catch {
    hiddenBrewIds.value = []
  }

  const [loadedBrews, loadedRecipes, loadedEquipment] = await Promise.all([
    $fetch<Brew[]>('/api/brews'),
    $fetch<Recipe[]>('/api/recipes'),
    $fetch<Equipment[]>('/api/equipment'),
  ])
  brews.value = loadedBrews
  recipes.value = loadedRecipes
  equipmentList.value = loadedEquipment
})

watch(selectedEquipmentId, (value) => {
  if (import.meta.client) localStorage.setItem(XY_EQUIPMENT_KEY, value)
})

watch(hiddenBrewIds, (value) => {
  if (import.meta.client) localStorage.setItem(XY_HIDDEN_BREWS_KEY, JSON.stringify(value))
})

watch(showPointLabels, (value) => {
  if (import.meta.client) localStorage.setItem(XY_LABELS_KEY, value ? 'true' : 'false')
})
</script>
