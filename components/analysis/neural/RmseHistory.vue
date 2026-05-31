<script setup lang="ts">
const props = defineProps<{
  history: Array<{ epoch: number; rmse: number }>
}>()

const best = computed(() =>
  props.history.reduce((min, point) => Math.min(min, point.rmse), Number.POSITIVE_INFINITY),
)
const current = computed(() => props.history.at(-1))
</script>

<template>
  <div class="grid gap-2 text-sm sm:grid-cols-2">
    <div class="rounded border p-2">
      <div class="text-xs text-muted-foreground">{{ $t('analysis.neural.currentEpoch') }}</div>
      <div class="font-mono font-semibold">{{ current?.epoch ?? '—' }}</div>
    </div>
    <div class="rounded border p-2">
      <div class="text-xs text-muted-foreground">{{ $t('analysis.neural.bestRmse') }}</div>
      <div class="font-mono font-semibold">{{ Number.isFinite(best) ? best.toFixed(5) : '—' }}</div>
    </div>
  </div>
</template>
