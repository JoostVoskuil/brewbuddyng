import type { EChartsOption } from 'echarts'
import type { BrewMeasurement } from '~/types'

export function useTControlChart(
  measurements: Ref<BrewMeasurement[]> | ComputedRef<BrewMeasurement[]>,
) {
  const sorted = computed(() =>
    [...measurements.value].sort((a, b) => (a.datetime ?? '').localeCompare(b.datetime ?? '')),
  )

  const tControlRows = computed(() => sorted.value.filter((row) => row.seriesTag === 'tcontrol'))

  const option = computed<EChartsOption>(() => {
    const rows = sorted.value
    const labels = rows.map((row) => (row.datetime ? new Date(row.datetime).toLocaleString() : '—'))
    const fromNotes = (row: BrewMeasurement, key: string) => {
      const match = (row.notes ?? '').match(
        new RegExp(`${key}\\s*[:=]\\s*([0-9]+(?:\\.[0-9]+)?)`, 'i'),
      )
      return match ? Number(match[1]) : null
    }
    return {
      tooltip: { trigger: 'axis' },
      legend: { type: 'scroll', bottom: 0 },
      grid: { left: 48, right: 48, top: 24, bottom: 72 },
      xAxis: { type: 'category', data: labels, axisLabel: { rotate: 35, fontSize: 10 } },
      yAxis: [
        { type: 'value', name: 'SG / pH / cells' },
        { type: 'value', name: '°C' },
      ],
      series: [
        { name: 'SG', type: 'line', connectNulls: true, data: rows.map((r) => r.sg || null) },
        {
          name: 'Temp 1',
          type: 'line',
          yAxisIndex: 1,
          connectNulls: true,
          data: rows.map((r) => r.tempS1 || null),
        },
        {
          name: 'Temp 2',
          type: 'line',
          yAxisIndex: 1,
          connectNulls: true,
          data: rows.map((r) => r.tempS2 || null),
        },
        {
          name: 'TControl set',
          type: 'line',
          yAxisIndex: 1,
          connectNulls: true,
          data: rows.map((r) => (r.seriesTag === 'tcontrol' ? r.setTemp || null : null)),
        },
        { name: 'pH', type: 'line', connectNulls: true, data: rows.map((r) => fromNotes(r, 'pH')) },
        {
          name: 'Cells',
          type: 'line',
          connectNulls: true,
          data: rows.map((r) => fromNotes(r, 'cells')),
        },
      ],
    }
  })

  return { option, tControlRows, sorted }
}
