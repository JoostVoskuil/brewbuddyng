<template>
  <div class="space-y-3">
    <p v-if="!points.length" class="text-sm text-muted-foreground">
      {{ $t('analysis.properties.noData') }}
    </p>
    <VChart
      v-else
      :option="option"
      :autoresize="true"
      class="w-full"
      style="height: 380px"
      @click="handleClick"
    />
  </div>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import { histogram } from '~/server/utils/calculations/regression'

use([CanvasRenderer, BarChart, ScatterChart, GridComponent, TooltipComponent, TitleComponent])

export interface PropertyDef {
  key: string
  label: string
  unit?: string
}

export interface PropertyGraphRow {
  id: number
  name: string
  values: Record<string, number | null | undefined>
}

const props = defineProps<{
  rows: PropertyGraphRow[]
  xProperty: PropertyDef
  yProperty?: PropertyDef | null
  bins: number
}>()

const emit = defineEmits<{ drill: [id: number] }>()
const { t } = useI18n()

const points = computed(() =>
  props.rows
    .map((row) => ({
      id: row.id,
      name: row.name,
      x: Number(row.values[props.xProperty.key]),
      y: props.yProperty ? Number(row.values[props.yProperty.key]) : null,
    }))
    .filter((row) => Number.isFinite(row.x) && (!props.yProperty || Number.isFinite(row.y))),
)

const option = computed<EChartsOption>(() => {
  if (props.yProperty) {
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const item = params as { name?: string; value?: number[] }
          const [x, y] = item.value ?? []
          return `${item.name ?? ''}<br/>${axisLabel(props.xProperty)}: ${formatValue(x)}<br/>${axisLabel(props.yProperty!)}: ${formatValue(y)}`
        },
      },
      grid: { left: 56, right: 24, top: 24, bottom: 56 },
      xAxis: { type: 'value', name: axisLabel(props.xProperty), scale: true },
      yAxis: { type: 'value', name: axisLabel(props.yProperty), scale: true },
      series: [
        {
          type: 'scatter',
          data: points.value.map((point) => ({
            name: point.name,
            value: [point.x, point.y],
            id: point.id,
          })),
          symbolSize: 11,
          itemStyle: { color: '#d97706' },
        },
      ],
    }
  }

  const bins = histogram(
    points.value.map((point) => point.x),
    props.bins,
  )
  return {
    title: {
      text: t('analysis.properties.histogramTitle', { property: axisLabel(props.xProperty) }),
      textStyle: { fontSize: 14 },
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 50, right: 20, top: 48, bottom: 60 },
    xAxis: {
      type: 'category',
      data: bins.map((bin) => `${formatValue(bin.start)}–${formatValue(bin.end)}`),
      axisLabel: { rotate: 35, fontSize: 10 },
    },
    yAxis: { type: 'value', name: t('analysis.count') },
    series: [{ type: 'bar', data: bins.map((bin) => bin.count), itemStyle: { color: '#d97706' } }],
  }
})

function axisLabel(property: PropertyDef): string {
  return property.unit ? `${property.label} (${property.unit})` : property.label
}

function formatValue(value: number | undefined): string {
  return Number.isFinite(value) ? Number(value).toFixed(2) : ''
}

function handleClick(params: unknown) {
  const id = (params as { data?: { id?: number } }).data?.id
  if (id) emit('drill', id)
}
</script>
