<script setup lang="ts">
/**
 * Coloured stock-state dot rendered in recipe / brew list rows.
 * Mirrors BrouwHulp's coloured row icons:
 *   - green   = all ingredients in stock (or always-on-stock)
 *   - yellow  = at least one ingredient is short
 *   - red     = at least one ingredient has zero stock
 *   - unknown = no ingredient links to evaluate (empty recipe shell)
 */
import type { StockState } from '~/types'

const props = defineProps<{ state: StockState | null | undefined }>()

const { t } = useI18n()

const cls = computed(() => {
  switch (props.state) {
    case 'green':
      return 'bg-green-500'
    case 'yellow':
      return 'bg-yellow-400'
    case 'red':
      return 'bg-red-500'
    default:
      return 'bg-muted-foreground/30'
  }
})

const label = computed(() => {
  switch (props.state) {
    case 'green':
      return t('stock.green')
    case 'yellow':
      return t('stock.yellow')
    case 'red':
      return t('stock.red')
    default:
      return t('stock.unknown')
  }
})
</script>

<template>
  <span
    :class="['inline-block w-2.5 h-2.5 rounded-full align-middle', cls]"
    :title="label"
    :aria-label="label"
  />
</template>
