<template>
  <div class="space-y-1">
    <div class="flex items-center justify-between gap-3 text-xs">
      <span class="font-medium">{{ label }}</span>
      <span class="font-mono text-muted-foreground">{{ formattedValue }}</span>
    </div>
    <div class="space-y-1">
      <div
        class="relative h-5 rounded bg-muted overflow-hidden border"
        :aria-label="`${label} style range`"
      >
        <div
          v-if="hasRange"
          class="absolute inset-y-1 rounded bg-green-500/35 dark:bg-green-400/30"
          :style="rangeStyle"
        ></div>
        <div
          v-if="hasRange"
          class="absolute inset-y-0 w-px bg-foreground/70"
          :style="midpointStyle"
        ></div>
      </div>
      <div
        class="relative h-5 rounded bg-muted overflow-hidden border"
        :aria-label="`${label} actual value`"
      >
        <div
          v-if="hasRange"
          class="absolute inset-y-1 rounded bg-green-500/15"
          :style="rangeStyle"
        ></div>
        <template v-if="clusterValues.length">
          <span
            v-for="(clusterValue, index) in clusterValues"
            :key="index"
            class="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-blue-500"
            :style="{ left: `${pct(clusterValue)}%` }"
          ></span>
        </template>
        <div
          v-if="hasRange && props.value != null"
          class="absolute top-0 -translate-x-1/2 text-sm leading-none"
          :class="statusClass"
          :style="markerStyle"
          aria-hidden="true"
        >
          ▼
        </div>
      </div>
    </div>
    <div class="flex justify-between text-[10px] font-mono text-muted-foreground">
      <span>{{ hasRange ? formatNumber(min) : '—' }}</span>
      <span>{{ $t(`styleAnalysis.${status}`) }}</span>
      <span>{{ hasRange ? formatNumber(max) : '—' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  min: number | null | undefined
  max: number | null | undefined
  value: number | null | undefined
  unit?: string
  values?: Array<number | null | undefined>
}>()

const hasRange = computed(
  () => props.min != null && props.max != null && Number(props.max) > Number(props.min),
)

const clusterValues = computed(() =>
  (props.values ?? []).filter((value): value is number => value != null && Number.isFinite(value)),
)

const status = computed<'withinRange' | 'nearRange' | 'outsideRange' | 'noRange'>(() => {
  if (!hasRange.value) return 'noRange'
  if (props.value == null) return 'noRange'
  const min = Number(props.min)
  const max = Number(props.max)
  if (props.value >= min && props.value <= max) return 'withinRange'
  const tolerance = (max - min) * 0.05
  return props.value >= min - tolerance && props.value <= max + tolerance
    ? 'nearRange'
    : 'outsideRange'
})

const statusClass = computed(
  () =>
    ({
      withinRange: 'text-green-600 dark:text-green-400',
      nearRange: 'text-amber-600 dark:text-amber-400',
      outsideRange: 'text-red-600 dark:text-red-400',
      noRange: 'text-muted-foreground',
    })[status.value],
)

const domain = computed(() => {
  const value = props.value ?? 0
  if (!hasRange.value) return { min: 0, max: Math.max(1, value) }
  const min = Number(props.min)
  const max = Number(props.max)
  const span = max - min
  return {
    min: Math.min(min, value, ...clusterValues.value, min - span * 0.25),
    max: Math.max(max, value, ...clusterValues.value, max + span * 0.25),
  }
})

function pct(n: number): number {
  const { min, max } = domain.value
  if (max <= min) return 0
  return Math.min(100, Math.max(0, ((n - min) / (max - min)) * 100))
}

const rangeStyle = computed(() => ({
  left: `${pct(Number(props.min))}%`,
  right: `${100 - pct(Number(props.max))}%`,
}))
const midpointStyle = computed(() => ({
  left: `${pct((Number(props.min) + Number(props.max)) / 2)}%`,
}))
const markerStyle = computed(() => ({ left: `${pct(props.value ?? 0)}%` }))

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  if (Math.abs(value) < 2 && value !== 0) return value.toFixed(3)
  if (Math.abs(value) < 10) return value.toFixed(1)
  return value.toFixed(0)
}

const formattedValue = computed(() => {
  const base = formatNumber(props.value)
  return props.unit ? `${base} ${props.unit}` : base
})
</script>
