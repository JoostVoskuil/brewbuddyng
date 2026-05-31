<template>
  <section class="space-y-4">
    <div class="border rounded-lg p-4 space-y-3">
      <div class="flex justify-between items-center"><h3 class="font-semibold">{{ $t('brew.tabs.metingen.title') }}</h3><span class="text-sm text-muted-foreground">{{ measurements.length }} {{ $t('brew.measurements').toLowerCase() }}</span></div>
      <BaseChart :option="option" height="420px" />
    </div>
    <div class="border rounded-lg p-4 overflow-x-auto">
      <table class="w-full text-sm"><thead class="bg-muted text-muted-foreground"><tr><th class="text-left p-2">{{ $t('common.date') }}</th><th class="text-right p-2">SG</th><th class="text-right p-2">T1</th><th class="text-right p-2">T2</th><th class="text-right p-2">Set</th><th class="text-left p-2">TControl</th><th class="text-left p-2">{{ $t('common.notes') }}</th></tr></thead><tbody><tr v-for="row in sorted" :key="row.id" class="border-t"><td class="p-2">{{ formatDate(row.datetime) }}</td><td class="p-2 text-right font-mono">{{ row.sg || '—' }}</td><td class="p-2 text-right font-mono">{{ row.tempS1 || '—' }}</td><td class="p-2 text-right font-mono">{{ row.tempS2 || '—' }}</td><td class="p-2 text-right font-mono">{{ row.setTemp || '—' }}</td><td class="p-2">{{ row.seriesTag === 'tcontrol' ? '✓' : '—' }}</td><td class="p-2">{{ row.notes }}</td></tr></tbody></table>
    </div>
  </section>
</template>
<script setup lang="ts">
import type { BrewMeasurement } from '~/types'
import { useTControlChart } from '~/composables/useTControlChart'
const props = defineProps<{ measurements: BrewMeasurement[] }>()
const source = computed(() => props.measurements)
const { option, sorted } = useTControlChart(source)
function formatDate(value: string | null | undefined) { return value ? new Date(value).toLocaleString() : '—' }
</script>
