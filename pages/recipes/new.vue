<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('recipe.new') }}</h1>
    <form class="space-y-4" @submit.prevent="createRecipe">
      <div>
        <label class="text-sm font-medium">{{ $t('recipe.name') }}</label
        ><input
          v-model="form.name"
          required
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">{{ $t('recipe.type') }}</label>
          <select v-model="form.type" class="w-full mt-1 px-3 py-2 border rounded-md bg-background">
            <option value="All Grain">{{ $t('recipe.types.allGrain') }}</option>
            <option value="Extract">{{ $t('recipe.types.extract') }}</option>
            <option value="Partial Mash">{{ $t('recipe.types.partialMash') }}</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('recipe.efficiency') }} (%)</label
          ><input
            v-model.number="form.efficiency"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="text-sm font-medium">{{ $t('recipe.batchSize') }} (L)</label
          ><input
            v-model.number="form.batchSize"
            type="number"
            step="0.5"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('recipe.boilSize') }} (L)</label
          ><input
            v-model.number="form.boilSize"
            type="number"
            step="0.5"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('recipe.boilTime') }} (min)</label
          ><input
            v-model.number="form.boilTime"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <div class="flex gap-2 pt-2">
        <button
          type="submit"
          class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          {{ $t('common.save') }}
        </button>
        <NuxtLink to="/recipes" class="px-4 py-2 border rounded-md text-sm">{{
          $t('common.cancel')
        }}</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  name: '',
  type: 'All Grain',
  batchSize: 20,
  boilSize: 25,
  boilTime: 60,
  efficiency: 75,
})

async function createRecipe() {
  const result = await $fetch<{ id: number }>('/api/recipes', { method: 'POST', body: form.value })
  navigateTo(`/recipes/${result.id}`)
}
</script>
