<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold mb-6">{{ $t('tools.infusionCalculator') }}</h1>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">Current Mash Temp (°C)</label
          ><input
            v-model.number="form.currentTempC"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Target Mash Temp (°C)</label
          ><input
            v-model.number="form.targetTempC"
            type="number"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium">Grain Weight (kg)</label
          ><input
            v-model.number="form.grainWeightKg"
            type="number"
            step="0.1"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
        <div>
          <label class="text-sm font-medium">Current Water (L)</label
          ><input
            v-model.number="form.currentWaterL"
            type="number"
            step="0.5"
            class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
          />
        </div>
      </div>
      <div>
        <label class="text-sm font-medium">Infusion Water Temp (°C)</label
        ><input
          v-model.number="form.infusionWaterTempC"
          type="number"
          class="w-full mt-1 px-3 py-2 border rounded-md bg-background"
        />
      </div>
      <button
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        @click="calculate"
      >
        Calculate
      </button>
      <div v-if="result" class="border rounded-lg p-4 bg-muted/30 space-y-1">
        <p class="text-lg font-semibold">
          Add {{ result.liters }} L at {{ form.infusionWaterTempC }}°C
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  currentTempC: 52,
  targetTempC: 67,
  grainWeightKg: 5,
  currentWaterL: 15,
  infusionWaterTempC: 100,
})
const result = ref<{ liters: number } | null>(null)

async function calculate() {
  const url: string = '/api/calculations/infusion'
  result.value = await $fetch<{ liters: number }>(url, {
    method: 'POST',
    body: form.value,
  })
}
</script>
