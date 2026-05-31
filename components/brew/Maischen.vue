<template>
  <section class="space-y-4">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="border rounded-lg p-4 space-y-3">
        <h3 class="font-semibold">{{ $t('brew.mash.start') }}</h3>
        <label class="text-sm text-muted-foreground block">
          {{ $t('brew.mash.startMash') }}
          <input
            v-model="startTime"
            type="datetime-local"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </label>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-2 border rounded-md text-sm"
            @click="startTime = nowLocal()"
          >
            {{ $t('brew.mash.startNow') }}
          </button>
          <button
            type="button"
            class="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            @click="save"
          >
            {{ $t('common.save') }}
          </button>
        </div>
      </div>

      <div class="border rounded-lg p-4 space-y-2">
        <h3 class="font-semibold">{{ $t('brew.mash.water') }}</h3>
        <div class="flex justify-between text-sm">
          <span>{{ $t('recipe.mashWaterTotal') }}</span
          ><span class="font-mono">{{ mashWater.toFixed(1) }} L</span>
        </div>
        <div class="flex justify-between text-sm">
          <span>{{ $t('recipe.spargeWater') }}</span
          ><span class="font-mono">{{ spargeWater.toFixed(1) }} L</span>
        </div>
        <div class="flex justify-between text-sm">
          <span>{{ $t('databases.spargeTemp') }}</span
          ><span class="font-mono">{{ recipe?.spargeTemp ?? 0 }} °C</span>
        </div>
      </div>

      <div class="border rounded-lg p-4 space-y-2">
        <h3 class="font-semibold">{{ $t('brew.overview') }}</h3>
        <div class="flex justify-between text-sm">
          <span>{{ $t('recipe.batchSize') }}</span
          ><span class="font-mono">{{ recipe?.batchSize ?? 0 }} L</span>
        </div>
        <div class="flex justify-between text-sm">
          <span>{{ $t('recipe.boilSize') }}</span
          ><span class="font-mono">{{ recipe?.boilSize ?? 0 }} L</span>
        </div>
        <div class="flex justify-between text-sm">
          <span>{{ $t('recipe.boilTime') }}</span
          ><span class="font-mono">{{ recipe?.boilTime ?? 0 }} min</span>
        </div>
      </div>
    </div>

    <div class="border rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted text-muted-foreground">
          <tr>
            <th class="text-left p-2">{{ $t('databases.steps') }}</th>
            <th class="text-left p-2">{{ $t('databases.stepType') }}</th>
            <th class="text-right p-2">{{ $t('databases.stepTemp') }}</th>
            <th class="text-right p-2">{{ $t('databases.stepTime') }}</th>
            <th class="text-right p-2">{{ $t('databases.infuseAmount') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="step in recipe?.mashSteps ?? []" :key="step.id" class="border-t">
            <td class="p-2">{{ step.name }}</td>
            <td class="p-2">{{ step.type }}</td>
            <td class="p-2 text-right font-mono">{{ step.stepTemp }} °C</td>
            <td class="p-2 text-right font-mono">{{ step.stepTime }} min</td>
            <td class="p-2 text-right font-mono">{{ step.infuseAmount ?? 0 }} L</td>
          </tr>
          <tr v-if="!recipe?.mashSteps?.length">
            <td colspan="5" class="p-4 text-muted-foreground">{{ $t('recipe.noMashSteps') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Brew, RecipeWithIngredients } from '~/types'

const props = defineProps<{ brew: Brew; recipe: RecipeWithIngredients | null }>()
const emit = defineEmits<{ save: [patch: Partial<Brew>] }>()

const startTime = ref(toLocalInput(props.brew.startTime))

watch(
  () => props.brew.startTime,
  (value) => {
    startTime.value = toLocalInput(value)
  },
)

const mashWater = computed(() =>
  (props.recipe?.mashSteps ?? []).reduce((sum, step) => sum + (step.infuseAmount ?? 0), 0),
)
const spargeWater = computed(() => Math.max(0, (props.recipe?.boilSize ?? 0) - mashWater.value))

function toLocalInput(value: string | null | undefined) {
  return value ? value.slice(0, 16) : ''
}

function nowLocal() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function save() {
  emit('save', { startTime: startTime.value ? new Date(startTime.value).toISOString() : '' })
}
</script>
