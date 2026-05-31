<template>
  <div class="overflow-hidden rounded-lg border">
    <table class="w-full text-sm">
      <thead class="bg-muted">
        <tr>
          <th class="w-8 p-3"></th>
          <th class="p-3 text-left font-medium">{{ $t('styleAnalysis.category') }}</th>
          <th class="p-3 text-right font-medium">{{ $t('styleAnalysis.count') }}</th>
          <th class="p-3 text-left font-medium">OG</th>
          <th class="p-3 text-left font-medium">FG</th>
          <th class="p-3 text-left font-medium">ABV</th>
          <th class="p-3 text-left font-medium">IBU</th>
          <th class="p-3 text-left font-medium">EBC</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="group in groups" :key="group.key">
          <tr class="border-t hover:bg-muted/50">
            <td class="p-3">
              <button type="button" class="text-muted-foreground" @click="toggle(group.key)">
                {{ expanded[group.key] ? '▾' : '▸' }}
              </button>
            </td>
            <td class="p-3 font-medium">
              <div>{{ group.label }}</div>
              <div class="text-xs text-muted-foreground">{{ group.styles.join(', ') || '—' }}</div>
            </td>
            <td class="p-3 text-right tabular-nums">{{ group.items.length }}</td>
            <td class="p-3 min-w-40">
              <StyleRangeBar
                label="OG"
                :min="group.range.ogMin"
                :max="group.range.ogMax"
                :value="group.avg.og"
                :values="group.values.og"
              />
            </td>
            <td class="p-3 min-w-40">
              <StyleRangeBar
                label="FG"
                :min="group.range.fgMin"
                :max="group.range.fgMax"
                :value="group.avg.fg"
                :values="group.values.fg"
              />
            </td>
            <td class="p-3 min-w-40">
              <StyleRangeBar
                label="ABV"
                :min="group.range.abvMin"
                :max="group.range.abvMax"
                :value="group.avg.abv"
                :values="group.values.abv"
                unit="%"
              />
            </td>
            <td class="p-3 min-w-40">
              <StyleRangeBar
                label="IBU"
                :min="group.range.ibuMin"
                :max="group.range.ibuMax"
                :value="group.avg.ibu"
                :values="group.values.ibu"
              />
            </td>
            <td class="p-3 min-w-40">
              <StyleRangeBar
                label="EBC"
                :min="group.range.colorMin"
                :max="group.range.colorMax"
                :value="group.avg.color"
                :values="group.values.color"
              />
            </td>
          </tr>
          <tr v-if="expanded[group.key]" class="border-t bg-muted/20">
            <td></td>
            <td colspan="7" class="p-3">
              <div class="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                <NuxtLink
                  v-for="item in group.items"
                  :key="item.id"
                  :to="`${itemPath}/${item.id}`"
                  class="rounded border bg-background p-3 hover:bg-muted/60"
                >
                  <div class="font-medium">{{ item.name }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ item.code || '—' }} · {{ item.styleName || '—' }} · OG
                    {{ format(item.og, 3) }} · IBU {{ format(item.ibu, 0) }}
                  </div>
                  <div class="mt-3 grid gap-2">
                    <StyleRangeBar
                      label="OG"
                      :min="itemStyle(item)?.ogMin"
                      :max="itemStyle(item)?.ogMax"
                      :value="item.og"
                    />
                    <StyleRangeBar
                      label="IBU"
                      :min="itemStyle(item)?.ibuMin"
                      :max="itemStyle(item)?.ibuMax"
                      :value="item.ibu"
                    />
                  </div>
                </NuxtLink>
              </div>
            </td>
          </tr>
        </template>
        <tr v-if="groups.length === 0">
          <td colspan="8" class="p-6 text-center text-muted-foreground">
            {{ $t('styleAnalysis.noData') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { BeerStyle } from '~/types'

export interface StyleAnalysisItem {
  id: number
  name: string
  code?: string | null
  styleId?: number | null
  styleName?: string
  og?: number | null
  fg?: number | null
  abv?: number | null
  ibu?: number | null
  color?: number | null
}

const props = defineProps<{
  items: StyleAnalysisItem[]
  styles: BeerStyle[]
  itemPath: string
}>()

const expanded = ref<Record<string, boolean>>({})

const styleById = computed<Record<number, BeerStyle>>(() =>
  Object.fromEntries(props.styles.map((style) => [style.id, style])),
)

const groups = computed(() => {
  const map = new Map<string, StyleAnalysisItem[]>()
  for (const item of props.items) {
    const style = item.styleId == null ? undefined : styleById.value[item.styleId]
    const category = style?.category || item.styleName || '—'
    map.set(category, [...(map.get(category) ?? []), item])
  }

  return [...map.entries()]
    .map(([label, items]) => {
      const styles = [
        ...new Set(items.map((item) => item.styleName).filter(Boolean) as string[]),
      ].sort()
      const styleRows = items
        .map((item) => (item.styleId == null ? undefined : styleById.value[item.styleId]))
        .filter(Boolean) as BeerStyle[]
      return {
        key: label,
        label,
        items,
        styles,
        avg: {
          og: avg(items.map((item) => item.og)),
          fg: avg(items.map((item) => item.fg)),
          abv: avg(items.map((item) => item.abv)),
          ibu: avg(items.map((item) => item.ibu)),
          color: avg(items.map((item) => item.color)),
        },
        values: {
          og: numbers(items.map((item) => item.og)),
          fg: numbers(items.map((item) => item.fg)),
          abv: numbers(items.map((item) => item.abv)),
          ibu: numbers(items.map((item) => item.ibu)),
          color: numbers(items.map((item) => item.color)),
        },
        range: {
          ogMin: min(styleRows.map((style) => style.ogMin)),
          ogMax: max(styleRows.map((style) => style.ogMax)),
          fgMin: min(styleRows.map((style) => style.fgMin)),
          fgMax: max(styleRows.map((style) => style.fgMax)),
          abvMin: min(styleRows.map((style) => style.abvMin)),
          abvMax: max(styleRows.map((style) => style.abvMax)),
          ibuMin: min(styleRows.map((style) => style.ibuMin)),
          ibuMax: max(styleRows.map((style) => style.ibuMax)),
          colorMin: min(styleRows.map((style) => style.colorMin)),
          colorMax: max(styleRows.map((style) => style.colorMax)),
        },
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
})

function numbers(values: Array<number | null | undefined>) {
  return values.filter((value): value is number => value != null && Number.isFinite(value))
}

function avg(values: Array<number | null | undefined>) {
  const ns = numbers(values)
  if (!ns.length) return null
  return ns.reduce((sum, value) => sum + value, 0) / ns.length
}

function min(values: Array<number | null | undefined>) {
  const ns = numbers(values)
  return ns.length ? Math.min(...ns) : null
}

function max(values: Array<number | null | undefined>) {
  const ns = numbers(values)
  return ns.length ? Math.max(...ns) : null
}

function itemStyle(item: StyleAnalysisItem) {
  return item.styleId == null ? undefined : styleById.value[item.styleId]
}

function toggle(key: string) {
  expanded.value = { ...expanded.value, [key]: !expanded.value[key] }
}

function format(value: number | null | undefined, digits: number) {
  return value == null ? '—' : value.toFixed(digits)
}
</script>
