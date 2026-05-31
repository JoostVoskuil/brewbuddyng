<template>
  <section class="space-y-4">
    <div v-if="recipe" class="grid grid-cols-2 md:grid-cols-6 gap-3">
      <div v-for="metric in metrics" :key="metric.label" class="border rounded-lg p-3">
        <div class="text-xs text-muted-foreground">{{ metric.label }}</div>
        <div class="font-semibold">{{ metric.value }}</div>
      </div>
    </div>

    <div v-if="recipe" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="border rounded-lg p-4 space-y-2">
        <h3 class="font-semibold">{{ $t('recipe.fermentables') }}</h3>
        <div v-for="row in recipe.fermentables" :key="row.id" class="flex justify-between text-sm">
          <span>{{ row.name }}</span>
          <span class="font-mono">{{ formatKg(row.amount) }}</span>
        </div>
        <p v-if="!recipe.fermentables.length" class="text-sm text-muted-foreground">—</p>
      </div>

      <div class="border rounded-lg p-4 space-y-2">
        <h3 class="font-semibold">{{ $t('recipe.hops') }}</h3>
        <div v-for="row in recipe.hops" :key="row.id" class="flex justify-between text-sm">
          <span>{{ row.name }} · {{ row.use }} · {{ row.time }} min</span>
          <span class="font-mono">{{ formatG(row.amount) }}</span>
        </div>
        <p v-if="!recipe.hops.length" class="text-sm text-muted-foreground">—</p>
      </div>

      <div class="border rounded-lg p-4 space-y-2">
        <h3 class="font-semibold">{{ $t('recipe.yeasts') }}</h3>
        <div v-for="row in recipe.yeasts" :key="row.id" class="flex justify-between text-sm">
          <span>{{ row.name }}</span>
          <span class="font-mono">{{ row.amount ?? 0 }}</span>
        </div>
        <p v-if="!recipe.yeasts.length" class="text-sm text-muted-foreground">—</p>
      </div>

      <div class="border rounded-lg p-4 space-y-2">
        <h3 class="font-semibold">{{ $t('recipe.miscs') }}</h3>
        <div v-for="row in recipe.miscs" :key="row.id" class="flex justify-between text-sm">
          <span>{{ row.name }} · {{ row.use }}</span>
          <span class="font-mono">{{ row.amount ?? 0 }}</span>
        </div>
        <p v-if="!recipe.miscs.length" class="text-sm text-muted-foreground">—</p>
      </div>
    </div>

    <div v-else class="border rounded-lg p-4 text-sm text-muted-foreground">
      {{ $t('brew.noRecipe') }}
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RecipeWithIngredients } from '~/types'

const props = defineProps<{
  recipe: RecipeWithIngredients | null
  styleName: string
}>()

function formatKg(value: number | null | undefined) {
  return `${(value ?? 0).toFixed(3)} kg`
}

function formatG(value: number | null | undefined) {
  return `${((value ?? 0) * 1000).toFixed(0)} g`
}

const metrics = computed(() => {
  const recipe = props.recipe
  if (!recipe) return []
  return [
    { label: 'Style', value: props.styleName || '—' },
    { label: 'OG', value: (recipe.og ?? 0).toFixed(3) },
    { label: 'FG', value: (recipe.fg ?? 0).toFixed(3) },
    { label: 'ABV', value: `${(recipe.abv ?? 0).toFixed(1)}%` },
    { label: 'IBU', value: (recipe.ibu ?? 0).toFixed(0) },
    { label: 'EBC', value: (recipe.color ?? 0).toFixed(0) },
  ]
})
</script>
