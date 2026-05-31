<template>
  <div class="border rounded-lg p-4 mb-6">
    <div class="flex items-center gap-3 flex-wrap mb-3">
      <h3 class="font-semibold">{{ $t('databases.propertyChart') }}</h3>
      <select v-model="selected" class="px-3 py-1.5 border rounded-md bg-background text-sm">
        <option v-for="p in properties" :key="p.key" :value="p.key">{{ p.label }}</option>
      </select>
      <label v-if="stockKey" class="flex items-center gap-2 text-sm">
        <input v-model="inStockOnly" type="checkbox" />
        {{ $t('databases.inStockOnly') }}
      </label>
    </div>
    <BaseChart v-if="hasData" :option="option" height="360px" />
    <p v-else class="text-sm text-muted-foreground">{{ $t('databases.noChartData') }}</p>
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'

interface PropertyDef {
  key: string
  label: string
}

const props = defineProps<{
  items: Record<string, unknown>[]
  properties: PropertyDef[]
  nameKey?: string
  stockKey?: string
}>()

const selected = ref(props.properties[0]?.key ?? '')
const inStockOnly = ref(false)
const nameKey = computed(() => props.nameKey ?? 'name')

const rows = computed(() => {
  const key = selected.value
  let items = props.items
  if (props.stockKey && inStockOnly.value) {
    const sk = props.stockKey
    items = items.filter((i) => Number(i[sk] ?? 0) > 0)
  }
  return items
    .map((i) => ({
      name: String(i[nameKey.value] ?? ''),
      value: Number(i[key]),
    }))
    .filter((r) => Number.isFinite(r.value))
    .sort((a, b) => a.value - b.value)
})

const hasData = computed(() => rows.value.length > 0)

const option = computed<EChartsOption>(() => {
  const names = rows.value.map((r) => r.name)
  const values = rows.value.map((r) => r.value)
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 140, right: 30, top: 20, bottom: 40 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: names, axisLabel: { fontSize: 10 } },
    series: [{ type: 'bar', data: values }],
  }
})
</script>
