<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t('analysis.styleAnalysis') }}</h1>
      <NuxtLink to="/analysis" class="px-4 py-2 border rounded-md text-sm">{{
        $t('common.back')
      }}</NuxtLink>
    </div>

    <div v-if="!stats.length" class="text-center py-12 text-muted-foreground">
      {{ $t('analysis.noData') }}
    </div>

    <template v-else>
      <div class="mb-4">
        <select
          v-model.number="selectedId"
          class="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option v-for="s in stats" :key="s.styleId" :value="s.styleId">
            {{ s.styleName }} ({{ s.count }})
          </option>
        </select>
      </div>

      <div v-if="current" class="space-y-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div v-for="m in metricCards" :key="m.label" class="border rounded-lg p-3">
            <div class="text-xs text-muted-foreground">{{ m.label }}</div>
            <div class="font-mono font-semibold">{{ m.avg }}</div>
            <div class="text-xs text-muted-foreground">{{ m.min }} – {{ m.max }}</div>
          </div>
        </div>

        <div class="border rounded-lg p-4">
          <h3 class="font-semibold mb-3">{{ $t('recipe.fermentables') }}</h3>
          <BaseChart v-if="current.fermentables.length" :option="fermChart" height="360px" />
          <p v-else class="text-sm text-muted-foreground">{{ $t('databases.noChartData') }}</p>
        </div>

        <div class="border rounded-lg p-4">
          <h3 class="font-semibold mb-3">{{ $t('recipe.hops') }}</h3>
          <BaseChart v-if="current.hops.length" :option="hopChart" height="360px" />
          <p v-else class="text-sm text-muted-foreground">{{ $t('databases.noChartData') }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'

interface NumStat {
  avg: number
  min: number
  max: number
}
interface IngredientAgg {
  name: string
  presence: number
  avgPercent: number
}
interface StyleStat {
  styleId: number
  styleName: string
  count: number
  og: NumStat
  ibu: NumStat
  color: NumStat
  abv: NumStat
  fermentables: IngredientAgg[]
  hops: IngredientAgg[]
}

const { t } = useI18n()
const stats = ref<StyleStat[]>([])
const selectedId = ref<number | null>(null)

const current = computed(() => stats.value.find((s) => s.styleId === selectedId.value) ?? null)

const metricCards = computed(() => {
  const c = current.value
  if (!c) return []
  return [
    { label: 'OG', avg: c.og.avg.toFixed(3), min: c.og.min.toFixed(3), max: c.og.max.toFixed(3) },
    {
      label: 'IBU',
      avg: c.ibu.avg.toFixed(0),
      min: c.ibu.min.toFixed(0),
      max: c.ibu.max.toFixed(0),
    },
    {
      label: `${t('recipe.color')} (EBC)`,
      avg: c.color.avg.toFixed(0),
      min: c.color.min.toFixed(0),
      max: c.color.max.toFixed(0),
    },
    {
      label: 'ABV',
      avg: `${c.abv.avg.toFixed(1)}%`,
      min: c.abv.min.toFixed(1),
      max: c.abv.max.toFixed(1),
    },
  ]
})

function ingredientChart(items: IngredientAgg[]): EChartsOption {
  const top = items.slice(0, 15).reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: [t('analysis.presence'), t('analysis.avgGristPercent')] },
    grid: { left: 150, right: 30, top: 40, bottom: 40 },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: top.map((i) => i.name), axisLabel: { fontSize: 10 } },
    series: [
      {
        name: t('analysis.presence'),
        type: 'bar',
        data: top.map((i) => Math.round(i.presence * 10) / 10),
        itemStyle: { color: '#22c55e' },
      },
      {
        name: t('analysis.avgGristPercent'),
        type: 'bar',
        data: top.map((i) => Math.round(i.avgPercent * 10) / 10),
        itemStyle: { color: '#3b82f6' },
      },
    ],
  }
}

const fermChart = computed<EChartsOption>(() => ingredientChart(current.value?.fermentables ?? []))
const hopChart = computed<EChartsOption>(() => ingredientChart(current.value?.hops ?? []))

onMounted(async () => {
  stats.value = await $fetch<StyleStat[]>('/api/analysis/style-stats')
  if (stats.value.length) selectedId.value = stats.value[0]!.styleId
})
</script>
