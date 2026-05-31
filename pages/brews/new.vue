<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('brew.new') }}</h1>
    <form class="space-y-4" @submit.prevent="createBrew">
      <div>
        <label class="text-sm font-medium">{{ $t('common.name') }}</label
        ><input
          v-model="form.name"
          required
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div>
        <label class="text-sm font-medium">{{ $t('brew.recipe') }}</label>
        <select
          v-model="form.recipeId"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          @change="onRecipeChange"
        >
          <option :value="null">{{ $t('brew.noRecipe') }}</option>
          <option v-for="r in recipesList" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">{{ $t('brew.date') }}</label
          ><input
            v-model="form.brewDate"
            type="date"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('brew.status') }}</label>
          <select
            v-model="form.status"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          >
            <option value="planned">{{ $t('brew.statuses.planned') }}</option>
            <option value="brewing">{{ $t('brew.statuses.brewing') }}</option>
            <option value="fermenting">{{ $t('brew.statuses.fermenting') }}</option>
            <option value="conditioning">{{ $t('brew.statuses.conditioning') }}</option>
            <option value="completed">{{ $t('brew.statuses.completed') }}</option>
          </select>
        </div>
      </div>
      <div class="flex gap-2 pt-2">
        <button
          type="submit"
          class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          {{ $t('common.save') }}
        </button>
        <NuxtLink to="/brews" class="px-4 py-2 border rounded-md text-sm">{{
          $t('common.cancel')
        }}</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Recipe } from '~/types'

const recipesList = ref<Recipe[]>([])

const form = ref({
  name: '',
  recipeId: null as number | null,
  brewDate: new Date().toISOString().slice(0, 10),
  status: 'planned',
})

function onRecipeChange() {
  if (form.value.recipeId && !form.value.name) {
    const recipe = recipesList.value.find((r) => r.id === form.value.recipeId)
    if (recipe) form.value.name = recipe.name
  }
}

async function createBrew() {
  const result = await $fetch<{ id: number }>('/api/brews', {
    method: 'POST',
    body: form.value,
  })
  navigateTo(`/brews/${result.id}`)
}

onMounted(async () => {
  recipesList.value = await $fetch<Recipe[]>('/api/recipes')
})
</script>
